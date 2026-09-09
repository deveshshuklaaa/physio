#!/usr/bin/env python3
"""
extract_landmarks.py — E1 + E2 (Phase E, offline ML pipeline)

Reuse note: the frame-loop, floor/surface estimation, and the "never discard
a landmark permanently" philosophy are ported near-verbatim from
/home/billa-dakait/Desktop/test/code/extract_landmarks.py (the file that
actually produced the real training parquets under test/code/train-data/).
See docs/06_ml_pipeline.md for the full reuse table.

A DIFFERENT, real (non-stub) prior attempt existed at this same path
(backend/ml/extract_landmarks.py) before this port. It targeted the LIVE
pipeline's style: JSON output keyed by landmark name, `DETECTION_SCALE`
downscaling, EMA smoothing applied in place, and low-visibility landmarks
dropped outright. That version was not used as the base here because the
real training dataset (test/code/train-data/*.parquet, 164 clips) was built
against the OTHER lineage: full-resolution Heavy inference, all 33 landmarks
always emitted (raw, never discarded), Parquet output. Porting the JSON/live
variant would have made it impossible to reproduce the existing labeled
dataset. See docs/06_ml_pipeline.md "Reuse table" for both files' fates.

D4 smoothing: the legacy live pipeline's smoother.py is a plain per-
coordinate EMA (alpha=0.25, config.EMA_ALPHA), seeded fresh on first sight of
a landmark, states not shared across landmark names, reset per video/session.
That same EMA is applied here too -- but as ADDITIONAL `lmX_*_smooth`
columns, not a replacement of the raw columns. Raw stays raw (matches this
file's own "never discard, never mutate raw" convention, D4's own
seed-per-reappearance behavior, and does not retroactively change the
already-computed real train-data/ numbers this notes file reports against).
Downstream common_features.py still reads the raw lmX_x/y/z columns, exactly
as the ported common_feature_extractor.py did. Using the smoothed columns
instead is a live decision for a later retrain, not made here.

E2: video-level parallelism via ProcessPoolExecutor (one process per clip --
MediaPipe is single-threaded per stream, so threading inside a clip would
only add contention, never speed). Resume: a clip whose output parquet
already exists is skipped without opening the video.
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import pandas as pd

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - tqdm is a light, common dependency
    def tqdm(iterable, **kwargs):
        return iterable


VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}

NUM_LANDMARKS = 33

# ---------------------------------------------------------------------------
# FOOT / FLOOR CONFIGURATION (ported verbatim from test/code/extract_landmarks.py)
# ---------------------------------------------------------------------------

FOOT_LANDMARKS = {
    "left_heel": 29,
    "right_heel": 30,
    "left_foot_index": 31,
    "right_foot_index": 32,
    "left_ankle": 27,
    "right_ankle": 28,
}

FLOOR_REFERENCE_LANDMARKS = ["left_heel", "right_heel"]

FLOOR_CONFIDENCE_MIN_SAMPLES = 5
FLOOR_CONFIDENCE_MIN_VISIBILITY = 0.5
HEEL_LIFT_THRESHOLD_NORM = 0.03
HEEL_LIFT_MIN_CONSECUTIVE_FRAMES = 3
FLOOR_PLATEAU_MIN_RUN_FRAMES = 4
FLOOR_PLATEAU_TOLERANCE_NORM = 0.015
FLOOR_PLATEAU_BOTTOM_FRACTION = 0.20

# D4: legacy live smoother.py constants (backend/_old_physio_reference/config.py).
# Reused here for the additional *_smooth columns described in the module
# docstring. Not applied to any other computation in this file.
EMA_ALPHA = 0.25
VISIBILITY_THRESH = 0.6


# ---------------------------------------------------------------------------
# FLOOR ESTIMATION (verbatim port)
# ---------------------------------------------------------------------------

def find_longest_stable_run(values, tolerance):
    if not values:
        return None, None, None
    best_start = 0
    best_end = 0
    best_len = 1
    start = 0
    for i in range(1, len(values) + 1):
        if i < len(values) and abs(values[i] - values[start]) <= tolerance:
            continue
        run_len = i - start
        if run_len > best_len:
            best_len = run_len
            best_start = start
            best_end = i - 1
        start = i
    run_values = values[best_start:best_end + 1]
    run_mean = sum(run_values) / len(run_values)
    return best_start, best_end, run_mean


def estimate_floor_y(rows, landmark_name):
    landmark_id = FOOT_LANDMARKS[landmark_name]
    y_key = f"lm{landmark_id}_y"
    visibility_key = f"lm{landmark_id}_visibility"

    timed_candidates = []
    for row in rows:
        if row.get("person_id", -1) == -1:
            continue
        y_value = row.get(y_key)
        visibility = row.get(visibility_key)
        if y_value is None or visibility is None:
            continue
        if visibility < FLOOR_CONFIDENCE_MIN_VISIBILITY:
            continue
        timed_candidates.append(float(y_value))

    num_samples = len(timed_candidates)
    if num_samples == 0:
        return None, "low", 0

    sorted_ys = sorted(timed_candidates)
    bottom_count = max(1, int(len(sorted_ys) * FLOOR_PLATEAU_BOTTOM_FRACTION))
    bottom_threshold = sorted_ys[-bottom_count]
    bottom_slice_in_time_order = [y for y in timed_candidates if y >= bottom_threshold]

    start, end, run_mean = find_longest_stable_run(
        bottom_slice_in_time_order, FLOOR_PLATEAU_TOLERANCE_NORM
    )
    if run_mean is None:
        return None, "low", num_samples

    run_length = end - start + 1
    has_plateau = run_length >= FLOOR_PLATEAU_MIN_RUN_FRAMES
    has_enough_samples = num_samples >= FLOOR_CONFIDENCE_MIN_SAMPLES
    confidence = "high" if (has_plateau and has_enough_samples) else "low"
    return run_mean, confidence, num_samples


def estimate_clip_floor(rows, manual_override=None):
    manual_override = manual_override or {}
    floor_estimates = {}
    for landmark_name in FLOOR_REFERENCE_LANDMARKS:
        if landmark_name in manual_override:
            floor_estimates[landmark_name] = {
                "floor_y": float(manual_override[landmark_name]),
                "confidence": "manual",
                "source": "manual_override",
                "num_samples": None,
            }
            continue
        floor_y, confidence, num_samples = estimate_floor_y(rows, landmark_name)
        floor_estimates[landmark_name] = {
            "floor_y": floor_y,
            "confidence": confidence,
            "source": "automatic_plateau",
            "num_samples": num_samples,
        }
    return floor_estimates


def add_floor_relative_columns(rows, floor_estimates):
    for row in rows:
        if row.get("person_id", -1) == -1:
            continue
        for landmark_name in FLOOR_REFERENCE_LANDMARKS:
            landmark_id = FOOT_LANDMARKS[landmark_name]
            y_key = f"lm{landmark_id}_y"
            floor_y_key = f"lm{landmark_id}_floor_y"
            height_key = f"lm{landmark_id}_height_above_floor"
            confidence_key = f"lm{landmark_id}_floor_confidence"

            estimate = floor_estimates[landmark_name]
            floor_y = estimate["floor_y"]
            landmark_y = row.get(y_key)

            row[floor_y_key] = floor_y
            row[confidence_key] = estimate["confidence"]

            if floor_y is None or landmark_y is None:
                row[height_key] = None
                continue

            height_above_floor = floor_y - landmark_y
            row[height_key] = height_above_floor

            side = "left" if "left" in landmark_name else "right"
            raw_flag_key = f"heel_lifting_flag_{side}"
            row[raw_flag_key] = height_above_floor > HEEL_LIFT_THRESHOLD_NORM

    for side in ("left", "right"):
        raw_key = f"heel_lifting_flag_{side}"
        confirmed_key = f"heel_lifting_confirmed_flag_{side}"
        consecutive = 0
        for row in rows:
            if row.get("person_id", -1) == -1:
                row[confirmed_key] = False
                consecutive = 0
                continue
            raw_flag = row.get(raw_key)
            consecutive = consecutive + 1 if raw_flag is True else 0
            row[confirmed_key] = consecutive >= HEEL_LIFT_MIN_CONSECUTIVE_FRAMES

    return rows


def load_manual_overrides(override_json_path, video_path, input_root):
    if override_json_path is None:
        return {}
    if not override_json_path.is_file():
        return {}
    with open(override_json_path, "r", encoding="utf-8") as f:
        overrides = json.load(f)
    try:
        relative_key = str(video_path.relative_to(input_root))
    except ValueError:
        relative_key = video_path.name
    return overrides.get(relative_key, {})


def add_empty_landmark_columns(row):
    for landmark_id in range(NUM_LANDMARKS):
        row.setdefault(f"lm{landmark_id}_x", None)
        row.setdefault(f"lm{landmark_id}_y", None)
        row.setdefault(f"lm{landmark_id}_z", None)
        row.setdefault(f"lm{landmark_id}_visibility", None)
        row.setdefault(f"lm{landmark_id}_presence", None)
    return row


def _ema_smoothed_columns(rows):
    """
    D4 improvement (see module docstring): additional lmX_{x,y,z}_smooth
    columns, plain per-coordinate EMA, alpha=EMA_ALPHA, seeded fresh on first
    sight of each landmark id and reset whenever the landmark drops below
    VISIBILITY_THRESH (matching smoother.py's "skip low-visibility, fresh
    seed on reappearance" behavior -- build_pts() there simply never calls
    smooth_landmark for a low-visibility frame). State is per-video (this
    function receives one video's rows only) -- required for correctness
    under ProcessPoolExecutor, where a module-global dict would leak state
    across clips run in the same worker process.
    """
    state = {}  # landmark_id -> [x, y, z]
    for row in rows:
        if row.get("person_id", -1) == -1:
            for lid in range(NUM_LANDMARKS):
                row[f"lm{lid}_x_smooth"] = None
                row[f"lm{lid}_y_smooth"] = None
                row[f"lm{lid}_z_smooth"] = None
            continue
        for lid in range(NUM_LANDMARKS):
            vis = row.get(f"lm{lid}_visibility")
            x, y, z = row.get(f"lm{lid}_x"), row.get(f"lm{lid}_y"), row.get(f"lm{lid}_z")
            if vis is None or vis < VISIBILITY_THRESH or x is None:
                row[f"lm{lid}_x_smooth"] = None
                row[f"lm{lid}_y_smooth"] = None
                row[f"lm{lid}_z_smooth"] = None
                state.pop(lid, None)
                continue
            new = [x, y, z]
            if lid not in state:
                state[lid] = new[:]
            else:
                s = state[lid]
                state[lid] = [EMA_ALPHA * n + (1.0 - EMA_ALPHA) * s[i] for i, n in enumerate(new)]
            row[f"lm{lid}_x_smooth"], row[f"lm{lid}_y_smooth"], row[f"lm{lid}_z_smooth"] = state[lid]
    return rows


def process_video(video_path: Path, output_path: Path, landmarker, manual_override=None) -> bool:
    """Process exactly one video. One video = one fresh MediaPipe VIDEO session
    (timestamps/tracking state must never leak between clips)."""
    import cv2
    import mediapipe as mp

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[ERROR] Could not open: {video_path}")
        return False

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        fps = 30.0

    frame_number = 0
    previous_timestamp_ms = -1
    rows = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        timestamp_ms = int((frame_number / fps) * 1000)
        if timestamp_ms <= previous_timestamp_ms:
            timestamp_ms = previous_timestamp_ms + 1
        previous_timestamp_ms = timestamp_ms

        try:
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
        except Exception as e:
            print(f"[ERROR] Frame {frame_number} failed in {video_path}: {e}")
            row = {"frame": frame_number, "timestamp_ms": timestamp_ms, "person_id": -1, "mediapipe_error": True}
            row = add_empty_landmark_columns(row)
            rows.append(row)
            frame_number += 1
            continue

        if result.pose_landmarks:
            for person_id, landmarks in enumerate(result.pose_landmarks):
                row = {"frame": frame_number, "timestamp_ms": timestamp_ms, "person_id": person_id, "mediapipe_error": False}
                for landmark_id, landmark in enumerate(landmarks):
                    row[f"lm{landmark_id}_x"] = float(landmark.x)
                    row[f"lm{landmark_id}_y"] = float(landmark.y)
                    row[f"lm{landmark_id}_z"] = float(landmark.z)
                    row[f"lm{landmark_id}_visibility"] = float(landmark.visibility)
                    row[f"lm{landmark_id}_presence"] = float(landmark.presence)
                row = add_empty_landmark_columns(row)
                rows.append(row)
        else:
            row = {"frame": frame_number, "timestamp_ms": timestamp_ms, "person_id": -1, "mediapipe_error": False}
            row = add_empty_landmark_columns(row)
            rows.append(row)

        frame_number += 1

    cap.release()

    if not rows:
        print(f"[WARNING] No frames processed: {video_path}")
        return False

    floor_estimates = estimate_clip_floor(rows, manual_override)
    rows = add_floor_relative_columns(rows, floor_estimates)
    rows = _ema_smoothed_columns(rows)

    for landmark_name, estimate in floor_estimates.items():
        print(f"    floor[{landmark_name}]: y={estimate['floor_y']} confidence={estimate['confidence']} "
              f"source={estimate['source']} samples={estimate['num_samples']}")
        if estimate["confidence"] == "low":
            print(f"    [WARNING] Low-confidence floor estimate for {landmark_name}.")

    dataframe = pd.DataFrame(rows)

    fieldnames = ["frame", "timestamp_ms", "person_id", "mediapipe_error"]
    for i in range(NUM_LANDMARKS):
        fieldnames.extend([f"lm{i}_x", f"lm{i}_y", f"lm{i}_z", f"lm{i}_visibility", f"lm{i}_presence"])
    for i in range(NUM_LANDMARKS):
        fieldnames.extend([f"lm{i}_x_smooth", f"lm{i}_y_smooth", f"lm{i}_z_smooth"])
    for landmark_name in FLOOR_REFERENCE_LANDMARKS:
        landmark_id = FOOT_LANDMARKS[landmark_name]
        fieldnames.extend([f"lm{landmark_id}_floor_y", f"lm{landmark_id}_height_above_floor", f"lm{landmark_id}_floor_confidence"])
    fieldnames.extend([
        "heel_lifting_flag_left", "heel_lifting_flag_right",
        "heel_lifting_confirmed_flag_left", "heel_lifting_confirmed_flag_right",
    ])

    for column in fieldnames:
        if column not in dataframe.columns:
            dataframe[column] = None
    dataframe = dataframe[fieldnames]

    dataframe["frame"] = dataframe["frame"].astype("int64")
    dataframe["timestamp_ms"] = dataframe["timestamp_ms"].astype("int64")
    dataframe["person_id"] = dataframe["person_id"].astype("int64")
    dataframe["mediapipe_error"] = dataframe["mediapipe_error"].fillna(False).astype(bool)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    dataframe.to_parquet(output_path, index=False, engine="pyarrow")

    detected_frames = int((dataframe["person_id"] != -1).sum())
    print(f"[OK] {video_path} -> {output_path} ({frame_number} frames, {detected_frames} detected)")
    return True


def _worker(args):
    """Top-level function (picklable) run in a subprocess. Creates its own
    fresh PoseLandmarker -- MediaPipe objects are not fork/pickle-safe, so
    each worker process must build its own."""
    video_path_str, output_path_str, model_path_str, override_json_str = args
    video_path = Path(video_path_str)
    output_path = Path(output_path_str)

    if output_path.exists():
        return (str(video_path), "skipped_resume")

    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=model_path_str),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    override_json = Path(override_json_str) if override_json_str else None
    manual_override = load_manual_overrides(override_json, video_path, video_path.parent)

    try:
        with mp_vision.PoseLandmarker.create_from_options(opts) as landmarker:
            ok = process_video(video_path, output_path, landmarker, manual_override)
        return (str(video_path), "done" if ok else "failed")
    except Exception as e:  # noqa: BLE001 - a single clip's exception must not kill the pool
        return (str(video_path), f"error: {e}")


def find_videos(input_root: Path):
    return sorted(
        (p for p in input_root.rglob("*") if p.is_file() and p.suffix.lower() in VIDEO_EXTENSIONS),
        key=lambda p: str(p.relative_to(input_root)).lower(),
    )


def batch_extract(input_root: Path, output_root: Path, model_path: Path, max_workers: int, override_json: Path = None):
    """E2: ProcessPoolExecutor batch runner, one process per clip, resume by
    skipping clips whose output parquet already exists."""
    videos = find_videos(input_root)
    if not videos:
        print("No videos found.")
        return []

    jobs = []
    for v in videos:
        rel = v.relative_to(input_root)
        out_dir = output_root / rel.parent
        out_path = out_dir / f"{v.stem}.parquet"
        jobs.append((str(v), str(out_path), str(model_path), str(override_json) if override_json else ""))

    results = []
    with ProcessPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_worker, job): job for job in jobs}
        for fut in tqdm(as_completed(futures), total=len(futures), desc="extracting"):
            results.append(fut.result())

    done = sum(1 for _, s in results if s == "done")
    skipped = sum(1 for _, s in results if s == "skipped_resume")
    failed = [r for r in results if r[1] not in ("done", "skipped_resume")]
    print(f"\n{'='*60}\nBATCH COMPLETE: {done} done, {skipped} skipped (resume), {len(failed)} failed / {len(videos)} total")
    for path, status in failed:
        print(f"  FAILED: {path} -> {status}")
    return results


def main():
    parser = argparse.ArgumentParser(description="E1/E2: extract MediaPipe Heavy landmarks per video, batch + resume.")
    sub = parser.add_subparsers(dest="mode", required=True)

    one = sub.add_parser("single", help="process exactly one video")
    one.add_argument("input", type=Path)
    one.add_argument("output", type=Path, help="output directory")
    one.add_argument("--model", type=Path, required=True)
    one.add_argument("--floor-override-json", type=Path, default=None)

    batch = sub.add_parser("batch", help="process every video under a directory tree, in parallel, with resume")
    batch.add_argument("input", type=Path)
    batch.add_argument("output", type=Path)
    batch.add_argument("--model", type=Path, required=True)
    batch.add_argument("--workers", type=int, default=4)
    batch.add_argument("--floor-override-json", type=Path, default=None)

    args = parser.parse_args()

    if not args.model.is_file():
        print(f"Error: model does not exist: {args.model}")
        sys.exit(1)

    if args.mode == "single":
        if not args.input.is_file():
            print(f"Error: input video does not exist: {args.input}")
            sys.exit(1)
        status = _worker((str(args.input), str(args.output / f"{args.input.stem}.parquet"), str(args.model),
                           str(args.floor_override_json) if args.floor_override_json else ""))
        print(status)
        if status[1] not in ("done", "skipped_resume"):
            sys.exit(1)
    else:
        if not args.input.is_dir():
            print(f"Error: input directory does not exist: {args.input}")
            sys.exit(1)
        batch_extract(args.input, args.output, args.model, args.workers, args.floor_override_json)


if __name__ == "__main__":
    main()

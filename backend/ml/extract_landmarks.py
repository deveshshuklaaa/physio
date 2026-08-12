# ╔══════════════════════════════════════════════════════════════════╗
# ║  extract_landmarks.py — Offline landmark extraction from video  ║
# ║  Reuses exact same logic as live pipeline: MediaPipe + EMA      ║
# ║  smoothing + visibility filtering. Outputs per-frame landmarks.  ║
# ╚══════════════════════════════════════════════════════════════════╝

import sys
import os
import json
import cv2
import numpy as np

# Add project root to path for config, landmarks, smoother
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OLD_PHYSIO = os.path.join(PROJECT_ROOT, "backend", "_old_physio_reference")
sys.path.insert(0, OLD_PHYSIO)

from config import (
    MODEL_PATH, DETECTION_SCALE, EMA_ALPHA, VISIBILITY_THRESH
)
from landmarks import LM
from smoother import smooth_landmark, reset_smoother

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
except ImportError:
    print("Run: pip install mediapipe opencv-python numpy")
    sys.exit(1)


def extract_landmarks_from_video(video_path: str, output_path: str = None) -> list:
    """
    Extract MediaPipe pose landmarks from a video file.

    Args:
        video_path: Path to input video file
        output_path: Optional path to save JSON output

    Returns:
        List of frame data dicts:
        [
            {
                "frame_idx": int,
                "timestamp_ms": int,
                "landmarks": {
                    "landmark_name": {"x": float, "y": float, "z": float, "visibility": float},
                    ...
                }
            },
            ...
        ]
    """
    if not os.path.exists(MODEL_PATH):
        print(f"Model file not found: {MODEL_PATH}")
        print("Download from:")
        print('  curl -o pose_landmarker.task "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker/float16/latest/pose_landmarker.task"')
        sys.exit(1)

    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}")
        sys.exit(1)

    # Reset smoother state for fresh extraction
    reset_smoother()

    # MediaPipe PoseLandmarker in VIDEO mode
    opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
        output_segmentation_masks=False,
    )
    landmarker = mp_vision.PoseLandmarker.create_from_options(opts)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Could not open video: {video_path}")
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"Video: {width}x{height} @ {fps:.1f} FPS, {total_frames} frames")
    print(f"Detection scale: {DETECTION_SCALE}")
    print(f"EMA alpha: {EMA_ALPHA}, Visibility thresh: {VISIBILITY_THRESH}")

    frame_data = []
    frame_idx = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]

        # Downscale for detection (same as live)
        det_w = int(w * DETECTION_SCALE)
        det_h = int(h * DETECTION_SCALE)
        small = cv2.resize(frame, (det_w, det_h))
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

        # Timestamp in milliseconds for VIDEO mode
        timestamp_ms = int(frame_idx * (1000.0 / fps)) if fps > 0 else frame_idx * 33

        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = landmarker.detect_for_video(mp_img, timestamp_ms)

        landmarks_dict = {}
        if result.pose_landmarks:
            lms = result.pose_landmarks[0]

            # Build landmarks with EMA smoothing + visibility filter
            # (Replicates math_utils.build_pts logic but keeps normalized coords)
            for name, idx in LM.items():
                lm = lms[idx]
                if lm.visibility < VISIBILITY_THRESH:
                    continue

                # Apply EMA smoothing (same as live pipeline)
                sx, sy, sz = smooth_landmark(name, lm)

                landmarks_dict[name] = {
                    "x": float(sx),
                    "y": float(sy),
                    "z": float(sz),
                    "visibility": float(lm.visibility)
                }

        frame_data.append({
            "frame_idx": frame_idx,
            "timestamp_ms": timestamp_ms,
            "landmarks": landmarks_dict
        })

        frame_idx += 1
        if frame_idx % 30 == 0:
            print(f"  Processed {frame_idx}/{total_frames} frames...")

    cap.release()
    landmarker.close()

    print(f"Done. Extracted {len(frame_data)} frames.")

    if output_path:
        with open(output_path, "w") as f:
            json.dump(frame_data, f, indent=2)
        print(f"Saved to: {output_path}")

    return frame_data


def load_landmarks(json_path: str) -> list:
    """Load previously extracted landmarks from JSON file."""
    with open(json_path, "r") as f:
        return json.load(f)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract MediaPipe landmarks from video")
    parser.add_argument("video", help="Input video file path")
    parser.add_argument("-o", "--output", help="Output JSON file path")
    args = parser.parse_args()

    out_path = args.output
    if not out_path:
        base = os.path.splitext(os.path.basename(args.video))[0]
        out_path = os.path.join(os.path.dirname(args.video), f"{base}_landmarks.json")

    extract_landmarks_from_video(args.video, out_path)
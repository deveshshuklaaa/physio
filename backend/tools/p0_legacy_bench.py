"""P0.1/P0.2 — measure the legacy desktop loop's per-frame cost.

Replicates exercise_runner.py's live loop exactly (flip -> resize by
DETECTION_SCALE -> BGR2RGB -> detect_for_video) on recorded footage instead of
a live camera, so the number is reproducible and needs no human with a
stopwatch.

Measures the thing §4.5 of docs/00_baseline.md identifies as the dominant lag
source: `detect_for_video()` blocking the single-threaded loop.
"""
import statistics
import sys
import time
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

LEGACY = Path("/home/billa-dakait/Desktop/final_project/backend/_old_physio_reference")
MODEL_PATH = str(LEGACY / "pose_landmarker.task")

# Verbatim from the legacy config.py
CAMERA_WIDTH, CAMERA_HEIGHT = 1280, 720
DETECTION_SCALE = 0.9


def bench(video, max_frames=120, cam_w=CAMERA_WIDTH, cam_h=CAMERA_HEIGHT,
          scale=DETECTION_SCALE, label=""):
    opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.6,
        min_pose_presence_confidence=0.6,
        min_tracking_confidence=0.6,
        output_segmentation_masks=False,
    )
    t0 = time.perf_counter()
    landmarker = mp_vision.PoseLandmarker.create_from_options(opts)
    init_ms = (time.perf_counter() - t0) * 1000

    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        print(f"  cannot open {video}")
        return None

    infer, loop, n = [], [], 0
    while n < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        loop_start = time.perf_counter()

        # legacy loop, verbatim
        frame = cv2.resize(frame, (cam_w, cam_h))     # stand in for camera capture size
        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        det_w, det_h = int(w * scale), int(h * scale)
        small = cv2.resize(frame, (det_w, det_h))
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        i0 = time.perf_counter()
        landmarker.detect_for_video(mp_img, int(time.time() * 1000))
        infer.append((time.perf_counter() - i0) * 1000)

        loop.append((time.perf_counter() - loop_start) * 1000)
        n += 1
    cap.release()

    if len(infer) < 5:
        print(f"  too few frames ({len(infer)})")
        return None

    # drop first frame: one-time warm-up, same convention as the G5 harness
    inf_s, loop_s = infer[1:], loop[1:]
    r = {
        "label": label, "frames": len(inf_s), "init_ms": init_ms,
        "first_frame_ms": infer[0],
        "infer_median": statistics.median(inf_s),
        "infer_mean": statistics.mean(inf_s),
        "infer_min": min(inf_s), "infer_max": max(inf_s),
        "loop_median": statistics.median(loop_s),
        "fps": 1000 / statistics.median(loop_s),
        "res": f"{det_w}x{det_h}",
    }
    print(f"  {label:34} infer med {r['infer_median']:6.1f} ms | "
          f"loop med {r['loop_median']:6.1f} ms | {r['fps']:5.1f} fps | "
          f"@{r['res']} | first frame {r['first_frame_ms']:.0f} ms")
    return r


if __name__ == "__main__":
    vids = sorted(Path("/home/billa-dakait/Desktop/test/dataset").rglob("*.MOV"))[:3]
    print(f"model: {Path(MODEL_PATH).name}  ({Path(MODEL_PATH).stat().st_size/1e6:.1f} MB)")
    print(f"clips: {len(vids)}\n")

    print("A. LEGACY CONFIG (1280x720 capture, DETECTION_SCALE 0.9 -> 1152x648):")
    a = [bench(v, label=v.parent.parent.name + "/" + v.name) for v in vids]

    print("\nB. SAME MODEL AT THE NEW SYSTEM'S RESOLUTION (640x480, scale 1.0):")
    b = [bench(v, cam_w=640, cam_h=480, scale=1.0,
               label=v.parent.parent.name + "/" + v.name) for v in vids]

    for name, rs in (("A legacy 1152x648", a), ("B same model @640x480", b)):
        rs = [r for r in rs if r]
        if rs:
            print(f"\n{name}: infer median {statistics.median([r['infer_median'] for r in rs]):.1f} ms"
                  f" | loop median {statistics.median([r['loop_median'] for r in rs]):.1f} ms"
                  f" | {statistics.median([r['fps'] for r in rs]):.1f} fps")

"""Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3.

Mirrored 1:1 in frontend/src/lib/events.js. Do not add a free-text event
name anywhere in the codebase; add it here (and there) first.

Run `python backend/app/events.py` (or `test_events_mirror.py`) to check the
two files stay in sync.
"""

SESSION = {
    "session_started",
    "session_ended",
    "session_aborted",
    "session_summary",
}

# G2-F: Gemini coaching report + video upload/retention. §8's framing
# constraint applies to every field logged under these events: never imply a
# model assessed the patient, this is prose generated about rule-based
# measurements. "video_deleted" already exists in SHAP_REPORT (Phase L's clip
# cleanup) -- G2-F8's retention sweep reuses that exact name rather than
# minting a near-duplicate; it means the same thing, "a video file on disk
# was removed", regardless of which feature triggered it.
REPORT = {
    "report_generated",
    "report_failed",
    "video_uploaded",
}

# G2-D: Mongo client lifecycle (app/db.py).
DB = {
    "mongo_connected",
    "mongo_closed",
}

RECORDER = {
    "recording_started",
    "chunk_written",
    "recording_stopped",
    "recording_failed",
}

POSE_WORKER = {
    "worker_ready",
    "frame_received",
    "inference_completed",
    "frame_dropped",
    "rule_evaluated",
    "flag_raised",
    "worker_died",
    "audio_cue_missing",
}

WS = {
    "ws_connected",
    "batch_sent",
    "batch_received",
    "backpressure_drop",
    "ws_disconnected",
}

EMG_IMU = {
    "poll_ok",
    "poll_timeout",
    "circuit_opened",
    "circuit_closed",
    "calibration_started",
    "calibration_completed",
    "calibration_failed",
}

CROSSCHECK = {
    "agreement_computed",
    "disagreement_flagged",
}

EXTRACTOR = {
    "clip_started",
    "clip_completed",
    "clip_failed",
    "landmark_gap_detected",
}

MODEL = {
    "model_loaded",
    "feature_row_built",
    "schema_mismatch",
    "prediction_made",
}

SHAP_REPORT = {
    "explanation_computed",
    "report_assembled",
    "report_saved",
    "video_deleted",
}

EXERCISE_CONFIG = {
    "exercise_config_loaded",
    "exercise_config_placeholder_warning",
}

# G2-B1/B4: HTTP and WS auth rejections. Distinct from WS's transport events
# above -- these are the trust-boundary decisions, not the socket lifecycle.
AUTH = {
    "auth_rejected",
    "ws_auth_rejected",
}

ALL_EVENTS = (
    SESSION
    | RECORDER
    | POSE_WORKER
    | WS
    | EMG_IMU
    | CROSSCHECK
    | EXTRACTOR
    | MODEL
    | SHAP_REPORT
    | EXERCISE_CONFIG
    | AUTH
    | DB
    | REPORT
)


def is_valid_event(name: str) -> bool:
    return name in ALL_EVENTS


if __name__ == "__main__":
    # Self-check: no duplicate names across component sets, and the ML
    # pipeline event names required by docs/06_ml_pipeline.md §15 are present.
    _sets = [
        SESSION, RECORDER, POSE_WORKER, WS, EMG_IMU, CROSSCHECK, EXTRACTOR,
        MODEL, SHAP_REPORT, EXERCISE_CONFIG, AUTH, DB, REPORT,
    ]
    _total = sum(len(s) for s in _sets)
    assert _total == len(ALL_EVENTS), "duplicate event name across components"

    required = {
        "clip_started", "clip_completed", "clip_failed",
        "landmark_gap_detected", "model_loaded", "schema_mismatch",
        "prediction_made",
    }
    missing = required - ALL_EVENTS
    assert not missing, f"missing required events: {missing}"

    print(f"OK: {len(ALL_EVENTS)} events, no duplicates, all required present")

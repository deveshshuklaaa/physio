/**
 * Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3.
 *
 * Mirrored 1:1 in backend/app/events.py. Do not add a free-text event name
 * anywhere in the codebase; add it here (and there) first.
 *
 * Kept in sync by backend/app/test_events_mirror.py.
 */

export const SESSION = [
  "session_started",
  "session_ended",
  "session_aborted",
  "session_summary",
];

export const RECORDER = [
  "recording_started",
  "chunk_written",
  "recording_stopped",
  "recording_failed",
];

export const POSE_WORKER = [
  "worker_ready",
  "frame_received",
  "inference_completed",
  "frame_dropped",
  "rule_evaluated",
  "flag_raised",
  "worker_died",
  "audio_cue_missing",
];

export const WS = [
  "ws_connected",
  "batch_sent",
  "batch_received",
  "backpressure_drop",
  "ws_disconnected",
];

export const EMG_IMU = [
  "poll_ok",
  "poll_timeout",
  "circuit_opened",
  "circuit_closed",
  "calibration_started",
  "calibration_completed",
  "calibration_failed",
];

export const CROSSCHECK = [
  "agreement_computed",
  "disagreement_flagged",
];

export const EXTRACTOR = [
  "clip_started",
  "clip_completed",
  "clip_failed",
  "landmark_gap_detected",
];

export const MODEL = [
  "model_loaded",
  "feature_row_built",
  "schema_mismatch",
  "prediction_made",
];

export const SHAP_REPORT = [
  "explanation_computed",
  "report_assembled",
  "report_saved",
  "video_deleted",
];

export const AUTH = [
  "auth_rejected",
  "ws_auth_rejected",
];

// G2-D: Mongo client lifecycle (backend app/db.py).
export const DB = [
  "mongo_connected",
  "mongo_closed",
];

// G2-F: Gemini coaching report + video upload (backend app/services/
// gemini_report.py, app/routes/report.py). "video_deleted" is NOT repeated
// here -- it already lives in SHAP_REPORT above; the retention sweep reuses
// it rather than minting a near-duplicate name for "a video file was removed".
export const REPORT = [
  "report_generated",
  "report_failed",
  "video_uploaded",
];

export const EXERCISE_CONFIG = [
  "exercise_config_loaded",
  "exercise_config_placeholder_warning",
];

export const ALL_EVENTS = new Set([
  ...SESSION,
  ...RECORDER,
  ...POSE_WORKER,
  ...WS,
  ...EMG_IMU,
  ...CROSSCHECK,
  ...EXTRACTOR,
  ...MODEL,
  ...SHAP_REPORT,
  ...EXERCISE_CONFIG,
  ...AUTH,
  ...DB,
  ...REPORT,
]);

export function isValidEvent(name) {
  return ALL_EVENTS.has(name);
}

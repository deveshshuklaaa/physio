/**
 * live_tuning.js — every live-path tuning knob in one place.
 *
 * The browser-side equivalent of legacy config.py: edit a number, reload the
 * page, test on camera. Signal-processing knobs ONLY — clinical thresholds
 * (angles, ratios, alert strings) live in backend/app/config/exercises.json.
 */

// One-Euro filter on the rep-driver angle, in DEGREES. Rep counting only —
// never drawn. minCutoff: smoothing when still (lower = smoother at rest).
// beta: how fast smoothing loosens with speed, per deg/s (higher = less lag,
// more jitter). dCutoff: smoothing on the speed estimate itself.
export const ANGLE_FILTER = Object.freeze({ minCutoff: 0.1, beta: 0.02, dCutoff: 1.0 });

// One-Euro filter on the painted skeleton, in NORMALIZED 0-1 coords. Display
// only — rule math keeps the legacy EMA (smoother.js). beta is large because
// normalized coords move slowly in number terms (~0.5 units/s walking in).
export const DISPLAY_FILTER = Object.freeze({ minCutoff: 2.0, beta: 5, dCutoff: 1.0 });

// Rep misfire guards (pose_engine.js).
// holdFrames: consecutive frames past enter (or exit) before the stage flips.
//             5 frames ~= 0.5 s at the ~10 fps Lite runs at.
// minRepS:    first enter-crossing -> first exit-crossing faster than this is
//             rejected. Real reps take 2-4 s; jitter reps are sub-second.
// minRomDeg:  best angle must pass enter by at least this many degrees.
export const REP_GUARDS = Object.freeze({ holdFrames: 5, minRepS: 1.0, minRomDeg: 10 });

// MediaPipe minPoseDetection/minPosePresence/minTracking confidence.
// Legacy used 0.6. Higher = fewer phantom poses, more no-pose frames.
// Step down to 0.7 if real reps go missing on camera.
export const MP_CONFIDENCE = 0.6;

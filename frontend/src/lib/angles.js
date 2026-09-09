/**
 * angles.js — G1. Exact port of backend/_old_physio_reference/math_utils.py.
 *
 * Every formula here is quoted verbatim (argument order, atan2 vs arccos,
 * epsilon, clamping, degrees) from docs/03_legacy.md D5. Do not "improve"
 * these — the Phase G gate is 6-decimal parity with the Python originals.
 *
 * Input shapes, matching the Python call sites exactly:
 *   angle_2d(a, b, c): a/b/c are [x, y] or [x, y, z] PIXEL tuples (z ignored).
 *   angle_3d(a, b, c): a/b/c are {x, y, z} NORMALIZED landmark objects (raw,
 *     unsmoothed — see D4's SIDE/3D-raw vs FRONT/2D-smoothed asymmetry).
 *   torso_lean(sh_px, hip_px): [x, y] pixel tuples.
 *   detectView(lms): array-like of 33 landmark objects with .x/.y/.z,
 *     indexed by LM (landmarks.js).
 */

// detect_view's z-diff threshold. Hardcoded inline in math_utils.py (not
// config.py) in the legacy source. Resolution 5 in docs/03_legacy.md
// designates this a global, non-clinical, camera-geometry constant that
// must be mirrored to the backend rather than forked. NOT mirrored yet —
// backend/app/config is out of scope for this agent (events.py only
// exception). Flagged in notes for backend-core-agent to add the mirror.
export const VIEW_Z_DIFF_THRESHOLD = 0.12;

function clip(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Angle at vertex b, 2D pixel space. arccos of normalized dot product. */
export function angle2d(a, b, c) {
  const ax = a[0], ay = a[1];
  const bx = b[0], by = b[1];
  const cx = c[0], cy = c[1];
  const bax = ax - bx, bay = ay - by;
  const bcx = cx - bx, bcy = cy - by;
  const dot = bax * bcx + bay * bcy;
  const normBa = Math.hypot(bax, bay);
  const normBc = Math.hypot(bcx, bcy);
  const cos = dot / (normBa * normBc + 1e-6);
  return (Math.acos(clip(cos, -1.0, 1.0)) * 180) / Math.PI;
}

/** Angle at vertex b, 3D normalized landmark space. Same formula, +z. */
export function angle3d(a, b, c) {
  const bax = a.x - b.x, bay = a.y - b.y, baz = a.z - b.z;
  const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
  const dot = bax * bcx + bay * bcy + baz * bcz;
  const normBa = Math.sqrt(bax * bax + bay * bay + baz * baz);
  const normBc = Math.sqrt(bcx * bcx + bcy * bcy + bcz * bcz);
  const cos = dot / (normBa * normBc + 1e-6);
  return (Math.acos(clip(cos, -1.0, 1.0)) * 180) / Math.PI;
}

/**
 * Torso lean from vertical, degrees, unsigned (abs(dx)).
 * dy has a full-pixel floor (max(..., 1)), not an epsilon — replicate
 * exactly, see docs/03_legacy.md D5 (this differs from angle_2d's 1e-6).
 */
export function torsoLean(shPx, hipPx) {
  const dx = shPx[0] - hipPx[0];
  const dy = Math.max(hipPx[1] - shPx[1], 1);
  return (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI;
}

/**
 * "SIDE" if the raw z-depth gap between shoulders exceeds the threshold,
 * else "FRONT". Operates on RAW landmarks (unsmoothed), z only.
 * lms must be indexable by landmarks.LM indices (left_shoulder/right_shoulder).
 */
export function detectView(lms, LM) {
  const zDiff = Math.abs(lms[LM.left_shoulder].z - lms[LM.right_shoulder].z);
  return zDiff > VIEW_Z_DIFF_THRESHOLD ? "SIDE" : "FRONT";
}

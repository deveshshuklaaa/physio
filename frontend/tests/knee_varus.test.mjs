/**
 * knee_varus must fire on lateral knee deviation (frontal plane) and NOT on
 * knee flexion (sagittal). The original formula measured flexion and fired on
 * 38/38 correctly-performed clips in the training set -- a banner the patient
 * could never clear. Run: node --test tests/knee_varus.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKS } from "../src/lib/checks/mini_squat.js";

test("knee_varus: frontal-plane only", () => {
const v = { knee_varus_max_offset_ratio: 1.8 };
const a = { knee_varus_max_offset_ratio: "VARUS" };
const check = CHECKS.knee_varus.build(v, a);

// FRONT view landmarks: shoulders/hips wide apart, minimal z spread.
const lms = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
const front = (o = {}) => {
  const L = lms.map((p) => ({ ...p }));
  L[11] = { x: 0.35, y: 0.30, z: 0, visibility: 1 }; // left shoulder
  L[12] = { x: 0.65, y: 0.30, z: 0, visibility: 1 }; // right shoulder
  L[23] = { x: 0.40, y: 0.55, z: 0, visibility: 1 };
  L[24] = { x: 0.60, y: 0.55, z: 0, visibility: 1 };
  return Object.assign(L, o);
};

const pts = (kneeDx, kneeY) => ({
  left_hip: [400, 550], right_hip: [600, 550],
  left_knee: [400 + kneeDx, kneeY], right_knee: [600 - kneeDx, kneeY],
  left_ankle: [400, 900], right_ankle: [600, 900],
});

// hip width = 200px. Straight leg, knee on the line -> no fire.
assert.equal(check({ lms: front(), pts: pts(0, 725) }), null, "straight leg fired");

// Deep squat: knee flexed hard (knee high and forward in image) but still on
// the hip->ankle line laterally. The OLD formula fired here on every rep.
assert.equal(check({ lms: front(), pts: pts(0, 600) }), null, "knee flexion fired as varus");

// Real varus: knee displaced 400px sideways = ratio 2.0 > 1.8 -> fires.
assert.equal(check({ lms: front(), pts: pts(400, 725) }), "VARUS", "lateral deviation missed");

// Mild deviation under threshold stays quiet.
assert.equal(check({ lms: front(), pts: pts(100, 725) }), null, "mild deviation fired");

// SIDE view is not measurable for this fault -> never fires.
// detectView keys off shoulder z separation (angles.js:70), not x.
const side = front();
side[11] = { x: 0.35, y: 0.30, z: -0.6, visibility: 1 };
side[12] = { x: 0.65, y: 0.30, z: 0.6, visibility: 1 };
assert.equal(check({ lms: side, pts: pts(400, 725) }), null, "fired outside FRONT view");

});

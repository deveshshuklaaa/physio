/**
 * hs_tke_checks.test.mjs — heel_slide slide_insufficient and
 * terminal_knee_extension thigh_lifting live checks, plus real-config wiring.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EXERCISE_CHECKS } from "../src/lib/checks/index.js";
import { rulesForExercise } from "../src/lib/rules.js";
import { exerciseByName } from "./helpers.mjs";

const HS_V = { slide_insufficient_min_heel_travel_ratio: 0.25, slide_insufficient_return_deg: 15 };
const HS_A = { slide_insufficient_min_heel_travel_ratio: "SLIDE", slide_insufficient_return_deg: null };
const HS_CFG = { rep_trigger: { depth_target: { value: 90 } } };
const hsPts = (dist) => ({ left_hip: [0, 0], left_heel: [dist, 0] });

/** Feed [stage, driverAngle, heelDist] steps; return outputs. */
function feed(fn, steps) {
  return steps.map(([stage, driverAngle, d]) => fn({ pts: hsPts(d), stage, driverAngle }));
}
function hsRep(minAngle, minDist) {
  // rest 400px, descend to minAngle/minDist, come back 16 deg (past the 15 deg return), then UP
  return [
    ["UP", 175, 400], ["UP", 175, 400],
    ["DOWN", 140, 380], ["DOWN", minAngle + 5, (380 + minDist) / 2], ["DOWN", minAngle, minDist],
    ["DOWN", minAngle + 8, minDist], ["DOWN", minAngle + 16, minDist + 10], ["DOWN", minAngle + 30, minDist + 40],
    ["UP", 175, 400],
  ];
}

/** Knee placed so the 2D angle at the hip (shoulder-hip-knee) = theta. */
function tkePts(theta) {
  const r = ((180 - theta) * Math.PI) / 180;
  return { left_shoulder: [200, 500], left_hip: [500, 500], left_knee: [500 + 200 * Math.cos(r), 500 - 200 * Math.sin(r)] };
}

const hsBuild = (cfg = HS_CFG) => EXERCISE_CHECKS.slide_insufficient.build(HS_V, HS_A, cfg);
const tkeBuild = () => EXERCISE_CHECKS.thigh_lifting.build(
  { thigh_lifting_max_hip_change_deg: 20 }, { thigh_lifting_max_hip_change_deg: "THIGH" });

describe("slide_insufficient (heel_slide)", () => {
  test("good rep → no alert", () => {
    const fn = hsBuild();
    const outs = feed(fn, hsRep(85, 280));
    // travel = (400-280)/400 = 0.30 ≥ 0.25, lowest 85 ≤ 90
    for (const out of outs) {
      assert.equal(out, null);
    }
  });

  test("knee short → alert on the return and for rest of DOWN", () => {
    const outs = feed(hsBuild(), hsRep(100, 280));
    for (let i = 0; i < 6; i++) {
      assert.equal(outs[i], null, `step ${i} should be null`);
    }
    assert.equal(outs[6], "SLIDE", "step 6 should fire SLIDE");
    assert.equal(outs[7], "SLIDE", "step 7 should stay SLIDE");
    assert.equal(outs[8], null, "step 8 (UP) should reset");
  });

  test("heel short → alert", () => {
    const outs = feed(hsBuild(), hsRep(85, 340));
    // travel 0.15 < 0.25
    assert.equal(outs[6], "SLIDE");
  });

  test("no verdict before the knee comes back 15 deg", () => {
    const outs = feed(hsBuild(), hsRep(100, 280));
    // step 5 is at minAngle + 8, which is < 15 deg return
    assert.equal(outs[5], null);
  });

  test("resets between reps", () => {
    const fn = hsBuild();
    feed(fn, hsRep(100, 280)); // triggers alert in that rep
    const outs2 = feed(fn, hsRep(85, 280)); // second rep is clean
    for (const out of outs2) {
      assert.equal(out, null);
    }
  });

  test("no cfg / missing pts / undefined driverAngle never throw", () => {
    const fn2 = EXERCISE_CHECKS.slide_insufficient.build(HS_V, HS_A); // no cfg
    assert.doesNotThrow(() => fn2({ pts: {}, stage: "DOWN", driverAngle: undefined }));
    assert.equal(fn2({ pts: {}, stage: "DOWN" }), null);
  });
});

describe("thigh_lifting (terminal_knee_extension)", () => {
  test("within ±20 of rep-start hip angle → null; beyond → alert", () => {
    const fn = tkeBuild();
    assert.equal(fn({ pts: tkePts(140), stage: "UP" }), null);
    assert.equal(fn({ pts: tkePts(140), stage: "DOWN" }), null); // baseline 140
    assert.equal(fn({ pts: tkePts(150), stage: "DOWN" }), null);
    assert.equal(fn({ pts: tkePts(165), stage: "DOWN" }), "THIGH");
    assert.equal(fn({ pts: tkePts(140), stage: "UP" }), null);
  });

  test("per-rep baseline (different pillow)", () => {
    const fn = tkeBuild();
    fn({ pts: tkePts(140), stage: "UP" });
    assert.equal(fn({ pts: tkePts(120), stage: "DOWN" }), null); // baseline 120
    assert.equal(fn({ pts: tkePts(135), stage: "DOWN" }), null);
  });

  test("missing pts → null", () => {
    assert.equal(tkeBuild()({ pts: {}, stage: "DOWN" }), null);
  });
});

describe("real config wiring", () => {
  test("HS builds heel_lifting + hip_lifting + slide_insufficient, none skipped", () => {
    const r = rulesForExercise(exerciseByName("heel_slide"));
    assert.equal(r.checks.length, 3);
    assert.equal(r.skipped.length, 0);
  });

  test("TKE builds hip_lifting + thigh_lifting, none skipped, trigger 155/145/170", () => {
    const ex = exerciseByName("terminal_knee_extension");
    const r = rulesForExercise(ex);
    assert.equal(r.checks.length, 2);
    assert.equal(r.skipped.length, 0);
    assert.equal(ex.rep_trigger.enter_angle.value, 155);
    assert.equal(ex.rep_trigger.exit_angle.value, 145);
    assert.equal(ex.rep_trigger.depth_target.value, 170);
    assert.equal(ex.rep_trigger.direction, "increase");
  });
});

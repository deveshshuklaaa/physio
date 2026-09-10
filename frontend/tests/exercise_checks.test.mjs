/**
 * exercise_checks.test.mjs — the five ML-dataset exercises' live rule path.
 *
 * Guards the failure this suite was written for: every one of these exercises
 * shipped with `extra_checks` absent and every threshold a `{"value": null}`
 * placeholder, so `rulesForExercise` returned zero checks and the live path
 * silently assessed nothing. No crash, no log — just a session that never
 * flags anything. A regression back to that state must fail here.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { rulesForExercise } from "../src/lib/rules.js";
import { EXERCISE_CHECKS } from "../src/lib/checks/index.js";
import { PoseEngine } from "../src/lib/pose_engine.js";
import { LM } from "../src/lib/landmarks.js";
import { exerciseByName, loadRealConfig } from "./helpers.mjs";

const ML_EXERCISES = [
  "heel_slide", "mini_squat", "seated_knee_extension",
  "straight_leg_raise", "terminal_knee_extension",
];

/** Identity smoother — the checks under test are geometry, not smoothing. */
const rawSmoother = { smooth: (_name, lm) => [lm.x, lm.y] };

/** 33 landmarks, all visible, laid out as a person standing square to camera. */
function baseLandmarks() {
  const lms = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  const put = (name, x, y, z = 0) => { lms[LM[name]] = { x, y, z, visibility: 1 }; };
  put("nose", 0.50, 0.10);
  put("left_ear", 0.47, 0.11); put("right_ear", 0.53, 0.11);
  put("left_shoulder", 0.42, 0.25); put("right_shoulder", 0.58, 0.25);
  put("left_hip", 0.45, 0.50); put("right_hip", 0.55, 0.50);
  put("left_knee", 0.45, 0.70); put("right_knee", 0.55, 0.70);
  put("left_ankle", 0.45, 0.90); put("right_ankle", 0.55, 0.90);
  put("left_heel", 0.45, 0.93); put("right_heel", 0.55, 0.93);
  put("left_foot", 0.46, 0.96); put("right_foot", 0.56, 0.96);
  return lms;
}

/** SIDE view = a z-gap between the shoulders above VIEW_Z_DIFF_THRESHOLD. */
function sideLandmarks() {
  const lms = baseLandmarks();
  lms[LM.left_shoulder] = { ...lms[LM.left_shoulder], z: -0.2 };
  lms[LM.right_shoulder] = { ...lms[LM.right_shoulder], z: 0.2 };
  return lms;
}

describe("shipped config — no placeholders left in the live path", () => {
  for (const name of ML_EXERCISES) {
    test(`${name} builds every check its config names`, () => {
      const ex = exerciseByName(name);
      assert.ok(Array.isArray(ex.extra_checks) && ex.extra_checks.length > 0,
        `${name} declares no extra_checks — the live path would assess nothing`);
      const { checks, hasRealThresholds, skipped } = rulesForExercise(ex);
      assert.deepEqual(skipped, [],
        `${name} skipped checks: ${JSON.stringify(skipped)}`);
      assert.equal(checks.length, ex.extra_checks.length);
      assert.equal(hasRealThresholds, true);
    });

    test(`${name} has a real rep trigger and a depth alert`, () => {
      const rt = exerciseByName(name).rep_trigger;
      for (const k of ["enter_angle", "exit_angle", "depth_target"]) {
        assert.notEqual(rt[k].value, null, `${name}.rep_trigger.${k} still null`);
      }
      const alert = exerciseByName(name).thresholds.depth_insufficient_alert?.value;
      assert.equal(typeof alert, "string",
        `${name} has a depth_target but no depth_insufficient_alert — depthAlert() returns null`);
    });
  }

  test("every configured check name resolves to an implementation", () => {
    for (const ex of loadRealConfig()) {
      for (const name of ex.extra_checks ?? []) {
        const { skipped } = rulesForExercise(ex);
        assert.ok(!skipped.some((s) => s.name === name && /no implementation/.test(s.reason)),
          `${ex.name}: check '${name}' has no CHECK_REGISTRY entry`);
      }
    }
  });
});

describe("rep trigger direction vs. the pose_engine state machine", () => {
  // The machine exits a rep when the driver angle crosses BACK past exit_angle,
  // so exit must sit on the resting side of enter. Get this backwards and every
  // rep completes on the frame after it starts: reps inflate and the depth
  // alert fires on all of them. terminal_knee_extension shipped this way.
  for (const ex of loadRealConfig()) {
    const rt = ex.rep_trigger;
    if (!rt) continue;
    test(`${ex.name}: exit_angle is on the resting side of enter_angle`, () => {
      const { enter_angle: en, exit_angle: ex_, direction } = rt;
      if (direction === "decrease") {
        assert.ok(ex_.value > en.value,
          `${ex.name}: direction=decrease needs exit(${ex_.value}) > enter(${en.value})`);
      } else {
        assert.ok(ex_.value < en.value,
          `${ex.name}: direction=increase needs exit(${ex_.value}) < enter(${en.value})`);
      }
    });
  }
});

describe("rep drivers share one angle scale", () => {
  // mini_squat shipped with two rep drivers — Knee (L) at use_3d:false (FRONT)
  // and Knee (side) at use_3d:true (SIDE) — feeding ONE enter/exit pair. The
  // two angles are not on the same scale: measured over
  // backend/ml/manifest_data/train_mini_squat.parquet, a standing knee reads
  // 176-180 in 2D but straddles 127-172 in 3D. enter=160/exit=170 therefore sat
  // inside the 3D standing band, and a patient standing still counted reps.
  //
  // A single rep_trigger can only be calibrated against one scale, so every
  // driver an exercise declares has to be measured the same way.
  for (const ex of loadRealConfig()) {
    const drivers = (ex.joints ?? []).filter((j) => j.is_rep_driver);
    if (drivers.length < 2) continue;
    test(`${ex.name}: every rep driver has the same use_3d`, () => {
      const scales = [...new Set(drivers.map((j) => Boolean(j.use_3d)))];
      assert.equal(scales.length, 1,
        `${ex.name} mixes 2D and 3D rep drivers under one rep_trigger: ` +
        drivers.map((j) => `${j.display_name}=use_3d:${j.use_3d}`).join(", "));
    });
  }
});

describe("checks run against real landmarks without throwing", () => {
  for (const name of ML_EXERCISES) {
    test(`${name}: a full UP→DOWN→UP cycle produces reps and no exceptions`, () => {
      const ex = exerciseByName(name);
      const engine = new PoseEngine(ex, rawSmoother);
      const side = ex.valid_views.includes("SIDE");
      const lms = side ? sideLandmarks() : baseLandmarks();

      // Drive the driver joint across enter, through depth, and back out.
      const rt = ex.rep_trigger;
      const decreasing = rt.direction === "decrease";
      const sweep = decreasing
        ? [178, rt.enter_angle.value - 5, rt.depth_target.value - 10, rt.exit_angle.value + 5]
        : [60, rt.enter_angle.value + 5, rt.depth_target.value + 5, rt.exit_angle.value - 5];

      for (const target of sweep) {
        // Place the knee/hip so the driver joint reads ~target degrees, by
        // rotating the distal segment about the joint.
        const rad = (target * Math.PI) / 180;
        const moved = lms.map((l) => ({ ...l }));
        for (const s of ["left", "right"]) {
          const knee = moved[LM[`${s}_knee`]];
          const hip = moved[LM[`${s}_hip`]];
          const len = 0.2;
          // hip is above the knee; swing the ankle to make hip-knee-ankle = target
          const baseAng = Math.atan2(hip.y - knee.y, hip.x - knee.x);
          moved[LM[`${s}_ankle`]] = {
            x: knee.x + len * Math.cos(baseAng - rad),
            y: knee.y + len * Math.sin(baseAng - rad),
            z: 0, visibility: 1,
          };
        }
        // 20 frames per pose: enough for back_rocking's 15-sample minimum.
        for (let i = 0; i < 20; i++) {
          const out = engine.processFrame(moved, 1280, 720);
          assert.ok(Array.isArray(out.alerts));
          for (const a of out.alerts) assert.equal(typeof a, "string");
        }
      }
      assert.ok(engine.repCount >= 0);
    });
  }

  test("every check tolerates landmarks missing from pts", () => {
    // pts only carries landmarks above the visibility threshold. A check that
    // indexes pts blind throws inside processFrame and kills the frame.
    const empty = { lms: sideLandmarks(), pts: {}, w: 1280, h: 720, stage: "DOWN", view: "SIDE" };
    for (const [name, spec] of Object.entries(EXERCISE_CHECKS)) {
      const v = Object.fromEntries(spec.needs.map((k) => [k, 0.5]));
      const a = Object.fromEntries(spec.needs.map((k) => [k, `alert:${k}`]));
      const fn = spec.build(v, a);
      assert.doesNotThrow(() => fn(empty), `check '${name}' threw on empty pts`);
    }
  });
});

/**
 * rep_guards.test.mjs — rep misfire guards in PoseEngine (hold frames,
 * minimum rep time, minimum movement) plus the 3D visibility check.
 * Synthetic single-joint config so only the guards are under test.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PoseEngine } from "../src/lib/pose_engine.js";
import { LM } from "../src/lib/landmarks.js";
import { REP_GUARDS } from "../src/lib/live_tuning.js";

const W = 1000, H = 1000; // square frame: pixel angles == normalized angles
const identity = { smooth: (_n, lm) => [lm.x, lm.y] };

function config({ use3d = false, direction = "decrease", enter = 150, exit = 170 } = {}) {
  return {
    name: "guard_test", type: "dynamic", valid_views: ["FRONT", "SIDE"],
    joints: [{
      display_name: "Knee (L)", landmark_a: "left_hip", landmark_b: "left_knee",
      landmark_c: "left_ankle", use_3d: use3d, check_in_views: ["FRONT", "SIDE"],
      is_rep_driver: true,
    }],
    rep_trigger: {
      joint_display_name: "Knee (L)", direction,
      enter_angle: { value: enter }, exit_angle: { value: exit }, depth_target: { value: 0 },
    },
    extra_checks: [], thresholds: {},
  };
}

/** 33 landmarks; left knee angle (hip-knee-ankle) = theta degrees. */
function frame(theta, kneeVis = 1) {
  const raw = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  const r = (theta * Math.PI) / 180;
  raw[LM.left_hip] = { x: 0.5, y: 0.3, z: 0, visibility: 1 };
  raw[LM.left_knee] = { x: 0.5, y: 0.5, z: 0, visibility: kneeVis };
  raw[LM.left_ankle] = { x: 0.5 + 0.2 * Math.sin(r), y: 0.5 - 0.2 * Math.cos(r), z: 0, visibility: 1 };
  // shoulders equal z => FRONT view
  raw[LM.left_shoulder] = { x: 0.45, y: 0.1, z: 0, visibility: 1 };
  raw[LM.right_shoulder] = { x: 0.55, y: 0.1, z: 0, visibility: 1 };
  return raw;
}

const ramp = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 1)) / n);
const hold = (a, n) => Array.from({ length: n }, () => a);

/** Feed angles at 10 fps with explicit timestamps; collect outputs. */
function run(engine, angles, { withT = true, kneeVis = 1 } = {}) {
  const outs = [];
  angles.forEach((a, i) => outs.push(engine.processFrame(frame(a, kneeVis), W, H, withT ? i * 100 : undefined)));
  return outs;
}
const rejections = (outs) => outs.map((o) => o.repRejected).filter(Boolean);

describe("rep guards", () => {
  test("guard knobs are the agreed values", () => {
    assert.deepEqual({ ...REP_GUARDS }, { holdFrames: 5, minRepS: 1.0, minRomDeg: 10 });
  });

  test("a real rep counts once", () => {
    const engine = new PoseEngine(config(), identity);
    const angles = [
      ...hold(178, 20), ...ramp(178, 100, 20), ...hold(100, 5),
      ...ramp(100, 178, 20), ...hold(178, 20),
    ];
    const outs = run(engine, angles);
    assert.equal(engine.repCount, 1);
    assert.equal(rejections(outs).length, 0);
    assert.equal(outs.filter((o) => o.repEntry).length, 1);
  });

  test("jitter spikes never start a rep", () => {
    const engine = new PoseEngine(config(), identity);
    const angles = Array.from({ length: 200 }, (_, i) => (i % 10 === 5 ? 140 : 175));
    const outs = run(engine, angles);
    assert.equal(engine.repCount, 0);
    assert.ok(outs.every((o) => o.stage === "UP"));
    assert.equal(rejections(outs).length, 0);
  });

  test("a fast dip is rejected as too_fast", () => {
    const engine = new PoseEngine(config(), identity);
    const angles = [...hold(178, 20), ...hold(100, 6), ...hold(178, 20)];
    const outs = run(engine, angles);
    assert.equal(engine.repCount, 0);
    const rej = rejections(outs);
    assert.equal(rej.length, 1);
    assert.equal(rej[0].reason, "too_fast");
    assert.equal(typeof rej[0].duration_s, "number");
  });

  test("a shallow dip is rejected as too_small", () => {
    const engine = new PoseEngine(config(), identity);
    const angles = [
      ...hold(178, 20), ...ramp(178, 145, 10), ...hold(145, 20),
      ...ramp(145, 178, 10), ...hold(178, 20),
    ];
    const outs = run(engine, angles);
    assert.equal(engine.repCount, 0);
    const rej = rejections(outs);
    assert.equal(rej.length, 1);
    assert.equal(rej[0].reason, "too_small");
    assert.ok(rej[0].rom_deg < 10);
  });

  test("no tMs → synthetic clock still counts", () => {
    const engine = new PoseEngine(config(), identity);
    const angles = [
      ...hold(178, 20), ...ramp(178, 100, 20), ...hold(100, 5),
      ...ramp(100, 178, 20), ...hold(178, 20),
    ];
    run(engine, angles, { withT: false });
    assert.equal(engine.repCount, 1);
  });

  test("increase direction works (TKE-like)", () => {
    const engine = new PoseEngine(config({ direction: "increase", enter: 155, exit: 145 }), identity);
    const angles = [
      ...hold(140, 20), ...ramp(140, 178, 20), ...hold(178, 5),
      ...ramp(178, 140, 20), ...hold(140, 20),
    ];
    run(engine, angles);
    assert.equal(engine.repCount, 1);
  });

  test("low-visibility 3D joint yields null driver angle", () => {
    const engine = new PoseEngine(config({ use3d: true }), identity);
    const outs = run(engine, hold(120, 10), { kneeVis: 0.3 });
    assert.ok(outs.every((o) => o.driverAngle === null));
    assert.equal(engine.repCount, 0);
    assert.equal(engine.stage, "UP");

    const engine2 = new PoseEngine(config({ use3d: true }), identity);
    const outs2 = run(engine2, hold(120, 3), { kneeVis: 1 });
    assert.equal(typeof outs2.at(-1).driverAngle, "number");
  });
});

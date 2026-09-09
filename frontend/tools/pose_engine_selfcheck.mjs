#!/usr/bin/env node
/**
 * pose_engine_selfcheck.mjs — runnable check for the squat rep state machine
 * (PoseEngine + EmaSmoother + rules.js), the non-trivial logic G5 depends on.
 * Simulates a clean FRONT-view squat rep (standing -> depth -> standing) with
 * synthetic landmarks and asserts one clean rep is counted with no alerts.
 *
 * Uses the REAL backend/app/config/exercises.json "squat" entry — same
 * config the browser gets from GET /exercises.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PoseEngine } from "../src/lib/pose_engine.js";
import { EmaSmoother } from "../src/lib/smoother.js";
import { LM } from "../src/lib/landmarks.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(
  readFileSync(join(HERE, "..", "..", "backend", "app", "config", "exercises.json"), "utf8")
);
const squatConfig = registry.exercises.find((e) => e.name === "squat");

function lm(x, y, z = 0, visibility = 1) {
  return { x, y, z, visibility };
}

/** Build a 33-slot raw landmark array for a given left-knee bend fraction (0=standing,1=bottom). */
function frameAt(frac) {
  const raw = new Array(33).fill(null).map(() => lm(0.5, 0.5, 0, 0)); // low-vis filler, unused
  const set = (name, x, y, z = 0) => { raw[LM[name]] = lm(x, y, z, 1); };

  // Normalized [0,1] coords. hip fixed above knee. Ankle: standing straight
  // below the knee (y=0.90, collinear -> ~180deg), bottom swings forward and
  // level with the knee (y=0.60, x+0.15 -> ~90deg).
  set("left_hip", 0.50, 0.30);
  set("left_knee", 0.50, 0.60);
  raw[LM.left_ankle] = lm(0.50 + 0.15 * frac, 0.90 - 0.30 * frac, 0, 1);

  // Right leg identical to left => ankle_width/knee_width both 0 => knee_cave guard (ankle_w>10) never fires.
  set("right_hip", 0.50, 0.30);
  set("right_knee", 0.50, 0.60);
  raw[LM.right_ankle] = lm(0.50 + 0.15 * frac, 0.90 - 0.30 * frac, 0, 1);

  set("left_shoulder", 0.50, 0.10);
  set("right_shoulder", 0.50, 0.10); // z-diff 0 => FRONT view
  set("left_ear", 0.50, 0.05);
  set("right_ear", 0.50, 0.05);
  set("left_heel", 0.50, 0.95);
  set("right_heel", 0.50, 0.95);

  return raw;
}

const W = 1280, H = 720;
const engine = new PoseEngine(squatConfig, new EmaSmoother());

const fracsDown = Array.from({ length: 40 }, (_, i) => i / 39); // 0 -> 1
const fracsHold = Array.from({ length: 15 }, () => 1);
const fracsUp = fracsDown.slice().reverse();

let lastResult = null;
let anyAlerts = false;
for (const frac of [...fracsDown, ...fracsHold, ...fracsUp, 0, 0]) {
  const raw = frameAt(frac);
  lastResult = engine.processFrame(raw, W, H);
  if (lastResult.alerts.length > 0) anyAlerts = true;
}

console.log("final state:", JSON.stringify({
  stage: lastResult.stage,
  repCount: lastResult.repCount,
  cleanReps: lastResult.cleanReps,
  view: lastResult.view,
}, null, 2));
console.log("sessionLog:", JSON.stringify(engine.sessionLog, null, 2));

let failed = false;
function assertEq(actual, expected, msg) {
  if (actual !== expected) {
    console.error(`FAIL: ${msg} — expected ${expected}, got ${actual}`);
    failed = true;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

assertEq(lastResult.view, "FRONT", "view detected as FRONT");
assertEq(lastResult.repCount, 1, "one rep counted");
assertEq(lastResult.cleanReps, 1, "rep was clean");
assertEq(anyAlerts, false, "no alerts fired during a clean deep squat");
assertEq(engine.sessionLog.length, 1, "one session_log entry");
assertEq(engine.sessionLog[0].clean, true, "session_log entry marked clean");

// Note: squat's real thresholds have enter_angle(105) < depth_target(120), so
// entering DOWN (angle<105) always already satisfies depth(<=120) — "Not deep
// enough" is structurally unreachable with squat's actual numbers. Not a bug
// to fix (D3/D5 quote the legacy formula verbatim); flagged in docs/09.
// Second run instead exercises a real extra_check: knee cave (front view),
// which SHOULD fire and mark the rep unclean.
function frameAtKneeCave(frac) {
  const raw = frameAt(frac); // start from the clean-rep frame, then diverge the right leg
  raw[LM.right_hip] = lm(0.35, 0.30, 0, 1);
  raw[LM.right_knee] = lm(0.48, 0.60, 0, 1); // close to left_knee.x=0.50 -> small knee_w
  raw[LM.right_ankle] = lm(0.20 + 0.15 * frac, 0.90 - 0.30 * frac, 0, 1); // far from left_ankle -> large ankle_w
  return raw;
}

const engine2 = new PoseEngine(squatConfig, new EmaSmoother());
let last2 = null;
for (const frac of [...fracsDown, ...fracsHold, ...fracsUp, 0, 0]) {
  last2 = engine2.processFrame(frameAtKneeCave(frac), W, H);
}
console.log("\nknee-cave sessionLog:", JSON.stringify(engine2.sessionLog, null, 2));
assertEq(engine2.repCount, 1, "knee-cave rep still counted");
assertEq(engine2.cleanReps, 0, "knee-cave rep NOT clean");
assertEq(
  engine2.sessionLog[0]?.errors.includes("Knees caving in — push knees out"),
  true,
  "knee-cave rep flagged the exact squat.py alert string"
);

process.exit(failed ? 1 : 0);

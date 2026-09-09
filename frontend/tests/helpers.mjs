/**
 * Shared fixtures for the Phase G test suite.
 *
 * Landmark fixtures are built as full 33-entry arrays because the checks index
 * by MediaPipe landmark number (LM.*) and a sparse object would pass some
 * checks by accident while throwing in others — which would make a test green
 * for the wrong reason.
 */

import { LM } from "../src/lib/landmarks.js";

/** A 33-landmark array, all points valid, shoulders' z-difference set by `view`. */
export function makeLms(view = "FRONT", overrides = {}) {
  const lms = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0.0, visibility: 0.99 }));

  // detectView() keys ONLY off |left_shoulder.z - right_shoulder.z| vs 0.12.
  // FRONT => below threshold, SIDE => above. Exactly at 0.12 is FRONT (`>`).
  lms[LM.left_shoulder] = { x: 0.4, y: 0.3, z: 0.0, visibility: 0.99 };
  lms[LM.right_shoulder] = { x: 0.6, y: 0.3, z: view === "SIDE" ? 0.5 : 0.0, visibility: 0.99 };

  lms[LM.left_hip] = { x: 0.42, y: 0.55, z: 0.0, visibility: 0.99 };
  lms[LM.right_hip] = { x: 0.58, y: 0.55, z: 0.0, visibility: 0.99 };
  lms[LM.left_knee] = { x: 0.42, y: 0.75, z: 0.0, visibility: 0.99 };
  lms[LM.right_knee] = { x: 0.58, y: 0.75, z: 0.0, visibility: 0.99 };
  lms[LM.left_ankle] = { x: 0.42, y: 0.95, z: 0.0, visibility: 0.99 };
  lms[LM.right_ankle] = { x: 0.58, y: 0.95, z: 0.0, visibility: 0.99 };
  lms[LM.left_heel] = { x: 0.41, y: 0.96, z: 0.0, visibility: 0.99 };
  lms[LM.right_heel] = { x: 0.59, y: 0.96, z: 0.0, visibility: 0.99 };
  lms[LM.left_ear] = { x: 0.45, y: 0.15, z: 0.0, visibility: 0.99 };
  lms[LM.right_ear] = { x: 0.55, y: 0.15, z: 0.0, visibility: 0.99 };
  lms[LM.nose] = { x: 0.5, y: 0.16, z: 0.0, visibility: 0.99 };

  for (const [k, v] of Object.entries(overrides)) lms[LM[k]] = { ...lms[LM[k]], ...v };
  return lms;
}

/** Pixel-space `pts` dict, mirroring build_pts()'s (int(x*w), int(y*h)) projection. */
export function makePts(lms, w = 1280, h = 720, overrides = {}) {
  const pts = {};
  for (const [name, idx] of Object.entries(LM)) {
    const lm = lms[idx];
    if (lm) pts[name] = [Math.trunc(lm.x * w), Math.trunc(lm.y * h)];
  }
  return { ...pts, ...overrides };
}

export function ctxFor(view = "FRONT", { stage = "UP", w = 1280, h = 720, lmOverrides = {}, ptOverrides = {} } = {}) {
  const lms = makeLms(view, lmOverrides);
  const pts = makePts(lms, w, h, ptOverrides);
  return { lms, pts, w, h, stage, view };
}

/** One of the five ML-dataset exercises: every threshold is a null placeholder. */
export const PLACEHOLDER_EXERCISE = {
  name: "heel_slide",
  display_name: "Heel Slide",
  type: "dynamic",
  thresholds: {
    heel_lifting_max_y_rise: { value: null, unit: "normalized y", _TODO: "needs a real value" },
    hip_lifting_max_y_rise: { value: null, unit: "normalized y", _TODO: "needs a real value" },
  },
  rep_trigger: {
    enter_angle: { value: null },
    exit_angle: { value: null },
    depth_target: { value: null },
  },
};

export const SQUAT_EXERCISE = { name: "squat", display_name: "Squat", type: "dynamic" };

/** Minimal in-memory WebSocket double: records what was sent, no network. */
export class FakeWebSocket {
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.readyState = 1; // OPEN
    this._listeners = {};
    FakeWebSocket.last = this;
  }
  addEventListener(type, fn) {
    (this._listeners[type] ||= []).push(fn);
  }
  emit(type, ev = {}) {
    for (const fn of this._listeners[type] || []) fn(ev);
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.emit("close", { code: 1000, reason: "test" });
  }
  get sentJson() {
    return this.sent.map((s) => JSON.parse(s));
  }
}

/** Audio double: counts play() calls per source file. */
export class FakeAudio {
  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    FakeAudio.plays.push(src);
  }
  addEventListener() {}
  play() {
    FakeAudio.playCalls.push(this.src);
    return Promise.resolve();
  }
  static reset() {
    FakeAudio.plays = [];
    FakeAudio.playCalls = [];
  }
}
FakeAudio.reset();

// --- real config access -----------------------------------------------------
// Tests read the SHIPPED config rather than a fixture copy. That is the point
// of the change these tests cover: exercises.json is the single source of
// truth for thresholds and alert strings, so a test asserting against its own
// private copy would defeat the exercise.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = fileURLToPath(
  new URL("../../backend/app/config/exercises.json", import.meta.url),
);

export function loadRealConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")).exercises;
}

export function exerciseByName(name) {
  const found = loadRealConfig().find((e) => e.name === name);
  if (!found) throw new Error(`no exercise ${name} in the shipped config`);
  return found;
}

export const squatConfig = () => exerciseByName("squat");

/** Every alert string the shipped config can raise, across all exercises. */
export function allConfiguredAlerts() {
  const out = [];
  for (const ex of loadRealConfig()) {
    for (const entry of Object.values(ex.thresholds ?? {})) {
      if (entry && typeof entry === "object" && typeof entry.alert === "string") {
        out.push(entry.alert);
      }
    }
  }
  return out;
}

/**
 * Phase G — smoother.js (G3) and audio_cues.js (G8).
 *
 * The smoother tests pin EMA to the legacy algorithm exactly, because the
 * offline feature pipeline was built on it: the 6-decimal parity gate only
 * means anything while live and offline smooth identically. One-Euro is
 * implemented but must stay OFF by default until someone decides the
 * trade-off (see docs/G-CONTINUE.md §6).
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { EmaSmoother, OneEuroSmoother, createSmoother } from "../src/lib/smoother.js";
import { AudioCuePlayer, AUDIO_MAP } from "../src/lib/audio_cues.js";
import { FakeAudio, squatConfig, allConfiguredAlerts } from "./helpers.mjs";

// Alert strings come from the shipped config — the single source of truth —
// not from a JS constant that could drift away from it.
const SQUAT = squatConfig();
const KNEE_CAVE = SQUAT.thresholds.knee_cave_min_width_ratio.alert;
const NECK = SQUAT.thresholds.neck_min_angle_deg.alert;

describe("EmaSmoother — must match smoother.py exactly (D4)", () => {
  test("alpha defaults to 0.25, the legacy EMA_ALPHA", () => {
    assert.equal(new EmaSmoother().alpha, 0.25);
  });

  test("seeds with the RAW value on first sample — no lag spike", () => {
    // smooth_landmark(): `if name not in _smoothed: _smoothed[name] = new[:]`.
    // Seeding with zero instead would drag the first frames of every session
    // toward the origin, which reads as the skeleton flying in from a corner.
    const s = new EmaSmoother();
    assert.deepEqual(s.smooth("left_knee", { x: 0.4, y: 0.7, z: -0.1 }), [0.4, 0.7, -0.1]);
  });

  test("second sample is alpha*new + (1-alpha)*prev, componentwise", () => {
    const s = new EmaSmoother(0.25);
    s.smooth("left_knee", { x: 0.0, y: 0.0, z: 0.0 });
    const out = s.smooth("left_knee", { x: 1.0, y: 2.0, z: -4.0 });
    // 0.25*1 + 0.75*0 = 0.25 ; 0.25*2 = 0.5 ; 0.25*-4 = -1
    assert.deepEqual(out, [0.25, 0.5, -1]);
  });

  test("converges toward a held value without overshooting it", () => {
    const s = new EmaSmoother(0.25);
    s.smooth("p", { x: 0, y: 0, z: 0 });
    let last = 0;
    for (let i = 0; i < 50; i++) {
      const [x] = s.smooth("p", { x: 1, y: 0, z: 0 });
      assert.ok(x >= last, "EMA went backwards on a monotonic input");
      assert.ok(x <= 1, "EMA overshot the target value");
      last = x;
    }
    assert.ok(last > 0.99, `EMA failed to converge (reached ${last})`);
  });

  test("tracks each landmark independently", () => {
    // One shared accumulator across landmark names would blend the knee into
    // the shoulder — every angle in the system would be wrong but plausible.
    const s = new EmaSmoother(0.5);
    s.smooth("a", { x: 0, y: 0, z: 0 });
    s.smooth("b", { x: 10, y: 10, z: 10 });
    assert.deepEqual(s.smooth("a", { x: 0, y: 0, z: 0 }), [0, 0, 0]);
  });

  test("reset clears state, so the next sample seeds fresh", () => {
    const s = new EmaSmoother();
    s.smooth("p", { x: 5, y: 5, z: 5 });
    s.reset();
    assert.deepEqual(s.smooth("p", { x: 9, y: 9, z: 9 }), [9, 9, 9]);
  });
});

describe("createSmoother — EMA is the default, One-Euro is opt-in", () => {
  test("defaults to EMA so the parity gate stays passable", () => {
    assert.ok(createSmoother() instanceof EmaSmoother);
    assert.ok(createSmoother("ema") instanceof EmaSmoother);
  });

  test("One-Euro is available but only when explicitly asked for", () => {
    assert.ok(createSmoother("one-euro") instanceof OneEuroSmoother);
  });

  test("One-Euro also seeds on its first sample", () => {
    const s = new OneEuroSmoother();
    const out = s.smooth("p", { x: 0.4, y: 0.7, z: -0.1 }, 0);
    assert.deepEqual(out.map((v) => Number(v.toFixed(6))), [0.4, 0.7, -0.1]);
  });
});

describe("AudioCuePlayer — debounce (G8)", () => {
  let realAudio;
  let realDate;

  beforeEach(() => {
    realAudio = globalThis.Audio;
    realDate = Date.now;
    globalThis.Audio = FakeAudio;
    FakeAudio.reset();
  });

  afterEach(() => {
    globalThis.Audio = realAudio;
    Date.now = realDate;
  });

  test("every alert string the config can raise maps to a cue file", () => {
    for (const alertText of allConfiguredAlerts()) {
      assert.ok(AUDIO_MAP[alertText], `no cue mapped for ${JSON.stringify(alertText)}`);
    }
  });

  test("plays a cue for a mapped alert", () => {
    new AudioCuePlayer().play(KNEE_CAVE);
    assert.equal(FakeAudio.playCalls.length, 1);
    assert.match(FakeAudio.playCalls[0], /caving\.mp3$/);
  });

  test("the same alert does NOT replay inside the cooldown", () => {
    // Without this the cue fires every frame the posture is wrong — roughly
    // 18 times a second — which is unusable rather than merely annoying.
    let now = 1_000_000;
    Date.now = () => now;

    const p = new AudioCuePlayer();
    p.play(KNEE_CAVE);
    now += 100;
    p.play(KNEE_CAVE);
    now += 500;
    p.play(KNEE_CAVE);

    assert.equal(FakeAudio.playCalls.length, 1, "cue repeated inside the cooldown window");
  });

  test("replays once the cooldown has elapsed", () => {
    let now = 1_000_000;
    Date.now = () => now;

    const p = new AudioCuePlayer();
    p.play(KNEE_CAVE);
    now += 4001; // COOLDOWN_MS = 4000
    p.play(KNEE_CAVE);

    assert.equal(FakeAudio.playCalls.length, 2);
  });

  test("debounce is per-alert — a different error still speaks immediately", () => {
    // Legacy behaviour: cooldown is keyed per alert, not global, so a new
    // problem is announced without waiting out the previous one's timer.
    let now = 1_000_000;
    Date.now = () => now;

    const p = new AudioCuePlayer();
    p.play(KNEE_CAVE);
    now += 50;
    p.play(NECK);

    assert.equal(FakeAudio.playCalls.length, 2);
  });

  test("an unmapped alert is a silent no-op, not a crash", () => {
    const p = new AudioCuePlayer();
    assert.doesNotThrow(() => p.play("some error nobody mapped"));
    assert.equal(FakeAudio.playCalls.length, 0);
  });

  test("reuses one Audio element per file instead of allocating per cue", () => {
    // A fresh Audio object per frame is GC churn inside the live loop.
    let now = 1_000_000;
    Date.now = () => now;

    const p = new AudioCuePlayer();
    p.play(KNEE_CAVE);
    now += 5000;
    p.play(KNEE_CAVE);

    assert.equal(FakeAudio.playCalls.length, 2, "second cue did not play");
    assert.equal(FakeAudio.plays.length, 1, "allocated a second Audio element for the same file");
  });
});

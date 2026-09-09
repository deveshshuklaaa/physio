/**
 * Phase G — pose interpolation in the paint loop.
 *
 * Inference measured at ~85ms/frame on this hardware (GPU delegate confirmed
 * active, 640x480, frame handoff ruled out) — an ~11fps ceiling that no config
 * knob moves. Holding each pose static across the ~7 paint ticks between
 * inferences is therefore visibly steppy even though nothing is wrong.
 *
 * So the painter eases from the previously displayed pose toward the newest
 * one across the gap: 60fps of visual motion out of 11fps of data. This is a
 * RENDER-ONLY change — angles, rules, reps and the WS evidence stream all keep
 * running on the exact landmarks the worker produced, never on an interpolated
 * value. Nothing clinical is computed from these points.
 *
 * The properties that matter and are easy to get wrong:
 *   - keys come and go (buildPts drops landmarks under the visibility floor),
 *     so a naive lerp over Object.keys(from) either throws or resurrects limbs
 *     that the model stopped seeing;
 *   - alerts must NOT ease in — red is a safety signal and switches instantly;
 *   - the very first pose has nothing to ease from and must appear immediately.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { makePainter, STALE_POSE_MS } from "../src/lib/session_orchestrator.js";

function setup({ startAt = 1000, interpolate = true } = {}) {
  const drawn = [];
  let clock = startAt;
  const painter = makePainter({
    ctx: { save() {}, restore() {}, scale() {}, drawImage() {} },
    videoEl: {},
    canvasEl: { width: 640, height: 480 },
    draw: (_ctx, pts, alerts) => drawn.push({ pts, alerts }),
    now: () => clock,
    interpolate,
  });
  return { painter, drawn, tick: (ms) => { clock += ms; } };
}

/** Drive one pose->pose transition with a known 90ms gap between poses. */
function twoPoses(painter, tick, a, b, gap = 90) {
  painter.setPose(a, []);
  painter.paint();
  tick(gap);
  painter.setPose(b, []);
}

describe("makePainter — interpolation between poses", () => {
  test("the first pose appears immediately, with nothing to ease from", () => {
    const { painter, drawn } = setup();
    painter.setPose({ nose: [100, 100] }, []);
    painter.paint();
    assert.deepEqual(drawn.at(-1).pts.nose, [100, 100]);
  });

  test("mid-gap, the drawn point sits BETWEEN the two poses", () => {
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [100, 200] });

    tick(45); // half of the observed 90ms gap
    painter.paint();

    const [x, y] = drawn.at(-1).pts.nose;
    assert.ok(x > 10 && x < 90, `x eased, got ${x}`);
    assert.ok(y > 20 && y < 180, `y eased, got ${y}`);
  });

  test("successive paints move monotonically toward the target", () => {
    // The actual anti-stepping property: every frame differs from the last.
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [100, 0] });

    const xs = [];
    for (let i = 0; i < 5; i++) {
      tick(15);
      painter.paint();
      xs.push(drawn.at(-1).pts.nose[0]);
    }

    for (let i = 1; i < xs.length; i++) {
      assert.ok(xs[i] >= xs[i - 1], `x went backwards: ${xs}`);
    }
    assert.ok(new Set(xs).size > 1, `all frames identical — still stepping: ${xs}`);
  });

  test("the target is reached, not overshot, once the gap has elapsed", () => {
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [100, 100] });

    tick(500); // well past the gap
    painter.paint();
    assert.deepEqual(drawn.at(-1).pts.nose, [100, 100]);
  });

  test("a landmark that only the NEW pose has appears at its true position", () => {
    // buildPts drops anything under the visibility floor, so keys come and go.
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [10, 0], left_wrist: [50, 60] });

    tick(45);
    painter.paint();
    assert.deepEqual(drawn.at(-1).pts.left_wrist, [50, 60], "no phantom origin to ease from");
  });

  test("a landmark the model STOPPED seeing is dropped, not left hanging", () => {
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0], left_wrist: [50, 60] }, { nose: [10, 0] });

    tick(45);
    painter.paint();
    assert.equal("left_wrist" in drawn.at(-1).pts, false);
  });

  test("alerts switch instantly — red never eases in", () => {
    const { painter, drawn, tick } = setup();
    painter.setPose({ nose: [0, 0] }, []);
    painter.paint();
    tick(90);
    painter.setPose({ nose: [100, 0] }, ["caving"]);
    tick(5); // barely into the gap, pose is still mostly the old one
    painter.paint();
    assert.deepEqual(drawn.at(-1).alerts, ["caving"], "alert must not wait for the ease to finish");
  });

  test("interpolate:false restores the plain held-pose behaviour", () => {
    const { painter, drawn, tick } = setup({ interpolate: false });
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [100, 0] });
    tick(45);
    painter.paint();
    assert.deepEqual(drawn.at(-1).pts.nose, [100, 0], "no easing when switched off");
  });

  test("staleness still applies — an eased pose expires like any other", () => {
    const { painter, drawn, tick } = setup();
    painter.setPose({ nose: [0, 0] }, []);
    painter.paint();
    tick(STALE_POSE_MS + 1);
    painter.paint();
    assert.equal(painter.hasPose(), false);
    assert.equal(drawn.length, 1);
  });

  test("a null result clears the ease instead of coasting to a dead target", () => {
    const { painter, drawn, tick } = setup();
    twoPoses(painter, tick, { nose: [0, 0] }, { nose: [100, 0] });
    painter.setPose(null, []);
    tick(15);
    painter.paint();
    assert.equal(drawn.length, 1, "only the very first paint drew anything");
  });

  test("an unrealistically long stall does not produce a crawling ease", () => {
    // If the gap is taken as the ease duration unclamped, one slow frame makes
    // the skeleton drift in slow motion for seconds afterwards.
    const { painter, drawn, tick } = setup();
    painter.setPose({ nose: [0, 0] }, []);
    painter.paint();
    tick(4000); // a 4s stall
    painter.setPose({ nose: [100, 0] }, []);
    tick(200);
    painter.paint();
    assert.deepEqual(drawn.at(-1).pts.nose, [100, 0], "ease duration must be clamped");
  });
});

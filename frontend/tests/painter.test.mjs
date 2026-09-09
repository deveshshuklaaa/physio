/**
 * Phase G — the live paint loop (G6/G7).
 *
 * These exist because of a bug the G6-G10 gate could not see. The gate asserts
 * the canvas is non-blank and that its pixels CHANGE across a 600ms gap — and
 * the mirrored video satisfies both of those on its own. So a skeleton that is
 * drawn and then immediately erased passes every check while being invisible to
 * the person in front of the camera.
 *
 * That is exactly what happened: video repainted at rAF rate (~60fps), poses
 * arrived at inference rate (~10fps), and each skeleton was wiped by the next
 * bare-video tick ~16ms later. Observed on a real run: 40 poses against ~173
 * paint ticks.
 *
 * The property pinned here is therefore NOT "drawSkeleton was called" — the old
 * broken code called it too. It is "the skeleton is present on EVERY painted
 * frame between poses", which is the thing the eye actually needs.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { makePainter, STALE_POSE_MS } from "../src/lib/session_orchestrator.js";

/** Records the order of draw operations so "video then skeleton" is checkable. */
function fakeCtx(log) {
  return {
    save: () => log.push("save"),
    restore: () => log.push("restore"),
    scale: (x) => log.push(`scale:${x}`),
    drawImage: () => log.push("video"),
  };
}

function setup({ startAt = 1000 } = {}) {
  const log = [];
  let clock = startAt;
  const painter = makePainter({
    ctx: fakeCtx(log),
    videoEl: {},
    canvasEl: { width: 640, height: 480 },
    draw: (_ctx, pts, alerts) => log.push(`skeleton:${pts.tag}:${alerts?.length ?? 0}`),
    now: () => clock,
  });
  return { painter, log, tick: (ms) => { clock += ms; } };
}

describe("makePainter — the skeleton survives the ticks between poses", () => {
  test("a held pose is redrawn on EVERY paint, not just the one that delivered it", () => {
    // The regression. Six rAF ticks at ~16ms against a single pose: the old
    // code painted the skeleton once and bare video five times.
    const { painter, log, tick } = setup();
    painter.setPose({ tag: "p1" }, []);

    for (let i = 0; i < 6; i++) {
      painter.paint();
      tick(16);
    }

    const skeletons = log.filter((e) => e.startsWith("skeleton:")).length;
    assert.equal(skeletons, 6, "every painted frame must carry the skeleton");
    assert.equal(log.filter((e) => e === "video").length, 6);
  });

  test("skeleton is drawn AFTER the video, or the video covers it", () => {
    const { painter, log } = setup();
    painter.setPose({ tag: "p1" }, []);
    painter.paint();
    assert.ok(log.indexOf("video") < log.indexOf("skeleton:p1:0"));
  });

  test("the skeleton is drawn OUTSIDE the mirror transform", () => {
    // pts already come from a mirrored frame (grabCtx flips before the worker
    // sees it). Drawing them inside the ctx.scale(-1,1) would mirror them a
    // second time and put the skeleton on the wrong side of the body — the
    // failure a headless pixel count cannot detect.
    const { painter, log } = setup();
    painter.setPose({ tag: "p1" }, []);
    painter.paint();
    assert.ok(log.indexOf("restore") < log.indexOf("skeleton:p1:0"));
  });

  test("a newer pose replaces the held one", () => {
    const { painter, log } = setup();
    painter.setPose({ tag: "old" }, []);
    painter.paint();
    painter.setPose({ tag: "new" }, []);
    painter.paint();
    assert.deepEqual(log.filter((e) => e.startsWith("skeleton:")), ["skeleton:old:0", "skeleton:new:0"]);
  });

  test("alerts ride along with the held pose, so red persists between frames", () => {
    // Otherwise a flagged pose flashes red for one frame and reverts to green.
    const { painter, log } = setup();
    painter.setPose({ tag: "p1" }, ["caving"]);
    painter.paint();
    painter.paint();
    assert.deepEqual(log.filter((e) => e.startsWith("skeleton:")), ["skeleton:p1:1", "skeleton:p1:1"]);
  });

  test("a stale pose is dropped rather than frozen on screen", () => {
    // Patient walks out of frame: the last good skeleton must not hang there.
    const { painter, log, tick } = setup();
    painter.setPose({ tag: "p1" }, []);
    painter.paint();
    tick(STALE_POSE_MS + 1);
    painter.paint();
    assert.equal(log.filter((e) => e.startsWith("skeleton:")).length, 1);
    assert.equal(painter.hasPose(), false);
    assert.equal(log.filter((e) => e === "video").length, 2, "video keeps painting after the pose expires");
  });

  test("a pose exactly at the staleness bound is still drawn", () => {
    const { painter, log, tick } = setup();
    painter.setPose({ tag: "p1" }, []);
    tick(STALE_POSE_MS); // `>` not `>=`
    painter.paint();
    assert.equal(log.filter((e) => e.startsWith("skeleton:")).length, 1);
  });

  test("no pose yet — paints video, draws nothing, throws nothing", () => {
    const { painter, log } = setup();
    painter.paint();
    assert.deepEqual(log.filter((e) => e.startsWith("skeleton:")), []);
    assert.equal(log.filter((e) => e === "video").length, 1);
  });

  test("a null pts result clears the skeleton instead of holding a stale one", () => {
    const { painter, log } = setup();
    painter.setPose({ tag: "p1" }, []);
    painter.setPose(null, []);
    painter.paint();
    assert.deepEqual(log.filter((e) => e.startsWith("skeleton:")), []);
  });
});

/**
 * Phase G — transport and observability: ring_buffer.js (G4), ws/client.js (G9),
 * logger.js (G14).
 *
 * These exist because §3.1 identifies an unbounded send queue as the SECOND
 * most common source of the lag this whole plan was written to remove: frames
 * pile up faster than the socket drains them, and feedback arrives for a pose
 * the patient held two seconds ago. It reads as lag but is actually backlog.
 * The defence is that every buffer is bounded and overflow DROPS rather than
 * grows — so that property gets pinned here.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { RingBuffer } from "../src/lib/ring_buffer.js";
import { BrowserLogger } from "../src/lib/logger.js";
import { SessionWsClient } from "../src/ws/client.js";
import { FakeWebSocket } from "./helpers.mjs";

describe("RingBuffer — bounded, overwrite-oldest, counts what it lost", () => {
  test("holds up to capacity without dropping", () => {
    const rb = new RingBuffer(3);
    rb.push("a");
    rb.push("b");
    rb.push("c");
    assert.equal(rb.length, 3);
    assert.equal(rb.dropped, 0);
    assert.deepEqual(rb.toArray(), ["a", "b", "c"]);
  });

  test("overflow overwrites the OLDEST and increments dropped", () => {
    // Newest-wins is the whole point in a live loop: a stale pose is worthless,
    // a fresh one is not. Dropping the newest would invert that.
    const rb = new RingBuffer(3);
    for (const x of ["a", "b", "c", "d", "e"]) rb.push(x);
    assert.equal(rb.length, 3);
    assert.equal(rb.dropped, 2);
    assert.deepEqual(rb.toArray(), ["c", "d", "e"]);
  });

  test("drain empties the buffer and returns insertion order", () => {
    const rb = new RingBuffer(4);
    rb.push(1);
    rb.push(2);
    assert.deepEqual(rb.drain(), [1, 2]);
    assert.equal(rb.length, 0);
    assert.deepEqual(rb.drain(), []);
  });

  test("dropped is cumulative across drains — it is a session counter, not a gauge", () => {
    const rb = new RingBuffer(2);
    for (const x of [1, 2, 3]) rb.push(x); // 1 dropped
    rb.drain();
    for (const x of [4, 5, 6]) rb.push(x); // 1 more
    assert.equal(rb.dropped, 2);
  });
});

describe("BrowserLogger — closed vocabulary, correlation identity, dual clocks", () => {
  let log;
  beforeEach(() => {
    log = new BrowserLogger({ sessionId: "s_test", component: "pose_worker" });
  });

  test("emits a line for a known event", () => {
    const line = log.info("frame_dropped", { reason: "inference_in_flight" });
    assert.ok(line, "no line returned for a valid event");
    assert.equal(line.event, "frame_dropped");
    assert.equal(line.component, "pose_worker");
    assert.equal(line.reason, "inference_in_flight");
  });

  test("REJECTS an unknown event name", () => {
    // The vocabulary is closed (§8b.3). A typo'd name still writes a
    // plausible-looking line while silently breaking every query written
    // against the real event — so it must not be emitted at all.
    assert.equal(log.info("frame_droped"), undefined);
    assert.equal(log.info("totally_made_up_event"), undefined);
    assert.deepEqual(log.drain(), [], "a rejected event still reached the buffer");
  });

  test("carries the full correlation identity on every line", () => {
    const line = log.warn("frame_dropped");
    for (const field of [
      "ts_wall", "ts_mono", "seq", "session_id", "trace_id",
      "span_id", "parent_span_id", "component", "event", "level",
    ]) {
      assert.ok(field in line, `missing correlation field: ${field}`);
    }
  });

  test("logs BOTH clocks, and they are different kinds of number", () => {
    // §8b.1: wall time can jump (NTP, DST, suspend); durations must come from
    // the monotonic reading. Keeping both is the point.
    const line = log.info("worker_ready");
    assert.match(line.ts_wall, /^\d{4}-\d{2}-\d{2}T/, "ts_wall is not ISO-8601");
    assert.equal(typeof line.ts_mono, "number");
  });

  test("seq increments monotonically per component", () => {
    const a = log.info("frame_dropped");
    const b = log.info("frame_dropped");
    const c = log.info("frame_dropped");
    assert.deepEqual([b.seq - a.seq, c.seq - b.seq], [1, 1]);
  });

  test("level filtering suppresses DEBUG at INFO", () => {
    assert.equal(log.debug("frame_received"), undefined);
    log.setLevel("DEBUG");
    assert.ok(log.debug("frame_received"), "DEBUG suppressed after setLevel('DEBUG')");
  });

  test("drain hands lines off and empties, so shipping never re-sends", () => {
    log.info("frame_dropped");
    log.info("flag_raised");
    assert.equal(log.drain().length, 2);
    assert.deepEqual(log.drain(), []);
  });

  test("the log buffer itself is bounded — logging cannot become the leak", () => {
    // §8b.6: a logger that grows without limit in a live loop is the same
    // latency leak as an unbounded send queue, with extra steps.
    const small = new BrowserLogger({ sessionId: "s", component: "ws", capacity: 5 });
    for (let i = 0; i < 20; i++) small.info("batch_sent", { i });
    assert.equal(small.drain().length, 5);
    assert.ok(small.droppedCount >= 15, "dropped log lines were not counted");
  });
});

describe("SessionWsClient — one socket, batched, bounded", () => {
  let client;
  const opened = [];
  beforeEach(() => {
    globalThis.WebSocket = FakeWebSocket;
    globalThis.WebSocket.OPEN = 1;
    client = new SessionWsClient("ws://localhost:8000/ws/session/test");
    client.connect();
    FakeWebSocket.last.emit("open");
    // G2-B5: connect() now sends an {"type":"auth"} frame as the first
    // message on open. Clear it here so the rest of this suite -- written
    // before auth existed -- can keep asserting on pose_batch/end traffic
    // without every test re-deriving "skip index 0".
    FakeWebSocket.last.sent.length = 0;
    opened.push(client);
  });
  afterEach(() => {
    // connect() starts a 500ms setInterval for _flush. Nothing clears it but
    // close(), so an unclosed client keeps the Node event loop alive and the
    // test run never exits.
    while (opened.length) opened.pop().close();
  });

  test("frames are batched — many poses become ONE message", () => {
    // §3.2 R5: ~500ms of frames per message, cutting message count ~15x. The
    // patient notices nothing because nothing in the feedback loop depends on
    // this socket; it carries evidence, not feedback.
    for (let i = 0; i < 10; i++) client.sendPose({ ts: i, landmarks: [] });
    assert.equal(FakeWebSocket.last.sent.length, 0, "sendPose sent immediately instead of batching");

    client._flush();
    assert.equal(FakeWebSocket.last.sent.length, 1);
    const msg = FakeWebSocket.last.sentJson[0];
    assert.equal(msg.type, "pose_batch");
    assert.equal(msg.frames.length, 10);
  });

  test("flushing an empty buffer sends nothing", () => {
    client._flush();
    assert.equal(FakeWebSocket.last.sent.length, 0);
  });

  test("outbound buffer is BOUNDED — overflow drops oldest, never grows", () => {
    // The failure this prevents: unbounded growth means feedback for a pose
    // held seconds ago. Bounded + drop keeps latency finite under any load.
    for (let i = 0; i < 500; i++) client.sendPose({ ts: i });
    assert.ok(client._outbound.dropped > 0, "buffer grew instead of dropping");
    assert.ok(client._outbound.length <= client._outbound.capacity);

    client._flush();
    const frames = FakeWebSocket.last.sentJson[0].frames;
    assert.ok(frames.length <= 200, `flushed ${frames.length} frames from a 200-slot buffer`);
    // Newest survived, oldest was discarded.
    assert.equal(frames.at(-1).ts, 499);
  });

  test("sendEnd flushes pending frames before the end marker", () => {
    // Losing the tail of a session to an unflushed buffer would silently
    // truncate the evidence the whole post-session report is built from.
    client.sendPose({ ts: 1 });
    client.sendEnd();
    const types = FakeWebSocket.last.sentJson.map((m) => m.type);
    assert.deepEqual(types, ["pose_batch", "end"]);
  });

  test("sending before the socket opens does not throw or lose the frame", () => {
    const c2 = new SessionWsClient("ws://localhost:8000/ws/session/x");
    assert.doesNotThrow(() => c2.sendPose({ ts: 1 }));
    assert.equal(c2._outbound.length, 1, "frame was dropped before connect");
  });

  test("sends an auth frame with the stored token as the FIRST message on open", () => {
    // G2-B5/D3: the server closes the socket 4401 if anything else arrives
    // first, so this ordering is load-bearing, not cosmetic.
    const prevLS = globalThis.localStorage;
    globalThis.localStorage = { getItem: () => "jwt-under-test" };
    try {
      const c4 = new SessionWsClient("ws://localhost:8000/ws/session/z");
      c4.connect();
      FakeWebSocket.last.emit("open");
      opened.push(c4);

      assert.equal(FakeWebSocket.last.sent.length, 1, "expected exactly one frame right after open");
      assert.deepEqual(FakeWebSocket.last.sentJson[0], { type: "auth", token: "jwt-under-test" });
    } finally {
      globalThis.localStorage = prevLS;
    }
  });

  test("missing localStorage still sends an auth frame (with a null token), never throws", () => {
    const c5 = new SessionWsClient("ws://localhost:8000/ws/session/w");
    assert.doesNotThrow(() => {
      c5.connect();
      FakeWebSocket.last.emit("open");
    });
    opened.push(c5);
    assert.equal(FakeWebSocket.last.sentJson[0].type, "auth");
  });

  test("ships buffered logs alongside the pose batch", () => {
    // §8b: browser and server logs must land in one stream under one
    // correlation id, or you are debugging two systems instead of one.
    const logger = new BrowserLogger({ sessionId: "s_1", component: "pose_worker" });
    const c3 = new SessionWsClient("ws://localhost:8000/ws/session/y", { logger });
    c3.connect();
    FakeWebSocket.last.emit("open");
    // G2-B5: connect() now sends an {"type":"auth"} frame as the first
    // message on open. Clear it here so the rest of this suite -- written
    // before auth existed -- can keep asserting on pose_batch/end traffic
    // without every test re-deriving "skip index 0".
    FakeWebSocket.last.sent.length = 0;

    logger.info("frame_dropped", { reason: "inference_in_flight" });
    c3.sendPose({ ts: 1 });
    c3._flush();
    opened.push(c3);

    const msg = FakeWebSocket.last.sentJson[0];
    assert.ok(Array.isArray(msg.logs));
    assert.ok(msg.logs.some((l) => l.event === "frame_dropped"), "log line was not shipped with the batch");
  });
});

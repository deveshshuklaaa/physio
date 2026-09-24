/**
 * pose_worker.js — G5 (HIGH EFFORT — isolation boundary, see
 * docs/09_live_frontend.md). Web Worker: owns MediaPipe Tasks Vision
 * inference, smoothing, angle math (pose_engine.js) and rule evaluation.
 * Posts results back to the main thread.
 *
 * ISOLATION CONTRACT (§3.2 R11, §6): this worker NEVER touches the camera
 * MediaStream and NEVER imports or references recorder.js — it only ever
 * sees ImageBitmaps handed to it one at a time. A hang/crash here cannot
 * block or corrupt recording, which runs entirely on the main thread against
 * the raw stream via a separate MediaRecorder (lib/recorder.js).
 *
 * §3.2 R2: `inFlight` is a SINGLE BOOLEAN, not a queue. A frame that arrives
 * while busy is dropped and counted — never buffered. A dropped frame costs
 * nothing (the next real-time frame supersedes it); a queued frame is pure
 * added latency, the thing this whole worker exists to eliminate.
 *
 * MediaPipe assets are vendored locally (../assets/vendor/mediapipe/) — no
 * runtime CDN fetch.
 *
 * Main thread contract:
 *   worker.postMessage({ type: "init", exerciseConfig, sessionId, smootherKind })
 *   worker.postMessage({ type: "frame", bitmap, ts, w, h }, [bitmap])  // per captured frame
 *   worker.postMessage({ type: "reset" })                             // 'r' key equivalent
 *   worker.postMessage({ type: "drain_logs" })                        // pull buffered logs for the WS batch
 *   worker.postMessage({ type: "close" })
 *
 * Messages posted back:
 *   { type: "ready" }
 *   { type: "result", ts, inferenceMs, view, alerts, jointAngles, driverAngle,
 *     stage, repCount, cleanReps, repWasClean, repFailReason, pts }
 *   { type: "dropped", ts, droppedCount }
 *   { type: "no_pose", ts }
 *   { type: "error", message }
 *   { type: "logs", logs }
 *
 * VERIFIED against real headless Chrome — see tools/g5_worker_test/ and
 * docs/09_live_frontend.md's "G5" section for the real run output and a
 * real browser-compatibility finding this test surfaced (see next
 * paragraph). The pose_engine.js state machine it drives is separately
 * verified via tools/pose_engine_selfcheck.mjs and tools/parity_check.mjs.
 *
 * CLASSIC WORKER, NOT `{type:"module"}` (deviation, found via testing, not
 * a design preference): the vendored `vision_bundle.mjs` calls
 * `self.importScripts(...)` internally while loading its WASM glue.
 * `importScripts` throws ("Module scripts don't support importScripts()")
 * inside a worker created with `{type:"module"}`. Confirmed by direct
 * repro. Fix: this worker is instantiated as a plain classic Worker (main
 * thread must NOT pass `{type:"module"}`), and BOTH the MediaPipe bundle
 * and this file's own sibling modules are loaded via dynamic `import()`
 * (spec-legal in a classic worker in current engines) instead of static
 * top-level `import` declarations, which classic scripts cannot parse.
 */
// `import.meta.url` is module-only; this is now a classic worker (see
// header), so resolve relative to `self.location` instead.
const WASM_BASE_URL = new URL("../assets/vendor/mediapipe/wasm/", self.location.href).href;
const MODEL_URL = new URL("../assets/vendor/mediapipe/models/pose_landmarker_lite.task", self.location.href).href;

let PoseEngine, buildPts, createSmoother, BrowserLogger, OneEuroSmoother, MP_CONFIDENCE, DISPLAY_FILTER;
let landmarker = null;
let engine = null;
let smoother = null;
let displaySmoother = null;
let logger = null;
let inFlight = false; // THE single boolean guard — see file header. Do not change shape.
let droppedCount = 0;
let frameSeq = 0;
let lastDetectTsMs = 0; // worker-local monotonic clock for detectForVideo (see handleFrame)
const FRAME_RECEIVED_SAMPLE_N = 5; // §8b.6: sample high-frequency events, never sample anomalies

async function init({ exerciseConfig, sessionId, smootherKind, smootherOpts }) {
  ({ PoseEngine, buildPts } = await import("../lib/pose_engine.js"));
  ({ createSmoother, OneEuroSmoother } = await import("../lib/smoother.js"));
  ({ BrowserLogger } = await import("../lib/logger.js"));
  ({ MP_CONFIDENCE, DISPLAY_FILTER } = await import("../lib/live_tuning.js"));

  logger = new BrowserLogger({ sessionId, component: "pose_worker" });

  const { FilesetResolver, PoseLandmarker } = await import(
    /* webpackIgnore: true */ "../assets/vendor/mediapipe/vision_bundle.mjs"
  );
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: MP_CONFIDENCE,
    minPosePresenceConfidence: MP_CONFIDENCE,
    minTrackingConfidence: MP_CONFIDENCE,
  });
  smoother = createSmoother(smootherKind || "ema", smootherOpts ||{});
  // Display-only smoother: the painted skeleton. Rule math keeps `smoother` (EMA).
  displaySmoother = new OneEuroSmoother(DISPLAY_FILTER);
  engine = new PoseEngine(exerciseConfig, smoother);

  logger.info("worker_ready", { exercise: exerciseConfig.name, model: "pose_landmarker_lite", delegate: "CPU", mp_confidence: MP_CONFIDENCE });
  postMessage({ type: "ready" });
}

async function handleFrame(msg) {
  const { bitmap, ts, w, h } = msg;
  if (!landmarker || !engine) {
    bitmap.close?.();
    return;
  }
  if (inFlight) {
    // Drop, don't queue. This is the whole point of G5.
    droppedCount++;
    bitmap.close?.();
    logger?.warn("frame_dropped", { reason: "inference_in_flight", dropped_total: droppedCount });
    postMessage({ type: "dropped", ts, droppedCount });
    return;
  }
  inFlight = true;
  frameSeq++;
  if (frameSeq % FRAME_RECEIVED_SAMPLE_N === 0) {
    logger?.debug("frame_received", { frame_seq: frameSeq });
  }

  const t0 = performance.now();
  try {
    // detectForVideo needs a monotonically increasing ts in ms; frameSeq
    // guarantees strictly increasing even if two frames share a wall-clock ms.
    const tsMs = Math.max(Math.trunc(performance.now()), lastDetectTsMs + 1);
    lastDetectTsMs = tsMs;
    const result = landmarker.detectForVideo(bitmap, tsMs);
    const inferenceMs = performance.now() - t0;
    logger.debug("inference_completed", { inference_ms: inferenceMs });

    if (!result.landmarks || result.landmarks.length === 0) {
      // D3 step 9: no pose this frame -> alerts force-reset, state machines
      // NOT advanced, prior joint_angles/driver_angle retained for display only.
      postMessage({ type: "no_pose", ts, inferenceMs });
      return;
    }

    const raw = result.landmarks[0]; // single-person, numPoses:1
    const out = engine.processFrame(raw, w, h, tsMs);
    // Renderer gets its own One-Euro pass. The old line re-ran the rule-math
    // EMA a second time per frame, advancing its state twice.
    const pts = buildPts(raw, w, h, displaySmoother, tsMs / 1000);

    // Decision inputs, not just outcomes (§8b.4): angle + threshold source is
    // implicit in exerciseConfig (logged once at worker_ready); log the
    // computed values here, at INFO for flags, DEBUG for the full angle set.
    for (const alert of out.alerts) {
      logger.info("flag_raised", { alert, view: out.view, driver_angle: out.driverAngle });
    }
    if (out.repRejected) logger.info("rep_rejected", out.repRejected);
    logger.debug("rule_evaluated", { view: out.view, joint_angles: out.jointAngles });

    postMessage({
      type: "result",
      ts,
      inferenceMs,
      view: out.view,
      alerts: out.alerts,
      jointAngles: out.jointAngles,
      driverAngle: out.driverAngle,
      stage: out.stage,
      repCount: out.repCount,
      cleanReps: out.cleanReps,
      repWasClean: out.repWasClean,
      repFailReason: out.repFailReason,
      repEntry: out.repEntry,
      pts,
      evidencePts: out.pts, // EMA rule-math points: what the WS records as evidence
    });
  } catch (err) {
    logger?.error("worker_died", { error_type: err?.name, error_message: String(err?.message || err), stack: err?.stack });
    postMessage({ type: "error", message: String(err && err.message || err), ts });
  } finally {
    inFlight = false;
    bitmap.close?.();
  }
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case "init":
        await init(msg);
        break;
      case "frame":
        await handleFrame(msg);
        break;
      case "reset":
        smoother?.reset();
        displaySmoother?.reset();
        if (engine) {
          const cfg = engine.config;
          engine = new PoseEngine(cfg, smoother);
        }
        break;
      case "drain_logs":
        postMessage({ type: "logs", logs: logger ? logger.drain() : [] });
        break;
      case "close":
        landmarker?.close?.();
        landmarker = null;
        break;
      default:
        break;
    }
  } catch (err) {
    logger?.error("worker_died", { error_type: err?.name, error_message: String(err?.message || err), stack: err?.stack });
    postMessage({ type: "error", message: String(err && err.message || err) });
  }
};

// Uncaught errors inside the worker must not vanish silently — this is the
// "worker dies" case G13's recording-survives test targets.
self.onerror = (event) => {
  logger?.error("worker_died", { error_type: "uncaught", error_message: event.message });
  postMessage({ type: "error", message: event.message });
};

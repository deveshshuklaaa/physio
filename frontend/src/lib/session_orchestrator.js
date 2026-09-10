/**
 * session_orchestrator.js — main-thread glue tying together G5/G7/G8/G9/G12/G13.
 * Owned here (lib/**) because it is new non-trivial logic, not markup —
 * frontend/src/pages/live_session.html (owned by another agent, DO NOT
 * TOUCH) is expected to `import { startLiveSession } from
 * "../lib/session_orchestrator.js"` and call it once the DOM contract ids
 * below exist. This file does no inference and no angle/rule math itself
 * (§5 G6) — it only captures frames, feeds the worker, draws what the
 * worker returns, and updates the DOM/audio/WS.
 *
 * DOM CONTRACT (must already exist in live_session.html, per the plan):
 *   #rep-total, #rep-correct, #feedback-banner, #feedback-text,
 *   #emg-card, #end-session-btn, #dev-overlay
 *   dev-overlay value spans (G10): #ov-capture-fps, #ov-inference-fps,
 *   #ov-dropped, #ov-latency, #ov-ws-queue
 * Additional selectors THIS file needs that were NOT in the original list —
 * flagged in docs/09_live_frontend.md as "required selectors", not added
 * to the HTML by this agent:
 *   a <video> element to host the camera stream, and a <canvas> to draw
 *   the mirrored video + skeleton overlay onto (constructor takes them as
 *   explicit args so the HTML owner can wire up whatever ids they choose).
 *
 * ISOLATION (G12/G13, see lib/recorder.js's header for the full argument):
 *   1. getUserMedia() once.
 *   2. IsolatedRecorder.start() on the raw stream — BEFORE the worker spins up.
 *   3. Worker created + "init" posted.
 *   4. Per-frame capture loop feeds the worker; recorder is untouched by it.
 *   5. On end-session (or worker death): worker torn down FIRST is wrong —
 *      per spec, recording stops AFTER the worker tears down, so teardown
 *      order here is: stop capture loop -> close worker -> recorder.stop().
 */
import { IsolatedRecorder, uploadRecording } from "./recorder.js";
import { buildSummaryPayload, summaryDisagrees } from "./summary.js";
import { AudioCuePlayer } from "./audio_cues.js";
import { SessionWsClient } from "../ws/client.js";
import { drawSkeleton } from "../render/skeleton.js";
import { BrowserLogger } from "./logger.js";

const FEEDBACK_UNAVAILABLE_TEXT = "Feedback unavailable — session still recording.";

/**
 * Video repaints at rAF rate (~60fps); poses arrive at inference rate (~10fps).
 * Painting the video alone on the ticks in between ERASES the skeleton — it
 * survives ~16ms out of every ~100ms, which reads as "no skeleton" to the eye
 * even though drawSkeleton ran. So the last pose is held and redrawn on every
 * tick until a newer one replaces it. A pose older than STALE_POSE_MS is
 * dropped rather than left frozen on screen after the patient walks away.
 *
 * Exported for test: the bug is a relationship between two paint paths, and a
 * closure has no seam to assert against.
 */
export const STALE_POSE_MS = 500;

/**
 * Longest gap we will ease across. Inference sits near 85ms here, but one
 * stalled frame must not leave the skeleton crawling in slow motion for
 * seconds — past this, snap instead.
 */
export const MAX_EASE_MS = 200;

/** Linear blend of two pixel-space `pts` dicts (see buildPts).
 *
 * Keys are not stable between frames: buildPts omits any landmark under the
 * visibility floor. A landmark only the target has appears at its true
 * position (there is no honest origin to ease it from), and one that has
 * disappeared is dropped rather than left hanging where it was last seen.
 */
function lerpPts(from, to, t) {
  const out = {};
  for (const name of Object.keys(to)) {
    const b = to[name];
    const a = from && from[name];
    out[name] = a
      ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      : b;
  }
  return out;
}

export function makePainter({
  ctx,
  videoEl,
  canvasEl,
  draw = drawSkeleton,
  now = () => performance.now(),
  interpolate = true,
}) {
  let pose = null; // { pts, alerts, at } — the newest worker output
  let from = null; // what was last DISPLAYED, the origin of the current ease
  let easeMs = 0; // measured gap between the last two poses

  return {
    setPose(pts, alerts) {
      if (!pts) {
        pose = null;
        from = null;
        return;
      }
      const t = now();
      // Ease out of whatever is currently on screen, not out of the previous
      // worker output — otherwise an interrupted ease jumps back to its origin.
      easeMs = pose ? Math.min(t - pose.at, MAX_EASE_MS) : 0;
      from = pose ? displayedPts(t) : null;
      pose = { pts, alerts, at: t };
    },
    clearPose() {
      pose = null;
      from = null;
    },
    hasPose() {
      return pose != null;
    },
    /** One full frame: mirrored video, then the skeleton on top. */
    paint() {
      const w = canvasEl.width, h = canvasEl.height;
      ctx.save();
      ctx.scale(-1, 1); // mirror, matching legacy cv2.flip(frame, 1)
      ctx.drawImage(videoEl, -w, 0, w, h);
      ctx.restore();

      const t = now();
      if (pose && t - pose.at > STALE_POSE_MS) {
        pose = null;
        from = null;
      }
      // Alerts are never eased — red is a safety signal and switches instantly.
      if (pose) draw(ctx, displayedPts(t), pose.alerts);
    },
  };

  /** Where the skeleton should be drawn right now, part-way through the ease. */
  function displayedPts(t) {
    if (!interpolate || !from || easeMs <= 0) return pose.pts;
    const progress = (t - pose.at) / easeMs;
    if (progress >= 1) return pose.pts;
    return lerpPts(from, pose.pts, progress < 0 ? 0 : progress);
  }
}

/**
 * @param {object} opts
 * @param {HTMLVideoElement} opts.videoEl - hidden/offscreen <video> fed by getUserMedia
 * @param {HTMLCanvasElement} opts.canvasEl - visible canvas to draw video+skeleton onto
 * @param {object} opts.exerciseConfig - one entry from GET /exercises
 * @param {string} opts.sessionId
 * @param {string} opts.wsUrl - ws(s)://.../ws/session/{session_id}
 * @param {string} [opts.apiBase] - REST base for the video upload (F7); omit to skip uploading
 * @param {string} [opts.authToken] - bearer token for that upload
 * @param {string|null} [opts.reportUrl] - where to send the patient after the
 *        session is saved. Defaults to the built report page; pass null to
 *        stay put (the G-phase harnesses drive endSession() directly).
 * @param {Document} [opts.doc] - for testability; defaults to window.document
 */
export async function startLiveSession(opts) {
  const doc = opts.doc || document;
  const logger = new BrowserLogger({ sessionId: opts.sessionId, component: "session_orchestrator" });
  logger.info("session_started", { exercise: opts.exerciseConfig.name });

  const repTotalEl = doc.getElementById("rep-total");
  const repCorrectEl = doc.getElementById("rep-correct");
  const bannerEl = doc.getElementById("feedback-banner");
  const bannerTextEl = doc.getElementById("feedback-text");
  const devOverlayEl = doc.getElementById("dev-overlay");
  const endBtn = doc.getElementById("end-session-btn");
  const ovEls = {
    captureFps: doc.getElementById("ov-capture-fps"),
    inferenceFps: doc.getElementById("ov-inference-fps"),
    dropped: doc.getElementById("ov-dropped"),
    latency: doc.getElementById("ov-latency"),
    wsQueue: doc.getElementById("ov-ws-queue"),
  };

  // G2-E6: with D5's auto-start the camera prompt fires the moment the page
  // loads, so a denial is the first thing a patient sees go wrong. Turn the
  // raw DOMException ("Permission denied") into something a patient can act
  // on -- live_session.html renders err.message straight into the banner.
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  } catch (err) {
    const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
    const missing = err && (err.name === "NotFoundError" || err.name === "OverconstrainedError");
    const msg = denied
      ? "Camera access was blocked. Allow camera access in your browser, then reload this page to start your session."
      : missing
        ? "No camera was found. Connect a camera, then reload this page to start your session."
        : `The camera could not be started (${err && err.name ? err.name : "unknown error"}). Reload the page to try again.`;
    logger.error("session_aborted", { error_type: "camera_unavailable", error_message: String(err && err.name || err) });
    const wrapped = new Error(msg);
    wrapped.code = "camera_unavailable";
    throw wrapped;
  }
  opts.videoEl.srcObject = stream;
  await opts.videoEl.play();

  // --- G12: recording starts BEFORE the worker exists, isolated from it. ---
  const recorder = new IsolatedRecorder(stream, { logger });
  recorder.start();

  let endingPromise = null;

  // Visible progress while the session is being saved. The end sequence does
  // real network work (summary, then a video upload) and used to do it with
  // no feedback at all, which read as a frozen page.
  function onProgress(text) {
    if (bannerEl) bannerEl.style.display = "";
    if (bannerTextEl) bannerTextEl.textContent = text;
    doc.dispatchEvent(new CustomEvent("session:ending", { detail: { text } }));
  }

  // G2-D6/F7 end-of-session payload, accumulated live.
  const repLog = [];
  let lastCounts = { repCount: 0, cleanReps: 0 };

  const ws = new SessionWsClient(opts.wsUrl, {
    logger,
    onMessage: (msg) => handleServerMessage(msg),
  }).connect();

  const audio = new AudioCuePlayer({ logger });

  // Classic worker (NOT {type:"module"}) — required for the vendored
  // MediaPipe bundle to load inside a Worker at all; see pose_worker.js's
  // header comment for the reproduced error and why.
  const worker = new Worker(new URL("../workers/pose_worker.js", import.meta.url));
  let workerAlive = true;
  let workerBusy = false; // producer-side half of the drop-never-queue guard (§3.2 R2):
  // the worker's own `inFlight` boolean is the backstop; this flag stops the
  // capture loop from even posting a frame while the last one is unanswered,
  // so frames never pile up in the worker's message mailbox either.
  let latencySamples = [];
  let lastSentAt = null; // worker doesn't echo custom fields; at most one frame is ever in flight (workerBusy gate), so a single slot suffices
  const ctx = opts.canvasEl.getContext("2d");
  const painter = makePainter({ ctx, videoEl: opts.videoEl, canvasEl: opts.canvasEl });

  // G10 metrics. Counted here because this is the only place that sees both
  // ends of the loop; averaged over the whole session (ponytail: a rolling
  // window is only worth it if someone actually watches for a dip).
  const metrics = { captured: 0, roundTrips: 0, droppedWorker: 0, droppedProducer: 0, startedAt: null };
  const roundTrip = () => {
    workerBusy = false;
    metrics.roundTrips++;
    if (lastSentAt != null) latencySamples.push(performance.now() - lastSentAt);
    lastSentAt = null;
  };

  worker.onmessage = (ev) => {
    const msg = ev.data;
    switch (msg.type) {
      case "ready":
        beginCaptureLoop();
        break;
      case "result":
        roundTrip();
        renderFrame(msg);
        updateCounters(msg);
        handleAlerts(msg.alerts);
        break;
      case "no_pose":
        roundTrip();
        break;
      case "dropped":
        roundTrip();
        metrics.droppedWorker = msg.droppedCount ?? metrics.droppedWorker + 1;
        break;
      case "error":
        roundTrip();
        onWorkerDied(msg.message);
        break;
      default:
        break;
    }
  };
  worker.onerror = (ev) => onWorkerDied(ev.message);

  worker.postMessage({ type: "init", exerciseConfig: opts.exerciseConfig, sessionId: opts.sessionId, smootherOpts: opts.smootherOpts });

  let rafId = null;
  const grabCanvas = doc.createElement("canvas");
  const grabCtx = grabCanvas.getContext("2d", { willReadFrequently: false });

  function beginCaptureLoop() {
    const w = opts.videoEl.videoWidth;
    const h = opts.videoEl.videoHeight;
    grabCanvas.width = w;
    grabCanvas.height = h;
    opts.canvasEl.width = w;
    opts.canvasEl.height = h;
    // Mirror the frame BEFORE it goes to the worker, like legacy's
    // cv2.flip(frame, 1) ahead of pose detection — so the pts that come back
    // line up with the mirrored picture painted below.
    grabCtx.setTransform(-1, 0, 0, 1, w, 0);
    metrics.startedAt = performance.now();
    const loop = async () => {
      if (!workerAlive) return;
      paintVideo();
      if (!workerBusy) {
        grabCtx.drawImage(opts.videoEl, 0, 0, w, h);
        const bitmap = await createImageBitmap(grabCanvas);
        lastSentAt = performance.now();
        workerBusy = true;
        metrics.captured++;
        worker.postMessage({ type: "frame", bitmap, ts: Date.now(), w, h }, [bitmap]);
      } else {
        // producer-side drop — do not queue, just skip this tick, per §3.2 R2.
        metrics.droppedProducer++;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  // The video is painted every capture tick, not only when a result comes
  // back: at ~15fps inference the picture would otherwise visibly stutter,
  // and with no person in frame ("no_pose") it would never paint at all.
  // The painter redraws the held skeleton on top of each of those ticks —
  // without that, the video repaint erases it before the eye can see it.
  function paintVideo() {
    painter.paint();
  }

  function renderFrame(msg) {
    painter.setPose(msg.pts, msg.alerts);
    painter.paint();
    ws.sendPose({ ts: msg.ts, landmarks: msg.pts, alerts: msg.alerts, view: msg.view });
  }

  function updateCounters(msg) {
    if (repTotalEl) repTotalEl.textContent = String(msg.repCount);
    if (repCorrectEl) repCorrectEl.textContent = String(msg.cleanReps);
    lastCounts = { repCount: msg.repCount ?? 0, cleanReps: msg.cleanReps ?? 0 };
    // G2-D6: one entry per completed rep, in the shape POST /session/{id}/summary
    // validates (rep 1..n in order, clean flag, best angle, error names).
    if (msg.repEntry) {
      repLog.push({
        rep: msg.repEntry.rep,
        clean: !!msg.repEntry.clean,
        bestAngle: msg.repEntry.best_angle,
        errors: Array.isArray(msg.repEntry.errors) ? msg.repEntry.errors : [],
      });
    }
  }

  function handleAlerts(alerts) {
    const active = alerts && alerts.length > 0;
    if (bannerEl) bannerEl.style.display = active ? "" : "none";
    if (bannerTextEl) bannerTextEl.textContent = active ? alerts[0] : "";
    if (active) audio.play(alerts[0]);
  }

  function updateDevOverlay() {
    if (!devOverlayEl) return;
    const avg = latencySamples.length
      ? latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length
      : 0;
    devOverlayEl.dataset.latencyMs = avg.toFixed(1);
    const secs = metrics.startedAt ? (performance.now() - metrics.startedAt) / 1000 : 0;
    const fps = (n) => (secs > 0 ? (n / secs).toFixed(1) : "0.0");
    if (ovEls.captureFps) ovEls.captureFps.textContent = fps(metrics.captured);
    if (ovEls.inferenceFps) ovEls.inferenceFps.textContent = fps(metrics.roundTrips);
    if (ovEls.dropped) ovEls.dropped.textContent = String(metrics.droppedWorker + metrics.droppedProducer);
    if (ovEls.latency) ovEls.latency.textContent = `${avg.toFixed(1)}ms`;
    if (ovEls.wsQueue) ovEls.wsQueue.textContent = String(ws.queueDepth());
    if (latencySamples.length > 200) latencySamples = latencySamples.slice(-200);
  }
  // Driven on a timer, not off worker results: with no pose in frame the
  // overlay must still show live capture/queue numbers.
  const overlayTimer = setInterval(updateDevOverlay, 250);

  function handleServerMessage(msg) {
    // Server->client: {type:"flag"} show alert text; {type:"emg"} update chart.
    // The EMG mini-card (#emg-card) charting is out of this file's scope
    // (owner instruction: check emg-service/ for reusable charting first —
    // that is Group J's task, not Phase G's; this orchestrator only exposes
    // the hook another module can attach to).
    if (msg.type === "flag" && bannerTextEl) {
      bannerTextEl.textContent = msg.text || msg.alert || "";
      if (bannerEl) bannerEl.style.display = "";
    }
    doc.dispatchEvent(new CustomEvent("session:server-message", { detail: msg }));
  }

  function onWorkerDied(message) {
    if (!workerAlive) return; // already handled
    workerAlive = false;
    logger.error("worker_died", { error_message: message });
    clearInterval(overlayTimer);
    if (rafId) cancelAnimationFrame(rafId);
    // §13: recording is NOT touched here — it is a separate MediaRecorder on
    // the raw stream and keeps running untouched by this branch.
    if (bannerEl) bannerEl.style.display = "";
    if (bannerTextEl) bannerTextEl.textContent = FEEDBACK_UNAVAILABLE_TEXT;
  }

  async function endSession() {
    if (endingPromise) return endingPromise;   // double-click / disconnect race
    endingPromise = (async () => {
    workerAlive = false;
    clearInterval(overlayTimer);
    if (rafId) cancelAnimationFrame(rafId);
    worker.postMessage({ type: "close" });
    worker.terminate();
    // Recording stops AFTER the worker tears down (G12 ordering contract).
    const blob = await recorder.stop();

    // G2-D6: the summary MUST land before the session is ended. Ending the
    // session is what fires the Gemini report server-side, and a report
    // written before the counts arrive would describe a session of zero
    // reps. This is the only thing that carries repCount/cleanReps/repLog
    // out of the browser -- nothing else posts them.
    if (opts.apiBase && opts.sessionId) {
      onProgress("Saving your session…");
      const summaryPayload = buildSummaryPayload(repLog);
      if (summaryDisagrees(summaryPayload, lastCounts)) {
        // The counters the patient watched and the per-rep log disagree, so
        // rep entries were lost between the worker and here. Say so loudly:
        // the report is about to describe a different session than the one
        // that happened.
        logger.error("session_aborted", {
          error_type: "rep_log_mismatch",
          error_message:
            `counters ${lastCounts.repCount}/${lastCounts.cleanReps} vs ` +
            `log ${summaryPayload.repCount}/${summaryPayload.cleanReps}`,
        });
      }
      try {
        const res = await fetch(
          `${opts.apiBase}/session/${encodeURIComponent(opts.sessionId)}/summary`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(opts.authToken ? { Authorization: `Bearer ${opts.authToken}` } : {}),
            },
            body: JSON.stringify(summaryPayload),
          }
        );
        if (!res.ok) {
          logger.error("session_aborted", {
            error_type: "summary_rejected",
            error_message: `POST /summary -> ${res.status}`,
          });
        }
      } catch (err) {
        logger.error("session_aborted", {
          error_type: "summary_failed",
          error_message: String(err && err.message || err),
        });
      }
    }

    ws.sendEnd();
    ws.close();
    logger.info("session_ended", {});
    // G2-F7: upload the recording. Consent (F6) is enforced server-side --
    // a withheld consent is a 403 the uploader logs and swallows, so this
    // never blocks or fails the end of a session. It has to finish BEFORE
    // navigating away, though: leaving the page cancels an in-flight upload.
    if (opts.apiBase) {
      onProgress("Uploading your recording…");
      await uploadRecording(blob, {
        sessionId: opts.sessionId,
        apiBase: opts.apiBase,
        token: opts.authToken,
        logger,
      });
    }

    // The session is over and everything is saved -- send the patient to the
    // report. Without this the page just sat frozen on a dead camera view.
    if (opts.reportUrl !== null) {
      onProgress("Opening your report…");
      location.href =
        opts.reportUrl ||
        `../../dist/report.html?session_id=${encodeURIComponent(opts.sessionId || "")}` +
          `&api=${encodeURIComponent(opts.apiBase || "")}`;
    }
    return blob;
    })();
    return endingPromise;
  }

  endBtn?.addEventListener("click", () => { endSession(); });

  return { endSession, recorder, worker, ws, getLatencySamples: () => latencySamples, getMetrics: () => ({ ...metrics }) };
}

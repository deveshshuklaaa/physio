/**
 * recorder.js — G12/G13. Video recording, fully isolated from the pose
 * worker (HIGH EFFORT per MASTER_BUILD_PLAN_v3 §10: get this boundary wrong
 * and session evidence is lost, unrecoverably).
 *
 * Isolation argument (see docs/09_live_frontend.md for the full write-up):
 *   - `MediaRecorder` attaches DIRECTLY to the raw camera `MediaStream`
 *     handed to `startRecording()`. It does NOT go through any canvas the
 *     pose worker also draws to, any queue the worker touches, or the worker
 *     itself. It runs on the browser's internal encoding thread — nothing in
 *     this file's JS, let alone the pose worker's, can block it.
 *   - This module never imports pose_worker.js and never receives a
 *     reference to it. The only shared object between recording and
 *     inference is the MediaStream itself, which MediaRecorder and the frame
 *     grab (video worker feed, see pose_worker.js) each consume
 *     independently — two consumers of one producer, zero shared mutable
 *     state, zero execution context in common.
 *   - `timeslice` chunked writes (default 2000ms): `ondataavailable` fires
 *     periodically rather than only at stop, so a mid-session crash costs at
 *     most one timeslice of video, not the whole recording.
 *   - Caller contract (enforced by session.js / the page, not this file):
 *     start recording BEFORE the pose worker spins up, stop it AFTER the
 *     worker tears down. This module has no dependency that would break if
 *     called in a different order, but the ordering is what bounds the
 *     evidence window on both ends.
 */
import { RingBuffer } from "./ring_buffer.js";

const DEFAULT_TIMESLICE_MS = 2000;
const DEFAULT_CHUNK_CAPACITY = 600; // ~20 min at 2s/chunk before oldest chunks are dropped from the in-memory list

export class IsolatedRecorder {
  /**
   * @param {MediaStream} stream - the RAW camera stream, untouched by pose inference.
   * @param {object} opts
   * @param {import("./logger.js").BrowserLogger} [opts.logger]
   * @param {number} [opts.timesliceMs]
   * @param {string} [opts.mimeType]
   */
  constructor(stream, opts = {}) {
    this.stream = stream;
    this.logger = opts.logger || null;
    this.timesliceMs = opts.timesliceMs || DEFAULT_TIMESLICE_MS;
    this.mimeType = opts.mimeType || IsolatedRecorder.pickMimeType();
    this._chunks = new RingBuffer(opts.chunkCapacity || DEFAULT_CHUNK_CAPACITY);
    this._recorder = null;
    this._startedAt = null;
  }

  static pickMimeType() {
    const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) return c;
    }
    return ""; // let the browser pick
  }

  start() {
    if (this._recorder) return; // already recording — idempotent, no double-start
    const opts = this.mimeType ? { mimeType: this.mimeType } : {};
    this._recorder = new MediaRecorder(this.stream, opts);
    this._recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        this._chunks.push(ev.data);
        this.logger?.info("chunk_written", { bytes: ev.data.size, chunk_count: this._chunks.length });
      }
    };
    this._recorder.onerror = (ev) => {
      // Recording failure must be logged individually — never sampled (§8b.6).
      this.logger?.error("recording_failed", { error_type: ev.error?.name, error_message: ev.error?.message });
    };
    this._recorder.onstop = () => {
      this.logger?.info("recording_stopped", { chunk_count: this._chunks.length, dropped_chunks: this._chunks.dropped });
    };
    this._recorder.start(this.timesliceMs);
    this._startedAt = Date.now();
    this.logger?.info("recording_started", { mime_type: this.mimeType, timeslice_ms: this.timesliceMs });
  }

  /** Stops recording. Returns a Promise resolving to the assembled Blob of everything captured so far. */
  stop() {
    return new Promise((resolve) => {
      if (!this._recorder || this._recorder.state === "inactive") {
        resolve(this._assembleBlob());
        return;
      }
      const finish = () => resolve(this._assembleBlob());
      this._recorder.addEventListener("stop", finish, { once: true });
      this._recorder.stop();
    });
  }

  _assembleBlob() {
    const parts = this._chunks.toArray();
    return new Blob(parts, { type: this.mimeType || "video/webm" });
  }

  get isRecording() {
    return this._recorder?.state === "recording";
  }
}

// ---------------------------------------------------------------------------
// G2-F7 -- upload the assembled Blob at session end. Master plan line 1029's
// gap: stop() above only ever produced a Blob in memory; nothing sent it
// anywhere. This is deliberately a standalone function, not a method that
// auto-fires from stop() -- the caller (session end, wherever that lives)
// already controls exactly when a session is "over" and already knows the
// sessionId and auth token; duplicating that knowledge into this file would
// be the second copy the isolation argument at the top of this file argues
// against for recording itself.
// ---------------------------------------------------------------------------

/**
 * POST the recorded Blob to the backend. Multipart, one attempt (no retry --
 * a dropped video is logged and swallowed, never a reason to fail the
 * session the patient already finished).
 *
 * @param {Blob} blob - from IsolatedRecorder.stop().
 * @param {object} opts
 * @param {string} opts.sessionId
 * @param {string} opts.apiBase - same base other session calls use (the `api`
 *   query param / ENGINE_SUPPORTED base), e.g. "http://localhost:8000" or
 *   "/engine" behind nginx.
 * @param {string} [opts.token] - localStorage.authToken (D2/D12); sent as
 *   `Authorization: Bearer` like every other call to this backend. NEVER a
 *   Gemini key or any other server secret -- this file never sees one (F3).
 * @param {import("./logger.js").BrowserLogger} [opts.logger]
 * @returns {Promise<boolean>} true iff the backend accepted the upload.
 */
export async function uploadRecording(blob, { sessionId, apiBase, token, logger } = {}) {
  if (!sessionId || !apiBase) {
    logger?.error("recording_failed", {
      error_type: "upload_misconfigured",
      error_message: "uploadRecording requires sessionId and apiBase",
    });
    return false;
  }
  if (!blob || blob.size === 0) {
    // Nothing recorded (e.g. camera never started) -- not a failure, just
    // nothing to send. Don't log recording_failed for a session with no video.
    return false;
  }

  const form = new FormData();
  form.append("file", blob, `${sessionId}.webm`);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const res = await fetch(`${apiBase}/session/${encodeURIComponent(sessionId)}/video`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) {
      // 403 here specifically means consent was withheld (F6) -- expected,
      // not a bug, so it's still just a plain video_uploaded(accepted:false)
      // line, not recording_failed.
      logger?.info("video_uploaded", { accepted: false, status: res.status });
      return false;
    }
    logger?.info("video_uploaded", { accepted: true, bytes: blob.size });
    return true;
  } catch (err) {
    logger?.error("recording_failed", {
      error_type: "upload_network",
      error_message: String(err?.message || err),
    });
    return false;
  }
}

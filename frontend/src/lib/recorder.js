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

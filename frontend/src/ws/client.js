/**
 * ws/client.js — G9. ONE WebSocket per session (locked decision, §2).
 * Carries evidence, not feedback (§3.2 R5) — pose batches for
 * server-side recording/report only; nothing on this path gates the live
 * feedback loop (that's angles.js/rules.js/pose_worker.js, all local).
 *
 * - Batches pose frames into ~500ms windows (R5: cuts message count ~15x).
 * - Bounded outbound ring buffer; on backpressure, drop OLDEST and count
 *   (R3). Backpressure = buffer full, or socket not OPEN, or
 *   `socket.bufferedAmount` above a high-water mark.
 * - Also drains the browser logger (G14) into the same batched message so
 *   browser + server logs share one correlation id (session_id).
 */
import { RingBuffer } from "../lib/ring_buffer.js";

const BATCH_INTERVAL_MS = 500;
const OUTBOUND_CAPACITY = 200; // frames; at ~15-20fps this is >5s of headroom
const BUFFERED_AMOUNT_HIGH_WATER = 1_000_000; // bytes

export class SessionWsClient {
  /**
   * @param {string} url - ws(s)://.../ws/session/{session_id}
   * @param {object} opts
   * @param {import("../lib/logger.js").BrowserLogger} [opts.logger]
   * @param {() => object[]} [opts.drainLogs] - alt log source if no logger instance
   */
  constructor(url, opts = {}) {
    this.url = url;
    this.logger = opts.logger || null;
    this._socket = null;
    this._outbound = new RingBuffer(OUTBOUND_CAPACITY);
    this._timer = null;
    this._connected = false;
    this._onFlag = opts.onFlag || null; // reserved: server->client messages (flag/emg)
    this._onMessage = opts.onMessage || null;
  }

  connect() {
    this._socket = new WebSocket(this.url);
    this._socket.addEventListener("open", () => {
      this._connected = true;
      this.logger?.info("ws_connected", { url: this.url });
      this._sendAuthFrame(); // G2-B5/D3: MUST be the first message after open
      this._timer = setInterval(() => this._flush(), BATCH_INTERVAL_MS);
    });
    this._socket.addEventListener("close", (ev) => {
      this._connected = false;
      if (this._timer) clearInterval(this._timer);
      this.logger?.warn("ws_disconnected", { code: ev.code, reason: ev.reason });
    });
    this._socket.addEventListener("error", () => {
      this.logger?.warn("ws_disconnected", { reason: "error" });
    });
    this._socket.addEventListener("message", (ev) => {
      this.logger?.debug("batch_received", { bytes: ev.data?.length ?? 0 });
      if (this._onMessage) {
        try {
          const msg = JSON.parse(ev.data);
          this._onMessage(msg);
        } catch (e) {
          // malformed server message; not this agent's transport to fix beyond logging
        }
      }
    });
    return this;
  }

  /** Enqueue one pose frame ({ts, landmarks, flags, ...}). Never blocks, never queues unbounded. */
  sendPose(frame) {
    this._outbound.push(frame);
    if (this._outbound.dropped > 0) {
      // Every drop is an anomaly — never sampled (§8b.6).
      this.logger?.warn("backpressure_drop", { dropped_total: this._outbound.dropped });
    }
  }

  /** Frames waiting in the outbound ring for the next 500ms flush (G10 overlay). */
  queueDepth() {
    return this._outbound.length;
  }

  /** Explicit session end message, per §J7/G8's end-session flow. Flushes first. */
  sendEnd() {
    this._flush();
    this._send({ type: "end" });
  }

  _flush() {
    if (this._outbound.length === 0) return;
    const frames = this._outbound.drain();
    const logs = this.logger ? this.logger.drain() : [];
    const ok = this._send({ type: "pose_batch", ts: Date.now(), frames, logs });
    if (ok) this.logger?.debug("batch_sent", { frame_count: frames.length, log_count: logs.length });
  }

  /** G2-B5/D3: their React app already stores the JWT in localStorage under
   * one origin (D1), so we read it directly rather than passing it through
   * the URL. Sent with no token if localStorage is unavailable or empty --
   * the server closes 4401 either way, same as a missing token. */
  _sendAuthFrame() {
    let token = null;
    try {
      token = localStorage.getItem("authToken");
    } catch (e) {
      // private-mode / non-browser test env: fall through with no token.
    }
    this._send({ type: "auth", token });
  }

  _send(payload) {
    if (!this._socket || this._socket.readyState !== WebSocket.OPEN) return false;
    if (this._socket.bufferedAmount > BUFFERED_AMOUNT_HIGH_WATER) {
      this.logger?.warn("backpressure_drop", { reason: "socket_buffered_amount_high", bufferedAmount: this._socket.bufferedAmount });
      return false;
    }
    this._socket.send(JSON.stringify(payload));
    return true;
  }

  close() {
    if (this._timer) clearInterval(this._timer);
    this._socket?.close();
  }
}

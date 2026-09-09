/**
 * logger.js — G14. Browser-side structured logger, same schema as the
 * backend (MASTER_BUILD_PLAN_v3 §8b.1/§8b.2), ring-buffered (§8b.6 — never
 * log synchronously in the live loop), shipped to the server inside the
 * existing batched WS messages (client.js drains it into each batch).
 *
 * Schema per line (§8b.1): session_id, trace_id, span_id, parent_span_id,
 * component, event, ts_wall, ts_mono, seq, level, plus arbitrary fields.
 *
 * §8b.7 privacy: never log raw landmark arrays at INFO. Callers pass
 * derived scalars; DEBUG-level full dumps are opt-in via `setLevel("DEBUG")`
 * and are the caller's responsibility not to leave on.
 */
import { isValidEvent } from "./events.js";
import { RingBuffer } from "./ring_buffer.js";

const LEVELS = { DEBUG: 10, INFO: 20, WARN: 30, ERROR: 40, FATAL: 50 };

export class BrowserLogger {
  constructor({ sessionId, component, capacity = 2000, level = "INFO" } = {}) {
    this.sessionId = sessionId || null;
    this.component = component;
    this.level = level;
    this._seq = 0;
    this._buf = new RingBuffer(capacity);
  }

  setLevel(level) {
    this.level = level;
  }

  setSessionId(id) {
    this.sessionId = id;
  }

  _shouldLog(level) {
    return LEVELS[level] >= LEVELS[this.level];
  }

  log(level, event, fields = {}) {
    if (!this._shouldLog(level)) return;
    if (!isValidEvent(event)) {
      // Unknown event names are themselves a bug (closed vocabulary) —
      // surface loudly rather than silently emitting a line that would be
      // rejected server-side (backend/app/events.py's is_valid_event gate).
      // eslint-disable-next-line no-console
      console.error(`[logger] unknown event "${event}" — add it to events.js AND events.py first`);
      return;
    }
    const line = {
      ts_wall: new Date().toISOString(),
      ts_mono: typeof performance !== "undefined" ? performance.now() : Date.now(),
      seq: this._seq++,
      session_id: this.sessionId,
      trace_id: fields.trace_id ?? null,
      span_id: fields.span_id ?? null,
      parent_span_id: fields.parent_span_id ?? null,
      component: this.component,
      event,
      level,
      ...fields,
    };
    this._buf.push(line);
    return line;
  }

  debug(event, fields) { return this.log("DEBUG", event, fields); }
  info(event, fields) { return this.log("INFO", event, fields); }
  warn(event, fields) { return this.log("WARN", event, fields); }
  error(event, fields) { return this.log("ERROR", event, fields); }
  fatal(event, fields) { return this.log("FATAL", event, fields); }

  /** Drain buffered lines for shipping in the next WS batch. Never blocks. */
  drain() {
    return this._buf.drain();
  }

  get droppedCount() {
    return this._buf.dropped;
  }
}

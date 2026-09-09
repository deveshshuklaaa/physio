"""Structured JSON logger — MASTER_BUILD_PLAN_v3.md §8b.

One JSON object per line, full correlation identity, dual clocks, per-component
rotation, and a non-blocking ring-buffer path for the live loop.

Usage:

    from app.logging_setup import get_logger, correlation, log_ring_buffer

    log = get_logger("pose_worker")

    with correlation(session_id="s_1", trace_id="t_1", span_id="sp_1"):
        log.info("frame_dropped", reason="inference_in_flight", frames_dropped_total=37)

        # live loop, non-blocking:
        log_ring_buffer.push(log, "DEBUG", "frame_received", inference_ms=12.1)

    # error with §8b.5 fields:
    log.error("schema_mismatch", error=exc, inputs_hash="abc123", stage_state={...})

A background task should periodically call `log_ring_buffer.drain()` (or run
`log_ring_buffer.start_drain_task()` once at startup) to flush buffered lines.
"""
from __future__ import annotations

import contextvars
import datetime
import json
import logging
import logging.handlers
import os
import threading
import time
import traceback
from collections import deque
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from app.events import is_valid_event

LOG_DIR = Path(os.environ.get("LOG_DIR", Path(__file__).resolve().parent.parent / "logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# §8b.1 correlation identity — carried via contextvars so it propagates
# through async calls without threading it through every function signature.
# ---------------------------------------------------------------------------

_session_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("session_id", default=None)
_trace_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("trace_id", default=None)
_span_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("span_id", default=None)
_parent_span_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("parent_span_id", default=None)


@contextmanager
def correlation(session_id=None, trace_id=None, span_id=None, parent_span_id=None):
    """Set correlation IDs for the duration of the `with` block (and anything
    awaited inside it), restoring the previous values on exit."""
    tokens = [
        _session_id.set(session_id) if session_id is not None else None,
        _trace_id.set(trace_id) if trace_id is not None else None,
        _span_id.set(span_id) if span_id is not None else None,
        _parent_span_id.set(parent_span_id) if parent_span_id is not None else None,
    ]
    try:
        yield
    finally:
        for var, tok in zip((_session_id, _trace_id, _span_id, _parent_span_id), tokens):
            if tok is not None:
                var.reset(tok)


# ---------------------------------------------------------------------------
# §8b.5 — remediation is a static lookup for known failure classes ONLY.
# Never generate this string at runtime.
# ---------------------------------------------------------------------------

REMEDIATION = {
    "schema_mismatch": "model bundle feature_names differ from feature_builder output; compare and re-export",
    "circuit_opened": "sensor unreachable 3x; check serial connection and Flask service",
    "calibration_failed": "transform could not be computed; re-run calibration pose",
}

# ---------------------------------------------------------------------------
# Per-component monotonic sequence counters (§8b.1 `seq`)
# ---------------------------------------------------------------------------

_seq_lock = threading.Lock()
_seq_counters: dict[str, int] = {}


def _next_seq(component: str) -> int:
    with _seq_lock:
        n = _seq_counters.get(component, 0) + 1
        _seq_counters[component] = n
        return n


# ---------------------------------------------------------------------------
# Per-component runtime-adjustable log level (§8b.6)
# ---------------------------------------------------------------------------

_component_levels: dict[str, int] = {}


def set_component_level(component: str, level: int) -> None:
    _component_levels[component] = level
    logging.getLogger(f"rehab.{component}").setLevel(level)


class _JsonFormatter(logging.Formatter):
    """Renders the pre-built dict on record.extra_fields as one JSON line.
    All the schema construction happens in ComponentLogger; this formatter
    just serializes what it's given."""

    def format(self, record: logging.LogRecord) -> str:
        return json.dumps(record.extra_fields, default=str)


def _make_handler(component: str) -> logging.Handler:
    path = LOG_DIR / f"{component}.log"
    # Rotate by size (§8b.6: bounded disk use) and let the shipped-cron/ops
    # layer additionally enforce age; RotatingFileHandler covers size, which
    # is the immediate "fills the disk" risk. Age rotation via
    # TimedRotatingFileHandler is not stacked on top here (stdlib doesn't
    # compose the two handlers cleanly) — ponytail: size rotation only,
    # add a periodic age-based purge job if long-idle logs become a problem.
    handler = logging.handlers.RotatingFileHandler(
        path, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    handler.setFormatter(_JsonFormatter())
    return handler


_loggers: dict[str, "ComponentLogger"] = {}
_loggers_lock = threading.Lock()


class ComponentLogger:
    """Thin wrapper around stdlib logging.Logger that builds the §8b.1/8b.5
    schema dict and hands it to the JSON formatter."""

    def __init__(self, component: str):
        self.component = component
        self._logger = logging.getLogger(f"rehab.{component}")
        self._logger.setLevel(_component_levels.get(component, logging.INFO))
        if not self._logger.handlers:
            self._logger.addHandler(_make_handler(component))
            self._logger.propagate = False

    def _base_fields(self, level: str, event: str) -> dict:
        return {
            "ts_wall": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.")
            + f"{datetime.datetime.now(datetime.timezone.utc).microsecond // 1000:03d}Z",
            "ts_mono": time.monotonic(),
            "seq": _next_seq(self.component),
            "session_id": _session_id.get(),
            "trace_id": _trace_id.get(),
            "span_id": _span_id.get(),
            "parent_span_id": _parent_span_id.get(),
            "component": self.component,
            "event": event,
            "level": level,
        }

    def _emit(self, level: str, pylevel: int, event: str, **fields):
        # §8b.3 — the vocabulary is CLOSED. An event name is a code literal, so
        # a bad one is wrong on its very first call and surfaces immediately in
        # dev; it never becomes a surprise in a live session. Silently accepting
        # it is the actual hazard: a typo'd name still writes a plausible line
        # and quietly breaks every query written against that event.
        if not is_valid_event(event):
            raise ValueError(
                f"unknown event {event!r} for component {self.component!r}. "
                "Add it to backend/app/events.py AND frontend/src/lib/events.js "
                "(they are mirrored) rather than passing a free-text name."
            )
        payload = self._base_fields(level, event)
        payload.update(fields)
        record = self._logger.makeRecord(
            self._logger.name, pylevel, __file__, 0, "", (), None
        )
        record.extra_fields = payload
        self._logger.handle(record)
        return payload

    def debug(self, event: str, **fields):
        return self._emit("DEBUG", logging.DEBUG, event, **fields)

    def info(self, event: str, **fields):
        return self._emit("INFO", logging.INFO, event, **fields)

    def warn(self, event: str, **fields):
        return self._emit("WARN", logging.WARNING, event, **fields)

    def error(self, event: str, error: BaseException | None = None,
              inputs_hash: str | None = None, stage_state: dict | None = None,
              retry_count: int | None = None, fatal: bool = False, **fields):
        """§8b.5 — every ERROR/FATAL line carries error_type, error_message,
        stack, inputs_hash, stage_state, retry_count, remediation.
        `remediation` is populated only for known failure classes (`event`
        must match a key in REMEDIATION); otherwise the field is absent."""
        level = "FATAL" if fatal else "ERROR"
        pylevel = logging.CRITICAL if fatal else logging.ERROR
        extra = dict(fields)
        extra["error_type"] = type(error).__name__ if error is not None else None
        extra["error_message"] = str(error) if error is not None else None
        extra["stack"] = "".join(traceback.format_exception(error)) if error is not None else None
        extra["inputs_hash"] = inputs_hash
        extra["stage_state"] = stage_state
        extra["retry_count"] = retry_count
        if event in REMEDIATION:
            extra["remediation"] = REMEDIATION[event]
        return self._emit(level, pylevel, event, **extra)


def get_logger(component: str) -> ComponentLogger:
    with _loggers_lock:
        if component not in _loggers:
            _loggers[component] = ComponentLogger(component)
        return _loggers[component]


# ---------------------------------------------------------------------------
# §8b.6 — non-blocking path for the live loop: push() appends to a bounded
# deque (O(1), no I/O); a separate task/thread calls drain() which does the
# actual (still fast, but not "on the frame's critical path") logger calls.
# ---------------------------------------------------------------------------

@dataclass
class _RingBuffer:
    maxlen: int = 2000
    _buf: deque = field(default_factory=lambda: deque())
    _lock: threading.Lock = field(default_factory=threading.Lock)
    dropped: int = 0

    def __post_init__(self):
        self._buf = deque(maxlen=self.maxlen)

    def push(self, logger: ComponentLogger, level: str, event: str, sample_every: int = 1, **fields):
        """Queue a log line. `sample_every=N` keeps 1-in-N calls for this
        event (anomalies should always call with sample_every=1 — never
        sample drops/flags/errors, per §8b.6)."""
        if sample_every > 1:
            count = _next_seq(f"{logger.component}:{event}:sample")
            if count % sample_every != 0:
                return
        with self._lock:
            if len(self._buf) == self._buf.maxlen:
                self.dropped += 1
            self._buf.append((logger, level, event, fields))

    def drain(self) -> int:
        """Flush everything currently buffered. Returns count flushed."""
        with self._lock:
            items = list(self._buf)
            self._buf.clear()
        for logger, level, event, fields in items:
            getattr(logger, level.lower())(event, **fields)
        return len(items)

    def start_drain_task(self, interval_s: float = 0.5):
        """Background thread that drains periodically. Call once at
        startup (e.g. from main.py's lifespan). Daemon thread — dies with
        the process, any not-yet-drained lines are lost, which is the
        accepted tradeoff for a non-blocking live path."""
        def _loop():
            while True:
                time.sleep(interval_s)
                self.drain()
        t = threading.Thread(target=_loop, daemon=True, name="log-ring-drain")
        t.start()
        return t


log_ring_buffer = _RingBuffer()


if __name__ == "__main__":
    # Self-check: correlation propagation, JSON line shape, ring buffer.
    log = get_logger("_selftest")
    with correlation(session_id="s_test", trace_id="t_test", span_id="sp_1"):
        line = log.info("worker_ready", note="selftest")
        assert line["session_id"] == "s_test"
        assert line["trace_id"] == "t_test"
        assert "ts_wall" in line and "ts_mono" in line
        assert line["event"] == "worker_ready"

    # outside the context, correlation IDs should be absent again
    line2 = log.info("worker_ready")
    assert line2["session_id"] is None

    # error line carries §8b.5 fields, remediation only for known classes
    try:
        raise ValueError("boom")
    except ValueError as e:
        err_line = log.error("schema_mismatch", error=e, inputs_hash="h1", stage_state={"x": 1})
        assert err_line["remediation"] == REMEDIATION["schema_mismatch"]
        # A VALID event that has no REMEDIATION entry: the field must be absent
        # rather than guessed at. (Must be a real event — the vocabulary is
        # closed and _emit rejects unknown names, so a made-up name here would
        # test the wrong thing.)
        assert "worker_died" not in REMEDIATION
        err_line2 = log.error("worker_died", error=e)
        assert "remediation" not in err_line2

    # An unknown event name is itself rejected, loudly.
    try:
        log.info("some_unlisted_event")
        raise AssertionError("expected ValueError for an unknown event name")
    except ValueError:
        pass

    # ring buffer: push doesn't touch the logger synchronously, drain does
    before = _seq_counters.get("_selftest", 0)
    log_ring_buffer.push(log, "DEBUG", "frame_received", inference_ms=1.0)
    assert _seq_counters.get("_selftest", 0) == before  # not yet emitted
    n = log_ring_buffer.drain()
    assert n == 1
    assert _seq_counters.get("_selftest", 0) == before + 1

    print("OK: logging_setup self-check passed")

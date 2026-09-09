"""Perf counter/timer registry — MASTER_BUILD_PLAN_v3.md §3.2 R10, §5 B5.

Not the measurements themselves (capture fps, inference fps, frames dropped,
WS queue depth, feedback latency) — those are reported in by the live path
in later phases. This module is just the registry they report into, plus
`GET /metrics` (wired in main.py) to read it back as JSON.
"""
from __future__ import annotations

import threading
import time
from contextlib import contextmanager

_lock = threading.Lock()
_counters: dict[str, float] = {}
_timers: dict[str, dict] = {}  # name -> {count, total_ms, min_ms, max_ms}


def incr(name: str, n: float = 1) -> None:
    with _lock:
        _counters[name] = _counters.get(name, 0) + n


def timing(name: str, ms: float) -> None:
    with _lock:
        t = _timers.setdefault(name, {"count": 0, "total_ms": 0.0, "min_ms": ms, "max_ms": ms})
        t["count"] += 1
        t["total_ms"] += ms
        t["min_ms"] = min(t["min_ms"], ms)
        t["max_ms"] = max(t["max_ms"], ms)


@contextmanager
def timer(name: str):
    start = time.monotonic()
    try:
        yield
    finally:
        timing(name, (time.monotonic() - start) * 1000)


def snapshot() -> dict:
    with _lock:
        timers_out = {}
        for name, t in _timers.items():
            timers_out[name] = {
                **t,
                "avg_ms": t["total_ms"] / t["count"] if t["count"] else 0,
            }
        return {"counters": dict(_counters), "timers": timers_out}


if __name__ == "__main__":
    incr("frames_dropped")
    incr("frames_dropped", 2)
    with timer("inference_ms"):
        time.sleep(0.001)
    snap = snapshot()
    assert snap["counters"]["frames_dropped"] == 3
    assert snap["timers"]["inference_ms"]["count"] == 1
    assert snap["timers"]["inference_ms"]["avg_ms"] > 0
    print("OK: telemetry self-check passed", snap)

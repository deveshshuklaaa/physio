"""H1 — session_buffer.py self-checks. No framework.

Run from backend/:  ../venv/bin/python app/services/test_session_buffer.py

These tests define the H1 contract that app/services/session_buffer.py must
satisfy:

    SESSION_DATA_DIR                 module attr, root for flushed evidence
    BUFFER_CAPACITY                  module attr, int, the ring bound
    get_buffer(session_id)           -> SessionBuffer, created on first call
    close_buffer(session_id)         -> flush + drop from the registry
    SessionBuffer.append(frame)      sync, O(1), NO disk I/O
    SessionBuffer.extend(frames)     sync, O(n), NO disk I/O
    SessionBuffer.dropped            int, overwrite-oldest counter (R3)
    SessionBuffer.pending            int, frames waiting to be flushed
    await SessionBuffer.flush()      -> int flushed, appends JSONL to disk
    SessionBuffer.path               -> Path of the file flush() appends to

Three of these guard failures that are SILENT — nothing crashes, nothing logs,
and the loss is only discovered in Phase I when the report has no evidence to
build from:

  1. A flush that no-ops (wrong dir, swallowed exception) loses the entire
     evidence path. Asserted against real file content, not a clean return.
  2. An unbounded deque passes every functional test and fails only as a
     latency leak under load. Asserted via the `dropped` counter.
  3. Buffers shared across sessions put one patient's frames in another's
     report. Same class of bug as the G heel-baseline leak.
"""
import asyncio
import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.services import session_buffer as sb


def _frame(i):
    return {"ts": 1000 + i, "landmarks": [[0.1, 0.2, 0.3]], "flags": []}


def _fresh_tmp_root():
    """Point the module at an empty temp dir and clear the registry."""
    root = Path(tempfile.mkdtemp(prefix="h1_"))
    sb.SESSION_DATA_DIR = root
    for sid in list(getattr(sb, "_buffers", {})):
        sb._buffers.pop(sid, None)
    return root


def test_h1_buffer_is_bounded_and_counts_drops():
    """R3: fixed capacity, overwrite-oldest, count the drops.

    The failure this exists to catch is silent: an unbounded deque behaves
    identically until the buffer is under real load, at which point it is a
    latency leak with no symptom pointing at it.
    """
    _fresh_tmp_root()
    buf = sb.get_buffer("s_bounded")
    cap = buf.capacity
    assert isinstance(cap, int) and cap > 0, "buffer must declare a finite capacity"

    overflow = 25
    for i in range(cap + overflow):
        buf.append(_frame(i))

    assert buf.pending == cap, f"buffer must stay bounded at {cap}, got {buf.pending}"
    assert buf.dropped == overflow, f"expected dropped=={overflow}, got {buf.dropped}"

    # Overwrite-OLDEST, not newest: the surviving window must be the tail.
    oldest_kept = buf.peek()[0]
    assert oldest_kept["ts"] == 1000 + overflow, (
        "buffer dropped the newest frames instead of the oldest; R3 says "
        f"overwrite-oldest. Oldest surviving ts={oldest_kept['ts']}"
    )
    print("H1 bounded ring + drop counter: OK")


def test_h1_append_does_not_touch_disk():
    """R6: the live path never blocks on I/O. append() is sync and writes nothing.

    Asserted structurally rather than by timing — a timing assertion flaps on
    host load (see PROJECT-STATUS §3) and would be ignored within a week.
    """
    root = _fresh_tmp_root()
    buf = sb.get_buffer("s_nodisk")

    assert not asyncio.iscoroutinefunction(buf.append), (
        "append() must be a plain sync call; an async append invites an await "
        "on the frame's critical path"
    )
    for i in range(50):
        buf.append(_frame(i))

    written = [p for p in root.rglob("*") if p.is_file()]
    assert written == [], f"append() wrote to disk before any flush: {written}"
    print("H1 append is disk-free: OK")


def test_h1_flush_writes_real_frames_to_disk():
    """The evidence path. A flush that returns cleanly but writes nothing is
    the worst failure in Phase H, because it is invisible until Phase I finds
    an empty session."""
    _fresh_tmp_root()
    buf = sb.get_buffer("s_flush")
    for i in range(7):
        buf.append(_frame(i))

    n = asyncio.run(buf.flush())
    assert n == 7, f"flush() should report 7 frames written, got {n}"

    path = buf.path
    assert path.exists(), f"flush() wrote no file at {path}"
    lines = [ln for ln in path.read_text().splitlines() if ln.strip()]
    assert len(lines) == 7, f"expected 7 JSONL records on disk, got {len(lines)}"

    first = json.loads(lines[0])
    assert first["ts"] == 1000, "flushed record lost its timestamp"
    assert first["landmarks"] == [[0.1, 0.2, 0.3]], "flushed record lost its landmarks"
    print("H1 flush writes real frames: OK")


def test_h1_flush_empties_buffer_and_appends():
    """Flush drains. A second flush must append, not truncate — chunked
    evidence across a long session must accumulate."""
    _fresh_tmp_root()
    buf = sb.get_buffer("s_append")
    buf.extend([_frame(i) for i in range(3)])
    asyncio.run(buf.flush())
    assert buf.pending == 0, "flush() left frames in the buffer"

    assert asyncio.run(buf.flush()) == 0, "flushing an empty buffer must be a no-op"

    buf.extend([_frame(i) for i in range(3, 6)])
    asyncio.run(buf.flush())

    lines = [ln for ln in buf.path.read_text().splitlines() if ln.strip()]
    assert len(lines) == 6, (
        f"second flush truncated instead of appending; expected 6 records, got {len(lines)}"
    )
    assert json.loads(lines[0])["ts"] == 1000, "first flush's frames were overwritten"
    print("H1 flush drains and appends: OK")


def test_h1_buffers_are_isolated_per_session():
    """Cross-session leak guard. One patient's frames must never reach
    another's evidence file."""
    _fresh_tmp_root()
    a = sb.get_buffer("s_alpha")
    b = sb.get_buffer("s_beta")
    assert a is not b, "get_buffer returned the same buffer for two sessions"
    assert sb.get_buffer("s_alpha") is a, "get_buffer must be stable per session_id"

    a.extend([_frame(i) for i in range(4)])
    b.extend([_frame(i) for i in range(100, 102)])
    assert a.pending == 4 and b.pending == 2, "buffers share state"

    asyncio.run(a.flush())
    asyncio.run(b.flush())
    assert a.path != b.path, "two sessions flushed to the same file"

    a_lines = [ln for ln in a.path.read_text().splitlines() if ln.strip()]
    b_lines = [ln for ln in b.path.read_text().splitlines() if ln.strip()]
    assert len(a_lines) == 4 and len(b_lines) == 2, "frames crossed between sessions"
    print("H1 per-session isolation: OK")


def test_h1_flush_task_runs_without_blocking_appends():
    """The periodic flush task (R6) drains in the background while appends
    keep landing. Started and stopped explicitly, not leaked — an unstopped
    interval is what hung the Phase G test runner (G-CONTINUE §7b)."""
    _fresh_tmp_root()

    async def drive():
        buf = sb.get_buffer("s_task")
        buf.start_flush_task(interval_s=0.02)
        try:
            for i in range(10):
                buf.append(_frame(i))
                await asyncio.sleep(0.01)
        finally:
            await buf.stop_flush_task()
        return buf

    buf = asyncio.run(drive())
    lines = [ln for ln in buf.path.read_text().splitlines() if ln.strip()]
    assert len(lines) == 10, (
        f"background flush task lost frames: {len(lines)}/10 on disk. "
        "stop_flush_task() must flush what remains before returning."
    )
    print("H1 background flush task: OK")


def test_h1_concurrent_flushes_do_not_duplicate():
    """REGRESSION (added after the phase gate first passed, orchestrator).

    Real bug, found by opening a session file rather than by a failing test:
    9 of 56 evidence files on disk held every frame exactly twice.

    flush() is snapshot -> await write -> pop, and that await yields. Two
    flushes overlapping in that window both claimed the same frames and both
    wrote them. The buffer ended up CORRECT either way, so every in-memory
    assertion in this file passed and the §7 gate passed -- the damage existed
    only in the file. That is why this test asserts on disk content.

    The two real flushers that overlap in production are the background task
    on its interval and the final flush from the WS disconnect path.
    """
    _fresh_tmp_root()

    async def drive():
        buf = sb.get_buffer("s_concurrent")
        buf.extend([_frame(i) for i in range(40)])
        # Fire several flushes into the same await window on purpose.
        await asyncio.gather(*(buf.flush() for _ in range(4)))
        return buf

    buf = asyncio.run(drive())
    lines = [ln for ln in buf.path.read_text().splitlines() if ln.strip()]
    assert len(lines) == 40, (
        f"{len(lines)} lines on disk for 40 frames -- concurrent flushes "
        "duplicated evidence"
    )
    ts = [json.loads(ln)["ts"] for ln in lines]
    assert len(set(ts)) == 40, "duplicate timestamps on disk (phantom reps for I3)"
    assert ts == sorted(ts), "frames out of order on disk"
    assert buf.pending == 0, "buffer not drained after concurrent flushes"
    print("H1 concurrent flushes do not duplicate: OK")


def test_h1_flush_interval_override_is_live():
    """REGRESSION (added with the one above).

    `start_flush_task(interval_s=FLUSH_INTERVAL_S)` bound the module value as a
    default argument, i.e. once at definition time -- so setting
    `session_buffer.FLUSH_INTERVAL_S` did nothing and the task kept its
    original cadence. That dead override is what left the background flusher
    racing the final flush in the test above.
    """
    _fresh_tmp_root()
    original = sb.FLUSH_INTERVAL_S

    async def drive():
        buf = sb.get_buffer("s_interval")
        sb.FLUSH_INTERVAL_S = 0.02
        buf.start_flush_task()          # no explicit interval: must read it now
        try:
            buf.append(_frame(0))
            await asyncio.sleep(0.15)   # many ticks at 0.02s, none at 2.0s
            on_disk = buf.path.exists() and bool(buf.path.read_text().strip())
        finally:
            await buf.stop_flush_task()
            sb.FLUSH_INTERVAL_S = original
        return on_disk

    assert asyncio.run(drive()), (
        "background task did not flush within 0.15s after FLUSH_INTERVAL_S was "
        "set to 0.02 -- the module-level override is still dead"
    )
    print("H1 flush interval override is live: OK")


if __name__ == "__main__":
    test_h1_buffer_is_bounded_and_counts_drops()
    test_h1_append_does_not_touch_disk()
    test_h1_flush_writes_real_frames_to_disk()
    test_h1_flush_empties_buffer_and_appends()
    test_h1_buffers_are_isolated_per_session()
    test_h1_flush_task_runs_without_blocking_appends()
    test_h1_concurrent_flushes_do_not_duplicate()
    test_h1_flush_interval_override_is_live()
    print("ALL H1 SESSION BUFFER CHECKS PASSED")

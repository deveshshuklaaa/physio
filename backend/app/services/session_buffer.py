"""Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3/R6).

R3: fixed-capacity ring buffer, overwrite-oldest, `dropped` counter.
R6: `append`/`extend` are synchronous, O(1)/O(n), zero disk I/O. Disk only
happens inside `flush()`, which is `await`ed by a background task
(`start_flush_task`) or explicitly (H6 disconnect path) — never by the WS
receive loop itself.

One `SessionBuffer` per `session_id`, created on first `get_buffer()` call and
cached in a module-level registry so the WS handler, the flush task and the
disconnect/end-session path all see the same buffer. Never share one buffer
across sessions (that's the "G heel-baseline leak" class of bug).
"""
from __future__ import annotations

import asyncio
import json
import os
from collections import deque
from contextlib import suppress
from pathlib import Path
from typing import Optional

# ponytail: env override kept simple (no config layer) — H7's `serve()` sets
# SESSION_DATA_DIR per test run so concurrent gate runs don't collide on disk.
SESSION_DATA_DIR = Path(
    os.environ.get("SESSION_DATA_DIR", Path(__file__).resolve().parent.parent / "session_data")
)
BUFFER_CAPACITY = 4000  # ring bound; flush() drains this well before it fills
FLUSH_INTERVAL_S = 2.0  # background flush cadence (R6); session_ws.py reads this


class SessionBuffer:
    def __init__(self, session_id: str, capacity: int = BUFFER_CAPACITY):
        self.session_id = session_id
        self.capacity = capacity
        self.dropped = 0
        self._buf: deque = deque()
        self._flush_task: Optional[asyncio.Task] = None
        self._stop: Optional[asyncio.Event] = None
        # Serializes flush(). See the note in flush() -- without this,
        # overlapping flushes write the same frames twice.
        self._flush_lock = asyncio.Lock()

    @property
    def pending(self) -> int:
        return len(self._buf)

    @property
    def path(self) -> Path:
        SESSION_DATA_DIR.mkdir(parents=True, exist_ok=True)
        return SESSION_DATA_DIR / f"{self.session_id}.jsonl"

    def append(self, frame: dict) -> None:
        """Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3)."""
        if len(self._buf) >= self.capacity:
            self._buf.popleft()
            self.dropped += 1
        self._buf.append(frame)

    def extend(self, frames) -> None:
        """Sync, O(n), no disk I/O."""
        for frame in frames:
            self.append(frame)

    def peek(self) -> list:
        """Snapshot of what's currently buffered, oldest first. Debug/test use."""
        return list(self._buf)

    async def flush(self) -> int:
        """Append everything pending to `path` as JSONL, then drop exactly what
        was written. Writes off the event loop thread so a slow disk never
        stalls other sessions' handlers.

        SERIALIZED under `_flush_lock`, and that lock is load-bearing. The
        sequence is snapshot -> await write -> pop, and that `await` yields to
        the event loop. Two flushes overlapping in that window -- the
        background task on its tick, and the final flush from the WS
        disconnect path -- both snapshot the same frames, both write them, and
        every frame lands on disk TWICE. The buffer still ends up correct
        afterwards, so every in-memory assertion passes and the corruption is
        visible only in the file. Phase I's I3 reads this file as a time
        series for rep segmentation, where duplicated timestamps become
        phantom reps.
        """
        async with self._flush_lock:
            if not self._buf:
                return 0
            frames = list(self._buf)
            blob = "".join(json.dumps(f) + "\n" for f in frames)
            path = self.path

            def _write():
                with open(path, "a", encoding="utf-8") as fh:
                    fh.write(blob)

            # Only drop what we just wrote from the buffer AFTER a successful
            # write. A failed write (disk full, permissions, ...) must leave the
            # frames buffered for the next attempt rather than losing them --
            # a flush that raises is not allowed to also lose evidence.
            await asyncio.to_thread(_write)
            for _ in range(len(frames)):
                self._buf.popleft()
            return len(frames)

    def start_flush_task(self, interval_s: Optional[float] = None) -> None:
        """Idempotent: calling twice does not spawn a second task.

        `interval_s=None` reads the module-level FLUSH_INTERVAL_S at CALL time,
        not at definition time. It was previously a default argument, which
        Python binds once when the function is defined -- so reassigning
        `session_buffer.FLUSH_INTERVAL_S` (as the WS tests do, to park the
        background task out of the way) silently had no effect, and the task
        kept ticking at the original cadence. One source of truth, read when
        it is actually needed.
        """
        if interval_s is None:
            interval_s = FLUSH_INTERVAL_S
        if self._flush_task is not None:
            return
        self._stop = asyncio.Event()

        async def _loop():
            stop = self._stop
            while not stop.is_set():
                with suppress(asyncio.TimeoutError):
                    await asyncio.wait_for(stop.wait(), timeout=interval_s)
                # A flush failure (disk full, permissions, sabotaged in a
                # test) must not kill the background task or the caller
                # awaiting stop_flush_task() -- frames stay buffered and are
                # retried on the next tick rather than the session losing
                # its evidence path entirely.
                with suppress(Exception):
                    await self.flush()

        self._flush_task = asyncio.ensure_future(_loop())

    async def stop_flush_task(self) -> None:
        """Stop the background task and flush whatever remains before
        returning, so nothing is left sitting in a dead task's memory. A
        flush failure here must not propagate -- callers (e.g. the WS
        handler's disconnect path) still need to tear down cleanly even if
        disk is unavailable; the frames stay buffered for a later retry."""
        if self._flush_task is None:
            with suppress(Exception):
                await self.flush()
            return
        self._stop.set()
        task = self._flush_task
        self._flush_task = None
        with suppress(asyncio.CancelledError):
            await task
        with suppress(Exception):
            await self.flush()


_buffers: dict[str, SessionBuffer] = {}


def get_buffer(session_id: str) -> SessionBuffer:
    if session_id not in _buffers:
        _buffers[session_id] = SessionBuffer(session_id)
    return _buffers[session_id]


async def close_buffer(session_id: str) -> int:
    """Flush and drop from the registry. Returns frames flushed."""
    buf = _buffers.pop(session_id, None)
    if buf is None:
        return 0
    await buf.stop_flush_task()
    return await buf.flush()


if __name__ == "__main__":
    # Runnable self-check (ponytail: the real contract lives in
    # test_session_buffer.py; this is the "does it even import and do the
    # basic thing" smoke check).
    import shutil
    import sys
    import tempfile

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from app.services import session_buffer as _self  # type: ignore

    root = Path(tempfile.mkdtemp(prefix="sb_selfcheck_"))
    try:
        _self.SESSION_DATA_DIR = root

        buf = _self.get_buffer("s_selfcheck")
        buf.append({"ts": 1, "landmarks": []})
        assert buf.pending == 1
        n = asyncio.run(buf.flush())
        assert n == 1
        assert buf.path.exists()
        print("OK: session_buffer self-check passed")
    finally:
        shutil.rmtree(root, ignore_errors=True)

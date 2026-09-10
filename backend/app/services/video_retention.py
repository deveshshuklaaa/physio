"""G2-F8 -- video retention sweep.

Deletes files past `clinical.video.expiresAt`, sets `clinical.video.
deletedAt`, logs `video_deleted` (the SHAP_REPORT event, reused -- see
events.py's comment). This is a SCHEDULED task, not a request-time check
(the plan is explicit: a request-time check would mean "the video is deleted
the next time someone happens to look", which is not a retention guarantee).

# ponytail: 30-day retention (RETENTION_DAYS in report.py) is a placeholder
# per integration plan §9 item 2, not a clinically reviewed number -- change
# there when it's decided.

Wiring this into the app is main.py's job (out of this agent's ownership --
see the report back to the integrator for the exact lines to add). This
module only provides the sweep and a loop to run it on.
"""
from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path

from app.logging_setup import get_logger

log = get_logger("video_retention")

DEFAULT_INTERVAL_S = 3600  # hourly is plenty for a 30-day expiry window


async def sweep_expired_videos(db, now: datetime | None = None) -> int:
    """One pass: delete every video file whose expiresAt has passed and that
    hasn't already been marked deleted. Returns the count swept.

    Idempotent: deletedAt not-null rows are excluded from the query, so a
    second run (or an overlapping one) does nothing to them."""
    now = now or datetime.now(timezone.utc)
    cursor = db.physiosessions.find(
        {
            "clinical.video.expiresAt": {"$lte": now},
            "clinical.video.deletedAt": None,
            "clinical.video.path": {"$ne": None},
        },
        {"sessionId": 1, "clinical.video.path": 1},
    )
    count = 0
    async for row in cursor:
        session_id = row["sessionId"]
        path = row.get("clinical", {}).get("video", {}).get("path")
        if path:
            try:
                os.remove(path)
            except FileNotFoundError:
                pass  # already gone -- still record the deletion, don't loop forever on it
        await db.physiosessions.update_one(
            {"sessionId": session_id},
            {"$set": {"clinical.video.deletedAt": now, "updatedAt": now}},
        )
        log.info("video_deleted", session_id=session_id, path=path)
        count += 1
    return count


async def retention_loop(db, interval_s: float = DEFAULT_INTERVAL_S) -> None:
    """Runs sweep_expired_videos() forever. Start with
    `asyncio.create_task(retention_loop(app.state.db))` in main.py's
    lifespan and cancel it on shutdown -- see this agent's report for the
    exact lines."""
    while True:
        try:
            await sweep_expired_videos(db)
        except Exception as exc:  # a bad sweep must not kill the loop
            log.error("video_deleted", error=exc, fatal=False)
        await asyncio.sleep(interval_s)


if __name__ == "__main__":
    # Runnable self-check, no real Mongo: a fake collection with an in-memory
    # find()/update_one(), and a real temp file to prove os.remove() runs.
    import tempfile

    class _FakeCursor:
        def __init__(self, docs):
            self._docs = docs

        def __aiter__(self):
            self._it = iter(self._docs)
            return self

        async def __anext__(self):
            try:
                return next(self._it)
            except StopIteration:
                raise StopAsyncIteration

    class _FakeCollection:
        def __init__(self, docs):
            self.docs = docs
            self.updates = []

        def find(self, query, *_a, **_kw):
            now = query["clinical.video.expiresAt"]["$lte"]
            due = [
                d for d in self.docs
                if d["clinical"]["video"]["expiresAt"] is not None
                and d["clinical"]["video"]["expiresAt"] <= now
                and d["clinical"]["video"]["deletedAt"] is None
                and d["clinical"]["video"]["path"] is not None
            ]
            return _FakeCursor(due)

        async def update_one(self, query, update):
            self.updates.append((query, update))
            for d in self.docs:
                if d["sessionId"] == query["sessionId"]:
                    d["clinical"]["video"]["deletedAt"] = update["$set"]["clinical.video.deletedAt"]

    class _FakeDb:
        def __init__(self, docs):
            self.physiosessions = _FakeCollection(docs)

    async def _run():
        tmp = tempfile.NamedTemporaryFile(delete=False)
        tmp.close()
        past = datetime.now(timezone.utc)
        docs = [
            {
                "sessionId": "s_expired",
                "clinical": {"video": {"path": tmp.name, "expiresAt": past, "deletedAt": None}},
            },
            {
                "sessionId": "s_future",
                "clinical": {"video": {"path": "/nowhere", "expiresAt": None, "deletedAt": None}},
            },
            {
                "sessionId": "s_already_gone",
                "clinical": {"video": {"path": "/gone/already.webm", "expiresAt": past, "deletedAt": None}},
            },
        ]
        db = _FakeDb(docs)
        swept = await sweep_expired_videos(db, now=datetime.now(timezone.utc))
        assert swept == 2, f"expected 2 swept (expired + already-gone-on-disk), got {swept}"
        assert not Path(tmp.name).exists(), "expired file was not deleted from disk"
        assert docs[0]["clinical"]["video"]["deletedAt"] is not None
        assert docs[1]["clinical"]["video"]["deletedAt"] is None, "not-yet-expired row was touched"
        assert docs[2]["clinical"]["video"]["deletedAt"] is not None, "missing-file row still needs deletedAt set"

        # idempotent: second pass sweeps nothing more
        swept2 = await sweep_expired_videos(db, now=datetime.now(timezone.utc))
        assert swept2 == 0, "second sweep must not re-sweep already-deleted rows"

    asyncio.run(_run())
    print("OK: app/services/video_retention.py self-check passed")

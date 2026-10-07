"""G2-D2 -- Motor client lifecycle, and the read-only lookups D5/B6 need:
patientprofiles.patientId (display id snapshot) and
hemophiliadetails.consultingDoctorId (the B6 doctor-link seam).

We own physiosessions only (§1 of the integration plan). Everything this
module reads -- users, patientprofiles, hemophiliadetails -- is read-only;
this file contains no write to any collection but physiosessions (and it
doesn't even write that -- app/routes/session.py does).

Wiring, without touching app/main.py (out of this agent's ownership): FastAPI
merges a sub-router's `lifespan` into the app's own lifespan on
`include_router()` (fastapi/routing.py's `_merge_lifespan_context`, called
from `APIRouter.include_router`). app/routes/session.py does
`APIRouter(lifespan=db.lifespan)`, and app/main.py already does
`app.include_router(session_router)` -- so this module's startup/shutdown
runs on every app boot with no edit to main.py at all.

MONGO_URI has no default and fails loudly at import time, same pattern as
app/auth.py's JWT_SECRET check. Every process that imports app.routes.session
(which app.main does) needs MONGO_URI set, exactly like it already needs
JWT_SECRET.
"""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager, suppress
from typing import Any, Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient

from app.logging_setup import get_logger
from app.models.session_doc import ensure_indexes

log = get_logger("db")

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI is not set. It must point at the same Atlas cluster "
        "part2/Hemophillia-confirm/backend/.env's MONGO_URI does -- refusing "
        "to start rather than silently having no database."
    )

# Their database. Overridable ONLY so tests can run the real code path
# against a scratch database instead of the live one -- production leaves it
# unset and gets "hemophilia".
DB_NAME = os.environ.get("MONGO_DB", "hemophilia")


def to_object_id(value: Any) -> Any:
    """Best-effort ObjectId conversion.

    Real tokens always carry their users._id as a valid ObjectId hex string
    (see app/auth.py's CurrentUser docstring). Test fixtures across
    test_session.py/test_session_ws.py use short fake ids like "p1"/"docA" --
    those fall back to plain strings rather than raising, so the write/read
    path doesn't need a second code path for tests vs. production.
    # ponytail: string fallback for non-ObjectId ids is not a real id type,
    # just "don't crash on a fixture" -- production ids are always ObjectIds.
    """
    if not value:
        return None
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return value


async def resolve_patient_id(db, patient_user_id: str) -> Optional[str]:
    """D5: snapshot patientprofiles.patientId (PATxxxxxx, display-only) at
    session start -- do not join at read time. Read-only; patientprofiles is
    theirs (§1)."""
    oid = to_object_id(patient_user_id)
    if not isinstance(oid, ObjectId):
        return None
    doc = await db.patientprofiles.find_one({"userId": oid}, {"patientId": 1})
    return doc.get("patientId") if doc else None


def make_lookup_doctor_id(db):
    """The B6/D14 seam consumed by app/auth.py's authorize_patient_access and
    app/routes/session.py's get_lookup_doctor_id: given a patientUserId,
    return their hemophiliadetails.consultingDoctorId as a string, or None.

    A patient with no hemophiliadetails row has no doctor -- find_one
    returning nothing must deny every doctor rather than guess (fail-closed).
    Read-only; hemophiliadetails is theirs (§1).

    S20: a *dangling* consultingDoctorId (truthy ObjectId pointing at a users
    document that does not exist) is not a doctor either. Mongo enforces no
    referential integrity -- mongoose's ref: "User" is documentation, not a
    constraint -- so the reference is validated here. Without this the lookup
    fails to a doctor who cannot exist: no real doctor ever matches, the
    patient becomes permanently invisible to their own clinician, and the
    symptom reads as a permissions bug rather than as corrupt data.
    """

    async def lookup_doctor_id(patient_user_id: str) -> Optional[str]:
        oid = to_object_id(patient_user_id)
        if not isinstance(oid, ObjectId):
            return None
        doc = await db.hemophiliadetails.find_one(
            {"userId": oid}, {"consultingDoctorId": 1}
        )
        doctor_id = doc.get("consultingDoctorId") if doc else None
        if not doctor_id:
            return None
        # S20: resolves-to-nonexistent-user counts as no doctor. One extra
        # indexed _id lookup per authorization check.
        # ponytail: validated on read; an integrity sweep over
        # hemophiliadetails would catch dangling links before a request does.
        if not await db.users.find_one({"_id": to_object_id(doctor_id)}, {"_id": 1}):
            return None
        return str(doctor_id)

    return lookup_doctor_id


@asynccontextmanager
async def lifespan(app):
    """Merged into app/main.py's lifespan via include_router (see module
    docstring). Sets app.state.db and app.state.lookup_doctor_id -- the two
    things app/routes/session.py and app/auth.py need -- and closes the
    client on shutdown."""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    app.state.mongo_client = client
    app.state.db = db
    # D5/B6: the one-line swap session.py's docstring calls for.
    app.state.lookup_doctor_id = make_lookup_doctor_id(db)
    await ensure_indexes(db)
    log.info("mongo_connected", db_name=DB_NAME)
    # G2-F8: the video retention sweep. Started here rather than in main.py's
    # lifespan because that body runs BEFORE this one sets app.state.db --
    # the sweep needs the client this function owns.
    from app.services.video_retention import retention_loop
    app.state.retention_task = asyncio.create_task(retention_loop(db))
    try:
        yield
    finally:
        app.state.retention_task.cancel()
        with suppress(asyncio.CancelledError):
            await app.state.retention_task
        client.close()
        log.info("mongo_closed")


if __name__ == "__main__":
    # Runnable self-check: to_object_id's fallback behaviour and the doctor
    # lookup against a hand-rolled fake collection -- no real Mongo needed.
    import asyncio

    class _FakeCursorResult:
        def __init__(self, doc):
            self._doc = doc

        def __await__(self):
            async def _inner():
                return self._doc
            return _inner().__await__()

    class _FakeCollection:
        def __init__(self, docs_by_user_id):
            self._docs = docs_by_user_id

        def find_one(self, query, *_a, **_kw):
            uid = query.get("userId")
            return _FakeCursorResult(self._docs.get(uid))

    class _FakeUsers:
        def __init__(self, ids):
            self._ids = set(ids)

        def find_one(self, query, *_a, **_kw):
            oid = query.get("_id")
            return _FakeCursorResult({"_id": oid} if oid in self._ids else None)

    class _FakeDb:
        def __init__(self, hemo_docs, user_ids=()):
            self.hemophiliadetails = _FakeCollection(hemo_docs)
            self.users = _FakeUsers(user_ids)

    async def _run():
        assert to_object_id("p1") == "p1", "non-ObjectId id should fall back to string"
        assert to_object_id(None) is None
        real_oid = ObjectId()
        assert to_object_id(str(real_oid)) == real_oid

        doc_id = ObjectId()
        fake_db = _FakeDb({real_oid: {"consultingDoctorId": doc_id}}, [doc_id])
        lookup = make_lookup_doctor_id(fake_db)
        assert await lookup(str(real_oid)) == str(doc_id)
        assert await lookup("p_no_such_patient") is None, (
            "a patient with no hemophiliadetails row must deny every doctor"
        )

        # S20: dangling consultingDoctorId -- no such users document.
        dangling_db = _FakeDb({real_oid: {"consultingDoctorId": ObjectId()}}, [])
        assert await make_lookup_doctor_id(dangling_db)(str(real_oid)) is None, (
            "a consultingDoctorId pointing at no user must deny every doctor"
        )

    asyncio.run(_run())
    print("OK: app/db.py self-check passed")

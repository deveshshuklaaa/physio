"""G2-G2 -- paginated session history for a patient.

    GET /patients/{id}/sessions?limit=&skip=
        -> {"sessions": [...], "total": N, "hasMore": bool}

Reached from the browser at `/engine/patients/{id}/sessions` (nginx strips
`/engine`). Deliberately its own file, not session.py or report.py -- the
integrator owns both of those concurrently (see the task brief).

`{id}` accepts three shapes, resolved to `patientUserId` before anything else
happens:

  - "me"        -> the caller's own token userId. What the patient's own
                   "Past sessions" list (ExercisePlan.jsx) uses -- the patient
                   frontend only ever has localStorage.authToken, never its
                   own ObjectId.
  - "PATxxxxxx" -> their display id. Resolved via a read-only patientprofiles
                   lookup (§1: read-only, ours to query, never to write).
                   What the doctor patient-detail page uses -- their
                   /doctor/patient-research/:patientId response carries
                   profile.patientId but no ObjectId (their Express route,
                   out of this agent's ownership -- not touched here).
  - anything else -> taken as a literal patientUserId (an ObjectId hex
                   string in production; test fixtures use short fake ids
                   like "p1", same convention as test_session.py).

**The authorization call below is the load-bearing line.** It is the exact
same seam session.py's routes use -- authorize_patient_access() from
app/auth.py, resolved to patientUserId, never the display patientId. Getting
the resolution above wrong and then authorizing on the WRONG string is
exactly the leak G2-B6 exists to prevent; that's why every branch above ends
in a patientUserId, and authorization happens after resolution, never before.
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app import db as dbmod
from app.auth import CurrentUser, authorize_patient_access, get_current_user
from app.routes.session import _public, get_lookup_doctor_id

router = APIRouter()

_PAT_ID_RE = re.compile(r"^PAT", re.IGNORECASE)

MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20


async def _resolve_patient_user_id(app, raw_id: str, user: CurrentUser) -> str | None:
    """raw_id -> patientUserId (a string), or None if it can't be resolved.
    See module docstring for the three accepted shapes."""
    if raw_id == "me":
        return user.user_id
    if _PAT_ID_RE.match(raw_id):
        # Read-only lookup on patientprofiles (theirs, §1) -- resolving their
        # display id to the ObjectId their own users collection uses.
        doc = await app.state.db.patientprofiles.find_one(
            {"patientId": raw_id.upper()}, {"userId": 1}
        )
        user_id = doc.get("userId") if doc else None
        return str(user_id) if user_id else None
    # ponytail: anything else is treated as a literal patientUserId rather
    # than validated as a real ObjectId hex string -- to_object_id()
    # downstream falls back to a plain string for non-ObjectId values (test
    # fixtures), and a bogus id here simply matches zero rows, not a security
    # hole (authorization still runs on this exact string first).
    return raw_id


@router.get("/patients/{patient_ref}/sessions")
async def patient_sessions(
    patient_ref: str,
    request: Request,
    limit: int = Query(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    skip: int = Query(default=0, ge=0),
    user: CurrentUser = Depends(get_current_user),
):
    app = request.app
    target = await _resolve_patient_user_id(app, patient_ref, user)
    if target is None:
        raise HTTPException(status_code=404, detail=f"unknown patient: {patient_ref!r}")

    allowed = await authorize_patient_access(user, target, get_lookup_doctor_id(app))
    if not allowed:
        raise HTTPException(status_code=403, detail="not authorized for this patient's sessions")

    query = {"patientUserId": dbmod.to_object_id(target)}
    collection = app.state.db.physiosessions
    total = await collection.count_documents(query)
    cursor = (
        collection.find(query)
        .sort("startedAt", -1)
        .skip(skip)
        .limit(limit)
    )
    rows = [_public(doc) async for doc in cursor]
    return {"sessions": rows, "total": total, "hasMore": skip + len(rows) < total}


if __name__ == "__main__":
    # Runnable self-check: id-shape resolution only (no Mongo needed) -- the
    # authorization matrix itself is exercised against the real scratch DB in
    # app/routes/test_history.py, per the task's verification requirement.
    import asyncio

    class _FakeCollection:
        def __init__(self, docs):
            self._docs = docs

        def find_one(self, query, *_a, **_kw):
            pid = query.get("patientId")
            doc = next((d for d in self._docs if d["patientId"] == pid), None)

            class _Awaitable:
                def __await__(self_inner):
                    async def _inner():
                        return doc
                    return _inner().__await__()
            return _Awaitable()

    class _FakeDb:
        def __init__(self, docs):
            self.patientprofiles = _FakeCollection(docs)

    class _FakeState:
        def __init__(self, db):
            self.db = db

    class _FakeApp:
        def __init__(self, db):
            self.state = _FakeState(db)

    async def _run():
        app = _FakeApp(_FakeDb([{"patientId": "PAT000123", "userId": "u_abc"}]))
        me = CurrentUser("p1", "patient")

        assert await _resolve_patient_user_id(app, "me", me) == "p1"
        assert await _resolve_patient_user_id(app, "PAT000123", me) == "u_abc"
        assert await _resolve_patient_user_id(app, "pat000123", me) == "u_abc", (
            "PAT resolution should be case-insensitive"
        )
        assert await _resolve_patient_user_id(app, "PATnosuch", me) is None
        assert await _resolve_patient_user_id(app, "p1", me) == "p1", (
            "a non-PAT, non-'me' id is treated as a literal patientUserId"
        )

    asyncio.run(_run())
    print("OK: app/routes/history.py self-check passed")

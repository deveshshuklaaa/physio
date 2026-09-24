"""G2-G2 -- GET /patients/{id}/sessions. No framework.

Run from backend/:
    JWT_SECRET=testsecret MONGO_DB=hemophilia_g2test \
    MONGO_URI=<from part2/Hemophillia-confirm/backend/.env, never echoed> \
    ../venv/bin/python app/routes/test_history.py

Uses the real scratch Mongo (hemophilia_g2test), same convention as
test_session.py/test_report.py -- never the default `hemophilia` database.
Cleans up every row/document it creates, in every test.

G2-B6's authorization matrix, restated for this route: TWO patients (p1 has a
doctor link via a real hemophiliadetails row, p2 has NONE) and TWO doctors
(docA is p1's doctor, docB is nobody's), plus an admin. A test with only one
patient cannot see the doctor-link leak this route risks -- exactly the
warning in the task brief.
"""
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# Never let a test run touch the live database. app/__init__.py now loads
# MONGO_URI from their .env automatically, so a forgotten MONGO_DB would
# otherwise write test sessions straight into `hemophilia`. Set before any
# app.* import, and only as a default -- an explicit MONGO_DB still wins.
os.environ.setdefault("MONGO_DB", "hemophilia_g2test")

# Never let a test run touch the live EMG service either. Since P2.3,
# POST /session/start fires emg_client.start_capture, and EMG_SERVICE_URL
# defaults to http://localhost:5000 -- which the P5.2 loopback port makes
# reachable from the host. Without this, running the suite starts REAL
# recordings on the real Flask service, writes fixture-attributed entries
# into emg-service/data/history.json, and can leave a capture running that
# then blocks recalibration (docs/13 F2). Point it at a closed port: the
# client's circuit breaker swallows the ConnectError, start_capture returns
# None, and nothing is written anywhere.
os.environ.setdefault("EMG_SERVICE_URL", "http://127.0.0.1:9")


import jwt as pyjwt
from bson import ObjectId
from fastapi.testclient import TestClient

from app.auth import JWT_SECRET
from app.main import app
from app.routes.history import router as history_router

# Not wired into app/main.py yet -- that's the integrator's line to add (see
# the task report). Registering it here, once, exercises the real route.
app.include_router(history_router)


def _token(user_id: str, role: str = "patient") -> str:
    return pyjwt.encode(
        {"userId": user_id, "role": role, "exp": time.time() + 3600},
        JWT_SECRET,
        algorithm="HS256",
    )


def _auth(user_id: str, role: str = "patient") -> dict:
    return {"Authorization": f"Bearer {_token(user_id, role)}"}


def _cleanup_sessions(client, *patient_user_ids):
    async def _do():
        db = client.app.state.db
        oids = [
            _to_oid_or_str(pid) for pid in patient_user_ids
        ]
        await db.physiosessions.delete_many({"patientUserId": {"$in": oids}})
    client.portal.call(lambda: _do())


def _to_oid_or_str(v):
    from app import db as dbmod
    return dbmod.to_object_id(v)


async def _lookup_docA_only_for_p1(patient_user_id: str):
    return "docA" if patient_user_id == "p1" else None


class _WithDoctorLookup:
    def __enter__(self):
        app.state.lookup_doctor_id = _lookup_docA_only_for_p1
        return self

    def __exit__(self, *exc):
        del app.state.lookup_doctor_id


def _start_session(client, patient_user_id, exercise="squat"):
    r = client.post(
        "/session/start", json={"exercise": exercise}, headers=_auth(patient_user_id)
    )
    assert r.status_code == 200, f"session start failed for {patient_user_id}: {r.text}"
    return r.json()["session_id"]


def test_patient_reads_own_history_via_me():
    with TestClient(app) as client:
        try:
            sid1 = _start_session(client, "p1")
            sid2 = _start_session(client, "p1")

            r = client.get("/patients/me/sessions", headers=_auth("p1"))
            assert r.status_code == 200, f"GET /patients/me/sessions -> {r.status_code}: {r.text}"
            body = r.json()
            ids = {s["sessionId"] for s in body["sessions"]}
            assert {sid1, sid2} <= ids, f"own sessions missing from history: {body}"
            assert body["total"] >= 2
        finally:
            _cleanup_sessions(client, "p1")
    print("history: patient reads own history via 'me': OK")


def test_history_is_patient_scoped_by_literal_id():
    """A raw literal id (not 'me', not PATxxx) is a patientUserId -- p2
    reading it directly must not see p1's rows, and vice versa."""
    with TestClient(app) as client:
        try:
            sid1 = _start_session(client, "p1")
            sid2 = _start_session(client, "p2")

            mine = client.get("/patients/p1/sessions", headers=_auth("p1"))
            assert mine.status_code == 200, mine.text
            assert {s["sessionId"] for s in mine.json()["sessions"]} == {sid1}

            other = client.get("/patients/p1/sessions", headers=_auth("p2"))
            assert other.status_code == 403, (
                f"p2 read p1's history: {other.status_code} {other.text}"
            )
        finally:
            _cleanup_sessions(client, "p1", "p2")
    print("history: patient-scoped by literal patientUserId: OK")


def test_history_doctor_authorization_matrix():
    """The load-bearing matrix. docA is p1's doctor; docB is nobody's. p2 has
    NO hemophiliadetails row at all -- not even docA may read p2's history."""
    with TestClient(app) as client:
        try:
            sid1 = _start_session(client, "p1")
            _start_session(client, "p2")

            with _WithDoctorLookup():
                r = client.get("/patients/p1/sessions", headers=_auth("docA", role="doctor"))
                assert r.status_code == 200, (
                    f"p1's doctor (docA) denied p1's history: {r.status_code} {r.text}"
                )
                assert sid1 in {s["sessionId"] for s in r.json()["sessions"]}

                r = client.get("/patients/p1/sessions", headers=_auth("docB", role="doctor"))
                assert r.status_code == 403, (
                    f"docB (not p1's doctor) read p1's history: {r.status_code} {r.text}"
                )

                r = client.get("/patients/p2/sessions", headers=_auth("docA", role="doctor"))
                assert r.status_code == 403, (
                    "docA authorized for p2, who has NO hemophiliadetails row -- "
                    f"this is the leak G2-B6 exists to prevent: {r.status_code} {r.text}"
                )

                r = client.get("/patients/p1/sessions", headers=_auth("admin1", role="admin"))
                assert r.status_code == 200, f"admin denied a patient's history: {r.text}"
        finally:
            _cleanup_sessions(client, "p1", "p2")
    print("history: doctor authorization matrix (G2-B6): OK")


def test_history_resolves_display_patient_id_via_patientprofiles():
    """PATxxxxxx -> patientUserId, via a real inserted patientprofiles row --
    what the doctor patient-detail page's profile.patientId actually is."""
    with TestClient(app) as client:
        patient_oid = ObjectId()
        patient_user_id = str(patient_oid)

        async def _seed():
            await client.app.state.db.patientprofiles.insert_one(
                {"userId": patient_oid, "patientId": "PATHISTORYTEST"}
            )

        async def _unseed():
            await client.app.state.db.patientprofiles.delete_one({"userId": patient_oid})

        client.portal.call(lambda: _seed())
        try:
            sid = _start_session(client, patient_user_id)

            r = client.get("/patients/PATHISTORYTEST/sessions", headers=_auth(patient_user_id))
            assert r.status_code == 200, f"self via PAT id -> {r.status_code}: {r.text}"
            assert sid in {s["sessionId"] for s in r.json()["sessions"]}

            # lowercase input still resolves (case-insensitive PAT match)
            r2 = client.get("/patients/pathistorytest/sessions", headers=_auth(patient_user_id))
            assert r2.status_code == 200, r2.text

            # a doctor with no link to this patient is still denied, even
            # though the id resolved fine -- resolution is not authorization.
            r3 = client.get(
                "/patients/PATHISTORYTEST/sessions", headers=_auth("random_doc", role="doctor")
            )
            assert r3.status_code == 403, (
                f"unlinked doctor read a resolved PAT id's history: {r3.status_code} {r3.text}"
            )
        finally:
            _cleanup_sessions(client, patient_user_id)
            client.portal.call(lambda: _unseed())
    print("history: PATxxxxxx resolved via patientprofiles: OK")


def test_history_unknown_pat_id_is_404():
    with TestClient(app) as client:
        r = client.get("/patients/PATNOSUCHPATIENT/sessions", headers=_auth("p1"))
        assert r.status_code == 404, f"unknown PAT id -> {r.status_code}: {r.text}"
    print("history: unknown PAT id -> 404: OK")


def test_history_no_token_is_401():
    with TestClient(app) as client:
        r = client.get("/patients/me/sessions")
        assert r.status_code == 401, f"no-token history -> {r.status_code}: {r.text}"
    print("history: no token -> 401: OK")


def test_history_pagination():
    with TestClient(app) as client:
        try:
            sids = [_start_session(client, "p_page") for _ in range(3)]
            r = client.get("/patients/p_page/sessions?limit=2&skip=0", headers=_auth("p_page"))
            assert r.status_code == 200, r.text
            body = r.json()
            assert len(body["sessions"]) == 2
            assert body["total"] == 3
            assert body["hasMore"] is True

            r2 = client.get("/patients/p_page/sessions?limit=2&skip=2", headers=_auth("p_page"))
            body2 = r2.json()
            assert len(body2["sessions"]) == 1
            assert body2["hasMore"] is False

            # newest first
            r3 = client.get("/patients/p_page/sessions?limit=10", headers=_auth("p_page"))
            got = [s["sessionId"] for s in r3.json()["sessions"]]
            assert got == list(reversed(sids)), f"expected newest-first, got {got}"
        finally:
            _cleanup_sessions(client, "p_page")
    print("history: pagination (limit/skip, newest-first): OK")


if __name__ == "__main__":
    test_patient_reads_own_history_via_me()
    test_history_is_patient_scoped_by_literal_id()
    test_history_doctor_authorization_matrix()
    test_history_resolves_display_patient_id_via_patientprofiles()
    test_history_unknown_pat_id_is_404()
    test_history_no_token_is_401()
    test_history_pagination()
    print("ALL app/routes/test_history.py checks passed")

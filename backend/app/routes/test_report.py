"""G2-F -- report generation, video upload, retention. No framework.

Run from backend/:
    JWT_SECRET=testsecret MONGO_DB=hemophilia_g2test \
    MONGO_URI=<from part2/Hemophillia-confirm/backend/.env, never echoed> \
    ../venv/bin/python app/routes/test_report.py

Uses the real scratch Mongo (hemophilia_g2test), same as test_session.py --
never the default `hemophilia` database. Cleans up every row/file it creates.

Does NOT call the real Gemini API: app.services.gemini_report.call_gemini is
monkeypatched in every test here. If a real call is ever wanted for a manual
sanity check, that is a separate, explicit, one-time thing -- not something
this file does on every run.
"""
import asyncio
import os
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import AsyncMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# Never let a test run touch the live database. app/__init__.py now loads
# MONGO_URI from their .env automatically, so a forgotten MONGO_DB would
# otherwise write test sessions straight into `hemophilia`. Set before any
# app.* import, and only as a default -- an explicit MONGO_DB still wins.
os.environ.setdefault("MONGO_DB", "hemophilia_g2test")


import jwt as pyjwt
from bson import ObjectId
from fastapi.testclient import TestClient

from app.auth import JWT_SECRET
from app.main import app
from app.routes.report import router as report_router
from app.services import gemini_report
from app.services.gemini_report import GeminiError, generate_report
from app.services import video_retention

# report_router isn't wired into app/main.py yet (out of this agent's
# ownership -- see the integration report for the exact lines to add there).
# Registering it here, once, lets this test exercise the real route instead
# of a second hand-rolled copy of it.
app.include_router(report_router)

VIDEO_DIR = Path(os.environ.get("VIDEO_DIR", "data/videos"))


def _token(user_id: str, role: str = "patient") -> str:
    return pyjwt.encode(
        {"userId": user_id, "role": role, "exp": time.time() + 3600},
        JWT_SECRET,
        algorithm="HS256",
    )


def _auth(user_id: str, role: str = "patient") -> dict:
    return {"Authorization": f"Bearer {_token(user_id, role)}"}


def _cleanup(client, session_id):
    client.portal.call(
        lambda: client.app.state.db.physiosessions.delete_one({"sessionId": session_id})
    )
    for suffix in (".webm", ".webm.part"):
        p = VIDEO_DIR / f"{session_id}{suffix}"
        p.unlink(missing_ok=True)


# ---------------------------------------------------------------------------
# F4 gate: counts survive a Gemini failure, error recorded, status not
# advanced past "ended".
# ---------------------------------------------------------------------------

def test_f4_gemini_failure_preserves_counts():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("f4user")
        ).json()["session_id"]
        client.post(
            f"/session/{sid}/summary",
            json={"repCount": 2, "cleanReps": 1, "repLog": [
                {"rep": 1, "clean": True, "bestAngle": 90, "errors": []},
                {"rep": 2, "clean": False, "bestAngle": 100, "errors": ["Knees caving in — push knees out"]},
            ]},
            headers=_auth("f4user"),
        )
        client.post("/session/end", json={"session_id": sid}, headers=_auth("f4user"))

        with patch(
            "app.services.gemini_report.call_gemini",
            new=AsyncMock(side_effect=GeminiError("stubbed failure, no network call made")),
        ):
            client.portal.call(generate_report, client.app, sid)

        row = client.get(f"/session/{sid}", headers=_auth("f4user")).json()
        assert row["repCount"] == 2 and row["cleanReps"] == 1, "counts must survive a Gemini failure"
        assert row["status"] == "ended", f"status must not advance past 'ended', got {row['status']!r}"
        assert row["clinical"]["report"]["error"], "clinical.report.error must be set"
        assert row["clinical"]["report"]["text"] is None

        _cleanup(client, sid)
    print("F4 Gemini failure preserves counts, records error: OK")


def test_f4_gemini_success_sets_reported():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("f4user2")
        ).json()["session_id"]
        client.post(
            f"/session/{sid}/summary",
            json={"repCount": 1, "cleanReps": 1, "repLog": [
                {"rep": 1, "clean": True, "bestAngle": 90, "errors": []},
            ]},
            headers=_auth("f4user2"),
        )
        client.post("/session/end", json={"session_id": sid}, headers=_auth("f4user2"))

        with patch(
            "app.services.gemini_report.call_gemini",
            new=AsyncMock(return_value="## How the session went\nFine.\n## When to stop\nStop if it hurts."),
        ):
            client.portal.call(generate_report, client.app, sid)

        row = client.get(f"/session/{sid}", headers=_auth("f4user2")).json()
        assert row["status"] == "reported"
        assert row["clinical"]["report"]["text"]
        assert row["clinical"]["report"]["promptVersion"] == gemini_report.PROMPT_VERSION
        # G2-G6: record the language the text was actually generated in, so
        # the translated "When to stop" wording can be audited later.
        assert row["clinical"]["report"]["language"] in {"en", "hi", "mr"}
        assert row["clinical"]["report"]["error"] is None

        _cleanup(client, sid)
    print(f"F4 Gemini success sets status=reported with {gemini_report.PROMPT_VERSION}: OK")


# ---------------------------------------------------------------------------
# F6: consent rejection -- no file on disk, flag recorded either way.
# ---------------------------------------------------------------------------

def test_f6_no_consent_rejects_and_writes_no_file():
    with TestClient(app) as client:
        patient_oid = ObjectId()
        # Seed a patientprofiles row with consent explicitly false. Cleaned
        # up after -- patientprofiles is theirs, we only ever touch it here
        # as test seeding into the scratch database, never in application code.
        client.portal.call(
            lambda: client.app.state.db.patientprofiles.insert_one(
                {"userId": patient_oid, "patientId": "PATTEST01", "consentVideoMonitoring": False}
            )
        )
        try:
            sid = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth(str(patient_oid))
            ).json()["session_id"]

            r = client.post(
                f"/session/{sid}/video",
                files={"file": (f"{sid}.webm", b"not a real video but nonzero", "video/webm")},
                headers=_auth(str(patient_oid)),
            )
            assert r.status_code == 403, f"expected 403 with no consent, got {r.status_code}: {r.text}"
            assert not (VIDEO_DIR / f"{sid}.webm").exists(), "a file was written despite no consent"

            row = client.get(f"/session/{sid}", headers=_auth(str(patient_oid))).json()
            assert row["clinical"]["video"]["consentVideoMonitoring"] is False
            assert row["clinical"]["video"]["path"] is None

            _cleanup(client, sid)
        finally:
            client.portal.call(
                lambda: client.app.state.db.patientprofiles.delete_one({"userId": patient_oid})
            )
    print("F6 no consent -> 403, no file, flag recorded: OK")


def test_f6_consent_accepts_and_writes_file():
    with TestClient(app) as client:
        patient_oid = ObjectId()
        client.portal.call(
            lambda: client.app.state.db.patientprofiles.insert_one(
                {"userId": patient_oid, "patientId": "PATTEST02", "consentVideoMonitoring": True}
            )
        )
        try:
            sid = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth(str(patient_oid))
            ).json()["session_id"]

            r = client.post(
                f"/session/{sid}/video",
                files={"file": (f"{sid}.webm", b"pretend webm bytes", "video/webm")},
                headers=_auth(str(patient_oid)),
            )
            assert r.status_code == 200, f"expected 200 with consent, got {r.status_code}: {r.text}"
            assert (VIDEO_DIR / f"{sid}.webm").exists(), "file was not written despite consent"

            row = client.get(f"/session/{sid}", headers=_auth(str(patient_oid))).json()
            assert row["clinical"]["video"]["consentVideoMonitoring"] is True
            assert row["clinical"]["video"]["path"]
            assert row["clinical"]["video"]["expiresAt"]

            _cleanup(client, sid)
        finally:
            client.portal.call(
                lambda: client.app.state.db.patientprofiles.delete_one({"userId": patient_oid})
            )
    print("F6 consent -> 200, file written, expiry recorded: OK")


def test_f6_rejects_unsupported_content_type():
    with TestClient(app) as client:
        patient_oid = ObjectId()
        client.portal.call(
            lambda: client.app.state.db.patientprofiles.insert_one(
                {"userId": patient_oid, "patientId": "PATTEST03", "consentVideoMonitoring": True}
            )
        )
        try:
            sid = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth(str(patient_oid))
            ).json()["session_id"]
            r = client.post(
                f"/session/{sid}/video",
                files={"file": (f"{sid}.txt", b"not a video", "text/plain")},
                headers=_auth(str(patient_oid)),
            )
            assert r.status_code == 415, f"expected 415, got {r.status_code}: {r.text}"
            _cleanup(client, sid)
        finally:
            client.portal.call(
                lambda: client.app.state.db.patientprofiles.delete_one({"userId": patient_oid})
            )
    print("F6 unsupported content-type -> 415: OK")


def test_f6_size_cap():
    with TestClient(app) as client:
        patient_oid = ObjectId()
        client.portal.call(
            lambda: client.app.state.db.patientprofiles.insert_one(
                {"userId": patient_oid, "patientId": "PATTEST04", "consentVideoMonitoring": True}
            )
        )
        try:
            sid = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth(str(patient_oid))
            ).json()["session_id"]

            import app.routes.report as report_mod
            with patch.object(report_mod, "MAX_VIDEO_BYTES", 10):
                r = client.post(
                    f"/session/{sid}/video",
                    files={"file": (f"{sid}.webm", b"this is more than ten bytes of video", "video/webm")},
                    headers=_auth(str(patient_oid)),
                )
            assert r.status_code == 413, f"expected 413 over the cap, got {r.status_code}: {r.text}"
            assert not (VIDEO_DIR / f"{sid}.webm").exists(), "oversized upload left a file behind"
            assert not (VIDEO_DIR / f"{sid}.webm.part").exists(), "temp file not cleaned up"
            _cleanup(client, sid)
        finally:
            client.portal.call(
                lambda: client.app.state.db.patientprofiles.delete_one({"userId": patient_oid})
            )
    print("F6 size cap -> 413, no file left behind: OK")


# ---------------------------------------------------------------------------
# F8: retention sweep unit-tested directly in video_retention.py's own
# __main__ self-check (no Mongo needed there). Here: one integration check
# against the real scratch DB that a row with a past expiresAt gets swept.
# ---------------------------------------------------------------------------

def test_f8_sweep_against_real_db():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("f8user")
        ).json()["session_id"]

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
        tmp.close()
        from datetime import datetime, timedelta, timezone
        past = datetime.now(timezone.utc) - timedelta(days=1)

        async def _seed_and_sweep():
            db = client.app.state.db
            await db.physiosessions.update_one(
                {"sessionId": sid},
                {"$set": {
                    "clinical.video.path": tmp.name,
                    "clinical.video.expiresAt": past,
                    "clinical.video.deletedAt": None,
                }},
            )
            return await video_retention.sweep_expired_videos(db)

        swept = client.portal.call(_seed_and_sweep)
        assert swept >= 1
        assert not Path(tmp.name).exists(), "expired file not deleted by sweep"

        row = client.get(f"/session/{sid}", headers=_auth("f8user")).json()
        assert row["clinical"]["video"]["deletedAt"], "deletedAt not set after sweep"

        _cleanup(client, sid)
    print("F8 retention sweep against real DB: OK")


if __name__ == "__main__":
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    test_f4_gemini_failure_preserves_counts()
    test_f4_gemini_success_sets_reported()
    test_f6_no_consent_rejects_and_writes_no_file()
    test_f6_consent_accepts_and_writes_file()
    test_f6_rejects_unsupported_content_type()
    test_f6_size_cap()
    test_f8_sweep_against_real_db()
    print("ALL app/routes/test_report.py CHECKS PASSED")

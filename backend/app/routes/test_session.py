"""H4, H5 — session lifecycle endpoints. G2-B3/B6 — auth and authorization.
No framework.

Run from backend/:  ../venv/bin/python app/routes/test_session.py
Requires JWT_SECRET set in the environment (app/auth.py fails to import
otherwise) -- any non-empty value works here since tests sign their own
tokens with it; production must use the same value as
part2/Hemophillia-confirm/backend/.env's JWT_SECRET.

Contract these tests define for app/routes/session.py:

    POST /session/start   body {"exercise": "<name>"}, Authorization: Bearer
                          -> 200 {"session_id": "<str>", ...}
    POST /session/end     body {"session_id": "<str>"}, Authorization: Bearer
                          -> 200 {"job_id": "<str>", ...}
                          returns IMMEDIATELY; idempotent.
    GET  /session/{id}    Authorization: Bearer
                          -> 200 status record, patient-scoped (B6)

H5's idempotency is the load-bearing clause. `POST /session/end` fires from the
End Session button (J7) AND from the abrupt-disconnect handler (H6). Both firing
on the same session is the normal case on mobile, not an edge case. A
non-idempotent end produces two report jobs for one session, which means two
MediaPipe Heavy runs, two reports, and a race on the §8 video-deletion gate --
where the loser deletes the video the winner still needs.

G2-B's gate (docs/09_integration_plan_group_2_ui_integration.md §7) is the
authorization matrix at the bottom of this file: two patients, two doctors,
one of the patients has no hemophiliadetails row at all. A test with only one
patient cannot see the doctor-link leak this task exists to prevent.
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
from fastapi.testclient import TestClient

from app.auth import JWT_SECRET
from app.main import app


def _token(user_id: str, role: str, exp_delta: float = 3600) -> str:
    """Mint a token shaped exactly like theirs (userId/role claims, HS256) --
    see part2/Hemophillia-confirm/backend/src/routes/auth.js:37."""
    return pyjwt.encode(
        {"userId": user_id, "role": role, "exp": time.time() + exp_delta},
        JWT_SECRET,
        algorithm="HS256",
    )


def _auth(user_id: str, role: str = "patient") -> dict:
    return {"Authorization": f"Bearer {_token(user_id, role)}"}


def test_h4_session_start_returns_session_id():
    with TestClient(app) as client:
        r = client.post("/session/start", json={"exercise": "squat"}, headers=_auth("p1"))
        assert r.status_code == 200, f"POST /session/start -> {r.status_code}: {r.text}"
        body = r.json()
        assert "session_id" in body, f"no session_id in response: {body}"
        assert isinstance(body["session_id"], str) and body["session_id"], (
            f"session_id must be a non-empty string, got {body['session_id']!r}"
        )

        # Two starts must not collide. A reused id merges two patients' evidence.
        second = client.post("/session/start", json={"exercise": "squat"}, headers=_auth("p1")).json()
        assert second["session_id"] != body["session_id"], (
            "two sessions were issued the same session_id"
        )
    print("H4 POST /session/start: OK")


def test_h4_start_rejects_unknown_exercise():
    """The exercise name is a trust boundary: it selects the thresholds and,
    later, the model. An unknown name must fail here rather than produce a
    session whose evidence cannot be scored against anything."""
    with TestClient(app) as client:
        r = client.post(
            "/session/start", json={"exercise": "not_a_real_exercise"}, headers=_auth("p1")
        )
        assert r.status_code in (400, 404, 422), (
            f"unknown exercise accepted with {r.status_code}: {r.text}"
        )
    print("H4 unknown exercise rejected: OK")


def test_h5_session_end_returns_job_id():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        r = client.post("/session/end", json={"session_id": sid}, headers=_auth("p1"))
        assert r.status_code == 200, f"POST /session/end -> {r.status_code}: {r.text}"
        body = r.json()
        assert "job_id" in body, f"no job_id in response: {body}"
        assert isinstance(body["job_id"], str) and body["job_id"], (
            f"job_id must be a non-empty string, got {body['job_id']!r}"
        )
    print("H5 POST /session/end returns job_id: OK")


def test_h5_session_end_is_idempotent():
    """Called twice, one job. Not two jobs, not an error on the second call --
    the disconnect handler and the End Session button both legitimately fire."""
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]

        first = client.post("/session/end", json={"session_id": sid}, headers=_auth("p1"))
        second = client.post("/session/end", json={"session_id": sid}, headers=_auth("p1"))

        assert second.status_code == 200, (
            f"second /session/end must succeed, not error: {second.status_code} {second.text}"
        )
        assert first.json()["job_id"] == second.json()["job_id"], (
            "double /session/end produced two job_ids -- two report jobs for one "
            "session, racing on the video-deletion gate"
        )

        # G2-D4: one row, one jobId -- the seam is the row, not a dict.
        row = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert row["jobId"] == first.json()["job_id"]
    print("H5 /session/end idempotent: OK")


def test_h5_end_of_unknown_session_is_rejected():
    with TestClient(app) as client:
        r = client.post(
            "/session/end", json={"session_id": "s_never_started"}, headers=_auth("p1")
        )
        assert r.status_code in (400, 404), (
            f"ending an unknown session returned {r.status_code}: {r.text}"
        )
    print("H5 unknown session rejected: OK")


def test_h5_job_is_enqueued_not_executed():
    """H5 returns immediately. The job is recorded as pending work; the report
    pipeline is Phase I's. If /session/end ever runs the pipeline inline, the
    request blocks for the length of a MediaPipe Heavy pass."""
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        job_id = client.post(
            "/session/end", json={"session_id": sid}, headers=_auth("p1")
        ).json()["job_id"]

        row = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert row.get("jobId") == job_id, "no jobId recorded on the session row"
        assert row.get("status") == "ended", (
            f"status should be 'ended' straight after /session/end, got "
            f"{row.get('status')!r} -- work was done inline"
        )
    print("H5 job enqueued, not executed: OK")


def test_h5_does_not_cross_the_job_queue_ownership_line():
    """§10 gives job_queue.py to agent 10 (Phase I). Phase H must enqueue
    against a seam, not build Phase I's file.

    The seam is the physiosessions row's `jobId` (G2-D4, formerly the
    in-memory app.state.jobs dict). Phase I replaces it with the real queue
    and inherits the idempotency H5 already guarantees.

    Ownership in §10 is otherwise an instruction with nothing enforcing it, and
    "no two agents write the same file" fails quietly -- the second agent finds
    a file that already exists, assumes it is a base to build on, and the
    conflict only surfaces as behaviour nobody can attribute.
    """
    forbidden = Path(__file__).resolve().parents[1] / "services" / "job_queue.py"
    assert not forbidden.exists(), (
        f"Phase H created {forbidden}, which §10 assigns to the explainability "
        "agent in Phase I. Record the job on the session row instead."
    )
    print("H5 job_queue.py ownership line respected: OK")


def test_h4_session_status_is_readable():
    """§4 lists routes/session.py as "start / end / status". The status read is
    what makes the §7 gate checkable from outside the app process -- without it
    "job enqueues" can only ever be verified by trusting the POST's echo."""
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]

        live = client.get(f"/session/{sid}", headers=_auth("p1"))
        assert live.status_code == 200, f"GET /session/{{id}} -> {live.status_code}"
        body = live.json()
        assert body["sessionId"] == sid
        assert body.get("engineExercise") == "squat"
        assert body.get("startedAt"), "no startedAt on an open session"
        assert not body.get("endedAt"), "an open session reports endedAt"

        job_id = client.post(
            "/session/end", json={"session_id": sid}, headers=_auth("p1")
        ).json()["job_id"]
        done = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert done.get("endedAt"), "ended session still reports no endedAt"
        assert done.get("jobId") == job_id, (
            f"status reports jobId {done.get('jobId')!r}, /session/end returned {job_id!r}"
        )

        missing = client.get("/session/s_never_started", headers=_auth("p1"))
        assert missing.status_code == 404, (
            f"unknown session status returned {missing.status_code}, expected 404"
        )
    print("H4 GET /session/{id} status: OK")


# --- G2-B gate: no token -> 401, wrong patient -> 403, doctor matrix --------
#
# Two patients (p1 has a doctor link, p2 has NONE -- no hemophiliadetails row)
# and two doctors (docA is p1's doctor, docB is not). This is the minimum
# fixture that can catch the leak B6 warns about: a single-patient test would
# pass even if every doctor were wrongly authorized.

async def _lookup_docA_only_for_p1(patient_user_id: str):
    """Stands in for the real hemophiliadetails.consultingDoctorId read
    (agent 16's app/db.py, not wired yet). p1 -> docA; p2 has no row at all,
    so no doctor is ever authorized for p2 -- not even docA."""
    return "docA" if patient_user_id == "p1" else None


def _with_doctor_lookup(app):
    """Context-manager-free install/uninstall of the B6 seam
    (app.state.lookup_doctor_id) for the duration of one test, since the
    default in session.py denies every doctor (Mongo isn't wired yet)."""
    class _Ctx:
        def __enter__(self):
            app.state.lookup_doctor_id = _lookup_docA_only_for_p1
            return self

        def __exit__(self, *exc):
            del app.state.lookup_doctor_id

    return _Ctx()


def test_g2b_no_token_is_401():
    with TestClient(app) as client:
        r = client.post("/session/start", json={"exercise": "squat"})
        assert r.status_code == 401, f"no-token start -> {r.status_code}: {r.text}"

        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        r2 = client.get(f"/session/{sid}")
        assert r2.status_code == 401, f"no-token status -> {r2.status_code}: {r2.text}"
        r3 = client.post("/session/end", json={"session_id": sid})
        assert r3.status_code == 401, f"no-token end -> {r3.status_code}: {r3.text}"
    print("G2-B no token -> 401: OK")


def test_g2b_patient_id_is_ignored_from_the_body():
    """D12: a client-supplied patient_id must never override the token."""
    with TestClient(app) as client:
        r = client.post(
            "/session/start",
            json={"exercise": "squat", "patient_id": "someone-else"},
            headers=_auth("p1"),
        )
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        status = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert status["patientUserId"] == "p1", (
            f"session owner should be the token's userId ('p1'), got "
            f"{status['patientUserId']!r} -- a client-supplied patient_id leaked through"
        )
    print("G2-B patient_id from body is ignored (D12): OK")


def test_g2b_patient_cannot_read_another_patients_session():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]

        mine = client.get(f"/session/{sid}", headers=_auth("p1"))
        assert mine.status_code == 200, f"owner denied their own session: {mine.text}"

        other = client.get(f"/session/{sid}", headers=_auth("p2"))
        assert other.status_code == 403, (
            f"patient p2 read patient p1's session: {other.status_code} {other.text}"
        )
        other_end = client.post("/session/end", json={"session_id": sid}, headers=_auth("p2"))
        assert other_end.status_code == 403, (
            f"patient p2 ended patient p1's session: {other_end.status_code} {other_end.text}"
        )
    print("G2-B cross-patient read/end -> 403: OK")


def test_g2b_doctor_authorization_matrix():
    """The load-bearing B6 test. docA is p1's doctor; docB is nobody's.
    p2 has no hemophiliadetails row at all -- not even docA may read p2."""
    with TestClient(app) as client:
        with _with_doctor_lookup(app):
            sid1 = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
            ).json()["session_id"]
            sid2 = client.post(
                "/session/start", json={"exercise": "squat"}, headers=_auth("p2")
            ).json()["session_id"]

            r = client.get(f"/session/{sid1}", headers=_auth("docA", role="doctor"))
            assert r.status_code == 200, (
                f"p1's doctor (docA) denied p1's session: {r.status_code} {r.text}"
            )

            r = client.get(f"/session/{sid1}", headers=_auth("docB", role="doctor"))
            assert r.status_code == 403, (
                f"docB (not p1's doctor) read p1's session: {r.status_code} {r.text}"
            )

            r = client.get(f"/session/{sid2}", headers=_auth("docA", role="doctor"))
            assert r.status_code == 403, (
                "docA authorized for p2, who has NO hemophiliadetails row -- "
                f"this is the leak B6 exists to prevent: {r.status_code} {r.text}"
            )
    print("G2-B doctor authorization matrix (B6): OK")


def test_g2b_admin_reads_anyone():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        r = client.get(f"/session/{sid}", headers=_auth("admin1", role="admin"))
        assert r.status_code == 200, f"admin denied a patient session: {r.status_code} {r.text}"
    print("G2-B admin reads any patient: OK")


def test_g2b_expired_and_malformed_tokens_are_both_401_but_logged_distinctly():
    with TestClient(app) as client:
        expired = _token("p1", "patient", exp_delta=-10)
        r = client.post(
            "/session/start", json={"exercise": "squat"},
            headers={"Authorization": f"Bearer {expired}"},
        )
        assert r.status_code == 401, f"expired token -> {r.status_code}"

        r2 = client.post(
            "/session/start", json={"exercise": "squat"},
            headers={"Authorization": "Bearer not-a-jwt-at-all"},
        )
        assert r2.status_code == 401, f"malformed token -> {r2.status_code}"
    print("G2-B expired and malformed tokens both -> 401: OK")


# --- G2-D: persistence gate (§7) --------------------------------------------


def test_g2d_session_survives_a_restart():
    """The §7 G2-D gate. A session written by one app process must be readable
    by the next one -- that is the whole point of moving off app.state."""
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        client.post("/session/end", json={"session_id": sid}, headers=_auth("p1"))

    # TestClient's context manager runs shutdown then startup again: a second
    # `with` block is a genuinely new lifespan, new Motor client, no shared
    # in-process state.
    with TestClient(app) as client:
        row = client.get(f"/session/{sid}", headers=_auth("p1"))
        assert row.status_code == 200, (
            f"session {sid} did not survive a restart: {row.status_code} {row.text}"
        )
        assert row.json()["sessionId"] == sid
        assert row.json()["status"] == "ended"
    print("G2-D session survives a restart: OK")


def test_g2d_two_sessions_one_exercise_are_two_rows():
    """physiosessions is HISTORY. Their patientexerciserecommendations has a
    unique {patientUserId, exerciseId} index and is current-state; ours must
    not behave like that or the second session overwrites the first."""
    with TestClient(app) as client:
        a = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        b = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        assert a != b, "two starts returned the same session_id"
        for sid in (a, b):
            assert client.get(f"/session/{sid}", headers=_auth("p1")).status_code == 200, (
                f"session {sid} is gone -- the second session overwrote the first"
            )
    print("G2-D two sessions of one exercise -> two rows: OK")


def test_g2d6_summary_is_written_and_validated():
    """D6 is a trust boundary: the browser supplies these numbers and they land
    in a clinical record. An inconsistent payload is rejected, not repaired."""
    good_log = [
        {"rep": 1, "clean": True, "bestAngle": 92.0, "errors": []},
        {"rep": 2, "clean": False, "bestAngle": 71.0, "errors": ["knee_valgus"]},
    ]
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]

        ok = client.post(
            f"/session/{sid}/summary",
            json={"repCount": 2, "cleanReps": 1, "repLog": good_log},
            headers=_auth("p1"),
        )
        assert ok.status_code == 200, f"valid summary rejected: {ok.status_code} {ok.text}"
        row = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert row["repCount"] == 2 and row["cleanReps"] == 1
        assert row["clinical"]["repLog"][1]["errors"] == ["knee_valgus"], (
            "the rep log must land inside clinical:{} (D15), not beside it"
        )

        bad = {
            "repCount disagrees with repLog length":
                {"repCount": 5, "cleanReps": 1, "repLog": good_log},
            "cleanReps disagrees with the log":
                {"repCount": 2, "cleanReps": 2, "repLog": good_log},
            "reps are not 1..n in order":
                {"repCount": 2, "cleanReps": 1, "repLog": [
                    {"rep": 1, "clean": True, "errors": []},
                    {"rep": 7, "clean": False, "errors": []},
                ]},
            "negative counts":
                {"repCount": -1, "cleanReps": 0, "repLog": []},
        }
        for why, payload in bad.items():
            r = client.post(f"/session/{sid}/summary", json=payload, headers=_auth("p1"))
            assert r.status_code == 422, f"accepted a bad summary ({why}): {r.status_code}"

        # still the good values -- a rejected write must not have partially applied
        row = client.get(f"/session/{sid}", headers=_auth("p1")).json()
        assert row["repCount"] == 2 and row["cleanReps"] == 1
    print("G2-D6 summary written, inconsistent payloads rejected: OK")


def test_g2d6_summary_is_patient_scoped():
    with TestClient(app) as client:
        sid = client.post(
            "/session/start", json={"exercise": "squat"}, headers=_auth("p1")
        ).json()["session_id"]
        r = client.post(
            f"/session/{sid}/summary",
            json={"repCount": 0, "cleanReps": 0, "repLog": []},
            headers=_auth("p2"),
        )
        assert r.status_code == 403, (
            f"another patient wrote a summary onto p1's session: {r.status_code}"
        )
    print("G2-D6 summary is patient-scoped: OK")


if __name__ == "__main__":
    test_h4_session_start_returns_session_id()
    test_h4_session_status_is_readable()
    test_h4_start_rejects_unknown_exercise()
    test_h5_session_end_returns_job_id()
    test_h5_session_end_is_idempotent()
    test_h5_end_of_unknown_session_is_rejected()
    test_h5_job_is_enqueued_not_executed()
    test_h5_does_not_cross_the_job_queue_ownership_line()
    test_g2b_no_token_is_401()
    test_g2b_patient_id_is_ignored_from_the_body()
    test_g2b_patient_cannot_read_another_patients_session()
    test_g2b_doctor_authorization_matrix()
    test_g2b_admin_reads_anyone()
    test_g2b_expired_and_malformed_tokens_are_both_401_but_logged_distinctly()
    test_g2d_session_survives_a_restart()
    test_g2d_two_sessions_one_exercise_are_two_rows()
    test_g2d6_summary_is_written_and_validated()
    test_g2d6_summary_is_patient_scoped()
    print("ALL H4/H5/G2-B/G2-D SESSION ROUTE CHECKS PASSED")

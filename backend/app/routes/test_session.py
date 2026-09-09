"""H4, H5 — session lifecycle endpoints. No framework.

Run from backend/:  ../venv/bin/python app/routes/test_session.py

Contract these tests define for app/routes/session.py:

    POST /session/start   body {"exercise": "<name>"}
                          -> 200 {"session_id": "<str>", ...}
    POST /session/end     body {"session_id": "<str>"}
                          -> 200 {"job_id": "<str>", ...}
                          returns IMMEDIATELY; idempotent.

H5's idempotency is the load-bearing clause. `POST /session/end` fires from the
End Session button (J7) AND from the abrupt-disconnect handler (H6). Both firing
on the same session is the normal case on mobile, not an edge case. A
non-idempotent end produces two report jobs for one session, which means two
MediaPipe Heavy runs, two reports, and a race on the §8 video-deletion gate --
where the loser deletes the video the winner still needs.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient

from app.main import app


def test_h4_session_start_returns_session_id():
    with TestClient(app) as client:
        r = client.post("/session/start", json={"exercise": "squat"})
        assert r.status_code == 200, f"POST /session/start -> {r.status_code}: {r.text}"
        body = r.json()
        assert "session_id" in body, f"no session_id in response: {body}"
        assert isinstance(body["session_id"], str) and body["session_id"], (
            f"session_id must be a non-empty string, got {body['session_id']!r}"
        )

        # Two starts must not collide. A reused id merges two patients' evidence.
        second = client.post("/session/start", json={"exercise": "squat"}).json()
        assert second["session_id"] != body["session_id"], (
            "two sessions were issued the same session_id"
        )
    print("H4 POST /session/start: OK")


def test_h4_start_rejects_unknown_exercise():
    """The exercise name is a trust boundary: it selects the thresholds and,
    later, the model. An unknown name must fail here rather than produce a
    session whose evidence cannot be scored against anything."""
    with TestClient(app) as client:
        r = client.post("/session/start", json={"exercise": "not_a_real_exercise"})
        assert r.status_code in (400, 404, 422), (
            f"unknown exercise accepted with {r.status_code}: {r.text}"
        )
    print("H4 unknown exercise rejected: OK")


def test_h5_session_end_returns_job_id():
    with TestClient(app) as client:
        sid = client.post("/session/start", json={"exercise": "squat"}).json()["session_id"]
        r = client.post("/session/end", json={"session_id": sid})
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
        sid = client.post("/session/start", json={"exercise": "squat"}).json()["session_id"]

        first = client.post("/session/end", json={"session_id": sid})
        second = client.post("/session/end", json={"session_id": sid})

        assert second.status_code == 200, (
            f"second /session/end must succeed, not error: {second.status_code} {second.text}"
        )
        assert first.json()["job_id"] == second.json()["job_id"], (
            "double /session/end produced two job_ids -- two report jobs for one "
            "session, racing on the video-deletion gate"
        )

        jobs = getattr(app.state, "jobs", None)
        assert jobs is not None, "no job registry on app.state.jobs"
        for_session = [j for j in jobs.values() if j.get("session_id") == sid]
        assert len(for_session) == 1, (
            f"expected exactly 1 job for session {sid}, found {len(for_session)}"
        )
    print("H5 /session/end idempotent: OK")


def test_h5_end_of_unknown_session_is_rejected():
    with TestClient(app) as client:
        r = client.post("/session/end", json={"session_id": "s_never_started"})
        assert r.status_code in (400, 404), (
            f"ending an unknown session returned {r.status_code}: {r.text}"
        )
    print("H5 unknown session rejected: OK")


def test_h5_job_is_enqueued_not_executed():
    """H5 returns immediately. The job is recorded as pending work; the report
    pipeline is Phase I's. If /session/end ever runs the pipeline inline, the
    request blocks for the length of a MediaPipe Heavy pass."""
    with TestClient(app) as client:
        sid = client.post("/session/start", json={"exercise": "squat"}).json()["session_id"]
        job_id = client.post("/session/end", json={"session_id": sid}).json()["job_id"]

        job = app.state.jobs[job_id]
        assert job.get("status") == "queued", (
            f"job status should be 'queued' straight after /session/end, got "
            f"{job.get('status')!r} -- work was done inline"
        )
        assert job.get("session_id") == sid
    print("H5 job enqueued, not executed: OK")


def test_h5_does_not_cross_the_job_queue_ownership_line():
    """§10 gives job_queue.py to agent 10 (Phase I). Phase H must enqueue
    against a seam, not build Phase I's file.

    The seam is `app.state.jobs`: a dict recording that a session has work
    pending. Phase I replaces it with the real queue and inherits the
    idempotency H5 already guarantees.

    Ownership in §10 is otherwise an instruction with nothing enforcing it, and
    "no two agents write the same file" fails quietly -- the second agent finds
    a file that already exists, assumes it is a base to build on, and the
    conflict only surfaces as behaviour nobody can attribute.
    """
    forbidden = Path(__file__).resolve().parents[1] / "services" / "job_queue.py"
    assert not forbidden.exists(), (
        f"Phase H created {forbidden}, which §10 assigns to the explainability "
        "agent in Phase I. Enqueue via app.state.jobs instead."
    )
    print("H5 job_queue.py ownership line respected: OK")


def test_h4_session_status_is_readable():
    """§4 lists routes/session.py as "start / end / status". The status read is
    what makes the §7 gate checkable from outside the app process -- without it
    "job enqueues" can only ever be verified by trusting the POST's echo."""
    with TestClient(app) as client:
        sid = client.post("/session/start", json={"exercise": "squat"}).json()["session_id"]

        live = client.get(f"/session/{sid}")
        assert live.status_code == 200, f"GET /session/{{id}} -> {live.status_code}"
        body = live.json()
        assert body["session_id"] == sid
        assert body.get("exercise") == "squat"
        assert body.get("started_at"), "no started_at on an open session"
        assert not body.get("ended_at"), "an open session reports ended_at"

        job_id = client.post("/session/end", json={"session_id": sid}).json()["job_id"]
        done = client.get(f"/session/{sid}").json()
        assert done.get("ended_at"), "ended session still reports no ended_at"
        assert done.get("job_id") == job_id, (
            f"status reports job_id {done.get('job_id')!r}, /session/end returned {job_id!r}"
        )

        missing = client.get("/session/s_never_started")
        assert missing.status_code == 404, (
            f"unknown session status returned {missing.status_code}, expected 404"
        )
    print("H4 GET /session/{id} status: OK")


if __name__ == "__main__":
    test_h4_session_start_returns_session_id()
    test_h4_session_status_is_readable()
    test_h4_start_rejects_unknown_exercise()
    test_h5_session_end_returns_job_id()
    test_h5_session_end_is_idempotent()
    test_h5_end_of_unknown_session_is_rejected()
    test_h5_job_is_enqueued_not_executed()
    test_h5_does_not_cross_the_job_queue_ownership_line()
    print("ALL H4/H5 SESSION ROUTE CHECKS PASSED")

"""Session lifecycle — H4 (start/status), H5 (end, idempotent).

    POST /session/start   {"exercise": "<name>"} -> {"session_id": ...}
    POST /session/end     {"session_id": "<id>"}  -> {"job_id": ...}
    GET  /session/{id}                            -> status record

H5's job seam: app.state.jobs is a dict Phase I (job_queue.py, §10 agent 10)
will replace. end_session() only records that work is pending -- it never
runs the pipeline inline (R6/R8).

end_session() and session_exists() are imported by realtime-backend-agent's
app/ws/session_ws.py (session_exists to reject a WS for a session that was
never started, end_session from the H6 abrupt-disconnect handler). Signatures
are pinned; do not change them.
"""
from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.logging_setup import get_logger, correlation

router = APIRouter()
log = get_logger("session")


class SessionStart(BaseModel):
    exercise: str
    patient_id: str | None = None


class SessionEnd(BaseModel):
    session_id: str


def session_exists(app, session_id: str) -> bool:
    return session_id in getattr(app.state, "sessions", {})


async def end_session(app, session_id: str) -> str:
    """Idempotent: the End Session button, the WS {"type":"end"} message, and
    the H6 abrupt-disconnect handler all call this for the same session. All
    three must converge on one job_id -- see docs/H4-H6-session_routes.md."""
    session = app.state.sessions[session_id]
    if session.get("job_id"):
        return session["job_id"]

    job_id = f"job_{uuid.uuid4().hex}"
    session["ended_at"] = time.time()
    session["status"] = "queued"
    session["job_id"] = job_id
    app.state.jobs[job_id] = {
        "job_id": job_id,
        "session_id": session_id,
        "status": "queued",
    }
    with correlation(session_id=session_id):
        # job_id is logged here because app.state.jobs is in-memory: on a
        # restart the job record is gone while the evidence .jsonl survives.
        # This line is the only durable link from a session to the job that
        # was enqueued for it, which §8b.9's Phase L gate ("reconstruct the
        # run from its logs alone") depends on. Log the decision INPUTS too
        # (§8b.4) -- how much evidence the job will actually have to read.
        log.info(
            "session_ended",
            exercise=session["exercise"],
            job_id=job_id,
            started_at=session.get("started_at"),
            ended_at=session["ended_at"],
            duration_s=round(session["ended_at"] - session["started_at"], 3)
            if session.get("started_at") else None,
        )
    return job_id


@router.post("/session/start")
async def session_start(body: SessionStart, request: Request):
    registry = request.app.state.exercise_registry
    if body.exercise not in registry:
        raise HTTPException(status_code=404, detail=f"unknown exercise: {body.exercise!r}")

    session_id = f"s_{uuid.uuid4().hex}"
    request.app.state.sessions[session_id] = {
        "session_id": session_id,
        "exercise": body.exercise,
        "patient_id": body.patient_id,
        "started_at": time.time(),
        "ended_at": None,
        "status": "active",
        "job_id": None,
    }
    with correlation(session_id=session_id):
        log.info("session_started", exercise=body.exercise, patient_id=body.patient_id)
    return {"session_id": session_id}


@router.post("/session/end")
async def session_end(body: SessionEnd, request: Request):
    app = request.app
    if not session_exists(app, body.session_id):
        raise HTTPException(status_code=404, detail=f"unknown session: {body.session_id!r}")
    job_id = await end_session(app, body.session_id)
    return {"job_id": job_id}


@router.get("/session/{session_id}")
async def session_status(session_id: str, request: Request):
    sessions = request.app.state.sessions
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail=f"unknown session: {session_id!r}")
    return sessions[session_id]


if __name__ == "__main__":
    # Runnable self-check: idempotency of end_session() in isolation, no HTTP.
    import asyncio

    class _App:
        class state:
            sessions = {}
            jobs = {}

    _App.state.sessions["s_x"] = {
        "session_id": "s_x", "exercise": "squat", "ended_at": None,
        "status": "active", "job_id": None,
    }

    async def _run():
        j1 = await end_session(_App, "s_x")
        j2 = await end_session(_App, "s_x")
        assert j1 == j2, "end_session not idempotent"
        assert len(_App.state.jobs) == 1
        assert _App.state.jobs[j1]["status"] == "queued"
        assert session_exists(_App, "s_x") and not session_exists(_App, "s_missing")

    asyncio.run(_run())
    print("OK: session.py end_session/session_exists self-check passed")

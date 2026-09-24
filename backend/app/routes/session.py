"""Session lifecycle — H4 (start/status), H5 (end, idempotent), G2-B3 (auth),
G2-D4/D5/D6 (persistence).

    POST /session/start        {"exercise": ...}          -> {"session_id": ...}
    POST /session/end          {"session_id": "<id>"}     -> {"job_id": ...}
    POST /session/{id}/summary {repCount, cleanReps, repLog} -> {"ok": true}
    GET  /session/{id}                                    -> the physiosessions row

Sessions live in MongoDB `physiosessions` (integration plan §4), not in
memory: app.state.sessions and app.state.jobs are gone (G2-D4). A completed
session therefore survives a backend restart, and two sessions of the same
exercise by one patient are two rows -- this collection is history, unlike
their patientexerciserecommendations which is current-state.

We own physiosessions and nothing else (§1). patientprofiles and
hemophiliadetails are read at start (D5) only to SNAPSHOT patientId and
doctorUserId onto our row -- never joined at read time, never written.

All routes require `Authorization: Bearer <jwt>` (app.auth.get_current_user).
Patient identity is ALWAYS derived from the token (D12) -- SessionStart does
not accept a patient_id, and any client-supplied one is ignored. end/status
are patient-scoped via authorize_patient_access() (app/auth.py, B6), so a
patient reaches only their own sessions and a doctor only their linked
patients'.

SIGNATURE CHANGE, G2-D4: session_exists() and end_session() are imported by
app/ws/session_ws.py. end_session() keeps its signature; session_exists() is
now `async` because the answer lives in Mongo and a sync pymongo call inside
an async handler would block the event loop (D1). Its two call sites in
session_ws.py were updated in the same change; there are no others.

H5's job seam: end_session() mints a job_id and records it ON THE ROW
(`jobId`). It never runs the pipeline inline (R6/R8) -- Phase I's job_queue.py
(§10 agent 10) picks work up from there.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app import db as dbmod
from app.auth import CurrentUser, authorize_patient_access, get_current_user
from app.logging_setup import get_logger, correlation

router = APIRouter(lifespan=dbmod.lifespan)

# Strong references to fire-and-forget side-effect tasks (report generation,
# EMG capture start/stop). The event loop keeps only a WEAK reference to a
# bare asyncio.create_task(), so a task can be garbage-collected before it
# runs -- the same bug session_ws.py's _pending_finalizers guards against.
# Symptom seen live: a session ends, stop_capture never fires, Flask records
# forever and the .partial.csv is never finalised.
_bg_tasks: set = set()


def _spawn(coro):
    t = asyncio.create_task(coro)
    _bg_tasks.add(t)
    t.add_done_callback(_bg_tasks.discard)
    return t
 
log = get_logger("session")

# D6 caps. A rep log is one entry per repetition of one exercise session; a
# few hundred is already an unrealistically long session, and this is a
# trust boundary -- the client supplies it.
MAX_REPS = 500
MAX_ERRORS_PER_REP = 20


# G2-G6: the session's display language, from their SPA's
# localStorage.preferredLanguage. ALLOWLISTED here rather than stored as
# given: it is interpolated into the Gemini prompt, so free text would let a
# client rewrite the model's instructions -- the clinical rules included.
LANGUAGES = {"en", "hi", "mr"}
DEFAULT_LANGUAGE = "en"


class SessionStart(BaseModel):
    exercise: str  # OUR vocabulary -- must be in the exercise registry
    # THEIR exerciseId and the recommendation this session came from (D10/D12).
    # The deep link carries both; a session started straight from our own
    # client has neither. Identity is never taken from here -- only the JWT.
    exercise_id: str | None = None
    recommendation_id: str | None = None
    language: str | None = None  # "en" | "hi" | "mr"; anything else -> "en"


class SessionEnd(BaseModel):
    session_id: str


class RepLogIn(BaseModel):
    rep: int
    clean: bool
    bestAngle: float | None = None
    errors: list[str] = Field(default_factory=list)


class SessionSummary(BaseModel):
    repCount: int
    cleanReps: int
    repLog: list[RepLogIn] = Field(default_factory=list)


def _sessions(app):
    return app.state.db.physiosessions


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def session_exists(app, session_id: str) -> bool:
    """ASYNC as of G2-D4 (see module docstring). session_ws.py awaits this."""
    doc = await _sessions(app).find_one({"sessionId": session_id}, {"_id": 1})
    return doc is not None


async def get_session(app, session_id: str) -> dict | None:
    return await _sessions(app).find_one({"sessionId": session_id})


def _public(doc: dict) -> dict:
    """Row -> JSON-safe response. Mongo's _id and BSON ObjectIds are not
    JSON-serializable, and _id is ours alone -- the client keys off sessionId."""
    out = {k: v for k, v in doc.items() if k != "_id"}
    for key in ("patientUserId", "recommendationId", "doctorUserId"):
        if out.get(key) is not None:
            out[key] = str(out[key])
    return out


async def _no_doctor_lookup(patient_user_id: str) -> str | None:
    """Fallback when app/db.py's lifespan has not run (unit tests that stub
    app.state directly). No doctor link can be proven -> deny every doctor."""
    return None


def get_lookup_doctor_id(app):
    """Set by app/db.py's lifespan to the real motor-backed lookup of
    hemophiliadetails.consultingDoctorId. session_ws.py's WS handshake reads
    the same seam -- there is only one."""
    return getattr(app.state, "lookup_doctor_id", _no_doctor_lookup)


async def _authorize_or_403(app, user: CurrentUser, doc: dict) -> None:
    # §3: authorize on patientUserId (the ObjectId), never the display
    # patientId (PATxxxxxx).
    allowed = await authorize_patient_access(
        user, str(doc.get("patientUserId")), get_lookup_doctor_id(app)
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="not authorized for this session")


async def _load_or_404(app, session_id: str) -> dict:
    doc = await get_session(app, session_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"unknown session: {session_id!r}")
    return doc


async def end_session(app, session_id: str) -> str:
    """Idempotent: the End Session button, the WS {"type":"end"} message, and
    the H6 abrupt-disconnect handler all call this for the same session. All
    three must converge on one job_id -- see docs/H4-H6-session_routes.md.

    Idempotency now rests on the row's `jobId` instead of the in-memory
    session dict: the first call sets it, later calls read it back.
    """
    doc = await get_session(app, session_id)
    if doc is None:
        raise KeyError(session_id)
    if doc.get("jobId"):
        return doc["jobId"]

    job_id = f"job_{uuid.uuid4().hex}"
    ended_at = _now()
    started_at = doc.get("startedAt")
    duration_s = None
    if isinstance(started_at, datetime):
        # Mongo hands datetimes back naive-UTC; make the subtraction safe
        # either way rather than depending on the driver's tz_aware setting.
        if started_at.tzinfo is None:
            started_at = started_at.replace(tzinfo=timezone.utc)
        duration_s = round((ended_at - started_at).total_seconds(), 3)

    await _sessions(app).update_one(
        {"sessionId": session_id, "jobId": None},
        {"$set": {
            "endedAt": ended_at,
            "durationS": duration_s,
            "status": "ended",
            "jobId": job_id,
            "updatedAt": ended_at,
        }},
    )
    # Lost the race with a concurrent end (WS disconnect vs POST /session/end):
    # whoever wrote first owns the job_id, so read it back rather than
    # returning one that was never persisted.
    winner = await get_session(app, session_id)
    job_id = (winner or {}).get("jobId", job_id)

    with correlation(session_id=session_id):
        # §8b.9's Phase L gate ("reconstruct the run from its logs alone")
        # depends on this line: it is the durable link from a session to the
        # job enqueued for it. Log the decision INPUTS too (§8b.4).
        log.info(
            "session_ended",
            exercise=doc.get("engineExercise"),
            job_id=job_id,
            started_at=doc.get("startedAt").isoformat() if isinstance(doc.get("startedAt"), datetime) else None,
            ended_at=ended_at.isoformat(),
            duration_s=duration_s,
        )
    # G2-F4/D8: the numeric summary is durable by the update_one above -- fire
    # the Gemini report only AFTER it, so a Gemini failure can cost the report
    # text and never the counts.
    #
    # This lives in end_session() rather than in the /session/end route because
    # the route is only ONE of three ways a session ends. The other two --
    # the WS {"type":"end"} message and the H6 abrupt-disconnect handler --
    # call end_session() directly, and per H6 an abrupt disconnect is the
    # normal case on mobile, not an edge case. Hooked at the route, most real
    # sessions would never get a report at all. The jobId guard above makes
    # this run exactly once per session.
    #
    # Imported here, not at module top, to avoid a session.py <-> gemini_report
    # import cycle at load time.
    from app.services.gemini_report import generate_report
    _spawn(generate_report(app, session_id))
    # O4: finalise the EMG recording -- without this the ids never reach
    # history.json. Same fire-and-forget/breaker rules as capture start.
    from app.services import emg_client
    _spawn(emg_client.stop_capture(emg_client.EMG_SERVICE_URL))
    return job_id


@router.post("/session/start")
async def session_start(
    body: SessionStart, request: Request, user: CurrentUser = Depends(get_current_user)
):
    app = request.app
    registry = app.state.exercise_registry
    if body.exercise not in registry:
        raise HTTPException(status_code=404, detail=f"unknown exercise: {body.exercise!r}")

    # D5: resolve the display id and the doctor link ONCE, here, and snapshot
    # them onto the row. Both reads are on their collections -- read-only (§1).
    patient_display_id = await dbmod.resolve_patient_id(app.state.db, user.user_id)
    doctor_user_id = await get_lookup_doctor_id(app)(user.user_id)

    session_id = f"s_{uuid.uuid4().hex}"
    now = _now()
    doc = {
        "sessionId": session_id,
        "patientUserId": dbmod.to_object_id(user.user_id),  # D12: from the JWT only
        "patientId": patient_display_id,                    # display only
        "recommendationId": dbmod.to_object_id(body.recommendation_id),
        "doctorUserId": dbmod.to_object_id(doctor_user_id),
        "language": body.language if body.language in LANGUAGES else DEFAULT_LANGUAGE,
        "exerciseId": body.exercise_id or body.exercise,    # theirs
        "engineExercise": body.exercise,                    # ours
        "startedAt": now,
        "endedAt": None,
        "durationS": None,
        "repCount": 0,
        "cleanReps": 0,
        "status": "active",
        "jobId": None,
        "clinical": {
            "repLog": [],
            "report": {
                "text": None, "model": None, "promptVersion": None,
                "generatedAt": None, "error": None,
            },
            "video": {
                "path": None, "bytes": None, "mimeType": None,
                "consentVideoMonitoring": False, "expiresAt": None,
                "deletedAt": None,
            },
        },
        "createdAt": now,
        "updatedAt": now,
    }
    await _sessions(app).insert_one(doc)
    # O4/D31: tag the EMG recording with this session and patient. Fire-and-
    # forget, like generate_report above: emg_client never raises and honours
    # its circuit breaker, so a dead or slow EMG service cannot delay or fail
    # session start. D12: the patient id comes from the JWT, never the body.
    from app.services import emg_client
    _spawn(
        emg_client.start_capture(
            emg_client.EMG_SERVICE_URL,
            patient_user_id=user.user_id,
            session_id=session_id,
        )
    )
    with correlation(session_id=session_id):
        log.info("session_started", exercise=body.exercise, patient_id=user.user_id)
    return {"session_id": session_id}


@router.post("/session/end")
async def session_end(
    body: SessionEnd, request: Request, user: CurrentUser = Depends(get_current_user)
):
    app = request.app
    doc = await _load_or_404(app, body.session_id)
    await _authorize_or_403(app, user, doc)
    job_id = await end_session(app, body.session_id)
    return {"job_id": job_id}


@router.post("/session/{session_id}/summary")
async def session_summary(
    session_id: str,
    body: SessionSummary,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
):
    """D6: the client's own count of what happened, written at session end.

    This is a trust boundary -- the browser supplies these numbers and they
    end up in a clinical record. Reject an inconsistent payload; never
    silently truncate it into something plausible.
    """
    app = request.app
    doc = await _load_or_404(app, session_id)
    await _authorize_or_403(app, user, doc)

    rep_log = body.repLog
    if body.repCount < 0 or body.cleanReps < 0:
        raise HTTPException(status_code=422, detail="counts must not be negative")
    if body.repCount > MAX_REPS:
        raise HTTPException(status_code=422, detail=f"repCount exceeds {MAX_REPS}")
    if len(rep_log) != body.repCount:
        raise HTTPException(
            status_code=422,
            detail=f"repLog has {len(rep_log)} entries, repCount says {body.repCount}",
        )
    if body.cleanReps > body.repCount:
        raise HTTPException(status_code=422, detail="cleanReps exceeds repCount")
    if sum(1 for r in rep_log if r.clean) != body.cleanReps:
        raise HTTPException(status_code=422, detail="cleanReps disagrees with repLog")
    # Monotonic: reps are 1..n in order. A gap or a repeat means the client
    # dropped or replayed something, which makes the whole log untrustworthy.
    if [r.rep for r in rep_log] != list(range(1, len(rep_log) + 1)):
        raise HTTPException(status_code=422, detail="repLog reps are not 1..n in order")
    if any(len(r.errors) > MAX_ERRORS_PER_REP for r in rep_log):
        raise HTTPException(status_code=422, detail="too many errors on a rep")

    now = _now()
    await _sessions(app).update_one(
        {"sessionId": session_id},
        {"$set": {
            "repCount": body.repCount,
            "cleanReps": body.cleanReps,
            "clinical.repLog": [r.model_dump() for r in rep_log],
            "updatedAt": now,
        }},
    )
    with correlation(session_id=session_id):
        log.info("session_summary", rep_count=body.repCount, clean_reps=body.cleanReps)
    return {"ok": True}


@router.post("/session/calibrate")
async def session_calibrate(user: CurrentUser = Depends(get_current_user)):
    """R1.2a: pre-session calibration gate (docs/13 R1). No session id yet --
    this runs before /session/start. Never raises: a dead EMG service
    degrades to a normal response, exactly like start_capture/stop_capture."""
    from app.services import emg_client
    result = await emg_client.recalibrate(emg_client.EMG_SERVICE_URL)
    return result if result is not None else {"status": "unavailable"}


@router.get("/calibration")
async def session_calibration_status(user: CurrentUser = Depends(get_current_user)):
    """R1.2b: poll target for the calibrate gate. NOTE the bare path -- NOT
    /session/calibration, which /session/{session_id} below would swallow."""
    from app.services import emg_client
    status = await emg_client.get_emg_status(emg_client.EMG_SERVICE_URL)
    calibration = status.get("calibration") if isinstance(status, dict) else None
    calibrating = bool(status.get("calibrating")) if isinstance(status, dict) else False
    return {
        "calibrating": calibrating,
        "calibration": calibration,
        "ok": emg_client.calibration_ok(calibration),
    }


@router.get("/session/{session_id}")
async def session_status(
    session_id: str, request: Request, user: CurrentUser = Depends(get_current_user)
):
    app = request.app
    doc = await _load_or_404(app, session_id)
    await _authorize_or_403(app, user, doc)
    return _public(doc)

"""G2-F5/F6 -- report polling and video upload.

    POST /session/{session_id}/video   multipart upload -> {"ok": true, ...}

F5, polling: `GET /session/{id}` ALREADY EXISTS at app/routes/session.py and
returns the full row (`_public(doc)`), including `status`
("active"/"ended"/"reported"/"failed") and `clinical.report.{text,error,
generatedAt}`. That is everything a poller needs to tell "generating"
(status=="ended", report.text and report.error both None) from "failed"
(report.error set) from "done" (status=="reported", report.text set). No
duplicate route is built here -- see the report back to the integrator for
why this is the complete, not the lazy-shortcut, answer.

F6, video upload: multipart, size-capped, gated on
`patientprofiles.consentVideoMonitoring` (their collection, read-only -- §1).
The flag is snapshotted onto the row on EVERY attempt, accepted or not, per
§4's `clinical.video.consentVideoMonitoring`. The browser supplies both the
file and (indirectly) the consent state at read time, so both the content
type and the byte count are trust-boundary checks, not conveniences.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, UploadFile
from fastapi import Depends, File
from fastapi.responses import FileResponse

from app import db as dbmod
from app.auth import CurrentUser, get_current_user
from app.logging_setup import correlation, get_logger
from app.routes.session import _authorize_or_403, _load_or_404, _sessions

router = APIRouter()
log = get_logger("report")

VIDEO_DIR = Path(os.environ.get("VIDEO_DIR", "data/videos"))
# nginx already caps the request body at 200m (integration plan §5); this cap
# is ours independently -- never trust a proxy config you don't own as your
# only limit. Read in chunks so a lie in Content-Length can't blow up memory
# before this check ever fires.
MAX_VIDEO_BYTES = 150 * 1024 * 1024  # 150 MiB
ALLOWED_CONTENT_TYPES = {"video/webm", "video/mp4"}
# D9/§8: retention placeholder -- 30 days is not a clinically reviewed
# number, it's what the plan wrote down while the real value is decided
# (integration plan §9, item 2). Change here AND in video_retention.py's
# docstring if it's ever revised.
RETENTION_DAYS = 30


async def _consent(app, patient_user_id) -> bool:
    """Read-only lookup on patientprofiles (theirs, §1) -- never write it."""
    oid = dbmod.to_object_id(patient_user_id) if isinstance(patient_user_id, str) else patient_user_id
    if not isinstance(oid, ObjectId):
        return False
    doc = await app.state.db.patientprofiles.find_one(
        {"userId": oid}, {"consentVideoMonitoring": 1}
    )
    return bool(doc and doc.get("consentVideoMonitoring"))


@router.post("/session/{session_id}/video")
async def upload_video(
    session_id: str,
    request: Request,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    app = request.app
    doc = await _load_or_404(app, session_id)
    await _authorize_or_403(app, user, doc)

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415, detail=f"unsupported content type: {file.content_type!r}"
        )

    consent = await _consent(app, doc["patientUserId"])
    now = datetime.now(timezone.utc)

    if not consent:
        # §4: record the flag's value on the row EITHER WAY -- a "no" is
        # still a fact worth keeping. No file is written.
        await _sessions(app).update_one(
            {"sessionId": session_id},
            {"$set": {"clinical.video.consentVideoMonitoring": False, "updatedAt": now}},
        )
        with correlation(session_id=session_id):
            log.info("video_uploaded", accepted=False, reason="no_consent")
        raise HTTPException(status_code=403, detail="video monitoring consent not given")

    # Trust boundary: stream to a temp path under the cap, discard and 413
    # on overflow rather than buffering the whole thing in memory first.
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    dest = VIDEO_DIR / f"{session_id}.webm"
    tmp = VIDEO_DIR / f"{session_id}.webm.part"
    written = 0
    try:
        with open(tmp, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_VIDEO_BYTES:
                    f.close()
                    tmp.unlink(missing_ok=True)
                    with correlation(session_id=session_id):
                        log.info("video_uploaded", accepted=False, reason="too_large", bytes=written)
                    raise HTTPException(status_code=413, detail="video exceeds size cap")
                f.write(chunk)
        tmp.replace(dest)
    finally:
        await file.close()

    expires_at = now + timedelta(days=RETENTION_DAYS)
    await _sessions(app).update_one(
        {"sessionId": session_id},
        {"$set": {
            "clinical.video.path": str(dest),
            "clinical.video.bytes": written,
            "clinical.video.mimeType": file.content_type,
            "clinical.video.consentVideoMonitoring": True,
            "clinical.video.expiresAt": expires_at,
            "updatedAt": now,
        }},
    )
    with correlation(session_id=session_id):
        log.info("video_uploaded", accepted=True, bytes=written, expires_at=expires_at.isoformat())
    return {"ok": True, "bytes": written, "expiresAt": expires_at.isoformat()}


@router.get("/session/{session_id}/video")
async def get_video(
    session_id: str,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
):
    """G2-G4: play back a session's video.

    The counterpart to the upload above -- without it the doctor page's
    <video> element 404s even though its consent gate is correct.

    Three things must all hold, and each is checked against the ROW, not
    against anything the caller sent:
      - the caller is that patient, their linked doctor, or an admin (B6);
      - `consentVideoMonitoring` was true AT CAPTURE TIME (the snapshot on
        the row -- a patient who has since withdrawn consent is handled by
        the deletion path, not by re-reading their profile here);
      - the file has not been swept by the retention task (F8) and is
        actually still on disk.
    A file that is gone is a 404, never a stale player that hangs.
    """
    app = request.app
    doc = await _load_or_404(app, session_id)
    await _authorize_or_403(app, user, doc)

    video = (doc.get("clinical") or {}).get("video") or {}
    if not video.get("consentVideoMonitoring"):
        # Same shape as the upload's refusal: consent is a 403, not a 404 --
        # the session exists, the video may not be served.
        raise HTTPException(status_code=403, detail="video consent not given for this session")
    if video.get("deletedAt") or not video.get("path"):
        raise HTTPException(status_code=404, detail="video is no longer available")

    path = Path(video["path"])
    if not path.is_absolute():
        path = Path.cwd() / path
    # The stored path is ours (written by the upload route as
    # data/videos/{sessionId}.webm), but confirm it still resolves inside
    # VIDEO_DIR before opening it rather than trusting a DB string.
    root = (Path.cwd() / VIDEO_DIR).resolve() if not VIDEO_DIR.is_absolute() else VIDEO_DIR.resolve()
    try:
        resolved = path.resolve()
        resolved.relative_to(root)
    except (OSError, ValueError):
        raise HTTPException(status_code=404, detail="video is no longer available")
    if not resolved.exists():
        raise HTTPException(status_code=404, detail="video is no longer available")

    return FileResponse(
        resolved,
        media_type=video.get("mimeType") or "video/webm",
        filename=f"{session_id}.webm",
    )

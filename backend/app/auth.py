"""G2-B1/B2/B6 — JWT auth shared with their (part2) backend.

Their JWT: HS256, claims {userId, role}, 7d expiry
(part2/Hemophillia-confirm/backend/src/routes/auth.js:37, otpAuth.js:58,
doctorAuth.js:312 -- all three live signers agree on the claim names). We
verify locally with the same JWT_SECRET (D2) -- we never issue our own tokens.

JWT_SECRET must equal theirs and must be set: fail loudly at import time
rather than falling back to a literal, which is the bug already in their
middleware/auth.js:34 (`process.env.JWT_SECRET || "mySuperSecret..."`).
Because app/main.py imports app/routes/session.py which imports this module,
that import-time raise happens before the app ever binds a port -- no
main.py edit needed to get "fail loudly at startup".

Run this file directly for a self-check: `venv/bin/python app/auth.py`.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Awaitable, Callable, Optional

import jwt
from fastapi import Header, HTTPException

from app.logging_setup import get_logger

log = get_logger("auth")

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. It must equal the value in "
        "part2/Hemophillia-confirm/backend/.env's JWT_SECRET -- refusing to "
        "start rather than silently verifying against a public fallback."
    )


@dataclass(frozen=True)
class CurrentUser:
    user_id: str  # their users._id, as a string -- ObjectId, never PATxxxxxx
    role: str  # "patient" | "doctor" | "clinician" | "admin"


def _decode(token: str) -> CurrentUser:
    """Shared decode path for both the HTTP dependency and the WS handshake.
    Expired and malformed are logged distinctly (B1); both are a 401 to the
    caller -- this trust boundary does not get to leak which kind of invalid
    a token was."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        log.info("auth_rejected", reason="expired")
        raise HTTPException(status_code=401, detail="token expired")
    except jwt.InvalidTokenError as exc:
        log.info("auth_rejected", reason="malformed", error=str(exc))
        raise HTTPException(status_code=401, detail="invalid token")

    user_id = payload.get("userId")
    role = payload.get("role")
    if not user_id or not role:
        log.info("auth_rejected", reason="malformed", error="missing userId/role claim")
        raise HTTPException(status_code=401, detail="invalid token")
    return CurrentUser(user_id=str(user_id), role=str(role))


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    """FastAPI dependency: `Authorization: Bearer <token>` -> CurrentUser."""
    if not authorization or not authorization.startswith("Bearer "):
        log.info("auth_rejected", reason="missing_header")
        raise HTTPException(status_code=401, detail="authorization token missing")
    token = authorization[len("Bearer "):].strip()
    if not token:
        log.info("auth_rejected", reason="missing_header")
        raise HTTPException(status_code=401, detail="authorization token missing")
    return _decode(token)


def decode_ws_token(token: str) -> CurrentUser:
    """Same decode path, for the WS handshake frame (D3/B4) -- there is no
    HTTP header to read there, session_ws.py calls this directly on the
    {"type":"auth"} frame's token field."""
    return _decode(token)


# --- B6: authorization helper ------------------------------------------------
# The Mongo lookup for hemophiliadetails.consultingDoctorId isn't wired yet
# (agent 16 owns app/db.py, G2-D). `lookup_doctor_id` is the injected seam:
# swap in a real Motor-backed callable there: nowhere else needs to change.
# ponytail: no caching on the lookup -- add if/when it shows up in a latency
# budget; a per-request doctor-link read is not the bottleneck yet.
LookupDoctorId = Callable[[str], Awaitable[Optional[str]]]


async def authorize_patient_access(
    user: CurrentUser,
    patient_user_id: str,
    lookup_doctor_id: LookupDoctorId,
) -> bool:
    """True iff `user` may read/act on `patient_user_id`'s clinical data.

    Rules (§3, D14): the caller IS that patient, OR is an admin, OR is a
    doctor whose _id equals that patient's hemophiliadetails.consultingDoctorId.

    Authorize on patientUserId (the ObjectId string), never the display
    patientId (PATxxxxxx) -- callers must pass the ObjectId in.

    A patient with no hemophiliadetails row has no doctor: `lookup_doctor_id`
    returning None must deny every doctor. This is the fail-closed branch a
    single-patient test cannot see break.
    """
    if user.role == "admin":
        return True
    if user.role == "patient":
        return user.user_id == patient_user_id
    if user.role == "doctor":
        doctor_id = await lookup_doctor_id(patient_user_id)
        return doctor_id is not None and doctor_id == user.user_id
    # "clinician" and anything else: not in scope of D14's three roles --
    # fail closed rather than guess.
    return False


if __name__ == "__main__":
    import asyncio
    import time

    def _token(user_id, role, exp_delta=3600, secret=None):
        return jwt.encode(
            {"userId": user_id, "role": role, "exp": time.time() + exp_delta},
            secret or JWT_SECRET,
            algorithm="HS256",
        )

    async def _run():
        # decode round-trip
        u = decode_ws_token(_token("u1", "patient"))
        assert u.user_id == "u1" and u.role == "patient"

        # expired vs malformed both 401, distinctly logged (can't assert logs
        # here without a log capture rig -- the distinct `reason` fields are
        # exercised by the pytest suite instead).
        try:
            decode_ws_token(_token("u1", "patient", exp_delta=-10))
            assert False, "expired token accepted"
        except HTTPException as e:
            assert e.status_code == 401

        try:
            decode_ws_token("not.a.jwt")
            assert False, "malformed token accepted"
        except HTTPException as e:
            assert e.status_code == 401

        # B6 authorization matrix
        patient = CurrentUser("patA", "patient")
        other_patient = CurrentUser("patB", "patient")
        their_doctor = CurrentUser("docA", "doctor")
        other_doctor = CurrentUser("docB", "doctor")
        admin = CurrentUser("adm1", "admin")

        async def lookup_docA(patient_user_id):
            return "docA" if patient_user_id == "patA" else None  # patB: no hemophiliadetails row

        assert await authorize_patient_access(patient, "patA", lookup_docA) is True
        assert await authorize_patient_access(other_patient, "patA", lookup_docA) is False
        assert await authorize_patient_access(their_doctor, "patA", lookup_docA) is True
        assert await authorize_patient_access(other_doctor, "patA", lookup_docA) is False
        assert await authorize_patient_access(admin, "patA", lookup_docA) is True
        # patB has no hemophiliadetails row -> no doctor authorized, not even docA
        assert await authorize_patient_access(their_doctor, "patB", lookup_docA) is False

    asyncio.run(_run())
    print("OK: app/auth.py self-check passed")

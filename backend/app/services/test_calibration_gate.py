"""R1.T -- pre-session calibration gate. Three invariants, no framework.

Guards (docs/13 R1):
  1. security  -- POST /session/calibrate without a valid JWT is refused.
  2. data flow -- emg_client.recalibrate() honours the open breaker: no
     network call, no raise, falsy/None result.
  3. data integrity -- calibration_ok() is the single gate predicate deciding
     whether a calibration is good enough to start a session.

These MUST fail now: `recalibrate` and `calibration_ok` do not exist yet in
emg_client.py, and no POST /session/calibrate route exists. A dev pass (R1.1,
R1.2) makes this pass.

Run from backend/:  ../venv/bin/python app/services/test_calibration_gate.py
Requires JWT_SECRET set in the environment (app/auth.py fails to import
otherwise) -- any non-empty value works, tests sign their own tokens.
"""
import os
import sys
import time
import asyncio
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# Never let a test run touch the live database (same guard as test_session.py).
os.environ.setdefault("MONGO_DB", "hemophilia_g2test")

import jwt as pyjwt
from fastapi.testclient import TestClient

from app.auth import JWT_SECRET
from app.main import app

import emg_client as ec


def _token(user_id: str, role: str = "patient") -> str:
    return pyjwt.encode(
        {"userId": user_id, "role": role, "exp": time.time() + 3600},
        JWT_SECRET,
        algorithm="HS256",
    )


def test_calibrate_route_requires_auth():
    with TestClient(app) as client:
        r = client.post("/session/calibrate")
        assert r.status_code in (401, 403), (
            f"POST /session/calibrate with no Authorization header must be "
            f"refused, got {r.status_code}: {r.text}"
        )
    print("security: POST /session/calibrate with no token -> 401/403: OK")


def test_recalibrate_honours_open_breaker():
    url = "http://fake-emg-service:5000"
    ec._breaker_state.clear()
    ec._record_failure(url)
    ec._record_failure(url)
    ec._record_failure(url)
    assert ec._circuit_open(url) is True, "3rd failure should open the circuit"

    with patch("emg_client.httpx.AsyncClient") as mock_client_cls:
        result = asyncio.run(ec.recalibrate(url))
        mock_client_cls.assert_not_called()
        assert not result, (
            "recalibrate must not raise and must return a falsy/None result "
            "when the circuit is open"
        )
    print("data flow: recalibrate with open breaker -> no call, no raise: OK")


def test_calibration_ok_gate_predicate():
    assert ec.calibration_ok({"mpu_ok": True, "shaky": False}) is True, (
        "mpu_ok and not shaky must be OK"
    )
    assert ec.calibration_ok({"mpu_ok": True, "shaky": True}) is False, (
        "shaky must never be OK regardless of mpu_ok"
    )
    assert ec.calibration_ok({"mpu_ok": False, "shaky": False}) is False, (
        "mpu not ok must never be OK"
    )
    assert ec.calibration_ok(None) is False, (
        "no calibration at all must not be OK"
    )
    print("data integrity: calibration_ok gate predicate: OK")


if __name__ == "__main__":
    test_calibrate_route_requires_auth()
    test_recalibrate_honours_open_breaker()
    test_calibration_ok_gate_predicate()
    print("ALL R1 CALIBRATION GATE CHECKS PASSED")

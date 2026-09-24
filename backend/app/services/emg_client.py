"""EMG Flask service client for FastAPI backend."""
import os
import time
import httpx
from typing import Optional


# K2: read from the environment so compose can point this at the emg-service
# container hostname. Evaluated at import time (fresh interpreter per process,
# same shape as every other env-driven default in this repo) -- setting the
# env var after import does nothing, same defect class as FLUSH_INTERVAL_S.
EMG_SERVICE_URL = os.environ.get("EMG_SERVICE_URL", "http://localhost:5000")

# Circuit breaker tuning knobs.
FAILURE_THRESHOLD = 3   # consecutive failures before the circuit opens
COOLDOWN_SECONDS = 30.0  # how long the circuit stays open before a trial call

# Breaker state, keyed per base_url so multiple EMG services could be tracked
# independently. Each value: {"failures": int, "opened_at": float | None}
# ponytail: plain dict + no lock — FastAPI's single-threaded event loop means
# no concurrent mutation here; add a lock if this ever runs multi-threaded.
_breaker_state: dict[str, dict] = {}


def _get_state(base_url: str) -> dict:
    return _breaker_state.setdefault(base_url, {"failures": 0, "opened_at": None})


def _circuit_open(base_url: str) -> bool:
    """True if calls to base_url should be skipped right now."""
    state = _get_state(base_url)
    if state["opened_at"] is None:
        return False
    if time.monotonic() - state["opened_at"] >= COOLDOWN_SECONDS:
        # Cooldown elapsed: allow exactly one trial call through.
        return False
    return True


def _record_success(base_url: str) -> None:
    state = _get_state(base_url)
    state["failures"] = 0
    state["opened_at"] = None


def _record_failure(base_url: str) -> None:
    state = _get_state(base_url)
    state["failures"] += 1
    if state["failures"] >= FAILURE_THRESHOLD:
        state["opened_at"] = time.monotonic()


async def get_live_emg_reading(base_url: str = EMG_SERVICE_URL) -> Optional[dict]:
    """Fetch current live EMG reading from Flask service.

    Returns dict with keys: signal (int), envelop (int), timestamp (float)
    Returns None if service unavailable, no data, or circuit is open.
    Never raises.
    """
    if _circuit_open(base_url):
        return None
    url = f"{base_url}/api/live-value"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            if resp.status_code == 204:
                _record_success(base_url)
                return None
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return None


async def get_emg_history(base_url: str = EMG_SERVICE_URL) -> list:
    """Fetch EMG recording history from Flask service."""
    if _circuit_open(base_url):
        return []
    url = f"{base_url}/api/list_recordings"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return []


async def get_emg_status(base_url: str = EMG_SERVICE_URL) -> dict:
    """Fetch EMG capture status from Flask service."""
    if _circuit_open(base_url):
        return {"capture_running": False, "error": "Service unavailable"}
    url = f"{base_url}/api/status"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return {"capture_running": False, "error": "Service unavailable"}


async def start_capture(base_url: str, patient_user_id: str, session_id: str) -> Optional[dict]:
    """Tell the Flask service to start recording, tagged with both ids (O4).

    Returns None if the circuit is open or the call fails. Never raises: a
    dead EMG service must never block a patient starting their exercise.
    """
    if _circuit_open(base_url):
        return None
    url = f"{base_url}/api/start_capture"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                url, json={"patient_user_id": patient_user_id, "session_id": session_id}
            )
            if resp.status_code == 400:
                # "Recording already active": the service answered, so it is
                # healthy. A no-op must not count toward the breaker.
                _record_success(base_url)
                return None
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return None


async def recalibrate(base_url: str = EMG_SERVICE_URL) -> Optional[dict]:
    """Ask the Flask service to recalibrate (R1.1). Never raises."""
    if _circuit_open(base_url):
        return None
    url = f"{base_url}/api/recalibrate"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(url)
            if resp.status_code in (400, 409):
                # "No device seen yet" / "recording in progress" -- the
                # service answered correctly, not a failure. Same rule as
                # start_capture/stop_capture's 400 no-op.
                _record_success(base_url)
                return None
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return None


def calibration_ok(calibration: dict | None) -> bool:
    """Pure gate predicate (R1.1b, D16): good only if mpu_ok and not shaky."""
    if not calibration:
        return False
    return bool(calibration.get("mpu_ok")) and not calibration.get("shaky")


async def stop_capture(base_url: str) -> Optional[dict]:
    """Finalise the recording so the ids reach history.json. Never raises."""
    if _circuit_open(base_url):
        return None
    url = f"{base_url}/api/stop_recording"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(url)
            if resp.status_code == 400:
                # "No recording in progress" -- e.g. the operator already
                # stopped it in live.html. The service is healthy; counting
                # this would open the breaker after 3 such sessions and then
                # silently skip the NEXT session's start_capture.
                _record_success(base_url)
                return None
            resp.raise_for_status()
            data = resp.json()
            _record_success(base_url)
            return data
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError):
        _record_failure(base_url)
        return None

"""EMG Flask service client for FastAPI backend."""
import httpx
from typing import Optional


EMG_SERVICE_URL = "http://localhost:5000"  # Default Flask port


async def get_live_emg_reading(base_url: str = EMG_SERVICE_URL) -> Optional[dict]:
    """Fetch current live EMG reading from Flask service.

    Returns dict with keys: signal (int), envelop (int), timestamp (float)
    Returns None if service unavailable or no data.
    """
    url = f"{base_url}/api/live-value"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            if resp.status_code == 204:
                return None
            resp.raise_for_status()
            return resp.json()
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError):
        return None


async def get_emg_history(base_url: str = EMG_SERVICE_URL) -> list:
    """Fetch EMG recording history from Flask service."""
    url = f"{base_url}/api/list_recordings"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError):
        return []


async def get_emg_status(base_url: str = EMG_SERVICE_URL) -> dict:
    """Fetch EMG capture status from Flask service."""
    url = f"{base_url}/api/status"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
    except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError):
        return {"capture_running": False, "error": "Service unavailable"}
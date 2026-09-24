"""J — cross-origin access from the pages to the API. No framework.

Run from backend/:  ../venv/bin/python app/routes/test_cors.py

WHY THIS EXISTS. Phase J's pages are served from a different origin than the
API (a static server in dev, separate compose services in K1). Without CORS the
browser blocks every request while the server happily returns 200 -- so `curl`
says the backend is fine and the page silently shows fallback data. That is
exactly what happened on the first real run of ExerciseSelect: the footer read
"Failed to fetch" with the backend running and healthy.

This is the repo's recurring silent-failure shape (PROJECT-STATUS §3): the
happy path reports success while the real path is dead. A test that only calls
the API server-side cannot see it, so this asserts the actual CORS headers.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# Never let a test run touch the live EMG service. Since P2.3,
# POST /session/start fires emg_client.start_capture; EMG_SERVICE_URL
# defaults to http://localhost:5000, reachable via the P5.2 loopback port.
# A closed port makes start_capture a no-op (docs/13 F2).
os.environ.setdefault("EMG_SERVICE_URL", "http://127.0.0.1:9")

from fastapi.testclient import TestClient

from app.main import app

ORIGIN = "http://127.0.0.1:5599"


def test_j_cors_allows_the_pages_origin():
    with TestClient(app) as client:
        r = client.get("/exercises", headers={"Origin": ORIGIN})
        assert r.status_code == 200, f"GET /exercises -> {r.status_code}"
        allow = r.headers.get("access-control-allow-origin")
        assert allow, (
            "no access-control-allow-origin header on /exercises. The browser "
            "will block this and the page falls back to preview data while "
            "curl reports 200."
        )
        assert allow in (ORIGIN, "*"), f"origin not permitted: {allow!r}"
    print("J CORS on /exercises: OK")


def test_j_cors_preflight_for_session_start():
    """POST /session/start with a JSON content-type triggers a preflight. If
    OPTIONS is not handled, J3's Start button fails and no session is ever
    created -- the whole flow dies at the first click."""
    with TestClient(app) as client:
        r = client.options(
            "/session/start",
            headers={
                "Origin": ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert r.status_code in (200, 204), (
            f"preflight OPTIONS /session/start -> {r.status_code}: {r.text}"
        )
        allow_origin = r.headers.get("access-control-allow-origin")
        allow_methods = (r.headers.get("access-control-allow-methods") or "").upper()
        assert allow_origin in (ORIGIN, "*"), f"preflight origin: {allow_origin!r}"
        assert "POST" in allow_methods, f"POST not allowed by preflight: {allow_methods!r}"
    print("J CORS preflight on /session/start: OK")


def test_j_cors_covers_every_route_the_pages_call():
    """All four, not just the one that was noticed. A page that can read
    /exercises but not /admin/models/status renders every exercise as
    'no trained model' -- wrong, and silently so."""
    with TestClient(app) as client:
        sid = client.post("/session/start", json={"exercise": "squat"}).json()["session_id"]
        for method, path in [
            ("GET", "/exercises"),
            ("GET", "/admin/models/status"),
            ("GET", f"/session/{sid}"),
            ("GET", "/health"),
        ]:
            r = client.request(method, path, headers={"Origin": ORIGIN})
            assert r.headers.get("access-control-allow-origin"), (
                f"{method} {path} has no CORS header — the page cannot read it"
            )
    print("J CORS on every route the pages call: OK")


if __name__ == "__main__":
    test_j_cors_allows_the_pages_origin()
    test_j_cors_preflight_for_session_start()
    test_j_cors_covers_every_route_the_pages_call()
    print("ALL J CORS CHECKS PASSED")

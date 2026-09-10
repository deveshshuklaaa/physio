"""H2, H3, H6 — the session WebSocket. G2-B4 — the WS auth handshake.
No framework.

Run from backend/:  ../venv/bin/python app/ws/test_session_ws.py
Requires JWT_SECRET set in the environment (app/auth.py fails to import
otherwise).

Contract these tests define for app/ws/session_ws.py:

    WS  /ws/session/{session_id}

    receives (the wire format frontend/src/ws/client.js ALREADY sends -- this
    is a fixed contract, not a new design):
        {"type": "auth", "token": "<jwt>"}              -- MUST be first (D3)
        {"type": "pose_batch", "ts": <int>, "frames": [...], "logs": [...]}
        {"type": "end"}

    sends:
        {"type": "emg", "signal": ..., "envelop": ..., "timestamp": ...}

    module attrs the tests steer:
        EMG_POLL_INTERVAL_S     float, default must sit in the 2-5 Hz band (H3)
        get_live_emg_reading    imported into this module so it is patchable

R5/R6 are what these tests actually defend: the socket carries EVIDENCE, not
feedback, and the handler returns without touching disk. Every millisecond the
receive path spends on I/O is a millisecond of backlog, and backlog is the lag
§3 exists to eliminate.

G2-B4/D3 add the auth handshake: every test below that exercises the pose
path now sends a valid `{"type":"auth", ...}` frame immediately after connect
(see `_connect_authed`) -- otherwise the socket closes 4401 before any of the
H2/H3/H6 behaviour under test ever runs.
"""
import os
import sys
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

# Never let a test run touch the live database. app/__init__.py now loads
# MONGO_URI from their .env automatically, so a forgotten MONGO_DB would
# otherwise write test sessions straight into `hemophilia`. Set before any
# app.* import, and only as a default -- an explicit MONGO_DB still wins.
os.environ.setdefault("MONGO_DB", "hemophilia_g2test")


import jwt as pyjwt
from fastapi import WebSocketDisconnect
from fastapi.testclient import TestClient

from app.auth import JWT_SECRET
from app.main import app
from app.services import session_buffer as sb
from app.ws import session_ws


def _frames(n, base=0):
    return [{"ts": base + i, "landmarks": [[0.1, 0.2, 0.3]], "flags": []} for i in range(n)]


def _batch(n, base=0):
    return {"type": "pose_batch", "ts": 1_700_000_000, "frames": _frames(n, base), "logs": []}


def _wait_for(pred, timeout=3.0, what="condition"):
    """Generous bounded wait. Deliberately not a latency assertion -- those
    flap on host load (PROJECT-STATUS §3). This only waits for arrival."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if pred():
            return True
        time.sleep(0.02)
    raise AssertionError(f"timed out after {timeout}s waiting for {what}")


def _token(user_id: str, role: str = "patient", exp_delta: float = 3600) -> str:
    return pyjwt.encode(
        {"userId": user_id, "role": role, "exp": time.time() + exp_delta},
        JWT_SECRET,
        algorithm="HS256",
    )


def _start(client, exercise="squat", patient="p1"):
    return client.post(
        "/session/start", json={"exercise": exercise},
        headers={"Authorization": f"Bearer {_token(patient)}"},
    ).json()["session_id"]


def _http_auth(patient="p1"):
    return {"Authorization": f"Bearer {_token(patient)}"}


def _auth_frame(patient="p1"):
    """D3/B4: send this as the first message on every socket under test, or
    the server closes 4401 before any H2/H3/H6 behaviour runs."""
    return {"type": "auth", "token": _token(patient)}


def test_h2_ws_accepts_pose_batch_into_buffer():
    """A batch in the client.js wire format lands in that session's buffer."""
    sb.FLUSH_INTERVAL_S = 60  # keep the background task out of this assertion
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json(_auth_frame())
            ws.send_json(_batch(12))
            buf = sb.get_buffer(sid)
            _wait_for(lambda: buf.pending >= 12, what="12 frames in the session buffer")
            assert buf.pending == 12, f"expected 12 frames buffered, got {buf.pending}"
    print("H2 pose_batch -> buffer: OK")


def test_h2_ws_handler_never_awaits_disk():
    """R6. Frames sit in memory after receive; the flush is somebody else's
    turn of the event loop.

    Asserted two ways, because either alone can pass a broken handler:
      - after a batch is buffered, it is still PENDING (not already written),
      - and with flush() sabotaged to raise, batches keep being accepted.
    """
    sb.FLUSH_INTERVAL_S = 60
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json(_auth_frame())
            ws.send_json(_batch(5))
            buf = sb.get_buffer(sid)
            _wait_for(lambda: buf.pending >= 5, what="frames buffered")
            assert buf.pending == 5, (
                f"handler flushed inline -- {5 - buf.pending} frames already on disk. "
                "R6: the WS handler never awaits disk I/O."
            )

        sid2 = _start(client)
        boom = lambda self: (_ for _ in ()).throw(RuntimeError("disk is on fire"))
        with patch.object(sb.SessionBuffer, "flush", boom):
            with client.websocket_connect(f"/ws/session/{sid2}") as ws:
                ws.send_json(_auth_frame())
                ws.send_json(_batch(5))
                buf2 = sb.get_buffer(sid2)
                _wait_for(lambda: buf2.pending >= 5,
                          what="frames buffered while flush() raises")
    print("H2 handler is disk-free: OK")


def test_h2_ws_rejects_unknown_session():
    """H4 says start runs BEFORE the socket opens. A socket for a session that
    was never started would buffer evidence nothing will ever collect."""
    with TestClient(app) as client:
        rejected = False
        try:
            with client.websocket_connect("/ws/session/s_never_started") as ws:
                ws.send_json(_batch(1))
                ws.receive_json()
        except Exception:
            rejected = True
        assert rejected, (
            "WS accepted an unknown session_id; POST /session/start must run first"
        )
    print("H2 unknown session rejected: OK")


def test_h2_ws_sessions_do_not_cross_talk():
    """Two concurrent sockets, two buffers. Same leak class as the G
    heel-baseline bug, but with patient evidence instead of a threshold."""
    sb.FLUSH_INTERVAL_S = 60
    with TestClient(app) as client:
        a, b = _start(client), _start(client)
        with client.websocket_connect(f"/ws/session/{a}") as wa, \
             client.websocket_connect(f"/ws/session/{b}") as wb:
            wa.send_json(_auth_frame())
            wb.send_json(_auth_frame())
            wa.send_json(_batch(6, base=0))
            wb.send_json(_batch(2, base=500))
            ba, bb = sb.get_buffer(a), sb.get_buffer(b)
            _wait_for(lambda: ba.pending >= 6 and bb.pending >= 2, what="both buffers filled")
            assert (ba.pending, bb.pending) == (6, 2), (
                f"frames crossed sessions: a={ba.pending} (want 6), b={bb.pending} (want 2)"
            )
    print("H2 no cross-session traffic: OK")


def test_h3_emg_relay_pushes_emg_messages():
    """H3: a background task polls the EMG client and pushes to this socket.
    Nothing in the live FEEDBACK loop depends on it (R4/R5) -- it feeds a chart."""
    reading = {"signal": 5, "envelop": 28, "timestamp": 1_700_000_000.0}
    session_ws.EMG_POLL_INTERVAL_S = 0.05
    with TestClient(app) as client:
        sid = _start(client)
        async def fake(*a, **kw):
            return reading
        with patch.object(session_ws, "get_live_emg_reading", fake):
            with client.websocket_connect(f"/ws/session/{sid}") as ws:
                ws.send_json(_auth_frame())
                msg = None
                for _ in range(20):
                    m = ws.receive_json()
                    if m.get("type") == "emg":
                        msg = m
                        break
                assert msg is not None, "no {'type':'emg'} message arrived on the socket"
                assert msg["envelop"] == 28 and msg["signal"] == 5, (
                    f"EMG payload mangled in relay: {msg}"
                )
    print("H3 EMG relay pushes readings: OK")


def test_h3_emg_poll_rate_is_modest():
    """The plan says 2-5 Hz is plenty for a chart. Polling a serial-backed
    Flask service at frame rate is pure waste and adds a stall surface."""
    import importlib
    fresh = importlib.reload(session_ws)
    hz = 1.0 / fresh.EMG_POLL_INTERVAL_S
    assert 2.0 <= hz <= 5.0, (
        f"default EMG poll rate is {hz:.1f} Hz; H3 specifies 2-5 Hz"
    )
    print(f"H3 poll rate {hz:.1f} Hz: OK")


def test_h3_dead_emg_never_stalls_the_session():
    """The load-bearing H3 requirement. EMG returning None (circuit open, C6)
    must cost the chart, never the session. Evidence capture outranks the
    sensor readout, exactly as recording outranks pose in G12."""
    session_ws.EMG_POLL_INTERVAL_S = 0.05
    sb.FLUSH_INTERVAL_S = 60
    with TestClient(app) as client:
        sid = _start(client)
        async def dead(*a, **kw):
            return None
        with patch.object(session_ws, "get_live_emg_reading", dead):
            with client.websocket_connect(f"/ws/session/{sid}") as ws:
                ws.send_json(_auth_frame())
                ws.send_json(_batch(9))
                buf = sb.get_buffer(sid)
                _wait_for(lambda: buf.pending >= 9,
                          what="frames buffered while EMG is dead")
                assert buf.pending == 9, "a dead EMG service cost us pose evidence"
    print("H3 dead EMG does not stall the session: OK")


def test_h6_abrupt_disconnect_ends_session():
    """Mobile browsers kill sockets without a close frame and without ever
    reaching the End Session button. If that is not treated as session end,
    the session is never scored and its video is never released for deletion."""
    sb.FLUSH_INTERVAL_S = 60
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json(_auth_frame())
            ws.send_json(_batch(4))
            _wait_for(lambda: sb.get_buffer(sid).pending >= 4, what="frames buffered")
        # context exit == abrupt disconnect, no {"type":"end"} was ever sent

        # G2-D4: the job seam is the physiosessions row's jobId, not a dict.
        def _ended():
            row = client.get(f"/session/{sid}", headers=_http_auth()).json()
            return bool(row.get("jobId")) and row.get("status") == "ended"

        _wait_for(_ended,
                  what="a report job enqueued by the disconnect handler")
        row = client.get(f"/session/{sid}", headers=_http_auth()).json()
        assert row["status"] == "ended", "disconnect left the row still active"

        # And the evidence was flushed on the way out -- not left in a dead
        # process's memory.
        path = sb.get_buffer(sid).path
        lines = [ln for ln in path.read_text().splitlines() if ln.strip()] if path.exists() else []
        assert len(lines) == 4, (
            f"disconnect did not flush the buffer; {len(lines)}/4 frames on disk"
        )

        # H5 idempotency across the two entry points: the button after a
        # disconnect must reuse the job, not make a second one.
        job_id = row["jobId"]
        r = client.post(
            "/session/end", json={"session_id": sid},
            headers={"Authorization": f"Bearer {_token('p1')}"},
        )
        assert r.status_code == 200, f"/session/end after disconnect -> {r.status_code}"
        if job_id:
            assert r.json()["job_id"] == job_id, (
                "End Session after an abrupt disconnect created a second job"
            )
    print("H6 abrupt disconnect ends the session: OK")


# --- G2-B4/D3 gate: the WS auth handshake -----------------------------------

def test_g2b_ws_no_auth_frame_closes_4401_within_timeout():
    """D3: a socket that never sends the auth frame is closed 4401 once
    AUTH_TIMEOUT_S elapses. Patched down here so the test doesn't take the
    real 5s -- the default is asserted separately below."""
    session_ws.AUTH_TIMEOUT_S = 0.2
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            try:
                ws.receive_json()
                assert False, "socket did not close when no auth frame arrived"
            except WebSocketDisconnect as exc:
                assert exc.code == 4401, f"expected close code 4401, got {exc.code}"
    session_ws.AUTH_TIMEOUT_S = 5.0
    print("G2-B WS silence -> 4401 within timeout: OK")


def test_g2b_ws_default_auth_timeout_is_five_seconds():
    """§5 G2-B4 pins this exact number."""
    import importlib
    fresh = importlib.reload(session_ws)
    assert fresh.AUTH_TIMEOUT_S == 5.0, (
        f"D3 specifies a 5s auth deadline, got {fresh.AUTH_TIMEOUT_S}"
    )
    print("G2-B WS auth timeout is 5s: OK")


def test_g2b_ws_malformed_auth_frame_closes_4401():
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json({"type": "pose_batch", "frames": []})  # not an auth frame
            try:
                ws.receive_json()
                assert False, "socket did not close on a non-auth first frame"
            except WebSocketDisconnect as exc:
                assert exc.code == 4401, f"expected 4401, got {exc.code}"
    print("G2-B WS non-auth first frame -> 4401: OK")


def test_g2b_ws_wrong_user_token_closes_4403():
    """Session belongs to p1; a socket authenticating as p2 must be refused
    -- this is the WS half of the B6 cross-patient leak this phase guards."""
    with TestClient(app) as client:
        sid = _start(client, patient="p1")
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json({"type": "auth", "token": _token("p2")})
            try:
                ws.receive_json()
                assert False, "socket did not close on an ownership mismatch"
            except WebSocketDisconnect as exc:
                assert exc.code == 4403, f"expected close code 4403, got {exc.code}"
    print("G2-B WS wrong-user token -> 4403: OK")


def test_g2b_ws_matching_user_token_is_accepted():
    with TestClient(app) as client:
        sid = _start(client, patient="p1")
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
            ws.send_json(_auth_frame(patient="p1"))
            # If auth failed the socket would already be closed; a normal
            # pose_batch round-trip proves the session continued.
            ws.send_json(_batch(1))
            _wait_for(lambda: sb.get_buffer(sid).pending >= 1, what="frame accepted post-auth")
    print("G2-B WS matching-user token accepted: OK")


if __name__ == "__main__":
    test_h2_ws_accepts_pose_batch_into_buffer()
    test_h2_ws_handler_never_awaits_disk()
    test_h2_ws_rejects_unknown_session()
    test_h2_ws_sessions_do_not_cross_talk()
    test_h3_emg_relay_pushes_emg_messages()
    test_h3_emg_poll_rate_is_modest()
    test_h3_dead_emg_never_stalls_the_session()
    test_h6_abrupt_disconnect_ends_session()
    test_g2b_ws_no_auth_frame_closes_4401_within_timeout()
    test_g2b_ws_default_auth_timeout_is_five_seconds()
    test_g2b_ws_malformed_auth_frame_closes_4401()
    test_g2b_ws_wrong_user_token_closes_4403()
    test_g2b_ws_matching_user_token_is_accepted()
    print("ALL H2/H3/H6/G2-B4 WEBSOCKET CHECKS PASSED")

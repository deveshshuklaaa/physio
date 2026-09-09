"""H2, H3, H6 — the session WebSocket. No framework.

Run from backend/:  ../venv/bin/python app/ws/test_session_ws.py

Contract these tests define for app/ws/session_ws.py:

    WS  /ws/session/{session_id}

    receives (the wire format frontend/src/ws/client.js ALREADY sends -- this
    is a fixed contract, not a new design):
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
"""
import sys
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient

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


def _start(client, exercise="squat"):
    return client.post("/session/start", json={"exercise": exercise}).json()["session_id"]


def test_h2_ws_accepts_pose_batch_into_buffer():
    """A batch in the client.js wire format lands in that session's buffer."""
    sb.FLUSH_INTERVAL_S = 60  # keep the background task out of this assertion
    with TestClient(app) as client:
        sid = _start(client)
        with client.websocket_connect(f"/ws/session/{sid}") as ws:
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
            ws.send_json(_batch(4))
            _wait_for(lambda: sb.get_buffer(sid).pending >= 4, what="frames buffered")
        # context exit == abrupt disconnect, no {"type":"end"} was ever sent

        jobs = getattr(app.state, "jobs", {})
        _wait_for(lambda: any(j.get("session_id") == sid for j in jobs.values()),
                  what="a report job enqueued by the disconnect handler")
        for_session = [j for j in jobs.values() if j.get("session_id") == sid]
        assert len(for_session) == 1, (
            f"disconnect enqueued {len(for_session)} jobs, expected 1"
        )

        # And the evidence was flushed on the way out -- not left in a dead
        # process's memory.
        path = sb.get_buffer(sid).path
        lines = [ln for ln in path.read_text().splitlines() if ln.strip()] if path.exists() else []
        assert len(lines) == 4, (
            f"disconnect did not flush the buffer; {len(lines)}/4 frames on disk"
        )

        # H5 idempotency across the two entry points: the button after a
        # disconnect must reuse the job, not make a second one.
        job_id = for_session[0]["job_id"] if "job_id" in for_session[0] else None
        r = client.post("/session/end", json={"session_id": sid})
        assert r.status_code == 200, f"/session/end after disconnect -> {r.status_code}"
        if job_id:
            assert r.json()["job_id"] == job_id, (
                "End Session after an abrupt disconnect created a second job"
            )
    print("H6 abrupt disconnect ends the session: OK")


if __name__ == "__main__":
    test_h2_ws_accepts_pose_batch_into_buffer()
    test_h2_ws_handler_never_awaits_disk()
    test_h2_ws_rejects_unknown_session()
    test_h2_ws_sessions_do_not_cross_talk()
    test_h3_emg_relay_pushes_emg_messages()
    test_h3_emg_poll_rate_is_modest()
    test_h3_dead_emg_never_stalls_the_session()
    test_h6_abrupt_disconnect_ends_session()
    print("ALL H2/H3/H6 WEBSOCKET CHECKS PASSED")

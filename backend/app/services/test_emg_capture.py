"""Runnable self-check for the engine's EMG capture-start call (O4/P2.3).

Two invariants only, per docs/13 §2.3 / §5:

  A1. A capture-start call transmits BOTH patient_user_id and session_id in
      the request body sent to /api/start_capture.
  A2. The circuit breaker is honoured: when the breaker is open, capture
      start does not raise and does not block session start (a dead EMG
      service must never prevent a patient starting an exercise).

This file writes no application code. `start_capture` does not exist yet in
emg_client.py -- this MUST fail (ImportError) until a dev pass adds it.

Run: python3 test_emg_capture.py
"""
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock

import emg_client as ec


def demo():
    url = "http://fake-emg-service:5000"
    ec._breaker_state.clear()

    # ---------------------------------------------------------- A1
    captured = {}

    def fake_post(self, url_arg, json=None, **kwargs):
        captured["url"] = url_arg
        captured["json"] = json
        resp = MagicMock()
        resp.status_code = 200
        resp.json.return_value = {"status": "recording"}
        resp.raise_for_status.return_value = None
        return resp

    with patch("emg_client.httpx.AsyncClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(side_effect=lambda u, json=None, **kw: fake_post(None, u, json=json, **kw))
        mock_client_cls.return_value = mock_client

        asyncio.run(ec.start_capture(url, patient_user_id="patient-42", session_id="s_abc123"))

        assert captured["url"] == f"{url}/api/start_capture", (
            "start_capture must POST to /api/start_capture"
        )
        body = captured["json"]
        assert body is not None, "start_capture must send a JSON body"
        assert body.get("patient_user_id") == "patient-42", (
            "request body must carry the authenticated patient's id"
        )
        assert body.get("session_id") == "s_abc123", (
            "request body must carry the engine's session_id (O4)"
        )
    print("A1: request body carries patient_user_id and session_id -> OK")

    # ---------------------------------------------------------- A2
    ec._breaker_state.clear()
    ec._record_failure(url)
    ec._record_failure(url)
    ec._record_failure(url)
    assert ec._circuit_open(url) is True, "3rd failure should open the circuit"

    with patch("emg_client.httpx.AsyncClient") as mock_client_cls:
        result = asyncio.run(
            ec.start_capture(url, patient_user_id="patient-42", session_id="s_abc123")
        )
        mock_client_cls.assert_not_called()
        assert result is None or result is False, (
            "start_capture must not raise and must return a falsy/None result "
            "when the circuit is open, so session start is never blocked by a "
            "dead EMG service"
        )
    print("A2: open circuit -> no network call, no raise, session start unblocked -> OK")

    print("ALL EMG CAPTURE-START SELF-CHECKS PASSED")


if __name__ == "__main__":
    demo()

"""Runnable self-check for the emg_client circuit breaker. No frameworks.

Run: python3 test_emg_client.py
"""
import time
from unittest.mock import patch

import emg_client as ec


def demo():
    url = "http://fake-emg-service:5000"
    ec._breaker_state.clear()

    # 1. Closed: circuit starts closed, no failures yet.
    assert ec._circuit_open(url) is False, "should start closed"

    # 2. Drive failures below threshold: still closed.
    ec._record_failure(url)
    ec._record_failure(url)
    assert ec._circuit_open(url) is False, "2 failures < threshold(3): still closed"

    # 3. Third consecutive failure trips the breaker open.
    ec._record_failure(url)
    assert ec._circuit_open(url) is True, "3rd failure should open the circuit"

    # 4. While open, calls are skipped immediately (no network attempt).
    with patch("emg_client.httpx.AsyncClient") as mock_client:
        import asyncio
        result = asyncio.run(ec.get_live_emg_reading(url))
        assert result is None
        mock_client.assert_not_called()
    print("open circuit: no network call attempted -> OK")

    # 5. Simulate cooldown elapsed by rewinding opened_at.
    state = ec._get_state(url)
    state["opened_at"] = time.monotonic() - ec.COOLDOWN_SECONDS - 0.01
    assert ec._circuit_open(url) is False, "after cooldown, one trial call should be allowed"

    # 6. A success during the trial call closes the circuit and resets counter.
    ec._record_success(url)
    assert ec._get_state(url)["failures"] == 0
    assert ec._get_state(url)["opened_at"] is None
    assert ec._circuit_open(url) is False

    print("ALL BREAKER SELF-CHECKS PASSED: closed -> open -> cooldown -> closed")


if __name__ == "__main__":
    demo()

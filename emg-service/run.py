"""Docker entrypoint for the emg-service Flask app.

Owned by the devops agent (Phase K) -- backend/app.py stays untouched.
`app.py`'s own `if __name__ == "__main__"` block binds to 127.0.0.1, which is
unreachable from another container, and it only starts serial capture inside
that same guard. This just does both steps with a real host/port instead.

No /dev/ttyUSB0 in the container is expected -- start_capture_at_boot()
records the failure in status(), it does not raise, so HTTP still comes up.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import app, start_capture_at_boot  # noqa: E402

if __name__ == "__main__":
    start_capture_at_boot()
    app.run(host="0.0.0.0", port=5000)

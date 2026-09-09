"""H7 — the fake-client test script, exercised for real. No framework.

Run from backend/:  ../venv/bin/python tools/test_h7_fake_client.py

H7's deliverable is a tool, not a library: a Python `websockets` client that
drives a whole session with synthetic pose batches so Phase H can be verified
without a browser, a camera or a patient. Its value is that it runs against a
REAL uvicorn process over a REAL socket -- `frontend/src/ws/client.js` has been
unit-tested against a fake socket since Phase G and has still never spoken to a
server (G-CONTINUE §3, G9: "DONE, UNVERIFIED end-to-end").

Contract for backend/tools/fake_session_client.py:

    ../venv/bin/python tools/fake_session_client.py \
        --url http://127.0.0.1:PORT --exercise squat --frames N [--batch-ms 500]

    - POSTs /session/start, opens ONE ws to /ws/session/{id} (locked decision
      §2: one connection per session, never two),
    - sends N synthetic frames in ~batch-ms windows using the same wire format
      as frontend/src/ws/client.js,
    - POSTs /session/end,
    - prints a single JSON summary line to stdout:
        {"session_id":..., "job_id":..., "frames_sent": N, "batches_sent": B}
    - exits 0 on success, non-zero on any failure.

This module also exposes `serve()`, reused by the Phase H gate.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
PY = REPO / "venv" / "bin" / "python"
FAKE_CLIENT = BACKEND / "tools" / "fake_session_client.py"


def _free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@contextmanager
def serve(session_data_dir=None):
    """Run the real app under uvicorn on an ephemeral port.

    Yields (base_url, session_data_dir). A TestClient would not do here: the
    point of H7 is a real socket and a real process, since that is the one
    thing Phase G could not test.
    """
    port = _free_port()
    tmp = Path(session_data_dir or tempfile.mkdtemp(prefix="h7_"))
    env = {**os.environ, "SESSION_DATA_DIR": str(tmp), "LOG_DIR": str(tmp / "logs")}
    proc = subprocess.Popen(
        [str(PY), "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1",
         "--port", str(port), "--log-level", "warning"],
        cwd=str(BACKEND), env=env,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
    )
    base = f"http://127.0.0.1:{port}"
    try:
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                raise AssertionError(
                    f"uvicorn died during startup (exit {proc.returncode}):\n"
                    f"{proc.stdout.read()}"
                )
            try:
                with urllib.request.urlopen(f"{base}/health", timeout=1) as r:
                    if r.status == 200:
                        break
            except (urllib.error.URLError, ConnectionError, TimeoutError):
                time.sleep(0.2)
        else:
            proc.kill()
            raise AssertionError("uvicorn never answered /health within 30s")
        yield base, tmp
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()


def run_fake_client(base_url, exercise="squat", frames=120, extra=()):
    """Run the H7 script as a subprocess. Returns its parsed JSON summary."""
    cmd = [str(PY), str(FAKE_CLIENT), "--url", base_url,
           "--exercise", exercise, "--frames", str(frames), *extra]
    r = subprocess.run(cmd, cwd=str(BACKEND), capture_output=True, text=True, timeout=120)
    assert r.returncode == 0, (
        f"fake_session_client.py exited {r.returncode}\n"
        f"--- stdout ---\n{r.stdout}\n--- stderr ---\n{r.stderr}"
    )
    summary_line = next(
        (ln for ln in reversed(r.stdout.strip().splitlines()) if ln.strip().startswith("{")),
        None,
    )
    assert summary_line, f"no JSON summary line on stdout:\n{r.stdout}"
    return json.loads(summary_line)


def test_h7_script_exists_and_is_runnable():
    assert FAKE_CLIENT.exists(), f"H7 deliverable missing: {FAKE_CLIENT}"
    src = FAKE_CLIENT.read_text()
    assert "websockets" in src, (
        "H7 specifies a Python `websockets` client; this script does not import it"
    )
    print("H7 script present: OK")


def test_h7_fake_client_drives_a_session_without_a_browser():
    with serve() as (base, tmp):
        summary = run_fake_client(base, frames=120)

        assert summary["frames_sent"] == 120, (
            f"client claims {summary['frames_sent']} frames sent, asked for 120"
        )
        assert summary.get("batches_sent", 0) > 1, (
            "everything went in one message -- R5 says batch into ~500ms windows, "
            f"got batches_sent={summary.get('batches_sent')}"
        )
        assert summary["session_id"], "no session_id in summary"
        assert summary["job_id"], "no job_id in summary -- /session/end enqueued nothing"

        # R5's batching claim, checked rather than trusted: ~120 frames at
        # 15-20fps in 500ms windows is well under one message per frame.
        assert summary["batches_sent"] < summary["frames_sent"], (
            "one message per frame; the batching in R5 is not happening"
        )
    print("H7 fake client drives a full session: OK")


def test_h7_reports_failure_when_the_server_is_gone():
    """A test tool that exits 0 no matter what is worse than no tool -- it
    turns every future Phase H regression into a green build."""
    dead = f"http://127.0.0.1:{_free_port()}"
    r = subprocess.run(
        [str(PY), str(FAKE_CLIENT), "--url", dead, "--exercise", "squat", "--frames", "10"],
        cwd=str(BACKEND), capture_output=True, text=True, timeout=60,
    )
    assert r.returncode != 0, (
        "fake_session_client.py exited 0 against a server that does not exist"
    )
    print("H7 fails loudly against a dead server: OK")


if __name__ == "__main__":
    test_h7_script_exists_and_is_runnable()
    test_h7_fake_client_drives_a_session_without_a_browser()
    test_h7_reports_failure_when_the_server_is_gone()
    print("ALL H7 FAKE CLIENT CHECKS PASSED")

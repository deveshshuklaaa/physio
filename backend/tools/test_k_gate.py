"""PHASE K GATE — MASTER_BUILD_PLAN_v3.md §7.

    | K | Docker end-to-end passes; 3 concurrent sessions hold latency |

Run from backend/:  ../venv/bin/python tools/test_k_gate.py

Requires a running Docker daemon. It is deliberately NOT wired into
run_tests.sh: it builds images and takes minutes, and a suite that turns red
because a laptop has no daemon running trains people to ignore red suites
(the same reasoning that made G5's latency check advisory).

It does NOT skip when the daemon is down. It fails, loudly, with the reason --
a gate that passes when it could not run is the silent-success shape this repo
has been bitten by repeatedly (PROJECT-STATUS §3).

SCOPE. Phase I does not exist, so "full flow" here is the live path only:
config -> session start -> WebSocket evidence -> session end -> job enqueued,
plus the EMG hop across compose DNS and the frontend pages being served. No
report is generated because nothing generates reports yet.
"""
import json
import os
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
PY = REPO / "venv" / "bin" / "python"

BACKEND_URL = os.environ.get("K_BACKEND_URL", "http://127.0.0.1:8000")
FRONTEND_URL = os.environ.get("K_FRONTEND_URL", "http://127.0.0.1:8081")

BUILD_TIMEOUT_S = 1800
HEALTH_TIMEOUT_S = 180

# K4's latency clause. Generous on purpose: this measures a containerised
# server under three concurrent sessions on developer hardware, and the point
# is to catch a stack that collapses under concurrency, not to benchmark a
# laptop.
LATENCY_ABS_MS = 250.0
LATENCY_RATIO = 4.0


def _compose(*args, timeout=600, check=True):
    cmd = ["docker", "compose", *args]
    r = subprocess.run(cmd, cwd=str(REPO), capture_output=True, text=True, timeout=timeout)
    if check and r.returncode != 0:
        raise AssertionError(
            f"`{' '.join(cmd)}` failed ({r.returncode}):\n{r.stdout}\n{r.stderr}"
        )
    return r


def _require_docker():
    r = subprocess.run(["docker", "info"], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, (
        "the Docker daemon is not reachable, so the Phase K gate cannot run.\n"
        "Start it (e.g. `sudo systemctl start docker`) and re-run. This gate "
        "fails rather than skips: Phase K must not be called done on a run "
        "that never touched Docker.\n" + r.stderr.strip()
    )


def _get(url, timeout=10):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.status, r.read().decode("utf-8", "replace")


def _get_json(url, timeout=10):
    return json.loads(_get(url, timeout)[1])


def _wait_healthy(url, timeout_s):
    deadline = time.monotonic() + timeout_s
    last = None
    while time.monotonic() < deadline:
        try:
            status, _ = _get(url, timeout=5)
            if status == 200:
                return
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            last = e
        time.sleep(2)
    raise AssertionError(f"{url} never became healthy within {timeout_s}s (last error: {last})")


def _sample_latency_ms(url, n=15):
    out = []
    for _ in range(n):
        t0 = time.monotonic()
        _get(url, timeout=10)
        out.append((time.monotonic() - t0) * 1000)
    return out


def _container_session_dir():
    """Where the backend container writes session evidence, asked of the
    container rather than assumed -- compose may mount a volume."""
    r = _compose("exec", "-T", "backend", "python", "-c",
                 "from app.services.session_buffer import SESSION_DATA_DIR;print(SESSION_DATA_DIR)")
    return r.stdout.strip().splitlines()[-1].strip()


def _container_line_count(path):
    r = _compose("exec", "-T", "backend", "python", "-c",
                 "import sys;p=sys.argv[1];"
                 "print(sum(1 for l in open(p) if l.strip()))", path, check=False)
    assert r.returncode == 0, (
        f"no evidence file at {path} inside the backend container:\n{r.stdout}\n{r.stderr}"
    )
    return int(r.stdout.strip().splitlines()[-1])


def clause_k3_full_flow_through_docker():
    """K3 -- the live path works end to end against the composed stack."""
    # config
    exercises = _get_json(f"{BACKEND_URL}/exercises")
    records = exercises["exercises"] if isinstance(exercises, dict) else exercises
    assert records, "GET /exercises returned nothing from the container"
    assert any("thresholds" in r for r in records), (
        "GET /exercises served no thresholds -- the browser cannot run rules "
        "client-side (R4/F6) against this container"
    )

    # models registry -- present, whatever it reports
    _get_json(f"{BACKEND_URL}/admin/models/status")

    # the EMG hop, across compose DNS. The distinction that matters: no serial
    # device in a container is fine, an unreachable service is not. The
    # breaker's own message is the tell, and it is the only difference between
    # "no hardware" and "K2 is wrong".
    emg = _get_json(f"{BACKEND_URL}/api/emg/status")
    assert str(emg.get("error")) != "Service unavailable", (
        f"backend cannot reach the EMG service inside Docker: {emg!r}. "
        "That is the circuit breaker answering, not Flask -- K2's hostname is "
        "wrong or the service is not up."
    )

    # a full session over a real WebSocket into the container
    summary = _run_fake_client(BACKEND_URL, frames=100)
    sid, job_id = summary["session_id"], summary["job_id"]
    assert summary["frames_sent"] == 100
    status = _get_json(f"{BACKEND_URL}/session/{sid}")
    assert status.get("job_id") == job_id, (
        f"GET /session/{sid} reports job_id {status.get('job_id')!r}, end returned {job_id!r}"
    )
    assert status.get("ended_at"), "session was never marked ended inside Docker"

    # evidence reached disk inside the container
    sess_dir = _container_session_dir()
    assert _container_line_count(f"{sess_dir}/{sid}.jsonl") == 100, (
        "frames were accepted over the WebSocket but did not reach disk in the "
        "container -- the report path would read an empty session"
    )

    # the pages are served. Both halves: J's built pages and the vanilla live
    # page they navigate to with a relative ../src/ path.
    for path in ("/dist/index.html", "/src/pages/live_session.html"):
        st, body = _get(f"{FRONTEND_URL}{path}")
        assert st == 200 and body.strip(), f"frontend serves nothing at {path}"
    st, body = _get(f"{FRONTEND_URL}/dist/index.html")
    assert "backend-status" in body or "<div id=\"root\"" in body, (
        "the frontend container served an index.html that is not the built "
        "Phase J page"
    )

    print(f"  K3 OK -- {len(records)} exercises, EMG reachable, session {sid} "
          f"recorded {summary['frames_sent']} frames, pages served")


def _run_fake_client(base_url, frames, exercise="squat"):
    r = subprocess.run(
        [str(PY), str(BACKEND / "tools" / "fake_session_client.py"),
         "--url", base_url, "--exercise", exercise, "--frames", str(frames)],
        cwd=str(BACKEND), capture_output=True, text=True, timeout=300,
    )
    assert r.returncode == 0, f"fake client failed against {base_url}:\n{r.stdout}\n{r.stderr}"
    line = next(ln for ln in reversed(r.stdout.strip().splitlines()) if ln.strip().startswith("{"))
    return json.loads(line)


def clause_k4_three_concurrent_sessions():
    """K4 -- 3 concurrent sessions: no cross-session interference, latency holds."""
    idle = statistics.median(_sample_latency_ms(f"{BACKEND_URL}/health"))

    frames = [80, 90, 100]
    procs = [
        subprocess.Popen(
            [str(PY), str(BACKEND / "tools" / "fake_session_client.py"),
             "--url", BACKEND_URL, "--exercise", "squat", "--frames", str(n)],
            cwd=str(BACKEND), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for n in frames
    ]
    time.sleep(1.0)  # let all three get past start and onto the socket
    under_load = _sample_latency_ms(f"{BACKEND_URL}/health")

    summaries = []
    for p in procs:
        out, _ = p.communicate(timeout=300)
        assert p.returncode == 0, f"a concurrent session failed:\n{out}"
        line = next(ln for ln in reversed(out.strip().splitlines()) if ln.strip().startswith("{"))
        summaries.append(json.loads(line))

    ids = [s["session_id"] for s in summaries]
    jobs = [s["job_id"] for s in summaries]
    assert len(set(ids)) == 3, f"concurrent sessions collided on session_id: {ids}"
    assert len(set(jobs)) == 3, f"concurrent sessions collided on job_id: {jobs}"

    # No cross-session interference, measured on the evidence rather than on
    # the ids: frames crossing between buffers is the failure that a shared
    # buffer produces, and it is invisible until Phase I reads the file.
    sess_dir = _container_session_dir()
    for s, n in zip(summaries, frames):
        got = _container_line_count(f"{sess_dir}/{s['session_id']}.jsonl")
        assert got == n, (
            f"session {s['session_id']}: {got} frames on disk, {n} sent -- "
            "frames crossed between concurrent sessions"
        )

    load_med = statistics.median(under_load)
    budget = max(LATENCY_ABS_MS, idle * LATENCY_RATIO)
    assert load_med <= budget, (
        f"latency did not hold under 3 concurrent sessions: median "
        f"{load_med:.1f} ms against {idle:.1f} ms idle (budget {budget:.1f} ms). "
        "Something in the live path is blocking the event loop -- R6 requires "
        "the WS handler never await disk."
    )
    print(f"  K4 OK -- 3 sessions {frames} frames, no cross-talk, "
          f"/health median {load_med:.1f} ms under load vs {idle:.1f} ms idle")


def gate_phase_k():
    """The §7 Phase K gate: both clauses, against a real composed stack."""
    _require_docker()
    _compose("build", timeout=BUILD_TIMEOUT_S)
    _compose("up", "-d", timeout=BUILD_TIMEOUT_S)
    try:
        _wait_healthy(f"{BACKEND_URL}/health", HEALTH_TIMEOUT_S)
        _wait_healthy(f"{FRONTEND_URL}/dist/index.html", HEALTH_TIMEOUT_S)
        clause_k3_full_flow_through_docker()
        clause_k4_three_concurrent_sessions()
    finally:
        logs = _compose("logs", "--no-color", "--tail", "80", check=False)
        _compose("down", "-v", check=False, timeout=300)
        if os.environ.get("K_SHOW_LOGS"):
            print(logs.stdout)
    print("PHASE K GATE PASSED (docker end-to-end; 3 concurrent sessions hold latency)")


if __name__ == "__main__":
    try:
        gate_phase_k()
    except AssertionError as e:
        print(f"PHASE K GATE FAILED: {e}", file=sys.stderr)
        sys.exit(1)

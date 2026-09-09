"""PHASE H GATE — MASTER_BUILD_PLAN_v3.md §7.

    | H | Fake client drives a full session; buffer flushes; job enqueues |

Run from backend/:  ../venv/bin/python tools/test_h_gate.py

This is the one test that decides whether Phase H may be called done. It is
deliberately separate from the H1-H7 task tests: those check that each part was
built, this checks that the three clauses of the gate are true END TO END,
against a real uvicorn process, a real WebSocket, and real bytes on disk.

Nothing here is mocked. If it passes, a session's evidence survived the whole
path from a client that is not this test process to a file that outlives it.
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import urllib.request

from test_h7_fake_client import serve, run_fake_client

BACKEND = Path(__file__).resolve().parents[1]
REPO = BACKEND.parent
PY = REPO / "venv" / "bin" / "python"

FRAMES = 200


def _get_json(base, path):
    with urllib.request.urlopen(f"{base}{path}", timeout=10) as r:
        return json.loads(r.read())


def gate_phase_h_full_session():
    """The §7 Phase H gate, all three clauses, on real artefacts."""
    with serve() as (base, data_dir):

        # --- clause 1: a fake client drives a full session ------------------
        summary = run_fake_client(base, exercise="squat", frames=FRAMES)
        sid, job_id = summary["session_id"], summary["job_id"]
        assert summary["frames_sent"] == FRAMES
        print(f"  clause 1 OK -- session {sid}: "
              f"{summary['frames_sent']} frames in {summary['batches_sent']} batches")

        # --- clause 2: the buffer flushes -----------------------------------
        # Real file, real content, correct count. A flush that returns cleanly
        # and writes nothing is the failure this clause exists to catch, and it
        # is silent right up until Phase I finds an empty session.
        candidates = sorted(Path(data_dir).rglob("*.jsonl"))
        session_files = [p for p in candidates if sid in str(p)]
        assert session_files, (
            f"no flushed evidence file for {sid} under {data_dir}. "
            f"Found: {[str(p) for p in candidates]}"
        )
        assert len(session_files) == 1, (
            f"session {sid} flushed to {len(session_files)} files: {session_files}"
        )
        path = session_files[0]

        lines = [ln for ln in path.read_text().splitlines() if ln.strip()]
        assert len(lines) == FRAMES, (
            f"buffer flushed {len(lines)} of {FRAMES} frames to {path}. "
            "Evidence loss here is invisible until the report is built from it."
        )
        records = [json.loads(ln) for ln in lines]
        assert all("ts" in r for r in records), "flushed records lost their timestamps"
        assert all("landmarks" in r for r in records), "flushed records lost their landmarks"
        # Order is evidence too: rep segmentation (I3) reads this as a time series.
        ts = [r["ts"] for r in records]
        assert ts == sorted(ts), "flushed frames are out of chronological order"
        assert len(set(ts)) == len(ts), "flushed frames contain duplicates"
        print(f"  clause 2 OK -- {len(lines)} frames on disk at {path.name}, in order")

        # --- clause 3: the job enqueues -------------------------------------
        status = _get_json(base, f"/session/{sid}")
        assert status.get("job_id") == job_id, (
            f"GET /session/{sid} reports job_id {status.get('job_id')!r}, "
            f"/session/end returned {job_id!r}"
        )
        assert status.get("ended_at"), "session was never marked ended"
        assert status.get("status") in ("queued", "ended"), (
            f"unexpected session status {status.get('status')!r}"
        )
        print(f"  clause 3 OK -- job {job_id} enqueued and readable via GET /session/{{id}}")

    print("PHASE H GATE PASSED (fake client -> buffer flushed -> job enqueued)")


def gate_no_unmirrored_events():
    """Supporting check, not a gate clause. Phase H logs into the CLOSED
    vocabulary (§8b.3). An event name added to events.py but not to
    events.js writes a plausible-looking line and silently breaks every query
    written against it -- the exact defect PROJECT-STATUS §3 records being
    caught once already."""
    r = subprocess.run([str(PY), "app/test_events_mirror.py"],
                       cwd=str(BACKEND / "app"), capture_output=True, text=True)
    if r.returncode != 0:
        r = subprocess.run([str(PY), "test_events_mirror.py"],
                           cwd=str(BACKEND / "app"), capture_output=True, text=True)
    assert r.returncode == 0, (
        f"events.py and events.js disagree after Phase H:\n{r.stdout}\n{r.stderr}"
    )
    print(f"  {r.stdout.strip()}")


def gate_concurrent_sessions_do_not_interfere():
    """Not in §7's wording for H, but K4 load-tests 3 concurrent sessions and
    this is where a shared buffer would first show up. Cheaper to catch now
    than in Docker."""
    with serve() as (base, data_dir):
        procs = []
        for i in range(3):
            procs.append(subprocess.Popen(
                [str(PY), str(BACKEND / "tools" / "fake_session_client.py"),
                 "--url", base, "--exercise", "squat", "--frames", str(60 + i * 10)],
                cwd=str(BACKEND), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
            ))
        summaries = []
        for p in procs:
            out, _ = p.communicate(timeout=180)
            assert p.returncode == 0, f"a concurrent fake client failed:\n{out}"
            line = next(ln for ln in reversed(out.strip().splitlines())
                        if ln.strip().startswith("{"))
            summaries.append(json.loads(line))

        ids = [s["session_id"] for s in summaries]
        assert len(set(ids)) == 3, f"concurrent sessions collided on ids: {ids}"

        for s in summaries:
            files = [p for p in Path(data_dir).rglob("*.jsonl") if s["session_id"] in str(p)]
            assert len(files) == 1, f"session {s['session_id']} -> {len(files)} files"
            n = len([ln for ln in files[0].read_text().splitlines() if ln.strip()])
            assert n == s["frames_sent"], (
                f"session {s['session_id']}: {n} frames on disk, {s['frames_sent']} sent -- "
                "frames crossed between concurrent sessions"
            )
        print(f"  3 concurrent sessions, {[s['frames_sent'] for s in summaries]} frames, "
              "no cross-talk: OK")


if __name__ == "__main__":
    gate_no_unmirrored_events()
    gate_concurrent_sessions_do_not_interfere()
    gate_phase_h_full_session()

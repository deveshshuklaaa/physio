"""H7 — fake session client. Drives a live session over a REAL WebSocket
without a browser, a camera or a patient.

    ../venv/bin/python tools/fake_session_client.py \\
        --url http://127.0.0.1:PORT --exercise squat --frames N [--batch-ms 500]

Speaks the same wire format as frontend/src/ws/client.js (fixed contract,
not redesigned here): batches synthetic pose frames into ~batch-ms windows
and sends {"type": "pose_batch", "ts": ..., "frames": [...], "logs": []},
then {"type": "end"}.

Also exposes `serve()`, reused by the Phase H gate (test_h_gate.py) via
test_h7_fake_client.py.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
import urllib.error
import urllib.request

import websockets


def _post(url: str, body: dict) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def _frame(i: int, base_ts: int) -> dict:
    return {
        "ts": base_ts + i,
        "landmarks": [[0.1, 0.2, 0.3]] * 33,
        "flags": [],
    }


async def _drive(base_url: str, exercise: str, frames: int, batch_ms: int) -> dict:
    start = _post(f"{base_url}/session/start", {"exercise": exercise})
    session_id = start["session_id"]

    ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
    frames_sent = 0
    batches_sent = 0
    base_ts = int(time.time() * 1000)

    async with websockets.connect(f"{ws_url}/ws/session/{session_id}") as ws:
        # ~20fps synthetic capture, batched every batch_ms (R5: not one
        # message per frame).
        per_batch = max(1, round(20 * batch_ms / 1000))
        i = 0
        while i < frames:
            n = min(per_batch, frames - i)
            batch = [_frame(i + j, base_ts) for j in range(n)]
            await ws.send(json.dumps({"type": "pose_batch", "ts": int(time.time() * 1000),
                                       "frames": batch, "logs": []}))
            frames_sent += n
            batches_sent += 1
            i += n
            await asyncio.sleep(batch_ms / 1000)
        await ws.send(json.dumps({"type": "end"}))

    end = _post(f"{base_url}/session/end", {"session_id": session_id})

    return {
        "session_id": session_id,
        "job_id": end["job_id"],
        "frames_sent": frames_sent,
        "batches_sent": batches_sent,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--url", required=True, help="base http(s) URL of the backend, e.g. http://127.0.0.1:8000")
    ap.add_argument("--exercise", default="squat")
    ap.add_argument("--frames", type=int, default=120)
    ap.add_argument("--batch-ms", type=int, default=500)
    args = ap.parse_args()

    try:
        summary = asyncio.run(_drive(args.url, args.exercise, args.frames, args.batch_ms))
    except (OSError, urllib.error.URLError, websockets.exceptions.WebSocketException, TimeoutError) as e:
        print(f"fake_session_client failed: {e}", file=sys.stderr)
        return 1

    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())

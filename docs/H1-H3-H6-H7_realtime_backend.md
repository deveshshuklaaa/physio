# 11 — Realtime backend (Phase H)

Agent: realtime-backend-agent (Sonnet, per MASTER_BUILD_PLAN_v3.md §10 agent #7).
Scope: H1 (`session_buffer.py`), H2/H3/H6 (`ws/session_ws.py`), H7
(`tools/fake_session_client.py`).

## Files

- `backend/app/services/session_buffer.py` — H1, per-session ring buffer + flush.
- `backend/app/ws/session_ws.py` — H2 `/ws/session/{session_id}`, H3 EMG relay, H6 disconnect handling.
- `backend/tools/fake_session_client.py` — H7 CLI + `serve()`-compatible summary output.

## session_buffer.py (H1)

- `SESSION_DATA_DIR` (env `SESSION_DATA_DIR`, default `backend/app/session_data`),
  `BUFFER_CAPACITY = 4000`, `FLUSH_INTERVAL_S = 2.0` — module attrs per spec.
- `get_buffer(session_id)` — one `SessionBuffer` per session, cached in a
  module dict. `close_buffer(session_id)` stops the flush task, does a final
  flush, and drops the entry.
- `SessionBuffer.append`/`extend` — sync, O(1)/O(n), a `collections.deque`
  with manual overwrite-oldest (`popleft()` + `dropped += 1` when at
  capacity) — R3. No disk I/O on this path, asserted structurally by H1's
  tests (`append` is not a coroutine function, and no file exists after 50
  appends).
- `flush()` — snapshots the pending frames, writes them as JSONL via
  `asyncio.to_thread` (so a slow disk doesn't block the event loop or other
  sessions), and **only pops what it wrote from the deque after the write
  succeeds**. If the write raises, the frames stay buffered for the next
  attempt rather than being silently lost — this mattered concretely: H2's
  sabotage test (`patch.object(SessionBuffer, "flush", boom)`) replaces
  `flush` outright, and the WS handler and the background flush loop both
  swallow the exception (`contextlib.suppress`) so a dead disk degrades to
  "retry next tick," not "crash the session."
- `start_flush_task`/`stop_flush_task` — a plain `asyncio.Task` loop gated by
  an `asyncio.Event`, using `wait_for(event.wait(), timeout=interval_s)` so
  `stop_flush_task()` wakes it immediately instead of waiting out the
  interval. `stop_flush_task()` always does one more flush after the loop
  exits, so nothing is left in a dead task's memory (this is exactly the
  failure mode G-CONTINUE §7b flagged for an unstopped interval).

## session_ws.py (H2, H3, H6)

- `router` (`APIRouter`) carries `/ws/session/{session_id}`, exported for
  `main.py` to include — confirmed already wired by backend-core-agent
  (`app.include_router` + `app.state.sessions`/`app.state.jobs` were present
  by the time I ran the suite).
- Rejects unknown sessions **before** `accept()` (`websocket.close(code=4404)`
  then `return`) using `session_exists()` from `app.routes.session` — a
  socket for a session that was never started would buffer evidence nobody
  collects.
- Receive loop: `pose_batch` → `buf.extend(frames)` (sync, no disk) → returns
  immediately to the next `receive_json()`. `end` → break out of the loop.
  Anything else is ignored (not a place to grow protocol surface — R5 says
  evidence, not feedback, and this socket sends nothing back except EMG
  ticks).
- **H6 disconnect handling had one real bug worth flagging.** My first cut
  did the flush/`end_session`/close cleanup inline in the handler's
  `finally:` block. That passed everywhere except the abrupt-disconnect
  test, because Starlette's `TestClient.websocket_connect().__exit__()`
  cancels the underlying anyio `CancelScope` wrapping the ASGI app call
  almost immediately after sending the disconnect message — any `await` in
  a `finally:` that's still inside that scope gets re-raised into
  `CancelledError` on its very next checkpoint, so the flush/`end_session`
  awaits never got to run. Fix: the `finally:` block now only does
  `emg_task.cancel()` and hands the rest to a **detached**
  `asyncio.create_task(_finalize(...))`. A task created this way is not part
  of the cancel scope wrapping the handler, so it keeps running on the event
  loop after the handler coroutine returns — `_finalize()` does the EMG task
  teardown, `buf.stop_flush_task()` (final flush), `end_session()`
  (idempotent per H5), and the `ws_disconnected` log line. This is why H6's
  test uses a generous `_wait_for()` poll rather than asserting anything
  synchronously right after the `with` block exits — the design assumes
  cleanup finishes shortly after disconnect, not synchronously with it. This
  is real production behavior too, not just a test artifact: nothing here
  relies on `TestClient`-only internals, it only avoids awaiting inside a
  coroutine whose cancellation is already in flight.
- `EMG_POLL_INTERVAL_S = 0.3` (~3.3 Hz, inside the 2-5 Hz band H3 asks for).
  `get_live_emg_reading` is imported directly into this module (`from
  app.services.emg_client import get_live_emg_reading`) so tests can
  `patch.object(session_ws, "get_live_emg_reading", ...)`.
- EMG relay is a background `asyncio.Task`, independent of the pose receive
  loop. A `None` reading (circuit open, per `emg_client.py`'s existing
  breaker) just skips that tick — logged via `log_ring_buffer.push(...,
  "poll_timeout", ...)` rather than raised — so a dead EMG service costs the
  live chart, never the buffered pose evidence (verified by
  `test_h3_dead_emg_never_stalls_the_session`).
- Logging: `ws_connected`/`ws_disconnected` are synchronous `log.info()`
  calls (low-frequency, correlation-scoped via `with correlation(...)`).
  `batch_received` and the EMG `poll_timeout` are pushed through
  `log_ring_buffer.push(..., sample_every=5, session_id=session_id)` per
  §8b.6 — never a blocking log call in the receive loop. One thing worth
  flagging for whoever next touches `logging_setup.py`: `_RingBuffer.drain()`
  runs on a separate background thread/task, **outside** the `correlation()`
  contextvar scope that was active when `push()` was called — so
  `session_id` from the ring-buffered base schema would come back `None` if
  not passed explicitly. I worked around it by passing `session_id=` as an
  explicit field on every `push()` call in this file (it overwrites the
  `None` from the base schema on `payload.update(fields)`). Not a Phase H
  file to fix at the source, but worth knowing if other components hit the
  same gap.
- No new event names were needed — `ws_connected`, `batch_received`,
  `ws_disconnected`, `poll_timeout` were all already in the closed
  vocabulary.

## fake_session_client.py (H7)

- Uses the `websockets` library (already in the venv, 15.0.1) — not
  `httpx`/`TestClient` — because the point of H7 is a client that has never
  spoken to this server before, over a real socket.
- `POST /session/start` → one `websockets.connect()` to
  `/ws/session/{id}` → batches synthetic frames (`~20fps`, `--batch-ms`
  window, default 500ms, so `batches_sent < frames_sent` by construction) →
  `{"type": "end"}` → `POST /session/end` → prints one JSON summary line
  `{"session_id", "job_id", "frames_sent", "batches_sent"}` → exit 0.
- On any failure (dead server, bad URL, WS error) it catches the narrow set
  of expected exceptions, prints to stderr, and exits 1 — checked by
  `test_h7_reports_failure_when_the_server_is_gone`.

## Buffering approach (summary)

Evidence flow: WS receive → `SessionBuffer.append`/`extend` (in-memory
deque, R3-bounded) → background task flushes to
`{SESSION_DATA_DIR}/{session_id}.jsonl` every `FLUSH_INTERVAL_S` (or on
disconnect via `stop_flush_task()`, which flushes one last time) → H6's
disconnect handler calls `end_session()` (backend-core's idempotent seam,
`app.state.jobs`) after that final flush, so Phase I never sees a job
without its evidence file on disk.

## Test results (all run for real, from `backend/`)

```
../venv/bin/python app/services/test_session_buffer.py
  -> ALL H1 SESSION BUFFER CHECKS PASSED

../venv/bin/python app/ws/test_session_ws.py
  -> ALL H2/H3/H6 WEBSOCKET CHECKS PASSED

../venv/bin/python tools/test_h7_fake_client.py
  -> ALL H7 FAKE CLIENT CHECKS PASSED

../venv/bin/python tools/test_h_gate.py
  -> PHASE H GATE PASSED (fake client -> buffer flushed -> job enqueued)

./run_tests.sh
  -> ALL BACKEND CHECKS PASSED
```

`./run_tests.sh` also re-runs H4/H5 (`app/routes/test_session.py`, owned by
backend-core-agent) and the events-mirror check — both pass, confirming the
shared seam (`app.routes.session.session_exists`/`end_session`,
`app.state.sessions`/`app.state.jobs`, `main.py` wiring the router) landed
correctly on their side.

## Deviations from the plan / things worth flagging

1. **Not a deviation, but load-bearing**: the H6 fix above (detached
   `asyncio.create_task` for cleanup instead of inline `finally:` awaits) is
   the one place this implementation differs from the "obvious" version of
   the spec. Documented in detail above so it isn't silently reverted later.
2. `backend/app/routes/session.py` already existed when I started (built by
   backend-core-agent in parallel) — did not need to work around a missing
   file as the brief anticipated.
3. No new event names were needed; `events.py`/`events.js` untouched.
4. Did not touch `main.py`, `routes/*`, `emg_client.py`, `job_queue.py`, or
   anything under `frontend/`/`ml/`, per scope.

## What Phase I needs to know

- Flushed evidence lives at `{SESSION_DATA_DIR}/{session_id}.jsonl`, one
  JSON object per line: `{"ts": int, "landmarks": [...], "flags": [...]}`,
  in chronological order, no duplicate `ts` (verified by the gate). That's
  the file Phase I's extraction pipeline should read.
- `SESSION_DATA_DIR` is an env var (`os.environ["SESSION_DATA_DIR"]`,
  defaulting to `backend/app/session_data/`) — the H7 gate sets it per test
  run so concurrent runs don't collide; Phase I/deployment should set it
  explicitly too.
- A session's buffer is flushed and its file closed out by the time
  `end_session()`'s job is enqueued (H6 guarantees the flush happens first),
  so Phase I can trust the file is complete as soon as it sees the job.

---

## Corrections applied at phase close (orchestrator)

Two defects in `_finalize()` in `app/ws/session_ws.py`. Both were invisible to
the test suite because both only bite on the unhappy path, and the §7 gate
exercises the happy one. Fixed after the gate first went green.

**1. `end_session()` and the final flush failed silently.** The original
`with suppress(Exception): await end_session(...)` meant that if it raised, the
session was never marked ended, no job was ever enqueued, the flushed evidence
was orphaned — and nothing was logged. `log.info("ws_disconnected")` fired two
lines later regardless, so the log read like a clean teardown. That makes
§8b.9 ("reconstruct the run from its logs alone") false, and it is the same
defect pattern PROJECT-STATUS §3 records catching twice already (the
unenforced event vocabulary, and `voice.py`'s dead audio map reporting
"TTS ready").

`stop_flush_task()` had the same problem in the other direction: unguarded, so
a raise there skipped `end_session` entirely and died unheard inside a task
nobody awaits.

Both now log at ERROR with the §8b.5 fields, using `session_aborted` — an event
already in the closed vocabulary, so `events.py`/`events.js` stay mirrored and
no new name was introduced. Suppressing so teardown completes is fine;
suppressing silently is not.

**2. The detached finalizer could be garbage-collected mid-run.** The event
loop holds only a *weak* reference to a task, so `asyncio.create_task(...)`
with the result discarded can be collected while still executing. Under
concurrent load — exactly what K4 exercises with three simultaneous sessions —
that loses the final flush and the job enqueue with no error raised anywhere.
Now held in a module-level `_pending_finalizers` set with
`task.add_done_callback(_pending_finalizers.discard)`.

The CancelScope diagnosis in the section above is correct and unchanged; the
detached-task approach is the right fix. These two corrections harden it.

Full suite re-run after both fixes: `ALL BACKEND CHECKS PASSED`, §7 gate green
(200 frames / 20 batches / on disk in order / job readable).

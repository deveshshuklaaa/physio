# H4-H6 — Session lifecycle routes (Phase H4–H6 slice + status)

Agent: backend-core-agent (Sonnet, low effort). Scope: `backend/app/routes/session.py`,
wiring in `backend/app/main.py`, this doc. No other files touched.

## What was built

`backend/app/routes/session.py`:

- `POST /session/start` — body `{"exercise": str, "patient_id": str|None}` →
  `{"session_id": "s_<uuid4hex>"}`. Validates `exercise` against
  `app.state.exercise_registry` (F5's loader, already built at startup) — an
  unknown exercise is a trust-boundary violation and gets `404`, per F5's
  registry-is-authoritative rule. Nothing hardcoded; count-agnostic like F7.
- `POST /session/end` — body `{"session_id": str}` → `{"job_id": str}`.
  `404` if the session was never started. Delegates to `end_session()`.
- `GET /session/{session_id}` — full session record (`session_id`, `exercise`,
  `patient_id`, `started_at`, `ended_at`, `status`, `job_id`). `404` for an
  unknown id.
- `session_exists(app, session_id) -> bool` and
  `async def end_session(app, session_id) -> job_id` — the two functions
  pinned by the shared seam for `realtime-backend-agent`'s
  `app/ws/session_ws.py` to import (session rejection on WS connect, and the
  H6 abrupt-disconnect handler). Signatures unchanged from the brief.

`backend/app/main.py` (wiring only, no route bodies inline):
- `app.state.sessions = {}` and `app.state.jobs = {}` initialised once in the
  lifespan, alongside the existing F5 `exercise_registry` init.
- `app.include_router(session_router)`.
- A `try/except ModuleNotFoundError` import of `app.ws.session_ws.router` so
  the WS route wires in automatically once realtime-backend-agent's file
  lands; a no-op until then, not a startup failure.

## The job seam, as implemented

`app.state.jobs: dict[job_id, {"job_id", "session_id", "status": "queued"}]`.
`end_session()`:

```python
async def end_session(app, session_id: str) -> str:
    session = app.state.sessions[session_id]
    if session.get("job_id"):
        return session["job_id"]          # idempotency: reuse, don't re-enqueue
    job_id = f"job_{uuid.uuid4().hex}"
    session["ended_at"] = time.time()
    session["status"] = "queued"
    session["job_id"] = job_id
    app.state.jobs[job_id] = {"job_id": job_id, "session_id": session_id, "status": "queued"}
    return job_id
```

Idempotency is keyed off the session record itself (`session["job_id"]`),
not off scanning `app.state.jobs` — cheap, and correct for the three
legitimate callers (End Session button / WS `{"type":"end"}` / H6 disconnect)
converging on one job. No pipeline work runs inline; the handler never awaits
disk or MediaPipe (R6/R8). `POST /session/end` returns as soon as the dict is
updated.

**What Phase I must change when it replaces `app.state.jobs` with the real
`job_queue.py`:** swap the two dict writes in `end_session()` (`app.state.jobs[job_id] = {...}`
and the `session["job_id"] = job_id` bookkeeping) for a call into the real
queue's enqueue function, keeping the same idempotency guard (check-then-return
on `session.get("job_id")` before enqueuing). `session_exists()` and the
`end_session()` signature must not change — the WS module imports them
directly.

## Deviations from the plan

None. `GET /session/{session_id}` was explicitly pre-approved into scope by
the owner (the "status" third of §4).

## Test results (run for real)

`../venv/bin/python app/routes/test_session.py` (from `backend/`):

```
H4 POST /session/start: OK
H4 GET /session/{id} status: OK
H4 unknown exercise rejected: OK
H5 POST /session/end returns job_id: OK
H5 /session/end idempotent: OK
H5 unknown session rejected: OK
H5 job enqueued, not executed: OK
H5 job_queue.py ownership line respected: OK
ALL H4/H5 SESSION ROUTE CHECKS PASSED
```

`./run_tests.sh` (full suite) — everything up through and including
`H4/H5 session routes` passes. Remaining failures are entirely outside this
agent's scope, expected per the brief ("that file may not exist yet ... say
so and move on"):

- `H2/H3/H6 session ws` — `ImportError: cannot import name 'session_ws' from
  'app.ws'`. `backend/app/ws/session_ws.py` (realtime-backend-agent's file,
  including H6's behaviour) does not exist yet.
- `H7 fake client` / `PHASE H GATE (§7)` — `backend/tools/fake_session_client.py`
  does not exist yet (also realtime-backend-agent's, H7).

No conflict found between the approved tests and this plan.

**Correction, applied at phase close (orchestrator).** This section originally
said `main.py`'s `try/except ModuleNotFoundError` WS-router import needed no
further change once `session_ws.py` landed. That was wrong. The guard was the
right bridge while H1–H3 and H4–H6 were built in parallel, but once the file
exists it cannot distinguish "not written yet" from a genuine
`ModuleNotFoundError` raised by a nested import inside `session_ws.py` — the
app would boot, serve `/health`, and have no WebSocket route at all, with
nothing in the logs explaining why. It is now a plain unconditional top-level
import: a broken WS module fails at startup, on the same reasoning as
`_validate_record` in `exercise_config.py`.

The lifespan comment also cited `docs/12_session_routes.md`, which never
existed; it now points at this file.

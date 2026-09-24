# EMG Service Integration — Phase C

Verified 2026-08-21 against the actual code in `emg-service/` and
`backend/app/services/`. Supersedes/confirms `notes/emg-integration-notes.md`
(older task naming C0a/C0b/C0c/C1/C2 -> this file's C1/C2/C3/C5).

## C1 — Flask routes (`emg-service/backend/app.py`)

| Method | Path | What it does |
|---|---|---|
| GET | `/` | `app.send_static_file('index.html')` — serves `website/index.html` |
| GET | `/<path:path>` | Catch-all: `app.send_static_file(path)` — serves ANY file in `website/` by whatever name the browser asks for. Flask does not hardcode which HTML is "the live page"; that's decided entirely by which links the served HTML pages contain. |
| POST | `/api/start_capture` | Starts the in-process serial reader thread |
| POST | `/api/stop_capture` | Stops thread, appends a history.json entry if data was captured |
| GET | `/api/status` | `{"capture_running": bool, "error": str|null}` |
| GET | `/api/live-value` | Already exists (lines 194-223). Returns `{"signal": int, "envelop": int, "timestamp": float}`, or `{"signal": null, "envelop": null, "timestamp": null}` with HTTP 204 if no data yet. Non-blocking, reads from the in-process `data_queue`. **C5 confirmed already done — no Flask change made.** |
| GET | `/api/stream` | SSE stream of raw `"signal,envelop"` CSV lines |
| GET | `/api/list_recordings` | Returns `history.json` entries whose file still exists on disk |
| GET | `/api/recording/<filename>` | Downloads a `.bin` file (path-safe via `safe_join`) |
| POST | `/api/save_history` | Manually appends a history entry (used by legacy `/api/snapshot` flow) |
| POST | `/api/snapshot` | Copies the legacy shared `emg_capture.bin` into a new dated file + history entry |

### Which `website/*.html` is real (traced by grepping actual `<a href>`/link targets in the served HTML)

Real chain, reachable from `index.html`:
- `index.html` -> links to `live.html`, `playback.html`, `history.html`
- `live.html` -> links back to `history.html`
- `history.html` -> links to `index.html`, `live.html`, `playback.html`

**CANDIDATE-DEAD** (exist in `website/`, nothing links to them — not deleted, per instructions, just flagged for the later L1 cleanup phase):
- `live2.html`
- `live3.html`
- `live (copy)july 24.html`
- `history2.html`

`playback.html` is linked from `index.html`/`history.html` but see C3 below — the Python-side playback (`emg_review.py`) is not wired to any Flask route, so whatever `playback.html` does, it does client-side only (not verified here — out of scope, JS is frontend).

## C2 — Serial read architecture

Two separate things exist, do not confuse them:

1. **`emg-service/backend/app.py`** has its own **in-process** `serial_reader()` thread (started via `/api/start_capture` or automatically at boot). It reads the serial port directly, pushes each line into `data_queue` (used by `/api/stream` SSE and `/api/live-value`), and simultaneously packs samples into a per-session `.bin` file. **This is what the FastAPI `/api/live-value` client actually talks to. Data freshness: real-time, in-process, no file-polling delay.**
2. **`emg-service/emg_serial_capture.py`** is a **separate, standalone CLI script**, not imported by `app.py` and not run by it. It reads the real serial port, forwards raw lines to a virtual pty (so the Arduino IDE's own Serial Plotter can be pointed at it), and also writes to `data/emg_capture.bin`. It is a manual/offline tool, unrelated to the live web value.

**Answer: live EMG is instant (in-process, thread + queue), not file-polled.** The standalone capture script is a separate utility for viewing signal in the Arduino IDE plotter, not part of the live web path.

## C3 — `emg_review.py`

Standalone CLI (`python3 emg_review.py`), uses matplotlib to plot a `.bin` file's signal + envelope. Not imported by `app.py`, no Flask route calls it. Confirmed by grep: no `emg_review` reference anywhere in `app.py`. `playback.html`'s web-based playback (if any) is therefore separate client-side/JS logic, not this script.

## C4 — `history.json` exact schema

File: `emg-service/data/history.json`. Top-level: JSON array of objects. Current real contents (3 entries):

```json
[
  {
    "filename": "emg_20260715_022626.bin",   // string, .bin file basename in data/
    "timestamp": "20260715_022626",           // string — INCONSISTENT FORMAT, see below
    "size": 62332                             // int, bytes, from os.path.getsize at write time
  },
  {
    "filename": "emg_20260725_002806.bin",
    "timestamp": "2026-07-25T00:28:06.481637", // ISO 8601 string (datetime.isoformat())
    "size": 2875844
    // "duration": <float, seconds, rounded to 1 decimal> -- OPTIONAL, only
    // present when a session was stopped cleanly via POST /api/stop_capture
    // (add_to_history() called with duration=...). Entries added via
    // /api/save_history or /api/snapshot never have "duration".
  }
]
```

Exact keys, from `add_to_history()` in `app.py` (lines 47-57):
- `filename`: `str` — basename only, resolved against `DATA_DIR` (`emg-service/data/`)
- `timestamp`: `str` — **two formats coexist in the same file**: older entries use compact `YYYYMMDD_HHMMSS` (from `/api/snapshot`'s `strftime`), newer entries use full ISO 8601 with microseconds (`datetime.isoformat()` from `/api/stop_capture`). `feature_builder` must handle both.
- `size`: `int` — bytes, computed via `os.path.getsize` at the moment the entry is written (not live-updated if the file changes later)
- `duration`: `float`, optional, seconds, present only when written by `/api/stop_capture`

`.bin` file format (from `emg_review.py`/`app.py`): binary, samples packed as `struct.pack('<hh', signal, envelop)` — two little-endian `int16` per sample, 4 bytes/sample. Sample rate: 500 Hz (hardcoded constant `SAMPLE_RATE = 500` in `emg_review.py`, must match the Arduino sketch).

## C5 — `GET /api/live-value`

Already existed before this pass, at `emg-service/backend/app.py` lines 194-223. No Flask code changed by this agent (per scope — Flask untouched unless the route was genuinely missing, it was not).

## C6 — `backend/app/services/emg_client.py` circuit breaker (implemented this pass)

File: `/home/billa-dakait/Desktop/final_project/backend/app/services/emg_client.py`

Added a per-`base_url` circuit breaker shared by all three calls (`get_live_emg_reading`, `get_emg_history`, `get_emg_status`):

- Module constants: `FAILURE_THRESHOLD = 3`, `COOLDOWN_SECONDS = 30.0` (tunable).
- State: `_breaker_state: dict[str, dict]` — `{"failures": int, "opened_at": float|None}` per base_url.
- 3 consecutive failures (`httpx.ConnectError`/`TimeoutException`/`HTTPStatusError`/`RequestError`) -> circuit opens (`opened_at` set).
- While open and cooldown not elapsed: `_circuit_open()` returns `True` immediately, **no network call is attempted** — function returns `None` (or the existing degraded default for status/history) right away.
- After 30s elapsed: one trial call is allowed through. Success -> `_record_success()` resets `failures` to 0 and clears `opened_at` (circuit closes). Failure -> counter increments again, re-opens if still >= threshold.
- Never raises into the caller (`except` catches all relevant httpx exception types, function always returns a value).
- No blocking calls — everything is `async`/`await` via `httpx.AsyncClient`; the breaker check itself is a synchronous dict/time comparison (no I/O), so it can't stall the event loop.

## Self-check (run, real output)

File: `/home/billa-dakait/Desktop/final_project/backend/app/services/test_emg_client.py` — drives the breaker through closed -> open (via `_record_failure` calls) -> skip-while-open (mocks `httpx.AsyncClient` and asserts it's never constructed) -> simulated cooldown elapsed -> trial success closes circuit.

```
$ python3 backend/app/services/test_emg_client.py
open circuit: no network call attempted -> OK
ALL BREAKER SELF-CHECKS PASSED: closed -> open -> cooldown -> closed
```

**Additionally verified against a real (killed) Flask process**, not just the unit-level mock:

```
$ # Flask running, calls succeed:
live: None            # (204 — no serial data, expected: no hardware attached)
status: {'capture_running': False, 'error': "Could not open any serial port. ..."}
history: [...3 real entries from data/history.json...]

$ # Flask process kill -9'd, then 5 consecutive get_live_emg_reading() calls:
0 result= None state= {'failures': 1, 'opened_at': None}
1 result= None state= {'failures': 2, 'opened_at': None}
2 result= None state= {'failures': 3, 'opened_at': 14404.77...}   <- circuit opens here
3 result= None state= {'failures': 3, 'opened_at': 14404.77...}   <- no new network attempt
4 result= None state= {'failures': 3, 'opened_at': 14404.77...}   <- no new network attempt
```

This proves the breaker trips correctly on a genuinely dead Flask service, using real sockets, not just mocks.

## C7 — Temporary `/test-emg` route

**Not added** by this agent: `backend/app/main.py` already has permanent routes `GET /api/emg/live`, `GET /api/emg/status`, `GET /api/emg/history` (added by a prior pass, not owned by this agent — `main.py` is explicitly off-limits). Per the task's DO-NOT list ("do not add a permanent `/test-emg` route") and the ownership list (`main.py` not owned), this agent did not touch `main.py`.

End-to-end was instead verified two ways, both real (not predicted):
1. Flask routes directly, via Flask's own `test_client()` — confirmed `/api/live-value`, `/api/status`, `/api/list_recordings` all respond correctly.
2. Flask run as a real subprocess (`app.py`, port 5000) and `emg_client.py`'s async functions called directly against it over real HTTP — confirmed successful round trip, then confirmed breaker trips when the Flask process is killed (output above).

**What's UNVERIFIED-NEEDS-HUMAN**: calling the existing `/api/emg/*` FastAPI routes in `main.py` end-to-end (i.e., FastAPI process + Flask process both up, hitting FastAPI's port). This agent did not start `main.py`/uvicorn since `main.py` is not owned and starting the actual FastAPI service was not part of the verification needed to prove `emg_client.py` works — `emg_client.py` itself was proven directly against a live Flask instance, which is the code this agent owns and changed.

Also **UNVERIFIED-NEEDS-HUMAN**: a real EMG value != null/204, since no Arduino/serial hardware is attached in this environment. Every check above ran with `"Could not open any serial port"` — the plumbing is proven, actual signal data flowing through it is not.

## C8 — `.bin` file locations

Verified: `emg-service/` root has **zero** loose `.bin` files. All 12 `.bin` files + `history.json` + `emg_capture.bin` live in `emg-service/data/`.

Scripts confirmed to point at `data/`:
- `app.py`: `DATA_DIR = os.path.join(BASE_DIR, '..', 'data')` (absolute, resolved from `backend/app.py`'s own location) — used for all read/write paths.
- `emg_serial_capture.py`: `BIN_FILE = 'data/emg_capture.bin'` (relative — assumes script is run with cwd = `emg-service/`)
- `emg_review.py`: `BIN_FILE = 'data/emg_capture.bin'` (same assumption)

Confirmed working: loaded `data/emg_capture.bin` (2,875,844 bytes) via the exact unpack logic in `emg_review.py`'s `load()` -> 718,961 samples, no errors. Flask's own `/api/list_recordings` and `/api/recording/<filename>` were exercised via Flask's `test_client()` and returned correct data.

Caveat: `emg_serial_capture.py`/`emg_review.py`'s relative `'data/...'` path only resolves correctly if invoked with `emg-service/` as the working directory (as their own docstrings' `Usage:` sections imply, e.g. `python3 emg_review.py` run from that directory). Not a bug introduced here — already the existing pattern; flagging for whoever documents "how to run this."

## Task status summary

| Task | Status | Evidence |
|---|---|---|
| C1 | DONE | Route table + live.html chain traced above; candidate-dead HTML listed, none deleted |
| C2 | DONE | In-process thread confirmed real-time; standalone script confirmed separate/unrelated |
| C3 | DONE | Confirmed standalone CLI, no Flask wiring, via grep of `app.py` |
| C4 | DONE | Exact schema + real sample entries recorded above |
| C5 | DONE (pre-existing, verified) | Route present at app.py:194-223, tested via Flask test_client and live subprocess |
| C6 | DONE | Circuit breaker implemented in `emg_client.py`, unit self-check + live-kill test both pass |
| C7 | PARTIAL / UNVERIFIED-NEEDS-HUMAN for the FastAPI-process leg | `emg_client.py` proven directly against live Flask (owned code); `main.py`'s existing `/api/emg/*` proxy routes not re-verified since `main.py` is out of scope for this agent and no temp route was added per instructions |
| C8 | DONE, verified | No loose bins at root; all 3 scripts' paths confirmed; `.bin` load tested end to end |

## Files touched by this agent

- `backend/app/services/emg_client.py` — added circuit breaker (rewrote whole file; logic otherwise unchanged from prior pass)
- `backend/app/services/test_emg_client.py` — new, breaker self-check
- `docs/02_emg_routes.md` — this file

Nothing else was modified. `emg-service/**`, `backend/app/main.py`, `notes/**`, frontend, and ML code were not touched.

# 07 — Backend core (Phase B)

Agent: backend-core-agent. Scope: Phase B only (B1–B8). Did not start Phase F
(exercise config) or Phase H (session lifecycle endpoints) — out of scope for
this run, left as-is (`app/routes/`, `app/ws/` still empty aside from
`__init__.py`).

## Task status

| Task | Status | Evidence |
|---|---|---|
| B1 venv + API deps | DONE (already done by prior work) | `backend/requirements.txt` had fastapi/uvicorn/websockets/pydantic/httpx pinned before this run |
| B1 ML deps (docs/06 §14) | DONE | installed into `backend/venv`, pinned in `requirements.txt` — see below |
| B2 lifespan | DONE | `backend/app/main.py`, `asynccontextmanager` `lifespan`, passed to `FastAPI(lifespan=lifespan)`. Empty, commented R8 hook left for agent 10. |
| B3 `/health` responds | DONE | verified below |
| B4 `__init__.py` | DONE | created empty `__init__.py` in `app/`, `app/services/`, `app/routes/`, `app/ws/`, `app/models/`, `app/exercises/`, `app/config/` (all previously missing — confirmed via `find backend/app -name __init__.py` returning nothing before this run) |
| B5 telemetry + `/metrics` | DONE | `backend/app/telemetry.py`, wired into `main.py` |
| B6 Dockerfile | DONE (already done) | `backend/Dockerfile` — verified unchanged, still `python:3.11-slim`, copies `app/` only (see note below) |
| B7 logging_setup.py | DONE | `backend/app/logging_setup.py` |
| B8 events.py + events.js | DONE | `backend/app/events.py`, `frontend/src/lib/events.js`, mirror test `backend/app/test_events_mirror.py` |

## Endpoints (this phase)

- `GET /health` → `{"status":"ok"}`
- `GET /metrics` → `telemetry.snapshot()` as JSON: `{"counters": {...}, "timers": {...}}`
- Pre-existing, untouched: `GET /api/emg/live`, `GET /api/emg/status`,
  `GET /api/emg/history` (from `app/services/emg_client.py`, Phase C, not mine)

## Verification — real output

Started uvicorn on :8000, curled, then stopped it:

```
$ curl -sS http://127.0.0.1:8000/health
{"status":"ok"}

$ curl -sS http://127.0.0.1:8000/metrics
{"counters":{},"timers":{}}

$ curl -sS http://127.0.0.1:8000/api/emg/live
{"envelop":8,"signal":-7,"timestamp":1787259569.3373592}

$ curl -sS http://127.0.0.1:8000/api/emg/status
{"capture_running":false,"error":null}
```

`/api/emg/live` returned real numbers from the running Flask service on
127.0.0.1:5000 — confirms editing `main.py` (adding lifespan, `/metrics`) did
not break the EMG integration. Server stopped after; confirmed with a
`curl --max-time 2` returning connection-refused (exit 7).

Metrics registry is empty at boot by design — no counters exist yet because
nothing reports into it until later phases (pose worker, WS, EMG poller).
`backend/app/telemetry.py`'s own `__main__` self-check exercises `incr`,
`timing`, `timer()` and `snapshot()`:

```
$ python telemetry.py
OK: telemetry self-check passed {'counters': {'frames_dropped': 3}, 'timers': {'inference_ms': {'count': 1, ...}}}
```

## Logging schema — real example line

Emitted through `logging_setup.py` with `correlation()` active:

```
python -c "
from logging_setup import get_logger, correlation
log = get_logger('session')
with correlation(session_id='s_demo1', trace_id='t_demo1', span_id='sp_1'):
    log.info('session_started', patient_ref='p_ref_opaque123', exercise_name='seated_knee_extension')
"
```

produced (`backend/logs/session.log`, one line):

```json
{"ts_wall": "2026-08-20T21:00:13.999Z", "ts_mono": 21679.320950659, "seq": 1, "session_id": "s_demo1", "trace_id": "t_demo1", "span_id": "sp_1", "parent_span_id": null, "component": "session", "event": "session_started", "level": "INFO", "patient_ref": "p_ref_opaque123", "exercise_name": "seated_knee_extension"}
```

Matches §8b.1/§8b.2: full correlation identity, both clocks, per-component
`seq`, patient identified only via opaque `patient_ref` (§8b.7). `backend/logs/`
was deleted after this demo (runtime artifact, not committed — **note**:
`.gitignore` does not currently ignore `backend/logs/` or `*.log`; I don't own
`.gitignore` so I did not add it — flagging for whichever agent does).

Design notes on `logging_setup.py`:
- Correlation IDs (`session_id`, `trace_id`, `span_id`, `parent_span_id`) live
  in `contextvars`, set via the `correlation()` context manager — propagate
  through `async`/`await` without threading through every call.
- `ts_wall` = ISO-8601 UTC ms; `ts_mono` = `time.monotonic()`. Both on every line.
- `seq` = per-component monotonic counter (thread-safe, simple lock).
- Rotation: `RotatingFileHandler`, 10 MB/file, 5 backups, one file per
  component under `backend/logs/<component>.log`. **Deviation**: implemented
  size rotation only, not age rotation — stdlib doesn't compose
  `RotatingFileHandler` and `TimedRotatingFileHandler` cleanly on one handler.
  Flagged with a `ponytail:` comment in the source; add a periodic age-based
  purge job later if idle-but-large-over-time logs become a real problem.
- Per-component level: `set_component_level(component, logging.DEBUG)`,
  runtime-adjustable (just calls `logger.setLevel`).
- `error()` builds the §8b.5 fields (`error_type`, `error_message`, `stack`,
  `inputs_hash`, `stage_state`, `retry_count`) and only adds `remediation` when
  `event` matches a key in the static `REMEDIATION` dict (`schema_mismatch`,
  `circuit_opened`, `calibration_failed` — exactly the three from §8b.5, no
  more). For any other event the field is absent, verified in the self-check.
- Non-blocking live path: `log_ring_buffer.push(logger, level, event, **fields)`
  appends to a bounded `deque` (O(1), no I/O, no logger call); a separate
  drain — `log_ring_buffer.drain()` or the daemon thread started by
  `start_drain_task()` (wired in `main.py`'s lifespan startup, and drained
  once more on shutdown) — does the actual write. `push(..., sample_every=N)`
  supports "log every Nth" for high-frequency events; the caller decides which
  events are anomalies and must always pass `sample_every=1` for those (not
  enforced in code — a policy documented here and in the module docstring, per
  §8b.6 "anomalies are never sampled").
- Privacy (§8b.7): nothing in this module logs raw landmark arrays — that's
  a policy for callers (pose_worker, later phases) to follow; the module
  itself imposes no field allowlist because it doesn't know your payload
  shape. Documenting as policy for later agents, per the brief.

Self-check: `python backend/app/logging_setup.py` — asserts correlation
propagation/reset, JSON line shape, `remediation` present/absent correctly,
and that `push()` doesn't touch the logger until `drain()` runs. Output:

```
OK: logging_setup self-check passed
```

## Event vocabulary — B8

`backend/app/events.py`: 9 frozenset-like `set()`s (one per §8b.3 component:
`session`, `recorder`, `pose_worker`, `ws`, `emg_imu`, `crosscheck`,
`extractor`, `model`, `shap_report`) plus `ALL_EVENTS` (their union) and
`is_valid_event()`. 40 events total, transcribed verbatim from §8b.3, with
the docs/06_ml_pipeline.md §15 set (`clip_started`, `clip_completed`,
`clip_failed`, `landmark_gap_detected`, `model_loaded`, `schema_mismatch`,
`prediction_made`) confirmed present in the module's own self-check.

`frontend/src/lib/events.js`: same 9 groups as plain `export const` string
arrays plus `ALL_EVENTS`. Each file's header comment names the other as its
mirror.

Drift check: `backend/app/test_events_mirror.py` — regex-parses the JS file
for quoted snake_case strings, diffs the set against `events.ALL_EVENTS`. Run:

```
$ python events.py
OK: 40 events, no duplicates, all required present
$ python test_events_mirror.py
OK: events.py and events.js agree on 40 events
```

## requirements.txt — ML deps added (B1 / docs/06 §14)

Added, pinned to versions actually installed and verified importable in
`backend/venv` (Python 3.12.3):

```
pandas==3.0.5
numpy==2.5.1
scikit-learn==1.9.0
xgboost==3.4.1
joblib==1.5.3
pyarrow==25.0.1
opencv-python-headless==5.0.0.93
mediapipe==1.0.0
tqdm==4.70.0
```

Notes:
- `numpy`, `opencv-python` (not headless), `mediapipe` were already present in
  the venv from earlier work (Phase D/E, not mine). Pinned `numpy==2.5.1` and
  `mediapipe==1.0.0` to those already-installed versions instead of
  reinstalling. `pandas`, `scikit-learn`, `xgboost`, `joblib`, `pyarrow`,
  `tqdm` were missing and installed now.
- **Deviation**: requirements.txt specifies `opencv-python-headless` (correct
  for a server image, no GUI/X11 deps) but the venv itself still has
  `opencv-python` + `opencv-contrib-python` installed (from prior work) — I
  did not uninstall/swap those locally since I don't own that prior agent's
  environment state, and both packages provide the same `cv2` import so local
  dev is unaffected. The Docker image (which does a clean `pip install -r
  requirements.txt`) will correctly get only the headless variant.
  `opencv-contrib-python` is not in requirements.txt at all — not asked for
  by docs/06 §14, flagging in case `backend/ml/` actually needs a contrib-only
  function (not verified either way, out of scope for this agent).
- **Image size**: this roughly doubles+ the Docker image (mediapipe + opencv +
  xgboost + scipy alone are large wheels — `xgboost` pulled in
  `nvidia-nccl-cu13` at ~250MB as a transitive dep, which is very unlikely to
  be needed for CPU-only inference in this project). Flagging per the brief:
  a later split into an API image (fastapi/uvicorn/httpx/websockets only) and
  a separate ML worker image (pandas/sklearn/xgboost/mediapipe/opencv) is
  probably worth doing before deploying anything, but building that split is
  out of scope for Phase B.
- `backend/Dockerfile` still `COPY app/ ./app/` only, does not copy `ml/`.
  Correct for now (main.py doesn't import `backend/ml/`), but noting since the
  new ML deps in requirements.txt would otherwise look unused in the image —
  they're there because `backend/app/**` will eventually call into
  `backend/ml/` per the repo layout (§4), and a later phase needs to add
  `COPY ml/ ./ml/` to the Dockerfile when that wiring happens. Not done here —
  not this agent's task and touching Dockerfile beyond what's already correct
  for B6 was out of scope.

## Hooks left for later phases

- `main.py` lifespan startup has an empty, comment-marked block naming R8
  for agent 10 to drop `joblib.load(...)` / `shap.TreeExplainer(...)` into
  `app.state`.
- `telemetry.py`'s `incr`/`timing`/`timer()`/`snapshot()` are ready for R10's
  named counters (capture fps, inference fps, frames dropped, WS queue depth,
  feedback latency) — none of those are populated yet, by design; this agent
  built the registry, not the instrumentation.
- `log_ring_buffer.start_drain_task()` is called once in `main.py`'s lifespan
  startup so any component that does `log_ring_buffer.push(...)` from day one
  has a working drain loop already running.

## Files touched/created

- `backend/app/main.py` (edited: added lifespan, `/metrics`, imports)
- `backend/app/telemetry.py` (new)
- `backend/app/logging_setup.py` (new)
- `backend/app/events.py` (new)
- `backend/app/test_events_mirror.py` (new)
- `backend/app/__init__.py`, `backend/app/{services,routes,ws,models,exercises,config}/__init__.py` (new, empty)
- `backend/requirements.txt` (edited: ML deps appended)
- `frontend/src/lib/events.js` (new)
- `docs/07_backend_core.md` (this file)

Not touched: `backend/Dockerfile` (already correct for B6), `backend/app/services/emg_client.py`,
`backend/app/services/test_emg_client.py`, `backend/ml/**`, `backend/_old_physio_reference/**`,
`emg-service/**`, any other `frontend/src/**`, `.gitignore`.

---

## Post-agent review fixes (orchestrator)

Two defects found while verifying the Phase B gate. Both fixed and re-verified.

### 1. The closed event vocabulary was not actually closed

`events.py` defined `ALL_EVENTS` and an `is_valid_event()` helper, but nothing
ever called it. `ComponentLogger._emit()` took `event: str` and wrote whatever
it was given, so this was accepted silently:

```json
{"component":"pose_worker","event":"frame_droped","level":"WARN","reason":"typo_not_caught"}
```

That is precisely the failure §8b.3 exists to prevent — a typo'd name still
produces a plausible-looking line while silently breaking every query written
against the real event. The vocabulary was documentation, not enforcement.

**Fix:** call `is_valid_event()` in `_emit()` — the single function every
`debug`/`info`/`warn`/`error` call already routes through — and raise
`ValueError` on an unknown name.

Raising (rather than warning and continuing) is deliberate: an event name is a
**code literal**, not runtime data. A wrong one is wrong on its very first call,
so it surfaces immediately in development and can never become a new surprise
mid-session. This is the same reasoning that makes a `NameError` preferable to a
silent `None`.

Verified after the fix: `frame_dropped` logs normally; `frame_droped` and
`total_nonsense_event` both raise.

### 2. `backend/logs/` was not gitignored — patient data exposure

§8b.7 is explicit that landmark coordinates are biometric data about a real
person, that full coordinate dumps are permitted at DEBUG, and that DEBUG logs
inherit the same retention policy as raw video. With `backend/logs/` untracked
but not ignored, the first `git add -A` would have committed that data into
history permanently — where the §8 retention commitment ("deleted only after
confirmed report save") could no longer be honoured, because git history is not
deletable in the way a file is.

The Phase B agent flagged this in its own notes but correctly did not act, as it
does not own `.gitignore`.

**Fix:** appended to `.gitignore`:

```
# Structured logs (§8b.7 — may contain landmark DEBUG data; patient biometric)
backend/logs/
*.log
```

Verified: `git check-ignore -v backend/logs/pose_worker.log` →
`.gitignore:49:backend/logs/`.

### Regression check after both fixes

```
OK: events.py and events.js agree on 40 events
OK: 40 events, no duplicates, all required present
OK: telemetry self-check passed
health : {"status":"ok"}
metrics: {"counters":{},"timers":{}}
emg    : {"envelop":8,"signal":-7,"timestamp":1787260029.1570654}
```

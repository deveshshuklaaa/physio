# Demo execution — findings and progress

Companion to `docs/13_demo_execution_plan.md`. One entry per completed task, in
execution order. Findings only; decisions still live in
`docs/12_emg_v3_integration_decisions.md`.

---

# ⚠ PERMANENT vs DEMO-ONLY — read this first

Everything below in this document is history. **This section is the ledger.**
Written 2026-09-21, the night before the R4 presentation.

## A. Permanent — keep, build on

These are real changes that belong in the product. Nothing here needs reverting.

| Change | Where | Why it stays |
|---|---|---|
| `DATA_DIR` reads `EMG_DATA_DIR` | `emg-service/backend/app.py` | Recordings survive a container rebuild (O1). Default unchanged when unset |
| `patient_user_id` + `session_id` on new recordings | `emg-service/backend/app.py` | Recordings are attributable (O4). Written only when supplied, so nothing else breaks |
| `start_capture` / `stop_capture` / `recalibrate` | `backend/app/services/emg_client.py` | The engine's write path to the EMG service. Reuses the existing breaker, never raises |
| Capture start/stop wired into the session lifecycle | `backend/app/routes/session.py` | `stop_capture` sits in `end_session()` so the WS-end and abrupt-disconnect paths finalise too |
| 400/409 treated as a healthy no-op, not a breaker failure | `backend/app/services/emg_client.py` | Without it, three no-ops open the breaker and the NEXT session silently records nothing |
| `POST /session/calibrate`, `GET /calibration` | `backend/app/routes/session.py` | Pre-session calibration gate (R1). Auth-required, degrades to 200 when the service is down |
| `calibration_ok()` | `backend/app/services/emg_client.py` | D16's rule in one pure function: only `mpu_ok && !shaky` counts |
| `primary_branch: "both"` on `mini_squat`, `seated_knee_extension` | `backend/app/config/exercises.json` | D20's intended end state. Inert until D20 enforcement exists |
| `history.replaceState` on the deep link | `frontend/app/src/pages/ExerciseSelect.jsx` | Cosmetic but harmless and correct. **Not** a fix for S18 |
| Dockerfile runs `backend/app.py` directly | `emg-service/Dockerfile` | The old `run.py` shim referenced a serial-era function that no longer exists |
| Firmware sketch restored | `emg-service/sketch_jun22a/` | `HOST_IP`/`WIFI_SSID` are compile-time constants; re-flashing needs this source |
| Four test files | see §"Verification" entries | `test_phase16`, `test_emg_capture`, `test_doctor_lookup`, `test_calibration_gate` |
| `_spawn()` strong-ref for fire-and-forget tasks | `backend/app/routes/session.py` | Bare `create_task` can be GC'd before running; this was silently dropping stop_capture (see F3) |
| Test suites pinned to a dead `EMG_SERVICE_URL` | 6 engine test files | Running the suite no longer writes real recordings or leaves a capture active (closes F2) |

## B. DEMO-ONLY — must be reverted or replaced immediately after 2026-09-22

Each item below carries a `D29 TEMPORARY` comment in the code naming itself.
**None of these is a design. They are all stopgaps with a known expiry.**

| # | Change | Where | Replace with |
|---|---|---|---|
| 1 | nginx `location /emg/` exposing the Flask service | `nginx/default.conf` | Scoped engine routes (§7.2 of doc 12). See `security.md` S21 |
| 2 | `limit_except GET { deny all; }` inside it | `nginx/default.conf` | Goes with item 1 |
| 3 | `127.0.0.1:5000:5000` port publication | `docker-compose.yml` | Goes with item 1. This is D29's stated expiry condition |
| 4 | EMG iframe block in the patient view | `part2/.../pages/ExercisePlan.jsx` | A scoped React view fed by an engine route |
| 5 | EMG iframe block in the doctor view | `part2/.../pages/PatientResearch.jsx` | Same |
| 6 | `patient_user_id` back-stamped by hand into 9 entries | `emg-service/data/history.json` | Real attribution at capture time (already works for new recordings) |
| 7 | EMG panels are **buttons** opening `http://127.0.0.1:5000/{progress,history}.html` in a new tab (iframes removed — too confusing) | `ExercisePlan.jsx`, `PatientResearch.jsx` | A scoped in-app view served by an engine route (§7.2). See F4 for why the `/emg/` nginx path could not be used |
| 8 | `emg-service` container runs as **root**; new recordings are `root:root 0644` | `docker-compose.yml` (add `user: "1000:1000"`) or a non-root user in `emg-service/Dockerfile` | Host user cannot edit/chmod new recordings without sudo. Harmless to the app; fix post-demo with a rebuild + retest |

**Revert procedure:** delete items 1-3 and 4-5 by their marker comments, then
`docker compose up -d --build`. Item 6 is data, not code; it stays until the old
recordings are re-attributed or retired.

**Why these exist:** the properly-scoped version was costed at ~5 hours on the
night before the demo. The owner decided the demo data belongs to one real person,
so there is nothing to disclose, and chose the stopgap knowingly.

**What makes them unsafe the moment they outlive the demo:** the pages are
unscoped (S12) and unauthenticated (S2), and nginx listens on `0.0.0.0:80`, so
anyone on the network can read every recording of every patient.

## C. Known-open, NOT done, decided rather than forgotten

| # | Gap | Status |
|---|---|---|
| 1 | **S18** — `/session/start` does not verify the exercise was assigned | Designed and costed (~20 min code, 2-4 h with verification). Deferred: a mistake here blocks the demo's opening step. D7's doctor-approval property is displayed, not enforced |
| 2 | **S20** — `PAT980086` still has a dangling `consultingDoctorId` | One patient still invisible to every doctor. `kokila ben` was deleted; this one was not |
| 3 | **S19** — `createStaffAccount.js` holds DOC002's plaintext password, in git | The demo doctor's own account. In every clone's history |
| 9 | DOC002 password forgotten | Resolved via `part2/.../backend/scripts/resetStaffPassword.js` — env-supplied pw (`DOC_PROF_ID`, `NEW_PASSWORD`), none hardcoded, sets `mustChangePassword=false`, prints nothing secret. Untracked; forgot-password flow still not built |
| 4 | **D16 mid-session purge** — recalibration should end the recording and discard prior samples | Flask does the opposite: refuses with 409. R1 sidesteps it by calibrating before the session starts |
| 5 | **D13 Calibrate button on `live_session.html`** | Not buildable until item 4 exists — it would 409 every time |
| 6 | **D17 disclaimer page, D18 all-ready gate** | Not built. D18 has no design |
| 7 | **D20 enforcement** | Nothing reads `primary_branch`. `seated_knee_extension` also has no D19 placement |
| 8 | **Engine tests write real EMG recordings** | See F2 below. Hazard for anyone running the suite while the loopback port is published |


---

## P0.3 — part2 deep link vs `/session/start` exercise handling

**Status:** done, 2026-09-21. **Verdict: D32's hole is LIVE, not theoretical.**

### Deep link is constructed client-side, gated client-side

`part2/Hemophillia-confirm/frontend/src/pages/ExercisePlan.jsx:1196`

```js
const startHref = `/dist/index.html?exercise=${encodeURIComponent(item.exerciseId)}&rec=${encodeURIComponent(item._id)}`;
```

The only assignment gate on this side is `canStart = item.status === "ACTIVE"`
(ExercisePlan.jsx:1190), which decides whether to render an `<a>` or a disabled
`<div>`. The URL itself is hand-editable, so this gate is cosmetic.

### The engine client forwards it unchecked

`frontend/app/src/pages/ExerciseSelect.jsx:161, 235–245` parses
`?exercise=&rec=`, resolves the engine exercise, and POSTs `/session/start` with
`{exercise, exerciseId, recommendationId}`. It performs no check of its own.

### The server never validates the recommendation

`backend/app/routes/session.py:224–246`

- Only validation present: `body.exercise not in registry` → 404 (line 228).
- `recommendation_id` is taken from the request body and written straight onto
  the session row — `"recommendationId": dbmod.to_object_id(body.recommendation_id)`
  (line 244). It is never read back, never verified to exist, never checked to
  belong to `user.user_id`, and never checked for `status == "ACTIVE"`.
- `grep -rn "recommendation" --include=*.py backend/app` outside tests returns
  only that write and a doc-string mention. Nothing in `backend/app/` reads
  `patientexerciserecommendations` at all.

### Exploit

A patient edits `?exercise=<any_engine_id>&rec=<anything>` — or POSTs
`/session/start` directly with `recommendation_id: null` — and gets a real
`session_id`, a snapshotted doctor link, and a Gemini report. D7 (no
machine-generated exercise reaches a patient without doctor approval) is
bypassed end to end.

### Consequence for Phase 4 (the P0.3 gate)

**Full size, not trimmed. ~60 min, not 30.** P4.T and P4.1 are both required.

The work is one lookup in `session_start` before the insert: query
`patientexerciserecommendations` for
`{_id: recommendation_id, patient: user.user_id, status: "ACTIVE"}` and refuse
otherwise.

Two things P4.1 must settle that the plan does not currently name:

- **D28 indistinguishability.** Line 228's existing 404 leaks the exercise id in
  its `detail` string. The new refusal must be a plain 404, and that older
  message should be flattened to match, or the two branches are trivially
  distinguishable.
- **The absent-`recommendation_id` case.** Our own client starts sessions with no
  `recommendation_id` at all (ExerciseSelect.jsx:275), so a check keyed purely on
  the id would let `null` sail through. Needs an explicit rule.

---

## Plan amendments

### A1 — P1.5 does not delete `live.html` (owner, 2026-09-21)

The plan's P1.5 deletes `website/live.html` along with the other live-viewer
copies. **Amended: `live.html` is retained.**

> `live.html` is not deleted until we are certain that whatever data it was
> capturing, and whatever processes or calculations it was doing, are already
> implemented in other appropriate files.

`live2.html`, `live3.html` and `live (copy)july 24.html` remain deletable under
D4 and are already gone from `emg-service/website/`. `live.html` is still
present there and stays until the analysis below clears it.

### Phase 1 status

Completed by the owner. Verification (P1.4) waived by the owner; not
independently checked.

---

## F1 — what `live.html` does, and what is not yet reimplemented

**Status:** analysed 2026-09-21 (haiku subagent, read-only; key claims re-verified
directly). **Verdict: NOT SAFE TO DELETE TODAY.** `live.html` is 562 lines and is
the EMG service's only operator UI for capture control.

This is the evidence behind amendment A1. It does not overturn D2 (which drops
live EMG *viewing*) — D2 kills the trace display; what it did not account for is
that the same page carries the only controls for starting, stopping and
calibrating a capture.

### What it does

| Behaviour | live.html lines | Elsewhere? |
|---|---|---|
| SSE live signal stream, `EventSource('/api/stream')` | 517 | server side in `app.py`; no other consumer |
| 800-point FIFO scrolling buffer + canvas draw | ~246–290 | `playback.html` renders a canvas, but over a finished file, not a stream — **different mechanism** |
| Display gain multiplier, 0.5×–10× slider, applied as `dataBuffer[i] * gain * scale` | 175–177, 287, 449–451 | **UNIQUE.** Display-only; does not affect recorded data |
| `POST /api/start_capture` | 335 | endpoint exists (`app.py`); **no other caller in the repo** outside tests |
| `POST /api/stop_recording` | 351 | endpoint exists; **no other caller** outside tests |
| `POST /api/recalibrate` | 373–386 | endpoint exists; **no other caller** outside tests |
| Calibration state machine — new calibration detected by `calibration_seq` changing, not by timing; `MIN_CALIBRATING` floor on UI visibility | 253–256, 382, 457–491 | **UNIQUE** |
| 1 Hz `/api/status` poll driving the status label (priority: calibrating > no data > streaming) | 457–514 | **UNIQUE** |
| 6-axis IMU live readout (raw LSB, frame-throttled) | in draw loop | **UNIQUE** |
| Recording visual state + restore after reload | — | **UNIQUE** |
| Post-save redirect `playback.html?file=<name>` | 414 | **UNIQUE** (playback.html consumes the param) |

Backend endpoints all survive in `app.py` — the **server API is not at risk**.
What is unique is the client that drives it.

### Inbound references

- `emg-service/website/index.html:6` — `<meta http-equiv="refresh">` to `live.html`. **It is the service's entry point.** Deleting the file breaks `/` for the whole EMG site.
- `emg-service/website/history.html:143` — floating action button to `live.html`
- `emg-service/website/progress.html:128` — "Go to Live" button
- `emg-service/emg-history-playback-spec.md` — many references, incl. §4 "live.html changes"
- `docs/02_emg_routes.md:26–28` — route table

### Would be lost if deleted today

1. The only UI to **start** a recording.
2. The only UI to **stop** a recording.
3. The only UI to **recalibrate** the board.
4. The calibration state machine (`calibration_seq` edge detection).
5. The live status indicator and its label priority.
6. The IMU live readout.
7. The display gain control.
8. The EMG site's entry point (`index.html` redirects here).

### Bearing on the plan

- **P5.3 gap.** Phase 5.3 verifies `history.html`, `playback.html`, `progress.html` render. None of those can start a capture. If `live.html` were gone, the D29 operator demo would have no way to trigger a recording by hand.
- **P2.3 is the real replacement path.** P2.3 threads `patient_user_id` from the engine's capture-start call through to finalisation — meaning the engine will call `/api/start_capture` itself. **That call does not exist yet**: grep finds no non-test caller of `start_capture`, `stop_recording` or `recalibrate` anywhere outside `live.html`. Until P2.3 lands and is demonstrated, `live.html` is the only thing that can begin a recording.
- **Recalibrate has no successor planned at all** in doc 13. Even after P2.3, item 3 above stays unique.

**Deletion condition:** revisit only after P2.3 works end to end, and only once a decision exists for recalibration and for `index.html`'s entry point. Not before the demo.


---

## P2 — data plumbing (Q49, D31)

### P2.T — tests written first (done 2026-09-21)

New file `emg-service/backend/test_phase16_data_plumbing.py`, 110 lines, matching
`test_phase12.py`'s house pattern (module-level `check`/`check_eq` counters,
`CURRENT` label, plain runnable script, exit 1 on failure). Two invariants only,
per §2.3.

Red phase confirmed before any implementation:

```
PHASE 16: data plumbing (EMG_DATA_DIR persistence, patient_user_id linkage)
  FAIL [DATA_DIR follows EMG_DATA_DIR when set] ... expected '/tmp/tmpqewh2h7s' actual '/home/.../emg-service'
  FAIL [DATA_DIR follows EMG_DATA_DIR when set] HISTORY_FILE must be derived from the env-var DATA_DIR ...
  FAIL [a new recording's history entry carries patient_user_id] ... expected 'patient-42' actual None

4/7 checks passed  (3 FAILED)
```

The test redirects `DATA_DIR` to a `tempfile.TemporaryDirectory()`; the real
recordings and `history.json` are never opened.

### P2.1 and P2.2 — done 2026-09-21

Diff confined to `emg-service/backend/app.py`. No other file touched.

- **P2.1** — `DATA_DIR = os.environ.get('EMG_DATA_DIR', os.path.join(BASE_DIR, '..'))`.
  Default is byte-for-byte the previous hardcoded value, so behaviour with the
  variable unset is unchanged. `BIN_FILE` and `HISTORY_FILE` already derived from
  `DATA_DIR`, so they follow automatically. A grep for `BASE_DIR` across the file
  found only the `DATA_DIR` definition itself — no path bypasses it.
- **P2.2** — new module-level `capture_patient_user_id`, set at the top of
  `_start_recording_locked(patient_user_id=None)` so it is reset on every capture
  and cannot leak between recordings. `_stop_recording_locked` passes it to
  `add_to_history`, which gained an optional `patient_user_id=None` and writes the
  key **only when it is not None** — so the 11 existing entries and any caller
  that omits it are untouched (D31, new recordings only).
- `POST /api/start_capture` reads the id via `request.get_json(silent=True) or {}`.
  `live.html:335` POSTs with no body at all; that path yields `None` rather than a
  400, so the existing operator UI keeps working (see F1).
- No `session_id` added — that is P2.3.

### Verification

Run from `emg-service/` with the project venv:

```
test_phase16_data_plumbing       7/7 checks passed
test_phase12                     61/61 checks passed
test_phase14                     42/42 checks passed
test_phase15                     23/23 checks passed
test_app                         22/22 checks passed
```

No regressions. **P2.4 (rebuild twice, O1) is not yet done** — the env-var change
is verified by test, not yet by an actual double `docker compose up --build`.

### P2.3 — done 2026-09-21

Threads `patient_user_id` **and** `session_id` from the engine's capture-start
call through to finalisation. Three files.

- **`emg-service/backend/app.py`** — `session_id` added as an exact mirror of
  P2.2's `patient_user_id` mechanism: `capture_session_id` global reset in
  `_start_recording_locked`, read back in `_stop_recording_locked`, passed to
  `add_to_history`, written only when non-None. No second mechanism. A bodyless
  POST still returns 200 and writes neither key, so `live.html` is unaffected (F1).
- **`backend/app/services/emg_client.py`** — was GET-only; gained
  `start_capture(base_url, patient_user_id, session_id)` and `stop_capture(base_url)`.
  Both reuse the existing breaker (`_circuit_open` returns before any
  `httpx.AsyncClient` is constructed), 2.0s timeout, never raise, no retries.
- **`backend/app/routes/session.py`** — `start_capture` dispatched by
  `asyncio.create_task` right after `insert_one` in `POST /session/start`, patient
  id from the JWT only (D12). `stop_capture` likewise in `end_session()`.

**Why `stop_capture` lives in `end_session()` and not the `/session/end` route.**
The route is only one of three ways a session ends — the WS `{"type":"end"}` frame
and the H6 abrupt-disconnect handler both call `end_session()` directly, and H6 is
the normal path on mobile. Hooked at the route, most real sessions would never
finalise their recording and the ids would never reach `history.json`.

### O4 gap found and closed during P2.3

O4 requires a recording to carry `patient_user_id` **and** `session_id`. P2.2
delivered only the former — `session_id` had been scoped out of it as "P2.3's job"
without anything guaranteeing P2.3 would carry it. Folded into P2.3's test set
before implementation. O4 is now fully covered.

### Breaker defect found by review, fixed 2026-09-21 (no test, owner's call)

**Not a P2.3 regression — a latent defect in the error policy, surfaced by adding
the first POST callers.**

`/api/stop_recording` returns `400 {'error': 'No recording in progress'}` when
nothing is recording (`app.py:459`); `/api/start_capture` returns `400
{'error': 'Recording already active'}`. `resp.raise_for_status()` turned both into
`httpx.HTTPStatusError`, which the except clause counted as `_record_failure`. **A
healthy service correctly answering "that was a no-op" was being recorded as a
service failure.**

Failure path, which would have cost a demo recording silently:

1. Operator ends a session, then stops the recording by hand in `live.html` —
   plausible under D29, and per F1 `live.html` is the only capture UI.
2. `end_session()` fires `stop_capture` → nothing recording → 400 → failure 1.
3. Two more such sessions → `FAILURE_THRESHOLD = 3` → breaker opens for
   `COOLDOWN_SECONDS = 30`.
4. Next patient starts an exercise → `start_capture` skipped with no network call
   → **no recording, no error anywhere**, because the call is fire-and-forget and
   the breaker's job is to fail quietly.

Fix, in both capture functions:

```python
if resp.status_code == 400:
    _record_success(base_url)
    return None
resp.raise_for_status()
```

`_record_success` also resets an accumulated count, which is right: a 400 proves
the service answered. Applied to `start_capture` as well as `stop_capture` — same
class of no-op, and fixing only the reported one would have left the sibling
caller broken.

Verified ad hoc (not committed): 5 consecutive 400s leave
`{'failures': 0, 'opened_at': None}`, breaker closed; 3 `ConnectError`s still give
`failures: 3` and an open breaker.

**Untested by decision.** Nothing pins this behaviour, so an edit to the except
clause can silently reintroduce it. Two assertions in `test_emg_capture.py` would
close that whenever wanted.

### P2.3 verification (re-run independently, not taken from the subagent report)

```
test_phase16_data_plumbing     11/11 checks passed
test_phase12                   61/61 checks passed
test_phase14                   42/42 checks passed
test_phase15                   23/23 checks passed
test_app                       22/22 checks passed
test_emg_capture               ALL EMG CAPTURE-START SELF-CHECKS PASSED
test_emg_client                ALL BREAKER SELF-CHECKS PASSED
test_session                   ALL H4/H5/G2-B/G2-D SESSION ROUTE CHECKS PASSED
test_session_ws                ALL H2/H3/H6/G2-B4 WEBSOCKET CHECKS PASSED
```

Route suites run from `backend/` as `JWT_SECRET=x ../venv/bin/python app/routes/test_session.py`.

### Known ceilings after P2.3

- **One global capture slot.** The EMG service tracks a single recording, so two
  concurrent patients would overwrite each other's ids and one `stop` would
  finalise the wrong recording. Fine for a single-band demo; relevant to doc 12
  §6's multi-user context.
- **No surfacing of EMG failure to the client.** The breaker plus fire-and-forget
  is the entire error policy: a session can complete normally with no recording
  behind it and nothing says so. Acceptable for R4; revisit if a missing recording
  becomes a visible demo failure.


### P2.4 — rebuild twice, O1 verified 2026-09-21

**O1 PASSES.** Two full `docker compose up -d --build` cycles with a
`docker compose down` between them.

Inside the container, both times:

```
DATA_DIR = /srv/data
HISTORY_FILE = /srv/data/history.json
files = 28
history entries = 10
```

Host-side md5 manifest of `emg-service/data/` taken before the first build and
again after the second:

```
IDENTICAL: all 28 files byte-for-byte unchanged after two rebuilds
```

All six services up: `backend`, `emg-service`, `frontend`, `hemo-backend`,
`hemo-frontend`, `nginx`. The EMG service logs
`UDP listener on 0.0.0.0:8888` — the precondition for O2 in Phase 5.

Without P2.1 this would have failed: `DATA_DIR` would have resolved to `/srv`,
inside the image, and every recording would have died with the old container.

### Blocker hit during P2.4 — `run.py` does not exist (Phase 1 gap)

**The first build failed outright:**

```
target emg-service: failed to solve: failed to compute cache key:
failed to calculate checksum of ref ...: "/run.py": not found
```

`emg-service/Dockerfile` had `COPY run.py .`. That file does not exist in
`emg-service/` (P1.1 deleted it) **and does not exist in `Major_iot` either**, so
P1.2's "copy `run.py`" was never possible to satisfy. This is precisely the class
of defect P1.4 was written to catch; P1.4 was waived (V2).

**Resolved by deleting the requirement, not by restoring the file.** The HEAD
version of `run.py` was stale twice over:

- It imports `start_capture_at_boot` — a **serial-era** function. v3's UDP-based
  `app.py` has `start_ingest_thread_at_boot` instead, so the shim would have
  crashed on import even if it had been copied.
- Its stated reason for existing ("`app.py`'s own `__main__` binds 127.0.0.1,
  unreachable from another container") is obsolete: v3's `__main__` already binds
  `0.0.0.0`, seeds `history.json` if absent, and starts UDP ingest itself.

New `emg-service/Dockerfile` tail:

```dockerfile
WORKDIR /srv/backend
CMD ["python", "app.py"]
```

`BASE_DIR` becomes `/srv/backend`, so the legacy `DATA_DIR` default would be
`/srv` — but compose sets `EMG_DATA_DIR=/srv/data`, which P2.1 now honours, and
the verification above confirms it resolves correctly.

### Open item for Phase 5

`data/` holds 28 files: 11 `.csv.gz`, 15 legacy `.bin`, plus annotations.
`history.json` lists **10** entries, while P1.3 speaks of 11 `.csv.gz`. Not a
Phase 2 problem, but P5.3 checks that `history.html` / `playback.html` /
`progress.html` render the demo data — worth reconciling before then.


---

## P4 — exercise gating (scope cut by owner)

**P4.1 deferred. P4.2 dropped. P4.3 done, extended.**

- **P4.1** (server-side ACTIVE-assignment check at `/session/start`) — **not built.**
  Written up in full as `docs/security.md` **S18**, with the exploit, the fix and
  the four properties that make it enforcement rather than theatre. Deferred past
  the demo because the failure mode is "udit cannot start his exercise", which is
  the demo's opening beat; §6.2 already lists Phase 4 as the first cut line.
- **P4.2** (restrict the demo exercise set) — **dropped on owner's instruction.**
  Nothing is to be locked such that it cannot be assigned. The owner knows which
  exercises lack real-time logic and will avoid assigning them.
- **P4.3** (D20 `primary_branch`) — **done, and extended to `seated_knee_extension`
  as well as `mini_squat`** at the owner's request.

```
heel_slide                 pose
mini_squat                 both      <- changed
seated_knee_extension      both      <- changed
straight_leg_raise         pose
terminal_knee_extension    pose
squat                      pose
```

Config loads (6 exercises), `test_capabilities` 4 passed, session + WS suites
unchanged.

**Inert today.** `primary_branch` is validated at `exercise_config.py:52` but
**nothing in live code acts on it** — the only other references are in
`_old_physio_reference/`. D20's enforcement (band required, no pose-only
fallback) does not exist. So this is a label change with no behavioural effect,
and it is the intended end state rather than something to revert.

**Loaded for later:** whoever implements D20's enforcement makes both exercises
band-required. A `both` exercise has no pose-only fallback by design, so a band
failure then kills the session.

**Open item:** D19 records placements for heel slide (ankle) and mini squat
(thigh) only. `seated_knee_extension` now carries `both` with **no recorded
placement**. Needs a D19 entry before enforcement is built.

### S18 partial mitigation — `history.replaceState`

`frontend/app/src/pages/ExerciseSelect.jsx` clears the query string immediately
after `parseDeepLink` captures it, inside the `useState` initialiser, wrapped in
try/catch so a failure can never block a session start. Build passes.

The exercise id no longer appears in the address bar, the back-history or a
copied URL. **Cosmetic only** — devtools, a saved link and a direct POST to
`/session/start` all still work. The code comment says so explicitly, so a clean
address bar is never mistaken for a closed hole.

Side effect: `?api=` (read at module scope, `ExerciseSelect.jsx:34`) still works
on first load but no longer survives a page reload.

---

## P5 — band bring-up

### P5.2 — operator access (done, narrowed)

`docker-compose.yml` publishes the Flask port as **`127.0.0.1:5000:5000`**, not
`5000:5000`. The plan said "publish the Flask port"; binding to loopback was a
deliberate narrowing, because the service has no authentication (S2) and no
patient scoping (S12) — publishing on all interfaces would have exposed every
recording to the venue network.

**Revert after the demo:** delete that line from `docker-compose.yml`.

### P5.3 — pages render (done)

```
history.html   200   list_recordings: 9 recordings
playback.html  200   /api/recording/<file>: 200, real gzip bytes
progress.html  200   progress: 9 records, reps 3-45, 5.7-359s
live.html      200
index.html     200   (meta-refresh to live.html)
```

The `history.json` anomaly resolves itself — the service already reports
`"skipped": [{"filename": "emg_20260725_131230.emgz", "reason": "missing"}]`
rather than crashing.

### P5.1 — O2 MET (real hardware)

Blocked for a while on firmware, not on the server. Two separate address
mismatches, each found only by checking rather than assuming:

1. `WIFI_SSID = "test"` vs the live network; `HOST_IP = "10.217.119.141"` vs the
   machine's `192.168.31.147`.
2. After switching to the usual mobile hotspot, the hotspot handed out a
   **different subnet than when the firmware was flashed** — machine became
   `10.64.159.141`, firmware still targeted `10.217.119.141`.

The server side was proven independently at each step by streaming synthetic UDP
to the current LAN IP and watching `udp_active` flip true. That is what
established the fault was the firmware, not the stack.

**A correction worth keeping:** an early reading appeared to show the LAN path
failing while loopback worked. That was wrong. `udp_active` is defined as "a
packet within the last 2 seconds" (`app.py:473`), and a `sleep 2` in the test
landed at 2.019s. Both paths always worked; a test artifact was briefly mistaken
for a finding.

After reflashing `HOST_IP`:

```json
"udp_active": true,
"last_packet_seconds_ago": 0.008,
"calibration": {"ax": 2307, "ay": -4435, "az": -1128, "mpu_ok": true, "shaky": true},
"calibration_seq": 2
```

### Full-pipeline hardware check

A real 6-second capture through `/api/start_capture` with both ids:

```
num_samples      3020          (6.0s @ 500Hz -- zero loss)
patient_user_id  6aa238e50e48d0e64addbb33
session_id       s_p51_hardware_check
ATTRIBUTION: PASS
```

**This settles the `queue_drops` question.** Drops climb at ~500/s (exactly
`SAMPLE_RATE`) whenever no `live.html` is open, because `data_queue`'s only
consumer is the SSE stream. 3020 samples were still written. Recording genuinely
writes from the parsed lines and never touches the queue, as D4 claimed. Drops
are noise, not data loss.

Also confirms P2.2/P2.3 work against real hardware, not only stubs.

**Data caveats:** the EMG signal was noise-floor (-8..+8, envelope 0-2) —
electrodes not on skin, so the 6 detected "contractions" are noise crossing a
threshold. IMU showed 302 distinct readings across 3020 samples (MPU sampled
~50Hz, decimated against 500Hz EMG — normal, not stale). Calibration carries
`"shaky": true` and is baked into that recording's preamble.

### The standing hardware risk

`HOST_IP` is compiled into the firmware and has now broken **twice** for two
different reasons. When it is wrong the band goes silent with **no server-side
error at all** — the only symptom is missing EMG evidence. Check `udp_active`
immediately before demoing. A DHCP reservation for the laptop's MAC on the
hotspot is the durable fix.

### Sketch restored

`emg-service/sketch_jun22a/` now holds `sketch_jun22a.ino`, `led_state.h` and
`test/`, copied from `Major_iot`. The `.bak_*` files were deliberately excluded
per D23.

It is **firmware** — nothing at runtime reads it. It is needed because `HOST_IP`,
`WIFI_SSID` and `WIFI_PASS` are compile-time constants, so any network change
requires re-flashing from this source. Note it contains a plaintext WiFi password
(S10) and is currently untracked.

---

## Patient/doctor EMG visibility (owner-directed, outside the plan)

**Requirement:** udit's profile must show his EMG recordings with a working
dashboard, and the doctor must see the same.

**Starting position:** not possible. The engine had **zero** EMG routes;
`/patients/{ref}/sessions` returns `physiosessions` only. The recordings were
reachable solely through the internal Flask service (D27) and the loopback
stopgap.

**The properly-scoped design** (engine list route + playback proxy with a
filename ownership check + two UI blocks) was costed at **~5 hours** and is
written up above in outline. The filename check is not optional in that design:
scoped list plus unscoped fetch is bypassed by guessing `emg_<timestamp>.csv.gz`.

**Owner's decision:** not worth 5 hours for a demo whose entire dataset belongs
to one real person. D27 loosened deliberately, to be reverted.

### What was built instead (~25 minutes)

1. **`history.json` back-stamped** — all 9 `.csv.gz` entries carry
   `patient_user_id: 6aa238e50e48d0e64addbb33`. `.bin`/`.emgz` untouched, entry
   count unchanged at 11, the hardware-check entry's `session_id` preserved.
   Backup at `/home/billa-dakait/history_json_backup_before_backstamp.json`.
2. **nginx `/emg/` location** — `proxy_pass http://emg-service:5000/` with the
   trailing slash stripping the prefix. **Unscoped and unauthenticated by
   decision.**
3. **`limit_except GET { deny all; }`** on that location — reads 200, writes 403.
   Closes `start_capture` / `stop_recording` / `recalibrate`, which are
   unauthenticated and would otherwise let anyone on the venue network stop a
   recording mid-demo. The engine is unaffected: it reaches Flask directly over
   the compose network, never through nginx. Manual capture control remains
   available on the loopback port.
4. **Two UI blocks** — `ExercisePlan.jsx` (patient) and `PatientResearch.jsx`
   (doctor), each embedding `/emg/progress.html` and `/emg/history.html` in
   iframes. Flask sets no `X-Frame-Options` and no CSP, so framing works.
   Zero chart code written; the Flask pages already draw them.

Verified: both iframe references present in the served bundle
(`/assets/index-DSZhaCu6.js`), `hemo-frontend` rebuilt, all paths 200.

**Not visually verified in a browser.** Code ships and headers permit framing;
nobody has looked at the rendered layout.

**Shows all 10 recordings, not 9** — the legacy `.bin` has no `patient_user_id`
and appears too. Correct behaviour for an unscoped surface; simply must not be
described as patient-filtered.

**Revert list after the demo:** the `/emg/` location block (including
`limit_except`), the `127.0.0.1:5000:5000` port line, and both UI blocks — each
carries a `D29 TEMPORARY` comment naming itself.


---

## R1 — pre-session calibration gate (D16 order, no mid-session purge)

**Added 2026-09-21, owner-directed. Option B of three costed options.** Budget
~50 min.

### What this is, and what it is not

D16 states the session-start order: **band claim → calibrate (limb still) →
synchronized start**. This implements the *calibrate-before-start* half only.

**Not implemented, deliberately:** D16's mid-session purge (recalibration ends
the recording and discards prior samples), D16's server-side stillness
verification from IMU samples, D13's button on `live_session.html`, D17's
disclaimer page, D18's all-ready gate.

**Why D13's button is excluded.** P2.3 fires `start_capture` at
`/session/start`, so by the time `live_session.html` renders, a recording is
active — and Flask returns **409** on recalibrate while recording
(`app.py`: "Recording in progress -- calibration would punch a hole in it"). A
Calibrate button there would 409 every time. D13 is not buildable until D16's
purge exists. A visible control that always errors is worse than no control.

This gate sidesteps that entirely: it runs **before** `/session/start`, when no
recording is active, so recalibration is permitted and no purge question arises.

### Atomic tasks

| Id | Task | Agent | Model | Effort |
|---|---|---|---|---|
| R1.T | **Tests first.** Three invariants, one file | `backend-core-agent` | sonnet | low |
| R1.1 | `emg_client.recalibrate()` — POST `/api/recalibrate`, reuse existing breaker, never raise | `emg-integration-agent` | sonnet | low |
| R1.2 | Engine route `POST /session/calibrate` + `GET /session/calibration` — auth required, no session needed | `emg-integration-agent` | sonnet | low |
| R1.3 | `ExerciseSelect.jsx` — new `calibrate` deep-link state before `startFromDeepLink` | `frontend-agent` | sonnet | low |

Sequential: R1.T → R1.1 + R1.2 → R1.3. R1.3 needs the routes live to fetch.

### The three tests (§2.3: data flow, integrity, security only)

| Test | Guards | Class |
|---|---|---|
| `POST /session/calibrate` without a valid JWT is refused | An unauthenticated caller cannot command the band | security |
| `emg_client.recalibrate` honours the open breaker: no call, no raise | A dead EMG service cannot block or crash session start | data flow |
| The gate predicate rejects `shaky: true` and `mpu_ok: false`, accepts only both-clean | A recording under a bad calibration does not count (D16) | data integrity |

Nothing else. Not tested: button styling, copy, poll interval, spinner states,
409 message wording.

### Flow

1. Deep link resolves, capabilities load, state would be `ready`.
2. **New:** state becomes `calibrate`. Page shows "Hold the band still".
3. `POST /engine/session/calibrate` (JWT). Engine → `emg_client.recalibrate()` →
   Flask `/api/recalibrate`.
4. Poll `GET /engine/session/calibration` until `calibrating` is false.
5. `mpu_ok && !shaky` → proceed to `startFromDeepLink`. Otherwise show "hold
   still and try again" with a retry button.

### Failure rules (binding on the implementation)

- **A dead or unreachable EMG service must NOT block session start.** If the
  breaker is open or the call fails, log it and proceed to the session exactly as
  today. A pose-only exercise does not need the band at all, and no exercise
  currently enforces D20.
- **No 409 path.** This runs pre-session, before any capture starts. If a 409 is
  ever observed here, something else holds a recording — surface it, do not
  retry in a loop.
- **The gate may be skipped by the patient after two failed attempts.** A band
  that will not settle must not trap someone on a screen the night of a demo.

### Revert

One `calibrate` state in `ExerciseSelect.jsx`, two engine routes, one
`emg_client` function. Nothing touches `app.py`, the scratch file, or
`_stop_recording_locked` — the file-integrity path P2 hardened is untouched.


### R1.T / R1.1 / R1.2 — done 2026-09-21

Three checks, all passing, re-run independently:

```
security: POST /session/calibrate with no token -> 401/403: OK
data flow: recalibrate with open breaker -> no call, no raise: OK
data integrity: calibration_ok gate predicate: OK
```

Regressions unchanged: `test_session`, `test_session_ws`, `test_emg_client`,
`test_emg_capture`, `test_doctor_lookup` all pass.

**Route collision avoided, and it was real.** `GET /session/{session_id}`
(session.py) matches the literal path `/session/calibration` with
`session_id="calibration"`. That is why the red-phase test reported **405**
rather than 404. The status route is therefore `GET /calibration`, not
`/session/calibration`. Verified: `/calibration` -> 200,
`/session/calibration` -> 404 `unknown session: 'calibration'`,
`GET /session/<real-looking-id>` unchanged.

**409 is a healthy answer, not a failure.** Flask returns 409 for "no device seen
yet" and "recording in progress". `recalibrate` treats 400 and 409 the same way
`start_capture`/`stop_capture` treat 400 — `_record_success`, return `None`.
Without this, three mistimed recalibrations would open the breaker and the next
session would silently record nothing. This is the same defect class fixed
earlier for 400, one endpoint over.

**R1.3 (the `ExerciseSelect.jsx` calibrate state) is NOT built.** The engine side
is complete and callable; no UI reaches it yet.

---

## F2 — running the engine test suite writes real EMG recordings

**Found 2026-09-21 while verifying R1. Not caused by R1 — R1 exposed it.**

`backend/app/routes/test_session.py` POSTs `/session/start` against the real app.
Since P2.3 that fires `emg_client.start_capture`. `EMG_SERVICE_URL` defaults to
`http://localhost:5000`, which became reachable from the host when P5.2 published
the loopback port. So the test suite drives the **real** Flask service.

Observed after one agent's verification run:

```
history.json: 10 -> 18 entries
8 new .csv.gz, 0 samples each, patient_user_id "p1" (a test fixture id)
recording_active: true   <- left running afterwards
```

Three consequences:

1. **`history.json` is polluted** with fixture-attributed recordings, which then
   appear in the patient and doctor dashboard iframes.
2. **A left-running recording blocks recalibration** — Flask answers 409, which
   is exactly the failure that would bite immediately before a demo.
3. It produced a **misleading verification result**: the agent's own
   `POST /session/calibrate` check returned `{"status": "unavailable"}` and was
   read as correct degradation. It was not; it was this recording blocking it.

Cleaned up: 8 entries and their files deleted, recording stopped, back to 9
`.csv.gz` / 10 entries. Backups at
`/home/billa-dakait/history_json_before_testjunk_cleanup.json`.

**Hazard, not yet fixed.** Anyone running the engine suite while the loopback port
is published repeats this. The fix is to point `EMG_SERVICE_URL` at a dead port
for test runs so `start_capture` fails fast against nothing — deliberately not
done the night before the demo. Revisit with item B.3 of the ledger: when the
loopback port is reverted, this hazard disappears on its own.

**Pre-demo check:** confirm `recording_active` is false and `udp_active` is true
before starting.


---

## F3 — session end silently failed to stop the recording (fixed)

**Found and fixed 2026-09-22, live, mid-rehearsal.**

**Symptom:** patient records a session, presses End Session; nothing appears in
the dashboard or recordings. On disk, a growing `emg_<ts>.partial.csv` with no
header/metrics preamble. Flask `/api/status` showed `recording_active: true`
long after the session ended.

**Root cause:** `end_session()` fired `emg_client.stop_capture` as a bare
`asyncio.create_task(...)` and returned. The event loop holds only a WEAK
reference to such a task, so Python can garbage-collect it before it runs. When
that happened the stop never reached Flask, the scratch file grew forever, and it
was never finalised into a `.csv.gz`. Intermittent by nature — some sessions
worked, which is what made it look like a UI problem.

`backend/app/ws/session_ws.py` already documents this exact hazard and guards its
own finaliser with a `_pending_finalizers` set. `session.py` never got the same
treatment, and **all three** of its fire-and-forget tasks were exposed:
`generate_report`, `start_capture`, `stop_capture`. A dropped `generate_report`
means no report; a dropped `start_capture` means no recording at all.

**Fix:** a `_spawn(coro)` helper holds a strong reference in a module-level
`_bg_tasks` set until the task completes, discarding it via `add_done_callback`.
All three sites now use it.

**Verified end to end, real band:**

```
pre  recording=False
start -> s_c4c791d...
mid  recording=True
end
post recording=False
newest history: emg_20260921_200920.csv.gz | 1840 samples | sess=s_c4c791d... (match)
```

**Side effect on the demo data:** while the bug was live, one recording
(`emg_20260921_195421.csv.gz`, 294640 samples) ran across several sessions —
every later `start_capture` hit Flask's 400 "already recording" no-op, so no data
was lost but it all merged into one ~10-minute file attributed to the FIRST
session (`s_399ed...`). Recovered by a manual stop. Its report describes a jumble,
not one clean exercise; a fresh session is clean.

## F4 — the `/emg/` nginx path could not feed the iframes

**Found and fixed 2026-09-22.**

The patient/doctor EMG panels first framed `/emg/progress.html` and
`/emg/history.html`. Both pages fetch **root-absolute** paths — `fetch('/api/progress')`,
`fetch('/api/list_recordings')`. Inside an iframe served at `/emg/...`, those
resolve to `http://127.0.0.1/api/...`, which nginx routes to **part2's backend**,
not Flask. Result: `Couldn't load progress data: HTTP 404` and
`Error loading recordings: Failed to fetch`.

`/emg/` only rewrote the page URL, never the requests the page then made.

**Fix:** the iframes now load from `http://127.0.0.1:5000/progress.html` and
`/history.html`, so the page's own origin is Flask and its `/api/...` calls land
correctly. Verified all four paths 200 on the loopback port.

**Consequences:**
- The demo must run on `127.0.0.1` (already true — `getUserMedia` requires it).
- The nginx `/emg/` location is now **dead weight** — nothing references it, and
  its `limit_except GET` guard protects nothing, because the iframes hit `:5000`
  directly where writes are allowed (loopback only). Left in place until the
  post-demo revert rather than churn nginx again. See security.md S21 update.


---

## F5 — the EMG website is baked into the image, not mounted (dev gotcha)

**Found 2026-09-22 after several progress.html edits appeared to do nothing.**

`emg-service/Dockerfile` does `COPY website/ ./website/`, and the only bind mount
on the service is `./emg-service/data:/srv/data`. So the **website is frozen at
image-build time** — editing `emg-service/website/*.html` (or `backend/app.py`)
on the host changes nothing in the running container until
`docker compose up -d --build emg-service`.

This wasted a full round of dashboard edits: every "page serves 200" and grep
check was run against the stale baked copy, not the edits. **Any change under
`emg-service/` now requires a rebuild of that service to take effect.**

Optional post-demo fix: bind-mount `./emg-service/website:/srv/website:ro` so
front-end tweaks are live without a rebuild. Not done tonight (another mount to
verify hours before the demo).

## F6 — progress dashboard cleanup (owner-directed)

Applied to `emg-service/website/progress.html`, deployed via an emg-service
rebuild (F5).

- **Range of Motion (Bucketed)** chart + its calc: removed. The plain
  Range-of-Motion line chart stays.
- **Fatigue Index**: chart removed AND the stat tile (the value card) removed
  from `STAT_DEFS`. Still **calculated** backend-side and still shown in the ALL
  RECORDS table — "don't show it in the progress graphs", not "stop computing it".
- **Clutter fix (the fiddly one).** Sessions cluster in real time (5 in an
  afternoon), so a `type: 'time'` x-axis pinned to the range crushed points
  together. Two wrong turns before the right one:
  1. A linear index axis spaced points evenly but the date ticks did not show.
  2. A category axis showed dates but (a) `{y}`-only data gives Chart.js no
     x-position so the three line charts rendered **blank**, and (b) same-day
     labels collapse, re-merging the points.
  Final: a **linear index axis** (`{x: i, y}` — one slot per session, renders
  because x is numeric) with `afterBuildTicks` forcing one tick per session and a
  `callback` printing the date. Even spacing, dates present, no collapse.
- **Layout:** stat tiles `lg:grid-cols-4` (2 rows × 4), chart grids
  `lg:grid-cols-3` (3 × 2).

Per-point "shaky" colouring preserved (`{x, y, shaky}`). `history.html` was not
touched. `indexAxis`/`shortDate` live; `timeAxis` and `categoryAxis`-on-lines are
gone from the line charts (`categoryAxis` still used by the three bar charts).

All demo-surface polish — no backend logic, no security posture change.


---

## Deviations from `13_demo_execution_plan.md`

Recorded per the owner's instruction. The plan document itself is unedited; where
a deviation conflicts with a decision in doc 12, the decision still wins.

| # | Plan says | What happened | Why |
|---|---|---|---|
| V1 | P1.5 deletes `website/live.html` | `live.html` retained | Owner amendment A1; evidence in F1 — it is the only capture-control UI and the site entry point |
| V2 | Phase 1 tasks P1.1–P1.6 run as subagents, P1.4 is a hard-stop verification | Phase 1 performed by the owner directly; P1.4 verification waived | Owner's call, stated explicitly |
| V3 | Phase 4 sized 30–60 min, gate set by P0.3 | Fixed at the upper bound, ~60 min, and two sub-questions added (D28 message flattening, absent `recommendation_id`) | P0.3 found the hole live, not theoretical |
| V4 | P2.1–P2.3 assigned to `emg-integration-agent` ("FastAPI skeleton / `emg_client.py`" scope) | P2.1/P2.2 were Flask-side `emg-service/backend/app.py` work; the agent flagged the mismatch itself | Plan's agent-to-task mapping is wrong for these two tasks, not the tasks. Work is correct. P2.3 is the task that genuinely matches this agent's scope |
| V5 | §5 says "four tests exist at the end of this plan" | Both Phase 2 tests live in ONE file (`test_phase16_data_plumbing.py`, 7 checks) rather than two files | Matches the repo's existing one-file-per-phase pattern; check count, not file count, is what §5 is really counting |
| V6 | Not addressed by the plan | Python environment: a subagent installed flask's deps into `~/.local` via `--break-system-packages`. Reverted on owner's instruction; flask now lives in the project venv only | See "Environment notes" below |
| V7 | P2.3 is "thread `patient_user_id` ... through to finalisation" | `session_id` threaded as well | O4 requires both ids; P2.2 had scoped `session_id` out as "P2.3's job" with nothing guaranteeing it |
| V8 | §2.2: tests before development, always | The `emg_client` breaker fix (400 no-ops opening the circuit) was made with NO test, on the owner's explicit instruction | Owner's call. Recorded here because it is a §2.2 exception, and because the behaviour is now unpinned |
| V17 | §2.2 tests-first | The `_spawn` GC fix (F3) shipped without a new test | Live incident mid-rehearsal; fixed and verified end-to-end by hand. A test would need an async harness that forces GC — deferred, noted as unpinned |
| V18 | Ledger C item | DOC002 (demo doctor) password forgotten; not reset | Owner chose to move on rather than build forgot-password (est. 2.5-3h) or run a reset script tonight |
| V11 | P4.2 restricts the demo exercise set | Dropped entirely | Owner: nothing may be locked such that it cannot be assigned; they will avoid assigning exercises that lack real-time logic |
| V12 | D20 testing-phase config: "only `mini_squat` becomes `both`" | `seated_knee_extension` also set to `both` | Owner's request. SKE clears D20's rule-logic bar (`frontend/src/lib/checks/seated_knee_extension.js` exists) but has NO D19 placement — flagged, not resolved |
| V13 | P5.2 "publish the Flask port" | Published as `127.0.0.1:5000:5000`, loopback only | Service has no auth (S2) and no scoping (S12); all-interfaces would expose every recording to the venue network |
| V14 | P1.2 copies `run.py`; D23 excludes only `sketch_jun22a bak` | `run.py` requirement deleted from the Dockerfile; the `.ino` sketch copied back IN | `run.py` existed nowhere and was stale twice over (see P2.4). The sketch is needed because `HOST_IP`/`WIFI_SSID` are compile-time constants |
| V15 | D27: Flask "permanently unreachable from a browser", D29: "must never become an nginx location" | nginx `/emg/` location added, read-only via `limit_except GET` | Owner's explicit decision, to show EMG in the patient/doctor profile. All demo data belongs to one real person. Reverted after the demo |
| V16 | §2.2 tests before development, always | No tests for the nginx location, the back-stamp, or the UI blocks | Config line, one-shot data edit, and iframes. The enabled behaviour is deliberately unscoped, so a test would encode the thing being reverted |
| V10 | Dockerfile is devops-owned (plan §10); P2.4 is a haiku "rebuild twice" verification task | `emg-service/Dockerfile` edited during P2.4: `COPY run.py .` removed, `CMD` changed to run `backend/app.py` directly | The first build could not run at all otherwise. Revisit if a rewritten v3 entrypoint shim is preferred over running `app.py` directly |
| V9 | §2.1: every dev subagent prompt begins by invoking `ponytail` | Not invoked by any subagent this phase | The agent types used (`backend-core-agent`, `emg-integration-agent`) are defined with `Bash, Read, Write, Edit, Glob` only — no `Skill` tool, so §2.1 is unenforceable as written. Agents applied the principles from ambient mode context instead. Fix the agent definitions if §2.1 is to hold literally |

### Environment notes

- Run the EMG tests as `../venv/bin/python backend/<test>.py` from `emg-service/`.
- The project venv at `final_project/venv` has `include-system-site-packages = false`, so it is self-sufficient; `flask 3.1.3`, `werkzeug`, `itsdangerous`, `blinker` were installed into it.
- `~/.local` was cleaned of `flask`, `jinja2`, `itsdangerous`, `blinker`, `werkzeug`. The dpkg-managed `click 8.1.6` and `markupsafe` were never overwritten and remain intact.
- `python3 -m pip` requires `--break-system-packages` even to **uninstall** here (PEP 668 guards the whole operation). Prefer the venv.
- `test_phase12` reports 61/61 under the venv vs 59/59 under the earlier system python — pandas is present in the venv, so two previously-skipped checks now run. Not a behaviour change.


---

## Side findings (outside the task that produced them)

### `gitKeys.txt` at the repo root — found during P0.3

`/home/billa-dakait/Desktop/final_project/gitKeys.txt` exists at the **repo
root**, not only inside `Major_iot`. The plan's hard stop (P1.4 / the Phase 1
gate) covers `emg-service/` only, so this file is outside its reach.

**Action:** confirm whether it is git-tracked before the demo, and rotate the
token if it is. Not yet checked.

# Project status — Rehab Assessment Engine

**As of 2026-08-21.** Covers everything built against `MASTER_BUILD_PLAN_v3.md`,
every error found, every deviation from the plan, and the code-quality review.

Everything marked VERIFIED was re-run against the real files, not taken on a
subagent's word.

---

## 1. Phase status

| Phase | Scope | State |
|---|---|---|
| **0** | Baseline measurement | **DONE, VERIFIED** — legacy baseline 50.7 ms / 19.7 fps measured 2026-08-27 (docs/00_baseline.md §9). G11 unblocked, and the comparison is unfavourable — see §7 |
| **A** | Repo skeleton | **DONE, VERIFIED** |
| **B** | FastAPI skeleton + logging | **DONE, VERIFIED** |
| **C** | EMG service integration | **DONE, VERIFIED** — gate fully closed |
| **D** | Legacy extraction (docs only) | **DONE, frozen + resolutions** |
| **E** *(mk2 scope)* | Offline ML pipeline | **DONE** except E12 (deliberately deferred) |
| **E** *(v3 scope)* | Model ingestion & validation contract | **DONE, VERIFIED** — E1–E11, §7 gate passes, 2026-08-27 |
| **F** | Exercise config | **DONE, VERIFIED** — F1–F7 |
| **G** | Live path (frontend) | **DONE, VERIFIED** — G6/G7/G8/G10 gate 30/30 on a real camera, 2026-08-23. Headed run still outstanding |
| **H** | Live path (backend) | **DONE, VERIFIED** — H1–H7, §7 gate passes on real artefacts, 2026-08-26 |
| **I** | Post-session analysis | not started |
| **J** | Frontend pages | **PARTIAL** — J1–J8 built, harness 29/29, 2026-08-27. **§7 gate (manual end-to-end) NOT RUN** — see docs/J_frontend_pages.md |
| **K** | Ops / Docker | **DONE, VERIFIED** — K1–K4, §7 gate green 2026-09-03, re-run by the orchestrator, not taken on the agent's word. Scope note: Phase I does not exist, so "full flow" is the live path only (config → session start → WS evidence → session end → job enqueued) plus the EMG hop across compose DNS and the pages being served. No report is generated because nothing generates reports yet. See `docs/K_ops.md` |
| **L** | Cleanup | not started |
| **M** | Sensor fusion (EMG + IMU) | not started. **Unreviewed hardware work staged** at `hardware/esp32_imu/` 2026-09-03 — ESP32-C3 firmware + handshake, copied from a separate project, wired into nothing. See §9 |

Documentation: `docs/01_repo.md`, `02_emg_routes.md`, `03_legacy.md`,
`06_ml_pipeline.md`, `07_backend_core.md`, `08_exercise_config.md`,
`09_live_frontend.md`, `10_shell_vendoring.md`, plus `G-CONTINUE.md` (session
handoff). `00`, `04`, `05` are absent because Phases 0, M and L5 have not run.

---

## 2. What actually works, proven

- **EMG end to end, on real hardware.** Flask opens `/dev/ttyACM0` at 115200,
  FastAPI pulls a live value through the circuit breaker:
  `{"envelop":28,"signal":5,"timestamp":…}`. Breaker verified closed → open →
  cooldown → closed, including against a real Flask process killed with `kill -9`.
- **Six-decimal JS/Python parity.** 25/25 cases, max diff `2.84e-14`, including
  degenerate inputs (coincident points, zero-length segments, `dy=0`, `dx=0`,
  negative coords, the `detect_view` boundary at exactly 0.12).
- **Recording survives pose-worker death.** Worker killed mid-session on purpose;
  output is a genuine decodable VP9 file — 640×480, 31 packets, 69,850 bytes,
  ffmpeg exit 0 with empty stderr.
- **`GET /exercises`** serves 6 exercises with types and thresholds; loader is
  count-agnostic (proven at 2, 5 and 6 records, including a dummy with no model
  and no extractor).
- **58 unit tests + 7 gate harnesses**, `./run_tests.sh` → `ALL PHASE G CHECKS
  PASSED`, exit 0.
- **Fully offline live path.** Zero external URLs in the shell: Tailwind, Inter,
  JetBrains Mono, Material Symbols, and MediaPipe (bundle + wasm + Lite model)
  all vendored.

---

## 3. Errors and defects found

### Serious — affects results or patient safety

**E8: label circularity confirmed.** `mini_squat`'s `path_deviation` and
`straight_leg_raise`'s `knee_flexion_high` / `hip_lifting` are circular. Verified
against real parquet: `train_mini_squat.parquet` is 45 rows × 961 columns and
still carries 12 `path_deviation*` feature columns, while the manifest has exactly
one `path_deviation` positive — the label is a roll-up of a surviving feature.
`train_straight_leg_raise.parquet` carries both the derived threshold flags
(`*_knee_bend_excessive`) and the 28 raw `knee_angle_2d` aggregates they are
computed from.

This explains the perfect 1.000 F1 the plan flagged as unverified. **Those CV
numbers are not evidence the model learned posture.** The fix is re-labelling by
a human who sees neither the auto-flag nor the raw angle — dropping the angle
features instead would defeat an angle-based model.

**Feature-to-row ratio is worse than the plan assumed.** §E12 estimated "~900
features against tens of rows". Actual: **961 features / 45 rows ≈ 21:1**.
Coincidental splits are guaranteed.

**Patient data was one `git add` from being committed permanently.**
`backend/logs/` was untracked but not ignored. §8b.7 permits full landmark
coordinate dumps at DEBUG, and landmarks are biometric data. Git history cannot
honour the §8 retention commitment ("delete only after confirmed report save") the
way a file can. Fixed — `backend/logs/` and `*.log` are now ignored.

**A live-looking Google API key sits in the repo.** `GEMINI_API_KEY` in
`backend/_old_physio_reference/config.py`, plus `gitKeys.txt` at repo root.
Neither is gitignored. **Still unresolved** — needs revoking at
aistudio.google.com and moving to `.env`.

### Real bugs in the legacy system

**Four of seven audio cues were silently dead.** `voice.py`'s `AUDIO_MAP` pointed
at filenames that do not exist (`knees_caving.mp3` vs the actual `caving.mp3`,
and three more). Worse, `voice.py:48` gated TTS on
`any(os.path.exists(...))` — one surviving file made the app print "TTS ready"
while four cues no-opped. Fixed by repointing the map; the JS port reports each
missing asset individually.

**`posture_checks.py` is dead code.** Zero imports anywhere. The live squat
checks actually run from standalone functions inside `squat.py`. The plan's D5/G2
instruction to "port `posture_checks.py`" named the wrong file.

**The legacy smoother is a plain EMA, not One-Euro.** `alpha = 0.25` on
normalised coordinates. §3.3/G3's One-Euro language is new design, not a port —
and the two conflict (see §5).

**HUD progress bar uses a squat-specific constant for every exercise.**
`_draw_hud` reads the global `DEPTH_INSUFFICIENT_ANGLE` (120) instead of
`definition.rep_trigger.depth_target`. Correct for squat by coincidence only.
Recorded to fix on port.

**Side/front smoothing asymmetry.** SIDE-view `angle_3d` runs on **raw
unsmoothed** landmarks while FRONT-view `angle_2d` runs on EMA-smoothed pixel
points. Replicated deliberately — "fixing" it breaks parity with the offline
pipeline.

### Defects introduced during this build, and caught

**The closed event vocabulary was not enforced.** `events.py` defined
`ALL_EVENTS` and `is_valid_event()`, but nothing called it. `_emit()` wrote
whatever string it was given, so `"frame_droped"` produced a plausible line that
silently broke every query against the real event. Fixed at the single chokepoint
all log calls route through; raises on an unknown name.

**That fix then broke `logging_setup.py`'s own self-check** — it asserted on a
made-up event name to prove `remediation` is absent for unlisted failures. Nobody
ran it afterwards. Fixed to use a real event that has no `REMEDIATION` entry, plus
an added case proving unknown names raise.

**F7's own test hardcoded the count it existed to forbid.**
`assert len(real) == 5` — the exact coupling F7 was written to rule out, relocated
from the loader into its test. It failed the moment squat was added. Now asserts
the config loads, not how many records it holds.

**`feedback-text` and `feedback-icon` were missing from the shell.** Both are in
the DOM contract the JS was written against; without them the banner updates would
have silently no-opped.

**Two counters were clipped by the feedback banner.** Root cause was two bugs:
the counter sat at `bottom-8` with no z-index under a `bottom-0 z-30` banner, and
used a fixed 140px font that overflowed `aspect-video`'s `overflow-hidden` on
short viewports. Fixed structurally (`bottom-32 z-40`, `clamp(48px, 9vw, 96px)`).

### My own errors, corrected

- **I claimed the G5 harness reported "1 PASS, 2 FAIL".** I had grepped the
  harness *source* for those words, counting failure *branches* rather than
  results. Nobody had run it. It passes 3/3. `G-CONTINUE.md` §7 carries the
  correction.
- **A regex I wrote deleted ~1,000 bytes** of `live_session.html` by matching
  across the wrong element boundary. Restored from a pristine copy and redone as
  attribute-only replacements.
- **A test I wrote hung the runner forever.** `SessionWsClient.connect()` starts a
  500 ms `setInterval` that only `close()` clears, so unclosed clients keep Node's
  event loop alive. Fixed with `afterEach`; documented for Phase H.

### Environmental / harness

**The G5 latency assertion flaps on host load.** Same code measured 33 ms on a
quiet machine and 105–185 ms with a browser consuming 211% CPU elsewhere. Load
average proved a poor guard (20 cores, so load 14 reads as 0.7/core while the one
core the test needs is contended). The check is now **advisory by default** —
always printed, never fails the suite — with `G5_ENFORCE_LATENCY=1` to treat it as
the §7 gate on a quiet host. A red build meaning "your laptop was busy" trains
people to ignore red builds.

**Recorded webm files report `duration=N/A`.** Normal for chunked
`MediaRecorder` output, but **I2 re-reads these with MediaPipe Heavy**. Confirm the
decoder tolerates a missing duration header, or remux as the pipeline's first step.

---

## 4. Deviations from the build plan

| Plan says | Built as | Why |
|---|---|---|
| §F1 "keep the class structure — do not flatten to JSON" | **Pure data** `exercises.json`, no per-exercise Python | Owner decision. 2 of 3 legacy exercises had `extra_checks = []` — config wearing a Python costume |
| Exercise set = the legacy three | **Six**: five ML-dataset + squat | Owner decision. The legacy three have live rules but no model; the five have models but no live rules. Squat restored later so G2 had something to port |
| §G2 "port D5's threshold checks" | Checks built **from the served config** | Review finding #1 — see §6 |
| §G3 One-Euro filter | **EMA default**, One-Euro behind a flag | D4 proved legacy is EMA; the two conflict, see §5 |
| §5 Phase F task list | **F7 added** — loader must be exercise-count-agnostic | Owner addition. Proved the real guarantee: F does not need rewriting when an exercise is added |
| §A4 `_legacy_reference/` | `_old_physio_reference/` | Pre-existing name; renaming would have broken other work |
| §E5 five extractors from legacy | Five extractors from a **separate dataset** | D8 found `mini_squat`, `tke`, `slr`, `heel_slide` never existed in the legacy project |
| E12 feature pruning | **Deferred** | Pruning before resolving E8 would optimise for keeping the leak |
| — | **CDN deps vendored** (Tailwind, fonts, MediaPipe) | Not in the plan. This is a local clinical app; on a network without internet it rendered unstyled |
| — | **58-test suite added** | Not in the plan. Three tests guard *silent* failures |
| — | **Stitch used for the shell design** | Owner instruction |

### Consequences worth tracking

- **F2 was reverted mid-flight.** An earlier decision derived `type` from the
  trigger; the owner reverted to the plan's stored field. The agreement
  validation survived — a stored `type` disagreeing with its trigger is a startup
  failure.
- **Squat's return brought a code hook back.** Pure data could not express its
  seven bespoke checks, so `exercises.json` gained `extra_checks: [names]`
  resolved against a JS registry. Logic in code, values in data.
- **`pose_landmarker.task` compatibility (J5) is resolved early** — the worker
  loads a vendored Lite model. But squat's thresholds were tuned against the
  *legacy Python* model, so §9's warning stands: they may not transfer.

---

## 5. Open decisions — these need a human

1. **E8 re-labelling.** Until `knee_flexion_high` and `hip_lifting` are relabelled
   blind, their scores mean nothing. Gates any honest retrain.
2. **EMA vs One-Euro.** EMA matches the offline pipeline and keeps the parity gate
   passable; One-Euro is better live smoothing but breaks that agreement. No
   option satisfies both.
3. **F4 thresholds.** Five of six exercises hold `{"value": null}`. Only squat can
   flag anything. Provisional data-derived values sit in `docs/08` but were
   **not** promoted into `exercises.json`.
4. **Phase 0 baseline.** Never run, which blocks G11. It is now awkward: the
   baseline was meant to come from the old *desktop* OpenCV app, so a like-for-like
   browser comparison may simply not be recoverable. Decide whether to measure the
   desktop loop with a caveat, or drop the comparison.
5. **The API key.** Revoke and move to `.env` before this repo is pushed anywhere.
6. **TKE dynamic vs isometric.** Weakest-evidenced call in the config — no
   label-editor script, no ROM language in its docstring.
7. **`knee_varus` needs a formula**, not just a threshold. No signal in the schema
   computes it.

---

## 6. Thermo-nuclear code review — findings and changes

Scope: `backend/` excluding `backend/ml`, ~2,100 lines.

### Applied

**#3 — `logging_setup.py` self-check restored.** My regression; see §3.

**#1 — one source of truth for clinical thresholds.** `rules.js` had hardcoded
`SQUAT_THRESHOLDS` and `ALERTS`, and `rulesForExercise()` read only
`exerciseConfig.name`. So `GET /exercises` served thresholds nothing consumed —
which was F6/R4's entire stated purpose — while the numbers lived in two places
free to drift.

Now: `CHECK_REGISTRY` maps a check name to `{needs, build}`; `rulesForExercise`
iterates `config.extra_checks` and parameterises each from `config.thresholds`.
**The exercise-name branch is gone.** Two behaviours fell out:

- A check with placeholder thresholds is skipped and *reports why*
  (`skipped: [{name, reason}]`, exposed as `PoseEngine.skippedChecks`).
- A config naming an unimplemented check is reported, not ignored.

Tests now read the shipped `exercises.json` rather than fixture copies — a test
asserting against its own private copy of the numbers would defeat the change.
21 → 24 tests.

**#2 — legacy evicted from the live package.** ~1,100 lines of superseded code sat
inside `backend/app/`: `exercise_base.py`, `exercises/*.py`,
`services/exercise_config.py`, plus a **byte-identical 510-line duplicate** of the
legacy `exercise_runner.py` at `backend/`.

It was not even importable — `app/exercises/squat.py` does
`from exercise_base import ...`, which raises `ModuleNotFoundError` under its own
package name, while an `__init__.py` made the directory read as live.

**The drift was already real:** the `app/` copies carried Phase F's `type` and
`primary_branch` additions the originals lacked, while
`app/exercises/seated_leg_extensions.py` still held the
`'Bend to (input range) degrees'` placeholder already fixed in the original. Each
copy newer than the other in a different respect.

Moved to `_old_physio_reference/superseded_app_copies/` (with a README) rather
than deleted; the duplicate `exercise_runner.py` was removed since its original is
preserved. `/health`, `/exercises` and `/api/emg/live` all verified still serving.

### Found, not yet applied

| # | Finding |
|---|---|
| 4 | Circuit breaker's comment claims "exactly one trial call"; concurrent callers all pass the gate after cooldown. A comment stating an invariant the code doesn't hold is worse than no comment |
| 5 | `emg_client.py` — three copy-pasted breaker + try/except blocks. One `_get_json()` helper collapses them, and Phase M's `imu_client.py` is told to copy this pattern |
| 6 | `_next_seq` abused as a sampling counter, polluting `_seq_counters` with synthetic composite keys |
| 7 | `exercise_config.py` is 40% test — 90 of 214 lines, against a codebase that already uses separate `test_*.py` files |
| 8 | `main.py` mixes an APIRouter with inline routes; `routes/` exists |

### Noted as good, so it does not get "cleaned up"

- `_validate_record`'s trigger/type agreement check — a config file is a trust
  boundary, and failing at startup beats a self-contradictory record reaching a
  session.
- `telemetry.py` is correctly boring: a dict, a lock, a context manager. No
  abstraction layer, no Prometheus.
- The `ponytail:` comment on the breaker's missing lock names the ceiling and the
  upgrade path instead of pretending the issue away.

**Verdict: not approved at the time of review** — findings 1–3 were presumptive
blockers. All three are now applied.

---

## 7. Next

1. **Run the live path against a real camera.** G6, G7, G8, G10 are written and
   have never executed in a browser with a webcam.
2. **Phase H** — `ws/session_ws.py`, `session_buffer.py`, session endpoints.
   `ws/client.js` is written and unit-tested against a fake socket but has never
   spoken to a real endpoint.
3. Then I, J, K, L, M per the plan's run order.

Full detail lives in `docs/G-CONTINUE.md` (what to do next) and
`docs/09_live_frontend.md` (what was built and why).

---

## 8. Phase K — Docker (added 2026-09-03)

Tests written by the main session and approved by the owner before any
implementation agent ran, per `.claude/skills/next-phase-skill`:

| Task | Test |
|---|---|
| K1 compose declares backend / emg-service / frontend | `backend/tools/test_k_compose.py::test_k1_compose_declares_backend_emg_and_frontend` |
| K2 emg_client URL from the environment | `…::test_k2_emg_url_is_read_from_the_environment` |
| K2 compose points the backend at the EMG hostname | `…::test_k2_compose_points_the_backend_at_the_emg_hostname` |
| K3 full flow through Docker | `backend/tools/test_k_gate.py::clause_k3_full_flow_through_docker` |
| K4 3 concurrent sessions | `…::clause_k4_three_concurrent_sessions` |
| **§7 gate** | `…::gate_phase_k` |

K1/K2 are file contracts and run in `backend/run_tests.sh`. The gate builds
images and needs a daemon, so it is run explicitly and **fails rather than
skips** when Docker is unreachable — a gate that passes without running is the
silent-success shape §3 records repeatedly.

Verified run, 2026-09-03: `ALL BACKEND CHECKS PASSED`, `ALL PHASE G CHECKS
PASSED`, and

```
K3 OK -- 6 exercises, EMG reachable, session s_de58… recorded 100 frames, pages served
K4 OK -- 3 sessions [80, 90, 100] frames, no cross-talk, /health median 2.8 ms under load vs 4.2 ms idle
PHASE K GATE PASSED
```

**Two things to know before running it again.**

1. **Docker group.** `sudo usermod -aG docker $USER` was run, but a shell
   started before that does not carry the group. Until the next login, wrap
   the gate: `sg docker -c "cd backend && ../venv/bin/python tools/test_k_gate.py"`.
2. **Host port 8080 was already taken on this machine** by an unrelated
   CVAT/traefik stack, so compose publishes the frontend on **8081** and the
   gate's default `K_FRONTEND_URL` is `http://127.0.0.1:8081` to match. Both
   are overridable by env; no override file is needed any more. Verified
   green on 8081, 2026-09-03.

Two changes landed outside the compose/Dockerfile set and are worth knowing:
`backend/requirements.txt` gained `python-multipart==0.0.32` (the admin model
upload route's `UploadFile` needs it — the app crashed on import in a clean
container without it, so this was a real missing pin, not a Docker detail),
and `backend/app/services/emg_client.py`'s `EMG_SERVICE_URL` now reads the
environment with the old localhost value as its default.

---

## 9. ESP32 IMU sensor node — staged, not integrated (2026-09-03)

Copied into `hardware/esp32_imu/` from a separate project
(`~/Desktop/Major_iot`) on the owner's instruction, so that further work
happens in this repo. **It is integrated with nothing**: no route imports it,
no page calls it, no phase depends on it, and `emg-service/` is untouched. The
IoT project has been reverted to its pre-change state; only this copy carries
the work forward.

Phase M stays **not started**. This code has not been reviewed against M1–M9,
and staging it is not a claim that any part of M is done.

`hardware/esp32_imu/README.md` carries the full picture. The short version:

**Verified** — an 11-assertion loopback test (`tests/test_handshake.py`) drives
the real server code over UDP and passes from the new location. It proves the
handshake refuses data before ACK, refuses data from a wrong session, advances
idle → armed → streaming → idle, detects sequence gaps, keeps EMG and IMU on
separate queues, and drops to idle on a missed heartbeat. It needs Flask, which
this repo's venv does not have — run it with the other project's interpreter,
named in the README.

**Built, unverified** — WiFi reconnect with backoff, a watchdog reboot path, a
handshake on a control port kept separate from the data port, per-packet
sequence numbers and ESP `micros()` timestamps, and single shank-IMU
complementary-filter pitch with a stillness-checked calibration persisted to
NVS.

**Half-finished** — a startup countdown (link → calibrate → ready → streaming)
was interrupted mid-implementation. Only its constants and globals exist in
`backend/emg_imu_app.py`; nothing reads them, and the firmware side was never
started. Dead configuration, not a broken build — the file parses and the tests
pass.

**Not verified at all** — the firmware has never been compiled (no
`arduino-cli` on this machine) and no hardware was ever in the loop. Pin
choices, calibration variance thresholds, LED timings and the sagittal gyro
axis are all placeholders marked in the source.

Two facts worth carrying into Phase M whenever it starts:

1. **One IMU cannot measure a knee angle** during squat, mini_squat or
   heel_slide — knee flexion is the angle between thigh and shank, and one
   sensor measures one segment. It is exact for `seated_knee_extension` and
   `straight_leg_raise` (thigh or torso fixed), approximate for
   `terminal_knee_extension`, and elsewhere the joint angle is the camera's
   thigh angle minus the IMU's shank angle. The firmware deliberately emits
   `shank_pitch_deg`, never a `knee_angle`, so nothing downstream can mistake a
   segment for a joint. This is M9's "never silently blend sources" arriving
   early.
2. **`WIFI_POWER_8_5dBm` is a hardware constraint**, not a tunable — the
   ESP32-C3 SuperMini is unstable above it. An agent already "fixed" this once
   by raising it and had to be reverted; the reason is now recorded in the
   firmware comment so it does not happen a third time.

---

## Phase audit — 2026-09-09

Independent verification of the claim "everything through Phase J is built,
except anything concerning AI models." Checked against `MASTER_BUILD_PLAN_v3.md`
§5 (PHASE 0, A–J), using the `graphify-out/` knowledge graph as leads and
confirming every hit against files on disk. Phases K, L, M and M-REC were out of
scope.

**The claim does not hold.** The accurate statement is **0 through H done, I
essentially unbuilt, J partial.**

| Phase | Status | Evidence |
|---|---|---|
| 0 | Done, method substituted | `docs/00_baseline.md:4-5` — 50.7 ms / 19.7 fps, measured from recorded footage rather than the stopwatch protocol; §9.1 explains why, §9.8 notes P0.1-as-written was never run and is no longer blocking |
| A | Done | `backend/`, `frontend/`, `emg-service/`, `docs/01_repo.md` |
| B | Done | `backend/app/main.py`, `backend/app/telemetry.py`, `backend/Dockerfile`, `docs/07_backend_core.md` |
| C | Done | `backend/app/services/emg_client.py`, `docs/02_emg_routes.md` |
| D | Done, frozen | `docs/03_legacy.md` |
| E | Plumbing done; model artifacts are placeholders | `backend/ml/validate_model_package.py:64,303`, `backend/app/routes/admin_models.py:92,142`, `backend/ml/trained_models/model_card.json`. The placeholder models are the expected model exclusion; the validation and ingestion path around them is real |
| F | Done | `backend/app/config/exercises.json`, `docs/08_exercise_config.md` |
| G | Done; headed real-camera run still outstanding | `frontend/src/lib/{angles,rules,smoother,ring_buffer}.js`, `frontend/src/workers/pose_worker.js`, `frontend/src/lib/recorder.js` |
| H | Done | `backend/app/services/session_buffer.py`, `backend/app/ws/session_ws.py`, `backend/app/routes/session.py:79-110` |
| I | **Not built** | No `job_queue.py`, `feature_builder.py`, `model_service.py`, `explainer_service.py` or `report_builder.py` exist anywhere under `backend/` |
| J | **Partial** | `docs/J_frontend_pages.md:1-5` — automated half green at 29/29; §7's gate is a manual end-to-end click-through, and J9 has not been run |

### The gaps that are not about models

Phase I is where the claim breaks, and most of what is missing there is ordinary
backend plumbing with no model dependency at all:

- **I1** — job records and `ProcessPoolExecutor` job queue.
- **I2, I3** — MediaPipe Heavy re-extraction, rep segmentation from live
  boundaries, per-rep `ffmpeg` cutting.
- **I4, I5, I6** — feature extraction, per-rep aggregation, `feature_builder.py`.
- **I10–I13** — `report_builder.py`, chart generation, report save and confirm.
  The report spine is required by E-DEC.6 regardless of model quality.
- **I14** — video deletion gated on a confirmed report save; blocked only by I13.
- **I15** — `GET /report/{id}` and `GET /job/{id}` do not exist. `Report.jsx`
  currently works around this by polling `/session/{id}`
  (`docs/J_frontend_pages.md:141-157`).

Only **I7** (`model_service`) and **I8** (`explainer_service`, SHAP) are
genuinely blocked on having real trained models — two of fifteen Phase I tasks.

Separately, **J9** — the manual end-to-end gate the plan itself requires for
Phase J — has never been run, so J cannot be called done by the plan's own
criterion even though its automated harness passes.

### Built differently from spec, not missing

Flagged so the difference is on the record, not to reopen any of them:

- **F1** — plan said keep the class structure and do not flatten to JSON; built
  as pure `exercises.json` data (owner decision).
- **G3** — plan called for a One-Euro filter; ships EMA by default with One-Euro
  behind a flag, because the legacy system was in fact EMA.
- **J1** — plan said no framework unless the team knows React; built as React +
  shadcn + Vite on owner instruction, which reverses the "no build step" claim
  still standing in `frontend/package.json`.
- **E** — `feature_hash` was corrected mid-implementation from a single string to
  an optional `{exercise: hash}` mapping. A spec fix, not a deviation from intent.
- Exercise set expanded from the legacy 3 to 6.

### Caveat on method

The `graphify-out/` snapshot used for lead generation is dated 2026-08-23 and was
stale by roughly two weeks at audit time. Every phase verdict above rests on a
file read or grep against the working tree, not on the graph alone.

## Plan — richer dynamic exercise prescription (added 2026-10-03, not built)

Goal: a doctor prescribes reps and sets, target joint angles, and frequency
(times per day / per week); the engine checks against them; adherence is tracked.

### What exists today

- `patientexerciserecommendations` (`backend/src/models/PatientExerciseRecommendation.js`)
  already has `sets` (Number), `repetitionsOrDuration` (String, free text),
  `frequency` (String, free text, default "as advised") and `schedule`.
- **`schedule` is declared and accepted by `POST /doctor/patient/:id/add`
  (`routes/exerciseRecommendations.js`) but is null on all 35 existing documents
  and read by nothing. Unused field.**
- `sets` / `repetitionsOrDuration` / `frequency` are display-only on
  `ExercisePlan.jsx`. Nothing in the engine reads them. `repetitionsOrDuration`
  being a string means it cannot be compared to `physiosessions.repCount`.
- Engine thresholds come only from `backend/app/config/exercises.json`
  (`rep_trigger.enter_angle`, `exit_angle`, `depth_target`; isometric
  `hold_min_angle` / `hold_max_angle`), served by `GET /exercises` and compiled
  into checks by `frontend/src/lib/rules.js` + `frontend/src/lib/checks/*.js`.
  The same values for every patient.
- `physiosessions` (`backend/app/models/session_doc.py`) already stores
  `recommendationId`, `patientUserId`, `startedAt`, `repCount`, `cleanReps`,
  `status`, and indexes `(patientUserId, startedAt)`. Adherence needs no new
  session fields.

### Schema changes (add, do not rename; keep the string fields for old rows)

- `targetSets` Number, `targetReps` Number (validated ints, 1..100 / 1..20),
  `targetHoldSeconds` Number|null for isometrics. Legacy strings stay for display.
- `targetAngles`: `{ enterAngle, exitAngle, depthTarget, holdMinAngle, holdMaxAngle }`,
  all Number|null, null = use engine default.
- `frequencyPerDay` Number|null, `frequencyPerWeek` Number|null; replace free-text
  `frequency` as the source of truth. Use the already-present `schedule` only if
  weekday selection is wanted (e.g. "MON,WED,FRI"); otherwise delete it.
- Server-side validation is strict: integer ranges, angles within the
  exercise's clinical min/max, `enter` vs `exit` ordering per `direction`.
  Client checks format only.

### Routes and UI

- Backend: extend `POST .../doctor/patient/:id/add` and add
  `PATCH .../doctor/recommendation/:recId` (currently no edit path, only
  add/remove) in `routes/exerciseRecommendations.js`; return the new fields from the
  patient list route. Reuse `verifyAssignedDoctor`.
- Doctor UI: form fields in the add-exercise dialog on `PatientResearch.jsx`
  (owned by another stream, coordinate before touching).
- Patient UI: `ExercisePlan.jsx` shows "3 x 10, twice daily" and today's progress.

### Angles reaching the engine

1. `ExerciseSelect.jsx` already receives `?rec=<recId>` and passes
   `recommendationId` into the session (`session_doc.py`).
2. Engine session start (`backend/app/routes/session.py`) loads the
   recommendation by id (patient must own it), validates `targetAngles` again
   against `exercises.json` bounds, and returns an override block
   with the session.
3. The browser merges override over the `GET /exercises` record before
   `rules.js` builds its checks; no client-held numbers except what the server sent.
   Snapshot the effective thresholds into `physiosessions.clinical` so a report
   is judged against what was applied.
4. Clinical sign-off: `exercises.json` values are marked "NOT clinician-signed";
   doctor overrides need bounds the clinician approves first.
5. Out of scope here and still open: auto-ending a session at the prescribed rep count.

### Adherence tracking

- Count `physiosessions` where `recommendationId` matches, `status` in
  (`ended`, `reported`), and `cleanReps >= targetReps * targetSets` (or a
  doctor-set completion ratio), grouped by local day / ISO week of `startedAt`.
- Endpoint: `GET /api/exercise-recommendations/adherence?patientUserId=...`
  (staff) and `/me` for the patient. Mongo aggregation, no new collection.
- Timezone: store days in a clinic timezone (IST) or adherence flips at UTC midnight.
- Rows with no `recommendationId` (self-started) are shown but not counted.

### Build order

1. Schema + strict validation + migration script (backfill targets from the
   legacy strings where parseable; leave others null).
2. Doctor form + patient display (reps/sets/frequency only; no engine change).
3. Adherence aggregation + patient/doctor views.
4. Angle overrides: engine session start, `rules.js` merge, threshold snapshot.
   Last, because it is the only clinically risky step and needs sign-off.

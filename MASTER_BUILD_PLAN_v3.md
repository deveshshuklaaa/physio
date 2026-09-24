# Rehab Assessment Engine — Master Build Plan v3

Supersedes: `INTEGRATION_PLAN_mk2.md`, `rehabilitation_ai_project_discussion_record.md`,
`context_export.md`. Where those disagree, this document wins.

Read the whole thing before touching code. Steps are atomic on purpose. Each is
independently testable and independently revertable.

---

## 0. What changed from mk2, and why

| Area | mk2 said | v3 says | Reason |
|---|---|---|---|
| Live pose | Browser MediaPipe Tasks Vision JS | **Keep browser, but frame-budget it** | Browser is right (no video upload, no server GPU). But mk2 never specified a frame budget, which is why it lags. See §3. |
| Live loop | WS sends every detected frame | **Decouple capture from send; drop, never queue** | Unbounded queue = growing latency = the lag you're seeing. See §3.2. |
| Rule checks | Run in FastAPI on every pose message | **Run client-side** | A threshold comparison does not need a network round trip. Server round trip per frame is pure added latency. See §3.3. |
| Pose model | One model, browser | **Lite live / Heavy post-session** | From the discussion record. Correct and kept. |
| Model training | RandomForest multiclass, single model, in-repo | **Multi-label, per exercise, GroupKFold, trained entirely outside this repo** | Multiclass is wrong — errors co-occur. Training belongs to whoever owns the modeling work and changes on its own schedule; the app only ingests the result. See §8c. |
| Model status | Assumed working | **Known weak; treated as swappable artifact via a validated import contract** | Only SLR validates, and only `hip_lifting` (F1 0.46) honestly. Architecture must not assume model quality, and must accept any tree-based replacement without a code change. See §8, §8c. |
| Report trigger | End of session | **End of session, async, idempotent** | Kept, with crash-safety added. |
| Subagents | 9 agents, some overlapping | **11 agents, strict file ownership, no shared writes** | mk2's legacy-inspector fed three agents while still writing — a moving dependency. Fixed in §10. |
| Video deletion | Not covered | **Gated on confirmed report save** | From discussion record §37. Non-negotiable. |

---

## 1. System definition

A local, exercise-specific, temporal rehabilitation assessment engine combining
live low-latency pose feedback, EMG history, high-quality post-session pose
extraction, biomechanical feature engineering, repetition-level error analysis,
explainable multi-label prediction, and structured report generation — with
strict source traceability and controlled retention of raw video.

**Two paths, deliberately unequal:**

- **Live path** — optimized for responsiveness. Deterministic arithmetic only. No
  ML, no SHAP, no network round trip in the feedback loop.
- **Post-session path** — optimized for accuracy. Heavy pose model, full feature
  extraction, trained classifier, SHAP explanation, report.

They share landmark definitions and feature *semantics*, never code paths.

---

## 2. Locked decisions

Do not re-litigate these. They came from the source documents or from completed
training work.

| Topic | Decision |
|---|---|
| Repo | 1 monorepo, 2 backend services (FastAPI orchestrator + existing Flask EMG), not merged |
| EMG service | Stays Flask, own process, own port. Do NOT rewrite to FastAPI. |
| EMG storage | `history.json` + `.bin` files. No DB migration in v1. |
| Live pose | Browser, MediaPipe Tasks Vision JS, **Lite** model |
| Post-session pose | Python, MediaPipe **Heavy**, offline batch |
| Live feedback | Client-side threshold rules only. No ML, no SHAP. |
| Model | Tree ensemble (RandomForest first), **multi-label**, **one model per exercise** |
| Explainer | SHAP TreeExplainer, post-session only, patient-facing. LIME debug only, wrapped in try/except. |
| Errors | Independent temporal events. A rep may have zero, one, or several, overlapping. |
| Dataset splitting | Never random frames. Never same recording across splits. Subject-level preferred, recording-level fallback. |
| WebSocket | ONE connection per session, tagged messages. Client never opens two. |
| Report trigger | Session end only |
| Video retention | Deleted only after confirmed report save |
| Clinical content | AI never invents thresholds, labels, or correction wording. User owns all of it. |

---

## 3. Performance architecture

This section exists because the current system feels heavy and laggy. Treat it as
binding, not advisory.

### 3.1 Where the lag actually comes from

In a browser-pose + WebSocket design, lag has four common sources, in order of
typical severity:

1. **Pose inference on the main thread.** MediaPipe on the UI thread blocks
   rendering. Every inference is a frame the browser cannot paint. This alone
   produces visible stutter.
2. **Unbounded send queue.** If pose frames are pushed to the WebSocket faster
   than the network drains them, the queue grows without limit. Feedback arrives
   for a pose the user held two seconds ago. It feels like lag but is actually
   backlog.
3. **Network round trip in the feedback loop.** Sending landmarks to a server so
   the server can compare a number to a threshold, then sending the answer back,
   adds 20–200 ms to something that takes microseconds locally.
4. **Synchronous disk or DB writes inside the live loop.** Buffering session data
   is required, but doing it inline blocks everything behind it.

### 3.2 The rules

**R1 — Pose inference runs off the main thread.**
Run MediaPipe in a Web Worker with `OffscreenCanvas`. The main thread only paints.
If `OffscreenCanvas` proves unavailable in a target browser, fall back to main
thread but reduce inference rate to 15 fps and document the degradation.

**R2 — Fixed frame budget, drop don't queue.**
Target 30 fps capture, 15–20 fps inference. If an inference is still running when
the next frame arrives, **discard the new frame**. Never queue it. A dropped frame
costs nothing; a queued frame costs permanent latency. Implement as a single
`inFlight` boolean guard, not a queue.

**R3 — Bounded ring buffer for everything.**
Session capture buffer, EMG buffer, WS outbound buffer: all fixed-size ring
buffers. When full, overwrite oldest and increment a `dropped` counter. Log the
counter. An unbounded buffer in a live loop is a latency leak with extra steps.

**R4 — Rule checks are client-side.**
Port `posture_checks.py` + `math_utils.py` arithmetic to JS. The feedback loop
becomes: worker computes landmarks → worker computes angles → worker compares to
thresholds → main thread paints colour + text. Zero network involvement.
Sub-frame latency.

**R5 — The WebSocket carries evidence, not feedback.**
Pose data still goes to the server, but for *recording*, not for *response*. Send
batched, not per-frame: accumulate ~500 ms of frames, send one message. Cuts
message count by ~15×. The user notices nothing because nothing in the feedback
loop depends on it.

**R6 — Server-side writes are async and batched.**
FastAPI receives a batch, appends to an in-memory deque, returns immediately. A
separate background task flushes to disk every N seconds or M frames. The WS
handler never awaits disk I/O.

**R7 — Post-session work runs in a process pool, not the event loop.**
MediaPipe Heavy extraction, feature building, model inference and SHAP are all
CPU-bound. Running them in the async event loop freezes every other request.
Use `ProcessPoolExecutor` via `run_in_executor`, or a task queue. One worker
process per physical core minus one.

**R8 — Model and explainer load once at startup.**
`joblib.load` at FastAPI startup into module state. Never per-request. Same for
the SHAP TreeExplainer — construct once per model, reuse.

**R9 — Heavy extraction parallelizes across clips, not within.**
MediaPipe is single-threaded per stream. To process a session's reps faster, run
several clips in parallel processes. Do not try to thread inside one clip.

**R11 — Isolate by failure domain, not by task count.**
Separate anything whose failure must not propagate, and anything whose latency
profile differs. Four genuinely different profiles exist: video recording
(steady, must-not-drop), pose inference (bursty, droppable), EMG (slow poll),
IMU (fast poll). Four contexts. Do not split further — putting rule checks in
their own worker away from pose buys nothing and adds a message hop, since rules
are microseconds of arithmetic on data the pose worker already holds.

**The recording/inference split is the important one.** The Lite model is
error-prone by design; that is an accepted trade for latency. A Lite stall must
never cost captured evidence, because the Heavy model and the entire report are
built from that evidence. Losing a live flag costs a moment of feedback. Losing
video frames costs the session. The original design already stated this: the
data-capture path is prioritized above live-assessment completeness.

Note on mechanism: the browser gives you no OS threads. `MediaRecorder` runs on
the browser's internal encoding thread, unreachable from your JS. Web Workers are
separate JS contexts with no shared mutable state, so one cannot block another
through a lock — stronger isolation than managed threads, not weaker.

**R10 — Measure before optimizing anything else.**
Every live session records: capture fps, inference fps, frames dropped, WS queue
depth, feedback latency (landmark timestamp → paint timestamp). Surface these in
a dev overlay. Optimization without these numbers is guessing.

### 3.3 Live feedback loop, target shape

```
[Camera] --30fps--> [Web Worker]
                        |
                    MediaPipe Lite (15-20fps, drop-if-busy)
                        |
                    smoothing (One-Euro filter)
                        |
                    angle math + threshold rules
                        |
              +---------+----------+
              |                    |
        postMessage           ring buffer
              |                    |
        [Main thread]        every ~500ms
        paint skeleton             |
        paint flag colour          v
        play audio cue        [WebSocket] -> server (evidence only)
```

Feedback latency budget: **< 100 ms** from frame capture to painted flag.
Nothing in that path crosses the network.

### 3.4 Post-session path, target shape

```
[Session ends]
     |
POST /session/end  -> returns immediately with job_id
     |
[Background task queue]
     |
     +-> MediaPipe Heavy extraction   (ProcessPool, N clips parallel)
     +-> common feature extractor      (parquet)
     +-> exercise-specific extractor   (parquet)
     +-> per-rep aggregation
     +-> model predict (multi-label)
     +-> SHAP TreeExplainer
     +-> report assembly + chart render
     +-> save report  <-- confirm write
     +-> ONLY NOW: delete raw video
     |
GET /report/{session_id}  -> poll or WS notify when ready
```

The client polls or receives a WS notification. It never blocks waiting.

---

## 4. Repo layout

```
final_project/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, lifespan loads models
│   │   ├── ws/session_ws.py            # WS endpoint, batched receive
│   │   ├── routes/
│   │   │   ├── session.py              # start / end / status
│   │   │   ├── report.py               # get report, get job status
│   │   │   └── exercises.py            # config list
│   │   ├── services/
│   │   │   ├── emg_client.py           # httpx -> Flask service
│   │   │   ├── session_buffer.py       # bounded ring buffer + async flush
│   │   │   ├── job_queue.py            # background job tracking
│   │   │   ├── feature_builder.py      # session data -> feature row
│   │   │   ├── model_service.py        # loaded-once models, predict
│   │   │   ├── explainer_service.py    # SHAP primary, LIME debug
│   │   │   └── report_builder.py       # template + chart -> report object
│   │   ├── exercises/                  # ported class structure from old project
│   │   ├── models/                     # DB models
│   │   └── telemetry.py                # perf counters
│   ├── ml/
│   │   ├── extract_landmarks.py        # MediaPipe Heavy, batch, ProcessPool
│   │   ├── common_features.py          # the 154-col extractor
│   │   ├── exercise_extractors/        # heel_slide, mini_squat, seated_knee_ext, tke, slr
│   │   ├── aggregate_features.py       # per-clip aggregation
│   │   ├── train_model.py              # GroupKFold, multi-label, RF vs XGB
│   │   ├── export_model.py             # final fit + joblib bundle
│   │   └── trained_models/
│   ├── requirements.txt
│   └── Dockerfile
│
├── emg-service/                        # existing Flask, moved wholesale
│   └── data/                           # .bin files relocated here
│
├── frontend/
│   ├── src/
│   │   ├── workers/pose_worker.js      # MediaPipe Lite + smoothing + rules
│   │   ├── lib/
│   │   │   ├── angles.js               # ported math_utils.py
│   │   │   ├── rules.js                # ported posture_checks.py
│   │   │   ├── smoother.js             # ported smoother.py (One-Euro)
│   │   │   └── ring_buffer.js
│   │   ├── ws/client.js                # single WS, batched send
│   │   ├── render/skeleton.js          # ported drawing.py
│   │   ├── pages/
│   │   └── assets/audio/               # copied mp3 cues
│   └── package.json
│
├── docs/                               # agent notes land here
├── docker-compose.yml
└── README.md
```

---

## 5. Atomic task list

Each task: one agent, one clear output, independently testable. Do not merge
tasks. Do not skip. Each ends with a written note in `docs/`.

### PHASE 0 — Baseline measurement (do this first, always)

- **P0.1** Run the existing app. Record with a stopwatch or screen capture: time
  from a deliberate posture change to the on-screen flag appearing. Do it 10
  times, write down the median. This is your baseline number.
- **P0.2** Open browser devtools Performance tab during a live session. Record 30
  seconds. Note: main thread blocking time, longest task, frame rate.
- **P0.3** Identify from P0.2 which of the four lag sources in §3.1 dominates.
  Write it down in `docs/00_baseline.md`. Every later performance claim gets
  measured against this file.

Do not skip Phase 0. Optimizing without it means you will not know whether
anything you did helped.

### PHASE A — Repo skeleton

- **A1** Create `final_project/` with `backend/`, `emg-service/`, `frontend/`,
  `docs/`.
- **A2** Copy existing Flask EMG project into `emg-service/`. Copy, not move.
- **A3** Run Flask from new location. Confirm it starts, device connects,
  dashboard loads. Only when confirmed, delete the original location.
- **A4** Copy old physio project into `backend/_legacy_reference/`. Reference
  only; deleted at end of Phase D.
- **A5** `git init`. `.gitignore`: `__pycache__`, `.env`, `node_modules`,
  `*.pkl`, `*.joblib`, `*.bin`, `*.mov`, `*.parquet`.
- **A6** Write `docs/01_repo.md` — what moved where.

### PHASE B — FastAPI skeleton

- **B1** venv, install `fastapi uvicorn websockets pydantic httpx`.
- **B2** `app/main.py` with `GET /health`. Use `lifespan` context manager, not
  deprecated `@on_event`.
- **B3** Confirm `/health` responds.
- **B4** Create empty package dirs with `__init__.py`.
- **B5** `app/telemetry.py` — a simple counter/timer registry, and
  `GET /metrics` returning it as JSON. Build this now so later phases can report
  into it from day one.
- **B6** `Dockerfile`, `python:3.11-slim`.

### PHASE C — EMG service integration

- **C1** Read `emg-service/backend/app.py` fully. Write `docs/02_emg_routes.md`
  listing every route, and which `website/*.html` file it actually serves. That
  answers the live.html / live2 / live3 question — whichever the code references
  is real, the rest are dead.
- **C2** Read `emg_serial_capture.py`. Determine: in-process serial read, or
  separate script writing `.bin` files? This decides whether live EMG is instant
  or file-polled. Record the answer.
- **C3** Read `emg_review.py`. Wired into `app.py`, or standalone CLI? Record.
- **C4** Read `history.json`. Write its exact schema into the notes file.
  `feature_builder` will need it.
- **C5** If no clean JSON route for current EMG value exists, add exactly one:
  `GET /api/live-value`. Change nothing else in Flask.
- **C6** `backend/app/services/emg_client.py` — async `httpx` call to that route,
  with a timeout and a circuit breaker (after 3 consecutive failures, stop
  calling for 30 s and return `None`). **The EMG service must never be able to
  stall the live session.**
- **C7** Temporary `GET /test-emg` route. Confirm end to end with both services
  running. Delete the test route.
- **C8** Move loose `.bin` files into `emg-service/data/`. Update the three
  scripts' paths. Confirm all three still work.

### PHASE D — Legacy extraction (notes only, no final code)

This phase produces **documentation**, not implementations. Three later agents
depend on it, so it must finish and freeze before they start.

- **D1** `admin.py` — what is it? Port or drop? Record, delete nothing.
- **D2** `drawing.py` — what exactly does it draw (skeleton lines, angle labels,
  colour rules)? Record precisely enough for a JS reimplementation.
- **D3** `exercise_runner.py` — blocking or threaded? Exact call order per frame
  into `landmarks.py`, `posture_checks.py`, `voice.py`. Record the order; the new
  worker must replicate it.
- **D4** `landmarks.py` + `smoother.py` — record the extraction and smoothing
  logic. Both get ported twice: to Python (Heavy, offline) and JS (Lite, live).
- **D5** `posture_checks.py` + `math_utils.py` — list every angle/distance
  function and its exact formula. These become both `rules.js`/`angles.js` and
  the offline feature functions. **Same formula both sides or live and offline
  disagree.**
- **D6** `voice.py` — the error-code → mp3 mapping. Record it verbatim.
- **D7** `gemini.py` — record the *output format* of the current report (sections,
  order, phrasing style) and where reports are saved. Do not copy the API call.
- **D8** `exercise_base.py` + `exercises/*.py` — class structure, attributes,
  which are isometric vs dynamic.
- **D9** Write everything into `docs/03_legacy.md`. **Freeze this file.** Later
  agents read it; it must not move under them.

### PHASE E — Model ingestion & validation (NOT training)

**Redefined in this revision.** Training happens externally — Colab, local
machine, whatever the user runs by hand — and is out of this repo's scope
entirely. Phase E's job is to receive a finished `models.zip`, verify it is
structurally sound, and place it where the app expects it. No training code,
no `train_model.py`, no GroupKFold, no aggregation logic lives here anymore.
That work already exists as standalone scripts outside this repo.

Why this split: training decisions (which algorithm, which hyperparameters,
which CV strategy) belong to whoever owns the modeling work and change on their
own schedule. The app must not need a rebuild every time the model changes —
it needs a stable **contract** for what a valid model package looks like, and
a gate that refuses anything that doesn't meet it.

- **E1** Define the expected zip structure and write it down before building
  anything against it:
  ```
  models.zip
  ├── model_card.json                     # required, schema below
  ├── <exercise_name>/
  │   ├── model.joblib                    # required
  │   ├── feature_names.json              # required, ordered list
  │   ├── labels.json                     # required, ordered list
  │   └── impute_median.json              # required
  └── ... one folder per exercise
  ```
- **E2** `model_card.json` required-field schema. **Extended 2026-08-27** —
  the four fields after `caveats` were added by the design review recorded in
  §E-DECISIONS:
  ```
  {
    "trained": "<ISO-8601 timestamp>",
    "model_type": "<string, e.g. 'random_forest', 'xgboost'>",
    "is_tree_based": true,                 # required boolean — gates SHAP path, see §8c
    "sklearn_version": "<string>",
    "exercises": {"<name>": ["<label>", ...]},
    "cv_scores": [{"exercise":..., "label":..., "precision":..., "recall":..., "f1":..., "support":...}],
    "caveats": ["<string>", ...],

    "data_sources": ["pose"],              # required; subset of pose|emg|imu.
                                           # What this model REQUIRES at scoring
                                           # time. A session missing a declared
                                           # source is not scored — see E-DEC.2.
    "extractor_version": "<string>",       # required; warn-only on mismatch
    "feature_hash": "<sha256 of the ordered feature_names list>",
                                           # required; HARD FAIL on mismatch.
                                           # ALSO accepts {exercise: hash} --
                                           # see the correction note below.
    "decision_thresholds": {               # required; one entry per label
      "<label>": {"threshold": 0.5, "reportable": true}
    }
  }
  ```
  Every field required. `caveats` may be an empty list but must be present —
  an absent caveats field is itself rejected, so a model card can't silently
  omit known weaknesses.

  **Correction, 2026-08-27 (found during implementation).** `feature_hash` as
  a single top-level string was wrong. E1 puts `feature_names.json` inside each
  exercise folder, and §8c explicitly grants per-exercise independence — the
  real bundles carry 954, 1062 and 961 features respectively. One shared hash
  cannot describe that. The field therefore accepts **either** a single string
  (every exercise in the package shares one feature schema) **or** a
  `{exercise: hash}` mapping. The mapping form fails loudly when an exercise
  has no entry, so it does not become a silent skip.
- **E3** `backend/ml/validate_model_package.py` — the actual gate. Checks, in
  order, stopping at first failure with a specific message (not a generic
  "invalid package"):
  1. Zip extracts cleanly.
  2. `model_card.json` present, valid JSON, every required field present and
     correctly typed.
  3. Every exercise listed in `model_card.json["exercises"]` has a matching
     folder with all four required files.
  4. Each `model.joblib` loads without error.
  5. Loaded model exposes `.predict()` and `.predict_proba()` — reject if
     either is missing.
  6. `feature_names.json` length matches what the loaded model expects
     (`model.n_features_in_` where available).
  7. `labels.json` length matches the model's output shape for multi-label
     estimators.
  8. sklearn version in the card is compared against the installed version;
     mismatch is a **warning**, not a hard failure — record it, don't block.

  **Checks 9-13, added 2026-08-27** (see §E-DECISIONS for the reasoning):

  9. `model.joblib` holds ONE object exposing `.predict()` and
     `.predict_proba()` — not a dict, list or other container of per-label
     estimators. See E-DEC.1.
  10. `feature_hash` matches the sha256 of the ordered `feature_names.json`
      list actually shipped in the package. **Hard fail.**
  11. `data_sources` present, non-empty, and every entry is one of
      `pose` | `emg` | `imu`.
  12. `decision_thresholds` has an entry for **every** label in `labels.json`,
      each with a `threshold` in `[0, 1]` and a boolean `reportable`.
  13. Every label in `labels.json` has patient-facing wording available to
      `report_builder.py` (I10). Reject with the exact list of labels that
      have none — see E-DEC.4.
- **E4** On any failure, write a clear rejection report: which check failed,
  which exercise/file, and what was expected vs found. Never partially import
  a package — validation is all-or-nothing per exercise. An exercise that
  fails validation is excluded from the registry and logged; other exercises
  in the same zip that pass are still loaded.
- **E5** On success, extract into `backend/ml/trained_models/<exercise>/`,
  replacing any prior version for that exercise. Keep the previous version
  in `trained_models/_previous/<exercise>/` for one rollback step — a bad
  import must not be unrecoverable.
- **E6** `POST /admin/models/upload` — accepts the zip, runs E3, returns the
  validation report. Manual trigger, not automatic; a new model is a
  deliberate action, not something that fires on file-watch.
- **E7** `GET /admin/models/status` — which exercises have a loaded model,
  which validation report they last passed, `is_tree_based` per exercise, and
  the timestamp of the last successful import.
- **E8** Startup check: if `trained_models/` is missing an exercise present in
  `exercise_config.py`, log a clear warning and mark that exercise as
  `analysis_unavailable` rather than crashing the app. Live rule-based
  feedback for that exercise still works; only post-session prediction is
  disabled.

- **E9** *(added 2026-08-27)* `backend/ml/repackage_legacy_bundle.py` — a
  **throwaway** one-off converter for the three placeholder bundles that
  predate this contract (`mini_squat_rf.pkl`, `seated_knee_extensions_rf.pkl`,
  `straight_leg_raise_rf.pkl`). Each currently holds a dict of per-label
  `RandomForestClassifier`s; the converter emits a single
  `MultiOutputClassifier` per exercise plus the four E1 files and a conforming
  `model_card.json`. **Mark it clearly as disposable** — it dies with the
  placeholder models after the recording day and must never become a
  general-purpose import path. Anything that needs to survive belongs in E3,
  not here.
- **E10** *(added 2026-08-27)* Canonical exercise naming. The package's
  exercise keys must match `exercises.json` exactly. The current bundles use
  `seated_knee_extensions` (plural) against the config's
  `seated_knee_extension` (singular), and `model_card.json` keys exercises by
  filename (`mini_squat_rf`) rather than exercise name. E3 rejects a package
  whose keys are not canonical rather than fuzzy-matching them — a silent
  rename is how a model ends up scoring the wrong exercise.
- **E11** *(added 2026-08-27)* Scoring-time source check. Before scoring, the
  app compares the model card's `data_sources` against what the session
  actually recorded. A missing source means that exercise reports
  `analysis_unavailable` with the reason named. **Never impute an absent
  sensor from `impute_median.json`** — that file exists for occasional gaps in
  a present signal, not for a sensor that was never there. See E-DEC.2.


### §E-DECISIONS — design review, 2026-08-27

Recorded from a working session with the owner. These shaped E2's extended
schema and E3's checks 9-13. Written down because the *reasoning* is the part
that stops a future agent from "simplifying" a check back out again.

**Context that changes how E should be read:** the three model bundles in the
repo today are **placeholders**. They will be discarded and retrained after the
recording day (§PHASE M-REC). So E is built for the package shape that
*will* exist, not the one that does — and the existing bundles are made to fit
it by a disposable converter (E9), never by relaxing the contract to
accommodate them.

#### E-DEC.1 One model object per exercise

`model.joblib` holds a single estimator exposing `.predict()` and
`.predict_proba()`.

The placeholder bundles hold `{label: RandomForestClassifier}` — a container
with neither method — so E3's check 5 would reject them as written. Two ways
out were considered:

- Relax E3 to accept per-label mappings. **Rejected**: it permanently encodes
  an accidental shape, to serve three files being deleted.
- Pickle a repo-defined wrapper class into `model.joblib`. **Rejected**:
  `joblib.load` would then require importing this repo, so an external trainer
  would have to depend on the app to produce a valid package — directly
  against the "training happens externally" split this phase exists to create.

Kept strict because it costs the future trainer nothing:
`MultiOutputClassifier(RandomForestClassifier()).fit(X, y)` is one line of
ordinary scikit-learn and is the normal way to train multi-label. Note that
`MultiOutputClassifier` stores a list of per-label estimators internally — so
this is a *packaging* choice, not an architectural one. SHAP explains one
output at a time either way.

#### E-DEC.2 A model declares the sensors it needs; missing means no score

`data_sources` lists what the model requires. If a session lacks a declared
source, that exercise reports `analysis_unavailable` naming the reason.

This will be routine, not exceptional: sessions recorded before the IMU exists,
an IMU that trips its circuit breaker mid-session (M3), a patient not wearing
one.

**Imputing an absent sensor from `impute_median.json` is forbidden.** The
IMU's entire value is being an *independent* check on the camera (§M). A value
imputed from training medians agrees with the camera by construction, which
manufactures exactly the false confidence M8 exists to detect. M9 already
forbids silently blending sources; this is the same rule one level up.
`impute_median.json` covers occasional gaps in a signal that is present.

A useful consequence: sessions recorded before the IMU works remain scorable by
pose-only models, because those declare `["pose"]`. Nothing recorded early
becomes worthless.

#### E-DEC.3 Feature drift: hard fail on names, warn on version

Training builds the feature row outside the app; the app rebuilds it at scoring
time (I4). Two copies of the same maths that must stay in step. Two distinct
failure modes, deliberately handled differently:

- **The column list changes** — added, removed, renamed or reordered. Exactly
  checkable, so `feature_hash` is a **hard fail**. No report is produced.
- **The maths behind a name changes** while names stay identical. Not
  checkable by any automatic means, so `extractor_version` is **warn-only**
  and surfaces in the report's caveats.

I4 previously specified logging for both. A log line is read *after* someone
suspects a problem, and this failure never looks like one — same silent shape
as the typo'd event name and the dead audio map in PROJECT-STATUS §3.
Something exactly checkable must never be downgraded to a log line.
Hard-failing on *both* was rejected: it would block every routine refactor and
train people to bump the version string thoughtlessly, turning the check into
theatre.

#### E-DEC.4 Labels must have patient wording before import

Every label needs a patient-facing sentence in `report_builder.py`'s dictionary
(I10). A package with an unmapped label is rejected, listing the exact labels
that need wording.

Checked at import, not at report time. Import is when a human is already
paying attention and nothing is at stake; report time is in front of a patient,
mid-session, when nobody can fix it. Without the check the report either prints
a raw label (`knee_varus`) or silently drops a real finding — the second being
worse, because nothing notices.

Labels are expected to be stable with occasional additions, so this check
should rarely fire. It is cheap insurance, not a workflow burden.

#### E-DEC.5 Auto-computed labels are rules, not model labels

**This is the root cause of the circularity in PROJECT-STATUS §3, now located
exactly.** The label editors in the external training folder compute some
labels from angles that are *also* features:

- `mini_squat_label_editor.py`: `squat_too_shallow` from a threshold on
  `knee_angle_2d` / `hip_angle_2d`; `path_deviation_error` from a threshold on
  `path_deviation`, which is itself written into the parquet and becomes a
  feature.
- `slr_label_editor.py`: a knee flag from `knee_angle < KNEE_MIN_DEG`.
- `label_editor.py`: purely human — a name typed at a prompt, broadcast to the
  clip. No computation.

So the label set splits cleanly:

| Kind | Labels | Honest? |
|---|---|---|
| Computed from a feature | `squat_too_shallow`, `path_deviation_error`, SLR's knee flag | **No** — circular by construction |
| Human, broadcast per clip | `heel_lifting`, `hip_lifting`, `knee_varus`, `knee_past_toes`, `head_lifting`, `ankles_close_together`, `back_slouching`, `back_rocking` | Yes |

This explains §8's observation that only `hip_lifting` (F1 0.46) is an honest
generalization estimate, and why `knee_flexion_high` scored a perfect 1.000:
one is human-judged, the other is the model rediscovering a threshold.

**Decision: a computed label becomes a rule.** It moves into the live
threshold checks (`rules.js`), where it is reported *during* the rep instead
of afterwards, and leaves the model's label set. Nothing is lost — a model
that reproduces a threshold you already own adds no information — and three
things are gained: the circularity disappears rather than being mitigated,
every surviving CV number is measured against a human judgement, and the label
set shrinks against a feature count that badly needs it.

**The general rule this sets:** a label is worth training only if a human
decided it by watching the movement. If it can be computed from the features,
it is a rule.

#### E-DEC.6 Reports separate what was measured from what was inferred

The report carries findings from three sources — live rules, the model with
SHAP, and EMG/IMU cross-checks (M7/M8). D7 establishes that the *legacy* report
was built entirely from live rule flags; I10/I11 add model findings on top of
that spine.

Measured and inferred findings go in **separate, clearly labelled sections,
never interleaved**:

1. **What we measured** — rule findings. A threshold was crossed. Stated
   plainly, with the value and the threshold available.
2. **What the analysis suggests** — model output. Always hedged, carrying the
   model card's own caveats.

This distinction is **permanent and independent of model quality**. A rule
*measures* a quantity; a model *infers* a judgement, and SHAP explains what
influenced a prediction — never that the patient performed a specific action
(§8). That remains true at F1 0.95 as much as at 0.46.

What model quality changes is **prominence, not placement**. Render section 2
driven by the model card: strong per-label `cv_scores` earn prominent
placement and light hedging; weak scores earn heavy caveats or suppression via
the `reportable` flag. Same code, behaviour scales with the model. This is what
E2's `cv_scores` and `caveats` are *for* — they are inputs to rendering, not
documentation.

#### E-DEC.7 Per-label decision thresholds ship in the package

> **⚠ NOT UNDERSTOOD BY THE OWNER — REQUIRES CLARIFICATION BEFORE IT IS
> TREATED AS SETTLED.** Accepted provisionally in the 2026-08-27 review so
> that E could proceed. Anyone implementing against it should raise it again
> rather than assume agreement. It is recorded here as a proposal, not a
> ruling.

The proposal: `decision_thresholds` in the model card carries, per label, the
probability cutoff chosen at training time and a `reportable` boolean.

The reasoning offered was:

- A model outputs a probability; something must turn `0.62` into yes or no.
  The default 0.5 is rarely right under class imbalance, and the current
  manifest is severely imbalanced (`path_deviation` 1 positive,
  `knee_past_toes` 5, `back_rocking` 7, against `hip_lifting` 34 of 163).
- The cutoff is a **training-time** decision — only the training run holds the
  validation data to tune it on. In app config it would silently drift from
  the model, which is the same mismatch class E-DEC.3 refuses on.
- It preserves swap-and-go: a new model brings its own cutoffs.
- `reportable: false` lets the package state that a label is too weak to show
  a patient at any cutoff — better than the app guessing.

§9's "class imbalance remediation undecided" is the open question this sits
inside.

### PHASE F — Exercise config

**Must be exercise-count-agnostic.** Nothing in this phase may hardcode "5
exercises" — the loader, the registry, and the API response all need to work
identically whether 3 exercises are configured or 30.

- **F1** Copy `exercise_base.py` and `exercises/` into `backend/app/exercises/`.
  Keep the class structure — do not flatten to JSON.
- **F2** Add `type = "dynamic" | "isometric"` to each class. Confirm by reading
  the code, not by guessing from the filename.
- **F3** Add `primary_branch = "pose" | "emg" | "both"`.
- **F4** Add `thresholds` dict per exercise, **keyed by exercise name**, not
  five named fields on a struct. Values from the user, never invented by an
  agent.
- **F5** `exercise_config.py` loader — builds the registry by scanning
  whatever exercise classes/config entries exist. Adding exercise #6 must mean
  adding a class + config entry, never touching this file's logic.
- **F6** `GET /exercises` returns config **including thresholds**, so the
  browser can run rules client-side. Response shape must not assume a fixed
  exercise count.
- **F7** **Agnosticism test, required before this phase passes.** Add one
  dummy exercise (thresholds only, no trained model behind it) purely through
  config — no changes to `exercise_config.py`, no changes to F6's route
  handler. Confirm it appears correctly via `GET /exercises`. This is the
  actual proof of agnosticism; a design that merely claims to be
  count-agnostic and a design that's tested to be are different things.

### PHASE G — Live path (frontend-heavy)

- **G1** `frontend/src/lib/angles.js` — port D5's formulas exactly. Unit test
  against known inputs; compare outputs to the Python originals to 6 decimals.
- **G2** `frontend/src/lib/rules.js` — port D5's threshold checks. Same error
  codes as `voice.py`.
- **G3** `frontend/src/lib/smoother.js` — One-Euro filter, matching D4.
- **G4** `frontend/src/lib/ring_buffer.js` — fixed capacity, overwrite-oldest,
  `dropped` counter.
- **G5** `frontend/src/workers/pose_worker.js` — Web Worker. Receives frames via
  `OffscreenCanvas`, runs MediaPipe Lite, applies smoothing, computes angles,
  evaluates rules, posts `{landmarks, flags, timings}` to main thread.
  **`inFlight` guard: if busy, drop the incoming frame. Never queue.**
- **G6** Main thread: `getUserMedia`, transfer frames to worker, paint skeleton
  and flags on canvas. Main thread does no inference and no math.
- **G7** Port `drawing.py` (D2) into `render/skeleton.js` — green normal, red on
  flagged region.
- **G8** Audio cues: play the mp3 mapped to the error code (D6), client-side.
  Debounce — do not replay the same cue more than once per N seconds.
- **G9** `ws/client.js` — one WebSocket. Batches pose frames into ~500 ms
  windows. Bounded outbound buffer; on backpressure, drop oldest and count.
- **G10** Dev overlay showing capture fps, inference fps, dropped frames,
  feedback latency, WS queue depth. Toggleable.
- **G12** **Video recording, fully isolated.** Attach a `MediaRecorder` directly
  to the raw camera `MediaStream`, independent of the pose worker. Two consumers
  of one stream: the recorder, and a frame grab feeding the worker. They share no
  execution context, so a pose stall cannot touch recording. Use `timeslice`
  chunked writes so a crash loses seconds, not the session. Recording starts
  before the worker spins up and stops after it tears down.
- **G13** **Recording survives pose failure.** If the pose worker dies or hangs,
  recording continues and the UI states "feedback unavailable — session still
  recording." Test by deliberately killing the worker mid-session and confirming
  the resulting video is complete and playable. This test is the gate, not the
  code.
- **G11** Measure feedback latency. Compare to `docs/00_baseline.md`. If it is
  not dramatically better, stop and find out why before continuing.

### PHASE H — Live path (backend)

- **H1** `session_buffer.py` — per-session bounded deque, async flush task
  writing to disk every N seconds. The WS handler never awaits disk.
- **H2** `ws/session_ws.py` — `/ws/session/{id}`. Receives batched pose messages,
  appends to buffer, returns immediately.
- **H3** EMG relay: background async task polling `emg_client` at a modest
  interval (2–5 Hz is plenty for a chart), pushing `{type:"emg"}` to the client.
  Circuit-breaker protected (C6).
- **H4** `POST /session/start` — creates session, returns `session_id`. Must run
  before the WS opens.
- **H5** `POST /session/end` — marks ended, enqueues the report job, returns a
  `job_id` immediately. Idempotent: calling twice must not produce two reports.
- **H6** WS disconnect handler — treat abrupt disconnect as session end. Mobile
  browsers kill sockets without warning.
- **H7** Fake-client test script: Python `websockets` client sending synthetic
  pose batches. Confirm buffering, flushing, and job enqueue without a browser.

### PHASE M — Sensor fusion & cross-checking (EMG + IMU)

New in v3. The original diagram drew two cross-check arrows (`live EMG → live
pose`, `EMG history → per-rep analysis`) that no earlier plan implemented. The
MPU6050 addition makes this a phase in its own right rather than a detail.

**Why the IMU matters more than an extra sensor usually would.** EMG measures
muscle activation — you can infer nothing about limb angle from it. An IMU
measures limb orientation *directly*: the same physical quantity MediaPipe
estimates from a single camera. That makes it the first independent check you
have ever had on the weakest part of the schema, the monocular `_3d` columns.

**Physical constraints that must shape the design — not optional caveats:**

- **MPU6050 is 6-axis (accel + gyro), no magnetometer.** Yaw drifts without
  bound, within minutes. Pitch and roll stay stable via gravity. Practical rule:
  **trust the IMU for sagittal-plane flexion/extension; do not trust it for
  rotation about the vertical axis** without fusing an additional reference.
  Ignoring this is the most common way IMU projects fail.
- **One IMU gives one segment's orientation. A joint angle needs two segments.**
  A thigh sensor alone cannot give knee angle. Either instrument thigh *and*
  shank, or rely on the other segment being fixed — valid for seated knee
  extension, invalid for squats. Decide sensor count before wiring anything.
- **Coordinate frames differ.** MediaPipe outputs pelvis-relative coordinates;
  the IMU outputs orientation relative to gravity and its own startup pose.
  Untransformed, the two angle streams are not comparable and every apparent
  disagreement is frame mismatch.
- **Placement is not repeatable.** A sensor 2 cm higher on the shin produces a
  systematic angle offset. Per-session calibration is mandatory.

Tasks:

- **M1** Calibration protocol. A defined static pose held at session start
  (user specifies the pose — do not invent it). Compute and store the pose↔IMU
  transform per session. No comparison happens before this succeeds.
- **M2** Time synchronization. Shared session epoch; both sensor streams stamped
  against it; resample to a common time grid before any comparison. Without this,
  fast movement produces fake disagreement from clock skew alone.
- **M3** `imu_client.py` — own async task, own bounded buffer, own circuit
  breaker (same pattern as `emg_client.py`, C6). A dead IMU must never stall a
  session.
- **M3a** **Three sensors, three independent failure domains.** IMU never runs
  inside the pose worker and never inside the EMG task. Any one can die without
  affecting the other two or the recording. Test each failure independently.
- **M4** Live pose↔IMU agreement check, client-side and cheap. Disagreement
  beyond threshold produces a **quality warning**, never a patient-facing error
  flag: "move into frame", "check sensor placement". Getting this distinction
  wrong means telling a patient they moved incorrectly when in fact your tracking
  failed — a worse failure than silence.
- **M5** Live EMG↔pose cross-check (the `LA → LVA` arrow). Rule-based only.
  Activation present with no movement → isometric hold, valid. Movement with no
  activation → possible passive movement or compensation. Flag for review, not as
  a posture error.
- **M6** Post-session: join the IMU angle series into the pose parquet as
  additional columns (`imu_<joint>_angle`, `imu_pose_angle_delta`). An addition,
  not a replacement. **The delta is itself a feature** — where camera and sensor
  disagree is information about tracking quality.
- **M7** Post-session EMG cross-check (the `HS → PRA` arrow). Per-rep EMG summary
  joined on `timestamp_ms`, used as a **rep-validity gate**: a rep with no muscle
  activation is not a real rep and is excluded from scoring rather than scored
  badly.
- **M8** Session agreement report section. How often IMU and pose agreed across
  the session. Low agreement flags the whole session as low-confidence instead of
  reporting errors derived from bad data.
- **M9** Occlusion fallback. When pose confidence drops (the unresolved SLR
  occlusion case), the IMU is unaffected by occlusion and can carry the angle
  estimate. Mark such frames explicitly as IMU-derived; never silently blend
  sources.

**Dataset consequence, time-critical.** If the MPU6050 arrives before the
recording day, **capture IMU alongside video for every clip**, even if the data
goes unused for months. Retrofitting is impossible — it would mean reshooting.
The same applies to EMG: no paired pose+EMG training data exists today, and the
recording day is the cheap opportunity to create it. Check the sensor's delivery
date before locking the shoot date; a week's wait may be worth it.

### PHASE M-REC — Recording day readiness gate

**Added 2026-08-27.** New section; nothing above is amended.

**Why this exists.** The subjects are practising doctors donating time as
models. They cannot be recalled for a second session, so the recording day is a
**one-shot, irreversible event**, not a task that can be iterated. Every earlier
note in this plan that treats re-recording as merely inconvenient
(§9's "retrofitting means reshooting", §M's "a week's wait may be worth it")
understates it: there is no second shoot to fall back on.

This also changes the shape of the IMU risk. §9 frames it as a *delivery date*
to check. The device is being **built in-house**, so the risk is an unbounded
engineering task, not a shipping estimate. A build slips; a delivery date can at
least be planned around.

**The decision taken:** hold the shoot until the IMU is genuinely ready, and
instrument fully in one pass. A retrain is required regardless (E8 label
circularity alone forces it), so IMU columns arriving in that same retrain cost
nothing extra — there is no reason to split the work across two model versions.

#### M-REC.1 Hardware readiness

- **M-REC.1a** IMU sensor count settled and wired. One IMU gives one segment's
  orientation; a joint angle needs two. Thigh + shank for knee angle in a
  squat. A single thigh sensor is valid only where the other segment is fixed
  (seated knee extension).
- **M-REC.1b** Calibration protocol defined and rehearsed (M1). The static pose
  comes from the doctors, not from an agent. Transform computed and stored per
  session; no comparison happens before calibration succeeds.
- **M-REC.1c** Sagittal-plane scope accepted in writing. 6-axis MPU6050, no
  magnetometer, yaw drifts without bound. Flexion/extension only.
- **M-REC.1d** Agreement measured against pose on **throwaway footage first**.
  A homemade v1 sensor will have placement and frame errors; find them on junk
  clips, never on the doctors' footage. Recording the one real dataset against
  an unvalidated sensor is worse than recording without it — systematically
  biased columns that look plausible and must later be discarded.
- **M-REC.1e** EMG captured into the **same `session_id`** as pose. This closes
  §9's "no paired pose+EMG training data exists" permanently, needs no new
  hardware, and is the cheapest retrofit available on the day.
- **M-REC.1f** Camera fixed: position, per-exercise view, lighting. Short
  keyframe interval set at record time so I3c's `ffmpeg` cuts land on rep
  boundaries rather than drifting to the nearest keyframe.

#### M-REC.2 Software readiness — must land BEFORE the shoot

- **M-REC.2a** I3a's rep-boundary fields (`stage`, `repCount`, `repWasClean`)
  present in the recorded stream. Without them the footage carries no rep
  information and I3 falls back to peak detection on irreplaceable data.
- **M-REC.2b** F4 `rep_trigger` values for every exercise being filmed. Five of
  six currently hold `{"value": null}`, and a null trigger means no live reps
  are counted or recorded for that exercise.
- **M-REC.2c** Shared session epoch across pose, EMG, IMU and video (M2, and
  I3-revised prerequisite 3). Solve once; both phases depend on it.
- **M-REC.2d** Retention and consent settled before any real person is filmed.
  Landmark coordinates are biometric data (§8b.7) and these are identifiable
  clinicians, not anonymous volunteers.

#### M-REC.3 The doctors are the source for every blocked clinical decision

Every item this plan marks "from the user, never invented by an agent" is a
clinical judgement, and the shoot puts clinicians in the room. Extract these
during preparation, not afterwards — it is the cheapest they will ever be:

| Blocked item | What is needed |
|---|---|
| F4 | threshold values, and the enter/exit/depth angles per exercise |
| M1 | the calibration pose |
| I9 | the severity formula (until supplied, report probability as *confidence*) |
| I10 | patient-facing correction wording |
| E8 | blind re-labelling, by someone who sees neither the auto-flag nor the raw angle |
| §9 | a formula for `knee_varus` — it has a threshold but nothing in the schema computes it |
| §5 F2 | TKE dynamic vs isometric, the weakest-evidenced call in the config |

#### M-REC.4 Subject count is the single biggest quality win available

The current bundle's own model card records the problem:

```
"group_source": "source_recording_id (subject_id had 1 group(s), below MIN_GROUPS=4)"
```

**One subject.** GroupKFold fell back to splitting by recording, which is why
§8's mini_squat and seated_knee_extensions scored 0.000 and why
`knee_flexion_high`'s perfect 1.000 is unverified for circularity. Combined
with a 961-feature / 45-row ratio (~21:1), coincidental splits are guaranteed.

Multiple doctors give **subject-level splits for the first time**, which is what
§8's "subject-level preferred, recording-level fallback" has been waiting for.
It costs nothing extra on the day.

**Therefore: prioritise distinct subjects over reps per subject.** More people
doing fewer reps each beats one person doing many. This is the difference
between CV numbers that mean something and CV numbers that do not.

#### M-REC.5 Gate

The shoot does not happen until M-REC.1 and M-REC.2 are each demonstrably done —
not asserted, demonstrated, on throwaway footage that is then discarded. The
cost of discovering a problem on the day is the entire dataset.


### PHASE I — Post-session analysis

- **I1** `job_queue.py` — job records with status (`queued`, `running`, `done`,
  `failed`), `ProcessPoolExecutor` for CPU-bound stages, progress reporting.
- **I2** Pipeline stage 1: MediaPipe **Heavy** re-extraction from the stored
  video. Parallel across reps (R9).
  **Ordering note (2026-08-27):** the revised I3 runs *before* this stage, not
  after. Rep boundaries now come from the live pose engine, so the video is cut
  into per-rep clips first and Heavy then runs on those clips — which is what
  makes "parallel across reps" literally true (R9 parallelises across clips,
  never within one). The original I2→I3 order assumed segmentation was derived
  from the extracted landmarks; it no longer is. I2 still depends on the video
  being reachable server-side — see I3-revised prerequisite 2.
- **I3** Stage 2: rep segmentation — **revised 2026-08-27, see §I3-revised
  below.** Record the live rep boundaries the pose engine already computes and
  cut the video at those timestamps. Offline peak detection is now the
  *fallback*, not the primary method.

#### I3-revised — rep segmentation from live boundaries

**What changed and why.** The earlier plan called for offline peak detection on
a cyclic signal, and §9 listed rep segmentation as unbuilt work. That was
written without noticing that **the rep state machine already exists and
already runs**. `frontend/src/lib/pose_engine.js` ports the legacy D3 logic and
computes, per frame: `stage` (UP/DOWN), `repCount`, `repHadError`,
`repWasClean`, `repFailReason`, `repErrors[]`. It drives the two on-screen
counters and is covered by `pose_engine_selfcheck.mjs`.

The machine is **generic, not squat-specific**: it reads `cfg.rep_trigger` and
drives off `driver_angle`, with no per-exercise branch. All six configured
exercises carry the same `rep_trigger` shape (`joint_display_name`,
`direction`, `enter_angle`, `exit_angle`, `depth_target`). Only squat carries
values; the other five hold `{"value": null}` with a `_TODO` naming exactly
what is required. So this method covers every exercise the moment F4's numbers
exist — the blocker is clinical data, not code.

`session_orchestrator.js:285` currently sends only
`{ts, landmarks, alerts, view}` and discards the rep fields, which is why
existing session `.jsonl` files carry no rep information.

**Why this beats peak detection.** The training data was hand-cut per-rep
clips. Live boundaries plus a cut produce *the same shape*, by construction.
I4's central risk is that the app must compute features exactly the way the
training data was built; matching the segmentation method removes a whole class
of distribution mismatch. It also means the report's rep count agrees with the
counter the patient watched during the session — two different rep counts in
front of a patient is a credibility failure, not a rounding difference.

Tasks:

- **I3a** Amend `session_orchestrator.js`'s `sendPose` payload to include
  `stage`, `repCount` and `repWasClean`. One line. **This is a Phase G
  omission surfacing in I** — agent 8 owns that file, so it lands as a small G
  amendment, not inside an I agent's scope.
- **I3b** Rep index becomes a groupby on `repCount` over the session `.jsonl`.
  No peak-detection algorithm in the primary path.
- **I3c** Cut the video per rep with `ffmpeg` at the recorded boundary
  timestamps, producing one clip per rep — the same unit the model was
  trained on.
- **I3d** Expose the boundaries in the report so a human can verify them.
  Unchanged from the original I3, and still required: a weak model plus
  unverifiable segmentation is not auditable.
- **I3e** Offline peak detection survives **only** as the fallback for an
  exercise with no usable `rep_trigger` values, and for isometrics, which have
  no reps at all. Do not build it until an exercise actually needs it —
  until F4 is resolved those exercises cannot be scored anyway, so segmenting
  them buys nothing.

**Prerequisites — none of these are the implementing agent's to decide:**

1. **F4 rep-trigger values** for the five non-squat exercises (enter/exit/depth
   angles). From the user. §8 stands: no agent invents them, and
   `straight_leg_raise`'s `_TODO` explicitly warns against copying
   `HIP_MAX_DEG=46` from the label editor without sign-off.
2. **The video must be reachable where the cut happens.** `recorder.js` has no
   upload and no backend route accepts video, so today the recording never
   leaves the browser while I2/I14 assume a server-side file. Either add an
   upload or segment client-side — an open decision, recorded in §9.
3. **A shared timestamp origin.** Frame `ts` is `Date.now()`; `MediaRecorder`
   runs its own clock. The recording's start wall-time must be captured to map
   one onto the other. This is M2's time-synchronisation problem arriving a
   phase early; solve it here rather than twice.
4. **Cut accuracy.** `ffmpeg -ss/-to -c copy` cuts only on keyframes, so with
   sparse keyframes the boundaries drift. Either force a short keyframe
   interval at record time (cheap, do it now) or re-encode the segments
   (exact, slower). Also remux first — `MediaRecorder` output reports
   `duration=N/A` (G-CONTINUE §5), which the decoder must tolerate.
- **I4** Stage 3: common + exercise-specific feature extraction. **Port the same
  extraction logic the external training scripts use** (common 154-col
  extractor, per-exercise extractors) — the app must compute features exactly
  the way the training data was built, or the model sees a distribution it
  never trained on. Kept in sync manually; log the extractor version alongside
  the model version at prediction time so a mismatch is at least detectable.
- **I5** Stage 4: per-rep aggregation — same min/max/mean/std/range/first/last
  scheme as training, same leak-column drops (`frame`, `timestamp_ms`,
  `person_id`, `phase_normalized`).
- **I6** `feature_builder.py` — assemble the feature row against
  `feature_names.json` from the imported model package (E1). **Reindex to that
  exact column order; never trust extraction order.** Assert the set of
  produced columns is a superset of what's required; missing columns are a
  fail-loud error, not a silent zero-fill, except where `impute_median.json`
  explicitly covers the gap.
- **I7** `model_service.py` — models loaded once at startup (R8) from
  `trained_models/<exercise>/model.joblib`, keyed by exercise. Calls only
  `.predict()` / `.predict_proba()` — **never inspects model internals,
  never assumes a specific algorithm.** This is what makes the swap in §8c
  work: the service code doesn't change when the model does.
- **I8** `explainer_service.py` — reads `model_card.json["is_tree_based"]`
  per exercise (E2). If true, build a `shap.TreeExplainer` once per model at
  startup. If false, log that explanation is unavailable for that exercise and
  skip SHAP entirely for it — **do not fall back to `KernelExplainer`
  automatically**; at your feature counts (hundreds of columns, tens of rows)
  it is too slow and too unstable to trust silently. A non-tree model needs a
  deliberate explainability decision, not an automatic one. LIME optional,
  wrapped in try/except, debug logs only, never patient-facing, and subject to
  the same tree-only gate.
- **I9** Severity: computed separately from probability. The formula comes from
  the user, not from an agent. Until supplied, report probability and label it as
  confidence, not severity.
- **I10** `report_builder.py` — template sentences from top SHAP features, with a
  technical-name → friendly-name dictionary. **Associative wording only.** SHAP
  identifies what influenced the prediction; it does not prove the patient did
  the thing. No causal claims, no clinical claims beyond the user's own wording.
- **I11** SHAP bar chart PNG per rep-level error.
- **I12** Report object matching D7's section structure.
- **I13** Save report. **Confirm the write succeeded.**
- **I14** Only after I13 confirms: delete the raw video. Not before.
- **I15** `GET /report/{session_id}` and `GET /job/{job_id}` for polling.

### PHASE J — Frontend pages

- **J1** Plain HTML/JS, no framework, unless the team already knows React.
- **J2** `ExerciseSelect` — `GET /exercises`, buttons.
- **J3** On click: `POST /session/start`, then navigate with `session_id`.
- **J4** `LiveSession` — camera, worker, canvas, WS, dev overlay.
- **J5** Confirm `pose_landmarker.task` loads in Tasks Vision JS. If the format is
  incompatible, use the standard JS Lite model and **record that thresholds tuned
  for the old model may not transfer**.
- **J6** EMG chart — reuse the charting JS from whichever `live*.html` C1
  identified as real. Do not rewrite working chart code.
- **J7** End Session button → `POST /session/end` → navigate to a Report page
  showing job progress.
- **J8** `Report` page — polls job status, renders when ready.
- **J9** Full manual end-to-end test.

### PHASE K — Ops

- **K1** `docker-compose.yml`: backend, emg-service, frontend.
- **K2** `emg_client` URL points at the compose hostname, not localhost.
- **K3** Full flow through Docker.
- **K4** Load test: simulate 3 concurrent sessions. Confirm no cross-session
  interference and that latency holds.

### PHASE L — Cleanup

- **L1** Delete `_legacy_reference/`, dead `live*.html` variants (only once C1
  confirmed them dead).
- **L2** `README.md` — run locally, run via Docker, all ports.
- **L3** `.env.example`, secrets gitignored.
- **L4** `docs/99_performance.md` — baseline vs final, measured, per §3.

---

## 6. Concurrency model, summarized

| Layer | Model | Why |
|---|---|---|
| Browser capture | Main thread | Must own the camera and canvas |
| **Video recording** | **`MediaRecorder`, browser-internal thread** | **Unreachable from your JS — a pose stall cannot touch it. Evidence outranks feedback.** |
| Browser inference | Web Worker + OffscreenCanvas | Never block paint |
| Browser frame control | `inFlight` guard, drop-if-busy | Bounded latency beats complete data, live |
| Browser → server | Batched ~500 ms, bounded buffer | Cuts message count ~15× |
| FastAPI I/O | asyncio | Many idle connections, few CPU cycles |
| FastAPI CPU work | ProcessPoolExecutor | GIL makes threads useless for MediaPipe/SHAP |
| Heavy extraction | Process per clip | MediaPipe is single-threaded per stream |
| Session buffer | Bounded deque + async flush | Never await disk inside the WS handler |
| EMG polling | Background task + circuit breaker | A dead sensor must not stall a session |
| **IMU polling** | **Separate background task + own circuit breaker** | **Third independent failure domain; never shares the EMG task or the pose worker** |

**Threads vs processes, plainly:** Python threads share a GIL, so they help only
when waiting on I/O. MediaPipe, feature extraction, model inference and SHAP are
all CPU-bound — they need *processes*. Network calls, disk writes and WebSocket
handling are I/O-bound — they need *async*. Using threads for the CPU work is the
most common way to make a Python service slower while feeling like you optimized it.

---

## 7. Testing gates

Do not advance past a phase until its gate passes.

| Phase | Gate |
|---|---|
| 0 | Baseline latency written down |
| A | Flask runs from new location |
| B | `/health` and `/metrics` respond; structured logger emits correlated JSON |
| C | FastAPI pulls a live EMG value; circuit breaker trips correctly when Flask is killed |
| D | `docs/03_legacy.md` complete and frozen |
| E | A deliberately malformed zip is rejected with a specific, correct reason; a valid zip imports and appears in `GET /admin/models/status` |
| F | `GET /exercises` returns thresholds |
| G | JS angle outputs match Python to 6 decimals; feedback latency < 100 ms; **pose worker killed mid-session leaves a complete, playable video** |
| H | Fake client drives a full session; buffer flushes; job enqueues |
| M | Calibration produces a stored transform; each of EMG/IMU/pose killed independently without affecting the other two or the recording; disagreement surfaces as a quality warning, never as a patient error |
| I | Report generates end to end; video deleted only after confirmed save |
| J | Manual end-to-end passes |
| K | Docker end-to-end passes; 3 concurrent sessions hold latency |
| L | **Delete a session's video, parquet and report; reconstruct the entire run from its logs alone** (§8b.9) |

---

## 8. Standing constraints

**On the model.** Training is external to this app entirely (Phase E, redefined
— see §8c). The current exported model is known weak: only SLR validates, and of
its labels only `hip_lifting` (F1 0.46) is an honest generalization estimate.
`knee_flexion_high` at a perfect 1.000 is unverified for label/feature
circularity. mini_squat and seated_knee_extensions scored 0.000 because every
positive for a label sat inside one recording, unlearnable under group-safe
evaluation. None of this is the app's problem to fix — the app's job is to treat
whatever `model_card.json` reports as ground truth about the model's quality, and
to surface those caveats in the report, not paper over them.

## 8c. Model swap contract

**Requirement:** replace the model with any size or architecture, provided
features and outputs stay compatible, and everything continues to work. This is
achievable, with one explicit boundary: **the explainer stays tree-based.**

**What "compatible" means, precisely** — the three things Phase E validates and
Phase I depends on:

1. **Feature contract.** The new model consumes the same `feature_names.json`
   list, in the same order, produced by the same extraction pipeline (I4-I6).
   Any model — 50 trees or 5,000, depth 3 or depth 30 — that accepts that input
   shape works without a code change.
2. **Output contract.** `.predict()` returns binary labels, `.predict_proba()`
   returns per-label probabilities. `model_service.py` (I7) calls only these two
   methods and never inspects the model's internals. This is deliberate: the
   service code is written once and does not change when the model does.
3. **Explainability contract.** `model_card.json["is_tree_based"]` (E2) gates
   `explainer_service.py` (I8). **True** → `shap.TreeExplainer`, exact and fast,
   works identically regardless of which tree ensemble (RandomForest, XGBoost,
   LightGBM, ExtraTrees, gradient boosting variants) sits underneath. **False**
   → explanation is disabled for that exercise rather than silently falling back
   to a slower, less reliable explainer. At the feature-to-row ratios this
   project runs (hundreds of columns, tens of positives), `KernelExplainer` is
   both slow and statistically shaky — auto-falling back to it would trade a
   clear "unavailable" for a quietly untrustworthy number. If you want a
   non-tree model with explanations, that is a deliberate follow-on task,
   not an automatic capability.

**What is genuinely swap-and-go, no code change required:**

- RandomForest → XGBoost → LightGBM → any other tree ensemble, any depth,
  any tree count, any number of estimators.
- Re-trained versions of the same architecture with more data, more labels,
  or fewer/pruned features (§ the EPV discussion — feature pruning will very
  likely be part of the next export regardless of algorithm).
- Per-exercise independence: SLR can run a heavier ensemble than mini_squat if
  its dataset supports it. Each exercise's `model.joblib` is validated and
  loaded independently (E3-E8).

**What requires new work, not covered by "swap the file":**

- A non-tree architecture (neural net, SVM, linear model) — the model itself
  still runs (I7's contract holds), but I8's explainer is disabled for that
  exercise until someone deliberately adds `DeepExplainer`/`GradientExplainer`/
  `KernelExplainer` support and evaluates whether it's fast and stable enough at
  your row counts.
- A model whose `predict_proba` is unavailable or unreliable (raw SVM without
  probability calibration) — I9's severity/confidence reporting depends on it.
- Latency assumptions — a much larger model may not fit the per-clip processing
  budget in I2/R9's parallel-clips-per-core design. Re-check throughput after
  any major architecture change; feature-compatible does not imply
  latency-compatible.

**Where this is enforced in the plan:** E3 (validation gate checks
`predict`/`predict_proba` exist and `is_tree_based` is present and boolean),
I7 (service never touches model internals), I8 (explainer strictly gated on
the flag). An agent that writes code assuming a specific algorithm anywhere
in I6-I8 has broken the contract — flag it in review.

**On clinical content.** No agent invents thresholds, error definitions, severity
formulas, or correction wording. Those come from the user. Where a value is
needed and absent, use a clearly-marked placeholder and flag it — never a
plausible-looking guess.

**On SHAP wording.** SHAP shows which features influenced a prediction. It does
not establish that the patient performed a specific action. Report language stays
associative. No unsupported medical claims.

**On dataset splits.** Never random frames. Never the same recording across
splits. Subject-level preferred once multiple subjects exist, recording-level as
fallback.

**On video retention.** Store temporarily, delete only after confirmed report
save. A crash between analysis and report finalization must not lose both.

---

## 8b. Logging & observability

**Requirement:** every event logged; the entire flow reconstructible from logs
alone; any fault locatable to the exact place and cause.

**What logs can and cannot give you.** Logs can make a fault *locatable and
reproducible* — which stage, which input, which decision branch, what state.
That is the achievable goal and this section delivers it. Logs cannot tell you
the fix; a fix requires understanding intent, and only a person has that. What
the design below does instead is make the diagnosis fast and certain, and attach
a remediation hint to the classes of failure that are known in advance. Do not
build a system that claims to auto-diagnose novel bugs — it will be confidently
wrong, and a confident wrong answer costs more time than no answer.

### 8b.1 Correlation identity

Every log line carries, without exception:

```
session_id       stable for the whole session
trace_id         one per pipeline run (e.g. one report job)
span_id          one per stage within a trace
parent_span_id   the calling stage
component        pose_worker | recorder | ws | emg | imu | extractor | model | shap | report
event            machine-readable, snake_case, from a closed vocabulary
ts_wall          ISO-8601 UTC, millisecond precision
ts_mono          monotonic clock reading (see below)
seq              per-component monotonic counter
level            DEBUG | INFO | WARN | ERROR | FATAL
```

`session_id` + `trace_id` is what makes the flow reconstructible. Without a
correlation ID you have a pile of lines, not a trace.

**Two clocks, deliberately.** Wall time can jump — NTP corrections, DST,
suspend/resume. A monotonic reading never goes backwards. Log both: wall time for
human reading and cross-machine correlation, monotonic for computing durations.
Any duration derived from wall-clock deltas is unreliable.

### 8b.2 Structured, not prose

One JSON object per line. Never a formatted sentence with values interpolated
into it — those cannot be filtered, aggregated, or diffed. Every value that might
ever be queried is its own field.

```json
{"ts_wall":"2026-08-20T14:03:11.482Z","ts_mono":918273.44,"seq":1841,
 "session_id":"s_9f3a","trace_id":"t_44b1","span_id":"sp_07","parent_span_id":"sp_03",
 "component":"pose_worker","event":"frame_dropped","level":"WARN",
 "reason":"inference_in_flight","frames_dropped_total":37,"inference_ms":58.2}
```

### 8b.3 Closed event vocabulary

Events come from a fixed list defined in one file (`backend/app/events.py`, and a
mirrored JS constant file). Free-text event names drift, get misspelled, and
break every query written against them. Minimum set per component:

- **session**: `session_started`, `session_ended`, `session_aborted`
- **recorder**: `recording_started`, `chunk_written`, `recording_stopped`,
  `recording_failed`
- **pose_worker**: `worker_ready`, `frame_received`, `inference_completed`,
  `frame_dropped`, `rule_evaluated`, `flag_raised`, `worker_died`
- **ws**: `ws_connected`, `batch_sent`, `batch_received`, `backpressure_drop`,
  `ws_disconnected`
- **emg / imu**: `poll_ok`, `poll_timeout`, `circuit_opened`, `circuit_closed`,
  `calibration_started`, `calibration_completed`, `calibration_failed`
- **crosscheck**: `agreement_computed`, `disagreement_flagged`
- **extractor**: `clip_started`, `clip_completed`, `clip_failed`,
  `landmark_gap_detected`
- **model**: `model_loaded`, `feature_row_built`, `schema_mismatch`,
  `prediction_made`
- **shap / report**: `explanation_computed`, `report_assembled`, `report_saved`,
  `video_deleted`

### 8b.4 Reproducibility, and what it actually requires

Reconstructing a run needs three things beyond the event stream:

1. **Inputs, addressed not embedded.** Log a content hash and a path for each
   input artifact (video, parquet, model bundle). Never log the data itself.
2. **Versions.** At every `session_started` and every job start, log: git commit
   SHA, model bundle version and its `model_card` hash, MediaPipe model
   identifier (Lite vs Heavy, version), Python and key library versions, browser
   and OS user-agent. A bug you cannot tie to a code version is a bug you will
   re-investigate later.
3. **Decision inputs, not just outcomes.** When a rule fires, log the computed
   angle, the threshold it was compared against, and the exercise config version
   that supplied the threshold — not merely `flag_raised`. The outcome alone
   tells you *that* it happened; the inputs tell you *why*, which is the whole
   question.

**Determinism seeds.** Log the random seed for any stochastic step (model
training, sampling). A run you cannot repeat is not reproducible regardless of
how well it was logged.

### 8b.5 Errors carry context, always

Every ERROR and FATAL line includes:

```
error_type       exception class or error code
error_message    the message
stack            full traceback / JS stack
inputs_hash      hash of the inputs to this stage
stage_state      the small dict of local state that mattered
retry_count      if applicable
remediation      short hint — for known failure classes only
```

`remediation` is populated **only** for failures enumerated in advance:
`schema_mismatch` → "model bundle feature_names differ from feature_builder
output; compare and re-export"; `circuit_opened` → "sensor unreachable 3×; check
serial connection and Flask service"; `calibration_failed` → "transform could not
be computed; re-run calibration pose". For anything unanticipated, the field is
absent. Do not have a model generate a remediation string at runtime — a fluent
guess is worse than silence.

### 8b.6 Logging must not become the lag

The performance rules in §3 apply to logging itself:

- **Never log synchronously in the live loop.** Append to a bounded ring buffer;
  a separate task drains it. A blocking write inside the pose worker is exactly
  the interference §3 exists to prevent.
- **Sample high-frequency events.** `frame_received` at 30 fps is 108,000 lines
  an hour of no diagnostic value. Log every Nth frame plus every anomaly, and
  always log counters (`frames_total`, `frames_dropped`) rather than one line per
  frame. Anomalies are never sampled — every drop, every flag, every error.
- **Log level per component, runtime-adjustable.** DEBUG on the pose worker while
  investigating; INFO everywhere else.
- **Bounded disk use.** Rotate by size and age. A logger that fills the disk takes
  the session down with it.

### 8b.7 Privacy — this is patient data

Landmark coordinates are biometric data about a real person, and the plan already
commits to deleting raw video after report finalization. Logs must not quietly
become the copy of that data that outlives the video.

- Never log raw landmark arrays at INFO. Derived scalars (angles, counts,
  confidences) are fine; full coordinate dumps belong at DEBUG, off by default,
  and inside the session's retention window.
- Never log patient identifiers in plain text. Log `patient_ref` — an opaque ID
  resolvable only through the database.
- Apply the same retention policy to DEBUG logs as to video. If the video is
  deleted at report finalization, a DEBUG log containing full landmark streams
  must be deleted with it or the deletion policy is fiction.
- `video_deleted` is itself a logged event, with the confirmation that the report
  save succeeded first. That log line is the audit trail for the retention
  commitment.

### 8b.8 Tasks

Insert into the phases as follows:

- **B7** `backend/app/logging_setup.py` — structured JSON logger, correlation-ID
  context (`contextvars`), dual clocks, rotation. Built in Phase B so every later
  component logs correctly from its first line rather than being retrofitted.
- **B8** `backend/app/events.py` — the closed event vocabulary. Mirrored to
  `frontend/src/lib/events.js`.
- **G14** Browser-side logger: same schema, ring-buffered, shipped to the server
  in the existing batched WS messages. Browser logs and server logs land in one
  stream with one correlation ID — otherwise you are debugging two systems.
- **I16** Job-level trace: every pipeline stage opens a span, logs its inputs
  hash and duration, closes it. A failed report tells you which stage, on which
  input, with what state.
- **L5** `docs/05_logging.md` — the event vocabulary, one worked example of a full
  session trace, and the queries to run for the common questions ("why did this
  rep get flagged", "why is this session slow", "why did this report fail").
- **L6** **Replay tool.** `tools/replay_session.py` — takes a `session_id`,
  reads the log stream, and reconstructs the ordered sequence of events with
  timings and decision inputs. This is the thing that makes "reproducible from
  logs" true rather than aspirational. Without it you have logs; with it you have
  a trace you can actually walk.

### 8b.9 Gate

Phase L does not pass until this test does: **pick a session, delete everything
except its logs, and reconstruct from the logs alone** — which exercise, how many
reps, which flags fired and on what angle values against what thresholds, which
model version predicted what, where every stage's time went, and what the final
report said. If any of that is missing, the logging is incomplete and the gap is
found now rather than during a real incident.

---

## 9. Known gaps, tracked

- ~~**Rep segmentation for live sessions (I3).** The training pipeline assumes
  hand-cut reps. Production gets continuous video. This is real, unbuilt work,
  not a detail.~~ **SUPERSEDED 2026-08-27** — see §I3-revised. The rep state
  machine already exists and runs live (`pose_engine.js`); segmentation is now
  recording its boundaries plus an `ffmpeg` cut, not an algorithm. What remains
  open is F4's rep-trigger values: five of six exercises hold `{"value": null}`,
  and a null trigger means no reps are counted or recorded for that exercise.
- **Paired pose+EMG training data does not exist.** Model v1 is pose-only. EMG
  stays a live display and a rep-validity pre-filter joined on timestamp — not a
  fused model feature. Retrain when paired data exists.
- **`pose_landmarker.task` browser compatibility unconfirmed** (J5). If it
  differs from the Python model, thresholds tuned on the old one may not transfer.
- **Lite vs Heavy landmark agreement unmeasured.** Live rules use Lite; training
  used Heavy. If they disagree materially, live flags and post-session findings
  will contradict each other in front of the patient. Measure this: run both on
  the same clip, compare angle outputs.
- **Isometric exercises have no trained error model.** Rule-based only until data
  exists.
- **Class imbalance remediation undecided.** Measured, not yet addressed.
  §E-DEC.7 proposes carrying per-label decision thresholds inside the model
  package as part of the answer — **but that proposal was not understood by the
  owner and is explicitly unsettled.** Raise it again rather than implementing
  against it as though it were agreed.
- **Video never reaches the server.** `recorder.js` has no upload and no backend
  route accepts video, yet I2 re-extracts "from the stored video" and I14
  deletes it. No phase owns the upload — not G, not H, not I. Either add an
  upload step or segment client-side; it also gates I3c's `ffmpeg` cut. Open
  decision, added 2026-08-27.
- **IMU sensor count undecided (M).** One IMU gives one segment's orientation; a
  joint angle needs two. Thigh-only cannot produce knee angle during a squat.
  Decide before wiring.
- **IMU yaw drift is unfixable with a 6-axis part.** Sagittal-plane angles are
  usable; vertical-axis rotation is not, absent an added reference. Design around
  it rather than discovering it in data.
- **Calibration pose not specified.** M1 needs a defined static pose from the
  user. An agent must not invent one.
- **IMU arrival date vs recording day.** If the sensor lands first, capture IMU
  on every clip — retrofitting means reshooting. Confirm the delivery date before
  locking the shoot.

---

## 10. Subagent map

Strict file ownership. No two agents write the same file. Each finishes with a
notes file in `docs/`.

**Model tier is assigned per agent, not per project.** The rule: match the model
to the hardest decision the agent must make, not to how much text it produces.
Copying files and reading routes is mechanical — a small model does it as well as
a large one, faster and cheaper. Designing a concurrency model or auditing label
circularity is not mechanical, and a cheap model failing there costs far more
than the tokens it saved.

Tiers used below:

| Tier | Use for |
|---|---|
| **Haiku** | Mechanical work: file moves, folder creation, boilerplate, config files, reading and listing what exists |
| **Sonnet (low effort)** | Straightforward implementation against a clear spec: porting a known formula, wiring an endpoint, standard CRUD |
| **Sonnet (default)** | Implementation requiring judgment: worker architecture, buffering, feature pipelines |
| **Sonnet (high effort) / Opus** | Only where a wrong call is expensive and hard to detect later — see the four exceptions listed after the table |

| # | Agent | Model | Owns (writes) | Reads | Phase | Must not touch |
|---|---|---|---|---|---|---|
| 1 | **baseline-agent** | Haiku | `docs/00_baseline.md` | Running app | 0 | Any code |
| 2 | **repo-setup-agent** | Haiku | Folder structure, `.gitignore`, `docs/01_repo.md` | — | A | Service logic |
| 3 | **emg-integration-agent** | Sonnet low → Haiku for C8 | `emg-service/*` (minimal), `emg_client.py`, `docs/02_emg_routes.md` | Flask source | C | Frontend, ML |
| 4 | **legacy-inspector-agent** | **Sonnet default** | `docs/03_legacy.md` **only** | Old physio source | D | Any implementation file |
| 5 | **backend-core-agent** | Sonnet low | `main.py`, `telemetry.py`, `routes/`, `exercises/`, `exercise_config.py` | `docs/03` | B, F, H4–H6 | ML internals, frontend |
| 6 | **model-ingestion-agent** | Sonnet default; **high for E3** | `backend/ml/validate_model_package.py`, `trained_models/` handling | `docs/03` | E | Live backend, frontend, training scripts (external, not this repo) |
| 7 | **realtime-backend-agent** | Sonnet default | `ws/session_ws.py`, `session_buffer.py` | `docs/03` | H1–H3, H7 | Report logic, frontend |
| 8 | **live-frontend-agent** | Sonnet default; **high for G5/G12** | `frontend/src/workers/`, `lib/`, `render/`, `ws/` | `docs/03` | G | Python, report pages |
| 9 | **sensor-fusion-agent** | **Sonnet high for M1/M2**; default for the rest | `imu_client.py`, `services/crosscheck.py`, `lib/agreement.js`, `docs/04_fusion.md` | `docs/02`, `docs/03`, IMU firmware | M | Pose worker internals (agent 8 owns), report assembly (agent 10 owns) |
| 10 | **explainability-agent** | Sonnet default; **high for I10** | `feature_builder.py`, `model_service.py`, `explainer_service.py`, `report_builder.py`, `job_queue.py` | model bundle, `docs/03`, `docs/04` | I | WS transport, frontend |
| 11 | **frontend-pages-agent** | Sonnet low | `frontend/src/pages/` | Backend routes | J | Worker/lib files (agent 8 owns those) |
| 12 | **devops-agent** | Haiku → Sonnet low for K4 | `docker-compose.yml`, `Dockerfile`, `README.md`, `.env.example` | — | K, L | App logic |

**The only four places worth spending on a high-effort model.** Each is a
decision that is cheap to get wrong and expensive to discover later:

1. **E3 — model package validation.** A validation gate that passes a malformed
   or subtly wrong package (mismatched feature order, missing `is_tree_based`)
   fails silently downstream, at prediction time, with no clear error pointing
   back to the actual cause.
2. **G5 + G12 — worker architecture and recording isolation.** Get the isolation
   boundary wrong and you lose session evidence. Not recoverable after the fact.
3. **M1 + M2 — calibration transform and time sync.** Wrong here and every
   subsequent cross-check produces plausible-looking garbage. Frame mismatch and
   clock skew both masquerade as real disagreement.
4. **I10 — report wording.** SHAP output turned into patient-facing sentences.
   The constraint is associative-not-causal language and no unsupported clinical
   claims. A cheap model will write a fluent sentence that overstates what SHAP
   established.

Everything else runs on Haiku or low-effort Sonnet. Opus is not needed anywhere
in this plan; if an agent seems to require it, the task is underspecified — split
it rather than escalating the model.

**Cost note.** Agents 1, 2 and 12 are the bulk of the file operations and the
least of the thinking. Running them on Haiku costs a fraction of a default-tier
run and produces identical output, because "create a folder and move a project
into it" has one correct answer.

**Ownership note for M.** The IMU live agreement check (M4) runs client-side but
is written by the sensor-fusion agent as a standalone `lib/agreement.js` module.
The live-frontend agent imports it into the pose worker; it does not write it.
One module, one owner, imported across the boundary.

### Run order

```
1. baseline-agent            [Haiku]        (alone — measure before changing anything)
2. repo-setup-agent          [Haiku]        (alone — everything depends on structure)
3. PARALLEL: emg-integration-agent [Sonnet low] | legacy-inspector-agent [Sonnet]
             | backend-core-agent [Sonnet low, B only]
4. GATE: docs/03_legacy.md complete and FROZEN
5. PARALLEL: model-ingestion-agent [Sonnet, high for E3]
             | live-frontend-agent [Sonnet, high for G5/G12]
             | realtime-backend-agent [Sonnet]
6. backend-core-agent        [Sonnet low]   (F, H4-H6 — needs exercise structure from docs/03)
7. sensor-fusion-agent       [Sonnet high for M1/M2, default rest]
                                            (M — needs the live path and EMG client to exist)
8. explainability-agent      [Sonnet, high for I10]
                                            (needs a trained model bundle from step 5, and
                                             docs/04_fusion.md for the cross-check features)
9. frontend-pages-agent      [Sonnet low]   (needs stable backend routes)
10. devops-agent             [Haiku]        (last)
```

The gate at step 4 matters. In the previous plan the legacy inspector fed three
downstream agents while still writing — they were building against a moving
target. Freeze the notes file first.

---

## 11. Per-agent brief template

Give each agent exactly this, filled in. Nothing more, nothing less.

```
ROLE: <agent name>
MODEL: <tier from §10 — do not escalate without saying why in your notes>
PHASE: <phase letter>
TASKS: <atomic task IDs from §5, verbatim>

READ FIRST:
  - This document, sections 2 (locked decisions), 3 (performance), 8 (constraints)
  - <specific docs/ notes files this agent depends on>

OWN (you may write these paths):
  - <exact paths>

DO NOT TOUCH:
  - Every path not listed above. Another agent owns it.

PERFORMANCE RULES THAT BIND YOU:
  - <the specific R-numbers from §3.2 that apply>

DEFINITION OF DONE:
  - <the gate from §7 for this phase>
  - Notes file written to docs/<nn>_<name>.md covering: what you built, exact
    file paths, any deviation from this plan and why, anything the next agent
    needs to know.

CONSTRAINTS:
  - Do not invent clinical thresholds, error definitions, or correction wording.
    If a value is needed and absent, use a clearly-marked placeholder and flag it.
  - Do not optimize without measuring. Cite docs/00_baseline.md.
  - Do not widen your scope. If a task seems to need a file you do not own,
    stop and write it in your notes instead.
  - Log every event you introduce using the shared logger and the event
    vocabulary in backend/app/events.py (§8b). Adding a new event name means
    adding it to that file, not inventing one inline. Log decision INPUTS, not
    just outcomes — the threshold and the measured value, not merely that a flag
    fired.
```

---

## 12. Order of attack, if you only do three things

1. **Phase 0 + G5 (Web Worker with drop-if-busy).** This is where the lag lives.
   Nothing else you do will be as noticeable to a user.
2. **R4 (client-side rules).** Removes the network entirely from the feedback
   loop. Large win, moderate effort, no new dependencies.
3. **E3 (model package validation gate).** Training happens outside this repo
   now; the one thing the app must get right is refusing a malformed or
   contract-violating package with a specific reason, rather than loading it
   and failing mysteriously three phases downstream at prediction time.

**And one thing that is time-critical rather than important:** decide the IMU
sensor count and whether it arrives before the recording day. Everything else on
this list can be done at any point. That one closes permanently when you start
filming.

---

## 13. Future scope — deliberately deferred, not forgotten

Things the owner wants but that are **out of scope for the current build**.
Recorded so they are designed *around* rather than rediscovered late. Nothing
here is scheduled; nothing here blocks any phase.

### 13.1 Dual pose-only / pose+IMU models per exercise

**What:** train two models per exercise — one on pose features alone, one on
pose+IMU — and let the app pick whichever matches what the session actually
recorded.

**Why deferred:** E-DEC.2 handles the missing-sensor case correctly today by
declining to score, which is honest and costs nothing. Dual models are strictly
better for *availability* — a session without an IMU still gets analysed — but
they double the training work for models that do not exist yet, on a dataset
not yet recorded. Premature until there is IMU-paired data worth training on.

**Revisit when:** the recording day has produced enough IMU-paired clips that a
pose+IMU model measurably beats the pose-only one. Until then a single declared
`data_sources` per model is the right amount of machinery.

**Designed around it:** `data_sources` (E2) already makes a model's
requirements explicit and per-exercise, so adding a second variant later is a
registry change, not a contract change.

### 13.2 Admin panel with in-repo model training

**What:** a UI from which the owner can manage datasets, edit labels, trigger
training, and promote a resulting model to live.

**Status: deferred, and it reverses a locked decision** — record that clearly
before building it. §0 and Phase E both state that training happens externally
and that "no training code, no `train_model.py`, no GroupKFold, no aggregation
logic lives here anymore." An in-app trainer undoes that split deliberately,
which is the owner's call to make, but it should be made as a decision rather
than arrived at by drift.

**What already exists to build on:** the external training folder holds a
complete offline pipeline (`train_models.py`, `aggregate_features.py`,
`run_landmark_pipeline.py`, `extract_landmarks.py`, the per-exercise feature
extractors, and the label editors). A panel would orchestrate those scripts
rather than reimplement them.

**Constraints it must respect when it is built:**

- Training is CPU-bound and long-running: `ProcessPoolExecutor`, never the
  event loop (R7). It must not be able to stall a live session — the same
  failure-domain isolation R11 applies to sensors applies here.
- A model trained in-panel goes through **the same E3 gate** as an uploaded
  one. No bypass. A panel that can promote an unvalidated model is a hole in
  the contract, not a convenience.
- The label editor is where E-DEC.5's rule matters most: if a labelling screen
  shows the auto-computed flag or the raw angle beside the clip, it reintroduces
  the exact circularity that made the first model's CV numbers meaningless.
- It is an admin surface over patient data and model promotion. Authentication
  is not optional.

**Revisit when:** the post-recording retrain is done and the external
scripts have stabilised. Building a UI over a pipeline still changing shape
means rebuilding the UI.

### 13.3 Non-tree models with explanations

Already covered by §8c: a non-tree architecture runs fine under I7's contract,
but I8 disables explanation for it rather than silently falling back to
`KernelExplainer`. Adding `DeepExplainer`/`GradientExplainer` support, and
evaluating whether it is fast and stable enough at these row counts, is a
deliberate follow-on task. Listed here so it is not mistaken for a gap.

---

## 14. Software testing

**Added 2026-09-03, at the owner's instruction.** Nothing above is amended.
§7's phase gates stay exactly as they are — one gate per phase, the condition
that lets the build advance. This section is the *other* axis: standing
coverage of every aspect of the code, organised so it can be produced and
re-run by agents without any one of them holding the whole system in its head.

**Why it is organised as departments rather than as one big suite.** A single
agent asked to "test the codebase" writes shallow tests everywhere and deep
tests nowhere, and it grades its own work. Splitting by department gives each
agent a surface small enough to test exhaustively, and — because a department
agent is told about its department and nothing else — it cannot quietly widen
its scope, cannot re-test what another department owns, and cannot excuse a
failure by appealing to context it was never given.

### 14.1 The three levels

```
department  -> a bounded slice of the code, one owning agent, one report
  phase     -> the fixed five-step flow every department runs (14.4)
    case    -> one atomic, independently-failing assertion, one id
```

**Atomic** means: a case fails for exactly one reason, and its id names that
reason. A case that can fail three ways is three cases. A case that cannot
fail is not a case — delete it.

### 14.2 graphify is the map — and what the map actually contains

The department surfaces below name directories and files, but the authoritative
inventory is the knowledge graph in `graphify-out/`. Every department begins by
querying it for the nodes inside its surface, and tests what the graph says is
there rather than what this document remembered on the day it was written.

**Refresh before use.** `/graphify update` runs first, always. A department that
plans coverage against a stale graph tests the repo as it was, which is the same
failure as testing from a summary. Last refresh: **2026-09-03** — 2,496 nodes,
5,029 edges, 167 communities, graph health OK apart from one self-loop edge.

Two rules follow:

- **The graph, not the file list, decides coverage.** A symbol that exists in
  the graph inside a department's surface and has no case is a coverage gap,
  and a coverage gap is a defect row like any other.
- **Nodes claimed by no department are a defect against this section**, not
  against the code — *once the exclusions below are applied*.

#### 14.2a The graph is mostly not our code — exclude before counting

Measured on the 2026-09-03 graph, and this is the single most important fact
for anyone planning coverage from it:

| Area | Nodes | In scope? |
|---|---|---|
| `frontend/src/assets/vendor/**` (MediaPipe bundle + wasm) | 811 | **No** — vendored third party |
| `frontend/src/vendor/**` (Tailwind, fonts) | 570 | **No** — vendored third party |
| `backend/_old_physio_reference/**` (incl. `superseded_app_copies/`) | ~80 | **No** — frozen legacy reference, deleted in L1 |
| Everything else — the code this project wrote | ~1,035 | **Yes** |

**55% of the graph is vendored library code.** Applied naively, 14.2's
unclaimed-node rule would open roughly 1,400 defect rows against MediaPipe and
Tailwind. So: **vendored and legacy nodes are out of scope by definition, not
by a department's judgement.** They are excluded from coverage counts, from
defect rows, and from every department's surface. Only our own code is tested;
a bug in a vendored artifact is an upgrade decision, not a test case.

**Corollary — god-node ranking is unusable unfiltered.** The graph's ten
most-connected nodes are all minified vendor symbols (`push()`, `add()`,
`n()`, `e()`, `m()`…). A department that prioritises by connectivity without
filtering vendor paths first will aim its entire budget at Tailwind's
internals. Filter to project paths, then rank.

**Test code is in the graph too.** `backend/tools/`, `frontend/tools/` and
`frontend/tests/` appear as nodes (the §7 gate harnesses among them). They are
in scope as *evidence*, not as targets: a department cites a harness that
already covers a behaviour (14.7) and may report it broken, but writing tests
for the test harnesses is not a department's job.

### 14.3 The department register

Owning agent is from §10 and is used for **defect attribution** — the person or
agent who must fix what a case found. It is never the agent that writes the
tests.

| Dept | Surface | Owning agent (§10) |
|---|---|---|
| **T1 — Geometry & rules** | `frontend/src/lib/{angles,landmarks,rules,smoother,ring_buffer,pose_engine}.js`, the JS↔Python parity harness | 8 live-frontend |
| **T2 — Live worker & recording** | `frontend/src/workers/pose_worker.js`, `lib/{recorder,session_orchestrator,audio_cues}.js`, `render/skeleton.js`, `pages/live_session.html` | 8 live-frontend |
| **T3 — Transport & buffering** | `frontend/src/ws/client.js`, `backend/app/ws/session_ws.py`, `backend/app/services/session_buffer.py` | 7 realtime-backend (JS half: 8) |
| **T4 — Backend core API** | `backend/app/main.py`, `routes/{session,exercises}.py`, `exercise_config.py`, `telemetry.py`, CORS | 5 backend-core |
| **T5 — EMG integration** | `backend/app/services/emg_client.py`, `emg-service/backend/app.py` routes | 3 emg-integration |
| **T6 — Model ingestion** | `backend/ml/validate_model_package.py`, `routes/admin_models.py`, registry + rollback | 6 model-ingestion |
| **T7 — Observability & privacy** | `backend/app/{logging_setup,telemetry,events}.py`, `frontend/src/lib/{events,logger}.js` mirror, §8b.4–8b.7, the L6 replay tool | 5 backend-core |
| **T8 — Frontend pages** | `frontend/app/src/pages/`, the DOM contract, offline/no-CDN guarantee, E-DEC.6 panel split | 11 frontend-pages |
| **T9 — Ops & runtime** | `docker-compose.yml`, the three Dockerfiles, concurrency, latency, restart behaviour | 12 devops |
| **T10 — Offline ML pipeline** | `backend/ml/` extractors, aggregation, feature-order agreement with the training scripts | 6 model-ingestion |
| **T11 — Post-session analysis** | Phase I: `job_queue`, `feature_builder`, `model_service`, `explainer_service`, `report_builder` | 10 explainability |
| **T12 — Sensor fusion** | Phase M: `imu_client`, `crosscheck.py`, `lib/agreement.js`, calibration, time sync | 9 sensor-fusion |

**Surface completeness, checked against the 2026-09-03 graph.** Every project
node (the ~1,035 left after 14.2a's exclusions) falls inside exactly one
department. If a later `/graphify update` produces a project node that matches
no surface, that is a defect against this register — widen a surface here
rather than letting a department improvise one.

T11 and T12 stay **dormant** until their phases exist. A department whose
surface is unbuilt reports one row saying so and spins no agent — an empty
suite that reports green is the silent-success shape §8b exists to prevent.

### 14.4 The flow, per department

Fixed, and in this order. No step runs early.

1. **Surface inventory.** Query `graphify-out/` for the department's nodes.
   Write the inventory down first; it is what the report's coverage claim is
   measured against.
2. **Case design.** Enumerate cases from the inventory: id, target, the single
   behaviour asserted, and the failure it would catch. Design before code —
   cases written while writing tests describe the code that exists rather than
   the behaviour that was wanted.
3. **Authoring.** Write the tests. **RED first** — every case must be observed
   failing against a deliberately broken input or a stubbed-out target before
   it is trusted; a case that has never been seen to fail is testing nothing
   (§7's own precedent: a harness grepped for the word "FAIL" once and was
   reported as a result).
4. **Execution.** Only now run the suite. One run, recorded verbatim.
5. **Report.** The two tables of §14.6. The department is done when the report
   exists — not when the suite is green. A red suite with an accurate defect
   table is a successful department run.

### 14.5 Agent rules

- **One Sonnet subagent per department.** Testing agents are a **separate
  population** from §10's build agents: a build agent never writes the tests
  its own code is graded against, and a testing agent never implements.
- **The brief carries that department and nothing else** — its surface, its
  rules, its constraints, the report format. Not the other departments, not
  the rest of this plan. If an agent needs something it was not given, it
  says so in its report; it does not go looking.
- **A testing agent writes only test files**, under its department's test
  paths, following the existing convention (§7's shape: `test_*.py` beside the
  source with a `__main__` self-check, JS under `frontend/tests/` or
  `frontend/tools/`; no new frameworks).
- **A testing agent never fixes a defect.** Not the source, not another
  department's tests, not the case itself. It records the failure and names
  the owning agent. Relaxing a case to go green is the one unrecoverable
  error here.
- **No agent grades its own department twice.** A re-run after a fix is a
  fresh run of the same suite, not a rewrite of it.

### 14.6 The report — two tables, always both

Written to `docs/testing/<dept>.md`, and summarised in
`docs/testing/INDEX.md`.

**Table 1 — working as expected.** Every case that passed.

| Case ID | Target | Behaviour asserted | Evidence |
|---|---|---|---|
| `T4.C07` | `POST /session/end` | second call returns the first `job_id` | run output line, verbatim |

**Table 2 — defect tracking.** Every case that failed, plus every coverage gap
from 14.2.

| Case ID | Target | Expected | Actual | Severity | Responsible agent (§10) | Plan ref |
|---|---|---|---|---|---|---|
| `T5.C03` | `emg_client` breaker | one trial call after cooldown | all concurrent callers pass | major | 3 emg-integration | §6 finding 4 |

Rules for table 2: **Actual** is observed output, never a hypothesis.
**Responsible agent** comes from the register in 14.3, and a defect that
crosses two departments is filed against the agent that owns the *code*, not
the caller. **Plan ref** points at the section or task the behaviour was
promised in; a defect with no plan ref is either a defect in this plan or an
invented requirement, and saying which is part of the finding.

### 14.7 Efficient, not merely extensive

Coverage is judged by failures caught, not by case count.

- One case per independently-failing behaviour. Splitting further inflates the
  count and hides the signal.
- Prefer one check against a real artefact over five against mocks — this
  repo's worst bugs (duplicate evidence frames, the dead audio map, missing
  CORS) all passed mocked assertions.
- A behaviour already gated by §7 is **cited, not duplicated**. The department
  references the gate and moves on.
- High-frequency loops are sampled, anomalies never are (§8b.6, same rule).
- **Test the silent failures first.** Every defect class this project has
  actually hit — a no-op code path, an unvalidated event name, a hardcoded
  count, an assertion on an invented identifier, a default argument bound at
  import — is a case that must exist in whichever department owns it. See
  `docs/PROJECT-STATUS.md` §3 for the list; it is a test checklist, not a
  history.

---

## 15. Real EMG work done

**Appended 2026-09-21.** A record of EMG integration that is actually built and
verified, as opposed to planned. Everything here was run and its output checked;
nothing in this section is aspirational. Detail and evidence live in
`docs/13-findings-and-progress.md`; decisions live in
`docs/12_emg_v3_integration_decisions.md` (which wins on any conflict).

### 15.1 What is done

| Area | State | Evidence |
|---|---|---|
| EMG service runs inside compose | **Done** | Six services up; `emg-service` serving on `0.0.0.0:5000` |
| Recordings survive a rebuild (O1) | **Done** | Two `up --build` cycles with a `down` between; 28 files md5-identical, `history.json` intact |
| `EMG_DATA_DIR` honoured | **Done** | `DATA_DIR = /srv/data` confirmed inside the running container |
| UDP ingest, real band | **DONE — O2 met 2026-09-21** | `udp_active: true`, packets every ~10ms, MPU calibration ingested (`mpu_ok: true`) |
| Full capture through the band | **DONE** | 6s capture: 3020 samples @ 500Hz, zero loss, carrying `patient_user_id` + `session_id` |
| EMG visible in patient/doctor profile | **DONE, temporarily and unscoped** | iframes of the Flask pages via nginx `/emg/` (S21) — not the scoped design |
| New recordings attributable to a patient/session | **Done** | `patient_user_id` + `session_id` reach the `history.json` entry |
| Engine can start/stop a capture | **Done** | `emg_client.start_capture` / `stop_capture`, wired into session start/end |

### 15.2 Code that changed

- **`emg-service/backend/app.py`** — `DATA_DIR` now reads `EMG_DATA_DIR`,
  defaulting to the previous hardcoded value, so `BIN_FILE` and `HISTORY_FILE`
  follow it. `/api/start_capture` accepts optional `patient_user_id` and
  `session_id`, held in per-capture globals reset on every start and written into
  the finalised `history.json` entry only when non-None. A bodyless POST still
  succeeds, which keeps `website/live.html` working.
- **`backend/app/services/emg_client.py`** — was GET-only. Added `start_capture`
  and `stop_capture`, reusing the existing circuit breaker, 2.0 s timeout, never
  raising.
- **`backend/app/routes/session.py`** — both calls dispatched via
  `asyncio.create_task`, alongside `generate_report`. Patient id comes from the
  JWT only (D12). `stop_capture` is hooked in `end_session()` rather than the
  `/session/end` route, because the WS end frame and the abrupt-disconnect
  handler also end sessions and the route would miss them.
- **`emg-service/Dockerfile`** — `COPY run.py .` removed (the file did not exist
  in the source project, and the HEAD version was a serial-era shim referencing a
  function v3 no longer has). Runs `backend/app.py` directly, which already binds
  `0.0.0.0:5000` and starts UDP ingest.
- **`docker-compose.yml`** — `EMG_DATA_DIR=/srv/data`, a `./emg-service/data`
  bind mount, and published `8888/udp`. TCP 5000 stays unpublished (D27).

### 15.2b What is demo-only and must be reworked immediately

Six changes exist **only** for the 2026-09-22 presentation. Each carries a
`D29 TEMPORARY` comment in the code. The full ledger, with the revert procedure,
is section A/B/C at the top of `docs/13-findings-and-progress.md`.

1. nginx `location /emg/` exposing the Flask EMG service (`nginx/default.conf`)
2. `limit_except GET { deny all; }` inside it — blocks the write paths
3. `127.0.0.1:5000:5000` in `docker-compose.yml` (D29's stated expiry condition)
4. EMG iframe block in the patient view (`ExercisePlan.jsx`)
5. EMG iframe block in the doctor view (`PatientResearch.jsx`)
6. `patient_user_id` hand-stamped into 9 `history.json` entries
7. EMG iframes hardcoded to `http://127.0.0.1:5000/...` (docs/13 F4)
8. `emg-service` container runs as root; new recordings are `root:root` (security.md S22)

Items 1-5 are a stopgap for one evening: the pages they expose are unscoped (S12)
and unauthenticated (S2), and nginx listens on `0.0.0.0:80`. They are acceptable
**only** because every recording in the demo dataset belongs to one real person.
The permanent replacement is §7.2 of doc 12 — engine proxy endpoints plus scoped
React views — which retires D29 and closes S12 and S21 together.

Everything else added during this work is permanent and needs no reverting: the
`EMG_DATA_DIR` fix, recording attribution, the engine's EMG write path, the
session-lifecycle wiring, the pre-session calibration gate, the four test files,
the `_spawn` strong-ref fix for fire-and-forget tasks (docs/13 F3 — this is what
made "End Session" reliably stop the recording), and the test-suite
`EMG_SERVICE_URL` guard (docs/13 F2).

### 15.3 Corrections to this document

- **§2 "EMG storage: `history.json` + `.bin` files"** is out of date. v3 writes
  `.csv.gz` with metrics baked into the preamble. The 15 `.bin` files in `data/`
  are legacy; the 11 `.csv.gz` are current.
- **§2 "EMG service stays Flask, own process, own port"** holds, with D27's
  addition: the port is internal to the compose network and is **never** published
  to the host or exposed through nginx.
- **Phase C is superseded** by the phase plan in `docs/13_demo_execution_plan.md`
  for R4 purposes. C5's "add exactly one JSON route" was resolved differently —
  the read routes already existed; what was missing was the **write** path
  (capture start/stop from the engine), which is what got built.

### 15.4 What is NOT done

- **Scoped EMG views.** The patient and doctor profiles show EMG through iframes
  of the unscoped Flask pages, exposed at nginx `/emg/` (read-only). Every
  viewer sees every recording. Deliberate and temporary — see `docs/security.md`
  S21 for the revert list. The permanent replacement is §7.2 of doc 12.
- **Server-side exercise gating.** A patient can still start an exercise nobody
  assigned them; the doctor-approval property (D7) is displayed, not enforced.
  See `docs/security.md` S18 — the fix is designed and costed, not built.
- **D20 enforcement.** `mini_squat` and `seated_knee_extension` are now marked
  `primary_branch: "both"`, but nothing reads that field. No band requirement is
  enforced anywhere, and `seated_knee_extension` has no D19 placement recorded.
- **Live EMG viewing is dropped** by D2 and is not coming back. Note that
  `website/live.html` is nevertheless **retained**: it is the only UI that can
  start, stop or recalibrate a capture, and `index.html` redirects to it. See
  `docs/13-findings-and-progress.md` F1 before deleting it.
- **Sensor fusion (§15 / Phase M)** — no live EMG↔pose cross-check, no per-rep
  EMG summary in the report, no IMU cross-check. None of M1–M8 is built.
- **Band dropout detection (D21) and clock sync (D18)** do not exist.
- **One global capture slot.** Two concurrent patients would overwrite each
  other's ids. Single-band demo only.
- **EMG failure is invisible to the client.** A session can complete normally with
  no recording behind it and nothing reports it.
- The 11 existing demo recordings carry no `patient_user_id` — D31 keeps this to
  new recordings; back-stamping is the owner's, done separately.

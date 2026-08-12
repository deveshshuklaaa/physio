# Physio + EMG Merge — Full Plan

Read whole doc before touch code. Steps small on purpose — dumb agent friendly. Do NOT skip steps or combine them.

---

## 0.5 REAL Project Structure (confirmed — overrides earlier assumptions)

**Physio project (actual files):**
```
admin.py            <- role unknown, INSPECT FIRST (Group D new step)
audio/*.mp3          <- pre-recorded voice cues (butt_wink, caving, chest_up, heel_lifting,
                        neck_neutral, not_deep, toes) — THIS IS THE EXISTING LIVE-FEEDBACK
                        SYSTEM. Do not rebuild flag system from scratch, reuse this.
config.py
drawing.py           <- likely cv2 overlay/drawing of landmarks on frame
exercise_base.py     <- base class, exercises inherit from this. REUSE for exercise config.
exercise_runner.py   <- the main loop that runs an exercise. This is the "camera loop" —
                        inspect this file specifically for D1 (blocking vs threaded).
exercises/
  isometric_quadriceps.py   <- CONFIRMS isometric exercise type already coded
  seated_leg_extensions.py
  squat.py
gemini.py            <- the API call to delete/replace
landmarks.py         <- landmark extraction logic — REUSE directly, don't rewrite
main.py              <- entry point / menu
math_utils.py         <- angle/distance math — REUSE directly for rule_checker
pose_landmarker.task  <- MediaPipe Tasks model file (confirms Tasks API, not legacy Solutions API)
posture_checks.py     <- rule-check logic — REUSE directly for rule_checker
requirements.txt
smoother.py           <- landmark smoothing (reduces jitter) — REUSE, keep in both offline
                        and live pipelines for consistency
voice.py              <- plays audio/*.mp3 based on detected error — REUSE for live flags,
                        adapt to also emit WS message alongside/instead of playing local audio
```

**EMG project (actual files):**
```
backend/app.py        <- SINGLE FILE Flask app (not a package). Inspect fully before Group C.
design/                <- unclear purpose, INSPECT (probably UI mockups/assets, low priority)
emg_*.bin (12 files)   <- raw capture files sitting loose at project root, not in a data folder
emg_capture.bin        <- looks like a default/latest capture file
emg_review.py          <- SEPARATE script, may not be wired into app.py yet — INSPECT if
                        playback already works via web or is CLI-only
emg_serial_capture.py  <- reads EMG over SERIAL from Arduino device (not generic "IoT API")
history.json           <- simple JSON file as history store, NOT a database
requirements.txt
sketch_jun22a/sketch_jun22a.ino  <- Arduino firmware, confirms serial-based device
website/
  history.html, history2.html    <- two versions, likely history2 is newer — CONFIRM which is live
  index.html
  live.html, live2.html, live3.html, "live (copy)july 24.html"  <- FOUR versions of live view,
                        classic iterative-dev mess. MUST pick the one actually in use before
                        reusing any charting JS from it — do not guess, ask user or check
                        app.py's route/template references to find out which HTML file
                        app.py actually serves today.
  playback.html
```

**This changes several plan assumptions:**
- No real DB on EMG side today — it's `history.json` + loose `.bin` files. Group A/C plan of "keep EMG DB separate, reference by FK" becomes "keep EMG's JSON+bin storage separate, reference by session_id/timestamp same as before, no DB migration needed for EMG side in v1."
- EMG data source is **serial** (Arduino), not a clean sensor API. `emg_client.py`'s job in Group C is to hit whatever HTTP route `app.py` already exposes (if any) for live values — if `app.py` only writes bin files and doesn't expose live JSON over HTTP yet, that minimal-new-endpoint step (C2) is now CONFIRMED necessary, not optional.
- Physio side already has a full live-feedback system (`voice.py` + `audio/`) — Group G's rule_checker + flag system is 70% reuse, not new build. Adapt `posture_checks.py` + `voice.py`'s trigger logic to also send WS flag messages, don't rewrite detection logic.
- Physio side already has clean exercise OOP structure (`exercise_base.py`, `exercise_runner.py`, `exercises/`) — Group F's `exercises.json` config approach should instead be: keep the Python class structure, add config as class attributes or a small companion dict per exercise class, NOT a separate flat JSON disconnected from the code. Less rewrite, keeps logic co-located.
- `website/` HTML mess needs one extra inspection step before Group J can safely decide what to reuse.

---

## 0. Decisions Locked (from interview — do not re-litigate)

| Topic | Decision |
|---|---|
| Repo structure | 1 monorepo, 2 backend services inside (not full merge) |
| EMG Flask service | Stays standalone process, own port. FastAPI calls it internally. Do NOT rewrite Flask into FastAPI. |
| Pose detection (live) | Runs **in browser** (MediaPipe Tasks Vision JS). NOT server-side. Server only gets landmark JSON. |
| Pose detection (training) | Old Python MediaPipe code reused — repurposed to extract landmarks from annotated videos offline, for training the error-classifier model. |
| Frontend | Web app (browser). No desktop app, no cv2.imshow window in prod. |
| Model type | Tabular features (joint angles, distances, EMG features) → classifier (RandomForest/XGBoost) per error type. NOT raw image/video model. |
| Explainer | SHAP (TreeExplainer) = primary, shown to patient. LIME = secondary/debug only, not patient-facing. |
| Exercise types | Two kinds: **dynamic** (movement, pose-driven) and **isometric** (movement or no-movement, force-heavy, may be EMG-driven). Pose camera stays ON and monitored for BOTH types, whole session. |
| Fusion | Single feature vector per session = pose-branch features + EMG-branch features, joined. Exercise config decides which branch weighted more. |
| Live feedback | Only cheap rule-based checks (thresholds, e.g. "knee angle > X") flash live during session. NO SHAP/LIME computed live — too slow. |
| Post-session report | Full SHAP explanation computed once, after session ends, on the whole session's aggregated data. |
| Report format | Keep existing report look/sections. Replace Gemini-generated text with template-filled text built from SHAP values + add SHAP bar chart image. |
| WebSocket | ONE combined WS connection per session, tagged messages: `{type: "pose"|"emg"|"flag", ts, data}`. Client never opens 2 sockets. |
| Report generation trigger | End of session only (not per-frame). |

---

## 1. Architecture Overview

```
                         BROWSER (client)
   ┌─────────────────────────────────────────────────────┐
   │  Webcam → MediaPipe Tasks Vision (JS, runs on device)│
   │  Extracts landmarks locally, NOT raw video           │
   │                                                       │
   │  Single WebSocket connection to backend               │
   │  Sends: {type:"pose", ts, landmarks:[...]}            │
   │  Receives: {type:"flag", ts, message:"fix knee"}      │
   │  Receives: {type:"emg", ts, value:...} (relayed)      │
   └───────────────────────┬───────────────────────────────┘
                            │ WS (wss://)
                            ▼
   ┌─────────────────────────────────────────────────────┐
   │              FASTAPI BACKEND (orchestrator)           │
   │  - WS endpoint /ws/session/{session_id}                │
   │  - Receives pose landmarks from browser                │
   │  - Pulls live EMG data from Flask service (internal)   │
   │  - Runs cheap rule-checks live → sends "flag" msgs     │
   │  - Buffers session data (pose + emg) in memory/DB       │
   │  - On session end: runs feature extraction → model →   │
   │    SHAP → builds report → saves                        │
   │  - REST endpoints: /session/start, /session/end,        │
   │    /report/{id}, /exercises (list/config)               │
   └───────────────┬─────────────────────┬──────────────────┘
                    │ internal HTTP/WS    │ reads/writes
                    ▼                     ▼
   ┌─────────────────────────┐   ┌─────────────────────────┐
   │   FLASK EMG SERVICE       │   │      DATABASE            │
   │   (existing, untouched)   │   │  sessions, reports,       │
   │   - IoT device comms      │   │  landmark logs, emg logs, │
   │   - live EMG capture      │   │  model artifacts           │
   │   - history + playback    │   └─────────────────────────┘
   │   - own HTML dashboard    │
   │     (kept for standalone   │
   │      EMG-only viewing)     │
   └─────────────────────────┘

   OFFLINE / TRAINING (separate from live app, run manually)
   ┌─────────────────────────────────────────────────────┐
   │  Annotated video dataset                              │
   │       ↓ (reuse OLD Python MediaPipe code here)         │
   │  Landmark extraction per frame                         │
   │       ↓                                                 │
   │  Feature engineering (angles, distances, velocities)   │
   │       ↓                                                 │
   │  Train classifier (RandomForest/XGBoost) per error type│
   │       ↓                                                 │
   │  Save model file (.pkl / .json) → used by FastAPI live │
   └─────────────────────────────────────────────────────┘
```

---

## 2. Critical Notes on Project Structure

1. Old Python project's **camera-loop / cv2.imshow / main-menu code is RETIRED from live use**. Its MediaPipe wrapper logic (landmark extraction function) gets copied into the offline training pipeline. Do not delete it — move it, keep it working standalone for training.
2. Old Python project's **Gemini API call gets deleted entirely**, replaced by: rule-check (live) + SHAP report builder (post-session).
3. Flask EMG project's Python backend code is **not touched** except adding 1-2 internal endpoints if missing (e.g. "give me current EMG reading" as JSON, if not already exposed cleanly).
4. Flask's HTML dashboard stays as-is, as a **separate standalone EMG-only viewer** (useful for debugging IoT device alone, without running full session). Not merged into new frontend.
5. New frontend (new folder) is the ONLY thing that talks to FastAPI. It's new code, not reusing old HTML/JS unless old Flask HTML has reusable EMG chart-rendering JS — check and reuse if so (charting code especially, don't rewrite EMG line-chart rendering if it already works).
6. Two databases likely exist today (if EMG Flask has its own DB for history). Decide in Step-by-step section whether to keep separate DBs (EMG history vs session/report DB) or merge — default: **keep EMG's DB separate**, FastAPI's DB stores session/report/pose data and just references EMG session IDs by foreign key/timestamp range. Less migration risk.
7. Model artifacts (trained .pkl files) live in FastAPI service, loaded once at startup, not reloaded per-request.

---

## 3. Repo Layout (target)

```
final_project/               <- monorepo root
├── backend/                        <- FastAPI orchestrator (NEW)
│   ├── app/
│   │   ├── main.py
│   │   ├── ws/
│   │   │   └── session_ws.py
│   │   ├── routes/
│   │   │   ├── session.py
│   │   │   ├── report.py
│   │   │   └── exercises.py
│   │   ├── services/
│   │   │   ├── emg_client.py       <- calls Flask EMG service internally
│   │   │   ├── rule_checker.py     <- live cheap threshold checks
│   │   │   ├── feature_builder.py  <- turns raw session data into feature vector
│   │   │   ├── model_service.py    <- loads model, predicts
│   │   │   └── explainer_service.py <- SHAP (+ LIME debug) logic
│   │   ├── models/                 <- DB models (session, report)
│   │   └── config/
│   │       └── exercises.json      <- per-exercise config (dynamic vs isometric, thresholds)
│   ├── ml/                          <- OFFLINE training pipeline (separate from live app)
│   │   ├── extract_landmarks.py    <- REUSED old MediaPipe code, repurposed
│   │   ├── build_features.py
│   │   ├── train_model.py
│   │   └── trained_models/
│   ├── requirements.txt
│   └── Dockerfile
│
├── emg-service/                     <- MOVED existing Flask project here, unchanged
│   ├── (existing structure kept as-is)
│   └── requirements.txt
│
├── frontend/                        <- NEW web app
│   ├── src/
│   │   ├── camera/                 <- MediaPipe Tasks Vision JS wrapper
│   │   ├── ws/                     <- single WS client
│   │   ├── pages/
│   │   │   ├── ExerciseSelect.js
│   │   │   ├── LiveSession.js
│   │   │   └── Report.js
│   │   └── components/
│   └── package.json
│
├── docker-compose.yml               <- runs backend + emg-service + frontend together
└── README.md
```

**File-move action needed:** YES.
- Old Flask project folder → moved wholesale into `emg-service/` inside new monorepo, no internal changes except maybe adding 1 endpoint (Step group C).
- Old Python physio project: main-menu/camera-loop code → NOT moved as-is. Its MediaPipe extraction function copied into `backend/ml/extract_landmarks.py`. Gemini call code → deleted, not moved.

---

## 4. Step-by-Step Development Process

Follow in order. Each step tiny. Test after each step group before moving to next group.

### GROUP A — Setup monorepo skeleton

- A1. Create root folder `final_project/`.
- A2. Inside it, create empty folders: `backend/`, `emg-service/`, `frontend/`.
- A3. Copy (not move yet, copy for safety) existing Flask EMG project's entire contents into `emg-service/`.
- A4. Run Flask EMG service standalone from its new location. Confirm it still starts, IoT device still connects, dashboard still loads. If yes → delete old original Flask folder location. If no → fix path/import issues inside `emg-service/` until it works, do not proceed until this passes.
- A5. Copy old physio Python project into a temp folder `backend/_old_physio_reference/` — just for reference while building, will delete at end of Group E.
- A6. Init git repo at root (if not already). Add `.gitignore` for `__pycache__`, `.env`, `node_modules`, `trained_models/*.pkl` (large files).

### GROUP B — FastAPI backend skeleton (no logic yet, just structure + health check)

- B1. Inside `backend/`, create virtualenv, install `fastapi`, `uvicorn`, `websockets`, `pydantic`.
- B2. Create `backend/app/main.py` with a bare FastAPI app + one route `GET /health` returning `{"status":"ok"}`.
- B3. Run `uvicorn app.main:app --reload` from `backend/`, confirm `/health` responds in browser.
- B4. Create empty folders: `app/ws/`, `app/routes/`, `app/services/`, `app/models/`, `app/config/`.
- B5. Add `requirements.txt` listing installed packages so far.
- B6. Add `Dockerfile` for backend (basic python:3.11-slim + pip install + uvicorn run command). Don't worry about optimizing yet.

### GROUP C — Connect FastAPI to existing Flask EMG service (internal call only, no WS yet)

- C0a. Open `backend/app.py` (the single-file EMG Flask app) fully. List every route it defines (path + method). Confirm: does it already have a route returning live EMG value as JSON? Does it have a route returning history (reading `history.json`)? Does it serve `website/*.html` files directly (check for `render_template` or `send_file` calls) — and if so, WHICH html file(s) does it actually serve (this answers the `live.html` vs `live2.html` vs `live3.html` question — whichever `app.py` references is the real one, others are dead files).
- C0b. Open `emg_serial_capture.py`. Confirm: does `app.py` import/call this directly (serial reading happens in-process), or is it a separate script run manually that writes `.bin` files which `app.py` then reads? This changes whether "live EMG reading" is instant (in-process) or has a delay (file-based polling). Write down which.
- C0c. Open `emg_review.py`. Confirm: is this wired into `app.py` (e.g. a `/playback` route calls into it) or a standalone CLI script not connected to the website at all. If standalone, note that playback-via-web may not fully work yet — flag as a gap, not something to silently assume works.
- C1. From C0a-C0c findings: write down exact URL(s) that give current/live EMG reading, and how fresh that data actually is (real-time serial vs file-polling delay).
- C2. If NO route exists that gives "current live EMG value as JSON" cleanly (separate from full HTML page) — add ONE minimal new Flask route for this (e.g. `GET /api/live-value`), following whatever pattern C0b revealed (read from in-process serial buffer, or read latest bin file). Do not change any other Flask code.
- C3. In `backend/app/services/emg_client.py`, write simple function `get_live_emg_reading()` that does an HTTP GET call to Flask's endpoint from C1/C2 using `httpx` (async-friendly). Install `httpx`.
- C4. Write a temporary test route in FastAPI `GET /test-emg` that calls `get_live_emg_reading()` and returns result. Confirm both services running together (2 terminals, 2 ports) and this test route successfully pulls live EMG value. Delete test route once confirmed.
- C5. Confirm EMG history storage = `history.json` (simple JSON file) + loose `.bin` files at project root, per D-equivalent findings above (0.5 section). No real DB today. For v1: keep as-is, do not migrate to a database. FastAPI's report generator (Group I) will need to read `history.json` + relevant `.bin` file(s) for a session's time range — write down `history.json`'s exact schema (open it, look at structure) so `feature_builder.py` (I1) knows how to parse it.
- C6. Recommend (do, unless user objects): move loose `.bin` files at EMG project root into a `data/` subfolder inside `emg-service/` for tidiness, update `app.py`/`emg_review.py`/`emg_serial_capture.py` paths accordingly. Low risk, improves structure. Confirm all 3 scripts still work after path change before proceeding.

### GROUP D — Old physio project inspection (do this BEFORE deleting/reusing anything)

- D0a. Open `admin.py`. Read it fully. Write one line in notes: what does it do (likely: admin/config tool, or patient management, or unrelated utility). Decide: does it need porting into new backend, or is it dev-only tooling that can be dropped? Do not delete yet either way, just note.
- D0b. Open `drawing.py`. Confirm it's cv2-overlay drawing (landmarks/skeleton drawn on frame for local display). Since live pose now runs in-browser, this file's DRAWING logic needs porting to frontend JS (canvas overlay), not reused as Python. Note what it draws (skeleton lines, angle labels, etc.) so frontend-agent can replicate visually in Group J.
- D1. Open `exercise_runner.py`. This is the actual camera loop. Read it. Write down: is it blocking `cv2.VideoCapture` loop, or threaded? Confirm how it calls into `landmarks.py`, `posture_checks.py`, and `voice.py` each frame — write down the call order (this order must be replicated in the new WS live-loop, Group G).
- D2. Open `landmarks.py`. Copy its landmark-extraction logic into new file `backend/ml/extract_landmarks.py`. Adjust so this function takes a video file path as input (not live camera) and outputs landmarks per frame as a list/array. Reuse `smoother.py`'s smoothing logic in this same offline pipeline too, applied the same way it's applied live, so offline-extracted features match what live inference will look like.
- D3. Find where `gemini.py` is called (should be from `exercise_runner.py` or `main.py`, at session end). Note the prompt/report format it currently produces (for Group I report-template reuse). Do NOT copy the Gemini call itself — just note the OUTPUT FORMAT/report structure/sections it currently generates, and where the generated report is currently saved (file? printed? check for a `reports/` folder or similar).
- D4. Open `exercise_base.py` and all 3 files in `exercises/`. Note the class structure — what attributes/methods each exercise defines (name, thresholds, isometric-vs-dynamic flag if present, which audio cue maps to which error). This structure gets REUSED, not replaced, in Group F.
- D5. Open `posture_checks.py` and `math_utils.py`. Confirm what angle/distance calculations already exist (e.g. knee angle, hip angle). List them — Group E's feature engineering (E5) should reuse these exact functions/formulas so offline training features match live rule-check features.
- D6. Open `voice.py`. Confirm how it decides which mp3 to play (probably maps an error-code/string to a filename). Note this mapping — Group G reuses this exact mapping logic but sends a WS flag message using the same error-code instead of (or alongside) playing local audio.

### GROUP E — Offline training pipeline (build BEFORE live features, since live model_service depends on trained model existing)

- E1. Confirm annotated video dataset location and labels available (what labels exist per video — error type, dynamic/isometric, etc). Write down label schema exactly as-is.
- E2. In `backend/ml/extract_landmarks.py` (from D2), add a loop: process every video in dataset folder, save landmarks-per-frame as a `.csv` or `.parquet` per video into `backend/ml/landmarks_output/`.
- E3. Run E2 script on a SMALL subset first (2-3 videos) to confirm it works before running on full dataset. Check output file looks sane (numeric landmark coords, reasonable row count matching frame count).
- E4. Run E2 script on full dataset once E3 confirmed working.
- E5. Create `backend/ml/build_features.py`. For DYNAMIC exercises: compute joint angles (e.g. knee angle = angle between hip-knee-ankle landmarks) and distances needed, per frame, then aggregate per rep/session (min/max/mean/range of each angle). For ISOMETRIC exercises: compute position-hold-stability features from pose (how much drift from starting position) + placeholder columns for EMG features (to be filled once EMG history data joined in E7).
- E6. Test E5 on the small subset again. Confirm output is one row per video/session with named feature columns (e.g. `knee_angle_max`, `knee_angle_min`, `hold_stability_score`).
- E7. For sessions with EMG data available in the annotated dataset (if EMG was recorded during those training videos) — join matching EMG summary features (mean force, peak force, duration held above threshold) into the same feature table by session/timestamp match. If training dataset has NO EMG recorded alongside video (likely, since these are separate old projects) — SKIP EMG features for now in the trained model, add a TODO, and plan to retrain the model later once paired pose+EMG training data exists. Do not block on this — go ahead with pose-only model first, add EMG branch to model in a later iteration.
- E8. Create `backend/ml/train_model.py`. Load feature table + labels (from E1). Split train/test. Train one classifier per error-type OR one multiclass classifier — pick multiclass first for simplicity (each row's label = "correct" or specific error name). Use RandomForestClassifier from sklearn to start (simpler than XGBoost, fewer install headaches, upgrade later if needed).
- E9. Evaluate model (accuracy, confusion matrix) on test split. Write down results. If accuracy very poor (worse than guessing majority class) — flag this, dataset/features likely need revisiting before proceeding, do not silently continue.
- E10. Save trained model to `backend/ml/trained_models/pose_error_model.pkl` using `joblib`.
- E11. Delete `backend/_old_physio_reference/` folder now (no longer needed, logic already extracted).

### GROUP F — Exercise config (REVISED: reuse existing class structure, don't replace with flat JSON)

- F1. Copy `exercise_base.py` and `exercises/` folder as-is into `backend/app/exercises/`. Keep the class structure intact.
- F2. For each exercise class, add/confirm an attribute marking `type = "dynamic"` or `type = "isometric"` if not already present (isometric_quadriceps.py obviously isometric, squat + seated_leg_extensions likely dynamic — confirm by reading, don't assume from name alone).
- F3. For each exercise class, add/confirm a `primary_branch` attribute ("pose", "emg", or "both") based on D4/D6 findings.
- F4. Write a small loader in `backend/app/services/exercise_config.py` that imports all exercise classes from `backend/app/exercises/` and builds an in-memory list/dict at startup (name → class instance), so `GET /exercises` (H3) and rule_checker (G3) can look up any exercise's config by name. This replaces the flat-JSON idea — config lives in the classes themselves, loader just collects them.

### GROUP G — Live session: WebSocket + rule-checks

- G1. Create `backend/app/ws/session_ws.py`. Define WS endpoint `/ws/session/{session_id}`. On connect: accept, look up exercise type for this session (from a session-start REST call done just before, Group H).
- G2. Inside WS loop: receive JSON message from client. If `type == "pose"`: pass landmarks to `rule_checker.py`.
- G3. Create `backend/app/services/rule_checker.py`. PORT logic straight from `posture_checks.py` + `math_utils.py` (D5) — do not rewrite the angle math, copy the working functions. Given landmarks + exercise config, compute needed angles/values, compare against threshold, return an error-code (same codes `voice.py` already uses, from D6) or `None` if fine. Keep this FAST — no ML here, just arithmetic, same as it runs live today.
- G4. If rule_checker returns an error-code, look up the matching message text (reuse `voice.py`'s mapping from D6, e.g. error-code → message string). WS sends `{type:"flag", ts, code:..., message:...}` to client immediately. Frontend (Group J) plays the matching mp3 from `audio/` client-side (copy `audio/*.mp3` files into `frontend/` static assets) OR just shows text — confirm with user which they want in Group J, default to porting the audio cue since it already exists and works.
- G5. Also inside WS loop (or a background async task running every N seconds): call `emg_client.get_live_emg_reading()`, send `{type:"emg", ts, value:...}` to client so browser can render live EMG chart.
- G6. Buffer every received pose message + every fetched emg reading into an in-memory list (or write to temp file/DB) tied to `session_id`, for use in post-session report (Group I needs this full history).
- G7. On WS disconnect or explicit "end session" message from client: stop buffering, trigger Group I (report generation) as background task, close WS.
- G8. Test G1-G7 with a simple fake client script (Python `websockets` client sending dummy pose JSON in a loop) before touching real frontend. Confirm flags come back correctly for known bad-angle input.

### GROUP H — Session lifecycle REST endpoints

- H1. Create `backend/app/routes/session.py`. `POST /session/start` — body: `{exercise_name, patient_id}`. Creates new session record in DB, returns `session_id`. This must run BEFORE frontend opens the WS (WS URL includes this session_id).
- H2. `POST /session/end` — optional, in case frontend can't cleanly send WS-close message (mobile browsers sometimes kill sockets abruptly). Marks session ended, triggers report generation if not already triggered by G7.
- H3. `GET /exercises` — returns exercise list from config (F1), so frontend can build the exercise-selection menu (replaces old CLI main-menu).

### GROUP I — Post-session report generation (SHAP)

- I1. Create `backend/app/services/feature_builder.py` — LIVE version of E5's logic. Takes the buffered session data (pose history + emg history from G6) and computes the SAME feature columns the trained model expects (angles, distances, EMG summary stats). MUST match E5's feature names/order exactly or model will break — double check column names match `trained_models/pose_error_model.pkl`'s expected input.
- I2. Create `backend/app/services/model_service.py`. Loads `pose_error_model.pkl` once at FastAPI startup (not per-request — slow). Function `predict(feature_row)` returns predicted error class + probability.
- I3. Create `backend/app/services/explainer_service.py`. Use `shap.TreeExplainer(model)` (since RandomForest = tree-based, TreeExplainer is fast). Function `explain(feature_row)` returns SHAP values per feature for this session.
- I4. In same file, add LIME as secondary (use `lime.lime_tabular.LimeTabularExplainer`) — only for internal/debug logging, not shown to patient. Keep this optional, wrap in try/except so LIME failure never blocks the patient report.
- I5. Build template-based sentence generator: given top 2-3 SHAP features by absolute value, fill a plain-language template, e.g. `"Your {feature_friendly_name} was the biggest factor in this error, contributing {shap_value}."` Keep a small dictionary mapping technical feature names (`knee_angle_max`) to friendly names ("knee bending amount").
- I6. Generate SHAP bar chart image (matplotlib, `shap.plots.bar` or manual bar chart) for top features, save as PNG, attach to report.
- I7. Build final report object: reuse structure noted in D3 (same sections old Gemini report had), swap in: predicted error class, template sentence from I5, chart image from I6.
- I8. Save report to DB (or as file, matching whatever old project did for saving reports — check old project for this pattern) linked to `session_id`.
- I9. Create `backend/app/routes/report.py` — `GET /report/{session_id}` returns the saved report (JSON with chart image URL or base64).

### GROUP J — Frontend (new, minimal)

- J0. Before writing new chart code: open whichever `website/*.html` file C0a identified as the REAL live-view (the one `app.py` actually serves). Inspect its embedded/linked JS for EMG chart rendering (likely Chart.js or plain canvas). This is the reusable piece — copy this JS logic into the new frontend rather than writing new charting code. Ignore the other dead `live*.html` variants entirely.
- J1. Init new frontend project (React or plain JS+HTML — pick React only if team already knows it, else plain JS is faster to build correctly for an AI agent to follow — DEFAULT: plain HTML/JS, no framework, simplest possible).
- J2. Build `ExerciseSelect` page: calls `GET /exercises`, shows list as buttons (replaces old CLI menu / `main.py`).
- J3. On exercise click: call `POST /session/start`, get `session_id`, navigate to `LiveSession` page with that id.
- J4. `LiveSession` page: request webcam permission (`navigator.mediaDevices.getUserMedia`), load MediaPipe Tasks Vision JS library (via CDN or npm), run pose detection loop on video frames locally. NOTE: confirm the browser Tasks Vision JS library can load the SAME `pose_landmarker.task` model file already in the physio project (copy it into frontend assets) — if compatible, this is a direct reuse, not a re-download of a different model. If incompatible format, note it and use the standard Tasks Vision JS default model instead, flag the difference.
- J5. Port `drawing.py`'s skeleton-overlay logic (from D0b notes) into frontend JS — draw landmarks/skeleton lines on a canvas over the video feed, matching what the old cv2 version showed locally.
- J6. Open single WebSocket to `/ws/session/{session_id}`. On each detected pose frame, send `{type:"pose", ts, landmarks:[...]}`.
- J7. Listen on WS for incoming messages: if `type=="flag"`, show on-screen text AND play matching mp3 from copied `audio/` folder (using the code→file mapping ported from `voice.py`, D6) — reuse the existing audio-cue UX, don't silently drop it. If `type=="emg"`, update the live chart using J0's ported charting logic.
- J8. Add "End Session" button — sends WS message `{type:"end"}` then closes WS, navigates to Report page.
- J9. `Report` page: calls `GET /report/{session_id}`, displays report sections + chart image.
- J10. Test full flow manually end to end: select exercise → camera starts → move body → see live flag + hear audio cue → end session → see report with chart.

### GROUP K — Docker + run-together

- K1. Write `docker-compose.yml` at root with 3 services: `backend` (FastAPI, port e.g. 8000), `emg-service` (Flask, port e.g. 5000), `frontend` (served via simple static server or nginx, port e.g. 3000).
- K2. Confirm `backend`'s `emg_client.py` URL points to Flask service's Docker-network hostname (e.g. `http://emg-service:5000`) not `localhost`, when running via compose.
- K3. `docker-compose up`, test full flow again through Docker (not just local dev servers) before calling this done.

### GROUP L — Cleanup

- L1. Remove any leftover reference/temp folders.
- L2. Write root `README.md`: how to run locally (dev) and via Docker, listing all 3 services + ports.
- L3. Confirm `.env` / secrets (IoT device credentials, DB URLs) are not committed, using `.gitignore` and a `.env.example` template file.

---

## 5. Agent Map — Suggested Subagents

Spin these up separately, each scoped narrow, so no agent steps on another's files.

| Subagent | Owns | Group(s) | Must NOT touch |
|---|---|---|---|
| **repo-setup-agent** | Monorepo skeleton, folder moves, git init | A | Any actual service logic |
| **emg-integration-agent** | Moving Flask project, inspecting `app.py`/`emg_serial_capture.py`/`emg_review.py`/`website/*.html` to find which files are live vs dead, adding minimal new endpoint, emg_client.py, `.bin` file tidy-up | C | Frontend, ML training |
| **legacy-inspector-agent** | Reading old physio project (`admin.py`, `drawing.py`, `exercise_runner.py`, `landmarks.py`, `posture_checks.py`, `math_utils.py`, `voice.py`, `gemini.py`, `exercise_base.py`, `exercises/`), extracting/porting landmark + rule-check + audio-mapping logic, documenting old report format | D | Should not write new WS/live-loop logic itself, only extraction + a notes markdown file others (realtime-agent, ml-training-agent, frontend-agent) read and build from |
| **ml-training-agent** | Offline pipeline: landmark extraction batch run, feature engineering, model training/eval | E | Live backend, WS code |
| **backend-core-agent** | FastAPI skeleton, config loader, session REST endpoints | B, F, H | ML training internals, frontend |
| **realtime-agent** | WebSocket endpoint, rule_checker, live EMG relay | G | Report/SHAP logic, frontend |
| **explainability-agent** | feature_builder (live), model_service, explainer_service (SHAP+LIME), report template | I | WS transport code, frontend |
| **frontend-agent** | New web client: exercise select, camera+MediaPipe JS, WS client, report page | J | Any Python backend code |
| **devops-agent** | Docker, compose, README, env template | K, L | App logic changes |

**Suggested run order (not all parallel):**
1. `repo-setup-agent` first, alone (everything depends on folder structure existing).
2. Then parallel: `emg-integration-agent`, `legacy-inspector-agent`, `backend-core-agent` (B only).
3. `legacy-inspector-agent` now feeds THREE downstream agents (ml-training, realtime, frontend) — do not let it start writing final code, only extraction + notes markdown, so those three aren't blocked waiting on a moving target. Once its notes file is done, `ml-training-agent` and `realtime-agent` can both start.
4. Then `ml-training-agent` (needs legacy-inspector's extracted landmark/math code) — can run parallel with `realtime-agent` building against fake/mock data, since realtime-agent also depends on legacy-inspector's posture_checks/voice.py notes.
4. Then `explainability-agent` (needs trained model from step 3 to exist).
5. Then `frontend-agent` (needs backend endpoints from steps 2-4 stable).
6. `devops-agent` last.

Each subagent should output a short markdown notes file when done (what it built, what file paths, any deviation from this plan) so the next agent in line isn't guessing.

---

## 6. Open Items Flagged During Planning (not blocking, but track)

- Training dataset likely has **no paired EMG data** alongside the annotated videos (E7). Model v1 will be pose-only for dynamic exercises. Isometric exercises' error-detection will initially rely on EMG threshold rules only (live rule_checker) until a paired dataset exists to train fused branch properly. This is fine to ship as v1 — just don't expect SHAP to explain EMG contribution until retrained on real fused data.
- EMG `website/` folder has 4 near-duplicate "live" HTML files (`live.html`, `live2.html`, `live3.html`, `live (copy)july 24.html`) — classic dev-iteration leftovers. C0a resolves which is real by checking what `app.py` actually serves; the rest should be deleted in Group L cleanup once confirmed dead, not before (in case one is referenced somewhere unexpected).
- `admin.py` and `design/` folder purposes unknown until D0a inspection runs — do not assume either is dead weight, could be load-bearing (e.g. `admin.py` might manage patient records used elsewhere).
- EMG data currently has no database, only `history.json` + loose `.bin` files. Plan deliberately does NOT migrate this to a DB in v1 to reduce scope/risk — revisit only if `history.json` schema proves too limited for report-linking needs found in C5.
- `pose_landmarker.task` model file compatibility with browser-side MediaPipe Tasks Vision JS is UNCONFIRMED — J4 must verify this early, since if incompatible, live detection quality may differ from what the old Python/desktop version produced, which could also affect how well live rule_checker thresholds (tuned for the old model) transfer.

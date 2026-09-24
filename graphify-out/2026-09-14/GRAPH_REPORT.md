# Graph Report - /home/billa-dakait/Desktop/final_project  (2026-09-03)

## Corpus Check
- 7 files · ~105,923 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2496 nodes · 5029 edges · 167 communities (119 shown, 48 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 289 edges (avg confidence: 0.64)
- Token cost: 44,834 input · 2,000 output

## Community Hubs (Navigation)
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- MediaPipe Bundle (vendored)
- Backend App Core
- Tailwind CSS (vendored)
- UI Components
- MediaPipe Bundle (vendored)
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- App
- ML Ingestion & Extractors
- Backend Routes
- EMG Web Dashboard
- MediaPipe Bundle (vendored)
- Legacy Physio Reference
- EMG Flask Service
- Legacy Physio Reference
- Backend Routes
- Backend Gate Harnesses
- Backend App Core
- Backend Services
- Legacy Physio Reference
- ML Ingestion & Extractors
- MediaPipe Bundle (vendored)
- Legacy Physio Reference
- MediaPipe Bundle (vendored)
- Session WebSocket
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- ML Ingestion & Extractors
- Legacy Physio Reference
- Backend Gate Harnesses
- App
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- J Pages Test
- ML Ingestion & Extractors
- Backend Services
- Backend Services
- ML Ingestion & Extractors
- Live Geometry & Rules
- Live Geometry & Rules
- Live Geometry & Rules
- Frontend Unit Tests
- Backend Routes
- MediaPipe Bundle (vendored)
- MediaPipe WASM (vendored)
- Tools
- MediaPipe Bundle (vendored)
- Live Geometry & Rules
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- Live Geometry & Rules
- Tailwind CSS (vendored)
- Tools
- Backend Gate Harnesses
- Live Geometry & Rules
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- Legacy Physio Reference
- MediaPipe Bundle (vendored)
- G5 Worker Test
- Live Geometry & Rules
- Frontend Unit Tests
- ML Ingestion & Extractors
- ML Ingestion & Extractors
- Frontend
- WS Client
- G6 G10 Test
- Backend Routes
- Legacy Physio Reference
- Backend
- G6 G10 Test
- Frontend Unit Tests
- Requirements.Txt
- Backend Routes
- Backend App Core
- Legacy Physio Reference
- Backend Gate Harnesses
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- Live Geometry & Rules
- Live Geometry & Rules
- Backend Routes
- Backend App Core
- ML Ingestion & Extractors
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- G13 Test
- G5 Worker Test
- ML Ingestion & Extractors
- ML Ingestion & Extractors
- Backend
- App
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- Package.Json
- ML Ingestion & Extractors
- ML Ingestion & Extractors
- ML Ingestion & Extractors
- ML Ingestion & Extractors
- Backend
- Backend Gate Harnesses
- Emg-Service
- Frontend
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- Tailwind CSS (vendored)
- Tailwind CSS (vendored)
- Tools
- .Mcp.Json
- ML Ingestion & Extractors
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- MediaPipe WASM (vendored)
- G5 Worker Test
- App
- App
- Community 150
- Community 152
- Community 154
- Community 155
- Community 156
- Backend
- Backend
- Backend
- Backend
- Backend
- Backend
- Backend
- Backend
- Backend
- Backend

## God Nodes (most connected - your core abstractions)
1. `push()` - 70 edges
2. `add()` - 63 edges
3. `n()` - 60 edges
4. `replace()` - 54 edges
5. `e()` - 47 edges
6. `m()` - 45 edges
7. `remove()` - 40 edges
8. `has()` - 40 edges
9. `get()` - 36 edges
10. `clone()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `g13_test run` --calls--> `IsolatedRecorder`  [EXTRACTED]
  frontend/tools/g13_test/index.html → frontend/src/lib/recorder.js
- `loadConfig (live session exercise config fetch)` --shares_data_with--> `startLiveSession()`  [EXTRACTED]
  frontend/src/pages/live_session.html → frontend/src/lib/session_orchestrator.js
- `drawSkeleton()` --implements--> `Any Alert Turns Whole Skeleton Red`  [EXTRACTED]
  frontend/src/render/skeleton.js → frontend/tools/g6_g10_test/render_audio_probe.html
- `fastapi==0.141.1` --shares_data_with--> `backend (docker-compose service)`  [INFERRED]
  backend/requirements.txt → docker-compose.yml
- `uvicorn==0.52.1` --shares_data_with--> `backend (docker-compose service)`  [INFERRED]
  backend/requirements.txt → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **ML runtime dependency stack for backend/ml pipeline** — backend_requirements_pandas, backend_requirements_numpy, backend_requirements_scikit_learn, backend_requirements_xgboost, backend_requirements_joblib, backend_requirements_pyarrow, backend_requirements_opencv_python_headless, backend_requirements_mediapipe, backend_requirements_tqdm, docs_06_ml_pipeline [EXTRACTED 0.90]
- **Compose service dependency chain: frontend -> backend -> emg-service** — docker_compose_frontend, docker_compose_backend, docker_compose_emg_service [EXTRACTED 0.95]
- **Multiple near-duplicate live-monitor HTML drafts (live, live2, live3, live copy july24) representing iterative UI experimentation without version control cleanup** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live2_html_emg_realtime, emg_service_website_live3_html_emg_monitor_pro, live_copy_july24_html_emg_monitor_pro [AMBIGUOUS 0.30]
- **Live EMG monitoring pages poll Flask backend via /api/snapshot and /api/status, render on canvas via animate/draw loop** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live_html_animate_loop, emg_service_website_live_html_draw, emg_service_website_live_html_snapshot_api, emg_service_website_live_html_status_api, emg_service_flask_backend [INFERRED 0.75]
- **Project has three parallel Python dependency stacks: legacy manim/mediapipe physio reference, new lightweight FastAPI backend, and Flask-based emg-service, plus a root graphify/LLM toolchain** — backend_old_physio_reference_requirements_old_physio_reference, emg_service_requirements_emg_service, requirements_root [INFERRED 0.80]
- **Standalone Browser Gate Probe Harnesses (G5/G7/G8/G13)** — frontend_tools_g13_recording_survives, frontend_tools_g13_test_index, frontend_tools_g5_worker_test_index, frontend_tools_g5_worker_test_classic_probe, frontend_tools_g6_g10_test_render_audio_probe [INFERRED 0.85]
- **Capture -> Pose Worker -> Canvas/Audio Live Pipeline** — frontend_src_pages_live_session, frontend_src_lib_session_orchestrator_startlivesession, frontend_src_workers_pose_worker, frontend_src_render_skeleton_drawskeleton, frontend_src_lib_audio_cues_audiocueplayer, frontend_src_lib_recorder_isolatedrecorder [INFERRED 0.85]

## Communities (167 total, 48 thin omitted)

### Community 2 - "Tailwind CSS (vendored)"
Cohesion: 0.02
Nodes (119): ad(), Ag(), ak(), Am(), ao(), applyParallelOffset(), aS(), ay() (+111 more)

### Community 3 - "Tailwind CSS (vendored)"
Cohesion: 0.07
Nodes (79): add(), already(), B(), c(), checkForWarning(), clone(), cloneBefore(), cu() (+71 more)

### Community 4 - "Tailwind CSS (vendored)"
Cohesion: 0.05
Nodes (66): _1(), atrule(), beforeAfter(), block(), body(), calcBefore(), check(), cleanBrackets() (+58 more)

### Community 5 - "MediaPipe Bundle (vendored)"
Cohesion: 0.05
Nodes (42): at(), Bt, ct(), dt(), et(), finishProcessing(), ft(), Go (+34 more)

### Community 6 - "Backend App Core"
Cohesion: 0.05
Nodes (38): Any, is_valid_event(), Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3. Mirrored 1:1 in…, ExerciseConfigError, load_exercises(), Path, Exercise registry loader — Phase F (backend-core-agent). Pure-data config:…, Load, validate, and return the exercise registry as {name: record}. Not cached… (+30 more)

### Community 7 - "Tailwind CSS (vendored)"
Cohesion: 0.07
Nodes (50): ba(), Bo(), bx(), clear(), cloneDiv(), co(), colorStops(), content() (+42 more)

### Community 8 - "UI Components"
Cohesion: 0.08
Nodes (30): ShinyText(), SpotlightCard(), Alert(), AlertDescription(), AlertTitle(), alertVariants, Badge(), badgeVariants (+22 more)

### Community 9 - "MediaPipe Bundle (vendored)"
Cohesion: 0.13
Nodes (40): A(), aa, ba(), ca(), clear(), clone(), close(), constructor() (+32 more)

### Community 10 - "Tailwind CSS (vendored)"
Cohesion: 0.07
Nodes (41): addToError(), Ah(), Bt(), c3(), d3(), Di(), eE(), er() (+33 more)

### Community 11 - "Tailwind CSS (vendored)"
Cohesion: 0.10
Nodes (37): Ae(), after(), append(), before(), Dl(), G2(), H2(), info() (+29 more)

### Community 12 - "Tailwind CSS (vendored)"
Cohesion: 0.07
Nodes (37): At(), by(), ca(), cr(), ea(), Ex(), Ff(), fn() (+29 more)

### Community 13 - "App"
Cohesion: 0.06
Nodes (35): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, lucide-react, motion, radix-ui (+27 more)

### Community 14 - "ML Ingestion & Extractors"
Cohesion: 0.15
Nodes (30): _assert_reason(), _card(), E1-E5, E9, E10 — the model package contract and its gate. No framework. Run…, E4: the rejection must NAME the problem. A report that fails for the right…, Every E2 field is required. is_tree_based especially -- it gates the SHAP path…, The plan is explicit: caveats may be empty but must be PRESENT, so a card…, E-DEC.1. The placeholder bundles hold {label: estimator} dicts, which have…, E3 check 8 is explicitly a WARNING. Blocking on it would make every environment… (+22 more)

### Community 15 - "Backend Routes"
Cohesion: 0.11
Nodes (27): E6, E7, E8, E11 — model admin routes and the startup registry. No framework.…, I8 gates SHAP on this flag, so it must be visible without opening the package…, E11 needs it, and an operator needs to know a model wants an IMU BEFORE a…, Three of six exercises have no model at all -- including squat, the only one…, The plan is explicit: only post-session prediction is disabled. Live rule-based…, A malformed package is an expected input, not a server fault. It must come back…, Count-agnostic, like F7. The status route must report on whatever the registry…, test_e6_corrupt_upload_is_handled() (+19 more)

### Community 16 - "EMG Web Dashboard"
Cohesion: 0.07
Nodes (29): EMG-service Flask backend (implied API server), Flask 3.1.3 (emg-service), matplotlib (emg-service), pyserial (EMG hardware serial comms), GET /api/list_recordings fetch call (history2), loadRecordings() function (history2), Clinical Kinetic EMG Recording History page (variant 2), formatDuration() function (+21 more)

### Community 17 - "MediaPipe Bundle (vendored)"
Cohesion: 0.08
Nodes (19): c(), delete(), entries(), Fe(), get(), has(), he(), kn() (+11 more)

### Community 18 - "Legacy Physio Reference"
Cohesion: 0.13
Nodes (27): Defines what drives the rep state machine. The engine watches the angle of the…, RepTrigger, check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front() (+19 more)

### Community 19 - "EMG Flask Service"
Cohesion: 0.12
Nodes (27): add_to_history(), event_stream(), get_recording(), index(), list_recordings(), live_value(), load_history(), Generator for SSE that yields lines from the queue. (+19 more)

### Community 20 - "Legacy Physio Reference"
Cohesion: 0.12
Nodes (23): _compute_joint_angle(), _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Run all JointChecks for current view. Returns (alerts, joint_angles,…, Draw the semi-transparent left HUD panel onto frame in-place., run_exercise(), _run_joint_checks() (+15 more)

### Community 21 - "Backend Routes"
Cohesion: 0.12
Nodes (24): _App, end_session(), get, Request, Session lifecycle — H4 (start/status), H5 (end, idempotent). POST…, Idempotent: the End Session button, the WS {"type":"end"} message, and the H6…, _run(), session_end() (+16 more)

### Community 22 - "Backend Gate Harnesses"
Cohesion: 0.12
Nodes (23): gate_e8_degrades_instead_of_crashing(), gate_phase_e(), PHASE E GATE — MASTER_BUILD_PLAN_v3.md §7. | E | A deliberately malformed zip…, Supporting check. Not a §7 clause, but the difference between a usable app and…, _status(), _upload(), _free_port(), H7 — the fake-client test script, exercised for real. No framework. Run from… (+15 more)

### Community 23 - "Backend App Core"
Cohesion: 0.11
Nodes (24): emg_history(), emg_live(), emg_status(), health(), lifespan(), metrics(), get, Get EMG capture status from Flask service. (+16 more)

### Community 24 - "Backend Services"
Cohesion: 0.13
Nodes (24): close_buffer(), get_buffer(), Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3/R6). R3:…, Flush and drop from the registry. Returns frames flushed., _frame(), _fresh_tmp_root(), H1 — session_buffer.py self-checks. No framework. Run from backend/:…, The evidence path. A flush that returns cleanly but writes nothing is the worst… (+16 more)

### Community 25 - "Legacy Physio Reference"
Cohesion: 0.16
Nodes (19): get_definition(), ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines what drives the rep state machine. The engine watches the angle of the…, Defines the hold logic for isometric / static exercises. Instead of counting… (+11 more)

### Community 26 - "ML Ingestion & Extractors"
Cohesion: 0.13
Nodes (21): convert(), _legacy_cv_scores(), Path, repackage_legacy_bundle.py — DISPOSABLE, one-off converter (E9).…, Converts each legacy `*_rf.pkl` bundle in `paths` into the E1 package layout…, Best-effort: pull real CV numbers out of the existing…, The whole point of E9: whatever it emits must satisfy E3. This closes the loop…, test_e9_converter_output_passes_the_real_gate() (+13 more)

### Community 27 - "MediaPipe Bundle (vendored)"
Cohesion: 0.20
Nodes (24): an(), br(), ce, ee(), fn(), ge(), Gt(), hn() (+16 more)

### Community 28 - "Legacy Physio Reference"
Cohesion: 0.20
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 29 - "MediaPipe Bundle (vendored)"
Cohesion: 0.15
Nodes (22): ae(), cn(), D(), dn(), en(), Fh(), gn(), h() (+14 more)

### Community 30 - "Session WebSocket"
Cohesion: 0.18
Nodes (20): _batch(), _frames(), H2, H3, H6 — the session WebSocket. No framework. Run from backend/:…, H4 says start runs BEFORE the socket opens. A socket for a session that was…, Two concurrent sockets, two buffers. Same leak class as the G heel-baseline…, H3: a background task polls the EMG client and pushes to this socket. Nothing…, The load-bearing H3 requirement. EMG returning None (circuit open, C6) must…, Mobile browsers kill sockets without a close frame and without ever reaching… (+12 more)

### Community 31 - "Tailwind CSS (vendored)"
Cohesion: 0.16
Nodes (21): async(), catch(), finally(), getAsyncError(), getProxyProcessor(), handleError(), kp(), messages() (+13 more)

### Community 32 - "Tailwind CSS (vendored)"
Cohesion: 0.11
Nodes (20): applyVariantOffset(), cleanFromUnprefixed(), cleanOtherPrefixes(), comma(), compare(), findProp(), Hh(), mt() (+12 more)

### Community 33 - "ML Ingestion & Extractors"
Cohesion: 0.20
Nodes (18): add_empty_landmark_columns(), add_floor_relative_columns(), batch_extract(), _ema_smoothed_columns(), estimate_clip_floor(), estimate_floor_y(), find_longest_stable_run(), find_videos() (+10 more)

### Community 34 - "Legacy Physio Reference"
Cohesion: 0.15
Nodes (15): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_definition(), ExerciseDefinition (+7 more)

### Community 35 - "Backend Gate Harnesses"
Cohesion: 0.23
Nodes (17): clause_k3_full_flow_through_docker(), clause_k4_three_concurrent_sessions(), _compose(), _container_line_count(), _container_session_dir(), gate_phase_k(), _get(), _get_json() (+9 more)

### Community 36 - "App"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 37 - "MediaPipe WASM (vendored)"
Cohesion: 0.13
Nodes (14): createLazyFile(), forceLoadFile(), intArrayFromString(), makeColorAttachment(), makeColorAttachments(), makeComputePassTimestampWrites(), makeDepthStencilAttachment(), makeEntries() (+6 more)

### Community 38 - "MediaPipe WASM (vendored)"
Cohesion: 0.11
Nodes (18): exitFullscreen(), abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), exitFullscreen() (+10 more)

### Community 39 - "MediaPipe WASM (vendored)"
Cohesion: 0.13
Nodes (14): createLazyFile(), forceLoadFile(), intArrayFromString(), makeColorAttachment(), makeColorAttachments(), makeComputePassTimestampWrites(), makeDepthStencilAttachment(), makeEntries() (+6 more)

### Community 40 - "J Pages Test"
Cohesion: 0.25
Nodes (17): attach(), checks, connect(), DIST, FRONTEND, gate_manualEndToEnd(), goto(), HERE (+9 more)

### Community 41 - "ML Ingestion & Extractors"
Cohesion: 0.33
Nodes (16): add_angle_2d(), add_angle_3d(), add_derivative_features(), add_distance_3d(), derivative(), extract_common_features(), extract_common_file(), main() (+8 more)

### Community 42 - "Backend Services"
Cohesion: 0.23
Nodes (13): _circuit_open(), get_emg_history(), get_emg_status(), get_live_emg_reading(), _get_state(), EMG Flask service client for FastAPI backend., True if calls to base_url should be skipped right now., Fetch current live EMG reading from Flask service. Returns dict with keys:… (+5 more)

### Community 43 - "Backend Services"
Cohesion: 0.14
Nodes (8): Path, Idempotent: calling twice does not spawn a second task. `interval_s=None` reads…, Stop the background task and flush whatever remains before returning, so…, Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3)., Sync, O(n), no disk I/O., Snapshot of what's currently buffered, oldest first. Debug/test use., Append everything pending to `path` as JSONL, then drop exactly what was…, SessionBuffer

### Community 44 - "ML Ingestion & Extractors"
Cohesion: 0.28
Nodes (13): export_exercise(), main(), Path, choose_grouping(), evaluate(), main(), make_model(), DataFrame (+5 more)

### Community 45 - "Live Geometry & Rules"
Cohesion: 0.26
Nodes (13): angle2d(), angle3d(), clip(), detectView(), torsoLean(), VIEW_Z_DIFF_THRESHOLD, LM, computeJointAngle() (+5 more)

### Community 46 - "Live Geometry & Rules"
Cohesion: 0.22
Nodes (4): LEVELS, RingBuffer, drained, rb

### Community 47 - "Live Geometry & Rules"
Cohesion: 0.16
Nodes (5): createSmoother(), EmaSmoother, OneEuroScalar, OneEuroSmoother, SQUAT

### Community 48 - "Frontend Unit Tests"
Cohesion: 0.17
Nodes (11): allConfiguredAlerts(), CONFIG_PATH, ctxFor(), exerciseByName(), FakeAudio, loadRealConfig(), makeLms(), makePts() (+3 more)

### Community 49 - "Backend Routes"
Cohesion: 0.13
Nodes (11): H4, H5 — session lifecycle endpoints. No framework. Run from backend/:…, H5 returns immediately. The job is recorded as pending work; the report…, §10 gives job_queue.py to agent 10 (Phase I). Phase H must enqueue against a…, §4 lists routes/session.py as "start / end / status". The status read is what…, The exercise name is a trust boundary: it selects the thresholds and, later,…, Called twice, one job. Not two jobs, not an error on the second call -- the…, test_h4_session_status_is_readable(), test_h4_start_rejects_unknown_exercise() (+3 more)

### Community 50 - "MediaPipe Bundle (vendored)"
Cohesion: 0.24
Nodes (15): ac(), bh(), eh(), F(), g(), Ga(), Ih(), it() (+7 more)

### Community 51 - "MediaPipe WASM (vendored)"
Cohesion: 0.13
Nodes (15): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), getBinaryPromise(), getBinarySync() (+7 more)

### Community 52 - "Tools"
Cohesion: 0.15
Nodes (10): SKELETON_CONNECTIONS, VISIBILITY_THRESH, C_BGR, COLOR, colorNoAlerts, colorWithAlert, ctxGreen, ctxRed (+2 more)

### Community 53 - "MediaPipe Bundle (vendored)"
Cohesion: 0.22
Nodes (14): bn(), cr(), dr(), Er(), fr(), ii(), lr(), lt() (+6 more)

### Community 54 - "Live Geometry & Rules"
Cohesion: 0.26
Nodes (11): AUDIO_BASE, AUDIO_MAP, CHECK_REGISTRY, depthAlert(), KNOWN_CHECKS, rulesForExercise(), thresholdAlert(), thresholdValue() (+3 more)

### Community 57 - "Live Geometry & Rules"
Cohesion: 0.15
Nodes (12): ALL_EVENTS, CROSSCHECK, EMG_IMU, EXERCISE_CONFIG, EXTRACTOR, isValidEvent(), MODEL, POSE_WORKER (+4 more)

### Community 58 - "Tailwind CSS (vendored)"
Cohesion: 0.26
Nodes (13): ac(), Ax(), Et(), kt(), la(), ln(), nc(), negative() (+5 more)

### Community 59 - "Tools"
Cohesion: 0.19
Nodes (11): engine, engine2, fracsDown, fracsHold, fracsUp, frameAt(), frameAtKneeCave(), HERE (+3 more)

### Community 60 - "Backend Gate Harnesses"
Cohesion: 0.24
Nodes (11): _load_compose(), _published_ports(), PHASE K — K1/K2 static checks. No Docker daemon required. ../venv/bin/python…, K2 -- emg_client resolves its base URL from the environment. Fresh interpreter…, K2 -- compose sets that variable to the EMG service's compose hostname.…, Host-side ports published by a service, as ints. Handles both the short string…, K1 -- docker-compose.yml: backend, emg-service, frontend., _services() (+3 more)

### Community 62 - "Tailwind CSS (vendored)"
Cohesion: 0.18
Nodes (12): arbitraryProperty(), create(), forVariant(), K2(), Mh(), recordVariant(), recordVariants(), toResult() (+4 more)

### Community 63 - "Tailwind CSS (vendored)"
Cohesion: 0.23
Nodes (12): gr(), $h(), ic(), insertAfter(), jo(), Ko(), ls(), M_() (+4 more)

### Community 64 - "Legacy Physio Reference"
Cohesion: 0.24
Nodes (10): build_gemini_prompt(), build_gemini_prompt_generic(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API. Returns the coaching text, or a…, Builds a Gemini coaching prompt from any ExerciseDefinition + session log., Converts the per-rep session log into a structured coaching prompt. session_log…, Scrollable cv2 window showing the Gemini coaching report. API call runs in… (+2 more)

### Community 65 - "MediaPipe Bundle (vendored)"
Cohesion: 0.27
Nodes (11): ar(), Co(), gr(), ir(), jn(), mr(), Ne(), rr() (+3 more)

### Community 66 - "G5 Worker Test"
Cohesion: 0.20
Nodes (9): loadConfig (live session exercise config fetch), handleFrame(), init(), FakePoseWorker, g13_test run, Classic Worker Support Probe, G5 Pose Worker Wiring/Latency Harness, sendOneFrame (synthetic frame producer) (+1 more)

### Community 67 - "Live Geometry & Rules"
Cohesion: 0.24
Nodes (5): IsolatedRecorder, startLiveSession(), Live Session DOM Id Contract, blobToBase64, g13 main (real worker crash run)

### Community 68 - "Frontend Unit Tests"
Cohesion: 0.33
Nodes (7): lerpPts(), makePainter(), MAX_EASE_MS, STALE_POSE_MS, setup(), fakeCtx(), setup()

### Community 69 - "ML Ingestion & Extractors"
Cohesion: 0.38
Nodes (9): find_parquets(), main(), output_path_for(), parse_args(), Path, run_extractor(), validate(), CompletedProcess (+1 more)

### Community 70 - "ML Ingestion & Extractors"
Cohesion: 0.31
Nodes (8): clip_features(), label_cols(), main(), DataFrame, Path, Collapse one clip's frames into a single feature row., Everything in the manifest that isn't metadata is a label., Series

### Community 71 - "Frontend"
Cohesion: 0.22
Nodes (8): description, name, private, scripts, test:parity, test:ring_buffer, type, version

### Community 73 - "G6 G10 Test"
Cohesion: 0.42
Nodes (8): attach(), FRONTEND_ROOT, HERE, main(), MOCKUP_VALUES, runLivePageChecks(), runProbeChecks(), sleep()

### Community 74 - "Backend Routes"
Cohesion: 0.29
Nodes (5): J — cross-origin access from the pages to the API. No framework. Run from…, POST /session/start with a JSON content-type triggers a preflight. If OPTIONS…, All four, not just the one that was noticed. A page that can read /exercises…, test_j_cors_covers_every_route_the_pages_call(), test_j_cors_preflight_for_session_start()

### Community 75 - "Legacy Physio Reference"
Cohesion: 0.29
Nodes (6): draw_hud(), draw_hud_generic(), draw_skeleton(), Generic HUD panel for any exercise. Displays the exercise name, rep counters,…, Draw the skeleton overlay on frame. Two-pass render (shadow + colour) for…, Render the semi-transparent left-side HUD panel onto frame.

### Community 76 - "Backend"
Cohesion: 0.29
Nodes (7): fastapi==0.141.1, httpx==0.28.1, uvicorn==0.52.1, websockets==17.0.1, backend (docker-compose service), emg-service (docker-compose service), frontend (docker-compose service)

### Community 77 - "G6 G10 Test"
Cohesion: 0.29
Nodes (7): Live Session Page, Dev Diagnostics Overlay, FIFO Frame/Result Latency Correlation, finish (latency summary), G7/G8 Render and Audio Probe, Any Alert Turns Whole Skeleton Red, Synthetic Landmarks Against Real Browser APIs

### Community 79 - "Requirements.Txt"
Cohesion: 0.38
Nodes (7): fastapi 0.115.6 (root), graphifyy (root, knowledge-graph tool dep), litellm (LLM proxy, root), mcp 1.29.0 (root), openai SDK (root), requirements.txt (root), tree-sitter language parser set (root)

### Community 80 - "Backend Routes"
Cohesion: 0.33
Nodes (6): E-DEC.2, and the reason it matters: the IMU's whole value is being an…, test_e11_absent_sensor_is_never_imputed(), test_e11_missing_declared_source_blocks_scoring(), test_e11_present_sources_allow_scoring(), check_data_sources(), E11 / E-DEC.2. A model declares the sensors it REQUIRES at scoring time; a…

### Community 81 - "Backend App Core"
Cohesion: 0.40
Nodes (3): Perf counter/timer registry — MASTER_BUILD_PLAN_v3.md §3.2 R10, §5 B5. Not the…, timer(), timing()

### Community 82 - "Legacy Physio Reference"
Cohesion: 0.40
Nodes (5): faster-whisper (speech-to-text), graphifyy (old_physio_reference), manim (Manim animation library), mediapipe (pose/landmark detection), tree-sitter language parser set (old_physio_reference)

### Community 83 - "Backend Gate Harnesses"
Cohesion: 0.53
Nodes (5): _drive(), _frame(), main(), _post(), H7 — fake session client. Drives a live session over a REAL WebSocket without a…

### Community 84 - "MediaPipe WASM (vendored)"
Cohesion: 0.33
Nodes (6): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run()

### Community 85 - "MediaPipe WASM (vendored)"
Cohesion: 0.33
Nodes (6): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run()

### Community 86 - "Live Geometry & Rules"
Cohesion: 0.33
Nodes (4): AudioCuePlayer, Per-Alert 4s Audio Cue Debounce, countColor (pixel assertion helper), render_audio_probe main

### Community 88 - "Backend Routes"
Cohesion: 0.40
Nodes (4): list_exercises(), get, GET /exercises — F6. Returns the exercise registry, including thresholds, so…, Request

### Community 89 - "Backend App Core"
Cohesion: 0.50
Nodes (4): parse_js_events(), Path, Checks backend/app/events.py and frontend/src/lib/events.js declare the same…, test_mirror()

### Community 90 - "ML Ingestion & Extractors"
Cohesion: 0.40
Nodes (5): _assemble_multioutput(), Post-hoc assembly: set the internals MultiOutputClassifier.fit() would have…, _fit_model(), A real fitted multi-label estimator. Real, not a mock -- E3 check 4 loads it…, MultiOutputClassifier

### Community 91 - "MediaPipe WASM (vendored)"
Cohesion: 0.40
Nodes (5): makeBlendComponent(), makeBlendState(), makeColorState(), makeColorStates(), makeFragmentState()

### Community 92 - "MediaPipe WASM (vendored)"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 93 - "MediaPipe WASM (vendored)"
Cohesion: 0.40
Nodes (5): makeBlendComponent(), makeBlendState(), makeColorState(), makeColorStates(), makeFragmentState()

### Community 94 - "MediaPipe WASM (vendored)"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 95 - "G13 Test"
Cohesion: 0.50
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 96 - "G5 Worker Test"
Cohesion: 0.50
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 97 - "ML Ingestion & Extractors"
Cohesion: 0.67
Nodes (3): extract(), Mini Squat exercise-specific feature extractor. Input : common_feature.parquet…, select_columns()

### Community 98 - "ML Ingestion & Extractors"
Cohesion: 0.67
Nodes (3): find_videos(), main(), Find videos recursively, preserving their paths relative to input_root.

### Community 99 - "Backend"
Cohesion: 0.67
Nodes (3): run(), SESSION_DATA_DIR, run_tests.sh script

### Community 100 - "App"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 101 - "MediaPipe WASM (vendored)"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 102 - "MediaPipe WASM (vendored)"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 103 - "Package.Json"
Cohesion: 0.50
Nodes (3): devDependencies, shadcn, shadcn

### Community 108 - "Backend"
Cohesion: 0.67
Nodes (3): mediapipe==1.0.0, pandas==3.0.5, docs/06_ml_pipeline.md §14

### Community 113 - "MediaPipe WASM (vendored)"
Cohesion: 0.67
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 114 - "MediaPipe WASM (vendored)"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 115 - "MediaPipe WASM (vendored)"
Cohesion: 0.67
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 116 - "MediaPipe WASM (vendored)"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 117 - "Tailwind CSS (vendored)"
Cohesion: 1.00
Nodes (3): ef(), q5(), W0()

### Community 119 - "Tools"
Cohesion: 1.00
Nodes (3): G13 Recording Survives Worker Crash Harness, G13 Gate: Recording Isolated From Pose Worker, G13 Simulated Worker Crash Harness

## Ambiguous Edges - Review These
- `Clinical Kinetic EMG Recording History page (variant 2)` → `Clinical Kinetic EMG Recording History page`  [AMBIGUOUS]
  emg-service/website/history2.html · relation: duplicate_variant_of
- `Clinical Kinetic EMG Recording History page` → `EMG Viewer landing page`  [AMBIGUOUS]
  emg-service/website/index.html · relation: links_to
- `EMG Viewer landing page` → `EMG Monitor Pro - Clinical Kinetic live page`  [AMBIGUOUS]
  emg-service/website/index.html · relation: links_to
- `EMG Monitor Pro - Clinical Kinetic page (live3)` → `EMG Monitor Pro - Clinical Kinetic live page`  [AMBIGUOUS]
  emg-service/website/live3.html · relation: iteration_of
- `EMG Monitor Pro - Clinical Kinetic live page` → `EMG Monitor Pro live page (copy july 24, superseded draft)`  [AMBIGUOUS]
  emg-service/website/live (copy)july 24.html · relation: earlier_draft_of

## Knowledge Gaps
- **150 isolated node(s):** `state`, `qn`, `npx`, `description`, `name` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Clinical Kinetic EMG Recording History page (variant 2)` and `Clinical Kinetic EMG Recording History page`?**
  _Edge tagged AMBIGUOUS (relation: duplicate_variant_of) - confidence is low._
- **What is the exact relationship between `Clinical Kinetic EMG Recording History page` and `EMG Viewer landing page`?**
  _Edge tagged AMBIGUOUS (relation: links_to) - confidence is low._
- **What is the exact relationship between `EMG Viewer landing page` and `EMG Monitor Pro - Clinical Kinetic live page`?**
  _Edge tagged AMBIGUOUS (relation: links_to) - confidence is low._
- **What is the exact relationship between `EMG Monitor Pro - Clinical Kinetic page (live3)` and `EMG Monitor Pro - Clinical Kinetic live page`?**
  _Edge tagged AMBIGUOUS (relation: iteration_of) - confidence is low._
- **What is the exact relationship between `EMG Monitor Pro - Clinical Kinetic live page` and `EMG Monitor Pro live page (copy july 24, superseded draft)`?**
  _Edge tagged AMBIGUOUS (relation: earlier_draft_of) - confidence is low._
- **Why does `document()` connect `MediaPipe WASM (vendored)` to `Tailwind CSS (vendored)`, `MediaPipe WASM (vendored)`, `Tailwind CSS (vendored)`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `e()` connect `MediaPipe Bundle (vendored)` to `MediaPipe Bundle (vendored)`, `Tailwind CSS (vendored)`, `Tailwind CSS (vendored)`, `Tailwind CSS (vendored)`, `MediaPipe Bundle (vendored)`, `MediaPipe WASM (vendored)`, `Tailwind CSS (vendored)`, `G6 G10 Test`, `Tailwind CSS (vendored)`, `Tailwind CSS (vendored)`, `Tailwind CSS (vendored)`, `MediaPipe Bundle (vendored)`, `MediaPipe Bundle (vendored)`, `MediaPipe WASM (vendored)`, `MediaPipe Bundle (vendored)`, `MediaPipe Bundle (vendored)`, `Tailwind CSS (vendored)`, `Tailwind CSS (vendored)`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
# Graph Report - final_project  (2026-09-14)

## Corpus Check
- 278 files · ~800,334 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3512 nodes · 6791 edges · 211 communities (144 shown, 49 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 397 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3e95338`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- tailwind.js
- has
- decl
- vision_bundle.mjs
- logging_setup.py
- push
- cn
- e
- replace
- remove
- ql
- dependencies
- test_validate_model_package.py
- test_admin_models.py
- EMG Monitor Pro - Clinical Kinetic live page
- xe
- detect_view
- app.py
- exercise_runner.py
- session.py
- test_e_gate.py
- admin_models.py
- test_session_buffer.py
- ExerciseDefinition
- validate_model_package.py
- fn
- admin.py
- m
- test_session_ws.py
- sync
- add
- extract_landmarks.py
- ExerciseDefinition
- test_k_gate.py
- components.json
- .get
- init
- .get
- run_j_test.mjs
- common_features.py
- app/main.py
- SessionBuffer
- emg_imu_app.py
- pose_engine.js
- RingBuffer
- smoothing_audio.test.mjs
- helpers.mjs
- TestClient
- g
- init
- skeleton_selfcheck.mjs
- ar
- admin.js
- ExceptionInfo
- ExceptionInfo
- events.js
- Ax
- pose_engine_selfcheck.mjs
- test_k_compose.py
- startLiveSession
- lE
- clone
- gemini.py
- jn
- dependencies
- IsolatedRecorder
- session_orchestrator.js
- run_feature_extractor.py
- clip_features
- frontend/package.json
- dependencies
- run_g6_g10_test.mjs
- test_cors.py
- drawing.py
- backend (docker-compose service)
- exerciseRecommendations.js
- FakeWebSocket
- requirements.txt (root)
- check_data_sources
- session_ws.py
- _old_physio_reference/requirements.txt
- fake_session_client.py
- postRun
- postRun
- assessment.js
- CurrentUser
- exercises.py
- test_events_mirror.py
- _fit_model
- patientResearch.js
- makeVertexAttributes
- doctorDashboard.js
- makeVertexAttributes
- run_g13_test.mjs
- run_g5_test.mjs
- mini_squat.py
- find_videos
- backend/run_tests.sh
- compilerOptions
- ___syscall_ioctl
- ___syscall_ioctl
- devDependencies
- heel_slide.py
- seated_knee_extension.py
- slr.py
- tke.py
- docs/06_ml_pipeline.md §14
- p0_legacy_bench.py
- emg_review.py
- frontend/run_tests.sh
- compareByDay
- write
- compareByDay
- write
- apiClient.js
- exercise_config.py
- G13 Recording Survives Worker Crash Harness
- shadcn
- test_e9_converted_model_predicts
- close
- convertReturnValue
- _emscripten_stack_snapshot
- createLazyFile
- leadingNulls
- makeDepthStencilState
- registerType
- close
- convertReturnValue
- _emscripten_stack_snapshot
- createLazyFile
- leadingNulls
- makeDepthStencilState
- registerType
- classic_probe_worker.js
- index.html (exercise select entry)
- report.html (session report entry)
- app/__init__.py
- fhir.js
- adminPatientResearch.js
- App.jsx
- src/index.js
- User.js
- db.py
- test_history.py
- joblib==1.5.3
- numpy==2.5.1
- opencv-python-headless==5.0.0.93
- pyarrow==25.0.1
- pydantic==2.13.4
- python-multipart==0.0.32
- scikit-learn==1.9.0
- starlette==1.4.1
- tqdm==4.70.0
- xgboost==3.4.1
- bundleMapper.js
- hemophiliaDetails.js
- encryption.js
- session_doc.py
- video_retention.py
- test_report.py
- db.js
- posture_checks.py
- DoctorRegistrationRequest.js
- chatbot.js
- DoctorDashboard.jsx
- ProfileStepper.jsx
- cryptoConfig.js
- ExercisePlan.jsx
- cryptSharedPath.js
- run_case
- createAdmin.js
- generateMasterKey.js
- HemophiliaDetailsScreen.jsx
- predict.py
- createStaffAccount.js
- AdminDoctorRequestDetails.jsx
- AdminProfile.jsx
- testMongoConnect.js
- frontend/src/main.jsx
- Layout.jsx
- build_obsidian_vault.py
- dev
- syncfs
- syncfs
- raw-test.js
- AdminPatientResearch.jsx
- DoctorRegistration.jsx
- custom_emscripten_dbgn
- deferCall
- requestFullscreen
- custom_emscripten_dbgn
- deferCall
- requestFullscreen

## God Nodes (most connected - your core abstractions)
1. `push()` - 71 edges
2. `add()` - 66 edges
3. `replace()` - 53 edges
4. `m()` - 45 edges
5. `e()` - 42 edges
6. `has()` - 40 edges
7. `remove()` - 40 edges
8. `get()` - 36 edges
9. `clone()` - 30 edges
10. `n()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `run_case()` --calls--> `angle_2d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `angle_3d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `torso_lean()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `detect_view()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `fastapi==0.141.1` --shares_data_with--> `backend (docker-compose service)`  [INFERRED]
  backend/requirements.txt → docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multiple near-duplicate live-monitor HTML drafts (live, live2, live3, live copy july24) representing iterative UI experimentation without version control cleanup** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live2_html_emg_realtime, emg_service_website_live3_html_emg_monitor_pro, live_copy_july24_html_emg_monitor_pro [AMBIGUOUS 0.30]
- **ML runtime dependency stack for backend/ml pipeline** — backend_requirements_pandas, backend_requirements_numpy, backend_requirements_scikit_learn, backend_requirements_xgboost, backend_requirements_joblib, backend_requirements_pyarrow, backend_requirements_opencv_python_headless, backend_requirements_mediapipe, backend_requirements_tqdm, docs_06_ml_pipeline [EXTRACTED 0.90]
- **Compose service dependency chain: frontend -> backend -> emg-service** — docker_compose_frontend, docker_compose_backend, docker_compose_emg_service [EXTRACTED 0.95]
- **Live EMG monitoring pages poll Flask backend via /api/snapshot and /api/status, render on canvas via animate/draw loop** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live_html_animate_loop, emg_service_website_live_html_draw, emg_service_website_live_html_snapshot_api, emg_service_website_live_html_status_api, emg_service_flask_backend [INFERRED 0.75]
- **Project has three parallel Python dependency stacks: legacy manim/mediapipe physio reference, new lightweight FastAPI backend, and Flask-based emg-service, plus a root graphify/LLM toolchain** — backend_old_physio_reference_requirements_old_physio_reference, emg_service_requirements_emg_service, requirements_root [INFERRED 0.80]
- **Standalone Browser Gate Probe Harnesses (G5/G7/G8/G13)** — frontend_tools_g13_recording_survives, frontend_tools_g13_test_index, frontend_tools_g5_worker_test_index, frontend_tools_g5_worker_test_classic_probe, frontend_tools_g6_g10_test_render_audio_probe [INFERRED 0.85]
- **Capture -> Pose Worker -> Canvas/Audio Live Pipeline** — frontend_src_pages_live_session, frontend_src_lib_session_orchestrator_startlivesession, frontend_src_workers_pose_worker, frontend_src_render_skeleton_drawskeleton, frontend_src_lib_audio_cues_audiocueplayer, frontend_src_lib_recorder_isolatedrecorder [INFERRED 0.85]

## Communities (211 total, 49 thin omitted)

### Community 2 - "tailwind.js"
Cohesion: 0.02
Nodes (106): ad(), Ag(), ak(), Am(), ao(), applyVariantOffset(), aS(), async() (+98 more)

### Community 3 - "has"
Cohesion: 0.06
Nodes (55): arbitraryProperty(), cl(), _d(), delete(), _deleteIfExpired(), ec(), entriesDescending(), eO() (+47 more)

### Community 4 - "decl"
Cohesion: 0.05
Nodes (65): exitFullscreen(), exitFullscreen(), _1(), atrule(), beforeAfter(), block(), body(), calcBefore() (+57 more)

### Community 5 - "vision_bundle.mjs"
Cohesion: 0.06
Nodes (38): Bt, constructor(), ct(), delete(), finishProcessing(), Go, has(), he() (+30 more)

### Community 6 - "logging_setup.py"
Cohesion: 0.09
Nodes (17): is_valid_event(), Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3. Mirrored 1:1 in…, ComponentLogger, _JsonFormatter, _make_handler(), _next_seq(), Structured JSON logger — MASTER_BUILD_PLAN_v3.md §8b. One JSON object per line,…, Renders the pre-built dict on record.extra_fields as one JSON line. All the… (+9 more)

### Community 7 - "push"
Cohesion: 0.09
Nodes (33): p(), y(), B(), ba(), Bo(), cloneDiv(), colorStops(), content() (+25 more)

### Community 8 - "cn"
Cohesion: 0.06
Nodes (41): ShinyText(), SpotlightCard(), Alert(), AlertDescription(), AlertTitle(), alertVariants, Badge(), badgeVariants (+33 more)

### Community 9 - "e"
Cohesion: 0.14
Nodes (37): A(), aa, ba(), ca(), clear(), clone(), close(), D() (+29 more)

### Community 10 - "replace"
Cohesion: 0.07
Nodes (35): addToError(), Bt(), c3(), d3(), Di(), eE(), f3(), Gf() (+27 more)

### Community 11 - "remove"
Cohesion: 0.08
Nodes (47): Ae(), after(), Ah(), append(), before(), Bf(), check(), Dl() (+39 more)

### Community 12 - "ql"
Cohesion: 0.09
Nodes (29): At(), by(), ca(), cr(), ea(), Ex(), Gl(), gS() (+21 more)

### Community 13 - "dependencies"
Cohesion: 0.06
Nodes (35): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, lucide-react, motion, radix-ui (+27 more)

### Community 14 - "test_validate_model_package.py"
Cohesion: 0.15
Nodes (30): _assert_reason(), _card(), E1-E5, E9, E10 — the model package contract and its gate. No framework. Run…, E4: the rejection must NAME the problem. A report that fails for the right…, Every E2 field is required. is_tree_based especially -- it gates the SHAP path…, The plan is explicit: caveats may be empty but must be PRESENT, so a card…, E-DEC.1. The placeholder bundles hold {label: estimator} dicts, which have…, E3 check 8 is explicitly a WARNING. Blocking on it would make every environment… (+22 more)

### Community 15 - "test_admin_models.py"
Cohesion: 0.15
Nodes (22): E6, E7, E8, E11 — model admin routes and the startup registry. No framework.…, I8 gates SHAP on this flag, so it must be visible without opening the package…, E11 needs it, and an operator needs to know a model wants an IMU BEFORE a…, A malformed package is an expected input, not a server fault. It must come back…, test_e6_corrupt_upload_is_handled(), test_e6_rejection_is_a_report_not_a_crash(), test_e6_upload_accepts_a_valid_package(), test_e7_status_reports_data_sources() (+14 more)

### Community 16 - "EMG Monitor Pro - Clinical Kinetic live page"
Cohesion: 0.07
Nodes (29): EMG-service Flask backend (implied API server), Flask 3.1.3 (emg-service), matplotlib (emg-service), pyserial (EMG hardware serial comms), GET /api/list_recordings fetch call (history2), loadRecordings() function (history2), Clinical Kinetic EMG Recording History page (variant 2), formatDuration() function (+21 more)

### Community 17 - "xe"
Cohesion: 0.11
Nodes (9): entries(), Fe(), forEach(), get(), L, oe(), qe(), [Symbol.iterator]() (+1 more)

### Community 18 - "detect_view"
Cohesion: 0.16
Nodes (28): Defines what drives the rep state machine. The engine watches the angle of the…, RepTrigger, check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front() (+20 more)

### Community 19 - "app.py"
Cohesion: 0.13
Nodes (26): add_to_history(), event_stream(), get_recording(), index(), list_recordings(), live_value(), load_history(), route (+18 more)

### Community 20 - "exercise_runner.py"
Cohesion: 0.11
Nodes (25): draw_skeleton(), Draw the skeleton overlay on frame. Two-pass render (shadow + colour) for…, _compute_joint_angle(), _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Run all JointChecks for current view. Returns (alerts, joint_angles,…, Draw the semi-transparent left HUD panel onto frame in-place. (+17 more)

### Community 21 - "session.py"
Cohesion: 0.13
Nodes (29): _consent(), get_video(), get, Request, UploadFile, G2-F5/F6 -- report polling and video upload. POST /session/{session_id}/video…, G2-G4: play back a session's video. The counterpart to the upload above --…, Read-only lookup on patientprofiles (theirs, §1) -- never write it. (+21 more)

### Community 22 - "test_e_gate.py"
Cohesion: 0.12
Nodes (23): gate_e8_degrades_instead_of_crashing(), gate_phase_e(), PHASE E GATE — MASTER_BUILD_PLAN_v3.md §7. | E | A deliberately malformed zip…, Supporting check. Not a §7 clause, but the difference between a usable app and…, _status(), _upload(), _free_port(), H7 — the fake-client test script, exercised for real. No framework. Run from… (+15 more)

### Community 23 - "admin_models.py"
Cohesion: 0.17
Nodes (14): lifespan(), build_model_registry(), _empty_entry(), _loaded_entry(), model_status(), get, Path, Request (+6 more)

### Community 24 - "test_session_buffer.py"
Cohesion: 0.12
Nodes (23): close_buffer(), Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3/R6). R3:…, Flush and drop from the registry. Returns frames flushed., _frame(), _fresh_tmp_root(), H1 — session_buffer.py self-checks. No framework. Run from backend/:…, The evidence path. A flush that returns cleanly but writes nothing is the worst…, Flush drains. A second flush must append, not truncate — chunked evidence… (+15 more)

### Community 25 - "ExerciseDefinition"
Cohesion: 0.15
Nodes (18): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_all_exercise_definitions(), get_exercise_definition() (+10 more)

### Community 26 - "validate_model_package.py"
Cohesion: 0.13
Nodes (21): convert(), _legacy_cv_scores(), Path, repackage_legacy_bundle.py — DISPOSABLE, one-off converter (E9).…, Converts each legacy `*_rf.pkl` bundle in `paths` into the E1 package layout…, Best-effort: pull real CV numbers out of the existing…, The whole point of E9: whatever it emits must satisfy E3. This closes the loop…, test_e9_converter_output_passes_the_real_gate() (+13 more)

### Community 27 - "fn"
Cohesion: 0.16
Nodes (28): ae(), an(), br(), ce, dn(), ee(), fn(), ge() (+20 more)

### Community 28 - "admin.py"
Cohesion: 0.20
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 29 - "m"
Cohesion: 0.15
Nodes (22): cn(), en(), Fh(), gn(), h(), Io(), ki(), m() (+14 more)

### Community 30 - "test_session_ws.py"
Cohesion: 0.12
Nodes (35): get_buffer(), _auth_frame(), _batch(), _frames(), _http_auth(), H2, H3, H6 — the session WebSocket. G2-B4 — the WS auth handshake. No…, A batch in the client.js wire format lands in that session's buffer., R6. Frames sit in memory after receive; the flush is somebody else's turn of… (+27 more)

### Community 31 - "sync"
Cohesion: 0.19
Nodes (18): getAsyncError(), getIterator(), getProxyProcessor(), handleError(), kp(), messages(), Once(), prepareVisitors() (+10 more)

### Community 32 - "add"
Cohesion: 0.08
Nodes (37): add(), checkForWarning(), cleanFromUnprefixed(), cleanOtherPrefixes(), comma(), contain3d(), convert(), cu() (+29 more)

### Community 33 - "extract_landmarks.py"
Cohesion: 0.20
Nodes (18): add_empty_landmark_columns(), add_floor_relative_columns(), batch_extract(), _ema_smoothed_columns(), estimate_clip_floor(), estimate_floor_y(), find_longest_stable_run(), find_videos() (+10 more)

### Community 34 - "ExerciseDefinition"
Cohesion: 0.25
Nodes (10): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_definition(), ExerciseDefinition (+2 more)

### Community 35 - "test_k_gate.py"
Cohesion: 0.23
Nodes (17): clause_k3_full_flow_through_docker(), clause_k4_three_concurrent_sessions(), _compose(), _container_line_count(), _container_session_dir(), gate_phase_k(), _get(), _get_json() (+9 more)

### Community 36 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 37 - ".get"
Cohesion: 0.12
Nodes (16): makeBlendComponent(), makeBlendState(), makeColorAttachment(), makeColorAttachments(), makeColorState(), makeColorStates(), makeComputePassTimestampWrites(), makeDepthStencilAttachment() (+8 more)

### Community 38 - "init"
Cohesion: 0.11
Nodes (19): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), receiveInstance(), receiveInstantiationResult() (+11 more)

### Community 39 - ".get"
Cohesion: 0.12
Nodes (16): makeBlendComponent(), makeBlendState(), makeColorAttachment(), makeColorAttachments(), makeColorState(), makeColorStates(), makeComputePassTimestampWrites(), makeDepthStencilAttachment() (+8 more)

### Community 40 - "run_j_test.mjs"
Cohesion: 0.25
Nodes (17): attach(), checks, connect(), DIST, FRONTEND, gate_manualEndToEnd(), goto(), HERE (+9 more)

### Community 41 - "common_features.py"
Cohesion: 0.13
Nodes (30): add_angle_2d(), add_angle_3d(), add_derivative_features(), add_distance_3d(), derivative(), extract_common_features(), extract_common_file(), main() (+22 more)

### Community 42 - "app/main.py"
Cohesion: 0.11
Nodes (26): emg_history(), emg_live(), emg_status(), health(), metrics(), get, Get EMG recording history from Flask service., Get current live EMG reading from Flask service. (+18 more)

### Community 43 - "SessionBuffer"
Cohesion: 0.13
Nodes (8): Path, Idempotent: calling twice does not spawn a second task. `interval_s=None` reads…, Stop the background task and flush whatever remains before returning, so…, Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3)., Sync, O(n), no disk I/O., Snapshot of what's currently buffered, oldest first. Debug/test use., Append everything pending to `path` as JSONL, then drop exactly what was…, SessionBuffer

### Community 44 - "emg_imu_app.py"
Cohesion: 0.07
Nodes (50): add_annotation(), add_to_history(), _annotations_path(), arm(), compress_capture_file(), control_reader(), ControlUDPHandler, delete_annotation() (+42 more)

### Community 45 - "pose_engine.js"
Cohesion: 0.17
Nodes (18): angle2d(), angle3d(), clip(), detectView(), torsoLean(), VIEW_Z_DIFF_THRESHOLD, CHECKS, CHECKS (+10 more)

### Community 46 - "RingBuffer"
Cohesion: 0.14
Nodes (5): LEVELS, RingBuffer, SessionWsClient, drained, rb

### Community 47 - "smoothing_audio.test.mjs"
Cohesion: 0.10
Nodes (10): AUDIO_BASE, AUDIO_MAP, AudioCuePlayer, createSmoother(), EmaSmoother, OneEuroScalar, OneEuroSmoother, FakeAudio (+2 more)

### Community 48 - "helpers.mjs"
Cohesion: 0.14
Nodes (24): EXERCISE_CHECKS, CHECK_REGISTRY, depthAlert(), KNOWN_CHECKS, rulesForExercise(), thresholdAlert(), thresholdValue(), baseLandmarks() (+16 more)

### Community 49 - "TestClient"
Cohesion: 0.08
Nodes (43): Count-agnostic, like F7. The status route must report on whatever the registry…, Three of six exercises have no model at all -- including squat, the only one…, The plan is explicit: only post-session prediction is disabled. Live rule-based…, test_e7_status_lists_every_configured_exercise(), test_e8_live_feedback_survives_a_missing_model(), test_e8_missing_model_does_not_crash_startup(), _auth(), _lookup_docA_only_for_p1() (+35 more)

### Community 50 - "g"
Cohesion: 0.23
Nodes (15): ac(), bh(), eh(), F(), g(), Ga(), Ih(), Lh() (+7 more)

### Community 51 - "init"
Cohesion: 0.11
Nodes (19): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), receiveInstance(), receiveInstantiationResult() (+11 more)

### Community 52 - "skeleton_selfcheck.mjs"
Cohesion: 0.13
Nodes (13): SKELETON_CONNECTIONS, C_BGR, COLOR, drawSkeleton(), Any Alert Turns Whole Skeleton Red, countColor (pixel assertion helper), render_audio_probe main, colorNoAlerts (+5 more)

### Community 53 - "ar"
Cohesion: 0.15
Nodes (20): ar(), bn(), c(), cr(), dr(), Er(), fr(), gr() (+12 more)

### Community 54 - "admin.js"
Cohesion: 0.06
Nodes (39): loginOTPSchema, mongoose, adminAuth, bcrypt, { createLoginOTP, verifyLoginOTP }, crypto, DoctorRegistrationRequest, express (+31 more)

### Community 57 - "events.js"
Cohesion: 0.12
Nodes (15): ALL_EVENTS, AUTH, CROSSCHECK, DB, EMG_IMU, EXERCISE_CONFIG, EXTRACTOR, isValidEvent() (+7 more)

### Community 58 - "Ax"
Cohesion: 0.26
Nodes (13): ac(), Ax(), Et(), fn(), Hr(), la(), ln(), nc() (+5 more)

### Community 59 - "pose_engine_selfcheck.mjs"
Cohesion: 0.13
Nodes (13): buildPts(), PoseEngine, engine, engine2, fracsDown, fracsHold, fracsUp, frameAt() (+5 more)

### Community 60 - "test_k_compose.py"
Cohesion: 0.24
Nodes (11): _load_compose(), _published_ports(), PHASE K — K1/K2 static checks. No Docker daemon required. ../venv/bin/python…, K2 -- emg_client resolves its base URL from the environment. Fresh interpreter…, K2 -- compose sets that variable to the EMG service's compose hostname.…, Host-side ports published by a service, as ints. Handles both the short string…, K1 -- docker-compose.yml: backend, emg-service, frontend., _services() (+3 more)

### Community 61 - "startLiveSession"
Cohesion: 0.07
Nodes (18): BrowserLogger, startLiveSession(), beginCaptureLoop(), paintVideo(), Live Session Page, Dev Diagnostics Overlay, Live Session DOM Id Contract, loadConfig (live session exercise config fetch) (+10 more)

### Community 62 - "lE"
Cohesion: 0.18
Nodes (13): create(), forVariant(), K2(), kt(), lE(), negative(), Ng(), recordVariant() (+5 more)

### Community 63 - "clone"
Cohesion: 0.06
Nodes (72): xr(), xt(), l(), o(), already(), applyParallelOffset(), bx(), c() (+64 more)

### Community 64 - "gemini.py"
Cohesion: 0.31
Nodes (8): build_gemini_prompt(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API. Returns the coaching text, or a…, Converts the per-rep session log into a structured coaching prompt. session_log…, Scrollable cv2 window showing the Gemini coaching report. API call runs in…, show_report_window(), _wrap_text()

### Community 65 - "jn"
Cohesion: 0.13
Nodes (20): at(), Co(), dt(), et(), ft(), it(), j(), jn() (+12 more)

### Community 66 - "dependencies"
Cohesion: 0.05
Nodes (41): bcryptjs, @cloudrumbles/indic-transliterate, cors, dotenv, express, @google/genai, jsonwebtoken, mongodb (+33 more)

### Community 67 - "IsolatedRecorder"
Cohesion: 0.22
Nodes (5): IsolatedRecorder, blobToBase64, g13 main (real worker crash run), FakePoseWorker, g13_test run

### Community 68 - "session_orchestrator.js"
Cohesion: 0.17
Nodes (14): uploadRecording(), lerpPts(), makePainter(), displayedPts(), MAX_EASE_MS, STALE_POSE_MS, endSession(), onProgress() (+6 more)

### Community 69 - "run_feature_extractor.py"
Cohesion: 0.38
Nodes (9): find_parquets(), main(), output_path_for(), parse_args(), Path, run_extractor(), validate(), CompletedProcess (+1 more)

### Community 70 - "clip_features"
Cohesion: 0.31
Nodes (8): clip_features(), label_cols(), main(), DataFrame, Path, Collapse one clip's frames into a single feature row., Everything in the manifest that isn't metadata is a label., Series

### Community 71 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): description, name, private, scripts, test:parity, test:ring_buffer, type, version

### Community 72 - "dependencies"
Cohesion: 0.05
Nodes (37): country-state-city, html2canvas, i18next, jspdf, dependencies, axios, country-state-city, html2canvas (+29 more)

### Community 73 - "run_g6_g10_test.mjs"
Cohesion: 0.42
Nodes (8): attach(), FRONTEND_ROOT, HERE, main(), MOCKUP_VALUES, runLivePageChecks(), runProbeChecks(), sleep()

### Community 74 - "test_cors.py"
Cohesion: 0.29
Nodes (6): J — cross-origin access from the pages to the API. No framework. Run from…, POST /session/start with a JSON content-type triggers a preflight. If OPTIONS…, All four, not just the one that was noticed. A page that can read /exercises…, test_j_cors_allows_the_pages_origin(), test_j_cors_covers_every_route_the_pages_call(), test_j_cors_preflight_for_session_start()

### Community 75 - "drawing.py"
Cohesion: 0.40
Nodes (4): draw_hud(), draw_hud_generic(), Generic HUD panel for any exercise. Displays the exercise name, rep counters,…, Render the semi-transparent left-side HUD panel onto frame.

### Community 76 - "backend (docker-compose service)"
Cohesion: 0.29
Nodes (7): fastapi==0.141.1, httpx==0.28.1, uvicorn==0.52.1, websockets==17.0.1, backend (docker-compose service), emg-service (docker-compose service), frontend (docker-compose service)

### Community 77 - "exerciseRecommendations.js"
Cohesion: 0.07
Nodes (35): ACTIVE_BLEEDING_PROBLEMS, ACTIVE_BLEEDING_STATES, ACTIVE_BLEEDING_TYPES, ANKLE_EXERCISES, Assessment, authMiddleware, BREATHING_EXERCISES, buildSafetyPatient() (+27 more)

### Community 79 - "requirements.txt (root)"
Cohesion: 0.38
Nodes (7): fastapi 0.115.6 (root), graphifyy (root, knowledge-graph tool dep), litellm (LLM proxy, root), mcp 1.29.0 (root), openai SDK (root), requirements.txt (root), tree-sitter language parser set (root)

### Community 80 - "check_data_sources"
Cohesion: 0.33
Nodes (6): E-DEC.2, and the reason it matters: the IMU's whole value is being an…, test_e11_absent_sensor_is_never_imputed(), test_e11_missing_declared_source_blocks_scoring(), test_e11_present_sources_allow_scoring(), check_data_sources(), E11 / E-DEC.2. A model declares the sensors it REQUIRES at scoring time; a…

### Community 81 - "session_ws.py"
Cohesion: 0.10
Nodes (35): correlation(), Set correlation IDs for the duration of the `with` block (and anything awaited…, end_session(), get_lookup_doctor_id(), get_session(), ASYNC as of G2-D4 (see module docstring). session_ws.py awaits this., Set by app/db.py's lifespan to the real motor-backed lookup of…, Idempotent: the End Session button, the WS {"type":"end"} message, and the H6… (+27 more)

### Community 82 - "_old_physio_reference/requirements.txt"
Cohesion: 0.40
Nodes (5): faster-whisper (speech-to-text), graphifyy (old_physio_reference), manim (Manim animation library), mediapipe (pose/landmark detection), tree-sitter language parser set (old_physio_reference)

### Community 83 - "fake_session_client.py"
Cohesion: 0.60
Nodes (4): _drive(), _frame(), main(), H7 — fake session client. Drives a live session over a REAL WebSocket without a…

### Community 84 - "postRun"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run(), doRun()

### Community 85 - "postRun"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run(), doRun()

### Community 86 - "assessment.js"
Cohesion: 0.06
Nodes (23): jwt, fhirResourceSchema, mongoose, Assessment, authMiddleware, express, HemophiliaDetails, PatientProfile (+15 more)

### Community 87 - "CurrentUser"
Cohesion: 0.11
Nodes (26): authorize_patient_access(), CurrentUser, _decode(), decode_ws_token(), get_current_user(), G2-B1/B2/B6 — JWT auth shared with their (part2) backend. Their JWT: HS256,…, True iff `user` may read/act on `patient_user_id`'s clinical data. Rules (§3,…, Shared decode path for both the HTTP dependency and the WS handshake. Expired… (+18 more)

### Community 88 - "exercises.py"
Cohesion: 0.40
Nodes (4): list_exercises(), get, Request, GET /exercises — F6. Returns the exercise registry, including thresholds, so…

### Community 89 - "test_events_mirror.py"
Cohesion: 0.50
Nodes (4): parse_js_events(), Path, Checks backend/app/events.py and frontend/src/lib/events.js declare the same…, test_mirror()

### Community 90 - "_fit_model"
Cohesion: 0.40
Nodes (5): _assemble_multioutput(), Post-hoc assembly: set the internals MultiOutputClassifier.fit() would have…, _fit_model(), A real fitted multi-label estimator. Real, not a mock -- E3 check 4 loads it…, MultiOutputClassifier

### Community 91 - "patientResearch.js"
Cohesion: 0.08
Nodes (28): allowRoles(), jwt, staffAuth(), mongoose, patientExerciseRecommendationSchema, Assessment, buildAssessmentExplanation(), buildAssessmentFactors() (+20 more)

### Community 92 - "makeVertexAttributes"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 93 - "doctorDashboard.js"
Cohesion: 0.06
Nodes (28): assessmentSchema, { Binary }, DATA_KEY_ID, encryptedString, encryptedStringArray, mongoose, IMPORTANT:, dataKeyId (+20 more)

### Community 94 - "makeVertexAttributes"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 95 - "run_g13_test.mjs"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 96 - "run_g5_test.mjs"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 97 - "mini_squat.py"
Cohesion: 0.67
Nodes (3): extract(), Mini Squat exercise-specific feature extractor. Input : common_feature.parquet…, select_columns()

### Community 98 - "find_videos"
Cohesion: 0.67
Nodes (3): find_videos(), main(), Find videos recursively, preserving their paths relative to input_root.

### Community 99 - "backend/run_tests.sh"
Cohesion: 0.67
Nodes (3): run(), SESSION_DATA_DIR, run_tests.sh script

### Community 100 - "compilerOptions"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 101 - "___syscall_ioctl"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 102 - "___syscall_ioctl"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 103 - "devDependencies"
Cohesion: 0.50
Nodes (3): devDependencies, shadcn, shadcn

### Community 108 - "docs/06_ml_pipeline.md §14"
Cohesion: 0.67
Nodes (3): mediapipe==1.0.0, pandas==3.0.5, docs/06_ml_pipeline.md §14

### Community 113 - "compareByDay"
Cohesion: 0.50
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 114 - "write"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 115 - "compareByDay"
Cohesion: 0.50
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 116 - "write"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 117 - "apiClient.js"
Cohesion: 0.09
Nodes (13): api, STAFF_PATH_PREFIXES, s, AdminDoctors(), AdminManagement(), emptyForm, styles, ConsentScreen() (+5 more)

### Community 118 - "exercise_config.py"
Cohesion: 0.11
Nodes (24): ExerciseConfigError, load_exercises(), Any, Path, Exercise registry loader — Phase F (backend-core-agent). Pure-data config:…, Load, validate, and return the exercise registry as {name: record}. Not cached…, Raised when an exercise record fails validation. A config file is a trust…, A threshold (or trigger sub-field) is still a placeholder iff it is the… (+16 more)

### Community 119 - "G13 Recording Survives Worker Crash Harness"
Cohesion: 1.00
Nodes (3): G13 Recording Survives Worker Crash Harness, G13 Gate: Recording Isolated From Pose Worker, G13 Simulated Worker Crash Harness

### Community 129 - "createLazyFile"
Cohesion: 0.21
Nodes (8): createLazyFile(), stream_ops, writeChunks(), forceLoadFile(), get_char(), intArrayFromString(), mmap(), read()

### Community 136 - "createLazyFile"
Cohesion: 0.22
Nodes (8): createLazyFile(), stream_ops, writeChunks(), forceLoadFile(), get_char(), intArrayFromString(), mmap(), read()

### Community 144 - "app/__init__.py"
Cohesion: 0.29
Nodes (5): _load_env(), Path, app package. Loads the shared environment BEFORE any submodule imports, because…, Minimal KEY=VALUE reader. Deliberately not python-dotenv: this runs at package…, Docker entrypoint for the emg-service Flask app. Owned by the devops agent…

### Community 147 - "fhir.js"
Cohesion: 0.08
Nodes (23): { Binary }, dataKeyId, DATA_KEY_ID, encryptedString, encryptedStringArray, hemophiliaDetailsSchema, mongoose, dataKeyId (+15 more)

### Community 148 - "adminPatientResearch.js"
Cohesion: 0.10
Nodes (24): adminAuth, Assessment, buildAssessmentExplanation(), buildAssessmentFactors(), buildBleedingHistory(), buildFamilyGeneticHistory(), buildJointDistribution(), buildRiskTrend() (+16 more)

### Community 150 - "App.jsx"
Cohesion: 0.11
Nodes (14): RequireAuth(), AdminDashboard(), AdminDoctorRequests(), AdminLogin(), AuthScreen(), AwarenessScreen(), CareGuidanceScreen(), DoctorChangePassword() (+6 more)

### Community 152 - "src/index.js"
Cohesion: 0.08
Nodes (24): adminAuthRoutes, adminPatientResearchRoutes, adminRoutes, app, authRoutes, chatbotRoutes, connectDB, doctorAuthRoutes (+16 more)

### Community 154 - "User.js"
Cohesion: 0.08
Nodes (19): jwt, User, jwt, User, dataKeyId, mongoose, userSchema, bcrypt (+11 more)

### Community 155 - "db.py"
Cohesion: 0.12
Nodes (18): _FakeCollection, _FakeCursorResult, _FakeDb, lifespan(), make_lookup_doctor_id(), Any, G2-D2 -- Motor client lifecycle, and the read-only lookups D5/B6 need:…, Merged into app/main.py's lifespan via include_router (see module docstring).… (+10 more)

### Community 156 - "test_history.py"
Cohesion: 0.19
Nodes (18): _auth(), _cleanup_sessions(), _lookup_docA_only_for_p1(), G2-G2 -- GET /patients/{id}/sessions. No framework. Run from backend/:…, A raw literal id (not 'me', not PATxxx) is a patientUserId -- p2 reading it…, The load-bearing matrix. docA is p1's doctor; docB is nobody's. p2 has NO…, PATxxxxxx -> patientUserId, via a real inserted patientprofiles row -- what the…, _start_session() (+10 more)

### Community 167 - "bundleMapper.js"
Cohesion: 0.16
Nodes (13): toFHIRBundle(), { toFHIRCondition }, { toFHIRMedicationStatement }, { toFHIRObservations }, { toFHIRPatient }, { toFHIRQuestionnaireResponse }, toFHIRCondition(), TODO: (+5 more)

### Community 168 - "hemophiliaDetails.js"
Cohesion: 0.12
Nodes (17): Assessment, authMiddleware, DoctorChangeRequest, express, HemophiliaDetails, PatientProfile, router, saveFHIRBundle (+9 more)

### Community 169 - "encryption.js"
Cohesion: 0.14
Nodes (12): cryptSharedLibPath, encodedKey, fs, kmsProviders, localMasterKey, masterKeyPath, path, { requireCryptShared } (+4 more)

### Community 170 - "session_doc.py"
Cohesion: 0.17
Nodes (12): ClinicalBlock, _FakeCollection, _FakeDb, PhysioSession, BaseModel, G2-D3 -- the physiosessions schema (integration plan §4), as Pydantic, and its…, §4: everything sensitive lives under here -- one future schemaMap entry for…, Mirrors docs/09_integration_plan_group_2_ui_integration.md §4 exactly. (+4 more)

### Community 171 - "video_retention.py"
Cohesion: 0.17
Nodes (8): _FakeCollection, _FakeCursor, _FakeDb, datetime, G2-F8 -- video retention sweep. Deletes files past `clinical.video.expiresAt`,…, One pass: delete every video file whose expiresAt has passed and that hasn't…, _run(), sweep_expired_videos()

### Community 172 - "test_report.py"
Cohesion: 0.29
Nodes (14): _auth(), _cleanup(), G2-F -- report generation, video upload, retention. No framework. Run from…, test_f4_gemini_failure_preserves_counts(), test_f4_gemini_success_sets_reported(), test_f6_consent_accepts_and_writes_file(), test_f6_no_consent_rejects_and_writes_no_file(), test_f6_rejects_unsupported_content_type() (+6 more)

### Community 173 - "db.js"
Cohesion: 0.13
Nodes (13): { Binary }, {
    cryptSharedLibPath,
    cryptSharedAvailable: csfleAvailable,
}, DATA_KEY_ID, doctorRegistrationSchema, encodedKey, fhirSchema, fs, kmsProviders (+5 more)

### Community 174 - "posture_checks.py"
Cohesion: 0.17
Nodes (12): angle_2d(), Angle at point B using 2D pixel coordinates (x, y). Best used for front-view…, check_butt_wink(), check_heel_lift(), check_neck(), check_posture_front(), check_posture_side(), Detects neck out of neutral (looking up or down excessively). Measures the… (+4 more)

### Community 175 - "DoctorRegistrationRequest.js"
Cohesion: 0.15
Nodes (11): DATA_KEY_ID, doctorRegistrationRequestSchema, encryptedFile, encryptedString, mongoose, DoctorRegistrationRequest, express, multer (+3 more)

### Community 176 - "chatbot.js"
Cohesion: 0.17
Nodes (7): ai, express, { GoogleGenAI }, models, path, router, { spawn }

### Community 177 - "DoctorDashboard.jsx"
Cohesion: 0.20
Nodes (4): ExerciseReviewPanel(), CHART_COLORS, DoctorDashboard(), Icon

### Community 178 - "ProfileStepper.jsx"
Cohesion: 0.20
Nodes (9): bloodGroupOptions, educationOptions, emptyProfile, genderOptions, insuranceOptions, maritalOptions, ProfileStepper(), relationshipOptions (+1 more)

### Community 179 - "cryptoConfig.js"
Cohesion: 0.22
Nodes (8): cryptSharedLibPath, encodedKey, fs, kmsProviders, localMasterKey, masterKeyPath, path, { requireCryptShared }

### Community 180 - "ExercisePlan.jsx"
Cohesion: 0.33
Nodes (8): EXERCISE_TRANSLATIONS, ExerciseCard(), ExercisePlan(), getInitialLanguage(), reportLink(), T, translateExercisePurpose(), translateExerciseValue()

### Community 181 - "cryptSharedPath.js"
Cohesion: 0.29
Nodes (6): cryptSharedAvailable, DEFAULT_LIB_PATH, fs, path, REPO_ROOT, requireCryptShared()

### Community 182 - "run_case"
Cohesion: 0.47
Nodes (4): Lm, main(), Stand-in for a mediapipe landmark: has .x .y .z attributes., run_case()

### Community 183 - "createAdmin.js"
Cohesion: 0.40
Nodes (5): bcrypt, connectDB, createAdmin(), IMPORTANT:, User

### Community 184 - "generateMasterKey.js"
Cohesion: 0.33
Nodes (5): crypto, fs, masterKey, outputPath, path

### Community 185 - "HemophiliaDetailsScreen.jsx"
Cohesion: 0.33
Nodes (3): DOCTOR_NAME_TRANSLATIONS, HemophiliaDetailsScreen(), IMPORTANT:

### Community 186 - "predict.py"
Cohesion: 0.70
Nodes (4): encode_binary(), encode_ordinal(), encode_sex(), normalize_text()

### Community 187 - "createStaffAccount.js"
Cohesion: 0.50
Nodes (4): bcrypt, connectDB, createStaffAccount(), User

### Community 188 - "AdminDoctorRequestDetails.jsx"
Cohesion: 0.50
Nodes (3): AdminDoctorRequestDetails(), getStatusClassStatic(), InfoItem()

### Community 189 - "AdminProfile.jsx"
Cohesion: 0.40
Nodes (3): AdminProfile(), empty, s

### Community 190 - "testMongoConnect.js"
Cohesion: 0.50
Nodes (3): client, { MongoClient }, p

### Community 193 - "build_obsidian_vault.py"
Cohesion: 0.67
Nodes (3): main(), name_for(), Vault-only view: project code, re-clustered, coloured. Reads graphify-…

### Community 195 - "syncfs"
Cohesion: 1.00
Nodes (3): syncfs(), doCallback(), done()

### Community 196 - "syncfs"
Cohesion: 1.00
Nodes (3): syncfs(), doCallback(), done()

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
- **482 isolated node(s):** `npx`, `SESSION_DATA_DIR`, `$schema`, `style`, `rsc` (+477 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1459 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

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
- **Why does `document()` connect `decl` to `tailwind.js`, `init`, `init`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `init()` connect `init` to `vision_wasm_internal.js`, `decl`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
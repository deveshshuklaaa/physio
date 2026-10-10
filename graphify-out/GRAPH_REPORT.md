# Graph Report - final_project  (2026-10-10)

## Corpus Check
- 308 files · ~590,148 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2500 nodes · 4101 edges · 199 communities (133 shown, 53 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 217 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6d84cee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layer1_phase6_7.test.js
- otpAuth.js
- layer2_helpers.js
- checks/index.js
- profile.js
- layer2_guards.test.js
- train_model.py
- db
- doctorPatients.js
- layer2_validation.test.js
- cn
- rules.js
- layer1_names.test.js
- phase3_role_split.js
- exercise_config.py
- emg_imu_app.py
- helpers.js
- session_ws.py
- layer1_csfle_gate.test.js
- phase4_name_split.js
- layer2_otp.test.js
- phase1_cleanup.js
- phase6_assessments.js
- layer2_authz.test.js
- startLiveSession
- SessionWsClient
- hs_tke_checks.test.mjs
- session.py
- layer1_placement.test.js
- dependencies
- phase3_strip_users.js
- emg-service
- TestClient
- helpers.mjs
- exerciseRecommendations.js
- app/main.py
- test_session_ws.py
- displayName
- dependencies
- phase4_fix_nametranslations.js
- otpService.js
- phase5_otp_merge.js
- AdminPatientResearch.jsx
- assessment.js
- dependencies
- dataKey.js
- pose_engine.js
- patientResearch.js
- common_features.py
- l2_clean.js
- db.py
- test_validate_model_package.py
- detect_view
- angles.js
- admin.js
- saveFHIRResource.js
- test_admin_models.py
- exercise_runner.py
- test_e7_status_lists_every_configured_exercise
- test_e8_missing_model_does_not_crash_startup
- test_e8_live_feedback_survives_a_missing_model
- adminPatientResearch.js
- test_e_gate.py
- _lookup_docA_only_for_p1
- test_h5_does_not_cross_the_job_queue_ownership_line
- App.jsx
- get_buffer
- RingBuffer
- validate_model_package.py
- ExerciseDefinition
- admin.py
- smoothing_audio.test.mjs
- BrowserLogger
- src/index.js
- passwordReset.js
- test_history.py
- session_orchestrator.js
- EMG Live Monitor
- extract_landmarks.py
- bundleMapper.js
- hemophiliaDetails.js
- _get
- components.json
- run_j_test.mjs
- fhir.js
- SessionBuffer
- skeleton_selfcheck.mjs
- encryption.js
- gemini_report.py
- events.js
- test_report.py
- db.js
- api
- admin_models.py
- ExerciseDefinition
- doctorAuth.js
- apiClient.js
- history.py
- posture_checks.py
- pose_engine_selfcheck.mjs
- routes/auth.js
- chatbot.js
- test_k_compose.py
- recommendation_inference.py
- IsolatedRecorder
- DoctorDashboard.jsx
- ProfileStepper.jsx
- run_feature_extractor.py
- ExercisePlan.jsx
- clip_features
- gemini.py
- frontend/package.json
- run_g6_g10_test.mjs
- test_cors.py
- FakeWebSocket
- cryptSharedPath.js
- HemophiliaDetailsScreen.jsx
- check_data_sources
- test_calibration_gate.py
- _old_physio_reference/requirements.txt
- run_g13_test.mjs
- run_g5_test.mjs
- run_case
- generateMasterKey.js
- AdminChangePassword.jsx
- test_events_mirror.py
- _fit_model
- drawing.py
- fake_session_client.py
- predict.py
- test_targetJoint_normalize.js
- AdminDoctorRequestDetails.jsx
- AdminProfile.jsx
- DoctorProfile.jsx
- mini_squat.py
- find_videos
- backend/run_tests.sh
- compilerOptions
- FIFO Frame/Result Latency Correlation
- devDependencies
- testMongoConnect.js
- frontend/src/main.jsx
- Layout.jsx
- AdminManagement.jsx
- ForgotPassword.jsx
- PatientResearch.jsx
- build_obsidian_vault.py
- heel_slide.py
- seated_knee_extension.py
- slr.py
- tke.py
- p0_legacy_bench.py
- dev
- frontend/run_tests.sh
- G13 Recording Survives Worker Crash Harness
- shadcn
- raw-test.js
- scripts/passwordResetEmailService.js
- test_e9_converted_model_predicts
- classic_probe_worker.js
- vite.config.mjs
- /api/* (Hemophilia backend)
- emg-nav (navigation)
- emg-service/website/history.html
- emg-service/website/index.html
- emg-service/website/live.html
- emg-service/website/playback.html
- emg-service/website/progress.html
- frontend/src/pages/live_session.html
- anq.png
- ask-icon.png
- banner.png
- care.png
- ex.png
- exercise.png
- gr.png
- home-bg.png
- is.png
- login-bg.png
- login-hero.png
- medical-bg.png
- ra.png
- reg-bg.png
- reg.png
- AI Hemophilia Support
- Session Report

## God Nodes (most connected - your core abstractions)
1. `api` - 30 edges
2. `cn()` - 26 edges
3. `CurrentUser` - 23 edges
4. `displayName()` - 23 edges
5. `run_exercise()` - 21 edges
6. `_validate()` - 20 edges
7. `detect_view()` - 19 edges
8. `startLiveSession()` - 19 edges
9. `_auth()` - 18 edges
10. `_card()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `run_case()` --calls--> `angle_2d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `angle_3d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `torso_lean()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `detect_view()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `status()` --indirect_call--> `calibration_ok()`  [INFERRED]
  hardware/esp32_imu/backend/emg_imu_app.py → backend/app/services/emg_client.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Data Persistence Layer** — database:mongodb-atlas, service:backend, service:hemo-backend, config:env-file, service:emg-service [EXTRACTED]
- **ML Pipeline Dependencies** — tech:ml-runtime, file:backend/requirements.txt, file:part2/Hemophillia-confirm/backend/ml/requirements.txt, tech:mediapipe, tech:opencv [EXTRACTED]
- **Nginx Reverse Proxy Routing** — service:nginx, service:backend, service:frontend, service:hemo-backend, service:hemo-frontend, api:backend-engine, api:backend-ws, api:hemo-api [EXTRACTED]
- **Standalone Browser Gate Probe Harnesses (G5/G7/G8/G13)** — frontend_tools_g13_recording_survives, frontend_tools_g13_test_index, frontend_tools_g5_worker_test_index, frontend_tools_g5_worker_test_classic_probe, frontend_tools_g6_g10_test_render_audio_probe [INFERRED 0.85]
- **JWT Authentication Flow** — tech:PyJWT, config:env-file, service:backend, service:hemo-backend, page:live-session [INFERRED]
- **EMG Service Stack** — service:emg-service, page:live-monitor, page:recording-history, page:playback, page:progress, feature:emg-live-streaming, feature:emg-recording, feature:emg-playback, feature:progress-tracking, feature:calibration, design-system:clinical-kinetic, tech:flask, tech:tailwind, tech:clinical-theme, tech:chartjs [INFERRED]
- **Hemophilia Support Stack** — service:hemo-backend, service:hemo-frontend, page:hemo-frontend, tech:react, tech:vite, database:mongodb-atlas [INFERRED]
- **Rehab Assessment Engine Stack** — service:backend, service:frontend, page:live-session, page:session-report, feature:rehab-live-session, tech:fastapi, tech:react, tech:vite, tech:mediapipe, tech:websockets [INFERRED]

## Communities (199 total, 53 thin omitted)

### Community 0 - "layer1_phase6_7.test.js"
Cohesion: 0.08
Nodes (19): ALWAYS_EMPTY, assert, { connectEncrypted, raw, prodCounts, readProdOne, teardown, isCiphertext }, crOf(), deriveOf(), FACTOR_OF, fs, LAT_JOINTS (+11 more)

### Community 1 - "otpAuth.js"
Cohesion: 0.09
Nodes (23): adminAuth(), AdminProfile, jwt, { resolveAdminAuthz }, User, adminAuth(), AdminProfile, jwt (+15 more)

### Community 2 - "layer2_helpers.js"
Cohesion: 0.12
Nodes (18): BASE, bcrypt, collNames(), crypto, { cryptSharedAvailable, cryptSharedLibPath }, diffCounts(), finish(), jwt (+10 more)

### Community 3 - "checks/index.js"
Cohesion: 0.17
Nodes (12): CHECKS, EXERCISE_CHECKS, CHECKS, CHECKS, CHECKS, CHECKS, LM, VISIBILITY_THRESH (+4 more)

### Community 4 - "profile.js"
Cohesion: 0.11
Nodes (17): { allow, check }, authMiddleware, CONSENT_FIELDS, CONSENT_SPEC, { displayName }, express, FHIRResource, generatePatientId() (+9 more)

### Community 5 - "layer2_guards.test.js"
Cohesion: 0.14
Nodes (12): adopt(), assert, ctx, docCases, expectRejected(), fingerprint(), H, LONG (+4 more)

### Community 6 - "train_model.py"
Cohesion: 0.23
Nodes (13): export_exercise(), main(), Path, choose_grouping(), evaluate(), main(), make_model(), DataFrame (+5 more)

### Community 7 - "db"
Cohesion: 0.28
Nodes (16): api(), assert, assertAppOnStaging(), assertTargets(), db(), mail(), mkAdmin(), mkPatient() (+8 more)

### Community 8 - "doctorPatients.js"
Cohesion: 0.13
Nodes (14): allowRoles(), jwt, staffAuth(), Assessment, ClinicalRecord, clinicalRecords, { displayName }, DoctorChangeRequest (+6 more)

### Community 9 - "layer2_validation.test.js"
Cohesion: 0.15
Nodes (10): adopt(), assert, CONSENT5, ctx, expect400(), FORBIDDEN, H, { ObjectId } (+2 more)

### Community 10 - "cn"
Cohesion: 0.06
Nodes (46): ShinyText(), SpotlightCard(), Alert(), AlertDescription(), AlertTitle(), alertVariants, Badge(), badgeVariants (+38 more)

### Community 11 - "rules.js"
Cohesion: 0.26
Nodes (11): AUDIO_BASE, AUDIO_MAP, CHECK_REGISTRY, depthAlert(), KNOWN_CHECKS, rulesForExercise(), thresholdAlert(), thresholdValue() (+3 more)

### Community 12 - "layer1_names.test.js"
Cohesion: 0.16
Nodes (9): assert, drrDoc(), fs, { isCiphertext, connectEncrypted, raw, prodCounts, teardown }, mail(), path, SRC, { test, before, after } (+1 more)

### Community 13 - "phase3_role_split.js"
Cohesion: 0.15
Nodes (11): ADMIN_KEYS, AdminProfile, assert, connectDB, { cryptSharedAvailable }, DOC_KEYS, DoctorProfile, DoctorRegistrationRequest (+3 more)

### Community 14 - "exercise_config.py"
Cohesion: 0.16
Nodes (18): ExerciseConfigError, load_exercises(), Any, Path, Exercise registry loader — Phase F (backend-core-agent). Pure-data config:…, Load, validate, and return the exercise registry as {name: record}. Not cached…, Raised when an exercise record fails validation. A config file is a trust…, A threshold (or trigger sub-field) is still a placeholder iff it is the… (+10 more)

### Community 15 - "emg_imu_app.py"
Cohesion: 0.07
Nodes (50): add_annotation(), add_to_history(), _annotations_path(), arm(), compress_capture_file(), control_reader(), ControlUDPHandler, delete_annotation() (+42 more)

### Community 16 - "helpers.js"
Cohesion: 0.22
Nodes (11): assert, connectEncrypted(), guardDb(), masterKey(), models, { MongoClient }, path, prodCounts() (+3 more)

### Community 17 - "session_ws.py"
Cohesion: 0.10
Nodes (30): authorize_patient_access(), CurrentUser, _decode(), decode_ws_token(), get_current_user(), G2-B1/B2/B6 — JWT auth shared with their (part2) backend. Their JWT: HS256,…, True iff `user` may read/act on `patient_user_id`'s clinical data. Rules (§3,…, Shared decode path for both the HTTP dependency and the WS handshake. Expired… (+22 more)

### Community 18 - "layer1_csfle_gate.test.js"
Cohesion: 0.17
Nodes (11): raw(), teardown(), testUri, assert, cfg, fs, path, probe (+3 more)

### Community 19 - "phase4_name_split.js"
Cohesion: 0.17
Nodes (8): assert, connectDB, { cryptSharedAvailable }, { displayName }, { MongoClient }, mongoose, PARTS, User

### Community 20 - "layer2_otp.test.js"
Cohesion: 0.17
Nodes (5): assert, bcrypt, H, IDENTITY, { test, before, after }

### Community 21 - "phase1_cleanup.js"
Cohesion: 0.18
Nodes (9): assert, AVANISH, AYUSH, connectDB, { cryptSharedAvailable }, GANGU, { MongoClient, ObjectId }, mongoose (+1 more)

### Community 22 - "phase6_assessments.js"
Cohesion: 0.20
Nodes (10): assert, connectDB, { cryptSharedAvailable }, { deriveFromAnswers }, DROP, empty(), { MongoClient }, mongoose (+2 more)

### Community 23 - "layer2_authz.test.js"
Cohesion: 0.18
Nodes (9): assert, fs, H, jwt, MOUNTS, { ObjectId }, path, routesDir (+1 more)

### Community 24 - "startLiveSession"
Cohesion: 0.22
Nodes (4): startLiveSession(), beginCaptureLoop(), onProgress(), paintVideo()

### Community 26 - "hs_tke_checks.test.mjs"
Cohesion: 0.22
Nodes (5): feed(), HS_A, HS_CFG, HS_V, hsPts()

### Community 27 - "session.py"
Cohesion: 0.13
Nodes (34): correlation(), Set correlation IDs for the duration of the `with` block (and anything awaited…, get_video(), Request, UploadFile, G2-G4: play back a session's video. The counterpart to the upload above --…, upload_video(), _authorize_or_403() (+26 more)

### Community 28 - "layer1_placement.test.js"
Cohesion: 0.20
Nodes (7): isCiphertext(), assert, { isCiphertext, connectEncrypted, raw, prodCounts, teardown }, KEEP, MATRIX, STRIP14, { test, before, after }

### Community 29 - "dependencies"
Cohesion: 0.05
Nodes (39): country-state-city, html2canvas, i18next, jspdf, dependencies, axios, country-state-city, html2canvas (+31 more)

### Community 30 - "phase3_strip_users.js"
Cohesion: 0.22
Nodes (8): AdminProfile, assert, connectDB, { cryptSharedAvailable }, DoctorProfile, KEEP, mongoose, STRIP14

### Community 31 - "emg-service"
Cohesion: 0.06
Nodes (39): /engine/* (FastAPI backend), /ws/* (WebSocket), .env file, MongoDB Atlas, IMU Calibration, Live EMG Streaming, EMG Playback with Annotations, EMG Recording (+31 more)

### Community 32 - "TestClient"
Cohesion: 0.12
Nodes (33): _auth(), H4, H5 — session lifecycle endpoints. G2-B3/B6 — auth and authorization. No…, Called twice, one job. Not two jobs, not an error on the second call -- the…, H5 returns immediately. The job is recorded as pending work; the report…, §4 lists routes/session.py as "start / end / status". The status read is what…, Context-manager-free install/uninstall of the B6 seam…, D12: a client-supplied patient_id must never override the token., The load-bearing B6 test. docA is p1's doctor; docB is nobody's. p2 has no… (+25 more)

### Community 33 - "helpers.mjs"
Cohesion: 0.17
Nodes (11): allConfiguredAlerts(), CONFIG_PATH, ctxFor(), exerciseByName(), FakeAudio, loadRealConfig(), makeLms(), makePts() (+3 more)

### Community 34 - "exerciseRecommendations.js"
Cohesion: 0.07
Nodes (36): Assessment, authMiddleware, buildMlPatient(), ClinicalRecord, daysSince(), { displayName }, express, fs (+28 more)

### Community 35 - "app/main.py"
Cohesion: 0.08
Nodes (34): emg_history(), emg_live(), emg_status(), Get EMG recording history from Flask service., Get current live EMG reading from Flask service., Get EMG capture status from Flask service., R1.2b: poll target for the calibrate gate. NOTE the bare path -- NOT…, session_calibration_status() (+26 more)

### Community 36 - "test_session_ws.py"
Cohesion: 0.11
Nodes (34): _auth_frame(), _batch(), _frames(), _http_auth(), H2, H3, H6 — the session WebSocket. G2-B4 — the WS auth handshake. No…, D3/B4: send this as the first message on every socket under test, or the server…, A batch in the client.js wire format lands in that session's buffer., R6. Frames sit in memory after receive; the flush is somebody else's turn of… (+26 more)

### Community 37 - "displayName"
Cohesion: 0.08
Nodes (31): AdminProfile, bcrypt, connectDB, createAdmin(), { displayName, splitName }, IMPORTANT:, User, bcrypt (+23 more)

### Community 38 - "dependencies"
Cohesion: 0.06
Nodes (35): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, lucide-react, motion, radix-ui (+27 more)

### Community 39 - "phase4_fix_nametranslations.js"
Cohesion: 0.22
Nodes (7): assert, connectDB, { cryptSharedAvailable }, LEGACY_INVALID_IDS, { MongoClient }, mongoose, User

### Community 40 - "otpService.js"
Cohesion: 0.12
Nodes (19): OTP_EXPIRY_MINUTES, bcrypt, {
  createLoginOTP,
}, express, IMPORTANT:, router, User, sendLoginOTP() (+11 more)

### Community 41 - "phase5_otp_merge.js"
Cohesion: 0.22
Nodes (7): assert, connectDB, { cryptSharedAvailable }, LEGACY, { MongoClient }, mongoose, OtpChallenge

### Community 42 - "AdminPatientResearch.jsx"
Cohesion: 0.67
Nodes (3): AdminPatientResearch(), cap(), IMPORTANT:

### Community 43 - "assessment.js"
Cohesion: 0.12
Nodes (12): jwt, Assessment, authMiddleware, clinicalRecords, express, PatientProfile, IMPORTANT:, IMPORTANT: (+4 more)

### Community 44 - "dependencies"
Cohesion: 0.05
Nodes (43): bcryptjs, @cloudrumbles/indic-transliterate, cors, dotenv, express, google-auth-library, @google/genai, jsonwebtoken (+35 more)

### Community 46 - "pose_engine.js"
Cohesion: 0.12
Nodes (14): ANGLE_FILTER, DISPLAY_FILTER, MP_CONFIDENCE, REP_GUARDS, buildPts(), PoseEngine, init(), frame() (+6 more)

### Community 47 - "patientResearch.js"
Cohesion: 0.10
Nodes (24): Assessment, buildAssessmentExplanation(), buildAssessmentFactors(), buildBleedingHistory(), buildFamilyGeneticHistory(), buildJointDistribution(), buildRiskTrend(), buildTreatment() (+16 more)

### Community 48 - "common_features.py"
Cohesion: 0.08
Nodes (31): ComponentLogger, _JsonFormatter, _make_handler(), _next_seq(), Renders the pre-built dict on record.extra_fields as one JSON line. All the…, Thin wrapper around stdlib logging.Logger that builds the §8b.1/8b.5 schema…, §8b.5 — every ERROR/FATAL line carries error_type, error_message, stack,…, Queue a log line. `sample_every=N` keeps 1-in-N calls for this event (anomalies… (+23 more)

### Community 50 - "db.py"
Cohesion: 0.05
Nodes (35): _FakeCollection, _FakeCursorResult, _FakeDb, _FakeUsers, lifespan(), make_lookup_doctor_id(), Any, G2-D2 -- Motor client lifecycle, and the read-only lookups D5/B6 need:… (+27 more)

### Community 51 - "test_validate_model_package.py"
Cohesion: 0.15
Nodes (30): _assert_reason(), _card(), E1-E5, E9, E10 — the model package contract and its gate. No framework. Run…, E4: the rejection must NAME the problem. A report that fails for the right…, Every E2 field is required. is_tree_based especially -- it gates the SHAP path…, The plan is explicit: caveats may be empty but must be PRESENT, so a card…, E-DEC.1. The placeholder bundles hold {label: estimator} dicts, which have…, E3 check 8 is explicitly a WARNING. Blocking on it would make every environment… (+22 more)

### Community 52 - "detect_view"
Cohesion: 0.16
Nodes (28): Defines what drives the rep state machine. The engine watches the angle of the…, RepTrigger, check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front() (+20 more)

### Community 53 - "angles.js"
Cohesion: 0.22
Nodes (13): angle2d(), angle3d(), clip(), detectView(), torsoLean(), VIEW_Z_DIFF_THRESHOLD, CHECKS, computeJointAngle() (+5 more)

### Community 54 - "admin.js"
Cohesion: 0.08
Nodes (23): ADMIN_SPEC, adminAuth, AdminProfile, { allow, check }, bcrypt, { createLoginOTP, verifyLoginOTP }, crypto, { displayName, withFullName } (+15 more)

### Community 56 - "test_admin_models.py"
Cohesion: 0.15
Nodes (22): E6, E7, E8, E11 — model admin routes and the startup registry. No framework.…, I8 gates SHAP on this flag, so it must be visible without opening the package…, E11 needs it, and an operator needs to know a model wants an IMU BEFORE a…, A malformed package is an expected input, not a server fault. It must come back…, test_e6_corrupt_upload_is_handled(), test_e6_rejection_is_a_report_not_a_crash(), test_e6_upload_accepts_a_valid_package(), test_e7_status_reports_data_sources() (+14 more)

### Community 57 - "exercise_runner.py"
Cohesion: 0.11
Nodes (25): draw_skeleton(), Draw the skeleton overlay on frame. Two-pass render (shadow + colour) for…, _compute_joint_angle(), _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Run all JointChecks for current view. Returns (alerts, joint_angles,…, Draw the semi-transparent left HUD panel onto frame in-place. (+17 more)

### Community 61 - "adminPatientResearch.js"
Cohesion: 0.10
Nodes (25): adminAuth, Assessment, buildAssessmentExplanation(), buildAssessmentFactors(), buildBleedingHistory(), buildFamilyGeneticHistory(), buildJointDistribution(), buildRiskTrend() (+17 more)

### Community 62 - "test_e_gate.py"
Cohesion: 0.12
Nodes (23): gate_e8_degrades_instead_of_crashing(), gate_phase_e(), PHASE E GATE — MASTER_BUILD_PLAN_v3.md §7. | E | A deliberately malformed zip…, Supporting check. Not a §7 clause, but the difference between a usable app and…, _status(), _upload(), _free_port(), H7 — the fake-client test script, exercised for real. No framework. Run from… (+15 more)

### Community 67 - "App.jsx"
Cohesion: 0.11
Nodes (14): RequireToken(), AdminDashboard(), AdminDoctorRequests(), AdminLogin(), AwarenessScreen(), CareGuidanceScreen(), ConsentScreen(), DoctorChangePassword() (+6 more)

### Community 68 - "get_buffer"
Cohesion: 0.13
Nodes (24): close_buffer(), get_buffer(), Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3/R6). R3:…, Flush and drop from the registry. Returns frames flushed., _frame(), _fresh_tmp_root(), H1 — session_buffer.py self-checks. No framework. Run from backend/:…, The evidence path. A flush that returns cleanly but writes nothing is the worst… (+16 more)

### Community 70 - "RingBuffer"
Cohesion: 0.20
Nodes (4): LEVELS, RingBuffer, drained, rb

### Community 71 - "validate_model_package.py"
Cohesion: 0.13
Nodes (21): convert(), _legacy_cv_scores(), Path, repackage_legacy_bundle.py — DISPOSABLE, one-off converter (E9).…, Converts each legacy `*_rf.pkl` bundle in `paths` into the E1 package layout…, Best-effort: pull real CV numbers out of the existing…, The whole point of E9: whatever it emits must satisfy E3. This closes the loop…, test_e9_converter_output_passes_the_real_gate() (+13 more)

### Community 76 - "ExerciseDefinition"
Cohesion: 0.15
Nodes (18): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_all_exercise_definitions(), get_exercise_definition() (+10 more)

### Community 79 - "admin.py"
Cohesion: 0.20
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 80 - "smoothing_audio.test.mjs"
Cohesion: 0.14
Nodes (7): AudioCuePlayer, createSmoother(), EmaSmoother, OneEuroScalar, OneEuroSmoother, SQUAT, Per-Alert 4s Audio Cue Debounce

### Community 83 - "src/index.js"
Cohesion: 0.07
Nodes (25): adminAuthRoutes, adminPatientResearchRoutes, adminRoutes, app, authRoutes, chatbotRoutes, connectDB, doctorAuthRoutes (+17 more)

### Community 84 - "passwordReset.js"
Cohesion: 0.08
Nodes (18): allowedRoles, bcrypt, { check }, crypto, express, HEX64, RFC-5321, {
  OTP_EXPIRY_SECONDS,
  OTP_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} (+10 more)

### Community 85 - "test_history.py"
Cohesion: 0.21
Nodes (17): _auth(), _cleanup_sessions(), _lookup_docA_only_for_p1(), G2-G2 -- GET /patients/{id}/sessions. No framework. Run from backend/:…, A raw literal id (not 'me', not PATxxx) is a patientUserId -- p2 reading it…, The load-bearing matrix. docA is p1's doctor; docB is nobody's. p2 has NO…, PATxxxxxx -> patientUserId, via a real inserted patientprofiles row -- what the…, _start_session() (+9 more)

### Community 90 - "session_orchestrator.js"
Cohesion: 0.20
Nodes (12): uploadRecording(), lerpPts(), makePainter(), displayedPts(), MAX_EASE_MS, STALE_POSE_MS, endSession(), buildSummaryPayload() (+4 more)

### Community 91 - "EMG Live Monitor"
Cohesion: 0.12
Nodes (19): GET/POST/PUT /api/annotations/{filename}, GET /api/list_recordings, GET /api/preview/{filename}, GET /api/progress, POST /api/prune_history, POST /api/recalibrate, GET /api/recording/{filename}, GET /api/recording_meta/{filename} (+11 more)

### Community 93 - "extract_landmarks.py"
Cohesion: 0.20
Nodes (18): add_empty_landmark_columns(), add_floor_relative_columns(), batch_extract(), _ema_smoothed_columns(), estimate_clip_floor(), estimate_floor_y(), find_longest_stable_run(), find_videos() (+10 more)

### Community 94 - "bundleMapper.js"
Cohesion: 0.12
Nodes (19): toFHIRBundle(), { toFHIRCondition }, { toFHIRMedicationStatement }, { toFHIRObservations }, { toFHIRPatient }, { toFHIRQuestionnaireResponse }, toFHIRCondition(), TODO: (+11 more)

### Community 95 - "hemophiliaDetails.js"
Cohesion: 0.09
Nodes (23): { allow, check }, Assessment, authMiddleware, B, clinicalRecords, { displayName }, DoctorChangeRequest, express (+15 more)

### Community 97 - "_get"
Cohesion: 0.12
Nodes (25): health(), metrics(), get_capabilities(), Request, GET /capabilities — G2-E4. nginx strips `/engine`, so this route answers at…, list_exercises(), Request, GET /exercises — F6. Returns the exercise registry, including thresholds, so… (+17 more)

### Community 98 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 99 - "run_j_test.mjs"
Cohesion: 0.25
Nodes (17): attach(), checks, connect(), DIST, FRONTEND, gate_manualEndToEnd(), goto(), HERE (+9 more)

### Community 100 - "fhir.js"
Cohesion: 0.12
Nodes (14): Assessment, authMiddleware, clinicalRecords, express, PatientProfile, router, saveFHIRBundle, ScreeningSession (+6 more)

### Community 101 - "SessionBuffer"
Cohesion: 0.13
Nodes (8): Path, Idempotent: calling twice does not spawn a second task. `interval_s=None` reads…, Stop the background task and flush whatever remains before returning, so…, Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3)., Sync, O(n), no disk I/O., Snapshot of what's currently buffered, oldest first. Debug/test use., Append everything pending to `path` as JSONL, then drop exactly what was…, SessionBuffer

### Community 104 - "skeleton_selfcheck.mjs"
Cohesion: 0.13
Nodes (13): SKELETON_CONNECTIONS, C_BGR, COLOR, drawSkeleton(), Any Alert Turns Whole Skeleton Red, countColor (pixel assertion helper), render_audio_probe main, colorNoAlerts (+5 more)

### Community 106 - "encryption.js"
Cohesion: 0.12
Nodes (15): cryptSharedLibPath, kmsProviders, { localMasterKey }, { requireCryptShared }, requireCryptShared(), cryptSharedLibPath, kmsProviders, { localMasterKey } (+7 more)

### Community 107 - "gemini_report.py"
Cohesion: 0.19
Nodes (15): _api_key(), build_prompt(), call_gemini(), _error_descriptions(), _error_summary(), _exercise_context(), _exercise_description(), language_name() (+7 more)

### Community 110 - "events.js"
Cohesion: 0.12
Nodes (15): ALL_EVENTS, AUTH, CROSSCHECK, DB, EMG_IMU, EXERCISE_CONFIG, EXTRACTOR, isValidEvent() (+7 more)

### Community 111 - "test_report.py"
Cohesion: 0.29
Nodes (14): _auth(), _cleanup(), G2-F -- report generation, video upload, retention. No framework. Run from…, test_f4_gemini_failure_preserves_counts(), test_f4_gemini_success_sets_reported(), test_f6_consent_accepts_and_writes_file(), test_f6_no_consent_rejects_and_writes_no_file(), test_f6_rejects_unsupported_content_type() (+6 more)

### Community 113 - "db.js"
Cohesion: 0.17
Nodes (10): { Binary }, {
    cryptSharedLibPath,
    cryptSharedAvailable: csfleAvailable,
}, DATA_KEY_ID, DB_NAME, doctorRegistrationSchema, fhirSchema, kmsProviders, { localMasterKey } (+2 more)

### Community 114 - "api"
Cohesion: 0.12
Nodes (7): api, AdminDoctors(), DoctorRegistration(), IMPORTANT:, Chatbot(), IMPORTANT:, TEXT

### Community 115 - "admin_models.py"
Cohesion: 0.19
Nodes (13): lifespan(), build_model_registry(), _empty_entry(), _loaded_entry(), model_status(), Path, Request, UploadFile (+5 more)

### Community 116 - "ExerciseDefinition"
Cohesion: 0.25
Nodes (10): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_definition(), ExerciseDefinition (+2 more)

### Community 118 - "doctorAuth.js"
Cohesion: 0.12
Nodes (16): bcrypt, {
  createLoginOTP,
}, { displayName }, DoctorProfile, express, findProfile(), jwt, NAME_KEYS (+8 more)

### Community 119 - "apiClient.js"
Cohesion: 0.19
Nodes (6): homePath(), STAFF_PATH_PREFIXES, AuthScreen(), DoctorLoginScreen(), NotFound(), PermissionDenied()

### Community 120 - "history.py"
Cohesion: 0.10
Nodes (20): _load_env(), Path, app package. Loads the shared environment BEFORE any submodule imports, because…, Minimal KEY=VALUE reader. Deliberately not python-dotenv: this runs at package…, _FakeApp, _FakeCollection, _FakeDb, _FakeState (+12 more)

### Community 121 - "posture_checks.py"
Cohesion: 0.17
Nodes (12): angle_2d(), Angle at point B using 2D pixel coordinates (x, y). Best used for front-view…, check_butt_wink(), check_heel_lift(), check_neck(), check_posture_front(), check_posture_side(), Detects neck out of neutral (looking up or down excessively). Measures the… (+4 more)

### Community 126 - "pose_engine_selfcheck.mjs"
Cohesion: 0.19
Nodes (11): engine, engine2, fracsDown, fracsHold, fracsUp, frameAt(), frameAtKneeCave(), HERE (+3 more)

### Community 127 - "routes/auth.js"
Cohesion: 0.09
Nodes (24): { allow, check }, bcrypt, {
  createLoginOTP,
}, { displayName, splitName }, express, RFC-5321, jwt, { OAuth2Client } (+16 more)

### Community 128 - "chatbot.js"
Cohesion: 0.15
Nodes (8): ai, express, { GoogleGenAI }, models, path, IMPORTANT:, router, { spawn }

### Community 129 - "test_k_compose.py"
Cohesion: 0.24
Nodes (11): _load_compose(), _published_ports(), PHASE K — K1/K2 static checks. No Docker daemon required. ../venv/bin/python…, K2 -- emg_client resolves its base URL from the environment. Fresh interpreter…, K2 -- compose sets that variable to the EMG service's compose hostname.…, Host-side ports published by a service, as ints. Handles both the short string…, K1 -- docker-compose.yml: backend, emg-service, frontend., _services() (+3 more)

### Community 134 - "recommendation_inference.py"
Cohesion: 0.30
Nodes (11): dosage(), frequency(), load_metadata(), load_model(), main(), norm(), phase_from_days(), Map days to the phase labels used by the new knee exercise dataset. <= 20 ->… (+3 more)

### Community 137 - "IsolatedRecorder"
Cohesion: 0.22
Nodes (5): IsolatedRecorder, blobToBase64, g13 main (real worker crash run), FakePoseWorker, g13_test run

### Community 139 - "DoctorDashboard.jsx"
Cohesion: 0.20
Nodes (4): ExerciseReviewPanel(), CHART_COLORS, DoctorDashboard(), Icon

### Community 140 - "ProfileStepper.jsx"
Cohesion: 0.17
Nodes (11): bloodGroupOptions, educationOptions, emptyProfile, genderOptions, insuranceOptions, maritalOptions, PROFILE_FIELDS, ProfileStepper() (+3 more)

### Community 141 - "run_feature_extractor.py"
Cohesion: 0.38
Nodes (9): find_parquets(), main(), output_path_for(), parse_args(), Path, run_extractor(), validate(), CompletedProcess (+1 more)

### Community 143 - "ExercisePlan.jsx"
Cohesion: 0.29
Nodes (9): EXERCISE_TRANSLATIONS, EXERCISE_YOUTUBE_LINKS, ExerciseCard(), ExercisePlan(), getInitialLanguage(), reportLink(), T, translateExercisePurpose() (+1 more)

### Community 144 - "clip_features"
Cohesion: 0.31
Nodes (8): clip_features(), label_cols(), main(), DataFrame, Path, Collapse one clip's frames into a single feature row., Everything in the manifest that isn't metadata is a label., Series

### Community 145 - "gemini.py"
Cohesion: 0.31
Nodes (8): build_gemini_prompt(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API. Returns the coaching text, or a…, Converts the per-rep session log into a structured coaching prompt. session_log…, Scrollable cv2 window showing the Gemini coaching report. API call runs in…, show_report_window(), _wrap_text()

### Community 146 - "frontend/package.json"
Cohesion: 0.22
Nodes (8): description, name, private, scripts, test:parity, test:ring_buffer, type, version

### Community 147 - "run_g6_g10_test.mjs"
Cohesion: 0.42
Nodes (8): attach(), FRONTEND_ROOT, HERE, main(), MOCKUP_VALUES, runLivePageChecks(), runProbeChecks(), sleep()

### Community 150 - "test_cors.py"
Cohesion: 0.29
Nodes (6): J — cross-origin access from the pages to the API. No framework. Run from…, POST /session/start with a JSON content-type triggers a preflight. If OPTIONS…, All four, not just the one that was noticed. A page that can read /exercises…, test_j_cors_allows_the_pages_origin(), test_j_cors_covers_every_route_the_pages_call(), test_j_cors_preflight_for_session_start()

### Community 156 - "cryptSharedPath.js"
Cohesion: 0.14
Nodes (11): cryptSharedAvailable, DEFAULT_LIB_PATH, fs, path, REPO_ROOT, assert, connectDB, { cryptSharedAvailable } (+3 more)

### Community 157 - "HemophiliaDetailsScreen.jsx"
Cohesion: 0.29
Nodes (3): DOCTOR_NAME_TRANSLATIONS, HemophiliaDetailsScreen(), IMPORTANT:

### Community 158 - "check_data_sources"
Cohesion: 0.33
Nodes (6): E-DEC.2, and the reason it matters: the IMU's whole value is being an…, test_e11_absent_sensor_is_never_imputed(), test_e11_missing_declared_source_blocks_scoring(), test_e11_present_sources_allow_scoring(), check_data_sources(), E11 / E-DEC.2. A model declares the sensors it REQUIRES at scoring time; a…

### Community 161 - "_old_physio_reference/requirements.txt"
Cohesion: 0.40
Nodes (5): faster-whisper (speech-to-text), graphifyy (old_physio_reference), manim (Manim animation library), mediapipe (pose/landmark detection), tree-sitter language parser set (old_physio_reference)

### Community 165 - "run_g13_test.mjs"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 166 - "run_g5_test.mjs"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 167 - "run_case"
Cohesion: 0.47
Nodes (4): Lm, main(), Stand-in for a mediapipe landmark: has .x .y .z attributes., run_case()

### Community 170 - "AdminChangePassword.jsx"
Cohesion: 0.40
Nodes (4): AdminChangePassword(), RULES, S, strong()

### Community 171 - "test_events_mirror.py"
Cohesion: 0.50
Nodes (4): parse_js_events(), Path, Checks backend/app/events.py and frontend/src/lib/events.js declare the same…, test_mirror()

### Community 172 - "_fit_model"
Cohesion: 0.40
Nodes (5): _assemble_multioutput(), Post-hoc assembly: set the internals MultiOutputClassifier.fit() would have…, _fit_model(), A real fitted multi-label estimator. Real, not a mock -- E3 check 4 loads it…, MultiOutputClassifier

### Community 173 - "drawing.py"
Cohesion: 0.40
Nodes (4): draw_hud(), draw_hud_generic(), Generic HUD panel for any exercise. Displays the exercise name, rep counters,…, Render the semi-transparent left-side HUD panel onto frame.

### Community 174 - "fake_session_client.py"
Cohesion: 0.60
Nodes (4): _drive(), _frame(), main(), H7 — fake session client. Drives a live session over a REAL WebSocket without a…

### Community 180 - "predict.py"
Cohesion: 0.70
Nodes (4): encode_binary(), encode_ordinal(), encode_sex(), normalize_text()

### Community 183 - "test_targetJoint_normalize.js"
Cohesion: 0.60
Nodes (4): assert, demo(), normalizeTargetJoint(), toJointList()

### Community 184 - "AdminDoctorRequestDetails.jsx"
Cohesion: 0.50
Nodes (3): AdminDoctorRequestDetails(), getStatusClassStatic(), InfoItem()

### Community 185 - "AdminProfile.jsx"
Cohesion: 0.40
Nodes (3): AdminProfile(), empty, s

### Community 186 - "DoctorProfile.jsx"
Cohesion: 0.40
Nodes (3): DoctorProfile(), empty, s

### Community 187 - "mini_squat.py"
Cohesion: 0.67
Nodes (3): extract(), Mini Squat exercise-specific feature extractor. Input : common_feature.parquet…, select_columns()

### Community 188 - "find_videos"
Cohesion: 0.67
Nodes (3): find_videos(), main(), Find videos recursively, preserving their paths relative to input_root.

### Community 189 - "backend/run_tests.sh"
Cohesion: 0.67
Nodes (3): run(), SESSION_DATA_DIR, run_tests.sh script

### Community 193 - "compilerOptions"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 198 - "FIFO Frame/Result Latency Correlation"
Cohesion: 0.50
Nodes (4): FIFO Frame/Result Latency Correlation, finish (latency summary), G7/G8 Render and Audio Probe, Synthetic Landmarks Against Real Browser APIs

### Community 200 - "devDependencies"
Cohesion: 0.50
Nodes (3): devDependencies, shadcn, shadcn

### Community 201 - "testMongoConnect.js"
Cohesion: 0.50
Nodes (3): client, { MongoClient }, p

### Community 204 - "AdminManagement.jsx"
Cohesion: 0.50
Nodes (3): AdminManagement(), emptyForm, styles

### Community 205 - "ForgotPassword.jsx"
Cohesion: 0.50
Nodes (3): ForgotPassword(), roleInfo, styles

### Community 207 - "PatientResearch.jsx"
Cohesion: 0.60
Nodes (4): cap(), PatientResearch(), IMPORTANT:, reportLink()

### Community 208 - "build_obsidian_vault.py"
Cohesion: 0.67
Nodes (3): main(), name_for(), Vault-only view: project code, re-clustered, coloured. Reads graphify-…

### Community 222 - "G13 Recording Survives Worker Crash Harness"
Cohesion: 1.00
Nodes (3): G13 Recording Survives Worker Crash Harness, G13 Gate: Recording Isolated From Pose Worker, G13 Simulated Worker Crash Harness

## Knowledge Gaps
- **642 isolated node(s):** `npx`, `SESSION_DATA_DIR`, `$schema`, `style`, `rsc` (+637 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1230 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `run_case()` connect `run_case` to `common_features.py`, `posture_checks.py`, `detect_view`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `_authenticate()` connect `session_ws.py` to `history.py`, `common_features.py`, `session.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `uuid` connect `dependencies` to `session.py`, `emg_imu_app.py`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `TestClient` (e.g. with `test_e6_corrupt_upload_is_handled()` and `test_e6_rejection_is_a_report_not_a_crash()`) actually correct?**
  _`TestClient` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `CurrentUser` (e.g. with `patient_sessions()` and `_resolve_patient_user_id()`) actually correct?**
  _`CurrentUser` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `npx`, `SESSION_DATA_DIR`, `$schema` to the rest of the system?**
  _642 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layer1_phase6_7.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07881773399014778 - nodes in this community are weakly interconnected._
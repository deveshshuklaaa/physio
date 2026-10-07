# Graph Report - final_project  (2026-10-03)

## Corpus Check
- Large corpus: 386 files · ~639,607 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 5291 nodes · 11514 edges · 293 communities (205 shown, 65 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 664 edges (avg confidence: 0.85)
- Token cost: 114,065 input · 0 output

## Community Hubs (Navigation)
- Frontend Tailwind Vendor
- EMG Website Tailwind Vendor
- Chart.js Vendor (EMG)
- Chart.js Vendor (EMG) A
- Tailwind Vendor Utils
- Chart.js Vendor Events
- Chart.js Vendor Core
- Chart.js Vendor Colors
- Frontend UI Components
- Vendor Mix
- Tailwind Vendor Core
- Chart.js Vendor More
- Exercise Config Backend
- EMG Client & Hardware
- Tailwind Vendor More
- Auth Backend
- MediaPipe Vision Bundle
- Tailwind Vendor Base
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Logging & Correlation
- Community 28
- Community 29
- Community 30
- Community 31
- Admin Model Tests
- Community 33
- Community 34
- EMG History Backend
- Session Buffer Service
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- EMG Analysis Backend
- Chart.js Vendor More
- Community 47
- Events Backend
- Community 49
- Database Backend
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Admin Model Routes
- Community 57
- Community 58
- EMG Service Backend App
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Services Init
- Community 69
- Community 70
- Community 71
- EMG Test Harness
- EMG Website Tests
- Community 74
- Community 75
- Community 76
- Arduino Shim Analog
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- History Route Tests
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Logger Setup
- Community 93
- Community 94
- Community 95
- Session Model
- Community 97
- Frontend Components
- Community 99
- Community 100
- Session Buffer Path
- EMG Backend Tests
- Community 103
- Community 104
- Community 105
- Community 106
- Gemini Report Service
- Arduino Shim FakeWire
- Community 109
- Community 110
- Report Route Tests
- Community 112
- Community 113
- Community 114
- Admin Models Routes
- Community 116
- Community 117
- Community 118
- Community 119
- App Init
- Community 121
- Arduino Shim FakeUDP
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- EMG Phase12 Tests
- Arduino Shim FakeWiFi
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- EMG Get Local IP
- CORS Tests
- EMG Get Progress
- EMG App Rationale
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Admin Model Test Rationale
- Calibration Gate Tests
- Telemetry Backend
- Community 161
- Arduino Shim FakeSerial
- EMG Website Components
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Events Mirror Tests
- Community 172
- Community 173
- Community 174
- EMG UDP Handler
- EMG Flask Backend
- Arduino Shim LED
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- EMG Event Stream
- EMG Test Phase10
- EMG Test Phase3
- Frontend JS Config
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Mongo Crypt Vendor
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Capabilities Route
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- EMG Run Tests
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 252
- Community 253
- Community 260
- Community 268
- Community 269
- Community 270
- Community 271
- Community 272
- Community 273
- Image: anq.png
- Image: ask-icon.png
- Image: banner.png
- Image: care.png
- Image: ex.png
- Image: exercise.png
- Image: gr.png
- Image: home-bg.png
- Image: is.png
- Image: login-bg.png
- Image: login-hero.png
- Image: medical-bg.png
- Image: ra.png
- Image: reg-bg.png
- Image: reg.png
- Community 289
- Community 290

## God Nodes (most connected - your core abstractions)
1. `tn` - 127 edges
2. `push()` - 71 edges
3. `push()` - 71 edges
4. `add()` - 66 edges
5. `add()` - 66 edges
6. `n()` - 59 edges
7. `replace()` - 53 edges
8. `replace()` - 53 edges
9. `m()` - 49 edges
10. `s()` - 45 edges

## Surprising Connections (you probably didn't know these)
- `de()` --indirect_call--> `oe()`  [INFERRED]
  emg-service/website/vendor/chartjs/chartjs-adapter-date-fns.bundle.min.js → frontend/src/assets/vendor/mediapipe/vision_bundle.mjs
- `run_case()` --calls--> `angle_2d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `angle_3d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `torso_lean()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `detect_view()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Standalone Browser Gate Probe Harnesses (G5/G7/G8/G13)** — frontend_tools_g13_recording_survives, frontend_tools_g13_test_index, frontend_tools_g5_worker_test_index, frontend_tools_g5_worker_test_classic_probe, frontend_tools_g6_g10_test_render_audio_probe [INFERRED 0.85]
- **EMG Service Stack** — service:emg-service, page:live-monitor, page:recording-history, page:playback, page:progress, feature:emg-live-streaming, feature:emg-recording, feature:emg-playback, feature:progress-tracking, feature:calibration, design-system:clinical-kinetic, tech:flask, tech:tailwind, tech:clinical-theme, tech:chartjs [INFERRED]
- **Rehab Assessment Engine Stack** — service:backend, service:frontend, page:live-session, page:session-report, feature:rehab-live-session, tech:fastapi, tech:react, tech:vite, tech:mediapipe, tech:websockets [INFERRED]
- **Hemophilia Support Stack** — service:hemo-backend, service:hemo-frontend, page:hemo-frontend, tech:react, tech:vite, database:mongodb-atlas [INFERRED]
- **Nginx Reverse Proxy Routing** — service:nginx, service:backend, service:frontend, service:hemo-backend, service:hemo-frontend, api:backend-engine, api:backend-ws, api:hemo-api [EXTRACTED]
- **ML Pipeline Dependencies** — tech:ml-runtime, file:backend/requirements.txt, file:part2/Hemophillia-confirm/backend/ml/requirements.txt, tech:mediapipe, tech:opencv [EXTRACTED]
- **JWT Authentication Flow** — tech:PyJWT, config:env-file, service:backend, service:hemo-backend, page:live-session [INFERRED]
- **Data Persistence Layer** — database:mongodb-atlas, service:backend, service:hemo-backend, config:env-file, service:emg-service [EXTRACTED]

## Communities (293 total, 65 thin omitted)

### Community 2 - "Frontend Tailwind Vendor"
Cohesion: 0.02
Nodes (96): ad(), Ag(), ak(), Am(), ao(), aS(), async(), ay() (+88 more)

### Community 3 - "EMG Website Tailwind Vendor"
Cohesion: 0.02
Nodes (95): ad(), Ag(), ak(), Am(), ao(), aS(), async(), ay() (+87 more)

### Community 4 - "Chart.js Vendor (EMG)"
Cohesion: 0.03
Nodes (43): addBox(), at(), b(), beforeLayout(), beforeUpdate(), buildTicks(), cn(), configure() (+35 more)

### Community 5 - "Chart.js Vendor (EMG) A"
Cohesion: 0.04
Nodes (16): aa(), afterDatasetsUpdate(), d(), Di(), es(), generateLabels(), Ie(), ke() (+8 more)

### Community 6 - "Tailwind Vendor Utils"
Cohesion: 0.05
Nodes (85): l(), o(), Ae(), already(), applyParallelOffset(), B(), bx(), c() (+77 more)

### Community 7 - "Chart.js Vendor Events"
Cohesion: 0.07
Nodes (30): afterDraw(), afterEvent(), afterUpdate(), Ba(), Ee(), eo(), f(), g() (+22 more)

### Community 8 - "Chart.js Vendor Core"
Cohesion: 0.06
Nodes (46): a(), average(), beforeDraw(), dataset(), determineDataLimits(), draw(), e(), ei() (+38 more)

### Community 9 - "Chart.js Vendor Colors"
Cohesion: 0.06
Nodes (44): ai(), color(), ii(), It(), jt(), kt(), qt(), _t() (+36 more)

### Community 10 - "Frontend UI Components"
Cohesion: 0.06
Nodes (46): ShinyText(), SpotlightCard(), Alert(), AlertDescription(), AlertTitle(), alertVariants, Badge(), badgeVariants (+38 more)

### Community 11 - "Vendor Mix"
Cohesion: 0.05
Nodes (68): k(), l(), o(), applyParallelOffset(), B(), c(), cl(), _d() (+60 more)

### Community 12 - "Tailwind Vendor Core"
Cohesion: 0.05
Nodes (63): add(), already(), applyVariantOffset(), by(), checkForWarning(), cleanFromUnprefixed(), cleanOtherPrefixes(), cloneBefore() (+55 more)

### Community 13 - "Chart.js Vendor More"
Cohesion: 0.06
Nodes (13): Be(), Bi(), Ci(), Fi(), fn(), gn(), n(), ne() (+5 more)

### Community 14 - "Exercise Config Backend"
Cohesion: 0.07
Nodes (48): ExerciseConfigError, load_exercises(), Any, Path, Exercise registry loader — Phase F (backend-core-agent). Pure-data config:…, Load, validate, and return the exercise registry as {name: record}. Not cached…, Raised when an exercise record fails validation. A config file is a trust…, A threshold (or trigger sub-field) is still a placeholder iff it is the… (+40 more)

### Community 15 - "EMG Client & Hardware"
Cohesion: 0.06
Nodes (52): calibration_ok(), Pure gate predicate (R1.1b, D16): good only if mpu_ok and not shaky., add_annotation(), add_to_history(), _annotations_path(), arm(), compress_capture_file(), control_reader() (+44 more)

### Community 16 - "Tailwind Vendor More"
Cohesion: 0.08
Nodes (52): bx(), clear(), clone(), cloneAfter(), co(), cu(), each(), eO() (+44 more)

### Community 17 - "Auth Backend"
Cohesion: 0.07
Nodes (42): authorize_patient_access(), CurrentUser, _decode(), decode_ws_token(), get_current_user(), G2-B1/B2/B6 — JWT auth shared with their (part2) backend. Their JWT: HS256,…, True iff `user` may read/act on `patient_user_id`'s clinical data. Rules (§3,…, Shared decode path for both the HTTP dependency and the WS handshake. Expired… (+34 more)

### Community 18 - "MediaPipe Vision Bundle"
Cohesion: 0.07
Nodes (41): ar(), Bt, c(), Co(), cr(), ct(), dr(), Er() (+33 more)

### Community 19 - "Tailwind Vendor Base"
Cohesion: 0.06
Nodes (50): ba(), beforeAfter(), block(), Bo(), body(), calcBefore(), clean(), cleanBrackets() (+42 more)

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (49): arbitraryProperty(), cl(), delete(), _deleteIfExpired(), ec(), _emitEvictions(), _entriesAscending(), entriesDescending() (+41 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (47): arbitraryProperty(), ba(), Bo(), cloneDiv(), colorStops(), content(), css(), F2() (+39 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (46): _1(), atrule(), comment(), constructor(), createTokenizer(), Dc(), decl(), emptyRule() (+38 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (46): after(), Ah(), append(), Dl(), er(), error(), fromOffset(), Gt() (+38 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (45): addToError(), Bt(), c3(), d3(), Dc(), f3(), Gf(), group() (+37 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (21): Ae(), Bn(), _calculateBarIndexPixels(), _calculateBarValuePixels(), _getAxis(), _getAxisCount(), getFirstScaleIdForIndexAxis(), getLabelAndValue() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (42): A(), aa, ba(), bn(), ca(), ce, clear(), clone() (+34 more)

### Community 27 - "Logging & Correlation"
Cohesion: 0.10
Nodes (42): correlation(), Set correlation IDs for the duration of the `with` block (and anything awaited…, _consent(), get_video(), get, Request, UploadFile, G2-F5/F6 -- report polling and video upload. POST /session/{session_id}/video… (+34 more)

### Community 28 - "Community 28"
Cohesion: 0.09
Nodes (42): Ae(), after(), Ah(), append(), before(), check(), Dl(), ea() (+34 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (39): country-state-city, html2canvas, i18next, jspdf, dependencies, axios, country-state-city, html2canvas (+31 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (40): _1(), atrule(), beforeAfter(), block(), body(), calcBefore(), cleanBrackets(), comment() (+32 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (39): /engine/* (FastAPI backend), /ws/* (WebSocket), .env file, MongoDB Atlas, IMU Calibration, Live EMG Streaming, EMG Playback with Annotations, EMG Recording (+31 more)

### Community 32 - "Admin Model Tests"
Cohesion: 0.10
Nodes (38): test_e8_exercise_without_a_model_is_analysis_unavailable(), _auth(), _lookup_docA_only_for_p1(), H4, H5 — session lifecycle endpoints. G2-B3/B6 — auth and authorization. No…, Called twice, one job. Not two jobs, not an error on the second call -- the…, H5 returns immediately. The job is recorded as pending work; the report…, §10 gives job_queue.py to agent 10 (Phase I). Phase H must enqueue against a…, §4 lists routes/session.py as "start / end / status". The status read is what… (+30 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (29): EXERCISE_CHECKS, CHECK_REGISTRY, depthAlert(), KNOWN_CHECKS, rulesForExercise(), thresholdAlert(), thresholdValue(), baseLandmarks() (+21 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (35): Assessment, authMiddleware, buildMlPatient(), daysSince(), express, fs, generateForPatient(), getPythonScript() (+27 more)

### Community 35 - "EMG History Backend"
Cohesion: 0.09
Nodes (32): emg_history(), emg_live(), emg_status(), health(), metrics(), get, Get EMG recording history from Flask service., Get current live EMG reading from Flask service. (+24 more)

### Community 36 - "Session Buffer Service"
Cohesion: 0.12
Nodes (35): get_buffer(), _auth_frame(), _batch(), _frames(), _http_auth(), H2, H3, H6 — the session WebSocket. G2-B4 — the WS auth handshake. No…, D3/B4: send this as the first message on every socket under test, or the server…, A batch in the client.js wire format lands in that session's buffer. (+27 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (31): { Binary }, dataKeyId, dataKeyId, doctorChangeRequestSchema, encryptedString, mongoose, DATA_KEY_ID, encryptedString (+23 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (35): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, lucide-react, motion, radix-ui (+27 more)

### Community 39 - "Community 39"
Cohesion: 0.09
Nodes (7): an(), as(), ln(), on, rs(), ts(), xt

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (31): loginOTPSchema, mongoose, bcrypt, {
  createLoginOTP,
}, express, IMPORTANT:, router, User (+23 more)

### Community 41 - "Community 41"
Cohesion: 0.09
Nodes (11): buildLookupTable(), _generate(), getDecimalForValue(), _getTimestampsForTable(), getValueForPixel(), ho(), initOffsets(), jo() (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (33): addToError(), Bt(), c3(), d3(), Di(), eE(), f3(), Gf() (+25 more)

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (23): jwt, fhirResourceSchema, mongoose, Assessment, authMiddleware, express, HemophiliaDetails, PatientProfile (+15 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (33): bcryptjs, @cloudrumbles/indic-transliterate, cors, dotenv, express, google-auth-library, @google/genai, jsonwebtoken (+25 more)

### Community 45 - "EMG Analysis Backend"
Cohesion: 0.10
Nodes (30): analyze(), _demo(), find_contractions(), _median(), metrics_to_preamble(), Post-session EMG analysis. Runs once, after a recording stops, before the…, Per-recording dashboard summary. rows/sample_rate as in analyze(); metrics…, One '#' line, JSON payload -- survives round-tripping without needing a parser… (+22 more)

### Community 46 - "Chart.js Vendor More"
Cohesion: 0.10
Nodes (16): H(), ANGLE_FILTER, DISPLAY_FILTER, MP_CONFIDENCE, REP_GUARDS, buildPts(), PoseEngine, OneEuroScalar (+8 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (28): allowRoles(), jwt, staffAuth(), mongoose, patientExerciseRecommendationSchema, Assessment, buildAssessmentExplanation(), buildAssessmentFactors() (+20 more)

### Community 48 - "Events Backend"
Cohesion: 0.09
Nodes (17): is_valid_event(), Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3. Mirrored 1:1 in…, ComponentLogger, _JsonFormatter, _make_handler(), _next_seq(), Structured JSON logger — MASTER_BUILD_PLAN_v3.md §8b. One JSON object per line,…, Renders the pre-built dict on record.extra_fields as one JSON line. All the… (+9 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (31): he(), applyVariantOffset(), before(), compare(), create(), E(), forVariant(), G2() (+23 more)

### Community 50 - "Database Backend"
Cohesion: 0.09
Nodes (21): _FakeCollection, _FakeCursorResult, _FakeDb, lifespan(), make_lookup_doctor_id(), Any, G2-D2 -- Motor client lifecycle, and the read-only lookups D5/B6 need:…, Merged into app/main.py's lifespan via include_router (see module docstring).… (+13 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (30): _assert_reason(), _card(), E1-E5, E9, E10 — the model package contract and its gate. No framework. Run…, E4: the rejection must NAME the problem. A report that fails for the right…, Every E2 field is required. is_tree_based especially -- it gates the SHAP path…, The plan is explicit: caveats may be empty but must be PRESENT, so a card…, E-DEC.1. The placeholder bundles hold {label: estimator} dicts, which have…, E3 check 8 is explicitly a WARNING. Blocking on it would make every environment… (+22 more)

### Community 52 - "Community 52"
Cohesion: 0.16
Nodes (28): Defines what drives the rep state machine. The engine watches the angle of the…, RepTrigger, check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front() (+20 more)

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (20): angle2d(), angle3d(), clip(), detectView(), torsoLean(), VIEW_Z_DIFF_THRESHOLD, CHECKS, CHECKS (+12 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (22): jwt, User, jwt, User, dataKeyId, mongoose, userSchema, adminAuth (+14 more)

### Community 55 - "Community 55"
Cohesion: 0.10
Nodes (29): ac(), Ax(), create(), Et(), Ff(), forVariant(), K2(), kt() (+21 more)

### Community 56 - "Admin Model Routes"
Cohesion: 0.11
Nodes (27): E6, E7, E8, E11 — model admin routes and the startup registry. No framework.…, Count-agnostic, like F7. The status route must report on whatever the registry…, I8 gates SHAP on this flag, so it must be visible without opening the package…, E11 needs it, and an operator needs to know a model wants an IMU BEFORE a…, Three of six exercises have no model at all -- including squat, the only one…, The plan is explicit: only post-session prediction is disabled. Live rule-based…, A malformed package is an expected input, not a server fault. It must come back…, test_e6_corrupt_upload_is_handled() (+19 more)

### Community 57 - "Community 57"
Cohesion: 0.11
Nodes (25): draw_skeleton(), Draw the skeleton overlay on frame. Two-pass render (shadow + colour) for…, _compute_joint_angle(), _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Run all JointChecks for current view. Returns (alerts, joint_angles,…, Draw the semi-transparent left HUD panel onto frame in-place. (+17 more)

### Community 58 - "Community 58"
Cohesion: 0.11
Nodes (17): bs(), ct(), Fs(), ge(), is(), ks(), ms(), ps() (+9 more)

### Community 59 - "EMG Service Backend App"
Cohesion: 0.17
Nodes (27): add_annotation(), add_to_history(), _annotations_path(), delete_annotation(), delete_recording(), get_annotations(), get_preview(), get_recording() (+19 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (15): beforeDatasetDraw(), beforeDatasetsDraw(), ca, ce(), de, dt(), ea(), fa() (+7 more)

### Community 61 - "Community 61"
Cohesion: 0.10
Nodes (24): adminAuth, Assessment, buildAssessmentExplanation(), buildAssessmentFactors(), buildBleedingHistory(), buildFamilyGeneticHistory(), buildJointDistribution(), buildRiskTrend() (+16 more)

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (23): gate_e8_degrades_instead_of_crashing(), gate_phase_e(), PHASE E GATE — MASTER_BUILD_PLAN_v3.md §7. | E | A deliberately malformed zip…, Supporting check. Not a §7 clause, but the difference between a usable app and…, _status(), _upload(), _free_port(), H7 — the fake-client test script, exercised for real. No framework. Run from… (+15 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (3): addElements(), en, sn

### Community 64 - "Community 64"
Cohesion: 0.10
Nodes (27): add(), checkForWarning(), cleanFromUnprefixed(), cleanOtherPrefixes(), comma(), convert(), cu(), disabled() (+19 more)

### Community 65 - "Community 65"
Cohesion: 0.10
Nodes (27): At(), by(), ca(), cr(), ea(), Ex(), Gl(), gS() (+19 more)

### Community 66 - "Community 66"
Cohesion: 0.17
Nodes (27): ae(), an(), br(), dn(), ee(), fn(), ge(), Gt() (+19 more)

### Community 67 - "Community 67"
Cohesion: 0.11
Nodes (14): RequireToken(), AdminDashboard(), AdminDoctorRequests(), AdminLogin(), AwarenessScreen(), CareGuidanceScreen(), ConsentScreen(), DoctorChangePassword() (+6 more)

### Community 68 - "Services Init"
Cohesion: 0.12
Nodes (23): close_buffer(), Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3/R6). R3:…, Flush and drop from the registry. Returns frames flushed., _frame(), _fresh_tmp_root(), H1 — session_buffer.py self-checks. No framework. Run from backend/:…, The evidence path. A flush that returns cleanly but writes nothing is the worst…, Flush drains. A second flush must append, not truncate — chunked evidence… (+15 more)

### Community 69 - "Community 69"
Cohesion: 0.12
Nodes (10): ao(), co(), da(), Do(), getBasePixel(), inXRange(), inYRange(), Oe() (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.14
Nodes (5): LEVELS, RingBuffer, SessionWsClient, drained, rb

### Community 71 - "Community 71"
Cohesion: 0.13
Nodes (21): convert(), _legacy_cv_scores(), Path, repackage_legacy_bundle.py — DISPOSABLE, one-off converter (E9).…, Converts each legacy `*_rf.pkl` bundle in `paths` into the E1 package layout…, Best-effort: pull real CV numbers out of the existing…, The whole point of E9: whatever it emits must satisfy E3. This closes the loop…, test_e9_converter_output_passes_the_real_gate() (+13 more)

### Community 72 - "EMG Test Harness"
Cohesion: 0.17
Nodes (18): base_reset(), string, vector, pump_samples(), report(), split_fields(), split_lines(), find_prefix() (+10 more)

### Community 73 - "EMG Website Tests"
Cohesion: 0.16
Nodes (12): check(), checkEq(), extractFunction(), FakeElement, fs, path, phase13(), phase16() (+4 more)

### Community 74 - "Community 74"
Cohesion: 0.10
Nodes (11): bo, getRange(), _i(), j(), ji(), label(), mt(), ns() (+3 more)

### Community 75 - "Community 75"
Cohesion: 0.09
Nodes (22): exitFullscreen(), abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), receiveInstance() (+14 more)

### Community 76 - "Community 76"
Cohesion: 0.15
Nodes (18): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_all_exercise_definitions(), get_exercise_definition() (+10 more)

### Community 77 - "Arduino Shim Analog"
Cohesion: 0.10
Nodes (10): DelayBudgetExhausted, string, onEvent(), print(), println(), SentPacket, host, port (+2 more)

### Community 78 - "Community 78"
Cohesion: 0.14
Nodes (23): cn(), en(), Fh(), gn(), h(), Ih(), Io(), ki() (+15 more)

### Community 79 - "Community 79"
Cohesion: 0.20
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 80 - "Community 80"
Cohesion: 0.11
Nodes (9): AUDIO_BASE, AUDIO_MAP, AudioCuePlayer, createSmoother(), EmaSmoother, OneEuroSmoother, FakeAudio, SQUAT (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.13
Nodes (5): BrowserLogger, startLiveSession(), beginCaptureLoop(), paintVideo(), handleFrame()

### Community 82 - "Community 82"
Cohesion: 0.11
Nodes (22): constructor(), createTokenizer(), _emitEvictions(), _entriesAscending(), isStretch(), J0(), mapResolve(), _moveToRecent() (+14 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (21): adminAuthRoutes, adminPatientResearchRoutes, adminRoutes, app, authRoutes, chatbotRoutes, connectDB, doctorAuthRoutes (+13 more)

### Community 84 - "Community 84"
Cohesion: 0.10
Nodes (14): mongoose, passwordResetOTPSchema, allowedRoles, bcrypt, crypto, express, PasswordResetOTP, IMPORTANT: (+6 more)

### Community 85 - "History Route Tests"
Cohesion: 0.19
Nodes (18): _auth(), _cleanup_sessions(), _lookup_docA_only_for_p1(), G2-G2 -- GET /patients/{id}/sessions. No framework. Run from backend/:…, A raw literal id (not 'me', not PATxxx) is a patientUserId -- p2 reading it…, The load-bearing matrix. docA is p1's doctor; docB is nobody's. p2 has NO…, PATxxxxxx -> patientUserId, via a real inserted patientprofiles row -- what the…, _start_session() (+10 more)

### Community 86 - "Community 86"
Cohesion: 0.10
Nodes (7): entries(), le, p(), [Symbol.iterator](), values(), xe(), y()

### Community 87 - "Community 87"
Cohesion: 0.11
Nodes (19): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), receiveInstance(), receiveInstantiationResult() (+11 more)

### Community 88 - "Community 88"
Cohesion: 0.12
Nodes (16): makeBlendComponent(), makeBlendState(), makeColorAttachment(), makeColorAttachments(), makeColorState(), makeColorStates(), makeComputePassTimestampWrites(), makeDepthStencilAttachment() (+8 more)

### Community 89 - "Community 89"
Cohesion: 0.12
Nodes (16): makeBlendComponent(), makeBlendState(), makeColorAttachment(), makeColorAttachments(), makeColorState(), makeColorStates(), makeComputePassTimestampWrites(), makeDepthStencilAttachment() (+8 more)

### Community 90 - "Community 90"
Cohesion: 0.17
Nodes (14): uploadRecording(), lerpPts(), makePainter(), displayedPts(), MAX_EASE_MS, STALE_POSE_MS, endSession(), onProgress() (+6 more)

### Community 91 - "Community 91"
Cohesion: 0.12
Nodes (19): GET/POST/PUT /api/annotations/{filename}, GET /api/list_recordings, GET /api/preview/{filename}, GET /api/progress, POST /api/prune_history, POST /api/recalibrate, GET /api/recording/{filename}, GET /api/recording_meta/{filename} (+11 more)

### Community 92 - "Logger Setup"
Cohesion: 0.14
Nodes (11): get_logger(), _FakeCollection, _FakeCursor, _FakeDb, datetime, G2-F8 -- video retention sweep. Deletes files past `clinical.video.expiresAt`,…, One pass: delete every video file whose expiresAt has passed and that hasn't…, Runs sweep_expired_videos() forever. Start with… (+3 more)

### Community 93 - "Community 93"
Cohesion: 0.20
Nodes (18): add_empty_landmark_columns(), add_floor_relative_columns(), batch_extract(), _ema_smoothed_columns(), estimate_clip_floor(), estimate_floor_y(), find_longest_stable_run(), find_videos() (+10 more)

### Community 94 - "Community 94"
Cohesion: 0.16
Nodes (13): toFHIRBundle(), { toFHIRCondition }, { toFHIRMedicationStatement }, { toFHIRObservations }, { toFHIRPatient }, { toFHIRQuestionnaireResponse }, toFHIRCondition(), TODO: (+5 more)

### Community 95 - "Community 95"
Cohesion: 0.12
Nodes (17): Assessment, authMiddleware, DoctorChangeRequest, express, HemophiliaDetails, PatientProfile, router, saveFHIRBundle (+9 more)

### Community 96 - "Session Model"
Cohesion: 0.16
Nodes (14): ClinicalBlock, ensure_indexes(), _FakeCollection, _FakeDb, PhysioSession, BaseModel, G2-D3 -- the physiosessions schema (integration plan §4), as Pydantic, and its…, §4: everything sensitive lives under here -- one future schemaMap entry for… (+6 more)

### Community 97 - "Community 97"
Cohesion: 0.23
Nodes (17): clause_k3_full_flow_through_docker(), clause_k4_three_concurrent_sessions(), _compose(), _container_line_count(), _container_session_dir(), gate_phase_k(), _get(), _get_json() (+9 more)

### Community 98 - "Frontend Components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 99 - "Community 99"
Cohesion: 0.25
Nodes (17): attach(), checks, connect(), DIST, FRONTEND, gate_manualEndToEnd(), goto(), HERE (+9 more)

### Community 100 - "Community 100"
Cohesion: 0.11
Nodes (16): assessmentSchema, { Binary }, DATA_KEY_ID, encryptedString, encryptedStringArray, mongoose, IMPORTANT:, Assessment (+8 more)

### Community 101 - "Session Buffer Path"
Cohesion: 0.13
Nodes (8): Path, Idempotent: calling twice does not spawn a second task. `interval_s=None` reads…, Stop the background task and flush whatever remains before returning, so…, Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3)., Sync, O(n), no disk I/O., Snapshot of what's currently buffered, oldest first. Debug/test use., Append everything pending to `path` as JSONL, then drop exactly what was…, SessionBuffer

### Community 102 - "EMG Backend Tests"
Cohesion: 0.21
Nodes (14): check(), check_eq(), drain_queue(), FakeSock, main(), make_handler(), phase6(), phase7() (+6 more)

### Community 103 - "Community 103"
Cohesion: 0.21
Nodes (17): getAsyncError(), getIterator(), getProxyProcessor(), handleError(), kp(), messages(), prepareVisitors(), runAsync() (+9 more)

### Community 104 - "Community 104"
Cohesion: 0.13
Nodes (13): SKELETON_CONNECTIONS, C_BGR, COLOR, drawSkeleton(), Any Alert Turns Whole Skeleton Red, countColor (pixel assertion helper), render_audio_probe main, colorNoAlerts (+5 more)

### Community 105 - "Community 105"
Cohesion: 0.17
Nodes (17): At(), ca(), cr(), Ex(), Ix(), ke(), lc(), Ox() (+9 more)

### Community 106 - "Community 106"
Cohesion: 0.14
Nodes (12): cryptSharedLibPath, encodedKey, fs, kmsProviders, localMasterKey, masterKeyPath, path, { requireCryptShared } (+4 more)

### Community 107 - "Gemini Report Service"
Cohesion: 0.19
Nodes (15): _api_key(), build_prompt(), call_gemini(), _error_descriptions(), _error_summary(), _exercise_context(), _exercise_description(), language_name() (+7 more)

### Community 108 - "Arduino Shim FakeWire"
Cohesion: 0.12
Nodes (8): FakeWire, avail, cur_addr, cur_bytes, vector, I2CWrite, addr, bytes

### Community 109 - "Community 109"
Cohesion: 0.21
Nodes (16): ac(), bh(), eh(), F(), finishProcessing(), g(), Ga(), Lh() (+8 more)

### Community 110 - "Community 110"
Cohesion: 0.12
Nodes (15): ALL_EVENTS, AUTH, CROSSCHECK, DB, EMG_IMU, EXERCISE_CONFIG, EXTRACTOR, isValidEvent() (+7 more)

### Community 111 - "Report Route Tests"
Cohesion: 0.29
Nodes (14): _auth(), _cleanup(), G2-F -- report generation, video upload, retention. No framework. Run from…, test_f4_gemini_failure_preserves_counts(), test_f4_gemini_success_sets_reported(), test_f6_consent_accepts_and_writes_file(), test_f6_no_consent_rejects_and_writes_no_file(), test_f6_rejects_unsupported_content_type() (+6 more)

### Community 112 - "Community 112"
Cohesion: 0.21
Nodes (15): Y(), at(), dt(), it(), j(), mt(), nt(), ot() (+7 more)

### Community 113 - "Community 113"
Cohesion: 0.13
Nodes (13): { Binary }, {
    cryptSharedLibPath,
    cryptSharedAvailable: csfleAvailable,
}, DATA_KEY_ID, doctorRegistrationSchema, encodedKey, fhirSchema, fs, kmsProviders (+5 more)

### Community 114 - "Community 114"
Cohesion: 0.13
Nodes (6): api, AdminDoctors(), AdminPatientResearch(), IMPORTANT:, DoctorRegistration(), IMPORTANT:

### Community 115 - "Admin Models Routes"
Cohesion: 0.19
Nodes (13): build_model_registry(), _empty_entry(), _loaded_entry(), model_status(), get, Path, Request, UploadFile (+5 more)

### Community 116 - "Community 116"
Cohesion: 0.25
Nodes (10): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_definition(), ExerciseDefinition (+2 more)

### Community 117 - "Community 117"
Cohesion: 0.23
Nodes (14): ac(), Ax(), Et(), Ff(), la(), ln(), nc(), oa() (+6 more)

### Community 118 - "Community 118"
Cohesion: 0.14
Nodes (11): bcrypt, {
  createLoginOTP,
}, express, jwt, { OAuth2Client }, PROFILE_FIELDS, READONLY, REQUIRED (+3 more)

### Community 119 - "Community 119"
Cohesion: 0.19
Nodes (6): homePath(), STAFF_PATH_PREFIXES, AuthScreen(), DoctorLoginScreen(), NotFound(), PermissionDenied()

### Community 120 - "App Init"
Cohesion: 0.21
Nodes (10): _load_env(), Path, app package. Loads the shared environment BEFORE any submodule imports, because…, Minimal KEY=VALUE reader. Deliberately not python-dotenv: this runs at package…, check(), main(), check(), check_eq() (+2 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (12): angle_2d(), Angle at point B using 2D pixel coordinates (x, y). Best used for front-view…, check_butt_wink(), check_heel_lift(), check_neck(), check_posture_front(), check_posture_side(), Detects neck out of neutral (looking up or down excessively). Measures the… (+4 more)

### Community 122 - "Arduino Shim FakeUDP"
Cohesion: 0.15
Nodes (7): FakeUDP, cur_data, cur_host, cur_port, rx_current, rx_pos, data

### Community 123 - "Community 123"
Cohesion: 0.19
Nodes (13): delete(), Fe(), forEach(), get(), has(), he(), kn(), oe() (+5 more)

### Community 126 - "Community 126"
Cohesion: 0.19
Nodes (11): engine, engine2, fracsDown, fracsHold, fracsUp, frameAt(), frameAtKneeCave(), HERE (+3 more)

### Community 127 - "Community 127"
Cohesion: 0.15
Nodes (11): DATA_KEY_ID, doctorRegistrationRequestSchema, encryptedFile, encryptedString, mongoose, DoctorRegistrationRequest, express, multer (+3 more)

### Community 128 - "Community 128"
Cohesion: 0.15
Nodes (8): ai, express, { GoogleGenAI }, models, path, IMPORTANT:, router, { spawn }

### Community 129 - "Community 129"
Cohesion: 0.24
Nodes (11): _load_compose(), _published_ports(), PHASE K — K1/K2 static checks. No Docker daemon required. ../venv/bin/python…, K2 -- emg_client resolves its base URL from the environment. Fresh interpreter…, K2 -- compose sets that variable to the EMG service's compose hostname.…, Host-side ports published by a service, as ints. Handles both the short string…, K1 -- docker-compose.yml: backend, emg-service, frontend., _services() (+3 more)

### Community 130 - "EMG Phase12 Tests"
Cohesion: 0.27
Nodes (9): check(), check_eq(), FakeSock, g(), handler(), main(), Read an app.py global that may not exist yet (red phase) without crashing., reset_state() (+1 more)

### Community 131 - "Arduino Shim FakeWiFi"
Cohesion: 0.23
Nodes (4): FakeWiFi, IPAddress, s, millis()

### Community 133 - "Community 133"
Cohesion: 0.21
Nodes (8): createLazyFile(), stream_ops, writeChunks(), forceLoadFile(), get_char(), intArrayFromString(), mmap(), read()

### Community 134 - "Community 134"
Cohesion: 0.30
Nodes (11): dosage(), frequency(), load_metadata(), load_model(), main(), norm(), phase_from_days(), Map days to the phase labels used by the new knee exercise dataset. <= 20 ->… (+3 more)

### Community 135 - "Community 135"
Cohesion: 0.24
Nodes (8): Bt(), Ft(), Gt(), vt(), zt(), Kt(), Lt(), Qt()

### Community 136 - "Community 136"
Cohesion: 0.22
Nodes (8): createLazyFile(), stream_ops, writeChunks(), forceLoadFile(), get_char(), intArrayFromString(), mmap(), read()

### Community 137 - "Community 137"
Cohesion: 0.22
Nodes (5): IsolatedRecorder, blobToBase64, g13 main (real worker crash run), FakePoseWorker, g13_test run

### Community 138 - "Community 138"
Cohesion: 0.18
Nodes (10): nodemon, description, devDependencies, nodemon, main, name, scripts, dev (+2 more)

### Community 139 - "Community 139"
Cohesion: 0.20
Nodes (4): ExerciseReviewPanel(), CHART_COLORS, DoctorDashboard(), Icon

### Community 140 - "Community 140"
Cohesion: 0.18
Nodes (10): bloodGroupOptions, educationOptions, emptyProfile, genderOptions, insuranceOptions, maritalOptions, ProfileStepper(), IMPORTANT: (+2 more)

### Community 141 - "Community 141"
Cohesion: 0.38
Nodes (9): find_parquets(), main(), output_path_for(), parse_args(), Path, run_extractor(), validate(), CompletedProcess (+1 more)

### Community 142 - "Community 142"
Cohesion: 0.20
Nodes (8): DATA_KEY_ID, encryptedString, mongoose, screeningSessionSchema, express, PDFDocument, router, ScreeningSession

### Community 143 - "Community 143"
Cohesion: 0.29
Nodes (9): EXERCISE_TRANSLATIONS, EXERCISE_YOUTUBE_LINKS, ExerciseCard(), ExercisePlan(), getInitialLanguage(), reportLink(), T, translateExercisePurpose() (+1 more)

### Community 144 - "Community 144"
Cohesion: 0.31
Nodes (8): clip_features(), label_cols(), main(), DataFrame, Path, Collapse one clip's frames into a single feature row., Everything in the manifest that isn't metadata is a label., Series

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (8): build_gemini_prompt(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API. Returns the coaching text, or a…, Converts the per-rep session log into a structured coaching prompt. session_log…, Scrollable cv2 window showing the Gemini coaching report. API call runs in…, show_report_window(), _wrap_text()

### Community 146 - "Community 146"
Cohesion: 0.22
Nodes (8): description, name, private, scripts, test:parity, test:ring_buffer, type, version

### Community 147 - "Community 147"
Cohesion: 0.42
Nodes (8): attach(), FRONTEND_ROOT, HERE, main(), MOCKUP_VALUES, runLivePageChecks(), runProbeChecks(), sleep()

### Community 148 - "Community 148"
Cohesion: 0.22
Nodes (8): cryptSharedLibPath, encodedKey, fs, kmsProviders, localMasterKey, masterKeyPath, path, { requireCryptShared }

### Community 149 - "EMG Get Local IP"
Cohesion: 0.25
Nodes (8): get_local_ip(), Console-only diagnostic loop. Since there's no serial monitor on the ESP32…, Called once when the server process starts. UDP listener + watchdog run forever., Best-effort LAN IP of this machine - print this at boot so the ESP32 firmware's…, start_ingest_thread_at_boot(), status(), udp_reader(), udp_watchdog()

### Community 150 - "CORS Tests"
Cohesion: 0.29
Nodes (6): J — cross-origin access from the pages to the API. No framework. Run from…, POST /session/start with a JSON content-type triggers a preflight. If OPTIONS…, All four, not just the one that was noticed. A page that can read /exercises…, test_j_cors_allows_the_pages_origin(), test_j_cors_covers_every_route_the_pages_call(), test_j_cors_preflight_for_session_start()

### Community 151 - "EMG Get Progress"
Cohesion: 0.29
Nodes (7): get_progress(), _load_progress_cache(), Decode any recording format /api/progress may meet: '.csv.gz' via _read_csv_gz,…, Load progress_cache.json, tolerating a missing/corrupt/stale file by rebuilding…, Per-recording dashboard summary (progress.html), cached in progress_cache.json…, _read_rows(), _save_progress_cache_atomic()

### Community 152 - "EMG App Rationale"
Cohesion: 0.29
Nodes (7): Write the finished .csv.gz: preamble (version, calibration, analysis metrics),…, Rows from the uncompressed scratch file. Lines were validated on the way in,…, Stop capture, run post-session analysis, then write the .csv.gz with the…, _read_partial(), stop_recording(), _stop_recording_locked(), _write_final_recording()

### Community 153 - "Community 153"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run(), doRun()

### Community 154 - "Community 154"
Cohesion: 0.29
Nodes (7): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run(), doRun()

### Community 156 - "Community 156"
Cohesion: 0.29
Nodes (6): cryptSharedAvailable, DEFAULT_LIB_PATH, fs, path, REPO_ROOT, requireCryptShared()

### Community 157 - "Community 157"
Cohesion: 0.29
Nodes (3): DOCTOR_NAME_TRANSLATIONS, HemophiliaDetailsScreen(), IMPORTANT:

### Community 158 - "Admin Model Test Rationale"
Cohesion: 0.33
Nodes (6): E-DEC.2, and the reason it matters: the IMU's whole value is being an…, test_e11_absent_sensor_is_never_imputed(), test_e11_missing_declared_source_blocks_scoring(), test_e11_present_sources_allow_scoring(), check_data_sources(), E11 / E-DEC.2. A model declares the sensors it REQUIRES at scoring time; a…

### Community 160 - "Telemetry Backend"
Cohesion: 0.40
Nodes (4): Perf counter/timer registry — MASTER_BUILD_PLAN_v3.md §3.2 R10, §5 B5. Not the…, snapshot(), timer(), timing()

### Community 161 - "Community 161"
Cohesion: 0.40
Nodes (5): faster-whisper (speech-to-text), graphifyy (old_physio_reference), manim (Manim animation library), mediapipe (pose/landmark detection), tree-sitter language parser set (old_physio_reference)

### Community 163 - "EMG Website Components"
Cohesion: 0.40
Nodes (4): EMGNav, renderToggleGroup(), paint(), select()

### Community 164 - "Community 164"
Cohesion: 0.33
Nodes (6): Ho(), Ko(), qa(), Wo(), Yo(), zo()

### Community 165 - "Community 165"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 166 - "Community 166"
Cohesion: 0.40
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 167 - "Community 167"
Cohesion: 0.47
Nodes (4): Lm, main(), Stand-in for a mediapipe landmark: has .x .y .z attributes., run_case()

### Community 168 - "Community 168"
Cohesion: 0.40
Nodes (5): bcrypt, connectDB, createAdmin(), IMPORTANT:, User

### Community 169 - "Community 169"
Cohesion: 0.33
Nodes (5): crypto, fs, masterKey, outputPath, path

### Community 170 - "Community 170"
Cohesion: 0.40
Nodes (4): AdminChangePassword(), RULES, S, strong()

### Community 171 - "Events Mirror Tests"
Cohesion: 0.50
Nodes (4): parse_js_events(), Path, Checks backend/app/events.py and frontend/src/lib/events.js declare the same…, test_mirror()

### Community 172 - "Community 172"
Cohesion: 0.40
Nodes (5): _assemble_multioutput(), Post-hoc assembly: set the internals MultiOutputClassifier.fit() would have…, _fit_model(), A real fitted multi-label estimator. Real, not a mock -- E3 check 4 loads it…, MultiOutputClassifier

### Community 173 - "Community 173"
Cohesion: 0.40
Nodes (4): draw_hud(), draw_hud_generic(), Generic HUD panel for any exercise. Displays the exercise name, rep counters,…, Render the semi-transparent left-side HUD panel onto frame.

### Community 174 - "Community 174"
Cohesion: 0.60
Nodes (4): _drive(), _frame(), main(), H7 — fake session client. Drives a live session over a REAL WebSocket without a…

### Community 175 - "EMG UDP Handler"
Cohesion: 0.40
Nodes (4): EMGUDPHandler, _parse_calibration(), Parse the 'ax,ay,az,gx,gy,gz,mpu_ok,shaky' payload following HELLO/CAL. Returns…, One UDP datagram holds MULTIPLE '<signal>,<envelop>\\n' lines - the firmware…

### Community 176 - "EMG Flask Backend"
Cohesion: 0.40
Nodes (4): EMG-service Flask backend (implied API server), Flask 3.1.3 (emg-service), matplotlib (emg-service), pyserial (EMG hardware serial comms)

### Community 177 - "Arduino Shim LED"
Cohesion: 0.40
Nodes (5): LedWrite, b, g, pin, r

### Community 178 - "Community 178"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 179 - "Community 179"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 180 - "Community 180"
Cohesion: 0.70
Nodes (4): encode_binary(), encode_ordinal(), encode_sex(), normalize_text()

### Community 181 - "Community 181"
Cohesion: 0.50
Nodes (4): bcrypt, connectDB, createStaffAccount(), User

### Community 182 - "Community 182"
Cohesion: 0.40
Nodes (4): bcrypt, connectDB, mongoose, User

### Community 183 - "Community 183"
Cohesion: 0.60
Nodes (4): assert, demo(), normalizeTargetJoint(), toJointList()

### Community 184 - "Community 184"
Cohesion: 0.50
Nodes (3): AdminDoctorRequestDetails(), getStatusClassStatic(), InfoItem()

### Community 185 - "Community 185"
Cohesion: 0.40
Nodes (3): AdminProfile(), empty, s

### Community 186 - "Community 186"
Cohesion: 0.40
Nodes (3): DoctorProfile(), empty, s

### Community 187 - "Community 187"
Cohesion: 0.67
Nodes (3): extract(), Mini Squat exercise-specific feature extractor. Input : common_feature.parquet…, select_columns()

### Community 188 - "Community 188"
Cohesion: 0.67
Nodes (3): find_videos(), main(), Find videos recursively, preserving their paths relative to input_root.

### Community 189 - "Community 189"
Cohesion: 0.67
Nodes (3): run(), SESSION_DATA_DIR, run_tests.sh script

### Community 190 - "EMG Event Stream"
Cohesion: 0.50
Nodes (4): event_stream(), Generator for SSE that yields lines from the queue., Server-Sent Events endpoint for real-time data., stream()

### Community 191 - "EMG Test Phase10"
Cohesion: 0.83
Nodes (3): init_ok(), main(), queue_frames()

### Community 192 - "EMG Test Phase3"
Cohesion: 0.83
Nodes (3): count_hellos(), main(), reset()

### Community 193 - "Frontend JS Config"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 194 - "Community 194"
Cohesion: 0.50
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 195 - "Community 195"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 196 - "Community 196"
Cohesion: 0.50
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 197 - "Community 197"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 198 - "Community 198"
Cohesion: 0.50
Nodes (4): FIFO Frame/Result Latency Correlation, finish (latency summary), G7/G8 Render and Audio Probe, Synthetic Landmarks Against Real Browser APIs

### Community 199 - "Mongo Crypt Vendor"
Cohesion: 0.50
Nodes (3): mongo_crypt_v1_lib, mongo_crypt_v1_query_analyzer, mongo_crypt_v1_status

### Community 200 - "Community 200"
Cohesion: 0.50
Nodes (3): devDependencies, shadcn, shadcn

### Community 201 - "Community 201"
Cohesion: 0.50
Nodes (3): client, { MongoClient }, p

### Community 204 - "Community 204"
Cohesion: 0.50
Nodes (3): AdminManagement(), emptyForm, styles

### Community 205 - "Community 205"
Cohesion: 0.50
Nodes (3): ForgotPassword(), roleInfo, styles

### Community 206 - "Community 206"
Cohesion: 0.50
Nodes (3): Chatbot(), IMPORTANT:, TEXT

### Community 207 - "Community 207"
Cohesion: 0.67
Nodes (3): PatientResearch(), IMPORTANT:, reportLink()

### Community 208 - "Community 208"
Cohesion: 0.67
Nodes (3): main(), name_for(), Vault-only view: project code, re-clustered, coloured. Reads graphify-…

### Community 209 - "Capabilities Route"
Cohesion: 0.67
Nodes (3): get_capabilities(), get, Request

### Community 218 - "Community 218"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 219 - "Community 219"
Cohesion: 1.00
Nodes (3): syncfs(), doCallback(), done()

### Community 220 - "Community 220"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 221 - "Community 221"
Cohesion: 1.00
Nodes (3): syncfs(), doCallback(), done()

### Community 222 - "Community 222"
Cohesion: 1.00
Nodes (3): G13 Recording Survives Worker Crash Harness, G13 Gate: Recording Isolated From Pose Worker, G13 Simulated Worker Crash Harness

## Knowledge Gaps
- **516 isolated node(s):** `npx`, `SESSION_DATA_DIR`, `DelayBudgetExhausted`, `pin`, `r` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1820 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **65 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `document()` connect `Community 75` to `Frontend Tailwind Vendor`, `Community 30`, `Community 87`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Y()` connect `Community 112` to `Chart.js Vendor (EMG)`, `Chart.js Vendor (EMG) A`, `Community 69`, `Tailwind Vendor Utils`, `Vendor Mix`, `Community 123`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `B()` connect `Vendor Mix` to `Frontend Tailwind Vendor`, `Tailwind Vendor Core`, `Community 112`, `Tailwind Vendor More`, `Community 21`, `Community 86`, `Community 26`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `add()` (e.g. with `h()` and `l()`) actually correct?**
  _`add()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `add()` (e.g. with `h()` and `l()`) actually correct?**
  _`add()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `npx`, `SESSION_DATA_DIR`, `DelayBudgetExhausted` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MediaPipe WASM SIMD` be split into smaller, more focused modules?**
  _Cohesion score 0.00975609756097561 - nodes in this community are weakly interconnected._
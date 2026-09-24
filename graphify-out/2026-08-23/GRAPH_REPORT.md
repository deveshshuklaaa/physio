# Graph Report - final_project  (2026-08-21)

## Corpus Check
- 86 files · ~72,821 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1969 nodes · 4207 edges · 134 communities (101 shown, 33 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 300 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da00ee8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- _old_physio_reference/exercise_runner.py
- angle_3d
- EMG Monitor Pro - Clinical Kinetic live page
- services/exercise_config.py
- app.py
- admin.py
- app/main.py
- ExerciseDefinition
- _old_physio_reference/requirements.txt
- requirements.txt (root)
- emg_review.py
- vision_bundle.mjs
- tailwind.js
- push
- has
- remove
- replace
- decl
- n
- stringify
- pose_engine.js
- add
- fn
- ql
- each
- K
- logger.js
- BrowserLogger
- extract_landmarks.py
- m
- .get
- .get
- common_features.py
- pose_engine_selfcheck.mjs
- app/exercise_config.py
- logging_setup.py
- emg_client.py
- run_exercise
- choose_grouping
- h
- g
- entries
- createWasm
- createWasm
- detect_view
- smoother.js
- ComponentLogger
- ExceptionInfo
- ExceptionInfo
- events.js
- get_definition
- xe
- math_utils.py
- N2
- run_feature_extractor.py
- Ax
- Mr
- clip_features
- gemini.py
- package.json
- convertDirection
- SessionWsClient
- skeleton.js
- Ag
- mE
- p
- _RingBuffer
- telemetry.py
- run
- run
- test_events_mirror.py
- makeBlendState
- makeVertexAttributes
- makeBlendState
- makeVertexAttributes
- _set
- run_g13_test.mjs
- run_g5_test.mjs
- mini_squat.py
- find_videos
- ___syscall_ioctl
- ___syscall_ioctl
- prefixQuery
- heel_slide.py
- seated_knee_extension.py
- slr.py
- tke.py
- getWeekBasedYear
- write
- getWeekBasedYear
- write
- ao
- lk
- applyVariantOffset
- checkMissedSemicolon
- ho
- ef
- hl
- Lt
- close
- convertReturnValue
- _emscripten_stack_snapshot
- get_char
- leadingNulls
- makeDepthStencilState
- registerType
- close
- convertReturnValue
- _emscripten_stack_snapshot
- get_char
- leadingNulls
- makeDepthStencilState
- registerType
- aS
- ay
- Bf
- Wa
- ib
- Md
- oS
- qk
- classic_probe_worker.js

## God Nodes (most connected - your core abstractions)
1. `push()` - 70 edges
2. `add()` - 63 edges
3. `n()` - 60 edges
4. `replace()` - 54 edges
5. `e()` - 46 edges
6. `m()` - 45 edges
7. `has()` - 40 edges
8. `remove()` - 40 edges
9. `get()` - 36 edges
10. `r()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `run_case()` --calls--> `angle_2d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `angle_3d()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `torso_lean()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `run_case()` --calls--> `detect_view()`  [INFERRED]
  frontend/tools/parity_python.py → backend/_old_physio_reference/math_utils.py
- `oC()` --indirect_call--> `e()`  [INFERRED]
  frontend/src/vendor/tailwind/tailwind.js → frontend/src/assets/vendor/mediapipe/vision_bundle.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Multiple near-duplicate live-monitor HTML drafts (live, live2, live3, live copy july24) representing iterative UI experimentation without version control cleanup** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live2_html_emg_realtime, emg_service_website_live3_html_emg_monitor_pro, live_copy_july24_html_emg_monitor_pro [AMBIGUOUS 0.30]
- **Live EMG monitoring pages poll Flask backend via /api/snapshot and /api/status, render on canvas via animate/draw loop** — emg_service_website_live_html_emg_monitor_pro, emg_service_website_live_html_animate_loop, emg_service_website_live_html_draw, emg_service_website_live_html_snapshot_api, emg_service_website_live_html_status_api, emg_service_flask_backend [INFERRED 0.75]
- **Project has three parallel Python dependency stacks: legacy manim/mediapipe physio reference, new lightweight FastAPI backend, and Flask-based emg-service, plus a root graphify/LLM toolchain** — backend_old_physio_reference_requirements_old_physio_reference, backend_requirements_backend, emg_service_requirements_emg_service, requirements_root [INFERRED 0.80]

## Communities (134 total, 33 thin omitted)

### Community 0 - "_old_physio_reference/exercise_runner.py"
Cohesion: 0.15
Nodes (16): _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Draw the semi-transparent left HUD panel onto frame in-place., run_exercise(), build_gemini_prompt_generic(), Builds a Gemini coaching prompt from any ExerciseDefinition + session log., discover_exercises() (+8 more)

### Community 1 - "angle_3d"
Cohesion: 0.14
Nodes (17): _compute_joint_angle(), Run all JointChecks for current view. Returns (alerts, joint_angles,…, _run_joint_checks(), angle_2d(), angle_3d(), Angle at point B using 2D pixel coordinates (x, y). Best used for front-view…, Angle at point B using normalised 3D coordinates (x, y, z) from MediaPipe. Most…, check_butt_wink() (+9 more)

### Community 2 - "EMG Monitor Pro - Clinical Kinetic live page"
Cohesion: 0.07
Nodes (29): EMG-service Flask backend (implied API server), Flask 3.1.3 (emg-service), matplotlib (emg-service), pyserial (EMG hardware serial comms), GET /api/list_recordings fetch call (history2), loadRecordings() function (history2), Clinical Kinetic EMG Recording History page (variant 2), formatDuration() function (+21 more)

### Community 3 - "services/exercise_config.py"
Cohesion: 0.10
Nodes (20): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines what drives the rep state machine. The engine watches the angle of the…, Defines the hold logic for isometric / static exercises. Instead of counting…, RepTrigger (+12 more)

### Community 4 - "app.py"
Cohesion: 0.13
Nodes (26): add_to_history(), event_stream(), get_recording(), index(), list_recordings(), live_value(), load_history(), Generator for SSE that yields lines from the queue. (+18 more)

### Community 5 - "admin.py"
Cohesion: 0.20
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 6 - "app/main.py"
Cohesion: 0.16
Nodes (15): emg_history(), emg_live(), emg_status(), health(), lifespan(), metrics(), get, Get current live EMG reading from Flask service. (+7 more)

### Community 7 - "ExerciseDefinition"
Cohesion: 0.25
Nodes (10): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise. Pass this to…, Defines an angle-based check for a single joint. The angle is measured at…, Defines the hold logic for isometric / static exercises. Instead of counting…, get_definition(), ExerciseDefinition (+2 more)

### Community 8 - "_old_physio_reference/requirements.txt"
Cohesion: 0.22
Nodes (9): faster-whisper (speech-to-text), graphifyy (old_physio_reference), manim (Manim animation library), mediapipe (pose/landmark detection), tree-sitter language parser set (old_physio_reference), fastapi 0.141.1 (backend), pydantic 2.13.4 (backend), uvicorn 0.52.1 (backend ASGI server) (+1 more)

### Community 10 - "requirements.txt (root)"
Cohesion: 0.38
Nodes (7): fastapi 0.115.6 (root), graphifyy (root, knowledge-graph tool dep), litellm (LLM proxy, root), mcp 1.29.0 (root), openai SDK (root), requirements.txt (root), tree-sitter language parser set (root)

### Community 14 - "vision_bundle.mjs"
Cohesion: 0.05
Nodes (53): ar(), at(), Bt, Co(), ct(), dt(), et(), finishProcessing() (+45 more)

### Community 15 - "tailwind.js"
Cohesion: 0.04
Nodes (7): dd(), DS(), Ja(), NS(), oC(), to(), VS()

### Community 16 - "push"
Cohesion: 0.07
Nodes (58): y(), after(), append(), applyParallelOffset(), B(), Bo(), c(), cl() (+50 more)

### Community 17 - "has"
Cohesion: 0.06
Nodes (57): arbitraryProperty(), cr(), cu(), delete(), _deleteIfExpired(), ec(), entriesDescending(), eO() (+49 more)

### Community 18 - "remove"
Cohesion: 0.07
Nodes (52): Ae(), Ah(), before(), check(), co(), Dc(), Dl(), error() (+44 more)

### Community 19 - "replace"
Cohesion: 0.06
Nodes (49): exitFullscreen(), exitFullscreen(), beforeAfter(), body(), Bt(), c3(), calcBefore(), checkForWarning() (+41 more)

### Community 20 - "decl"
Cohesion: 0.07
Nodes (43): _1(), atrule(), block(), comment(), constructor(), createTokenizer(), decl(), emptyRule() (+35 more)

### Community 21 - "n"
Cohesion: 0.13
Nodes (39): A(), aa, ba(), ca(), clear(), clone(), close(), constructor() (+31 more)

### Community 22 - "stringify"
Cohesion: 0.09
Nodes (33): async(), ba(), catch(), cloneDiv(), colorStops(), content(), css(), finally() (+25 more)

### Community 23 - "pose_engine.js"
Cohesion: 0.15
Nodes (21): angle2d(), angle3d(), clip(), detectView(), torsoLean(), VIEW_Z_DIFF_THRESHOLD, LM, VISIBILITY_THRESH (+13 more)

### Community 24 - "add"
Cohesion: 0.09
Nodes (30): add(), already(), cleanFromUnprefixed(), cleanOtherPrefixes(), cloneBefore(), convert(), displayType(), findProp() (+22 more)

### Community 25 - "fn"
Cohesion: 0.16
Nodes (28): an(), bn(), br(), ce, dn(), ee(), fn(), ge() (+20 more)

### Community 26 - "ql"
Cohesion: 0.10
Nodes (27): At(), by(), ca(), ea(), er(), Ex(), Gl(), Ix() (+19 more)

### Community 27 - "each"
Cohesion: 0.09
Nodes (26): addToError(), disabled(), disabledDecl(), disabledValue(), each(), gridStatus(), Gt(), $h() (+18 more)

### Community 28 - "K"
Cohesion: 0.13
Nodes (25): bx(), clear(), dx(), every(), Fr(), Gp(), ia(), If() (+17 more)

### Community 29 - "logger.js"
Cohesion: 0.14
Nodes (7): AUDIO_BASE, AUDIO_MAP, AudioCuePlayer, LEVELS, RingBuffer, drained, rb

### Community 30 - "BrowserLogger"
Cohesion: 0.15
Nodes (3): BrowserLogger, IsolatedRecorder, startLiveSession()

### Community 31 - "extract_landmarks.py"
Cohesion: 0.20
Nodes (18): add_empty_landmark_columns(), add_floor_relative_columns(), batch_extract(), _ema_smoothed_columns(), estimate_clip_floor(), estimate_floor_y(), find_longest_stable_run(), find_videos() (+10 more)

### Community 32 - "m"
Cohesion: 0.15
Nodes (19): ae(), D(), Fh(), Ho(), ii(), Io(), keys(), ki() (+11 more)

### Community 33 - ".get"
Cohesion: 0.13
Nodes (14): createLazyFile(), forceLoadFile(), intArrayFromString(), makeColorAttachment(), makeColorAttachments(), makeComputePassTimestampWrites(), makeDepthStencilAttachment(), makeEntries() (+6 more)

### Community 34 - ".get"
Cohesion: 0.13
Nodes (14): createLazyFile(), forceLoadFile(), intArrayFromString(), makeColorAttachment(), makeColorAttachments(), makeComputePassTimestampWrites(), makeDepthStencilAttachment(), makeEntries() (+6 more)

### Community 35 - "common_features.py"
Cohesion: 0.33
Nodes (16): add_angle_2d(), add_angle_3d(), add_derivative_features(), add_distance_3d(), derivative(), extract_common_features(), extract_common_file(), main() (+8 more)

### Community 36 - "pose_engine_selfcheck.mjs"
Cohesion: 0.14
Nodes (12): EmaSmoother, engine, engine2, fracsDown, fracsHold, fracsUp, frameAt(), frameAtKneeCave() (+4 more)

### Community 37 - "app/exercise_config.py"
Cohesion: 0.21
Nodes (14): Any, ExerciseConfigError, load_exercises(), Path, Exercise registry loader — Phase F (backend-core-agent). Pure-data config:…, Load, validate, and return the exercise registry as {name: record}. Not cached…, Raised when an exercise record fails validation. A config file is a trust…, A threshold (or trigger sub-field) is still a placeholder iff it is the… (+6 more)

### Community 38 - "logging_setup.py"
Cohesion: 0.14
Nodes (11): is_valid_event(), Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3. Mirrored 1:1 in…, correlation(), get_logger(), _JsonFormatter, _make_handler(), Structured JSON logger — MASTER_BUILD_PLAN_v3.md §8b. One JSON object per line,…, Renders the pre-built dict on record.extra_fields as one JSON line. All the… (+3 more)

### Community 39 - "emg_client.py"
Cohesion: 0.23
Nodes (13): _circuit_open(), get_emg_history(), get_emg_status(), get_live_emg_reading(), _get_state(), EMG Flask service client for FastAPI backend., True if calls to base_url should be skipped right now., Fetch current live EMG reading from Flask service. Returns dict with keys:… (+5 more)

### Community 40 - "run_exercise"
Cohesion: 0.16
Nodes (14): _compute_joint_angle(), _draw_hud(), ExerciseDefinition, Entry point called by every exercise file. Handles both dynamic (rep-based) and…, Run all JointChecks for current view. Returns (alerts, joint_angles,…, Draw the semi-transparent left HUD panel onto frame in-place., run_exercise(), _run_joint_checks() (+6 more)

### Community 41 - "choose_grouping"
Cohesion: 0.28
Nodes (13): export_exercise(), main(), Path, choose_grouping(), evaluate(), main(), make_model(), DataFrame (+5 more)

### Community 42 - "h"
Cohesion: 0.18
Nodes (16): cn(), cr(), dr(), en(), Er(), fr(), gn(), h() (+8 more)

### Community 43 - "g"
Cohesion: 0.23
Nodes (15): ac(), bh(), eh(), F(), g(), Ga(), Ih(), Lh() (+7 more)

### Community 44 - "entries"
Cohesion: 0.16
Nodes (15): c(), delete(), entries(), Fe(), get(), has(), he(), kn() (+7 more)

### Community 45 - "createWasm"
Cohesion: 0.13
Nodes (15): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), getBinaryPromise(), getBinarySync() (+7 more)

### Community 46 - "createWasm"
Cohesion: 0.13
Nodes (15): abort(), addOnInit(), addRunDependency(), assert(), createContext(), createWasm(), getBinaryPromise(), getBinarySync() (+7 more)

### Community 47 - "detect_view"
Cohesion: 0.30
Nodes (13): Defines what drives the rep state machine. The engine watches the angle of the…, RepTrigger, check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front() (+5 more)

### Community 48 - "smoother.js"
Cohesion: 0.16
Nodes (4): OneEuroScalar, OneEuroSmoother, handleFrame(), init()

### Community 49 - "ComponentLogger"
Cohesion: 0.23
Nodes (6): ComponentLogger, _next_seq(), Thin wrapper around stdlib logging.Logger that builds the §8b.1/8b.5 schema…, §8b.5 — every ERROR/FATAL line carries error_type, error_message, stack,…, Queue a log line. `sample_every=N` keeps 1-in-N calls for this event (anomalies…, BaseException

### Community 52 - "events.js"
Cohesion: 0.15
Nodes (12): ALL_EVENTS, CROSSCHECK, EMG_IMU, EXERCISE_CONFIG, EXTRACTOR, isValidEvent(), MODEL, POSE_WORKER (+4 more)

### Community 53 - "get_definition"
Cohesion: 0.29
Nodes (11): check_butt_wink(), check_heel_lift(), check_knee_cave(), check_knee_past_toes(), check_neck(), check_torso_lean_front(), check_torso_lean_side(), get_definition() (+3 more)

### Community 55 - "math_utils.py"
Cohesion: 0.24
Nodes (8): build_pts(), Build a pixel-coordinate dict for all landmarks that pass VISIBILITY_THRESH.…, EMA-smooth a single MediaPipe landmark. Returns (x, y, z) smoothed normalised…, smooth_landmark(), Lm, main(), Stand-in for a mediapipe landmark: has .x .y .z attributes., run_case()

### Community 56 - "N2"
Cohesion: 0.18
Nodes (11): cn(), da(), fn(), Hr(), Lx(), mc(), Mx(), N2() (+3 more)

### Community 57 - "run_feature_extractor.py"
Cohesion: 0.38
Nodes (9): find_parquets(), main(), output_path_for(), parse_args(), Path, run_extractor(), validate(), CompletedProcess (+1 more)

### Community 58 - "Ax"
Cohesion: 0.38
Nodes (10): ac(), Ax(), Et(), la(), ln(), nc(), oa(), qe() (+2 more)

### Community 59 - "Mr"
Cohesion: 0.22
Nodes (10): blueGray(), coolGray(), Dh(), Ih(), lightBlue(), Mr(), q_(), Qo() (+2 more)

### Community 60 - "clip_features"
Cohesion: 0.31
Nodes (8): clip_features(), label_cols(), main(), DataFrame, Path, Collapse one clip's frames into a single feature row., Everything in the manifest that isn't metadata is a label., Series

### Community 61 - "gemini.py"
Cohesion: 0.31
Nodes (8): build_gemini_prompt(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API. Returns the coaching text, or a…, Converts the per-rep session log into a structured coaching prompt. session_log…, Scrollable cv2 window showing the Gemini coaching report. API call runs in…, show_report_window(), _wrap_text()

### Community 62 - "package.json"
Cohesion: 0.22
Nodes (8): description, name, private, scripts, test:parity, test:ring_buffer, type, version

### Community 63 - "convertDirection"
Cohesion: 0.25
Nodes (8): convertDirection(), fixAngle(), fixDirection(), fixRadial(), isRadial(), newDirection(), revertDirection(), roundFloat()

### Community 65 - "skeleton.js"
Cohesion: 0.29
Nodes (4): SKELETON_CONNECTIONS, C_BGR, COLOR, drawSkeleton()

### Community 66 - "Ag"
Cohesion: 0.29
Nodes (7): Ag(), Cg(), dm(), M2(), O2(), R2(), T2()

### Community 67 - "mE"
Cohesion: 0.29
Nodes (7): Am(), bE(), gE(), km(), mE(), Sm(), vm()

### Community 68 - "p"
Cohesion: 0.29
Nodes (7): _d(), Kn(), p(), rs(), Sh(), showSourceCode(), toString()

### Community 69 - "_RingBuffer"
Cohesion: 0.33
Nodes (3): Flush everything currently buffered. Returns count flushed., Background thread that drains periodically. Call once at startup (e.g. from…, _RingBuffer

### Community 70 - "telemetry.py"
Cohesion: 0.40
Nodes (4): Perf counter/timer registry — MASTER_BUILD_PLAN_v3.md §3.2 R10, §5 B5. Not the…, snapshot(), timer(), timing()

### Community 71 - "run"
Cohesion: 0.33
Nodes (6): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run()

### Community 72 - "run"
Cohesion: 0.33
Nodes (6): addOnPostRun(), addOnPreRun(), initRuntime(), postRun(), preRun(), run()

### Community 73 - "test_events_mirror.py"
Cohesion: 0.50
Nodes (4): parse_js_events(), Path, Checks backend/app/events.py and frontend/src/lib/events.js declare the same…, test_mirror()

### Community 74 - "makeBlendState"
Cohesion: 0.40
Nodes (5): makeBlendComponent(), makeBlendState(), makeColorState(), makeColorStates(), makeFragmentState()

### Community 75 - "makeVertexAttributes"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 76 - "makeBlendState"
Cohesion: 0.40
Nodes (5): makeBlendComponent(), makeBlendState(), makeColorState(), makeColorStates(), makeFragmentState()

### Community 77 - "makeVertexAttributes"
Cohesion: 0.40
Nodes (5): makeVertexAttribute(), makeVertexAttributes(), makeVertexBuffer(), makeVertexBuffers(), makeVertexState()

### Community 78 - "_set"
Cohesion: 0.40
Nodes (5): _emitEvictions(), _entriesAscending(), _moveToRecent(), resize(), _set()

### Community 79 - "run_g13_test.mjs"
Cohesion: 0.50
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 80 - "run_g5_test.mjs"
Cohesion: 0.50
Nodes (4): FRONTEND_ROOT, HERE, main(), sleep()

### Community 81 - "mini_squat.py"
Cohesion: 0.67
Nodes (3): extract(), Mini Squat exercise-specific feature extractor. Input : common_feature.parquet…, select_columns()

### Community 82 - "find_videos"
Cohesion: 0.67
Nodes (3): find_videos(), main(), Find videos recursively, preserving their paths relative to input_root.

### Community 83 - "___syscall_ioctl"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 84 - "___syscall_ioctl"
Cohesion: 0.50
Nodes (4): ioctl_tcgets(), ioctl_tcsets(), ioctl_tiocgwinsz(), ___syscall_ioctl()

### Community 85 - "prefixQuery"
Cohesion: 0.50
Nodes (4): clean(), div(), prefixName(), prefixQuery()

### Community 90 - "getWeekBasedYear"
Cohesion: 0.67
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 91 - "write"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 92 - "getWeekBasedYear"
Cohesion: 0.67
Nodes (3): compareByDay(), getFirstWeekStartDate(), getWeekBasedYear()

### Community 93 - "write"
Cohesion: 0.67
Nodes (3): msync(), put_char(), write()

### Community 94 - "ao"
Cohesion: 0.67
Nodes (3): ad(), ao(), kS()

### Community 95 - "lk"
Cohesion: 0.67
Nodes (3): ak(), lk(), Qp()

### Community 96 - "applyVariantOffset"
Cohesion: 0.67
Nodes (3): applyVariantOffset(), compare(), Hh()

### Community 97 - "checkMissedSemicolon"
Cohesion: 0.67
Nodes (3): checkMissedSemicolon(), colon(), doubleColon()

### Community 98 - "ho"
Cohesion: 0.67
Nodes (3): dO(), fA(), ho()

### Community 99 - "ef"
Cohesion: 1.00
Nodes (3): ef(), q5(), W0()

### Community 100 - "hl"
Cohesion: 0.67
Nodes (3): hE(), hl(), xm()

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
- **67 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

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
- **Why does `document()` connect `replace` to `createWasm`, `createWasm`, `tailwind.js`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `e()` connect `n` to `vision_bundle.mjs`, `tailwind.js`, `push`, `has`, `remove`, `replace`, `decl`, `stringify`, `add`, `fn`, `ql`, `each`, `K`, `m`, `g`, `entries`, `createWasm`, `createWasm`, `_set`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
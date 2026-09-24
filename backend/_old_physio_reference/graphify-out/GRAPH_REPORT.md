# Graph Report - /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1  (2026-07-15)

## Corpus Check
- 15 files · ~22,097 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 144 nodes · 168 edges · 43 communities detected
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `run_exercise()` - 13 edges
2. `ask()` - 9 edges
3. `create_exercise()` - 9 edges
4. `detect_view()` - 9 edges
5. `ExerciseDefinition` - 8 edges
6. `ai_create_exercise()` - 8 edges
7. `angle_3d()` - 8 edges
8. `slug()` - 7 edges
9. `_run_isometric_wizard()` - 7 edges
10. `torso_lean()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Run all JointChecks for current view. Returns (alerts, joint_angles, driver_angl` --uses--> `ExerciseDefinition`  [INFERRED]
  /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_runner.py → /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_base.py
- `Draw the semi-transparent left HUD panel onto frame in-place.` --uses--> `ExerciseDefinition`  [INFERRED]
  /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_runner.py → /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_base.py
- `_compute_joint_angle()` --calls--> `angle_3d()`  [INFERRED]
  /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_runner.py → /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/math_utils.py
- `_compute_joint_angle()` --calls--> `angle_2d()`  [INFERRED]
  /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_runner.py → /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/math_utils.py
- `run_exercise()` --calls--> `init_tts()`  [INFERRED]
  /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/exercise_runner.py → /home/billa-dakait/Desktop/Major Project AI/modular/ver6/files1/voice.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (24): angle_2d(), angle_3d(), detect_view(), Angle at point B using 2D pixel coordinates (x, y).     Best used for front-view, Angle at point B using normalised 3D coordinates (x, y, z) from MediaPipe.     M, Returns the lean angle (degrees) of the torso from vertical., Returns 'SIDE' if the person is turned sideways, 'FRONT' otherwise.     Uses the, torso_lean() (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.2
Nodes (19): ai_create_exercise(), ask(), ask_choice(), ask_float(), ask_int(), ask_landmark(), build_extraction_prompt(), call_ollama() (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (15): ExerciseDefinition, IsometricTrigger, JointCheck, Complete specification of an exercise.     Pass this to exercise_runner.run_exer, Defines an angle-based check for a single joint.      The angle is measured at l, Defines what drives the rep state machine.      The engine watches the angle of, Defines the hold logic for isometric / static exercises.      Instead of countin, RepTrigger (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (16): _compute_joint_angle(), _draw_hud(), Entry point called by every exercise file.     Handles both dynamic (rep-based), Run all JointChecks for current view. Returns (alerts, joint_angles, driver_angl, Draw the semi-transparent left HUD panel onto frame in-place., run_exercise(), _run_joint_checks(), build_pts() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (10): build_gemini_prompt(), build_gemini_prompt_generic(), call_gemini(), _fetch_thread(), Calls Gemini 2.5 Flash via REST API.     Returns the coaching text, or a descrip, Builds a Gemini coaching prompt from any ExerciseDefinition + session log., Converts the per-rep session log into a structured coaching prompt.     session_, Scrollable cv2 window showing the Gemini coaching report.     API call runs in b (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (6): draw_hud(), draw_hud_generic(), draw_skeleton(), Generic HUD panel for any exercise.     Displays the exercise name, rep counters, Draw the skeleton overlay on frame.     Two-pass render (shadow + colour) for vi, Render the semi-transparent left-side HUD panel onto frame.

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (1): Run all JointChecks for current view. Returns (alerts, joint_angles, driver_angl

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (1): Draw the semi-transparent left HUD panel onto frame in-place.

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (1): Entry point called by every exercise file.     Handles both dynamic (rep-based)

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (1): Converts the per-rep session log into a structured coaching prompt.     session_

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (1): Calls Gemini 2.5 Flash via REST API.     Returns the coaching text, or a descrip

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): Builds a Gemini coaching prompt from any ExerciseDefinition + session log.

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): Scrollable cv2 window showing the Gemini coaching report.     API call runs in b

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (1): Checks valid in front-facing view.     Uses 2D pixel angles (Z is unreliable fro

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): Checks valid in side-facing view.     Uses 3D angles for knee (depth is reliable

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Detects heels rising off the ground.     Compares current heel Y against a basel

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): Detects neck out of neutral (looking up or down excessively).     Measures the e

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Detects posterior pelvic tilt (butt wink) at the bottom of the squat.     Only m

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): EMA-smooth a single MediaPipe landmark.     Returns (x, y, z) smoothed normalise

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): Clear all smoothed state. Call on session reset.

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Defines an angle-based check for a single joint.      The angle is measured at l

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): Defines what drives the rep state machine.      The engine watches the angle of

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Defines the hold logic for isometric / static exercises.      Instead of countin

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Complete specification of an exercise.     Pass this to exercise_runner.run_exer

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Convert exercise name to a valid Python identifier.

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Call Ollama API, return parsed JSON.

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Build prompt for Ollama to extract exercise parameters.

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Use Ollama to generate exercise from natural language.

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Render the collected data into a Python exercise file string.

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Angle at point B using 2D pixel coordinates (x, y).     Best used for front-view

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Angle at point B using normalised 3D coordinates (x, y, z) from MediaPipe.     M

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Returns the lean angle (degrees) of the torso from vertical.

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Returns 'SIDE' if the person is turned sideways, 'FRONT' otherwise.     Uses the

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Build a pixel-coordinate dict for all landmarks that pass VISIBILITY_THRESH.

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Draw the skeleton overlay on frame.     Two-pass render (shadow + colour) for vi

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Render the semi-transparent left-side HUD panel onto frame.

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Generic HUD panel for any exercise.     Displays the exercise name, rep counters

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): ╔══════════════════════════════════════════════════════════════════╗ ║  XAI Phys

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Scan exercises/ and return [(display_name, filepath)] for every     .py file tha

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Elbows should stay close to the torso during a curl.     If elbow drifts signifi

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): Wrist should stay roughly in line with forearm (no excessive bend).     Checks t

## Knowledge Gaps
- **66 isolated node(s):** `Entry point called by every exercise file.     Handles both dynamic (rep-based)`, `Converts the per-rep session log into a structured coaching prompt.     session_`, `Calls Gemini 2.5 Flash via REST API.     Returns the coaching text, or a descrip`, `Builds a Gemini coaching prompt from any ExerciseDefinition + session log.`, `Scrollable cv2 window showing the Gemini coaching report.     API call runs in b` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (1 nodes): `config.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (1 nodes): `landmarks.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (1 nodes): `Run all JointChecks for current view. Returns (alerts, joint_angles, driver_angl`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (1 nodes): `Draw the semi-transparent left HUD panel onto frame in-place.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (1 nodes): `Entry point called by every exercise file.     Handles both dynamic (rep-based)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (1 nodes): `Converts the per-rep session log into a structured coaching prompt.     session_`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (1 nodes): `Calls Gemini 2.5 Flash via REST API.     Returns the coaching text, or a descrip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `Builds a Gemini coaching prompt from any ExerciseDefinition + session log.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `Scrollable cv2 window showing the Gemini coaching report.     API call runs in b`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `Checks valid in front-facing view.     Uses 2D pixel angles (Z is unreliable fro`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `Checks valid in side-facing view.     Uses 3D angles for knee (depth is reliable`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `Detects heels rising off the ground.     Compares current heel Y against a basel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `Detects neck out of neutral (looking up or down excessively).     Measures the e`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `Detects posterior pelvic tilt (butt wink) at the bottom of the squat.     Only m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `EMA-smooth a single MediaPipe landmark.     Returns (x, y, z) smoothed normalise`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Clear all smoothed state. Call on session reset.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Defines an angle-based check for a single joint.      The angle is measured at l`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `Defines what drives the rep state machine.      The engine watches the angle of`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `Defines the hold logic for isometric / static exercises.      Instead of countin`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `Complete specification of an exercise.     Pass this to exercise_runner.run_exer`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Convert exercise name to a valid Python identifier.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Call Ollama API, return parsed JSON.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Build prompt for Ollama to extract exercise parameters.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Use Ollama to generate exercise from natural language.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Render the collected data into a Python exercise file string.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Angle at point B using 2D pixel coordinates (x, y).     Best used for front-view`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Angle at point B using normalised 3D coordinates (x, y, z) from MediaPipe.     M`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `Returns the lean angle (degrees) of the torso from vertical.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Returns 'SIDE' if the person is turned sideways, 'FRONT' otherwise.     Uses the`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Build a pixel-coordinate dict for all landmarks that pass VISIBILITY_THRESH.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Draw the skeleton overlay on frame.     Two-pass render (shadow + colour) for vi`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Render the semi-transparent left-side HUD panel onto frame.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Generic HUD panel for any exercise.     Displays the exercise name, rep counters`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `╔══════════════════════════════════════════════════════════════════╗ ║  XAI Phys`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Scan exercises/ and return [(display_name, filepath)] for every     .py file tha`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Elbows should stay close to the torso during a curl.     If elbow drifts signifi`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Wrist should stay roughly in line with forearm (no excessive bend).     Checks t`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `run_exercise()` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Why does `detect_view()` connect `Community 0` to `Community 3`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `run_exercise()` (e.g. with `init_tts()` and `build_pts()`) actually correct?**
  _`run_exercise()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `detect_view()` (e.g. with `run_exercise()` and `check_knee_cave()`) actually correct?**
  _`detect_view()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `ExerciseDefinition` (e.g. with `Run all JointChecks for current view. Returns (alerts, joint_angles, driver_angl` and `Draw the semi-transparent left HUD panel onto frame in-place.`) actually correct?**
  _`ExerciseDefinition` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Entry point called by every exercise file.     Handles both dynamic (rep-based)`, `Converts the per-rep session log into a structured coaching prompt.     session_`, `Calls Gemini 2.5 Flash via REST API.     Returns the coaching text, or a descrip` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
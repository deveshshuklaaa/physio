# Group D — Old Physio Project Inspection Notes

## D0a. admin.py

**What it does:** Interactive CLI tool for creating/managing exercise definition files. It provides a menu-driven wizard (manual + AI-assisted via Ollama) to generate new exercise `.py` files in `exercises/` directory. Also supports listing, reading, and deleting exercise files.

**Decision:** Dev-only tooling — **drop from new backend**. This is a development-time exercise authoring utility, not needed at runtime. The new system will have its own exercise configuration approach (likely JSON/YAML configs loaded by the backend).

---

## D0b. drawing.py

**Confirms:** cv2-based overlay drawing for local display only.

**What it draws (for frontend replication in Group J):**

1. **Skeleton overlay** (`draw_skeleton`):
   - Two-pass render (shadow + color) for visual stability
   - Lines for all `SKELETON_CONNECTIONS` (32 connections: head, torso, arms, legs)
   - Circles at each landmark: shadow (7px) → color (6px) → white outline (8px, 1px)

2. **HUD Panel** (`draw_hud` - squat-specific, `draw_hud_generic` - any exercise):
   - Semi-transparent dark left panel (300px wide, full height, 65% opacity)
   - Title + view badge (e.g., "SQUAT ANALYZER [SIDE VIEW]")
   - Rep counters: TOTAL (white) + CLEAN (green) — large numbers
   - Stage badge: "STAGE: UP" (green) / "STAGE: DOWN" (yellow) — or "IN POSITION"/"GET IN POSITION" for isometric
   - Last rep result: "CLEAN REP" (green) or "BAD: <reason>" (red)
   - Live metrics: up to 6 joint angles + FPS
   - Depth/Range bar: horizontal progress bar with target marker (green if ≥85% target, yellow otherwise)
   - Alerts section: red "! ALERTS" header + wrapped alert text (max 4), or "POSTURE OK" (green)
   - Footer hint: "Q = quit   R = reset"

**Color palette (BGR):**
- green: (0, 220, 100)
- red: (30, 60, 240)
- yellow: (0, 200, 255)
- white: (240, 240, 240)
- accent (orange): (0, 165, 255)
- dim: (100, 100, 130)
- panel bg: (12, 12, 22)
- shadow: (15, 15, 15)

---

## D1. exercise_runner.py

**Loop type:** **Blocking `cv2.VideoCapture` loop** — single-threaded, runs in main thread. No threading for camera capture.

**Per-frame call order (critical — must replicate in Group G WS live-loop):**

```
1. cap.read() → frame
2. cv2.flip(frame, 1)  # mirror
3. Resize to detection scale (DETECTION_SCALE)
4. cv2.cvtColor(small, BGR2RGB)
5. mp.Image + landmarker.detect_for_video(mp_img, timestamp_ms)
6. If pose_landmarks found:
   a. lms = result.pose_landmarks[0]
   b. pts = build_pts(lms, w, h)  # from math_utils — projects + EMA smooths
   c. view = detect_view(lms)      # from math_utils — FRONT/SIDE
   d. If view in definition.valid_views:
      i.   alerts, joint_angles, driver_angle = _run_joint_checks(definition, lms, pts, w, view)
           - _run_joint_checks iterates definition.joint_checks
           - For each: _compute_joint_angle (angle_2d or angle_3d from math_utils)
           - Checks min/max thresholds → adds alert_too_low / alert_too_high
      ii.  For each fn in definition.extra_checks:
           - a = fn(lms, pts, w, h, stage) → adds to alerts
   e. ISOMETRIC state machine:
      - Finds monitored joint angle from joint_angles
      - Checks hold zone (hold_min_angle ≤ angle ≤ hold_max_angle)
      - Updates hold_secs, triggers speak(alert) on alerts/break
      - Counts set when hold_secs ≥ hold_duration_secs
   f. DYNAMIC state machine:
      - UP→DOWN: driver_angle crosses enter_angle (direction-aware)
      - DOWN: tracks best_driver_angle (min for decrease, max for increase)
      - DOWN: speak(alerts[0]) on first alert, collects rep_errors
      - DOWN→UP: driver_angle crosses exit_angle
      - On exit: checks depth_target, finalizes rep_was_clean, logs to session_log
7. Skeleton overlay: draw_skeleton(frame, pts, color) — color = red if alerts else green
8. Angle labels on joints: cv2.putText at joint vertex
9. FPS calculation
10. _draw_hud(frame, definition, state, fps)
11. cv2.imshow + cv2.waitKey(1)
12. On 'q': break; on 'r': reset all state + reset_smoother()
13. After loop: cap.release(), cv2.destroyAllWindows(), landmarker.close()
14. If session_log not empty: build_gemini_prompt_generic → show_report_window
```

**Key functions imported and used per frame:**
- `landmarks.LM` — landmark index map
- `math_utils.build_pts`, `math_utils.detect_view`, `math_utils.angle_2d`, `math_utils.angle_3d`
- `smoother.smooth_landmark` (called inside `build_pts`), `smoother.reset_smoother`
- `posture_checks` functions (via `extra_checks` in exercise definition)
- `voice.speak` (called with alert string)
- `drawing.draw_skeleton`, `drawing.C`
- `gemini.build_gemini_prompt_generic`, `gemini.show_report_window`

---

## D2. landmarks.py + smoother.py → extract_landmarks.py

**Created:** `/home/billa-dakait/Desktop/final_project/backend/ml/extract_landmarks.py`

**Adjustments made:**
- Takes video file path as input (not live camera)
- Outputs landmarks per frame as list of dicts: `[{frame_idx, timestamp_ms, landmarks: {name: {x,y,z,visibility}}}]`
- Reuses `smoother.py` EMA smoothing logic applied identically to live pipeline
- Uses same `VISIBILITY_THRESH` filtering
- Uses MediaPipe `PoseLandmarker` in `VIDEO` mode with file timestamp

**Landmark map (from landmarks.py LM dict):**
- 33 pose landmarks (0-32): nose, ears, shoulders, elbows, wrists, hips, knees, ankles, heels, feet
- 21 hand landmarks per hand (defined but not used — require separate Hands model)
- `SKELETON_CONNECTIONS`: 32 pairs for drawing

---

## D3. gemini.py call site

**Where called:** `exercise_runner.py` line 507-508, after camera loop ends:
```python
if session_log:
    prompt = build_gemini_prompt_generic(definition, session_log, rep_count, clean_reps)
    show_report_window(prompt)
```

**Prompt / Report format (for Group I template reuse):**

The `build_gemini_prompt_generic` produces a prompt with:

1. **SESSION DATA:**
   - Exercise name + description
   - Total reps, Clean reps, Failed reps, Clean rate %
   - Error frequency table (count × error description)
   - Rep-by-rep breakdown: `Rep NN: CLEAN/FAIL | best angle XX° | errors: ...`

2. **ERRORS THIS SYSTEM DETECTS FOR THIS EXERCISE:**
   - Numbered list from `definition.gemini_errors`

3. **REPORT STRUCTURE (exact 4 sections required):**
   ```
   ## Overall Performance
   One short paragraph on how the session went. Be honest but encouraging.

   ## Main Issues (prioritised)
   Top 1-3 most frequent or impactful errors. For each:
   - Name it clearly
   - Explain what is physically happening and why it matters biomechanically
   - Give 2-3 specific, actionable cues or drills to fix it

   ## What You Did Well
   Acknowledge positives: consistency, errors that didn't appear, improvement across the set.

   ## Focus for Next Session
   One clear, simple priority for next time.
   ```

**Constraints:** Professional but warm tone, no asterisks (plain text), <400 words.

**Where report is saved/displayed:** Currently rendered in a **scrollable OpenCV window** (`show_report_window`) — not saved to file. No `reports/` folder exists. The new system should persist reports (e.g., to database or file) for frontend retrieval.

---

## D4. exercise_base.py + exercises/

**Class structure (reused in Group F):**

### `JointCheck` (dataclass)
| Field | Type | Description |
|-------|------|-------------|
| display_name | str | HUD label (e.g., "Knee (L)") |
| landmark_a | str | Proximal landmark (from LM keys) |
| landmark_b | str | **Vertex** landmark (joint center) |
| landmark_c | str | Distal landmark |
| min_angle | float | Alert if angle < this (0 = disabled) |
| optimal_angle | float | Target marker on depth bar |
| max_angle | float | Alert if angle > this (180 = disabled) |
| alert_too_low | str | Message when below min_angle |
| alert_too_high | str | Message when above max_angle |
| check_in_views | list[str] | ["FRONT"], ["SIDE"], or both |
| use_3d | bool | True = angle_3d (side), False = angle_2d (front) |
| is_rep_driver | bool | True = drives rep state machine |
| driver_for_views | list[str] | Which views this joint drives reps for |

### `RepTrigger` (dataclass) — for dynamic exercises
| Field | Type | Description |
|-------|------|-------------|
| joint_display_name | str | Must match a JointCheck with is_rep_driver=True |
| enter_angle | float | Cross this to start rep (DOWN) |
| exit_angle | float | Cross this to end rep (UP) |
| depth_target | float | Min angle required during DOWN (0 = no check) |
| depth_alert | str | Message if depth not reached |
| direction | str | "decrease" (flexion) or "increase" (extension) |

### `IsometricTrigger` (dataclass) — for hold exercises
| Field | Type | Description |
|-------|------|-------------|
| joint_display_name | str | Must match a JointCheck display_name |
| hold_min_angle | float | Lower bound of hold zone |
| hold_max_angle | float | Upper bound of hold zone |
| hold_duration_secs | float | Target hold time (progress bar goal) |
| alert_not_in_pos | str | Shown when outside hold zone |
| alert_break | str | Shown when exiting hold zone mid-hold |

### `ExerciseDefinition` (dataclass)
| Field | Type | Description |
|-------|------|-------------|
| name | str | Display name |
| description | str | One sentence for Gemini context |
| joint_checks | list[JointCheck] | Angle-based rules |
| rep_trigger | RepTrigger \| None | None for isometric |
| valid_views | list[str] | ["FRONT"], ["SIDE"], or both |
| extra_checks | list[Callable] | Custom checks: `fn(lms, pts, w, h, stage) -> str\|None` |
| gemini_errors | list[str] | Error descriptions for Gemini (auto-built if empty) |
| isometric_trigger | IsometricTrigger \| None | For isometric exercises |

**Three existing exercises:**

1. **squat.py** (dynamic, FRONT+SIDE):
   - 3 JointChecks: Knee(L) 2D front driver, Knee(R) 2D front display, Knee(side) 3D side driver
   - RepTrigger: enter=105°, exit=155°, depth_target=120°, direction="decrease"
   - 7 extra_checks: knee_cave, torso_lean_front, torso_lean_side, knee_past_toes, heel_lift, butt_wink, neck
   - 7 gemini_errors with biomechanical descriptions

2. **seated_leg_extensions.py** (isometric, SIDE only):
   - 1 JointCheck: Knee(L) 2D, min=120°, max=180°, optimal=150°
   - IsometricTrigger: hold 120-180° for 10s
   - gemini_errors: empty (will be auto-populated from joint_checks)

3. **isometric_quadriceps.py** (isometric, SIDE only):
   - 1 JointCheck: Knee(L) 2D, min=130°, max=170°, optimal=150°
   - IsometricTrigger: hold 130-170° for 10s
   - gemini_errors: empty (auto-populated)

---

## D5. posture_checks.py + math_utils.py

**Angle/Distance calculations (Group E must reuse exact formulas):**

### `math_utils.py`
1. **`angle_2d(a, b, c)`** — 2D pixel angle at B
   ```python
   ba, bc = a - b, c - b
   cos = dot(ba, bc) / (||ba|| * ||bc||)
   return degrees(arccos(clip(cos, -1, 1)))
   ```

2. **`angle_3d(a, b, c)`** — 3D normalized angle at B (MediaPipe landmarks with x,y,z)
   - Same formula as 2D but using landmark `.x, .y, .z`

3. **`torso_lean(sh_px, hip_px)`** — Lean from vertical (degrees)
   ```python
   dx = sh.x - hip.x
   dy = hip.y - sh.y  # positive down
   return degrees(arctan2(abs(dx), dy))
   ```

4. **`detect_view(lms)`** — FRONT vs SIDE
   ```python
   z_diff = abs(left_shoulder.z - right_shoulder.z)
   return "SIDE" if z_diff > 0.12 else "FRONT"
   ```

5. **`build_pts(lms, w, h)`** — Projects visible landmarks to pixels with EMA smoothing
   - Filters by `VISIBILITY_THRESH` (0.6)
   - Calls `smooth_landmark(name, lm)` for each
   - Returns `{name: (int(x*w), int(y*h))}`

### `posture_checks.py` — Higher-level checks (return alert string + metric):

1. **`check_posture_front(lms, pts, w)`** → (alerts, lean, kl, kr)
   - Knee valgus: `knee_width < ankle_width * KNEE_CAVE_RATIO (0.72)`
   - Torso lean: `torso_lean(mid_shoulder, mid_hip) > BACK_LEAN_MAX (55°)`

2. **`check_posture_side(lms, pts, w)`** → (alerts, lean, kl, kr)
   - Knee past toes: `abs(knee_x - ankle_x) / w > KNEE_TOE_X_RATIO (0.06)`
   - Torso lean: same as front but single-side shoulder/hip

3. **`check_heel_lift(lms, heel_baseline)`** → (alert, max_rise)
   - `heel_baseline` captured at UP→DOWN transition
   - `max(left_rise, right_rise) > HEEL_LIFT_NORM_THRESH (0.03)`

4. **`check_neck(lms, view)`** → (alert, neck_angle)
   - SIDE: `angle_3d(ear, shoulder, hip)` on camera-facing side
   - FRONT: average of left + right 3D angles
   - Alert if `< NECK_ANGLE_MIN (140°)`

5. **`check_butt_wink(lms, avg_knee_angle)`** → (alert, hip_angle)
   - Only if `avg_knee_angle ≤ BUTT_WINK_KNEE_ANGLE_MAX (115°)`
   - `angle_3d(shoulder, hip, knee) < BUTT_WINK_HIP_ANGLE_MIN (58°)`

**Config thresholds (from config.py):**
- `BACK_LEAN_MAX = 55`
- `KNEE_CAVE_RATIO = 0.72`
- `KNEE_TOE_X_RATIO = 0.06`
- `HEEL_LIFT_NORM_THRESH = 0.03`
- `BUTT_WINK_HIP_ANGLE_MIN = 58`
- `BUTT_WINK_KNEE_ANGLE_MAX = 115`
- `NECK_ANGLE_MIN = 140`
- `EMA_ALPHA = 0.25`
- `VISIBILITY_THRESH = 0.6`

---

## D6. voice.py

**How it decides which mp3 to play:**

`AUDIO_MAP` dict maps **exact alert strings** → audio file paths:

| Alert String | Audio File |
|--------------|------------|
| "Knees caving in — push knees out" | audio/knees_caving.mp3 |
| "Leaning too far forward — chest up" | audio/lean_forward.mp3 |
| "Knee past toes — sit back more" | audio/knee_past_toes.mp3 |
| "Not deep enough" | audio/not_deep.mp3 |
| "Heels lifting — press heels down" | audio/heels_lifting.mp3 |
| "Lower back rounding — brace your core" | audio/butt_wink.mp3 |
| "Neck not neutral — look straight ahead" | audio/neck_neutral.mp3 |

**Logic in `speak(text)`:**
1. Checks `_tts_available` (true if any audio file exists)
2. Cooldown: `TTS_COOLDOWN = 4.0` seconds per unique alert text
3. Looks up `text` in `AUDIO_MAP` → gets file path
4. Finds player: `ffplay` > `mpg123` > `mpv` > `aplay`
5. Spawns daemon thread to play via subprocess

**For Group G WS flag reuse:**
- The **alert string itself is the key** — same strings used in `JointCheck.alert_too_low/high`, `extra_checks` returns, `IsometricTrigger.alert_not_in_pos/break`, `RepTrigger.depth_alert`
- New system should send WS message: `{"type": "voice_alert", "code": "<exact_alert_string>"}` instead of (or alongside) playing local audio
- Frontend receives code, maps to its own audio assets or TTS

**Also note:** `AUDIO_PHRASES` provides short TTS fallback phrases (not currently used since mp3 files exist).

---

## Summary for Downstream Agents

| Agent | Key Inputs from This Doc |
|-------|--------------------------|
| **ml-training-agent** (Group E) | Exact angle formulas (angle_2d, angle_3d, torso_lean, detect_view), all posture check thresholds, EMA smoothing (α=0.25), visibility threshold (0.6), landmark indices — offline features must match live |
| **realtime-agent** (Group G) | Per-frame call order (D1), ExerciseDefinition structure (D4), rep/isometric state machines, extra_checks pattern, Gemini prompt builder interface |
| **frontend-agent** (Group J) | Drawing.py HUD spec (colors, layout, metrics), skeleton connections, voice alert codes mapping, Gemini report structure (4 sections) |
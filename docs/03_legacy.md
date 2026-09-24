# 03 — Legacy Inspection (`backend/_old_physio_reference/`)

**STATUS: FROZEN.** This file is the sole output of Phase D. It is read by
`ml-pipeline-agent`, `realtime-agent` (live path / Group G+H), and
`frontend-agent`. Do not edit it outside a deliberate Phase-D re-run; if you
are a downstream agent and think something here is wrong, do not edit this
file — raise it back, or note the conflict in your own output.

Every code block below is **quoted verbatim from the legacy source**, not
reconstructed from memory. File paths are absolute under
`/home/billa-dakait/Desktop/final_project/backend/_old_physio_reference/`.

Prior-pass hints consulted and checked against source:
`notes/group-D-tasks.md`, `backend/_old_physio_reference/CLAUDE.md`,
`backend/_old_physio_reference/file_descriptions.md`. Disagreements are in
§ Discrepancies at the bottom — the code always won.

---

## D1 (admin.py)

**What it is.** A standalone interactive CLI (`python admin.py`), never
imported by the runtime path (`main.py` / `exercise_runner.py` do not import
it, except that `main.py`'s menu can `os.execv` into it when the user picks
"Add new exercise"). It:

- Runs a manual question/answer wizard, or an AI-assisted wizard that calls
  a **local Ollama** server (`config.OLLAMA_URL`, `config.OLLAMA_MODEL =
  "gemma3:4b"`) with a large prompt (`build_extraction_prompt`) instructing
  the model to emit a JSON `ExerciseDefinition` (joint checks, rep/isometric
  trigger, gemini_errors) from a free-text description.
- Renders that JSON into a new `exercises/<slug>.py` source file
  (`generate_exercise_file` / `generate_isometric_file`) using Python
  f-string templating — i.e. it code-gens a new Python module per exercise.
- Also supports list/read/delete of existing exercise files (not fully read
  — see below, out of scope beyond confirming purpose).

**Port or drop.** This is dev-only authoring tooling, not part of the live
or offline runtime path. **Recommend: drop.** The new system's exercise
config is data (Phase F: `exercise_config.py` registry + `thresholds` from
the user), not AI-generated Python source, and Ollama is an unrelated local
LLM dependency not mentioned anywhere else in the master plan. Nothing else
imports `admin.py`. Per instructions, **not deleted** — left in place for a
human to confirm.

One thing worth carrying forward conceptually (not code): the JSON schema
`admin.py` asks the AI to produce is effectively a serialization of
`ExerciseDefinition` (D8) — useful as a sanity check that the dataclass
fields in `exercise_base.py` are the complete/canonical set, since this
schema was hand-written independently of it and matches it field-for-field.

---

## D2 (drawing.py) — for JS reimplementation in `render/skeleton.js`

Confirmed: pure `cv2` overlay drawing, local-display only, no state, no
returns consumed elsewhere. Two entry groups: skeleton, and HUD (two HUD
variants exist — `draw_hud` squat-specific/unused-by-runner, and
`draw_hud_generic` which `exercise_runner.py` actually calls via its own
inlined `_draw_hud` — see note below).

### Colour palette — exact source, BGR (OpenCV convention)

```python
C = {
    "green":  (0, 220, 100),
    "red":    (30, 60, 240),
    "yellow": (0, 200, 255),
    "white":  (240, 240, 240),
    "accent": (0, 165, 255),
    "dim":    (100, 100, 130),
    "panel":  (12, 12, 22),
    "shadow": (15, 15, 15),
}
```
For a JS/canvas port, convert BGR→RGB by reversing each tuple, e.g.
`green` BGR (0,220,100) → RGB `rgb(100,220,0)`.

### `draw_skeleton(frame, pts, color)`

```python
def draw_skeleton(frame, pts: dict, color: tuple):
    for a, b in SKELETON_CONNECTIONS:
        if a in pts and b in pts:
            cv2.line(frame, pts[a], pts[b], C["shadow"], 5, cv2.LINE_AA)
            cv2.line(frame, pts[a], pts[b], color,       3, cv2.LINE_AA)
    for pt in pts.values():
        cv2.circle(frame, pt, 7, C["shadow"], -1)
        cv2.circle(frame, pt, 6, color,       -1)
        cv2.circle(frame, pt, 8, C["white"],   1)
```
- Lines: shadow pass first, 5px thick, colour `shadow` (15,15,15 BGR ≈ near-black);
  then colour pass, 3px thick, colour = the single `color` arg (green or red,
  decided by caller — see D3 call order).
- `SKELETON_CONNECTIONS` (from `landmarks.py`, 21 active pairs — hand
  connections are commented out / disabled in source, do not port them):
  ```
  left_ear-left_shoulder, right_ear-right_shoulder,
  left_shoulder-right_shoulder, left_shoulder-left_elbow, right_shoulder-right_elbow,
  left_elbow-left_wrist, right_elbow-right_wrist,
  left_shoulder-left_hip, right_shoulder-right_hip, left_hip-right_hip,
  left_hip-left_knee, right_hip-right_knee, left_knee-left_ankle, right_knee-right_ankle,
  left_ankle-left_heel, right_ankle-right_heel, left_heel-left_foot, right_heel-right_foot
  ```
- Joints: circle radius 7 shadow (filled) → radius 6 colour (filled) → radius
  8 white (240,240,240 BGR), 1px stroke (outline only). Drawn for every point
  in `pts` (i.e. every landmark that passed `VISIBILITY_THRESH` — see D4/D5),
  not just connected ones.
- **Colour selection rule** (from `exercise_runner.py` line ~448, not
  `drawing.py` itself): `skel_color = C["red"] if alerts else C["green"]` —
  i.e. the *entire* skeleton turns red if **any** alert is active that frame,
  not per-limb. There is no per-region colour logic in this codebase; a
  region-specific highlight (e.g. only the offending knee turns red) would be
  a **new** feature, not a port.
- Additionally, per joint that has an active `JointCheck`, the runner draws
  the live angle value as text at that joint's vertex point, offset
  `(pt[0]+10, pt[1]-10)`, `cv2.FONT_HERSHEY_SIMPLEX`, scale 0.5, colour =
  `skel_color` (same red/green as skeleton), thickness 1, `cv2.LINE_AA`.

### HUD — which variant is actually live

`exercise_runner.py` does **not** call either `draw_hud` or
`draw_hud_generic` from `drawing.py`. It defines and calls its own
**`_draw_hud(frame, definition, state, fps)`** (exercise_runner.py lines
70–204), which is a near-duplicate of `draw_hud_generic` but branches on
`is_iso = definition.isometric_trigger is not None` to switch between
rep-counter and hold-timer layouts. `drawing.draw_hud` /
`drawing.draw_hud_generic` appear to be dead code (superseded, never
imported by `exercise_runner.py` — confirmed: the runner's only import from
`drawing` is `draw_skeleton, C`). **Treat `exercise_runner._draw_hud` as the
canonical HUD spec for the JS port.**

### HUD spec (from `exercise_runner._draw_hud`), all pixel coords at 1x (HUD assumes a specific frame size; treat as relative/scalable in the port)

- **Panel**: rectangle `(0,0)`–`(300, h)`, colour `panel` (12,12,22),
  composited via `cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)` —
  i.e. 65% opaque dark panel over the camera feed, left-hand side, full
  height, 300px wide.
- **Title**: `definition.name.upper()[:20]` at (12,30), `FONT_HERSHEY_DUPLEX`
  0.65, colour `accent` (0,165,255 BGR = orange).
- **View badge**: `"[{view} VIEW]"` at (12,50), `FONT_HERSHEY_SIMPLEX` 0.38,
  colour `dim`.
- **Divider line**: (12,58)-(288,58), colour `accent`, 1px.
- **Counters** (branch on `is_iso`):
  - Isometric: "HOLD TIME" label (12,85) colour = green if `in_position`
    else yellow; big value `f"{hold_secs:.1f}s"` at (12,135)
    `FONT_HERSHEY_DUPLEX` scale 2.4, same colour, thickness 2. "SETS" label
    (170,85) green; value `str(sets_done)` at (170,135) scale 3.0 green.
  - Dynamic: "TOTAL" (12,85) white; value at (12,135) scale 3.0 white.
    "CLEAN" (160,85) green; value at (160,135) scale 3.0 green.
- **Stage/position badge**: filled rectangle (12,145)-(288,165). Isometric:
  green if `in_position` else yellow, text `"  IN POSITION  "` /
  `"  GET IN POSITION  "`. Dynamic: green if `stage=="UP"` else yellow, text
  `f"  STAGE: {stage}  "`. Text colour is `panel` (dark) drawn on top of the
  coloured badge, at (14,160), `FONT_HERSHEY_SIMPLEX` 0.42.
- **Last rep result** (dynamic only, not shown for isometric): at (12,182)
  — `"CLEAN REP"` green if `rep_was_clean is True`; `f"BAD: {reason[:22]}"`
  red if `rep_was_clean is False`; nothing if `None` (no rep completed yet).
- **Divider** (12,192)-(288,192), colour (40,40,60).
- **Live joint angles**: up to first 6 entries of `joint_angles` dict, one
  line each starting y=210, +19px per line: `f"{name}: {int(angle)}"`,
  `FONT_HERSHEY_SIMPLEX` 0.38, colour (190,190,210). Then `f"FPS: {fps:.0f}"`
  on the next line at the same style.
- **Progress bar** ("DEPTH" label for dynamic, "HOLD PROGRESS" for
  isometric): track rect 200x10px, background (40,40,60). Fill ratio:
  - Isometric: `ratio = min(1, hold_secs / max(iso.hold_duration_secs, 1))`,
    `target_ratio = 1.0`.
  - Dynamic: `angle_high = max(enter,exit)+20`, `angle_low =
    max(0, min(enter,exit)-20)`, `span = max(1, angle_high-angle_low)`;
    if `direction=="decrease"`: `ratio = clip((angle_high - driver_angle)/span,
    0,1)`, else `ratio = clip((driver_angle-angle_low)/span, 0,1)`;
    `target_ratio = (angle_high - DEPTH_INSUFFICIENT_ANGLE) / span` (uses the
    **global** `config.DEPTH_INSUFFICIENT_ANGLE = 120`, not any
    per-exercise value — see Open Questions, this is squat-specific and
    hardcoded even in the "generic" HUD).
  - Fill colour: green if `ratio >= target_ratio * 0.85` else yellow. A
    white 1px vertical tick marks the target position.
- **Alerts section**: divider, then if `alerts` non-empty: red `"! ALERTS"`
  header (0.5 scale), then up to 4 alert strings word-wrapped to ≤28 chars
  per line (manual greedy wrap, not textwrap), red, 0.36 scale, 16px line
  spacing within an alert / 20px gap between alerts. If no alerts: green
  `"POSTURE OK"` at 0.55 scale.
- **Footer hint**: `"Q = quit   R = reset"` (or "R = reset hold" for
  isometric), colour `dim`, bottom-left, 0.35 scale.

---

## D3 (exercise_runner.py) — the camera loop

**Loop type.** Single-threaded, **blocking** `cv2.VideoCapture` loop
(`while cap.isOpened(): ret, frame = cap.read()` ...). No threads, no
asyncio, no queue. This entire loop must be replicated as the state machine
inside the frontend pose worker (G5) — the WS live-loop is not a Python
process replicating this loop; it is the browser doing so in JS.

**Per-frame call order** (`run_exercise`, lines ~290–498), as an explicit
numbered sequence:

1. `cap.read()` → `ret, frame`. If `not ret`, increment
   `consecutive_failures`; break after 30 consecutive failures (camera
   disconnect); else `continue` (skip the rest of the loop body this
   iteration).
2. `cv2.flip(frame, 1)` — mirror horizontally.
3. Compute `det_w, det_h = w*DETECTION_SCALE, h*DETECTION_SCALE`
   (`DETECTION_SCALE = 0.9` in config), `cv2.resize(frame, (det_w, det_h))`.
4. `cv2.cvtColor(small, cv2.COLOR_BGR2RGB)`.
5. `mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)` →
   `landmarker.detect_for_video(mp_img, int(time.time()*1000))`. Note: the
   timestamp passed is **wall-clock `time.time()*1000`**, not a frame
   counter or monotonic clock — worth flagging for the offline port (D4/E1),
   which processes a file and must supply monotonically increasing
   timestamps derived from the video's own frame times, not wall clock.
6. If `result.pose_landmarks` is non-empty:
   a. `lms = result.pose_landmarks[0]` (single-person, `num_poses=1`).
   b. `pts = build_pts(lms, w, h)` (`math_utils.py` — EMA-smooths **all 33**
      landmarks that pass `VISIBILITY_THRESH`, then projects to full-res
      pixel coords `(int(x*w), int(y*h))`; smoothing happens on
      **normalized coordinates**, before pixel projection — see D4/D5 for
      exact order caveats).
   c. `view = detect_view(lms)` (`math_utils.py`, uses **raw** `lms`, not
      `pts` — i.e. view detection uses the unsmoothed z-depth of the raw
      MediaPipe landmarks, not the EMA-smoothed pts dict).
   d. If `view in definition.valid_views`:
      i. `alerts, joint_angles, driver_angle = _run_joint_checks(definition,
         lms, pts, w, view)` — iterates `definition.joint_checks`; for each
         whose `check_in_views` includes `view`: compute angle via
         `_compute_joint_angle` (→ `angle_3d(lms[...])` if `use_3d` else
         `angle_2d(pts[...])`, returns `None` on missing landmark/exception);
         record into `joint_angles[display_name]`; if `is_rep_driver` and
         `view in driver_for_views`, set `driver_angle`; append
         `alert_too_low` if `angle < min_angle`, **elif**
         `alert_too_high` if `angle > max_angle` (mutually exclusive per
         joint check, `elif` not `if`).
      ii. Else (`view not in valid_views`): `alerts = []` (no checks run,
          not even extra_checks — this branch skips step iii/e/f entirely
          this frame for the alerting side, though the state machines below
          still run using whatever `driver_angle`/`joint_angles` were left
          over from before, since they are not reset here — worth flagging,
          see Open Questions).
      iii. **Only inside the `if view in valid_views` branch** — for each
           `fn in definition.extra_checks`: `a = fn(lms, pts, w, h, stage)`;
           if truthy, `alerts.append(a)`. Order is **list order in the
           exercise's `extra_checks=[...]`** — for `squat.py` that is:
           `check_knee_cave, check_torso_lean_front, check_torso_lean_side,
           check_knee_past_toes, check_heel_lift, check_butt_wink,
           check_neck` (each function internally no-ops via `detect_view()
           != "FRONT"/"SIDE"` guards rather than the outer `check_in_views`
           mechanism — extra_checks are **not** filtered by view before
           being called; each check does its own view check via
           `detect_view(lms)`, called again fresh inside each function,
           independently of the `view` variable computed in step (c)).
      e. **Isometric state machine** (only if `definition.isometric_trigger
         is not None`):
         - Find `iso_angle` = `joint_angles.get(iso.joint_display_name, 0.0)`
           by scanning `definition.joint_checks` for the matching
           `display_name`.
         - `in_position = hold_min_angle <= iso_angle <= hold_max_angle and
           iso_angle > 0`.
         - If `in_position`: if just entered (`not prev_in_pos`),
           `hold_start = time.time(); hold_secs = 0.0`; else
           `hold_secs = time.time() - hold_start`. If `alerts`,
           `speak(alerts[0])` (**note**: alerts here come only from
           `_run_joint_checks` + `extra_checks` above — for both existing
           isometric exercises `extra_checks=[]`, and the sole `JointCheck`
           feeding `iso_angle` has empty `alert_too_low`/`alert_too_high` by
           default unless set — `seated_leg_extensions.py` and
           `isometric_quadriceps.py` **do** set `alert_too_low`/
           `alert_too_high` on their JointCheck to `'Too flexed'`/`'Not bent
           enough'`, so those alerts *can* fire while in-position at the
           zone edges). If `hold_secs >= hold_duration_secs`: increment
           `rep_count` (used as "sets" for isometric), reset
           `hold_secs=0, hold_start=time.time()`, append to `session_log`.
         - Else (out of zone): if was previously in position and
           `hold_secs > 0.5`, `speak(iso.alert_not_in_pos)` (**note**: this
           is `alert_not_in_pos`, not `alert_break`, despite the docstring
           in `exercise_base.py` implying `alert_break` fires on exiting a
           hold — `alert_break` is defined on `IsometricTrigger` but **is
           never referenced anywhere in `exercise_runner.py`**; it is dead
           data). Reset `hold_secs=0, hold_start=None`. If `not alerts and
           iso_angle > 0`: `alerts = [iso.alert_not_in_pos]` (so the HUD/
           voice shows this as the sole "alert" for the frame).
         - `prev_in_pos = in_position`.
      f. **Dynamic state machine** (only if `rep_trigger is not None`):
         - `stage=="UP"` → check entry: `driver_angle < enter_angle`
           (decrease dir) or `driver_angle > enter_angle` (increase dir),
           **and** `driver_angle > 0`. On entry: `stage="DOWN"`, reset
           `rep_had_error=False, rep_fail_reason="", rep_errors=[]`,
           `best_driver_angle = driver_angle`.
         - While `stage=="DOWN"`: update
           `best_driver_angle = min(best_driver_angle, driver_angle)`
           (decrease dir) or `max(...)` (increase dir). If `alerts`:
           `speak(alerts[0])` (**only the first alert of the frame is
           spoken**, cooldown-gated inside `voice.speak`); append any new
           alert strings (dedup) to `rep_errors`; if this is the rep's first
           error, `rep_had_error=True, rep_fail_reason=alerts[0]` (i.e.
           **the first-ever alert of the rep becomes the recorded failure
           reason**, even if a different alert fires more often later in
           the same rep).
         - `stage=="DOWN"` → check exit: `driver_angle > exit_angle`
           (decrease dir) or `driver_angle < exit_angle` (increase dir). On
           exit: `stage="UP"`, `rep_count += 1`. If `depth_target > 0`:
           compute `depth_ok` (decrease: `best_driver_angle <=
           depth_target`; increase: `best_driver_angle >= depth_target`); if
           not ok and `not rep_had_error` (i.e. depth failure only recorded
           as *the* failure reason if no other error already claimed that
           slot), set `rep_had_error=True, rep_fail_reason=depth_alert`,
           append to `rep_errors`, `speak(depth_alert)`. Then
           `rep_was_clean = not rep_had_error`; increment `clean_reps` if
           clean; append `{rep, errors: list(rep_errors), best_angle:
           int(best_driver_angle), clean: rep_was_clean}` to `session_log`.
   e/f are mutually exclusive per exercise (an `ExerciseDefinition` has
   either `rep_trigger` or `isometric_trigger` set, never both, enforced by
   convention not by code).
7. Skeleton overlay: `skel_color = red if alerts else green`;
   `draw_skeleton(frame, pts, skel_color)`.
8. For each `jc` in `joint_checks` with a value in `joint_angles` and vertex
   in `pts`: draw the int angle as text at `(pt[0]+10, pt[1]-10)` in
   `skel_color`.
9. (If `result.pose_landmarks` was empty this frame: `alerts = []`, skip 6–8
   entirely — no skeleton drawn, no checks run, and note the dynamic/
   isometric state machines above are **not** advanced at all on a
   pose-miss frame; `driver_angle`/`joint_angles` simply retain their prior
   frame's values for the HUD display only, since `alerts` is force-reset to
   `[]` here.)
10. FPS: `fps = 1.0 / (now - prev_time + 1e-6)`.
11. Build a `state` dict (rep_count, clean_reps, stage, alerts,
    joint_angles, driver_angle, rep_was_clean, rep_fail_reason, view,
    hold_secs, in_position) and call `_draw_hud(frame, definition, state,
    fps)` (see D2).
12. `cv2.imshow`, `cv2.waitKey(1)`. `q` → break main loop. `r` → full reset
    of both dynamic and isometric state **and** `reset_smoother()` (clears
    the EMA state in `smoother.py` — see D4).
13. After loop exit: `cap.release()`, `cv2.destroyAllWindows()`,
    `landmarker.close()`.
14. If `session_log` non-empty: build prompt via
    `build_gemini_prompt_generic(definition, session_log, rep_count,
    clean_reps)` and call `show_report_window(prompt)` (see D7). If empty,
    skip — no Gemini call, no report.

**Stateful things that persist across frames** (must be reproduced by the
new WS/worker state machine):
- `rep_count`, `clean_reps`, `stage` ("UP"/"DOWN"), `rep_had_error`,
  `rep_fail_reason`, `rep_was_clean`, `best_driver_angle`, `rep_errors`
  (list, deduped per rep), `session_log` (list, one entry per completed
  rep/set).
- Isometric: `hold_start` (wall-clock `time.time()` timestamp or `None`),
  `hold_secs`, `in_position`, `prev_in_pos`.
- Per-exercise **module-level globals inside `extra_checks` functions**
  themselves — e.g. `squat.py`'s `check_heel_lift` keeps `_heel_baseline`
  and `_prev_stage` as **module-level mutable globals**, not passed through
  the engine's `state` dict at all. This is a hidden state channel outside
  `exercise_runner.py`'s own state — the JS port must give each
  extra-check its own persistent closure state, keyed per session, not a
  Python-style module global (which in the browser would leak across
  sessions/users).
- `smoother.py`'s `_smoothed` dict (EMA state per landmark name) — module
  level global, reset only by explicit `reset_smoother()` call (bound to
  the `r` key). Not reset automatically between reps or on view change.
- FPS `prev_time`.

**Imports used per frame** (confirms prior notes, verified against source):
`landmarks.LM`; `math_utils.build_pts, detect_view, angle_2d, angle_3d`;
`smoother.reset_smoother` (only on `r` key, not per-frame — `smooth_landmark`
itself is called indirectly via `build_pts`); `voice.speak`;
`drawing.draw_skeleton, C`; `gemini.build_gemini_prompt_generic,
show_report_window` (only at loop end, not per-frame); plus each exercise's
own `extra_checks` callables (squat.py) or none (the two isometric
exercises).

---

## D4 (landmarks.py + smoother.py)

### `landmarks.py`

`LM` dict maps **33 MediaPipe Pose landmark names → indices 0–32** (nose,
ears, shoulders, elbows, wrists, hips, knees, ankles, heels, feet — verified
against source, exact indices quoted above are correct per prior notes).

Also contains a **21-point hand landmark name→index map** (`left_wrist_hand`
… `right_pinky_tip`, indices 0–20) — but these indices **collide** with the
pose indices 0–20 (e.g. `"nose": 0` and `"left_wrist_hand": 0` are both
key `0` in the same flat dict, differentiated only by name, not namespace).
**These hand entries are never populated in practice** — nothing in the
codebase runs a MediaPipe Hands model, and `SKELETON_CONNECTIONS` has all
hand connections **commented out** in source. Do not port hand tracking;
it's declared but dead.

`SKELETON_CONNECTIONS`: 18 active pairs (not 32 as prior notes claimed —
counted directly from the uncommented list, quoted in full under D2 above).
The commented-out block below it has ~36 more hand-related pairs, disabled.

### `smoother.py` — exact algorithm

```python
def smooth_landmark(name: str, lm) -> tuple:
    new = [lm.x, lm.y, lm.z]
    if name not in _smoothed:
        _smoothed[name] = new[:]
    else:
        s = _smoothed[name]
        _smoothed[name] = [
            EMA_ALPHA * n + (1.0 - EMA_ALPHA) * s[i]
            for i, n in enumerate(new)
        ]
    return tuple(_smoothed[name])
```

This is a **plain per-coordinate exponential moving average (EMA)**, *not*
a One-Euro filter. (The master plan §3.3/§G3 says "smoothing (One-Euro
filter)" and "port D4's smoother.py (One-Euro)" — **that is aspirational
language in the plan, not what the legacy code does.** The legacy smoother
has no velocity/adaptive-cutoff behaviour at all. See Discrepancies.)

- **Tuning constant**: single scalar `EMA_ALPHA = 0.25` (config.py). No
  `beta`, `min_cutoff`, `d_cutoff` — none of the One-Euro parameters exist
  in this codebase.
- **`dt`**: not used. The EMA is a fixed-weight blend per call, independent
  of elapsed wall time between frames — i.e. effectively assumes a constant
  frame rate. No timestamp is read inside `smooth_landmark`.
- **Coordinates smoothed**: `lm.x, lm.y, lm.z` — MediaPipe's **normalized
  landmark coordinates** (x,y in [0,1] relative to image, z relative depth,
  roughly comparable in scale to x). **Not** pixel coordinates, **not**
  MediaPipe "world landmarks" (a separate output MediaPipe can produce in
  metric units — this codebase does not use world landmarks anywhere).
- **Seeding**: first call for a given landmark name seeds `_smoothed[name]`
  with the raw value directly (no lag spike on first frame / first
  appearance after being occluded then reappearing — visibility-filtered
  landmarks that disappear and reappear get a fresh, un-lagged seed each
  time they cross back above `VISIBILITY_THRESH`, since `build_pts` simply
  skips calling `smooth_landmark` for low-visibility frames rather than
  feeding a zero/stale value in).
- **State**: single flat module-level dict `_smoothed: dict[str, list]`,
  keyed by landmark **name string**, shared across the whole process — i.e.
  not session-scoped, not person-scoped. `reset_smoother()` clears it
  entirely; called only on the `r` (reset) keypress in `exercise_runner.py`.
- **Order relative to angle math** (critical per master plan precision
  requirement): smoothing happens **before** any angle computation.
  `build_pts()` (math_utils.py) calls `smooth_landmark(name, lm)` while
  building the pixel-coordinate dict, and `angle_2d` is then called on
  those already-smoothed, already-projected pixel points. **However**,
  `angle_3d` is called directly on **raw, unsmoothed** `lms[idx]` objects
  (the MediaPipe result landmarks) in `_compute_joint_angle`,
  `posture_checks.py`, and every `extra_checks` function in `squat.py` —
  i.e. **all SIDE-view (3D) angle math in this codebase runs on unsmoothed
  input**, while all FRONT-view (2D) angle math runs on EMA-smoothed pixel
  points. This asymmetry is a precise, must-replicate detail: a JS port
  that smooths uniformly before all angle math would disagree with the
  legacy 3D angles and therefore with any threshold tuned against them.

### For the offline (Heavy, D-derived Python) port

`smooth_landmark`/`build_pts` assume a live per-frame call cadence with no
`dt` correction — reapplying this identically frame-by-frame in file order
(not by inferring real elapsed time) is what "applied the same way it's
applied live" means for E1; do **not** introduce a time-aware smoothing
model there, since that would no longer match the live JS port's (equally
time-naive) EMA.

---

## D5 (math_utils.py + posture_checks.py) — HIGHEST STAKES, quoted in full

All source quoted exactly. Axis convention throughout: MediaPipe image
coordinates, **x right, y down** (0=top of image, 1=bottom), z is
MediaPipe's relative depth (negative = closer to camera, roughly same
scale as x/y, origin at the hip midpoint per MediaPipe's definition — not
independently verified in this codebase, just consumed as-is).

### `math_utils.angle_2d(a, b, c) -> float`

```python
def angle_2d(a, b, c) -> float:
    a, b, c = np.array(a[:2], float), np.array(b[:2], float), np.array(c[:2], float)
    ba, bc  = a - b, c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
```
- Params `a, b, c`: indexable objects with at least 2 elements (used with
  `pts[name]` = `(int_x, int_y)` pixel tuples in this codebase).
- Angle at vertex `b`, via `arccos` of the normalized dot product of vectors
  `b→a` and `b→c`. **Not** `atan2`. Denominator has a `+1e-6` epsilon guard
  (prevents div-by-zero for coincident points, not a rounding safeguard).
  `cos` is clamped to `[-1, 1]` before `arccos` (guards float error pushing
  slightly outside the domain). Result via `np.degrees` — **degrees**,
  range `[0, 180]`.
- Uses only the first two elements of each input (`a[:2]`) — safe to pass a
  3-tuple, z is ignored.
- Called with **pixel-coordinate** `(x,y)` tuples from `pts` in this
  codebase — i.e. angle is computed in screen/pixel space, aspect-ratio
  dependent (not normalized-square space). A JS port operating on
  normalized [0,1] coordinates instead of pixel coordinates will produce a
  **different** angle whenever the video aspect ratio isn't square, because
  `angle_2d` does not correct for aspect ratio — this must be replicated
  exactly (project to actual pixel dimensions before calling) or the JS and
  Python angles will disagree.

### `math_utils.angle_3d(a, b, c) -> float`

```python
def angle_3d(a, b, c) -> float:
    av  = np.array([a.x, a.y, a.z])
    bv  = np.array([b.x, b.y, b.z])
    cv_ = np.array([c.x, c.y, c.z])
    ba, bc = av - bv, cv_ - bv
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return float(np.degrees(np.arccos(np.clip(cos, -1.0, 1.0))))
```
- Params `a, b, c`: **MediaPipe landmark objects** with `.x .y .z`
  attributes (normalized coordinates), **not** pixel tuples — different
  input type from `angle_2d`. Called in this codebase as, e.g.,
  `angle_3d(lms[LM["left_hip"]], lms[LM["left_knee"]], lms[LM["left_ankle"]])`
  — always on **raw** `lms[idx]` objects, never on smoothed/projected `pts`
  (confirmed: no call site anywhere passes `pts[...]` into `angle_3d`).
- Identical formula to `angle_2d` (arccos of normalized dot product,
  epsilon-guarded denominator, clamp to [-1,1], degrees, [0,180] range) but
  in 3D normalized landmark space, no pixel projection.

### `math_utils.torso_lean(sh_px, hip_px) -> float`

```python
def torso_lean(sh_px, hip_px) -> float:
    dx = sh_px[0] - hip_px[0]
    dy = max(hip_px[1] - sh_px[1], 1)
    return float(np.degrees(np.arctan2(abs(dx), dy)))
```
- Params: pixel `(x,y)` tuples for shoulder and hip (either the midpoint of
  L/R in front view, or the single camera-facing shoulder/hip in side
  view — decided by the caller, not this function).
- `dx = shoulder.x - hip.x`; `dy = max(hip.y - shoulder.y, 1)` — note the
  `max(..., 1)` floor is **not** a small epsilon like `angle_2d`'s `1e-6`;
  it is a full pixel, meaning `torso_lean` is only numerically stable to
  within ~1px of vertical alignment and will read a nonzero-but-bounded
  angle even for a perfectly upright, perfectly-aligned torso if `dy` would
  otherwise be 0 or negative (e.g. hip below shoulder in y, which is the
  normal standing case, so this mostly guards against a degenerate
  inverted pose). **Prior notes stated `dy = hip.y - sh.y` without the
  floor — that omission matters for edge cases and is corrected here.**
- `arctan2(|dx|, dy)` — note **`atan2` here, unlike the arccos-based angle
  functions above** — degrees, unsigned (uses `abs(dx)`, so lean direction
  left vs right is not distinguished, only magnitude from vertical).
- Called with pixel-space points built by `build_pts` (i.e. EMA-smoothed,
  as established in D4).

### `math_utils.detect_view(lms) -> str`

```python
def detect_view(lms) -> str:
    z_diff = abs(lms[LM["left_shoulder"]].z - lms[LM["right_shoulder"]].z)
    return "SIDE" if z_diff > 0.12 else "FRONT"
```
- Threshold **`0.12`** is hardcoded inline in `math_utils.py` — **not** in
  `config.py`, unlike every other threshold in this codebase. Flag for
  Group F/config-loader: this constant currently has no home in the
  centralized config and must be deliberately added if it needs to be
  tunable.
- Operates on **raw** `lms` (unsmoothed), z-component only.

### `math_utils.build_pts(lms, w, h) -> dict`

```python
def build_pts(lms, w: int, h: int) -> dict:
    pts = {}
    for name, idx in LM.items():
        lm = lms[idx]
        if lm.visibility < VISIBILITY_THRESH:
            continue
        sx, sy, _ = smooth_landmark(name, lm)
        pts[name] = (int(sx * w), int(sy * h))
    return pts
```
- Iterates the **entire `LM` dict**, including the (dead/unused, colliding)
  hand-landmark names — meaning `smooth_landmark` is in fact called with
  duplicate keys pointing at the same underlying pose indices 0–20 for both
  the pose names (`nose`, `left_ear`, etc.) and the hand names
  (`left_wrist_hand`, etc.) each frame, silently overwriting each other in
  `_smoothed` and in the returned `pts` dict (last write in dict iteration
  order wins for any given index value, though since keys differ by name
  both survive as separate dict entries containing the *same* underlying
  pose landmark's smoothed value, mislabeled as hand landmarks). This is
  inert (nothing consumes the hand-named keys) but wastes ~20 redundant
  smoothing calls a frame; not worth porting either the waste or the
  confusion — the JS port should only smooth/project the 33 real pose
  landmarks.
- Filters by `visibility < VISIBILITY_THRESH` (`0.6`, config.py) — landmark
  is **excluded entirely** from `pts` if below threshold (not clamped, not
  interpolated).
- `int(sx*w), int(sy*h)` — truncating cast to int (not round) when
  projecting normalized-smoothed coords to pixel space.

### `posture_checks.py` functions — signatures, formulas, thresholds, sources

All thresholds below are imported from `config.py` (confirmed by the
`from config import (...)` line at the top of `posture_checks.py`); none
are hardcoded inline in this file (contrast with `detect_view`'s `0.12`
above, and with `squat.py`'s duplicated copy of the same constants — see
Discrepancies).

1. **`check_posture_front(lms, pts: dict, w: int) -> (alerts: list, lean:
   float, kl: float, kr: float)`**
   - Requires `{left_hip, left_knee, left_ankle, right_hip, right_knee,
     right_ankle, left_shoulder, right_shoulder}` all present in `pts`;
     returns `([], 0.0, 0.0, 0.0)` early otherwise.
   - `kl = angle_2d(pts.left_hip, pts.left_knee, pts.left_ankle)`,
     `kr` symmetric — pixel-space 2D knee angles.
   - Knee cave: `knee_w = |knee_L.x - knee_R.x|`, `ankle_w = |ankle_L.x -
     ankle_R.x|`; if `ankle_w > 10 and knee_w < ankle_w * KNEE_CAVE_RATIO`
     (`KNEE_CAVE_RATIO = 0.72`) → alert `"Knees caving in — push knees out"`.
     The `ankle_w > 10` guard is a **pixel-count** floor (not normalized),
     avoiding division-adjacent false positives when ankles are too close
     together in the frame to measure meaningfully.
   - Torso lean: midpoint of L/R shoulder pixel points vs midpoint of L/R
     hip pixel points (integer-averaged via `//2`), fed into `torso_lean`;
     if `lean > BACK_LEAN_MAX` (`55`) → alert `"Leaning too far forward —
     chest up"`.

2. **`check_posture_side(lms, pts, w) -> (alerts, lean, kl, kr)`**
   - `use_left = lms[left_shoulder].z < lms[right_shoulder].z` (camera-
     facing side has the smaller/more-negative z, i.e. closer to camera);
     `s = "left" if use_left else "right"`.
   - Requires `{s_hip, s_knee, s_ankle, s_shoulder}` in `pts`, else early
     return of zeros.
   - `k = angle_3d(lms[s_hip], lms[s_knee], lms[s_ankle])` — **3D**, raw
     landmarks (not `pts`). `kl = kr = k` (both returned equal; side view
     only measures one leg).
   - Knee-past-toes: `knee_toe_x = (pts[s_knee].x - pts[s_ankle].x) / w`
     (signed, normalized by frame width); if `|knee_toe_x| >
     KNEE_TOE_X_RATIO` (`0.06`) → alert `"Knee past toes — sit back more"`.
   - Torso lean: `torso_lean(pts[s_shoulder], pts[s_hip])`; same
     `BACK_LEAN_MAX` threshold/alert as front.

3. **`check_heel_lift(lms, heel_baseline: dict | None) -> (alert, max_rise:
   float)`**
   - **This exact function signature is never called anywhere in the
     runtime path.** `posture_checks.check_heel_lift(lms, heel_baseline)`
     exists in the file but `squat.py` defines and uses its **own**
     separate `check_heel_lift(lms, pts, w, h, stage)` (different
     signature, self-contained module-level baseline state — see D3) as its
     `extra_checks` entry. The `posture_checks.py` version appears to be an
     earlier/alternate implementation, superseded but not deleted. Formula
     for reference (same numeric behaviour, different state management):
     `left_rise = baseline.left - lms[left_heel].y`, `right_rise =
     baseline.right - lms[right_heel].y` (y decreasing = rising, since
     y=0 is image top), `max_rise = max(left_rise, right_rise)`; alert if
     `> HEEL_LIFT_NORM_THRESH` (`0.03`, normalized units).
   - **Port from `squat.py`'s version**, since that is what actually runs;
     it is numerically identical (same threshold, same sign convention)
     but keyed on the `stage` state machine transition (UP→DOWN) to capture
     baseline, rather than an externally-managed `heel_baseline` argument.

4. **`check_neck(lms, view: str) -> (alert, neck_angle: float)`**
   - SIDE: `s` = camera-facing side (same z-comparison rule as above);
     `na = angle_3d(lms[s_ear], lms[s_shoulder], lms[s_hip])`.
   - FRONT: average of left and right `angle_3d(ear, shoulder, hip)`.
   - Wrapped in `try/except Exception: return None, 180.0` — any missing
     landmark/attribute error silently returns "no alert, neutral angle".
   - Alert `"Neck not neutral — look straight ahead"` if `na <
     NECK_ANGLE_MIN` (`140`).
   - Numerically identical to `squat.py`'s own `check_neck` extra_check
     (which is the one actually wired into the live loop for the Squat
     exercise) — this one in `posture_checks.py` is unused dead code for
     the same reason as #3, but the formula matches, confirmed by direct
     comparison.

5. **`check_butt_wink(lms, avg_knee_angle: float) -> (alert, hip_angle:
   float)`**
   - Guard: if `avg_knee_angle > BUTT_WINK_KNEE_ANGLE_MAX` (`115`) → return
     `(None, 180.0)` (only checked deep in the squat).
   - `s` = camera-facing side; `hip_angle = angle_3d(lms[s_shoulder],
     lms[s_hip], lms[s_knee])`.
   - Alert `"Lower back rounding — brace your core"` if `hip_angle <
     BUTT_WINK_HIP_ANGLE_MIN` (`58`).
   - Again unused directly (`squat.py` has its own `check_butt_wink` extra
     check with an added `try/except` and re-computing its own
     `knee_angle` internally via `angle_3d(hip,knee,ankle)` rather than
     receiving `avg_knee_angle` as a parameter) — formula and thresholds
     match; the live-running version is `squat.py`'s.

**Net finding for D5**: `posture_checks.py` is effectively a **reference
implementation that is not wired into the runtime**. The actual live
checks for Squat all live as standalone functions **inside `squat.py`**
itself (`check_heel_lift`, `check_knee_cave`, `check_torso_lean_front`,
`check_torso_lean_side`, `check_knee_past_toes`, `check_butt_wink`,
`check_neck`), passed via `extra_checks=[...]`. They are formula-identical
to `posture_checks.py` where both exist, but **`squat.py`'s versions are
the ones Group E/G must port**, since those are what a running session
actually evaluates. Config constant values (from `config.py`, also
re-declared verbatim as module-level constants at the top of `squat.py` —
see Discrepancies) used by `squat.py`'s checks:

| Constant | Value | Defined in | Used by |
|---|---|---|---|
| `BACK_LEAN_MAX` | 55° | config.py (+ re-declared in squat.py) | torso lean front/side |
| `KNEE_CAVE_RATIO` | 0.72 | config.py (+ squat.py) | knee cave (front) |
| `KNEE_TOE_X_RATIO` | 0.06 | config.py (+ squat.py) | knee past toes (side) |
| `HEEL_LIFT_NORM_THRESH` | 0.03 | config.py (+ squat.py) | heel lift |
| `BUTT_WINK_HIP_ANGLE_MIN` | 58° | config.py (+ squat.py) | butt wink |
| `BUTT_WINK_KNEE_ANGLE_MAX` | 115° | config.py (+ squat.py) | butt wink guard |
| `NECK_ANGLE_MIN` | 140° | config.py (+ squat.py) | neck |
| `SQUAT_DOWN_ANGLE` (enter_angle) | 105° | config.py (+ inlined literal `105.0` in squat.py's `RepTrigger`) | rep state machine |
| `SQUAT_UP_ANGLE` (exit_angle) | 155° | config.py (+ inlined `155.0`) | rep state machine |
| `DEPTH_INSUFFICIENT_ANGLE` (depth_target) | 120° | config.py (+ inlined `120.0` in squat.py, **and** imported directly by `exercise_runner.py`/`drawing.py` for the HUD progress-bar target) | rep depth check + HUD bar |
| `EMA_ALPHA` | 0.25 | config.py only | smoother.py |
| `VISIBILITY_THRESH` | 0.6 | config.py only | build_pts |
| view-detect z threshold | 0.12 | **hardcoded inline in math_utils.py only, not in config.py** | detect_view |

---

## D6 (voice.py) — error-code → mp3 mapping

### `AUDIO_MAP` (verbatim from source)

```python
AUDIO_MAP = {
    "Knees caving in — push knees out":       f"{AUDIO_DIR}/knees_caving.mp3",
    "Leaning too far forward — chest up":     f"{AUDIO_DIR}/lean_forward.mp3",
    "Knee past toes — sit back more":         f"{AUDIO_DIR}/knee_past_toes.mp3",
    "Not deep enough":                        f"{AUDIO_DIR}/not_deep.mp3",
    "Heels lifting — press heels down":       f"{AUDIO_DIR}/heels_lifting.mp3",
    "Lower back rounding — brace your core":  f"{AUDIO_DIR}/butt_wink.mp3",
    "Neck not neutral — look straight ahead": f"{AUDIO_DIR}/neck_neutral.mp3",
}
```
(`AUDIO_DIR = "audio"`)

### Cross-check against actual `audio/` directory contents

```
audio/butt_wink.mp3
audio/caving.mp3
audio/chest_up.mp3
audio/heel_lifting.mp3
audio/neck_neutral.mp3
audio/not_deep.mp3
audio/toes.mp3
```

| Alert string (dict key) | `AUDIO_MAP` target filename | Exists on disk? |
|---|---|---|
| "Knees caving in — push knees out" | `knees_caving.mp3` | **NO** — closest existing file is `caving.mp3` |
| "Leaning too far forward — chest up" | `lean_forward.mp3` | **NO** — closest existing file is `chest_up.mp3` |
| "Knee past toes — sit back more" | `knee_past_toes.mp3` | **NO** — closest existing file is `toes.mp3` |
| "Not deep enough" | `not_deep.mp3` | **YES** |
| "Heels lifting — press heels down" | `heels_lifting.mp3` | **NO** — closest existing file is `heel_lifting.mp3` |
| "Lower back rounding — brace your core" | `butt_wink.mp3` | **YES** |
| "Neck not neutral — look straight ahead" | `neck_neutral.mp3` | **YES** |

**4 of 7 mappings point at files that do not exist.** `speak()` silently
no-ops when `os.path.exists(path)` is false (`if not path or not
os.path.exists(path): return`) — so in the legacy app today, 4 of the 7
squat alert types **never actually play audio**, silently, with no error
logged. This is a real, verified bug in the legacy system, not a
transcription error on this pass — confirmed by listing the directory
directly. **All 7 audio files that exist on disk are used by nothing else**
(no mapping points at `caving.mp3`, `chest_up.mp3`, or `toes.mp3` under
their actual names) — i.e. there is no orphaned audio file; every file on
disk is "the thing a mapping meant to reference," just under a different
name than the mapping uses.

**For Group G**: use the **alert string as the WS/error code** (unchanged),
per the master plan's decision to key on the same strings used elsewhere
(`JointCheck.alert_too_low/high`, `extra_checks` returns,
`IsometricTrigger.alert_not_in_pos`, `RepTrigger.depth_alert`). When
sourcing/renaming frontend audio assets, a human must decide whether to (a)
rename the 4 mismatched files to match `AUDIO_MAP`'s intended names, or (b)
fix `AUDIO_MAP` to point at the files that actually exist
(`caving.mp3`/`chest_up.mp3`/`toes.mp3`/`heel_lifting.mp3`). Either is a
one-line-per-entry fix; not made here per "no implementation" scope — see
Open Questions.

### `speak(text)` logic (verbatim, summarized)

1. No-op if `_tts_available` is `False` (set by `init_tts()`, true only if
   at least one `AUDIO_MAP` **target** path exists on disk — since 4 of 7
   don't, but 3 do, `_tts_available` is `True` in practice).
2. Cooldown: `TTS_COOLDOWN = 4.0` seconds (config.py) per unique alert
   **text** (dict keyed by the literal string, `_last_spoken[text]`).
3. Looks up `AUDIO_MAP.get(text)`; no-op if missing or file doesn't exist
   (silent, no log — see bug above).
4. Player selection, first found wins, cached process-wide in
   `_player_cmd`: `ffplay > mpg123 > mpv > aplay` (via `shutil.which`).
5. Spawns a **daemon thread** running `subprocess.Popen([...player, path],
   stdout=DEVNULL, stderr=DEVNULL)` — fire-and-forget, no join, no queue
   (multiple overlapping alerts within the cooldown window for *different*
   alert strings can play simultaneously/overlap; there is no single-voice
   mutex).

`AUDIO_PHRASES` dict (short TTS-style phrases per alert) exists but is
**never referenced anywhere** in the codebase outside its own definition —
confirmed dead code, presumably a fallback for a TTS engine that was never
wired up (ElevenLabs config keys `XI_KEY`/`VOICE_ID` exist in config.py but
are never imported/used by `voice.py` either — same category of unused
scaffolding).

---

## D7 (gemini.py) — report output format, not the API call

**Call site**: `exercise_runner.py`, end of `run_exercise()`, after the
camera loop breaks and cleanup runs:
```python
if session_log:
    prompt = build_gemini_prompt_generic(definition, session_log, rep_count, clean_reps)
    show_report_window(prompt)
```
Only fires if at least one rep/set was completed (`session_log`
non-empty). No call at all if the session ends with zero completed
reps/sets.

**Prompt structure** built by `build_gemini_prompt_generic` (the version
actually used — `build_gemini_prompt` is an older squat-only variant, still
present, still correct, but not called by `exercise_runner.py`; both share
the same report-structure text verbatim):

1. Framing line: `"You are an expert physiotherapy coach and movement
   specialist. A patient just completed a {definition.name} session..."`
   plus `definition.description`.
2. `SESSION DATA` block: total reps, clean reps, failed reps (`total -
   clean`), clean rate `%` (`int(clean/total*100)`, 0 if `total==0`).
3. `Error frequency` block: counts per distinct alert string across all
   reps in `session_log`, sorted descending by count, `"  Nx  <error
   text>"` lines; `"  None detected."` if all zero. Counts are seeded from
   `definition.gemini_errors` keys first (so zero-count known errors don't
   silently vanish from the count dict, though they're filtered out of the
   printed lines by `if count > 0` anyway) and any error string not in that
   seed set still gets counted via `error_counts.get(err,0)+1` fallback.
4. `Rep-by-rep breakdown`: one line per `session_log` entry —
   `"  Rep NN: CLEAN/FAIL | best angle XX° | errors: a, b, c"` (or `"errors:
   none"`).
5. `ERRORS THIS SYSTEM DETECTS FOR THIS EXERCISE`: numbered list from
   `definition.gemini_errors` (auto-populated by
   `ExerciseDefinition.__post_init__` from `joint_checks`/`rep_trigger` if
   the exercise file didn't supply its own — see D8). Falls back to
   `"  (No specific error descriptions provided.)"` if empty.
6. **Fixed 4-section report structure instruction**, verbatim:
   ```
   REPORT STRUCTURE — use EXACTLY these four sections:

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
7. Tone/format constraints, verbatim: `"Tone: professional but warm, like a
   physiotherapist talking to their patient. Do NOT use asterisks. Plain
   text only. Keep the total report under 400 words."`

**Where the report is saved**: **nowhere persistent.** `call_gemini(prompt)`
(Gemini 2.5 Flash Lite REST call, not copied here per instructions) runs in
a background thread; its plain-text result is written into a module-level
`_report_state["text"]` dict and rendered live inside a **scrollable cv2
window** (`show_report_window`, ~900x700px canvas, custom word-wrap,
`##`-prefixed lines rendered as section headers in a different colour,
`ERROR`-prefixed lines in red). **No file is written, no `reports/`
directory exists anywhere in this project, no database.** The report is
lost the moment the cv2 window is closed. Confirmed: no `open(...,'w')` or
similar persistence call anywhere in `gemini.py` or `exercise_runner.py`
relating to the report text. Group I (`report_builder.py`,
`report.save_report`) must build persistence from scratch — there is no
legacy behaviour to preserve here beyond the section structure/wording
style above.

---

## D8 (exercise_base.py + exercises/*.py)

### Class structure (dataclasses, `exercise_base.py`) — verified against source, matches prior notes' field listing. One addition prior notes missed:

`JointCheck` has an additional field beyond the 9 previously noted:
`driver_for_views: list = field(default_factory=lambda: ["FRONT","SIDE"])`
— "If `is_rep_driver=True`, this joint only drives the rep machine when the
current view is in `driver_for_views`. Allows different drivers per view."
(Used by `squat.py`: `"Knee (L)"` drives only in `["FRONT"]`, `"Knee
(side)"` drives only in `["SIDE"]` — this is how Squat has two different
rep-driver joints depending on which way the user is facing, both feeding
the same single `RepTrigger` by `joint_display_name` matching.)

`ExerciseDefinition.__post_init__` **auto-populates `gemini_errors`** from
`joint_checks` (`alert_too_low`/`alert_too_high` → formatted strings with
the threshold value inlined) and from `rep_trigger.depth_alert` (dynamic
only, only if `depth_target > 0`) **whenever `gemini_errors` is left
empty**. Both isometric exercises in this repo (`seated_leg_extensions.py`,
`isometric_quadriceps.py`) leave `gemini_errors=[]` explicitly and rely on
this auto-population.

### Three exercise files present under `exercises/` (verified — only these three `.py` files exist; see Discrepancies for evidence of others that used to exist and were removed)

1. **`squat.py`** — **dynamic**, code confirms via `rep_trigger =
   RepTrigger(...)` being set and `isometric_trigger` omitted (defaults to
   `None`). `valid_views = ["FRONT", "SIDE"]`.
   - 3 `JointCheck`s: `"Knee (L)"` (2D, FRONT-only, driver for FRONT),
     `"Knee (R)"` (2D, FRONT-only, display only, not a driver), `"Knee
     (side)"` (3D, SIDE-only, driver for SIDE). All three have
     `min_angle=0, max_angle=180` (i.e. **the JointCheck-level
     alert_too_low/high mechanism is effectively disabled for all three** —
     0/180 are the documented "disable this side" sentinel values per
     `exercise_base.py`'s own docstring — all of Squat's actual alerting
     comes from `extra_checks`, not `joint_checks` thresholds).
   - `RepTrigger`: `joint_display_name="Knee (L)"`, `enter_angle=105.0`,
     `exit_angle=155.0`, `depth_target=120.0`,
     `depth_alert="Not deep enough"`, `direction="decrease"`. (Note this
     always keys off `"Knee (L)"` by display name even in SIDE view, where
     the actual driving `JointCheck` object is the differently-named `"Knee
     (side)"` — the `RepTrigger.joint_display_name` field is used only to
     validate/label, not to select the driver angle at runtime; the runtime
     driver angle comes from whichever `JointCheck` has `is_rep_driver=True`
     and `view in driver_for_views` for the *current* view, per D3 step
     6.d.i — so this is not a bug, just worth noting the field is
     effectively cosmetic given the `driver_for_views` split.)
   - 7 `extra_checks` (the ones actually live — see D5): `check_knee_cave,
     check_torso_lean_front, check_torso_lean_side, check_knee_past_toes,
     check_heel_lift, check_butt_wink, check_neck`.
   - 7 explicit `gemini_errors` (not auto-populated, since JointCheck alerts
     are disabled — these describe the extra_checks instead).

2. **`seated_leg_extensions.py`** — **isometric**, confirmed:
   `rep_trigger=None`, `isometric_trigger=IsometricTrigger(...)` set.
   `valid_views=["SIDE"]`.
   - 1 `JointCheck`: `"Knee (L)"`, `landmark_a/b/c =
     left_hip/left_knee/left_ankle`, `min_angle=120.0, max_angle=180.0`
     (= `HOLD_MIN`/`HOLD_MAX`), `alert_too_low="Too flexed"`,
     `alert_too_high="Not bent enough"`, `check_in_views=["SIDE"]`,
     `use_3d=False` (2D pixel angle, despite SIDE-only view — **not** using
     `angle_3d` even though this is a side-view exercise; contrast with
     Squat's SIDE driver which does use 3D — an inconsistency in the
     legacy code, not something to "fix" silently when porting, just
     replicate as-is or flag to the user), `is_rep_driver=False` (not
     used as a rep driver since there's no `RepTrigger` for isometrics).
   - `IsometricTrigger`: `hold_min_angle=120.0, hold_max_angle=180.0,
     hold_duration_secs=10` (int, not float, in this file — `HOLD_TARGET =
     10`), `alert_not_in_pos='Bend to (input range) degrees'` — **this is a
     literal unfilled placeholder string left in the source**, containing
     the literal text `"(input range)"` rather than real numbers. This
     looks like an admin.py-AI-generated file where the placeholder was
     never replaced. **Flagged per master-plan constraint "do not invent
     clinical wording" — a human must supply the real phrase (likely `"Bend
     to 120-180 degrees"` given the surrounding pattern in
     `isometric_quadriceps.py`, but that is a guess, not to be assumed).**
     `alert_break="Position lost — return to hold position"` (this field is
     dead code per D3 — never read by `exercise_runner.py`).
   - `gemini_errors=[]` (auto-populated at runtime from the JointCheck +
     no depth_alert since `rep_trigger is None`).

3. **`isometric_quadriceps.py`** — **isometric**, same structure as above.
   `valid_views=["SIDE"]`, single `JointCheck` `"Knee (L)"`,
   `min_angle=130.0, max_angle=170.0` (`HOLD_MIN`/`HOLD_MAX`),
   `alert_too_low='Too flexed'`, `alert_too_high='Not bent enough'`,
   `use_3d=False` (same 2D-despite-SIDE inconsistency as above).
   `IsometricTrigger`: `hold_min_angle=130.0, hold_max_angle=170.0,
   hold_duration_secs=10.0` (float here, unlike the `10` int in
   `seated_leg_extensions.py` — inconsequential type difference, noted for
   completeness), `alert_not_in_pos='Bend to 130-170 degrees'` (this one
   **is** filled in correctly, unlike its sibling file), `alert_break`
   dead code as above. `gemini_errors=[]`, auto-populated.

**Isometric vs dynamic determination — based on code, not filenames**, per
task instructions: an exercise is isometric **iff** `isometric_trigger is
not None` (equivalently, `rep_trigger is None`), read directly from
`exercise_runner.run_exercise`'s `is_iso = definition.isometric_trigger is
not None` line. All three files' actual dataclass construction was
inspected directly (not inferred from filename) and matches what their
names suggest: `squat.py` dynamic, both isometric files isometric.

---

## Discrepancies vs. prior notes / legacy docs

Format: claim → actual source finding.

1. **`notes/group-D-tasks.md` — SKELETON_CONNECTIONS count.** Prior notes
   said "32 connections". Source (`landmarks.py`) has **18 active**
   connections; the remainder of a much longer commented-out block (hand
   connections) is disabled and should not be counted or ported. Corrected
   above under D2.

2. **`notes/group-D-tasks.md` — voice.py AUDIO_MAP filenames.** Prior notes
   listed the mapping using filenames like `audio/knees_caving.mp3`,
   `audio/lean_forward.mp3`, `audio/knee_past_toes.mp3`,
   `audio/heels_lifting.mp3` **as if these files exist**, without
   cross-checking the actual `audio/` directory. They do not exist under
   those names — verified by `ls`. This pass adds the actual directory
   listing and the mismatch table (D6). This is the single highest-impact
   correction in this document: **4 of 7 audio cues are silently broken in
   the legacy app today**, and any port that just copies `AUDIO_MAP`
   verbatim into a frontend asset map will ship the same silent breakage.

3. **`notes/group-D-tasks.md` — torso_lean formula.** Prior notes wrote
   `dy = hip.y - sh.y` (no floor). Actual source has `dy = max(hip_px[1] -
   sh_px[1], 1)` — a 1-pixel floor, not just a raw subtraction. Corrected
   above under D5.

4. **`notes/group-D-tasks.md` — smoother described only as "EMA smoothing
   (α=0.25)" without addressing the One-Euro language elsewhere in the
   plan.** Confirmed: legacy `smoother.py` is EMA only, no One-Euro filter
   exists anywhere in this codebase. The master plan (§3.3, §G3) describes
   the **target** live-worker design as using a One-Euro filter — that is a
   forward-looking design decision by the plan's authors, not a port of
   existing behaviour. Flagging explicitly so `realtime-agent` does not
   go looking for One-Euro logic to "port" — there is none; G3 is new work,
   informed by (but not copying) D4.

5. **`notes/group-D-tasks.md` (D4 section) claims a file
   `backend/ml/extract_landmarks.py` was already "Created" during the prior
   pass**, with specific output schema described. This inspector did not
   verify that file (out of scope — `backend/ml/**` is owned by
   `ml-pipeline-agent`, not this agent) and makes no claim about its
   current existence or correctness. Flagging only that the previous
   Group-D pass over-scoped by writing implementation notes describing a
   file outside `docs/`, which is explicitly disallowed for this phase.

6. **`backend/_old_physio_reference/file_descriptions.md`** references
   `exercises/bicep_curl.py` and
   `exercises/isometric_quadriceps_for_knee_mobility.py` as existing
   exercise files with descriptions. Neither exists in the current
   `exercises/` directory (only `squat.py`, `seated_leg_extensions.py`,
   `isometric_quadriceps.py` exist as `.py` source). However, **compiled
   `.pyc` remnants for `bicep_curl`, `isometric_quadriceps_for_knee_mobility`,
   `seated_knee_extension`, and `seated_leg_extensions12` are still present**
   in `exercises/__pycache__/`, confirming these files existed at some point
   and were deleted, leaving `file_descriptions.md` out of date. This
   matters for `ml-pipeline-agent`: the master plan (§E5) names exercise
   extractors `heel_slide, mini_squat, seated_knee_extension, tke, slr` —
   **none of these five names match any of the three exercise files that
   currently exist in this legacy project** (squat, seated_leg_extensions,
   isometric_quadriceps). The E5 exercise list appears to come from a
   different source (the training/EMG dataset side of the project) than
   this legacy pose-analysis project. This inspector cannot reconcile the
   two exercise-name sets from the files in scope here — flagged as an
   open question below.

7. **`backend/_old_physio_reference/file_descriptions.md`** describes
   `voice.py` as "ElevenLabs API for natural voice synthesis." Actual
   source: `voice.py` plays **local pre-recorded mp3 files** via a
   subprocess player (`ffplay`/`mpg123`/`mpv`/`aplay`); there is no
   ElevenLabs API call anywhere in `voice.py`. `config.py` does define
   `XI_KEY`/`VOICE_ID` (ElevenLabs credentials) but they are unused dead
   config, confirmed by grep-equivalent read of `voice.py`'s imports (only
   `TTS_COOLDOWN` is imported from config). `file_descriptions.md` is
   describing an aspirational/earlier design, not the current code.

8. **`backend/_old_physio_reference/file_descriptions.md`** describes
   `gemini.py` as producing "personalized coaching feedback" without detail
   — not wrong, just far less precise than needed; D7 above supersedes it
   for downstream use.

9. **`notes/group-D-tasks.md` (D6 section)** stated "`AUDIO_PHRASES`
   provides short TTS fallback phrases (**not currently used since mp3
   files exist**)" — this framing implies `AUDIO_PHRASES` is an intentional
   fallback path that simply isn't triggered. Actual source: `voice.py` has
   **no code path that ever reads `AUDIO_PHRASES`** at all, under any
   condition (confirmed by full read of `voice.py`, ~93 lines, entire
   file). It is unconditionally dead code, not a conditional fallback.

---

## Open questions / UNCERTAIN — a human must answer these

1. **voice.py AUDIO_MAP fix direction (D6).** 4 of 7 mp3 mappings are
   broken. Should the audio *files* be renamed to match `AUDIO_MAP`, or
   should the *mapping* be corrected to the files that exist? Either is
   trivial but is a content decision (which filename convention becomes
   canonical for the frontend asset folder), not an inspection finding.

2. **`seated_leg_extensions.py`'s unfilled placeholder alert text (D8).**
   `alert_not_in_pos = 'Bend to (input range) degrees'` is not real patient-
   facing copy — it contains literal placeholder text. Master plan §8
   forbids agents from inventing clinical/correction wording. A human must
   supply the real phrase.

3. **Exercise name mismatch between this legacy project and the ml-training
   plan (Discrepancy #6).** §E5 of the master plan names exercise
   extractors `heel_slide, mini_squat, seated_knee_extension, tke, slr`.
   This legacy pose-analysis project only ever had (per current + `.pyc`
   evidence) `squat`, `seated_leg_extensions`/`seated_leg_extensions12`,
   `isometric_quadriceps`/`isometric_quadriceps_for_knee_mobility`,
   `bicep_curl`, `seated_knee_extension`. There is partial overlap
   (`seated_knee_extension` appears in both, as a deleted `.pyc` here and as
   a named extractor in the plan) but **`mini_squat`, `tke`, and `slr`
   (straight-leg raise) have no corresponding file anywhere in
   `_old_physio_reference/`, ever.** This inspector cannot determine
   whether those come from a separate video dataset/labeling effort
   outside this repo (most likely, given §8's mention of "SLR" as a
   validated dataset) or need new `ExerciseDefinition`s written from
   scratch. Flag to `ml-pipeline-agent` and whoever owns the training
   dataset.

4. **`DEPTH_INSUFFICIENT_ANGLE` hardcoded globally in the "generic" HUD
   (D2).** `exercise_runner._draw_hud`'s progress-bar `target_ratio` for
   dynamic exercises uses `config.DEPTH_INSUFFICIENT_ANGLE` (120, a
   Squat-specific constant) regardless of which exercise is running. For
   Squat this is correct by coincidence (`depth_target` also happens to be
   120), but the HUD bar target would be **wrong** for any other dynamic
   exercise with a different `depth_target`, since the HUD does not read
   `definition.rep_trigger.depth_target` for this calculation. Only one
   dynamic exercise exists today so this was never exposed as a bug. Group
   G/F should decide whether to fix this (use the exercise's own
   `depth_target`) when porting, or intentionally preserve the bug —
   this inspector does not decide behavior, only flags it.

5. **`detect_view`'s `0.12` z-diff threshold (D5) has no config home.**
   Should it be added to the Phase-F per-exercise `thresholds` dict, to a
   global config, or left as a hardcoded constant in `angles.js`? Not this
   agent's call.

6. **Whether `posture_checks.py`'s standalone check functions (D5 items
   3–5) should be ported at all**, given they are confirmed-dead
   duplicates of logic that live more completely inside `squat.py`. This
   inspector recommends **not** porting the `posture_checks.py` versions
   and instead treating `squat.py`'s `extra_checks` as canonical, but
   leaves the final call to `ml-pipeline-agent`/`realtime-agent` since
   they may want the more parameterized signatures (e.g.
   `check_heel_lift(lms, heel_baseline)` taking an explicit baseline
   argument, vs. squat.py's closure-over-module-global version) for a
   stateless offline batch context.

7. **`admin.py`'s Ollama dependency** — confirmed unused by the runtime
   path, but this inspector did not fully read every remaining function in
   `admin.py` (list/read/delete exercise helpers, ~700 total lines, only
   the first ~480 read in full) since those functions are pure CLI
   file-management with no bearing on any downstream agent's work per the
   D1 task scope ("port or drop" — already answered: drop). If a future
   need arises to actually reuse any part of `admin.py`, re-read the file
   fully first.
</content>

---

## Resolutions — human decisions on the open questions above

Answered by the project owner after this file was first written. These
override the "open" status of items 1-6; item 7 remains open. Two legacy
source files were edited as a result (see "Legacy source edits" below) —
the rest are directives for downstream agents.

| # | Question | Decision |
|---|---|---|
| 1 | Audio map fix direction | **Fix the mapping**, keep existing filenames. Done in source. |
| 2 | `seated_leg_extensions` placeholder wording | **Infer from the file's own constants.** Done in source. |
| 3 | Exercise-name mismatch vs plan §E5 | §E5 is a **separate dataset**, unrelated to this legacy project. |
| 4 | HUD `DEPTH_INSUFFICIENT_ANGLE` bug | **Fix on port.** Do not preserve the bug. |
| 5 | `detect_view` 0.12 threshold home | **Global config constant**, mirrored to JS. Rationale below. |
| 6 | Port `posture_checks.py`? | **No — defer.** `squat.py` `extra_checks` is canonical. |
| 7 | `admin.py` partial read | Still open. Re-read fully only if `admin.py` is ever reused. |

### 1. Audio mapping — RESOLVED, source edited

`AUDIO_MAP` in `voice.py` was corrected to point at the filenames that
actually exist. The **files on disk are canonical**; the map was wrong.

| Alert key | Was (missing) | Now (exists) |
|---|---|---|
| `Knees caving in — push knees out` | `knees_caving.mp3` | `caving.mp3` |
| `Leaning too far forward — chest up` | `lean_forward.mp3` | `chest_up.mp3` |
| `Knee past toes — sit back more` | `knee_past_toes.mp3` | `toes.mp3` |
| `Heels lifting — press heels down` | `heels_lifting.mp3` | `heel_lifting.mp3` |

The other three entries (`not_deep.mp3`, `butt_wink.mp3`,
`neck_neutral.mp3`) were already correct and were not touched.

Verified after the edit by importing `voice` and checking every path:
7/7 entries resolve to an existing file, 0 mp3s in `audio/` are unused,
and every `AUDIO_MAP` key has a matching `AUDIO_PHRASES` entry.

**Directive for G8 (live-frontend-agent).** These seven filenames are the
canonical asset names. Copy `audio/*.mp3` to
`frontend/src/assets/audio/` under exactly these names and key the
client-side cue lookup on the same alert strings.

**Note the masking bug, do not reproduce it.** `voice.py:48` gates TTS
availability on `any(os.path.exists(p) for p in AUDIO_MAP.values())` — a
single surviving file made the app print "TTS ready" while four cues
silently no-opped. That is how this went unnoticed. The JS port should
report each missing asset individually rather than collapsing to one
boolean.

### 2. `seated_leg_extensions` alert wording — RESOLVED, source edited

The placeholder was AI-generated, not clinician-authored, so §8's
"do not invent clinical wording" constraint does not bite here: the range
is recoverable from the file itself rather than invented.

`HOLD_MIN = 120.0` and `HOLD_MAX = 180.0` are defined at the top of
`exercises/seated_leg_extensions.py` and already drive the `JointCheck`
bounds and the `IsometricTrigger` hold window. The alert text now derives
from those same constants instead of restating them:

```python
alert_not_in_pos   = f'Bend to {HOLD_MIN:.0f}-{HOLD_MAX:.0f} degrees',
```

Renders as `Bend to 120-180 degrees`. Deriving rather than hardcoding
means the string cannot drift if the range is retuned later.

`alert_break` was left as-is — it was already real copy, and D3 established
it is dead data never referenced by `exercise_runner.py`.

### 3. Exercise-name mismatch — RESOLVED

Plan §E5's extractors (`heel_slide`, `mini_squat`, `seated_knee_extension`,
`tke`, `slr`) come from a **separate video dataset**, not from this legacy
project. The two exercise sets are independent and should not be
reconciled.

- `seated_knee_extension` overlaps by name only. Treat it as belonging to
  the **new plan's dataset**, not as a legacy port target.
- `mini_squat`, `tke`, `slr`, `heel_slide` have no legacy counterpart and
  need no legacy archaeology.

**Directive for ml-pipeline-agent (Phase E).** Build the §E5 extractors
against the training dataset. Do not look for their definitions in
`_old_physio_reference/`; they were never there.

**Directive for backend-core-agent (Phase F).** Port these two legacy
exercises into `backend/app/exercises/`, preserving the class structure per
F1:

- `seated_knee_extension` (SKE)
- `seated_leg_extensions` (SLE)

Both are SIDE-view isometric holds driven by `IsometricTrigger`. Note that
only `seated_leg_extensions.py` survives as source in this project; the
SKE variants exist solely as deleted-file `.pyc` remnants (see
Discrepancies), so SKE's definition has to be reconstructed rather than
copied. Thresholds for the reconstruction come from the user (F4), not
from an agent.

### 4. HUD `DEPTH_INSUFFICIENT_ANGLE` — RESOLVED: fix on port

`exercise_runner._draw_hud` computes the dynamic progress-bar
`target_ratio` from the global `config.DEPTH_INSUFFICIENT_ANGLE` (120,
a Squat-specific constant) rather than from the running exercise's own
`definition.rep_trigger.depth_target`. It is correct for Squat only by
coincidence.

**Directive for G7 (`render/skeleton.js`).** Read the target from the
exercise definition. Do not carry the global constant across. Any future
dynamic exercise with a different `depth_target` would otherwise render a
progress bar that disagrees with the rep logic driving it.

### 5. `detect_view` 0.12 z-diff threshold — RESOLVED: global config

Decided on best-practice grounds rather than by the owner, who deferred the
call. Recorded here so the reasoning is auditable and reversible.

**Decision: a single global config constant, mirrored to JS — not a
per-exercise `thresholds` entry.**

Reasoning:

1. **It is not a clinical value.** §8 reserves user ownership for
   thresholds, error definitions, severity formulas and correction
   wording. `detect_view`'s 0.12 is none of those — it is a
   camera-geometry heuristic deciding whether the subject reads as FRONT
   or SIDE from raw landmark z-spread. It describes the *camera*, not the
   patient or the exercise. Putting it in the per-exercise clinical
   thresholds dict would mix two kinds of number that have different
   owners and different review paths.
2. **It is genuinely global.** Every exercise calls the same
   `detect_view`. Per-exercise copies would be identical values duplicated
   N times — divergence waiting to happen, with no scenario where
   divergence is correct.
3. **Parity demands one source.** Phase G's gate is 6-decimal agreement
   between JS and Python. `detect_view` gates *which* angle function runs
   (`angle_2d` on smoothed pixels vs `angle_3d` on raw landmarks — see
   D4/D5), so a mismatched threshold does not shift a number slightly, it
   selects a different code path and the outputs stop being comparable at
   all. One definition, mirrored, is the only safe arrangement.

**Implementation, following the §8b.8 B8 pattern already established for
the event vocabulary:** define it once in the backend config and mirror it
to a JS constants file, exactly as `backend/app/events.py` mirrors to
`frontend/src/lib/events.js`. `angles.js` imports the constant; it does not
redeclare the literal. If the two ever need to differ, that is a finding to
surface, not a value to quietly fork.

### 6. `posture_checks.py` — RESOLVED: do not port, deferred

`squat.py`'s `extra_checks` remain canonical, per this file's D5 finding
that `posture_checks.py` is confirmed dead code (zero imports anywhere in
the legacy project; the only textual references are a comment in
`gemini.py` and its own header).

**Do not port `posture_checks.py` in Phase G.** Port `squat.py`'s
`extra_checks` functions instead.

**Kept on the table for Phase E, deliberately.** The `posture_checks.py`
variants have more parameterized signatures — e.g.
`check_heel_lift(lms, heel_baseline)` takes the baseline as an explicit
argument, where `squat.py`'s equivalent closes over a module-global that is
mutated across frames. For the **offline batch** context (E4/E5), where
each clip must be processed independently and reproducibly, an explicit-
argument signature is the better shape: module-global state across clips in
a `ProcessPoolExecutor` is a correctness hazard, not just a style
preference.

So: live path ports `squat.py`. If the offline path wants the stateless
signatures, `posture_checks.py` is where to look — but the *formulas* must
match whichever version the live path uses, or D5's core warning ("same
formula both sides or live and offline disagree") is violated.

`posture_checks.py` therefore stays on disk until Phase E has made this
call. It must not be deleted with the rest of `_old_physio_reference/` at
the end of Phase D — extract it first if the legacy tree is removed.

### Legacy source edits made under these resolutions

Phase D's D1 says "record, delete nothing", and this file was otherwise
documentation-only. Two exceptions were made on the owner's explicit
instruction, both narrow, both verified:

| File | Change | Why |
|---|---|---|
| `voice.py` | 4 `AUDIO_MAP` values repointed to existing filenames | Resolution 1 |
| `exercises/seated_leg_extensions.py` | `alert_not_in_pos` derives from `HOLD_MIN`/`HOLD_MAX` | Resolution 2 |

Nothing was deleted. No other legacy file was modified.

These edits matter beyond tidiness because **Phase 0's baseline measurement
runs this legacy app** — a baseline taken with four silently-dead audio
cues would not be measuring the same system the port is compared against.

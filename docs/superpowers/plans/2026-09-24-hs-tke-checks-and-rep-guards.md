# HS/TKE Live Checks + Rep Misfire Guards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Every task below is ONE file, ONE fresh subagent, never reused. The orchestrator pastes the task's **Agent prompt** block verbatim. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give heel_slide and terminal_knee_extension their own live check files, and stop the live path from counting reps while the patient is still (smoother driver angle, stricter MediaPipe, rep guards).

**Architecture:** Signal-processing knobs move into one new frontend file (`live_tuning.js`, the equivalent of legacy `config.py`). `PoseEngine` gets a timestamp, a visibility check on 3D joints, a One-Euro filter on the driver angle, and three rep guards (hold frames, minimum rep time, minimum movement). HS and TKE get their own check modules, registered through the existing `checks/index.js` merge. Clinical numbers stay in `exercises.json`. The painted skeleton gets its own One-Euro smoother. Rule math keeps EMA 0.25, and the 6-decimal angle parity is untouched.

**Tech Stack:** Vanilla ES modules (browser + Web Worker), `node:test` (no framework), MediaPipe Tasks Vision (vendored, Lite model, CPU), Python 3 backend (config loader + event mirror).

**Spec:** the grill-me decisions of 2026-09-24 (this conversation). They are summarized in "Locked decisions" below, and each executor gets the relevant ones inside its prompt.

## Locked decisions (the spec)

| # | Decision |
|---|---|
| D1 | `checks/heel_slide.js` has ONE check, `slide_insufficient`. `heel_lifting` and `hip_lifting` stay in `shared.js` and stay in HS `extra_checks`. |
| D2 | `slide_insufficient`: during DOWN, track the lowest driver (knee) angle and the smallest hip→heel distance. Judge ONCE, when the knee has come back ≥ `slide_insufficient_return_deg` (15) from its lowest point. Fire if lowest knee > `rep_trigger.depth_target` (90) OR heel travel < `slide_insufficient_min_heel_travel_ratio` (0.25). Heel travel = (rest distance − smallest distance) / rest distance, where rest distance = largest hip→heel pixel distance seen during the preceding UP stage. Once fired, it keeps returning the alert for the rest of that DOWN stage. It uses the LEFT leg only. It does NOT use any rep-end hook and imports nothing from shared.js. |
| D3 | HS rep trigger unchanged: `decrease`, enter 150, exit 170, depth 90. No per-leg tracking. No ankle check. |
| D4 | TKE rep trigger becomes: `increase`, enter **155**, exit **145**, depth **170**. The patient lies on their back with a pillow under the knee (rest knee ≈140°). |
| D5 | `checks/terminal_knee_extension.js` has ONE check, `thigh_lifting`: left shoulder-hip-knee 2D angle, measured at the moment DOWN starts. Fires if it changes by more than `thigh_lifting_max_hip_change_deg` (**20**) during DOWN. `hip_lifting` stays in TKE `extra_checks`. |
| D6 | Driver angle gets One-Euro filtering (`minCutoff 0.1, beta 0.02, dCutoff 1.0`). Units: degrees. Used for rep counting only. |
| D7 | Painted skeleton gets its own One-Euro (`minCutoff 0.1, beta 5, dCutoff 1.0`), in normalized coordinates. Display only. Rule math keeps EMA α 0.25. |
| D8 | Rep guards (all exercises): `holdFrames 5` (the angle must stay past enter for 5 frames in a row before DOWN starts, and past exit for 5 frames before UP), `minRepS 1.0` (time from first enter-crossing to first exit-crossing), `minRomDeg 10` (best angle must pass enter by ≥10°). A rejected rep is not counted and not flagged, and is logged as the `rep_rejected` event. |
| D9 | MediaPipe `minPoseDetectionConfidence`, `minPosePresenceConfidence` and `minTrackingConfidence` all = **0.8**. |
| D10 | 3D joint angles return `null` when any of the three landmarks has visibility < `VISIBILITY_THRESH` (0.6). |
| D11 | All knobs in D6-D9 live in the new file `frontend/src/lib/live_tuning.js`. Clinical numbers stay in `backend/app/config/exercises.json`. |
| D12 | Scope: guards, angle filter and 3D visibility check apply to all 6 exercises, at engine level, with no exercise-name branch. |

## Global Constraints

- Every code-writing subagent MUST call the Skill tool with `skill: "ponytail:ponytail"`, `args: "ultra"` before writing any code.
- One file per subagent. A subagent may READ other files but must EDIT only its assigned file.
- No git commits, no `git stash`, no `git checkout`, no `git reset`. The working tree has a lot of unrelated uncommitted work that must not be touched.
- No new dependencies. No new files except the ones named in this plan.
- Never coerce a `null` threshold to 0 (see `rules.js` `thresholdValue`). A check with a missing input returns `null`.
- Checks must never throw on missing `pts` keys or an undefined `driverAngle` (the test "every check tolerates landmarks missing from pts" enforces this).
- Match surrounding style: 2-space indent, double quotes, JSDoc header per file, and a `ponytail:` comment on any deliberate shortcut that has a known limit.
- The Agent tool cannot set reasoning effort per call. "Medium effort" is stated inside each prompt instead.

## Review Focus

1. **Patient lying still (rest jitter ±3°)** → zero reps, zero alerts. Pinned in Task A7, test "jitter spikes never start a rep".
2. **A real HS rep with no pause at the bottom** → counted. One-Euro lag is ≤4.4° at the bottom, per the offline simulation (scratchpad `oe.mjs`: `mc=0.1 b=0.02 down=1.5s hold=0s → min 94.4 vs true 90`). The HS knee-depth branch may flag a borderline-deep rep as short. Pinned in A8 ("good rep → no alert").
3. **Pillow of a different size on TKE** (rest hip angle 120 instead of 140) → `thigh_lifting` does not fire. Pinned in A8 ("per-rep baseline").
4. **Landmark dropout on a 3D driver joint** → angle `null`, the rep machine does not advance and does not reset. Pinned in A7 ("low-visibility 3D joint yields null driver angle").
5. **Callers that pass no timestamp** (existing tests/selfcheck) → the engine uses a synthetic 10fps clock and still counts reps. Pinned in A7 ("no tMs → synthetic clock still counts").

## Execution waves

| Wave | Tasks (parallel inside a wave) | Depends on |
|---|---|---|
| 1 | A1, A2, A3, A4, A5, A6, A7, A8 | — |
| 2 | A9, A10, A11 | A1, A2, A5 |
| 3 | A12, A13, A14 | A9, A10, A11 |
| 4 | A15 (verify: run only, no edits). For each failing file, spawn a NEW fix agent for that file only, pasting the failure output | all |
| 5 | A16 (read-only review of the full diff against this plan) | A15 green |

Model assignment: **haiku** for mechanical or single-line edits. **sonnet** for the engine, the HS check, the worker, the guard tests and the final review. Nothing uses opus.

---

### Task A1: `frontend/src/lib/live_tuning.js` (create) — haiku

**Files:** Create `frontend/src/lib/live_tuning.js`
**Produces:** `ANGLE_FILTER`, `DISPLAY_FILTER`, `REP_GUARDS`, `MP_CONFIDENCE` (named exports)

- [ ] Spawn a fresh agent (model: haiku) with this prompt:

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: CREATE exactly one new file: frontend/src/lib/live_tuning.js. Edit nothing else.
Do not run git commit/stash/checkout/reset — the tree has unrelated uncommitted work.

It is the live path's single tuning file (the equivalent of legacy
backend/_old_physio_reference/config.py): signal-processing knobs only.
Clinical thresholds stay in backend/app/config/exercises.json.

Write exactly this content:

```js
/**
 * live_tuning.js — every live-path tuning knob in one place.
 *
 * The browser-side equivalent of legacy config.py: edit a number, reload the
 * page, test on camera. Signal-processing knobs ONLY — clinical thresholds
 * (angles, ratios, alert strings) live in backend/app/config/exercises.json.
 */

// One-Euro filter on the rep-driver angle, in DEGREES. Rep counting only —
// never drawn. minCutoff: smoothing when still (lower = smoother at rest).
// beta: how fast smoothing loosens with speed, per deg/s (higher = less lag,
// more jitter). dCutoff: smoothing on the speed estimate itself.
export const ANGLE_FILTER = Object.freeze({ minCutoff: 0.1, beta: 0.02, dCutoff: 1.0 });

// One-Euro filter on the painted skeleton, in NORMALIZED 0-1 coords. Display
// only — rule math keeps the legacy EMA (smoother.js). beta is large because
// normalized coords move slowly in number terms (~0.5 units/s walking in).
export const DISPLAY_FILTER = Object.freeze({ minCutoff: 0.1, beta: 5, dCutoff: 1.0 });

// Rep misfire guards (pose_engine.js).
// holdFrames: consecutive frames past enter (or exit) before the stage flips.
//             5 frames ~= 0.5 s at the ~10 fps Lite runs at.
// minRepS:    first enter-crossing -> first exit-crossing faster than this is
//             rejected. Real reps take 2-4 s; jitter reps are sub-second.
// minRomDeg:  best angle must pass enter by at least this many degrees.
export const REP_GUARDS = Object.freeze({ holdFrames: 5, minRepS: 1.0, minRomDeg: 10 });

// MediaPipe minPoseDetection/minPosePresence/minTracking confidence.
// Legacy used 0.6. Higher = fewer phantom poses, more no-pose frames.
// Step down to 0.7 if real reps go missing on camera.
export const MP_CONFIDENCE = 0.8;
```

Verify: run `node -e "import('/home/billa-dakait/Desktop/final_project/frontend/src/lib/live_tuning.js').then(m=>console.log(Object.keys(m)))"`
Expected output lists ANGLE_FILTER, DISPLAY_FILTER, MP_CONFIDENCE, REP_GUARDS.
Report: the file path and the verify output. Nothing else.
````

---

### Task A2: `frontend/src/lib/smoother.js` (export OneEuroScalar) — haiku

**Files:** Modify `frontend/src/lib/smoother.js` (the line `class OneEuroScalar {`)
**Produces:** named export `OneEuroScalar` with `constructor({minCutoff, beta, dCutoff})` and `filter(x, tSeconds) -> number`

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/smoother.js. Edit nothing else.
No git commit/stash/checkout/reset.

Change the single line `class OneEuroScalar {` to `export class OneEuroScalar {`.
That is the whole change. Do not touch EmaSmoother, OneEuroSmoother,
createSmoother, or any comment. pose_engine.js will import OneEuroScalar to
filter one scalar (the driver angle) directly.

Verify: `cd /home/billa-dakait/Desktop/final_project/frontend && node --test tests/smoothing_audio.test.mjs`
Expected: all tests pass (same count as before the change).
Then: `node -e "import('/home/billa-dakait/Desktop/final_project/frontend/src/lib/smoother.js').then(m=>{const f=new m.OneEuroScalar({minCutoff:0.1,beta:0.02,dCutoff:1});console.log(f.filter(100,0),f.filter(100,0.1))})"`
Expected: `100 100`.
Report: the diff (one line) and both outputs.
````

---

### Task A3: `frontend/src/lib/events.js` (add `rep_rejected`) — haiku

**Files:** Modify `frontend/src/lib/events.js` (the `POSE_WORKER` array)

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/events.js. Edit nothing else.
No git commit/stash/checkout/reset.

The logger enforces a closed event vocabulary. Add the event name
"rep_rejected" to the POSE_WORKER array, as the last entry, right after
"audio_cue_missing". Keep the existing formatting (one quoted string per line,
trailing comma).

A matching edit to backend/app/events.py is done by a DIFFERENT agent — do not touch it.
The mirror test (backend/app/test_events_mirror.py) will fail until both land; that is expected.

Verify: `grep -n "rep_rejected" /home/billa-dakait/Desktop/final_project/frontend/src/lib/events.js`
Expected: exactly one line, inside POSE_WORKER.
Report: the diff.
````

---

### Task A4: `backend/app/events.py` (add `rep_rejected`) — haiku

**Files:** Modify `backend/app/events.py` (the pose-worker set containing `"audio_cue_missing"`)

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: backend/app/events.py. Edit nothing else.
No git commit/stash/checkout/reset.

Add the event name "rep_rejected" to the pose-worker event set — the one
containing "worker_ready", "frame_received", ..., "audio_cue_missing" (around
lines 44-52). Add it as the last entry after "audio_cue_missing", same
formatting. Make sure ALL_EVENTS still includes that set (read the file to
confirm how ALL_EVENTS is built; do not restructure it).

frontend/src/lib/events.js gets the same name from a DIFFERENT agent — do not touch it.

Verify: `cd /home/billa-dakait/Desktop/final_project/backend/app && ../../venv/bin/python -c "import events; print('rep_rejected' in events.ALL_EVENTS)"`
Expected: True
Report: the diff and the output.
````

---

### Task A5: `frontend/src/lib/rules.js` (config passed to `build`) — haiku

**Files:** Modify `frontend/src/lib/rules.js`: the header ctx comment (~line 21), the registry doc comment (~lines 62-69), and `checks.push(spec.build(values, alerts));` (~line 277)
**Produces:** `spec.build(values, alerts, exerciseConfig)`. Check ctx gains `driverAngle`.

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/rules.js. Edit nothing else.
No git commit/stash/checkout/reset.

Three small edits:

1. In rulesForExercise(), change
     checks.push(spec.build(values, alerts));
   to
     checks.push(spec.build(values, alerts, exerciseConfig));
   Existing builders take (v, a) and simply ignore the third argument — do NOT
   edit any existing builder.

2. In the registry doc comment above CHECK_REGISTRY, change the line
     *   build  — (values, alerts) => checkFn, closing over per-session state.
   to
     *   build  — (values, alerts, exerciseConfig) => checkFn, closing over
     *            per-session state. exerciseConfig is the full record, for
     *            checks that need a non-threshold value (e.g. depth_target).

3. In the file header comment, change
     * where ctx = { lms, pts, w, h, stage, view } — mirroring squat.py's
   to
     * where ctx = { lms, pts, w, h, stage, view, driverAngle } — mirroring squat.py's
   Then, as the last line of that same paragraph (the one ending "...for
   convenience."), add:
     * `driverAngle` is the engine's filtered rep-driver angle (deg) or null.

Verify: `cd /home/billa-dakait/Desktop/final_project/frontend && node --test tests/rules.test.mjs tests/exercise_checks.test.mjs tests/knee_varus.test.mjs`
Expected: all pass (same as before — behaviour is unchanged).
Report: the diff and the test summary line.
````

---

### Task A6: `backend/app/config/exercises.json` (HS + TKE records) — haiku

**Files:** Modify `backend/app/config/exercises.json`: the `heel_slide` record and the `terminal_knee_extension` record only
**Produces:** threshold keys `slide_insufficient_min_heel_travel_ratio`, `slide_insufficient_return_deg`, `thigh_lifting_max_hip_change_deg`. New TKE trigger 155/145/170.

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: backend/app/config/exercises.json. Edit ONLY the
record with "name": "heel_slide" and the record with "name":
"terminal_knee_extension". Do not reformat or touch any other record, key, or
the top-level _comment/_validation_warning. Keep the file's existing 2-space
JSON indentation and \u escapes style as-is for untouched text.
No git commit/stash/checkout/reset.

A) heel_slide record:
  1. "extra_checks" becomes: ["heel_lifting", "hip_lifting", "slide_insufficient"]
  2. Add two entries inside "thresholds" (keep existing entries untouched):
     "slide_insufficient_min_heel_travel_ratio": {
       "value": 0.25,
       "unit": "fraction of the rest hip->heel pixel distance",
       "source": "geometry of depth_target: with thigh ~= shin, knee 90 deg puts the heel at 0.71 of the straight-leg hip->heel distance (travel 0.29); 0.25 leaves slack. Provisional, NOT clinician-signed (2026-09-24)",
       "alert": "Slide your heel further toward your hip"
     },
     "slide_insufficient_return_deg": {
       "value": 15,
       "unit": "deg",
       "source": "provisional live tuning (2026-09-24): slide_insufficient judges once the knee has straightened this far back from its lowest point"
     }
  3. Do NOT change rep_trigger, joints, valid_views, or the other thresholds.

B) terminal_knee_extension record:
  1. rep_trigger: keep "joint_display_name" and "direction": "increase". Set
     "enter_angle"  -> {"value": 155, "unit": "deg", "source": S}
     "exit_angle"   -> {"value": 145, "unit": "deg", "source": S}
     "depth_target" -> {"value": 170, "unit": "deg", "source": S}
     where S is exactly:
     "derived from clinician start/end positions (supine, pillow under knee: knee 40 deg -> 0 deg flexion = 140 -> 180 deg); enter/exit sit above the ~140 deg rest with a 10 deg hysteresis band. Provisional (2026-09-24)"
     (This replaces the old exit_angle source text that explained the 95 correction.)
  2. "extra_checks" becomes: ["hip_lifting", "thigh_lifting"]
  3. Add inside "thresholds" (keep existing entries untouched):
     "thigh_lifting_max_hip_change_deg": {
       "value": 20,
       "unit": "deg (left shoulder-hip-knee 2D angle, relative to its value when the rep starts)",
       "source": "clinician note: hip stays at 40 deg flexion during TKE; +-20 deg owner-set tolerance for pillow/support variation. Provisional (2026-09-24)",
       "alert": "Keep your thigh on the pillow — only straighten the knee"
     }

Verify, all from /home/billa-dakait/Desktop/final_project:
  1. `python3 -c "import json;json.load(open('backend/app/config/exercises.json'))"` — no error.
  2. `cd backend && ../venv/bin/python -m app.exercise_config` — prints OK lines, no ExerciseConfigError.
     (If `-m` fails on import paths, run `cd backend/app && ../../venv/bin/python exercise_config.py` instead and report which worked.)
  3. `git diff --stat backend/app/config/exercises.json` — only this file.
Report: the git diff of the file and the verify outputs.
````

---

### Task A7: `frontend/tests/rep_guards.test.mjs` (create, TDD: fails until A9) — sonnet

**Files:** Create `frontend/tests/rep_guards.test.mjs`
**Consumes (contract A9 must meet):** `new PoseEngine(cfg, smoother)`. `processFrame(raw, w, h, tMs?)` returns `{…, driverAngle, repCount, stage, repEntry, repRejected}`. `repRejected` is `{reason: "too_fast"|"too_small", duration_s, rom_deg}` on the frame a rep is rejected, `null` otherwise. `REP_GUARDS` from `live_tuning.js`.

- [ ] Spawn a fresh agent (model: sonnet):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: CREATE exactly one new file: frontend/tests/rep_guards.test.mjs. Edit
nothing else. No git commit/stash/checkout/reset.

This is a TDD test written BEFORE the implementation. It is EXPECTED to fail
now (pose_engine.js does not yet have guards / repRejected / tMs). Do not edit
pose_engine.js to make it pass — another agent does that.

Context you need (read these files, do not edit them):
 - frontend/src/lib/pose_engine.js  (PoseEngine, processFrame, _advanceRepMachine)
 - frontend/src/lib/landmarks.js    (LM indices, VISIBILITY_THRESH = 0.6)
 - frontend/tests/exercise_checks.test.mjs (style: node:test, assert/strict, identity smoother)

The contract being tested (implemented later in pose_engine.js):
 - processFrame(raw, w, h, tMs) — tMs optional, milliseconds. When omitted the
   engine uses a synthetic clock of frameIndex*100 ms.
 - The driver angle is One-Euro filtered (minCutoff 0.1, beta 0.02, dCutoff 1.0).
 - Guards from frontend/src/lib/live_tuning.js REP_GUARDS {holdFrames:5, minRepS:1.0, minRomDeg:10}:
   * UP->DOWN only after the (filtered) angle is past enter_angle for 5 consecutive frames.
   * DOWN->UP only after it is past exit_angle for 5 consecutive frames.
   * duration = time of first exit-crossing minus time of first enter-crossing;
     < 1.0 s  => rejected, reason "too_fast".
   * rom = (decrease) enter - bestAngle, (increase) bestAngle - enter;
     < 10 deg => rejected, reason "too_small". too_fast is checked first.
   * A rejected rep: repCount unchanged, output.repRejected =
     {reason, duration_s, rom_deg} on that one frame, null on all other frames.
 - 3D joints (use_3d:true) yield a null angle when any of the three landmarks
   has visibility < 0.6.

Write the file with this structure (fill in exactly; keep it compact):

```js
/**
 * rep_guards.test.mjs — rep misfire guards in PoseEngine (hold frames,
 * minimum rep time, minimum movement) plus the 3D visibility check.
 * Synthetic single-joint config so only the guards are under test.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PoseEngine } from "../src/lib/pose_engine.js";
import { LM } from "../src/lib/landmarks.js";
import { REP_GUARDS } from "../src/lib/live_tuning.js";

const W = 1000, H = 1000; // square frame: pixel angles == normalized angles
const identity = { smooth: (_n, lm) => [lm.x, lm.y] };

function config({ use3d = false, direction = "decrease", enter = 150, exit = 170 } = {}) {
  return {
    name: "guard_test", type: "dynamic", valid_views: ["FRONT", "SIDE"],
    joints: [{
      display_name: "Knee (L)", landmark_a: "left_hip", landmark_b: "left_knee",
      landmark_c: "left_ankle", use_3d: use3d, check_in_views: ["FRONT", "SIDE"],
      is_rep_driver: true,
    }],
    rep_trigger: {
      joint_display_name: "Knee (L)", direction,
      enter_angle: { value: enter }, exit_angle: { value: exit }, depth_target: { value: 0 },
    },
    extra_checks: [], thresholds: {},
  };
}

/** 33 landmarks; left knee angle (hip-knee-ankle) = theta degrees. */
function frame(theta, kneeVis = 1) {
  const raw = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  const r = (theta * Math.PI) / 180;
  raw[LM.left_hip] = { x: 0.5, y: 0.3, z: 0, visibility: 1 };
  raw[LM.left_knee] = { x: 0.5, y: 0.5, z: 0, visibility: kneeVis };
  raw[LM.left_ankle] = { x: 0.5 + 0.2 * Math.sin(r), y: 0.5 - 0.2 * Math.cos(r), z: 0, visibility: 1 };
  // shoulders equal z => FRONT view
  raw[LM.left_shoulder] = { x: 0.45, y: 0.1, z: 0, visibility: 1 };
  raw[LM.right_shoulder] = { x: 0.55, y: 0.1, z: 0, visibility: 1 };
  return raw;
}

const ramp = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * (i + 1)) / n);
const hold = (a, n) => Array.from({ length: n }, () => a);

/** Feed angles at 10 fps with explicit timestamps; collect outputs. */
function run(engine, angles, { withT = true, kneeVis = 1 } = {}) {
  const outs = [];
  angles.forEach((a, i) => outs.push(engine.processFrame(frame(a, kneeVis), W, H, withT ? i * 100 : undefined)));
  return outs;
}
const rejections = (outs) => outs.map((o) => o.repRejected).filter(Boolean);
```

Then these tests (each builds its own fresh engine):

1. "guard knobs are the agreed values": assert.deepEqual({...REP_GUARDS}, {holdFrames:5, minRepS:1.0, minRomDeg:10}).
2. "a real rep counts once": angles = [...hold(178,20), ...ramp(178,100,20), ...hold(100,5), ...ramp(100,178,20), ...hold(178,20)].
   Assert final repCount === 1, rejections(outs).length === 0, exactly one out has a truthy repEntry.
3. "jitter spikes never start a rep": 200 frames of 175 where every 10th frame (i % 10 === 5) is 140.
   Assert final repCount === 0, every out.stage === "UP", rejections length 0.
4. "a fast dip is rejected as too_fast": [...hold(178,20), ...hold(100,6), ...hold(178,20)].
   Assert repCount === 0, rejections length === 1, rejections[0].reason === "too_fast", typeof duration_s === "number".
5. "a shallow dip is rejected as too_small": [...hold(178,20), ...ramp(178,145,10), ...hold(145,20), ...ramp(145,178,10), ...hold(178,20)].
   Assert repCount === 0, rejections length === 1, reason === "too_small", rom_deg < 10.
6. "no tMs → synthetic clock still counts": same angles as test 2, run(engine, angles, {withT:false}). Assert repCount === 1.
7. "increase direction works (TKE-like)": config({direction:"increase", enter:155, exit:145}); angles =
   [...hold(140,20), ...ramp(140,178,20), ...hold(178,5), ...ramp(178,140,20), ...hold(140,20)]. Assert repCount === 1.
8. "low-visibility 3D joint yields null driver angle": engine with config({use3d:true}); outs = run(engine, hold(120,10), {kneeVis:0.3});
   assert every out.driverAngle === null and final repCount === 0 and stage "UP".
   Then a second fresh 3D engine with kneeVis 1 over hold(120,3): assert typeof outs.at(-1).driverAngle === "number".

Run: `cd /home/billa-dakait/Desktop/final_project/frontend && node --test tests/rep_guards.test.mjs`
Expected NOW: failures (e.g. repRejected undefined, live_tuning import missing if A1 not landed yet).
Report: the file content summary (test names) and the failing output tail. Do not "fix" anything else.
````

---

### Task A8: `frontend/tests/hs_tke_checks.test.mjs` (create, TDD: fails until A10-A12) — haiku

**Files:** Create `frontend/tests/hs_tke_checks.test.mjs`
**Consumes (contract):** `EXERCISE_CHECKS.slide_insufficient.build(v, a, cfg)` and `EXERCISE_CHECKS.thigh_lifting.build(v, a)`. Checks are called as `fn({ pts, stage, driverAngle })`.

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: CREATE exactly one new file: frontend/tests/hs_tke_checks.test.mjs.
Edit nothing else. No git commit/stash/checkout/reset.
TDD: written BEFORE the checks exist; it is EXPECTED to fail now.

Read for style (do not edit): frontend/tests/knee_varus.test.mjs,
frontend/tests/helpers.mjs (exports exerciseByName(name) reading the real
backend/app/config/exercises.json).

Contract under test:
 - EXERCISE_CHECKS (from "../src/lib/checks/index.js") will contain
   "slide_insufficient" and "thigh_lifting", each {needs, build}.
 - slide_insufficient.build(v, a, cfg) where
     v = { slide_insufficient_min_heel_travel_ratio: 0.25, slide_insufficient_return_deg: 15 }
     a = { slide_insufficient_min_heel_travel_ratio: "SLIDE", slide_insufficient_return_deg: null }
     cfg = { rep_trigger: { depth_target: { value: 90 } } }
   returns fn(ctx) with ctx = { pts, stage, driverAngle }. pts.left_hip and
   pts.left_heel are [x, y] pixel arrays. Behaviour: in UP it records the max
   hip->heel distance (rest distance) and returns null. In DOWN it tracks the
   lowest driverAngle and smallest hip->heel distance; once driverAngle >=
   lowest + 15 it judges once: alert "SLIDE" if lowest > 90 OR
   (rest - smallest)/rest < 0.25; after firing it keeps returning "SLIDE" for
   the rest of that DOWN; back in UP everything resets.
 - thigh_lifting.build(v, a) with v = { thigh_lifting_max_hip_change_deg: 20 },
   a = { thigh_lifting_max_hip_change_deg: "THIGH" }; fn({ pts, stage }) uses
   the 2D angle at left_hip between left_shoulder and left_knee. Baseline =
   that angle on the first DOWN frame after UP. Returns "THIGH" if
   |angle - baseline| > 20 during DOWN, else null. UP → null, baseline reset.

Write:

```js
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { EXERCISE_CHECKS } from "../src/lib/checks/index.js";
import { rulesForExercise } from "../src/lib/rules.js";
import { exerciseByName } from "./helpers.mjs";

const HS_V = { slide_insufficient_min_heel_travel_ratio: 0.25, slide_insufficient_return_deg: 15 };
const HS_A = { slide_insufficient_min_heel_travel_ratio: "SLIDE", slide_insufficient_return_deg: null };
const HS_CFG = { rep_trigger: { depth_target: { value: 90 } } };
const hsPts = (dist) => ({ left_hip: [0, 0], left_heel: [dist, 0] });

/** Feed [stage, driverAngle, heelDist] steps; return outputs. */
function feed(fn, steps) {
  return steps.map(([stage, driverAngle, d]) => fn({ pts: hsPts(d), stage, driverAngle }));
}
function hsRep(minAngle, minDist) {
  // rest 400px, descend to minAngle/minDist, come back 16 deg (past the 15 deg return), then UP
  return [
    ["UP", 175, 400], ["UP", 175, 400],
    ["DOWN", 140, 380], ["DOWN", minAngle + 5, (380 + minDist) / 2], ["DOWN", minAngle, minDist],
    ["DOWN", minAngle + 8, minDist], ["DOWN", minAngle + 16, minDist + 10], ["DOWN", minAngle + 30, minDist + 40],
    ["UP", 175, 400],
  ];
}

/** Knee placed so the 2D angle at the hip (shoulder-hip-knee) = theta. */
function tkePts(theta) {
  const r = ((180 - theta) * Math.PI) / 180;
  return { left_shoulder: [200, 500], left_hip: [500, 500], left_knee: [500 + 200 * Math.cos(r), 500 - 200 * Math.sin(r)] };
}
```

Tests:
describe("slide_insufficient (heel_slide)"):
 1. "good rep → no alert": fn = build(HS_V, HS_A, HS_CFG); outs = feed(fn, hsRep(85, 280)); every out === null.
    (travel = (400-280)/400 = 0.30 ≥ 0.25, lowest 85 ≤ 90)
 2. "knee short → alert on the return and for rest of DOWN": outs = feed(fn, hsRep(100, 280));
    outs[6] === "SLIDE", outs[7] === "SLIDE", outs[8] === null (UP), outs[0..5] all null.
 3. "heel short → alert": outs = feed(fn, hsRep(85, 340)) (travel 0.15); outs[6] === "SLIDE".
 4. "no verdict before the knee comes back 15 deg": in hsRep(100,280), outs[5] (lowest+8) === null.
 5. "resets between reps": fn fed hsRep(100,280) then hsRep(85,280) on the SAME fn; second rep's outputs all null.
 6. "no cfg / missing pts / undefined driverAngle never throw": fn2 = build(HS_V, HS_A) (no cfg);
    assert.doesNotThrow(() => fn2({ pts: {}, stage: "DOWN", driverAngle: undefined }));
    and fn2({ pts: {}, stage: "DOWN" }) === null.
describe("thigh_lifting (terminal_knee_extension)"):
 7. "within ±20 of rep-start hip angle → null; beyond → alert": fn = build({thigh_lifting_max_hip_change_deg:20},{thigh_lifting_max_hip_change_deg:"THIGH"});
    fn({pts:tkePts(140),stage:"UP"}) null; fn({pts:tkePts(140),stage:"DOWN"}) null (baseline 140);
    fn({pts:tkePts(150),stage:"DOWN"}) null; fn({pts:tkePts(165),stage:"DOWN"}) === "THIGH"; fn({pts:tkePts(140),stage:"UP"}) null.
 8. "per-rep baseline (different pillow)": continue same fn: fn({pts:tkePts(120),stage:"DOWN"}) null (new baseline 120);
    fn({pts:tkePts(135),stage:"DOWN"}) null.
 9. "missing pts → null": fn({pts:{},stage:"DOWN"}) === null.
describe("real config wiring"):
 10. "HS builds heel_lifting + hip_lifting + slide_insufficient, none skipped":
     const r = rulesForExercise(exerciseByName("heel_slide")); r.checks.length === 3; r.skipped.length === 0.
 11. "TKE builds hip_lifting + thigh_lifting, none skipped, trigger 155/145/170":
     const ex = exerciseByName("terminal_knee_extension"); r = rulesForExercise(ex); r.checks.length === 2; r.skipped.length === 0;
     ex.rep_trigger.enter_angle.value === 155; exit 145; depth_target 170; direction "increase".

Access checks as EXERCISE_CHECKS.slide_insufficient.build(...) / EXERCISE_CHECKS.thigh_lifting.build(...).

Run: `cd /home/billa-dakait/Desktop/final_project/frontend && node --test tests/hs_tke_checks.test.mjs`
Expected NOW: failures (checks not registered). Report test names + failing tail.
````

---

### Task A9: `frontend/src/lib/pose_engine.js` (timestamp, 3D visibility, angle filter, guards) — sonnet

**Files:** Modify `frontend/src/lib/pose_engine.js`
**Consumes:** `OneEuroScalar` (A2), `ANGLE_FILTER`, `REP_GUARDS` (A1), `build(v,a,cfg)` (A5)
**Produces:** `buildPts(raw, w, h, smoother, tSeconds?)`. `processFrame(raw, w, h, tMs?)` → adds `repRejected` and `pts` to the output. Check ctx adds `driverAngle` (filtered).

- [ ] Spawn a fresh agent (model: sonnet):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/pose_engine.js. Edit nothing
else (not tests, not smoother.js, not live_tuning.js — those are done by other
agents and already exist). No git commit/stash/checkout/reset.

Read first: the whole pose_engine.js; frontend/src/lib/live_tuning.js;
frontend/src/lib/smoother.js (OneEuroScalar: new OneEuroScalar({minCutoff,beta,dCutoff}),
.filter(x, tSeconds)); frontend/tests/rep_guards.test.mjs (the contract you must satisfy).

Why: the live path counts reps while a patient sits still. Causes: (1) use_3d
driver angles read RAW landmarks with no visibility check; (2) one frame past
enter/exit flips the stage; (3) no minimum rep time / movement.

Make these changes:

1. Imports: add
     import { OneEuroScalar } from "./smoother.js";
     import { ANGLE_FILTER, REP_GUARDS } from "./live_tuning.js";

2. buildPts: new optional 5th param tSeconds, forwarded to the smoother:
     export function buildPts(rawLandmarks, w, h, smoother, tSeconds) { ...
       const [sx, sy] = smoother.smooth(name, lm, tSeconds);
   (EmaSmoother ignores the extra arg; OneEuroSmoother needs it — the worker's
   display smoother uses it.) Update its one-line doc comment to mention tSeconds.

3. computeJointAngle, use_3d branch: after the `if (!a || !b || !c) return null;`
   add:
     // 3D reads RAW landmarks (no EMA, no build_pts filter), so gate visibility here —
     // an occluded joint otherwise feeds a phantom angle to the rep machine.
     if ((a.visibility ?? 0) < VISIBILITY_THRESH || (b.visibility ?? 0) < VISIBILITY_THRESH
         || (c.visibility ?? 0) < VISIBILITY_THRESH) return null;
   (VISIBILITY_THRESH is already imported from ./landmarks.js.)

4. Constructor: after `this._rt = ...` add
     this._angleFilter = new OneEuroScalar(ANGLE_FILTER);
     this._frameIdx = 0;
     this._enterCount = 0;
     this._exitCount = 0;
     this._enterFirstT = null;
     this._exitFirstT = null;
     this._pendingRejected = null;

5. processFrame signature: processFrame(rawLandmarks, w, h, tMs). First lines:
     // ponytail: synthetic 10 fps clock when the caller passes no timestamp (tests, selfcheck).
     const t = tMs ?? this._frameIdx * 100;
     this._frameIdx++;
   Update the JSDoc: tMs = frame timestamp in ms (optional); returns also
   repRejected and pts.

6. In processFrame, INSIDE the `if ((this.config.valid_views || []).includes(view))`
   block, immediately AFTER the `for (const jc of joints)` loop and BEFORE the
   extra_checks loop, add:
     // One-Euro on the driver angle only: rep counting gets a jitter-free
     // signal while landmarks (and so the offline-parity angles) stay EMA.
     if (driverAngle != null) driverAngle = this._angleFilter.filter(driverAngle, t / 1000);
   and change the check call to pass it:
     const a = fn({ lms: rawLandmarks, pts, w, h, stage: this.stage, view, driverAngle });

7. Rep machine call: `alerts = this._advanceRepMachine(driverAngle, alerts, t);`
   (the surrounding `if (this._rt && driverAngle != null && driverAngle > 0)` stays).

8. Return object: add after repEntry:
     // Present only on the frame a rep was rejected by a guard; read once.
     repRejected: (() => { const r = this._pendingRejected; this._pendingRejected = null; return r; })(),
     pts,
   (`pts` = the EMA rule-math points; the worker sends these as WS evidence.)

9. Replace _advanceRepMachine with a guarded version. Signature
   _advanceRepMachine(driverAngle, alerts, t). Keep ALL existing DOWN-stage
   logic (bestDriverAngle, repErrors, repHadError/repFailReason, depth check
   with depthAlert, rep_was_clean, cleanReps, sessionLog, _pendingRepEntry)
   exactly as today, only gated as below:

     const rt = this._rt;
     const g = REP_GUARDS;
     const decreasing = rt.direction === "decrease";

     if (this.stage === "UP") {
       const pastEnter = decreasing ? driverAngle < rt.enterAngle : driverAngle > rt.enterAngle;
       if (pastEnter) {
         if (this._enterCount === 0) this._enterFirstT = t;
         this._enterCount += 1;
       } else {
         this._enterCount = 0;
       }
       if (this._enterCount >= g.holdFrames) {
         this.stage = "DOWN";
         this._enterCount = 0;
         this._exitCount = 0;
         this._exitFirstT = null;
         this.repHadError = false;
         this.repFailReason = "";
         this.repErrors = [];
         this.bestDriverAngle = driverAngle;
       }
     }

     if (this.stage === "DOWN") {
       ...existing bestDriverAngle update + alert collection, unchanged...

       const pastExit = decreasing ? driverAngle > rt.exitAngle : driverAngle < rt.exitAngle;
       if (pastExit) {
         if (this._exitCount === 0) this._exitFirstT = t;
         this._exitCount += 1;
       } else {
         this._exitCount = 0;
       }
       if (this._exitCount >= g.holdFrames) {
         this.stage = "UP";
         this._exitCount = 0;
         const durationS = (this._exitFirstT - this._enterFirstT) / 1000;
         const romDeg = decreasing ? rt.enterAngle - this.bestDriverAngle : this.bestDriverAngle - rt.enterAngle;
         const reason = durationS < g.minRepS ? "too_fast" : romDeg < g.minRomDeg ? "too_small" : null;
         if (reason) {
           // Not a rep: not counted, not flagged. Logged by the worker as rep_rejected.
           this._pendingRejected = { reason, duration_s: Number(durationS.toFixed(2)), rom_deg: Math.trunc(romDeg) };
           this.repHadError = false;
           this.repFailReason = "";
           this.repErrors = [];
           return alerts;
         }
         ...existing completion block unchanged: repCount += 1, depth check,
            rep_was_clean, cleanReps, entry, sessionLog.push, _pendingRepEntry...
       }
     }
     return alerts;

   IMPORTANT: the old code tested `exited` and flipped immediately; the new code
   only flips after holdFrames consecutive exit frames. Remove the old
   `const exited = ...; if (exited) {` wrapper — the completion block now lives
   inside `if (this._exitCount >= g.holdFrames)` after the rejection return.

10. File header comment: in the numbered per-frame list, add after step 4:
     *   4b. driver_angle is One-Euro filtered (live_tuning.js ANGLE_FILTER)
   and after step 6:
     *   6b. rep guards (live_tuning.js REP_GUARDS): hold frames on enter/exit,
     *       minimum rep time, minimum movement; rejected reps -> repRejected
   Keep everything else in the header.

Verify (from /home/billa-dakait/Desktop/final_project/frontend):
  1. `node --test tests/rep_guards.test.mjs` → all pass.
  2. `node --test tests/*.test.mjs` → report pass/fail counts. hs_tke_checks
     failures are EXPECTED until the check files are registered (other agents).
     Any OTHER failure: fix it inside pose_engine.js only if the cause is here;
     otherwise report it, do not edit other files.
  3. `node tools/pose_engine_selfcheck.mjs` → report output (it passes no tMs,
     so it runs on the synthetic clock; expected PASS lines).
Report: full diff of pose_engine.js and all three outputs.
````

---

### Task A10: `frontend/src/lib/checks/heel_slide.js` (create) — sonnet

**Files:** Create `frontend/src/lib/checks/heel_slide.js`
**Produces:** `export const CHECKS = { slide_insufficient: {needs, build} }`

- [ ] Spawn a fresh agent (model: sonnet):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: CREATE exactly one new file: frontend/src/lib/checks/heel_slide.js.
Edit nothing else (registration in checks/index.js is another agent's job).
No git commit/stash/checkout/reset. Do NOT import anything from shared.js.

Read for style (do not edit): frontend/src/lib/checks/straight_leg_raise.js,
frontend/src/lib/checks/shared.js, frontend/tests/hs_tke_checks.test.mjs (the
contract — tests 1-6 target this file).

Exercise: heel slide, lying on the back, SIDE camera. Rep = straight leg
(knee ~180) → slide heel toward hip (knee to ~90) → back to straight. The
engine drives reps off the LEFT knee angle (decrease: enter 150, exit 170,
depth_target 90). Check contract: fn(ctx) where ctx = { lms, pts, w, h,
stage, view, driverAngle }; pts values are [x, y] pixel arrays and may be
missing; driverAngle is the engine's filtered knee angle (deg) or
null/undefined. build(values, alerts, exerciseConfig) — exerciseConfig may be
undefined (a test builds with two args).

Write exactly:

```js
/**
 * checks/heel_slide.js — Heel slide live checks.
 *
 * slide_insufficient: the slide stopped short, judged on BOTH the knee angle
 * and how far the heel travelled toward the hip. Judged once per rep, on the
 * way back (knee has straightened `slide_insufficient_return_deg` from its
 * lowest point) — not at rep end, so it needs no hook into the engine's exit
 * logic and cannot fire for a rep the engine later rejects as jitter.
 *
 * Heel travel = (rest - closest) / rest, where rest is the largest hip->heel
 * pixel distance seen while the leg lay straight (UP), closest the smallest
 * during the slide (DOWN). Distance-to-camera invariant. Left leg only — the
 * rep driver is Knee (L).
 */

export const CHECKS = {
  slide_insufficient: {
    needs: ["slide_insufficient_min_heel_travel_ratio", "slide_insufficient_return_deg"],
    build: (v, a, exerciseConfig) => {
      // Knee half of the verdict; skipped when the record has no depth_target.
      const depth = exerciseConfig?.rep_trigger?.depth_target?.value ?? null;
      let restDist = 0;
      let prevStage = "UP";
      let minAngle = Infinity;
      let minDist = Infinity;
      let verdict = null;
      let judged = false;
      return function checkSlideInsufficient({ pts, stage, driverAngle }) {
        const hip = pts?.left_hip;
        const heel = pts?.left_heel;
        const d = hip && heel ? Math.hypot(heel[0] - hip[0], heel[1] - hip[1]) : null;

        if (stage !== "DOWN") {
          if (prevStage === "DOWN") restDist = 0; // a new rest period starts
          if (d !== null) restDist = Math.max(restDist, d);
          prevStage = stage;
          minAngle = Infinity;
          minDist = Infinity;
          verdict = null;
          judged = false;
          return null;
        }
        prevStage = stage;
        if (judged) return verdict; // latched: stays up for the rest of this DOWN
        if (driverAngle == null) return null;

        minAngle = Math.min(minAngle, driverAngle);
        if (d !== null) minDist = Math.min(minDist, d);
        if (driverAngle < minAngle + v.slide_insufficient_return_deg) return null;

        judged = true;
        const kneeShort = depth !== null && minAngle > depth;
        const heelShort = restDist > 0 && Number.isFinite(minDist)
          && (restDist - minDist) / restDist < v.slide_insufficient_min_heel_travel_ratio;
        verdict = kneeShort || heelShort ? a.slide_insufficient_min_heel_travel_ratio : null;
        return verdict;
      };
    },
  },
};
```

Verify: `cd /home/billa-dakait/Desktop/final_project/frontend && node -e "import('./src/lib/checks/heel_slide.js').then(m=>console.log(Object.keys(m.CHECKS)))"`
Expected: [ 'slide_insufficient' ].
(hs_tke_checks tests will only pass after index.js registration — not your job.)
Report: file path + verify output.
````

---

### Task A11: `frontend/src/lib/checks/terminal_knee_extension.js` (create) — haiku

**Files:** Create `frontend/src/lib/checks/terminal_knee_extension.js`
**Produces:** `export const CHECKS = { thigh_lifting: {needs, build} }`

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: CREATE exactly one new file: frontend/src/lib/checks/terminal_knee_extension.js.
Edit nothing else (registration in checks/index.js is another agent's job).
No git commit/stash/checkout/reset.

Read for style (do not edit): frontend/src/lib/checks/straight_leg_raise.js
(same import style), frontend/tests/hs_tke_checks.test.mjs tests 7-9 (contract).

Exercise: terminal knee extension, lying on the back, pillow under the knee,
SIDE camera. Only the lower leg moves (knee ~140 → 180); the hip should stay
put. The check fires if the hip angle (left shoulder-hip-knee, 2D) moves more
than the threshold from its value when the rep started. A per-rep baseline
(not a fixed 140) is used because pillows differ.

Write exactly:

```js
/**
 * checks/terminal_knee_extension.js — Terminal knee extension live checks.
 *
 * thigh_lifting: only the lower leg should move — the thigh stays on the
 * pillow. Measured as the left shoulder-hip-knee 2D angle relative to its
 * value on the first DOWN frame of the rep, so any pillow or towel height
 * works. Left leg only — the rep driver is Knee (L).
 */

import { angle2d } from "../angles.js";

export const CHECKS = {
  thigh_lifting: {
    needs: ["thigh_lifting_max_hip_change_deg"],
    build: (v, a) => {
      let baseline = null;
      let prevStage = "UP";
      return function checkThighLifting({ pts, stage }) {
        const sh = pts?.left_shoulder;
        const hip = pts?.left_hip;
        const knee = pts?.left_knee;
        const ang = sh && hip && knee ? angle2d(sh, hip, knee) : null;
        if (stage === "DOWN" && prevStage !== "DOWN") baseline = ang;
        prevStage = stage;
        if (stage !== "DOWN") {
          baseline = null;
          return null;
        }
        if (baseline === null || ang === null) return null;
        if (Math.abs(ang - baseline) > v.thigh_lifting_max_hip_change_deg) {
          return a.thigh_lifting_max_hip_change_deg;
        }
        return null;
      };
    },
  },
};
```

Verify: `cd /home/billa-dakait/Desktop/final_project/frontend && node -e "import('./src/lib/checks/terminal_knee_extension.js').then(m=>console.log(Object.keys(m.CHECKS)))"`
Expected: [ 'thigh_lifting' ].
Report: file path + verify output.
````

---

### Task A12: `frontend/src/lib/checks/index.js` (register HS + TKE) — haiku

**Files:** Modify `frontend/src/lib/checks/index.js`

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/checks/index.js. Edit nothing else.
No git commit/stash/checkout/reset.

Two new modules exist: ./heel_slide.js and ./terminal_knee_extension.js, each
`export const CHECKS = {...}` (slide_insufficient; thigh_lifting). Register
them exactly like the existing four, in all FOUR places the file lists modules:
  1. imports:  import { CHECKS as HEEL_SLIDE } from "./heel_slide.js";
               import { CHECKS as TERMINAL_KNEE_EXTENSION } from "./terminal_knee_extension.js";
  2. the EXERCISE_CHECKS Object.freeze({...}) spread list: ...HEEL_SLIDE, ...TERMINAL_KNEE_EXTENSION
  3. the collision-count block: add `const hsKeys = Object.keys(HEEL_SLIDE).length;`
     and `const tkeKeys = Object.keys(TERMINAL_KNEE_EXTENSION).length;` and add both to totalExpected.
  4. the allNames array in the error branch: ...Object.keys(HEEL_SLIDE), ...Object.keys(TERMINAL_KNEE_EXTENSION)
Keep the existing order; append the new ones after STRAIGHT_LEG_RAISE everywhere.

Verify (from /home/billa-dakait/Desktop/final_project/frontend):
  1. `node --test tests/hs_tke_checks.test.mjs tests/exercise_checks.test.mjs tests/rules.test.mjs`
  Expected: all pass. If hs_tke_checks fails, report the failing assertion — do NOT edit the check files or tests.
Report: the diff and the test summary.
````

---

### Task A13: `frontend/src/workers/pose_worker.js` (confidence, timestamp, display smoother, rep_rejected) — sonnet

**Files:** Modify `frontend/src/workers/pose_worker.js`
**Consumes:** `MP_CONFIDENCE`, `DISPLAY_FILTER` (A1). `OneEuroSmoother` (existing export). `processFrame(raw,w,h,tMs)` → `{repRejected, pts}` (A9). `buildPts(raw,w,h,smoother,tSeconds)` (A9).
**Produces:** posted `result` message gains `evidencePts`. `pts` becomes display-smoothed.

- [ ] Spawn a fresh agent (model: sonnet):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/workers/pose_worker.js. Edit nothing
else. No git commit/stash/checkout/reset.

Read first: the whole pose_worker.js (note: it is a CLASSIC worker — sibling
modules are loaded with dynamic `await import(...)` inside init(), never static
imports; keep it that way), frontend/src/lib/live_tuning.js,
frontend/src/lib/smoother.js (OneEuroSmoother(opts).smooth(name, raw, tSeconds), .reset()),
frontend/src/lib/pose_engine.js (processFrame(raw, w, h, tMs) now returns
repRejected and pts; buildPts(raw, w, h, smoother, tSeconds)).

Changes:

1. Module-level lets: extend `let PoseEngine, buildPts, createSmoother, BrowserLogger;`
   to also declare OneEuroSmoother, MP_CONFIDENCE, DISPLAY_FILTER. Add
   `let displaySmoother = null;` next to `let smoother = null;`.

2. init(): change the smoother import to
     ({ createSmoother, OneEuroSmoother } = await import("../lib/smoother.js"));
   and add
     ({ MP_CONFIDENCE, DISPLAY_FILTER } = await import("../lib/live_tuning.js"));
   In PoseLandmarker.createFromOptions options add (after numPoses: 1):
     minPoseDetectionConfidence: MP_CONFIDENCE,
     minPosePresenceConfidence: MP_CONFIDENCE,
     minTrackingConfidence: MP_CONFIDENCE,
   After `smoother = createSmoother(...)` add:
     // Display-only smoother: the painted skeleton. Rule math keeps `smoother` (EMA).
     displaySmoother = new OneEuroSmoother(DISPLAY_FILTER);
   Extend the worker_ready log fields: { exercise, model: "pose_landmarker_lite", delegate: "CPU", mp_confidence: MP_CONFIDENCE }
   (logs could not previously say which delegate ran — docs/IMMEDIATE-NEXT-STEPS.md §4).

3. handleFrame():
   - `const out = engine.processFrame(raw, w, h, tsMs);`  (tsMs is already computed above for detectForVideo)
   - Replace
       const pts = buildPts(raw, w, h, smoother); // re-derive for the renderer ...
     with
       // Renderer gets its own One-Euro pass. The old line re-ran the rule-math
       // EMA a second time per frame, advancing its state twice.
       const pts = buildPts(raw, w, h, displaySmoother, tsMs / 1000);
   - After the flag_raised loop add:
       if (out.repRejected) logger.info("rep_rejected", out.repRejected);
   - In the postMessage result object add, right after `pts,`:
       evidencePts: out.pts, // EMA rule-math points: what the WS records as evidence
     (the orchestrator is updated by another agent to send evidencePts on the WS
     and keep painting `pts`).

4. onmessage "reset" case: add `displaySmoother?.reset();` next to `smoother?.reset();`.

Keep the inFlight guard, drop logic, error handling and all comments intact.

Verify (from /home/billa-dakait/Desktop/final_project/frontend):
  1. `node --check src/workers/pose_worker.js` → no syntax error.
  2. `grep -n "minTrackingConfidence\|displaySmoother\|rep_rejected\|evidencePts" src/workers/pose_worker.js` → shows each change.
  3. `node --test tests/*.test.mjs` → report counts (the worker has no unit test; this is a regression check).
The worker itself needs a browser + camera; say so in the report rather than claiming it was run.
Report: full diff and outputs.
````

---

### Task A14: `frontend/src/lib/session_orchestrator.js` (send evidence points) — haiku

**Files:** Modify `frontend/src/lib/session_orchestrator.js:325`

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
FIRST call the Skill tool: skill "ponytail:ponytail", args "ultra". Then do the task.

Task: edit exactly ONE file: frontend/src/lib/session_orchestrator.js. Edit
nothing else. No git commit/stash/checkout/reset.

The pose worker's result message now carries two point sets: `pts`
(display-smoothed, for painting) and `evidencePts` (the EMA rule-math points).
The WebSocket must record the rule-math points as evidence, not the display ones.

Find the line (around 325):
    ws.sendPose({ ts: msg.ts, landmarks: msg.pts, alerts: msg.alerts, view: msg.view });
Change `landmarks: msg.pts` to `landmarks: msg.evidencePts ?? msg.pts`.
Leave `painter.setPose(msg.pts, msg.alerts);` unchanged (painting stays on display pts).
That is the whole change.

Verify: `cd /home/billa-dakait/Desktop/final_project/frontend && node --check src/lib/session_orchestrator.js && node --test tests/transport.test.mjs`
Expected: no syntax error; transport tests pass.
Report: the diff and output.
````

---

### Task A15: Full verification (run only, no edits) — haiku

- [ ] Spawn a fresh agent (model: haiku):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project.
READ-ONLY task: do NOT edit any file. Only run commands and report.

Run each and report the exact tail (last ~15 lines) + exit code:
  1. cd frontend && node --test tests/*.test.mjs
  2. cd frontend && node tools/pose_engine_selfcheck.mjs
  3. cd frontend && node tools/parity_check.mjs      (6-decimal angle parity; must still pass)
  4. cd backend && ../venv/bin/python -m app.exercise_config   (fallback: cd backend/app && ../../venv/bin/python exercise_config.py)
  5. cd backend/app && ../../venv/bin/python test_events_mirror.py
  6. cd frontend && ./run_tests.sh   (full suite; some harnesses need a browser — report which ones fail and why, verbatim)
  7. git status --short -- frontend/src frontend/tests backend/app/config backend/app/events.py
For each failure name the file the error points into. No speculation beyond the output.
````

If anything fails: for EACH failing file, spawn a NEW agent (haiku for one-line fixes, sonnet otherwise). Give it: that file only, the failure output verbatim, the relevant task's Agent prompt from this plan as context, and the ponytail-ultra-first rule. Re-run A15 as a new agent after the fixes.

---

### Task A16: Final review (read-only) — sonnet

- [ ] Spawn a fresh agent (model: sonnet):

````
Medium effort. Repo: /home/billa-dakait/Desktop/final_project. READ-ONLY: no edits.

Review the diff of exactly these files against the plan at
docs/superpowers/plans/2026-09-24-hs-tke-checks-and-rep-guards.md (read its
"Locked decisions" D1-D12 and "Review Focus"):
  frontend/src/lib/live_tuning.js, frontend/src/lib/smoother.js,
  frontend/src/lib/events.js, backend/app/events.py, frontend/src/lib/rules.js,
  backend/app/config/exercises.json, frontend/src/lib/pose_engine.js,
  frontend/src/lib/checks/heel_slide.js, frontend/src/lib/checks/terminal_knee_extension.js,
  frontend/src/lib/checks/index.js, frontend/src/workers/pose_worker.js,
  frontend/src/lib/session_orchestrator.js,
  frontend/tests/rep_guards.test.mjs, frontend/tests/hs_tke_checks.test.mjs
Use `git diff -- <file>` for modified files and read new files whole.

Report, one line each, most severe first: location, defect, concrete failing
scenario. Check specifically:
 - any decision D1-D12 not implemented or implemented differently;
 - a null threshold coerced to a number; a check that can throw on missing pts;
 - rep guard edge cases: enter hold resetting on a null-angle frame (must NOT reset — null frames skip the machine), _enterFirstT stale across reps, rejected rep leaking errors into the next rep;
 - the worker: static import added to the classic worker (breaks it), displaySmoother used before init, evidencePts missing;
 - anything touching files outside the list.
No style nits. If nothing survives, say so.
````

---

## Self-review

- **Spec coverage:**
  - D1/D2 → A10, A8, A6.
  - D3 → A6 (unchanged rep trigger, checked by A8 test 10).
  - D4/D5 → A6, A11, A8.
  - D6 → A9 (+A2).
  - D7 → A13 (+A1).
  - D8 → A9, A7, A3, A4, A13.
  - D9 → A13.
  - D10 → A9, A7 test 8.
  - D11 → A1.
  - D12 → A9 (engine-level, no name branch).
  - Evidence-points side effect → A13, A14.
- **Placeholders:** none. Every code step carries its code.
- **Type consistency:**
  - `processFrame(raw,w,h,tMs)`, `repRejected{reason,duration_s,rom_deg}`, `buildPts(...,tSeconds)`, `build(v,a,cfg)`, `CHECKS` export name, and threshold keys `slide_insufficient_min_heel_travel_ratio` / `slide_insufficient_return_deg` / `thigh_lifting_max_hip_change_deg`: all spelled identically in A6, A7, A8, A9, A10, A11 and A13.
- **Known limits, recorded in the code as `ponytail:` comments where relevant:**
  - Left leg only.
  - Thresholds are provisional.
  - MediaPipe confidence 0.8 may drop frames for a patient lying down. Camera test needed.
  - The worker and display smoothing can only be verified with a browser and camera. A15 reports the headed harness result verbatim.
- **Docs not updated** (`docs/09_live_frontend.md` §6 and deviations, `docs/IMMEDIATE-NEXT-STEPS.md`). Per standing preference, docs are batched and only updated on request.

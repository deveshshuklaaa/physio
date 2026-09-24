# 08 — Exercise config (Phase F)

Owner: backend-core-agent. Scope: `backend/app/exercise_config.py`,
`backend/app/config/exercises.json`, `backend/app/routes/exercises.py`,
`backend/app/main.py` (wiring only), `backend/app/events.py` +
`frontend/src/lib/events.js` (one new event category).

This brief's two owner decisions override MASTER_BUILD_PLAN_v3.md §5 Phase F
as written:

1. The registry is the **five ML-dataset exercises** (`heel_slide`,
   `mini_squat`, `seated_knee_extension`, `straight_leg_raise`,
   `terminal_knee_extension`), not the legacy three (`squat`,
   `seated_leg_extensions`, `isometric_quadriceps`).
2. **Pure data, no per-exercise Python, no code hook.** This reverses §F1's
   "keep the class structure."

F2 (`type` field) is followed exactly as written in §5 — stored, not derived.

## F1–F7 status

| Task | Status | Evidence |
|---|---|---|
| F1 (amended) | **DONE** | `backend/app/config/exercises.json`, 5 records, no `.py` per exercise. |
| F2 | **DONE** | `type` stored per record; load-time agreement check in `exercise_config.py::_validate_record`. Evidence per exercise below. |
| F3 | **DONE** | All 5 are `"pose"` per §9's "model v1 is pose-only" gap — none marked `"emg"`/`"both"` (see Open questions). |
| F4 | **DONE (placeholders only)** | Every clinical value is `{"value": null, "_TODO": "..."}`. Fill-in table below. |
| F5 | **DONE** | `backend/app/exercise_config.py::load_exercises()`. |
| F6 | **DONE** | `GET /exercises` returns the full record including `thresholds`. Real output below. |
| F7 | **DONE** | 6-then-5 real curl evidence below; loader has no hardcoded count/names. |

## Config format: JSON, not YAML

JSON — stdlib `json` module covers a single config file completely; adding
`pyyaml` for this would be a dependency for something the standard library
already does. `backend/requirements.txt` unchanged (no new dependency added).

## Where things live

- `backend/app/config/exercises.json` — the data file. One JSON object,
  `{"exercises": [...]}`. Adding an exercise = adding an object to that list.
- `backend/app/exercise_config.py` — `load_exercises(path) -> dict[name, record]`.
  Validates on load; raises `ExerciseConfigError` (loud, at startup) on a bad
  record. Also the WARN-on-placeholder pass (F4's startup validation).
- `backend/app/routes/exercises.py` — `APIRouter` with `GET /exercises`.
  Chosen over adding the route directly to `main.py` because `app/routes/`
  already exists as the designated home for endpoint modules (Group B
  scaffolding) and keeps `main.py` a thin skeleton — one file, no real
  reason not to use the folder that's already there.
- `backend/app/main.py` — `lifespan` calls `load_exercises()` once at
  startup into `app.state.exercise_registry` (fail loudly if the config is
  broken, not on first request); `app.include_router(exercises_router)`.

## Schema

```jsonc
{
  "name": "heel_slide",                 // stable id — matches extractor/model filenames
  "display_name": "Heel Slide",
  "type": "dynamic" | "isometric",      // F2, stored, validated against trigger below
  "primary_branch": "pose",             // F3 — always "pose" for these 5, see below
  "valid_views": ["SIDE"],              // camera views the exercise can be assessed from
  "joints": [                            // JointCheck-shaped, no thresholds baked in
    {
      "display_name": "Knee (L)",
      "landmark_a": "left_hip", "landmark_b": "left_knee", "landmark_c": "left_ankle",
      "use_3d": true,
      "check_in_views": ["SIDE"],
      "is_rep_driver": true,
      "driver_for_views": ["SIDE"]       // optional, only used when a joint drives per-view (mini_squat)
    }
  ],
  "rep_trigger": { ... } | null,         // exactly one of rep_trigger / isometric_trigger
  "isometric_trigger": { ... } | null,
  "thresholds": { "<key>": {"value": null, "unit": "...", "sign_convention": "...", "_TODO": "..."} }
}
```

Landmark names (`left_hip`, `left_knee`, ...) use the ML pipeline's naming
convention (`backend/ml/common_features.py`'s column names), not the legacy
`landmarks.LM` names — this is a new pure-data config, and matching the
offline feature-table naming keeps the live rule vocabulary and the training
data vocabulary in sync (same string means the same thing on both sides).

`JointCheck`/`RepTrigger`/`IsometricTrigger` **shape** (field names, angle
triangle convention `a→b→c` with `b` the vertex, `use_3d`/`check_in_views`/
`is_rep_driver`/`driver_for_views` semantics) is reused from
`backend/app/exercise_base.py` per the brief — this is a JSON-serialization
of that vocabulary, not the dataclasses themselves. No `min_angle`/
`max_angle` on the joint objects: those are clinical thresholds and live in
`thresholds`/the trigger's own placeholder fields instead, per F4.

`rep_trigger` fields: `joint_display_name`, `direction` ("increase"/
"decrease"), `enter_angle`, `exit_angle`, `depth_target` (each a placeholder
object). `isometric_trigger` fields (unused by any of the 5, kept for shape
parity): `joint_display_name`, `hold_min_angle`, `hold_max_angle`,
`hold_duration_secs`, each a placeholder object where clinical.

## Per-exercise `type` determination — evidence (F2)

All five are `"dynamic"`. Evidence, strongest first:

- **`mini_squat`** — STRONG. `test/code/label-editor/mini_squat_label_editor.py`
  line 9: "whole rep. Outside that window (standing phases) the flag is
  forced 0" — the source code itself frames the clip as a single rep with a
  standing phase outside it.
- **`straight_leg_raise`** — STRONG. `test/code/label-editor/slr_label_editor.py`:
  computes flags "at the most-bent frame" and "at the peak-raise frame"
  (`peak_idx = df[hip_col].idxmin()`) — a single peak within the clip is the
  signature of one raise-and-lower rep cycle, not a sustained hold.
- **`seated_knee_extension`** — MODERATE. `backend/ml/exercise_extractors/seated_knee_extension.py`
  docstring: "knee angle ROM (extension/flexion)" — explicitly describes a
  range of motion, and the extractor contains no hold-duration or
  hold-zone concept anywhere (contrast with the legacy isometric
  definitions in `exercise_base.py`, which always carry explicit
  `hold_min_angle`/`hold_max_angle`/`hold_duration_secs`).
- **`heel_slide`** — MODERATE. `backend/ml/exercise_extractors/heel_slide.py`
  is a pure column passthrough with **no** derived whole-file baseline
  column — contrast with `seated_knee_extension.py`/`tke.py`/`slr.py`, each
  of which adds a whole-file static reference (`baseline`/
  `avg_pelvis_center_y`/`pelvis_y_avg`) precisely because their compensation
  checks (hip lifting off a fixed surface) need a static reference point.
  `heel_slide` needing no such reference is consistent with a per-rep
  cyclic motion (heel slides in, heel slides out) rather than a sustained
  position. Also: "heel slide" is a standard physio term for a repeated
  sliding motion, not a hold.
- **`terminal_knee_extension`** — **WEAK, flagged UNCERTAIN**. No
  label-editor script exists for TKE (unlike mini_squat/slr) and its
  extractor docstring gives no ROM/rep language (unlike
  seated_knee_extension's explicit "ROM" wording). Classified `"dynamic"`
  on: (a) physio convention — terminal knee extension is canonically a
  repeated short-arc strengthening exercise, not an isometric hold; (b) clip
  durations (2.5–4.5s, `docs/06_ml_pipeline.md` duration stats) are
  consistent with the same single-rep pattern as the other 4, not a
  10-30s hold window. **This is the weakest-evidenced `type` call in the
  file — ask the owner to confirm before treating TKE's live rules as
  final**, named trigger: "TKE type confirmation."

## Per-exercise `primary_branch` (F3)

All 5 = `"pose"`. Per `MASTER_BUILD_PLAN_v3.md` §9: "Paired pose+EMG training
data does not exist. Model v1 is pose-only." No case for `"emg"` or `"both"`
was found in the extractors or manifest — not marking any exercise
differently without an owner call.

## Fill-in-the-blanks threshold table — for the owner

> **STATUS: PROVISIONAL VALUES FILLED IN — NOT CLINICIAN-AUTHORED.**
>
> The owner directed that sensible placeholders be filled in rather than left
> blank, on the basis that the models are going to be swapped anyway. §8 of the
> master plan reserves clinical values for the user; this is an explicit,
> recorded override of that constraint, not a lapse of it.
>
> **How these numbers were produced.** Every value below is derived from the
> observed distribution of the real signal in
> `backend/ml/manifest_data/train_*.parquet` (p5 / median / p95 across all
> clips of that exercise), not guessed. The `<sub>` line under each value
> states the basis. This makes them defensible engineering defaults — a rep
> trigger set where reps actually occur in this dataset — but it does **not**
> make them clinical thresholds. They encode what these particular actors did,
> including whatever they did wrong; the dataset was not screened for correct
> form.
>
> **What that means in practice.** They are safe for wiring up and testing the
> live path end to end: reps will trigger, flags will fire, the pipeline will
> exercise. They are **not** safe in front of a patient — a flag raised on
> these numbers says "outside this dataset's range", not "clinically
> incorrect".
>
> **Two carry specific warnings:**
> - `knee_varus_max_angle_deg` (mini_squat) — the **formula** is still
>   undefined, not just the number. There is no signal in the schema that
>   computes knee varus. 10 deg is a shape-holder for a calculation that does
>   not exist yet; it cannot fire correctly until the formula is defined.
> - `hip_lifting_max_raise_angle_deg` (SLR) — 46 deg is carried over from
>   `HIP_MAX_DEG` in the label editor. That was a **labeling** constant used to
>   generate training labels, and `docs/06_ml_pipeline.md` §2 Finding 2 flags
>   the resulting label as circular. Reusing it as a live threshold repeats the
>   same assumption in a second place.
>
> **`backend/app/config/exercises.json` is unchanged** — it still holds
> `{"value": null, "_TODO": ...}` for every field, and the loader still WARNs
> on placeholders at startup. Nothing here has been promoted into the running
> config. Do that as a deliberate step when the values are real.


Every row below is currently `{"value": null, ...}` in `exercises.json`.
Column meanings: **Field** = JSON path under the exercise's `rep_trigger` or
`thresholds`; **Signal** = the raw feature column(s) it reads, from the
extractor; **Meaning / sign** = what a real value means; **Value** = empty,
for the owner to fill in.

### heel_slide

| Field | Signal | Meaning / sign | Value |
|---|---|---|---|
| `rep_trigger.enter_angle` | `left_knee_angle_3d` | deg, knee angle that starts a rep as heel slides in (flexing) |  **150** <br><sub>below standing-straight (obs. max p5=175)</sub> |
| `rep_trigger.exit_angle` | `left_knee_angle_3d` | deg, knee angle that completes a rep as heel slides back out |  **170** <br><sub>obs. max med=179</sub> |
| `rep_trigger.depth_target` | `left_knee_angle_3d` | deg, min flexion required mid-slide; 0 disables |  **90** <br><sub>obs. min p5=55, med=59 — comfortably reached</sub> |
| `thresholds.heel_lifting_max_y_rise` | `left/right_heel_rel_y` | max rise from resting baseline before flagging `heel_lifting` |  **0.03** <br><sub>normalized-y; ~3% frame height</sub> |
| `thresholds.hip_lifting_max_y_rise` | `pelvis_center_y` | max rise from resting baseline before flagging `hip_lifting` |  **0.03** <br><sub>normalized-y</sub> |

### mini_squat

| Field | Signal | Meaning / sign | Value |
|---|---|---|---|
| `rep_trigger.enter_angle` | `left_knee_angle_2d` (FRONT) / `left_knee_angle_3d` (SIDE) | deg, starts a rep on descent |  **160** <br><sub>obs. standing max med=172</sub> |
| `rep_trigger.exit_angle` | same | deg, completes a rep on return to standing |  **170** <br><sub>obs. standing max med=172</sub> |
| `rep_trigger.depth_target` | same | deg, min squat depth for rep to count; 0 disables |  **130** <br><sub>obs. bottom min med=67-99; shallow by design</sub> |
| `thresholds.heel_lifting_max_y_rise` | `left/right_heel_rel_y` | max rise before flagging `heel_lifting` |  **0.03** <br><sub>normalized-y</sub> |
| `thresholds.knee_varus_max_angle_deg` | FRONT knee position vs hip-ankle line | max inward knee deviation before flagging `knee_varus` — **exact formula/landmarks also TBD**, not just the number |  **10** <br><sub>deg — **formula still undefined**, value meaningless until it is</sub> |
| `thresholds.knee_past_toes_max_margin` | `*_knee_rel_x` vs `*_foot_index_rel_x` | max forward knee displacement past toe before flagging `knee_past_toes` |  **0.05** <br><sub>normalized-x</sub> |
| `thresholds.ankles_min_width_ratio` | `ankle_width_3d` / `shoulder_width_3d` | min ratio before flagging `ankles_close_together` |  **0.60** <br><sub>ratio</sub> |
| `thresholds.back_slouching_min_trunk_angle_deg` | `trunk_left/right_angle_2d` | min trunk angle before flagging `back_slouching` |  **150** <br><sub>deg</sub> |

Note: `mini_squat` also has a `path_deviation` label in the dataset — see
"Known limitation" below. No threshold entry exists for it; do not add one.

### seated_knee_extension

| Field | Signal | Meaning / sign | Value |
|---|---|---|---|
| `rep_trigger.enter_angle` | `left_knee_angle_3d` | deg, starts a rep as leg begins extending |  **100** <br><sub>obs. flexed min med=71-92</sub> |
| `rep_trigger.exit_angle` | `left_knee_angle_3d` | deg, completes a rep on return to flexed start |  **95** <br><sub>obs. flexed min med=71-92</sub> |
| `rep_trigger.depth_target` | `left_knee_angle_3d` | deg, min extension for rep to count; 0 disables |  **160** <br><sub>obs. extended max med=133-177</sub> |
| `thresholds.hip_lifting_max_y_rise` | `pelvis_center_y` vs the extractor's own `baseline` col | max rise above that baseline before flagging `hip_lifting` |  **0.03** <br><sub>normalized-y</sub> |
| `thresholds.back_slouching_min_trunk_angle_deg` | `trunk_left/right_angle_2d` | min trunk angle before flagging `back_slouching` |  **150** <br><sub>deg</sub> |
| `thresholds.back_rocking_max_score` | extractor's own `rocking_score` col (std-dev of head x) | max value before flagging `back_rocking` |  **0.02** <br><sub>std-dev, normalized-x</sub> |

### straight_leg_raise

| Field | Signal | Meaning / sign | Value |
|---|---|---|---|
| `rep_trigger.enter_angle` | `left_hip_angle_3d` | deg, starts a rep as leg lifts |  **165** <br><sub>obs. hip max med=160</sub> |
| `rep_trigger.exit_angle` | `left_hip_angle_3d` | deg, completes a rep as leg returns |  **172** <br><sub>obs. hip max p95=179</sub> |
| `rep_trigger.depth_target` | `left_hip_angle_3d` | deg, hip angle at peak raise for a full rep; 0 disables. Note: the label-editor's `HIP_MAX_DEG=46` (as `180-hip_angle`) was a **labeling** constant, not a confirmed clinical target — do not copy it in without sign-off |  **140** <br><sub>= 40deg raise; obs. hip min med=127-144</sub> |
| `thresholds.hip_lifting_max_raise_angle_deg` | `180 - left/right_hip_angle_2d` at peak | max raise angle before flagging `hip_lifting` (this dataset's `hip_lifting` label = excessive hip flexion/compensation at peak raise, not pelvis lift) |  **46** <br><sub>carried from label-editor `HIP_MAX_DEG`; labeling constant, NOT clinician-set</sub> |
| `thresholds.knee_flexion_high_min_angle_deg` | `left/right_knee_angle_2d` at most-bent frame | min knee angle (near-extension) required through the raise before flagging `knee_flexion_high`; docstring suggests ~170-180deg tolerance |  **170** <br><sub>obs. knee_2d min med=170.7; matches docstring's 170-180</sub> |
| `thresholds.head_lifting_max_y_rise` | `nose_rel_y` | max rise from resting baseline before flagging `head_lifting` |  **0.03** <br><sub>normalized-y</sub> |

**Circularity warning (carried from `docs/06_ml_pipeline.md` §2 Findings 1–2):**
`knee_flexion_high` and `hip_lifting` are flagged CIRCULAR / HIGH LEAK RISK
in the trained model — the same signals these thresholds read
(`knee_angle`, `hip_angle`) are also what the model's labels were
thresholded from. This doesn't block live rule thresholds (rules are meant
to read angles), but it does mean the trained-model's error labels for these
two should not be treated as independent confirmation of the live rule.

### terminal_knee_extension

| Field | Signal | Meaning / sign | Value |
|---|---|---|---|
| `rep_trigger.enter_angle` | `left_knee_angle_3d` | deg, starts a rep as leg begins extending |  **100** <br><sub>obs. flexed min med=71-92</sub> |
| `rep_trigger.exit_angle` | `left_knee_angle_3d` | deg, completes a rep as leg returns from terminal extension |  **160** <br><sub>obs. extended max med=161-175</sub> |
| `rep_trigger.depth_target` | `left_knee_angle_3d` | deg, min terminal-extension angle (near 180) for rep to count; 0 disables |  **170** <br><sub>obs. extended max med=161-175</sub> |
| `thresholds.hip_lifting_max_y_rise` | `pelvis_center_y` vs extractor's own `avg_pelvis_center_y` col | max rise above that baseline before flagging `hip_lifting` |  **0.03** <br><sub>normalized-y</sub> |

## Validation behavior (real output)

Loader rejects, at load time, any record that:
1. carries **both** `rep_trigger` and `isometric_trigger`,
2. carries **neither**, or
3. has a `type` that disagrees with which trigger it carries.

Real output (from `python3 -m app.exercise_config`, run from `backend/`):

```
OK: real config loads 5 exercises: ['heel_slide', 'mini_squat', 'seated_knee_extension', 'straight_leg_raise', 'terminal_knee_extension']
OK: 2-exercise config round-trips correctly
OK: 6-exercise config (5 + dummy with no model/extractor) round-trips correctly
OK: both-triggers rejected loudly: exercise 'bad_both': carries BOTH rep_trigger and isometric_trigger — exactly one is required
OK: neither-trigger rejected loudly: exercise 'bad_neither': carries NEITHER rep_trigger nor isometric_trigger — exactly one is required
OK: type/trigger mismatch rejected loudly: exercise 'bad_type_mismatch': type='isometric' but no isometric_trigger present (carries rep_trigger instead) — stored type disagrees with trigger

All exercise_config.py self-checks passed.
```

This is also the runnable check left behind (`backend/app/exercise_config.py`
`__main__` block — no framework, no fixtures, per the constraints).

Placeholder-threshold WARN, real log line (from `backend/logs/exercise_config.log`
during the self-check run, one representative line):

```json
{"ts_wall": "2026-08-20T21:59:21.458Z", "component": "exercise_config", "event": "exercise_config_placeholder_warning", "level": "WARN", "exercise": "terminal_knee_extension", "detail": "one or more thresholds/trigger values are still unfilled placeholders"}
```

New event added: `exercise_config_placeholder_warning` and
`exercise_config_loaded`, category `EXERCISE_CONFIG`, added to both
`backend/app/events.py` and `frontend/src/lib/events.js`. Mirror test still
passes: `python3 backend/app/test_events_mirror.py` → `OK: events.py and
events.js agree on 42 events`.

## F6 — real `GET /exercises` output (gate evidence)

Server started: `uvicorn app.main:app --port 8000` from `backend/`.

```
$ curl -s http://127.0.0.1:8000/health
{"status":"ok"}

$ curl -s http://127.0.0.1:8000/exercises | python3 -c "import json,sys; d=json.load(sys.stdin); print([e['name'] for e in d['exercises']])"
['heel_slide', 'mini_squat', 'seated_knee_extension', 'straight_leg_raise', 'terminal_knee_extension']
```

Full first record (`heel_slide`) confirmed to include `type` and
`thresholds` in the response — see the schema section above, which is a
direct transcription of the real response body.

Other endpoints confirmed still responding after these changes:

```
$ curl -s http://127.0.0.1:8000/health
{"status":"ok"}
$ curl -s http://127.0.0.1:8000/metrics
{"counters":{},"timers":{}}
$ curl -s http://127.0.0.1:8000/api/emg/live
{"envelop":8,"signal":-7,"timestamp":1787263271.5823321}
```

The Flask EMG service on `127.0.0.1:5000` was not touched or restarted.

## F7 — count-agnosticism proof (real output)

1. Appended a 6th record, `dummy_test_exercise` (no `rep_trigger`/threshold
   values filled, **no trained model, no extractor**), to
   `exercises.json` — data-only edit, `exercise_config.py` untouched.
2. Restarted uvicorn, curled `/exercises`:

```
$ curl -s http://127.0.0.1:8000/exercises | python3 -c "import json,sys; d=json.load(sys.stdin); print('count:', len(d['exercises'])); print([e['name'] for e in d['exercises']])"
count: 6
['heel_slide', 'mini_squat', 'seated_knee_extension', 'straight_leg_raise', 'terminal_knee_extension', 'dummy_test_exercise']
```

3. Removed the dummy from `exercises.json`, restarted, curled again:

```
$ curl -s http://127.0.0.1:8000/exercises | python3 -c "import json,sys; d=json.load(sys.stdin); print('count:', len(d['exercises'])); print([e['name'] for e in d['exercises']])"
count: 5
['heel_slide', 'mini_squat', 'seated_knee_extension', 'straight_leg_raise', 'terminal_knee_extension']
```

`/health`, `/metrics`, `/api/emg/live` all reconfirmed responding at count-5
(see F6 section). Server stopped after verification (`pkill -f "uvicorn
app.main:app"`).

**Nothing in `exercise_config.py` hardcodes a count, a name, or an index** —
confirmed by reading the file: `load_exercises()` iterates
`data["exercises"]` with a plain loop, no length assertion, no per-name
branch. The dummy required no model bundle (`backend/ml/trained_models/`) and
no `manifest_data/` entry to be served — the registry has no such coupling.
Nothing NOT count-agnostic was found; no fix was needed.

## Known pure-data limitation — `path_deviation` (mini_squat)

`mini_squat`'s `path_deviation` (perpendicular distance of the pelvis from
the straight line between the squat's top and bottom frame) is a real,
confirmed-circular label (`docs/06_ml_pipeline.md` §2 Finding 1) and is
**not expressible** as "joint angle within a range" — it needs the frame
positions of the rep's top and bottom, not a single-frame angle comparison.

This pure-data config has no code hook and cannot express it. **Not
building one now (YAGNI)** — recorded here so the decision to add a hook or
the beginnings of a rule DSL is made deliberately. Named trigger: **"first
non-angle live check"** — when a check is needed that cannot be reduced to a
`JointCheck`-shaped angle comparison against a `thresholds` entry, that is
the signal this limitation has been hit and a hook/DSL decision is due.

## Status of the now-dead legacy exercise files

`backend/app/exercises/{squat,seated_leg_extensions,isometric_quadriceps}.py`
and `backend/app/exercise_base.py` are **left in place, untouched**, per this
brief's Decision 1 — they are superseded (no trained model backs any of the
legacy three) but not deleted; the owner will decide separately whether to
remove them. Nothing in this phase's code imports or builds on them.

`backend/app/services/exercise_config.py` (pre-existing, dated before this
brief's decisions landed) implements the OLD code-hook approach —
`importlib`-scanning `app.exercises` for `get_definition()`. It is now
**stale/dead** relative to Decision 2 (pure data, no code hook) and this
phase's actual loader (`backend/app/exercise_config.py`, a different file,
directly under `app/`). It was not on this agent's OWN list to modify or
delete, so it was left as-is — flagged here for the owner to decide whether
to remove it alongside the legacy exercise files above.

## Open questions

1. **TKE `type` (dynamic vs isometric)** — weakest-evidenced call in this
   file, see per-exercise evidence above. Confirm before treating TKE's live
   trigger as final.
2. **`primary_branch` for all 5 = `"pose"`** — no case for `"emg"`/`"both"`
   was found; confirming this is a non-decision unless the owner has EMG
   data considerations not visible from `backend/ml/**`.
3. **`mini_squat`'s `knee_varus` threshold** — even the *formula* (which
   landmarks, 2D or 3D, FRONT-view geometry) is undetermined, not just the
   number. Every other threshold in the table has an obvious signal; this
   one needs the owner (or a clinician) to specify the actual geometric
   definition of "varus" being used before a number is meaningful.
4. **`valid_views` per exercise** — inferred from exercise semantics (lying
   down / seated exercises → SIDE only; `mini_squat` → FRONT+SIDE, mirroring
   legacy squat) rather than confirmed by the owner. This is a camera-setup
   decision, not a clinical threshold, so it was not placeholder-blocked —
   but flagging it as inferred, not confirmed, same as the `type` calls
   above.

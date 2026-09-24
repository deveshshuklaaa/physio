# VALIDATION TODO — unsigned clinical thresholds

**Status: BLOCKING for patient use. Not blocking for development.**

`backend/app/config/exercises.json` previously held `{"value": null, "_TODO": ...}`
for every threshold and rep trigger in the five ML-dataset exercises. Those
placeholders have now been filled with the dataset-derived values tabulated in
[`08_exercise_config.md`](08_exercise_config.md) so the live rule-based path can
run end to end.

**Nobody clinical has reviewed a single one of these numbers.**

They were derived from observed percentiles across a recording set that was
*not screened for correct form* — one actor, whatever they did, including
whatever they did wrong. A flag raised on these values means "outside this
dataset's observed range". It does **not** mean "clinically incorrect".

## What needs sign-off

Everything below. A clinician should confirm or replace each value, and each
alert string should be reviewed for wording a patient will act on correctly.

| Exercise | Fields awaiting sign-off |
|---|---|
| `heel_slide` | `rep_trigger.{enter,exit,depth}`, `heel_lifting_max_y_rise`, `hip_lifting_max_y_rise` |
| `mini_squat` | `rep_trigger.{enter,exit,depth}`, `heel_lifting_max_y_rise`, `knee_varus_max_angle_deg`, `knee_past_toes_max_margin`, `ankles_min_width_ratio`, `back_slouching_min_trunk_angle_deg` |
| `seated_knee_extension` | `rep_trigger.{enter,exit,depth}`, `hip_lifting_max_y_rise`, `back_slouching_min_trunk_angle_deg`, `back_rocking_max_score` |
| `straight_leg_raise` | `rep_trigger.{enter,exit,depth}`, `hip_lifting_max_raise_angle_deg`, `knee_flexion_high_min_angle_deg`, `head_lifting_max_y_rise` |
| `terminal_knee_extension` | `rep_trigger.{enter,exit,depth}`, `hip_lifting_max_y_rise` |
| all five | every `alert` string, and every `depth_insufficient_alert` |

`squat` is **excluded** — its values are real, transcribed from the legacy
`backend/_old_physio_reference/config.py` and documented in
[`03_legacy.md`](03_legacy.md) D5.

## Systematic: every 2D threshold is in a different space than it was derived in

`docs/08`'s 2D values come from `train_*.parquet` columns built by
`common_features.add_angle_2d`, which reads `p2()` — **normalized** landmark
x/y on a unit square (`common_features.py:54`). The live path measures the same
angle on **pixel** coordinates: `buildPts` projects to `[x*w, y*h]`
(`pose_engine.js:38`), an anisotropic stretch on any non-square frame. The two
disagree, and the amount depends on the camera's aspect ratio.

Measured at 16:9 for a hip-knee-ankle angle:

| normalized (parquet) | 16:9 pixels (live) | skew |
|---|---|---|
| 179.6 | 180.0 | +0.4 |
| 175.0 | 171.2 | −3.8 |
| 170.0 | 162.6 | −7.4 |
| 160.0 | 147.1 | −12.9 |
| 150.0 | 134.3 | −15.7 |
| 140.0 | 123.8 | −16.2 |
| 120.0 | 108.0 | −12.0 |
| 80.0 | 84.3 | +4.3 |

Worst case ≈ **16 degrees**, peaking exactly in the 140–160 band where the rep
triggers live. A 4:3 camera gives different numbers again, so the same config
behaves differently on different hardware.

This is inherited, not new: `buildPts` is a parity-locked port of the legacy
`math_utils.build_pts`, and `frontend/tools/parity_check.mjs` gates it to 6
decimals against the Python original. `squat` is unaffected because its
thresholds were tuned against pixel-space values in the legacy desktop app —
they are self-consistent. Only the five ML-dataset exercises mix the two spaces,
because their numbers came from the parquet.

**Not changed here.** Fixing it means either recomputing the 2D thresholds in
pixel space at a fixed reference aspect ratio, or making the live 2D checks use
normalized coordinates — the second breaks the parity gate. Either is a
deliberate decision, not a drive-by edit. Note that 3D thresholds are unaffected
(`angle3d` reads raw normalized landmarks on both sides).

## One that is measurably wrong: `back_slouching`

**`back_slouching_min_trunk_angle_deg` = 150 flags every clip in the dataset,
including the ones labelled correct.** This one should be treated as broken
rather than merely unvalidated.

It is the only row in `08_exercise_config.md`'s table with no observed
percentile cited beneath it — every other value carries an `obs.` note. Checked
against the training data it was supposedly derived from
(`backend/ml/manifest_data/train_*.parquet`):

| Exercise | `trunk_left_angle_2d` min, correct-form clips | slouching clips |
|---|---|---|
| `mini_squat` | median 94.9, p5 62.9, **max 103.6** | median 76.5 |
| `seated_knee_extension` | median 104.2, p5 95.5, **max 122.1** | median 121.8 |

Every clip in both sets sits below 150, so `min_trunk_angle < 150` fires on
100% of them — 40/40 correct mini_squat clips and 17/17 correct SKE clips. Live,
that is a red banner that never clears, which is exactly the failure mode
`thresholdValue()`'s null-guard exists to prevent.

Worse, **the sign is inverted for `seated_knee_extension`**: clips labelled
`back_slouching` have a *higher* trunk angle (121.8) than correct ones (104.2).
A "minimum angle" rule cannot separate them in that direction at any threshold.
For `mini_squat` the left and right trunk angles disagree with each other
(`trunk_right_angle_2d` min: 91.7 correct vs 1.0 slouching — the opposite
ordering to the left side).

**No threshold makes this formula work on this data.** What is needed is a
different signal, not a different number. The check is wired and shipping as
specified (`min(trunk_left, trunk_right) < threshold`, matching
`common_features.py:327`) so the decision is visible rather than quietly
dropped, but until it is redefined:

- `mini_squat` and `seated_knee_extension` will raise "Back rounding — chest up"
  / "Back slouching — sit tall" continuously.
- The one-line mitigation is to remove `"back_slouching"` from those two
  exercises' `extra_checks` arrays in `exercises.json`. Every other check for
  both exercises keeps working.

## Three that carry extra warnings

1. **`mini_squat.knee_varus_max_angle_deg` = 10** — `08_exercise_config.md`
   recorded that the *formula* was undefined, not just the number. A formula was
   chosen during implementation: `180 - angle2d(hip, knee, ankle)` in FRONT
   view, i.e. the knee's angular deviation from the straight hip→ankle line.
   That is a reasonable reading of the doc's "FRONT knee position vs hip-ankle
   line", but it was picked by a developer, not a clinician. **Both the formula
   and the 10 deg need review**, and note that "varus" (knees bowing out) is the
   opposite sign to the `knee_cave` valgus check squat uses — the current
   implementation is unsigned and fires on deviation in either direction.

2. **`straight_leg_raise.hip_lifting_max_raise_angle_deg` = 46** — carried from
   `HIP_MAX_DEG` in the label editor. That was a **labeling** constant used to
   generate training labels, and [`06_ml_pipeline.md`](06_ml_pipeline.md) §2
   Finding 2 flags the resulting label as circular. Reusing it as a live
   threshold repeats the same assumption in a second place.

3. **`straight_leg_raise.knee_flexion_high_min_angle_deg` = 170** — same
   circularity family (§2 Finding 1). The live rule reads the same knee angle
   the training label was thresholded from, so the trained model can never serve
   as independent confirmation of this rule.

## Also unvalidated: the rep triggers

`enter_angle` / `exit_angle` / `depth_target` are dataset-derived too. They will
make reps trigger and the pipeline exercise, which is what they were promoted
for. They encode the range these particular actors moved through — not a
prescribed range of motion.

## Where the numbers live

- Config: `backend/app/config/exercises.json` (each entry carries
  `"source": "docs/08_exercise_config.md threshold table (dataset-derived, NOT clinician-signed)"`)
- A top-level `_validation_warning` key in that same file repeats this warning
  for anyone reading the config directly.
- Derivation and observed percentiles: [`08_exercise_config.md`](08_exercise_config.md)

## Definition of done

Replace each `source` string with a real provenance (clinician name/date, or a
cited guideline), delete the `_validation_warning` key, and delete this file.

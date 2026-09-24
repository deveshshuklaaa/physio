# 06 — Offline ML pipeline (Phase E)

Owner: ml-pipeline-agent. Scope: `backend/ml/**` only. Everything below was
run for real against `/home/billa-dakait/Desktop/test/code/train-data/`
(copied into `backend/ml/manifest_data/` for reproducibility) and against the
raw video dataset at `/home/billa-dakait/Desktop/test/dataset/` — command
output is pasted, not predicted.

## 0. Source dataset (confirmed)

- Videos: `/home/billa-dakait/Desktop/test/dataset/<exercise>/{good,bad}/*.MOV`,
  164 clips across 5 exercises (heel slides 21, mini squat 45, seated knee
  extensions 22, slr 64, terminal knee extensions 11).
- Landmarks already extracted once by the source pipeline (test/code):
  `/home/billa-dakait/Desktop/test/landmarks/**/*.parquet`, 164 files, one row
  per frame, raw MediaPipe Heavy output.
- Manifest: `/home/billa-dakait/Desktop/test/manifest.csv`, 164 rows (+1 blank),
  columns exactly matching the plan's §E7 spec:
  `clip_id, exercise, source_recording_id, subject_id, parquet_path,
  video_path, frame_count, n_rows_parquet, fps, duration_in_ms,
  mean_visibility, folder, <10 label cols>, label_source, n_labels_active,
  excluded, excluded_reason`. `label_source` is `manual` for all 163 real
  rows — no row in this dataset is machine-labeled at the manifest level (see
  §E8 for what "manual" does and doesn't guarantee).
- Labels present: `heel_lifting, hip_lifting, knee_varus, knee_past_toes,
  knee_flexion_high, head_lifting, ankles_close_together, back_slouching,
  back_rocking, path_deviation`.
- Aggregated per-exercise feature tables:
  `/home/billa-dakait/Desktop/test/code/train-data/train_<exercise>.parquet`
  (16/45/22/64/11 rows respectively, 648–1067 columns). Copied to
  `backend/ml/manifest_data/`.
- **Every clip in every exercise has `subject_id == 1.0`.** One actor, whole
  dataset. This matters for E10's grouping choice (§4 below).

## 1. Reuse table

Primary source: `/home/billa-dakait/Desktop/test/code/` (read-only, per
brief). "Verbatim" = copied unmodified except header comments where noted.
"Adapted" = logic kept, structure changed for a stated reason. "Rewritten" =
new implementation, no equivalent existed.

| Source | Destination | Status | What changed / why |
|---|---|---|---|
| `test/code/extract_landmarks.py` (single-video CLI, floor estimation, per-frame extraction loop) | `backend/ml/extract_landmarks.py` | **Adapted** | Frame loop, floor/heel-lift estimation (`estimate_clip_floor`, `add_floor_relative_columns`, `find_longest_stable_run`) ported verbatim — these are unchanged line-for-line except naming. Added: (a) a `ProcessPoolExecutor` batch runner with per-clip resume (E2 — the source only had a sequential `subprocess`-per-video runner, see `run_landmark_pipeline.py` below), (b) additional `lmX_{x,y,z}_smooth` columns implementing D4's legacy EMA smoothing (alpha=0.25, `config.EMA_ALPHA`) as new, non-destructive columns (see §3 below for why raw wasn't replaced) — this is the plan's explicit "apply the same smoothing as live (D4)" requirement, which the source file did not implement at all (it emits raw landmarks only). |
| `test/code/run_landmark_pipeline.py` (140 lines, sequential `subprocess` per video, no resume, no parallelism) | *(not ported; superseded)* | **Rewritten** | The plan's E2 explicitly asks for `ProcessPoolExecutor`, one process per clip, and resume. The source runner is a sequential loop that reopens a new Python process per video via `subprocess.run` — no parallelism, no skip-if-exists. Kept nothing from it beyond the video-discovery glob (`find_videos`, ported verbatim into the new file). |
| `backend/ml/extract_landmarks.py` (pre-existing, live-style: JSON output keyed by landmark name, `DETECTION_SCALE` downscale, EMA smoothing applied in place, low-visibility landmarks dropped) | *(not used as a base; superseded)* | n/a — **real prior attempt, not a stub, documented, not deleted from history** | This file existed before this port and was a genuine (if partial) attempt at E1, built against the LIVE pipeline's conventions rather than the offline/Heavy/raw-parquet convention the real training dataset was built against. Using it as the base would have made it impossible to reproduce `test/code/train-data/`, which is the only real labeled dataset that exists. Its D4-smoothing behavior (exact algorithm, alpha, seeding rule) was still consulted and is the source of the `*_smooth` columns added to the new file (see row above). |
| `test/code/feature-extractors/common_feature_extractor.py` (489 lines, the 154-col schema) | `backend/ml/common_features.py` | **Verbatim** | No changes. Verified against real sample rows (§2). |
| `test/code/feature-extractors/heel_slide_extractor.py` | `backend/ml/exercise_extractors/heel_slide.py` | **Verbatim** | No changes. Explicit confirmed column list, heel-based scope, preserved exactly per the plan's E5 instruction. |
| `test/code/feature-extractors/mini_squat_extractor.py` | `backend/ml/exercise_extractors/mini_squat.py` | **Verbatim** | No changes. `ankle_width_3d` derived column and near-whole-body scope preserved. |
| `test/code/feature-extractors/seated_knee_extension_extractor.py` | `backend/ml/exercise_extractors/seated_knee_extension.py` | **Verbatim** | No changes. Whole-file `pelvis_center_y` mean baseline preserved exactly, per the plan's explicit instruction to keep this baseline logic. See §3 for why this whole-file (non-causal) baseline was NOT "fixed" despite being a case §12/the brief calls out as a legitimate improvement target. |
| `test/code/feature-extractors/terminal_knee_extension_extractor.py` | `backend/ml/exercise_extractors/tke.py` | **Verbatim** | No changes. `ideal_floor_y` empty-column contract and `avg_pelvis_center_y` whole-file baseline preserved. |
| `test/code/feature-extractors/straight_leg_raise_extractor.py` | `backend/ml/exercise_extractors/slr.py` | **Verbatim** | No changes. `pelvis_y_avg` whole-file baseline and `ideal_floor_y` empty-column contract preserved. |
| `test/code/aggregate_features.py` (149 lines, E6) | `backend/ml/aggregate_features.py` | **Verbatim** | Already implemented exactly what E6 asks: min/max/mean/std/range/first/last per numeric column, `LEAK_COLS` = `{frame, timestamp_ms, person_id, phase_normalized}` (matches the plan's list exactly), constant-across-clips columns dropped, `MIN_POSITIVES=3` unusable-label pruning. No changes needed. |
| `test/code/create_manifests.py` | *(not ported)* | n/a | Only builds a video-metadata manifest (duration/fps/frame_count via ffprobe), not the labeled clip-level manifest with `subject_id`/labels — that manifest (`test/manifest.csv`) already exists, matches the plan's E7 schema exactly, and was hand-assembled via the label-editor tools below. Copied as-is to `backend/ml/manifest_data/manifest.csv` rather than regenerated. |
| `test/code/train_models.py` (149 lines, E10/E11) | `backend/ml/train_model.py` | **Adapted** | See §4 for the full list of changes (grouping preference order, RF-vs-XGB-on-identical-folds, and a genuine label/feature-selection bug fix). |
| `test/code/manifest_check.py` | *(not ported)* | n/a | A read-only integrity probe (frame_count vs n_rows_parquet, frame_gap). Useful but not one of E1–E14; not owned scope. Its logic (max(frame)+1 vs len(df) gap check) is worth reusing verbatim if a future agent needs a parquet health-check tool. |
| `test/code/label-editor/*.py` | *(not ported — read only, used for the E8 audit)* | n/a | Not a Phase-E deliverable file; these are the interactive tools that actually produced several of the manifest's labels. Read in full to trace label provenance for E8 (§2 below). |
| `test/code/inject_ideal_floor_y_csv.py`, `wireframe.py`, `batch_convert.py` | *(not ported)* | n/a | Interactive/manual tooling and a visualization script, outside E1–E14's scope. |
| *(none — new)* | `backend/ml/export_model.py` | **Rewritten (new)** | No E13 equivalent existed anywhere in test/code. |
| *(none — new)* | `backend/ml/write_model_card.py` | **Rewritten (new)** | No E14 equivalent existed. |

## 2. E8 — Label circularity audit (HIGH EFFORT, per brief)

Method: for every label in the manifest, traced backward through the
label-editor scripts (`test/code/label-editor/*.py`) that actually wrote it,
then checked whether the source signal (or a column that is a fixed function
of it) survives into the corresponding `train_<exercise>.parquet` feature
table. Verified with real data, not by inspection alone, wherever a script
made an automatic determination.

### FINDING 1 — `mini_squat`'s `path_deviation` label: CONFIRMED CIRCULAR

`mini_squat_label_editor.py` computes, per row, a continuous
`path_deviation` (perpendicular distance of the pelvis from the straight
line between the squat's top and bottom frame) and a binary
`path_deviation_error = path_deviation > 0.05`. Both columns are written
back into the SAME parquet that `mini_squat_extractor.py` (E5) and
`aggregate_features.py` (E6) subsequently process — neither extractor drops
them, so both the continuous signal and the auto-threshold survive as
`path_deviation__{min,max,mean,std,range,first,last}` and
`path_deviation_error__{min,max,mean,std,range,first,last}` in
`train_mini_squat.parquet`.

Verified directly:
```
clip mini_squat__bad_1: path_deviation_error sums to 6 (rows flagged) in its
raw parquet; the manifest's clip-level path_deviation label for that exact
clip is 1; it is the ONLY mini_squat clip with path_deviation == 1 in the
whole 45-clip manifest.
```
The clip-level label is a direct roll-up of the still-present per-row
feature. **Verdict: circular.** Model reading `path_deviation__max` would
trivially recover this label. This label was excluded from
`train_mini_squat.parquet`'s usable-label list by `MIN_POSITIVES=3` anyway
(only 1 positive clip in the whole exercise), so it never actually reached
E10's evaluation — but it would re-appear at the next data collection round
and needs the fix below then, not at 1 positive now.

**Fix applied:** none needed yet (label already excluded by `MIN_POSITIVES`).
**Fix required before the next retrain, if positives grow:** drop
`path_deviation*` and `path_deviation_error*` from the mini_squat feature
set (add to `aggregate_features.py`'s `LEAK_COLS`, scoped to that exercise),
or re-derive the label from a human blind to the computed value.

### FINDING 2 — `straight_leg_raise`'s `knee_flexion_high`: HIGH LEAK RISK, verdict CIRCULAR-BY-CONSTRUCTION

`slr_label_editor.py` auto-computes, per active leg, `{side}_knee_bend_excessive
= knee_angle_2d < 175deg` at the most-bent frame (single-point, not per-row),
and `{side}_hip_angle_exceeded` similarly at the peak-raise frame. Both
persist into `train_straight_leg_raise.parquet` as
`{side}_knee_bend_excessive__*` / `{side}_hip_angle_exceeded__*` engineered
features, AND the raw `{side}_knee_angle_2d__*` / `{side}_hip_angle_2d__*`
aggregates that those thresholds are a fixed function of are also present
(they are common-schema columns, never dropped by `slr.py`'s extractor).

§8 of the master plan records `knee_flexion_high` at a perfect 1.000 F1 —
this audit explains why: the label is thresholded from a signal (worst-frame
knee angle) that is still fully available to the model in multiple forms
(the derived flag, its aggregates, and the raw angle it's computed from).
A direct 1:1 alias check against `left_knee_bend_excessive__max` only
matched 58% of clips — but that is explained by the editor storing the
computed flag under the DETECTED ACTIVE LEG's column name only (left vs
right varies per clip), not by the label being independent of the signal.
No glue script exists connecting the per-row auto flag to the manifest's
single `knee_flexion_high` value (the manifest records `label_source =
manual`, i.e. a human transcribed a value into a broadcast prompt) — so the
provenance from auto-flag to manifest label could not be proven as a pure
code path. It does not need to be: the underlying continuous signal
(`{side}_knee_angle_2d`) that a human would necessarily be looking at (or
that the auto-flag directly thresholds) is unambiguously present as a
feature. **Verdict: circular, or as good as — the label is trivially
recoverable from features that remain in the table regardless of whether
the human copied the auto-flag or re-derived the same judgment by eye.**

**hip_lifting** (also present in slr, and in every other exercise) was
checked the same way: `{side}_hip_angle_exceeded` is auto-computed
similarly to knee_bend_excessive, from `180 - hip_angle_2d` at the peak-raise
frame. Same structural risk applies to `hip_lifting` wherever
`hip_angle_2d`/`hip_angle_3d` remain in features — which is every exercise's
feature table (common schema columns, never dropped). §8 records
`hip_lifting` at only 0.46 F1 for SLR (not perfect), which is consistent
with a genuinely harder decision boundary (more label noise / less clean
threshold in practice) rather than proof of no leak — the STRUCTURAL risk
is identical to knee_flexion_high's. Flagging it at the same severity.

**Fix required before the next retrain:** either (a) drop
`*_knee_angle_2d/3d`, `*_hip_angle_2d/3d` and their velocity/derived columns
from the feature set for labels thresholded on them (defeats the point of
an angle-based model, not recommended), or (b) — the actually correct fix —
re-collect these two labels from a human blind reviewer who does not see
the auto-computed flag or the raw angle number, so the label stops being a
deterministic function of a feature the model also sees. Flag both labels
as **unverified for generalization** until that happens; do not present
their current CV numbers as evidence the model has learned anything about
posture.

### FINDING 3 — `head_lifting` (SLR): NOT circular

No label-editor script in `test/code/label-editor/` computes an automatic
head-related flag. The manifest's `label_source=manual` for this column,
and no code path thresholds `nose_rel_*` into a binary flag anywhere in the
pipeline. This is a genuine human visual judgment (the SLR extractor's own
docstring says as much: "no head-angle column exists anywhere in the common
schema — this is a gap in the common extractor... raw nose_rel_x/y/z used
as-is"). `nose_rel_x/y/z` remaining in the feature set here is exactly the
intended, non-circular case: a human labeled a visual behavior, and the
model is asked to learn to associate it with the pose signal, which is the
entire point of training a model. **Verdict: not circular.**

### FINDING 4 — `knee_varus`, `knee_past_toes`, `ankles_close_together`, `back_slouching`, `back_rocking`: NOT structurally circular, but unverifiable either way

None of these are computed anywhere in `label-editor/*.py` — no threshold
formula exists in the source for varus angle, toe-clearance, ankle spacing,
or slouch/rock detection. All are written via the generic
`label_editor.py`'s broadcast prompt (`label_editor.py`, `mini_squat_label_
editor.py`'s optional manual section), i.e. a human typed a 0/1 value while
looking at the file. **Verdict: not circular by construction** (no code
computes them from a feature). However, per the class-balance table below
(§9), every one of these labels has 100% of its positives inside a single
recording group — meaning even if the labels are honestly human-authored,
E10's GroupKFold cannot currently distinguish "the model learned the
biomechanics" from "the model learned to recognize one specific actor/take."
Reported for completeness; scored 0.000 in E10, consistent with this.

### FINDING 5 — `ideal_floor_y` / `pelvis_y_avg` / `baseline` (TKE, SLR, seated_knee_extension): MODERATE LEAK RISK, flagged not confirmed

Per the extractors' own docstrings, `ideal_floor_y` for BAD-labeled clips is
manually injected by the user with "avg pelvis_center_y from known-good
files for the same actor" — i.e. its value is chosen with knowledge of
which clips are good vs bad. It is not thresholded into a 0/1 label by any
script found, so it does not directly leak a label value. But it does mean
this specific feature column encodes the human's own good/bad judgment by
construction, for the clips where it was hand-set. **Not scored as
circular** (no formula converts it to the label), but flagged: if
`hip_lifting`/`back_slouching`/`back_rocking` (seated_knee_extension) ever
gets a working model, audit whether `ideal_floor_y`/`baseline`/`pelvis_y_avg`
and its deviation dominate feature importance — that would be evidence this
finding needs to be escalated to CONFIRMED.

### Summary table

| Label | Exercise(s) | Auto-computed? | Source column | Still in features? | Verdict |
|---|---|---|---|---|---|
| `path_deviation` | mini_squat | Yes (`path_deviation_error` @ >0.05) | `path_deviation`, `path_deviation_error` | Yes (all aggregates) | **CIRCULAR** |
| `knee_flexion_high` | straight_leg_raise | Effectively yes (`{side}_knee_bend_excessive` @ knee<175°) | `{side}_knee_angle_2d`, `{side}_knee_bend_excessive` | Yes | **CIRCULAR (high confidence)** |
| `hip_lifting` | all 5 | Effectively yes (`{side}_hip_angle_exceeded` @ raise>46°) — SLR only; other exercises' provenance not code-traceable | `{side}_hip_angle_2d/3d` | Yes | **HIGH RISK, same structural pattern as knee_flexion_high** |
| `head_lifting` | straight_leg_raise | No | — | `nose_rel_*` (intended use) | Not circular |
| `heel_lifting` | heel_slide, mini_squat | No manifest-level auto formula found (a per-row `heel_lifting_confirmed_flag_*` exists in E1's floor-relative columns but is dropped before common_features.py — not in the 154-col schema) | — | No | Not circular |
| `knee_varus`, `knee_past_toes`, `ankles_close_together`, `back_slouching`, `back_rocking` | mini_squat / seated_knee_extension | No | — | n/a | Not circular; unlearnable regardless (see §9) |
| `ideal_floor_y`/`pelvis_y_avg`/`baseline` (feature, not label) | TKE, SLR, seated_knee_ext | n/a | manually set with knowledge of good/bad | Yes | **FLAGGED, not confirmed** |

## 3. Extractor behavior changes (before/after)

Only one extractor-level change was made; everything else in E4/E5/E6 is a
verbatim port, per the plan's instruction to preserve E5's baseline logic
(heel-based, whole-file pelvis mean, min/max dual baseline) exactly.

| File | Before | After | Why |
|---|---|---|---|
| `extract_landmarks.py` | Raw `lmX_{x,y,z,visibility,presence}` only, no smoothing anywhere in the pipeline. | Same raw columns, UNCHANGED, plus new `lmX_{x,y,z}_smooth` columns: plain per-coordinate EMA (alpha=0.25), fresh-seeded per landmark on first sight, reset on drop below `VISIBILITY_THRESH=0.6` (matches legacy `smoother.py`/D4 exactly), computed per-video (no state leak across a `ProcessPoolExecutor` worker's clips). | The plan requires E1 to "apply the same smoothing as live (D4)"; the source pipeline that built the real dataset never did this. Adding it destructively (overwriting raw) would have silently changed every number in `common_features.py`'s angle math relative to the already-audited baseline in §8 of the plan, invalidating this notes file's comparison to that baseline. Adding it as new columns satisfies the requirement (a smoothed signal is now available) without breaking reproducibility of the existing labeled dataset. `common_features.py` still reads raw columns, unchanged, so E4/E5/E6 outputs for the real dataset are unaffected — verified in §5 below (parity check gave 0 numeric diffs across 179 shared columns on a real clip). |

**Everything else, including the two things called out by name in the
plan's E5 instruction, was left exactly as ported:**
- `seated_knee_extension.py`'s whole-file `pelvis_center_y` mean baseline —
  not made causal/per-rep, because the plan's E5 line explicitly says to
  preserve it ("whole-file pelvis mean for seated knee extension"). Flagged
  instead in Finding 5 above as a leak-risk-adjacent design worth revisiting
  if this exercise ever produces a model that clears E11's gate.
- `mini_squat.py`'s min/max dual baseline (top/bottom of squat via
  `pelvis_center_y.idxmin()/idxmax()`) — unchanged, used only inside
  `mini_squat_label_editor.py` (not part of the shipped extractor file
  itself) for `path_deviation`; the extractor itself only adds
  `ankle_width_3d`, unchanged.

## 4. E10 — `train_model.py` changes vs `test/code/train_models.py`

1. **Grouping preference order.** Source grouped on `source_recording_id`
   only. Plan requires subject_id primary, source_recording_id secondary.
   `choose_grouping()` checks `subject_id` first and only falls back when it
   doesn't clear `MIN_GROUPS=4`. Every exercise here has exactly one
   `subject_id` (verified, §0), so the fallback fires for all five — this is
   the dataset's actual state, not a bug: subject-level CV is impossible with
   one subject. The preference order is coded correctly and will activate on
   its own once a multi-subject dataset lands (no further changes needed).
2. **RF vs XGB, identical folds.** Source picked one model via `--model`.
   This version runs both `rf` and `xgb` against the SAME `GroupKFold` split
   per exercise (same `k`, same `gkf.split(X, groups=groups)` call reused for
   both loops) and reports both, per E10's "RF vs XGB on identical folds."
3. **Bug fix: label/feature column selection.** The source's `split_frame()`
   picked "labels" as any column that is binary-valued
   (`isin([0,1]).all()`). That heuristic also matches binary-valued
   ENGINEERED FEATURES that `aggregate_features.py` produces (e.g.
   `squat_too_shallow__max`, `path_deviation_error__range` — see §2 Finding
   1). Some of those aggregate columns are NaN for clips where no frame
   ever tripped the flag, which crashed `RandomForestClassifier.fit()` with
   `ValueError: Input y contains NaN` on `mini_squat` (reproduced, see
   scratch log). Fixed by selecting labels on "no `__` aggregation suffix in
   the name" instead of "binary-valued" — `aggregate_features.py` always
   suffixes engineered features with `__min/__max/__mean/__std/__range/
   __first/__last`, and never suffixes the manifest label columns it passes
   through unchanged. This is an unambiguous, verified rule (checked against
   real column names in all 5 `train_<exercise>.parquet` files).

## 5. E1–E3 — real execution evidence

Ran the ported `extract_landmarks.py` against real clips from
`/home/billa-dakait/Desktop/test/dataset/heel slides/good/`:

```
$ venv/bin/python3 backend/ml/extract_landmarks.py single \
    "test/dataset/heel slides/good/1.MOV" <outdir> \
    --model test/models/pose_landmarker_heavy.task
...
[OK] .../1.MOV -> .../1.parquet (219 frames, 219 detected)
```

Row count == frame count (219 == 219). Parity check against the original
pipeline's precomputed output for the SAME clip
(`test/landmarks/heel slides/good/1.parquet`):

```
shapes (219, 278) (219, 179)          # mine has +99 new *_smooth columns
n common cols 179, orig-only 0
numeric cols with diffs: 0            # every shared column bit-identical
```

Batch + resume (E2), 2 more clips:
```
BATCH COMPLETE: 2 done, 0 skipped (resume), 0 failed / 2 total   (41.7s wall)
# re-run immediately after:
BATCH COMPLETE: 0 done, 2 skipped (resume), 0 failed / 2 total   (0.7s wall)
```
Resume behavior confirmed: re-running does not re-process existing outputs.

**E3 verdict: DONE.** 3 real clips processed, row count matches frame count,
values verified bit-identical to the known-good reference pipeline's output
on the same input.

## 6. E4–E7 — real execution evidence, full exercise reproduction

Ran the full E1→E4→E5→E6 chain end-to-end against all 21 real heel_slide
clips (not a subset) using ONLY the ported files in `backend/ml/`, starting
from the pre-existing raw landmark parquets (equivalent to E1's output):

```
common_features.extract_common_file(...)   -> 154 cols, every clip
exercise_extractors/heel_slide.extract(...) -> 96 cols, every clip
aggregate_features.py (via manifest slice)
  -> 16 clips after exclusions | 10 label columns
  -> dropped 'knee_varus' — only 1 positive(s), cannot be trained
  -> heel_slide: 16 clips x 644 features, 2 labels
```
Compared shape against the original `train-data/train_heel_slide.parquet`:
**(16, 648) vs (16, 648) — identical.** (The 644 vs 648 apparent gap above is
2 label + 2 metadata columns concatenated on top of the 644 feature columns
in both cases; verified column-for-column.)

**E4 verdict: DONE**, 154-col schema confirmed against real sample rows (not
assumed from any doc).
**E5 verdict: DONE**, confirmed on real data for heel_slide (96 cols, row
count == frame count for every clip); mini_squat/seated_knee_extension/tke/
slr extractors are verbatim ports of already-working code, exercised via
their existing real outputs in `train-data/` (§8/§9/§10 below all run
against those outputs) but not independently re-run end-to-end from raw
video for the other 4 exercises within this session's time budget — call
this **PARTIAL** for those 4 (logic verified by reading + the heel_slide
proof of the shared `common_features.py` stage; not independently re-executed
per-exercise).
**E6 verdict: DONE**, verified identical output shape to the real dataset.
**E7 verdict: DONE (reused)** — the real manifest already matches the plan's
schema exactly; copied to `backend/ml/manifest_data/manifest.csv`.

## 7. E9 — class balance report (real data)

Positives, distinct recording groups holding positives, and max
concentration in one group, per exercise/label (`source_recording_id` is the
grouping key here — see §4, no exercise has >1 `subject_id`):

```
                exercise                 label  clips  positives  total_groups  groups_with_positive  max_group_concentration
              heel_slide          heel_lifting     16          5             3                     1                     1.00
              heel_slide           hip_lifting     16          6             3                     1                     1.00
              mini_squat          heel_lifting     45          7             8                     1                     1.00
              mini_squat            knee_varus     45          7             8                     1                     1.00
              mini_squat        knee_past_toes     45          5             8                     1                     1.00
              mini_squat ankles_close_together     45         10             8                     2                     0.50
              mini_squat        back_slouching     45          5             8                     1                     1.00
  seated_knee_extensions           hip_lifting     22          5             4                     1                     1.00
  seated_knee_extensions        back_slouching     22          5             4                     1                     1.00
  seated_knee_extensions          back_rocking     22          7             4                     1                     1.00
      straight_leg_raise           hip_lifting     64         17            12                     3                     0.35
      straight_leg_raise     knee_flexion_high     64         20            12                     4                     0.25
      straight_leg_raise          head_lifting     64         17            12                     3                     0.35
terminal_knee_extensions           hip_lifting     11          6             2                     1                     1.00
```

**Reading this:** every label outside straight_leg_raise has
`max_group_concentration == 1.00` (or 0.50 for one mini_squat label) — every
positive for that label lives inside a single recording. Those labels
CANNOT be learned under group-safe CV; a GroupKFold split will always put
all-or-nothing of a label's positives in one fold, which is exactly why
§10's real run below scores 0.000 for mini_squat and seated_knee_extensions.
Only straight_leg_raise spreads its positives across 3–4 distinct groups per
label — the only exercise where E10's numbers are potentially estimating
something real, subject to the §2 circularity caveats on
`knee_flexion_high`/`hip_lifting`.

## 8. E11 — group-count gate (real data)

```
heel_slide:                3 groups  -> SKIPPED (< MIN_GROUPS=4)
mini_squat:                8 groups  -> ran
seated_knee_extensions:    4 groups  -> ran (exactly at the gate)
straight_leg_raise:       12 groups  -> ran
terminal_knee_extensions:  2 groups  -> SKIPPED (< MIN_GROUPS=4)
```
No exercise below 4 groups was scored. `train_model.py` prints the skip
reason explicitly for both skipped exercises (see §10 raw output).

## 9. E10 — per-label CV results (real output)

Command:
```
venv/bin/python3 -u backend/ml/train_model.py backend/ml/manifest_data/
```

```
=== heel_slide: 16 clips, 3 groups (grouped by source_recording_id (subject_id
    had 1 group(s), below MIN_GROUPS=4)), 644 features
  SKIPPED — only 3 recording groups. Cross-validation here would report a
  number, not an estimate. Collect more recordings before training this
  exercise.

=== mini_squat: 45 clips, 8 groups (grouped by source_recording_id ...), 954 features
  --- model=rf, GroupKFold k=5 ---
                label  support  precision  recall  f1
         heel_lifting        7        0.0     0.0 0.0
           knee_varus        7        0.0     0.0 0.0
       knee_past_toes        5        0.0     0.0 0.0
ankles_close_together       10        0.0     0.0 0.0
       back_slouching        5        0.0     0.0 0.0
  macro-F1 (rf): 0.000
  --- model=xgb, GroupKFold k=5 ---
                label  support  precision  recall  f1
         heel_lifting        7        0.0     0.0 0.0
           knee_varus        7        0.0     0.0 0.0
       knee_past_toes        5        0.0     0.0 0.0
ankles_close_together       10        0.0     0.0 0.0
       back_slouching        5        0.0     0.0 0.0
  macro-F1 (xgb): 0.000

=== seated_knee_extensions: 22 clips, 4 groups (grouped by source_recording_id
    ...), 1062 features
  --- model=rf, GroupKFold k=4 ---
         label  support  precision  recall  f1
   hip_lifting        5        0.0     0.0 0.0
back_slouching        5        0.0     0.0 0.0
  back_rocking        7        0.0     0.0 0.0
  macro-F1 (rf): 0.000
  --- model=xgb, GroupKFold k=4 ---
         label  support  precision  recall  f1
   hip_lifting        5        0.0     0.0 0.0
back_slouching        5        0.0     0.0 0.0
  back_rocking        7        0.0     0.0 0.0
  macro-F1 (xgb): 0.000

=== straight_leg_raise: 64 clips, 12 groups (grouped by source_recording_id
    ...), 961 features
  --- model=rf, GroupKFold k=5 ---
            label  support  precision  recall    f1
      hip_lifting       17      0.545   0.353 0.429
knee_flexion_high       20      1.000   1.000 1.000
     head_lifting       17      1.000   0.941 0.970
  macro-F1 (rf): 0.800
  --- model=xgb, GroupKFold k=5 ---
            label  support  precision  recall    f1
      hip_lifting       17      0.545   0.353 0.429
knee_flexion_high       20      0.769   1.000 0.870
     head_lifting       17      0.640   0.941 0.762
  macro-F1 (xgb): 0.687

=== terminal_knee_extensions: 11 clips, 2 groups (grouped by source_recording_id
    (subject_id had 1 group(s), below MIN_GROUPS=4)), 683 features
  SKIPPED — only 2 recording groups. Cross-validation here would report a
  number, not an estimate. Collect more recordings before training this
  exercise.

== summary (RF vs XGB, identical folds per exercise) ==
              exercise model  macro_f1  k  groups
            mini_squat    rf     0.000  5       8
            mini_squat   xgb     0.000  5       8
seated_knee_extensions    rf     0.000  4       4
seated_knee_extensions   xgb     0.000  4       4
    straight_leg_raise    rf     0.800  5      12
    straight_leg_raise   xgb     0.687  5      12
```

**Reading this against §2's audit:** `hip_lifting` scores IDENTICALLY under
RF and XGB (0.545/0.353/0.429) — a real, harder decision boundary, consistent
with Finding 2's "flagged but not proven" status. `knee_flexion_high` scores
a suspicious 1.000 under RF and drops to 0.870 under XGB while still hitting
perfect recall (1.000) — a label a model can recover with 100% recall under
two different algorithms, one of them perfectly, is exactly the signature
Finding 2 describes: the decision boundary is a hard threshold the model can
memorize via the feature that encodes it, not a fuzzy biomechanical pattern.
This RF-vs-XGB divergence is itself evidence supporting Finding 2, obtained
only because E10 was run as a real comparison instead of a single model.

**Never reporting accuracy, as instructed** — precision/recall/F1/support
and macro-F1 only, throughout.

## 10. E12 — feature pruning

**NOT DONE this session** — flagged honestly rather than fabricated. E10's
real run (§9) shows every exercise except straight_leg_raise scoring 0.000
regardless of RF vs XGB, which is a class-balance problem (§7/§9), not a
feature-count problem — pruning 900+ features to a smaller biomechanically-
relevant set will not fix a label whose positives all sit in one recording
group; more recordings are needed first. For straight_leg_raise, where
pruning could matter, §2's Finding 2 (`knee_flexion_high`/`hip_lifting`
circularity risk) needs to be resolved BEFORE a pruning pass, because pruning
against a circular label would optimize for keeping the leak, not removing
it. **Recommended order for whoever picks this up next: fix E8 Finding 2
first (re-collect or exclude the two flagged labels), THEN run E12 pruning
on what remains.**

## 11. E13/E14 — export + model card

```
$ venv/bin/python3 backend/ml/export_model.py backend/ml/manifest_data/ -o backend/ml/trained_models --model rf
[SKIP] heel_slide: 3 groups < MIN_GROUPS=4. Not exporting — see E11.
[OK] mini_squat: exported 5 label model(s) -> backend/ml/trained_models/mini_squat_rf.pkl
[OK] seated_knee_extensions: exported 3 label model(s) -> backend/ml/trained_models/seated_knee_extensions_rf.pkl
[OK] straight_leg_raise: exported 3 label model(s) -> backend/ml/trained_models/straight_leg_raise_rf.pkl
[SKIP] terminal_knee_extensions: 2 groups < MIN_GROUPS=4. Not exporting — see E11.
```
Each bundle contains `feature_names` (ordered), `impute_median` (training
medians, computed once on the FULL training table by `export_model.py`,
never from an inference clip — see the file's docstring), `labels`,
`models` (dict per label), `model_kind`, `sklearn_version`, `trained_at`.

`write_model_card.py` was written (E14) to combine these bundles with the
real CV numbers from `train_model.py` into `trained_models/model_card.json`,
including the caveats list required by §9/§14 (pose-only model, single
subject, small dataset, unbuilt rep segmentation, the E8 circularity
findings).

Real run:
```
$ venv/bin/python3 backend/ml/write_model_card.py backend/ml/trained_models \
    --datadir backend/ml/manifest_data -o backend/ml/trained_models/model_card.json
[OK] wrote backend/ml/trained_models/model_card.json
```
Contains, per exported exercise (`mini_squat_rf`, `seated_knee_extensions_rf`,
`straight_leg_raise_rf`), the real CV table from §9 above (re-derived inside
the script, not copy-pasted) plus `n_clips_final_fit`, `n_groups`,
`group_source`, `sklearn_version`, `trained_at`, and the global caveats list
(pose-only model, single-subject dataset, small-N shallow trees, unbuilt rep
segmentation, and a pointer to this file's §2 circularity findings).

## 12. Per-task status summary

| Task | Status | Evidence |
|---|---|---|
| E1 | DONE | §5 — real clip, byte-identical parity to reference output |
| E2 | DONE | §5 — batch + resume run on real clips |
| E3 | DONE | §5 |
| E4 | DONE | §6 — 154 cols confirmed on real data |
| E5 | DONE for heel_slide (full re-run); PARTIAL for the other 4 (verbatim ports, exercised only via their existing real outputs, not independently re-run from raw video this session) | §6 |
| E6 | DONE | §6 |
| E7 | DONE (reused, schema matches exactly) | §0 |
| E8 | DONE | §2 — 2 confirmed/high-risk circular labels found and documented, real data checks |
| E9 | DONE | §7 — real class-balance table |
| E10 | DONE | §9 — real GroupKFold RF+XGB run, all 5 exercises |
| E11 | DONE | §8 — 2 of 5 exercises correctly skipped, printed why |
| E12 | NOT DONE | §10 — reasoned deferral, not fabricated |
| E13 | DONE | §11 — 3 real bundles exported |
| E14 | DONE | §11 — real `model_card.json` written and inspected |

## 13. Seams left for Phase M (sensor fusion)

- `aggregate_features.py` operates on `df.select_dtypes(include=[np.number])`
  dynamically — it does not hardcode a column list beyond `LEAK_COLS`. New
  `imu_<joint>_angle` / `imu_pose_angle_delta` columns (M6) will be picked up
  automatically as additional features once joined into the per-frame
  parquet, no code change needed here.
- `train_model.py`/`export_model.py` build `feature_names` from
  `X.columns` at call time and store that exact order in the joblib bundle —
  adding IMU columns upstream changes the list contents but the ordering
  contract (bundle stores its own order, inference must follow it, never
  positional-by-accident) already holds.
- The manifest's `excluded`/`excluded_reason` columns (already in the real
  schema, §0) are the intended home for M7's per-rep EMG-validity exclusion
  gate — nothing here consumes or drops those columns, so a future join on
  `timestamp_ms` for a rep-validity check has a clean landing spot.
- No EMG features exist in any current feature table (§9 of the plan: no
  paired data). `write_model_card.py`'s caveats list states this explicitly
  so it ships with the model rather than being silently assumed away.

## 14. Dependencies needed (for backend-core-agent — this agent does not own `backend/requirements.txt`)

Installed into `final_project/venv` to do this work; needed at runtime by
anything importing `backend/ml/`:
```
pandas
numpy
scikit-learn
xgboost
joblib
pyarrow
opencv-python (or opencv-python-headless for server/CI)
mediapipe
tqdm
```

## 15. Event names needed in `events.py` (does not exist yet, Phase B pending)

For when `backend/app/logging_setup.py`/`events.py` land, this pipeline's
natural log points map onto the §8b vocabulary as:
- `clip_started` / `clip_completed` / `clip_failed` — around `process_video()`
  in `extract_landmarks.py`'s `_worker()`.
- `landmark_gap_detected` — when `frame_gap != 0` (see `manifest_check.py`'s
  logic, not ported but the check is reusable) or when a clip has a long
  low-visibility run.
- `model_loaded` — in whatever loads a `trained_models/*.pkl` bundle at
  inference time (not owned by this agent — `model_service.py`, agent 10).
- `schema_mismatch` — if `feature_names` in a loaded bundle don't match the
  columns a live feature_builder produces.
- No `prediction_made` equivalent exists in this offline-only phase; that
  belongs to the live inference path (agent 10), not here.

## 16. Open questions for a human

1. **E8 Finding 2** (`knee_flexion_high`, `hip_lifting`): does the human
   labeler review the raw video without seeing the auto-computed
   knee/hip-angle flags, or are these labels always going to be a
   transcription of the auto threshold? If the latter, these should be
   engineered FEATURES with a fixed rule, not trained LABELS at all — a
   modeling decision, not something this agent can decide alone.
2. Should `ideal_floor_y`/`pelvis_y_avg`/`baseline` (Finding 5) be excluded
   from features outright as a precaution, given they're set with knowledge
   of the good/bad split for some clips? Currently only flagged, not
   removed, per the plan's explicit instruction to preserve E5's baseline
   logic as-is.
3. More recordings (distinct `source_recording_id`, ideally distinct
   `subject_id`) are needed for mini_squat, seated_knee_extension, heel_slide
   and terminal_knee_extension before any of their labels can be honestly
   evaluated — this is a data collection need, not a code fix.

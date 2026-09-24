# Phase E — Model ingestion & validation

Scope actually executed: MASTER_BUILD_PLAN_v3.md §5 PHASE E (E1-E11) — model
ingestion/validation gate, NOT training. (An earlier, generic "ML Training
Agent" briefing at the top of this session's context described a different,
stale task — build_features.py/train_model.py-style offline pipeline work.
That does not match the actual repo state (those already exist as legacy
artifacts under `ml/`), the four pinned test files, or the plan doc. The
detailed model-ingestion-agent brief is what this session actually built
against, per its explicit file ownership list and DO-NOT-TOUCH clause.)

## Files written (all new)

- `backend/ml/validate_model_package.py` — `feature_hash()`, `ValidationReport`,
  `validate_package()`, `import_package()`, `check_data_sources()`.
- `backend/ml/repackage_legacy_bundle.py` — disposable E9 converter, marked as
  such in its docstring.
- `backend/app/routes/admin_models.py` — `POST /admin/models/upload`,
  `GET /admin/models/status`, `build_model_registry()` (E8).
- `backend/app/main.py` — three additions only: import line for the new
  router/registry-builder, `app.include_router(admin_models_router)`, and the
  three lifespan lines that build `app.state.model_registry` +
  `app.state.last_model_import` at startup. Nothing else touched.
- `backend/docs/E_model_ingestion.md` — this file.

`backend/ml/trained_models/` is the import target (E5); no code lives there,
only imported model artifacts + this session's test artifacts (cleaned up,
see "Known gap" below).

## Package contract (E1/E2), as implemented

```
models.zip
├── model_card.json
└── <exercise_name>/
    ├── model.joblib          # ONE estimator, .predict()+.predict_proba() (E-DEC.1)
    ├── feature_names.json    # ordered list
    ├── labels.json           # ordered list
    └── impute_median.json
```

`model_card.json` required fields (11, all required, `caveats` may be `[]`
but must be present): `trained`, `model_type`, `is_tree_based` (bool, strictly
type-checked — gates I8's SHAP path), `sklearn_version`, `exercises`
(`{name: [labels]}`), `cv_scores`, `caveats`, `data_sources` (non-empty subset
of `pose|emg|imu`), `extractor_version`, `feature_hash`, `decision_thresholds`
(`{label: {threshold, reportable}}`).

**Deviation from the literal schema, load-bearing, flagged for review:**
`feature_hash` in the plan's example is a single top-level string. That works
for a package where every exercise shares one feature schema, but does not
work for a package with heterogeneous exercises (the real placeholder
bundles have 954/1062/961 features respectively) — a single string can only
match one of them. `validate_model_package.py` accepts **either** a single
string (applied to every exercise in the package, the common case and what
every unit test in `ml/test_validate_model_package.py` exercises) **or** a
`{exercise_name: hash}` mapping (what `repackage_legacy_bundle.py` emits for
its 3 heterogeneous exercises). This is what let E9's converter output pass
E3 (`test_e9_converter_output_passes_the_real_gate`) without silently
weakening the hard-fail check itself — the check is still exact per exercise,
just keyed. No test constrains `feature_hash` to a bare string, so this
doesn't relax anything currently pinned. Still: the plan's schema literally
shows a single string, so raise this if a future export tool assumes that.

**Checks 12/13 run independently of each other and of check-ordering
otherwise implied by "stop at first failure"**: a label missing from
`decision_thresholds` AND missing patient wording produces both messages, not
just the first one hit. `test_e3_label_without_patient_wording_rejected`
requires the "wording" fragment to appear even though the same fixture's
labels also fail the decision_thresholds check — the two are unrelated data
sources (one reads the card, one reads an external resource) so there's no
reason a fully-fixed decision_thresholds should hide a still-broken wording
gap or vice versa. All other checks (1-11) still stop at first failure per
exercise, per the plan.

`known_wording=None` and `known_exercises=None` are both real "skip this
check" states, not just test conveniences: `admin_models.py`'s upload route
currently passes `known_wording=None` because `report_builder.py` (I10) does
not exist yet — **TODO for whoever builds I10**: wire the real wording dict
into `admin_models.py`'s call to `import_package()`, or unworded labels can
reach a package undetected once that file exists.

## E9 — legacy bundle conversion (disposable)

`ml/repackage_legacy_bundle.py` converts the 3 existing placeholder bundles
(`mini_squat_rf.pkl`, `seated_knee_extensions_rf.pkl`,
`straight_leg_raise_rf.pkl`) into one conforming zip. Per-label
`RandomForestClassifier`s are assembled into one `MultiOutputClassifier` per
exercise **post-hoc** (`.estimators_`, `.classes_`, `.n_features_in_` set
directly, mirroring what `.fit()` would set) — no retraining, no repo-defined
wrapper class pickled into `model.joblib` (would have broken the
external-training split, E-DEC.1).

- `seated_knee_extensions` (plural, legacy) → renamed to canonical
  `seated_knee_extension` (singular, matches `app/config/exercises.json`) —
  E10. `mini_squat` and `straight_leg_raise` were already canonical.
- `cv_scores` are pulled from the existing (pre-contract)
  `ml/trained_models/model_card.json` when present, rather than fabricated —
  §8c forbids inventing clinical/quality numbers.
- `decision_thresholds` are **placeholders** (`0.5` / `reportable: true` for
  every label) — E-DEC.7 explicitly says the owner has not approved this
  mechanism yet; this converter does the minimum needed to satisfy E3's
  presence/shape check and nothing more.
- Data sources: `["pose"]` (all three legacy bundles are pose-only).
- Marked disposable in its own module docstring; dies after the
  post-recording-day retrain per the plan.

Run directly: `../venv/bin/python ml/repackage_legacy_bundle.py` — self-check
converts the real bundles and asserts predict/predict_proba shape.

## E8 — startup registry

`build_model_registry(exercise_names, root)` in `admin_models.py` is called
once from `main.py`'s lifespan. For each exercise in `exercise_config.py`'s
registry:
- all 4 E1 files present under `trained_models/<exercise>/` → `loaded: true`,
  `is_tree_based`/`data_sources`/`imported_at` read from a small bookkeeping
  file (`_import_meta.json`, written by the upload route, **not** part of the
  E1 contract — `validate_package` ignores it, it's purely this route's own
  memory of what a prior successful import's card said).
- otherwise → `analysis_unavailable: true` with a specific reason string.
  Live rule-based feedback (`GET /exercises`) is untouched either way.

`GET /admin/models/status` also updates in-memory (`app.state.model_registry`)
immediately after a successful upload, so a fresh import is visible without
restarting the process.

## E11 — scoring-time source gate

`check_data_sources(card, available) -> (ok, reason)`. Declines to score
(never imputes) when a declared source is absent — `impute_median.json` is
only for gaps in a signal that IS present (E-DEC.2). Not yet wired into an
actual scoring path since `model_service.py` (I7) doesn't exist yet; this is
the function I7 should call before invoking `.predict()`.

## Test results (real output, run from `backend/`)

```
../venv/bin/python ml/test_validate_model_package.py
  ... ALL E1-E5/E9/E10 VALIDATION CHECKS PASSED

../venv/bin/python app/routes/test_admin_models.py
  ... ALL E6/E7/E8/E11 ADMIN ROUTE CHECKS PASSED

../venv/bin/python tools/test_e_gate.py     (run against a clean trained_models/)
  clause 1 OK -- 7 malformed packages, each rejected by name
  imported mini_squat -> loaded, tree-based, at 2026-08-26T21:18:54.464171+00:00
  clause 2 OK -- valid package imports and appears in /admin/models/status
  PHASE E GATE PASSED (specific rejection; valid import visible in status)
```

All three pass individually against a clean `ml/trained_models/`.

### Known gap — `./run_tests.sh` fails, NOT a code defect, flagged not fixed

`./run_tests.sh` runs `app/routes/test_admin_models.py` (§3) before
`tools/test_e_gate.py` (§4). `test_admin_models.py` uploads a synthetic
`mini_squat` package against the **real** `TRAINED_MODELS_ROOT`
(`backend/ml/trained_models/`, since no isolation env var is set for it) and
leaves it imported on disk. `test_e_gate.py`'s clause 2 then asserts
`mini_squat` is **not already loaded** before its own upload, to prove the
import actually did something — and fails, because the prior test file left
it loaded.

This reproduces with the exact 4 commands run in the stated order too, not
just via `run_tests.sh` — it's state shared on disk between two independently
approved, unmodifiable test files (`app/routes/test_admin_models.py`,
`tools/test_e_gate.py`), neither of which cleans up its writes to
`ml/trained_models/`. `run_tests.sh` already solves exactly this class of
problem for another resource (`SESSION_DATA_DIR`, see its own comment
"Keep test evidence out of the real session-data directory") but does not do
so for model imports.

**I did not fix this myself** — `run_tests.sh` and both test files are
outside this task's file-ownership list (`OWN:` / `DO NOT TOUCH:` in the
brief), and the brief is explicit: don't make a test pass by changing it, and
don't touch paths not listed. `admin_models.py`'s `TRAINED_MODELS_ROOT`
already supports override via the `TRAINED_MODELS_ROOT` env var for exactly
this purpose.

**Recommended fix, for whoever owns `run_tests.sh`** (mirroring its existing
`SESSION_DATA_DIR` pattern):

```bash
export TRAINED_MODELS_ROOT="${TRAINED_MODELS_ROOT:-$(mktemp -d -t rehab_test_models_XXXXXX)}"
trap 'rm -rf "$SESSION_DATA_DIR" "$TRAINED_MODELS_ROOT"' EXIT
```

placed alongside the existing `SESSION_DATA_DIR` export near the top of the
script. This does not affect `ml/test_validate_model_package.py`'s E9 tests,
which read the real legacy `*_rf.pkl` files via a path hardcoded relative to
the test file itself, unrelated to `TRAINED_MODELS_ROOT`.

I manually cleaned up the pollution from my own verification runs
(`ml/trained_models/mini_squat/`, `_previous/`, `_uploads/` deleted) before
finishing, so the repo is left in the state it was found in
(`mini_squat_rf.pkl`, `seated_knee_extensions_rf.pkl`,
`straight_leg_raise_rf.pkl`, `model_card.json` only).

## What Phase I needs (per §8c model swap contract)

- **I6** (feature extraction) must read `feature_names.json` and build the
  scoring-time row in that *exact order* — `feature_hash` is the guardrail
  that catches drift here.
- **I7** (`model_service.py`) loads `model.joblib` via `joblib.load()` and
  calls only `.predict()` / `.predict_proba()` — never inspects internals.
  Must call `check_data_sources()` (E11) before scoring and decline
  (`analysis_unavailable`, name the reason) rather than impute a missing
  sensor.
- **I8** (`explainer_service.py`) reads `is_tree_based` from the per-exercise
  bookkeeping (`app.state.model_registry[<exercise>]["is_tree_based"]`, or
  re-derive from a freshly uploaded card) to gate `shap.TreeExplainer` vs.
  disabled.
- **I10** (`report_builder.py`) is the missing `known_wording` resource —
  once it exists, `admin_models.py`'s upload route should stop passing
  `known_wording=None` and wire in the real per-label wording dict, per the
  TODO in that file's docstring.

## E-DEC.7 flag (per instructions, not re-litigated, just surfaced)

`decision_thresholds` is validated for presence/shape only (§ per-label
`threshold` in `[0,1]` + boolean `reportable`), exactly as the plan asks. No
behavior is built on top of it here — no threshold-based decisioning exists
yet anywhere in this codebase. Per the plan's own flag: the owner accepted
this provisionally and has not actually confirmed understanding of it; anyone
building on top of `decision_thresholds` beyond "does it validate" should
raise it again first.

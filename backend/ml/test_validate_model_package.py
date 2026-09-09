"""E1-E5, E9, E10 — the model package contract and its gate. No framework.

Run from backend/:  ../venv/bin/python ml/test_validate_model_package.py

Contract these tests define for backend/ml/validate_model_package.py:

    feature_hash(names: list[str]) -> str
        sha256 of "\\n".join(names), hex. ONE definition, used by both the
        validator and whatever writes a model card, or the check is theatre.

    validate_package(zip_path, known_exercises=None, known_wording=None)
        -> ValidationReport

    import_package(zip_path, dest_root, known_exercises=None,
                   known_wording=None) -> ValidationReport
        E5: extracts passing exercises into dest_root/<exercise>/, moving any
        prior version to dest_root/_previous/<exercise>/.

    ValidationReport:
        .ok         bool  -- True only if at least one exercise imported and
                             no package-level error occurred
        .errors     list[str]   package-level failures
        .warnings   list[str]   non-blocking (E3 check 8, extractor version)
        .exercises  dict[name -> {"ok": bool, "errors": [str], "warnings": [str]}]

E4 is why the report is a structure and not a bool: "which check failed, which
exercise/file, what was expected vs found". A gate that says only "invalid" is
a gate nobody can act on, and the §7 gate explicitly tests for a SPECIFIC
reason.
"""
import json
import hashlib
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier

from ml import validate_model_package as vmp


N_FEATURES = 6
LABELS = ["heel_lifting", "knee_varus", "back_slouching"]
FEATURES = [f"feat_{i}" for i in range(N_FEATURES)]
WORDING = {lbl: f"friendly text for {lbl}" for lbl in LABELS}


def _fit_model(n_labels=len(LABELS), n_features=N_FEATURES):
    """A real fitted multi-label estimator. Real, not a mock -- E3 check 4
    loads it and checks 6/7 read n_features_in_ and the output shape, so a
    stub would test nothing."""
    rng = np.random.default_rng(0)
    X = rng.random((30, n_features))
    y = (rng.random((30, n_labels)) > 0.5).astype(int)
    m = MultiOutputClassifier(RandomForestClassifier(n_estimators=3, random_state=0))
    m.fit(X, y)
    return m


def _card(exercises, **overrides):
    card = {
        "trained": "2026-08-27T00:00:00Z",
        "model_type": "random_forest",
        "is_tree_based": True,
        "sklearn_version": "1.9.0",
        "exercises": {name: list(LABELS) for name in exercises},
        "cv_scores": [
            {"exercise": name, "label": lbl, "precision": 0.5,
             "recall": 0.5, "f1": 0.5, "support": 10}
            for name in exercises for lbl in LABELS
        ],
        "caveats": [],
        "data_sources": ["pose"],
        "extractor_version": "v1",
        "feature_hash": vmp.feature_hash(FEATURES),
        "decision_thresholds": {
            lbl: {"threshold": 0.5, "reportable": True} for lbl in LABELS
        },
    }
    card.update(overrides)
    return card


def _build_zip(path, exercises=("mini_squat",), card=None, model=None,
               features=None, labels=None, omit=(), extra_files=None):
    """Write a package zip. `omit` drops named files to build malformed cases."""
    features = FEATURES if features is None else features
    labels = list(LABELS) if labels is None else labels
    model = _fit_model() if model is None else model
    card = _card(exercises) if card is None else card

    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        if "model_card.json" not in omit:
            (root / "model_card.json").write_text(json.dumps(card, indent=2))
        for ex in exercises:
            d = root / ex
            d.mkdir(parents=True, exist_ok=True)
            if f"{ex}/model.joblib" not in omit:
                joblib.dump(model, d / "model.joblib")
            if f"{ex}/feature_names.json" not in omit:
                (d / "feature_names.json").write_text(json.dumps(features))
            if f"{ex}/labels.json" not in omit:
                (d / "labels.json").write_text(json.dumps(labels))
            if f"{ex}/impute_median.json" not in omit:
                (d / "impute_median.json").write_text(
                    json.dumps({f: 0.0 for f in features}))
        for rel, content in (extra_files or {}).items():
            fp = root / rel
            fp.parent.mkdir(parents=True, exist_ok=True)
            fp.write_text(content)

        with zipfile.ZipFile(path, "w") as z:
            for f in sorted(root.rglob("*")):
                if f.is_file():
                    z.write(f, f.relative_to(root))
    return path


def _tmp(name="pkg.zip"):
    return Path(tempfile.mkdtemp(prefix="e_test_")) / name


def _validate(**kw):
    z = _build_zip(_tmp(), **kw)
    return vmp.validate_package(z, known_exercises=["mini_squat", "straight_leg_raise"],
                                known_wording=WORDING)


def _assert_reason(report, *fragments, where=None):
    """E4: the rejection must NAME the problem. A report that fails for the
    right reason but says 'invalid package' is not acceptable -- the §7 gate
    tests for a specific, correct reason."""
    assert not report.ok, "package should have been rejected but passed"
    blob = " ".join(report.errors + [
        e for ex in report.exercises.values() for e in ex.get("errors", [])
    ]).lower()
    for frag in fragments:
        assert frag.lower() in blob, (
            f"rejection reason does not mention {frag!r}.\nGot: {blob}"
        )


# --- E1 / E2 -----------------------------------------------------------------

def test_e1_valid_package_passes():
    r = _validate()
    assert r.ok, f"a well-formed package was rejected: {r.errors} {r.exercises}"
    assert r.exercises["mini_squat"]["ok"]
    print("E1 valid package accepted: OK")


def test_e1_missing_required_file_is_named():
    for missing in ("model.joblib", "feature_names.json", "labels.json",
                    "impute_median.json"):
        r = _validate(omit=(f"mini_squat/{missing}",))
        _assert_reason(r, missing)
    print("E1 each missing required file named: OK")


def test_e2_missing_card_field_is_named():
    """Every E2 field is required. is_tree_based especially -- it gates the
    SHAP path in I8, and a card that omits it would silently disable
    explanation rather than failing here."""
    for field in ("trained", "model_type", "is_tree_based", "sklearn_version",
                  "exercises", "cv_scores", "caveats", "data_sources",
                  "extractor_version", "feature_hash", "decision_thresholds"):
        card = _card(["mini_squat"])
        card.pop(field)
        r = _validate(card=card)
        _assert_reason(r, field)
    print("E2 every missing card field named: OK")


def test_e2_empty_caveats_allowed_absent_caveats_rejected():
    """The plan is explicit: caveats may be empty but must be PRESENT, so a
    card cannot silently omit known weaknesses."""
    r = _validate(card=_card(["mini_squat"], caveats=[]))
    assert r.ok, "an empty caveats list must be accepted"

    card = _card(["mini_squat"])
    del card["caveats"]
    _assert_reason(_validate(card=card), "caveats")
    print("E2 caveats present-but-empty vs absent: OK")


def test_e2_is_tree_based_must_be_boolean():
    for bad in ("true", 1, None):
        r = _validate(card=_card(["mini_squat"], is_tree_based=bad))
        _assert_reason(r, "is_tree_based")
    print("E2 is_tree_based type-checked: OK")


# --- E3 ----------------------------------------------------------------------

def test_e3_corrupt_zip_rejected():
    p = _tmp("corrupt.zip")
    p.write_bytes(b"this is not a zip file")
    r = vmp.validate_package(p, known_exercises=["mini_squat"], known_wording=WORDING)
    _assert_reason(r, "zip")
    print("E3 corrupt zip rejected: OK")


def test_e3_model_must_expose_predict_and_predict_proba():
    """E-DEC.1. The placeholder bundles hold {label: estimator} dicts, which
    have neither method. This check is what forces E9's conversion instead of
    silently accepting a container the app cannot call."""
    bare = {lbl: RandomForestClassifier(n_estimators=2) for lbl in LABELS}
    r = _validate(model=bare)
    _assert_reason(r, "predict")
    print("E3 non-estimator container rejected: OK")


def test_e3_feature_names_length_must_match_model():
    r = _validate(features=[f"feat_{i}" for i in range(N_FEATURES + 3)])
    _assert_reason(r, "feature")
    print("E3 feature count mismatch rejected: OK")


def test_e3_labels_length_must_match_model_outputs():
    r = _validate(labels=LABELS + ["an_extra_label"])
    _assert_reason(r, "label")
    print("E3 label count mismatch rejected: OK")


def test_e3_sklearn_mismatch_warns_but_does_not_block():
    """E3 check 8 is explicitly a WARNING. Blocking on it would make every
    environment upgrade an outage."""
    r = _validate(card=_card(["mini_squat"], sklearn_version="0.0.1-ancient"))
    assert r.ok, "sklearn version mismatch must NOT block the import"
    blob = " ".join(r.warnings + [w for ex in r.exercises.values()
                                  for w in ex.get("warnings", [])]).lower()
    assert "sklearn" in blob, f"version mismatch was not recorded as a warning: {r.warnings}"
    print("E3 sklearn mismatch warns only: OK")


def test_e3_feature_hash_mismatch_is_a_hard_fail():
    """E-DEC.3. The column list is exactly checkable, so it must refuse --
    never a log line. This is the check that stops a silently-drifted
    extractor from producing a confidently wrong report."""
    r = _validate(card=_card(["mini_squat"], feature_hash="0" * 64))
    _assert_reason(r, "feature_hash")
    print("E3 feature_hash mismatch hard-fails: OK")


def test_e3_feature_hash_is_order_sensitive():
    """Reordered columns are a different feature row even though the SET is
    identical -- the model reads by position. A hash over an unordered set
    would pass this and produce garbage predictions."""
    reordered = list(reversed(FEATURES))
    assert vmp.feature_hash(reordered) != vmp.feature_hash(FEATURES), (
        "feature_hash ignores ordering; it must not"
    )
    r = _validate(features=reordered)   # card still carries the in-order hash
    _assert_reason(r, "feature_hash")
    print("E3 feature_hash is order-sensitive: OK")


def test_e3_data_sources_validated():
    for bad in ([], ["pose", "telepathy"], "pose"):
        r = _validate(card=_card(["mini_squat"], data_sources=bad))
        _assert_reason(r, "data_sources")
    print("E3 data_sources validated: OK")


def test_e3_decision_thresholds_cover_every_label():
    card = _card(["mini_squat"])
    card["decision_thresholds"].pop(LABELS[0])
    _assert_reason(_validate(card=card), "decision_threshold", LABELS[0])

    card = _card(["mini_squat"])
    card["decision_thresholds"][LABELS[0]]["threshold"] = 1.7
    _assert_reason(_validate(card=card), "threshold")
    print("E3 decision_thresholds complete and in range: OK")


def test_e3_label_without_patient_wording_rejected():
    """E-DEC.4. Caught at import, when a human is paying attention and nothing
    is at stake -- not at report time in front of a patient."""
    r = _validate(labels=LABELS[:-1] + ["brand_new_unworded_error"],
                  model=_fit_model(n_labels=len(LABELS)))
    _assert_reason(r, "wording", "brand_new_unworded_error")
    print("E3 unworded label rejected by name: OK")


# --- E4 / E5 -----------------------------------------------------------------

def test_e4_one_bad_exercise_does_not_sink_the_good_ones():
    """E4: validation is all-or-nothing PER EXERCISE. A bad slr must not cost
    you a good mini_squat."""
    z = _build_zip(_tmp(), exercises=("mini_squat", "straight_leg_raise"),
                   omit=("straight_leg_raise/labels.json",))
    r = vmp.validate_package(z, known_exercises=["mini_squat", "straight_leg_raise"],
                             known_wording=WORDING)
    assert r.exercises["mini_squat"]["ok"], "a valid exercise was rejected alongside a bad one"
    assert not r.exercises["straight_leg_raise"]["ok"]
    assert any("labels.json" in e for e in r.exercises["straight_leg_raise"]["errors"])
    print("E4 per-exercise isolation: OK")


def test_e5_import_lays_out_the_e1_structure():
    dest = Path(tempfile.mkdtemp(prefix="e5_"))
    z = _build_zip(_tmp())
    r = vmp.import_package(z, dest, known_exercises=["mini_squat"], known_wording=WORDING)
    assert r.ok, f"import failed: {r.errors}"
    for f in ("model.joblib", "feature_names.json", "labels.json", "impute_median.json"):
        assert (dest / "mini_squat" / f).exists(), f"missing {f} after import"
    assert joblib.load(dest / "mini_squat" / "model.joblib").predict is not None
    print("E5 import writes the E1 layout: OK")


def test_e5_previous_version_kept_for_one_rollback():
    """A bad import must not be unrecoverable."""
    dest = Path(tempfile.mkdtemp(prefix="e5b_"))
    vmp.import_package(_build_zip(_tmp("v1.zip")), dest,
                       known_exercises=["mini_squat"], known_wording=WORDING)
    (dest / "mini_squat" / "MARKER").write_text("v1")

    vmp.import_package(_build_zip(_tmp("v2.zip")), dest,
                       known_exercises=["mini_squat"], known_wording=WORDING)
    prev = dest / "_previous" / "mini_squat"
    assert prev.exists(), "no _previous/ copy kept -- a bad import is unrecoverable"
    assert (prev / "MARKER").read_text() == "v1", "_previous holds the wrong version"
    print("E5 one-step rollback preserved: OK")


def test_e5_failed_exercise_is_not_partially_imported():
    """'Never partially import a package.' A half-written exercise folder is
    worse than none: it looks importable to E7 and fails at prediction time."""
    dest = Path(tempfile.mkdtemp(prefix="e5c_"))
    z = _build_zip(_tmp(), omit=("mini_squat/impute_median.json",))
    vmp.import_package(z, dest, known_exercises=["mini_squat"], known_wording=WORDING)
    assert not (dest / "mini_squat").exists(), (
        "a failing exercise left a partial folder behind"
    )
    print("E5 no partial import: OK")


# --- E10 ---------------------------------------------------------------------

def test_e10_non_canonical_exercise_name_rejected():
    """The real bundles use 'seated_knee_extensions' (plural) against the
    config's singular. Fuzzy-matching that is how a model ends up scoring the
    wrong exercise; reject instead."""
    r = _validate(exercises=("seated_knee_extensions",))
    _assert_reason(r, "seated_knee_extensions")
    print("E10 non-canonical name rejected: OK")


def test_e10_card_keys_must_match_folder_names():
    card = _card(["mini_squat_rf"])          # keyed by filename, as today's card is
    r = _validate(card=card)
    _assert_reason(r, "mini_squat")
    print("E10 card keys must be exercise names: OK")


# --- E9 ----------------------------------------------------------------------

LEGACY = Path(__file__).resolve().parent / "trained_models"


def test_e9_converter_output_passes_the_real_gate():
    """The whole point of E9: whatever it emits must satisfy E3. This closes
    the loop -- converter and validator cannot drift apart, because the
    converter is graded by the validator, not by its own assertions."""
    import ml.repackage_legacy_bundle as rlb

    legacy = sorted(LEGACY.glob("*_rf.pkl"))
    assert legacy, f"no legacy bundles found in {LEGACY} to convert"

    out = Path(tempfile.mkdtemp(prefix="e9_")) / "converted.zip"
    written = rlb.convert(legacy, out, wording=None)
    assert out.exists(), "converter produced no zip"

    r = vmp.validate_package(out)
    assert r.ok, (
        "E9's own output fails E3 -- the converter and the contract disagree:\n"
        f"errors={r.errors}\nexercises={r.exercises}"
    )
    for name, res in r.exercises.items():
        assert res["ok"], f"{name} failed: {res['errors']}"
    print(f"E9 converter output passes E3 ({len(written)} exercises): OK")


def test_e9_converted_model_predicts():
    """Converted models must actually run, not merely load. Post-hoc assembly
    of a MultiOutputClassifier is the fiddly part -- this is where it breaks."""
    import ml.repackage_legacy_bundle as rlb

    src = LEGACY / "mini_squat_rf.pkl"
    assert src.exists(), f"{src} missing"
    out = Path(tempfile.mkdtemp(prefix="e9b_")) / "c.zip"
    rlb.convert([src], out, wording=None)

    with tempfile.TemporaryDirectory() as td:
        with zipfile.ZipFile(out) as z:
            z.extractall(td)
        d = Path(td) / "mini_squat"
        model = joblib.load(d / "model.joblib")
        names = json.loads((d / "feature_names.json").read_text())
        labels = json.loads((d / "labels.json").read_text())

        X = np.zeros((2, len(names)))
        pred = model.predict(X)
        assert pred.shape == (2, len(labels)), (
            f"predict returned {pred.shape}, expected (2, {len(labels)})"
        )
        proba = model.predict_proba(X)
        assert len(proba) == len(labels), (
            f"predict_proba returned {len(proba)} outputs for {len(labels)} labels"
        )
    print("E9 converted model predicts with the right shape: OK")


if __name__ == "__main__":
    test_e1_valid_package_passes()
    test_e1_missing_required_file_is_named()
    test_e2_missing_card_field_is_named()
    test_e2_empty_caveats_allowed_absent_caveats_rejected()
    test_e2_is_tree_based_must_be_boolean()
    test_e3_corrupt_zip_rejected()
    test_e3_model_must_expose_predict_and_predict_proba()
    test_e3_feature_names_length_must_match_model()
    test_e3_labels_length_must_match_model_outputs()
    test_e3_sklearn_mismatch_warns_but_does_not_block()
    test_e3_feature_hash_mismatch_is_a_hard_fail()
    test_e3_feature_hash_is_order_sensitive()
    test_e3_data_sources_validated()
    test_e3_decision_thresholds_cover_every_label()
    test_e3_label_without_patient_wording_rejected()
    test_e4_one_bad_exercise_does_not_sink_the_good_ones()
    test_e5_import_lays_out_the_e1_structure()
    test_e5_previous_version_kept_for_one_rollback()
    test_e5_failed_exercise_is_not_partially_imported()
    test_e10_non_canonical_exercise_name_rejected()
    test_e10_card_keys_must_match_folder_names()
    test_e9_converter_output_passes_the_real_gate()
    test_e9_converted_model_predicts()
    print("ALL E1-E5/E9/E10 VALIDATION CHECKS PASSED")

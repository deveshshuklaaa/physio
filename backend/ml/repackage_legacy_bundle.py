"""repackage_legacy_bundle.py — DISPOSABLE, one-off converter (E9).

MASTER_BUILD_PLAN_v3.md §5 PHASE E, E9. This file exists ONLY to carry the
three placeholder bundles (`mini_squat_rf.pkl`, `seated_knee_extensions_rf.pkl`,
`straight_leg_raise_rf.pkl`) across the E1-E3 contract so the app has
something to load before the post-recording-day retrain lands. It dies with
those bundles. Do NOT extend it into a general import path -- anything that
needs to survive belongs in validate_model_package.py, not here.

Legacy bundle shape (from export_model.py), a dict:
    {exercise, feature_names[N], labels[M], impute_median{N},
     models: {label: fitted RandomForestClassifier}, model_kind,
     sklearn_version, trained_at, n_clips_final_fit, n_groups, group_source}

E-DEC.1 requires model.joblib to hold ONE estimator exposing .predict() and
.predict_proba(), not the {label: estimator} dict above. This converter
assembles a MultiOutputClassifier POST-HOC (setting .estimators_ / .classes_
/ .n_features_in_ directly, mirroring exactly what
MultiOutputClassifier.fit() would have set) rather than calling .fit() again
-- the point is to package already-fitted estimators, not retrain them.

E10: the legacy 'seated_knee_extensions' (plural) bundle is renamed to the
canonical 'seated_knee_extension' (singular, matches app/config/exercises.json)
so the converted package doesn't get rejected by E3 check for a non-canonical
name.
"""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier

if __package__ in (None, ""):
    # Allows `python ml/repackage_legacy_bundle.py` directly, not just
    # `python -m ml.repackage_legacy_bundle` -- mirrors the sys.path shim in
    # ml/test_validate_model_package.py.
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from ml.validate_model_package import feature_hash

# The one known non-canonical name in the current placeholder bundles (E10).
LEGACY_NAME_MAP = {"seated_knee_extensions": "seated_knee_extension"}

CAVEATS = [
    "Converted by the disposable repackage_legacy_bundle.py (E9) from "
    "pre-contract placeholder bundles. Discard this package and retrain "
    "properly after the recording day -- see MASTER_BUILD_PLAN_v3.md "
    "§PHASE M-REC.",
    "Model v1 is pose-only. No paired pose+EMG training data exists yet.",
    "Every recording in the source dataset shares a single subject_id "
    "(one actor); CV numbers are recording-level, not subject-level, and do "
    "not estimate cross-patient generalization.",
    "decision_thresholds below are placeholders (0.5 / reportable=True for "
    "every label) -- E-DEC.7 marks the whole decision_thresholds mechanism "
    "as not yet understood/approved by the owner; do not treat these as "
    "clinically chosen cutoffs.",
]


def _assemble_multioutput(bundle: dict) -> MultiOutputClassifier:
    """Post-hoc assembly: set the internals MultiOutputClassifier.fit()
    would have set, from already-fitted per-label estimators, in the exact
    order of bundle['labels'] (order defines labels.json's order too)."""
    estimators = [bundle["models"][lbl] for lbl in bundle["labels"]]
    moc = MultiOutputClassifier(estimator=RandomForestClassifier())
    moc.estimators_ = estimators
    moc.classes_ = [np.asarray(e.classes_) for e in estimators]
    moc.n_features_in_ = len(bundle["feature_names"])
    return moc


def _legacy_cv_scores(legacy_card: dict | None, bundle_stem: str, ex: str) -> list[dict]:
    """Best-effort: pull real CV numbers out of the existing
    ml/trained_models/model_card.json (pre-E2 shape) if it's sitting next to
    the .pkl files, so the converted card isn't full of fabricated zeros.
    Falls back to empty (no cv_scores for this exercise) if unavailable --
    never invents a number, per §8c's clinical-content constraint."""
    if not legacy_card:
        return []
    entry = legacy_card.get("exercises", {}).get(bundle_stem)
    if not entry:
        return []
    return [
        {
            "exercise": ex,
            "label": row["label"],
            "precision": row["precision"],
            "recall": row["recall"],
            "f1": row["f1"],
            "support": row["support"],
        }
        for row in entry.get("cv_scores_per_label", [])
    ]


def convert(paths: list[Path], out_zip: Path, wording: dict | None = None) -> list[str]:
    """Converts each legacy `*_rf.pkl` bundle in `paths` into the E1 package
    layout and writes ONE `out_zip` covering all of them, with a conforming
    E2 model_card.json. Returns the list of (canonical) exercise names
    written. `wording` is accepted for forward-compat with a future
    report_builder.py wording resource but is not written into the package
    -- model_card.json carries no wording, only labels; wording is checked
    at import time by validate_package(known_wording=...), not baked in here.
    """
    paths = [Path(p) for p in paths]
    legacy_card_path = paths[0].parent / "model_card.json" if paths else None
    legacy_card = (
        json.loads(legacy_card_path.read_text())
        if legacy_card_path and legacy_card_path.exists() else None
    )

    card = {
        "trained": datetime.now(timezone.utc).isoformat(),
        "model_type": "random_forest",
        "is_tree_based": True,
        "sklearn_version": sklearn.__version__,
        "exercises": {},
        "cv_scores": [],
        "caveats": list(CAVEATS),
        "data_sources": ["pose"],
        "extractor_version": "legacy-v1",
        "feature_hash": {},
        "decision_thresholds": {},
    }

    written = []
    with tempfile.TemporaryDirectory(prefix="rlb_") as td:
        root = Path(td)

        for path in paths:
            bundle = joblib.load(path)
            ex = LEGACY_NAME_MAP.get(bundle["exercise"], bundle["exercise"])
            labels = list(bundle["labels"])
            feature_names = list(bundle["feature_names"])

            model = _assemble_multioutput(bundle)

            d = root / ex
            d.mkdir(parents=True, exist_ok=True)
            joblib.dump(model, d / "model.joblib")
            (d / "feature_names.json").write_text(json.dumps(feature_names))
            (d / "labels.json").write_text(json.dumps(labels))
            (d / "impute_median.json").write_text(json.dumps(bundle["impute_median"]))

            card["exercises"][ex] = labels
            card["feature_hash"][ex] = feature_hash(feature_names)
            card["cv_scores"].extend(_legacy_cv_scores(legacy_card, path.stem, ex))
            for lbl in labels:
                card["decision_thresholds"].setdefault(
                    lbl, {"threshold": 0.5, "reportable": True}
                )
            written.append(ex)

        (root / "model_card.json").write_text(json.dumps(card, indent=2))

        out_zip = Path(out_zip)
        out_zip.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out_zip, "w") as z:
            for f in sorted(root.rglob("*")):
                if f.is_file():
                    z.write(f, f.relative_to(root))

    return written


if __name__ == "__main__":
    # Runnable self-check (no framework): converts the real placeholder
    # bundles shipped in trained_models/ and confirms the output loads and
    # predicts with the right shape. The real gate (does it pass E3) lives in
    # ml/test_validate_model_package.py's E9 tests -- this is just a smoke
    # check for running the script directly.
    here = Path(__file__).resolve().parent
    legacy = sorted((here / "trained_models").glob("*_rf.pkl"))
    assert legacy, f"no legacy bundles found in {here / 'trained_models'}"

    out = Path(tempfile.mkdtemp(prefix="rlb_selfcheck_")) / "converted.zip"
    names = convert(legacy, out)
    print(f"OK: converted {len(names)} exercise(s) -> {names}")

    with tempfile.TemporaryDirectory() as td:
        with zipfile.ZipFile(out) as z:
            z.extractall(td)
        for ex in names:
            d = Path(td) / ex
            model = joblib.load(d / "model.joblib")
            fn = json.loads((d / "feature_names.json").read_text())
            lb = json.loads((d / "labels.json").read_text())
            X = np.zeros((2, len(fn)))
            pred = model.predict(X)
            assert pred.shape == (2, len(lb)), f"{ex}: predict shape {pred.shape} != (2, {len(lb)})"
            proba = model.predict_proba(X)
            assert len(proba) == len(lb), f"{ex}: predict_proba len {len(proba)} != {len(lb)}"
            print(f"OK: {ex} predicts with shape (2, {len(lb)})")

    print("ALL repackage_legacy_bundle.py SELF-CHECKS PASSED")

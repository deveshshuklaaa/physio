"""Model package contract + gate — MASTER_BUILD_PLAN_v3.md Phase E (E1-E5,
E10, E11).

Training happens externally. This module is the boundary: it decides whether
a `models.zip` someone hands the app is safe to load, and it is the ONLY
place that decides that -- `model_service.py` (I7) trusts whatever this
module has already accepted and never re-checks package structure itself.

Package layout (E1):
    model_card.json
    <exercise_name>/model.joblib
    <exercise_name>/feature_names.json     (ordered list)
    <exercise_name>/labels.json            (ordered list)
    <exercise_name>/impute_median.json

`model_card.json` required fields (E2) -- see REQUIRED_CARD_FIELDS below and
the docstring on `_validate_into` for the 13 checks (E3).
"""
from __future__ import annotations

import hashlib
import json
import shutil
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

import joblib
import sklearn

REQUIRED_FILES = ("model.joblib", "feature_names.json", "labels.json", "impute_median.json")

REQUIRED_CARD_FIELDS = (
    "trained", "model_type", "is_tree_based", "sklearn_version", "exercises",
    "cv_scores", "caveats", "data_sources", "extractor_version",
    "feature_hash", "decision_thresholds",
)

VALID_DATA_SOURCES = {"pose", "emg", "imu"}


def feature_hash(names: list[str]) -> str:
    """The ONE definition of feature_hash, shared by whatever writes a model
    card and whatever validates one (E3 check 10) -- two definitions would
    make the check theatre."""
    return hashlib.sha256("\n".join(names).encode("utf-8")).hexdigest()


@dataclass
class ValidationReport:
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    exercises: dict = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        """True only if there were no package-level errors AND at least one
        exercise imported cleanly (E4: a bad exercise must not sink good
        ones, but a package with nothing usable in it is still a failure)."""
        return not self.errors and any(v.get("ok") for v in self.exercises.values())


def check_data_sources(card: dict, available: list[str]) -> tuple[bool, str | None]:
    """E11 / E-DEC.2. A model declares the sensors it REQUIRES at scoring
    time; a session missing any of them is declined, never imputed -- an
    absent sensor is not the same failure mode as a gap in a present one
    (that's what impute_median.json is for)."""
    required = card.get("data_sources", [])
    missing = [s for s in required if s not in available]
    if missing:
        return False, f"required data source(s) not available for this session: {', '.join(missing)}"
    return True, None


def _validate_exercise(name, workdir, card, known_wording):
    """Runs E3 checks 3-13 for a single exercise. Returns
    {"ok": bool, "errors": [...], "warnings": [...]}. Stops at the first
    failing check for THIS exercise -- E4 says validation is all-or-nothing
    per exercise, not that every check must fire before reporting."""
    errors, warnings = [], []

    def fail(msg):
        errors.append(msg)
        return {"ok": False, "errors": errors, "warnings": warnings}

    # check 3: folder + required files present
    ex_dir = workdir / name
    if not ex_dir.is_dir():
        return fail(
            f"exercise {name!r}: no folder {name!r}/ found in package "
            f"(declared in model_card.json['exercises'] but missing)"
        )
    missing_files = [f for f in REQUIRED_FILES if not (ex_dir / f).exists()]
    if missing_files:
        for f in missing_files:
            errors.append(f"exercise {name!r}: required file {f!r} missing from package")
        return {"ok": False, "errors": errors, "warnings": warnings}

    for fname in ("feature_names.json", "labels.json", "impute_median.json"):
        try:
            json.loads((ex_dir / fname).read_text())
        except json.JSONDecodeError as e:
            return fail(f"exercise {name!r}: {fname} is not valid JSON: {e}")

    feature_names = json.loads((ex_dir / "feature_names.json").read_text())
    labels = json.loads((ex_dir / "labels.json").read_text())

    # check 4: model.joblib loads
    try:
        model = joblib.load(ex_dir / "model.joblib")
    except Exception as e:
        return fail(f"exercise {name!r}: model.joblib failed to load: {e}")

    # check 5 / 9 (E-DEC.1): ONE estimator with .predict()/.predict_proba(),
    # not a dict/list of per-label estimators.
    if not (hasattr(model, "predict") and callable(model.predict)
            and hasattr(model, "predict_proba") and callable(model.predict_proba)):
        return fail(
            f"exercise {name!r}: model.joblib does not expose .predict() and "
            f".predict_proba() (found {type(model).__name__}) -- a container "
            f"of per-label estimators is not a valid model.joblib, see E-DEC.1"
        )

    # check 6: feature_names.json length matches the model's expected input
    if hasattr(model, "n_features_in_") and len(feature_names) != model.n_features_in_:
        return fail(
            f"exercise {name!r}: feature_names.json has {len(feature_names)} "
            f"entries but model.n_features_in_={model.n_features_in_}"
        )

    # check 7: labels.json length matches the model's output shape
    n_outputs = None
    if hasattr(model, "estimators_"):
        n_outputs = len(model.estimators_)
    if n_outputs is not None and len(labels) != n_outputs:
        return fail(
            f"exercise {name!r}: labels.json has {len(labels)} entries but "
            f"model outputs {n_outputs}"
        )

    # check 8: sklearn version -- WARN only, never blocks (E-DEC.3-adjacent:
    # this is the "maths behind a name changed" side, not exactly checkable)
    card_sklearn = card["sklearn_version"]
    if card_sklearn != sklearn.__version__:
        warnings.append(
            f"exercise {name!r}: sklearn_version in model_card.json "
            f"({card_sklearn!r}) does not match installed sklearn "
            f"({sklearn.__version__!r}) -- warning only, not blocking"
        )

    # check 10 (E-DEC.3): feature_hash -- HARD FAIL. card["feature_hash"] may
    # be a single string (one feature schema shared by every exercise in the
    # package) or a {exercise: hash} mapping (heterogeneous packages, e.g.
    # E9's legacy conversion where each exercise has its own feature set).
    fh = card["feature_hash"]
    expected = fh.get(name) if isinstance(fh, dict) else fh
    if isinstance(fh, dict) and name not in fh:
        return fail(f"exercise {name!r}: feature_hash has no entry for this exercise")
    actual = feature_hash(feature_names)
    if expected != actual:
        return fail(
            f"exercise {name!r}: feature_hash mismatch -- model_card.json "
            f"expects {expected!r}, feature_names.json for this exercise "
            f"hashes to {actual!r}"
        )

    # checks 12 and 13 are independent of each other (one reads
    # decision_thresholds, the other reads the wording resource) -- both run
    # and both get reported, rather than the second being hidden behind the
    # first. A label can be both missing a threshold AND missing wording;
    # the operator should see both, not fix one and get surprised by the other.
    dt = card["decision_thresholds"]
    missing_labels = [lbl for lbl in labels if lbl not in dt]
    if missing_labels:
        errors.append(
            f"exercise {name!r}: decision_thresholds missing entries for "
            f"label(s): {missing_labels}"
        )
    for lbl in labels:
        if lbl in missing_labels:
            continue
        entry = dt[lbl]
        thr = entry.get("threshold") if isinstance(entry, dict) else None
        rep = entry.get("reportable") if isinstance(entry, dict) else None
        if not isinstance(thr, (int, float)) or isinstance(thr, bool) or not (0 <= thr <= 1):
            errors.append(
                f"exercise {name!r}: decision_thresholds[{lbl!r}]['threshold'] "
                f"must be a number in [0, 1], found {thr!r}"
            )
        if not isinstance(rep, bool):
            errors.append(
                f"exercise {name!r}: decision_thresholds[{lbl!r}]['reportable'] "
                f"must be a boolean, found {rep!r}"
            )

    # check 13 (E-DEC.4): every label has patient-facing wording. Skipped
    # (not a hard requirement of THIS call) when no wording resource was
    # supplied -- report_builder.py's dictionary is loaded by the caller.
    if known_wording is not None:
        unworded = [lbl for lbl in labels if lbl not in known_wording]
        if unworded:
            errors.append(
                f"exercise {name!r}: label(s) with no patient-facing wording "
                f"available in report_builder.py: {unworded}"
            )

    if errors:
        return {"ok": False, "errors": errors, "warnings": warnings}
    return {"ok": True, "errors": errors, "warnings": warnings}


def _validate_into(zip_path: Path, workdir: Path, known_exercises, known_wording) -> ValidationReport:
    report = ValidationReport()

    # check 1: zip extracts cleanly
    try:
        with zipfile.ZipFile(zip_path) as z:
            bad = z.testzip()
            if bad is not None:
                report.errors.append(f"zip package is corrupt: member {bad!r} failed its CRC check")
                return report
            z.extractall(workdir)
    except zipfile.BadZipFile as e:
        report.errors.append(f"could not open package: not a valid zip file ({e})")
        return report
    except Exception as e:
        report.errors.append(f"zip extraction failed: {e}")
        return report

    # check 2: model_card.json present, valid JSON, every required field
    # present and correctly typed
    card_path = workdir / "model_card.json"
    if not card_path.exists():
        report.errors.append("model_card.json missing from package root")
        return report
    try:
        card = json.loads(card_path.read_text())
    except json.JSONDecodeError as e:
        report.errors.append(f"model_card.json is not valid JSON: {e}")
        return report

    for f in REQUIRED_CARD_FIELDS:
        if f not in card:
            report.errors.append(f"model_card.json missing required field {f!r}")
    if report.errors:
        return report

    type_checks = [
        ("trained", str), ("model_type", str), ("sklearn_version", str),
        ("exercises", dict), ("cv_scores", list), ("caveats", list),
        ("extractor_version", str), ("decision_thresholds", dict),
    ]
    for f, typ in type_checks:
        if not isinstance(card[f], typ):
            report.errors.append(
                f"model_card.json field {f!r} must be a {typ.__name__}, "
                f"found {type(card[f]).__name__}"
            )
    # is_tree_based is checked separately -- bool is a subclass of int, so a
    # generic isinstance(x, bool) check must run before anything treats 1/0
    # as acceptable (I8's SHAP gate reads this field directly).
    if not isinstance(card["is_tree_based"], bool):
        report.errors.append(
            f"model_card.json field 'is_tree_based' must be a boolean, "
            f"found {type(card['is_tree_based']).__name__} ({card['is_tree_based']!r})"
        )
    if report.errors:
        return report

    # check 11: data_sources present, non-empty, subset of pose|emg|imu
    ds = card["data_sources"]
    if not (isinstance(ds, list) and ds and all(s in VALID_DATA_SOURCES for s in ds)):
        report.errors.append(
            f"model_card.json field 'data_sources' must be a non-empty list "
            f"drawn from {sorted(VALID_DATA_SOURCES)}, found {ds!r}"
        )
        return report

    exercises_declared = card["exercises"]
    if not exercises_declared:
        report.errors.append("model_card.json field 'exercises' is empty -- no exercise declared")
        return report

    # E10: canonical exercise naming, checked when a known set was supplied.
    # No fuzzy matching -- a name outside the known set is rejected by name.
    for name in exercises_declared:
        if known_exercises is not None and name not in known_exercises:
            report.exercises[name] = {
                "ok": False,
                "errors": [
                    f"exercise name {name!r} is not a canonical exercise name "
                    f"(known exercises: {sorted(known_exercises)})"
                ],
                "warnings": [],
            }
            continue
        report.exercises[name] = _validate_exercise(name, workdir, card, known_wording)

    return report


def validate_package(zip_path, known_exercises=None, known_wording=None) -> ValidationReport:
    """Read-only check -- does not write anything. `known_exercises` (from
    exercise_config.py's registry) enables E10's canonical-naming check;
    `known_wording` (from report_builder.py) enables E3 check 13. Both are
    optional so this module can be unit tested without importing either."""
    with tempfile.TemporaryDirectory(prefix="vmp_validate_") as td:
        return _validate_into(Path(zip_path), Path(td), known_exercises, known_wording)


def import_package(zip_path, dest_root, known_exercises=None, known_wording=None) -> ValidationReport:
    """E5: validates, then extracts every PASSING exercise into
    dest_root/<exercise>/, moving any prior version to
    dest_root/_previous/<exercise>/ first. A failing exercise leaves no trace
    in dest_root -- 'never partially import a package'."""
    dest_root = Path(dest_root)
    with tempfile.TemporaryDirectory(prefix="vmp_import_") as td:
        workdir = Path(td)
        report = _validate_into(Path(zip_path), workdir, known_exercises, known_wording)

        for name, result in report.exercises.items():
            if not result.get("ok"):
                continue
            src = workdir / name
            dst = dest_root / name
            if dst.exists():
                prev = dest_root / "_previous" / name
                if prev.exists():
                    shutil.rmtree(prev)
                prev.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(dst), str(prev))
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(src, dst)

        return report

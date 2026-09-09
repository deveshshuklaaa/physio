"""Exercise registry loader — Phase F (backend-core-agent).

Pure-data config: reads `app/config/exercises.json`, validates it, and builds
an in-memory registry at startup. No per-exercise Python, no code hook — see
docs/08_exercise_config.md for the Decision-2 rationale.

Count-agnostic by construction (F7): the loader iterates whatever list is in
the JSON file. It does not hardcode a count, a name, or an index anywhere.
Adding/removing an exercise is a data-only change to exercises.json.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.logging_setup import get_logger

CONFIG_PATH = Path(__file__).resolve().parent / "config" / "exercises.json"

_VALID_TYPES = {"dynamic", "isometric"}
_VALID_BRANCHES = {"pose", "emg", "both"}

log = get_logger("exercise_config")


class ExerciseConfigError(ValueError):
    """Raised when an exercise record fails validation. A config file is a
    trust boundary — fail loudly at startup rather than serve a broken or
    self-contradictory record."""


def _require(record: dict, key: str, name: str) -> Any:
    if key not in record:
        raise ExerciseConfigError(f"exercise {name!r}: missing required field {key!r}")
    return record[key]


def _validate_record(record: dict) -> None:
    name = record.get("name", "<unnamed>")

    for key in ("name", "display_name", "type", "primary_branch", "valid_views",
                "joints", "thresholds"):
        _require(record, key, name)

    ex_type = record["type"]
    if ex_type not in _VALID_TYPES:
        raise ExerciseConfigError(
            f"exercise {name!r}: type={ex_type!r} not in {_VALID_TYPES}"
        )

    branch = record["primary_branch"]
    if branch not in _VALID_BRANCHES:
        raise ExerciseConfigError(
            f"exercise {name!r}: primary_branch={branch!r} not in {_VALID_BRANCHES}"
        )

    has_rep = record.get("rep_trigger") is not None
    has_iso = record.get("isometric_trigger") is not None

    if has_rep and has_iso:
        raise ExerciseConfigError(
            f"exercise {name!r}: carries BOTH rep_trigger and isometric_trigger "
            "— exactly one is required"
        )
    if not has_rep and not has_iso:
        raise ExerciseConfigError(
            f"exercise {name!r}: carries NEITHER rep_trigger nor isometric_trigger "
            "— exactly one is required"
        )

    # F2 — the stored `type` must agree with which trigger the record carries.
    if ex_type == "dynamic" and not has_rep:
        raise ExerciseConfigError(
            f"exercise {name!r}: type='dynamic' but no rep_trigger present "
            "(carries isometric_trigger instead) — stored type disagrees with trigger"
        )
    if ex_type == "isometric" and not has_iso:
        raise ExerciseConfigError(
            f"exercise {name!r}: type='isometric' but no isometric_trigger present "
            "(carries rep_trigger instead) — stored type disagrees with trigger"
        )


def _threshold_is_placeholder(entry: Any) -> bool:
    """A threshold (or trigger sub-field) is still a placeholder iff it is the
    {"value": null, ...} sentinel shape, per F4."""
    return isinstance(entry, dict) and entry.get("value") is None


def _record_has_placeholder_thresholds(record: dict) -> bool:
    for entry in record.get("thresholds", {}).values():
        if _threshold_is_placeholder(entry):
            return True
    for trigger_key in ("rep_trigger", "isometric_trigger"):
        trigger = record.get(trigger_key)
        if not trigger:
            continue
        for field_name, entry in trigger.items():
            if _threshold_is_placeholder(entry):
                return True
    return False


def load_exercises(path: Path = CONFIG_PATH) -> dict[str, dict]:
    """Load, validate, and return the exercise registry as {name: record}.
    Not cached — callers (e.g. tests) may load different config files.
    main.py's lifespan loads this once into app.state at startup."""
    with open(path, "r") as f:
        data = json.load(f)

    registry: dict[str, dict] = {}
    for record in data["exercises"]:
        _validate_record(record)
        name = record["name"]
        if name in registry:
            raise ExerciseConfigError(f"duplicate exercise name in config: {name!r}")
        registry[name] = record

        if _record_has_placeholder_thresholds(record):
            log.warn(
                "exercise_config_placeholder_warning",
                exercise=name,
                detail="one or more thresholds/trigger values are still unfilled placeholders",
            )

    log.info("exercise_config_loaded", exercise_count=len(registry),
              exercises=sorted(registry.keys()))
    return registry


if __name__ == "__main__":
    # Runnable self-check (no framework): F2 trigger/type agreement
    # validation, and F7 count-agnosticism (2, 5, and 6-exercise configs all
    # load correctly with no code change).
    import tempfile

    real = load_exercises()
    # F7: assert the shipped config LOADS, never how many exercises it holds.
    # A hardcoded count here is the same coupling F7 exists to rule out, just
    # relocated from the loader into its test — it would fail the moment
    # someone adds an exercise, which is precisely the thing that must stay
    # free. The count-agnosticism proof is the synthetic N-exercise configs
    # below.
    assert len(real) >= 1, "shipped config loaded no exercises at all"
    print(f"OK: real config loads {len(real)} exercises: {sorted(real)}")

    def _write_and_load(exercises: list[dict]) -> dict[str, dict]:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump({"exercises": exercises}, f)
            tmp_path = Path(f.name)
        try:
            return load_exercises(tmp_path)
        finally:
            tmp_path.unlink()

    def _minimal(name: str, **overrides) -> dict:
        base = {
            "name": name,
            "display_name": name,
            "type": "dynamic",
            "primary_branch": "pose",
            "valid_views": ["SIDE"],
            "joints": [],
            "thresholds": {},
            "rep_trigger": {"joint_display_name": "x", "direction": "decrease",
                             "enter_angle": {"value": None, "_TODO": "x"},
                             "exit_angle": {"value": None, "_TODO": "x"},
                             "depth_target": {"value": None, "_TODO": "x"}},
            "isometric_trigger": None,
        }
        base.update(overrides)
        return base

    # F7 — count-agnosticism: 2 exercises in, 2 out. No hardcoded 5.
    two = _write_and_load([_minimal("dummy_a"), _minimal("dummy_b")])
    assert len(two) == 2 and set(two) == {"dummy_a", "dummy_b"}
    print("OK: 2-exercise config round-trips correctly")

    # F7 — a dummy with NO trained model / extractor still loads (registry
    # does not require a model bundle or a manifest_data/ entry to exist).
    six = _write_and_load(
        [_minimal(n) for n in
         ["heel_slide", "mini_squat", "seated_knee_extension",
          "straight_leg_raise", "terminal_knee_extension", "dummy_no_model"]]
    )
    assert len(six) == 6 and "dummy_no_model" in six
    print("OK: 6-exercise config (5 + dummy with no model/extractor) round-trips correctly")

    # Bad record: both triggers present.
    try:
        _write_and_load([_minimal("bad_both",
                                   isometric_trigger={"joint_display_name": "x",
                                                       "hold_min_angle": {"value": None, "_TODO": "x"},
                                                       "hold_max_angle": {"value": None, "_TODO": "x"}})])
        raise AssertionError("expected ExerciseConfigError for both triggers present")
    except ExerciseConfigError as e:
        print(f"OK: both-triggers rejected loudly: {e}")

    # Bad record: neither trigger present.
    try:
        _write_and_load([_minimal("bad_neither", rep_trigger=None)])
        raise AssertionError("expected ExerciseConfigError for neither trigger present")
    except ExerciseConfigError as e:
        print(f"OK: neither-trigger rejected loudly: {e}")

    # Bad record: type disagrees with trigger.
    try:
        _write_and_load([_minimal("bad_type_mismatch", type="isometric")])
        raise AssertionError("expected ExerciseConfigError for type/trigger mismatch")
    except ExerciseConfigError as e:
        print(f"OK: type/trigger mismatch rejected loudly: {e}")

    print("\nAll exercise_config.py self-checks passed.")

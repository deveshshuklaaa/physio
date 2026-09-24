# Superseded copies evicted from `backend/app/`

These files lived inside `backend/app/` — the live FastAPI package — long after
Phase F replaced them. They were moved here rather than deleted so the history
of what Phase F derived from stays readable.

**None of this is live code.** Nothing in `backend/app/` imports any of it.

| File | Was | Superseded by |
|---|---|---|
| `exercise_base.py` | `app/exercise_base.py` — `JointCheck` / `RepTrigger` / `IsometricTrigger` / `ExerciseDefinition` dataclasses | `app/config/exercises.json` (pure data, Decision 2) |
| `exercises/*.py` | `app/exercises/` — one Python module per exercise | the same JSON file |
| `exercise_config_legacy_loader.py` | `app/services/exercise_config.py` — `pkgutil`-walked the exercises package | `app/exercise_config.py` (the real loader) |

`backend/exercise_runner.py` was also removed in the same pass. It was a
**byte-identical duplicate** of `_old_physio_reference/exercise_runner.py`
(510 lines, imports cv2 + mediapipe at module scope). The original here is
untouched; only the copy went.

## Why this mattered enough to move

Three problems, all invisible until someone tripped over them:

1. **They were not importable.** `app/exercises/squat.py` does
   `from exercise_base import ...` — a non-package import that raises
   `ModuleNotFoundError` when loaded as `app.exercises.squat`. An `__init__.py`
   sat alongside, so the directory read as a live package while being broken.

2. **They had already drifted, in both directions.** The `app/` copies carried
   Phase F's `type` and `primary_branch` additions that the originals lack —
   while `app/exercises/seated_leg_extensions.py` still held the unfixed
   `'Bend to (input range) degrees'` placeholder that the original had already
   had corrected to derive from `HOLD_MIN`/`HOLD_MAX`. Two copies, each newer
   than the other in a different respect. That is what duplicate config always
   turns into.

3. **~1,100 lines of superseded code sat inside the live app package**, reading
   as current to anyone scanning the tree.

These go away entirely with the rest of `_old_physio_reference/` at L1.

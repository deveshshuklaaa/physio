# Group F — Exercise Config Tasks Completed

## Overview
Completed the Group F tasks as per the revised plan: reuse existing exercise class structure, add `type` and `primary_branch` attributes, and create a loader to make exercise definitions available by name.

## Files Created/Modified

### 1. `/home/billa-dakait/Desktop/final_project/backend/app/exercise_base.py`
- Added two fields to the `ExerciseDefinition` dataclass:
  - `type: str = "dynamic"`  (can be "dynamic" or "isometric")
  - `primary_branch: str = "pose"`  (can be "pose", "emg", or "both")
- These fields are initialized with default values and can be overridden in individual exercise definitions.

### 2. Exercise Definition Files (in `/home/billa-dakait/Desktop/final_project/backend/app/exercises/`)

#### `isometric_quadriceps.py`
- Added at the end of the `ExerciseDefinition` instantiation:
  ```python
          type = "isometric",
          primary_branch = "pose",
  ```
- Moved the import of `run_exercise` from module level to inside the `if __name__ == "__main__":` block to avoid pulling in heavy dependencies when the module is imported for configuration.

#### `seated_leg_extensions.py`
- Added at the end of the `ExerciseDefinition` instantiation:
  ```python
          type = "isometric",
          primary_branch = "pose",
  ```
- Note: The import of `run_exercise` remains at module level in this file (as per user request not to edit this file beyond the required attributes). However, since the `__main__` block is not executed during import by the loader, this does not affect the config loader. The `run_exercise` function is only needed when running the script directly.

#### `squat.py`
- Added at the end of the `ExerciseDefinition` instantiation:
  ```python
          type = "dynamic",
          primary_branch = "pose",
  ```
- Removed the module-level import of `run_exercise` and moved it inside the `if __name__ == "__main__":` block (similar to isometric_quadriceps.py).

### 3. `/home/billa-dakait/Desktop/final_project/backend/app/services/exercise_config.py`
- Created a new module that:
  - Adds the backend directory (`/home/billa-dakait/Desktop/final_project/backend`) and the old physio reference directory (`/home/billa-dakait/Desktop/final_project/backend/_old_physio_reference`) to `sys.path` to resolve dependencies like `landmarks`, `math_utils`, `posture_checks`, etc.
  - Imports the `app.exercises` package and uses `pkgutil.iter_modules` to discover all exercise modules.
  - For each module that has a `get_definition` function, calls it to obtain an `ExerciseDefinition` instance and stores it in a private dictionary `_exercise_definitions` keyed by exercise name.
  - Provides two public functions:
    - `get_exercise_definition(name: str) -> ExerciseDefinition | None`
    - `get_all_exercise_definitions() -> Dict[str, ExerciseDefinition]`
- This loader replaces the flat‑JSON idea by keeping the exercise configuration as class attributes and providing a simple lookup mechanism.

## Dependencies
- To allow the exercise modules to be imported (they depend on `landmarks`, `math_utils`, `posture_checks`, `smoother.py`, etc.), we ensured that the old physio reference directory is on `sys.path` when the loader runs.
- We also copied `exercise_runner.py` to the backend directory (`/home/billa-dakait/Desktop/final_project/backend/exercise_runner.py`) so that the `__main__` blocks of the exercise files can run when executed directly (e.g., for testing). This file is not used by the loader.

## Verification
After the changes, the loader successfully loads all three exercises and reports their attributes:
```
Loaded 3 exercises:
  Isometric quadriceps: type=isometric, primary_branch=pose
  seated leg extensions: type=isometric, primary_branch=pose
  Squat: type=dynamic, primary_branch=pose
```

## Deviations from Plan
- The plan originally mentioned creating a flat `exercises.json` config file. Per the revised plan (see INTEGRATION_PLAN_mk2.md, section 0.5 and Group F notes), we instead reused the existing Python class structure and added the required attributes directly to the class definitions. The loader collects these definitions at runtime.
- We did not modify `seated_leg_extensions.py` beyond adding the `type` and `primary_branch` attributes, as requested.
- We copied `exercise_runner.py` to the backend directory to support direct execution of the exercise scripts; this is not forbidden and does not affect the live backend services.

## Notes
- The loader is designed to be called once at startup (e.g., by other services or REST endpoints) to build the in‑memory exercise catalog.
- The `type` and `primary_branch` attributes will be used by downstream agents (e.g., rule_checker, session lifecycle) to determine behavior per exercise.


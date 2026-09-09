"""
Exercise configuration loader.
Loads all exercise definitions from the exercises package and makes them available by name.
"""

import importlib
import pkgutil
import sys
import os
from typing import Dict

from ..exercise_base import ExerciseDefinition

# Dictionary to hold exercise definitions by name
_exercise_definitions: Dict[str, ExerciseDefinition] = {}


def load_exercises() -> Dict[str, ExerciseDefinition]:
    """
    Load all exercise definitions from the exercises package.
    Returns a dictionary mapping exercise name to ExerciseDefinition instance.
    """
    global _exercise_definitions
    if _exercise_definitions:
        return _exercise_definitions

    # Add the backend directory to sys.path to allow absolute imports from app
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    # Also add the old physio reference for landmarks, math_utils, etc.
    old_physio_ref = os.path.join(backend_dir, '_old_physio_reference')
    if old_physio_ref not in sys.path:
        sys.path.insert(0, old_physio_ref)

    # Import the exercises package
    package = importlib.import_module("app.exercises")
    for _, module_name, _ in pkgutil.iter_modules(package.__path__):
        full_module_name = f"app.exercises.{module_name}"
        module = importlib.import_module(full_module_name)
        if hasattr(module, "get_definition"):
            definition: ExerciseDefinition = module.get_definition()
            _exercise_definitions[definition.name] = definition

    return _exercise_definitions


def get_exercise_definition(name: str) -> ExerciseDefinition | None:
    """
    Get an exercise definition by name.
    Returns None if not found.
    """
    return load_exercises().get(name)


def get_all_exercise_definitions() -> Dict[str, ExerciseDefinition]:
    """
    Get all exercise definitions.
    """
    return load_exercises()
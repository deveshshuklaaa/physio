"""G2-E4 — GET /capabilities. No framework.

Run from backend/:  ../venv/bin/python app/routes/test_capabilities.py
Requires JWT_SECRET set (app.main import chain needs it even though this
route itself is unauthenticated) and MONGO_URI -- use a scratch MONGO_DB,
never the default `hemophilia`.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.exercise_config import load_exercises
from app.routes.capabilities import ENGINE_SUPPORTED, router


def _client() -> TestClient:
    app = FastAPI()
    app.state.exercise_registry = load_exercises()
    app.include_router(router)
    return TestClient(app)


def test_capabilities_returns_engine_supported_map():
    r = _client().get("/capabilities")
    assert r.status_code == 200
    body = r.json()
    assert "engineSupported" in body
    # every value is one of our real registered exercises
    registry = load_exercises()
    for their_id, ours in body["engineSupported"].items():
        assert ours in registry, f"{their_id} -> {ours} not in exercise registry"


def test_capabilities_covers_all_six_knee_exercises():
    body = _client().get("/capabilities").json()["engineSupported"]
    for name in [
        "heel_slide", "mini_squat", "seated_knee_extension",
        "straight_leg_raise", "terminal_knee_extension", "squat",
    ]:
        assert name in body.values(), f"no their-side id maps to {name}"


def test_capabilities_excludes_breathing():
    body = _client().get("/capabilities").json()["engineSupported"]
    for breathing_id in ("diaphragmatic_breathing", "thoracic_expansion", "pursed_lip_breathing"):
        assert breathing_id not in body


def test_heel_slides_ankle_and_knee_collapse_to_one_engine_exercise():
    # G2-0.4: their catalogue has two rows with exerciseId "heel_slides"
    # (Knee category and Ankle category). A dict key collapses that for
    # free -- assert it maps to the one engine exercise, not silently drop.
    assert ENGINE_SUPPORTED["heel_slides"] == "heel_slide"


if __name__ == "__main__":
    tests = [v for k, v in list(globals().items()) if k.startswith("test_")]
    for t in tests:
        t()
        print(f"PASS {t.__name__}")
    print(f"{len(tests)} passed")

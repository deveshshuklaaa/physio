"""GET /exercises — F6. Returns the exercise registry, including thresholds,
so the browser can run rules client-side (R4)."""
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/exercises")
async def list_exercises(request: Request):
    registry = request.app.state.exercise_registry
    return {"exercises": list(registry.values())}

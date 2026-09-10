"""GET /capabilities — G2-E4.

nginx strips `/engine`, so this route answers at `/engine/capabilities` for
their frontend and at `/capabilities` in our own tests/dev server.

Maps THEIR exerciseId (part2 MANUAL_EXERCISE_CATALOG, see
exerciseRecommendations.js ~:825) to OUR engine exercise name
(app/config/exercises.json). Their ExercisePlan.jsx consumes this instead of
hardcoding a second copy of the list (D7's whole point: never render an
enabled Start Now for something we cannot actually assess).

heel_slides appears twice on their side (Knee AND Ankle, G2-0.4/D4) but maps
to the same engine exercise here -- a dict key, so that collapses for free.
Breathing exerciseIds (diaphragmatic_breathing, thoracic_expansion,
pursed_lip_breathing) are deliberately absent: no engine exercise assesses
them, and E1 gives those cards no button regardless.
"""
from fastapi import APIRouter, Request

router = APIRouter()

# ponytail: static table, not derived from exercises.json — the mapping is
# a clinical/naming decision (theirs -> ours), not something exercises.json
# encodes. Filtered against the live registry below so a future rename in
# exercises.json can't leave this claiming support it no longer has.
ENGINE_SUPPORTED = {
    "heel_slides": "heel_slide",
    "mini_squats": "mini_squat",
    "seated_knee_extension": "seated_knee_extension",
    "straight_leg_raise": "straight_leg_raise",
    "terminal_knee_extension": "terminal_knee_extension",
    "squat": "squat",
}


@router.get("/capabilities")
async def get_capabilities(request: Request):
    registry = request.app.state.exercise_registry
    supported = {k: v for k, v in ENGINE_SUPPORTED.items() if v in registry}
    return {"engineSupported": supported}

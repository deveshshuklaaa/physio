from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.services.emg_client import get_live_emg_reading, get_emg_status, get_emg_history
from app.telemetry import snapshot as telemetry_snapshot
from app.logging_setup import log_ring_buffer
from app.exercise_config import load_exercises
from app.routes.exercises import router as exercises_router
from app.routes.session import router as session_router
from app.routes.admin_models import router as admin_models_router, build_model_registry
from app.routes.capabilities import router as capabilities_router
from app.routes.report import router as report_router
from app.routes.history import router as history_router
from app.ws.session_ws import router as session_ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    # R8 (MASTER_BUILD_PLAN_v3.md §3.2): model bundles + SHAP TreeExplainers
    # load ONCE here into module state, e.g.:
    #   app.state.model_bundle = joblib.load(...)
    #   app.state.explainer = shap.TreeExplainer(app.state.model_bundle.model)
    # Not this agent's concern (agent 10 / model_service.py) — left empty
    # deliberately so that work has an obvious, already-wired hook.
    log_ring_buffer.start_drain_task()
    # F5 — build the exercise registry once at startup (fail loudly here,
    # not on first request, if the config is broken).
    app.state.exercise_registry = load_exercises()
    # E8 — model registry: per-exercise loaded/analysis_unavailable state,
    # built from disk so a missing model degrades gracefully instead of
    # crashing startup. See app/routes/admin_models.py.
    app.state.model_registry = build_model_registry(app.state.exercise_registry.keys())
    app.state.last_model_import = None
    # G2-D4: sessions and jobs are no longer in memory. A session is a row in
    # MongoDB `physiosessions` (integration plan §4) and the job seam Phase I
    # replaces (§10, agent 10) is that row's `jobId` field. app/db.py owns the
    # Motor client and merges its own lifespan in via the session router.
    yield
    # --- shutdown ---
    log_ring_buffer.drain()


app = FastAPI(title="Physio EMG Backend", lifespan=lifespan)

# G2-A6: CORS is dead. nginx (docker-compose.yml) now puts this API behind the
# same origin as every other service, so no cross-origin request ever reaches
# it. The allowlist that used to live here is removed rather than left stale.

app.include_router(exercises_router)
app.include_router(session_router)
app.include_router(admin_models_router)
# G2-E4: their frontend reads this to decide which cards get a Start Now
# button -- so it never offers an exercise our engine cannot assess.
app.include_router(capabilities_router)
# G2-F6: session video upload (consent-gated, 30-day retention).
app.include_router(report_router)
# G2-G2: paginated session history, authorized by the same B6 rule.
app.include_router(history_router)

# H2's WS route. Imported unconditionally at the top: while H4-H6 and H1-H3
# were built in parallel this was wrapped in try/except ModuleNotFoundError so
# a not-yet-written session_ws.py was a no-op. Both halves exist now, and that
# guard had become a hazard -- a genuine ModuleNotFoundError from a nested
# import inside session_ws.py is indistinguishable from "not written yet", so
# the app would boot, serve /health, and have no WebSocket route at all with
# nothing in the logs saying why. A broken WS module should refuse to start,
# for the same reason _validate_record fails at startup in exercise_config.py.
app.include_router(session_ws_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    return telemetry_snapshot()


@app.get("/api/emg/live")
async def emg_live():
    """Get current live EMG reading from Flask service."""
    live = await get_live_emg_reading()
    if live is None:
        return {"signal": None, "envelop": None, "timestamp": None}
    return live


@app.get("/api/emg/status")
async def emg_status():
    """Get EMG capture status from Flask service."""
    return await get_emg_status()


@app.get("/api/emg/history")
async def emg_history():
    """Get EMG recording history from Flask service."""
    return await get_emg_history()
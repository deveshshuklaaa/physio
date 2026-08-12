from fastapi import FastAPI
from app.services.emg_client import get_live_emg_reading, get_emg_status, get_emg_history

app = FastAPI(title="Physio EMG Backend")


@app.get("/health")
async def health():
    return {"status": "ok"}


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
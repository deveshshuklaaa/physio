# EMG Integration Notes

## C0a: Flask Routes Found (`emg-service/backend/app.py`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves `index.html` from `../website/` |
| GET | `/<path:path>` | Serves static files from `../website/` (live.html, history.html, playback.html, etc.) |
| POST | `/api/start_capture` | Starts serial capture thread |
| POST | `/api/stop_capture` | Stops capture, logs session to history.json |
| GET | `/api/status` | Returns `{"capture_running": bool, "error": str}` |
| GET | `/api/stream` | **SSE endpoint** streaming raw "signal,envelop" lines in real-time |
| GET | `/api/list_recordings` | Returns history.json entries (valid files only) |
| GET | `/api/recording/<filename>` | Downloads a .bin file |
| POST | `/api/save_history` | Manual history entry |
| POST | `/api/snapshot` | Legacy copy of shared bin file |

**No route existed for "current live EMG value as JSON"** — only SSE stream.

## C0b: Serial Reading Architecture

`emg_serial_capture.py` is a **standalone script** (creates virtual pty for Arduino IDE Plotter, writes to `.bin`).

Flask app (`app.py`) has its **own in-process `serial_reader` thread** that:
- Reads directly from serial port (`/dev/ttyUSB0` + fallbacks)
- Parses "signal,envelop" CSV lines
- Packs to binary `.bin` file per session
- Pushes raw lines to `data_queue` for SSE streaming

**Data freshness: Real-time serial (in-process), no file-polling delay.**

## C0c: emg_review.py

Standalone CLI script for matplotlib plotting. **Not wired into Flask** — no `/playback` route calls it. Playback-via-web not functional yet.

---

## C1: Live EMG Value Endpoint

**Before C2:** Only `/api/stream` (SSE) — streams raw CSV lines.

**After C2 (new route added):**
- `GET /api/live-value` → Returns latest reading as JSON:
  ```json
  {"signal": 123, "envelop": 456, "timestamp": 1699459200.123}
  ```
  Returns 204 No Content if no data available (capture not running or queue empty).

**Data freshness:** Real-time — reads from in-process `data_queue` populated by serial thread.

---

## C2: New Flask Route Added

**File:** `emg-service/backend/app.py` (lines 194-223)

```python
@app.route('/api/live-value')
def live_value():
    """Return the most recent EMG reading as JSON."""
    # Peeks at data_queue (non-blocking drain/re-put)
    # Returns JSON with signal, envelop, timestamp
```

---

## C3: FastAPI EMG Client

**File:** `backend/app/services/emg_client.py`

```python
async def get_live_emg_reading(base_url: str = "http://localhost:5000") -> Optional[dict]:
    """Fetch current live EMG reading from Flask service."""
    
async def get_emg_history(base_url: str = "http://localhost:5000") -> list:
    """Fetch EMG recording history from Flask service."""
    
async def get_emg_status(base_url: str = "http://localhost:5000") -> dict:
    """Fetch EMG capture status from Flask service."""
```

Uses `httpx` (async, already in requirements.txt).

---

## C4: FastAPI Test Routes (Verified Working)

**File:** `backend/app/main.py`

| Route | Description |
|-------|-------------|
| `GET /api/emg/live` | Proxies to Flask `/api/live-value` |
| `GET /api/emg/status` | Proxies to Flask `/api/status` |
| `GET /api/emg/history` | Proxies to Flask `/api/list_recordings` |

**Test results (both services running):**
```bash
$ curl http://localhost:8000/api/emg/live
{"signal":null,"envelop":null,"timestamp":null}  # No serial device connected

$ curl http://localhost:8000/api/emg/status
{"capture_running":false,"error":"Could not open any serial port..."}

$ curl http://localhost:8000/api/emg/history
[{"filename":"emg_20260715_022626.bin","size":62332,"timestamp":"20260715_022626"},...]
```

Integration confirmed: FastAPI successfully calls Flask EMG service.

---

## C5: History Storage Schema

**Storage:** `history.json` (simple JSON file) + loose `.bin` files in `data/` subfolder.

**File:** `emg-service/data/history.json`

**Schema:**
```json
[
  {
    "filename": "emg_20260715_022626.bin",
    "timestamp": "20260715_022626",      // Compact format (older entries)
    "size": 62332                        // File size in bytes
  },
  {
    "filename": "emg_20260725_002806.bin",
    "timestamp": "2026-07-25T00:28:06.481637",  // ISO format (newer entries)
    "size": 2875844,
    "duration": 5751.7                          // Optional: seconds (added on stop_capture)
  }
]
```

**Notes for feature_builder.py (I1):**
- `timestamp` format is inconsistent (compact `YYYYMMDD_HHMMSS` vs ISO 8601) — parse both
- `duration` field optional — only present when session stopped cleanly via `/api/stop_capture`
- `.bin` files are binary int16 pairs (signal, envelop), 4 bytes/sample, little-endian
- Sample rate: 500 Hz (from Arduino sketch, hardcoded in `emg_review.py`)

---

## C6: Bin File Reorganization

**Before:** Loose `.bin` files at `emg-service/` root.

**After:** All moved to `emg-service/data/`:
```
emg-service/data/
├── emg_20260715_022626.bin
├── emg_20260715_023015.bin
├── emg_20260725_001020.bin
├── emg_20260725_001036.bin
├── emg_20260725_002223.bin
├── emg_20260725_002505.bin
├── emg_20260725_002514.bin
├── emg_20260725_002647.bin
├── emg_20260725_002806.bin
├── emg_20260725_003200.bin
├── emg_20260725_003317.bin
├── emg_20260725_003913.bin
├── emg_capture.bin          # Legacy shared file (used by /api/snapshot)
└── history.json
```

**Files updated for new paths:**
- `emg-service/backend/app.py`: `DATA_DIR = os.path.join(BASE_DIR, '..', 'data')`
- `emg-service/emg_review.py`: `BIN_FILE = 'data/emg_capture.bin'`
- `emg-service/emg_serial_capture.py`: `BIN_FILE = 'data/emg_capture.bin'`

**Verified working:**
- Flask `/api/list_recordings` returns history entries ✓
- Flask `/api/recording/<filename>` downloads files ✓
- `emg_review.py` loads and parses `data/emg_capture.bin` ✓ (718,961 samples)

---

## Key File Paths

| File | Purpose |
|------|---------|
| `emg-service/backend/app.py` | Flask EMG service (port 5000) |
| `emg-service/data/history.json` | Recording history index |
| `emg-service/data/*.bin` | Binary EMG recordings |
| `backend/app/services/emg_client.py` | Async HTTP client for Flask EMG service |
| `backend/app/main.py` | FastAPI backend (port 8000) with `/api/emg/*` routes |

---

## Running Both Services

```bash
# Terminal 1: Flask EMG service
cd /home/billa-dakait/Desktop/final_project/emg-service/backend
/home/billa-dakait/Desktop/final_project/emg-service/venv/bin/python app.py

# Terminal 2: FastAPI backend
cd /home/billa-dakait/Desktop/final_project/backend
/home/billa-dakait/Desktop/final_project/backend/venv/bin/python -m uvicorn app.main:app --port 8000
```

Flask runs on `http://localhost:5000`, FastAPI on `http://localhost:8000`.
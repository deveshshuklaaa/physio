---
type: community
members: 27
---

# app.py

**Members:** 27 nodes

## Members
- [[Actually start the capture thread. Caller must hold thread_lock.]] - rationale - emg-service/backend/app.py
- [[Background thread to read from serial port, log binary data, and push lines to…]] - rationale - emg-service/backend/app.py
- [[Called once when the server process starts, so recordingstreaming works…]] - rationale - emg-service/backend/app.py
- [[Generator for SSE that yields lines from the queue.]] - rationale - emg-service/backend/app.py
- [[Manual copy of the legacy shared bin file, if anything still uses it. Normal…]] - rationale - emg-service/backend/app.py
- [[Return the most recent EMG reading as JSON. Reads from the in-process…]] - rationale - emg-service/backend/app.py
- [[Server-Sent Events endpoint for real-time data.]] - rationale - emg-service/backend/app.py
- [[_start_capture_locked()]] - code - emg-service/backend/app.py
- [[add_to_history()]] - code - emg-service/backend/app.py
- [[app.py]] - code - emg-service/backend/app.py
- [[event_stream()]] - code - emg-service/backend/app.py
- [[get_recording()]] - code - emg-service/backend/app.py
- [[index()]] - code - emg-service/backend/app.py
- [[list_recordings()]] - code - emg-service/backend/app.py
- [[live_value()]] - code - emg-service/backend/app.py
- [[load_history()]] - code - emg-service/backend/app.py
- [[route]] - code
- [[save_history()]] - code - emg-service/backend/app.py
- [[save_history_endpoint()]] - code - emg-service/backend/app.py
- [[serial_reader()]] - code - emg-service/backend/app.py
- [[snapshot()]] - code - emg-service/backend/app.py
- [[start_capture()]] - code - emg-service/backend/app.py
- [[start_capture_at_boot()]] - code - emg-service/backend/app.py
- [[static_files()]] - code - emg-service/backend/app.py
- [[status()]] - code - emg-service/backend/app.py
- [[stop_capture()]] - code - emg-service/backend/app.py
- [[stream()]] - code - emg-service/backend/app.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/apppy
SORT file.name ASC
```

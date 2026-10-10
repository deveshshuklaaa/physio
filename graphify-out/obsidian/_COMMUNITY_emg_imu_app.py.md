---
type: community
members: 54
---

# emg_imu_app.py

**Members:** 54 nodes

## Members
- [[dot-handle()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[dot-handle()_1]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[Best-effort LAN IP of this machine - print this at boot so the ESP32 firmware's…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Called once when the server process starts. UDP listener + watchdog run forever.]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Console-only diagnostic loop. Since there's no serial monitor on the ESP32…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Control port (8889). Plain comma-separated text messages implementing the…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[ControlUDPHandler]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[Data port (8888) only. Every datagram now starts with a 13-byte header (type,…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[EMGUDPHandler]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[Generator for SSE that yields lines from the queue.]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[If we're 'streaming' but heard nothing on the control channel for too long, the…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Operator-triggered STOP. Works from 'armed' (nobody connected yet) or…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Operator-triggered start responding to the ESP's HELLO broadcasts with an…]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[Server-Sent Events endpoint for real-time data.]] - rationale - hardware/esp32_imu/backend/emg_imu_app.py
- [[_annotations_path()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[_start_recording_locked()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[_stop_recording_locked()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[add_annotation()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[add_to_history()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[arm()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[compress_capture_file()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[control_reader()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[delete_annotation()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[disarm()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[drain_data_queue()]] - code - hardware/esp32_imu/tests/test_handshake.py
- [[emg_imu_app.py]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[event_stream()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[get_annotations()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[get_local_ip()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[get_preview()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[get_recording()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[get_recording_meta()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[index()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[list_recordings()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[load_annotations()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[load_history()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[main()_4]] - code - hardware/esp32_imu/tests/test_handshake.py
- [[route]] - code
- [[save_annotations()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[save_history()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[save_history_endpoint()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[send_data_packet()]] - code - hardware/esp32_imu/tests/test_handshake.py
- [[session_watchdog()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[start_capture()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[start_ingest_thread_at_boot()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[static_files()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[status()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[stop_recording()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[stream()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[test_handshake.py]] - code - hardware/esp32_imu/tests/test_handshake.py
- [[udp_reader()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[udp_watchdog()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[update_annotation()]] - code - hardware/esp32_imu/backend/emg_imu_app.py
- [[wait_until()]] - code - hardware/esp32_imu/tests/test_handshake.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/emg_imu_apppy
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_appmain.py]]
- 1 edge to [[_COMMUNITY_dependencies_2]]

## Top bridge nodes
- [[emg_imu_app.py]] - degree 37, connects to 1 community
- [[status()]] - degree 4, connects to 1 community
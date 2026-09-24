---
source_file: "hardware/esp32_imu/backend/emg_imu_app.py"
type: "code"
community: "emg_imu_app.py"
location: "L339"
tags:
  - graphify/code
  - graphify/INFERRED
  - community/emg_imu_apppy
---

# start_ingest_thread_at_boot()

## Connections
- [[Called once when the server process starts. UDP listener + watchdog run forever.]] - `rationale_for` [EXTRACTED]
- [[control_reader()]] - `indirect_call` [INFERRED]
- [[emg_imu_app.py]] - `contains` [EXTRACTED]
- [[session_watchdog()]] - `indirect_call` [INFERRED]
- [[udp_reader()]] - `indirect_call` [INFERRED]
- [[udp_watchdog()]] - `indirect_call` [INFERRED]

#graphify/code #graphify/INFERRED #community/emg_imu_apppy
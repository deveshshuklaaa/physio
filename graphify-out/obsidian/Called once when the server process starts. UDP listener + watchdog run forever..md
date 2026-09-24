---
source_file: "hardware/esp32_imu/backend/emg_imu_app.py"
type: "rationale"
community: "emg_imu_app.py"
location: "L340"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/emg_imu_apppy
---

# Called once when the server process starts. UDP listener + watchdog run forever.

## Connections
- [[start_ingest_thread_at_boot()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/emg_imu_apppy
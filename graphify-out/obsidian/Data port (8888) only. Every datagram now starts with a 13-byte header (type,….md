---
source_file: "hardware/esp32_imu/backend/emg_imu_app.py"
type: "rationale"
community: "emg_imu_app.py"
location: "L129"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/emg_imu_apppy
---

# Data port (8888) only. Every datagram now starts with a 13-byte header (type,…

## Connections
- [[EMGUDPHandler]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/emg_imu_apppy
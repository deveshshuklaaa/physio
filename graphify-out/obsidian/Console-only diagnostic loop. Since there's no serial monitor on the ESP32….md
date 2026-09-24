---
source_file: "hardware/esp32_imu/backend/emg_imu_app.py"
type: "rationale"
community: "emg_imu_app.py"
location: "L254"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/emg_imu_apppy
---

# Console-only diagnostic loop. Since there's no serial monitor on the ESP32…

## Connections
- [[udp_watchdog()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/emg_imu_apppy
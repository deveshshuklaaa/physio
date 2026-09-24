---
source_file: "emg-service/backend/app.py"
type: "code"
community: "app.py"
location: "L130"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/apppy
---

# _start_capture_locked()

## Connections
- [[Actually start the capture thread. Caller must hold thread_lock.]] - `rationale_for` [EXTRACTED]
- [[app.py]] - `contains` [EXTRACTED]
- [[serial_reader()]] - `indirect_call` [INFERRED]
- [[start_capture()]] - `calls` [EXTRACTED]
- [[start_capture_at_boot()]] - `calls` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/apppy
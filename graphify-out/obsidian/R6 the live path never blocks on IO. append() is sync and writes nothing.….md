---
source_file: "backend/app/services/test_session_buffer.py"
type: "rationale"
community: "test_session_buffer.py"
location: "L84"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/test_session_bufferpy
---

# R6: the live path never blocks on I/O. append() is sync and writes nothing.…

## Connections
- [[test_h1_append_does_not_touch_disk()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/test_session_bufferpy
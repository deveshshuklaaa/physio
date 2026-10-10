---
source_file: "backend/app/services/test_session_buffer.py"
type: "rationale"
community: "get_buffer"
location: "L84"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/get_buffer
---

# R6: the live path never blocks on I/O. append() is sync and writes nothing.…

## Connections
- [[test_h1_append_does_not_touch_disk()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/get_buffer
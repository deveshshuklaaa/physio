---
source_file: "backend/app/services/test_session_buffer.py"
type: "rationale"
community: "test_session_buffer.py"
location: "L150"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/test_session_bufferpy
---

# Cross-session leak guard. One patient's frames must never reach another's…

## Connections
- [[test_h1_buffers_are_isolated_per_session()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/test_session_bufferpy
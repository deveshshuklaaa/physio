---
source_file: "backend/app/services/test_session_buffer.py"
type: "rationale"
community: "test_session_buffer.py"
location: "L105"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/test_session_bufferpy
---

# The evidence path. A flush that returns cleanly but writes nothing is the worst…

## Connections
- [[test_h1_flush_writes_real_frames_to_disk()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/test_session_bufferpy
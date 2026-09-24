---
source_file: "backend/app/services/session_buffer.py"
type: "rationale"
community: "SessionBuffer"
location: "L55"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/SessionBuffer
---

# Sync, O(1), no disk I/O. Overwrite-oldest when at capacity (R3).

## Connections
- [[dot-append()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/SessionBuffer
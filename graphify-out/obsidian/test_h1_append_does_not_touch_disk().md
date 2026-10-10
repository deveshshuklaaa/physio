---
source_file: "backend/app/services/test_session_buffer.py"
type: "code"
community: "get_buffer"
location: "L83"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/get_buffer
---

# test_h1_append_does_not_touch_disk()

## Connections
- [[R6 the live path never blocks on IO. append() is sync and writes nothing.…]] - `rationale_for` [EXTRACTED]
- [[_frame()_1]] - `calls` [EXTRACTED]
- [[_fresh_tmp_root()]] - `calls` [EXTRACTED]
- [[get_buffer()]] - `calls` [EXTRACTED]
- [[test_session_buffer.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/get_buffer
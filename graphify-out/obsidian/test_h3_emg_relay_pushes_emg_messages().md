---
source_file: "backend/app/ws/test_session_ws.py"
type: "code"
community: "test_session_ws.py"
location: "L199"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/test_session_wspy
---

# test_h3_emg_relay_pushes_emg_messages()

## Connections
- [[H3 a background task polls the EMG client and pushes to this socket. Nothing…]] - `rationale_for` [EXTRACTED]
- [[TestClient]] - `calls` [INFERRED]
- [[_auth_frame()]] - `calls` [EXTRACTED]
- [[_start()]] - `calls` [EXTRACTED]
- [[session_ws()]] - `indirect_call` [INFERRED]
- [[test_session_ws.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/test_session_wspy
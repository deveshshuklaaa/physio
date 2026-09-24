---
source_file: "backend/app/routes/session.py"
type: "code"
community: "session_ws.py"
location: "L128"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/session_wspy
---

# get_lookup_doctor_id()

## Connections
- [[Set by appdb.py's lifespan to the real motor-backed lookup of…]] - `rationale_for` [EXTRACTED]
- [[_authenticate()]] - `calls` [EXTRACTED]
- [[_authorize_or_403()]] - `calls` [EXTRACTED]
- [[_no_doctor_lookup()]] - `indirect_call` [INFERRED]
- [[history.py]] - `imports` [EXTRACTED]
- [[patient_sessions()]] - `calls` [EXTRACTED]
- [[session.py]] - `contains` [EXTRACTED]
- [[session_start()]] - `calls` [EXTRACTED]
- [[session_ws.py]] - `imports` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/session_wspy
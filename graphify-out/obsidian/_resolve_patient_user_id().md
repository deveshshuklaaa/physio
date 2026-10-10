---
source_file: "backend/app/routes/history.py"
type: "code"
community: "history.py"
location: "L52"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/historypy
---

# _resolve_patient_user_id()

## Connections
- [[CurrentUser]] - `uses` [INFERRED]
- [[_run()]] - `calls` [EXTRACTED]
- [[history.py]] - `contains` [EXTRACTED]
- [[patient_sessions()]] - `calls` [EXTRACTED]
- [[raw_id - patientUserId (a string), or None if it can't be resolved. See module…]] - `rationale_for` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/historypy
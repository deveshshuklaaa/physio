---
source_file: "backend/app/auth.py"
type: "code"
community: "session_ws.py"
location: "L95"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/session_wspy
---

# authorize_patient_access()

## Connections
- [[CurrentUser]] - `references` [EXTRACTED]
- [[LookupDoctorId]] - `references` [EXTRACTED]
- [[True iff `user` may readact on `patient_user_id`'s clinical data. Rules (§3,…]] - `rationale_for` [EXTRACTED]
- [[_authenticate()]] - `calls` [EXTRACTED]
- [[_authorize_or_403()]] - `calls` [EXTRACTED]
- [[_run()_1]] - `calls` [EXTRACTED]
- [[auth.py]] - `contains` [EXTRACTED]
- [[history.py]] - `imports` [EXTRACTED]
- [[patient_sessions()]] - `calls` [EXTRACTED]
- [[session.py]] - `imports` [EXTRACTED]
- [[session_ws.py]] - `imports` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/session_wspy
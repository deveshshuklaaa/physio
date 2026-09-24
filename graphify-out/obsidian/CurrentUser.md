---
source_file: "backend/app/auth.py"
type: "code"
community: "CurrentUser"
location: "L40"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/CurrentUser
---

# CurrentUser

## Connections
- [[_authenticate()]] - `uses` [INFERRED]
- [[_authorize_or_403()]] - `uses` [INFERRED]
- [[_decode()]] - `calls` [EXTRACTED]
- [[_resolve_patient_user_id()]] - `uses` [INFERRED]
- [[_run()_3]] - `calls` [EXTRACTED]
- [[_run()_4]] - `calls` [EXTRACTED]
- [[auth.py]] - `contains` [EXTRACTED]
- [[authorize_patient_access()]] - `references` [EXTRACTED]
- [[decode_ws_token()]] - `references` [EXTRACTED]
- [[get_current_user()]] - `references` [EXTRACTED]
- [[get_video()]] - `uses` [INFERRED]
- [[history.py]] - `imports` [EXTRACTED]
- [[patient_sessions()]] - `uses` [INFERRED]
- [[report.py]] - `imports` [EXTRACTED]
- [[session.py]] - `imports` [EXTRACTED]
- [[session_end()]] - `uses` [INFERRED]
- [[session_start()]] - `uses` [INFERRED]
- [[session_status()]] - `uses` [INFERRED]
- [[session_summary()]] - `uses` [INFERRED]
- [[session_ws.py]] - `imports` [EXTRACTED]
- [[upload_video()]] - `uses` [INFERRED]

#graphify/code #graphify/EXTRACTED #community/CurrentUser
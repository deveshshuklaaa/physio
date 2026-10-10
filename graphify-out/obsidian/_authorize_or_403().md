---
source_file: "backend/app/routes/session.py"
type: "code"
community: "session.py"
location: "L151"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/sessionpy
---

# _authorize_or_403()

## Connections
- [[CurrentUser]] - `uses` [INFERRED]
- [[authorize_patient_access()]] - `calls` [EXTRACTED]
- [[get_lookup_doctor_id()]] - `calls` [EXTRACTED]
- [[get_video()]] - `calls` [EXTRACTED]
- [[report.py]] - `imports` [EXTRACTED]
- [[session.py]] - `contains` [EXTRACTED]
- [[session_end()]] - `calls` [EXTRACTED]
- [[session_status()]] - `calls` [EXTRACTED]
- [[session_summary()]] - `calls` [EXTRACTED]
- [[upload_video()]] - `calls` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/sessionpy
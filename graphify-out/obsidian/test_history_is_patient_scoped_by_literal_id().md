---
source_file: "backend/app/routes/test_history.py"
type: "code"
community: "test_history.py"
location: "L121"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/test_historypy
---

# test_history_is_patient_scoped_by_literal_id()

## Connections
- [[A raw literal id (not 'me', not PATxxx) is a patientUserId -- p2 reading it…]] - `rationale_for` [EXTRACTED]
- [[TestClient]] - `calls` [INFERRED]
- [[_auth()_2]] - `calls` [EXTRACTED]
- [[_cleanup_sessions()]] - `calls` [EXTRACTED]
- [[_start_session()]] - `calls` [EXTRACTED]
- [[test_history.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/test_historypy
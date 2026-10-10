---
source_file: "backend/app/routes/test_session.py"
type: "code"
community: "TestClient"
location: "L280"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/TestClient
---

# test_g2b_patient_id_is_ignored_from_the_body()

## Connections
- [[D12 a client-supplied patient_id must never override the token.]] - `rationale_for` [EXTRACTED]
- [[TestClient]] - `calls` [INFERRED]
- [[_auth()_1]] - `calls` [EXTRACTED]
- [[test_session.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/TestClient
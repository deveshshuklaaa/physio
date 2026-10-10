---
source_file: "backend/app/routes/test_report.py"
type: "code"
community: "test_report.py"
location: "L90"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/test_reportpy
---

# test_f4_gemini_failure_preserves_counts()

## Connections
- [[GeminiError]] - `calls` [EXTRACTED]
- [[TestClient]] - `calls` [INFERRED]
- [[_auth()]] - `calls` [EXTRACTED]
- [[_cleanup()]] - `calls` [EXTRACTED]
- [[generate_report()]] - `indirect_call` [INFERRED]
- [[test_report.py]] - `contains` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/test_reportpy
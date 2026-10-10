---
type: community
members: 15
---

# test_report.py

**Members:** 15 nodes

## Members
- [[Exception]] - code
- [[G2-F -- report generation, video upload, retention. No framework. Run from…]] - rationale - backend/app/routes/test_report.py
- [[GeminiError]] - code - backend/app/services/gemini_report.py
- [[Raised on any failure to get report text back. Callers set…]] - rationale - backend/app/services/gemini_report.py
- [[_auth()]] - code - backend/app/routes/test_report.py
- [[_cleanup()]] - code - backend/app/routes/test_report.py
- [[_token()]] - code - backend/app/routes/test_report.py
- [[test_f4_gemini_failure_preserves_counts()]] - code - backend/app/routes/test_report.py
- [[test_f4_gemini_success_sets_reported()]] - code - backend/app/routes/test_report.py
- [[test_f6_consent_accepts_and_writes_file()]] - code - backend/app/routes/test_report.py
- [[test_f6_no_consent_rejects_and_writes_no_file()]] - code - backend/app/routes/test_report.py
- [[test_f6_rejects_unsupported_content_type()]] - code - backend/app/routes/test_report.py
- [[test_f6_size_cap()]] - code - backend/app/routes/test_report.py
- [[test_f8_sweep_against_real_db()]] - code - backend/app/routes/test_report.py
- [[test_report.py]] - code - backend/app/routes/test_report.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/test_reportpy
SORT file.name ASC
```

## Connections to other communities
- 7 edges to [[_COMMUNITY_TestClient]]
- 3 edges to [[_COMMUNITY_gemini_report.py]]
- 3 edges to [[_COMMUNITY_session.py]]
- 2 edges to [[_COMMUNITY_session_ws.py]]
- 1 edge to [[_COMMUNITY_appmain.py]]
- 1 edge to [[_COMMUNITY_get_buffer]]
- 1 edge to [[_COMMUNITY_db.py]]

## Top bridge nodes
- [[test_report.py]] - degree 19, connects to 6 communities
- [[test_f4_gemini_failure_preserves_counts()]] - degree 6, connects to 2 communities
- [[test_f4_gemini_success_sets_reported()]] - degree 5, connects to 2 communities
- [[GeminiError]] - degree 6, connects to 1 community
- [[test_f6_consent_accepts_and_writes_file()]] - degree 4, connects to 1 community
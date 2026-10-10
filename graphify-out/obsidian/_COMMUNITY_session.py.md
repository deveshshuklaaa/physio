---
type: community
members: 35
---

# session.py

**Members:** 35 nodes

## Members
- [[ASYNC as of G2-D4 (see module docstring). session_ws.py awaits this.]] - rationale - backend/app/routes/session.py
- [[BaseModel]] - code
- [[D6 the client's own count of what happened, written at session end. This is a…]] - rationale - backend/app/routes/session.py
- [[G2-G4 play back a session's video. The counterpart to the upload above --…]] - rationale - backend/app/routes/report.py
- [[Idempotent the End Session button, the WS {typeend} message, and the H6…]] - rationale - backend/app/routes/session.py
- [[R1.2a pre-session calibration gate (docs13 R1). No session id yet -- this…]] - rationale - backend/app/routes/session.py
- [[RepLogIn]] - code - backend/app/routes/session.py
- [[Request_2]] - code
- [[Request_3]] - code
- [[Session lifecycle — H4 (startstatus), H5 (end, idempotent), G2-B3 (auth),…]] - rationale - backend/app/routes/session.py
- [[SessionEnd]] - code - backend/app/routes/session.py
- [[SessionStart]] - code - backend/app/routes/session.py
- [[SessionSummary]] - code - backend/app/routes/session.py
- [[Set correlation IDs for the duration of the `with` block (and anything awaited…]] - rationale - backend/app/logging_setup.py
- [[UploadFile_1]] - code
- [[_authorize_or_403()]] - code - backend/app/routes/session.py
- [[_load_or_404()]] - code - backend/app/routes/session.py
- [[_now()]] - code - backend/app/routes/session.py
- [[_post()]] - code - backend/tools/fake_session_client.py
- [[_sessions()]] - code - backend/app/routes/session.py
- [[_spawn()]] - code - backend/app/routes/session.py
- [[correlation()]] - code - backend/app/logging_setup.py
- [[datetime]] - code
- [[end_session()]] - code - backend/app/routes/session.py
- [[generate_report()]] - code - backend/app/services/gemini_report.py
- [[get_session()]] - code - backend/app/routes/session.py
- [[get_video()]] - code - backend/app/routes/report.py
- [[session.py]] - code - backend/app/routes/session.py
- [[session_calibrate()]] - code - backend/app/routes/session.py
- [[session_end()]] - code - backend/app/routes/session.py
- [[session_exists()]] - code - backend/app/routes/session.py
- [[session_start()]] - code - backend/app/routes/session.py
- [[session_status()]] - code - backend/app/routes/session.py
- [[session_summary()]] - code - backend/app/routes/session.py
- [[upload_video()]] - code - backend/app/routes/report.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/sessionpy
SORT file.name ASC
```

## Connections to other communities
- 35 edges to [[_COMMUNITY_session_ws.py]]
- 8 edges to [[_COMMUNITY_history.py]]
- 6 edges to [[_COMMUNITY_gemini_report.py]]
- 6 edges to [[_COMMUNITY_appmain.py]]
- 3 edges to [[_COMMUNITY_test_report.py]]
- 3 edges to [[_COMMUNITY_db.py]]
- 2 edges to [[_COMMUNITY_fake_session_client.py]]
- 2 edges to [[_COMMUNITY__get]]
- 1 edge to [[_COMMUNITY_admin_models.py]]
- 1 edge to [[_COMMUNITY_dependencies_2]]

## Top bridge nodes
- [[session.py]] - degree 40, connects to 5 communities
- [[session_start()]] - degree 13, connects to 4 communities
- [[session_status()]] - degree 7, connects to 3 communities
- [[correlation()]] - degree 13, connects to 2 communities
- [[end_session()]] - degree 12, connects to 2 communities
---
type: community
members: 37
---

# session_ws.py

**Members:** 37 nodes

## Members
- [[ASYNC as of G2-D4 (see module docstring). session_ws.py awaits this.]] - rationale - backend/app/routes/session.py
- [[Background task poll EMG at EMG_POLL_INTERVAL_S, push readings to the client.…]] - rationale - backend/app/ws/session_ws.py
- [[Every threshold that carries an `alert`, with the rule that fires it. The alert…]] - rationale - backend/app/services/gemini_report.py
- [[First frame after accept must be {typeauth,token...} within…]] - rationale - backend/app/ws/session_ws.py
- [[First-half vs second-half clean rate + angle range. The prompt asks for…]] - rationale - backend/app/services/gemini_report.py
- [[G2-F1F2 -- Gemini coaching report. Ports `call_gemini()` and…]] - rationale - backend/app/services/gemini_report.py
- [[Idempotent the End Session button, the WS {typeend} message, and the H6…]] - rationale - backend/app/routes/session.py
- [[One HTTP call, one retry on failure. Raises GeminiError on both failing --…]] - rationale - backend/app/services/gemini_report.py
- [[Runs detached, after the handler's cancel scope is gone. Nothing here may fail…]] - rationale - backend/app/ws/session_ws.py
- [[Set by appdb.py's lifespan to the real motor-backed lookup of…]] - rationale - backend/app/routes/session.py
- [[Set correlation IDs for the duration of the `with` block (and anything awaited…]] - rationale - backend/app/logging_setup.py
- [[The measurement setup, so the note can explain WHY a rep failed. Everything…]] - rationale - backend/app/services/gemini_report.py
- [[The session WebSocket — H2 (endpoint), H3 (EMG relay), H6 (abrupt disconnect),…]] - rationale - backend/app/ws/session_ws.py
- [[WebSocket]] - code
- [[_api_key()]] - code - backend/app/services/gemini_report.py
- [[_authenticate()]] - code - backend/app/ws/session_ws.py
- [[_emg_relay()]] - code - backend/app/ws/session_ws.py
- [[_error_descriptions()]] - code - backend/app/services/gemini_report.py
- [[_error_summary()]] - code - backend/app/services/gemini_report.py
- [[_exercise_context()]] - code - backend/app/services/gemini_report.py
- [[_exercise_description()]] - code - backend/app/services/gemini_report.py
- [[_finalize()]] - code - backend/app/ws/session_ws.py
- [[_rep_lines()]] - code - backend/app/services/gemini_report.py
- [[_sessions()]] - code - backend/app/routes/session.py
- [[_trend_summary()]] - code - backend/app/services/gemini_report.py
- [[build_prompt()]] - code - backend/app/services/gemini_report.py
- [[call_gemini()_1]] - code - backend/app/services/gemini_report.py
- [[correlation()]] - code - backend/app/logging_setup.py
- [[end_session()]] - code - backend/app/routes/session.py
- [[gemini_report.py]] - code - backend/app/services/gemini_report.py
- [[generate_report()]] - code - backend/app/services/gemini_report.py
- [[get_lookup_doctor_id()]] - code - backend/app/routes/session.py
- [[get_session()]] - code - backend/app/routes/session.py
- [[language_name()]] - code - backend/app/services/gemini_report.py
- [[session_exists()]] - code - backend/app/routes/session.py
- [[session_ws()]] - code - backend/app/ws/session_ws.py
- [[session_ws.py]] - code - backend/app/ws/session_ws.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/session_wspy
SORT file.name ASC
```

## Connections to other communities
- 22 edges to [[_COMMUNITY_session.py]]
- 9 edges to [[_COMMUNITY_CurrentUser]]
- 6 edges to [[_COMMUNITY_test_report.py]]
- 6 edges to [[_COMMUNITY_test_session_ws.py]]
- 4 edges to [[_COMMUNITY_appmain.py]]
- 3 edges to [[_COMMUNITY_exercise_config.py]]
- 3 edges to [[_COMMUNITY_logging_setup.py]]
- 2 edges to [[_COMMUNITY_test_session_buffer.py]]
- 1 edge to [[_COMMUNITY_SessionBuffer]]
- 1 edge to [[_COMMUNITY_common_features.py]]

## Top bridge nodes
- [[session_ws.py]] - degree 24, connects to 7 communities
- [[gemini_report.py]] - degree 19, connects to 3 communities
- [[correlation()]] - degree 13, connects to 2 communities
- [[generate_report()]] - degree 11, connects to 2 communities
- [[_authenticate()]] - degree 10, connects to 2 communities
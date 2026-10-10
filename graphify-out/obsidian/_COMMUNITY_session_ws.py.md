---
type: community
members: 36
---

# session_ws.py

**Members:** 36 nodes

## Members
- [[Background task poll EMG at EMG_POLL_INTERVAL_S, push readings to the client.…]] - rationale - backend/app/ws/session_ws.py
- [[Closed event vocabulary — MASTER_BUILD_PLAN_v3.md §8b.3. Mirrored 11 in…]] - rationale - backend/app/events.py
- [[CurrentUser]] - code - backend/app/auth.py
- [[FastAPI]] - code
- [[FastAPI dependency `Authorization Bearer token` - CurrentUser.]] - rationale - backend/app/auth.py
- [[First frame after accept must be {typeauth,token...} within…]] - rationale - backend/app/ws/session_ws.py
- [[G2-B1B2B6 — JWT auth shared with their (part2) backend. Their JWT HS256,…]] - rationale - backend/app/auth.py
- [[G2-F5F6 -- report polling and video upload. POST session{session_id}video…]] - rationale - backend/app/routes/report.py
- [[LookupDoctorId]] - code
- [[Read-only lookup on patientprofiles (theirs, §1) -- never write it.]] - rationale - backend/app/routes/report.py
- [[Runs detached, after the handler's cancel scope is gone. Nothing here may fail…]] - rationale - backend/app/ws/session_ws.py
- [[Same decode path, for the WS handshake frame (D3B4) -- there is no HTTP header…]] - rationale - backend/app/auth.py
- [[Shared decode path for both the HTTP dependency and the WS handshake. Expired…]] - rationale - backend/app/auth.py
- [[Structured JSON logger — MASTER_BUILD_PLAN_v3.md §8b. One JSON object per line,…]] - rationale - backend/app/logging_setup.py
- [[The session WebSocket — H2 (endpoint), H3 (EMG relay), H6 (abrupt disconnect),…]] - rationale - backend/app/ws/session_ws.py
- [[True iff `user` may readact on `patient_user_id`'s clinical data. Rules (§3,…]] - rationale - backend/app/auth.py
- [[WebSocket]] - code
- [[_authenticate()]] - code - backend/app/ws/session_ws.py
- [[_consent()]] - code - backend/app/routes/report.py
- [[_decode()]] - code - backend/app/auth.py
- [[_emg_relay()]] - code - backend/app/ws/session_ws.py
- [[_finalize()]] - code - backend/app/ws/session_ws.py
- [[_run()_1]] - code - backend/app/auth.py
- [[_token()_2]] - code - backend/app/auth.py
- [[auth.py]] - code - backend/app/auth.py
- [[authorize_patient_access()]] - code - backend/app/auth.py
- [[decode_ws_token()]] - code - backend/app/auth.py
- [[events.py]] - code - backend/app/events.py
- [[get_current_user()]] - code - backend/app/auth.py
- [[get_logger()]] - code - backend/app/logging_setup.py
- [[is_valid_event()]] - code - backend/app/events.py
- [[logging_setup.py]] - code - backend/app/logging_setup.py
- [[report.py]] - code - backend/app/routes/report.py
- [[session_ws()]] - code - backend/app/ws/session_ws.py
- [[session_ws.py]] - code - backend/app/ws/session_ws.py
- [[set_component_level()]] - code - backend/app/logging_setup.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/session_wspy
SORT file.name ASC
```

## Connections to other communities
- 35 edges to [[_COMMUNITY_session.py]]
- 12 edges to [[_COMMUNITY_history.py]]
- 8 edges to [[_COMMUNITY_appmain.py]]
- 8 edges to [[_COMMUNITY_common_features.py]]
- 7 edges to [[_COMMUNITY_test_session_ws.py]]
- 6 edges to [[_COMMUNITY_db.py]]
- 4 edges to [[_COMMUNITY_exercise_config.py]]
- 3 edges to [[_COMMUNITY_get_buffer]]
- 2 edges to [[_COMMUNITY_admin_models.py]]
- 2 edges to [[_COMMUNITY_gemini_report.py]]
- 2 edges to [[_COMMUNITY_test_report.py]]
- 2 edges to [[_COMMUNITY__get]]
- 1 edge to [[_COMMUNITY_SessionBuffer]]
- 1 edge to [[_COMMUNITY_test_calibration_gate.py]]
- 1 edge to [[_COMMUNITY_test_history.py]]
- 1 edge to [[_COMMUNITY_TestClient]]

## Top bridge nodes
- [[auth.py]] - degree 20, connects to 7 communities
- [[FastAPI]] - degree 13, connects to 7 communities
- [[logging_setup.py]] - degree 20, connects to 6 communities
- [[session_ws.py]] - degree 24, connects to 5 communities
- [[report.py]] - degree 19, connects to 5 communities
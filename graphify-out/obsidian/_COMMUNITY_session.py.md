---
type: community
members: 31
---

# session.py

**Members:** 31 nodes

## Members
- [[BaseModel_1]] - code
- [[D6 the client's own count of what happened, written at session end. This is a…]] - rationale - backend/app/routes/session.py
- [[Fallback when appdb.py's lifespan has not run (unit tests that stub app.state…]] - rationale - backend/app/routes/session.py
- [[G2-F5F6 -- report polling and video upload. POST session{session_id}video…]] - rationale - backend/app/routes/report.py
- [[G2-G4 play back a session's video. The counterpart to the upload above --…]] - rationale - backend/app/routes/report.py
- [[Read-only lookup on patientprofiles (theirs, §1) -- never write it.]] - rationale - backend/app/routes/report.py
- [[RepLogIn]] - code - backend/app/routes/session.py
- [[Request_1]] - code
- [[Request_2]] - code
- [[Session lifecycle — H4 (startstatus), H5 (end, idempotent), G2-B3 (auth),…]] - rationale - backend/app/routes/session.py
- [[SessionEnd]] - code - backend/app/routes/session.py
- [[SessionStart]] - code - backend/app/routes/session.py
- [[SessionSummary]] - code - backend/app/routes/session.py
- [[UploadFile]] - code
- [[_authorize_or_403()]] - code - backend/app/routes/session.py
- [[_consent()]] - code - backend/app/routes/report.py
- [[_load_or_404()]] - code - backend/app/routes/session.py
- [[_no_doctor_lookup()]] - code - backend/app/routes/session.py
- [[_now()]] - code - backend/app/routes/session.py
- [[_post()]] - code - backend/tools/fake_session_client.py
- [[datetime_1]] - code
- [[get_1]] - code
- [[get_2]] - code
- [[get_video()]] - code - backend/app/routes/report.py
- [[report.py]] - code - backend/app/routes/report.py
- [[session.py]] - code - backend/app/routes/session.py
- [[session_end()]] - code - backend/app/routes/session.py
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
- 22 edges to [[_COMMUNITY_session_ws.py]]
- 18 edges to [[_COMMUNITY_CurrentUser]]
- 5 edges to [[_COMMUNITY_db.py]]
- 4 edges to [[_COMMUNITY_exercise_config.py]]
- 2 edges to [[_COMMUNITY_fake_session_client.py]]
- 2 edges to [[_COMMUNITY_app__init__.py]]
- 2 edges to [[_COMMUNITY_appmain.py]]
- 2 edges to [[_COMMUNITY_logging_setup.py]]
- 1 edge to [[_COMMUNITY_admin_models.py]]
- 1 edge to [[_COMMUNITY_test_report.py]]
- 1 edge to [[_COMMUNITY_dependencies_1]]

## Top bridge nodes
- [[session.py]] - degree 36, connects to 8 communities
- [[report.py]] - degree 19, connects to 8 communities
- [[session_start()]] - degree 11, connects to 3 communities
- [[session_summary()]] - degree 11, connects to 2 communities
- [[upload_video()]] - degree 10, connects to 2 communities
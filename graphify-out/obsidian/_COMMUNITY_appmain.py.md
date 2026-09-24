---
type: community
members: 32
---

# app/main.py

**Members:** 32 nodes

## Members
- [[EMG Flask service client for FastAPI backend.]] - rationale - backend/app/services/emg_client.py
- [[Fetch EMG capture status from Flask service.]] - rationale - backend/app/services/emg_client.py
- [[Fetch EMG recording history from Flask service.]] - rationale - backend/app/services/emg_client.py
- [[Fetch current live EMG reading from Flask service. Returns dict with keys…]] - rationale - backend/app/services/emg_client.py
- [[Get EMG capture status from Flask service.]] - rationale - backend/app/main.py
- [[Get EMG recording history from Flask service.]] - rationale - backend/app/main.py
- [[Get current live EMG reading from Flask service.]] - rationale - backend/app/main.py
- [[Perf countertimer registry — MASTER_BUILD_PLAN_v3.md §3.2 R10, §5 B5. Not the…]] - rationale - backend/app/telemetry.py
- [[Runnable self-check for the emg_client circuit breaker. No frameworks. Run…]] - rationale - backend/app/services/test_emg_client.py
- [[True if calls to base_url should be skipped right now.]] - rationale - backend/app/services/emg_client.py
- [[_circuit_open()]] - code - backend/app/services/emg_client.py
- [[_get_state()]] - code - backend/app/services/emg_client.py
- [[_record_failure()]] - code - backend/app/services/emg_client.py
- [[_record_success()]] - code - backend/app/services/emg_client.py
- [[appmain.py]] - code - backend/app/main.py
- [[demo()]] - code - backend/app/services/test_emg_client.py
- [[emg_client.py]] - code - backend/app/services/emg_client.py
- [[emg_history()]] - code - backend/app/main.py
- [[emg_live()]] - code - backend/app/main.py
- [[emg_status()]] - code - backend/app/main.py
- [[get_4]] - code
- [[get_emg_history()]] - code - backend/app/services/emg_client.py
- [[get_emg_status()]] - code - backend/app/services/emg_client.py
- [[get_live_emg_reading()]] - code - backend/app/services/emg_client.py
- [[health()]] - code - backend/app/main.py
- [[incr()]] - code - backend/app/telemetry.py
- [[metrics()]] - code - backend/app/main.py
- [[snapshot()_1]] - code - backend/app/telemetry.py
- [[telemetry.py]] - code - backend/app/telemetry.py
- [[test_emg_client.py]] - code - backend/app/services/test_emg_client.py
- [[timer()]] - code - backend/app/telemetry.py
- [[timing()]] - code - backend/app/telemetry.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/app/mainpy
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_exercise_config.py]]
- 4 edges to [[_COMMUNITY_session_ws.py]]
- 3 edges to [[_COMMUNITY_admin_models.py]]
- 2 edges to [[_COMMUNITY_session.py]]
- 1 edge to [[_COMMUNITY_test_admin_models.py]]
- 1 edge to [[_COMMUNITY_test_history.py]]
- 1 edge to [[_COMMUNITY_test_report.py]]
- 1 edge to [[_COMMUNITY_test_session_ws.py]]
- 1 edge to [[_COMMUNITY_CurrentUser]]
- 1 edge to [[_COMMUNITY_logging_setup.py]]
- 1 edge to [[_COMMUNITY_exercises.py]]
- 1 edge to [[_COMMUNITY_test_cors.py]]
- 1 edge to [[_COMMUNITY_TestClient]]

## Top bridge nodes
- [[appmain.py]] - degree 30, connects to 13 communities
- [[emg_client.py]] - degree 11, connects to 1 community
- [[get_live_emg_reading()]] - degree 9, connects to 1 community
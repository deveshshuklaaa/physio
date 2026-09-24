---
type: community
members: 26
---

# test_session_buffer.py

**Members:** 26 nodes

## Members
- [[Cross-session leak guard. One patient's frames must never reach another's…]] - rationale - backend/app/services/test_session_buffer.py
- [[Flush and drop from the registry. Returns frames flushed.]] - rationale - backend/app/services/session_buffer.py
- [[Flush drains. A second flush must append, not truncate — chunked evidence…]] - rationale - backend/app/services/test_session_buffer.py
- [[H1 — session_buffer.py self-checks. No framework. Run from backend…]] - rationale - backend/app/services/test_session_buffer.py
- [[Per-session evidence buffer — H1 (MASTER_BUILD_PLAN_v3.md §5, §3.2 R3R6). R3…]] - rationale - backend/app/services/session_buffer.py
- [[Point the module at an empty temp dir and clear the registry.]] - rationale - backend/app/services/test_session_buffer.py
- [[R3 fixed capacity, overwrite-oldest, count the drops. The failure this exists…]] - rationale - backend/app/services/test_session_buffer.py
- [[R6 the live path never blocks on IO. append() is sync and writes nothing.…]] - rationale - backend/app/services/test_session_buffer.py
- [[REGRESSION (added after the phase gate first passed, orchestrator). Real bug,…]] - rationale - backend/app/services/test_session_buffer.py
- [[REGRESSION (added with the one above).…]] - rationale - backend/app/services/test_session_buffer.py
- [[The evidence path. A flush that returns cleanly but writes nothing is the worst…]] - rationale - backend/app/services/test_session_buffer.py
- [[The periodic flush task (R6) drains in the background while appends keep…]] - rationale - backend/app/services/test_session_buffer.py
- [[_frame()]] - code - backend/app/services/test_session_buffer.py
- [[_fresh_tmp_root()]] - code - backend/app/services/test_session_buffer.py
- [[close_buffer()]] - code - backend/app/services/session_buffer.py
- [[services__init__.py]] - code - backend/app/services/__init__.py
- [[session_buffer.py]] - code - backend/app/services/session_buffer.py
- [[test_h1_append_does_not_touch_disk()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_buffer_is_bounded_and_counts_drops()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_buffers_are_isolated_per_session()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_concurrent_flushes_do_not_duplicate()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_flush_empties_buffer_and_appends()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_flush_interval_override_is_live()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_flush_task_runs_without_blocking_appends()]] - code - backend/app/services/test_session_buffer.py
- [[test_h1_flush_writes_real_frames_to_disk()]] - code - backend/app/services/test_session_buffer.py
- [[test_session_buffer.py]] - code - backend/app/services/test_session_buffer.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/test_session_bufferpy
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_test_session_ws.py]]
- 2 edges to [[_COMMUNITY_session_ws.py]]
- 1 edge to [[_COMMUNITY_SessionBuffer]]
- 1 edge to [[_COMMUNITY_test_report.py]]

## Top bridge nodes
- [[session_buffer.py]] - degree 8, connects to 3 communities
- [[services__init__.py]] - degree 5, connects to 3 communities
- [[test_h1_append_does_not_touch_disk()]] - degree 5, connects to 1 community
- [[test_h1_buffer_is_bounded_and_counts_drops()]] - degree 5, connects to 1 community
- [[test_h1_buffers_are_isolated_per_session()]] - degree 5, connects to 1 community
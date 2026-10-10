---
type: community
members: 17
---

# SessionBuffer

**Members:** 17 nodes

## Members
- [[dot-__init__()]] - code - backend/app/services/session_buffer.py
- [[dot-append()]] - code - backend/app/services/session_buffer.py
- [[dot-extend()]] - code - backend/app/services/session_buffer.py
- [[dot-flush()]] - code - backend/app/services/session_buffer.py
- [[dot-path()]] - code - backend/app/services/session_buffer.py
- [[dot-peek()]] - code - backend/app/services/session_buffer.py
- [[dot-pending()]] - code - backend/app/services/session_buffer.py
- [[dot-start_flush_task()]] - code - backend/app/services/session_buffer.py
- [[dot-stop_flush_task()]] - code - backend/app/services/session_buffer.py
- [[Append everything pending to `path` as JSONL, then drop exactly what was…]] - rationale - backend/app/services/session_buffer.py
- [[Idempotent calling twice does not spawn a second task. `interval_s=None` reads…]] - rationale - backend/app/services/session_buffer.py
- [[Path_1]] - code
- [[SessionBuffer]] - code - backend/app/services/session_buffer.py
- [[Snapshot of what's currently buffered, oldest first. Debugtest use.]] - rationale - backend/app/services/session_buffer.py
- [[Stop the background task and flush whatever remains before returning, so…]] - rationale - backend/app/services/session_buffer.py
- [[Sync, O(1), no disk IO. Overwrite-oldest when at capacity (R3).]] - rationale - backend/app/services/session_buffer.py
- [[Sync, O(n), no disk IO.]] - rationale - backend/app/services/session_buffer.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/SessionBuffer
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_get_buffer]]
- 1 edge to [[_COMMUNITY_session_ws.py]]

## Top bridge nodes
- [[SessionBuffer]] - degree 11, connects to 1 community
- [[dot-pending()]] - degree 2, connects to 1 community
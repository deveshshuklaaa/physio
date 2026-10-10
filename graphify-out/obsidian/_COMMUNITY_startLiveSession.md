---
type: community
members: 10
---

# startLiveSession

**Members:** 10 nodes

## Members
- [[beginCaptureLoop()]] - code - frontend/src/lib/session_orchestrator.js
- [[handleAlerts()]] - code - frontend/src/lib/session_orchestrator.js
- [[handleServerMessage()]] - code - frontend/src/lib/session_orchestrator.js
- [[onProgress()]] - code - frontend/src/lib/session_orchestrator.js
- [[onWorkerDied()]] - code - frontend/src/lib/session_orchestrator.js
- [[paintVideo()]] - code - frontend/src/lib/session_orchestrator.js
- [[renderFrame()]] - code - frontend/src/lib/session_orchestrator.js
- [[startLiveSession()]] - code - frontend/src/lib/session_orchestrator.js
- [[updateCounters()]] - code - frontend/src/lib/session_orchestrator.js
- [[updateDevOverlay()]] - code - frontend/src/lib/session_orchestrator.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/startLiveSession
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_session_orchestrator.js]]
- 3 edges to [[_COMMUNITY_BrowserLogger]]
- 2 edges to [[_COMMUNITY_IsolatedRecorder]]
- 1 edge to [[_COMMUNITY_SessionWsClient]]
- 1 edge to [[_COMMUNITY_smoothing_audio.test.mjs]]

## Top bridge nodes
- [[startLiveSession()]] - degree 19, connects to 5 communities
- [[onProgress()]] - degree 2, connects to 1 community
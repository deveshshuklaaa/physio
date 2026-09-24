---
type: community
members: 37
---

# startLiveSession

**Members:** 37 nodes

## Members
- [[dot-_shouldLog()]] - code - frontend/src/lib/logger.js
- [[dot-constructor()_11]] - code - frontend/src/lib/logger.js
- [[dot-debug()_1]] - code - frontend/src/lib/logger.js
- [[dot-drain()_2]] - code - frontend/src/lib/logger.js
- [[dot-droppedCount()]] - code - frontend/src/lib/logger.js
- [[dot-error()_1]] - code - frontend/src/lib/logger.js
- [[dot-fatal()]] - code - frontend/src/lib/logger.js
- [[dot-info()_1]] - code - frontend/src/lib/logger.js
- [[dot-log()]] - code - frontend/src/lib/logger.js
- [[dot-setLevel()]] - code - frontend/src/lib/logger.js
- [[dot-setSessionId()]] - code - frontend/src/lib/logger.js
- [[dot-warn()_1]] - code - frontend/src/lib/logger.js
- [[BrowserLogger]] - code - frontend/src/lib/logger.js
- [[Classic Worker Support Probe]] - code - frontend/tools/g5_worker_test/classic_probe.html
- [[Dev Diagnostics Overlay]] - concept - frontend/src/pages/live_session.html
- [[FIFO FrameResult Latency Correlation]] - rationale - frontend/tools/g5_worker_test/index.html
- [[G5 Pose Worker WiringLatency Harness]] - code - frontend/tools/g5_worker_test/index.html
- [[G7G8 Render and Audio Probe]] - code - frontend/tools/g6_g10_test/render_audio_probe.html
- [[Live Session DOM Id Contract]] - rationale - frontend/src/pages/live_session.html
- [[Live Session Page]] - code - frontend/src/pages/live_session.html
- [[Synthetic Landmarks Against Real Browser APIs]] - rationale - frontend/tools/g6_g10_test/render_audio_probe.html
- [[beginCaptureLoop()]] - code - frontend/src/lib/session_orchestrator.js
- [[finish (latency summary)]] - code - frontend/tools/g5_worker_test/index.html
- [[handleAlerts()]] - code - frontend/src/lib/session_orchestrator.js
- [[handleFrame()]] - code - frontend/src/workers/pose_worker.js
- [[handleServerMessage()]] - code - frontend/src/lib/session_orchestrator.js
- [[init()_3]] - code - frontend/src/workers/pose_worker.js
- [[loadConfig (live session exercise config fetch)]] - code - frontend/src/pages/live_session.html
- [[onWorkerDied()]] - code - frontend/src/lib/session_orchestrator.js
- [[paintVideo()]] - code - frontend/src/lib/session_orchestrator.js
- [[pose_worker.js]] - code - frontend/src/workers/pose_worker.js
- [[renderFrame()]] - code - frontend/src/lib/session_orchestrator.js
- [[sendOneFrame (synthetic frame producer)]] - code - frontend/tools/g5_worker_test/index.html
- [[squat_config.json (checked-in squat exercise config)]] - document - frontend/tools/g5_worker_test/index.html
- [[startLiveSession()]] - code - frontend/src/lib/session_orchestrator.js
- [[updateCounters()]] - code - frontend/src/lib/session_orchestrator.js
- [[updateDevOverlay()]] - code - frontend/src/lib/session_orchestrator.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/startLiveSession
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_RingBuffer]]
- 5 edges to [[_COMMUNITY_session_orchestrator.js]]
- 3 edges to [[_COMMUNITY_smoothing_audio.test.mjs]]
- 3 edges to [[_COMMUNITY_IsolatedRecorder]]
- 2 edges to [[_COMMUNITY_pose_engine.js]]
- 1 edge to [[_COMMUNITY_events.js]]
- 1 edge to [[_COMMUNITY_vision_bundle.mjs]]
- 1 edge to [[_COMMUNITY_skeleton_selfcheck.mjs]]

## Top bridge nodes
- [[startLiveSession()]] - degree 23, connects to 4 communities
- [[pose_worker.js]] - degree 10, connects to 4 communities
- [[init()_3]] - degree 5, connects to 4 communities
- [[BrowserLogger]] - degree 16, connects to 2 communities
- [[dot-log()]] - degree 8, connects to 1 community
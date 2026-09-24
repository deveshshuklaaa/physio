---
type: community
members: 11
---

# IsolatedRecorder

**Members:** 11 nodes

## Members
- [[dot-_assembleBlob()]] - code - frontend/src/lib/recorder.js
- [[dot-constructor()_13]] - code - frontend/src/lib/recorder.js
- [[dot-isRecording()]] - code - frontend/src/lib/recorder.js
- [[dot-pickMimeType()]] - code - frontend/src/lib/recorder.js
- [[dot-start()]] - code - frontend/src/lib/recorder.js
- [[dot-stop()]] - code - frontend/src/lib/recorder.js
- [[FakePoseWorker]] - code - frontend/tools/g13_test/index.html
- [[IsolatedRecorder]] - code - frontend/src/lib/recorder.js
- [[blobToBase64]] - code - frontend/tools/g13_recording_survives.html
- [[g13 main (real worker crash run)]] - code - frontend/tools/g13_recording_survives.html
- [[g13_test run]] - code - frontend/tools/g13_test/index.html

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/IsolatedRecorder
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_startLiveSession]]
- 2 edges to [[_COMMUNITY_RingBuffer]]
- 1 edge to [[_COMMUNITY_session_orchestrator.js]]

## Top bridge nodes
- [[IsolatedRecorder]] - degree 11, connects to 3 communities
- [[dot-constructor()_13]] - degree 3, connects to 1 community
- [[dot-start()]] - degree 2, connects to 1 community
- [[FakePoseWorker]] - degree 2, connects to 1 community
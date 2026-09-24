---
type: community
members: 25
---

# RingBuffer

**Members:** 25 nodes

## Members
- [[dot-_flush()]] - code - frontend/src/ws/client.js
- [[dot-_send()]] - code - frontend/src/ws/client.js
- [[dot-_sendAuthFrame()]] - code - frontend/src/ws/client.js
- [[dot-clear()_1]] - code - frontend/src/lib/ring_buffer.js
- [[dot-close()]] - code - frontend/src/ws/client.js
- [[dot-connect()]] - code - frontend/src/ws/client.js
- [[dot-constructor()_1]] - code - frontend/src/lib/ring_buffer.js
- [[dot-constructor()_2]] - code - frontend/src/ws/client.js
- [[dot-drain()]] - code - frontend/src/lib/ring_buffer.js
- [[dot-push()]] - code - frontend/src/lib/ring_buffer.js
- [[dot-queueDepth()]] - code - frontend/src/ws/client.js
- [[dot-sendEnd()]] - code - frontend/src/ws/client.js
- [[dot-sendPose()]] - code - frontend/src/ws/client.js
- [[dot-toArray()]] - code - frontend/src/lib/ring_buffer.js
- [[LEVELS]] - code - frontend/src/lib/logger.js
- [[RingBuffer]] - code - frontend/src/lib/ring_buffer.js
- [[SessionWsClient]] - code - frontend/src/ws/client.js
- [[client.js]] - code - frontend/src/ws/client.js
- [[drained]] - code - frontend/tools/ring_buffer_selfcheck.mjs
- [[logger.js]] - code - frontend/src/lib/logger.js
- [[rb]] - code - frontend/tools/ring_buffer_selfcheck.mjs
- [[recorder.js]] - code - frontend/src/lib/recorder.js
- [[ring_buffer.js]] - code - frontend/src/lib/ring_buffer.js
- [[ring_buffer_selfcheck.mjs]] - code - frontend/tools/ring_buffer_selfcheck.mjs
- [[transport.test.mjs]] - code - frontend/tests/transport.test.mjs

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/RingBuffer
SORT file.name ASC
```

## Connections to other communities
- 6 edges to [[_COMMUNITY_startLiveSession]]
- 5 edges to [[_COMMUNITY_session_orchestrator.js]]
- 2 edges to [[_COMMUNITY_IsolatedRecorder]]
- 2 edges to [[_COMMUNITY_events.js]]
- 1 edge to [[_COMMUNITY_createLazyFile]]
- 1 edge to [[_COMMUNITY_FakeWebSocket]]
- 1 edge to [[_COMMUNITY_helpers.mjs]]

## Top bridge nodes
- [[RingBuffer]] - degree 15, connects to 3 communities
- [[logger.js]] - degree 12, connects to 3 communities
- [[transport.test.mjs]] - degree 8, connects to 3 communities
- [[SessionWsClient]] - degree 13, connects to 2 communities
- [[recorder.js]] - degree 6, connects to 2 communities
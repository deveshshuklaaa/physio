---
type: community
members: 37
---

# test_session_ws.py

**Members:** 37 nodes

## Members
- [[A batch in the client.js wire format lands in that session's buffer.]] - rationale - backend/app/ws/test_session_ws.py
- [[D3B4 send this as the first message on every socket under test, or the server…]] - rationale - backend/app/ws/test_session_ws.py
- [[D3 a socket that never sends the auth frame is closed 4401 once AUTH_TIMEOUT_S…]] - rationale - backend/app/ws/test_session_ws.py
- [[Generous bounded wait. Deliberately not a latency assertion -- those flap on…]] - rationale - backend/app/ws/test_session_ws.py
- [[H2, H3, H6 — the session WebSocket. G2-B4 — the WS auth handshake. No…]] - rationale - backend/app/ws/test_session_ws.py
- [[H3 a background task polls the EMG client and pushes to this socket. Nothing…]] - rationale - backend/app/ws/test_session_ws.py
- [[H4 says start runs BEFORE the socket opens. A socket for a session that was…]] - rationale - backend/app/ws/test_session_ws.py
- [[Mobile browsers kill sockets without a close frame and without ever reaching…]] - rationale - backend/app/ws/test_session_ws.py
- [[R6. Frames sit in memory after receive; the flush is somebody else's turn of…]] - rationale - backend/app/ws/test_session_ws.py
- [[Session belongs to p1; a socket authenticating as p2 must be refused -- this is…]] - rationale - backend/app/ws/test_session_ws.py
- [[The load-bearing H3 requirement. EMG returning None (circuit open, C6) must…]] - rationale - backend/app/ws/test_session_ws.py
- [[The plan says 2-5 Hz is plenty for a chart. Polling a serial-backed Flask…]] - rationale - backend/app/ws/test_session_ws.py
- [[Two concurrent sockets, two buffers. Same leak class as the G heel-baseline…]] - rationale - backend/app/ws/test_session_ws.py
- [[_auth_frame()]] - code - backend/app/ws/test_session_ws.py
- [[_batch()]] - code - backend/app/ws/test_session_ws.py
- [[_frames()]] - code - backend/app/ws/test_session_ws.py
- [[_http_auth()]] - code - backend/app/ws/test_session_ws.py
- [[_start()]] - code - backend/app/ws/test_session_ws.py
- [[_token()_2]] - code - backend/app/ws/test_session_ws.py
- [[_wait_for()]] - code - backend/app/ws/test_session_ws.py
- [[get_buffer()]] - code - backend/app/services/session_buffer.py
- [[test_g2b_ws_default_auth_timeout_is_five_seconds()]] - code - backend/app/ws/test_session_ws.py
- [[test_g2b_ws_malformed_auth_frame_closes_4401()]] - code - backend/app/ws/test_session_ws.py
- [[test_g2b_ws_matching_user_token_is_accepted()]] - code - backend/app/ws/test_session_ws.py
- [[test_g2b_ws_no_auth_frame_closes_4401_within_timeout()]] - code - backend/app/ws/test_session_ws.py
- [[test_g2b_ws_wrong_user_token_closes_4403()]] - code - backend/app/ws/test_session_ws.py
- [[test_h2_ws_accepts_pose_batch_into_buffer()]] - code - backend/app/ws/test_session_ws.py
- [[test_h2_ws_handler_never_awaits_disk()]] - code - backend/app/ws/test_session_ws.py
- [[test_h2_ws_rejects_unknown_session()]] - code - backend/app/ws/test_session_ws.py
- [[test_h2_ws_sessions_do_not_cross_talk()]] - code - backend/app/ws/test_session_ws.py
- [[test_h3_dead_emg_never_stalls_the_session()]] - code - backend/app/ws/test_session_ws.py
- [[test_h3_emg_poll_rate_is_modest()]] - code - backend/app/ws/test_session_ws.py
- [[test_h3_emg_relay_pushes_emg_messages()]] - code - backend/app/ws/test_session_ws.py
- [[test_h6_abrupt_disconnect_ends_session()]] - code - backend/app/ws/test_session_ws.py
- [[test_session_ws.py]] - code - backend/app/ws/test_session_ws.py
- [[ws__init__.py]] - code - backend/app/ws/__init__.py
- [[§5 G2-B4 pins this exact number.]] - rationale - backend/app/ws/test_session_ws.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/test_session_wspy
SORT file.name ASC
```

## Connections to other communities
- 11 edges to [[_COMMUNITY_TestClient]]
- 8 edges to [[_COMMUNITY_test_session_buffer.py]]
- 6 edges to [[_COMMUNITY_session_ws.py]]
- 1 edge to [[_COMMUNITY_SessionBuffer]]
- 1 edge to [[_COMMUNITY_exercise_config.py]]
- 1 edge to [[_COMMUNITY_CurrentUser]]
- 1 edge to [[_COMMUNITY_appmain.py]]

## Top bridge nodes
- [[test_session_ws.py]] - degree 28, connects to 5 communities
- [[get_buffer()]] - degree 14, connects to 3 communities
- [[test_h3_dead_emg_never_stalls_the_session()]] - degree 9, connects to 2 communities
- [[test_h3_emg_relay_pushes_emg_messages()]] - degree 6, connects to 2 communities
- [[test_h6_abrupt_disconnect_ends_session()]] - degree 10, connects to 1 community
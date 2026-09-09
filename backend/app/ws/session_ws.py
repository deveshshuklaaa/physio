"""The session WebSocket — H2 (endpoint), H3 (EMG relay), H6 (abrupt
disconnect). MASTER_BUILD_PLAN_v3.md §5, §3.2 R5/R6.

    WS /ws/session/{session_id}

Wire format is pinned by frontend/src/ws/client.js (already built, already
unit-tested, never redesigned here):

    receives:  {"type": "pose_batch", "ts": <int>, "frames": [...], "logs": [...]}
               {"type": "end"}
    sends:     {"type": "emg", "signal": ..., "envelop": ..., "timestamp": ...}

R5 — this socket carries evidence, not feedback: frames go straight into the
session's buffer, nothing is compared to a threshold and nothing is sent back
in response. R6 — the receive loop never awaits disk; `buf.extend()` is
synchronous and a background flush task (session_buffer.py) does the writing.
"""
from __future__ import annotations

import asyncio
from contextlib import suppress

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.logging_setup import get_logger, correlation, log_ring_buffer
from app.routes.session import session_exists, end_session
from app.services import session_buffer as sb
from app.services.emg_client import get_live_emg_reading

router = APIRouter()
log = get_logger("ws")

# H3: 2-5 Hz is plenty for a chart; polling a serial-backed Flask service at
# frame rate is pure waste and adds a stall surface.
EMG_POLL_INTERVAL_S = 0.3  # ~3.3 Hz


async def _emg_relay(websocket: WebSocket, session_id: str) -> None:
    """Background task: poll EMG at EMG_POLL_INTERVAL_S, push readings to the
    client. A dead/circuit-open EMG service (returns None) costs the chart,
    never the session — this task never touches the pose buffer."""
    while True:
        await asyncio.sleep(EMG_POLL_INTERVAL_S)
        try:
            reading = await get_live_emg_reading()
        except Exception:
            reading = None
        if reading is None:
            # log_ring_buffer drains on its own background thread, outside
            # this coroutine's contextvars, so session_id is passed as an
            # explicit field rather than relied on from `correlation()`.
            log_ring_buffer.push(log, "WARN", "poll_timeout", sample_every=1,
                                  session_id=session_id)
            continue
        try:
            await websocket.send_json({
                "type": "emg",
                "signal": reading.get("signal"),
                "envelop": reading.get("envelop"),
                "timestamp": reading.get("timestamp"),
            })
        except Exception:
            # socket is going/gone; the receive loop will notice and tear
            # this task down via the finally block.
            return


@router.websocket("/ws/session/{session_id}")
async def session_ws(websocket: WebSocket, session_id: str) -> None:
    app = websocket.app
    if not session_exists(app, session_id):
        # Reject before accept: a socket for a session that was never
        # started would buffer evidence nothing will ever collect (H4).
        await websocket.close(code=4404)
        return

    await websocket.accept()
    with correlation(session_id=session_id):
        log.info("ws_connected")

    buf = sb.get_buffer(session_id)
    buf.start_flush_task(interval_s=sb.FLUSH_INTERVAL_S)
    emg_task = asyncio.create_task(_emg_relay(websocket, session_id))
    explicit_end = False

    try:
        while True:
            msg = await websocket.receive_json()
            mtype = msg.get("type")
            if mtype == "pose_batch":
                frames = msg.get("frames", [])
                buf.extend(frames)  # sync, O(n), no disk (R6)
                log_ring_buffer.push(
                    log, "DEBUG", "batch_received",
                    sample_every=5, session_id=session_id,
                    frame_count=len(frames), log_count=len(msg.get("logs", [])),
                )
            elif mtype == "end":
                explicit_end = True
                break
            # unrecognized message types are ignored -- evidence path only,
            # not a place to grow protocol surface.
    except WebSocketDisconnect:
        pass
    finally:
        # H6: an ASGI test/production server cancels this coroutine's scope
        # the instant the socket disconnects, so anything awaited directly
        # here (the flush, end_session) can be aborted before it runs. Hand
        # cleanup to a detached task instead -- not part of that cancel
        # scope, so it keeps running on the event loop after this handler
        # returns, whether we got here via an explicit {"type":"end"} or an
        # abrupt disconnect. end_session() is idempotent (H5), so a later
        # explicit /session/end call converges on the same job_id rather
        # than enqueuing a second one.
        task = asyncio.create_task(
            _finalize(websocket, app, session_id, buf, emg_task, explicit_end)
        )
        # The event loop keeps only a WEAK reference to a task, so a detached
        # task with no strong reference anywhere can be garbage-collected
        # mid-execution. Under concurrent load (K4 runs 3 sessions at once)
        # that loses the final flush and the job enqueue with no error
        # raised anywhere. Hold a reference until it completes.
        _pending_finalizers.add(task)
        task.add_done_callback(_pending_finalizers.discard)


# Strong references to in-flight finalizers; see the comment at the call site.
_pending_finalizers: set[asyncio.Task] = set()


async def _finalize(websocket, app, session_id, buf, emg_task, explicit_end: bool) -> None:
    """Runs detached, after the handler's cancel scope is gone.

    Nothing here may fail silently. This is the last code that touches a
    session, and it is the code that releases the evidence for Phase I: a
    swallowed failure means frames on disk that no report will ever be built
    from, and §8b.9 requires the run to be reconstructible from logs alone.
    Every failure path below logs with the §8b.5 fields.
    """
    emg_task.cancel()
    with suppress(asyncio.CancelledError):
        await emg_task

    with correlation(session_id=session_id):
        # Flush what's left before the job runs. Losing evidence here is the
        # worst outcome in Phase H, so it is caught and LOGGED, never dropped.
        try:
            await buf.stop_flush_task()
        except Exception as exc:
            log.error("session_aborted", error=exc,
                      stage_state={"stage": "final_flush", "session_id": session_id,
                                   "pending": getattr(buf, "pending", None),
                                   "dropped": getattr(buf, "dropped", None)})

        # end_session is idempotent (H5), so a later explicit POST /session/end
        # converges on the same job_id rather than enqueuing a second one.
        try:
            await end_session(app, session_id)
        except Exception as exc:
            # Without this line the session is never ended, no job is ever
            # enqueued, and the ws_disconnected line below would still make
            # the log read like a clean teardown.
            log.error("session_aborted", error=exc,
                      stage_state={"stage": "end_session", "session_id": session_id})

        log.info("ws_disconnected")

    if explicit_end:
        with suppress(Exception):
            await websocket.close()

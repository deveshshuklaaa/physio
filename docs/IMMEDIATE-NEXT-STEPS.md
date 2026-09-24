# Immediate next steps

> **2026-09-24:** HS/TKE live checks + rep misfire guards landed; camera test protocol in `docs/09_live_frontend.md` §13. Items below predate it.

**Written 2026-08-23.** Picks up where the session ended. Nothing here is
started; everything is a decision or a measurement waiting on the owner.

Ordering below is dependency order, not importance order. Item 1 unblocks
items 2 and 3, and the plan forbids doing 3 before 1.

---

## 1. Close Phase 0 — the stopwatch runs (~10 minutes, only you can do it)

Phase 0 is the only phase still open, and it gates every performance claim in
the project. `docs/00_baseline.md` is written and holds exact protocols with
marked placeholders; it is incomplete until these two are filled in.

- **P0.1** — `docs/00_baseline.md` §3.1. Run the legacy app, do a deliberate
  posture change, stopwatch the time until the flag appears on screen. Ten
  trials, record the median. Paste into the `<!-- P0.1 PENDING -->` block at
  line ~135.
- **P0.2** — §3.2. Chrome DevTools Performance tab, 30-second recording of a
  live session. Note main-thread blocking time, longest task, frame rate. Paste
  into the `<!-- P0.2 PENDING -->` block at line ~215.
- **P0.3** — §3.3. Falls out of P0.2 once it exists.

The structural half of P0.3 is already answered from code inspection and does
not need measuring: the legacy app calls `landmarker.detect_for_video()` inline
in its render loop (`backend/_old_physio_reference/exercise_runner.py:309`), so
capture, render and input all block during inference. §3.1 source #1 dominates
the legacy system. Verified directly, not inferred.

**Why this blocks the rest.** §11 of the plan binds every agent to "Do not
optimize without measuring. Cite `docs/00_baseline.md`." G11 says compare to the
baseline and "if it is not dramatically better, stop and find out why." Without
P0.1 there is no number to compare against, and the perf work in item 3 is
guessing with extra steps — which is exactly what happened in the last session
and is recorded as a standing violation in `docs/09_live_frontend.md`.

---

## 2. Decide: keep going on performance, or move to Phase H

**The §7 Phase G gate already passes.** Feedback latency is 88.9ms against a
< 100ms budget. By the plan's own standard, Phase G is done and Phase H is next.

The choppiness is a frame-*rate* problem (~9-11 fps against §3.2 R2's 15-20 fps
target), not a latency problem. The plan gates latency and never gates fps.

So this is a genuine fork, not a to-do:

- **Move to Phase H** — the gate is met, the remaining choppiness is cosmetic,
  and no backend exists yet. `ws/client.js` currently fails to connect through
  every session.
- **Keep tuning** — 9 fps is visibly below what the plan targeted, and item 3
  is a cheap, single-number experiment.

No wrong answer. But decide deliberately rather than drifting into more tuning.

---

## 3. The one perf lever not yet tried: `DETECTION_SCALE`

**Do not start this before item 1.**

The legacy app downscales frames before inference — `DETECTION_SCALE = 0.9`
(`backend/_old_physio_reference/config.py:22`), applied at
`exercise_runner.py:304-305`. The new system feeds MediaPipe full 640x480.

This matters because inference is ~85ms and accounts for essentially the entire
67-89ms round trip. Every other suspect has been ruled out with measurements:

| Suspect | Verdict |
|---|---|
| Capture resolution | Ruled out — already 640x480 |
| Main-thread frame handoff | Ruled out — inference ~= whole round trip |
| GPU delegate | Tried; **fails** G5 (returns only `no_pose`), no faster in browser |
| WebGL2 unavailable | Ruled out — hardware accelerated, main thread and worker |

Inference resolution is distinct from capture resolution, and it is the one
knob the legacy system used that the new one does not.

Caveat worth knowing before spending time: MediaPipe's pose landmarker resizes
internally to its own input size, so the gain may be smaller than the pixel
ratio suggests. Worth one measurement, not worth a project.

---

## 4. Smaller items, no dependencies

- **DONE 2026-09-24 — `worker_ready` now logs `delegate` and `mp_confidence`.** Was:
  **`worker_ready` does not log the delegate.** `pose_worker.js` logs `model`
  but not `delegate`, so logs cannot answer "which delegate actually ran" —
  which cost real time during the GPU investigation. One field, add it next time
  that file is open.
- **Exercise config still falls back to a dev file.** `GET /exercises` does not
  exist, so `live_session.html` reads
  `frontend/tools/g5_worker_test/squat_config.json`. Marked
  `// ponytail: dev fallback, delete once /exercises is live`. Phase H work.
- **End Session only tears down.** No navigation to a report page, because
  `report.html` does not exist. Phase I/J work.
- **G6-G10 gate is not in `run_tests.sh`.** It is green (30/30) but hard-requires
  a webcam, so adding it turns the suite red on any machine without one. Left
  out deliberately; decide if that is right.
- **Headed visual check never done.** The skeleton has been verified by pixel
  counts, never watched tracking a real body. Mirroring is consistent by
  construction and pinned by a test, but a human has still not looked.

---

## 5. Known trap — do not let this recur

`docs/00_baseline.md` was delivered claiming "65 checks pass (58 unit tests)".
The real number was 78 unit tests; the stale figure had been copied from
`PROJECT-STATUS.md` §2 rather than measured, while being reported as measured.
Corrected in place.

Two agent-written numbers in this project have now needed correction on
verification. Re-run the command before trusting a reported metric, including
ones in this file.

---

## Current verified state, for whoever picks this up

| Thing | State |
|---|---|
| `cd frontend && ./run_tests.sh` | 78 unit tests + 7 gate harnesses, `ALL PHASE G CHECKS PASSED`, exit 0 |
| `node tools/g6_g10_test/run_g6_g10_test.mjs` | 30/30, exit 0, real camera — needs `/dev/video0` free |
| Phase G (§7 gate) | **passing** — 88.9ms < 100ms |
| Phase 0 | **open** — P0.1/P0.2 pending |
| Delegate | `CPU` (`pose_worker.js:82`) — GPU tried and reverted |
| Interpolation | on; `makePainter({ interpolate: false })` disables it |
| Backend | none running; `ws/client.js` fails to connect throughout, expected pre-Phase H |

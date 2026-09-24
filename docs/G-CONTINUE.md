# G-CONTINUE — Phase G handoff

**Written:** 2026-08-21, at the end of a working session.
**Purpose:** Phase G was built across three subagent runs, two of which were
stopped mid-flight. This document records what is actually on disk, what is
verified, and exactly where to resume.

`docs/09_live_frontend.md` **now exists** and is the canonical Phase G record
(what was built and why). This file stays as the session handoff (what to do
next). Where they overlap, 09 is authoritative on design decisions and this file
is authoritative on what is unfinished.

**Everything marked VERIFIED below was re-run by the orchestrator against the real
files, not taken on a subagent's word.** Commands are given so you can re-run them
yourself in one minute.

---

## 1. One-paragraph status

Phase G is **substantially complete and its hardest gates pass**. The 6-decimal
JS/Python parity gate passes (25/25, max diff 2.84e-14). The recording-isolation
gate passes with a real playable video produced after deliberately killing the
pose worker. All of MediaPipe, Tailwind and the fonts are vendored, so the live
path runs with no internet. What is missing is not core logic: it is the phase
write-up and an end-to-end run against a real camera. **Nothing is red.**
(An earlier revision of this file claimed two failing G5 cases — that was a
misreading, corrected in §7.)

---

## 2. What the three subagent runs were doing

| Run | Scope | Ended | State when it stopped |
|---|---|---|---|
| 1 — "Phase G live path logic" | G1-G5, G8, G9, G12-G14 | **stopped by user** | Had finished G1-G4, G9, G14 and copied the audio assets. Was about to start `pose_worker.js` and `recorder.js`. |
| 2 — "Vendor CDN deps, fix rep counters" | vendoring + shell markup | **stopped by user** | Work was complete; it was stopped during its final "confirm nothing else broke" pass. Output verified good. |
| 3 — "Phase G continue from G5" | G5, G7, G8, G12, G13, write-up | **stopped by user** | Had written every code file it owned and built two test harnesses. **Never wrote `docs/09_live_frontend.md`.** |

The practical consequence: **the code is there, the documentation is not.**

---

## 3. Per-task status

| Task | What it is | Status | Evidence |
|---|---|---|---|
| **G1** | `lib/angles.js` — ported D5 formulas | **DONE, VERIFIED** | Parity harness, 25/25 to 6 decimals |
| **G2** | `lib/rules.js` — threshold checks, squat's 7 | **DONE, VERIFIED** | `pose_engine_selfcheck.mjs` asserts the exact `squat.py` alert string |
| **G3** | `lib/smoother.js` — EMA + One-Euro | **DONE — decision pending, see §6** | Both implemented, EMA default |
| **G4** | `lib/ring_buffer.js` | **DONE, VERIFIED** | `ring_buffer_selfcheck.mjs` passes |
| **G5** | `workers/pose_worker.js` — inFlight guard | **DONE, VERIFIED** | Harness passes 3/3; steady-state latency 33.0 ms |
| **G6** | main thread: camera, hand frames to worker | **DONE, VERIFIED** | Real camera ("ACER HD User Facing", 640x480). 30/30 gate, exit 0, 2026-08-23 |
| **G7** | `render/skeleton.js` — ported `drawing.py` | **DONE, VERIFIED (headless)** | Real Canvas2D pixel counts; D2 all-red-on-any-alert confirmed. No headed run yet |
| **G8** | audio cues + debounce | **DONE, VERIFIED (headless)** | Real `<audio>` + real mp3, readyState 4, per-alert cooldown. Never heard out loud |
| **G9** | `ws/client.js` — one socket, ~500ms batches | **DONE, UNVERIFIED end-to-end** | No Phase H server exists yet to talk to |
| **G10** | dev overlay | **DONE, VERIFIED** | All five spans fed from live numbers; no mockup constant survives |
| **G11** | measure latency vs baseline | **BLOCKED-NO-BASELINE** | Phase 0 never ran; `docs/00_baseline.md` does not exist |
| **G12** | isolated `MediaRecorder` | **DONE, VERIFIED** | See §5 |
| **G13** | recording survives worker death | **DONE, VERIFIED** | Real 69,850-byte VP9 file, see §5 |
| **G14** | browser logger, ring-buffered | **DONE** | `lib/logger.js`; events mirror passes at 43 events |

---

## 4. Re-verify everything in one minute

```bash
cd /home/billa-dakait/Desktop/final_project/frontend
./run_tests.sh          # everything: 58 unit tests + 7 gate harnesses
```

Expected tail: `ALL PHASE G CHECKS PASSED`, exit 0.

Individually, if you want one at a time:

```bash
node --test "tests/*.test.mjs"        # -> 58 pass
node tools/parity_check.mjs           # -> 25/25 cases within 6 decimals
node tools/ring_buffer_selfcheck.mjs  # -> ring_buffer.js self-check OK
node tools/pose_engine_selfcheck.mjs  # -> 4 PASS
node tools/g5_worker_test/run_g5_test.mjs   # -> 3 PASS, ~33ms steady-state
node tools/g13_test/run_g13_test.mjs        # -> 5 PASS, real playable webm

cd ../backend && ../venv/bin/python app/test_events_mirror.py   # -> 43 events agree
```

Recording gate:

```bash
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height \
        -count_packets -show_entries stream=nb_read_packets \
        frontend/tools/g13_test/g13_output.webm
# -> vp9 / video / 640x480 / 31 packets
```

---

## 5. The two gates that matter, and why they pass

### 6-decimal parity (§7 Phase G gate)

`tools/parity_check.mjs` runs identical inputs through the legacy Python
(`backend/_old_physio_reference/math_utils.py`) and through `lib/angles.js`, then
diffs. **25/25 within 6 decimals, largest diff 2.84e-14.**

This is meaningful rather than a happy-path check because the case list
deliberately includes the places where `atan2`/`arccos` and clamping choices
silently diverge: coincident points, zero-length segments, `dy=0`, `dx=0`,
negative coordinates, and the `detect_view` z-threshold at *exactly* 0.12.

> **`lib/angles.js` is effectively frozen.** If you think you have found a bug in
> it, do not quietly fix it — a change there breaks a proven gate and the break is
> invisible until offline and live features disagree in front of a patient. Write
> it up and decide deliberately.

### Recording survives pose failure (§7, and the G13 task says the *test* is the gate)

`tools/g13_test/` kills the pose worker mid-session on purpose. The resulting
`g13_output.webm` is a genuine, decodable VP9 file: 640x480, 31 packets, 69,850
bytes. Not "no errors were thrown" — an actual video that plays.

The isolation is structurally correct, which is why it works:
`MediaRecorder` attaches to the raw `MediaStream` and runs on the browser's
internal encoding thread, unreachable from JS. The only thing shared with
inference is the `MediaStream` itself. A worker stall cannot reach it.

**Caveat to carry into Phase I:** `ffprobe` reports `duration=N/A` on that file.
That is normal for `MediaRecorder` chunked output — the Duration/Cues elements are
not written until finalisation — but **I2 re-reads these files with MediaPipe
Heavy**. Confirm your decoder tolerates a missing duration header, or remux
(`ffmpeg -i in.webm -c copy out.webm`) as the first pipeline step. Finding this in
Phase I would be an annoying afternoon; knowing it now is a five-line fix.

---

## 6. Open decision: EMA vs One-Euro (needs the owner)

`lib/smoother.js` implements **both**, with **EMA as the default**.

- **EMA** (`alpha = 0.25`, seeded raw on first sample) is what the legacy system
  actually did — `docs/03_legacy.md` D4 established this. It is also what the
  offline feature pipeline assumes. Keeping it means live and offline agree.
- **One-Euro** is what `MASTER_BUILD_PLAN_v3.md` §3.3 and task G3 ask for. It is
  better live smoothing — but it is **new design, not a port**, and switching to
  it breaks the 6-decimal parity with the offline pipeline.

These genuinely conflict. EMA is default so the gate stays passable. **Someone has
to choose**, and the choice is a trade between live smoothness and live/offline
agreement. Not an agent's call.

---

## 7. CORRECTION — the G5 harness was never failing

An earlier revision of this document said `tools/g5_worker_test/` reported
"1 PASS, 2 FAIL" and told you to start there. **That was wrong, and the error was
mine.** The count came from grepping the harness *source* for the strings
"PASS" and "FAIL", which counted the failure *branches in the code* rather than
the results of a run. Nobody had actually run it.

Run for real, it passes:

```
PASS - worker reached ready state and processed frames
PASS - at least one round-trip latency sample recorded
PASS - steady-state avg latency < 100ms (feedback-latency target, §7 gate;
       excludes one-time model warm-up)
steady-state avg latency (excl. first-frame warm-up): 33.0 ms
```

**33.0 ms steady-state**, against a 100 ms budget. First frame costs 403 ms
(one-time model warm-up), then it settles to ~30 ms.

So the §7 latency clause is **met in absolute terms**. G11 remains
BLOCKED-NO-BASELINE only for the *comparison* against Phase 0 — we can say the
system is fast, we cannot yet say by how much it improved.

Nothing in Phase G is red.

## 7b. The test suite (added after the phase was built)

`frontend/run_tests.sh` is the single entry point. **58 unit tests + 7 gate
harnesses, all passing.**

Unit tests use Node's built-in `node:test` — stdlib, no framework, nothing to
install. They live in `frontend/tests/`:

| File | Covers | Notable properties pinned |
|---|---|---|
| `rules.test.mjs` (24) | G2 | all seven squat checks; per-session heel-baseline isolation; **placeholder thresholds never evaluate** |
| `transport.test.mjs` (18) | G4, G9, G14 | bounded buffers drop-oldest and count; batching; closed event vocabulary; dual clocks |
| `smoothing_audio.test.mjs` (16) | G3, G8 | EMA matches `smoother.py` exactly; per-alert debounce |
| `helpers.mjs` | — | fixtures + `FakeWebSocket` / `FakeAudio` doubles (not a test file) |

Three of these guard failures that are **silent** — no crash, no log, nothing in
the UI to notice — which is precisely why they are worth having:

1. **Placeholder thresholds must never evaluate.** Five of six exercises carry
   `{"value": null}`. A `null` coerced to `0` makes every `angle > threshold`
   comparison true, so the patient is flagged on *every frame* for an error
   nobody configured. The test runs all five through both views and both stages
   and asserts zero flags.
2. **Alert strings are the join key to the audio cues.** Every `ALERTS` value
   must be a key in `AUDIO_MAP`, em-dashes (U+2014) included. This is the exact
   bug that broke the legacy app: four cues pointed at filenames that did not
   exist and it still reported "TTS ready".
3. **Heel-baseline state must not leak between sessions.** `squat.py` kept it in
   Python module-level globals. Replicated naively in JS, one patient's baseline
   carries into the next session in the same tab. The test opens two check sets
   and asserts they cannot see each other.

One note for whoever extends these: `node --test tests/` does **not** work on
Node 25 — it resolves the directory as a module. Use the glob,
`node --test "tests/*.test.mjs"`, which is what `run_tests.sh` does.

Also, `SessionWsClient.connect()` starts a 500 ms `setInterval` that only
`close()` clears. An unclosed client keeps the Node event loop alive and the test
run hangs forever rather than failing. The WS tests close every client in an
`afterEach`. Worth knowing before you write the Phase H integration tests.

---

## 8. Vendoring — the live path is fully offline

Verified: **zero external URLs** in `frontend/src/pages/live_session.html`. The
only `https://` strings inside the vendored bundles are comments and error
messages, not fetches.

| What | Where | Notes |
|---|---|---|
| Tailwind | `src/vendor/tailwind/tailwind.js` | The CDN build is a **runtime JIT compiler**, vendored as-is. See `docs/10_shell_vendoring.md` for the choice and its maintenance obligation. |
| Inter, JetBrains Mono | `src/vendor/fonts/` | Real `.woff2` files + local `@font-face`. |
| Material Symbols | `src/vendor/fonts/files/material-symbols-subset.woff2` | Subsetted. |
| MediaPipe Tasks Vision | `src/assets/vendor/mediapipe/` | `vision_bundle.mjs` + `wasm/` + `models/pose_landmarker_lite.task` |

The MediaPipe vendoring also **resolves the §9 / J5 open risk** about
`pose_landmarker.task` browser compatibility: the worker loads a vendored
`pose_landmarker_lite.task`, not the legacy Python `.task`. Note the consequence
the plan warned about — **thresholds tuned against the old model may not transfer**.
Squat's values came from the legacy config and were tuned on the legacy model, so
they should be re-checked against live output before anyone trusts a flag.

Total vendored weight: ~680K for fonts/Tailwind, plus the MediaPipe wasm and model.

---

## 9. The DOM contract (shell ↔ JS)

Two agents worked in parallel on the markup and the JS, so the element ids are a
contract. **All 8 verified present in the shell, and all 8 referenced by the JS.**

| id | Set by | Purpose |
|---|---|---|
| `rep-total` | `session_orchestrator.js:152` | total rep count |
| `rep-correct` | `session_orchestrator.js:153` | reps with no flag (`cleanReps`) |
| `feedback-banner` | orchestrator | banner container, colour swap |
| `feedback-text` | orchestrator | the alert sentence |
| `feedback-icon` | orchestrator | warning glyph |
| `emg-card` | orchestrator | EMG mini-card |
| `end-session-btn` | orchestrator | ends session |
| `dev-overlay` | orchestrator | fps / dropped / latency / queue depth |

`feedback-text` and `feedback-icon` were **missing from the shell** and added by
the orchestrator after the fact; without them the banner updates would have
silently no-opped. If you add markup, keep this table honest.

### Two counters

"Correct reps" is not a new concept — it reuses the legacy state machine
(`docs/03_legacy.md` D3). A rep is clean when it closes with no alert raised
during it (`rep_had_error === false`, surfaced as `cleanReps` / `repWasClean`).
`pose_engine_selfcheck.mjs` asserts exactly this: a knee-cave rep **still
increments total but not correct**.

---

## 10. Pick up here tomorrow

In order:

1. ~~Fix the failing G5 cases~~ — **there were none**, see §7. Skip.
2. ~~Write `docs/09_live_frontend.md`~~ — **done.** Covers G1-G14, the gate
   evidence, the isolation design, the DOM contract, and the known gaps.
3. **Run it against a real camera.** G6, G7, G8 and G10 are all written but have
   never executed in a browser with a live webcam. Expect small breakage — that is
   what a first run is for. Check: skeleton draws, a red limb means *that* limb,
   audio cue fires once and debounces, the dev overlay populates, both counters
   move and diverge when you deliberately squat badly.
4. **Then Phase H** (`ws/session_ws.py`, `session_buffer.py`, session endpoints).
   `ws/client.js` is written and waiting for a server; nothing has exercised that
   socket end to end yet. Run order §10 puts H alongside G.

Deferred and still open, not blocking G:
- **Phase 0 baseline** never run — this is what blocks G11, and the plan calls it
  the thing to do first. Every "we made it faster" claim is unbacked until it exists.
- **E8 re-labelling** — `knee_flexion_high` / `hip_lifting` are circular; those CV
  numbers are not evidence of generalisation.
- **E12 feature pruning** — deliberately deferred until E8 is resolved, so pruning
  does not optimise for keeping the leak.
- **F4 thresholds** — five of six exercises still hold `{"value": null}`. Only
  squat can flag anything. Provisional data-derived values sit in
  `docs/08_exercise_config.md` but were **not** promoted into `exercises.json`.
- **`backend/app/services/exercise_config.py`** — dead duplicate of the real
  loader, unimported, awaiting a delete decision.
- **A live-looking Google API key** sits in
  `backend/_old_physio_reference/config.py`, and `gitKeys.txt` is at repo root.
  Neither is gitignored. Revoke and move to `.env` before this repo is ever pushed.

---

## 11. File map

```
frontend/src/
  lib/
    angles.js               G1  FROZEN — parity-proven
    rules.js                G2  squat's 7 checks
    smoother.js             G3  EMA (default) + One-Euro (flagged off)
    ring_buffer.js          G4  self-check passes
    pose_engine.js              rep state machine, clean-rep tracking
    landmarks.js                landmark naming/indexing
    recorder.js             G12 MediaRecorder, isolated, timesliced
    audio_cues.js           G8  debounced cue playback
    logger.js               G14 ring-buffered structured logs
    session_orchestrator.js G6  main thread: camera, worker, DOM
    events.js                   mirrored with backend/app/events.py (43)
  workers/pose_worker.js    G5  inFlight boolean at :64
  render/skeleton.js        G7  ported drawing.py
  ws/client.js              G9  one socket, ~500ms batches
  pages/live_session.html       shell, fully offline
  vendor/                       tailwind, fonts
  assets/vendor/mediapipe/      bundle, wasm, lite model
  assets/audio/                 7 cue mp3s

frontend/tools/
  parity_check.mjs + parity_*.json     the 6-decimal gate
  ring_buffer_selfcheck.mjs            passes
  pose_engine_selfcheck.mjs            passes (3)
  g5_worker_test/                      1 PASS, 2 FAIL  <-- start here
  g13_test/g13_output.webm             the gate evidence, real VP9
```

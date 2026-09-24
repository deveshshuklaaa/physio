# G6 / G7 / G8 / G10 — test plan, awaiting approval

**Written:** 2026-08-21. **Status: RED, 2/20 checks passing. No implementation
has been run.** Per `.claude/skills/next-phase-skill`, no subagent is spawned
until these tests are approved or edited by the owner.

Tasks covered, verbatim from `MASTER_BUILD_PLAN_v3.md` §5 Phase G:

- **G6** — Main thread: `getUserMedia`, transfer frames to worker, paint
  skeleton and flags on canvas. Main thread does no inference and no math.
- **G7** — Port `drawing.py` (D2) into `render/skeleton.js` — green normal, red
  on flagged region.
- **G8** — Audio cues: play the mp3 mapped to the error code (D6), client-side.
  Debounce — do not replay the same cue more than once per N seconds.
- **G10** — Dev overlay showing capture fps, inference fps, dropped frames,
  feedback latency, WS queue depth. Toggleable.

All four are marked **DONE, UNVERIFIED** in `docs/G-CONTINUE.md` §3 — written,
never executed in a browser.

---

## 1. Blocking defect found while writing these tests

`frontend/src/render/skeleton.js:98` has a top-level Node import, placed there
for its `node skeleton.js` self-check:

```js
import { fileURLToPath } from "url";
```

In a browser this throws:

```
Failed to resolve module specifier "url". Relative references must start with
either "/", "./", or "../".
```

**Consequence: `skeleton.js` has never been loadable in a browser.**
`session_orchestrator.js` imports it, so the whole live path fails at module
resolution before a single frame is captured. The node-only test suite could
not see this — in node the import resolves fine, so `./run_tests.sh` stays
green while the browser path is dead.

Confirmed directly, not inferred: a minimal page doing
`import("../../src/render/skeleton.js")` in headless Chrome returns the error
above.

Fix belongs to whoever implements: move the self-check to a sibling
`tools/skeleton_selfcheck.mjs`, or gate the import behind
`typeof process !== "undefined"` via dynamic `await import("url")`.

---

## 2. Files

| File | Role |
|---|---|
| `frontend/tools/g6_g10_test/run_g6_g10_test.mjs` | CDP driver, headless Chrome, prints a PASS/FAIL table, exit 0/1 |
| `frontend/tools/g6_g10_test/render_audio_probe.html` | In-page probe for the alert-dependent half (G7, G8) |

Run:

```bash
cd frontend
node tools/g6_g10_test/run_g6_g10_test.mjs      # real camera (/dev/video0)
G6_FAKE_CAMERA=1 node tools/g6_g10_test/run_g6_g10_test.mjs   # CI escape hatch
```

Not yet added to `run_tests.sh` — add it when it goes green, so the suite does
not turn red on a machine with no webcam.

### Why the suite is split in two parts

G7 and G8 only do anything when an **alert is active**. A real camera cannot be
made to produce a chosen alert on demand, so:

- **Part 1** drives the real `src/pages/live_session.html` against the real
  `/dev/video0` — this is the "real camera run" gate (G6, G10).
- **Part 2** drives synthetic landmark points into the **real** Canvas2D context
  and the **real** `<audio>` element with the **real** mp3 off disk (G7, G8).
  Synthetic input, real browser primitives — no stub `ctx`, no mocked `Audio`.

---

## 3. DOM contract — needs owner approval

`src/pages/live_session.html` is currently a pure Stitch mockup: no `<video>`,
no `<canvas>`, rep counters hardcoded to `7` and `5`, a simulated SVG skeleton,
a simulated EMG waveform, hardcoded overlay numbers, and it never imports
`startLiveSession`. Wiring it is the work these tests gate.

The tests assert against ids I chose. **These are the invented part — change
them here before any code is written to them.**

| Selector | Purpose |
|---|---|
| `<video id="cam-video">` | hidden, `srcObject` = the `getUserMedia` stream |
| `<canvas id="stage-canvas">` | visible, mirrored video + skeleton overlay |
| `window.__liveSession` | the object `startLiveSession()` resolves to, for `getLatencySamples()` and teardown |
| `#ov-capture-fps` | G10 metric |
| `#ov-inference-fps` | G10 metric |
| `#ov-dropped` | G10 metric |
| `#ov-latency` | G10 metric |
| `#ov-ws-queue` | G10 metric |

`#dev-overlay`, `#rep-total`, `#rep-correct`, `#feedback-banner`,
`#feedback-text`, `#end-session-btn` already exist and are unchanged.

### The mockup-constant assertion

The overlay currently ships hardcoded values. The tests assert each field is
**not** its mockup constant after a live session has run:

| id | mockup value that must be gone |
|---|---|
| `ov-capture-fps` | `30.0` |
| `ov-inference-fps` | `18.4` |
| `ov-dropped` | `37` |
| `ov-latency` | `62ms` |
| `ov-ws-queue` | `2` |

A field still reading its constant is a field nothing is feeding. This is the
check that stops "the overlay looks right in a screenshot" from passing.

---

## 4. The checks

### G6 — capture, hand-off, paint

| # | Check | Why this and not something easier |
|---|---|---|
| 1 | `#cam-video` exists, has an `srcObject`, track `readyState === "live"`, `videoWidth > 0` | A `<video>` with no stream is the failure that looks like success |
| 2 | Track settings report a real `width`/`height`, not `0x0` | |
| 3 | Track label is non-empty and does **not** match `/fake_device\|fake camera/i` | This is the whole point of the run. Chrome's fake device passes every other check in this table |
| 4 | `window.__liveSession.getLatencySamples()` has ≥ 5 entries | The orchestrator's own record of worker round trips. Empty means no frame ever completed the loop |
| 5 | `#stage-canvas` pixels are non-blank | |
| 6 | Canvas pixels **change** across a 600 ms gap (> 100 differing pixels) | A frozen canvas passes check 5. Live frames do not stay identical |
| 7 | `session_orchestrator.js` imports none of `vision_bundle`, `angles.js`, `rules.js`, `pose_engine.js` | §5 G6's "main thread does no inference and no math", enforced statically — a runtime probe cannot see an import |

Check 7 is a source-level regex over the real file, run by the harness, not in
the browser.

### G7 — skeleton render, in real pixels

Driven with six synthetic landmarks on a 200×200 canvas, then the pixels are
read back with `getImageData` and counted against `COLOR.green` / `COLOR.red`
(±12 per channel, for antialiasing).

| # | Check |
|---|---|
| 8 | > 100 green pixels with no alerts — the skeleton actually paints |
| 9 | No alerts → green present, **zero** red pixels |
| 10 | Any alert → red present, **zero** green pixels |
| 11 | The pixel at a landmark's exact coordinate is painted |

Checks 9 and 10 encode `docs/03_legacy.md` D2 verbatim: **any** alert turns the
**entire** skeleton red. There is no per-limb colour in the legacy system, so a
"red on flagged region only" implementation must fail check 10.

Check 11 exists because a colour count alone would pass if the skeleton were
drawn at the wrong coordinates entirely.

### G8 — audio cues, real `<audio>`, real mp3

| # | Check | Why |
|---|---|---|
| 12 | Element created, `src` ends `/assets/audio/caving.mp3` | |
| 13 | `readyState >= 2` and `el.error == null` | **The one that matters.** A cue that never decodes is exactly the failure `voice.py:48`'s `any(os.path.exists(...))` hid for four of seven cues |
| 14 | `currentTime > 0` and `paused === false` | It played, not merely constructed |
| 15 | Same alert inside the 4 s window does not reset `currentTime` | The debounce (`COOLDOWN_MS = 4000`, matching `voice.py`'s `TTS_COOLDOWN = 4.0`) |
| 16 | A **different** alert plays immediately, unblocked by the first cue's timer | The debounce is per-alert, not global. A global cooldown would pass check 15 and be wrong |
| 17 | After the cooldown, the same alert plays again | Cooldown expires rather than latching |
| 18 | An unmapped alert creates no element — silent no-op | `audio_cues.js` must not invent a mapping |
| 19 | No shipped cue reports a missing asset | Each missing file is warned individually, never collapsed to one boolean |

### G10 — dev overlay

| # | Check |
|---|---|
| 20–24 | Each of the five metric spans exists |
| 25–29 | Each shows a value differing from its mockup constant (table in §3) |
| 30 | `D` toggles the overlay off, and a second `D` restores it |

---

## 5. RED baseline — actual output

Run on 2026-08-21 against the current tree, real camera, before any
implementation:

```
-- Part 1: live_session.html on a REAL camera (G6, G10)
   camera probe said: no #cam-video element in the page
   canvas probe said: no #stage-canvas element in the page
   overlay read: {"ov-capture-fps":null,"ov-inference-fps":null,"ov-dropped":null,
                  "ov-latency":null,"ov-ws-queue":null,"__visible":true}

-- Part 2: render + audio probe (G7, G8)
   probe page failed: timed out with no result

FAIL - G6: page opens the camera and the track is live
FAIL - G6: capture resolution is a real frame size, not 0x0
FAIL - G6: the device is a REAL camera, not Chrome's fake device
FAIL - G6: frames round-tripped through the pose worker (>=5 samples)
FAIL - G6: canvas is painted (non-blank)
FAIL - G6: canvas keeps updating — live frames, not one frozen grab
FAIL - G10: #ov-capture-fps exists
FAIL - G10: #ov-capture-fps shows a live value, not its mockup constant
FAIL - G10: #ov-inference-fps exists
FAIL - G10: #ov-inference-fps shows a live value, not its mockup constant
FAIL - G10: #ov-dropped exists
FAIL - G10: #ov-dropped shows a live value, not its mockup constant
FAIL - G10: #ov-latency exists
FAIL - G10: #ov-latency shows a live value, not its mockup constant
FAIL - G10: #ov-ws-queue exists
FAIL - G10: #ov-ws-queue shows a live value, not its mockup constant
PASS - G10: 'D' toggles the overlay off and back on
PASS - G6: main thread imports no inference or angle/rule math
FAIL - G7: skeleton probe ran at all
FAIL - G8: audio probe ran at all

2/20 checks passed
```

The two passes are pre-existing behaviour, not accidents: the `D` handler is
already in the page's inline script, and `session_orchestrator.js` genuinely
imports no math.

Part 2's whole group reports as two rolled-up failures because the probe page
never finished — that is the `skeleton.js` `import "url"` defect in §1, not a
harness bug. Once §1 is fixed, checks 8–19 report individually.

---

## 6. Open questions for the owner

1. **DOM contract ids** (§3) — mine, or yours?
2. **Real camera as a hard gate?** The harness refuses to run with no
   `/dev/video0`; `G6_FAKE_CAMERA=1` is the explicit opt-out. Alternative is
   dropping check 3 so it runs anywhere headless — weaker, proves the wiring
   but not the webcam.
3. **Headed run?** Everything here is headless: the skeleton is verified by
   pixel counts and the audio by `currentTime`, never seen or heard by a human.
   A headed pass with someone in frame is the only thing that catches
   "the skeleton is drawn correctly but mirrored onto the wrong side".
4. **Latency bound on G6?** No threshold is asserted; the harness only prints
   the median round trip. G11's < 100 ms gate is blocked on the missing
   `docs/00_baseline.md`, so nothing is enforced here yet.
5. **Scope of the implementation run.** As read from `PROJECT-STATUS.md` §7
   item 1, it is: fix §1, wire `live_session.html` to `startLiveSession`, feed
   the five overlay metrics from live numbers, then run the gate. It is **not**
   Phase H — `ws/client.js` will fail to connect throughout, since no server
   exists yet, and that is expected.

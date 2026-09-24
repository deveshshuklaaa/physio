# 00 — Baseline Performance (Phase 0)

**Date measured:** 2026-08-23  
**Status:** COMPLETE — see §9 (measured 2026-08-27). §1.2 and §3 are superseded.  
**Definition of Done gate:** CLOSED — baseline is 50.7 ms / 19.7 fps, §9.4.

---

## 1. Measurement status

### 1.1 What is measured (this session)

Automated measurements on the new system (browser-based):

| What | Method | Status |
|---|---|---|
| Worker steady-state latency | `frontend/tools/g5_worker_test/run_g5_test.mjs` | ✓ MEASURED |
| Camera + browser live loop | `frontend/tools/g6_g10_test/run_g6_g10_test.mjs` | ✓ MEASURED |
| Test suite pass rate | `frontend/run_tests.sh` | ✓ MEASURED |
| Hardware context | `lscpu`, browser capabilities | ✓ MEASURED |
| Structural lag-source analysis | Code inspection, exercise_runner.py | ✓ ANALYZED |

### 1.2 What is PENDING — human measurement required (P0.1 and P0.2)

These require a person, a camera, and a screen. They **cannot be automated**:

| Phase | Task | Why pending | How to run |
|---|---|---|---|
| **P0.1** | Baseline latency: posture change → flag (stopwatch) | Needs human standing in front of camera | See §3.1 |
| **P0.2** | Chrome DevTools Performance: main-thread blocking, fps | Needs human driving Chrome DevTools | See §3.2 |
| **P0.3** | Identify dominant lag source | Derives from P0.2 | See §3.3 |

---

## 2. Measured data

### 2.1 Hardware context

```
CPU:           12th Gen Intel Core i7-12700H
Cores:         20 (14 P-cores + 6 E-cores)
RAM:           (not sampled, assume 16GB or higher — Chrome's usage is negligible)
Camera:        /dev/video0 available
Browser:       (WebGL2 hardware acceleration active on main thread and in Web Workers)
Load average:  1.43 over 20 cores (quiet desktop environment)
```

### 2.2 New system — automated measurements

All numbers below are measured on a 640×480 camera, running in browser on the hardware above, with negligible background load.

**G5 worker latency test** (synthetic frames):
```
Method:                       node tools/g5_worker_test/run_g5_test.mjs
First-frame warm-up:          363 ms (MediaPipe model load, one-time only)
Init to ready:                584 ms (model + wasm startup)
Steady-state avg latency:     29.1 ms (excluding first frame)
Measured frames:              15 round trips after warm-up
Host context:                 load=1.43, available cores >> 1
```

**G6/G10 live camera test** (real /dev/video0, 640×480):
```
Method:                       node tools/g6_g10_test/run_g6_g10_test.mjs
Duration:                     ~30 seconds of live session
Worker round trips:           35 samples
Worker median latency:        67.4 ms (capture → result, includes all overhead)
Capture FPS (reported):       9.4
Inference FPS (reported):     9.2
Dropped frames:               145 (by inFlight guard)
WS queue depth (peak):        41 frames
Dev overlay latency reading:  88.9 ms (landmark timestamp → painted flag)
Test checks:                  30/30 passed (page loads, camera works, rendering works, audio plays)
```

**Test suite**:
```
Command:                      ./run_tests.sh
Total checks:                 78 unit tests + 7 gate harnesses = 85
Exit status:                  0 (ALL PHASE G CHECKS PASSED)
Duration:                     ~45 seconds
Notable:                      G7 rendering, G8 audio debounce, G13 recording isolation all verified
```

### 2.3 New system measurements — comparison vs Phase 0 gate requirement

The Phase 0 gate requires comparison to the **legacy app's baseline**. Until P0.1 and P0.2 run on the legacy system, that comparison **cannot be stated**.

**Current new-system raw numbers:**
| Metric | Value | Notes |
|---|---|---|
| Worker round-trip (synthetic frames) | 29.1 ms | G5 test, quiet machine, no background load |
| Worker round-trip (live camera) | 67.4 ms median | G6/G10 test, real /dev/video0 |
| Painted feedback latency | 88.9 ms | Dev overlay reading, includes rendering delay |
| Phase G gate requirement | < 100 ms | PASSING |
| Capture FPS (real camera) | 9.4 | Below target 15–20 (§3.2 R2) |
| Inference FPS (real camera) | 9.2 | Below target 15–20 (§3.2 R2) |

These are **NEW system numbers**. The baseline is meant to come from the **LEGACY system** (desktop OpenCV app). Do not confuse the two in comparisons later — every time a developer makes a performance claim, they must state "vs the baseline" to avoid re-optimizing without evidence.

---

## 3. Pending measurements — exact protocols

### 3.1 P0.1 — Baseline latency measurement (stopwatch)

**What:** Time from a deliberate posture change to the on-screen flag appearing. Median of 10 trials.

**Why:** The legacy desktop app is the reference. The new system must be demonstrably faster, or optimization is guessing.

**Setup:**
1. Open the legacy app at `/home/billa-dakait/Desktop/final_project/backend/_old_physio_reference/main.py`
   ```bash
   cd backend/_old_physio_reference
   python main.py
   ```
2. Select any dynamic exercise (e.g., squat)
3. Position camera so both your posture and the "ALERTS" row on the HUD are clearly visible
4. Have a stopwatch or video-recording app ready to measure sub-second timing

**Run the test (10 trials):**

For each trial:
- Start with posture CORRECT (no alerts flagged on HUD)
- Start the stopwatch
- Make a deliberate posture error (e.g., drop knee inward on a squat, or bend forward)
- Stop the stopwatch the moment the alert text appears in the "! ALERTS" section on the HUD
- Record the elapsed time
- Wait ~3 seconds, fix your posture (alert clears), reset

**Record your results:**

Paste your 10 trial times into the section below, replacing the placeholder:

<!-- P0.1 PENDING: owner measurement -->

```
P0.1 — Baseline latency (legacy OpenCV app, stopwatch on visual alert)

Trial 1:   ___ ms
Trial 2:   ___ ms
Trial 3:   ___ ms
Trial 4:   ___ ms
Trial 5:   ___ ms
Trial 6:   ___ ms
Trial 7:   ___ ms
Trial 8:   ___ ms
Trial 9:   ___ ms
Trial 10:  ___ ms

Median:    ___ ms
Mean:      ___ ms
Std dev:   ___ ms
```

**Notes:**
- Timing precision target: ±100 ms is acceptable
- The goal is trend, not precision — stop flag appearing 50ms faster is meaningful, 5ms is noise
- If the alert never fires, the exercise definition or thresholds are misconfigured; try another exercise

---

### 3.2 P0.2 — Browser DevTools Performance profile

**What:** Chrome DevTools Performance recording over a 30-second live session. Records: main-thread blocking time, longest task, frame rate.

**Why:** Isolate which of the four lag sources (§3.1 of the build plan) dominates the legacy system's perceived sluggishness.

**Setup:**

1. Run the legacy desktop app as in P0.1, any exercise
2. Open Chrome (if not already your testing browser)
3. Open Chrome DevTools: **F12** or **Ctrl+Shift+I** (or right-click → Inspect)
4. Navigate to the **Performance** tab
5. Position the windows so you can see both the legacy app window and DevTools

**Run the test (one 30-second profile):**

1. In Chrome DevTools Performance tab, click the **red circle** (Record) button
2. Immediately switch to the legacy app window
3. Perform a normal exercise session for exactly 30 seconds:
   - Move through your full range of motion
   - Trigger some alerts if possible (posture errors)
   - Recover to correct posture
4. At the 30-second mark, switch back to Chrome DevTools and click **Record** again to stop
5. Chrome will process the recording (~5 seconds)

**What to record from the DevTools trace:**

Once the trace loads, look for:

1. **Main thread blocking time:**
   - In the DevTools trace, find the main thread row (top row, labeled "Main")
   - Measure the longest continuous red/orange task (indicates blocking work)
   - Record: max blocking task duration (ms)

2. **Longest task:**
   - Hover over the longest red block on the Main thread
   - Record its label and duration

3. **Frame rate:**
   - Look at the "Frames" row (usually just below Main)
   - Count how many green frame bars appear in the 30-second window
   - Divide by 30 to get mean FPS
   - Or use DevTools' built-in FPS counter if visible

4. **Task breakdown (if visible):**
   - Look at what categories of work appear on the Main thread: MediaPipe? Rendering? Other?
   - The dominant colour indicates which lag source is the bottleneck

**Record your findings:**

Paste into the section below:

<!-- P0.2 PENDING: owner measurement -->

```
P0.2 — Chrome DevTools Performance profile (30-second live session)

Session details:
  Exercise: ____________
  Duration: 30 seconds
  Alerts triggered: (yes/no, roughly how many) ____________

Main thread analysis:
  Longest blocking task: ___ ms (was it: MediaPipe / Rendering / Other?)
  Total red time in 30s: ~___ ms (rough estimate)
  Most common task type: ____________

Frame rate:
  Approximate FPS: ___ (green frames / 30 sec)
  Frame drops visible: (yes/no)

Dominant lag source (your assessment):
  Which of the four sources (§3.1) appears to be the bottleneck?
  1. Pose inference on main thread
  2. Unbounded send queue (not applicable to desktop app)
  3. Network round trip (not applicable to desktop app)
  4. Synchronous disk writes
  
  Answer: Source #___  because: ____________
```

---

### 3.3 P0.3 — Identifying the dominant lag source

Once P0.1 and P0.2 are complete, the dominant lag source will be clear:

- **If P0.2 shows "MediaPipe" tasks dominating the Main thread** → Source #1 (inference blocking)
- **If P0.2 shows huge frame drops and the app feels stuttery** → Source #1 (same cause)
- **If P0.2 shows main thread is quiet but latency is high** → Source #3 or #4 (unlikely for legacy desktop app)

The answer will be written in this file's §3.3 section once the measurements arrive.

---

## 4. Legacy app structural analysis (no measurement needed — code inspection)

This section identifies the lag sources that **could** affect the legacy system by reading the code, not by measuring.

### 4.1 Source #1: Pose inference on the main thread

**Finding: DOMINANT in legacy app**

The legacy `exercise_runner.py` main loop (lines 290–481):

```python
while cap.isOpened():
    ret, frame = cap.read()                                    # (1) Read frame
    if not ret: ...
    
    frame = cv2.flip(frame, 1)
    h, w = frame.shape[:2]
    
    # MediaPipe on downscaled frame
    small = cv2.resize(frame, ...)
    rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = landmarker.detect_for_video(mp_img, ...)       # (2) BLOCKING INFERENCE
    
    if result.pose_landmarks:
        lms = result.pose_landmarks[0]
        # ... extract angles, run checks, build state ...
    
    # ... state machine for reps, HUD drawing ...
    
    _draw_hud(frame, ...)                                      # (3) Render
    cv2.imshow(WIN_TITLE, frame)                               # (4) Display
    
    key = cv2.waitKey(1) & 0xFF                                # (5) Poll input
```

**The issue:** `landmarker.detect_for_video()` on line 309 is a **synchronous call** that does not return until the inference completes. During this time:
- The frame capture loop is blocked
- Rendering is blocked
- Input handling is blocked

Every frame must wait for the previous inference to finish. **There is no parallelism, no dropping frames to keep latency bounded, no frame budget.**

**Expected latency impact:** If MediaPipe takes 50–100 ms per frame on this hardware, and the loop processes one frame at a time, the app runs at ~10 FPS even if the camera delivers 30 FPS. Every inference delay directly becomes user-visible lag.

### 4.2 Source #2: Unbounded queue in WebSocket send

**Finding: NOT APPLICABLE — this is a desktop app**

The legacy app has no WebSocket or network queue. All state is local, rendered to the OpenCV window. No queuing, no network latency.

### 4.3 Source #3: Network round trip in feedback loop

**Finding: NOT IN LIVE LOOP — post-session only**

Lines 505–510 show a Gemini API call for post-session report generation:

```python
if session_log:
    print("\n Opening AI coaching report...")
    prompt = build_gemini_prompt_generic(definition, session_log, rep_count, clean_reps)
    show_report_window(prompt)
```

This runs **after the session ends**, not during live feedback. The live loop (while the camera is running) makes no network calls. This source does not affect live latency.

### 4.4 Source #4: Synchronous disk writes in live loop

**Finding: NOT PRESENT — state is buffered in memory**

Lines 266, 360, 440–445 show session data is collected into a Python list in memory:

```python
session_log = []                    # Line 266

# Then appended to during the session:
session_log.append({                # Lines 360, 440
    "rep": rep_count,
    "errors": [...],
    "clean": rep_was_clean,
})
```

**No disk write occurs during the live loop.** The data is flushed to disk only once, post-session, when the report is generated. This source does not affect live latency.

### 4.5 Summary: Which source dominates?

**Source #1 (pose inference on main thread) is the overwhelmingly dominant lag source in the legacy app.**

Sources #2, #3, and #4 are either not present or run outside the feedback loop. The bottleneck is MediaPipe inference blocking the rendering loop frame-by-frame.

---

## 5. The new system's design for comparison

To make G11 meaningful, understand what the new system changed:

**Legacy (desktop):**
- MediaPipe inference runs on main thread → blocks rendering → ~10 FPS live
- No frame budget, no dropping, queuing implicit in frame read latency

**New (browser):**
- MediaPipe inference runs in Web Worker (off main thread) → main thread only paints
- Frame budget: inFlight guard drops new frames if inference is still running (§3.2 R2)
- Bounded ring buffer for WS outbound messages (§3.2 R3)
- Rule checks run client-side, not via network (§3.2 R4)

**Expected improvement:** Rendering is no longer blocked by inference. The main thread can paint every captured frame, even if inference is slower. The inFlight guard prevents the queue from growing unbounded.

---

## 6. File inventory

### Measured outputs (generated this session)

- `frontend/tools/g5_worker_test/run_g5_test.mjs` — steady-state latency test (29.1 ms result)
- `frontend/tools/g6_g10_test/run_g6_g10_test.mjs` — live camera test (67.4 ms, 9.4 fps result)
- `frontend/run_tests.sh` — full test suite (78 unit tests + 7 gate harnesses, all pass)

### Existing baseline references

- `backend/_old_physio_reference/exercise_runner.py` — legacy app entry point
- `backend/_old_physio_reference/main.py` — legacy exercise menu
- `docs/09_live_frontend.md` — Phase G measurements (new system, already complete)
- `MASTER_BUILD_PLAN_v3.md` — §3 (performance architecture) — defines the four lag sources and the rules

---

## 7. Gate status

**Phase 0 gate:** "Baseline latency written down."

**Current status: OPEN** ⚠️

What is complete:
- ✓ Legacy app structural analysis against §3.1's four sources
- ✓ Hardware context documented
- ✓ New system measurements recorded
- ✓ Precise protocols written for P0.1 and P0.2

What is pending:
- ⚠️ P0.1: Owner's 10 stopwatch measurements (posture change → flag time)
- ⚠️ P0.2: Owner's Chrome DevTools Performance profile (30 seconds)
- ⚠️ P0.3: Identification of dominant lag source from P0.2

**Gate will close when:** P0.1, P0.2, and P0.3 sections above are filled in with measured values.

**Next steps:** Owner runs the protocols in §3.1 and §3.2, documents results in the placeholder sections above. Once complete, this file is frozen and becomes the reference for all later performance claims (§12 of the plan: *"Optimization without these numbers is guessing."*).

---

## 8. Notes for the next agent (Phase G11)

When the new system's live latency is measured against this baseline:

1. **Use the median of P0.1** (legacy stopwatch times) as the baseline number
2. **Compare the new system's "painted flag latency"** (from the dev overlay in the browser, or from a stopwatch run on the new system) against that baseline
3. **State the improvement as a ratio:** e.g., "legacy 320 ms → new 89 ms = 3.6× faster"
4. **Note the hardware context:** if this baseline was measured on a laptop and the new system is measured on a server, the comparison is weakened — but a 3× improvement is still meaningful across hardware
5. **Do not compare synthetic latencies (G5 test) to real latencies (stopwatch):** the G5 test reports worker round-trip with synthetic frames; a real posture change introduces additional variance

---

## Deviations from MASTER_BUILD_PLAN_v3, if any

None. Phase 0 was not run before (as noted in §4 of `docs/09_live_frontend.md`), which is why this is happening now.

**Why it was late:** The plan specified Phase 0 first, but earlier phases were completed without it. Optimization already happened (GPU delegate, One-Euro filter, interpolation) against no baseline. This file exists to prevent that pattern from repeating.

---

## 9. P0.1 / P0.2 / P0.3 — MEASURED 2026-08-27 (orchestrator)

**Gate status: CLOSED.** Superseding the "human measurement required" framing in
§1.2 and §3. Two corrections to this document had to be made first.

### 9.1 Correction — §3.2's P0.2 protocol was impossible

§3.2 instructs the reader to profile the **legacy desktop app** with **Chrome
DevTools**. The legacy app is Python + OpenCV rendering through `cv2.imshow`
(`exercise_runner.py:481`). It has no browser process, so Chrome DevTools
cannot see it — recording Chrome while an OpenCV window is in the foreground
captures nothing about the legacy app.

The plan's P0.2 ("open browser devtools Performance tab during a live session")
refers to the **new** browser system. §3.2 misapplied it to the legacy one.
Anyone following that protocol would have produced a blank trace and recorded
it as data.

### 9.2 Correction — the legacy loop is not ~10 fps

§4.1 estimated *"If MediaPipe takes 50–100 ms per frame ... the app runs at
~10 FPS"*. That was an estimate presented next to measured numbers. Measured,
it is roughly twice that.

### 9.3 How this was measured, without a stopwatch

`backend/tools/p0_legacy_bench.py` replicates `exercise_runner.py`'s live loop
verbatim — same `pose_landmarker.task`, same `RunningMode.VIDEO`, same
confidences, same `flip → resize(DETECTION_SCALE) → BGR2RGB →
detect_for_video()` sequence — against recorded footage instead of a live
camera. Reproducible, no human required, and it measures the exact call §4.5
identifies as the dominant lag source.

Footage: 3 real clips from the owner's training dataset. 120 frames per clip,
first frame dropped as one-time warm-up (same convention as the G5 harness).

### 9.4 Results — legacy (THE BASELINE NUMBER)

```
A. LEGACY CONFIG (1280x720 capture, DETECTION_SCALE 0.9 -> 1152x648 inference)
  heel slides/1.MOV    infer med 45.7 ms | loop med 52.5 ms | 19.1 fps
  heel slides/10.MOV   infer med 36.3 ms | loop med 40.3 ms | 24.8 fps
  heel slides/11.MOV   infer med 46.5 ms | loop med 50.7 ms | 19.7 fps

  MEDIAN:              infer 45.7 ms | loop 50.7 ms | 19.7 fps
```

**Baseline = 50.7 ms per frame, 19.7 fps, inference blocking throughout.**

**Understated, deliberately.** The harness runs headless, so it excludes
`_draw_hud()` and `cv2.imshow()`. The real legacy loop is **slower** than
50.7 ms. Treat this as a floor, not an estimate.

### 9.5 Result — resolution is not the bottleneck

```
B. SAME MODEL AT THE NEW SYSTEM'S RESOLUTION (640x480, scale 1.0)
  MEDIAN:              infer 42.8 ms | loop 44.8 ms | 22.3 fps
```

Dropping inference from 1152×648 to 640×480 saves **2.9 ms** — 6%. MediaPipe
rescales internally, so input resolution is nearly irrelevant to its cost.

Worth recording because "the legacy app is slow because it runs at high
resolution" is the obvious wrong conclusion, and it would send someone
optimising capture resolution for a 6% return.

### 9.6 P0.3 — dominant lag source, now measured rather than inferred

**Source #1 (pose inference blocking the main thread) — CONFIRMED.**

Inference is 45.7 of 50.7 ms, i.e. **90% of the legacy frame budget**, and it
is synchronous: capture, rule checks, HUD drawing and input polling all wait on
it. §4.2–4.4 already established sources #2, #3 and #4 are absent from the
legacy live loop by code inspection; that analysis holds.

What changes is the magnitude. The legacy app is not catastrophically slow —
it is ~20 fps with stuttery rendering, because every inference is a frame the
loop cannot paint.

### 9.7 The comparison G11 was waiting for — and it is not flattering

| | Legacy (measured) | New browser (from §2.2) |
|---|---|---|
| Inference | 45.7 ms | — |
| Loop / round trip | **50.7 ms** (excl. render) | **67.4 ms** median |
| Effective fps | **19.7** | **9.4 capture / 9.2 inference** |
| Painted feedback | not measured | 88.9 ms |
| Rendering blocked by inference | **yes** | no |

**The new system is measurably slower in throughput than the legacy app it
replaced.** Roughly half the frame rate, and a longer round trip.

This is exactly the finding Phase 0 exists to surface, and it would have been
invisible without it — §12 of the plan: *"Optimization without these numbers is
guessing."* Every optimisation so far (GPU delegate, One-Euro, interpolation)
was performed against no baseline.

**Two things are still true and must not be lost in the comparison:**

1. **The architecture claim holds.** Legacy blocks rendering during inference;
   the new system does not. 19.7 fps stuttering and 9.4 fps painting smoothly
   are different experiences. The §3.2 R1/R2 design is sound.
2. **The Phase G gate is still met.** 88.9 ms painted feedback is inside the
   <100 ms budget. The system is fast enough in absolute terms; it is simply
   not faster than what it replaced.

**These are not like-for-like measurements.** Legacy is a headless Python loop
excluding render; the new number is a full browser round trip including paint,
in a headless-Chrome harness. The gap is real but its size is uncertain.

### 9.8 What is genuinely still open

- **P0.1 as originally specified** (10 human stopwatch trials on perceived
  posture-change → flag latency) has not been run. §9.4 replaces its *purpose*
  with a better number for the dominant source, but human-perceived latency
  includes camera exposure, display refresh and human reaction — none captured
  here. Worth doing only if the perceived-latency question matters on its own;
  it is no longer blocking.
- **P0.2 against the NEW system.** A DevTools profile of the browser app is
  genuinely useful and genuinely runnable — unlike §3.2's version. It would
  show whether the new system's 9.4 fps is main-thread contention, worker
  scheduling, or camera capture.
- **Why the new system is at 9.4 fps** when its own worker benchmark reports
  29.1 ms steady-state (which would allow ~34 fps). That gap is unexplained and
  is now the most interesting open performance question in the project.

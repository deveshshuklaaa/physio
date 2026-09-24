# EMG App — History, Storage & Playback Feature Spec

Reference doc. No code written yet — this is the full plan to implement later.

Files touched: `app.py`, `live.html`, `history.html`, `playback.html`.

---

## 0. Current State (as uploaded)

- `app.py`: single global serial thread. `start_capture_at_boot()` opens serial and
  starts writing to a `.bin` file immediately when Flask boots. `/api/stop_capture`
  kills the thread entirely (which also kills the live SSE feed, since it's the same
  thread). `/api/start_capture` restarts it. History entries are only logged inside
  `stop_capture()`.
- `live.html`: has a "History" nav button that calls the **legacy** `/api/snapshot`
  endpoint (copies a `BIN_FILE` path that nothing currently writes to). There is no
  Start/Stop Recording control in the UI at all.
- `history.html`: lists entries from `/api/list_recordings` correctly (date, time,
  duration all render). Sparkline preview is a **static hardcoded SVG path**, same
  for every card, not derived from real data.
- `playback.html`: pure mockup. Loads the raw `.bin` file and draws the *entire*
  waveform once, statically. Play/pause button only flips an icon — does not
  actually drive time. Rewind/forward/speed/zoom buttons are not wired to anything.
  Annotations are 4 hardcoded `<div>`s, not loaded from anywhere, "ADD MARKER" does
  nothing.

### Critical gap to fix first

Because `stop_capture()` is the *only* place that writes a history entry, and
because there is no UI button that calls it, **no real recording ever reaches
history.json** in the current app. This has to be fixed as part of this feature,
not as an afterthought — see Section 1.1.

---

## 1. Architecture Change: decouple "live view" from "recording"

**Problem:** today, serial-read and file-write live in the same thread/lifecycle.
Stopping a recording currently means killing the live feed too.

**Fix:** split into two independent concepts:

1. **Serial connection** — opened once at boot, stays open for the life of the
   server process. Every line read is always pushed to `data_queue` for SSE
   (powers the live chart, regardless of recording state).
2. **Recording** — an on/off toggle. When ON, lines arriving on the already-open
   serial connection are *also* parsed and written to a temp binary file. When
   toggled OFF, the temp file is finalized (compressed, see Section 2) and logged
   to `history.json`.

### 1.1 New/renamed globals in `app.py`

```
serial_thread          # started once at boot, runs forever (was: start/stop per session)
recording_active       # threading.Event() — NEW, replaces overloaded meaning of serial_thread.is_alive()
current_temp_path      # str | None — NEW, path of the in-progress raw temp file
current_temp_fh        # open file handle | None — NEW
capture_start_ts        # unchanged, epoch seconds, but now set on *recording* start, not serial start
capture_filename        # unchanged concept, but now holds the FINAL compressed filename (see Section 2)
```

`serial_ser`, `serial_error`, `data_queue`, `thread_lock`, `stop_event` — keep as-is,
`stop_event` now only ever fires on server shutdown, not per-recording.

### 1.2 Function-level rewrite list

- **`serial_reader()`** — loop body stays mostly the same (readline → decode →
  push to `data_queue`), but the "parse ints → `struct.pack` → write to bin_file"
  block becomes conditional:
  ```
  if recording_active.is_set() and current_temp_fh is not None:
      <existing parse + struct.pack + write logic>
  ```
  The `with open(bin_path, 'wb') as bin_file:` wrapper goes away — the function no
  longer takes a `bin_path` arg at all. File open/close is now handled by the
  start/stop-recording functions directly (see below), since the file's lifetime
  no longer matches the thread's lifetime.
  Also carry over the earlier-agreed hardening: wrap the per-line body in a second
  broad `except Exception as e: serial_error = f"Capture thread crashed: {e}"` so a
  future malformed-line crash surfaces in `/api/status` instead of dying silently.

- **`start_serial_thread_at_boot()`** — replaces `start_capture_at_boot()`. Called
  once, unconditionally, from `if __name__ == '__main__':` (no longer gated by the
  `WERKZEUG_RUN_MAIN` debug-reloader check, because there's only ever one serial
  thread for the whole process lifetime now — recording start/stop no longer spawns
  threads, so the double-start-on-reload class of bug goes away by construction).
  Still worth explicitly disabling the reloader (`use_reloader=False`) for
  simplicity/predictability.

- **`_start_recording_locked()`** — replaces `_start_capture_locked()`. No longer
  starts a thread. Instead:
  1. Guard: if `recording_active.is_set()`, return `False` (already recording).
  2. Drain `data_queue` (unchanged behavior, still nice to start clean).
  3. Set `capture_start_ts = time.time()`.
  4. Build `current_temp_path` = `<DATA_DIR>/_tmp_<timestamp>.raw`.
  5. Open `current_temp_fh = open(current_temp_path, 'wb')`.
  6. `recording_active.set()`.
  7. Return `True`.

- **`_stop_recording_locked()`** — replaces the file-closing part of
  `stop_capture()`. Steps:
  1. Guard: if not `recording_active.is_set()`, return `None`.
  2. `recording_active.clear()`.
  3. Close `current_temp_fh`, capture `raw_path = current_temp_path`,
     `start_ts = capture_start_ts`; reset both globals to `None`.
  4. Call `compress_capture_file(raw_path, SAMPLE_RATE)` (Section 2) → gives back
     final `.emgz` filename + sample count.
  5. Compute `duration = time.time() - start_ts`.
  6. Call `add_to_history(...)` with the new fields (Section 2.3).
  7. Return the finalized filename (so the HTTP route can respond with it).

- **`/api/start_capture`** route — rename semantics to "start recording" (keep the
  URL for frontend compatibility, or rename to `/api/start_recording` and update
  both `live.html` calls — recommend renaming since it's clearer, this is a good
  time to fix the name). Calls `_start_recording_locked()`.

- **`/api/stop_capture`** → rename to **`/api/stop_recording`**. Calls
  `_stop_recording_locked()`, returns `{status: 'stopped', filename: <emgz name>}`
  so `live.html` can optionally deep-link straight to playback after stopping.

- **`/api/status`** — now returns:
  ```
  {
    "serial_connected": bool,      // was capture_running; true whenever the boot-time thread has an open port
    "recording_active": bool,      // NEW — is a recording currently being written
    "error": serial_error
  }
  ```
  `live.html`'s `checkStatus()` needs updating for the renamed field (Section 4).

- **`/api/snapshot`** — delete entirely. It's dead code once real recording works
  (`BIN_FILE`/legacy shared-file concept no longer exists at all).

---

## 2. Storage Format Redesign ("ultra-efficient")

Current format: raw interleaved `int16 signal, int16 envelope` pairs, 4 bytes/sample,
500 Hz → 2000 bytes/sec → ~7.0 MB/hour. Already reasonably compact, but not
compressed, and has no self-describing header (sample rate lives only in
`history.json`, so a `.bin` file is meaningless on its own).

### 2.1 New container format — `.emgz`

8-byte header, then gzip-compressed body:

| Bytes | Field        | Type          | Notes                                   |
|-------|--------------|---------------|------------------------------------------|
| 0–3   | magic        | `b'EMG1'`     | format identifier                        |
| 4–5   | version      | `uint16` LE   | `1` for now                               |
| 6–7   | sample_rate  | `uint16` LE   | Hz, e.g. `500`                            |
| 8+    | body         | gzip bytes    | decompresses to raw `<hh>` pairs, same layout as today |

Struct format string: `'<4sHH'` for the header.

### 2.2 `compress_capture_file(raw_path, sample_rate)` — NEW helper

1. Read all bytes from `raw_path`.
2. `gzip.compress(raw_bytes)`.
3. Build final filename: same timestamp-based name as before but `.emgz` extension
   instead of `.bin`, e.g. `emg_20260725_193000.emgz`.
4. Write header (`struct.pack('<4sHH', b'EMG1', 1, sample_rate)`) + compressed
   bytes to the final path.
5. Delete `raw_path` (the temp raw file).
6. Return `(final_filename, num_samples)` where
   `num_samples = len(raw_bytes) // 4` (4 bytes per sample-pair).

Compression expectation: envelope channel is slow-moving (heavily compressible),
raw filtered EMG less so — expect roughly 2–3x overall reduction vs. raw, so
figure ~2.5–3.5 MB/hour instead of ~7 MB/hour. Good enough without adding
complexity. (Stretch goal, not needed now: delta + varint encoding specifically on
the envelope channel before gzip, for another ~30–40% on top — only worth doing if
storage actually becomes a problem.)

Note on timing: compressing happens **after** `stop_recording`, all at once, not
streamed sample-by-sample — zero impact on the real-time serial-read hot path.
Only downside is 2x disk usage for the duration of a single compress step (raw +
compressed momentarily coexist); fine for expected session lengths. If sessions
ever run for hours, switch to streaming compression via `gzip.GzipFile(fileobj=...)`
opened at recording-start time instead of a raw temp file — flag as future
optimization, not needed for v1.

### 2.3 `add_to_history()` — signature change

```
add_to_history(filename, timestamp, duration=None, sample_rate=None, num_samples=None)
```
New fields stored in each history entry:
- `sample_rate` (int, Hz)
- `num_samples` (int)
- `size` stays as-is (size of the **compressed** `.emgz` file on disk now, not raw)

### 2.4 `/api/recording/<filename>` — GET, rewritten

1. `safe_join(DATA_DIR, filename)` (keep — path traversal guard, carry this
   pattern to every new filename-taking route below).
2. Read first 8 bytes, check magic:
   - If `b'EMG1'` → parse `version`, `sample_rate`; `gzip.decompress()` the rest;
     return those raw bytes with `mimetype='application/octet-stream'`.
   - Else (legacy plain `.bin` file with no header, from before this change) →
     serve the file as-is, unchanged behavior, for backward compatibility.
3. **Frontend impact: none.** `playback.html`'s existing
   `new Int16Array(await response.arrayBuffer())` decode logic keeps working
   unmodified — decompression is fully server-side and transparent.

### 2.5 `/api/recording_meta/<filename>` — GET, NEW

Returns just the small stuff, so `playback.html` can paint labels (duration,
sample rate, timestamp) instantly before the full (potentially large) sample
payload finishes downloading:
```
{ "sample_rate": 500, "num_samples": 123456, "duration_seconds": 246.9, "timestamp": "2026-07-25T19:30:00" }
```
Pulled straight from the matching `history.json` entry (`safe_join` + lookup by
filename). If an entry predates this feature and lacks `sample_rate`/`num_samples`
(see Section 6, migration), fall back to `sample_rate=500` and
`num_samples = size // 4` so old entries don't 404 or crash.

### 2.6 `/api/preview/<filename>` — GET, NEW (for real sparklines)

Query param `points` (default `64`). Steps:
1. Load + decompress the file same way as `/api/recording`.
2. Reinterpret as `int16` pairs, take just the signal channel.
3. Split into `points` equal buckets, take **max(abs(...))** per bucket (peaks
   read better than averages for a tiny sparkline).
4. Return `{ "points": [ ... ] }` (small JSON array, cheap to fetch per card).

Used by `history.html` to draw a *real* per-recording sparkline instead of the
current one-size-fits-all placeholder path.

---

## 3. Annotations — new backend support

Stored as a JSON sidecar next to each recording:
`emg_20260725_193000.emgz` → `emg_20260725_193000.annotations.json` in `DATA_DIR`.

Each annotation: `{ "id": "<uuid4 hex>", "time_seconds": 134.452, "label": "..." }`.

### New helpers (mirror existing `load_history`/`save_history` pattern)
- `load_annotations(filename)` — reads sidecar, returns `[]` if it doesn't exist.
- `save_annotations(filename, annotations_list)` — writes sidecar (indent=2, same
  style as `save_history`).

### New routes
- **`GET /api/annotations/<filename>`** → `load_annotations(filename)`.
- **`POST /api/annotations/<filename>`** → body `{ time_seconds, label }`; generate
  `id = uuid.uuid4().hex`, append, save, return the full updated list.
- **`PUT /api/annotations/<filename>/<id>`** → body `{ time_seconds?, label? }`;
  find by id, update provided fields, save, return updated list.
- **`DELETE /api/annotations/<filename>/<id>`** → remove by id, save, return updated
  list.

All four use `safe_join(DATA_DIR, filename)` before touching disk, same guard as
`get_recording`.

---

## 4. `live.html` changes

1. **Add a Start/Stop Recording control**, separate from the existing Pause button
   (Pause only stops local canvas rendering — it should NOT stop the recording).
   Suggested placement: new button in the bottom nav or top-right badge area, using
   the existing `alert-pulse` CSS class (already defined, currently unused by any
   real state) to pulse red while `recording_active` is true.
2. **Rewire `historyBtn`**: delete the `/api/snapshot` POST call entirely (dead
   endpoint, Section 1.2). `historyBtn` becomes a plain navigation link to
   `history.html` — no fetch needed, recordings are already saved by the time the
   user stops recording.
3. **New `recordBtn` handler**:
   - On click, if not currently recording: `POST /api/start_capture`
     (or `/api/start_recording` if renamed — keep frontend/backend names in sync,
     whichever name is picked in Section 1.2), flip button to "Stop" state, add
     pulsing red REC badge.
   - If currently recording: `POST /api/stop_capture` (`/api/stop_recording`), read
     the returned `filename` from the response, flip button back to "Record" state,
     remove REC badge. Optionally show the existing toast ("DATA POINT SAVED") using
     the toast element that's already wired up, then navigate to `history.html`
     (or straight to `playback.html?file=<filename>` — nicer UX, jump right into
     reviewing what was just recorded).
4. **`checkStatus()` rewrite** — field names change per Section 1.2:
   ```
   data.serial_connected   // was: implicit via capture_running
   data.recording_active   // NEW — drives REC badge state on page load/refresh
   data.error
   ```
   On load: if `serial_connected` is false → show "NO SERIAL" badge (unchanged
   logic, just renamed field). If `recording_active` is true (e.g. user refreshed
   the page mid-recording) → restore the REC button to its active/pulsing state so
   UI doesn't lie about what's actually happening server-side.
5. Everything else in `live.html` (canvas draw loop, peak-lock scaling, gain
   slider, SSE handling) is unaffected — serial streaming keeps working exactly as
   already fixed in earlier turns.

---

## 5. `history.html` changes

1. **Real sparklines**: for each recording card, fetch
   `/api/preview/<filename>?points=48` and build the SVG `path d="..."` string from
   the returned points array (normalize values to the 0–40 viewBox height used by
   the existing placeholder `<svg viewBox="0 0 100 40">`), replacing the current
   hardcoded `M0 20 Q 20 0 40 20 T 60 20 T 80 20 100 20` path per-card.
   - Do this as a second async pass after the initial list render (render cards
     immediately with a flat placeholder line, then swap in real sparkline paths
     as each preview fetch resolves) so the page doesn't block on N extra requests
     before showing anything.
2. **Remove the duplicate Material Symbols `<link>` tag** in `<head>` — it's
   included twice currently, harmless but wasteful.
3. **Wire the floating "+" (add) button** — currently has no `onclick` at all.
   Point it at `live.html` (start a new recording).
4. **Optional / stretch, not core scope**: wire the `more_vert` button per card to
   a small menu with a "Delete" action → new `DELETE /api/delete_recording/<filename>`
   route (removes the `.emgz` file, its `.annotations.json` sidecar if present, and
   its `history.json` entry). Flagging this so it's not forgotten, but it's not
   required for the core ask (date/time/duration + open-in-playback already work).
5. Play button behavior (`onclick="window.location.href='playback.html?file=...'"`)
   is already correct — no change needed there.

---

## 6. `playback.html` — full rebuild

This is the bulk of the work. Replace **both** existing `<script>` blocks (the
tiny play/pause icon-toggle stub, and the static waveform-draw-once script) with
one consolidated script covering everything below.

### 6.1 State variables (new)
```
let signal, envelope        // Int16Array, decoded once from /api/recording/<file>
let sampleRate              // from /api/recording_meta, e.g. 500
let totalSamples            // signal.length
let currentSampleIndex = 0  // the playhead — single source of truth for "now"
let isPlaying = false       // start paused (safer default than mockup's "playing")
let playbackSpeed = 1.0     // 0.5 | 1.0 | 2.0, set by speed buttons
let windowSeconds = 1.0     // total visible width of the chart, driven by zoom controls (matches the existing ±500ms axis labels as the 1.0 default)
let annotations = []        // loaded from /api/annotations/<file>
let lastFrameTime = null    // for rAF delta-time accounting
```

### 6.2 Data loading (`loadRecording()`)
1. Read `?file=` query param (existing logic, keep).
2. `fetch('/api/recording_meta/' + encodeURIComponent(filename))` → populate
   `sampleRate`, and immediately paint the "SAMPLING RATE" and "TOTAL DURATION"
   stat boxes (currently hardcoded `1000 Hz` / `00:15:30` — must reflect real
   fetched values, not mockup placeholders).
3. `fetch('/api/recording/' + encodeURIComponent(filename))` → `arrayBuffer()` →
   `Int16Array` → de-interleave into `signal[]` / `envelope[]` (existing
   de-interleave loop, keep as-is).
4. `fetch('/api/annotations/' + encodeURIComponent(filename))` → `annotations`,
   call `renderAnnotationList()`.
5. Call `drawWindow()` once to paint the initial (paused, at index 0) frame.

### 6.3 Rendering — `drawWindow()`
Replaces the old whole-file `drawWaveform()`. Behavior: fixed playhead line stays
visually centered (the mockup already has this — the absolute-positioned
`left-1/2` vertical divider *is* the playhead marker), and the waveform scrolls
underneath it, exactly matching the existing "-500ms / T=0 (CURRENT) / +500ms"
axis labels.

1. `windowSamples = windowSeconds * sampleRate`.
2. `startIdx = currentSampleIndex - windowSamples/2`, `endIdx = currentSampleIndex + windowSamples/2` (clamp both to `[0, totalSamples]`).
3. Slice `signal` (and `envelope`) between `startIdx`/`endIdx`.
4. Draw exactly like the existing canvas logic (grid lines, then signal in
   `#00ffc2`, then envelope in `#ffb4ab`) — same drawing code as today's
   `drawWaveform()`, just fed a slice instead of the full array, and `x` mapped so
   that `currentSampleIndex` always lands at the canvas horizontal center.
5. Update the "CURRENT TIMESTAMP" stat box every call:
   `formatTimestamp(currentSampleIndex / sampleRate)` (reuse/port the
   `formatDuration`-style HH:MM:SS.mmm formatter already written for
   `history.html`, extended with milliseconds since the mockup shows
   `00:02:14.452`).

### 6.4 Playback loop — `tick(now)` driven by `requestAnimationFrame`
1. If `!isPlaying`, just `requestAnimationFrame(tick)` and return (no advance).
2. `deltaMs = now - lastFrameTime` (guard first-frame `lastFrameTime == null`).
3. `samplesAdvanced = (deltaMs / 1000) * sampleRate * playbackSpeed`.
4. `currentSampleIndex += samplesAdvanced`.
5. If `currentSampleIndex >= totalSamples - 1`: clamp to end, set `isPlaying = false`, flip the play/pause icon back to "play" and drop the `pulse-active` class (reached end of recording).
6. `drawWindow()`.
7. Update annotation-list highlight (throttled — only re-run the "which annotation
   is CURRENT" check every ~10 frames, not every single tick, to avoid needless
   DOM churn) — see 6.6.
8. `requestAnimationFrame(tick)`.

### 6.5 Transport control wiring
- **Play/pause button** (`.relative.w-24.h-24`): toggle `isPlaying`; swap icon
  `pause` ↔ `play_arrow` (existing logic, keep); toggle `pulse-active` class
  (existing logic, keep); if starting playback from a paused state, reset
  `lastFrameTime = null` so the first delta isn't huge.
- **`replay_10` button**: `currentSampleIndex = max(0, currentSampleIndex - 10*sampleRate)`; `drawWindow()` immediately even if paused.
- **`forward_10` button**: `currentSampleIndex = min(totalSamples-1, currentSampleIndex + 10*sampleRate)`; `drawWindow()` immediately.
- **Speed buttons (0.5x / 1.0x / 2.0x)**: on click, set `playbackSpeed` to the
  matching value; toggle the active-highlight class (`bg-primary-container/20
  text-primary-fixed-dim`) onto the clicked button and off the other two (matches
  existing static styling, just needs to become dynamic).
- **Zoom in/out buttons**: `windowSeconds` shrinks/grows (e.g. ×0.5 / ×2 per click,
  clamp between something like 0.1s and 5s to match the "100ms…1000ms" slider
  labels already in the mockup); update the "TIME SCALE" progress-bar fill width
  to reflect the new value; `drawWindow()`.
- **Seek/scrub (NEW — not in the current mockup markup, needs a new draggable
  element)**: add a thin horizontal seek bar below the chart, full-width,
  `0..totalSamples` mapped to its width. `mousedown`/`touchstart` → start drag;
  `mousemove`/`touchmove` while dragging → compute `currentSampleIndex` from
  pointer X position, pause playback while dragging, `drawWindow()` on every move;
  `mouseup`/`touchend` → end drag (leave paused, user can hit play again). This is
  what makes "rewind/forward" actually mean scrubbing, not just fixed ±10s jumps.

### 6.6 Annotations panel — `renderAnnotationList()`
1. Sort `annotations` by `time_seconds` ascending.
2. Rebuild the list container's `innerHTML` from the array (replacing the 4
   hardcoded `<div>`s in the current markup) — same visual structure per row
   (timestamp span, optional edit-pencil icon, label text).
3. Whichever annotation has `time_seconds` closest to
   `currentSampleIndex / sampleRate` (within some small tolerance, e.g. the
   current window width) gets the "CURRENT" pill + highlighted background classes
   (`bg-primary-container/5 border-l-2 border-primary-fixed-dim`) that the mockup
   already has hardcoded on one static row — this needs to move to whichever row
   is actually current, dynamically.
4. **Row click** → `currentSampleIndex = row.time_seconds * sampleRate`, pause
   playback, `drawWindow()`, re-render list (to move the highlight).
5. **Edit-pencil click** (only visible on row hover per existing `group-hover`
   CSS) → inline-edit the label text (swap the `<p>` for an `<input>` briefly, or
   simplest: `window.prompt()` pre-filled with current label) →
   `PUT /api/annotations/<file>/<id>` with the new label → update local array +
   re-render.
6. **"ADD MARKER" button** → capture `currentSampleIndex / sampleRate` as
   `time_seconds`, prompt for a label (`window.prompt('Annotation label:')` is
   fine for v1 — a nicer inline text box is a pure polish upgrade, not required),
   `POST /api/annotations/<file>` with `{time_seconds, label}`, append returned
   entry to local `annotations`, re-render list.

### 6.7 Cleanup of existing mockup script cruft
- Delete the leftover empty `svg.addEventListener('mousemove', ...)` stub (does
  nothing today) — either remove it, or turn it into a real hover-tooltip showing
  amplitude at the hovered X position (nice-to-have, not required).
- Delete the hardcoded "SOURCE FILE" fallback text `Subject_A42_Session1.csv` —
  already gets overwritten by the existing `filename || 'unknown.bin'` line, just
  noting the placeholder should never actually be visible once this ships.
- The static annotation `<div>`s (`Initial Contraction Start`, `Peak Amplitude
  Threshold`, `Relaxation Phase`, `Artifact Detection - Motion`) get deleted from
  the HTML entirely — they're fully replaced by `renderAnnotationList()`'s dynamic
  output at page load.

---

## 7. Backward Compatibility / Migration Notes

- **Old `.bin` files + old history entries** (recorded before this change, no
  `sample_rate`/`num_samples` fields, no header bytes): `/api/recording` already
  branches on magic-bytes presence (Section 2.4) so old files still serve fine
  unchanged. `/api/recording_meta` and `/api/preview` should default to
  `sample_rate=500` and derive `num_samples = size // 4` when those fields are
  missing from a history entry, so nothing 404s or crashes on mixed old/new
  history.
- No history.json schema migration script is strictly required — the fallback
  defaults above make old and new entries co-exist safely without a one-time batch
  rewrite. (A rewrite script is easy to add later if ever wanted — not needed for
  this feature to work.)

---

## 8. Full Endpoint Reference (post-change)

| Method | Path | Status | Notes |
|---|---|---|---|
| POST | `/api/start_capture` (or renamed `/api/start_recording`) | rewritten | starts writing to temp file, doesn't touch serial thread |
| POST | `/api/stop_capture` (or renamed `/api/stop_recording`) | rewritten | compresses, logs history, returns `filename` |
| GET | `/api/status` | rewritten | `serial_connected` + `recording_active` split out |
| GET | `/api/stream` | unchanged | SSE, still fed by the always-on serial thread |
| GET | `/api/list_recordings` | unchanged | already correct |
| GET | `/api/recording/<filename>` | rewritten | transparent gzip-decompress, legacy-`.bin` fallback |
| GET | `/api/recording_meta/<filename>` | **new** | fast metadata for playback header |
| GET | `/api/preview/<filename>` | **new** | decimated points for history.html sparklines |
| GET | `/api/annotations/<filename>` | **new** | |
| POST | `/api/annotations/<filename>` | **new** | |
| PUT | `/api/annotations/<filename>/<id>` | **new** | |
| DELETE | `/api/annotations/<filename>/<id>` | **new** | |
| POST | `/api/save_history` | unchanged | still available if ever needed manually |
| POST | `/api/snapshot` | **deleted** | dead legacy path |
| DELETE | `/api/delete_recording/<filename>` | *optional/stretch* | pairs with history.html `more_vert` menu |

---

## 9. Recommended Build Order

1. `app.py` Section 1 (serial/recording decoupling) — nothing else works right
   until recordings actually get logged.
2. `app.py` Section 2 (storage format + compress/decompress + meta/preview routes).
3. `app.py` Section 3 (annotations CRUD).
4. `live.html` Section 4 (Start/Stop Recording button + status field rename) —
   now recordings will actually start appearing in history.
5. `history.html` Section 5 (real sparklines, add-button wiring, dedupe head tag).
6. `playback.html` Section 6 (full playback engine — biggest single chunk, do last
   since it depends on `recording_meta`/`preview`/`annotations` endpoints all
   already existing).

---

## 10. Manual Test Checklist (post-implementation)

- [ ] Boot server → `/api/status` shows `serial_connected: true`, `recording_active: false`.
- [ ] `live.html` shows live scrolling signal with no recording active.
- [ ] Click Record → badge pulses, `/api/status.recording_active` → `true`.
- [ ] Click Stop → new `.emgz` file appears on disk, `history.json` gains an entry
      with `sample_rate`, `num_samples`, `duration`, correct `size` (compressed).
- [ ] Live view keeps streaming uninterrupted through a full start/stop recording cycle.
- [ ] `history.html` shows the new entry with correct date/time/duration and a real
      (non-placeholder) sparkline.
- [ ] Click play icon on that entry → lands on `playback.html?file=...` with correct filename shown.
- [ ] `playback.html` shows correct sample rate + total duration immediately (before full payload loads).
- [ ] Play button actually advances the playhead and scrolls the waveform.
- [ ] Pause stops advancing; replay_10/forward_10 jump correctly and update the timestamp.
- [ ] Speed buttons change actual playback rate (time real-world seconds vs. displayed timestamp advance).
- [ ] Zoom in/out changes visible window width.
- [ ] Seek bar drag jumps the playhead and redraws.
- [ ] Add Marker creates an annotation at the exact current playhead time, appears in the list, persists across page reload.
- [ ] Clicking an annotation row seeks + pauses + highlights it as CURRENT.
- [ ] Editing an annotation's label persists across reload.
- [ ] Opening a recording made *before* this change (old `.bin`, no header) still plays back without crashing (legacy fallback path).

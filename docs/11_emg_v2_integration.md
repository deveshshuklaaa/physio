# EMG v2 integration — discoveries and recommendation

**Written 2026-09-10.** Covers `/home/billa-dakait/Desktop/Major_iot` (the live
EMG project) against this repo's `emg-service/`, `backend/`, `frontend/`, and
`MASTER_BUILD_PLAN_v3.md`.

Everything below was read from the actual files. Where something was not
verified it is marked UNVERIFIED and says so.

---

## 0. The headline

`final_project/emg-service/` is **not** the EMG project. It is a July snapshot
of it, copied by Phase A2, with no git link back to the original (`emg-service/.git`
does not exist; the copy is tracked as ordinary files in this repo). The real
project lives at `Major_iot`, is its own git repo (one commit, `502421c`, plus
uncommitted work), and has moved a long way since the copy was taken.

The consequence is not "the vendored copy is stale". It is:

> **The EMG integration this repo has built and marked DONE/VERIFIED does not
> work against the current EMG service.** `GET /api/live-value` — the single
> route `backend/app/services/emg_client.py` polls and `session_ws.py`'s H3
> relay depends on — **does not exist in `Major_iot`**. Confirmed by grep across
> `backend/`, `website/` and every `.md`: zero occurrences.

`docs/PROJECT-STATUS.md` lists Phase C as "DONE, VERIFIED — gate fully closed".
That was true against the July snapshot. It is false against the live service.
So is `docs/02_emg_routes.md` in its entirety.

---

## 1. What changed between the two

| | `emg-service/` (vendored, July) | `Major_iot` (live, Sept) |
|---|---|---|
| Transport | USB serial, in-process reader thread | **WiFi UDP** `0.0.0.0:8888`, ASCII CSV lines, ~20 samples/datagram, ~25 datagrams/s |
| Board | Arduino Nano (per `CLAUDE.md`) | **ESP32-S3**, RGB status LED, 6-state LED machine |
| Channels | `signal, envelop` | **`signal, envelop, ax, ay, az, gx, gy, gz`** |
| Link | none | **HELLO/ACK handshake**, 2 s retry, 5 s staleness, server-side keepalive |
| Calibration | none | MPU6050 calibration at boot + on-demand `POST /api/recalibrate` → `RECAL` over UDP |
| Recording format | `.bin`, raw `<hh>` pairs | **`.csv.gz`**, 8 int columns, `#`-prefixed self-describing preamble |
| Post-session analysis | none (standalone matplotlib CLI) | **`analysis.py`**, contraction detection, metrics written into the file preamble |
| Annotations | none | full CRUD, sidecar `<name>.annotations.json` |
| Routes | 11 | 18 |
| Live value route | `GET /api/live-value` | **gone** |
| Stop route | `POST /api/stop_capture` | renamed `POST /api/stop_recording` |
| `/api/snapshot` | present | deleted |

Route-level breakage for this repo's client, precisely:

- `get_live_emg_reading()` → `GET /api/live-value` → **404**. Three consecutive
  404s trip the breaker (`HTTPStatusError` is caught as a failure), and the live
  EMG chart is dead for the rest of the session. It fails safe — the session
  survives, per C6's design — but it fails.
- `get_emg_status()` → `GET /api/status` → **still 200**, but the payload changed
  completely. Old: `{"capture_running", "error"}`. New: `{"udp_active",
  "last_packet_seconds_ago", "recording_active", "server_ip", "queue_drops",
  "calibration", "calibration_seq", "calibrating"}`. Nothing in this repo reads
  `capture_running`, so this degrades silently rather than erroring — which is
  worse, not better.
- `get_emg_history()` → `GET /api/list_recordings` → **still works**, and the
  entries are now much richer (see §3).

---

## 2. The finding that reshapes Phase M

`Major_iot/backend/app.py:221`:

```python
CSV_HEADER = 'signal,envelop,ax,ay,az,gx,gy,gz'
```

**The MPU6050 is already on the ESP32, in the same UDP packet, on the same 500 Hz
clock as the EMG.** Firmware reads the IMU every 10th sample and repeats the held
value on the intervening lines (`sketch_jun22a.ino`); calibration offsets are
captured per session and written into the recording's preamble.

Phase M was written assuming EMG and IMU are separate sources. Re-reading M1–M9
against this hardware:

- **M2 (time synchronization) largely dissolves.** The plan's stated risk was
  "fast movement produces fake disagreement from clock skew alone" between two
  sensor streams. There is one stream. EMG↔IMU skew is structurally zero. What
  remains is **pose↔device** sync, which is still a genuine unsolved problem and
  still needs a shared session epoch — but it is one alignment problem, not two.
- **M3 (`imu_client.py`, own task, own breaker) should not be built.** A second
  async task polling the same Flask process for data that arrives in the same
  packet is pure ceremony. One client, one breaker, one payload carrying both.
- **M3a is where this genuinely costs something, and it must be said out loud.**
  The plan wanted "three sensors, three independent failure domains". This
  hardware gives **two**: pose, and (EMG + IMU together). If the ESP32 loses
  WiFi, browns out, or its battery sags, EMG and IMU die in the same instant.
  M9's occlusion fallback ("the IMU is unaffected by occlusion and can carry the
  angle estimate") still holds — occlusion is a camera failure, not a device
  failure — but the plan's implied redundancy is one device short. Do not paper
  over this by calling it a simplification.
- **M1 (calibration protocol) is half-built already.** `mpuCalibrate()` averages
  200 resting samples, zeroes the gyro, keeps gravity on accel Z
  (`az_off = mean_az - 16384`), and flags `cal_shaky` when the accel spread is
  too wide. That is the *device* calibration. The plan's M1 is the *pose↔IMU
  transform*, which is a different thing and still entirely unbuilt. Both are
  needed; do not let the first be mistaken for the second.
  Note the known limit recorded in `WORK_DONE_2026-09-09.md`: calibration assumes
  the board is still and Z-up at boot, which is invalid on a moving forearm.
  `cal_shaky` surfaces it rather than hiding it. Good, but it means a
  session-start calibration ritual is mandatory, not optional.
- **M7 (per-rep EMG validity gate) has its primitive already.**
  `analysis.py:find_contractions()` is a hysteresis burst detector over the
  rectified envelope — onset at `baseline + 0.20*span`, offset at
  `baseline + 0.10*span`, sub-100 ms bursts dropped, sub-100 ms gaps merged.
  `analyze()` returns per-burst `start_s/end_s/duration_s/rms/peak` plus
  inter-burst latencies. That is exactly the "a rep with no muscle activation is
  not a real rep" gate, minus the join onto pose reps.
  It computes **no MVC%, no fatigue index, no median frequency**, and is explicit
  that units are raw ADC counts, not mV. Any clinical claim beyond "muscle was
  or was not active" is not supported by what exists.

---

## 3. Data contracts worth pinning down now

**Recording** — `.csv.gz`, real head:

```
# emg v3  sample_rate=500  started=2026-09-09T13:55:06.203632
# cal_ax=1538 cal_ay=-60 cal_az=-412 cal_gx=-187 cal_gy=13 cal_gz=56
# cal_mpu_ok=1 cal_shaky=0
signal,envelop,ax,ay,az,gx,gy,gz
29,46,3146,-1136,15624,58,33,9
```

Newer files also carry `# metrics {...}`. Read with `pandas.read_csv(path, comment='#')`.
Self-describing on purpose — nothing downstream infers a stride.

**`history.json`** — flat array; a current entry:

```json
{
  "filename": "emg_20260909_164511.csv.gz",
  "timestamp": "2026-09-09T16:45:11.580052",
  "size": 214698,
  "duration": 96.8,
  "sample_rate": 500,
  "num_samples": 48380,
  "calibration": {"ax": -8891, "ay": -3061, "az": -3105,
                  "gx": -180, "gy": 47, "gz": 62,
                  "mpu_ok": true, "shaky": false},
  "metrics": {"rms": 53.65, "peak": 654, "contraction_count": 37,
              "contractions": [...], "latencies_s": [...],
              "mean_latency_s": 2.029, "units": "adc_counts"}
}
```

Every field after `timestamp` is optional (`POST /api/save_history` writes only
the first two), so consumers must tolerate minimal entries. The dual-timestamp
mess flagged in `docs/02_emg_routes.md` C4 is gone — everything current is ISO
8601 — but old entries in the file still use the compact form.

**Annotations** — `<name>.annotations.json`, flat array of
`{"id": "<uuid4hex>", "time_seconds": <float>, "label": "<str>"}`.

**Wire format** — one UDP datagram holds up to 20 newline-separated ASCII lines,
each 8 comma-separated decimal ints. **No sequence numbers, no gap detection.**
Ordering relies on UDP's non-guarantees. `EMG_WiFi_Migration_Plan.md` names this
trade-off and neither WORK_DONE doc claims it was addressed. For a live chart
this is fine. For a recording that a clinical claim rests on, silent sample loss
with no way to detect it is a real gap. `queue_drops` in `/api/status` counts
*local queue overflow only*, not network loss.

---

## 4. Five landmines

**4.1 The SSE stream is single-consumer, and it consumes.**
`Major_iot/backend/app.py:115-126` says so in a docstring:

> `data_queue` is a single shared queue, so with two browser tabs open each
> sample goes to only one of them (not fanned out per-client).

`event_stream()` does `data_queue.get()` — a **destructive** read. If this repo's
backend subscribes to `/api/stream` while the operator has `live.html` open, the
two split the sample stream between them and **both charts show half the data,
with no error anywhere.** This rules out the otherwise-obvious "just consume the
SSE feed" integration. It is the single most important constraint in this
document.

**4.2 Under Docker, the ESP32 cannot reach the service.**
`docker-compose.yml`'s `emg-service` declares no `ports:` at all (deliberately —
G2-A3 wanted it internal-only, reached at `http://emg-service:5000`). That was
correct when EMG arrived over a USB serial cable. It is now fatal: the device
sends UDP to port 8888 over WiFi, and nothing publishes 8888. `emg-service/Dockerfile`
only `EXPOSE 5000`. The service will start, look healthy, and receive nothing
forever. `/api/status` will report `udp_active: false` and the watchdog will
print advice about firewalls to a log nobody reads.

**4.3 Recording is a process-wide singleton.**
`recording_active` is a module-level `threading.Event`; `current_temp_fh`,
`capture_filename`, `capture_num_samples` are module globals.
`POST /api/start_capture` returns `400 {'error': 'Recording already active'}` if
one is running. **One recording at a time, per process.** Plan §K4 requires three
concurrent sessions without cross-session interference. These are incompatible.
There is also exactly one physical device, so this is not purely a software
limit — but the software makes it a hard 400 rather than a graceful degrade.

**4.4 Nothing ties an EMG recording to a session.**
`history.json` is keyed by filename and wall-clock timestamp. This repo's session
document is keyed by `sessionId`. There is no join key. `MASTER_BUILD_PLAN_v3.md`
M-REC.1e explicitly wants "EMG captured into the **same `session_id`** as pose",
calling it the thing that permanently closes §9's "no paired pose+EMG training
data exists". Nothing in either codebase does this today, and every recording
made before it is built is unpairable after the fact.

**4.5 The Flask service is unauthenticated and trusts its network.**
This repo's backend verifies JWTs (`backend/app/auth.py`, `session_ws.py` closes
4401/4403 on a bad first frame). `Major_iot`'s Flask has no auth, no CORS config,
binds `0.0.0.0:5000` on the dev server, and accepts UDP from any source that can
reach 8888 — a spoofed datagram is indistinguishable from the device. Keeping it
behind the compose network with only the UDP port published is the right posture;
publishing 5000 to the host or the LAN is not. Note also that the recorded EMG is
patient biometric data and `docs/PROJECT-STATUS.md` §3 already records one
near-miss committing biometrics to git — `Major_iot`'s repo root currently holds
~20 recordings and a `gitkeys.txt`.

---

## 5. Recommendation

### 5.1 Stop copying the project

The July copy drifted silently for two months and invalidated a phase this repo
had marked VERIFIED. Copying again just restarts that clock.

Make `Major_iot` a git submodule at `emg-service/`. It is already its own repo,
compose already builds from that directory, and the pinned commit makes drift a
visible diff instead of a silent divergence. Everything else (subtree, a sync
script, a vendoring checklist) is more machinery for a worse guarantee.

Before that: `Major_iot` has uncommitted work in `backend/app.py`, `analysis.py`,
`history.json`, `website/history.html`, `website/playback.html`. Commit it first
or the submodule pins a commit that does not contain the features described here.

### 5.2 Restore live EMG with a non-consuming route

Add one route to Flask. Not the old `/api/live-value` verbatim — that one read
from `data_queue`, which under §4.1 would steal samples from the operator's own
live page. Instead keep a last-sample global written by the UDP handler and read
without consuming:

```python
# in EMGUDPHandler.handle(), where each parsed 8-field row is produced:
latest_sample = {'signal': vals[0], 'envelop': vals[1],
                 'ax': vals[2], 'ay': vals[3], 'az': vals[4],
                 'gx': vals[5], 'gy': vals[6], 'gz': vals[7],
                 'timestamp': time.time()}

@app.route('/api/live-value')
def live_value():
    s = latest_sample
    if s is None or time.time() - s['timestamp'] > 2:
        return jsonify({'signal': None, 'envelop': None, 'timestamp': None}), 204
    return jsonify(s)
```

A dict rebind is atomic under the GIL, so no lock is needed and the reader can
never see a half-written sample. Cost: ~10 lines in Flask, zero change to
`emg_client.py`'s call, zero change to the breaker, zero change to H3's relay.
The 204-on-stale branch matches what `get_live_emg_reading()` already treats as
"no data" rather than as a failure, so a powered-down device does not trip the
breaker — which is the correct distinction and the current client already draws
it.

This carries the IMU fields for free, in the same payload, at no extra cost —
which is what makes M3 unnecessary rather than merely inconvenient.

Then widen `session_ws.py`'s relay message to forward them:

```json
{"type": "emg", "signal": .., "envelop": .., "ax": .., "ay": .., "az": ..,
 "gx": .., "gy": .., "gz": .., "timestamp": ..}
```

`handleServerMessage` already re-dispatches every server message as a
`session:server-message` CustomEvent, so the frontend needs no orchestrator
change to receive this.

3.3 Hz (`EMG_POLL_INTERVAL_S = 0.3`) stays right for a chart. It is emphatically
**not** enough for M5's live EMG↔pose cross-check on fast movement, and it is
nowhere near enough to record from — recording stays in Flask, at 500 Hz, where
it already works.

### 5.3 Fix compose

```yaml
emg-service:
  build:
    context: ./emg-service
  ports:
    - "8888:8888/udp"   # the ESP32 sends here over WiFi; without this, nothing arrives
```

HTTP stays internal. Add `EXPOSE 8888/udp` to the Dockerfile for documentation
value. The container also needs the host's LAN-reachable IP to match the
firmware's `HOST_IP` — under Docker's default bridge the published UDP port
handles this, but it is worth an explicit end-to-end check with the real board
rather than assuming, because `/api/status.server_ip` will report the
*container's* IP and mislead whoever is debugging.

Flask's dev server also stays as-is for now; a single-operator capture rig does
not need gunicorn, and the UDP threads are what actually matter. Worth a note in
the compose file so the ceiling is visible rather than discovered.

### 5.4 Give recordings a session id

The smallest thing that closes §4.4: accept an optional `session_id` on
`POST /api/start_capture`, store it in the `history.json` entry and in the
`.csv.gz` preamble (`# session_id=...`). Then `POST /session/end` can call
`get_emg_history()`, find the entry for that session, and record the filename on
the session document.

Add it to `ClinicalBlock` — the schema docstring is emphatic that sensitive data
never gets flattened out of that subtree, and EMG is biometric:

```
clinical.emg = {
  "filename": "emg_20260909_164511.csv.gz",
  "sampleRate": 500,
  "numSamples": 48380,
  "calibration": {...},
  "metrics": {...}          # analysis.py output, copied at session end
}
```

Store the **metrics**, not the samples. 48k rows per 90 s session does not belong
in a Mongo document, and the `.csv.gz` is already durable, self-describing, and
addressable by filename.

Do this **before the recording day**, not after. §9 of the plan and
`M-REC.1e` both say retrofitting is impossible, and they are right: a recording
made without a session id cannot be paired with its pose data afterwards by
anything better than guessing from timestamps.

### 5.5 J6 — lift the chart, do not write one

`live.html`'s renderer is a hand-rolled `<canvas>` polyline in roughly 50 lines
(`live.html:262-308, 558-577`): an 800-sample FIFO buffer, a running-peak scale
with 0.9 headroom, index-based x, `requestAnimationFrame` draw, DPR-aware
resize. No library, no dependency, no build step. J6 says "do not rewrite working
chart code" and it is right.

Two things make this drop straight into `#emg-chart`:

- The live frontend (`frontend/src/`) is deliberately vanilla, no build step, and
  no charting library exists anywhere in this repo's live trees. A hand-rolled
  canvas is not a compromise here, it is the only option that does not add a
  toolchain.
- **Both projects use the same design system.** `Major_iot/design/design_system.md`
  and this repo's shell are both "Clinical Kinetic" — same `#00ffc2` signal
  green, same Inter + JetBrains Mono split, same dark `#0d1518` ground. The trace
  will look native in the mini-card with no restyling.

The only real change: the source becomes the `session:server-message` CustomEvent
at ~3.3 Hz instead of an `EventSource` at 500 Hz, so the buffer should be sized
in seconds-of-history rather than kept at 800 samples (800 samples at 3.3 Hz is
four minutes of chart). Also delete the hardcoded `84%` in
`live_session.html:120` — it is mockup residue and currently reads as live data.

### 5.6 Do not port `playback.html` and `history.html`

They are good, they work, and they serve an operator reviewing captures — which
is a different job from a clinician reading a session report. Reimplementing
their canvas playback, seek bar, annotation CRUD and sparkline thumbnails inside
this repo's React tree buys nothing. Serve them where they are; if they need to
be reachable through the single nginx origin, add a location block rather than a
rewrite.

`GET /api/preview/<filename>?points=N` is already a server-side downsampled
sparkline endpoint. If a session report wants a thumbnail of its EMG trace, that
route already produces one and nothing needs building.

---

## 6. What this does to the plan's phase list

| Phase | Was | Now |
|---|---|---|
| C | DONE, VERIFIED | **Reopened.** C1/C3/C4 docs describe a service that no longer exists; C5's route is gone; C7's end-to-end never covered the live service |
| H3 | DONE, VERIFIED | Relay logic is sound and untouched; only the payload widens (§5.2) |
| J6 | not started | Unblocked and cheap — lift `live.html`'s canvas (§5.5) |
| K1/K2 | DONE, VERIFIED | **Reopened** — no UDP port published (§4.2); K3's "EMG reachable" check passed over HTTP only and would still pass with zero samples flowing |
| K4 | not started | **Blocked** by the single-recording global (§4.3) |
| M1 | not started | Device calibration exists; pose↔IMU transform does not. Different problems |
| M2 | not started | EMG↔IMU sync solved by hardware; pose↔device sync still open |
| M3 | not started | **Do not build.** One client carries both (§2) |
| M3a | not started | **Revise.** Two failure domains, not three (§2) |
| M7 | not started | Detector exists in `analysis.py`; the join onto pose reps does not |

---

## 7. Suggested order

1. Commit `Major_iot`'s outstanding work; make it a submodule at `emg-service/`.
2. Add the non-consuming `/api/live-value` (§5.2). Widen the relay payload.
3. Publish UDP 8888 in compose (§5.3). Re-run the K3 gate **with the board
   powered on** and assert a non-null sample, not merely a 200.
4. Rewrite `docs/02_emg_routes.md` against the live service, or delete it — it is
   actively misleading in its current form.
5. Session id on capture (§5.4) — **before any recording session**, since it
   cannot be retrofitted.
6. J6 chart (§5.5).
7. Then Phase M, against the revised M-list in §6.

Steps 1–4 restore what this repo already believes it has. Nothing after step 4 is
new capability until then.

---

## 8. Unverified

- No hardware was attached during this review. Every claim about the live path
  is read from code, `WORK_DONE_2026-09-09.md`, and recorded data files — not
  observed on a running board.
- `WORK_DONE_2026-09-09.md` states the board was still running 09-08 firmware and
  that **the MPU6050 has never been confirmed present on real hardware**. Every
  IMU claim in §2 is therefore a claim about code and file contents, not about a
  sensor known to work. Confirm this before any Phase M work is scheduled.
- `Major_iot/test_capture.py` is stale — it builds 2-field pre-IMU lines that the
  current handler drops (`len(parts) != 8`). It would fail if run. Not fixed here.
- Reading a pre-IMU `.bin` through the current 16-byte-stride fallback would
  silently misparse it (old files are 4-byte stride, headerless). Flagged in the
  backend audit, not fixed. Affects only the legacy files in `Major_iot`'s root.

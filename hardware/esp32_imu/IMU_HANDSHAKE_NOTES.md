# IMU + Handshake + WiFi Robustness — implementation notes

## 0. Corrections from the hardware owner (applied after first draft)

Three things in the first draft were wrong; all three are fixed in the current `.ino`:

1. **TX power.** First draft raised `WiFi.setTxPower()` from `WIFI_POWER_8_5dBm` to
   `WIFI_POWER_19_5dBm`, reasoning it was a brownout workaround. **That reasoning was
   wrong for this hardware.** The owner reports these ESP32-C3 SuperMini clones have poor
   antenna matching and an onboard regulator that sags under the TX current spike -
   raising TX power destabilizes the link rather than fixing anything. Reverted to
   `WIFI_POWER_8_5dBm` exactly as it originally was, with a corrected comment stating this
   is a hardware constraint, not a workaround, and must not be "fixed" again without the
   owner testing it on real hardware. Also documented: the AP must be WPA2-PSK (not a
   WPA2/WPA3 transition-mode SSID) and 2.4GHz - a C3 association constraint.
2. **Single IMU, no synthesized knee angle.** First draft's IMU output (`ax,ay,az,gx,gy,gz,pitch,roll`)
   implied a general-purpose orientation sensor and never named which physical thing
   `pitch` measured. There was never a second sensor proposed, but the ambiguity itself
   was the problem: nothing stopped a downstream reader from treating `pitch` as "the knee
   angle." Fixed by (a) explicitly documenting single-sensor, shank-mounted, no second
   MPU6050 ever, (b) replacing the plain gravity-only pitch with a complementary filter
   (`shank_pitch_deg`, `ALPHA`/`COMP_FILTER_ALPHA` = 0.98 at 100Hz) that also emits the raw
   calibrated sagittal gyro rate (`sagittal_gyro_dps`) so the host doesn't need to
   re-differentiate a filtered angle, (c) renaming the field to `shank_pitch_deg` (segment-
   scoped, never `knee_angle`), and (d) adding an explicit comment on the two valid
   interpretations (thigh-fixed exercises vs. thigh-from-camera minus shank-from-IMU).
3. Everything else from the original build (WiFi bounded-connect/backoff/watchdog,
   handshake state machine, packet tagging/sequencing, LED patterns) is unchanged.

## 1. Files created or changed

| File | Change |
|---|---|
| `sketch_jun22a/sketch_jun22a.ino` | Rewritten: bounded WiFi connect + non-blocking backoff reconnect, WiFi event handler, hardware watchdog (`esp_task_wdt`), TX power kept at `WIFI_POWER_8_5dBm` (hardware constraint, see §5 correction below), single shank-mounted MPU6050 driver + session-start calibration + NVS persistence, complementary-filter `shank_pitch_deg` output (segment angle, not a knee angle), three-way handshake client (HELLO/OFFER/ACK/STOP/HEARTBEAT/CAL on UDP 8889), tagged/sequenced EMG+IMU data packets on UDP 8888, non-blocking LED pattern driver. |
| `sketch_jun22a/sketch_jun22a.ino.bak_pre_handshake` | Backup of the pre-change firmware (created before first edit, per constraints). |
| `backend/app.py` | Added: control-port (8889) UDP handler + `control_reader()` thread implementing the server side of the handshake state machine (idle→armed→streaming→idle), `session_watchdog()` (heartbeat timeout → idle), `/api/arm` and `/api/disarm` POST routes, `/api/status` extended with additive session fields. `EMGUDPHandler` (data port 8888) now parses a 13-byte header per datagram (type/session_id/seq/esp-micros), rejects packets unless `session_state == 'streaming'` and the session id matches, tracks per-type sequence gaps into `packets_lost`, and routes IMU lines to a separate `imu_queue` instead of `data_queue`. EMG payload bytes after the header are unchanged, so the website/recording path needed no changes. |
| `backend/app.py.bak_pre_handshake` | Backup of the pre-change backend (created before first edit). |
| `test_handshake.py` (new, repo root) | Runnable loopback test — imports the real `backend/app.py`, starts its actual UDP threads, and drives a fake-ESP UDP client through the full state machine. Plain asserts, no framework, same shape as `test_udp_listener.py`. |

`website/live.html` was **not** touched — the EMG line format it parses off `/api/stream` (`signal,envelop`) is unchanged, and it only reads `recording_active` from `/api/status`, which is still present. IMU data currently has no UI consumer; it's queued server-side (`imu_queue`) for a future page to read.

## 2. LED signal table (GPIO8, active LOW) — the only diagnostic surface

| Pattern | Meaning |
|---|---|
| Fast toggle (~150ms) | WiFi connecting or reconnecting (link down, retrying with backoff) |
| 3 short blinks, once | WiFi just connected |
| Slow single blink every 2s | WiFi up, discovering — broadcasting HELLO, no server armed/OFFER yet |
| Double blink every 2s | Reserved/idle-armed-but-not-streaming state (protocol symmetry; current flow goes straight from ACK to streaming so this mostly won't be seen — see §6 limitations) |
| Fast 2Hz toggle | STREAMING — connected, handshake complete, sending EMG (+ IMU if calibrated) |
| Triple-blink burst, repeating (~700ms cycle) | Calibrating IMU at session start (~2s window) |
| 5 rapid blinks, repeating every 3s | Calibration FAILED (moved during window, or IMU not responding) — also reported to server via `CAL,<sid>,FAIL,<reason>` |
| Long 2s blink ×4 then reboot | Unrecoverable WiFi failure (down >10 min) — watchdog-triggered `ESP.restart()` |
| LED never lights | Board not powered, or crashed before `setup()` finished |

## 3. Wiring table

**Single MPU6050 only — mounted on the shank (below the knee).** There is no second sensor, none is planned, and AD0 is tied to GND for the one address in use (not wired for a second 0x69 device). Pin choices were **not physically verified** — no hardware was available to flash/test during this change. Re-check against the real board silkscreen before wiring.

| Signal | ESP32-C3 pin | Notes |
|---|---|---|
| EMG analog in | GPIO3 (ADC1_CH3) | unchanged, must stay on ADC1 (ADC2 unusable with WiFi active) |
| Onboard LED | GPIO8, active LOW | unchanged |
| MPU6050 VCC | 3V3 | |
| MPU6050 GND | GND | |
| MPU6050 SCL | GPIO5 | `I2C_SCL_PIN` |
| MPU6050 SDA | GPIO4 | `I2C_SDA_PIN` |
| MPU6050 AD0 | GND | selects I2C address 0x68 - the only address this firmware talks to |
| MPU6050 INT | not connected | unused |
| MPU6050 mounting | shank, below the knee | sensor's own X axis assumed in the sagittal (flexion/extension) plane; if the physical mounting is rotated, change the `SAGITTAL_GYRO_AXIS` `#define` in the sketch rather than the code |
| Push button, pin 1 | GPIO6 | `BUTTON_PIN`, `INPUT_PULLUP`, other leg to GND. Wired but **not currently read anywhere in the sketch** — reserved for a future manual-arm/manual-cal trigger; flagging so it isn't mistaken for "wired and working." |

Pins 0, 1, 2, 9 were deliberately avoided: 2/8/9 are ESP32-C3 boot-strapping pins (loading them at reset can prevent boot/flashing); 3 and 8 are already used above.

### 3a. `shank_pitch_deg` — what it is and is not

The IMU emits a **segment** angle, never a joint angle:

- `shank_pitch_deg`: sagittal-plane pitch of the shank, from a complementary filter (`ALPHA` = `COMP_FILTER_ALPHA` = 0.98 at `IMU_RATE_HZ` = 100Hz) blending gyro integration with the accelerometer's gravity-derived pitch, reported **relative to the session-start calibration pose** (the pose absorbs the sensor's mounting offset on the shank).
- `sagittal_gyro_dps`: the bias-corrected raw gyro rate on the same sagittal axis, emitted separately so the host can derive angular velocity/tempo/jerk without re-differentiating the filtered angle.
- `roll_deg`: raw gravity-derived roll (not filtered) - a mounting/quality indicator only, not a measured joint angle.
- **No knee angle is computed on the firmware.** Knee flexion is the angle between thigh and shank; one shank sensor measures one segment, and synthesizing a "knee angle" from it would be a fabricated number - exactly the false-confidence failure this project's cross-check exists to catch. Two valid downstream interpretations, both documented in the `.ino` at the point `shank_pitch_deg` is computed:
  - (a) when the thigh is fixed (seated knee extension, TKE, isometric quads): `shank_pitch_deg` **is** the knee angle.
  - (b) otherwise: the host computes knee flexion as `thigh_angle_from_camera - shank_pitch_deg` - that comparison is the actual point of having this sensor.

## 4. Loopback test — verbatim output

```
$ venv/bin/python test_handshake.py
UDP listener on 0.0.0.0:8888 (ESP32 HOST_IP should be 192.168.31.147)
Control (handshake) listener on 0.0.0.0:8889
[ok] data before ACK rejected
[ok] idle -> armed (session_id=1)
[ok] data while armed-but-not-ACKed still rejected
[ok] HELLO -> OFFER,1
[ok] ACK -> streaming
[ok] streaming data accepted, gap detected: packets_lost={1: 1, 2: 0}
[ok] IMU/EMG streams kept separate
[ok] HEARTBEAT -> HEARTBEAT_ACK
[ok] disarm -> STOP -> idle
[watchdog] Receiving data OK.
[ok] missed-heartbeat watchdog drops streaming -> idle

ALL HANDSHAKE TESTS PASSED
```

Covers: idle→armed→streaming→STOP→idle, data-before-ACK rejection, sequence-gap detection, EMG/IMU stream separation, and the heartbeat-timeout watchdog dropping a stale session back to idle. Runs against the actual `backend/app.py` module (imported, real threads, real sockets on loopback) — not a reimplementation of the protocol. Use `venv/bin/python` (or `source venv/bin/activate` first) - the bare system `python3` on this machine doesn't have `jinja2` installed, which Flask needs. This test doesn't touch the firmware, so its output is identical before/after the IMU-field and TX-power corrections below.

## 5. Compile-check status

**Not compiled.** `arduino-cli` is not installed on this machine. The classic Arduino IDE (`arduino` binary, v1.8.19) with an ESP32 core (3.3.11) *is* installed, but `arduino --verify --board esp32:esp32:esp32c3 ...` hung with no output and had to be killed — it appears to want a display/X server and no `xvfb` is available in this sandbox. No hardware was available either. So: **the firmware was reviewed only by reading**, not built. Things worth double-checking on a real toolchain before flashing:
- `esp_task_wdt_config_t` / `esp_task_wdt_init(&config)` — this struct-based API matches Arduino-ESP32 core 3.x (installed core here is 3.3.11); if the target board is pinned to an older 2.x core, this call signature is different (`esp_task_wdt_init(uint32_t timeout_s, bool panic)`).
- Designated initializer syntax (`{.timeout_ms = ..., ...}`) — standard GNU C++ extension, used throughout ESP-IDF examples, should be fine with the ESP32 toolchain's default flags, but not verified here.
- `htonl`/`ntohl` — pulled in transitively via `WiFi.h` → lwIP; not verified to compile standalone in this sketch.

## 6. What could not be done / unverified without hardware

- No physical device in the loop at any point — WiFi reconnect timing, LED patterns, I2C bus behavior, calibration variance thresholds, and battery/current-draw claims are all **design-reviewed, not measured**.
- `CAL_GYRO_VAR_THRESHOLD` and `CAL_ACCEL_VAR_THRESHOLD` in the firmware are explicitly marked **PLACEHOLDER** — no real MPU6050 was available to characterize actual noise floor / "stationary" variance. Tune these once a board is on the bench; if they're too tight the device will spuriously fail calibration, too loose and it'll accept a device that moved.
- Shank mounting orientation (which physical axis is "sagittal") is assumed for `SAGITTAL_GYRO_AXIS` and for the sign in the `pitch_acc` formula — not specified anywhere in the source material, had to be assumed. Re-verify against the real enclosure/strap orientation and adjust the `#define` (see §3a) rather than the code.
- The `COMP_FILTER_ALPHA = 0.98` value is a standard starting point for a 100Hz complementary filter, not tuned against this specific sensor's real noise characteristics — expect to adjust it once on the bench (higher = smoother but slower to correct accel-drift, lower = noisier but tracks faster movement better).
- I2C pin choice (GPIO4/GPIO5) and button pin (GPIO6) are picked to avoid known conflicts (ADC1/LED/boot-strapping pins) but not confirmed against a real ESP32-C3 Super Mini board revision's silkscreen/pinout — different clone batches have shuffled a pin or two before.
- `esp_task_wdt` watchdog timeout (15s) and the "unrecoverable WiFi down" reboot threshold (10 min) are judgment calls, not measured against real reconnect latency on the owner's actual AP.
- ponytail-tagged shortcut: on a mid-session ESP reboot (e.g. brownout), the firmware reuses whatever calibration is in NVS rather than re-validating it belongs to the *same* server session — see the comment above `calibrateAtSessionStart()` in the `.ino` for the upgrade path (persist session_id alongside the calibration and compare) if this ever matters in practice.
- The "double blink" LED pattern (`LED_STOPPED_ARMED`) is defined but not currently reachable in the implemented flow (ACK goes straight to streaming) — left in for protocol symmetry / future use rather than deleted, since it's cheap and documents intent; flagging so it isn't mistaken for a live, tested code path.
- Session epoch mapping: the server records `session_epoch_host_ts = time.time()` at the moment it processes the ACK, together with `session_epoch_esp_micros` (the ESP's `micros()` value carried in that same ACK). To convert a later ESP `micros()` timestamp `t` (as carried in a data-packet header, which wraps at ~71 minutes since it's a uint32) back to host wall-clock time:
  `host_ts ≈ session_epoch_host_ts + (t - session_epoch_esp_micros) / 1e6`
  (accounting for uint32 wraparound in `t - session_epoch_esp_micros` if the session runs long). This mapping is exposed via `/api/status` (`session_epoch_host_ts`, `session_epoch_esp_micros`) but not yet consumed by any alignment code — that's a follow-up once IMU data has a real consumer.

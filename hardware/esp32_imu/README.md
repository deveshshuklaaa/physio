# ESP32-C3 IMU + EMG sensor node — STAGED, NOT INTEGRATED

Copied here 2026-09-03 from a separate project (`~/Desktop/Major_iot`) at the
owner's instruction. **Nothing in this directory is wired into the Rehab
Assessment Engine.** No backend route imports it, no frontend calls it, no
phase depends on it. It is staged here so further work happens in this repo
instead of the other one; the IoT project has been reverted to its pre-change
state.

Phase M (§5, MASTER_BUILD_PLAN_v3.md) is where this eventually lands. It is
not started, and this code has not been reviewed against M1–M9.

## Contents

| Path | What it is |
|---|---|
| `firmware/sketch_jun22a.ino` | ESP32-C3 SuperMini firmware: EMG (BioAmp Candy, 500 Hz) + MPU6050 IMU (100 Hz), WiFi/UDP, three-way handshake, watchdog, calibration |
| `backend/emg_imu_app.py` | The **other** project's Flask app, extended with the handshake control listener. Renamed from `app.py` so it can never be confused with `emg-service/backend/app.py`, which is this repo's real EMG service and is untouched |
| `tests/test_handshake.py` | Loopback test of the handshake state machine, driving the real server code over UDP |
| `IMU_HANDSHAKE_NOTES.md` | Implementing agent's notes: LED table, wiring, limitations |

## Running the test

Needs Flask, which this repo's venv does not have (it is a FastAPI project):

```
/home/billa-dakait/Desktop/Major_iot/venv/bin/python tests/test_handshake.py
```

Verified passing from this location, 2026-09-03, 11 assertions.

Do not run it while a real server holds UDP 8888/8889 — it binds those ports.

## State

Built and verified by loopback test:

- Bounded WiFi connect + event-driven backoff reconnect (the original spun
  forever on a missing AP, and never noticed a mid-session drop)
- `esp_task_wdt` watchdog with a reboot path after 10 minutes of link-down
- Three-way handshake (HELLO / OFFER / ACK / STOP / HEARTBEAT / CAL) on
  **control port 8889**, separate from data port 8888 — handshake text on the
  data port would land in `data_queue` and corrupt the live chart and any
  recording
- Per-packet sequence numbers + ESP `micros()` timestamps, so loss is
  detectable and samples can be aligned to a session epoch
- Single shank-mounted MPU6050: complementary-filter sagittal pitch
  (`shank_pitch_deg`, α = 0.98), bias-corrected `sagittal_gyro_dps`, `roll_deg`
  as a mounting-quality indicator. Yaw deliberately omitted — 6-axis part, no
  magnetometer, unbounded drift
- Session-start calibration with a stillness/variance check, persisted to NVS.
  Failure is reported, never silently replaced with zero offsets

**Half-finished — the reason this was staged mid-task.** A startup countdown
(link → calibrate → ready → streaming) was in progress when the work was
stopped. `backend/emg_imu_app.py` carries only its constants and globals
(`LINK_PHASE_S`, `CALIBRATE_PHASE_S`, `READY_PHASE_S`, `PHASE_ORDER`,
`phase`, `phase_start_ts`) — **no state machine reads them yet**, and the
firmware side was never touched. The file parses and the existing tests pass,
so this is dead configuration, not a broken build.

## Known gaps

- **Firmware has never been compiled.** No `arduino-cli` on this machine.
  Reviewed by reading only. Two flagged risks: the `esp_task_wdt` API differs
  between ESP32 core 2.x and 3.x, and designated initializers.
- **Nothing streams until something POSTs `/api/arm`.** The other project's
  `live.html` has no arm button.
- **Bench-tuning placeholders**, all marked in the source:
  `CAL_GYRO_VAR_THRESHOLD`, `CAL_ACCEL_VAR_THRESHOLD`, `SAGITTAL_GYRO_AXIS`,
  and the GPIO 4/5/6 pin choices (chosen to avoid ADC1 and the C3 strapping
  pins, but not checked against a real board's silkscreen).
- **WiFi credentials are in the firmware in plain text**, as they were in the
  original. Do not publish this directory.
- `WIFI_POWER_8_5dBm` is a hardware constraint of the C3 SuperMini, not a
  tunable — the owner reports instability at anything higher. The AP must be
  WPA2-PSK (not WPA2/WPA3 transition mode) and 2.4 GHz.

## What one shank IMU can and cannot measure

Knee flexion is the angle *between* thigh and shank. One sensor measures one
segment, so a knee angle from it alone would be a fabrication. Per exercise:

| Exercise | Single shank IMU gives |
|---|---|
| `seated_knee_extension` | Exact knee angle — thigh fixed by the chair |
| `straight_leg_raise` | Exact leg-raise angle — supine, torso fixed, leg rigid |
| `terminal_knee_extension` | Approximate — thigh near-fixed, error grows with hip movement |
| `heel_slide`, `mini_squat`, `squat` | Segment angle only; knee flexion needs the camera's thigh angle minus this |

All six additionally get angular velocity, tempo, jerk and rep boundaries, plus
an independent check on the camera's monocular `_3d` estimates — which is the
reason §M wants an IMU at all.

#!/usr/bin/env python3
"""Phase 14 tests for analysis.py: summarize().

    ../venv/bin/python test_phase14.py

Same style as test_phase12.py: check/check_eq, no framework.
"""

import math
import sys

import analysis
from analysis import summarize, MV_PER_COUNT, GYRO_LSB_PER_DPS

CHECKS = 0
FAILURES = 0
CURRENT = ""


def check(cond, msg):
    global CHECKS, FAILURES
    CHECKS += 1
    if not cond:
        FAILURES += 1
        print(f"  FAIL [{CURRENT}] {msg}")


def check_eq(actual, expected, msg):
    global CHECKS, FAILURES
    CHECKS += 1
    if actual != expected:
        FAILURES += 1
        print(f"  FAIL [{CURRENT}] {msg}\n         expected: {expected!r}\n         actual:   {actual!r}")


def check_close(actual, expected, msg, tol=0.01):
    global CHECKS, FAILURES
    CHECKS += 1
    if actual is None or abs(actual - expected) > tol:
        FAILURES += 1
        print(f"  FAIL [{CURRENT}] {msg}\n         expected ~{expected!r}\n         actual:   {actual!r}")


SR = 500


def make_rows(num_bursts, imu=None):
    """num_bursts 0.2s bursts of amplitude 800, separated by 0.3s quiet gaps
    on a quiet baseline of amplitude 5, each burst 1 amp higher rms than the
    last so fatigue index has something declining/rising to measure."""
    rows = []
    total_s = num_bursts * 0.5 + 0.5
    n = int(total_s * SR)
    burst_windows = []
    t0 = 0.3
    for b in range(num_bursts):
        burst_windows.append((t0, t0 + 0.2))
        t0 += 0.5
    ax = ay = az = gx = gy = gz = 0
    if imu:
        ax, ay, az, gx, gy, gz = imu
    for i in range(n):
        t = i / SR
        in_burst = any(s <= t < e for s, e in burst_windows)
        amp = 800 if in_burst else 5
        s = amp if i % 2 else -amp
        rows.append([s, abs(s), ax, ay, az, gx, gy, gz])
    return rows


def main():
    global CURRENT
    print("PHASE 14: analysis.summarize()")

    CURRENT = "SUMMARY_VERSION is exported"
    check_eq(analysis.SUMMARY_VERSION, 2, "version constant")

    CURRENT = "count 2 -> rate/latency None, but other fields present"
    rows = make_rows(2)
    s = summarize(rows, SR)
    check_eq(s['contraction_count'], 2, "contraction_count")
    check(s['rate_per_min'] is None, "rate_per_min None below MIN_BURSTS_RATE")
    check(s['mean_latency_s'] is None, "mean_latency_s None below MIN_BURSTS_RATE")
    check(s['peak_latency_s'] is None, "peak_latency_s None below MIN_BURSTS_RATE")
    check(s['strength_mv'] is not None, "strength_mv computed even with few bursts")
    check_eq(s['num_samples'], len(rows), "num_samples")
    check_close(s['duration_s'], len(rows) / SR, "duration_s is sample-based")

    CURRENT = "count 3 -> rate/latency present"
    rows3 = make_rows(3)
    s3 = summarize(rows3, SR)
    check_eq(s3['contraction_count'], 3, "contraction_count")
    check(s3['rate_per_min'] is not None, "rate_per_min present at MIN_BURSTS_RATE")
    expected_rate = 3 / ((len(rows3) / SR) / 60)
    check_close(s3['rate_per_min'], expected_rate, "rate_per_min value")
    check(s3['mean_latency_s'] is not None, "mean_latency_s present")
    check(s3['peak_latency_s'] is not None, "peak_latency_s present")
    check_close(s3['peak_latency_s'], max(analysis.analyze(rows3, SR)['latencies_s']),
                "peak_latency_s = max(latencies_s)")

    CURRENT = "count 5 -> fatigue None, count 6 -> fatigue present"
    rows5 = make_rows(5)
    s5 = summarize(rows5, SR)
    check(s5['fatigue_index'] is None, "fatigue_index None below MIN_BURSTS_FATIGUE")

    rows6 = make_rows(6)
    s6 = summarize(rows6, SR)
    check(s6['fatigue_index'] is not None, "fatigue_index present at MIN_BURSTS_FATIGUE")

    CURRENT = "declining burst rms -> fatigue_index < 1"
    # Build rows where later bursts are weaker than earlier ones.
    rows_decl = []
    t0 = 0.3
    windows = []
    for b in range(6):
        windows.append((t0, t0 + 0.2))
        t0 += 0.5
    n = int((6 * 0.5 + 0.5) * SR)
    amps = [800, 800, 700, 500, 300, 200]  # roughly declining per burst
    for i in range(n):
        t = i / SR
        amp = 5
        for (ws, we), a in zip(windows, amps):
            if ws <= t < we:
                amp = a
                break
        s_val = amp if i % 2 else -amp
        rows_decl.append([s_val, abs(s_val), 0, 0, 0, 0, 0, 0])
    s_decl = summarize(rows_decl, SR)
    check(s_decl['fatigue_index'] is not None, "fatigue_index computed")
    check(s_decl['fatigue_index'] < 1, f"declining bursts must give fatigue_index < 1, got {s_decl['fatigue_index']}")

    CURRENT = "mV factor applied to peak/rms/strength"
    m = analysis.analyze(rows6, SR)
    check_close(s6['peak_mv'], m['peak'] * MV_PER_COUNT, "peak_mv")
    check_close(s6['rms_mv'], m['rms'] * MV_PER_COUNT, "rms_mv")
    expected_strength = (sum(c['rms'] for c in m['contractions']) / len(m['contractions'])) * MV_PER_COUNT
    check_close(s6['strength_mv'], expected_strength, "strength_mv")

    CURRENT = "shaky/None calibration -> imu.valid False, IMU fields None"
    s_no_cal = summarize(rows6, SR, calibration=None)
    check(s_no_cal['shaky'] is None, "shaky None with no calibration")
    check_eq(s_no_cal['imu']['valid'], False, "imu.valid False with no calibration")
    for k in ('tilt_min_deg', 'tilt_max_deg', 'rom_deg', 'gyro_burst_dps', 'gyro_rest_dps'):
        check(s_no_cal['imu'][k] is None, f"imu.{k} None when invalid")

    s_shaky = summarize(rows6, SR, calibration={'mpu_ok': True, 'shaky': True})
    check_eq(s_shaky['shaky'], True, "shaky reported from calibration")
    check_eq(s_shaky['imu']['valid'], False, "imu.valid False when shaky")

    s_mpu_bad = summarize(rows6, SR, calibration={'mpu_ok': False, 'shaky': False})
    check_eq(s_mpu_bad['imu']['valid'], False, "imu.valid False when mpu_ok is False")

    CURRENT = "tilt at rest pose ~= 0deg"
    rows_rest = make_rows(6, imu=(0, 0, 16384, 0, 0, 0))
    s_rest = summarize(rows_rest, SR, calibration={'mpu_ok': True, 'shaky': False})
    check_eq(s_rest['imu']['valid'], True, "imu valid for rest pose test")
    check_close(s_rest['imu']['tilt_min_deg'], 0.0, "tilt_min_deg at rest", tol=0.5)
    check_close(s_rest['imu']['tilt_max_deg'], 0.0, "tilt_max_deg at rest", tol=0.5)
    check_close(s_rest['imu']['rom_deg'], 0.0, "rom_deg at rest", tol=0.5)

    CURRENT = "90deg rotation -> tilt ~= 90deg"
    rows_90 = make_rows(6, imu=(16384, 0, 0, 0, 0, 0))
    s_90 = summarize(rows_90, SR, calibration={'mpu_ok': True, 'shaky': False})
    check_close(s_90['imu']['tilt_max_deg'], 90.0, "tilt at 90deg rotation", tol=0.5)

    CURRENT = "glitch IMU spikes don't blow up tilt_max_deg / rom_deg (R11)"
    # ~1% of samples are a 160deg glitch spike (held for 10 samples, as the
    # firmware only refreshes IMU every 10th sample); the rest sit near 10deg.
    rows_glitch = make_rows(6, imu=(0, 0, 16384, 0, 0, 0))
    # az=16384 (~1g) with ax=ay=0 gives ~0deg tilt; nudge most rows to ~10deg
    # and inject a 160deg burst on axis X for 1% of samples.
    n = len(rows_glitch)
    tan10 = math.tan(math.radians(10))
    for i, r in enumerate(rows_glitch):
        r[2] = int(16384 * tan10)  # ax -> ~10deg tilt baseline
        r[4] = 16384
    spike_count = max(1, n // 100)
    tan160 = math.tan(math.radians(160))
    for i in range(0, spike_count * 10, 10):
        if i < n:
            rows_glitch[i][2] = int(16384 * tan160)
    s_glitch = summarize(rows_glitch, SR, calibration={'mpu_ok': True, 'shaky': False})
    check(s_glitch['imu']['tilt_max_deg'] < 30,
          f"tilt_max_deg must reject the glitch spike, got {s_glitch['imu']['tilt_max_deg']}")
    check(s_glitch['imu']['rom_deg'] < 30,
          f"rom_deg must stay small despite the spike, got {s_glitch['imu']['rom_deg']}")

    CURRENT = "gyro 65.5 LSB -> 1.0 deg/s"
    rows_gyro = make_rows(6, imu=(0, 0, 16384, 65.5, 0, 0))
    s_gyro = summarize(rows_gyro, SR, calibration={'mpu_ok': True, 'shaky': False})
    check_close(s_gyro['imu']['gyro_burst_dps'], 1.0, "gyro_burst_dps")
    check_close(s_gyro['imu']['gyro_rest_dps'], 1.0, "gyro_rest_dps")

    CURRENT = "analyze() output is unchanged by summarize existing"
    plain = analysis.analyze(rows6, SR)
    check('units' in plain and plain['units'] == 'adc_counts', "analyze() still returns raw units")

    CURRENT = "analysis._demo() still runs"
    try:
        analysis._demo()
        demo_ok = True
    except Exception as e:
        demo_ok = False
        print(f"         raised: {type(e).__name__}: {e}")
    check(demo_ok, "_demo() must not raise")

    print()
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

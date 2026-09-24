"""Post-session EMG analysis.

Runs once, after a recording stops, before the .csv.gz is written -- the
results ride along in the file's '#' preamble so a recording is always
self-describing and playback never has to recompute them.

Units are raw ADC counts, exactly as the firmware sends them: this file
deliberately does not invent a mV scale factor that nothing has measured.
"""

import json
import math

# Contraction detection knobs. These are physical-world tuning values, not
# constants -- an electrode change or a different muscle will want them moved.
ONSET_FRAC = 0.20    # threshold above baseline, as a fraction of the envelope's range
OFFSET_FRAC = 0.10   # hysteresis: drop below this to end a contraction
MIN_DURATION_S = 0.10
MIN_GAP_S = 0.10     # shorter gaps merge into one contraction

# summarize() constants -- see progress-dashboard-plan.md §3.1/§4.1.
MV_PER_COUNT = 2900 / 4095          # ESP32-S3 ADC_11db, 12-bit, uncalibrated
GYRO_LSB_PER_DPS = 65.5             # MPU6050 at +/-500 deg/s
MIN_BURSTS_RATE = 3                 # rate, mean/peak latency need at least this many bursts
MIN_BURSTS_FATIGUE = 6              # fatigue index needs at least this many bursts
SUMMARY_VERSION = 2                 # bump whenever summarize() output changes


def _median(values):
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    return float(s[n // 2]) if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2.0


def _rms(values):
    if not values:
        return 0.0
    return math.sqrt(sum(float(v) * v for v in values) / len(values))


def find_contractions(envelope, sample_rate):
    """Hysteresis threshold detector over the rectified envelope channel.

    Returns a list of (start_index, end_index_exclusive)."""
    if not envelope or sample_rate <= 0:
        return []
    baseline = _median([abs(v) for v in envelope])
    peak = max(abs(v) for v in envelope)
    span = peak - baseline
    if span <= 0:
        return []
    on_thr = baseline + ONSET_FRAC * span
    off_thr = baseline + OFFSET_FRAC * span

    bursts = []
    start = None
    for i, v in enumerate(envelope):
        a = abs(v)
        if start is None:
            if a >= on_thr:
                start = i
        elif a < off_thr:
            bursts.append((start, i))
            start = None
    if start is not None:
        bursts.append((start, len(envelope)))

    # Merge bursts separated by less than MIN_GAP_S -- a single contraction
    # dips below the off threshold constantly, and unmerged those read as
    # dozens of contractions with meaningless millisecond latencies.
    min_gap = int(MIN_GAP_S * sample_rate)
    merged = []
    for b in bursts:
        if merged and b[0] - merged[-1][1] < min_gap:
            merged[-1] = (merged[-1][0], b[1])
        else:
            merged.append(b)

    min_len = int(MIN_DURATION_S * sample_rate)
    return [b for b in merged if b[1] - b[0] >= min_len]


def analyze(rows, sample_rate):
    """rows: list of 8-int lists (signal, envelop, ax..gz). Returns the
    metrics dict that gets written into the recording's preamble."""
    signal = [r[0] for r in rows]
    envelope = [r[1] for r in rows]
    bursts = find_contractions(envelope, sample_rate)

    contractions = []
    for start, end in bursts:
        seg = signal[start:end]
        contractions.append({
            'start_s': round(start / sample_rate, 3),
            'end_s': round(end / sample_rate, 3),
            'duration_s': round((end - start) / sample_rate, 3),
            'rms': round(_rms(seg), 2),
            'peak': max((abs(v) for v in seg), default=0),
        })

    # Latency = quiet time between one contraction ending and the next starting.
    latencies = [round(contractions[i + 1]['start_s'] - contractions[i]['end_s'], 3)
                 for i in range(len(contractions) - 1)]

    return {
        'rms': round(_rms(signal), 2),
        'peak': max((abs(v) for v in signal), default=0),
        'contraction_count': len(contractions),
        'contractions': contractions,
        'latencies_s': latencies,
        'mean_latency_s': round(sum(latencies) / len(latencies), 3) if latencies else None,
        'units': 'adc_counts',
    }


def _round3(v):
    return None if v is None else round(v, 3)


def summarize(rows, sample_rate, metrics=None, calibration=None):
    """Per-recording dashboard summary. rows/sample_rate as in analyze();
    metrics reuses an already-computed analyze() result if the caller has one.
    calibration: dict with 'mpu_ok', 'shaky' (or None for legacy files)."""
    if metrics is None:
        metrics = analyze(rows, sample_rate)

    num_samples = len(rows)
    duration_s = num_samples / sample_rate if sample_rate else None

    contractions = metrics['contractions']
    count = metrics['contraction_count']
    latencies = metrics['latencies_s']

    peak_mv = metrics['peak'] * MV_PER_COUNT if metrics['peak'] is not None else None
    rms_mv = metrics['rms'] * MV_PER_COUNT if metrics['rms'] is not None else None
    if contractions:
        strength_mv = (sum(c['rms'] for c in contractions) / len(contractions)) * MV_PER_COUNT
    else:
        strength_mv = None

    if count >= MIN_BURSTS_RATE:
        rate_per_min = count / (duration_s / 60)
        mean_latency_s = metrics['mean_latency_s']
        peak_latency_s = max(latencies) if latencies else None
    else:
        rate_per_min = None
        mean_latency_s = None
        peak_latency_s = None

    fatigue_index = None
    if count >= MIN_BURSTS_FATIGUE:
        k = count // 3
        first_mean = sum(c['rms'] for c in contractions[:k]) / k
        last_mean = sum(c['rms'] for c in contractions[-k:]) / k
        fatigue_index = (last_mean / first_mean) if first_mean else None

    shaky = calibration['shaky'] if calibration is not None else None

    imu_valid = (calibration is not None and calibration['mpu_ok']
                 and not calibration['shaky'])
    tilt_min_deg = tilt_max_deg = rom_deg = None
    gyro_burst_dps = gyro_rest_dps = None
    if imu_valid:
        # Integer sample bounds per burst, computed once -- not a float
        # comparison per sample per burst.
        burst_ranges = [(int(c['start_s'] * sample_rate), int(c['end_s'] * sample_rate))
                         for c in contractions]

        def in_burst(i):
            return any(lo <= i < hi for lo, hi in burst_ranges)

        tilts = []
        gyro_burst = []
        gyro_rest = []
        for i, r in enumerate(rows):
            _, _, ax, ay, az, gx, gy, gz = r
            tilts.append(math.degrees(math.atan2(math.hypot(ax, ay), az)))
            gmag = math.hypot(gx, gy, gz) / GYRO_LSB_PER_DPS
            if in_burst(i):
                gyro_burst.append(gmag)
            else:
                gyro_rest.append(gmag)

        if tilts:
            # Percentiles, not raw min/max -- a couple of glitch IMU reads
            # (held for 10 samples each) can spike tilt to 150+deg and blow
            # up ROM with pure noise (R11).
            sorted_tilts = sorted(tilts)
            n = len(sorted_tilts)
            tilt_min_deg = sorted_tilts[min(n - 1, int(0.02 * n))]
            tilt_max_deg = sorted_tilts[min(n - 1, int(0.98 * n))]
            rom_deg = tilt_max_deg - tilt_min_deg
        gyro_burst_dps = sum(gyro_burst) / len(gyro_burst) if gyro_burst else None
        gyro_rest_dps = sum(gyro_rest) / len(gyro_rest) if gyro_rest else None

    return {
        'num_samples': num_samples,
        'duration_s': _round3(duration_s),
        'contraction_count': count,
        'peak_mv': _round3(peak_mv),
        'rms_mv': _round3(rms_mv),
        'strength_mv': _round3(strength_mv),
        'rate_per_min': _round3(rate_per_min),
        'mean_latency_s': _round3(mean_latency_s),
        'peak_latency_s': _round3(peak_latency_s),
        'fatigue_index': _round3(fatigue_index),
        'shaky': shaky,
        'imu': {
            'valid': imu_valid,
            'tilt_min_deg': _round3(tilt_min_deg),
            'tilt_max_deg': _round3(tilt_max_deg),
            'rom_deg': _round3(rom_deg),
            'gyro_burst_dps': _round3(gyro_burst_dps),
            'gyro_rest_dps': _round3(gyro_rest_dps),
        },
    }


def metrics_to_preamble(metrics):
    """One '#' line, JSON payload -- survives round-tripping without needing a
    parser per field the way the cal_* lines do."""
    return '# metrics ' + json.dumps(metrics, separators=(',', ':')) + '\n'


def _demo():
    sr = 500
    rows = []
    # Two 0.5s bursts with a 1.0s quiet gap between them, on a quiet baseline.
    for i in range(sr * 3):
        t = i / sr
        burst = (0.5 <= t < 1.0) or (2.0 <= t < 2.5)
        amp = 800 if burst else 5
        s = amp if i % 2 else -amp
        rows.append([s, abs(s), 0, 0, 0, 0, 0, 0])
    m = analyze(rows, sr)
    assert m['contraction_count'] == 2, m['contraction_count']
    assert m['peak'] == 800, m['peak']
    assert abs(m['mean_latency_s'] - 1.0) < 0.05, m['mean_latency_s']
    assert abs(m['rms'] - 800 * math.sqrt(1 / 3)) < 5, m['rms']  # 800 for 1/3 of the record
    # Empty and flat inputs must not raise -- an aborted capture hits this path.
    assert analyze([], sr)['contraction_count'] == 0
    assert analyze([[0] * 8] * 100, sr)['contraction_count'] == 0
    print('analysis self-check OK:', json.dumps(
        {k: v for k, v in m.items() if k != 'contractions'}))


if __name__ == '__main__':
    _demo()

#!/usr/bin/env python3
"""Phase 15 tests for app.py: GET /api/progress + progress_cache.json.

    ../venv/bin/python test_phase15.py

Every test redirects DATA_DIR to a temp directory; nothing here touches the
real recordings in the repo root.
"""

import gzip
import json
import os
import struct
import sys
import tempfile
import threading
import time

import app
import analysis

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


def reset_state(tmpdir):
    app.DATA_DIR = tmpdir
    app.HISTORY_FILE = os.path.join(tmpdir, 'history.json')
    app.save_history([])


def sample_rows(n, sample_rate=500):
    """A quiet ramp -- structurally valid rows, no attempt at a realistic
    burst shape (that's analysis.py's own test, not this endpoint's)."""
    rows = []
    for i in range(n):
        rows.append([i % 100, abs(i % 100), 0, 0, 16384, 1, 2, 3])
    return rows


def write_csv_gz(path, rows, sample_rate=500, cal=None):
    cal = cal or {'ax': 1, 'ay': 2, 'az': 3, 'gx': 4, 'gy': 5, 'gz': 6,
                  'mpu_ok': True, 'shaky': False}
    with gzip.open(path, 'wt') as f:
        f.write(f"# emg v4  sample_rate={sample_rate}  started=2026-01-01T00:00:00\n")
        f.write(f"# cal_ax={cal['ax']} cal_ay={cal['ay']} cal_az={cal['az']} "
                f"cal_gx={cal['gx']} cal_gy={cal['gy']} cal_gz={cal['gz']}\n")
        f.write(f"# cal_mpu_ok={int(cal['mpu_ok'])} cal_shaky={int(cal['shaky'])}\n")
        f.write(app.CSV_HEADER + '\n')
        for row in rows:
            f.write(','.join(str(v) for v in row) + '\n')


def write_emg_legacy(path, rows, sample_rate=500):
    payload = b''.join(struct.pack('<8h', *row) for row in rows)
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sHH', b'EMG2', 1, sample_rate) + gzip.compress(payload))


def write_headerless_bin(path, rows):
    with open(path, 'wb') as f:
        for row in rows:
            f.write(struct.pack('<8h', *row))


def write_empty_emgz(path, sample_rate=500):
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sHH', b'EMG2', 1, sample_rate) + gzip.compress(b''))


def counting_wrapper(counter, orig, gate=None, release=None):
    def wrapper(*a, **kw):
        counter.append(1)
        if gate is not None:
            gate.set()
        if release is not None:
            release.wait(timeout=2)
        return orig(*a, **kw)
    return wrapper


def main():
    global CURRENT
    print("PHASE 15: GET /api/progress + progress_cache.json")
    app.app.config['TESTING'] = True
    client = app.app.test_client()
    orig_summarize = analysis.summarize

    with tempfile.TemporaryDirectory() as tmp:
        reset_state(tmp)

        rows_a = sample_rows(50)
        rows_b = sample_rows(20)
        rows_c = sample_rows(10)

        write_csv_gz(os.path.join(tmp, 'a.csv.gz'), rows_a)
        write_emg_legacy(os.path.join(tmp, 'b.emgz'), rows_b)
        write_headerless_bin(os.path.join(tmp, 'c.bin'), rows_c)
        write_empty_emgz(os.path.join(tmp, 'd_empty.emgz'))

        history = [
            {'filename': 'a.csv.gz', 'timestamp': '2026-09-09T16:00:00', 'sample_rate': 500},
            {'filename': 'missing.csv.gz', 'timestamp': '2026-09-09T02:00:00'},
            {'filename': 'b.emgz', 'timestamp': '2026-09-09T04:00:00'},
            {'filename': 'd_empty.emgz', 'timestamp': '2026-09-09T05:00:00'},
            {'filename': 'c.bin', 'timestamp': '2026-09-09T01:00:00'},
        ]
        app.save_history(history)

        CURRENT = "records/skipped are built correctly, sorted by timestamp"
        r = client.get('/api/progress')
        check_eq(r.status_code, 200, "endpoint always returns 200")
        body = r.get_json()
        check_eq(body['summary_version'], analysis.SUMMARY_VERSION, "summary_version echoes analysis.SUMMARY_VERSION")
        check_eq(body['units'], {'amplitude': 'mV', 'mv_per_count': round(analysis.MV_PER_COUNT, 4)}, "units block")

        names = [rec['filename'] for rec in body['records']]
        check_eq(names, ['c.bin', 'b.emgz', 'a.csv.gz'], "records sorted by timestamp ascending")
        for rec in body['records']:
            check('num_samples' in rec and 'duration_s' in rec, f"{rec['filename']} carries summarize() fields")

        reasons = {s['filename']: s['reason'] for s in body['skipped']}
        check_eq(reasons.get('missing.csv.gz'), 'missing', "a history filename with no file on disk is 'missing'")
        check_eq(reasons.get('d_empty.emgz'), 'empty', "a 0-sample recording is 'empty'")
        check_eq(len(body['skipped']), 2, "exactly the two bad entries are skipped")

        a_rec = next(rec for rec in body['records'] if rec['filename'] == 'a.csv.gz')
        check_eq(a_rec['num_samples'], 50, "num_samples for the csv.gz record")
        check_eq(a_rec['timestamp'], '2026-09-09T16:00:00', "the history timestamp rides along unchanged")

        CURRENT = "an unreadable file is skipped, not a 500"
        bad_path = os.path.join(tmp, 'bad.csv.gz')
        with open(bad_path, 'wb') as f:
            f.write(b'not actually gzip')
        app.save_history(history + [{'filename': 'bad.csv.gz', 'timestamp': '2026-09-09T06:00:00'}])
        r = client.get('/api/progress')
        check_eq(r.status_code, 200, "one bad file must never 500 the whole response")
        body = r.get_json()
        reasons = {s['filename']: s['reason'] for s in body['skipped']}
        check_eq(reasons.get('bad.csv.gz'), 'unreadable', "a decode failure is reported as 'unreadable'")
        app.save_history(history)  # drop bad.csv.gz again for the cache tests below

        # ------------------------------------------------------- caching

        CURRENT = "a second call is served from cache (summarize not re-run)"
        calls = []
        app.analysis.summarize = counting_wrapper(calls, orig_summarize)
        try:
            client.get('/api/progress')  # warms nothing new -- already cached above
            check_eq(len(calls), 0, "unchanged files must not re-run summarize()")

            CURRENT = "touching a file's mtime forces a recompute"
            path_a = os.path.join(tmp, 'a.csv.gz')
            future = time.time() + 5
            os.utime(path_a, (future, future))
            client.get('/api/progress')
            check(len(calls) >= 1, "a changed mtime must invalidate that file's cache entry")

            CURRENT = "bumping SUMMARY_VERSION invalidates the whole cache"
            calls.clear()
            real_version = analysis.SUMMARY_VERSION
            app.analysis.SUMMARY_VERSION = real_version + 1
            try:
                client.get('/api/progress')
                check_eq(len(calls), 3, "all three readable records must recompute after a version bump")
            finally:
                app.analysis.SUMMARY_VERSION = real_version
        finally:
            app.analysis.summarize = orig_summarize

        CURRENT = "a corrupt cache file is rebuilt, not fatal"
        cache_path = os.path.join(tmp, 'progress_cache.json')
        with open(cache_path, 'w') as f:
            f.write('{not valid json')
        r = client.get('/api/progress')
        check_eq(r.status_code, 200, "a corrupt cache must not break the endpoint")
        with open(cache_path) as f:
            rebuilt = json.load(f)
        check_eq(rebuilt.get('version'), analysis.SUMMARY_VERSION, "the cache is rebuilt with the current version")
        check_eq(len(rebuilt.get('entries', {})), 3, "all readable records are back in the rebuilt cache")

        # ------------------------------------------------- thread_lock

        CURRENT = "thread_lock is never held while summarising"
        future2 = time.time() + 100
        os.utime(path_a, (future2, future2))  # force a real summarize() call again
        entered = threading.Event()
        release = threading.Event()
        app.analysis.summarize = counting_wrapper([], orig_summarize, gate=entered, release=release)
        result = {}
        try:
            def run():
                result['response'] = client.get('/api/progress')
            t = threading.Thread(target=run)
            t.start()
            got_in = entered.wait(timeout=2)
            check(got_in, "the endpoint must actually reach summarize() during this test")
            acquired = app.thread_lock.acquire(timeout=1)
            check(acquired, "thread_lock must be free while summarize() is running (UDP ingest must not stall)")
            if acquired:
                app.thread_lock.release()
            release.set()
            t.join(timeout=5)
            check_eq(result.get('response').status_code, 200, "the concurrent request still completes cleanly")
        finally:
            app.analysis.summarize = orig_summarize
            release.set()

    print()
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

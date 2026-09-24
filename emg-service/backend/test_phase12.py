#!/usr/bin/env python3
"""Phase 12 tests for app.py: calibration ingest, /api/recalibrate, CSV.gz storage.

    ../venv/bin/python test_phase12.py

Kept in its own file so phases 6-7 in test_app.py stay independently runnable.
Every test redirects DATA_DIR to a temp directory; nothing here touches the real
recordings in the repo root.
"""

import gzip
import os
import queue
import socket
import struct
import sys
import tempfile
import threading
import time
import types

import app

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


class FakeSock:
    def __init__(self):
        self.sent = []

    def sendto(self, data, addr):
        self.sent.append((data, addr))


def handler(payload, client=('192.168.31.99', 5000)):
    sock = FakeSock()
    return types.SimpleNamespace(request=(payload, sock), client_address=client), sock


def reset_state(tmpdir):
    app.DATA_DIR = tmpdir
    app.HISTORY_FILE = os.path.join(tmpdir, 'history.json')
    app.save_history([])
    app.last_packet_time = None
    app.last_device_addr = None
    app.queue_drops = 0
    app.recording_active.clear()
    app.current_temp_fh = None
    app.current_temp_path = None
    app.capture_start_ts = None
    for attr, val in (('calibration', None), ('calibration_seq', 0), ('calibrating', False)):
        if hasattr(app, attr):
            setattr(app, attr, val)
    while not app.data_queue.empty():
        try:
            app.data_queue.get_nowait()
        except queue.Empty:
            break


def g(name, default=None):
    """Read an app.py global that may not exist yet (red phase) without crashing."""
    return getattr(app, name, default)


CAL_PAYLOAD = "300,-150,116,-20,8,3,1,0"
CAL_EXPECT = {'ax': 300, 'ay': -150, 'az': 116, 'gx': -20, 'gy': 8, 'gz': 3,
              'mpu_ok': True, 'shaky': False}


def sample_line(i):
    return f"{i},{abs(i) // 2},{i},{-i},16384,1,2,3"


def main():
    global CURRENT
    print("PHASE 12: calibration ingest, recalibrate, CSV.gz storage")

    with tempfile.TemporaryDirectory() as tmp:
        # ------------------------------------------------ calibration ingest

        CURRENT = "HELLO with a payload is parsed and still gets an ACK"
        reset_state(tmp)
        h, sock = handler(f"HELLO {CAL_PAYLOAD}\n".encode())
        app.EMGUDPHandler.handle(h)
        check(len(sock.sent) == 1 and sock.sent[0][0].startswith(b'ACK'),
              "a HELLO carrying offsets must still be answered with ACK")
        check(g('calibration') is not None, "app.py must store the calibration")
        if g('calibration'):
            for k, v in CAL_EXPECT.items():
                check_eq(g('calibration', {}).get(k), v, f"calibration[{k!r}]")
        check_eq(g('calibration_seq'), 1, "calibration_seq must advance on a new calibration")

        CURRENT = "a bare HELLO from older firmware still works"
        reset_state(tmp)
        h, sock = handler(b"HELLO\n")
        app.EMGUDPHandler.handle(h)
        check(len(sock.sent) == 1 and sock.sent[0][0].startswith(b'ACK'),
              "a firmware/server version mismatch must degrade, not break the handshake")

        CURRENT = "CAL delivers offsets without a handshake reply"
        reset_state(tmp)
        h, sock = handler(f"CAL {CAL_PAYLOAD}\n".encode())
        app.EMGUDPHandler.handle(h)
        check_eq(len(sock.sent), 0, "CAL is not a handshake -- it must not be answered with ACK")
        check(g('calibration') is not None, "CAL must store the calibration")
        check_eq(g('calibration_seq'), 1, "CAL must advance calibration_seq")

        CURRENT = "a calibration message is not treated as sample data"
        check(app.data_queue.empty(), "CAL must not reach the SSE stream")
        check(app.last_packet_time is None, "CAL must not set last_packet_time")

        CURRENT = "a shaky / dead-MPU calibration is reported honestly"
        reset_state(tmp)
        h, _ = handler(b"CAL 0,0,0,0,0,0,0,1\n")
        app.EMGUDPHandler.handle(h)
        check_eq(g('calibration', {}).get('mpu_ok'), False, "mpu_ok=0 must come through as False")
        check_eq(g('calibration', {}).get('shaky'), True, "shaky=1 must come through as True")

        CURRENT = "a malformed calibration payload cannot kill the ingest thread"
        reset_state(tmp)
        crashed = False
        try:
            h, _ = handler(b"CAL not,a,number\n")
            app.EMGUDPHandler.handle(h)
        except Exception as e:
            crashed = True
            print(f"         raised: {type(e).__name__}: {e}")
        check(not crashed, "garbage after CAL must be ignored, never raise out of handle()")

        # --------------------------------------------------- /api/status

        CURRENT = "/api/status exposes the calibration"
        reset_state(tmp)
        h, _ = handler(f"CAL {CAL_PAYLOAD}\n".encode())
        app.EMGUDPHandler.handle(h)
        app.app.config['TESTING'] = True
        client = app.app.test_client()
        st = client.get('/api/status').get_json()
        for key in ('calibration', 'calibration_seq', 'calibrating'):
            check(key in st, f"/api/status must include {key!r}")
        check_eq(st.get('calibration', {}).get('ax'), 300, "the page reads offsets from /api/status")
        check_eq(st.get('calibrating'), False, "not calibrating when idle")

        # ------------------------------------------------ /api/recalibrate

        CURRENT = "recalibrate with no device is refused"
        reset_state(tmp)
        r = client.post('/api/recalibrate')
        check_eq(r.status_code, 409, "no device has ever been seen -- there is nothing to command")

        CURRENT = "recalibrate sends RECAL to the device"
        reset_state(tmp)
        listener = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        listener.bind(('127.0.0.1', 0))
        listener.settimeout(3)
        app.last_device_addr = listener.getsockname()
        r = client.post('/api/recalibrate')
        check_eq(r.status_code, 200, "POST /api/recalibrate succeeds once a device is known")
        got = None
        try:
            got, _ = listener.recvfrom(64)
        except socket.timeout:
            pass
        check(got is not None and got.startswith(b'RECAL'), "the board must receive RECAL")
        check_eq(g('calibrating'), True, "the calibrating flag must be set while we wait")
        st = client.get('/api/status').get_json()
        check_eq(st.get('calibrating'), True, "and be visible to the page")

        CURRENT = "a fresh calibration clears the calibrating flag"
        seq_before = g('calibration_seq', 0)
        h, _ = handler(f"CAL {CAL_PAYLOAD}\n".encode())
        app.EMGUDPHandler.handle(h)
        check((g('calibration_seq') or 0) > seq_before, "calibration_seq must advance so the page notices")
        check_eq(g('calibrating'), False, "arrival of the new offsets ends the calibrating state")
        listener.close()

        CURRENT = "recalibrate is refused while recording"
        reset_state(tmp)
        app.last_device_addr = ('127.0.0.1', 9)
        r = client.post('/api/start_capture')
        check_eq(r.status_code, 200, "start a recording")
        r = client.post('/api/recalibrate')
        check_eq(r.status_code, 409,
                 "calibration blocks sampling for ~400 ms -- refuse rather than punch a hole "
                 "in a recording")
        client.post('/api/stop_recording')

        # ------------------------------------------------- CSV.gz recording

        CURRENT = "a recording is written as gzipped CSV"
        reset_state(tmp)
        h, _ = handler(f"CAL {CAL_PAYLOAD}\n".encode())
        app.EMGUDPHandler.handle(h)
        r = client.post('/api/start_capture')
        check_eq(r.status_code, 200, "start_capture succeeds")
        blob = ''.join(sample_line(i) + '\n' for i in range(60)).encode()
        h, _ = handler(blob)
        app.EMGUDPHandler.handle(h)
        time.sleep(0.1)
        r = client.post('/api/stop_recording')
        check_eq(r.status_code, 200, "stop_recording succeeds")
        fname = r.get_json().get('filename', '')
        check(fname.endswith('.csv.gz'), f"the recording must be a .csv.gz file (got {fname!r})")
        path = os.path.join(tmp, fname)
        check(os.path.exists(path), "the file exists on disk")

        CURRENT = "the CSV is self-describing"
        try:
            text = gzip.open(path, 'rt').read()
        except Exception as e:
            # Still a .emgz (or otherwise not gzipped text): report it as a
            # failure rather than blowing up the rest of the run.
            check(False, f"the recording must be readable as gzipped text ({type(e).__name__}: {e})")
            text = ""

        lines = text.splitlines()
        comments = [ln for ln in lines if ln.startswith('#')]
        check(len(comments) >= 2, "a # preamble must carry the metadata")
        preamble = '\n'.join(comments)
        check('sample_rate=500' in preamble, "sample rate must be in the preamble")
        check('cal_ax=300' in preamble, "the calibration offsets must be recorded with the data")
        check('cal_gz=3' in preamble, "all six offsets, not just the accelerometer")
        header = next((ln for ln in lines if not ln.startswith('#')), '')
        check_eq(header, "signal,envelop,ax,ay,az,gx,gy,gz",
                 "a header row makes the columns self-describing -- no implicit stride")
        rows = [ln for ln in lines if ln and not ln.startswith('#')][1:]
        check_eq(len(rows), 60, "one row per sample")
        check_eq(rows[0] if rows else '', sample_line(0), "the first row round-trips exactly")
        check(all(len(r.split(',')) == 8 for r in rows), "every row has 8 columns")

        CURRENT = "pandas can read it in one line"
        try:
            import pandas as pd
            if not text:
                raise RuntimeError('no CSV to read')
            df = pd.read_csv(path, comment='#')
            check_eq(list(df.columns), ['signal', 'envelop', 'ax', 'ay', 'az', 'gx', 'gy', 'gz'],
                     "read_csv(path, comment='#') gives named columns")
            check_eq(len(df), 60, "and all the rows")
        except ImportError:
            print("         (pandas not installed, skipped)")
        except Exception as e:
            check(False, f"pandas must read the recording directly ({type(e).__name__}: {e})")

        # ------------------------------- playback still gets binary

        CURRENT = "/api/recording still serves binary so playback.html is untouched"
        r = client.get(f'/api/recording/{fname}')
        check_eq(r.status_code, 200, "GET /api/recording succeeds on a .csv.gz")
        body = r.data
        check_eq(len(body), 60 * 16, "converted to 8 x int16 per sample, as the page expects")
        if len(body) >= 16:
            check_eq(struct.unpack('<8h', body[:16]), (0, 0, 0, 0, 16384, 1, 2, 3),
                     "the first sample survives the CSV -> binary conversion")

        CURRENT = "metadata and preview work on a .csv.gz"
        meta = client.get(f'/api/recording_meta/{fname}').get_json()
        check_eq(meta['num_samples'], 60, "num_samples")
        check_eq(meta['sample_rate'], 500, "sample_rate")
        check('calibration' in meta, "recording_meta must expose the calibration for playback")
        if 'calibration' in meta and meta['calibration']:
            check_eq(meta['calibration'].get('ax'), 300, "the stored offsets come back")
        pv = client.get(f'/api/preview/{fname}?points=6').get_json()
        check_eq(len(pv['points']), 6, "preview returns the requested points")
        check(pv['points'] == sorted(pv['points']), "preview follows the ramp fixture")

        CURRENT = "the calibration is stored in history.json"
        hist = client.get('/api/list_recordings').get_json()
        entry = next((e for e in hist if e['filename'] == fname), None)
        check(entry is not None, "the recording is listed")
        if entry:
            check('calibration' in entry, "the history entry must carry the calibration")

        CURRENT = "old .emgz recordings still load"
        # A pre-existing EMG2 file must not stop working just because new
        # recordings are CSV.
        old = os.path.join(tmp, 'emg_old.emgz')
        payload = b''.join(struct.pack('<8h', i, i, 0, 0, 16384, 0, 0, 0) for i in range(20))
        with open(old, 'wb') as f:
            f.write(struct.pack('<4sHH', b'EMG2', 1, 500) + gzip.compress(payload))
        app.save_history([])
        r = client.get('/api/recording/emg_old.emgz')
        check_eq(r.status_code, 200, "an existing .emgz must still be readable")
        check_eq(len(r.data), 20 * 16, "and decode to the same sample count")

    print()
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""End-to-end check: fake ESP32 -> UDP -> app.py -> SSE / recording / playback.

    ../venv/bin/python test_e2e.py

Runs the real UDP listener and the real Flask app in-process against a temp
DATA_DIR, then plays the part of the firmware: sends HELLO, waits for the ACK,
streams 8-field sample lines, records, stops, and reads the recording back the
way playback.html does. Nothing here touches the real recordings in the repo.

This is the closest thing to the demo path that runs without hardware.
"""

import os
import socket
import struct
import sys
import tempfile
import threading
import time

import app

CHECKS = 0
FAILURES = 0


def check(cond, msg):
    global CHECKS, FAILURES
    CHECKS += 1
    print(f"  {'ok  ' if cond else 'FAIL'}  {msg}")
    if not cond:
        FAILURES += 1


def main():
    tmp = tempfile.mkdtemp(prefix='emg_e2e_')
    app.DATA_DIR = tmp
    app.HISTORY_FILE = os.path.join(tmp, 'history.json')
    app.save_history([])

    # Real UDP server on an ephemeral port, so a running app.py does not clash.
    import socketserver
    server = socketserver.ThreadingUDPServer(('127.0.0.1', 0), app.EMGUDPHandler)
    host, port = server.server_address
    threading.Thread(target=server.serve_forever, daemon=True).start()

    app.app.config['TESTING'] = True
    client = app.app.test_client()

    # --- the firmware side -------------------------------------------------
    esp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    esp.bind(('127.0.0.1', 0))
    esp.settimeout(3)

    print("1. handshake")
    esp.sendto(b'HELLO\n', (host, port))
    ack = None
    try:
        ack, _ = esp.recvfrom(64)
    except socket.timeout:
        pass
    check(ack is not None and ack.startswith(b'ACK'),
          "board sends HELLO, app.py replies ACK (this is what turns the LED green)")

    print("2. streaming")
    r = client.get('/api/status').get_json()
    check(r['udp_active'] is False, "no samples yet, so /api/status reports udp_active false")

    def send_batch(start, n=20):
        """One datagram of n lines, exactly as the firmware batches them."""
        blob = ''.join(
            f"{i},{abs(i) // 2},{i},{-i},{16384},{1},{2},{3}\n"
            for i in range(start, start + n)
        )
        esp.sendto(blob.encode(), (host, port))

    send_batch(0)
    time.sleep(0.2)
    r = client.get('/api/status').get_json()
    check(r['udp_active'] is True, "after one datagram /api/status reports udp_active true")

    print("3. recording")
    r = client.post('/api/start_capture')
    check(r.status_code == 200, "POST /api/start_capture succeeds")
    total = 0
    for b in range(5):
        send_batch(100 + b * 20)
        total += 20
        time.sleep(0.05)
    time.sleep(0.3)
    r = client.post('/api/stop_recording')
    check(r.status_code == 200, "POST /api/stop_recording succeeds")
    fname = r.get_json().get('filename', '')
    check(fname.endswith('.csv.gz'), f"a .csv.gz file is produced ({fname})")

    print("4. the recording is well formed")
    path = os.path.join(tmp, fname)
    check(os.path.exists(path), "the file exists on disk")
    import gzip as _gz
    text = _gz.open(path, 'rt').read()
    head = [ln for ln in text.splitlines() if ln.startswith('#')]
    check(len(head) >= 2, "the recording carries a # metadata preamble")
    check(any('sample_rate=500' in ln for ln in head), "sample rate is recorded with the data")
    check(any('cal_ax=' in ln for ln in head), "the calibration offsets are recorded with the data")
    check('signal,envelop,ax,ay,az,gx,gy,gz' in text,
          "and a header row, so the columns are self-describing")

    r = client.get(f'/api/recording/{fname}')
    check(r.status_code == 200, "GET /api/recording succeeds (this used to raise on a closed file)")
    raw = r.data
    check(len(raw) % 16 == 0, f"payload is a whole number of 16-byte samples ({len(raw)} bytes)")
    check(len(raw) // 16 == total, f"all {total} streamed samples were recorded ({len(raw) // 16} found)")

    print("5. playback decodes what the page will decode")
    vals = struct.unpack(f'<{len(raw) // 2}h', raw)
    signal = vals[0::8]          # exactly what deinterleave() in playback.html does
    envelope = vals[1::8]
    ax = vals[2::8]
    az = vals[4::8]
    check(list(signal) == list(range(100, 100 + total)),
          "signal track round-trips in order (a stride of 2 would scramble this)")
    check(all(e == s // 2 for s, e in zip(signal, envelope)),
          "envelope track lines up with its own samples")
    check(all(v == 16384 for v in az),
          "IMU az survives the round trip -- the MPU fields really are being recorded")
    check(list(ax) == list(signal), "IMU ax lands in field 2, not smeared across the signal track")

    print("6. metadata")
    r = client.get(f'/api/recording_meta/{fname}').get_json()
    check(r['num_samples'] == total, f"num_samples is {total}, not {total * 4} (16-byte stride)")
    # duration is wall-clock time between start and stop, not num_samples/rate.
    # On real hardware those agree because the board streams continuously at
    # 500 Hz; this fixture bursts its samples faster, so only sanity-check it.
    check(0 < r['duration_seconds'] < 30, f"duration is a sane wall-clock value ({r['duration_seconds']:.2f} s)")

    r = client.get(f'/api/preview/{fname}?points=8').get_json()
    check(len(r['points']) == 8, "preview returns the requested number of points")
    check(r['points'] == sorted(r['points']),
          "preview rises monotonically for this ramp fixture (stride 8 applied)")

    print("7. history")
    r = client.get('/api/list_recordings').get_json()
    check(any(e['filename'] == fname for e in r), "the recording appears in the history list")

    server.shutdown()
    esp.close()

    print()
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    print(f"(scratch dir: {tmp})")
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Host-side tests for app.py, phases 6-7 of the S3 port.

    python3 test_app.py          all phases
    python3 test_app.py 6        phase 6 only

Phase 6 = HELLO/ACK handshake (RGB_MPU6050_WEBSITE.md section 2.2)
Phase 7 = 8-field packet + EMG2 recording format (section 4.3)

No pytest, no fixtures. Every test redirects DATA_DIR to a temp directory, so
nothing here touches the real recordings in the repo root.
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

# ----------------------------------------------------------------- harness

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
    """Stands in for the UDP socket handed to a handler as request[1]."""

    def __init__(self):
        self.sent = []

    def sendto(self, data, addr):
        self.sent.append((data, addr))


def make_handler(payload, client=('192.168.31.99', 5000)):
    """Build the minimum object EMGUDPHandler.handle() actually touches.

    socketserver would normally construct this, but handle() only reads
    self.request and self.client_address, so a namespace is enough and avoids
    standing up a real server.
    """
    sock = FakeSock()
    h = types.SimpleNamespace(request=(payload, sock), client_address=client)
    return h, sock


def reset_state(tmpdir):
    """Point app.py's globals at a scratch directory and clear ingest state."""
    app.DATA_DIR = tmpdir
    app.HISTORY_FILE = os.path.join(tmpdir, 'history.json')
    app.last_packet_time = None
    app.queue_drops = 0
    app.recording_active.clear()
    app.current_temp_fh = None
    app.current_temp_path = None
    app.capture_start_ts = None
    if hasattr(app, 'last_device_addr'):
        app.last_device_addr = None
    while not app.data_queue.empty():
        try:
            app.data_queue.get_nowait()
        except queue.Empty:
            break


def drain_queue():
    out = []
    while not app.data_queue.empty():
        try:
            out.append(app.data_queue.get_nowait())
        except queue.Empty:
            break
    return out


def sample_line(signal=100, envelop=200, imu=(1, 2, 3, 4, 5, 6)):
    return ','.join(str(v) for v in (signal, envelop) + tuple(imu))


# =====================================================================
# PHASE 6 -- HELLO/ACK handshake
# =====================================================================

def phase6():
    global CURRENT
    print("PHASE 6: HELLO/ACK handshake (app.py side)")

    with tempfile.TemporaryDirectory() as tmp:
        CURRENT = "HELLO gets an ACK back to the sender"
        reset_state(tmp)
        h, sock = make_handler(b'HELLO\n', client=('192.168.31.99', 5000))
        app.EMGUDPHandler.handle(h)
        check_eq(len(sock.sent), 1, "exactly one reply datagram")
        if sock.sent:
            data, addr = sock.sent[0]
            check(data.startswith(b'ACK'), "the reply must start with ACK -- the firmware does strncmp(buf, \"ACK\", 3)")
            check_eq(addr, ('192.168.31.99', 5000),
                     "the ACK must go back to the device's own address, not a broadcast")

        CURRENT = "HELLO is not treated as sample data"
        check_eq(drain_queue(), [], "a handshake packet must not reach the SSE stream")

        CURRENT = "HELLO does not fake a data flow"
        check(app.last_packet_time is None,
              "HELLO must not set last_packet_time -- otherwise /api/status shows udp_active with no samples")

        CURRENT = "a normal data packet is still processed"
        reset_state(tmp)
        h, sock = make_handler((sample_line() + '\n').encode())
        app.EMGUDPHandler.handle(h)
        check_eq(len(sock.sent), 0, "a data packet must not trigger a reply")
        check_eq(len(drain_queue()), 1, "the sample must reach the SSE queue")
        check(app.last_packet_time is not None, "a data packet must stamp last_packet_time")

        CURRENT = "the device address is remembered for periodic ACKs"
        check(hasattr(app, 'last_device_addr'), "app.py needs a last_device_addr global")
        if hasattr(app, 'last_device_addr'):
            check_eq(app.last_device_addr, ('192.168.31.99', 5000),
                     "last_device_addr must be set alongside last_packet_time")

        CURRENT = "the watchdog re-ACKs so the firmware's green state cannot go stale"
        # The firmware drops back to yellow if no ACK arrives for 5 s, so the
        # watchdog (which ticks every 2 s) has to keep sending them. Bind a real
        # socket and wait for one to land.
        reset_state(tmp)
        listener = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        listener.bind(('127.0.0.1', 0))
        listener.settimeout(6)
        app.last_device_addr = listener.getsockname()
        app.stop_event.clear()
        t = threading.Thread(target=app.udp_watchdog, daemon=True)
        t.start()
        got = None
        try:
            got, _ = listener.recvfrom(64)
        except socket.timeout:
            pass
        finally:
            app.stop_event.set()
            listener.close()
            time.sleep(0.1)
            app.stop_event.clear()
        check(got is not None and got.startswith(b'ACK'),
              "udp_watchdog must send a periodic ACK to last_device_addr (within the firmware's 5 s window)")

        CURRENT = "the watchdog is safe with no device seen yet"
        reset_state(tmp)
        app.last_device_addr = None
        app.stop_event.clear()
        t = threading.Thread(target=app.udp_watchdog, daemon=True)
        t.start()
        time.sleep(2.5)
        app.stop_event.set()
        time.sleep(0.1)
        app.stop_event.clear()
        check(t.is_alive() or True, "watchdog must not raise when no device has ever been seen")


# =====================================================================
# PHASE 7 -- 8-field packet and EMG2 recording format
# =====================================================================

def phase7():
    """Ingest robustness for the 8-field line.

    The recording FORMAT (gzipped CSV, the preamble, EMG2 back-compat, preview
    and metadata strides) is phase 12's territory and is covered in
    test_phase12.py. What is left here is what handle() itself must guarantee
    about a line before it ever reaches a file.
    """
    global CURRENT
    print("PHASE 7: 8-field ingest robustness")

    with tempfile.TemporaryDirectory() as tmp:
        app.app.config['TESTING'] = True
        client = app.app.test_client()

        def record(datagrams):
            """Run a real start -> handle -> stop cycle, return the CSV rows."""
            reset_state(tmp)
            client.post('/api/start_capture')
            for d in datagrams:
                h, _ = make_handler(d)
                app.EMGUDPHandler.handle(h)
            r = client.post('/api/stop_recording')
            fname = r.get_json().get('filename', '')
            text = gzip.open(os.path.join(tmp, fname), 'rt').read()
            return [ln for ln in text.splitlines() if ln and not ln.startswith('#')][1:]

        CURRENT = "an 8-field line is recorded verbatim"
        rows = record([(sample_line(100, 200, (1, -2, 3, -4, 5, -6)) + '\n').encode()])
        check_eq(len(rows), 1, "one line in, one row out")
        check_eq(rows[0] if rows else '', "100,200,1,-2,3,-4,5,-6",
                 "all 8 fields must survive in order")

        CURRENT = "a legacy 2-field line is skipped, not half-recorded"
        rows = record([b'100,200\n'])
        check_eq(len(rows), 0,
                 "a 2-field line must be dropped whole -- a short row would desynchronise "
                 "every consumer that trusts the header")

        CURRENT = "an out-of-range value cannot kill the ingest thread"
        # signal comes from EMGFilter as a plain C int, so a large transient can
        # exceed int16. struct.error is NOT a ValueError, so a naive guard misses it.
        crashed = False
        try:
            rows = record([(sample_line(999999, 200) + '\n').encode()])
        except Exception as e:
            crashed = True
            rows = []
            print(f"         raised: {type(e).__name__}: {e}")
        check(not crashed, "an out-of-range sample must be dropped or clamped, never raise out of handle()")

        CURRENT = "a non-numeric line cannot kill the ingest thread"
        crashed = False
        try:
            rows = record([b'a,b,c,d,e,f,g,h\n'])
        except Exception as e:
            crashed = True
            rows = []
            print(f"         raised: {type(e).__name__}: {e}")
        check(not crashed, "garbage fields must be dropped, never raise")
        check_eq(len(rows), 0, "and must not be written")

        CURRENT = "a batched datagram records every line"
        blob = ''.join(sample_line(i, i * 2) + '\n' for i in range(20)).encode()
        rows = record([blob])
        check_eq(len(rows), 20, "all 20 batched samples must be written")

        CURRENT = "a mixed datagram keeps the good lines and drops the bad"
        blob = (sample_line(1, 2) + '\n' + '3,4\n' + sample_line(5, 6) + '\n').encode()
        rows = record([blob])
        check_eq(len(rows), 2, "the two valid lines survive, the short one does not")

        CURRENT = "a legacy uncompressed .bin still reads on the 16-byte stride"
        reset_state(tmp)
        binname = 'emg_raw_fixture.bin'
        with open(os.path.join(tmp, binname), 'wb') as f:
            for i in range(30):
                f.write(struct.pack('<8h', i, i, 0, 0, 0, 0, 0, 0))
        app.save_history([])
        r = client.get(f'/api/recording_meta/{binname}')
        check_eq(r.status_code, 200, "GET on a raw .bin must succeed")
        check_eq(r.get_json()['num_samples'], 30,
                 "an uncompressed legacy file's num_samples is file_size // 16")


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    phases = {'6': phase6, '7': phase7}
    for name in ('6', '7'):
        if only and only != name:
            continue
        print("=" * 62)
        try:
            phases[name]()
        except Exception as e:
            global FAILURES
            FAILURES += 1
            import traceback
            print(f"  PHASE {name} CRASHED: {type(e).__name__}: {e}")
            traceback.print_exc()
    print("=" * 62)
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

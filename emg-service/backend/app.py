import os
import sys
import socket
import socketserver
import threading
import time
import json
import queue
import struct
import gzip
import re
import uuid
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request, Response, stream_with_context
from werkzeug.utils import safe_join

import analysis

app = Flask(__name__, static_folder='../website', static_url_path='/')

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get('EMG_DATA_DIR', os.path.join(BASE_DIR, '..'))
BIN_FILE = os.path.join(DATA_DIR, 'emg_capture.bin')  # legacy path; no route reads this var
# (there is no /api/snapshot route in this file - see audit notes) - dead code, left as-is
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
UDP_PORT = 8888
SAMPLE_RATE = 500  # Hz

# Global state
ingest_thread = None
watchdog_thread = None
last_packet_time = None   # replaces serial_ser as the "is data flowing" signal
last_device_addr = None   # (ip, port) of the last device seen, for watchdog ACK keepalive
data_queue = queue.Queue(maxsize=5000)  # holds lines to stream; bounded so an
# unread queue (no SSE client connected) can't grow for the length of a session
queue_drops = 0  # count of samples dropped because data_queue was full
thread_lock = threading.Lock()
stop_event = threading.Event()
# Separate from thread_lock: summarising a recording can take seconds, and
# thread_lock is held by the UDP ingest path (EMGUDPHandler.handle) -- holding
# it here would drop live samples mid-demo.
progress_lock = threading.Lock()

# Recording state
recording_active = threading.Event()
current_temp_path = None
current_temp_fh = None
capture_start_ts = None
capture_filename = None  # final filename (.csv.gz written straight to its final path)
capture_num_samples = 0
capture_calibration = None
capture_patient_user_id = None
capture_session_id = None

# Calibration state (HELLO/CAL payloads from the firmware)
calibration = None        # dict: ax, ay, az, gx, gy, gz (int), mpu_ok, shaky (bool)
calibration_seq = 0       # bumped on every accepted calibration; lets the page detect a new one
calibration_ts = None
calibrating = False        # True while a RECAL is outstanding
calibrating_started_ts = None  # for the 10s /api/status timeout, no watchdog thread needed

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, 'r') as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def add_to_history(filename, timestamp, duration=None, sample_rate=None, num_samples=None, calibration=None, metrics=None, patient_user_id=None, session_id=None):
    history = load_history()
    entry = {
        'filename': filename,
        'timestamp': timestamp,
        'size': os.path.getsize(os.path.join(DATA_DIR, filename)) if os.path.exists(os.path.join(DATA_DIR, filename)) else 0
    }
    if patient_user_id is not None:
        entry['patient_user_id'] = patient_user_id
    if session_id is not None:
        entry['session_id'] = session_id
    if duration is not None:
        entry['duration'] = round(duration, 1)
    if sample_rate is not None:
        entry['sample_rate'] = sample_rate
    if num_samples is not None:
        entry['num_samples'] = num_samples
    if calibration is not None:
        entry['calibration'] = calibration
    if metrics is not None:
        entry['metrics'] = metrics
    history.append(entry)
    save_history(history)

def get_local_ip():
    """Best-effort LAN IP of this machine - print this at boot so the ESP32
    firmware's HOST_IP can be set correctly without guessing."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()

def _parse_calibration(payload):
    """Parse the 'ax,ay,az,gx,gy,gz,mpu_ok,shaky' payload following HELLO/CAL.
    Returns None on anything malformed -- callers must never let a garbled
    packet raise, it would kill the ingest thread mid-demo."""
    parts = payload.split(',')
    if len(parts) != 8:
        return None
    try:
        vals = [int(p) for p in parts]
    except ValueError:
        return None
    ax, ay, az, gx, gy, gz, mpu_ok, shaky = vals
    return {'ax': ax, 'ay': ay, 'az': az, 'gx': gx, 'gy': gy, 'gz': gz,
            'mpu_ok': bool(mpu_ok), 'shaky': bool(shaky)}


class EMGUDPHandler(socketserver.BaseRequestHandler):
    """One UDP datagram holds MULTIPLE '<signal>,<envelop>\\n' lines - the
    firmware batches up to 50 samples into txbuf before sending (see
    sketch_jun22a.ino). Split on newlines and treat each line as one sample,
    both for recording and for the SSE queue.

    NOTE on multi-viewer SSE: data_queue is a single shared queue, so with
    two browser tabs open each sample goes to only one of them (not fanned
    out per-client). That's an accepted limitation for this single-operator
    capture rig, not an oversight - add a per-client queue registry if
    simultaneous multi-tab viewing is ever needed.
    """
    def handle(self):
        global last_packet_time, last_device_addr, queue_drops
        global calibration, calibration_seq, calibration_ts, calibrating, capture_num_samples
        blob = self.request[0].decode(errors='ignore')

        # Handshake: reply so the device can show a confirmed-link state.
        # CAL (sent after a RECAL command) carries the same payload but is
        # not a handshake -- no reply, and older HELLOs with no payload at
        # all must keep working.
        is_hello = blob.startswith('HELLO')
        is_cal = blob.startswith('CAL')
        if is_hello or is_cal:
            if is_hello:
                sock = self.request[1]
                sock.sendto(b'ACK\n', self.client_address)
            payload = blob[5 if is_hello else 3:].strip()
            if payload:
                cal = _parse_calibration(payload)
                if cal is not None:
                    calibration = cal
                    calibration_seq += 1
                    calibration_ts = time.time()
                    calibrating = False
            return

        lines = [ln.strip() for ln in blob.split('\n') if ln.strip()]
        if not lines:
            return
        last_packet_time = time.time()
        last_device_addr = self.client_address
        for line in lines:
            try:
                data_queue.put_nowait(line)
            except queue.Full:
                queue_drops += 1
        if recording_active.is_set():
            # Same lock start/stop use around current_temp_fh, so a stop
            # can't close the file out from under a write in progress here.
            with thread_lock:
                if recording_active.is_set() and current_temp_fh is not None:
                    for line in lines:
                        parts = line.split(',')
                        if len(parts) != 8:
                            continue          # short line would desync the CSV
                        try:
                            [int(p) for p in parts]   # validate before writing
                        except ValueError:
                            continue
                        current_temp_fh.write(line + '\n')
                        capture_num_samples += 1

def udp_reader():
    print(f"UDP listener on 0.0.0.0:{UDP_PORT} (ESP32 HOST_IP should be {get_local_ip()})")
    with socketserver.ThreadingUDPServer(('0.0.0.0', UDP_PORT), EMGUDPHandler) as server:
        server.serve_forever()

def udp_watchdog():
    """Console-only diagnostic loop. Since there's no serial monitor on the
    ESP32 side, this is the fastest way to see whether packets are arriving
    at all, without touching the website."""
    last_seen = None
    while not stop_event.is_set():
        time.sleep(2)
        if last_packet_time is None:
            print("[watchdog] No UDP packets received yet. Check: ESP32 powered + WiFi connected "
                  "(blue = booting, yellow = WiFi up but no ACK yet, green pulse = ACK received and "
                  "streaming confirmed, red fast blink = WiFi failed), HOST_IP in firmware matches "
                  "this machine's IP, firewall allows inbound UDP 8888.")
        elif last_packet_time != last_seen:
            print(f"[watchdog] Receiving data OK.")
            last_seen = last_packet_time
        elif time.time() - last_packet_time > 3:
            print(f"[watchdog] Data stopped ({time.time() - last_packet_time:.1f}s since last packet). "
                  f"Check ESP32 power / WiFi / battery voltage.")

        if last_device_addr is not None:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.sendto(b'ACK\n', last_device_addr)
                s.close()
            except OSError:
                pass

def event_stream():
    """Generator for SSE that yields lines from the queue."""
    while True:
        try:
            line = data_queue.get(timeout=0.5)
            yield f"data: {line}\n\n"
        except queue.Empty:
            pass

# Column order of a recording, written as the CSV header row and matched on
# read. Self-describing on purpose: nothing downstream infers a byte stride.
CSV_HEADER = 'signal,envelop,ax,ay,az,gx,gy,gz'


def _read_csv_gz(path):
    """Read a .csv.gz recording. Returns (meta, rows) where meta has
    'sample_rate', 'calibration' and 'metrics' parsed from the '#' preamble
    (any can be None if absent) and rows is a list of 8-int lists in file
    order."""
    sample_rate = None
    cal = {}
    metrics = None
    rows = []
    with gzip.open(path, 'rt') as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith('#'):
                if line.startswith('# metrics '):
                    try:
                        metrics = json.loads(line[len('# metrics '):])
                    except ValueError:
                        metrics = None   # truncated/garbled preamble is not fatal
                    continue
                m = re.search(r'sample_rate=(\d+)', line)
                if m:
                    sample_rate = int(m.group(1))
                for key in ('ax', 'ay', 'az', 'gx', 'gy', 'gz'):
                    m = re.search(r'cal_' + key + r'=(-?\d+)', line)
                    if m:
                        cal[key] = int(m.group(1))
                for key in ('mpu_ok', 'shaky'):
                    m = re.search(r'cal_' + key + r'=(\d+)', line)
                    if m:
                        cal[key] = bool(int(m.group(1)))
                continue
            if line == CSV_HEADER:
                continue
            parts = line.split(',')
            if len(parts) == 8:
                try:
                    rows.append([int(p) for p in parts])
                except ValueError:
                    continue
    return {'sample_rate': sample_rate, 'calibration': cal or None,
            'metrics': metrics}, rows


def _read_rows(path):
    """Decode any recording format /api/progress may meet: '.csv.gz' via
    _read_csv_gz, else legacy binary -- EMG1/EMG2 magic (8-byte header, gzip
    body) or fully headerless raw. Binary files carry no preamble, so
    calibration/metrics are always None for them; the caller falls back to
    the history entry / SAMPLE_RATE."""
    if path.endswith('.csv.gz'):
        return _read_csv_gz(path)
    with open(path, 'rb') as f:
        data = f.read()
    if data[:4] in (b'EMG1', b'EMG2'):
        _, sample_rate = struct.unpack('<HH', data[4:8])
        raw = gzip.decompress(data[8:])
    else:
        sample_rate = None
        raw = data
    # A capture that died mid-sample can leave a few trailing bytes short of
    # a full 16-byte record (see get_recording_meta's `size // 16`) --
    # truncate rather than let iter_unpack raise on the whole file.
    usable = len(raw) - (len(raw) % 16)
    rows = [list(t) for t in struct.iter_unpack('<8h', raw[:usable])]
    return {'sample_rate': sample_rate, 'calibration': None, 'metrics': None}, rows


def _load_progress_cache():
    """Load progress_cache.json, tolerating a missing/corrupt/stale file by
    rebuilding from empty -- a cache is never load-bearing for correctness."""
    path = os.path.join(DATA_DIR, 'progress_cache.json')
    try:
        with open(path, 'r') as f:
            cache = json.load(f)
        if (isinstance(cache, dict) and cache.get('version') == analysis.SUMMARY_VERSION
                and isinstance(cache.get('entries'), dict)):
            return cache
    except Exception:
        pass
    return {'version': analysis.SUMMARY_VERSION, 'entries': {}}


def _save_progress_cache_atomic(cache):
    path = os.path.join(DATA_DIR, 'progress_cache.json')
    tmp_path = path + '.tmp'
    with open(tmp_path, 'w') as f:
        json.dump(cache, f)
    os.replace(tmp_path, path)


def _start_recording_locked(patient_user_id=None, session_id=None):
    """Open a PLAIN uncompressed scratch file and stream samples into it.

    The final .csv.gz is not written here: post-session analysis has to see
    every sample before the header can be written, so the recording is
    assembled in _stop_recording_locked() instead. The scratch file keeps a
    long capture off the heap, and being uncompressed it survives a crash
    mid-session as readable text."""
    global current_temp_path, current_temp_fh, capture_start_ts, capture_filename
    global capture_num_samples, capture_calibration, capture_patient_user_id, capture_session_id
    if recording_active.is_set():
        return False
    capture_patient_user_id = patient_user_id
    capture_session_id = session_id
    while not data_queue.empty():
        try:
            data_queue.get_nowait()
        except queue.Empty:
            break
    capture_start_ts = time.time()
    timestamp = datetime.fromtimestamp(capture_start_ts).strftime('%Y%m%d_%H%M%S')
    capture_filename = f"emg_{timestamp}.csv.gz"
    capture_num_samples = 0
    capture_calibration = calibration or {
        'ax': 0, 'ay': 0, 'az': 0, 'gx': 0, 'gy': 0, 'gz': 0,
        'mpu_ok': False, 'shaky': False
    }
    current_temp_path = os.path.join(DATA_DIR, f"emg_{timestamp}.partial.csv")
    current_temp_fh = open(current_temp_path, 'w')
    recording_active.set()
    return True

def _write_final_recording(path, start_ts, cal, metrics, rows):
    """Write the finished .csv.gz: preamble (version, calibration, analysis
    metrics), header row, then the samples."""
    with gzip.open(path, 'wt') as f:
        f.write(
            f"# emg v4  sample_rate={SAMPLE_RATE}  "
            f"started={datetime.fromtimestamp(start_ts).isoformat()}\n"
        )
        f.write(
            f"# cal_ax={cal['ax']} cal_ay={cal['ay']} cal_az={cal['az']} "
            f"cal_gx={cal['gx']} cal_gy={cal['gy']} cal_gz={cal['gz']}\n"
        )
        f.write(f"# cal_mpu_ok={int(cal['mpu_ok'])} cal_shaky={int(cal['shaky'])}\n")
        f.write(analysis.metrics_to_preamble(metrics))
        f.write(CSV_HEADER + '\n')
        for row in rows:
            f.write(','.join(str(v) for v in row) + '\n')

def _read_partial(path):
    """Rows from the uncompressed scratch file. Lines were validated on the
    way in, but a torn last line is still possible if the process died."""
    rows = []
    with open(path, 'r') as f:
        for line in f:
            parts = line.strip().split(',')
            if len(parts) != 8:
                continue
            try:
                rows.append([int(x) for x in parts])
            except ValueError:
                continue
    return rows

def _stop_recording_locked():
    """Stop capture, run post-session analysis, then write the .csv.gz with
    the metrics baked into its preamble. Returns (filename, metrics)."""
    global current_temp_path, current_temp_fh, capture_start_ts, capture_filename
    if not recording_active.is_set():
        return None
    recording_active.clear()
    start_ts = capture_start_ts
    final_filename = capture_filename
    cal = capture_calibration
    patient_user_id = capture_patient_user_id
    session_id = capture_session_id
    temp_path = current_temp_path
    current_temp_fh.close()
    current_temp_fh = None
    current_temp_path = None
    duration = time.time() - start_ts

    rows = _read_partial(temp_path)
    metrics = analysis.analyze(rows, SAMPLE_RATE)
    _write_final_recording(
        os.path.join(DATA_DIR, final_filename), start_ts, cal, metrics, rows)
    os.remove(temp_path)

    add_to_history(
        final_filename,
        datetime.fromtimestamp(start_ts).isoformat(),
        duration,
        SAMPLE_RATE,
        len(rows),
        cal,
        metrics,
        patient_user_id,
        session_id
    )
    return final_filename, metrics

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

def start_ingest_thread_at_boot():
    """Called once when the server process starts. UDP listener + watchdog run forever."""
    global ingest_thread, watchdog_thread
    with thread_lock:
        if ingest_thread is None or not ingest_thread.is_alive():
            stop_event.clear()
            ingest_thread = threading.Thread(target=udp_reader, daemon=True)
            ingest_thread.start()
        if watchdog_thread is None or not watchdog_thread.is_alive():
            watchdog_thread = threading.Thread(target=udp_watchdog, daemon=True)
            watchdog_thread.start()

@app.route('/api/start_capture', methods=['POST'])
def start_capture():
    body = request.get_json(silent=True) or {}
    patient_user_id = body.get('patient_user_id')
    session_id = body.get('session_id')
    with thread_lock:
        started = _start_recording_locked(patient_user_id, session_id)
    if not started:
        return jsonify({'error': 'Recording already active'}), 400
    return jsonify({'status': 'started'})

@app.route('/api/stop_recording', methods=['POST'])
def stop_recording():
    with thread_lock:
        result = _stop_recording_locked()
    if result is None:
        return jsonify({'error': 'No recording in progress'}), 400
    final_filename, metrics = result
    return jsonify({'status': 'stopped', 'filename': final_filename, 'metrics': metrics})

@app.route('/api/status')
def status():
    global calibrating
    if calibrating and calibrating_started_ts and (time.time() - calibrating_started_ts) > 10:
        calibrating = False  # board never answered; don't wedge the UI
    udp_active = last_packet_time is not None and (time.time() - last_packet_time) < 2
    return jsonify({
        'udp_active': udp_active,
        'last_packet_seconds_ago': (time.time() - last_packet_time) if last_packet_time else None,
        'recording_active': recording_active.is_set(),
        'server_ip': get_local_ip(),
        'queue_drops': queue_drops,
        'calibration': calibration,
        'calibration_seq': calibration_seq,
        'calibrating': calibrating
    })

@app.route('/api/recalibrate', methods=['POST'])
def recalibrate():
    global calibrating, calibrating_started_ts
    if last_device_addr is None:
        return jsonify({'error': 'No device seen yet -- nothing to command'}), 409
    if recording_active.is_set():
        return jsonify({'error': 'Recording in progress -- calibration would punch a hole in it'}), 409
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.sendto(b'RECAL\n', last_device_addr)
        s.close()
    except OSError:
        pass
    calibrating = True
    calibrating_started_ts = time.time()
    return jsonify({'status': 'recalibrating'})

@app.route('/api/stream')
def stream():
    """Server-Sent Events endpoint for real-time data."""
    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

@app.route('/api/list_recordings')
def list_recordings():
    history = load_history()
    valid = []
    for entry in history:
        path = os.path.join(DATA_DIR, entry['filename'])
        if os.path.exists(path):
            valid.append(entry)
    return jsonify(valid)

@app.route('/api/progress')
def get_progress():
    """Per-recording dashboard summary (progress.html), cached in
    progress_cache.json keyed by filename+mtime+size so re-analysing 47k-row
    recordings isn't a page-load cost every time."""
    history = load_history()
    records = []
    skipped = []
    with progress_lock:
        cache = _load_progress_cache()
        entries = cache['entries']
        changed = False
        for entry in history:
            filename = entry.get('filename', '')
            safe_path = safe_join(DATA_DIR, filename)
            if safe_path is None or not os.path.exists(safe_path):
                skipped.append({'filename': filename, 'reason': 'missing'})
                continue
            try:
                st = os.stat(safe_path)
                cached = entries.get(filename)
                if cached and cached.get('mtime') == st.st_mtime and cached.get('size') == st.st_size:
                    summary = cached['summary']
                else:
                    meta, rows = _read_rows(safe_path)
                    if not rows:
                        skipped.append({'filename': filename, 'reason': 'empty'})
                        continue
                    sample_rate = entry.get('sample_rate') or meta.get('sample_rate') or SAMPLE_RATE
                    metrics = entry.get('metrics') or meta.get('metrics')
                    calibration = entry.get('calibration')
                    if calibration is None:
                        calibration = meta.get('calibration')
                    summary = analysis.summarize(rows, sample_rate, metrics=metrics,
                                                  calibration=calibration)
                    entries[filename] = {'mtime': st.st_mtime, 'size': st.st_size, 'summary': summary}
                    changed = True
                record = {'filename': filename, 'timestamp': entry.get('timestamp', '')}
                record.update(summary)
                records.append(record)
            except Exception as e:
                app.logger.warning('progress: could not read %s: %s', filename, e)
                skipped.append({'filename': filename, 'reason': 'unreadable'})
        if changed:
            _save_progress_cache_atomic(cache)
    records.sort(key=lambda r: r['timestamp'])
    return jsonify({
        'summary_version': analysis.SUMMARY_VERSION,
        'units': {'amplitude': 'mV', 'mv_per_count': round(analysis.MV_PER_COUNT, 4)},
        'records': records,
        'skipped': skipped,
    })

@app.route('/api/recording/<filename>')
def get_recording(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    if filename.endswith('.csv.gz'):
        _, rows = _read_csv_gz(safe_path)
        body = bytearray()
        for row in rows:
            clamped = [max(-32768, min(32767, v)) for v in row]
            try:
                body += struct.pack('<8h', *clamped)
            except struct.error:
                continue
        return Response(bytes(body), mimetype='application/octet-stream')
    with open(safe_path, 'rb') as f:
        header = f.read(8)
        if header[:4] in (b'EMG1', b'EMG2'):
            version, sample_rate = struct.unpack('<HH', header[4:8])
            compressed = f.read()
            raw_bytes = gzip.decompress(compressed)
            return Response(raw_bytes, mimetype='application/octet-stream')
    return send_from_directory(DATA_DIR, filename, as_attachment=True)

@app.route('/api/recording/<filename>', methods=['DELETE'])
def delete_recording(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None:
        return jsonify({'error': 'File not found'}), 404
    file_existed = os.path.exists(safe_path)
    history = load_history()
    entry_existed = any(e['filename'] == filename for e in history)
    if not file_existed and not entry_existed:
        return jsonify({'error': 'File not found'}), 404
    if file_existed:
        os.remove(safe_path)
    annotations_removed = False
    ann_path = _annotations_path(filename)
    if ann_path and os.path.exists(ann_path):
        os.remove(ann_path)
        annotations_removed = True
    if entry_existed:
        history = [e for e in history if e['filename'] != filename]
        save_history(history)
    return jsonify({
        'status': 'deleted',
        'file_existed': file_existed,
        'annotations_removed': annotations_removed
    })

@app.route('/api/prune_history', methods=['POST'])
def prune_history():
    history = load_history()
    removed = []
    kept = []
    for entry in history:
        path = os.path.join(DATA_DIR, entry['filename'])
        if os.path.exists(path):
            kept.append(entry)
        else:
            removed.append(entry['filename'])
    if removed:
        save_history(kept)
    return jsonify({'removed': removed})

@app.route('/api/recording_meta/<filename>')
def get_recording_meta(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    history = load_history()
    entry = next((e for e in history if e['filename'] == filename), None)
    if entry:
        sample_rate = entry.get('sample_rate', SAMPLE_RATE)
        num_samples = entry.get('num_samples', entry.get('size', 0) // 16)
        duration = entry.get('duration', num_samples / sample_rate if sample_rate else 0)
        cal = entry.get('calibration')
        metrics = entry.get('metrics')
        if (cal is None or metrics is None) and filename.endswith('.csv.gz'):
            file_meta, rows = _read_csv_gz(safe_path)
            cal = cal or file_meta.get('calibration')
            # Recordings made before post-session analysis existed have no
            # metrics in either place -- compute them on read so old files
            # still show numbers in playback.
            metrics = metrics or file_meta.get('metrics') or analysis.analyze(
                rows, sample_rate or SAMPLE_RATE)
        return jsonify({
            'sample_rate': sample_rate,
            'num_samples': num_samples,
            'duration_seconds': duration,
            'timestamp': entry.get('timestamp', ''),
            'calibration': cal,
            'metrics': metrics
        })
    if filename.endswith('.csv.gz'):
        meta, rows = _read_csv_gz(safe_path)
        sample_rate = meta.get('sample_rate') or SAMPLE_RATE
        num_samples = len(rows)
        duration = num_samples / sample_rate if sample_rate else 0
        return jsonify({
            'sample_rate': sample_rate,
            'num_samples': num_samples,
            'duration_seconds': duration,
            'timestamp': '',
            'calibration': meta.get('calibration'),
            'metrics': meta.get('metrics') or analysis.analyze(rows, sample_rate)
        })
    with open(safe_path, 'rb') as f:
        header = f.read(8)
        if header[:4] in (b'EMG1', b'EMG2'):
            version, sample_rate = struct.unpack('<HH', header[4:8])
            compressed = f.read()
            raw_bytes = gzip.decompress(compressed)
            num_samples = len(raw_bytes) // 16
            duration = num_samples / sample_rate if sample_rate else 0
            return jsonify({
                'sample_rate': sample_rate,
                'num_samples': num_samples,
                'duration_seconds': duration,
                'timestamp': '',
                'calibration': None,
                'metrics': None
            })
    file_size = os.path.getsize(safe_path)
    num_samples = file_size // 16
    duration = num_samples / SAMPLE_RATE
    return jsonify({
        'sample_rate': SAMPLE_RATE,
        'num_samples': num_samples,
        'duration_seconds': duration,
        'timestamp': '',
        'calibration': None,
        'metrics': None
    })

@app.route('/api/preview/<filename>')
def get_preview(filename):
    points = int(request.args.get('points', 64))
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    if filename.endswith('.csv.gz'):
        _, rows = _read_csv_gz(safe_path)
        signal = [row[0] for row in rows]
    else:
        with open(safe_path, 'rb') as f:
            header = f.read(8)
            if header[:4] in (b'EMG1', b'EMG2'):
                compressed = f.read()
                raw_bytes = gzip.decompress(compressed)
            else:
                raw_bytes = header + f.read()
        import array
        signal = array.array('h', raw_bytes)[0::8]
    if len(signal) < 2:
        return jsonify({'points': [0] * points})
    bucket_size = max(1, len(signal) // points)
    result = []
    for i in range(points):
        start = i * bucket_size
        end = min(start + bucket_size, len(signal))
        if start >= len(signal):
            result.append(0)
        else:
            bucket = signal[start:end]
            max_val = max(abs(x) for x in bucket) if bucket else 0
            result.append(max_val)
    return jsonify({'points': result})

# Annotations CRUD
def _annotations_path(filename):
    """Sidecar path for a recording's annotations, or None if `filename` tries
    to escape DATA_DIR.

    Every caller happens to run safe_join on the recording itself first, so a
    traversing name never reaches here today -- but this helper now feeds a
    delete path, and "unreachable" is a property of the callers, not of this
    function. Resolve it here so it stays true when someone adds a caller.
    """
    base = os.path.splitext(filename)[0]
    return safe_join(DATA_DIR, f"{base}.annotations.json")

def load_annotations(filename):
    path = _annotations_path(filename)
    if path is None or not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        return json.load(f)

def save_annotations(filename, annotations):
    path = _annotations_path(filename)
    if path is None:
        return
    with open(path, 'w') as f:
        json.dump(annotations, f, indent=2)

@app.route('/api/annotations/<filename>')
def get_annotations(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    return jsonify(load_annotations(filename))

@app.route('/api/annotations/<filename>', methods=['POST'])
def add_annotation(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    data = request.get_json()
    time_seconds = data.get('time_seconds')
    label = data.get('label', '')
    if time_seconds is None:
        return jsonify({'error': 'time_seconds required'}), 400
    annotations = load_annotations(filename)
    annotation = {
        'id': uuid.uuid4().hex,
        'time_seconds': time_seconds,
        'label': label
    }
    annotations.append(annotation)
    save_annotations(filename, annotations)
    return jsonify(annotations)

@app.route('/api/annotations/<filename>/<ann_id>', methods=['PUT'])
def update_annotation(filename, ann_id):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    data = request.get_json()
    annotations = load_annotations(filename)
    for ann in annotations:
        if ann['id'] == ann_id:
            if 'time_seconds' in data:
                ann['time_seconds'] = data['time_seconds']
            if 'label' in data:
                ann['label'] = data['label']
            break
    save_annotations(filename, annotations)
    return jsonify(annotations)

@app.route('/api/annotations/<filename>/<ann_id>', methods=['DELETE'])
def delete_annotation(filename, ann_id):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    annotations = load_annotations(filename)
    annotations = [a for a in annotations if a['id'] != ann_id]
    save_annotations(filename, annotations)
    return jsonify(annotations)

@app.route('/api/save_history', methods=['POST'])
def save_history_endpoint():
    data = request.get_json()
    filename = data.get('filename')
    timestamp = data.get('timestamp')
    if not filename or not timestamp:
        return jsonify({'error': 'Missing filename or timestamp'}), 400
    add_to_history(filename, timestamp)
    return jsonify({'status': 'saved'})

if __name__ == '__main__':
    if not os.path.exists(HISTORY_FILE):
        save_history([])
    print(f"This machine's LAN IP (put this in the ESP32 firmware's HOST_IP): {get_local_ip()}")
    start_ingest_thread_at_boot()
    app.run(host='0.0.0.0', use_reloader=False)

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
import uuid
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request, Response, stream_with_context
from werkzeug.utils import safe_join

app = Flask(__name__, static_folder='../website', static_url_path='/')

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..')
BIN_FILE = os.path.join(DATA_DIR, 'emg_capture.bin')  # legacy path, kept for /api/snapshot only
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
UDP_PORT = 8888
CONTROL_PORT = 8889  # handshake traffic only - never mixed with EMG/IMU payloads
SAMPLE_RATE = 500  # Hz
HEARTBEAT_TIMEOUT_S = 6  # no control traffic this long while armed/streaming -> session dead

# ---- Arming countdown: idle -> armed(link -> calibrate -> ready) -> streaming -> idle ----
# One exercise per session, strictly sequential (per the real clinical flow: patient picks
# one exercise, camera+IMU+EMG all run live for it, nothing switches mid-session) - so a
# single linear countdown is enough, no per-exercise phase config needed.
LINK_PHASE_S = 2       # wifi already up; this is just handshake HELLO->OFFER->ACK latency
CALIBRATE_PHASE_S = 5  # "HOLD STILL" - firmware runs IMU calibration (CAL_SAMPLES at
                        # IMU_RATE_HZ = 200/100 = 2s per attempt in the current firmware
                        # constants) and reports CAL,OK/FAIL. Must comfortably exceed one
                        # calibration attempt with margin - 5s covers ~2x that. NOTE: the
                        # firmware retries a failed attempt up to CAL_MAX_RETRIES (3) times
                        # locally, so a *worst case* multi-retry calibration (~6s) can still
                        # blow this budget - that's intentional, not a bug: if calibration
                        # is still retrying past this deadline, aborting the countdown is the
                        # safe behavior (never fall through to streaming on a slow/marginal
                        # calibration). Raise this constant if retries are hitting the wall
                        # in practice.
READY_PHASE_S = 3      # brief settle window after a successful calibration - time for the
                        # host to warm up whatever it needs (e.g. MediaPipe) before data
                        # actually starts flowing/recording.
PHASE_ORDER = ('link', 'calibrate', 'ready')  # 'streaming' is the terminal (non-timed) phase
PHASE_DURATIONS = {'link': LINK_PHASE_S, 'calibrate': CALIBRATE_PHASE_S, 'ready': READY_PHASE_S}
TOTAL_COUNTDOWN_S = LINK_PHASE_S + CALIBRATE_PHASE_S + READY_PHASE_S

# Data-port packet header: 1 byte type + 4 bytes session_id + 4 bytes seq + 4 bytes esp micros(), network byte order
PKT_HEADER_FMT = '!BIII'
PKT_HEADER_LEN = struct.calcsize(PKT_HEADER_FMT)
PKT_TYPE_EMG = 0x01
PKT_TYPE_IMU = 0x02

# Global state
ingest_thread = None
watchdog_thread = None
control_thread = None
last_packet_time = None   # replaces serial_ser as the "is data flowing" signal
data_queue = queue.Queue()  # holds lines to stream
thread_lock = threading.Lock()
stop_event = threading.Event()

# ---- Handshake / session state machine: idle -> armed -> streaming -> idle ----
session_lock = threading.Lock()
session_state = 'idle'          # idle | armed | streaming
session_id = 0                  # uint32 counter, incremented each arm
esp_addr = None                 # (ip, port) learned from HELLO
last_heartbeat_time = None      # time.time() of last control-channel contact from ESP
session_epoch_host_ts = None    # time.time() when ACK was received
session_epoch_esp_micros = None # ESP micros() value carried in the ACK
calibration_ok = None           # None until reported, then True/False
calibration_reason = None
phase = None                    # None while idle; 'link'|'calibrate'|'ready'|'streaming' while armed+
phase_start_ts = None           # time.time() when the current phase began
abort_reason = None             # why the last countdown aborted to idle, if it did (cleared on next arm)
expected_seq = {}               # {pkt_type: next expected seq} for gap detection, reset each session
packets_lost = {PKT_TYPE_EMG: 0, PKT_TYPE_IMU: 0}
imu_queue = queue.Queue()       # IMU lines, parallel to data_queue (website doesn't read this yet)

# Recording state
recording_active = threading.Event()
current_temp_path = None
current_temp_fh = None
capture_start_ts = None
capture_filename = None  # final compressed filename (.emgz)

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, 'r') as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def add_to_history(filename, timestamp, duration=None, sample_rate=None, num_samples=None):
    history = load_history()
    entry = {
        'filename': filename,
        'timestamp': timestamp,
        'size': os.path.getsize(os.path.join(DATA_DIR, filename)) if os.path.exists(os.path.join(DATA_DIR, filename)) else 0
    }
    if duration is not None:
        entry['duration'] = round(duration, 1)
    if sample_rate is not None:
        entry['sample_rate'] = sample_rate
    if num_samples is not None:
        entry['num_samples'] = num_samples
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

class EMGUDPHandler(socketserver.BaseRequestHandler):
    """Data port (8888) only. Every datagram now starts with a 13-byte header
    (type, session_id, seq, esp micros()) added by the handshake work - the
    payload after the header is byte-identical to the old 'signal,envelop\\n'
    lines, so everything downstream (SSE/recording/website) is unchanged.
    Packets are rejected unless the session is actively 'streaming' and the
    session_id matches - this is what makes pre-ACK data get dropped."""
    def handle(self):
        global last_packet_time
        raw = self.request[0]
        if len(raw) < PKT_HEADER_LEN:
            return
        pkt_type, pkt_session_id, seq, esp_micros = struct.unpack('!BIII', raw[:PKT_HEADER_LEN])
        payload = raw[PKT_HEADER_LEN:]

        with session_lock:
            if session_state != 'streaming' or pkt_session_id != session_id:
                return  # data before ACK / from a stale session is dropped
            expected = expected_seq.get(pkt_type)
            if expected is not None and seq > expected:
                packets_lost[pkt_type] = packets_lost.get(pkt_type, 0) + (seq - expected)
            expected_seq[pkt_type] = max(seq + 1, expected or 0)

        if pkt_type == PKT_TYPE_IMU:
            for line in payload.decode(errors='ignore').splitlines():
                if line.strip():
                    imu_queue.put(line.strip())
            return

        # EMG path - unchanged from here down.
        for line in payload.decode(errors='ignore').splitlines():
            line = line.strip()
            if not line:
                continue
            last_packet_time = time.time()
            data_queue.put(line)
            if recording_active.is_set() and current_temp_fh is not None:
                parts = line.split(',')
                if len(parts) == 2:
                    try:
                        signal, envelop = int(parts[0]), int(parts[1])
                        current_temp_fh.write(struct.pack('<hh', signal, envelop))
                    except ValueError:
                        pass

def udp_reader():
    print(f"UDP listener on 0.0.0.0:{UDP_PORT} (ESP32 HOST_IP should be {get_local_ip()})")
    with socketserver.ThreadingUDPServer(('0.0.0.0', UDP_PORT), EMGUDPHandler) as server:
        server.serve_forever()

class ControlUDPHandler(socketserver.BaseRequestHandler):
    """Control port (8889). Plain comma-separated text messages implementing
    the three-way handshake: HELLO -> OFFER -> ACK, plus HEARTBEAT and STOP.
    See Major_iot/IMU_HANDSHAKE_NOTES.md for the full protocol writeup."""
    def handle(self):
        global session_state, session_id, esp_addr, last_heartbeat_time
        global session_epoch_host_ts, session_epoch_esp_micros
        global calibration_ok, calibration_reason, expected_seq, packets_lost

        msg = self.request[0].decode(errors='ignore').strip()
        if not msg:
            return
        parts = msg.split(',')
        msg_type = parts[0]
        sock = self.request[1]

        with session_lock:
            if msg_type == 'HELLO':
                esp_addr = self.client_address
                if session_state == 'armed':
                    offer = f"OFFER,{session_id},{time.time()}"
                    sock.sendto(offer.encode(), esp_addr)
                # If idle: no operator has armed yet, ignore (device keeps re-HELLOing).
                # If streaming: we already have a live session with this device, ignore.

            elif msg_type == 'ACK' and len(parts) >= 3:
                try:
                    acked_sid = int(parts[1])
                    esp_micros = int(parts[2])
                except ValueError:
                    return
                if session_state == 'armed' and acked_sid == session_id:
                    session_state = 'streaming'
                    session_epoch_host_ts = time.time()
                    session_epoch_esp_micros = esp_micros
                    last_heartbeat_time = time.time()
                    expected_seq = {}
                    packets_lost = {PKT_TYPE_EMG: 0, PKT_TYPE_IMU: 0}

            elif msg_type == 'HEARTBEAT' and len(parts) >= 3:
                try:
                    hb_sid = int(parts[1])
                except ValueError:
                    return
                if session_state == 'streaming' and hb_sid == session_id:
                    last_heartbeat_time = time.time()
                    sock.sendto(f"HEARTBEAT_ACK,{session_id}".encode(), self.client_address)

            elif msg_type == 'CAL' and len(parts) >= 3:
                try:
                    cal_sid = int(parts[1])
                except ValueError:
                    return
                if cal_sid == session_id:
                    calibration_ok = (parts[2] == 'OK')
                    calibration_reason = parts[3] if len(parts) >= 4 else None

def control_reader():
    print(f"Control (handshake) listener on 0.0.0.0:{CONTROL_PORT}")
    with socketserver.ThreadingUDPServer(('0.0.0.0', CONTROL_PORT), ControlUDPHandler) as server:
        server.serve_forever()

def session_watchdog():
    """If we're 'streaming' but heard nothing on the control channel for too
    long, the ESP (or the link) is gone - drop back to idle so the operator
    can re-arm rather than the UI silently showing a stale 'streaming' state."""
    global session_state
    while not stop_event.is_set():
        time.sleep(1)
        with session_lock:
            if session_state == 'streaming' and last_heartbeat_time is not None:
                if time.time() - last_heartbeat_time > HEARTBEAT_TIMEOUT_S:
                    session_state = 'idle'


def udp_watchdog():
    """Console-only diagnostic loop. Since there's no serial monitor on the
    ESP32 side, this is the fastest way to see whether packets are arriving
    at all, without touching the website."""
    last_seen = None
    while not stop_event.is_set():
        time.sleep(2)
        if last_packet_time is None:
            print("[watchdog] No UDP packets received yet. Check: ESP32 powered + WiFi connected "
                  "(look for the 3-blink pattern), HOST_IP in firmware matches this machine's IP, "
                  "firewall allows inbound UDP 8888.")
        elif last_packet_time != last_seen:
            print(f"[watchdog] Receiving data OK.")
            last_seen = last_packet_time
        elif time.time() - last_packet_time > 3:
            print(f"[watchdog] Data stopped ({time.time() - last_packet_time:.1f}s since last packet). "
                  f"Check ESP32 power / WiFi / battery voltage.")

def event_stream():
    """Generator for SSE that yields lines from the queue."""
    while True:
        try:
            line = data_queue.get(timeout=0.5)
            yield f"data: {line}\n\n"
        except queue.Empty:
            pass

def compress_capture_file(raw_path, sample_rate):
    with open(raw_path, 'rb') as f:
        raw_bytes = f.read()
    compressed = gzip.compress(raw_bytes)
    timestamp = datetime.fromtimestamp(capture_start_ts).strftime('%Y%m%d_%H%M%S')
    final_filename = f"emg_{timestamp}.emgz"
    final_path = os.path.join(DATA_DIR, final_filename)
    header = struct.pack('<4sHH', b'EMG1', 1, sample_rate)
    with open(final_path, 'wb') as f:
        f.write(header + compressed)
    os.remove(raw_path)
    num_samples = len(raw_bytes) // 4
    return final_filename, num_samples

def _start_recording_locked():
    global current_temp_path, current_temp_fh, capture_start_ts, capture_filename
    if recording_active.is_set():
        return False
    while not data_queue.empty():
        try:
            data_queue.get_nowait()
        except queue.Empty:
            break
    capture_start_ts = time.time()
    current_temp_path = os.path.join(DATA_DIR, f"_tmp_{int(capture_start_ts)}.raw")
    current_temp_fh = open(current_temp_path, 'wb')
    recording_active.set()
    return True

def _stop_recording_locked():
    global current_temp_path, current_temp_fh, capture_start_ts, capture_filename
    if not recording_active.is_set():
        return None
    recording_active.clear()
    raw_path = current_temp_path
    start_ts = capture_start_ts
    current_temp_fh.close()
    current_temp_fh = None
    current_temp_path = None
    final_filename, num_samples = compress_capture_file(raw_path, SAMPLE_RATE)
    duration = time.time() - start_ts
    capture_filename = final_filename
    add_to_history(
        final_filename,
        datetime.fromtimestamp(start_ts).isoformat(),
        duration,
        SAMPLE_RATE,
        num_samples
    )
    return final_filename

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

def start_ingest_thread_at_boot():
    """Called once when the server process starts. UDP listener + watchdog run forever."""
    global ingest_thread, watchdog_thread, control_thread
    with thread_lock:
        if ingest_thread is None or not ingest_thread.is_alive():
            stop_event.clear()
            ingest_thread = threading.Thread(target=udp_reader, daemon=True)
            ingest_thread.start()
        if watchdog_thread is None or not watchdog_thread.is_alive():
            watchdog_thread = threading.Thread(target=udp_watchdog, daemon=True)
            watchdog_thread.start()
        if control_thread is None or not control_thread.is_alive():
            control_thread = threading.Thread(target=control_reader, daemon=True)
            control_thread.start()
        threading.Thread(target=session_watchdog, daemon=True).start()

@app.route('/api/arm', methods=['POST'])
def arm():
    """Operator-triggered: start responding to the ESP's HELLO broadcasts with
    an OFFER. This is how the server re-arms without an ESP reboot - the ESP
    keeps broadcasting HELLO whenever it isn't streaming, so the very next one
    gets an OFFER once we're armed."""
    global session_state, session_id
    with session_lock:
        if session_state != 'idle':
            return jsonify({'error': f'Cannot arm from state {session_state}'}), 400
        session_id = (session_id + 1) & 0xFFFFFFFF
        session_state = 'armed'
    return jsonify({'status': 'armed', 'session_id': session_id})

@app.route('/api/disarm', methods=['POST'])
def disarm():
    """Operator-triggered STOP. Works from 'armed' (nobody connected yet) or
    'streaming' (tell the ESP to stop sending)."""
    global session_state
    with session_lock:
        if session_state == 'idle':
            return jsonify({'error': 'Already idle'}), 400
        if session_state == 'streaming' and esp_addr is not None:
            stop_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                stop_sock.sendto(f"STOP,{session_id}".encode(), esp_addr)
            finally:
                stop_sock.close()
        session_state = 'idle'
    return jsonify({'status': 'idle'})

@app.route('/api/start_capture', methods=['POST'])
def start_capture():
    with thread_lock:
        started = _start_recording_locked()
    if not started:
        return jsonify({'error': 'Recording already active'}), 400
    return jsonify({'status': 'started'})

@app.route('/api/stop_recording', methods=['POST'])
def stop_recording():
    with thread_lock:
        final_filename = _stop_recording_locked()
    if final_filename is None:
        return jsonify({'error': 'No recording in progress'}), 400
    return jsonify({'status': 'stopped', 'filename': final_filename})

@app.route('/api/status')
def status():
    udp_active = last_packet_time is not None and (time.time() - last_packet_time) < 2
    with session_lock:
        resp = {
            'udp_active': udp_active,
            'last_packet_seconds_ago': (time.time() - last_packet_time) if last_packet_time else None,
            'recording_active': recording_active.is_set(),
            'server_ip': get_local_ip(),
            # --- handshake / session fields, additive - existing fields above unchanged ---
            'session_state': session_state,       # idle | armed | streaming
            'session_id': session_id,
            'esp_ip': esp_addr[0] if esp_addr else None,
            'calibration_ok': calibration_ok,
            'calibration_reason': calibration_reason,
            'packets_lost': dict(packets_lost),
            'last_heartbeat_seconds_ago': (time.time() - last_heartbeat_time) if last_heartbeat_time else None,
            'session_epoch_host_ts': session_epoch_host_ts,
            'session_epoch_esp_micros': session_epoch_esp_micros,
        }
    return jsonify(resp)

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

@app.route('/api/recording/<filename>')
def get_recording(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    with open(safe_path, 'rb') as f:
        header = f.read(8)
    if header[:4] == b'EMG1':
        version, sample_rate = struct.unpack('<HH', header[4:8])
        compressed = f.read()
        raw_bytes = gzip.decompress(compressed)
        return Response(raw_bytes, mimetype='application/octet-stream')
    else:
        return send_from_directory(DATA_DIR, filename, as_attachment=True)

@app.route('/api/recording_meta/<filename>')
def get_recording_meta(filename):
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    history = load_history()
    entry = next((e for e in history if e['filename'] == filename), None)
    if entry:
        sample_rate = entry.get('sample_rate', SAMPLE_RATE)
        num_samples = entry.get('num_samples', entry.get('size', 0) // 4)
        duration = entry.get('duration', num_samples / sample_rate if sample_rate else 0)
        return jsonify({
            'sample_rate': sample_rate,
            'num_samples': num_samples,
            'duration_seconds': duration,
            'timestamp': entry.get('timestamp', '')
        })
    with open(safe_path, 'rb') as f:
        header = f.read(8)
    if header[:4] == b'EMG1':
        version, sample_rate = struct.unpack('<HH', header[4:8])
        f.seek(0, 2)
        file_size = f.tell()
        num_samples = entry.get('num_samples', 0) if entry else 0
        if num_samples == 0:
            compressed_size = file_size - 8
            num_samples = int(compressed_size * 3 / 4)
        duration = num_samples / sample_rate if sample_rate else 0
        return jsonify({
            'sample_rate': sample_rate,
            'num_samples': num_samples,
            'duration_seconds': duration,
            'timestamp': ''
        })
    file_size = os.path.getsize(safe_path)
    num_samples = file_size // 4
    duration = num_samples / SAMPLE_RATE
    return jsonify({
        'sample_rate': SAMPLE_RATE,
        'num_samples': num_samples,
        'duration_seconds': duration,
        'timestamp': ''
    })

@app.route('/api/preview/<filename>')
def get_preview(filename):
    points = int(request.args.get('points', 64))
    safe_path = safe_join(DATA_DIR, filename)
    if safe_path is None or not os.path.exists(safe_path):
        return jsonify({'error': 'File not found'}), 404
    with open(safe_path, 'rb') as f:
        header = f.read(8)
    if header[:4] == b'EMG1':
        compressed = f.read()
        raw_bytes = gzip.decompress(compressed)
    else:
        raw_bytes = header + f.read()
    import array
    data = array.array('h', raw_bytes)
    if len(data) < 2:
        return jsonify({'points': [0] * points})
    signal = data[0::2]
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
    base = os.path.splitext(filename)[0]
    return os.path.join(DATA_DIR, f"{base}.annotations.json")

def load_annotations(filename):
    path = _annotations_path(filename)
    if not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        return json.load(f)

def save_annotations(filename, annotations):
    path = _annotations_path(filename)
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

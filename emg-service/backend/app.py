import os
import sys
import threading
import time
import json
import queue
import struct
import serial
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request, Response, stream_with_context
from werkzeug.utils import safe_join

app = Flask(__name__, static_folder='../website', static_url_path='/')

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
BIN_FILE = os.path.join(DATA_DIR, 'emg_capture.bin')  # legacy path, kept for /api/snapshot only
HISTORY_FILE = os.path.join(DATA_DIR, 'history.json')
SERIAL_PORT = '/dev/ttyUSB0'   # tried first; falls back to the list below if this fails
FALLBACK_PORTS = ['/dev/ttyUSB0', '/dev/ttyUSB1', '/dev/ttyACM0', '/dev/ttyACM1']
BAUD = 115200

# Global state
serial_thread = None
serial_ser = None
serial_error = None  # last serial connection error, surfaced via /api/status
data_queue = queue.Queue()  # holds lines to stream
thread_lock = threading.Lock()
stop_event = threading.Event()

# Per-session tracking, so each recording becomes its own history entry
# instead of everything piling into one shared bin file forever.
capture_filename = None   # basename of this session's .bin file
capture_start_ts = None   # epoch seconds when this session started

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, 'r') as f:
        return json.load(f)

def save_history(history):
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)

def add_to_history(filename, timestamp, duration=None):
    history = load_history()
    entry = {
        'filename': filename,
        'timestamp': timestamp,
        'size': os.path.getsize(os.path.join(DATA_DIR, filename)) if os.path.exists(os.path.join(DATA_DIR, filename)) else 0
    }
    if duration is not None:
        entry['duration'] = round(duration, 1)  # seconds
    history.append(entry)
    save_history(history)

def serial_reader(bin_path):
    """Background thread to read from serial port, log binary data, and push lines to queue.
    Writes to bin_path, a fresh file created for this recording session only."""
    global serial_ser, serial_error
    ser = None
    tried = []
    ports_to_try = [SERIAL_PORT] + [p for p in FALLBACK_PORTS if p != SERIAL_PORT]
    for port in ports_to_try:
        try:
            ser = serial.Serial(port, BAUD, timeout=1)
            print(f"Opened serial port {port} at {BAUD} baud")
            serial_error = None
            break
        except serial.SerialException as e:
            tried.append(f"{port}: {e}")
    if ser is None:
        serial_error = "Could not open any serial port. Tried: " + " | ".join(tried)
        print(serial_error)
        return
    serial_ser = ser
    with open(bin_path, 'wb') as bin_file:
        while not stop_event.is_set():
            try:
                raw = ser.readline()
                if not raw:
                    continue
                line = raw.decode(errors='ignore').strip()
                if not line:
                    continue
                # Push to queue for SSE
                data_queue.put(line)
                # Parse and pack to binary
                parts = line.split(',')
                if len(parts) != 2:
                    continue
                try:
                    signal = int(parts[0])
                    envelop = int(parts[1])
                except ValueError:
                    continue
                bin_file.write(struct.pack('<hh', signal, envelop))
                # Optional: flush every 5000 samples
                # (we could keep a counter)
            except (serial.SerialException, OSError) as e:
                print(f"Serial error: {e}")
                break
        ser.close()
        print("Serial thread ended.")
    serial_ser = None

def event_stream():
    """Generator for SSE that yields lines from the queue."""
    while True:
        try:
            # Block until a line is available, but also check for client disconnect
            line = data_queue.get(timeout=0.5)
            yield f"data: {line}\n\n"
        except queue.Empty:
            # If the client is still connected, continue; if not, break
            # In a real implementation, we'd need to detect flask request context.
            # For simplicity, we just keep looping.
            pass

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

def _start_capture_locked():
    """Actually start the capture thread. Caller must hold thread_lock."""
    global serial_thread, stop_event, capture_filename, capture_start_ts
    if serial_thread is not None and serial_thread.is_alive():
        return False
    while not data_queue.empty():
        try:
            data_queue.get_nowait()
        except queue.Empty:
            break
    stop_event.clear()
    capture_start_ts = time.time()
    capture_filename = f"emg_{datetime.fromtimestamp(capture_start_ts).strftime('%Y%m%d_%H%M%S')}.bin"
    bin_path = os.path.join(DATA_DIR, capture_filename)
    serial_thread = threading.Thread(target=serial_reader, args=(bin_path,), daemon=True)
    serial_thread.start()
    return True

def start_capture_at_boot():
    """Called once when the server process starts, so recording/streaming
    works immediately without the frontend having to remember to POST
    /api/start_capture first."""
    with thread_lock:
        _start_capture_locked()

@app.route('/api/start_capture', methods=['POST'])
def start_capture():
    with thread_lock:
        started = _start_capture_locked()
    if not started:
        return jsonify({'error': 'Capture already running'}), 400
    return jsonify({'status': 'started'})

@app.route('/api/stop_capture', methods=['POST'])
def stop_capture():
    global serial_thread, stop_event, capture_filename, capture_start_ts
    with thread_lock:
        if serial_thread is None or not serial_thread.is_alive():
            return jsonify({'error': 'Capture not running'}), 400
        stop_event.set()
        # Wait a bit for thread to finish
        serial_thread.join(timeout=2.0)
        serial_thread = None
        fname, start_ts = capture_filename, capture_start_ts
        capture_filename, capture_start_ts = None, None

    # Only log a history entry if the session actually captured data
    # (e.g. skip it if the serial port never opened, so we don't litter
    # history with empty/failed sessions).
    if fname and start_ts:
        fpath = os.path.join(DATA_DIR, fname)
        if os.path.exists(fpath) and os.path.getsize(fpath) > 0:
            duration = time.time() - start_ts
            add_to_history(fname, datetime.fromtimestamp(start_ts).isoformat(), duration)

    return jsonify({'status': 'stopped'})

@app.route('/api/status')
def status():
    with thread_lock:
        running = serial_thread is not None and serial_thread.is_alive()
    return jsonify({'capture_running': running, 'error': serial_error})


@app.route('/api/live-value')
def live_value():
    """Return the most recent EMG reading as JSON.
    Reads from the in-process data_queue (non-blocking peek).
    """
    try:
        # Peek at the last item in queue without removing it
        # Queue doesn't support peek, so we drain and re-put (race-condition tolerant for this use)
        items = []
        while not data_queue.empty():
            items.append(data_queue.get_nowait())
        latest = items[-1] if items else None
        # Put them back
        for item in items:
            data_queue.put_nowait(item)
    except queue.Empty:
        latest = None

    if latest is None:
        return jsonify({'signal': None, 'envelop': None, 'timestamp': None}), 204

    try:
        signal_str, envelop_str = latest.split(',')
        return jsonify({
            'signal': int(signal_str),
            'envelop': int(envelop_str),
            'timestamp': time.time()
        })
    except (ValueError, IndexError):
        return jsonify({'signal': None, 'envelop': None, 'timestamp': None}), 204

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
    return send_from_directory(DATA_DIR, filename, as_attachment=True)

@app.route('/api/save_history', methods=['POST'])
def save_history_endpoint():
    data = request.get_json()
    filename = data.get('filename')
    timestamp = data.get('timestamp')
    if not filename or not timestamp:
        return jsonify({'error': 'Missing filename or timestamp'}), 400
    add_to_history(filename, timestamp)
    return jsonify({'status': 'saved'})

@app.route('/api/snapshot', methods=['POST'])
def snapshot():
    """Manual copy of the legacy shared bin file, if anything still uses it.
    Normal recordings no longer need this -- stop_capture logs history itself."""
    if not os.path.exists(BIN_FILE):
        return jsonify({'error': 'No data file found'}), 404
    now = datetime.now()
    filename = f"emg_{now.strftime('%Y%m%d_%H%M%S')}.bin"
    dest = os.path.join(DATA_DIR, filename)
    import shutil
    shutil.copy2(BIN_FILE, dest)
    add_to_history(filename, now.isoformat())
    return jsonify({'filename': filename, 'timestamp': now.isoformat()})

if __name__ == '__main__':
    # Ensure history file exists
    if not os.path.exists(HISTORY_FILE):
        save_history([])
    # debug=True makes Werkzeug fork a reloader parent + child process.
    # Only start the serial thread in the actual running child (or when
    # the reloader is off), otherwise the port gets opened twice.
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        start_capture_at_boot()
    app.run()

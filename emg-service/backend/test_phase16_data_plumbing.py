#!/usr/bin/env python3
"""Phase 16 tests: data plumbing invariants (Q49 / D31).

    ../venv/bin/python test_phase16_data_plumbing.py

Two invariants only, per docs/13 §2.3 (data integrity, data flow). Both are
expected to FAIL until a later dev pass implements them -- this file writes
no application code.

Every test redirects DATA_DIR to a temp directory; nothing here touches the
real recordings or history.json in the repo root.
"""

import importlib
import os
import sys
import tempfile

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


def reset_state(tmpdir):
    app.DATA_DIR = tmpdir
    app.HISTORY_FILE = os.path.join(tmpdir, 'history.json')
    app.save_history([])
    app.recording_active.clear()
    app.current_temp_fh = None
    app.current_temp_path = None
    app.capture_start_ts = None


def main():
    global CURRENT
    print("PHASE 16: data plumbing (EMG_DATA_DIR persistence, patient_user_id linkage)")

    # ---------------------------------------------- INVARIANT 1: EMG_DATA_DIR
    CURRENT = "DATA_DIR follows EMG_DATA_DIR when set"
    with tempfile.TemporaryDirectory() as tmp:
        old_env = os.environ.get('EMG_DATA_DIR')
        try:
            os.environ['EMG_DATA_DIR'] = tmp
            importlib.reload(app)
            check_eq(os.path.abspath(app.DATA_DIR), os.path.abspath(tmp),
                      "app.DATA_DIR must resolve to EMG_DATA_DIR when the env var is set "
                      "(a rebuilt container must find the same recordings)")
            check_eq(os.path.dirname(os.path.abspath(app.HISTORY_FILE)), os.path.abspath(tmp),
                      "HISTORY_FILE must be derived from the env-var DATA_DIR, not the legacy path "
                      "-- otherwise history.json itself is lost on rebuild")
        finally:
            if old_env is None:
                os.environ.pop('EMG_DATA_DIR', None)
            else:
                os.environ['EMG_DATA_DIR'] = old_env

    CURRENT = "DATA_DIR falls back to the legacy value when EMG_DATA_DIR is unset"
    os.environ.pop('EMG_DATA_DIR', None)
    importlib.reload(app)
    legacy = os.path.join(os.path.dirname(os.path.abspath(app.__file__)), '..')
    check_eq(os.path.abspath(app.DATA_DIR), os.path.abspath(legacy),
              "with no env var, DATA_DIR must still be the current legacy path (no behaviour change)")

    # ------------------------------------------ INVARIANT 2: patient_user_id
    CURRENT = "a new recording's history entry carries patient_user_id"
    with tempfile.TemporaryDirectory() as tmp:
        reset_state(tmp)
        app.app.config['TESTING'] = True
        client = app.app.test_client()

        r = client.post('/api/start_capture', json={'patient_user_id': 'patient-42'})
        check_eq(r.status_code, 200, "start_capture accepts a patient_user_id")

        r = client.post('/api/stop_recording')
        check_eq(r.status_code, 200, "stop_recording succeeds")
        fname = r.get_json().get('filename', '') if r.status_code == 200 else ''

        hist = app.load_history()
        entry = next((e for e in hist if e.get('filename') == fname), None)
        check(entry is not None, "the finalised recording is listed in history.json")
        if entry:
            check_eq(entry.get('patient_user_id'), 'patient-42',
                      "the history entry must carry the patient_user_id supplied at capture start "
                      "(D31) so a new recording is attributable to a patient")

    # P2.3: a capture started with BOTH patient_user_id and session_id must
    # carry session_id through to the finalised history.json entry too (O4).
    CURRENT = "a new recording's history entry carries session_id"
    with tempfile.TemporaryDirectory() as tmp:
        reset_state(tmp)
        app.app.config['TESTING'] = True
        client = app.app.test_client()

        r = client.post('/api/start_capture',
                         json={'patient_user_id': 'patient-42', 'session_id': 's_abc123'})
        check_eq(r.status_code, 200, "start_capture accepts a session_id alongside patient_user_id")

        r = client.post('/api/stop_recording')
        check_eq(r.status_code, 200, "stop_recording succeeds")
        fname = r.get_json().get('filename', '') if r.status_code == 200 else ''

        hist = app.load_history()
        entry = next((e for e in hist if e.get('filename') == fname), None)
        check(entry is not None, "the finalised recording is listed in history.json")
        if entry:
            check_eq(entry.get('session_id'), 's_abc123',
                      "the history entry must carry the session_id supplied at capture start "
                      "(O4) so a recording made through a real session is attributable to that "
                      "session, not just to a patient")

    print()
    print(f"{CHECKS - FAILURES}/{CHECKS} checks passed" + (f"  ({FAILURES} FAILED)" if FAILURES else ""))
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())

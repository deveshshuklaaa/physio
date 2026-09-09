#!/usr/bin/env python3
"""
Loopback test for the three-way handshake state machine added to backend/app.py.

Drives the REAL server code (imports backend.app, starts its actual UDP
listener threads) against a small fake-ESP UDP client over 127.0.0.1. Proves:
  1. idle -> armed -> streaming -> (STOP) -> idle
  2. EMG data sent before ACK is rejected (never reaches data_queue)
  3. sequence gaps are detected and counted

Do NOT run this while a real app.py is already bound to 8888/8889 on this
machine - it starts its own listeners on those same ports.

Usage: python3 test_handshake.py
"""
import os
import socket
import struct
import sys
import time

# Staged copy: the server lives at ../backend/emg_imu_app.py relative to this
# test, not at ./backend/app.py as it did in the original IoT project tree.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))
import emg_imu_app as srv  # noqa: E402

HOST = '127.0.0.1'


def send_data_packet(sock, pkt_type, session_id, seq, payload=b'1,2\n'):
    header = struct.pack('!BIII', pkt_type, session_id, seq, 12345)
    sock.sendto(header + payload, (HOST, srv.UDP_PORT))


def drain_data_queue():
    lines = []
    try:
        while True:
            lines.append(srv.data_queue.get_nowait())
    except Exception:
        pass
    return lines


def wait_until(predicate, timeout=2.0, interval=0.02):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if predicate():
            return True
        time.sleep(interval)
    return False


def main():
    srv.start_ingest_thread_at_boot()
    time.sleep(0.2)  # let listener threads bind

    esp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    esp.bind((HOST, 0))
    esp.settimeout(2.0)

    client = srv.app.test_client()

    # ---- 1. Reject data before ACK (server starts idle) ----
    assert srv.session_state == 'idle', f"expected idle, got {srv.session_state}"
    send_data_packet(esp, srv.PKT_TYPE_EMG, 0, 0)
    time.sleep(0.2)
    assert drain_data_queue() == [], "data before ACK must be rejected"
    print("[ok] data before ACK rejected")

    # ---- 2. idle -> armed ----
    resp = client.post('/api/arm')
    assert resp.status_code == 200, resp.get_json()
    body = resp.get_json()
    sid = body['session_id']
    assert srv.session_state == 'armed'
    print(f"[ok] idle -> armed (session_id={sid})")

    # Still armed, not streaming: data must still be rejected.
    send_data_packet(esp, srv.PKT_TYPE_EMG, sid, 0)
    time.sleep(0.2)
    assert drain_data_queue() == [], "data while only armed (pre-ACK) must be rejected"
    print("[ok] data while armed-but-not-ACKed still rejected")

    # ---- 3. HELLO -> OFFER ----
    esp.sendto(b"HELLO,fake-esp-01", (HOST, srv.CONTROL_PORT))
    data, _ = esp.recvfrom(256)
    msg = data.decode()
    assert msg.startswith("OFFER,"), msg
    offered_sid = int(msg.split(',')[1])
    assert offered_sid == sid, (offered_sid, sid)
    print(f"[ok] HELLO -> OFFER,{offered_sid}")

    # ---- 4. ACK -> streaming ----
    esp.sendto(f"ACK,{sid},1000000".encode(), (HOST, srv.CONTROL_PORT))
    assert wait_until(lambda: srv.session_state == 'streaming'), "did not reach streaming"
    print("[ok] ACK -> streaming")

    # ---- 5. data now accepted, with a deliberate sequence gap (0, 1, skip 2, 3) ----
    send_data_packet(esp, srv.PKT_TYPE_EMG, sid, 0, b'10,20\n')
    send_data_packet(esp, srv.PKT_TYPE_EMG, sid, 1, b'11,21\n')
    send_data_packet(esp, srv.PKT_TYPE_EMG, sid, 3, b'13,23\n')  # seq 2 missing
    time.sleep(0.2)
    lines = drain_data_queue()
    assert lines == ['10,20', '11,21', '13,23'], lines
    assert srv.packets_lost[srv.PKT_TYPE_EMG] == 1, srv.packets_lost
    print(f"[ok] streaming data accepted, gap detected: packets_lost={srv.packets_lost}")

    # IMU packet on the same session goes to imu_queue, not data_queue.
    send_data_packet(esp, srv.PKT_TYPE_IMU, sid, 0, b'0.0,0.0,1.0,0,0,0,0.0,0.0\n')
    time.sleep(0.2)
    assert not srv.imu_queue.empty(), "IMU packet should land in imu_queue"
    srv.imu_queue.get_nowait()
    assert drain_data_queue() == [], "IMU packet must not leak into EMG data_queue"
    print("[ok] IMU/EMG streams kept separate")

    # ---- 6. HEARTBEAT / HEARTBEAT_ACK ----
    esp.sendto(f"HEARTBEAT,{sid},0".encode(), (HOST, srv.CONTROL_PORT))
    data, _ = esp.recvfrom(256)
    assert data.decode() == f"HEARTBEAT_ACK,{sid}", data
    print("[ok] HEARTBEAT -> HEARTBEAT_ACK")

    # ---- 7. disarm -> STOP sent, back to idle ----
    resp = client.post('/api/disarm')
    assert resp.status_code == 200, resp.get_json()
    data, _ = esp.recvfrom(256)
    assert data.decode() == f"STOP,{sid}", data
    assert srv.session_state == 'idle'
    print("[ok] disarm -> STOP -> idle")

    # ---- 8. session-timeout watchdog: streaming with no heartbeat -> idle ----
    resp = client.post('/api/arm')
    sid2 = resp.get_json()['session_id']
    esp.sendto(b"HELLO,fake-esp-01", (HOST, srv.CONTROL_PORT))
    esp.recvfrom(256)  # OFFER
    esp.sendto(f"ACK,{sid2},2000000".encode(), (HOST, srv.CONTROL_PORT))
    assert wait_until(lambda: srv.session_state == 'streaming')
    srv.HEARTBEAT_TIMEOUT_S = 0.5  # speed up the watchdog for the test
    assert wait_until(lambda: srv.session_state == 'idle', timeout=3.0), \
        "session_watchdog did not drop a heartbeat-less session back to idle"
    print("[ok] missed-heartbeat watchdog drops streaming -> idle")

    print("\nALL HANDSHAKE TESTS PASSED")


if __name__ == '__main__':
    main()

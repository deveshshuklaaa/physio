#!/usr/bin/env python3
"""
EMG serial capture + live-plot passthrough.

Reads real Arduino Nano serial port, does two things per line:
  1. Forwards raw CSV text to a virtual serial port -> point Arduino IDE
     Serial Plotter at that virtual port for live view.
  2. Parses "signal,envelop" and packs to binary (int16, int16) in a .bin
     file for later review in Python.

Usage:
    pip install pyserial --break-system-packages
    python3 emg_serial_capture.py
"""

import serial
import pty
import os
import struct
import sys

REAL_PORT = '/dev/ttyUSB0'   # change to your Nano's port (check `ls /dev/ttyUSB*` or `/dev/ttyACM*`)
BAUD = 115200
BIN_FILE = 'data/emg_capture.bin'

def main():
    try:
        ser = serial.Serial(REAL_PORT, BAUD, timeout=1)
    except serial.SerialException as e:
        print(f"Cannot open {REAL_PORT}: {e}")
        sys.exit(1)

    master, slave = pty.openpty()
    slave_name = os.ttyname(slave)
    print(f"Point Arduino IDE Serial Plotter to: {slave_name}")
    print(f"Logging binary samples to: {BIN_FILE}")
    print("Ctrl+C to stop.\n")

    sample_count = 0
    try:
        with open(BIN_FILE, 'ab') as f:
            while True:
                raw = ser.readline()
                if not raw:
                    continue
                line = raw.decode(errors='ignore').strip()
                if not line:
                    continue

                # forward to virtual port for live Plotter view
                try:
                    os.write(master, (line + '\n').encode())
                except OSError:
                    pass  # plotter not connected yet, ignore

                # parse and pack for storage
                parts = line.split(',')
                if len(parts) != 2:
                    continue
                try:
                    signal = int(parts[0])
                    envelop = int(parts[1])
                except ValueError:
                    continue

                f.write(struct.pack('<hh', signal, envelop))
                sample_count += 1

                if sample_count % 5000 == 0:
                    f.flush()
                    print(f"{sample_count} samples captured...")

    except KeyboardInterrupt:
        print(f"\nStopped. Total samples: {sample_count}")
    finally:
        ser.close()
        os.close(master)
        os.close(slave)

if __name__ == '__main__':
    main()

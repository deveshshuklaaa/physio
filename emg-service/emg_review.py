#!/usr/bin/env python3
"""
Load emg_capture.bin and plot signal + envelop for review.

Usage:
    pip install matplotlib numpy --break-system-packages
    python3 emg_review.py
"""

import struct
import numpy as np
import matplotlib.pyplot as plt

BIN_FILE = 'data/emg_capture.bin'
SAMPLE_RATE = 500  # must match Arduino sketch's SAMPLE_RATE

def load(path):
    signals, envelops = [], []
    with open(path, 'rb') as f:
        data = f.read()
    count = len(data) // 4  # 2 int16 = 4 bytes per sample
    for i in range(count):
        s, e = struct.unpack_from('<hh', data, i * 4)
        signals.append(s)
        envelops.append(e)
    return np.array(signals), np.array(envelops)

def main():
    signal, envelop = load(BIN_FILE)
    t = np.arange(len(signal)) / SAMPLE_RATE

    fig, ax = plt.subplots(2, 1, figsize=(12, 6), sharex=True)
    ax[0].plot(t, signal, linewidth=0.7)
    ax[0].set_title('Filtered EMG Signal')
    ax[0].set_ylabel('Amplitude')

    ax[1].plot(t, envelop, color='orange', linewidth=1)
    ax[1].set_title('Envelop')
    ax[1].set_xlabel('Time (s)')
    ax[1].set_ylabel('Amplitude')

    plt.tight_layout()
    plt.show()

if __name__ == '__main__':
    main()

# EMG Viewer WebApp

This repository contains a web-based EMG viewer built with Stitch design system. It provides:
- Live serial plotter from Arduino Nano (via virtual serial port)
- Recording of binary data for later review
- History of recordings with timestamps
- Playback screen to review recorded signals

## Files

- `emg_serial_capture.py`: Python script to read serial from Arduino, forward to virtual port for live plotting, and log binary samples.
- `emg_review.py`: Python script to load binary file and plot signals using matplotlib.
- Stitch project: `EMG Viewer` (project ID: 16155328040966390994) containing three screens:
  1. **EMG Live Monitor** – real-time chart with History button (replaces Gain/Record).
  2. **EMG Signal Playback** – interactive replay of recorded CSV (or binary) data.
  3. **Recording History** – list of saved recordings with timestamps and thumbnails.

## Setup

1. Install Python dependencies:
   ```bash
   pip install pyserial matplotlib numpy --break-system-packages
   ```
2. Connect Arduino Nano to `/dev/ttyUSB0` (or edit `REAL_PORT` in `emg_serial_capture.py`).
3. Run the capture script:
   ```bash
   python3 emg_serial_capture.py
   ```
   It creates a virtual serial port (printed) for the Arduino IDE Serial Plotter to view live signal, and appends binary samples to `emg_capture.bin`.
4. To review recordings, run:
   ```bash
   python3 emg_review.py
   ```
5. For the webapp, deploy the Stitch screens (HTML) to any static web host. The screens are already designed; you can download the HTML from the provided URLs:
   - Live Monitor: <https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzZhZDEzMTA0ZmEyMjRhMTk4ZTU0OTJiODNjZmQ0NWU2EgsSBxCv3KnWwQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjE1NTMyODA0MDk2NjM5MDk5NA&filename=&opi=96797242>
   - Playback: <https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIwYThlZjFiMzJjYTRhMGY4MDcyYTYzMjJlODhjMmU2EgsSBxCv3KnWwQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjE1NTMyODA0MDk2NjM5MDk5NA&filename=&opi=96797242>
   - History: <https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzQwYzYxNmU4MTVmNDQxM2JiOGQ1MTRhMDQwYzM0MTYxEgsSBxCv3KnWwQkYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjE1NTMyODA0MDk2NjM5MDk5NA&filename=&opi=96797242>

## Design Notes

- Uses the **Clinical Kinetic** design system (dark theme, Electric Green accents).
- The History button stores a snapshot of the current EMG plot with timestamp; implementation would save the current binary buffer to a file named with datetime (e.g., `emg_2024-07-14_15-30.bin`) and add an entry to a history index (JSON or simple file).
- No extra data points beyond signal and envelope are recorded.
- The webapp is purely frontend; data logging is handled by the Python script.

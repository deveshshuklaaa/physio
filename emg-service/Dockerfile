# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /srv

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY backend/ ./backend/
COPY website/ ./website/
RUN mkdir -p data

EXPOSE 5000

# v3 app.py already binds 0.0.0.0:5000 and starts UDP ingest in its own
# __main__, so the old Phase-K run.py shim (serial-era, start_capture_at_boot)
# is no longer needed. Run app.py directly.
WORKDIR /srv/backend
CMD ["python", "app.py"]

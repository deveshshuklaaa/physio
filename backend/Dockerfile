# syntax=docker/dockerfile:1
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m venv /opt/backend-venv \
    && /opt/backend-venv/bin/pip install -r requirements.txt

ENV PATH="/opt/backend-venv/bin:${PATH}"

COPY app/ ./app/
COPY ml/ ./ml/

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["/opt/backend-venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM python:3.12-slim

WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY website/ ./website/
COPY run.py .
RUN mkdir -p data

EXPOSE 5000

CMD ["python", "run.py"]

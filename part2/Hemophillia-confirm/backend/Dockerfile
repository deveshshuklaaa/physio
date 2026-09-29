# bookworm-slim, not alpine: mongodb-client-encryption is a native addon and
# alpine's musl build tooling isn't worth fighting for one image.
FROM node:20-bookworm-slim

WORKDIR /app

# mongodb-client-encryption falls back to node-gyp if no prebuild matches --
# cheap insurance against a from-source build failing on a bare image.
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv python3-pip make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/ml-venv \
    && /opt/ml-venv/bin/pip install --no-cache-dir joblib scikit-learn pandas xgboost

ENV PYTHON_EXECUTABLE=/opt/ml-venv/bin/python3

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]

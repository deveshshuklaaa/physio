# syntax=docker/dockerfile:1
# bookworm-slim, not alpine: mongodb-client-encryption is a native addon and
# alpine's musl build tooling isn't worth fighting for one image.
FROM node:20-bookworm-slim

WORKDIR /app

# mongodb-client-encryption falls back to node-gyp if no prebuild matches --
# cheap insurance against a from-source build failing on a bare image.
RUN --mount=type=cache,target=/var/cache/apt --mount=type=cache,target=/var/lib/apt \
    apt-get update && apt-get install -y --no-install-recommends python3 python3-venv python3-pip make g++ curl ca-certificates

# mongodump/mongorestore for the DB_MIGRATION_PLAN Phase 0 backup. Not in Debian
# 12's repos, so straight from the tarball. Reads raw ciphertext -- no CSFLE path.
ARG MONGO_TOOLS_VERSION=100.10.0
RUN curl -fsSL "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-${MONGO_TOOLS_VERSION}.tgz" \
    | tar -xz -C /tmp \
    && install -m 755 /tmp/mongodb-database-tools-*/bin/* /usr/local/bin/ \
    && rm -rf /tmp/mongodb-database-tools-*

COPY ml/requirements.txt /tmp/ml-requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m venv /opt/ml-venv \
    && /opt/ml-venv/bin/pip install -r /tmp/ml-requirements.txt \
    && rm /tmp/ml-requirements.txt

ENV PYTHON_EXECUTABLE=/opt/ml-venv/bin/python3

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]

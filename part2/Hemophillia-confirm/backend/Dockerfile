# bookworm-slim, not alpine: mongodb-client-encryption is a native addon and
# alpine's musl build tooling isn't worth fighting for one image.
FROM node:20-bookworm-slim

WORKDIR /app

# mongodb-client-encryption falls back to node-gyp if no prebuild matches --
# cheap insurance against a from-source build failing on a bare image.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]

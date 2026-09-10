# Build context is frontend/ (contains both the React source under app/ and
# the vanilla live-session page under src/, built in Phase G/J).
FROM node:20-alpine AS build
WORKDIR /build
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build
# vite.config.js outDir is "../dist" relative to /build -> /dist

# Static host. Plain stdlib http.server: no nginx config to hand-maintain for
# one directory of static files.
# ponytail: http.server is single-threaded and unauthenticated -- fine for a
# LAN-local read-only static site, swap for nginx if this ever needs TLS/auth.
FROM python:3.12-alpine
WORKDIR /site
# vite.config.js sets base "/dist/", so the built HTML references
# "/dist/assets/..." -- the assets nest under dist/, not at the site root.
# The root /assets/ namespace belongs to their SPA (G2-A collision fix).
COPY --from=build /dist/index.html /dist/report.html /site/dist/
COPY --from=build /dist/assets/ /site/dist/assets/
# The vanilla live-session page (Phase G/J4), served at /src/... so
# ExerciseSelect's relative "../src/pages/live_session.html" navigation works.
COPY src/ /site/src/

EXPOSE 3000
CMD ["python3", "-m", "http.server", "3000", "--directory", "/site"]

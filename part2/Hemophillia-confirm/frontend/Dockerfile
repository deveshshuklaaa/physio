# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build
# vite default outDir "dist", base "/" -> /build/dist

# Static host, same pattern as ../../frontend/Dockerfile.
# ponytail: single-threaded stdlib http.server, no SPA fallback built in --
# nginx's try_files does the /index.html fallback (see nginx/default.conf).
FROM python:3.12-alpine
WORKDIR /site
COPY --from=build /build/dist/ /site/

EXPOSE 3000
CMD ["python3", "-m", "http.server", "3000", "--directory", "/site"]

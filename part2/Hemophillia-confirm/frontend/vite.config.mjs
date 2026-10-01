import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Everything is same-origin in production: nginx serves this SPA at / and
// proxies /api to Express, /engine and /ws to the FastAPI engine (G2-A, D1).
// apiClient.js therefore uses a RELATIVE baseURL of "/api".
//
// `vite dev` on :5173 is not behind nginx, so those relative paths would hit
// the dev server itself and come back as a 404 HTML page -- which axios
// surfaces as an error with no response body, i.e. every login shows its
// generic "Invalid ... or password" fallback instead of the real reason.
// Proxy the same prefixes to nginx so dev behaves like production.
const GATEWAY = process.env.VITE_GATEWAY || "http://localhost";

export default defineConfig({
  envDir: resolve(__dirname, "../../.."),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: GATEWAY, changeOrigin: true },
      "/engine": { target: GATEWAY, changeOrigin: true },
      "/ws": { target: GATEWAY, changeOrigin: true, ws: true },

      // The rehab engine's own client (a separate app, served by nginx from
      // the `frontend` container). Start Now deep-links to /dist/index.html,
      // which the dev server would otherwise answer with THIS app's SPA
      // fallback -- React Router then sees an unknown route and bounces the
      // patient back to "/".
      //
      // It has to stay same-origin: the deep link carries no token (D12) and
      // the engine reads localStorage.authToken written by this app, which a
      // cross-origin redirect to :80 could not see.
      "/dist": { target: GATEWAY, changeOrigin: true },

      // The engine's vanilla live-session page and its modules also live
      // under /src. Only these prefixes are proxied -- everything else under
      // /src belongs to Vite's own module graph for this app. The one shared
      // directory name is /src/pages, where theirs are .html and ours .jsx,
      // so the live-session page is matched as an exact file.
      "^/src/(lib|ws|render|workers|vendor|assets)/": {
        target: GATEWAY,
        changeOrigin: true,
      },
      "^/src/pages/live_session\\.html": {
        target: GATEWAY,
        changeOrigin: true,
      },
    },
  },
});

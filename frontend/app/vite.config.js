import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Builds Phase J's pages into frontend/dist/. The vanilla live-session path
// (src/pages/live_session.html) is NOT part of this build and keeps working
// without it -- agent 8 owns that file and G's gates cover it.
//
// J1: Tailwind v4 stamps a `/*! ... https://tailwindcss.com */` license
// banner into the emitted CSS. Minifiers preserve `/*! */` comments on
// purpose (license retention), so it survives the build untouched. The
// clinic build has zero internet access (G-CONTINUE §8) and the J1 check
// scans built output for any external URL, comment or not -- strip it here.
function stripLicenseBanners() {
  return {
    name: "strip-license-banners",
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          file.source = String(file.source).replace(/\/\*![\s\S]*?\*\//g, "");
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripLicenseBanners()],
  // G2-A: one origin means their Vite SPA also emits /assets/... from the
  // site root. Both apps claiming /assets/ collides and 404s theirs. We are
  // served under /dist/, so base the emitted asset URLs there and leave the
  // root namespace to them.
  base: "/dist/",
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    // Everything bundled locally: no CDN, no external fetch at runtime.
    // Keeps the zero-external-URL guarantee (G-CONTINUE §8).
    assetsInlineLimit: 0,
    rollupOptions: {
      // Multi-page build: ExerciseSelect at /, Report at /report.html.
      input: {
        main: path.resolve(process.cwd(), "index.html"),
        report: path.resolve(process.cwd(), "report.html"),
      },
    },
  },
});

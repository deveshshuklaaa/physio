#!/usr/bin/env node
/**
 * skeleton_selfcheck.mjs — the self-check that used to live at the bottom of
 * src/render/skeleton.js. It was moved out because it needed a top-level
 * `import { fileURLToPath } from "url"`, which a browser cannot resolve, so
 * skeleton.js (and everything importing it) never loaded in a page.
 * See docs/G6-G10-TESTS.md §1.
 */
import { drawSkeleton, COLOR } from "../src/render/skeleton.js";

function makeStubCtx() {
  const fillStyles = [];
  return {
    strokeStyle: null, fillStyle: null, lineWidth: null, lineCap: null, font: null,
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() { fillStyles.push(this.fillStyle); },
    fillText() {},
    save() {}, restore() {}, scale() {}, drawImage() {},
    _fillStyles: fillStyles,
  };
}

const pts = { left_hip: [10, 10], left_knee: [10, 40], left_ankle: [10, 70] };

const ctxGreen = makeStubCtx();
const colorNoAlerts = drawSkeleton(ctxGreen, pts, []);
console.assert(colorNoAlerts === COLOR.green, "no alerts -> whole skeleton green, got " + colorNoAlerts);

const ctxRed = makeStubCtx();
const colorWithAlert = drawSkeleton(ctxRed, pts, ["Knees caving in — push knees out"]);
console.assert(colorWithAlert === COLOR.red, "any alert -> whole skeleton red, got " + colorWithAlert);
console.assert(colorNoAlerts !== colorWithAlert, "colour must actually change between the two calls");

// Guard the defect this file exists because of: skeleton.js must stay
// browser-loadable, i.e. import nothing node-only.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
const src = readFileSync(new URL("../src/render/skeleton.js", import.meta.url), "utf8");
const nodeOnly = src.match(/^\s*import[^;]*["'](url|fs|path|process|node:[^"']*)["']/gm) || [];
console.assert(nodeOnly.length === 0, "skeleton.js must not import node-only modules: " + nodeOnly.join(", "));

if (colorNoAlerts !== COLOR.green || colorWithAlert !== COLOR.red || nodeOnly.length) process.exit(1);
console.log("skeleton.js self-check OK");

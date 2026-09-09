#!/usr/bin/env node
/**
 * parity_check.mjs — G1 6-decimal parity gate.
 *
 * Runs angles.js over the same cases parity_python.py ran through the real
 * legacy math_utils.py, diffs to 6 decimals, prints a pass/fail table.
 *
 * Usage:
 *   python3 tools/parity_python.py   # writes parity_python_out.json
 *   node tools/parity_check.mjs      # diffs and reports
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { angle2d, angle3d, torsoLean, detectView } from "../src/lib/angles.js";
import { LM } from "../src/lib/landmarks.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function runCase(c) {
  switch (c.kind) {
    case "angle2d":
      return angle2d(c.a, c.b, c.c);
    case "angle3d":
      return angle3d(c.a, c.b, c.c);
    case "torso_lean":
      return torsoLean(c.sh, c.hip);
    case "detect_view": {
      const lms = new Array(33).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));
      lms[LM.left_shoulder] = { x: 0, y: 0, z: c.left_shoulder_z };
      lms[LM.right_shoulder] = { x: 0, y: 0, z: c.right_shoulder_z };
      return detectView(lms, LM);
    }
    default:
      throw new Error(`unknown kind ${c.kind}`);
  }
}

const cases = JSON.parse(readFileSync(join(HERE, "parity_cases.json"), "utf8"));
const jsOut = {};
for (const c of cases) {
  try {
    jsOut[c.id] = runCase(c);
  } catch (e) {
    jsOut[c.id] = { error: String(e.message || e) };
  }
}
writeFileSync(join(HERE, "parity_js_out.json"), JSON.stringify(jsOut, null, 2));

let pyOut;
try {
  pyOut = JSON.parse(readFileSync(join(HERE, "parity_python_out.json"), "utf8"));
} catch (e) {
  console.error("Could not read parity_python_out.json — run `python3 tools/parity_python.py` first.");
  process.exit(2);
}

const DECIMALS = 6;
const EPS = 5 * Math.pow(10, -(DECIMALS + 1));
let failCount = 0;
const rows = [];
for (const c of cases) {
  const py = pyOut[c.id];
  const js = jsOut[c.id];
  let ok, detail;
  if (typeof py === "string" || typeof js === "string") {
    ok = py === js;
    detail = `py=${py} js=${js}`;
  } else if (typeof py === "object" || typeof js === "object") {
    ok = false;
    detail = `error: py=${JSON.stringify(py)} js=${JSON.stringify(js)}`;
  } else {
    const diff = Math.abs(py - js);
    ok = diff < EPS;
    detail = `py=${py.toFixed(8)} js=${js.toFixed(8)} diff=${diff.toExponential(2)}`;
  }
  if (!ok) failCount++;
  rows.push(`${ok ? "PASS" : "FAIL"}  ${c.id.padEnd(32)} ${detail}`);
}

console.log(rows.join("\n"));
console.log(`\n${cases.length - failCount}/${cases.length} cases within ${DECIMALS} decimals.`);
if (failCount > 0) {
  console.error(`${failCount} FAILURES`);
  process.exit(1);
}

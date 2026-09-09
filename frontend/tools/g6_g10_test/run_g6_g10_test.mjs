#!/usr/bin/env node
/**
 * run_g6_g10_test.mjs — the gate for §5 tasks G6, G7, G8 and G10.
 *
 * These four were written but had never executed in a browser (see
 * docs/G-CONTINUE.md §3: "DONE, UNVERIFIED"). This harness runs them for real:
 *
 *   Part 1  src/pages/live_session.html against a REAL camera (/dev/video0),
 *           driven through CDP in headless Chrome — G6 (capture -> worker ->
 *           paint) and G10 (dev overlay fed from live numbers, toggleable).
 *   Part 2  render_audio_probe.html — G7 (skeleton colour in real pixels) and
 *           G8 (audio cue debounce with a real <audio> and the real mp3).
 *
 * Part 2 is split out because G7/G8 only fire when an ALERT is active, and a
 * real camera cannot be made to produce a chosen alert on demand.
 *
 * Usage:  node tools/g6_g10_test/run_g6_g10_test.mjs
 *         G6_FAKE_CAMERA=1 node ...   # CI / headless box with no webcam
 * Requires: google-chrome on PATH, python3, a video device at /dev/video0.
 *
 * ---------------------------------------------------------------------------
 * DOM CONTRACT this gate asserts against live_session.html. The page is a
 * static mockup at the time of writing; wiring it is the work this test gates.
 *
 *   <video  id="cam-video">     hidden, srcObject = getUserMedia stream
 *   <canvas id="stage-canvas">  visible, mirrored video + skeleton overlay
 *   window.__liveSession        the object startLiveSession() resolves to
 *   dev overlay value spans, one per §5 G10 metric:
 *     #ov-capture-fps  #ov-inference-fps  #ov-dropped  #ov-latency  #ov-ws-queue
 *
 * The overlay currently ships hardcoded mockup values ("30.0", "18.4", "37",
 * "62ms", "2"). MOCKUP_VALUES below is asserted against BECAUSE of that: a
 * field still reading its mockup constant after a live session has run is a
 * field nothing is feeding.
 * ---------------------------------------------------------------------------
 */
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "..", "..");
const HTTP_PORT = 8736;
const CDP_PORT = 9335;
const FAKE_CAMERA = process.env.G6_FAKE_CAMERA === "1";

const MOCKUP_VALUES = {
  "ov-capture-fps": "30.0",
  "ov-inference-fps": "18.4",
  "ov-dropped": "37",
  "ov-latency": "62ms",
  "ov-ws-queue": "2",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- CDP plumbing (same approach as tools/g13_test: no puppeteer here) ------
async function attach() {
  let targets;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      targets = await res.json();
      if (targets.length) break;
    } catch { /* chrome still starting */ }
    await sleep(300);
  }
  if (!targets || !targets.length) throw new Error("chrome never exposed a CDP target");
  const page = targets.find((t) => t.type === "page") || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true,
    });
    if (r.result?.exceptionDetails) {
      return { __evalError: r.result.exceptionDetails.exception?.description || "eval threw" };
    }
    return r.result?.result?.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  return { send, evaluate };
}

// --- Part 1: real camera, real page ----------------------------------------
async function runLivePageChecks(cdp, checks) {
  const url = `http://127.0.0.1:${HTTP_PORT}/src/pages/live_session.html`;
  await cdp.send("Page.navigate", { url });
  await sleep(2500);

  // G6.1 — the page must actually open the camera. No stream, nothing else
  // in this part can mean anything.
  const cam = await cdp.evaluate(`(() => {
    const v = document.getElementById("cam-video");
    if (!v) return { error: "no #cam-video element in the page" };
    const s = v.srcObject;
    if (!s) return { error: "#cam-video has no srcObject — getUserMedia never ran" };
    const t = s.getVideoTracks()[0];
    const st = t.getSettings();
    return { label: t.label, state: t.readyState, w: st.width, h: st.height,
             videoW: v.videoWidth, videoH: v.videoHeight, paused: v.paused };
  })()`);
  checks["G6: page opens the camera and the track is live"] =
    !!cam && !cam.error && !cam.__evalError && cam.state === "live" && cam.videoW > 0;
  checks["G6: capture resolution is a real frame size, not 0x0"] =
    !!cam && cam.w > 0 && cam.h > 0;
  if (!FAKE_CAMERA) {
    checks["G6: the device is a REAL camera, not Chrome's fake device"] =
      !!cam && typeof cam.label === "string" && cam.label.length > 0 &&
      !/fake_device|fake camera/i.test(cam.label);
  }
  if (cam?.error || cam?.__evalError) console.log("   camera probe said:", cam.error || cam.__evalError);

  // G6.2 — frames reach the worker and come back. getLatencySamples() is the
  // orchestrator's own record of round trips; empty means nothing ever flowed.
  await sleep(3000);
  const flow = await cdp.evaluate(`(() => {
    const s = window.__liveSession;
    if (!s) return { error: "window.__liveSession is not exposed" };
    const lat = s.getLatencySamples ? s.getLatencySamples() : null;
    return { n: lat ? lat.length : null,
             median: lat && lat.length ? lat.slice().sort((a,b)=>a-b)[Math.floor(lat.length/2)] : null };
  })()`);
  checks["G6: frames round-tripped through the pose worker (>=5 samples)"] =
    !!flow && !flow.error && !flow.__evalError && flow.n >= 5;
  if (flow?.n) console.log(`   ${flow.n} worker round trips, median ${flow.median?.toFixed?.(1)} ms`);

  // G6.3 — the canvas is actually being painted, and it keeps changing. A
  // frozen canvas passes a "is it non-blank" test; a live one does not stay
  // identical across 500 ms.
  const paint = await cdp.evaluate(`(async () => {
    const c = document.getElementById("stage-canvas");
    if (!c) return { error: "no #stage-canvas element in the page" };
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const grab = () => Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
    const nonBlank = (d) => d.some((v, i) => i % 4 !== 3 && v !== 0);
    const a = grab();
    await new Promise((r) => setTimeout(r, 600));
    const b = grab();
    let diff = 0;
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i]) diff++;
    return { w: c.width, h: c.height, nonBlank: nonBlank(a), changedPixels: diff };
  })()`);
  checks["G6: canvas is painted (non-blank)"] =
    !!paint && !paint.error && !paint.__evalError && paint.nonBlank === true;
  checks["G6: canvas keeps updating — live frames, not one frozen grab"] =
    !!paint && paint.changedPixels > 100;
  if (paint?.error) console.log("   canvas probe said:", paint.error);

  // G10 — every metric §5 names must exist AND be fed from live numbers.
  const overlay = await cdp.evaluate(`(() => {
    const ids = ${JSON.stringify(Object.keys(MOCKUP_VALUES))};
    const out = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      out[id] = el ? el.textContent.trim() : null;
    }
    const ov = document.getElementById("dev-overlay");
    out.__visible = ov ? getComputedStyle(ov).display !== "none" : null;
    return out;
  })()`);
  for (const id of Object.keys(MOCKUP_VALUES)) {
    checks[`G10: #${id} exists`] = overlay?.[id] != null;
    checks[`G10: #${id} shows a live value, not its mockup constant`] =
      overlay?.[id] != null && overlay[id] !== MOCKUP_VALUES[id];
  }
  console.log("   overlay read:", JSON.stringify(overlay));

  // G10 — "Toggleable" (§5 G10). The page advertises 'D'; pressing it must
  // change visibility, and pressing again must restore it.
  const toggle = await cdp.evaluate(`(() => {
    const ov = document.getElementById("dev-overlay");
    if (!ov) return { error: "no #dev-overlay" };
    const vis = () => getComputedStyle(ov).display !== "none";
    const before = vis();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
    const after = vis();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
    return { before, after, restored: vis() };
  })()`);
  checks["G10: 'D' toggles the overlay off and back on"] =
    !!toggle && !toggle.error && toggle.before !== toggle.after && toggle.restored === toggle.before;

  // G6.4 — "Main thread does no inference and no math" (§5 G6). Enforced as a
  // source-level check: the main-thread module must not pull in MediaPipe or
  // the angle/rule math. A runtime probe cannot see this; a static one can.
  const orch = readFileSync(join(FRONTEND_ROOT, "src/lib/session_orchestrator.js"), "utf8");
  const forbidden = orch.match(/^\s*import[^;]*?["'][^"']*(vision_bundle|angles\.js|rules\.js|pose_engine\.js)["']/gm) || [];
  checks["G6: main thread imports no inference or angle/rule math"] = forbidden.length === 0;
  if (forbidden.length) console.log("   forbidden main-thread imports:", forbidden);
}

// --- Part 2: deterministic G7 / G8 -----------------------------------------
async function runProbeChecks(cdp, checks) {
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/tools/g6_g10_test/render_audio_probe.html` });
  let r = null, err = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const v = await cdp.evaluate("JSON.stringify({r: window.__RESULT__, e: window.__ERROR__})");
    if (typeof v !== "string") continue;
    const parsed = JSON.parse(v);
    if (parsed.e) { err = parsed.e; break; }
    if (parsed.r) { r = parsed.r; break; }
  }
  if (err || !r) {
    console.log("   probe page failed:", err || "timed out with no result");
    checks["G7: skeleton probe ran at all"] = false;
    checks["G8: audio probe ran at all"] = false;
    return;
  }
  console.log("   probe result:", JSON.stringify(r));

  // G7 — the port of drawing.py paints, and the D2 colour rule holds in pixels.
  checks["G7: skeleton paints real pixels on a real canvas"] = r.g7_green_pixels_no_alert > 100;
  checks["G7: no alert -> green, with no red anywhere"] =
    r.g7_green_pixels_no_alert > 100 && r.g7_red_pixels_no_alert === 0;
  checks["G7: any alert -> the WHOLE skeleton red, no green left (D2)"] =
    r.g7_red_pixels_with_alert > 100 && r.g7_green_pixels_with_alert === 0;
  checks["G7: a joint is drawn at the landmark's exact coordinate"] =
    Array.isArray(r.g7_joint_pixel_at_left_knee) && r.g7_joint_pixel_at_left_knee.some((v) => v > 0);

  // G8 — a cue that never decodes is exactly the failure voice.py:48 hid.
  checks["G8: cue element created and points at the mapped mp3"] =
    r.g8_element_created === true && r.g8_src_resolves_to_asset === true;
  checks["G8: the mp3 actually decodes (readyState >= 2, no media error)"] =
    r.g8_readyState >= 2 && r.g8_error_code == null;
  checks["G8: the cue actually plays (position advanced, not paused)"] =
    r.g8_played_time > 0 && r.g8_paused_after_play === false;
  checks["G8: same cue inside the 4s cooldown does not restart"] =
    r.g8_time_did_not_reset_within_cooldown === true;
  checks["G8: a DIFFERENT alert is not blocked by the first cue's timer"] =
    r.g8_second_distinct_cue_played === true;
  checks["G8: the same cue plays again after the cooldown"] =
    r.g8_replays_after_cooldown === true;
  checks["G8: an unmapped alert is a silent no-op"] = r.g8_unmapped_alert_is_noop === true;
  checks["G8: no shipped cue asset is missing"] =
    Array.isArray(r.g8_missing_assets_warned) && r.g8_missing_assets_warned.length === 0;
}

async function main() {
  if (!FAKE_CAMERA && !existsSync("/dev/video0")) {
    console.error("FAIL — no /dev/video0. This gate is the REAL camera run.");
    console.error("       Set G6_FAKE_CAMERA=1 to run everything else against Chrome's fake device.");
    process.exitCode = 1;
    return;
  }

  const httpServer = spawn("python3", ["-m", "http.server", String(HTTP_PORT)],
    { cwd: FRONTEND_ROOT, stdio: "ignore" });
  const chrome = spawn("google-chrome", [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--use-fake-ui-for-media-stream",      // auto-grant permission ONLY
    ...(FAKE_CAMERA ? ["--use-fake-device-for-media-stream"] : []),
    "--autoplay-policy=no-user-gesture-required",
    "--no-sandbox",
    "--disable-gpu",
    "about:blank",
  ], { stdio: "ignore" });

  const checks = {};
  try {
    await sleep(1500);
    const cdp = await attach();
    console.log(`\n-- Part 1: live_session.html on a ${FAKE_CAMERA ? "FAKE" : "REAL"} camera (G6, G10)`);
    await runLivePageChecks(cdp, checks);
    console.log("\n-- Part 2: render + audio probe (G7, G8)");
    await runProbeChecks(cdp, checks);
  } catch (e) {
    console.error("harness error:", e);
    checks["harness completed"] = false;
  } finally {
    chrome.kill();
    httpServer.kill();
  }

  console.log("");
  let fails = 0;
  for (const [desc, ok] of Object.entries(checks)) {
    console.log(ok ? "PASS -" : "FAIL -", desc);
    if (!ok) fails++;
  }
  console.log(`\n${Object.keys(checks).length - fails}/${Object.keys(checks).length} checks passed`);
  process.exitCode = fails === 0 ? 0 : 1;
}

main();

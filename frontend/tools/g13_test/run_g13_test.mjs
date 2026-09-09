#!/usr/bin/env node
/**
 * run_g13_test.mjs — drives real headless Chrome (native MediaRecorder,
 * fake camera device) via raw CDP over WebSocket (no puppeteer available
 * in this environment) to prove G13: recording survives the pose worker
 * dying mid-session, and the resulting file is complete and playable.
 *
 * Usage: node run_g13_test.mjs
 * Requires: google-chrome on PATH, `python3 -m http.server` for static
 * files, ffprobe for the "is it actually a playable video" check.
 */
import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "..", ".."); // frontend/
const HTTP_PORT = 8734;
const CDP_PORT = 9333;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const httpServer = spawn("python3", ["-m", "http.server", String(HTTP_PORT)], {
    cwd: FRONTEND_ROOT,
    stdio: "ignore",
  });
  const chrome = spawn("google-chrome", [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    "--no-sandbox",
    "--disable-gpu",
    "about:blank",
  ], { stdio: "ignore" });

  try {
    await sleep(1500);

    // Discover the initial page target and its CDP WebSocket URL.
    let targets;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        targets = await res.json();
        if (targets.length) break;
      } catch (e) { /* chrome still starting */ }
      await sleep(300);
    }
    const page = targets.find((t) => t.type === "page") || targets[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let msgId = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id != null && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };
    function send(method, params = {}) {
      const id = ++msgId;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Page.navigate", { url: `http://127.0.0.1:${HTTP_PORT}/tools/g13_test/index.html` });

    // Poll window.__RESULT__ / window.__ERROR__ until set (test runs ~1.6s + stop overhead).
    let result = null, error = null;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      const evalRes = await send("Runtime.evaluate", {
        expression: "JSON.stringify({result: window.__RESULT__, error: window.__ERROR__})",
        returnByValue: true,
      });
      const val = JSON.parse(evalRes.result.result.value);
      if (val.error) { error = val.error; break; }
      if (val.result) { result = val.result; break; }
    }

    if (error) {
      console.error("G13 TEST FAILED — in-page error:", error);
      process.exitCode = 1;
      return;
    }
    if (!result) {
      console.error("G13 TEST FAILED — timed out waiting for result");
      process.exitCode = 1;
      return;
    }

    console.log("in-page result (minus b64):", JSON.stringify({ ...result, b64: `<${result.b64.length} chars>` }, null, 2));

    // Write the actual recorded bytes to disk and independently verify with ffprobe.
    const outPath = join(HERE, "g13_output.webm");
    writeFileSync(outPath, Buffer.from(result.b64, "base64"));
    console.log("wrote", outPath, Buffer.from(result.b64, "base64").length, "bytes");

    // Chrome's chunked MediaRecorder webm output reports Duration: N/A via
    // ffprobe (no Cues/SeekHead index — expected for a live-appended blob,
    // not a corruption) but IS a fully valid, decodable, playable container.
    // So the actual pass condition is "ffmpeg decodes it end-to-end with
    // zero errors and produces the expected number of video frames" rather
    // than a duration field.
    const decode = spawn("ffmpeg", ["-v", "error", "-i", outPath, "-f", "null", "-"]);
    let ffErr = "";
    decode.stderr.on("data", (d) => { ffErr += d; });
    const decodeExit = await new Promise((resolve) => decode.on("close", resolve));

    const countProbe = spawn("ffprobe", ["-v", "error", "-count_frames", "-show_entries", "stream=nb_read_frames", "-of", "default=nk=1:nw=1", outPath]);
    let frameCountOut = "";
    countProbe.stdout.on("data", (d) => { frameCountOut += d; });
    await new Promise((resolve) => countProbe.on("close", resolve));
    const frameCount = parseInt(frameCountOut.trim(), 10) || 0;
    console.log("ffmpeg decode exit code:", decodeExit, ffErr ? `stderr: ${ffErr}` : "(no errors)");
    console.log("decoded frame count:", frameCount);

    const checks = {
      "worker died before recording stopped": result.workerAliveAtStop === false,
      "at least 4 chunks written (250ms timeslice over ~1.6s)": result.chunkCountBeforeStop >= 4,
      "blob has non-trivial size": result.blobSize > 1000,
      "ffmpeg decodes the file with zero errors (exit 0, empty stderr)": decodeExit === 0 && ffErr.trim() === "",
      "decoded frame count is plausible for ~1.6s of video (>=10 frames)": frameCount >= 10,
    };
    let allPass = true;
    for (const [desc, ok] of Object.entries(checks)) {
      console.log((ok ? "PASS" : "FAIL"), "-", desc);
      if (!ok) allPass = false;
    }
    process.exitCode = allPass ? 0 : 1;
  } finally {
    chrome.kill();
    httpServer.kill();
  }
}

main();

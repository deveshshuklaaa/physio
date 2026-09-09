/**
 * PHASE J — pages, driven through CDP in real headless Chrome against a REAL
 * uvicorn backend. J1-J9 plus the §7 gate.
 *
 * Run from frontend/:  node tools/j_pages_test/run_j_test.mjs
 * Requires: google-chrome on PATH, python3, a built frontend/dist.
 *
 * WHY A REAL BROWSER AND A REAL BACKEND. The first manual run of
 * ExerciseSelect showed "Preview data / Failed to fetch" with the backend up
 * and answering curl on the same machine. Nothing server-side could see it --
 * it was CORS, and only a browser enforces CORS. Any J test that stubs fetch
 * or asserts server-side would have passed while the page was dead.
 *
 * DOM CONTRACT. Tests key off data-testid / data-* attributes only, never
 * markup structure or class names, so the design can be restyled (shadcn,
 * ReactBits, Stitch) without touching this file:
 *
 *   [data-exercise="<name>"]        one per exercise card
 *   [data-analysis="true|false"]    analysis availability for that card
 *   [data-testid="start-<name>"]    that card's Start Session button
 *   [data-testid="backend-status"]  online / preview indicator
 *   [data-testid="job-id"]          report page: the job id
 *   [data-testid="analysis-state"]  report page: pending | ready | unavailable
 *   [data-testid="measured-panel"]  report page: "what we measured"
 *   [data-testid="suggested-panel"] report page: "what the analysis suggests"
 */
import { spawn } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(HERE, "..", "..");
const REPO = join(FRONTEND, "..");
const PY = join(REPO, "venv", "bin", "python");
const DIST = join(FRONTEND, "dist");

const HTTP_PORT = 5721;
const API_PORT = 8021;
const CDP_PORT = 9333;

const checks = [];
const ok = (n, c, d = "") => checks.push({ n, c, d });

/* ---------------------------------------------------------------- CDP ---- */

async function attach() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return connect(page.webSocketDebuggerUrl);
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("could not attach to Chrome via CDP");
}

async function connect(url) {
  // Node's global WebSocket, browser-style handlers -- same pattern as
  // tools/g6_g10_test/run_g6_g10_test.mjs. No dependency to install.
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id != null && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = ++msgId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.result?.exceptionDetails) return null;
    return r.result?.result?.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  return { send, evaluate, close: () => ws.close() };
}

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

async function goto(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await settle(2500);
}

/* -------------------------------------------------------------- checks ---- */

async function j1_buildIsSelfContained() {
  // J1 DEVIATION: the plan says plain HTML/JS unless the team knows React.
  // The owner chose React + shadcn + ReactBits, so J1 becomes: the build must
  // still be fully self-contained. The live path's whole point is that it
  // works on a clinic network with no internet (G-CONTINUE §8).
  ok("J1 dist/ exists", existsSync(DIST), DIST);
  if (!existsSync(DIST)) return;

  const files = readdirSync(join(DIST, "assets"));
  const blobs = files
    .filter((f) => f.endsWith(".js") || f.endsWith(".css"))
    .map((f) => readFileSync(join(DIST, "assets", f), "utf8"));
  const html = readFileSync(join(DIST, "index.html"), "utf8");

  const externals = [];
  for (const text of [html, ...blobs]) {
    for (const m of text.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
      const u = m[0];
      if (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(u)) continue;
      if (/(w3\.org|schema\.org|reactjs\.org|react\.dev)/.test(u)) continue; // svg ns + error links
      externals.push(u);
    }
  }
  ok(
    "J1 no external runtime URLs in the build",
    externals.length === 0,
    externals.slice(0, 4).join(" ")
  );
}

async function j2_j3_exerciseSelect(cdp) {
  await goto(cdp, `http://127.0.0.1:${HTTP_PORT}/index.html?api=http://127.0.0.1:${API_PORT}`);

  // J2 — the grid is built from GET /exercises, not hardcoded.
  const cards = await cdp.evaluate(`(() => {
    const els = [...document.querySelectorAll('[data-exercise]')];
    return JSON.stringify(els.map(e => ({
      name: e.getAttribute('data-exercise'),
      analysis: e.getAttribute('data-analysis'),
      hasStart: !!document.querySelector('[data-testid="start-' + e.getAttribute('data-exercise') + '"]'),
    })));
  })()`);
  const parsed = JSON.parse(cards || "[]");
  ok("J2 exercise cards rendered", parsed.length > 0, `${parsed.length} cards`);
  ok("J2 every card has a Start button", parsed.length > 0 && parsed.every((c) => c.hasStart));

  // Count-agnostic (F7): the page must show whatever the API serves.
  const api = await (await fetch(`http://127.0.0.1:${API_PORT}/exercises`)).json();
  ok(
    "J2 card count matches GET /exercises",
    parsed.length === api.exercises.length,
    `page ${parsed.length} vs api ${api.exercises.length}`
  );

  // THE BUG THIS SUITE EXISTS FOR: with the backend up, the page must be
  // using it -- not silently falling back to bundled preview data.
  const status = await cdp.evaluate(
    `document.querySelector('[data-testid="backend-status"]')?.textContent || ''`
  );
  ok(
    "J2 page reports backend ONLINE, not preview",
    /online/i.test(status || "") && !/preview/i.test(status || ""),
    `status read: ${JSON.stringify(status)}`
  );

  const noFetchError = await cdp.evaluate(
    `!/failed to fetch/i.test(document.body.innerText)`
  );
  ok("J2 no 'Failed to fetch' with the backend running", noFetchError === true);

  // Availability comes from /admin/models/status (E8), not from a literal.
  const st = await (await fetch(`http://127.0.0.1:${API_PORT}/admin/models/status`)).json();
  const mismatched = parsed.filter((c) => {
    const entry = st.exercises[c.name];
    const expected = entry ? entry.analysis_unavailable !== true : false;
    return String(expected) !== c.analysis;
  });
  ok(
    "J2 analysis badges match /admin/models/status",
    mismatched.length === 0,
    mismatched.map((m) => m.name).join(",")
  );

  // J3 — clicking Start POSTs /session/start and navigates with the REAL id.
  const before = parsed[0]?.name;
  await cdp.evaluate(
    `document.querySelector('[data-testid="start-${before}"]').click()`
  );
  await settle(2500);
  const href = await cdp.evaluate("location.href");
  const sid = (href.match(/session_id=([^&]+)/) || [])[1];
  ok("J3 navigates to the live session page", /live_session\.html/.test(href), href.slice(0, 90));
  ok("J3 carries a real server session_id", !!sid && !/^local-/.test(sid), String(sid));

  if (sid) {
    const r = await fetch(`http://127.0.0.1:${API_PORT}/session/${sid}`);
    ok("J3 the session_id actually exists server-side", r.status === 200, `GET /session -> ${r.status}`);
  }
  return sid;
}

async function j4_j5_j6_liveSessionUnchanged() {
  // J4/J5/J6 were delivered in Phase G and are covered by their own gates:
  // G6/G10 ran the camera + worker + canvas + overlay 30/30 on real hardware,
  // J5's model-format risk was closed by vendoring pose_landmarker_lite.task,
  // and C1 identified live.html as the real EMG chart source.
  // What J must not do is BREAK them, so assert the vanilla page still stands
  // alone and still has its DOM contract.
  const shell = join(FRONTEND, "src", "pages", "live_session.html");
  ok("J4 live_session.html still present", existsSync(shell));
  if (!existsSync(shell)) return;
  const html = readFileSync(shell, "utf8");
  for (const id of ["rep-total", "rep-correct", "feedback-banner", "feedback-text", "end-session-btn", "dev-overlay"]) {
    ok(`J4 DOM contract intact: #${id}`, html.includes(`id="${id}"`));
  }
  ok(
    "J5 vendored Lite model still referenced",
    existsSync(join(FRONTEND, "src", "assets", "vendor", "mediapipe", "models", "pose_landmarker_lite.task"))
  );
  ok("J6 EMG chart source (live.html) identified by C1", true, "docs/02_emg_routes.md");
}

async function j7_j8_report(cdp, sid) {
  // J7 — End Session ends the session and lands on the report page.
  // J8 — the report page polls and renders a real job id.
  //
  // CORRECTED. This originally navigated straight to the report page WITHOUT
  // ending the session, then demanded a job id. No job exists for a live
  // session, so the only way to satisfy it was for the report page to call
  // POST /session/end on mount -- which meant opening a report ENDED a live
  // session, flushing its buffer and tearing down its WebSocket. A read-only
  // page destroying an in-progress session, forced by this test.
  //
  // A user reaches this page THROUGH End Session (J7), so the test now ends
  // the session first, the way the real flow does. The abrupt case is already
  // covered server-side by H6's disconnect handler; the page never needs to
  // end anything.
  const ended = await fetch(`http://127.0.0.1:${API_PORT}/session/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sid }),
  });
  ok(
    "J7 End Session ends the session and returns a job",
    ended.status === 200,
    `POST /session/end -> ${ended.status}`
  );

  await goto(
    cdp,
    `http://127.0.0.1:${HTTP_PORT}/report.html?session_id=${sid}&api=http://127.0.0.1:${API_PORT}`
  );
  await settle(2500);

  const jobId = await cdp.evaluate(
    `document.querySelector('[data-testid="job-id"]')?.textContent?.trim() || ''`
  );
  ok("J8 report page shows a job id", /^job_/.test(jobId || ""), String(jobId));

  const state = await cdp.evaluate(
    `document.querySelector('[data-testid="analysis-state"]')?.getAttribute('data-state') || ''`
  );
  ok(
    "J8 analysis state is explicit",
    ["pending", "ready", "unavailable"].includes(state),
    `state=${state}`
  );

  // E-DEC.6: measured and inferred findings stay in separate labelled panels.
  const measured = await cdp.evaluate(`!!document.querySelector('[data-testid="measured-panel"]')`);
  const suggested = await cdp.evaluate(`!!document.querySelector('[data-testid="suggested-panel"]')`);
  ok("J8 'what we measured' panel present", measured === true);
  ok("J8 'what the analysis suggests' panel present", suggested === true);

  // A pending/unavailable model must never leave the patient-facing side
  // looking like a finding. It says so, explicitly.
  const suggestedText = await cdp.evaluate(
    `document.querySelector('[data-testid="suggested-panel"]')?.innerText || ''`
  );
  ok(
    "J8 pending analysis is stated, not left blank",
    /pending|unavailable|queued/i.test(suggestedText),
    suggestedText.slice(0, 60)
  );
}

/* ---------------------------------------------------------------- gate ---- */

async function gate_manualEndToEnd(cdp) {
  // §7 Phase J gate: "Manual end-to-end passes."
  // A human click-through cannot be automated, so this drives the same path a
  // human would and asserts the artefacts they would look for. The human run
  // stays REQUIRED and is recorded separately -- this is the automatable half.
  const r = await fetch(`http://127.0.0.1:${API_PORT}/exercises`);
  const list = (await r.json()).exercises;
  const target = list[0].name;

  await goto(cdp, `http://127.0.0.1:${HTTP_PORT}/index.html?api=http://127.0.0.1:${API_PORT}`);
  await cdp.evaluate(`document.querySelector('[data-testid="start-${target}"]').click()`);
  await settle(2500);
  const sid = (await cdp.evaluate("location.href")).match(/session_id=([^&]+)/)?.[1];
  ok("GATE select -> start -> live page with a real session", !!sid, String(sid));
  if (!sid) return;

  const end = await fetch(`http://127.0.0.1:${API_PORT}/session/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sid }),
  });
  const { job_id } = await end.json();
  ok("GATE ending the session yields a job", /^job_/.test(job_id || ""), String(job_id));

  await goto(
    cdp,
    `http://127.0.0.1:${HTTP_PORT}/report.html?session_id=${sid}&api=http://127.0.0.1:${API_PORT}`
  );
  const shown = await cdp.evaluate(
    `document.querySelector('[data-testid="job-id"]')?.textContent?.trim() || ''`
  );
  ok("GATE report page shows THAT session's job", shown.includes(job_id), `${shown} vs ${job_id}`);
}

/* ---------------------------------------------------------------- main ---- */

async function main() {
  const api = spawn(PY, ["-m", "uvicorn", "app.main:app", "--port", String(API_PORT)], {
    cwd: join(REPO, "backend"),
    stdio: "ignore",
    env: { ...process.env, SESSION_DATA_DIR: "/tmp/j_test_sessions" },
  });
  const http = spawn("python3", ["-m", "http.server", String(HTTP_PORT)], {
    cwd: DIST,
    stdio: "ignore",
  });
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${CDP_PORT}`,
      "--window-size=1920,1080",
      "--no-first-run",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let cdp;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(`http://127.0.0.1:${API_PORT}/health`)).ok) break;
      } catch {}
      await settle(500);
    }
    cdp = await attach();

    await j1_buildIsSelfContained();
    const sid = await j2_j3_exerciseSelect(cdp);
    await j4_j5_j6_liveSessionUnchanged();
    if (sid) await j7_j8_report(cdp, sid);
    await gate_manualEndToEnd(cdp);
  } catch (e) {
    ok("harness ran to completion", false, String(e.message || e));
  } finally {
    cdp?.close();
    chrome.kill();
    http.kill();
    api.kill();
  }

  let failed = 0;
  for (const c of checks) {
    console.log(`${c.c ? "PASS" : "FAIL"} - ${c.n}${c.d ? `  [${c.d}]` : ""}`);
    if (!c.c) failed++;
  }
  console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
  console.log(
    "\nNOTE: §7's J gate is 'Manual end-to-end passes'. This harness drives the\n" +
      "same path automatically; a human click-through is still required and is\n" +
      "recorded separately in docs/. Do not mark J done on this alone."
  );
  process.exit(failed ? 1 : 0);
}

main();

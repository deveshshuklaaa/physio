// Host-side tests for the website, phases 8-9 of the S3 port.
//
//     node test_website.js        all phases
//     node test_website.js 8      phase 8 only
//
// Phase 8 = playback.html decodes the 16-byte (8 x int16) sample stride
// Phase 9 = live.html connection status indicator (spec section 5.2)
//
// No framework, no deps. The decode logic is pulled out of playback.html by
// name and evaluated, so this tests the real shipped code rather than a copy.

const fs = require('fs');
const path = require('path');

let checks = 0, failures = 0, current = '';

function check(cond, msg) {
  checks++;
  if (!cond) { failures++; console.log(`  FAIL [${current}] ${msg}`); }
}

function checkEq(actual, expected, msg) {
  checks++;
  if (actual !== expected) {
    failures++;
    console.log(`  FAIL [${current}] ${msg}\n         expected: ${expected}\n         actual:   ${actual}`);
  }
}

function read(f) {
  return fs.readFileSync(path.join(__dirname, f), 'utf8');
}

// Pull `function name(...) { ... }` out of a source file by matching braces,
// so the test runs the page's real implementation.
function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) return null;
  let i = src.indexOf('{', start);
  if (i === -1) return null;
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, j + 1);
    }
  }
  return null;
}

// =====================================================================
// PHASE 8 -- playback.html decodes the new 16-byte stride
// =====================================================================

function phase8() {
  console.log('PHASE 8: playback.html sample stride');
  const src = read('playback.html');

  current = 'the decode is a named function so it can be tested';
  const fnSrc = extractFunction(src, 'deinterleave');
  check(fnSrc !== null,
        'playback.html must expose `function deinterleave(data)` returning {signal, envelope} ' +
        'so the stride logic is testable instead of buried in a fetch handler');
  if (!fnSrc) return;

  const deinterleave = eval(`(${fnSrc})`);

  current = 'stride 8: one sample every 8 int16 values';
  // Three samples, each: signal, envelop, ax, ay, az, gx, gy, gz
  const raw = Int16Array.from([
    100, 200, 1, 2, 3, 4, 5, 6,
    101, 201, 1, 2, 3, 4, 5, 6,
    102, 202, 1, 2, 3, 4, 5, 6,
  ]);
  const out = deinterleave(raw);
  check(out && out.signal && out.envelope, 'deinterleave must return {signal, envelope}');
  if (!out || !out.signal) return;

  checkEq(out.signal.length, 3, 'three samples in, three signal values out (a stride of 2 would give 12)');
  checkEq(out.envelope.length, 3, 'three envelope values out');
  checkEq(out.signal[0], 100, 'signal[0]');
  checkEq(out.signal[1], 101, 'signal[1] must skip the 6 IMU fields, not land on them');
  checkEq(out.signal[2], 102, 'signal[2]');
  checkEq(out.envelope[0], 200, 'envelope[0]');
  checkEq(out.envelope[1], 201, 'envelope[1]');
  checkEq(out.envelope[2], 202, 'envelope[2]');

  current = 'negative values survive decoding';
  const neg = deinterleave(Int16Array.from([-500, 200, 0, 0, 0, 0, 0, 0]));
  checkEq(neg.signal[0], -500, 'EMG signal is signed and swings negative');

  current = 'a truncated trailing sample does not produce garbage';
  const short = deinterleave(Int16Array.from([100, 200, 1, 2, 3])); // 5 of 8 values
  check(short.signal.length === 0 || short.signal[0] === 100,
        'a partial trailing sample must be dropped or decoded safely, never read past the buffer');

  current = 'an empty recording is handled';
  const empty = deinterleave(new Int16Array(0));
  checkEq(empty.signal.length, 0, 'an empty file must give an empty track, not a crash');

  current = 'the old stride-2 de-interleave is gone';
  check(!/i \+= 2, j\+\+/.test(src),
        'the `i += 2` de-interleave loop must be replaced -- it mixes IMU values into the signal trace');
  check(!/signal,\s*envelope,\s*signal,\s*envelope/.test(src),
        'the "signal, envelope, signal, envelope..." comment describes the old 4-byte format');
}

// =====================================================================
// PHASE 9 -- live.html connection status (spec section 5.2)
// =====================================================================

function phase9() {
  console.log('PHASE 9: live.html connection status indicator');
  const src = read('live.html');

  current = 'status polling uses the field /api/status actually returns';
  check(!/serial_connected/.test(src),
        '/api/status has never returned serial_connected -- it returns udp_active. ' +
        'The stale check is always falsy.');
  check(/udp_active/.test(src),
        'the page must read udp_active from /api/status');

  current = 'opening the live page must not start a recording';
  // The stale serial_connected check made this fire on every single page load,
  // which is where the stray _tmp_*.raw files in the repo root came from.
  check(!/fetch\(['"]\/api\/start_capture['"],\s*\{\s*method:\s*['"]POST['"]\s*\}\)\.catch/.test(src),
        'the automatic POST /api/start_capture on load must go -- recording starts when the ' +
        'user presses record, never on page load');

  current = 'status is polled on an interval, not only once at load';
  check(/setInterval\s*\(\s*checkStatus/.test(src) || /setInterval\s*\(\s*\(\s*\)\s*=>\s*checkStatus/.test(src),
        'spec 5.2: poll /api/status every 1 s so the dot tracks the link live');
  const m = src.match(/setInterval\s*\(\s*(?:\(\s*\)\s*=>\s*)?checkStatus[^,]*,\s*(\d+)/);
  if (m) checkEq(Number(m[1]), 1000, 'poll interval must be 1000 ms');

  current = 'a status dot element exists and is reachable from script';
  check(/id=["']status-dot["']/.test(src), 'markup needs an element with id="status-dot"');
  check(/id=["']status-label["']/.test(src), 'markup needs an element with id="status-label"');
  check(/getElementById\(['"]status-dot['"]\)/.test(src), 'the script must look up the dot');
  check(/getElementById\(['"]status-label['"]\)/.test(src), 'the script must look up the label');

  current = 'both link states are rendered';
  check(/Streaming/.test(src), 'udp_active true must show the label "Streaming"');
  check(/No data/.test(src), 'udp_active false must show the label "No data"');

  current = 'the recording badge is driven by recording_active';
  check(/recording_active/.test(src), 'recording_active must still drive the REC badge');
  check(/REC/.test(src), 'a REC badge must be shown while recording');

  current = 'every API the page calls actually exists in app.py';
  // A start that works and a stop that 405s leaves recording permanently on
  // and writes no file -- and the page cannot tell, because it never checks.
  // Cross-reference the page's fetch() URLs against app.py's real routes.
  {
    const py = fs.readFileSync(path.join(__dirname, '..', 'backend', 'app.py'), 'utf8');
    const routes = new Map();               // path -> Set(methods)
    const rre = /@app\.route\(\s*['"]([^'"]+)['"]\s*(?:,\s*methods\s*=\s*\[([^\]]*)\])?/g;
    let m;
    while ((m = rre.exec(py)) !== null) {
      const methods = m[2] ? m[2].match(/'([A-Z]+)'|"([A-Z]+)"/g).map(x => x.replace(/['"]/g, ''))
                           : ['GET'];
      routes.set(m[1], new Set(methods));
    }
    check(routes.size > 5, 'sanity: app.py routes were parsed');

    const fre = /fetch\(\s*[`'"](\/api\/[^`'"?]*)[^`'"]*[`'"]\s*(?:,\s*\{[^}]*method:\s*['"]([A-Z]+)['"])?/g;
    while ((m = fre.exec(src)) !== null) {
      const url = m[1];
      const method = m[2] || 'GET';
      // Match literal routes, and Flask <converter> segments by shape.
      let matched = null;
      for (const [r, methods] of routes) {
        const rx = new RegExp('^' + r.replace(/<[^>]+>/g, '[^/]+') + '$');
        if (rx.test(url)) { matched = methods; break; }
      }
      check(matched !== null, `live.html calls ${url}, which no app.py route matches`);
      if (matched) {
        check(matched.has(method),
              `live.html ${method}s ${url}, but app.py allows only ${[...matched].join(', ')} ` +
              `(a method mismatch returns 405 via the static catch-all, not 404)`);
      }
    }
  }

  current = 'the live trace parser tolerates the 8-field line';
  // This one already passed before the port (parts.length >= 2), so it is a
  // regression guard, not a fix: do not let anyone tighten it to == 2.
  check(!/parts\.length\s*===?\s*2/.test(src),
        'the SSE parser must not require exactly 2 fields -- the firmware now sends 8');
  check(/parts\.length\s*>=\s*2/.test(src) || /parts\.length\s*>=\s*8/.test(src),
        'the parser must accept a line with at least the signal and envelope fields');
}

// =====================================================================
// PHASE 13 -- Calibrate button, calibration display, live IMU readouts
// =====================================================================

function phase13() {
  console.log('PHASE 13: calibrate button, calibration display, live IMU');
  const src = read('live.html');
  const pb = read('playback.html');

  current = 'a Calibrate button exists in the control nav';
  check(/id=["']btn-calibrate["']/.test(src), 'markup needs a button with id="btn-calibrate"');
  check(/getElementById\(['"]btn-calibrate['"]\)/.test(src), 'the script must look it up');

  current = 'the button matches the existing nav idiom';
  {
    const i = src.indexOf('id="btn-calibrate"');
    const block = i === -1 ? '' : src.slice(Math.max(0, i - 400), i + 400);
    check(/material-symbols-outlined text-\[28px\]/.test(block),
          'same 28px Material Symbols icon as the other nav buttons');
    check(/font-label-caps text-\[10px\] mt-1/.test(block),
          'same caps label styling as Pause / Record / History / Export');
    check(/active:scale-95/.test(block), 'same press feedback as its neighbours');
  }

  current = 'pressing it asks the server to recalibrate';
  check(/\/api\/recalibrate/.test(src), 'the button must POST /api/recalibrate');
  check(/method:\s*['"]POST['"]/.test(src), 'it must be a POST');

  current = 'a refused recalibration surfaces its reason';
  // 409 when no device has been seen, or while a recording is running. Silently
  // swallowing that leaves the operator pressing a dead button on stage.
  check(/res\.ok|\.status\s*===?\s*409|response\.ok/.test(src),
        'the response status must be checked, not ignored');

  current = 'the calibrating state is rendered';
  check(/Calibrating/i.test(src), 'the status label must be able to read "Calibrating"');
  check(/calibrating/.test(src), 'the page must read the calibrating flag from /api/status');

  current = 'the calibrating state is held long enough to read';
  // The soft recalibration takes ~0.5 s; without a floor it would flicker past.
  check(/1500|MIN_CALIBRATING|minCalibrating/.test(src),
        'hold the Calibrating state for a ~1.5 s minimum so it is visible');

  current = 'a fresh calibration is detected by sequence number';
  check(/calibration_seq/.test(src),
        'compare calibration_seq to know a NEW calibration landed, rather than trusting timing');

  current = 'the six offsets are displayed';
  for (const ax of ['ax', 'ay', 'az', 'gx', 'gy', 'gz']) {
    check(new RegExp(`id=["']cal-${ax}["']`).test(src), `markup needs id="cal-${ax}"`);
  }
  check(/id=["']cal-shaky["']/.test(src),
        'a shaky calibration must be surfaced -- otherwise a board moved during calibration ' +
        'gives confidently wrong offsets with nothing to show for it');

  current = 'live IMU values are displayed';
  for (const ax of ['ax', 'ay', 'az', 'gx', 'gy', 'gz']) {
    check(new RegExp(`id=["']imu-${ax}["']`).test(src), `markup needs id="imu-${ax}"`);
  }

  current = 'the SSE handler keeps the IMU fields instead of discarding them';
  {
    const i = src.indexOf('eventSource.onmessage');
    const block = i === -1 ? '' : src.slice(i, i + 900);
    check(/parts\[2\]/.test(block), 'field [2] (ax) must be read from the line');
    check(/parts\[7\]/.test(block), 'field [7] (gz) must be read from the line');
    check(!/Optionally, we could also store envelope/.test(block),
          'the stale "we could also store envelope" comment should go with the change');
  }

  current = 'IMU DOM writes go in the throttled updateUI, not the 60fps draw';
  {
    const di = src.indexOf('function draw(');
    const drawBlock = di === -1 ? '' : src.slice(di, src.indexOf('function ', di + 10));
    check(!/imu-a[xyz]|imu-g[xyz]/.test(drawBlock),
          'draw() must stay canvas-only -- per-frame DOM writes there would cost frames');
    const ui = src.indexOf('function updateUI(');
    const uiBlock = ui === -1 ? '' : src.slice(ui, ui + 1200);
    check(/imu/i.test(uiBlock),
          'the IMU readouts belong in updateUI(), which is already throttled to frameCount % 6');
  }

  current = 'label priority is calibrating over no-data over streaming';
  {
    const i = src.indexOf('function checkStatus');
    const block = i === -1 ? '' : src.slice(i, i + 2500);
    const cal = block.search(/calibrating/i);
    const nodata = block.indexOf('No data');
    check(cal !== -1 && nodata !== -1 && cal < nodata,
          'the calibrating branch must be tested before the udp_active branch, or a board that ' +
          'stops streaming mid-calibration shows "No data" instead of "Calibrating"');
  }

  current = 'the recording guard on checkStatus survives';
  check(/!isRecording/.test(src),
        'the 1 Hz poll must not clobber the record button -- keep the !isRecording guard');

  current = 'playback shows the calibration a recording was made with';
  check(/id=["']cal-info["']|id=["']playbackCalibration["']|id=["']calibration["']/.test(pb),
        'playback.html needs an element for the recording\'s calibration');
  check(/calibration/.test(pb), 'playback.html must read calibration from /api/recording_meta');

  current = 'playback decode is unchanged';
  check(/function deinterleave\(/.test(pb), 'deinterleave() must survive phase 13 untouched');
  check(/j \* 8/.test(pb), 'and keep its stride of 8');
}

// =====================================================================
// PHASE 16 -- Shared navigation component and page cleanup
// =====================================================================

function phase16() {
  console.log('PHASE 16: shared nav component, page cleanup');
  const live = read('live.html');
  const history = read('history.html');
  const playback = read('playback.html');
  const components = read('components.js');

  current = 'components.js exists and exports emg-nav custom element';
  check(/class EMGNav extends HTMLElement/.test(components), 'components.js must define EMGNav custom element');
  check(/customElements\.define\(['"]emg-nav['"]/.test(components), 'components.js must register emg-nav element');

  current = 'every page loads components.js and includes emg-nav';
  check(/<script src=["']components\.js["']/.test(live), 'live.html must load components.js');
  check(/<emg-nav active=["']live["']/.test(live), 'live.html must have emg-nav active="live"');
  check(/<script src=["']components\.js["']/.test(history), 'history.html must load components.js');
  check(/<emg-nav active=["']history["']/.test(history), 'history.html must have emg-nav active="history"');
  check(/<script src=["']components\.js["']/.test(playback), 'playback.html must load components.js');
  check(/<emg-nav active=["']playback["']/.test(playback), 'playback.html must have emg-nav active="playback"');

  current = 'header is sticky, not fixed';
  check(!/header.*position:\s*fixed|fixed.*top-0.*header/.test(components),
        'components.js header must not use position: fixed');
  check(/sticky top-0/.test(components), 'components.js header must use sticky top-0');
  check(!/backdrop-blur/.test(components), 'no backdrop-blur on header');
  check(!/\/\d+[\s)]/.test(components), 'no alpha classes (bg-…/NN) on header');

  current = 'old headers and navs removed';
  check(!/NANO_V3|CONNECTED/.test(live), 'live.html must not contain the fake NANO_V3 pill');
  check(!/bluetooth_connected/.test(playback), 'playback.html must not have bluetooth button');
  check(!/btn-history/.test(live), 'live.html must not have btn-history button');
  check(!/historyBtn/.test(live), 'live.html must not look up historyBtn');
  check(!/pt-16|mt-16/.test(live + history + playback),
        'no pt-16 or mt-16 compensation classes in any page');

  current = 'live page restructured';
  check(/body.*h-screen.*flex flex-col overflow-hidden/.test(live),
        'live.html body must have h-screen flex flex-col overflow-hidden');
  check(/main.*flex-1 min-h-0.*pb-20/.test(live),
        'live.html main must have flex-1 min-h-0 and keep pb-20');
  check(/role=["']toolbar["']/.test(live), 'live.html bottom controls must have role="toolbar"');
  check(/<div role=["']toolbar["'].*Recording controls/.test(live),
        'toolbar must have aria-label="Recording controls"');

  current = 'live status indicator survives';
  check(/id=["']status-dot["']/.test(live), 'live.html must keep #status-dot');
  check(/id=["']status-label["']/.test(live), 'live.html must keep #status-label');

  current = 'playback sourceFileName moved into main';
  check(/id=["']sourceFileName["']/.test(playback), 'playback.html must keep id="sourceFileName"');
  const sourceIndex = playback.indexOf('id="sourceFileName"');
  const mainCloseIndex = playback.lastIndexOf('</main>');
  check(sourceIndex !== -1 && mainCloseIndex !== -1 && sourceIndex < mainCloseIndex,
        'sourceFileName must appear inside <main> before closing </main>');

  current = 'no other nav elements in pages';
  const navRegex = /<nav[^>]*>/g;
  const liveNavs = (live.match(navRegex) || []).length;
  const historyNavs = (history.match(navRegex) || []).length;
  const playbackNavs = (playback.match(navRegex) || []).length;
  check(liveNavs === 0, 'live.html must have no <nav> elements (emg-nav is handled by components.js)');
  check(historyNavs === 0, 'history.html must have no <nav> elements');
  check(playbackNavs === 0, 'playback.html must have no <nav> elements');
}

// =====================================================================
// PHASE 17 -- progress.html + toggle group (T4)
// =====================================================================

// A tiny fake DOM element, just enough surface for renderToggleGroup:
// attributes, className, textContent, tabIndex, dataset, children,
// click/keydown listeners and querySelectorAll('[role="radio"]').
class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.attributes = {};
    this.dataset = {};
    this.children = [];
    this.className = '';
    this.textContent = '';
    this.type = '';
    this.tabIndex = undefined;
    this._listeners = {};
    this._focused = false;
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(c) { this.children.push(c); return c; }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  addEventListener(type, fn) { this._listeners[type] = fn; }
  set onkeydown(fn) { this._listeners.keydown = fn; }
  get onkeydown() { return this._listeners.keydown; }
  querySelectorAll(sel) {
    if (sel === '[role="radio"]') return this.children.filter((c) => c.attributes.role === 'radio');
    return [];
  }
  focus() { this._focused = true; }
  click() { if (this._listeners.click) this._listeners.click(); }
  fireKey(key) { if (this._listeners.keydown) this._listeners.keydown({ key, preventDefault() {} }); }
}

function phase17() {
  console.log('PHASE 17: progress.html + toggle group');
  const src = read('progress.html');
  const components = read('components.js');

  current = 'exact CDN pins, in order, before inline scripts';
  const chartjsIdx = src.indexOf('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js');
  const adapterIdx = src.indexOf('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js');
  const tailwindIdx = src.indexOf('https://cdn.tailwindcss.com?plugins=forms,container-queries');
  const componentsIdx = src.indexOf('<script src="components.js">');
  check(chartjsIdx !== -1, 'Chart.js 4.5.1 CDN pin must be present verbatim');
  check(adapterIdx !== -1, 'chartjs-adapter-date-fns@3.0.0 CDN pin must be present verbatim');
  check(tailwindIdx !== -1 && tailwindIdx < componentsIdx, 'Tailwind CDN must load before components.js');
  check(componentsIdx !== -1 && componentsIdx < chartjsIdx, 'components.js must load before Chart.js');
  check(chartjsIdx < adapterIdx, 'Chart.js must load before its date-fns adapter');

  current = 'no other external resources besides the pinned CDNs and fonts';
  const scriptSrcs = [...src.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
  const allowed = new Set([
    'https://cdn.tailwindcss.com?plugins=forms,container-queries',
    'components.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js',
  ]);
  for (const s of scriptSrcs) {
    check(allowed.has(s), `unexpected external script: ${s}`);
  }

  current = 'components.js is included and emg-nav is active="progress"';
  check(/<script src=["']components\.js["']/.test(src), 'progress.html must load components.js');
  check(/<emg-nav active=["']progress["']/.test(src), 'progress.html must have emg-nav active="progress"');

  current = 'the page fetches /api/progress';
  check(/fetch\(['"]\/api\/progress['"]\)/.test(src), 'progress.html must fetch /api/progress');

  current = 'autoBucket and bucketKey are pure top-level functions';
  const autoBucketSrc = extractFunction(src, 'autoBucket');
  const bucketKeySrc = extractFunction(src, 'bucketKey');
  check(autoBucketSrc !== null, 'progress.html must define function autoBucket(spanMs)');
  check(bucketKeySrc !== null, 'progress.html must define function bucketKey(date, bucket)');
  if (!autoBucketSrc || !bucketKeySrc) return;

  const autoBucket = eval(`(${autoBucketSrc})`);
  const bucketKey = eval(`(${bucketKeySrc})`);
  const DAY = 24 * 60 * 60 * 1000;

  current = 'autoBucket: span < 2d -> session';
  checkEq(autoBucket(1 * DAY), 'session', '1 day span must auto-pick session');
  current = 'autoBucket: exactly 2d -> day (the < 2d rule is strict)';
  checkEq(autoBucket(2 * DAY), 'day', 'exactly 2 days must auto-pick day, not session');
  current = 'autoBucket: 60d -> day';
  checkEq(autoBucket(60 * DAY), 'day', '60 day span must auto-pick day (<= 60d)');
  current = 'autoBucket: 61d -> week';
  checkEq(autoBucket(61 * DAY), 'week', '61 day span must auto-pick week (> 60d)');

  current = 'bucketKey: day groups by calendar day, midnight boundary honoured';
  checkEq(bucketKey('2026-09-09T00:00:01', 'day'), bucketKey('2026-09-09T23:59:59', 'day'),
          'two timestamps on the same calendar day must land in the same day-bucket');
  check(bucketKey('2026-09-09T23:59:59', 'day') !== bucketKey('2026-09-10T00:00:01', 'day'),
        'crossing midnight must land in a different day-bucket');

  current = 'bucketKey: week groups Monday-Sunday into one bucket';
  // 2026-09-07 is a Monday; 2026-09-13 is the following Sunday.
  const monKey = bucketKey('2026-09-07T05:00:00', 'week');
  const wedKey = bucketKey('2026-09-09T16:45:11', 'week');
  const sunKey = bucketKey('2026-09-13T23:00:00', 'week');
  checkEq(wedKey, monKey, 'a Wednesday must fall in the same week-bucket as its Monday');
  checkEq(sunKey, monKey, 'the following Sunday must still fall in the same week-bucket as its Monday');
  const nextMonKey = bucketKey('2026-09-14T00:00:01', 'week');
  check(nextMonKey !== monKey, 'the next Monday must start a new week-bucket');

  current = 'renderToggleGroup exists and is a real implementation, not the T3 stub';
  check(/function renderToggleGroup\(/.test(components), 'components.js must define renderToggleGroup');
  check(!/Placeholder for T4 implementation/.test(components), 'the T3 stub must be replaced');
  const toggleSrc = extractFunction(components, 'renderToggleGroup');
  check(toggleSrc !== null, 'renderToggleGroup must be a named top-level function');
  if (!toggleSrc) return;

  current = 'renderToggleGroup markup: radiogroup/radio roles, aria-checked, roving tabindex';
  const fakeDocument = { createElement: (tag) => new FakeElement(tag) };
  global.document = fakeDocument;
  const renderToggleGroup = eval(`(${toggleSrc})`);

  const options = [
    { value: 'session', label: 'Session' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
  ];
  const container = new FakeElement('div');
  let lastChange = null;
  renderToggleGroup(container, options, 'day', (v) => { lastChange = v; });

  checkEq(container.attributes.role, 'radiogroup', 'the container must have role="radiogroup"');
  const radios = container.querySelectorAll('[role="radio"]');
  checkEq(radios.length, 3, 'one radio item per option');
  checkEq(radios[0].getAttribute('aria-checked'), 'false', 'Session is not selected');
  checkEq(radios[1].getAttribute('aria-checked'), 'true', 'Day is selected');
  checkEq(radios[2].getAttribute('aria-checked'), 'false', 'Week is not selected');
  checkEq(radios[0].tabIndex, -1, 'only the selected item is in the tab order');
  checkEq(radios[1].tabIndex, 0, 'the selected item has tabIndex 0');

  current = 'exactly one item always selected; clicking selects and fires onChange';
  radios[2].click();
  checkEq(lastChange, 'week', 'clicking an unselected item must fire onChange with its value');
  const radiosAfterClick = container.querySelectorAll('[role="radio"]');
  checkEq(radiosAfterClick.filter((r) => r.getAttribute('aria-checked') === 'true').length, 1,
          'exactly one item must be selected after a click');
  checkEq(radiosAfterClick[2].getAttribute('aria-checked'), 'true', 'Week must now be selected');

  current = 'arrow keys move and select, with wrap';
  lastChange = null;
  container.fireKey('ArrowRight'); // wraps from Week (last) to Session (first)
  checkEq(lastChange, 'session', 'ArrowRight from the last item must wrap to the first');
  lastChange = null;
  container.fireKey('ArrowLeft'); // wraps from Session (first) back to Week (last)
  checkEq(lastChange, 'week', 'ArrowLeft from the first item must wrap to the last');

  current = 'Home/End jump to the ends';
  lastChange = null;
  container.fireKey('Home');
  checkEq(lastChange, 'session', 'Home must select the first item');
  lastChange = null;
  container.fireKey('End');
  checkEq(lastChange, 'week', 'End must select the last item');

  current = 'renderTable never innerHTML-interpolates record fields (DOM injection guard)';
  {
    const renderTableSrc = extractFunction(src, 'renderTable');
    check(renderTableSrc !== null, 'progress.html must define function renderTable()');
    check(!/innerHTML\s*=\s*records\.map/.test(src),
          'renderTable must not build rows as an innerHTML template string keyed off record fields');
    check(/\.textContent\s*=/.test(renderTableSrc || ''),
          'renderTable must set cell text via textContent, not innerHTML');

    if (renderTableSrc) {
      const fmtSrc = extractFunction(src, 'fmt');
      const fakeTbody = new FakeElement('tbody');
      global.document = { getElementById: () => fakeTbody, createElement: (tag) => new FakeElement(tag) };
      global.fmt = fmtSrc ? eval(`(${fmtSrc})`) : ((v) => (v == null ? '—' : String(v)));
      const maliciousFilename = '<img src=x onerror=alert(1)>';
      global.filteredRecords = () => [{
        timestamp: '2026-09-09T03:27:01', filename: maliciousFilename,
        duration_s: 19.7, contraction_count: 9, peak_mv: 1113.97, rms_mv: 142.75,
        strength_mv: 222.95, rate_per_min: 27.5, mean_latency_s: 1.291,
        peak_latency_s: 2.652, fatigue_index: 0.901, imu: { valid: false }, shaky: false,
      }];
      // RECORD_TABLE_COLUMNS is a const the extracted renderTable() closes
      // over; pull it out of the source the same way so the real column
      // list (not a re-typed copy) drives the fake render.
      const colsMatch = src.match(/const RECORD_TABLE_COLUMNS = (\[[\s\S]*?\n\]);/);
      check(colsMatch !== null, 'progress.html must define RECORD_TABLE_COLUMNS next to renderTable');
      if (colsMatch) {
        global.RECORD_TABLE_COLUMNS = eval(colsMatch[1]);
        const renderTable = eval(`(${renderTableSrc})`);
        renderTable();
        checkEq(fakeTbody.children.length, 1, 'renderTable must produce one row for the fake record');
        const row = fakeTbody.children[0];
        const cells = row ? row.children : [];
        check(cells.every((c) => c.tagName !== 'img' && c.tagName !== 'IMG'),
              'a crafted filename must never become a real <img> element (DOM injection)');
        const filenameCell = cells[1];
        check(!!filenameCell && filenameCell.textContent === maliciousFilename,
              'the filename must be set as literal text (textContent), never parsed as markup');
        delete global.RECORD_TABLE_COLUMNS;
      }
      delete global.document;
      delete global.fmt;
      delete global.filteredRecords;
    }
  }

  delete global.document;
}

// =====================================================================

const only = process.argv[2];
for (const [name, fn] of [['8', phase8], ['9', phase9], ['13', phase13], ['16', phase16], ['17', phase17]]) {
  if (only && only !== name) continue;
  console.log('='.repeat(62));
  try {
    fn();
  } catch (e) {
    failures++;
    console.log(`  PHASE ${name} CRASHED: ${e.message}`);
  }
}
console.log('='.repeat(62));
console.log(`${checks - failures}/${checks} checks passed` + (failures ? `  (${failures} FAILED)` : ''));
process.exit(failures ? 1 : 0);

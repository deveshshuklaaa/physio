// Layer 2: APP-B consent work — APP-B1 (s.5 notice), APP-B2 (major/minor versioning per purpose),
// APP-B3 (re-prompt behaviour), APP-B12 (withdrawal), and the D22 AMENDMENT of 2026-10-12.
//
// Owner: test-security-agent (docs/19 §10.2). Written BEFORE any implementation (§0.1 gate 2).
// A builder may READ this file and may NOT edit it (§10.0, the wall).
//
// Authority: docs/19 §7 APP-B row, APP-B1..B3, APP-B12; SECURITY.md 0.1, 0.2, 1.1;
// doc 16 D22 **as amended** — core data-collection consent and error-photograph consent are
// MANDATORY (docs/19 §13 item 56). That amendment is why there is no "declined photo" test here
// and a "cannot decline" test instead.
//
// What this file deliberately does NOT test: the consent WORDING. It is owed by the owner
// (§8 constraint 7 class of content, §13 item 57) and the build ships marked placeholders. These
// tests pin the machinery and the structural presence of each notice element, never the prose.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");
const H = require("./layer2_helpers");

// Four processing purposes (D22) + the two acceptances. Owner decision 2026-10-12 (debate entry 3
// specific 12), SHAPE SETTLED 2026-10-12: **one document, two doors.** All six keys live on
// patientprofiles with the identical sub-document shape; the split is enforced by WHICH ROUTE MAY
// WRITE WHICH KEYS, not by a second collection and not merely by a two-step screen:
//
//   POST /api/profile/consent      whitelist = the FOUR purposes.    A body carrying an
//                                  acceptance key is rejected 400.
//   POST /api/profile/acceptances  whitelist = the TWO acceptances.  A body carrying a
//                                  purpose key is rejected 400.
//
// Splitting the existing one whitelist into two IS the unbundling — that is what makes "separate
// affirmative action" provable server-side. The mechanism already exists in src/routes/profile.js:
// `allow(req.body, CONSENT_FIELDS)` + `check(req.body, CONSENT_SPEC)` from src/utils/allow, where
// CONSENT_FIELDS is today ONE list of five keys (3 purposes + both acceptances, and no
// consentErrorPhotos at all) — i.e. the bundling defect is the whitelist itself.
//
// Three consequences pinned below: acceptances get NO `history` array (terms are not withdrawable
// — you stop using the service instead); each acceptance carries its OWN contentHash, so which
// wording a patient saw is provable independently of the consents; and the two doors must be
// satisfiable IN EITHER ORDER or a half-registered patient is stuck.
const PURPOSES = ["consentDataCollection", "consentAI", "consentVideoMonitoring", "consentErrorPhotos"];
const ACCEPTANCES = ["privacyAccepted", "termsAccepted"];
const ALL_SIX = [...PURPOSES, ...ACCEPTANCES];
// Mandatory per the D22 amendment: no decline path, no feature-disable branch.
const MANDATORY = ["consentDataCollection", "consentErrorPhotos"];
const OPTIONAL = ["consentAI", "consentVideoMonitoring"];
const SUBDOC_KEYS = ["granted", "majorVersion", "minorVersion", "contentHash", "grantedAt", "method", "locale"];

const ctx = {};
const profileOf = async (p) => H.dec().collection("patientprofiles").findOne(
  { userId: { $in: [new ObjectId(p.id), p.id] } });

before(async () => {
  await H.setup();
  ctx.p = await H.mkPatient();
  ctx.q = await H.mkPatient();
  await H.mkProfile(ctx.q);
  // A patient who will walk the two doors in the OPPOSITE order.
  ctx.r = await H.mkPatient();
});
after(() => H.finish());

// A full, valid submission of the FOUR PROCESSING PURPOSES only.
//
// CORRECTED by the owning tester: this used to carry ALL_SIX, which made it the exact body the
// APP-B1 unbundling test below requires to be REFUSED. Two tests of this file demanded opposite
// answers from one request, so one of them could never go green. Owner decision 2026-10-12
// (debate entry 3 specific 12) settles it: the two acceptances are a SEPARATE step, so the valid
// consent body is the four purposes.
const grantAll = (over = {}) => ({
  ...Object.fromEntries(PURPOSES.map((k) => [k, { granted: true, locale: "en" }])),
  ...over,
});
// The other door. Same sub-document shape, different whitelist.
const acceptAll = (over = {}) => ({
  ...Object.fromEntries(ACCEPTANCES.map((k) => [k, { granted: true, locale: "en" }])),
  ...over,
});
const CONSENT_DOOR = "/api/profile/consent";
const ACCEPT_DOOR = "/api/profile/acceptances";
const postConsent = (p, json = grantAll()) => H.api("POST", CONSENT_DOOR, { token: p.token, json });
const postAcceptances = (p, json = acceptAll()) => H.api("POST", ACCEPT_DOOR, { token: p.token, json });

// =====================================================================
// 1. APP-B2 — the stored shape. One sub-document per purpose, six of them.
// =====================================================================

test("B2 a consent save stores a sub-document per purpose, not a bare boolean", async () => {
  const res = await H.api("POST", "/api/profile/consent", { token: ctx.p.token, json: grantAll() });
  assert.ok([200, 201].includes(res.status), `consent save -> ${res.status}: ${JSON.stringify(res.body).slice(0, 160)}`);
  await H.tagUser(ctx.p.id);
  const prof = await profileOf(ctx.p);
  assert.ok(prof, "no patientprofiles row written");
  for (const k of PURPOSES) {
    assert.strictEqual(typeof prof[k], "object", `${k} is still a bare ${typeof prof[k]} — D22 requires a sub-document`);
    for (const f of SUBDOC_KEYS)
      assert.ok(f in prof[k], `${k} is missing "${f}" (SECURITY.md 0.2 Step 1)`);
  }
});

test("B2 the content hash is recorded and is a hash, not the rendered text", async () => {
  const prof = await profileOf(ctx.p);
  for (const k of PURPOSES) {
    const h = prof?.[k]?.contentHash;
    assert.match(String(h), /^[a-f0-9]{64}$/,
      `${k}.contentHash is not a SHA-256 hex digest ("${String(h).slice(0, 40)}") — the hash is what proves what the patient actually saw`);
  }
});

test("B2 method and locale are recorded, so web and app consents are distinguishable", async () => {
  const prof = await profileOf(ctx.p);
  for (const k of PURPOSES) {
    assert.ok(["web_form", "app_form"].includes(prof[k].method), `${k}.method = "${prof[k].method}"`);
    assert.ok(["en", "hi", "mr"].includes(prof[k].locale), `${k}.locale = "${prof[k].locale}" — we support en/hi/mr (src/i18n)`);
  }
});

test("B2 the acceptances door stores the same sub-document shape, on the same document", async () => {
  const res = await postAcceptances(ctx.p);
  assert.ok([200, 201].includes(res.status), `${ACCEPT_DOOR} -> ${res.status}: ${JSON.stringify(res.body).slice(0, 160)}`);
  await H.tagUser(ctx.p.id);
  const prof = await profileOf(ctx.p);
  assert.ok(prof, "no patientprofiles row");
  for (const k of ACCEPTANCES) {
    assert.strictEqual(typeof prof[k], "object", `${k} is a bare ${typeof prof[k]} — all six keys share one shape`);
    for (const f of SUBDOC_KEYS) assert.ok(f in prof[k], `${k} is missing "${f}"`);
    assert.strictEqual(prof[k].granted, true);
  }
  // One document, two doors: the consent door's writes are still there afterwards.
  for (const k of PURPOSES)
    assert.strictEqual(prof[k]?.granted, true, `writing the acceptances clobbered ${k} — same document, not a second write path`);
});

test("B2 each acceptance carries its OWN contentHash, not the consents'", async () => {
  const prof = await profileOf(ctx.p);
  const consentHashes = new Set(PURPOSES.map((k) => prof[k]?.contentHash));
  for (const k of ACCEPTANCES) {
    assert.match(String(prof[k]?.contentHash), /^[a-f0-9]{64}$/, `${k}.contentHash is not a SHA-256 hex digest`);
    assert.ok(!consentHashes.has(prof[k].contentHash),
      `${k}.contentHash equals a consent purpose's — which terms wording the patient saw must be provable ` +
      "independently of which consent wording they saw");
  }
  assert.notStrictEqual(prof.privacyAccepted.contentHash, prof.termsAccepted.contentHash,
    "privacy and terms share one hash — they are two documents");
});

test("B2 an acceptance has NO history array: terms are not withdrawable", async () => {
  const prof = await profileOf(ctx.p);
  for (const k of ACCEPTANCES)
    assert.strictEqual(prof[k].history, undefined,
      `${k} carries a history array. Withdrawal is a consent concept — you stop using the service ` +
      "instead — and a withdrawal history on terms implies a withdraw path that must not exist");
});

test("B12 the acceptances door refuses a withdrawal of an acceptance", async () => {
  const c0 = await H.snapshot();
  for (const k of ACCEPTANCES) {
    const res = await H.api("POST", "/api/profile/consent/withdraw", { token: ctx.p.token, json: { purpose: k } });
    assert.ok([400, 409].includes(res.status),
      `withdrawing ${k} -> ${res.status}: an acceptance is not a processing consent and has no withdraw path`);
  }
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "a refused acceptance-withdrawal wrote something");
});

// =====================================================================
// 1b. The two doors. The whitelist split IS the unbundling (owner, 2026-10-12).
// =====================================================================

test("B1 the consent door REFUSES an acceptance key", async () => {
  const c0 = await H.snapshot();
  const res = await postConsent(ctx.q, grantAll({ termsAccepted: { granted: true, locale: "en" } }));
  assert.strictEqual(res.status, 400,
    `${CONSENT_DOOR} accepted termsAccepted (-> ${res.status}). Today src/routes/profile.js has ONE ` +
    "whitelist of five keys covering both purposes and acceptances, so one request bundles them — " +
    "DPDP requires them unbundled (SECURITY.md 0.1 Step 3)");
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "the rejected bundled body still wrote");
});

test("B1 the acceptances door REFUSES a consent purpose", async () => {
  const c0 = await H.snapshot();
  const res = await postAcceptances(ctx.q, acceptAll({ consentAI: { granted: true, locale: "en" } }));
  assert.strictEqual(res.status, 400,
    `${ACCEPT_DOOR} accepted consentAI (-> ${res.status}): the split must hold in BOTH directions, ` +
    "or the second door becomes a way round the first");
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "the rejected bundled body still wrote");
});

test("B1 the two doors are satisfiable IN EITHER ORDER", async () => {
  // Acceptances FIRST this time. A patient who hits the doors in the other order must not be stuck
  // half-registered, which is what an order dependency between them would do.
  const a = await postAcceptances(ctx.r);
  assert.ok([200, 201].includes(a.status), `${ACCEPT_DOOR} first -> ${a.status}: the doors are order-dependent`);
  await H.tagUser(ctx.r.id);
  const c = await postConsent(ctx.r);
  assert.ok([200, 201].includes(c.status), `${CONSENT_DOOR} after the acceptances -> ${c.status}`);
  await H.tagUser(ctx.r.id);
  const prof = await profileOf(ctx.r);
  for (const k of ALL_SIX)
    assert.strictEqual(prof?.[k]?.granted, true, `${k} is not granted after walking both doors acceptances-first`);
});

test("B2 consent text and versions live in exactly ONE file", () => {
  // SECURITY.md 0.2 Step 2. Server-rendered, so the hash is computed from what was displayed.
  const roots = [path.join(H.root, "src"), path.join(H.root, "config")];
  const found = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules") walk(f); continue; }
      if (!/\.(js|json)$/.test(e.name)) continue;
      const s = fs.readFileSync(f, "utf8");
      if (/majorVersion/.test(s) && /(consentText|CONSENT_TEXT|consentVersions|CONSENT_VERSIONS)/.test(s)) found.push(path.relative(H.root, f));
    }
  };
  roots.filter(fs.existsSync).forEach(walk);
  assert.strictEqual(found.length, 1,
    `consent text + versions must live in exactly one file, found ${found.length}: ${found.join(", ")}`);
});

// =====================================================================
// 2. APP-B3 — re-prompt behaviour. Major re-prompts, minor does not, terms disables nothing.
// =====================================================================

// The server decides who needs re-prompting; the client must not. Pinned as a read on the profile
// route rather than a new endpoint, so the test does not invent an API the builder has not chosen.
const needsReprompt = async (p) => {
  const res = await H.api("GET", "/api/profile/patient-profile", { token: p.token });
  assert.ok([200].includes(res.status), `profile read -> ${res.status}`);
  const r = res.body?.consentReprompt;
  assert.ok(r && typeof r === "object",
    "the profile response carries no consentReprompt object — the server must decide who is re-prompted, not the client");
  return r;
};

test("B3 a MAJOR bump re-prompts for that purpose and names what changed", async () => {
  const prof = await profileOf(ctx.p);
  await H.db().collection("patientprofiles").updateOne({ _id: prof._id },
    { $set: { "consentAI.majorVersion": prof.consentAI.majorVersion - 1 } });
  const r = await needsReprompt(ctx.p);
  assert.ok(r.purposes?.includes("consentAI"), `consentAI not flagged for re-prompt: ${JSON.stringify(r).slice(0, 160)}`);
  assert.ok(r.changeSummary && Object.keys(r.changeSummary).length,
    "no change summary: users skim, and an unmarked re-show of 1,300 lines is not informed consent (D22)");
});

test("B3 a MINOR bump does NOT re-prompt", async () => {
  const prof = await profileOf(ctx.q);
  await H.api("POST", "/api/profile/consent", { token: ctx.q.token, json: grantAll() });
  await H.tagUser(ctx.q.id);
  const after = await profileOf(ctx.q);
  await H.db().collection("patientprofiles").updateOne({ _id: after._id },
    { $set: { "consentVideoMonitoring.minorVersion": after.consentVideoMonitoring.minorVersion - 1 } });
  const r = await needsReprompt(ctx.q);
  assert.ok(!r.purposes?.includes("consentVideoMonitoring"),
    "a minor bump re-prompted: one Hindi typo fix would re-prompt every Hindi speaker (D22)");
  void prof;
});

test("B3 re-prompting triggers on the version, never on a hash of the rendered text", async () => {
  const prof = await profileOf(ctx.q);
  await H.db().collection("patientprofiles").updateOne({ _id: prof._id },
    { $set: { "consentAI.contentHash": crypto.randomBytes(32).toString("hex") } });
  const r = await needsReprompt(ctx.q);
  assert.ok(!r.purposes?.includes("consentAI"),
    "a changed contentHash triggered a re-prompt — the trigger must be the version identifier (D22)");
});

test("B3 a TERMS major bump re-prompts but disables NO feature", async () => {
  const acc = await postAcceptances(ctx.q);
  assert.ok([200, 201].includes(acc.status), `${ACCEPT_DOOR} -> ${acc.status}: cannot bump what was never accepted`);
  await H.tagUser(ctx.q.id);
  const prof = await profileOf(ctx.q);
  assert.strictEqual(typeof prof?.termsAccepted?.majorVersion, "number",
    "termsAccepted carries no majorVersion after a successful acceptance — the acceptances door did not " +
    "write the versioned sub-document");
  await H.db().collection("patientprofiles").updateOne({ _id: prof._id },
    { $set: { "termsAccepted.majorVersion": prof.termsAccepted.majorVersion - 1 } });
  const r = await needsReprompt(ctx.q);
  assert.ok(r.purposes?.includes("termsAccepted"), "a terms major bump did not re-prompt");
  assert.deepStrictEqual(r.disabledFeatures ?? [], [],
    "a terms bump disabled a feature: terms acceptance is not a processing consent (debate entry 3 specific 12)");
});

test("B3 an outdated OPTIONAL consent disables only its feature and the session still runs", async () => {
  const prof = await profileOf(ctx.q);
  await H.db().collection("patientprofiles").updateOne({ _id: prof._id },
    { $set: { "consentAI.majorVersion": prof.consentAI.majorVersion - 1 } });
  const r = await needsReprompt(ctx.q);
  assert.deepStrictEqual(r.disabledFeatures, ["consentAI"], `expected only consentAI disabled: ${JSON.stringify(r.disabledFeatures)}`);
  assert.notStrictEqual(r.blocked, true,
    "an optional consent bump blocked the patient — never block the session or treatment over an optional purpose (D22, DPDP s.6)");
});

// =====================================================================
// 3. The D22 AMENDMENT — core and photo consent are MANDATORY (§13 item 56).
//    If this amendment is ever reversed, these four tests are the ones that invert.
// =====================================================================

for (const k of MANDATORY) {
  test(`D22-amended ${k} cannot be saved as declined`, async () => {
    const c0 = await H.snapshot();
    const res = await H.api("POST", "/api/profile/consent", {
      token: ctx.p.token, json: grantAll({ [k]: { granted: false, locale: "en" } }),
    });
    assert.strictEqual(res.status, 400,
      `got ${res.status}: ${k} is mandatory — "to use this app you must agree to this" (owner 2026-10-12)`);
    assert.ok(/must agree/i.test(JSON.stringify(res.body)),
      `the refusal does not tell the patient they must agree: ${JSON.stringify(res.body).slice(0, 160)}`);
    assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "a declined mandatory consent was partially written");
  });

  test(`D22-amended withdrawing ${k} is refused and nothing is erased`, async () => {
    const c0 = await H.snapshot();
    const res = await H.api("POST", "/api/profile/consent/withdraw", { token: ctx.p.token, json: { purpose: k } });
    assert.strictEqual(res.status, 409,
      `got ${res.status}: withdrawing a mandatory consent must be refused with the "must agree" message, not silently accepted`);
    assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {},
      "withdrawing a mandatory consent erased or wrote something on the first action");
    const prof = await profileOf(ctx.p);
    assert.strictEqual(prof[k].granted, true, `${k}.granted was flipped despite the refusal`);
  });
}

test("D22-amended there is no declined-photo branch left to build", () => {
  // APP-F5 / APP-K3 / APP-K4 must not carry a "patient declined photos" path (§13 item 56).
  // CORRECTED: this pointed at ours/frontend/src/lib (the live-pose client, which has no consent
  // code at all) and so could only ever pass vacuously. It now scans the web client and server
  // that actually render consent. The Dart side is APP-K and is not scannable from here.
  const roots = [path.join(H.root, "..", "frontend", "src"), path.join(H.root, "src")];
  assert.ok(roots.every((d) => fs.existsSync(d)), `scan root missing: ${roots.join(", ")}`);
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules") walk(f); continue; }
      if (!/\.(js|jsx|mjs)$/.test(e.name)) continue;
      const t = fs.readFileSync(f, "utf8");
      // a DECLINED branch, not merely a mention of the field
      if (/(consentErrorPhotos|photoConsent)/.test(t) && /(declin|!\s*consentErrorPhotos|=== false)/.test(t))
        hits.push(path.relative(H.root, f));
    }
  };
  roots.forEach(walk);
  assert.deepStrictEqual(hits, [], `a photo-consent branch exists in ${hits.join(", ")} — photo consent is mandatory, so there is no declined case`);
});

// =====================================================================
// 4. APP-B12 — withdrawal of the OPTIONAL purposes. Append, never a field wipe.
// =====================================================================

for (const k of OPTIONAL) {
  test(`B12 ${k} can be withdrawn per purpose, and the history survives`, async () => {
    const res = await H.api("POST", "/api/profile/consent/withdraw", { token: ctx.q.token, json: { purpose: k } });
    assert.ok([200, 204].includes(res.status), `withdraw ${k} -> ${res.status}`);
    const prof = await profileOf(ctx.q);
    assert.strictEqual(prof[k].granted, false, `${k} was not withdrawn`);
    assert.ok(Array.isArray(prof[k].history) && prof[k].history.length >= 1,
      `${k} has no history: withdrawal is an APPEND, never a field wipe — we must prove what was granted and when it ended (SECURITY.md 1.1)`);
  });
}

test("B12 withdrawal is per purpose, not all-or-nothing", async () => {
  const prof = await profileOf(ctx.q);
  assert.strictEqual(prof.consentDataCollection.granted, true,
    "withdrawing an optional purpose also revoked the core consent");
});

test("B12 withdrawing consentAI stops the Gemini report path", async () => {
  // SECURITY.md 1.6: a flag collected and ignored is worse than not collecting it.
  const res = await H.api("GET", "/api/profile/patient-profile", { token: ctx.q.token });
  assert.strictEqual(res.body?.consentReprompt?.disabledFeatures?.includes("consentAI"), true,
    "consentAI is withdrawn but the AI feature is not reported disabled");
});

// =====================================================================
// 5. APP-B1 — the s.5 notice elements, and the unbundling. Structure, never prose.
// =====================================================================

const consentScreen = () => {
  const p = path.join(H.root, "..", "frontend", "src", "pages", "ConsentScreen.jsx");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
};

test("B1 the consent notice carries all five s.5 elements, each findable", () => {
  const s = consentScreen();
  if (s === null) return assert.fail("ConsentScreen.jsx not found at the expected path");
  for (const [label, re] of [
    ["what data is collected", /data[\s-]?(collected|categories)/i],
    ["purpose of processing", /purpose/i],
    ["how to exercise rights", /your rights|exercise .{0,20}rights/i],
    ["how to withdraw consent", /withdraw/i],
    ["how to complain", /grievance|complain/i],
  ]) assert.match(s, re, `the notice has no "${label}" section (DPDP s.5; SECURITY.md 0.1 found ZERO matches for grievance|complain in 1,361 lines)`);
});

test("B1 the grievance contact is published on the screen", () => {
  const s = consentScreen();
  assert.match(String(s), /hemophiliadetection@gmail\.com/,
    "the decided grievance contact is not on the consent screen (SECURITY.md 0.1 Step 2)");
});

test("B1 the unbundling is in the WHITELISTS, not only in the screen flow", () => {
  // Pinned in source as well as over HTTP: a two-step screen that posts to one permissive route is
  // not unbundled, and the HTTP tests above would still pass if the server merely ignored the
  // extra keys rather than rejecting them.
  const s = fs.readFileSync(path.join(H.root, "src/routes/profile.js"), "utf8")
    .split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  const m = /const\s+CONSENT_FIELDS\s*=\s*\[([^\]]*)\]/.exec(s);
  assert.ok(m, "CONSENT_FIELDS not found in profile.js");
  const fields = m[1].match(/["'`]([^"'`]+)["'`]/g)?.map((x) => x.slice(1, -1)) ?? [];
  assert.deepStrictEqual(fields.sort(), [...PURPOSES].sort(),
    `the consent whitelist is ${JSON.stringify(fields)} — it must be exactly the four purposes. ` +
    "Today it is one list of five keys carrying BOTH acceptances and missing consentErrorPhotos, " +
    "which is the bundling defect itself (SECURITY.md 0.1 Step 3)");
  assert.match(s, /ACCEPTANCE_FIELDS|ACCEPTANCE_SPEC/,
    "there is no second whitelist for the acceptances door");
});

// =====================================================================
// 6. §13 item 47 — the consent route accepts an all-false body today.
// =====================================================================

test("item 47 an all-declined consent body is refused, not stored as a consent", async () => {
  const c0 = await H.snapshot();
  const res = await H.api("POST", "/api/profile/consent", {
    // PURPOSES only: an ALL_SIX body would now be refused by the consent door's whitelist, which
    // would make this pass for the wrong reason.
    token: ctx.p.token, json: Object.fromEntries(PURPOSES.map((k) => [k, { granted: false, locale: "en" }])),
  });
  assert.strictEqual(res.status, 400,
    `got ${res.status}: an all-false body is recorded as a valid consent today (§8 constraint 5)`);
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "an all-declined consent wrote data");
});

// =====================================================================
// 7. SECURITY.md 0.2 Step 4 — existing rows migrate, nothing back-filled with invented data.
// =====================================================================

test("B2 pre-versioning rows migrate to major 1 / minor 0 with a NULL hash", async () => {
  const rows = await H.dec().collection("patientprofiles")
    .find({ __testRun: { $exists: false } }).limit(50).toArray();
  if (!rows.length) return; // a freshly refreshed db may hold none
  for (const r of rows) for (const k of ALL_SIX) {
    if (r[k] === undefined) continue;
    assert.strictEqual(typeof r[k], "object", `legacy row ${r._id} still has a bare boolean at ${k} — the conversion did not run`);
    if (r[k].contentHash === null) {
      assert.strictEqual(r[k].majorVersion, 1, `legacy ${k} should migrate to majorVersion 1`);
      assert.strictEqual(r[k].minorVersion, 0, `legacy ${k} should migrate to minorVersion 0`);
    }
    assert.ok(r[k].contentHash === null || /^[a-f0-9]{64}$/.test(r[k].contentHash),
      `legacy ${k}.contentHash was back-filled with a guess: null means "pre-versioning, text not recorded" (SECURITY.md 0.2 Step 4)`);
  }
});

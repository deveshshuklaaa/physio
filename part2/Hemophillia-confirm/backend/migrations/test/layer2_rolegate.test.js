// Layer 2: APP-B role gate (APP-B15..B19), the audit line (APP-B9), the clinician removal,
// and the two authorisation-shaped validation holes from docs/19 §13 item 47.
//
// Owner: test-security-agent (docs/19 §10.2, per-file ownership — the other layer2_* files are
// test-data-agent's). Written BEFORE any implementation, per §0.1 gate 2. A builder may READ this
// file and may NOT edit it (§10.0, the wall).
//
// Authority: docs/19 §7 APP-B row, APP-B15..B19, APP-B9; SECURITY.md 2.6.1, 1.4, S6.13; D42.
// Non-production only — the guard lives in layer2_helpers.assertTargets() and is exercised by
// layer2_guard_matrix.test.js, which needs no stack.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md):
//   node --max-old-space-size=384 --test --test-concurrency=1 migrations/test/layer2_rolegate.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const H = require("./layer2_helpers");

const routesDir = path.join(H.root, "src/routes");
const mwDir = path.join(H.root, "src/middleware");
const src = (f, dir = routesDir) => fs.readFileSync(path.join(dir, f), "utf8");
// Comment-stripped, so a commented-out gate never counts as a gate. Every source assertion below
// uses this: these files carry large commented-out historical blocks.
const live = (f, dir = routesDir) => src(f, dir).split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");

// ---- The 12 routes behind authMiddleware, and the 6 already behind staffAuth.
// ENUMERATED FROM SOURCE, never typed out: docs/19 APP-B16 said 18 and SECURITY.md 2.6.1 said
// exerciseRecommendations.js contributed 8. Both were wrong (it is 2 + 6, total 12 — §13 item 63).
// A hand-written list would have encoded the wrong number into the test that exists to catch it.
const MOUNTS = {
  "profile.js": "/api/profile",
  "hemophiliaDetails.js": "/api/hemophilia-details",
  "exerciseRecommendations.js": "/api/exercise-recommendations",
  "assessment.js": "/api/assessment",
  "fhir.js": "/api/fhir",
};
function enumerate() {
  const out = [];
  for (const [file, mount] of Object.entries(MOUNTS)) {
    const s = live(file);
    // router.<verb>( "<path>" [, ...middleware...] , handler
    for (const m of s.matchAll(/router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]([\s\S]*?)(?:async\s*\(|\(\s*req\s*,)/g)) {
      const [, verb, p, mids] = m;
      out.push({
        file, mount, verb: verb.toUpperCase(), url: mount + (p === "/" ? "" : p),
        authMw: /\bauthMiddleware\b/.test(mids),
        staff: /\bstaffAuth\b/.test(mids),
        allowRoles: /\ballowRoles\s*\(/.test(mids),
      });
    }
  }
  return out;
}
const ALL = enumerate();
const PATIENT_ROUTES = ALL.filter((r) => r.authMw);
const STAFF_ROUTES = ALL.filter((r) => r.staff);

// A URL with an :id segment needs something syntactically valid; the gate must reject before the
// handler ever looks at it, so a dummy id is the correct input for a gate test.
const concrete = (u) => u.replace(/:[A-Za-z_][\w]*/g, "000000000000000000000009");
// MEASURED: undici throws `TypeError: Request with GET/HEAD method cannot have body.` — a gate test
// that dies in fetch() is not a gate test, so GET/HEAD carry no body.
const payload = (verb) => (["GET", "HEAD"].includes(verb) ? {} : { json: {} });

const ctx = {};
before(async () => {
  await H.setup();
  ctx.patient = await H.mkPatient();
  await H.mkProfile(ctx.patient);
  ctx.admin = await H.mkAdmin({ level: "ADMIN", perms: { canViewPatients: true } });
  // No doctor fixture exists in layer2_helpers (G2 builds one via HTTP + admin approval, which
  // needs working SMTP). A gate test only needs a well-formed doctor claim, and JWT_SECRET is
  // shared with the app under test — same technique mkAdmin already uses for admins.
  ctx.doctorId = new ObjectId().toString();
  ctx.doctor = {
    id: ctx.doctorId, role: "doctor", professionalId: "DOCTEST001",
    token: jwt.sign({ userId: ctx.doctorId, professionalId: "DOCTEST001", role: "doctor" },
      process.env.JWT_SECRET, { expiresIn: "1h" }),
  };
  // The role this phase deletes (§13 items 51, 52). Minted to prove it is refused everywhere.
  ctx.clinician = {
    id: new ObjectId().toString(), role: "clinician",
    token: jwt.sign({ userId: new ObjectId().toString(), professionalId: "CLINTEST001", role: "clinician" },
      process.env.JWT_SECRET, { expiresIn: "1h" }),
  };
});
// Every authenticated call in this file makes the app write an APP-B9 audit record, and the audit
// collection has no userId, so tagUser()'s USER_REFS cannot reach it. Untagged rows = orphans =
// finish()'s per-collection baseline assertion trips on every run, which would make the whole file
// fail in teardown no matter what the gates did. Adopt them by actor id first.
after(async () => {
  try {
    const ids = [ctx.patient, ctx.admin, ctx.doctor, ctx.clinician].filter(Boolean).map((a) => a.id);
    const any = ids.flatMap((i) => [i, new ObjectId(String(i))]);
    if (any.length && (await H.collNames()).includes(AUDIT))
      await H.tagWhere(AUDIT, { actorId: { $in: any } });
  } catch (e) { console.error("audit adoption failed:", e.message); }
  await H.finish();
});

// =====================================================================
// 0. The enumeration itself. If these drift, every assertion below is measuring the wrong set.
// =====================================================================

test("B16 the route census matches the corrected counts: 12 behind authMiddleware, 6 behind staffAuth", () => {
  const perFile = Object.fromEntries(Object.keys(MOUNTS).map((f) => [f, PATIENT_ROUTES.filter((r) => r.file === f).length]));
  assert.deepStrictEqual(perFile, {
    "profile.js": 3, "hemophiliaDetails.js": 5, "exerciseRecommendations.js": 2,
    "assessment.js": 1, "fhir.js": 1,
  }, `authMiddleware census changed: ${JSON.stringify(perFile)}`);
  assert.strictEqual(PATIENT_ROUTES.length, 12, "expected 12 routes behind authMiddleware");
  assert.strictEqual(STAFF_ROUTES.length, 6, "expected 6 routes behind staffAuth in the mixed file");
  // §7 scopes the gate at 18: 12 gain the gate, 6 are proven untouched.
  assert.strictEqual(PATIENT_ROUTES.length + STAFF_ROUTES.length, 18);
});

test("B17 the staff routes in the mixed file are exactly the /doctor/* ones (answered by path, not audit)", () => {
  const staffPaths = STAFF_ROUTES.map((r) => r.url).sort();
  assert.ok(staffPaths.every((u) => u.startsWith("/api/exercise-recommendations/doctor/")),
    `a staffAuth route is not under /doctor/: ${staffPaths.join(", ")}`);
  const patientInMixed = PATIENT_ROUTES.filter((r) => r.file === "exerciseRecommendations.js").map((r) => r.url).sort();
  assert.deepStrictEqual(patientInMixed,
    ["/api/exercise-recommendations", "/api/exercise-recommendations/generate"]);
});

// =====================================================================
// 1. APP-B15 — req.role is set, and identity stops being logged.
// =====================================================================

test("B15 auth.js sets req.role from the verified token", () => {
  const s = live("auth.js", mwDir);
  assert.match(s, /req\.role\s*=\s*decoded\.role\s*;/,
    "auth.js does not set req.role — allowRoles() is unusable on every route behind it (SECURITY.md 2.6.1)");
});

test("B15/S6.13 no middleware logs identity — ALL THREE sites, not just auth.js", () => {
  // The legitimate repo-wide sweep: completeness is the point and a miss is the failure (§0.2).
  const offenders = [];
  for (const f of fs.readdirSync(mwDir).filter((f) => f.endsWith(".js"))) {
    const s = live(f, mwDir);
    for (const m of s.matchAll(/console\.(log|error|warn|info|debug)\(([\s\S]{0,200}?)\)\s*;/g)) {
      const arg = m[2];
      if (/\b(decoded|userId|req\.userId|professionalId|role|token|authHeader)\b/.test(arg)) {
        offenders.push(`${f}: console.${m[1]}(${arg.replace(/\s+/g, " ").slice(0, 90)})`);
      }
    }
  }
  assert.deepStrictEqual(offenders, [],
    `identity is logged into container logs (SECURITY.md 2.6.1 constraint 2 names 3 sites; worst is roleMiddleware.js printing the whole decoded token):\n  ${offenders.join("\n  ")}`);
});

test("B15 adminAuthMiddleware.js — the dead duplicate — is gone", () => {
  assert.strictEqual(fs.existsSync(path.join(mwDir, "adminAuthMiddleware.js")), false,
    "adminAuthMiddleware.js still exists: two implementations of one gate is how they drift (SECURITY.md 2.6.1)");
});

test("B19 adminAuth keeps its per-request DB re-read — it is better than allowRoles, do not flatten it", () => {
  const s = live("adminAuth.js", mwDir);
  assert.match(s, /AdminProfile/, "adminAuth no longer reads AdminProfile: immediate admin revocation lost");
  assert.match(s, /User\.findById|User\.findOne/, "adminAuth no longer re-reads the user row every request");
});

test("B19 no second role gate was invented beside allowRoles", () => {
  const names = new Set();
  for (const f of fs.readdirSync(mwDir).filter((f) => f.endsWith(".js")))
    for (const m of live(f, mwDir).matchAll(/\b(requireRole|hasRole|checkRole|ensureRole)\b/g)) names.add(m[1]);
  assert.deepStrictEqual([...names], [],
    `a second role gate exists beside allowRoles: ${[...names].join(", ")} (SECURITY.md 2.6.1 constraint 1)`);
});

// =====================================================================
// 2. APP-B16 — the 12 patient routes. Asserted over ALL of them, never a sample (§7).
// =====================================================================

for (const r of PATIENT_ROUTES) {
  test(`B16 ${r.verb} ${r.url} mounts allowRoles("patient") in source`, () => {
    assert.ok(r.allowRoles, `${r.file} ${r.verb} ${r.url} has authMiddleware but no allowRoles(...)`);
  });

  test(`B16 ${r.verb} ${r.url} refuses a DOCTOR token with 403`, async () => {
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.doctor.token, ...payload(r.verb) });
    assert.strictEqual(res.status, 403,
      `doctor token got ${res.status} on a patient-only route (body: ${JSON.stringify(res.body).slice(0, 120)})`);
  });

  test(`B16 ${r.verb} ${r.url} refuses an ADMIN token with 403`, async () => {
    // Deliberate: admins read patient data through the adminAuth-gated research routes, which are
    // all-patients by design (owner 2026-10-11). These 12 resolve their subject from req.userId,
    // so an admin here would fetch the admin's own non-existent patient record.
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.admin.token, ...payload(r.verb) });
    assert.strictEqual(res.status, 403, `admin token got ${res.status} on a patient-only route`);
  });

  test(`B16 ${r.verb} ${r.url} refuses a CLINICIAN token (the role being deleted)`, async () => {
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.clinician.token, ...payload(r.verb) });
    assert.strictEqual(res.status, 403, `clinician token got ${res.status}`);
  });

  test(`B16 ${r.verb} ${r.url} still admits a PATIENT token (the gate did not lock the owner out)`, async () => {
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.patient.token, ...payload(r.verb) });
    assert.ok(![401, 403].includes(res.status),
      `patient token got ${res.status} on their own route — the gate is too tight`);
  });

  test(`B16 ${r.verb} ${r.url} still refuses an unauthenticated call with 401`, async () => {
    const res = await H.api(r.verb, concrete(r.url), payload(r.verb));
    assert.strictEqual(res.status, 401, `no token got ${res.status}, expected 401`);
  });
}

// =====================================================================
// 3. The 6 staff routes: proven still staff-only AND unmodified. This is why §7 keeps 18 as the
//    scope — so nobody "fixes" a door that was already right.
// =====================================================================

for (const r of STAFF_ROUTES) {
  test(`B17 ${r.verb} ${r.url} still mounts staffAuth and was not switched to authMiddleware`, () => {
    assert.ok(r.staff, `${r.url} lost staffAuth`);
    assert.ok(!r.authMw, `${r.url} was switched to authMiddleware — it is a staff route`);
  });

  test(`B17 ${r.verb} ${r.url} refuses a PATIENT token with 403`, async () => {
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.patient.token, ...payload(r.verb) });
    assert.strictEqual(res.status, 403, `patient token got ${res.status} on a staff route`);
  });

  test(`B17 ${r.verb} ${r.url} still admits a DOCTOR token`, async () => {
    const res = await H.api(r.verb, concrete(r.url), { token: ctx.doctor.token, ...payload(r.verb) });
    assert.ok(![401, 403].includes(res.status), `doctor token got ${res.status} on their own route`);
  });
}

// =====================================================================
// 4. APP-B18 — POST /api/doctor/change-password. Two defects, two assertions.
// =====================================================================

test("B18 change-password refuses an unauthenticated call", async () => {
  const res = await H.api("POST", "/api/doctor/change-password", {
    json: { professionalId: ctx.doctor.professionalId, currentPassword: "whatever", newPassword: H.uid() + "Aa1!" },
  });
  assert.strictEqual(res.status, 401,
    `got ${res.status}: the route has no middleware (doctorAuth.js:440) and is an authenticated action with no authentication`);
});

test("B18 change-password mounts staffAuth in source", () => {
  const s = live("doctorAuth.js");
  const m = /router\.post\(\s*["'`]\/change-password["'`]([\s\S]*?)(?:async\s*\(|\(\s*req\s*,)/.exec(s);
  assert.ok(m, "could not locate the /change-password route");
  assert.match(m[1], /\bstaffAuth\b/, "/change-password still has no auth middleware");
});

test("B18 change-password takes the identity from the TOKEN, not the request body", () => {
  const s = live("doctorAuth.js");
  const body = /router\.post\(\s*["'`]\/change-password["'`][\s\S]*?\n\}\s*\)\s*;/.exec(s)?.[0] ?? "";
  assert.ok(/req\.(userId|professionalId)/.test(body),
    "/change-password does not read the identity from the token");
  assert.ok(!/const\s*\{[^}]*professionalId[^}]*\}\s*=\s*req\.body/.test(body),
    "/change-password still takes professionalId from the body — that is the identity being asserted by the caller");
});

test("B18 change-password issues NO token on success — a password change is not a login", () => {
  const s = live("doctorAuth.js");
  const body = /router\.post\(\s*["'`]\/change-password["'`][\s\S]*?\n\}\s*\)\s*;/.exec(s)?.[0] ?? "";
  assert.ok(!/jwt\.sign\(/.test(body),
    "/change-password still mints a JWT: it hands out a 7-day staff token with NO OTP, defeating the PASSWORD -> OTP -> JWT gate (doctorAuth.js:34)");
});

test("B18 an unknown professionalId does not enumerate valid ids (401, not 404)", async () => {
  const res = await H.api("POST", "/api/doctor/change-password", {
    token: ctx.doctor.token,
    json: { professionalId: "DOCNOSUCH999", currentPassword: "whatever", newPassword: H.uid() + "Aa1!" },
  });
  assert.notStrictEqual(res.status, 404,
    "404-vs-401 tells an attacker which professionalIds exist");
});

test("B18 password strength is enforced server-side, not only in the browser", async () => {
  const res = await H.api("POST", "/api/doctor/change-password", {
    token: ctx.doctor.token,
    json: { professionalId: ctx.doctor.professionalId, currentPassword: "whatever", newPassword: "aaaaaaaa" },
  });
  assert.strictEqual(res.status, 400,
    "an 8-char all-lowercase password was not rejected: the server only checks length >= 8 while the rule is enforced in the browser");
});

// =====================================================================
// 5. The clinician role is deleted (§13 items 51, 52).
// =====================================================================

test("clinician: no account carries the role", async () => {
  const n = await H.db().collection("users").countDocuments({ role: "clinician" });
  assert.strictEqual(n, 0, `${n} users carry role "clinician" — stop and decide what they become before the role is removed`);
});

test("clinician: the role appears in no middleware, route or model", () => {
  const hits = [];
  for (const dir of [mwDir, routesDir, path.join(H.root, "src/models")])
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".js")))
      live(f, dir).split("\n").forEach((l, i) => { if (/["']clinician["']/.test(l)) hits.push(`${path.basename(dir)}/${f}:${i + 1}`); });
  assert.deepStrictEqual(hits, [],
    `"clinician" still admitted/permitted at: ${hits.join(", ")}. Nothing can create one (every creation path writes "doctor"), so a permitted value nothing honours is the same trap as the discarded role`);
});

// =====================================================================
// 6. APP-B9 — the audit line that replaces the deleted console.log sites.
//    Pinned as a collection, not a log file: SECURITY.md 1.4 requires it queryable by patient id
//    (feeds 1.3) and by actor id, which a text file does not give.
// =====================================================================

const AUDIT = "accesslogs";

test("B9 an authenticated request writes exactly one audit record", async () => {
  const before = await H.db().collection(AUDIT).countDocuments({ actorId: { $in: [new ObjectId(ctx.patient.id), ctx.patient.id] } });
  await H.api("GET", "/api/profile/patient-profile", { token: ctx.patient.token });
  const rows = await H.db().collection(AUDIT).find({ actorId: { $in: [new ObjectId(ctx.patient.id), ctx.patient.id] } }).toArray();
  assert.strictEqual(rows.length - before, 1, `expected exactly 1 new audit record, got ${rows.length - before}`);
  const r = rows[rows.length - 1];
  for (const k of ["actorId", "actorRole", "at", "method", "path", "client"])
    assert.ok(r[k] !== undefined && r[k] !== null, `audit record is missing "${k}" (SECURITY.md 1.4: who, what, when, from which client)`);
  assert.strictEqual(r.actorRole, "patient");
  assert.strictEqual(r.path, "/api/profile/patient-profile");
});

test("B9 the audit record carries no token and no clinical value", async () => {
  const rows = await H.db().collection(AUDIT).find({}).limit(200).toArray();
  for (const r of rows) {
    const s = JSON.stringify(r);
    assert.ok(!/eyJ[A-Za-z0-9_-]{8,}/.test(s), "an audit record contains a raw JWT");
    for (const k of ["password", "passwordHash", "otp", "summaryText", "recommendation", "answers"])
      assert.ok(!(k in r), `audit record carries "${k}": an access log full of patient detail is a second copy of the breach surface (SECURITY.md 1.4)`);
  }
});

test("B9 the client address is the real caller, not the reverse proxy", () => {
  // nginx/default.conf:21-22 already sets X-Real-IP / X-Forwarded-For; Express ignores them
  // without `trust proxy`, so every record would read as the nginx container's internal address.
  const s = live("index.js", path.join(H.root, "src"));
  assert.match(s, /trust proxy/,
    'Express does not set "trust proxy": req.ip is the nginx container address, so the audit line records the proxy rather than the caller');
});

// =====================================================================
// 7. docs/19 §13 item 47 — the two authorisation-shaped validation holes assigned to APP-B.
//    (The third, consent accepting all-false, is in layer2_consent.test.js.)
// =====================================================================

test("item 47 /assessment/save ignores a client-supplied risk level and derives it server-side", async () => {
  const res = await H.api("POST", "/api/assessment/save", {
    token: ctx.patient.token,
    json: { riskLevel: "LOW", riskLabel: "No action needed", answers: {} },
  });
  if (res.status === 400) return; // rejecting the forged key outright also satisfies this
  assert.ok([200, 201].includes(res.status), `unexpected status ${res.status}: ${JSON.stringify(res.body).slice(0, 160)}`);
  const row = await H.dec().collection("assessments").findOne(
    { userId: { $in: [new ObjectId(ctx.patient.id), ctx.patient.id] } }, { sort: { createdAt: -1 } });
  assert.ok(row, "no assessment row written");
  assert.notStrictEqual(row.riskLevel, "LOW",
    "the stored risk level is the one the CALLER sent — a clinical conclusion supplied by untrusted input (§8 constraint 5)");
});

test("item 47 hemophilia-details refuses a record with no consulting doctor", async () => {
  const c0 = await H.snapshot();
  const res = await H.api("POST", "/api/hemophilia-details", {
    token: ctx.patient.token, json: { targetJoint: ["Knee"] },
  });
  assert.strictEqual(res.status, 400,
    `got ${res.status}: a clinical record saved with only targetJoint has no consulting doctor, and that version chain is the authorisation source for every later read (APP-J4)`);
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, "a doctorless clinical record was written");
});

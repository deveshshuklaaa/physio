// Layer 2: G13 (Phase 2.5 request-body validation). Staging only (:5001 / hemophilia_stage).
// Rule: any key not on a route's allowlist -> 400 and NOTHING written. Rejected, not silently dropped.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { ObjectId } = require("mongodb");
const H = require("./layer2_helpers");

const P25 = "[EXPECTED-FAIL until Phase 2.5]";
const ctx = {};
before(async () => {
  await H.setup();
  ctx.A = await H.mkPatient();          // attacker, NO profile (so "nothing written" is observable)
  ctx.V = await H.mkPatient();          // victim, has a profile
  await H.mkProfile(ctx.V);
  ctx.B = await H.mkPatient();          // has a profile; used for hemophilia-details
  await H.mkProfile(ctx.B);
});
after(() => H.finish());

const CONSENT5 = ["consentDataCollection", "consentAI", "consentVideoMonitoring", "privacyAccepted", "termsAccepted"];
// Never client-writable on patient-profile, any route: userId, patientId, consentTimestamp, createdAt, updatedAt, the 5 consent booleans.
const FORBIDDEN = { userId: "000000000000000000000001", patientId: "PAT999999", consentTimestamp: "2000-01-01T00:00:00.000Z",
  createdAt: "2000-01-01T00:00:00.000Z", updatedAt: "2000-01-01T00:00:00.000Z", ...Object.fromEntries(CONSENT5.map((k) => [k, true])),
  _id: "000000000000000000000002", unexpected_key: "x", role: "admin" };

// Adopt anything the app created so teardown deletes it even when an assertion is about to fail.
async function adopt(b) {
  if (!b || typeof b !== "object") return;
  for (const id of [b.user?.id, b.admin?.id, b.doctor?.id]) if (id) await H.tagUser(id);
  if (b.requestId) await H.tagWhere("doctorregistrationrequests", { _id: new ObjectId(b.requestId) });
}
const victimDocs = async () => JSON.stringify(await H.db().collection("patientprofiles").find({ userId: { $in: [new ObjectId(ctx.V.id), ctx.V.id] } }).toArray());

// 400 AND nothing written (all collection counts + victim profile unchanged).
async function expect400(method, url, { token, json, form }, who) {
  const c0 = await H.snapshot(), v0 = await victimDocs();
  const r = await H.api(method, url, { token, json, form });
  await adopt(r.body);
  if (who) await H.tagUser(who.id); // sweeps a profile the app may have created
  assert.deepStrictEqual(H.diffCounts(c0, await H.snapshot()), {}, `${method} ${url} WROTE DATA (status ${r.status})`);
  assert.strictEqual(await victimDocs(), v0, `${method} ${url} modified the victim's profile (status ${r.status})`);
  assert.strictEqual(r.status, 400, `${method} ${url} -> ${r.status}, expected 400 (unknown key must be rejected, not dropped)`);
  return r;
}

// ---------------- patient-profile: the one real hole (routes/profile.js Object.assign) ----------------
const profBase = () => H.profileBody();
for (const [k, v] of Object.entries(FORBIDDEN))
  test(`G13 ${P25} patient-profile: "${k}" is rejected 400, nothing written`, async () => {
    await expect400("POST", "/api/profile/patient-profile", { token: ctx.A.token, json: { ...profBase(), [k]: v } }, ctx.A);
  });

test(`G13 ${P25} patient-profile: squatted PAT###### never lands in patientprofiles`, async () => {
  const c = await H.mkPatient();
  const r = await H.api("POST", "/api/profile/patient-profile", { token: c.token, json: { ...profBase(), patientId: "PAT999999" } });
  await H.tagUser(c.id);
  assert.strictEqual(await H.db().collection("patientprofiles").countDocuments({ patientId: "PAT999999" }), 0, `squatted patientId landed (status ${r.status})`);
  assert.strictEqual(r.status, 400);
});

test(`G13 ${P25} patient-profile: forged consentTimestamp never lands`, async () => {
  const c = await H.mkPatient();
  const r = await H.api("POST", "/api/profile/patient-profile", { token: c.token, json: { ...profBase(), consentTimestamp: "2000-01-01T00:00:00.000Z" } });
  await H.tagUser(c.id);
  assert.strictEqual(await H.db().collection("patientprofiles").countDocuments({ consentTimestamp: new Date("2000-01-01T00:00:00.000Z") }), 0, "forged consentTimestamp landed");
  assert.strictEqual(r.status, 400);
});

// Regression guard on the one thing already safe: passes today AND after. userId is pinned to the token's user (or the body is rejected).
test("G13 [REGRESSION-GUARD, passes before and after] patient-profile: userId is never taken from the body", async () => {
  const c = await H.mkPatient(), v0 = await victimDocs();
  const r = await H.api("POST", "/api/profile/patient-profile", { token: c.token, json: { ...profBase(), userId: ctx.V.id } });
  await H.tagUser(c.id);
  assert.strictEqual(await victimDocs(), v0, "victim profile touched");
  if (r.status >= 200 && r.status < 300) {
    const mine = await H.db().collection("patientprofiles").findOne({ userId: { $in: [new ObjectId(c.id), c.id] } });
    assert.ok(mine, "2xx but no profile for the token's user");
  } else assert.strictEqual(r.status, 400);
});

test("G13 patient-profile: control, trimmed allowlist body is accepted and patientId is server-generated", async () => {
  const c = await H.mkPatient();
  const r = await H.api("POST", "/api/profile/patient-profile", { token: c.token, json: profBase() });
  await H.tagUser(c.id);
  assert(r.status >= 200 && r.status < 300, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  const d = await H.db().collection("patientprofiles").findOne({ userId: { $in: [new ObjectId(c.id), c.id] } });
  assert.match(String(d.patientId), /^PAT\d{6}$/);
  assert.ok(!CONSENT5.some((k) => d[k] === true), "consent booleans set by a profile save");
});

// ---------------- consent route: its allowlist is the five booleans only ----------------
for (const k of ["userId", "patientId", "consentTimestamp", "createdAt", "updatedAt", "_id", "unexpected_key"])
  test(`G13 ${P25} consent: "${k}" is rejected 400, nothing written`, async () => {
    await expect400("POST", "/api/profile/consent", { token: ctx.A.token, json: { consentDataCollection: true, [k]: FORBIDDEN[k] ?? "x" } }, ctx.A);
  });

// ---------------- signup ----------------
const regBase = () => ({ fullName: "Mig Reg", email: H.mail(), password: "Mig!Test9-" + H.uid() });
test("G13 signup: control, base body accepted", async () => {
  const r = await H.api("POST", "/api/auth/register", { json: regBase() });
  await adopt(r.body);
  assert.strictEqual(r.status, 201, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
});
for (const [k, v] of Object.entries({ role: "admin", adminLevel: "SUPER_ADMIN", permissions: { canManageAdmins: true }, _id: "000000000000000000000003",
  accountStatus: "APPROVED", patientId: "PAT999998", unexpected_key: "x" }))
  test(`G13 ${P25} signup: "${k}" is rejected 400, nothing written (today it is dropped by luck of destructuring)`, async () => {
    await expect400("POST", "/api/auth/register", { json: { ...regBase(), [k]: v } });
  });

// ---------------- hemophilia-details (token B has a profile) ----------------
// Base body validity is unverified: the 400 comes from the key check, so these hold regardless, but there is no accepted-control here.
for (const [k, v] of Object.entries({ userId: "000000000000000000000001", patientId: "PAT999997", createdAt: "2000-01-01T00:00:00.000Z", _id: "000000000000000000000004", unexpected_key: "x" }))
  test(`G13 ${P25} hemophilia-details: "${k}" is rejected 400, nothing written`, async () => {
    await expect400("POST", "/api/hemophilia-details", { token: ctx.B.token, json: { targetJoint: ["Knee"], [k]: v } });
  });

// ---------------- doctor registration (multipart) ----------------
const DOC = () => ({ fullName: "Mig Doctor", email: H.mail(), mobileNumber: "9876543210", medicalRegistrationNumber: "MIG" + H.uid().slice(0, 8), medicalCouncil: "Test Council",
  qualification: "MBBS", specialization: "Haematology", yearsOfExperience: "5", hospitalName: "Test Hospital", country: "India", stateProvince: "Maharashtra", city: "Pune", declarationAccepted: "true" });
function docForm(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, String(v));
  f.append("registrationCertificate", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "cert.pdf");
  f.append("professionalIdDocument", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "pid.pdf");
  return f;
}
test("G13 doctor-register: control, base form accepted", async () => {
  const r = await H.api("POST", "/api/doctor/register", { form: docForm(DOC()) });
  await adopt(r.body);
  assert.strictEqual(r.status, 201, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
});
for (const [k, v] of Object.entries({ status: "APPROVED", role: "admin", professionalId: "DOC-HACK", reviewedBy: "000000000000000000000001", _id: "000000000000000000000005", unexpected_key: "x" }))
  test(`G13 ${P25} doctor-register: "${k}" is rejected 400, nothing written (today it is ignored by explicit clean* vars)`, async () => {
    await expect400("POST", "/api/doctor/register", { form: docForm({ ...DOC(), [k]: v }) });
  });

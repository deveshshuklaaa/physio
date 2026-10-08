// Layer 2: G6 (physiosessions TTL regression guard), G11 (server-side validation at the trust boundary). Staging only.
// Run ONE FILE AT A TIME with a bounded heap (see README_layer2.md).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { ObjectId } = require("mongodb");
const H = require("./layer2_helpers");

const ctx = {};
before(async () => {
  await H.setup();
  ctx.A = await H.mkPatient();                 // attacker, deliberately has NO profile
  ctx.V = await H.mkPatient();                 // victim, has a profile
  await H.mkProfile(ctx.V);
  ctx.B = await H.mkPatient();                 // attacker with a profile (hemophilia-details base needs one)
  await H.mkProfile(ctx.B);
  ctx.S = await H.mkAdmin({ level: "SUPER_ADMIN" });
  ctx.P = await H.mkAdmin({ level: "ADMIN" });  // plain admin
  ctx.vc = await H.seedChallenge("login", { userId: ctx.V.id }); // victim's live challenge, for injection cases
});
after(() => H.finish());

// ---------------- G6 ----------------
test("G6 physiosessions has NO TTL index (video_expiresAt must stay a plain index)", async () => {
  const ixs = await H.db().collection("physiosessions").indexes();
  const ttl = ixs.filter((i) => i.expireAfterSeconds !== undefined);
  assert.strictEqual(ttl.length, 0,
    `\n!!! TTL INDEX ON physiosessions: ${ttl.map((i) => `${i.name}(expireAfterSeconds=${i.expireAfterSeconds})`)} !!!\n` +
    "A TTL here DELETES WHOLE SESSION DOCUMENTS (reps, clean reps, coaching report), not just the video. DROP IT NOW.");
  const v = ixs.find((i) => i.name === "video_expiresAt" || i.key?.video_expiresAt === 1);
  assert(v, "video_expiresAt index missing (expected plain index, verified present at baseline)");
  assert.strictEqual(v.expireAfterSeconds, undefined, `video_expiresAt index has expireAfterSeconds=${v.expireAfterSeconds}: WHOLE DOCUMENTS WILL BE DELETED`);
});

// ---------------- G11 ----------------
const noCreds = (b) => !(b && typeof b === "object" && (b.token || b.resetToken));
const LONG = "A".repeat(10000);
const OID = "000000000000000000000001";

async function fingerprint() {
  const d = H.db(), ids = [ctx.V.id, ctx.A.id, ctx.B.id, ctx.S.id, ctx.P.id].map((i) => new ObjectId(i));
  const strs = ids.map(String);
  const get = async (c, f, v) => (await d.collection(c).find({ [f]: { $in: v } }).sort({ _id: 1 }).toArray());
  return JSON.stringify([
    await get("users", "_id", ids), await get("patientprofiles", "userId", [...ids, ...strs]), await get("hemophiliadetails", "userId", [...ids, ...strs]),
    await get("adminprofiles", "userId", ids), await d.collection(ctx.vc.coll).find({ challengeId: ctx.vc.challengeId }).toArray(),
  ]);
}
// Adopt anything the app created so teardown can delete it (by tag) even when the test is about to fail.
async function adopt(b) {
  if (!b || typeof b !== "object") return;
  for (const id of [b.user?.id, b.admin?.id, b.doctor?.id]) if (id) await H.tagUser(id);
  if (b.requestId) await H.tagWhere("doctorregistrationrequests", { _id: new ObjectId(b.requestId) });
  if (b.challengeId) for (const c of ["loginotps", "passwordresetotps", "otpchallenges"]) await H.tagWhere(c, { challengeId: b.challengeId });
}
// Core assertion: rejected with 4xx AND nothing written (all collection counts + fixture/victim docs unchanged).
async function expectRejected(method, url, { token, json, form }) {
  const c0 = await H.snapshot(), f0 = await fingerprint();
  const r = await H.api(method, url, { token, json, form });
  await adopt(r.body);
  const dc = H.diffCounts(c0, await H.snapshot());
  // The TTL sweeper deletes expired challenges at a time nothing here controls, so a
  // SHRINKING otpchallenges is Mongo reaping, not this request writing. A GROWING one
  // still fails: a rejected request must never mint a challenge.
  for (const k of ["otpchallenges", "loginotps", "passwordresetotps"]) {
    const m = /^(\d+) -> (\d+)$/.exec(dc[k] || "");
    if (m && Number(m[2]) < Number(m[1])) delete dc[k];
  }
  assert.deepStrictEqual(dc, {}, `${method} ${url} WROTE DATA (status ${r.status}): ${JSON.stringify(dc)}`);
  assert.strictEqual(await fingerprint(), f0, `${method} ${url} MODIFIED an existing fixture/victim doc (status ${r.status})`);
  assert(r.status >= 400 && r.status < 500, `${method} ${url} -> ${r.status} (expected 4xx; 5xx = unhandled bad input)`);
  assert(noCreds(r.body), "rejected request still returned credentials");
}

// body variants: missing / wrong type / over-long per key, plus smuggled keys
function variants(base, { strKeys, reqKeys = strKeys, smuggle = true }) {
  const out = [];
  for (const k of reqKeys) out.push([`missing ${k}`, (c) => { const b = base(c); delete b[k]; return b; }]);
  for (const k of strKeys) {
    for (const [tn, tv] of [["object", () => ({ $ne: null })], ["number", () => 12345], ["array", () => ["x"]]])
      out.push([`${k} as ${tn}`, (c) => ({ ...base(c), [k]: tv() })]);
    out.push([`${k} over-long`, (c) => ({ ...base(c), [k]: LONG })]);
  }
  if (smuggle) for (const [n, x] of [["_id injection", { _id: OID }], ["role=admin", { role: "admin" }], ["adminLevel", { adminLevel: "SUPER_ADMIN" }],
    ["permissions", { permissions: { canManageAdmins: true } }], ["unexpected key", { unexpected_key: "x" }], ["patientId smuggle", { patientId: "PATTEST-HIJACK" }],
    ["userId = other patient", (c) => ({ userId: c.V.id })]])
    out.push([n, (c) => ({ ...base(c), ...(typeof x === "function" ? x(c) : x) })]);
  return out;
}
function run(group, method, url, tokenOf, variantList) {
  for (const [name, mk] of variantList)
    test(`G11 ${group}: ${name}`, () => expectRejected(method, url, { token: tokenOf?.(ctx), json: mk(ctx) }));
}

// --- patient signup. Control first: the base body must be ACCEPTED, else the rejections below prove nothing.
const regBase = () => ({ firstName: "Mig", middleName: "", lastName: "Reg", email: H.mail(), password: "Mig!Test9-" + H.uid() });
test("G11 signup: control, base body is accepted (so rejections below are meaningful)", async () => {
  const r = await H.api("POST", "/api/auth/register", { json: regBase() });
  await adopt(r.body);
  assert.strictEqual(r.status, 201, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
});
run("signup", "POST", "/api/auth/register", null, variants(regBase, { strKeys: ["firstName", "lastName", "email", "password"] }));
test("G11 signup: smuggled role=admin never persists an admin even if accepted", async () => {
  const r = await H.api("POST", "/api/auth/register", { json: { ...regBase(), role: "admin", adminLevel: "SUPER_ADMIN" } });
  await adopt(r.body);
  if (r.body?.user?.id) {
    const d = await H.db().collection("users").findOne({ _id: new ObjectId(r.body.user.id) });
    assert.notStrictEqual(d.role, "admin", "PRIVILEGE ESCALATION: signup created an admin");
    assert.notStrictEqual(d.adminLevel, "SUPER_ADMIN", "PRIVILEGE ESCALATION: signup honoured adminLevel");
  }
});

// --- patient profile (token = A, who has no profile; V is the victim)
const profBase = () => H.profileBody();
test("G11 patient-profile: control, base body is accepted (as a separate patient)", async () => {
  const c = await H.mkPatient();
  const r = await H.api("POST", "/api/profile/patient-profile", { token: c.token, json: profBase() });
  await H.tagUser(c.id);
  assert(r.status >= 200 && r.status < 300, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
});
run("patient-profile", "POST", "/api/profile/patient-profile", (c) => c.A.token,
  variants(profBase, { strKeys: ["firstName", "lastName", "gender", "bloodGroup", "mobile", "state", "city", "pinCode", "emergencyName", "emergencyRelationship", "emergencyPhone"], reqKeys: ["firstName", "lastName", "gender", "dob", "bloodGroup", "mobile", "state", "city", "pinCode", "emergencyName", "emergencyRelationship", "emergencyPhone"] }));
run("consent", "POST", "/api/profile/consent", (c) => c.A.token, [
  ["empty body", () => ({})], ["wrong type", () => ({ consent: { $ne: null } })], ["userId = other patient", (c) => ({ userId: c.V.id, consent: true })],
  ["over-long", () => ({ consent: LONG })], ["_id injection", () => ({ _id: OID })]]);

// --- hemophilia details (token = B, has a profile). Base validity is unverified; see README caveat.
run("hemophilia-details", "POST", "/api/hemophilia-details", (c) => c.B.token, [
  ["missing targetJoint", () => ({})], ["targetJoint object", () => ({ targetJoint: { $ne: null } })], ["targetJoint number", () => ({ targetJoint: 12345 })],
  ["targetJoint [object]", () => ({ targetJoint: [{ $ne: null }] })], ["targetJoint over-long", () => ({ targetJoint: LONG })],
  ["_id injection", () => ({ targetJoint: ["Knee"], _id: OID })], ["userId = other patient", (c) => ({ targetJoint: ["Knee"], userId: c.V.id })],
  ["patientId smuggle", () => ({ targetJoint: ["Knee"], patientId: "PATTEST-HIJACK" })], ["role=admin", () => ({ targetJoint: ["Knee"], role: "admin" })],
  ["unexpected key", () => ({ targetJoint: ["Knee"], unexpected_key: "x" })],
  ["consultingDoctorId as object", () => ({ targetJoint: ["Knee"], consultingDoctorId: { $ne: null } })]]);

// --- OTP routes. Victim challenge exists, so a NoSQL-operator match would hit it; it must stay untouched.
run("verify-otp", "POST", "/api/auth/verify-otp", null, [
  ["empty", () => ({})], ["challengeId {$ne:null}", () => ({ challengeId: { $ne: null }, otp: "123456" })],
  ["challengeId {$gt:''}", () => ({ challengeId: { $gt: "" }, otp: "123456" })], ["challengeId array", (c) => ({ challengeId: [c.vc.challengeId], otp: "123456" })],
  ["otp 5 digits", (c) => ({ challengeId: c.vc.challengeId, otp: "12345" })], ["otp object", (c) => ({ challengeId: c.vc.challengeId, otp: { $ne: 1 } })],
  ["challengeId over-long", () => ({ challengeId: LONG, otp: "123456" })], ["unknown challengeId", () => ({ challengeId: "x".repeat(64), otp: "123456" })]]);
run("resend-otp", "POST", "/api/auth/resend-otp", null, [
  ["empty", () => ({})], ["challengeId {$ne:null}", () => ({ challengeId: { $ne: null } })], ["challengeId over-long", () => ({ challengeId: LONG })]]);
run("password-reset/request", "POST", "/api/password-reset/request", null, [
  ["empty", () => ({})], ["invalid role", () => ({ role: "superuser", email: "x@example.invalid" })], ["role object", () => ({ role: { $ne: 1 }, email: "x@example.invalid" })],
  ["email object", () => ({ role: "patient", email: { $ne: null } })], ["email over-long", () => ({ role: "patient", email: LONG + "@example.invalid" })],
  ["doctor without professionalId", () => ({ role: "doctor" })], ["professionalId object", () => ({ role: "doctor", professionalId: { $ne: null } })],
  ["role=admin, email absent", () => ({ role: "admin" })]]);
run("password-reset/verify", "POST", "/api/password-reset/verify", null, [
  ["empty", () => ({})], ["challengeId {$ne:null}", () => ({ challengeId: { $ne: null }, otp: "123456" })], ["otp 5 digits", () => ({ challengeId: "x", otp: "12345" })],
  ["otp object", () => ({ challengeId: "x", otp: { $ne: 1 } })], ["challengeId over-long", () => ({ challengeId: LONG, otp: "123456" })]]);
run("password-reset/reset", "POST", "/api/password-reset/reset", null, [
  ["empty", () => ({})], ["challengeId {$ne:null}", () => ({ challengeId: { $ne: null }, resetToken: "x", newPassword: "Aa1!aaaaaa" })],
  ["missing newPassword", () => ({ challengeId: "x", resetToken: "x" })], ["newPassword number", () => ({ challengeId: "x", resetToken: "x", newPassword: 12345 })],
  ["newPassword over-long", () => ({ challengeId: "x", resetToken: "x", newPassword: LONG })], ["resetToken object", () => ({ challengeId: "x", resetToken: { $ne: null }, newPassword: "Aa1!aaaaaa" })]]);

// --- admin mutating routes
run("admin management/create (SUPER)", "POST", "/api/admin/management/create", (c) => c.S.token, [
  ["empty", () => ({})], ["wrong types", () => ({ fullName: { $ne: 1 }, email: 123 })], ["over-long", () => ({ fullName: LONG, email: H.mail() })],
  ["_id injection", () => ({ _id: OID })]]);
run("admin PUT /me privilege self-escalation (plain admin)", "PUT", "/api/admin/me", (c) => c.P.token, [
  ["role=patient", () => ({ role: "patient" })], ["adminLevel=SUPER_ADMIN", () => ({ adminLevel: "SUPER_ADMIN" })],
  ["permissions all true", () => ({ permissions: { canManageAdmins: true, canManageDoctors: true, canViewPatients: true, canManageDoctorRequests: true } })],
  ["accountStatus", () => ({ accountStatus: "APPROVED", _id: OID })], ["fullName object", () => ({ fullName: { $ne: null } })], ["fullName over-long", () => ({ fullName: LONG })]]);
run("admin change-password", "POST", "/api/admin/change-password", (c) => c.P.token, [
  ["empty", () => ({})], ["wrong types", () => ({ currentPassword: { $ne: 1 }, newPassword: 12345 })], ["over-long", () => ({ currentPassword: "x", newPassword: LONG })]]);

// --- doctor registration (multipart)
const DOC = () => ({ firstName: "Mig", middleName: "", lastName: "Doctor", email: H.mail(), mobileNumber: "9876543210", medicalRegistrationNumber: "MIG" + H.uid().slice(0, 8), medicalCouncil: "Test Council",
  qualification: "MBBS", specialization: "Haematology", yearsOfExperience: "5", hospitalName: "Test Hospital", country: "India", stateProvince: "Maharashtra", city: "Pune", declarationAccepted: "true" });
function docForm(fields, { noCert = false, mime = "application/pdf", dup } = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, typeof v === "string" ? v : JSON.stringify(v));
  if (dup) f.append(dup, "second-value");
  if (!noCert) f.append("registrationCertificate", new Blob(["%PDF-1.4 test"], { type: mime }), "cert.pdf");
  f.append("professionalIdDocument", new Blob(["%PDF-1.4 test"], { type: "application/pdf" }), "pid.pdf");
  return f;
}
test("G11 doctor-register: control, base form is accepted", async () => {
  const r = await H.api("POST", "/api/doctor/register", { form: docForm(DOC()) });
  await adopt(r.body);
  assert.strictEqual(r.status, 201, `${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
});
const docCases = [];
for (const k of Object.keys(DOC()).filter((k) => k !== "middleName")) docCases.push([`missing ${k}`, () => { const d = DOC(); delete d[k]; return docForm(d); }]);
for (const k of ["firstName", "lastName", "email", "mobileNumber", "medicalRegistrationNumber", "hospitalName", "city", "qualification"]) docCases.push([`${k} over-long`, () => docForm({ ...DOC(), [k]: LONG })]);
docCases.push(["mobile not digits", () => docForm({ ...DOC(), mobileNumber: "abcdefghij" })], ["email invalid", () => docForm({ ...DOC(), email: "not-an-email" })],
  ["years negative", () => docForm({ ...DOC(), yearsOfExperience: "-1" })], ["years NaN", () => docForm({ ...DOC(), yearsOfExperience: "abc" })],
  ["declaration false", () => docForm({ ...DOC(), declarationAccepted: "false" })], ["no certificate", () => docForm(DOC(), { noCert: true })],
  ["certificate wrong mime", () => docForm(DOC(), { mime: "text/plain" })], ["duplicate key (array)", () => docForm(DOC(), { dup: "firstName" })],
  ["_id injection", () => docForm({ ...DOC(), _id: OID })], ["status=APPROVED smuggle", () => docForm({ ...DOC(), status: "APPROVED" })],
  ["role=admin smuggle", () => docForm({ ...DOC(), role: "admin" })], ["professionalId smuggle", () => docForm({ ...DOC(), professionalId: "DOC-HACK" })],
  ["reviewedBy smuggle", () => docForm({ ...DOC(), reviewedBy: ctx.S?.id || OID })], ["unexpected key", () => docForm({ ...DOC(), unexpected_key: "x" })]);
for (const [name, mk] of docCases) test(`G11 doctor-register: ${name}`, () => expectRejected("POST", "/api/doctor/register", { form: mk() }));

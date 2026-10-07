// Layer 1: G14 (Phase 4 name split). Writes only to hemophilia_test; raw reads via a PLAIN client.
// Contract (docs/DB_MIGRATION_PLAN.md Phase 4): fullName removed from the DB. firstName required, middleName optional,
// lastName required, all CSFLE Random, in users + doctorregistrationrequests. patientprofiles keeps NO name field.
// Assumed (not agreed, unverified): displayName lives at src/utils/displayName.js as `module.exports = { displayName }`.
// Run ONE FILE per invocation: node --max-old-space-size=700 --test /app/migrations/test/layer1_names.test.js
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { isCiphertext, connectEncrypted, raw, prodCounts, teardown } = require("./helpers");

const P4 = "[EXPECTED-FAIL until Phase 4]";
const SRC = path.join(__dirname, "..", "..", "src");
const src = (p) => path.join(SRC, p);
const need = (p, why) => {
  try { return require(src(p)); } catch (e) {
    if (e.code === "MODULE_NOT_FOUND" && e.message.includes(p.replace(/\.js$/, ""))) assert.fail(`${why}: src/${p} does not exist yet`);
    throw e;
  }
};
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));

let mg, client, db, prodBefore, n = 0;
const M = (m) => mg.model(m);
const mail = () => `names${++n}@example.invalid`;
const userDoc = (o) => ({ email: mail(), passwordHash: "x", role: "patient", ...o });
const drrDoc = (o) => ({ email: mail(), mobileNumber: "9444444444", medicalRegistrationNumber: `MRN${++n}`, medicalCouncil: "MMC",
  qualification: "MBBS", specialization: "Hem", yearsOfExperience: 5, hospitalName: "H", country: "IN", stateProvince: "MH", city: "Pune",
  declarationAccepted: true, status: "PENDING", ...o });
const rawUser = (id) => db.collection("users").findOne({ _id: id });

before(async () => {
  prodBefore = await prodCounts();
  mg = await connectEncrypted();
  ({ client, db } = await raw());
});
after(async () => {
  await teardown(mg, client);
  assert.deepStrictEqual(await prodCounts(), prodBefore, "hemophilia counts changed");
});

// ---- schema ---------------------------------------------------------------------------------------
for (const m of ["User", "DoctorRegistrationRequest"])
  test(`G14 ${P4} ${m} schema: firstName+lastName required, middleName optional, no fullName`, () => {
    const s = M(m).schema;
    assert.ok(!s.path("fullName"), "fullName still in schema");
    assert.ok(s.path("firstName")?.isRequired, "firstName not required");
    assert.ok(s.path("lastName")?.isRequired, "lastName not required");
    assert.ok(s.path("middleName") && !s.path("middleName").isRequired, "middleName missing or required");
  });

test(`G14 ${P4} PatientProfile keeps no name field`, () => {
  const bad = Object.keys(M("PatientProfile").schema.paths).filter((k) => /name$/i.test(k) && !/^emergency|^hematologist|^htc|^hospital/i.test(k));
  assert.deepStrictEqual(bad, [], "patientprofiles still has a name field");
});

// ---- placement (raw bytes) ------------------------------------------------------------------------
test(`G14 ${P4} users: no fullName key on disk; first/middle/last are ciphertext`, async () => {
  const u = await M("User").create(userDoc({ firstName: "Anil", middleName: "Kumar", lastName: "Rao", fullName: "Legacy Name" }));
  const d = await rawUser(u._id);
  assert.ok(!("fullName" in d), "fullName key written");
  for (const k of ["firstName", "middleName", "lastName"]) assert.ok(isCiphertext(d[k]), `${k} not ciphertext: ${d[k]?.constructor?.name}`);
});

test(`G14 ${P4} users: middleName optional (2-token name), absent or ciphertext, never plaintext`, async () => {
  const u = await M("User").create(userDoc({ firstName: "Anil", lastName: "Rao" }));
  const d = await rawUser(u._id);
  assert.ok(isCiphertext(d.firstName) && isCiphertext(d.lastName));
  assert.ok(d.middleName === undefined || isCiphertext(d.middleName), "middleName stored as plaintext");
});

test(`G14 ${P4} users.nameTranslations.{en,hi,mr} are ciphertext on disk`, async () => {
  const u = await M("User").create(userDoc({ firstName: "Anil", lastName: "Rao" }));
  const d = await rawUser(u._id);
  for (const l of ["en", "hi", "mr"]) assert.ok(isCiphertext(d.nameTranslations?.[l]), `nameTranslations.${l} not ciphertext`);
});

test(`G14 ${P4} doctorregistrationrequests: no fullName; parts ciphertext`, async () => {
  const r = await M("DoctorRegistrationRequest").create(drrDoc({ firstName: "Meera", lastName: "Iyer", fullName: "Legacy Name" }));
  const d = await db.collection("doctorregistrationrequests").findOne({ _id: r._id });
  assert.ok(!("fullName" in d), "fullName key written");
  for (const k of ["firstName", "lastName"]) assert.ok(isCiphertext(d[k]), `${k} not ciphertext`);
  assert.ok(d.middleName === undefined || isCiphertext(d.middleName));
});

test(`G14 ${P4} patientprofiles: no fullName key on disk`, async () => {
  const p = await M("PatientProfile").create({ userId: new (require("mongodb").ObjectId)(), patientId: "PATNAME1", fullName: "Legacy Name",
    firstName: "Anil", lastName: "Rao", gender: "M", bloodGroup: "O+", mobile: "9111111111", city: "Pune", state: "MH" });
  const d = await db.collection("patientprofiles").findOne({ _id: p._id });
  for (const k of ["fullName", "firstName", "middleName", "lastName"]) assert.ok(!(k in d), `patientprofiles has ${k}`);
});

// ---- mononyms: 4 known users, empty lastName, written with validateBeforeSave:false --------------
test(`G14 ${P4} mononym: lastName "" persists via validateBeforeSave:false, and plain validation rejects it`, async () => {
  const u = new (M("User"))(userDoc({ firstName: "Madonna", lastName: "" }));
  await assert.rejects(u.validate(), /lastName/, "schema must keep lastName required (mononyms violate it by design)");
  await u.save({ validateBeforeSave: false });
  const dec = await M("User").findById(u._id).lean();
  assert.strictEqual(dec.lastName, "", "empty lastName not preserved");
  assert.ok(isCiphertext((await rawUser(u._id)).lastName), "empty lastName stored as plaintext");
});

test(`G14 ${P4} mononym re-save: fails without the bypass, succeeds with it (every re-save must reapply it)`, async () => {
  const u = await M("User").create(userDoc({ firstName: "Cher", lastName: "Sarkisian" }));
  await M("User").updateOne({ _id: u._id }, { $set: { lastName: "" } });
  const doc = await M("User").findById(u._id);
  assert.strictEqual(doc.lastName, "");
  doc.accountStatus = "APPROVED";
  await assert.rejects(doc.save(), /lastName/, "re-save without bypass should fail on a mononym");
  await doc.save({ validateBeforeSave: false });
  assert.strictEqual((await M("User").findById(u._id).lean()).accountStatus, "APPROVED");
});

// ---- displayName: the 17-frontend-files guard -----------------------------------------------------
test(`G14 ${P4} displayName composes first [middle] last, no stray spaces`, () => {
  const { displayName } = need("utils/displayName.js", "Phase 4 helper");
  assert.strictEqual(displayName({ firstName: "A", middleName: "B", lastName: "C" }), "A B C");
  assert.strictEqual(displayName({ firstName: "A", lastName: "C" }), "A C");
  assert.strictEqual(displayName({ firstName: "A", middleName: "", lastName: "C" }), "A C");
  assert.strictEqual(displayName({ firstName: "Madonna", lastName: "" }), "Madonna"); // mononym
});

test(`G14 ${P4} no projection selects fullName (selecting a removed field silently returns undefined to the frontend)`, () => {
  const re = /select\(\s*(?:["'`][^"'`]*\bfullName\b|\{[^}]*\bfullName\b)/;
  const hits = walk(path.join(SRC, "routes")).concat(walk(path.join(SRC, "fhir")), walk(path.join(SRC, "utils")))
    .filter((f) => re.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(SRC, f));
  assert.deepStrictEqual(hits, [], "projections still select fullName; use the parts + displayName()");
});

test(`G14 ${P4} payload builders compose fullName via displayName (routes that return users)`, () => {
  for (const f of ["routes/auth.js", "routes/doctorAuth.js", "routes/adminAuth.js", "routes/hemophiliaDetails.js"]) {
    const s = fs.readFileSync(src(f), "utf8");
    assert.ok(/displayName/.test(s), `${f} never calls displayName(); responses would drop fullName`);
  }
});

test(`G14 ${P4} nameTranslations.{en,hi,mr} equal the transliteration of the COMPOSED name`, async () => {
  const { displayName } = need("utils/displayName.js", "Phase 4 helper");
  const { transliterateDoctorName } = require(src("services/doctorNameTranslationService.js"));
  const parts = { firstName: "Anil", middleName: "Kumar", lastName: "Rao" };
  const u = await M("User").create(userDoc({ ...parts, role: "doctor" }));
  const t = (await M("User").findById(u._id).lean()).nameTranslations;
  const full = displayName(parts);
  for (const l of ["en", "hi", "mr"]) assert.strictEqual(t?.[l], await transliterateDoctorName(full, l), `nameTranslations.${l}`);
});

// ---- approval + picker (static: both are route handlers, not callable at Layer 1) ------------------
test(`G14 ${P4} doctor approval copies name parts across without re-parsing`, () => {
  const s = fs.readFileSync(src("routes/admin.js"), "utf8");
  assert.ok(/request\.firstName/.test(s) && /request\.lastName/.test(s), "approval does not copy request.firstName/lastName");
  assert.ok(!/fullName[^\n]*\.split\(|\.split\([^\n]*fullName/.test(s), "approval re-parses a name with split()");
});

test(`G14 ${P4} doctor picker sorts by lastName then firstName`, () => {
  const s = fs.readFileSync(src("routes/hemophiliaDetails.js"), "utf8");
  assert.ok(/a\.lastName[\s\S]{0,120}b\.lastName[\s\S]{0,200}a\.firstName[\s\S]{0,120}b\.firstName/.test(s), "no lastName-then-firstName in-memory sort");
  assert.ok(!/\.sort\(\s*\{[^}]*fullName/.test(s), "still sorts server-side on fullName (CSFLE Random cannot sort)");
});

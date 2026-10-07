// Layer 1: G9 (Phase 7 append-only clinicalrecords), G10 (Phase 6 assessments de-dup).
// Nothing here is implemented yet, so every test must fail cleanly until its phase lands.
//
// Phase 7 contract (agreed 2026-10-04, docs/DB_MIGRATION_TEST_DESIGN.md G9):
//   src/models/ClinicalRecord.js        mongoose model, collection "clinicalrecords", unique index {userId:1, version:1}
//   src/services/clinicalRecords.js     EXACTLY two exports: latest(userId), append(userId, data, recordedBy)
// Phase 6 contract (G10):
//   src/utils/assessmentDerive.js       deriveFromAnswers(answers) -> { factors, ...14 q* keys } via explicit QUESTION_MAP
// NOTE: helpers.js `models` list has no ClinicalRecord; it must be added there at Phase 7 or the model is
// registered after mongoose.connect() and may not be CSFLE-encrypted.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { EJSON } = require("mongodb").BSON;
const { connectEncrypted, raw, prodCounts, readProdOne, teardown } = require("./helpers");

const src = (p) => path.join(__dirname, "..", "..", "src", p);
const need = (p, why) => {
  try { return require(src(p)); } catch (e) {
    if (e.code === "MODULE_NOT_FOUND" && e.message.includes(p.replace(/\.js$/, ""))) assert.fail(`${why}: src/${p} does not exist yet`);
    throw e;
  }
};
const Q14 = ["q1EmergencySymptoms", "q2BleedMinorCuts", "q3DentalSurgeryBleeding", "q4Bruises", "q5MuscleSwelling",
  "q6JointSwelling", "q7JointsList", "q8JointWarmthTightness", "q9BloodUrineStool", "q10FamilyHistory",
  "q10MaleRelativeFlag", "q11HeavyMenstrual", "q12PreviousTesting", "q12FactorLow"];

let mg, client, db, prodBefore, fx;

before(async () => {
  prodBefore = await prodCounts();
  mg = await connectEncrypted();
  ({ client, db } = await raw());

  // G10 fixture: one REAL assessments doc, raw (ciphertext intact). Cached because Phase 6 destroys the source shape.
  const f = path.join(__dirname, "fixtures", "assessment.pre6.ejson");
  if (fs.existsSync(f)) fx = EJSON.parse(fs.readFileSync(f, "utf8"));
  else {
    fx = await readProdOne("assessments", { "answers.0": { $exists: true }, factors: { $exists: true } }); // READ-ONLY
    if (fx) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, EJSON.stringify(fx)); }
  }
  if (fx) await db.collection("assessments").insertOne(fx); // into hemophilia_test only
});

after(async () => {
  await teardown(mg, client);
  assert.deepStrictEqual(await prodCounts(), prodBefore, "hemophilia counts changed");
});

// ---- G9: Phase 7 (EXPECTED-FAIL until Phase 7) --------------------------------------------------
const P7 = "[EXPECTED-FAIL until Phase 7]";
const { ObjectId } = require("mongodb");
const uid = () => new ObjectId();
const seed = (extra = {}) => ({ patientId: "PATTEST9", type: "A", severity: "Severe", targetJoints: ["knee_left"], ...extra });
const svcOf = () => need("services/clinicalRecords.js", "Phase 7 service");
const rowsOf = (u) => db.collection("clinicalrecords").find({ userId: u }).sort({ version: 1 }).toArray();

test(`G9 ${P7} service exports exactly latest + append (no create/edit split)`, () => {
  need("models/ClinicalRecord.js", "Phase 7 model");
  assert.deepStrictEqual(Object.keys(svcOf()).sort(), ["append", "latest"]);
});

test(`G9 ${P7} append twice -> v1,v2; v1 unchanged except supersededBy`, async () => {
  need("models/ClinicalRecord.js", "Phase 7 model");
  const svc = svcOf(), u = uid(), by = uid();
  await svc.append(u, seed(), by);
  const v1before = await db.collection("clinicalrecords").findOne({ userId: u, version: 1 });
  await svc.append(u, seed({ severity: "Mild" }), by);
  const rows = await rowsOf(u);
  assert.deepStrictEqual(rows.map((r) => r.version), [1, 2]);
  // updatedAt excluded: a timestamps bump from stamping supersededBy is tolerated; any other drift is not.
  const strip = ({ supersededBy, updatedAt, ...r }) => EJSON.stringify(r);
  assert.strictEqual(strip(rows[0]), strip(v1before), "v1 mutated by the second append");
});

test(`G9 ${P7} v1.supersededBy -> v2, v2.supersededBy null`, async () => {
  const svc = svcOf(), u = uid();
  await svc.append(u, seed(), uid()); await svc.append(u, seed({ severity: "Mild" }), uid());
  const [v1, v2] = await rowsOf(u);
  assert.strictEqual(String(v1.supersededBy), String(v2._id));
  assert.strictEqual(v2.supersededBy, null);
});

test(`G9 ${P7} latest(userId) returns v2; first append is v1`, async () => {
  const svc = svcOf(), u = uid();
  assert.strictEqual(await svc.latest(u), null);
  const r1 = await svc.append(u, seed(), uid());
  assert.strictEqual(r1.version, 1);
  await svc.append(u, seed({ severity: "Mild" }), uid());
  assert.strictEqual((await svc.latest(u)).version, 2);
});

test(`G9 ${P7} unique index {userId:1, version:1} exists`, async () => {
  const CR = need("models/ClinicalRecord.js", "Phase 7 model");
  await CR.init(); // builds declared indexes in hemophilia_test
  const ix = (await db.collection("clinicalrecords").indexes()).find((i) => JSON.stringify(i.key) === JSON.stringify({ userId: 1, version: 1 }));
  assert.ok(ix, "no {userId:1, version:1} index");
  assert.strictEqual(ix.unique, true, "index is not unique");
});

for (const [label, preSeed] of [["from an existing v1", true], ["first submission (no predecessor)", false]])
  test(`G9 ${P7} race ${label}: exactly one append wins, loser fails 11000, chain has no fork`, async () => {
    const CR = need("models/ClinicalRecord.js", "Phase 7 model"), svc = svcOf(), u = uid();
    await CR.init();
    if (preSeed) await svc.append(u, seed(), uid());
    const target = preSeed ? 2 : 1;
    const res = await Promise.allSettled([svc.append(u, seed({ severity: "Mild" }), uid()), svc.append(u, seed({ severity: "Moderate" }), uid())]); // not awaited in sequence
    const ok = res.filter((r) => r.status === "fulfilled"), bad = res.filter((r) => r.status === "rejected");
    assert.strictEqual(ok.length, 1, `expected one winner, got ${ok.length}`);
    assert.strictEqual(bad.length, 1);
    const code = bad[0].reason?.code ?? bad[0].reason?.cause?.code ?? bad[0].reason?.errorResponse?.code;
    assert.strictEqual(code, 11000, `loser must fail with duplicate-key 11000 (route maps to 409), got ${code}: ${bad[0].reason?.message}`);
    const rows = await rowsOf(u);
    assert.deepStrictEqual(rows.map((r) => r.version), preSeed ? [1, 2] : [1], "version chain forked or has a gap");
    assert.strictEqual(rows.filter((r) => r.version === target).length, 1);
  });

test(`G9 ${P7} route no longer overwrites in place: no Object.assign(existingDetails...) / existingDetails branch, uses append`, () => {
  const s = fs.readFileSync(src("routes/hemophiliaDetails.js"), "utf8");
  assert.ok(!/Object\.assign\(\s*existingDetails/.test(s), "routes/hemophiliaDetails.js still does Object.assign(existingDetails, ...)");
  assert.ok(!/\bexistingDetails\b/.test(s), "route still branches on existingDetails");
  assert.ok(/clinicalRecords/.test(s) && /\bappend\s*\(/.test(s), "route does not call clinicalRecords.append");
  assert.ok(/11000/.test(s) && /409/.test(s), "route does not map duplicate-key 11000 to 409");
});

test(`G9 ${P7} targetJoints is an array and holds laterality codes`, async () => {
  const svc = svcOf(), u = uid();
  await svc.append(u, seed(), uid());
  const d = await need("models/ClinicalRecord.js", "Phase 7 model").findOne({ userId: u }).lean(); // decrypted read
  assert.ok(Array.isArray(d.targetJoints), "targetJoints not an array");
  for (const j of d.targetJoints) assert.match(j, /^[a-z]+_(left|right)$/);
});

test(`G9 ${P7} free-text joint "Knee" (string) is rejected`, async () => {
  const svc = svcOf();
  await assert.rejects(svc.append(uid(), seed({ targetJoints: "Knee" }), uid()));
  await assert.rejects(svc.append(uid(), seed({ targetJoints: ["Knee"] }), uid()));
});

// ---- G10: Phase 6 (EXPECTED-FAIL until Phase 6) -------------------------------------------------
const P6 = "[EXPECTED-FAIL until Phase 6]";
// Measured: 0 of 28 documents ever held a value. Kept as always-empty derived values; assert present + empty, never derivable.
const ALWAYS_EMPTY = ["q1EmergencySymptoms", "q7JointsList", "q11HeavyMenstrual", "q12FactorLow"];
const MAPPED = Q14.filter((k) => !ALWAYS_EMPTY.includes(k));
const isEmpty = (v) => (Array.isArray(v) && v.length === 0) || v === "";
const deriveOf = () => need("utils/assessmentDerive.js", "Phase 6 helper").deriveFromAnswers;

test("G10 fixture: real pre-migration assessments doc captured (answers[] + factors + q*)", () => {
  assert.ok(fx, "no real assessments doc with answers[]+factors in hemophilia and no cached fixture");
  assert.ok(fx.answers.length > 0 && fx.factors && Q14.some((k) => k in fx), "fixture lacks pre-Phase-6 shape");
});

test(`G10 ${P6} Assessment schema: no factors / 14 q* / recommendation / suggestedTests, answers[] kept`, () => {
  const p = Object.keys(mg.model("Assessment").schema.paths);
  const bad = p.filter((k) => /^factors(\.|$)/.test(k) || Q14.includes(k) || k === "recommendation" || k === "suggestedTests");
  assert.deepStrictEqual(bad, [], "schema still carries dropped fields");
  assert.ok(p.includes("answers"), "answers[] missing");
});

test(`G10 ${P6} deriveFromAnswers returns factors + all 14 q* keys`, async () => {
  const old = await mg.model("Assessment").findOne({ _id: fx._id }).lean();
  const d = deriveOf()(old.answers);
  assert.ok(d.factors && typeof d.factors === "object", "no factors");
  for (const k of Q14) assert.ok(k in d, `missing ${k}`);
});

test(`G10 ${P6} derivation reproduces fixture factors and the 10 mapped q* exactly`, async () => {
  const old = await mg.model("Assessment").findOne({ _id: fx._id }).lean(); // decrypted pre-migration values
  const d = deriveOf()(old.answers);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(d.factors)), JSON.parse(JSON.stringify(old.factors)));
  for (const k of MAPPED) assert.deepStrictEqual(d[k], old[k], k);
});

test(`G10 ${P6} four never-populated fields are PRESENT and EMPTY ([] / ""), not derived`, async () => {
  const old = await mg.model("Assessment").findOne({ _id: fx._id }).lean();
  const d = deriveOf()(old.answers);
  for (const k of ALWAYS_EMPTY) {
    assert.ok(k in d, `${k} missing (must be kept so observationMapper/exerciseRecommendations see an unchanged shape)`);
    assert.ok(isEmpty(d[k]), `${k} must be [] or "", got ${JSON.stringify(d[k])}`);
    assert.ok(isEmpty(old[k]) || old[k] == null, `fixture ${k} was non-empty: the "0 of 28" premise no longer holds`);
  }
  const e = deriveOf()([]);
  for (const k of ALWAYS_EMPTY) assert.ok(isEmpty(e[k]), `${k} not empty for empty answers[]`);
});

for (const [field, a, b] of [["q8JointWarmthTightness", "joint_warmth", "joint_tightness"], ["q9BloodUrineStool", "hematuria", "hematochezia"]])
  test(`G10 ${P6} ${field} combines two answers (${a} + ${b})`, async () => {
    const old = await mg.model("Assessment").findOne({ _id: fx._id }).lean();
    const derive = deriveOf();
    const set = (va, vb) => old.answers.map((x) => (x.question === a ? { ...x, answer: va } : x.question === b ? { ...x, answer: vb } : x));
    const base = JSON.stringify(derive(set("no", "no"))[field]);
    assert.notStrictEqual(JSON.stringify(derive(set("yes", "no"))[field]), base, `${field} ignores ${a}`);
    assert.notStrictEqual(JSON.stringify(derive(set("no", "yes"))[field]), base, `${field} ignores ${b}`);
  });

test(`G10 ${P6} observationMapper output identical for original doc vs answers-derived doc`, async () => {
  const derive = deriveOf();
  const { toFHIRObservations } = require(src("fhir/observationMapper.js"));
  const old = await mg.model("Assessment").findOne({ _id: fx._id }).lean();
  const strip = Object.fromEntries(Object.entries(old).filter(([k]) => k !== "factors" && !Q14.includes(k)));
  const after = { ...strip, ...derive(old.answers) };
  assert.strictEqual(JSON.stringify(toFHIRObservations(after, {})), JSON.stringify(toFHIRObservations(old, {})));
});

test("G10 exerciseRecommendations output identical before/after", { skip: "NOT BUILT: routes/exerciseRecommendations.js exports only the router; isEmergencyScreening (q1EmergencySymptoms read, :230) is private. Needs an export or an HTTP test." }, () => {});

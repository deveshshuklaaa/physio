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

// Spec QUESTION_MAP, verbatim (docs/DB_MIGRATION_PLAN.md Phase 6). q* names and answers[] question keys are NOT 1:1.
const MAP = {
  q2BleedMinorCuts: ["prolonged_bleeding_minor_cut"], q3DentalSurgeryBleeding: ["excessive_dental_bleeding"],
  q4Bruises: ["easy_bruising"], q5MuscleSwelling: ["muscle_hematoma"], q6JointSwelling: ["recurrent_joint_bleeding"],
  // q8 takes THREE sources and is LAST-WINS, not a symmetric combine (routes/assessment.js:224).
  q8JointWarmthTightness: ["joint_warmth", "joint_tightness", "reduced_joint_mobility"],
  q9BloodUrineStool: ["hematuria", "hematochezia"],
  q10FamilyHistory: ["family_history_bleeding_disorder"], q10MaleRelativeFlag: ["male_relative_with_hemophilia"],
  q12PreviousTesting: ["previous_factor_test"],
};
const FACTOR_OF = { q1EmergencySymptoms: "emergencySymptoms", q2BleedMinorCuts: "bleedMinorCuts", q3DentalSurgeryBleeding: "dentalSurgeryBleeding",
  q4Bruises: "bruises", q5MuscleSwelling: "muscleSwelling", q6JointSwelling: "jointSwelling", q7JointsList: "jointsList",
  q8JointWarmthTightness: "jointWarmthTightness", q9BloodUrineStool: "bloodUrineStool", q10FamilyHistory: "familyHistory",
  q10MaleRelativeFlag: "maleRelativeFlag", q11HeavyMenstrual: "heavyMenstrual", q12PreviousTesting: "previousTesting", q12FactorLow: "factorLow" };
const oldOf = () => mg.model("Assessment").findOne({ _id: fx._id }).lean(); // decrypted pre-migration values
const pick = (d) => JSON.stringify(Q14.map((k) => d[k]));
const withQ = (answers, q, v) => answers.map((x) => (x.question === q ? { ...x, answer: v } : x));
const mk = (pairs) => pairs.map(([question, answer]) => ({ question, answer }));

test(`G10 schema keeps score/totalScore/riskLevel/flags/ml*/summaryText/explanation`, () => {
  const p = Object.keys(mg.model("Assessment").schema.paths);
  for (const k of ["answers", "score", "totalScore", "riskLevel", "emergencyFlag", "strongSuspicionFlag", "mlFeaturesJson", "mlProbabilitiesJson", "summaryText", "explanation"])
    assert.ok(p.includes(k), `keep-list field ${k} missing from schema`);
  assert.ok(p.some((k) => k.startsWith("mlPrediction")), "mlPrediction* missing from schema");
});

test(`G10 ${P6} derived factors has exactly the 14 legacy factor keys`, async () => {
  const d = deriveOf()((await oldOf()).answers);
  assert.deepStrictEqual(Object.keys(d.factors).sort(), Object.values(FACTOR_OF).sort());
});

test(`G10 ${P6} each q* equals its factors counterpart (one source of truth)`, async () => {
  const d = deriveOf()((await oldOf()).answers);
  for (const [q, f] of Object.entries(FACTOR_OF)) assert.deepStrictEqual(d[q], d.factors[f], `${q} vs factors.${f}`);
});

for (const [q, [src1]] of Object.entries(MAP).filter(([, v]) => v.length === 1))
  test(`G10 ${P6} QUESTION_MAP ${q} <- ${src1}`, async () => {
    const derive = deriveOf();
    const base = (await oldOf()).answers;
    // value passes through: the mapped answer shows up in its q* field
    const hit = derive(withQ(base, src1, "sometimes"));
    if (q === "q10MaleRelativeFlag") assert.strictEqual(derive(withQ(base, src1, "yes"))[q], true, "yes -> true (boolean, as in fixture)");
    else assert.strictEqual(hit[q], "sometimes", `${q} must come from ${src1}`);
    // and ONLY that q* moves (no cross-wiring between q* and answers[] keys)
    const b = derive(base);
    for (const k of Q14.filter((k) => k !== q)) assert.deepStrictEqual(hit[k], b[k], `${src1} leaked into ${k}`);
  });

// q9 is a genuine OR, measured from routes/assessment.js:236-266: hematuria "yes" -> "yes";
// hematochezia "yes" -> "yes"; hematochezia "no" sets "no" only while still unset. So a
// hematuria-only "no" leaves it "", which is why only the four yes/no pairs are asserted.
test(`G10 ${P6} q9BloodUrineStool ORs hematuria + hematochezia`, () => {
  const derive = deriveOf();
  const [a, b] = MAP.q9BloodUrineStool;
  const f = (va, vb) => derive(mk([[a, va], [b, vb]])).q9BloodUrineStool;
  assert.strictEqual(f("no", "no"), "no", "both no -> no");
  assert.strictEqual(f("yes", "yes"), "yes", "both yes -> yes");
  assert.strictEqual(f("yes", "no"), "yes", "either yes -> yes");
  assert.strictEqual(f("no", "yes"), "yes", "either yes -> yes");
});

// q8 is LAST-WINS over THREE questions, not a symmetric combine. routes/assessment.js:224
// assigns factors.jointWarmthTightness = answer for joint_warmth, joint_tightness AND
// reduced_joint_mobility, each with `continue`, so whichever appears LAST in answers[]
// overwrites the earlier ones. Phase 6 must reproduce this exactly or observationMapper
// output changes for stored documents. (That last-wins rule discards two of three answers
// on every submission -- a questionnaire-scoring bug logged in the plan, NOT fixed here.)
test(`G10 ${P6} q8JointWarmthTightness is LAST-WINS over warmth/tightness/mobility`, () => {
  const derive = deriveOf();
  const q8 = (pairs) => derive(mk(pairs)).q8JointWarmthTightness;
  const [W, T, M] = MAP.q8JointWarmthTightness;
  assert.strictEqual(q8([[W, "yes"], [T, "yes"], [M, "yes"]]), "yes", "all yes -> yes");
  assert.strictEqual(q8([[W, "no"], [T, "no"], [M, "no"]]), "no", "all no -> no");
  // order decides: the same three values in a different order give a different answer
  assert.strictEqual(q8([[W, "yes"], [T, "no"]]), "no", "tightness is last -> its value wins");
  assert.strictEqual(q8([[T, "no"], [W, "yes"]]), "yes", "warmth is last -> its value wins");
  // and reduced_joint_mobility is a real source, not an ignored extra
  assert.strictEqual(q8([[W, "yes"], [T, "yes"], [M, "no"]]), "no", "mobility is last -> its value wins");
  assert.strictEqual(q8([[M, "no"], [W, "yes"]]), "yes", "mobility first, warmth last -> warmth wins");
  // each source must be capable of deciding the outcome
  for (const src of [W, T, M])
    assert.strictEqual(q8([[src, "sometimes"]]), "sometimes", `${src} alone must reach q8`);
});

test(`G10 ${P6} answers[] extras (age, sex) have no q* counterpart and do not break derivation`, async () => {
  const derive = deriveOf();
  const base = (await oldOf()).answers;
  // reduced_joint_mobility is deliberately NOT here: it feeds q8 (see the last-wins test).
  const extras = ["age", "sex"];
  assert.ok(extras.every((e) => base.some((x) => x.question === e)), "fixture lacks the extras");
  const without = base.filter((x) => !extras.includes(x.question));
  assert.doesNotThrow(() => derive(base));
  assert.doesNotThrow(() => derive(without));
  assert.doesNotThrow(() => derive(mk([["age", "23"], ["sex", "male"], ["totally_unknown_question", "x"]])));
  assert.strictEqual(pick(derive(base)), pick(derive(without)), "extras changed a q* value");
  // excessive_post_surgery_bleeding is not in QUESTION_MAP: it may at most touch q3 (plan says confirm against mapper)
  const ps = derive(withQ(base, "excessive_post_surgery_bleeding", "sometimes")), b0 = derive(base);
  for (const k of Q14.filter((k) => k !== "q3DentalSurgeryBleeding")) assert.deepStrictEqual(ps[k], b0[k], `post_surgery leaked into ${k}`);
});

test(`G10 ${P6} observationMapper output identical for original doc vs answers-derived doc`, async () => {
  const derive = deriveOf();
  const { toFHIRObservations } = require(src("fhir/observationMapper.js"));
  const old = await oldOf();
  const DROPPED = new Set(["factors", "recommendation", "suggestedTests", ...Q14]);
  // post-Phase-6 doc shape: stored fields only, q* re-derived from answers[] (factors/recommendation/suggestedTests gone)
  const stored = Object.fromEntries(Object.entries(old).filter(([k]) => !DROPPED.has(k)));
  const d = derive(old.answers);
  const after = { ...stored, ...Object.fromEntries(Q14.map((k) => [k, d[k]])) };
  for (const k of ["factors", "recommendation", "suggestedTests"]) assert.ok(!(k in after), `after-doc still has ${k}`);
  const before = toFHIRObservations(old, {});
  assert.ok(before.length >= 10, `original produced only ${before.length} observations: parity would be vacuous`);
  const ids = JSON.stringify(before);
  for (const t of ["q2-", "q8-", "q9-", "q10-"]) assert.ok(ids.includes(t), `original output has no ${t} observation: parity would be vacuous`);
  assert.strictEqual(JSON.stringify(toFHIRObservations(after, {})), JSON.stringify(before));
  // also with every derived-from-answers value flipped: both sides must still agree on how q* feeds the mapper
  const flipped = old.answers.map((x) => ({ ...x, answer: x.answer === "yes" ? "no" : x.answer === "no" ? "yes" : x.answer }));
  const dF = derive(flipped);
  const o2 = { ...old, ...Object.fromEntries(Q14.map((k) => [k, dF[k]])) };
  const a2 = { ...stored, ...Object.fromEntries(Q14.map((k) => [k, dF[k]])) };
  assert.strictEqual(JSON.stringify(toFHIRObservations(a2, {})), JSON.stringify(toFHIRObservations(o2, {})));
});

test("G10 exerciseRecommendations output identical before/after", { skip: "NOT BUILT: routes/exerciseRecommendations.js exports only the router; isEmergencyScreening (q1EmergencySymptoms read, :230) is private. Needs an export or an HTTP test." }, () => {});

// Layer 1: G9 (Phase 7 append-only clinicalrecords), G10 (Phase 6 assessments de-dup).
// Nothing here is implemented yet, so every test must fail cleanly until its phase lands.
//
// Phase 7 contract (agreed 2026-10-04, docs/DB_MIGRATION_TEST_DESIGN.md G9):
//   src/models/ClinicalRecord.js        mongoose model, collection "clinicalrecords", unique index {userId:1, version:1}
//   src/services/clinicalRecords.js     EXACTLY two exports: latest(userId), append(userId, data, recordedBy)
// Phase 6 contract (G10):
//   src/utils/assessmentDerive.js       deriveFromAnswers(answers) -> { factors, ...14 q* keys } via explicit QUESTION_MAP
// helpers.js `models` list carries ClinicalRecord (registered BEFORE mongoose.connect() so CSFLE applies; a G9 test asserts it
// and another asserts the fields are ciphertext on disk).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { EJSON } = require("mongodb").BSON;
const { connectEncrypted, raw, prodCounts, readProdOne, teardown, isCiphertext } = require("./helpers");

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
// Laterality codes (knee_left) are DEFERRED to Phase 8: no stored value has a side -- prod holds
// "Knee"/"Ankle"/"Hip"/"Elbow" and 26 "knee" rows -- and the side was never collected, so a migration
// cannot derive it and must not invent which joint bleeds. Phase 7 is append-only + the
// targetJoint -> targetJoints rename and array coercion ONLY.
const P8 = "[EXPECTED-FAIL until Phase 8 (laterality deferred)]";
const { ObjectId } = require("mongodb");
const uid = () => new ObjectId();
const seed = (extra = {}) => ({ patientId: "PATTEST9", type: "A", severity: "Severe", jointsAffected: ["Knee", "Ankle"],
  targetJoints: ["Knee"], patientNotes: "n9", currentFactorTherapy: ["FVIII"], ...extra });
const svcOf = () => need("services/clinicalRecords.js", "Phase 7 service");
const crOf = () => need("models/ClinicalRecord.js", "Phase 7 model");
const rowsOf = (u) => db.collection("clinicalrecords").find({ userId: u }).sort({ version: 1 }).toArray();
const codeOf = (e) => e?.code ?? e?.cause?.code ?? e?.errorResponse?.code;
// Phase 7 accepts the vocabulary that exists today. Phase 8 introduces laterality and the rejection rules.
const VALID_JOINTS = ["Knee", "Ankle", "Hip", "Elbow"];
const LAT_JOINTS = ["knee_left", "knee_right", "ankle_left", "ankle_right"];

test(`G9 helpers.js registers ClinicalRecord before connect (CSFLE schemaMap prerequisite)`, () => {
  const h = fs.readFileSync(path.join(__dirname, "helpers.js"), "utf8");
  const list = h.match(/const models = \[([\s\S]*?)\];/);
  assert.ok(list && /"ClinicalRecord"/.test(list[1]), 'helpers.js `models` list lacks "ClinicalRecord"');
});

test(`G9 ${P7} service exports exactly latest + append (no create/edit split)`, () => {
  crOf();
  const s = svcOf();
  assert.deepStrictEqual(Object.keys(s).sort(), ["append", "latest"]);
  assert.strictEqual(typeof s.latest, "function");
  assert.strictEqual(typeof s.append, "function");
});

test(`G9 ${P7} ClinicalRecord schema: all hemophiliadetails fields + version/recordedAt/recordedBy/supersededBy; targetJoint renamed`, () => {
  const p = Object.keys(crOf().schema.paths);
  const old = Object.keys(mg.model("HemophiliaDetails").schema.paths).filter((k) => !["_id", "__v", "createdAt", "updatedAt", "targetJoint"].includes(k));
  const missing = [...old, "targetJoints", "version", "recordedAt", "recordedBy", "supersededBy"].filter((k) => !p.includes(k));
  assert.deepStrictEqual(missing, [], "ClinicalRecord schema lacks fields");
  assert.ok(!p.includes("targetJoint"), "old singular targetJoint still in schema");
  const s = crOf().schema.paths;
  assert.strictEqual(s.version.instance, "Number");
  assert.strictEqual(s.recordedAt.instance, "Date");
  assert.strictEqual(s.recordedBy.instance, "ObjectId");
  assert.strictEqual(s.supersededBy.instance, "ObjectId");
  assert.strictEqual(crOf().collection.name, "clinicalrecords");
});

test(`G9 ${P7} unique index {userId:1, version:1} exists; userId alone is NOT unique (it would block v2)`, async () => {
  const CR = crOf();
  await CR.init(); // builds declared indexes in hemophilia_test
  const ixs = await db.collection("clinicalrecords").indexes();
  const ix = ixs.find((i) => JSON.stringify(i.key) === JSON.stringify({ userId: 1, version: 1 }));
  assert.ok(ix, "no {userId:1, version:1} index");
  assert.strictEqual(ix.unique, true, "index is not unique");
  const bad = ixs.find((i) => Object.keys(i.key).length === 1 && i.key.userId && i.unique);
  assert.ok(!bad, "unique index on userId alone (copied from hemophiliadetails) makes every second version fail");
});

test(`G9 ${P7} first append is v1 with recordedAt/recordedBy/supersededBy:null; latest() of unknown user is null`, async () => {
  const svc = svcOf(), u = uid(), by = uid();
  assert.strictEqual(await svc.latest(u), null);
  const before = Date.now();
  const r1 = await svc.append(u, seed(), by);
  assert.strictEqual(r1.version, 1);
  const [row] = await rowsOf(u);
  assert.strictEqual(row.version, 1);
  assert.ok(row.recordedAt instanceof Date && row.recordedAt.getTime() >= before - 1000, "recordedAt not a fresh Date");
  assert.strictEqual(String(row.recordedBy), String(by));
  assert.strictEqual(row.supersededBy, null);
  assert.strictEqual(String(row.userId), String(u));
});

test(`G9 ${P7} append ignores caller-supplied version/supersededBy/recordedBy/recordedAt in data`, async () => {
  const svc = svcOf(), u = uid(), by = uid();
  await svc.append(u, seed({ version: 99, supersededBy: uid(), recordedBy: uid(), recordedAt: new Date(0), userId: uid() }), by);
  const [row] = await rowsOf(u);
  assert.strictEqual(row?.version, 1, "caller version leaked");
  assert.strictEqual(row.supersededBy, null);
  assert.strictEqual(String(row.recordedBy), String(by));
  assert.ok(row.recordedAt.getTime() > 1e12, "caller recordedAt leaked");
});

test(`G9 ${P7} append twice -> v1,v2; v1 unchanged except supersededBy`, async () => {
  const svc = svcOf(), u = uid(), by = uid();
  await svc.append(u, seed(), by);
  const v1before = await db.collection("clinicalrecords").findOne({ userId: u, version: 1 });
  await svc.append(u, seed({ severity: "Mild" }), by);
  const rows = await rowsOf(u);
  assert.deepStrictEqual(rows.map((r) => r.version), [1, 2]);
  // updatedAt excluded: a timestamps bump from stamping supersededBy is tolerated; any other drift (incl. ciphertext bytes) is not.
  const strip = ({ supersededBy, updatedAt, ...r }) => EJSON.stringify(r);
  assert.strictEqual(strip(rows[0]), strip(v1before), "v1 mutated by the second append");
  assert.strictEqual(v1before.supersededBy, null, "precondition: v1 starts unsuperseded");
});

test(`G9 ${P7} three appends: chain v1->v2->v3->null, earlier links not rewritten, latest() is v3`, async () => {
  const svc = svcOf(), u = uid();
  for (const s of ["Mild", "Moderate", "Severe"]) await svc.append(u, seed({ severity: s }), uid());
  const [v1, v2, v3] = await rowsOf(u);
  assert.deepStrictEqual([v1, v2, v3].map((r) => r.version), [1, 2, 3]);
  assert.strictEqual(String(v1.supersededBy), String(v2._id));
  assert.strictEqual(String(v2.supersededBy), String(v3._id));
  assert.strictEqual(v3.supersededBy, null);
  const l = await svc.latest(u);
  assert.strictEqual(l.version, 3);
  assert.strictEqual(String(l._id), String(v3._id));
});

test(`G9 ${P7} latest() is per-user: another user's higher version does not leak`, async () => {
  const svc = svcOf(), a = uid(), b = uid();
  await svc.append(a, seed(), uid());
  for (let i = 0; i < 3; i++) await svc.append(b, seed(), uid());
  assert.strictEqual((await svc.latest(a)).version, 1);
  assert.strictEqual((await svc.latest(b)).version, 3);
});

// Two concurrent appends both read the same predecessor, so both try the same version. A bare Promise.allSettled
// only interleaves that way MOST of the time (a fast first append can finish before the second reads), so a
// single trial would be flaky. Each trial asserts the invariants; the test additionally demands that at least
// one trial was truly contested, else it did not exercise the race and fails rather than passing vacuously.
for (const [label, preSeed] of [["from an existing v1", true], ["first submission (no predecessor)", false]])
  test(`G9 ${P7} race ${label}: exactly one append wins, loser fails 11000, chain has no fork`, async () => {
    const CR = crOf(), svc = svcOf();
    await CR.init();
    let contested = 0;
    for (let t = 0; t < 25 && contested < 3; t++) {
      const u = uid();
      let v1;
      if (preSeed) { await svc.append(u, seed(), uid()); v1 = (await rowsOf(u))[0]; }
      const res = await Promise.allSettled([svc.append(u, seed({ severity: "Mild" }), uid()), svc.append(u, seed({ severity: "Moderate" }), uid())]);
      const ok = res.filter((r) => r.status === "fulfilled"), bad = res.filter((r) => r.status === "rejected");
      const rows = await rowsOf(u);
      const versions = rows.map((r) => r.version);
      assert.strictEqual(new Set(versions).size, versions.length, `trial ${t}: duplicate versions, chain forked: ${versions}`);
      assert.deepStrictEqual(versions, versions.map((_, i) => i + 1), `trial ${t}: version gap`);
      assert.strictEqual(rows.length, (preSeed ? 1 : 0) + ok.length, `trial ${t}: rows != winners`);
      for (const b of bad) assert.strictEqual(codeOf(b.reason), 11000, `loser must fail with duplicate-key 11000 (route maps to 409), got ${codeOf(b.reason)}: ${b.reason?.message}`);
      if (bad.length) {
        contested++;
        assert.strictEqual(ok.length, 1, "contested trial must have exactly one winner");
        if (preSeed) {
          assert.deepStrictEqual(versions, [1, 2]);
          assert.strictEqual(String(rows[0].supersededBy), String(rows[1]._id), "v1.supersededBy must point at the single v2");
          assert.strictEqual(EJSON.stringify({ ...rows[0], supersededBy: 0, updatedAt: 0 }), EJSON.stringify({ ...v1, supersededBy: 0, updatedAt: 0 }), "v1 mutated by a losing append");
        } else assert.deepStrictEqual(versions, [1]);
        assert.strictEqual(rows[rows.length - 1].supersededBy, null);
      }
    }
    assert.ok(contested >= 1, "never produced a contested race in 25 trials: concurrency not exercised (or append serialises, which would also hide a missing unique index)");
  });

// Behaviour, not naming: `clinicalrecords` REPLACES `hemophiliadetails`, so the route must not touch that
// model at all -- for reads either. Banning the identifier `existingDetails` instead (an earlier draft) was
// both too strict (it forces renaming the unrelated doctor-lock check, which legitimately reads prior state)
// and too weak (a rename that still read the old collection would pass).
test(`G9 ${P7} route uses clinicalRecords only: no read or write of the HemophiliaDetails model, no in-place overwrite, 11000 -> 409`, () => {
  const s = fs.readFileSync(src("routes/hemophiliaDetails.js"), "utf8");
  assert.ok(!/Object\.assign\(\s*\w*[Dd]etails/.test(s), "route still does Object.assign onto a loaded details doc (history-destroying write)");
  assert.ok(!/new\s+HemophiliaDetails\s*\(/.test(s), "route still constructs HemophiliaDetails (first-submission branch)");
  assert.ok(!/\bHemophiliaDetails\s*\.\s*\w+/.test(s), "route still uses the HemophiliaDetails model; clinicalrecords replaces it, reads included");
  assert.ok(/clinicalRecords/.test(s) && /\bappend\s*\(/.test(s), "route does not call clinicalRecords.append");
  assert.ok(/\blatest\s*\(/.test(s), "route does not read prior state via clinicalRecords.latest()");
  assert.ok(/11000[\s\S]{0,400}409/.test(s), "route does not map duplicate-key 11000 to 409");
});

test(`G9 ${P7} on disk: PHI fields are ciphertext, version/supersededBy/patientId cleartext (catches an unregistered model)`, async () => {
  crOf();
  const svc = svcOf(), u = uid();
  await svc.append(u, seed(), uid()); await svc.append(u, seed(), uid());
  const [v1, v2] = await rowsOf(u);
  for (const f of ["type", "severity", "targetJoints", "jointsAffected", "patientNotes", "currentFactorTherapy"])
    assert.ok(isCiphertext(v1[f]), `clinicalrecords.${f} is NOT ciphertext on disk (model registered after connect, or no encrypt option): ${JSON.stringify(v1[f])}`);
  assert.strictEqual(typeof v1.version, "number", "version must stay cleartext (unique index + sort)");
  assert.ok(v1.supersededBy instanceof ObjectId, "supersededBy must stay cleartext");
  assert.strictEqual(v2.supersededBy, null);
  assert.strictEqual(v1.patientId, "PATTEST9", "patientId stays cleartext (FastAPI reads it)");
  // and the app path decrypts it back
  const d = await crOf().findOne({ userId: u, version: 1 }).lean();
  assert.deepStrictEqual(d.targetJoints, ["Knee"]);
  assert.strictEqual(d.severity, "severe");
});

test(`G9 ${P7} targetJoints and jointsAffected are stored as ARRAYS and round-trip intact`, async () => {
  const svc = svcOf(), u = uid();
  await svc.append(u, seed({ jointsAffected: VALID_JOINTS, targetJoints: ["Knee", "Ankle"] }), uid());
  const d = await crOf().findOne({ userId: u }).lean(); // decrypted read
  assert.ok(Array.isArray(d.targetJoints), "targetJoints not an array");
  assert.ok(Array.isArray(d.jointsAffected), "jointsAffected not an array");
  assert.deepStrictEqual(d.targetJoints, ["Knee", "Ankle"]);
  assert.deepStrictEqual(d.jointsAffected, VALID_JOINTS);
});

// Phase 8, not Phase 7. Kept here so the vocabulary change is not forgotten.
test(`G9 ${P8} joint codes carry laterality and free text is rejected`, async () => {
  const svc = svcOf();
  for (const ok of LAT_JOINTS) await svc.append(uid(), seed({ targetJoints: [ok] }), uid());
  await assert.rejects(svc.append(uid(), seed({ targetJoints: ["Knee"] }), uid()), undefined, 'free-text "Knee" still accepted');
  await assert.rejects(svc.append(uid(), seed({ jointsAffected: ["Knee"] }), uid()), undefined, 'free-text "Knee" still accepted in jointsAffected');
});

test(`G9 ${P7} missing targetJoints is stored as [] (never absent/undefined/[undefined]), and every stored targetJoints is an array`, async () => {
  const svc = svcOf(), u = uid();
  const { targetJoints, ...noJoints } = seed();
  await svc.append(u, noJoints, uid()).catch(() => {}); // rejecting a missing value outright is also tolerable...
  const rows = await crOf().find({ userId: u }).lean();
  for (const r of rows) { // ...but if it was stored, it must be []
    assert.ok(Array.isArray(r.targetJoints), `stored targetJoints is ${JSON.stringify(r.targetJoints)}, not an array`);
    assert.deepStrictEqual(r.targetJoints, []);
  }
  // global invariant over everything this suite wrote so far
  for (const r of await crOf().find({}).lean()) assert.ok(Array.isArray(r.targetJoints), `a clinicalrecords.targetJoints is a ${typeof r.targetJoints}`);
});

// Phase 8: the malformed-code matrix. Phase 7 keeps today's vocabulary, so only the ARRAY shape is enforced
// above -- but a bare string must never be stored as a scalar, which is Phase 7's own invariant.
for (const field of ["targetJoints", "jointsAffected"]) {
  test(`G9 ${P8} malformed joint codes in ${field} are rejected and nothing is written`, async () => {
    const svc = svcOf();
    for (const bad of ["Knee_left", "knee_up", "knee left", "_left", "knee_", ""]) {
      for (const v of [[bad], ["knee_left", bad]]) {
        const u = uid();
        await assert.rejects(svc.append(u, seed({ [field]: v }), uid()), undefined, `${field}=${JSON.stringify(v)} accepted`);
        assert.strictEqual((await rowsOf(u)).length, 0, `${field}=${JSON.stringify(v)} left a row behind`);
      }
    }
  });

  // NOTE: these fields are CSFLE Random, which encrypts the WHOLE array into a single Binary, so the
  // on-disk value is never an Array -- the shape only exists after decryption. Read it back through the
  // model (which decrypts) rather than asserting on raw bytes.
  test(`G9 ${P7} a bare string in ${field} round-trips as an ARRAY, never a scalar (array coercion is the whole point)`, async () => {
    const u = uid();
    await svcOf().append(u, seed({ [field]: "Knee" }), uid()).catch(() => {}); // rejecting it is fine too
    for (const r of await crOf().find({ userId: u }).lean())
      assert.ok(Array.isArray(r[field]) || r[field] === undefined,
        `${field} decrypts to a scalar ${JSON.stringify(r[field])}; every $in/$elemMatch read site breaks on this`);
  });
}

test(`G9 ${P7} a rejected append does not burn a version or touch the predecessor`, async () => {
  const svc = svcOf(), u = uid();
  await svc.append(u, seed(), uid());
  const v1 = (await rowsOf(u))[0];
  // ageAtDiagnosis is a Number, so a non-numeric value is a CastError -- a validation failure that does
  // not depend on the joint vocabulary. (severity now has an enum, covered by its own tests.)
  await assert.rejects(svc.append(u, seed({ ageAtDiagnosis: "not-a-number" }), uid()));
  const rows = await rowsOf(u);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(EJSON.stringify(rows[0]), EJSON.stringify(v1), "predecessor changed by a rejected append");
  assert.strictEqual((await svc.append(u, seed(), uid())).version, 2, "version burned by the rejected append");
});

test(`G9 ${P8} patientexerciserecommendations: joint -> joints[] of laterality codes`, async () => {
  const M = mg.model("PatientExerciseRecommendation");
  const p = Object.keys(M.schema.paths);
  assert.ok(!p.includes("joint"), "old singular `joint` still in schema");
  assert.ok(p.includes("joints"), "`joints` missing");
  assert.strictEqual(M.schema.paths.joints.instance, "Array", "`joints` must be an array");
  const base = { patientUserId: uid(), patientId: "PATTEST9", exerciseId: "e1", exerciseName: "n", type: "JOINT", category: "c", source: "RULE" };
  const err = (joints) => new M({ ...base, joints }).validate().then(() => null, (e) => e.errors?.joints);
  assert.ok(!(await err(["knee_left", "ankle_right"])), "valid codes rejected");
  for (const bad of ["Knee", ["Knee"], ["knee"], ["knee_up"], ["knee_left", "Ankle"]]) assert.ok(await err(bad), `joints=${JSON.stringify(bad)} accepted`);
  // (Phase 7 leaves `joint` alone: all 26 prod rows hold the sideless "knee".)
});

// Migration coercion. The phase script is run-only today, so Layer 1 only imports it if it is import-safe
// (require.main guard); otherwise this fails instead of executing a migration. Contract: migrations/phase7_clinicalrecords.js
// exports coerceToArray(v) === (Array.isArray(v) ? v : (v == null || v === "" ? [] : [v])), used for targetJoint ONLY.
test(`G9 ${P7} migration coerceToArray: string -> [string], missing -> [], array passes through (not [undefined])`, () => {
  const f = path.join(__dirname, "..", "phase7_clinicalrecords.js");
  assert.ok(fs.existsSync(f), "migrations/phase7_clinicalrecords.js does not exist yet");
  assert.ok(/require\.main\s*===\s*module/.test(fs.readFileSync(f, "utf8")), "phase7 script must guard its run with `if (require.main === module)` so it can be imported without executing");
  const { coerceToArray } = require(f);
  assert.strictEqual(typeof coerceToArray, "function", "phase7 script must export coerceToArray");
  const same = (a, b) => assert.deepStrictEqual(a, b);
  same(coerceToArray("Knee"), ["Knee"]);
  same(coerceToArray(["Knee"]), ["Knee"]);
  same(coerceToArray(["a", "b"]), ["a", "b"]);
  same(coerceToArray(undefined), []);
  same(coerceToArray(null), []);
  same(coerceToArray(""), []);
  same(coerceToArray([]), []);
  for (const v of ["Knee", undefined, null, "", ["x"]]) assert.ok(Array.isArray(coerceToArray(v)));
});

// ---- G9: severity is a lowercase enumerated code (mild | moderate | severe) -----------------------
// Enforced at the schema (setter + enum) so no write site can bypass it. Blank -> absent (unknown), never guessed.
test(`G9 ${P7} severity: any case/whitespace is stored as the lowercase code`, async () => {
  const svc = svcOf();
  for (const [given, want] of [["Severe", "severe"], ["SEVERE", "severe"], [" Moderate ", "moderate"], ["mild", "mild"]]) {
    const u = uid();
    await svc.append(u, seed({ severity: given }), uid());
    const [r] = await crOf().find({ userId: u }).lean(); // decrypted read
    assert.strictEqual(r.severity, want, `severity ${JSON.stringify(given)} stored as ${JSON.stringify(r.severity)}`);
  }
});

test(`G9 ${P7} severity: unknown value is rejected and nothing is written; blank/missing is stored as absent`, async () => {
  const svc = svcOf();
  for (const bad of ["banana", "severe!", "3", "mildmoderate"]) {
    const u = uid();
    await assert.rejects(svc.append(u, seed({ severity: bad }), uid()), undefined, `severity=${bad} accepted`);
    assert.strictEqual((await rowsOf(u)).length, 0, `severity=${bad} left a row behind`);
  }
  for (const blank of ["", "   ", undefined]) {
    const u = uid();
    await svc.append(u, seed({ severity: blank }), uid());
    const [r] = await crOf().find({ userId: u }).lean();
    assert.strictEqual(r.severity, undefined, `blank severity ${JSON.stringify(blank)} stored as ${JSON.stringify(r.severity)}`);
  }
});

test(`G9 ${P7} severity: HemophiliaDetails (rollback copy) has the same setter + enum`, () => {
  const M = need("models/HemophiliaDetails.js", "legacy model");
  const v = (severity) => new M({ userId: uid(), severity });
  assert.strictEqual(v("Severe").severity, "severe");
  assert.strictEqual(v("").severity, undefined);
  assert.ok(v("banana").validateSync()?.errors?.severity, "banana accepted by HemophiliaDetails");
  assert.ok(!v("MILD").validateSync(), "MILD rejected by HemophiliaDetails");
});

test(`G9 ${P7} severity normalization script: guarded, exports norm, lowercases/trims and leaves non-strings alone`, () => {
  const f = path.join(__dirname, "..", "phase7b_severity_lowercase.js");
  assert.ok(/require\.main\s*===\s*module/.test(fs.readFileSync(f, "utf8")), "script must guard its run with require.main === module");
  const { norm } = require(f);
  assert.strictEqual(norm(" Severe "), "severe");
  assert.strictEqual(norm("mild"), "mild");
  assert.strictEqual(norm(""), "");
  assert.strictEqual(norm(undefined), undefined);
});

test(`G9 ${P7} every stored severity in clinicalrecords is canonical or absent`, async () => {
  for (const r of await crOf().find({}).lean())
    assert.ok(r.severity === undefined || ["mild", "moderate", "severe"].includes(r.severity), `stored severity ${JSON.stringify(r.severity)}`);
});

// ---- G9: array fields never decrypt to a scalar (currentFactorTherapy / otherMedications / physiotherapyProblems) ----
// Prod holds a bare string in currentFactorTherapy on 6/8 docs. Mongoose casts string -> [string] on write and Phase 7's
// migration wraps legacy scalars. Assert on DECRYPTED reads: a CSFLE-Random array is one Binary on disk.
for (const field of ["currentFactorTherapy", "otherMedications", "physiotherapyProblems"]) {
  test(`G9 ${P7} ${field}: bare string, array, and missing all decrypt to an ARRAY, never a scalar`, async () => {
    const svc = svcOf();
    const cases = [["Factor VIII", ["Factor VIII"]], [["a", "b"], ["a", "b"]], [undefined, []]];
    for (const [given, want] of cases) {
      const u = uid();
      await svc.append(u, seed({ [field]: given }), uid());
      const [r] = await crOf().find({ userId: u }).lean();
      assert.ok(Array.isArray(r[field]), `${field}=${JSON.stringify(given)} decrypts to ${typeof r[field]} ${JSON.stringify(r[field])}`);
      assert.deepStrictEqual(r[field], want);
    }
  });
}

test(`G9 ${P7} global invariant: every stored currentFactorTherapy/otherMedications/physiotherapyProblems is an array`, async () => {
  for (const r of await crOf().find({}).lean())
    for (const f of ["currentFactorTherapy", "otherMedications", "physiotherapyProblems"])
      assert.ok(Array.isArray(r[f]), `clinicalrecords.${f} is ${typeof r[f]}`);
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

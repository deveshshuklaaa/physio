// Layer 1: G1 (Phase 3 placement), G7 (encryption matrix), G8 (patientId joins).
// Writes only to hemophilia_test, reads back through a PLAIN client. Run: see README.md.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { isCiphertext, connectEncrypted, raw, prodCounts, teardown } = require("./helpers");

let mg, client, db, prodBefore, ids;
const M = (n) => mg.model(n);
const oid = () => new (require("mongodb").ObjectId)();

const STRIP14 = ["mobile", "alternateMobile", "designation", "hospitalName", "department", "hospitalAddress",
  "city", "state", "pinCode", "employeeId", "createdBy", "adminLevel", "permissions", "registrationRequestId"];
const KEEP = ["_id", "__v", "email", "passwordHash", "authProvider", "googleId", "professionalId", "role",
  "accountStatus", "mustChangePassword", "firstName", "middleName", "lastName", "nameTranslations", "createdAt", "updatedAt"];
const PID = "PATTEST1";

before(async () => {
  prodBefore = await prodCounts();
  mg = await connectEncrypted();
  ({ client, db } = await raw());
  const withStrip = { mobile: "9000000001", alternateMobile: "9000000002", designation: "Dr", hospitalName: "H",
    department: "D", hospitalAddress: "A", city: "Pune", state: "MH", pinCode: "411001", employeeId: "E1" };
  const admin = await M("User").create({ firstName: "T", lastName: "Admin", email: "a@example.invalid", passwordHash: "x",
    role: "admin", adminLevel: "SUPER_ADMIN", permissions: { canManageAdmins: true }, ...withStrip });
  const doc = await M("User").create({ firstName: "T", lastName: "Doc", email: "d@example.invalid", passwordHash: "x",
    role: "doctor", professionalId: "DOCTEST1", registrationRequestId: oid(), ...withStrip });
  const pat = await M("User").create({ firstName: "T", lastName: "Pat", email: "p@example.invalid", passwordHash: "x", role: "patient" });
  ids = { admin: admin._id, doc: doc._id, pat: pat._id };

  // Phase 3 moved these off users; nothing creates the profile rows for a seeded user, so seed them here.
  await M("AdminProfile").create({ userId: admin._id, adminLevel: "SUPER_ADMIN",
    permissions: { canManageAdmins: true }, ...withStrip });
  await M("DoctorProfile").create({ userId: doc._id, ...withStrip });

  // one doc per collection, through the real models (raw for the FastAPI-owned physiosessions)
  const u = pat._id;
  await M("PatientProfile").create({ userId: u, patientId: PID, gender: "M", bloodGroup: "O+",
    mobile: "9111111111", alternateContact: "9222222222", address: "1 Road", city: "Pune", state: "MH",
    pinCode: "411001", emergencyName: "E", emergencyPhone: "9333333333", hospitalName: "H" });
  await M("HemophiliaDetails").create({ userId: u, patientId: PID, type: "A", severity: "Severe", jointsAffected: ["Knee"],
    targetJoint: ["Knee"], patientNotes: "n", ageAtDiagnosis: 3, underPhysiotherapy: true });
  // Phase 7: clinicalrecords is the live clinical collection, so G7 needs a row to classify.
  await M("ClinicalRecord").create({ userId: u, patientId: PID, type: "A", severity: "Severe", jointsAffected: ["Knee"],
    targetJoints: ["Knee"], patientNotes: "n", ageAtDiagnosis: 3, underPhysiotherapy: true,
    version: 1, recordedAt: new Date(), recordedBy: u, supersededBy: null });
  await M("Assessment").create({ userId: u, patientId: PID, riskLevel: "HIGH", summaryText: "s", recommendation: "r",
    answers: [{ question: "q", answer: "a" }], q1EmergencySymptoms: ["x"], q2BleedMinorCuts: "no",
    mlProbabilitiesJson: "{}", mlFeaturesJson: "{}", factors: { bruises: "no" } });
  await M("DoctorRegistrationRequest").create({ firstName: "T", lastName: "Doc", email: "d@example.invalid", mobileNumber: "9444444444",
    medicalRegistrationNumber: "MRN1", medicalCouncil: "MMC", qualification: "MBBS", specialization: "Hem",
    yearsOfExperience: 5, hospitalName: "H", country: "IN", stateProvince: "MH", city: "Pune",
    declarationAccepted: true, professionalId: "DOCTEST1", status: "PENDING" });
  await M("DoctorChangeRequest").create({ patientUserId: u, patientId: PID, currentDoctorId: doc._id, status: "PENDING" });
  await M("PatientExerciseRecommendation").create({ patientUserId: u, patientId: PID, exerciseId: "e1", exerciseName: "E",
    type: "JOINT", joint: "Knee", category: "c", source: "RULE" });
  await db.collection("physiosessions").insertOne({ patientId: PID, sessionId: "S1", patientUserId: u }); // FastAPI writes plain
});

after(async () => {
  await teardown(mg, client);
  const prodAfter = await prodCounts();
  assert.deepStrictEqual(prodAfter, prodBefore, "hemophilia counts changed");
});

// ---- G1: Phase 3 placement ----------------------------------------
for (const f of STRIP14)
  test(`G1 users has no "${f}" (admin+doctor)`, async () => {
    const n = await db.collection("users").countDocuments({ _id: { $in: [ids.admin, ids.doc] }, [f]: { $exists: true } });
    assert.strictEqual(n, 0, `${n} users docs still carry ${f}`);
  });

test("G1 users holds exactly the keep-list", async () => {
  for (const id of [ids.admin, ids.doc]) {
    const extra = Object.keys(await db.collection("users").findOne({ _id: id })).filter((k) => !KEEP.includes(k));
    assert.deepStrictEqual(extra, [], `extra keys on users doc: ${extra}`);
  }
});

for (const [coll, who, expect] of [
  ["adminprofiles", "admin", { designation: "Dr", department: "D", hospitalName: "H" }],
  ["doctorprofiles", "doc", { city: "Pune", state: "MH", department: "D", hospitalName: "H" }],
])
  test(`G1 ${coll} row exists with moved values`, async () => {
    const p = await db.collection(coll).findOne({ userId: ids[who] });
    assert.ok(p, `${coll} has no row for userId (collection/model absent until Phase 3)`);
    for (const [k, v] of Object.entries(expect)) assert.strictEqual(p[k], v, `${coll}.${k}`);
  });

test("G1 writing permissions onto a users doc is not stored", async () => {
  const u = await M("User").create({ firstName: "Strict", lastName: "User", email: "s@example.invalid", passwordHash: "x", role: "patient",
    permissions: { canManageAdmins: true } }).catch(() => null); // rejection also acceptable
  if (!u) return;
  const d = await db.collection("users").findOne({ _id: u._id });
  assert.strictEqual(d.permissions, undefined, "permissions silently stored on a users doc");
});

// ---- G7: encryption-state matrix. [coll, field, "PT"|"CT"|"CT-target"|"PT-target", note] ----------
// Baseline rows verbatim from DB_MIGRATION_TEST_DESIGN.md. "-target" rows differ from the baseline.
const MATRIX = [
  ["users", "email", "CT"], ["users", "role", "PT"], ["users", "accountStatus", "PT"],
  ["users", "passwordHash", "PT"],
  ...["firstName", "lastName"].map((f) => ["users", f, "CT"]),
  ...["en", "hi", "mr"].map((l) => ["users", `nameTranslations.${l}`, "CT"]),
  ["users", "professionalId", "CT"],
  ...STRIP14.map((f) => ["users", f, "PT"]),
  ...["patientId", "city", "state", "pinCode", "bloodGroup", "gender", "hospitalName"].map((f) => ["patientprofiles", f, "PT"]),
  ...["mobile", "address", "alternateContact", "emergencyName", "emergencyPhone"].map((f) => ["patientprofiles", f, "CT"]),
  ...["patientId", "underPhysiotherapy", "ageAtDiagnosis"].map((f) => ["hemophiliadetails", f, "PT"]),
  ...["type", "severity", "jointsAffected", "targetJoint", "patientNotes"].map((f) => ["hemophiliadetails", f, "CT"]),
  // Phase 7 moved this field: `clinicalrecords.targetJoints` is the live location, while
  // `hemophiliadetails` is kept as the rollback copy and still holds the old `targetJoint`.
  ...["type", "severity", "jointsAffected", "targetJoints", "patientNotes"].map((f) => ["clinicalrecords", f, "CT"]),
  ...["patientId", "version", "underPhysiotherapy", "ageAtDiagnosis"].map((f) => ["clinicalrecords", f, "PT"]),
  ["assessments", "patientId", "PT"],
  // Phase 6 removed factors / the 14 q* keys / recommendation / suggestedTests from assessments;
  // they are derived at read time now (src/utils/assessmentDerive.js), so there is nothing on disk
  // to classify. A PT row for an absent field passes vacuously, so they are dropped, not kept.
  ...["summaryText", "answers"].map((f) => ["assessments", f, "PT"]),
  ...["riskLevel", "mlProbabilitiesJson", "mlFeaturesJson"].map((f) => ["assessments", f, "CT"]),
  ...["professionalId", "status"].map((f) => ["doctorregistrationrequests", f, "PT"]),
  ...["firstName", "lastName", "email", "mobileNumber", "medicalRegistrationNumber", "hospitalName", "city"].map((f) => ["doctorregistrationrequests", f, "CT"]),
  ["physiosessions", "patientId", "PT"], ["physiosessions", "sessionId", "PT"],
  ["patientexerciserecommendations", "patientId", "PT"], ["patientexerciserecommendations", "joint", "PT"],
  ["doctorchangerequests", "patientId", "PT"], ["doctorchangerequests", "status", "PT"],
];
// ponytail: fhirresources.encryptedData is app-level, not CSFLE -> no row; add if app-level crypto gets tested.

for (const [coll, field, want, note] of MATRIX)
  test(`G7 ${note ? `[${note}] ` : ""}${coll}.${field} is ${want}`, async () => {
    const doc = await db.collection(coll).findOne({ patientId: { $exists: true } }) ?? await db.collection(coll).findOne({ role: "doctor" })
      ?? await db.collection(coll).findOne();
    assert.ok(doc, `no ${coll} doc seeded`);
    const v = field.split(".").reduce((o, k) => o?.[k], doc);
    if (want === "CT") {
      assert.ok(v !== undefined, `${coll}.${field} absent`);
      // nameTranslations etc. are nested objects: CT means the value itself is Binary subtype 6
      assert.ok(isCiphertext(v), `${coll}.${field} is not CSFLE ciphertext (got ${v?._bsontype ?? typeof v})`);
    } else assert.ok(!isCiphertext(v), `${coll}.${field} unexpectedly ciphertext`);
  });

// ---- G8: patientId cleartext + joinable in all six collections (target state) -------------------
for (const c of ["patientprofiles", "hemophiliadetails", "assessments", "doctorchangerequests",
  "patientexerciserecommendations", "physiosessions"])
  test(`G8 ${c}: lookup by cleartext patientId finds the row`, async () => {
    const n = await db.collection(c).countDocuments({ patientId: PID });
    assert.strictEqual(n, 1, `${c}: equality on cleartext patientId found ${n} (field is ciphertext?)`);
    assert.ok(!isCiphertext((await db.collection(c).findOne({}))?.patientId), `${c}.patientId is ciphertext`);
  });

// Phase 1 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend: node migrations/phase1_cleanup.js
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient, ObjectId } = require("mongodb");
const connectDB = require("../config/db");
const User = require("../src/models/User");

const O = (s) => new ObjectId(s);
const AVANISH = O("6aa18fd35d13b31441194855");
const GANGU = O("6aa1e81b4ffcd2823826366b");
const AYUSH = O("6aa176bdbb076d281b03f7b7");

(async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const c = (n) => db.collection(n);
  const n = (coll, q) => c(coll).countDocuments(q);

  // [userId, expected name, expected role]; a user already gone is fine (idempotent), a mismatch is not.
  for (const [id, name, role] of [
    ["6aa18b075d13b31441194852", "Narendra Damodardas Modi", "patient"],
    ["6aa1d86bd8a12453200fd4e4", "avanish iyengar", "doctor"],
    ["6aa18fd35d13b31441194855", "avanish", "patient"],
  ]) {
    const u = await c("users").findOne({ _id: O(id) });
    if (!u) continue;
    assert.equal(u.fullName, name, `name mismatch ${id}`);
    assert.equal(u.role, role, `role mismatch ${id}`);
  }
  // doctor must be unreferenced
  const doc = O("6aa1d86bd8a12453200fd4e4");
  for (const [coll, f] of [["hemophiliadetails", "consultingDoctorId"], ["doctorchangerequests", "currentDoctorId"], ["doctorchangerequests", "doctorUserId"]])
    assert.equal(await n(coll, { [f]: { $in: [doc, String(doc)] } }), 0, `doctor referenced in ${coll}.${f}`);

  // gangu: verify identity before cascade
  const gp = await c("patientprofiles").findOne({ userId: GANGU });
  if (gp) assert(gp.patientId === "PAT980086" && String(gp._id) === "6aa1e8374ffcd2823826366d", "gangu profile mismatch");
  // avanish's PHI cluster: profile/details/3 recs already gone at run time; assessment 6aa190d7... remains
  const av = await c("assessments").findOne({ _id: O("6aa190d75d13b31441194858") });
  if (av) assert.equal(String(av.userId), String(AVANISH), "avanish assessment mismatch");

  const before = await n("physiosessions", { patientUserId: AYUSH });
  assert.equal(before, 486, "Ayush sessions != 486");

  // each cascade: matches either the planned count or 0 (already done)
  const cascade = async (coll, q, max) => {
    const k = await n(coll, q);
    assert(k <= max, `${coll} ${JSON.stringify(q)} matches ${k} > ${max}`);
    const r = await c(coll).deleteMany(q);
    console.log("deleted", coll, r.deletedCount);
  };
  for (const [uid, p] of [[AVANISH, 1], [GANGU, 1]]) {
    await cascade("patientprofiles", { userId: uid }, p);
    await cascade("hemophiliadetails", { userId: uid }, 1);
    await cascade("assessments", { userId: uid }, 1);
    await cascade("physiosessions", { patientUserId: uid }, 1);
    await cascade("patientexerciserecommendations", { patientUserId: uid }, uid === GANGU ? 6 : 3);
  }
  for (const id of ["6aa18b075d13b31441194852", "6aa1d86bd8a12453200fd4e4", "6aa18fd35d13b31441194855"])
    await cascade("users", { _id: O(id) }, 1);

  // recreate Ayush (no passwordHash -> unloggable). Model has no email/passwordHash for him, so skip validation.
  // ponytail: fullName is cleartext until Phase 4 makes the model encrypt it; re-save then.
  if (!(await c("users").findOne({ _id: AYUSH }))) {
    await new User({
      _id: AYUSH, fullName: "Ayush Ramji Solanki", role: "patient", accountStatus: "APPROVED",
      authProvider: "local", mustChangePassword: false,
    }).save({ validateBeforeSave: false });
    console.log("recreated Ayush");
  }

  // ---- asserts: end state ----
  const want = { users: 21, patientprofiles: 11, hemophiliadetails: 8, assessments: 28, physiosessions: 533,
    patientexerciserecommendations: 26, doctorchangerequests: 2, fhirresources: 32, screeningsessions: 0 };
  for (const [k, v] of Object.entries(want)) {
    const got = await n(k, {});
    console.log(k.padEnd(32), "got", got, "want", v);
    assert.equal(got, v, `${k} count`);
  }
  assert.equal(await n("physiosessions", { patientUserId: AYUSH }), 486, "Ayush sessions lost");

  // raw (non-decrypting) client for cleartext checks
  const raw = await MongoClient.connect(process.env.MONGO_URI);
  const r = raw.db("hemophilia");
  const isBin = (v) => v && v._bsontype === "Binary";
  for (const coll of ["patientprofiles", "hemophiliadetails", "assessments"]) {
    let clear = 0;
    for (const d of await r.collection(coll).find({}).toArray()) {
      const hasStr = Object.entries(d).some(([k, v]) => typeof v === "string" && !["patientId", "userId"].includes(k));
      if (hasStr && !Object.values(d).some(isBin)) clear++;
    }
    console.log(coll, "cleartext docs", clear);
    assert.equal(clear, 0, `${coll} cleartext docs`);
  }
  const plainEmail = await r.collection("users").countDocuments({ email: { $type: "string" } });
  console.log("plaintext users.email", plainEmail);
  assert.equal(plainEmail, 0, "plaintext emails remain");
  await raw.close();
  console.log("PHASE 1 OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

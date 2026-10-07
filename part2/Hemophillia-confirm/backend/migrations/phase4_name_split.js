// Phase 4 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend AFTER a rebuild (new models) and a fresh dump:
//   node migrations/phase4_name_split.js
// users + doctorregistrationrequests: fullName -> firstName/middleName/lastName (CSFLE Random), fullName dropped.
// users.nameTranslations -> Random (recomputed by the User pre-save hook). users.professionalId -> Deterministic.
// assessments.patientId -> cleartext. patientprofiles.fullName and loginotps.userData.fullName deleted.
// Idempotent: a second run finds nothing to change and only re-asserts the end state.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
// Models register BEFORE connect so mongoose builds the CSFLE schemaMap from them.
const User = require("../src/models/User");
require("../src/models/DoctorRegistrationRequest");
require("../src/models/Assessment");
require("../src/models/PatientProfile");
const { displayName } = require("../src/utils/displayName");
const connectDB = require("../config/db");

const ct = (v) => v?._bsontype === "Binary" && v.sub_type === 6;
const norm = (s) => String(s).trim().split(/\s+/).filter(Boolean);
const PARTS = ["firstName", "middleName", "lastName"];

// Migration split: 1->first; 2->first+last; 3->first+middle+last. Anything longer is a pre-flight abort.
// (src/utils/displayName.splitName generalises to 4+ tokens for live input; here we refuse instead.)
const splitTokens = (t) =>
  t.length === 1 ? { firstName: t[0] }
  : t.length === 2 ? { firstName: t[0], lastName: t[1] }
  : { firstName: t[0], middleName: t[1], lastName: t[2] };

(async () => {
  await connectDB(); // encrypted client: reads decrypt, writes encrypt per the models' schemaMap
  const dbName = mongoose.connection.name;
  const db = mongoose.connection.db;
  const plain = await new MongoClient(process.env.MONGO_URI).connect(); // NO autoEncryption: true on-disk bytes
  try {
    const pdb = plain.db(dbName);
    console.log(`Database: ${dbName}`);

    // ---------------- pre-flight (read only) ----------------
    const counts0 = {};
    for (const c of ["users", "doctorregistrationrequests", "assessments", "patientprofiles"])
      counts0[c] = await db.collection(c).countDocuments({});

    const plan = (rows, label) => {
      const split = [], unsetOnly = [];
      let done = 0;
      for (const r of rows) {
        const hasF = r.firstName !== undefined, hasFull = r.fullName !== undefined;
        if (hasF && hasFull) {
          // crash between save and $unset: finish only if the parts reproduce the old name exactly
          assert.strictEqual(displayName(r), norm(r.fullName).join(" "), `ABORT ${label} ${r._id}: firstName present but differs from fullName`);
          unsetOnly.push(r);
        } else if (hasF) done++;
        else {
          assert(typeof r.fullName === "string", `ABORT ${label} ${r._id}: neither firstName nor fullName`);
          const t = norm(r.fullName);
          assert(t.length >= 1 && t.length <= 3, `ABORT ${label} ${r._id}: ${t.length} name tokens (expected 1..3)`);
          split.push({ r, parts: splitTokens(t) });
        }
      }
      return { split, unsetOnly, done };
    };

    const users = await db.collection("users").find({}).toArray();
    const drrs = await db.collection("doctorregistrationrequests").find({}).toArray();
    const U = plan(users, "users"), D = plan(drrs, "doctorregistrationrequests");
    if (U.done) console.log(`users already split: ${U.done}`);
    const mononyms = U.split.filter((x) => !x.parts.lastName).length;

    const diskUsers = new Map((await pdb.collection("users").find({}, { projection: { professionalId: 1 } }).toArray()).map((d) => [String(d._id), d]));
    const profIdToEncrypt = users.filter((u) => u.professionalId !== undefined && !ct(diskUsers.get(String(u._id)).professionalId));
    const asmToDecrypt = (await pdb.collection("assessments").find({ patientId: { $type: "binData" } }, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
    const profFullName = await db.collection("patientprofiles").countDocuments({ fullName: { $exists: true } });
    const otpFullName = await db.collection("loginotps").countDocuments({ "userData.fullName": { $exists: true } });

    console.log("WILL CHANGE:");
    console.log(`  users: split ${U.split.length} (mononym, validateBeforeSave:false: ${mononyms}), drop fullName on ${U.split.length + U.unsetOnly.length}, encrypt professionalId on ${profIdToEncrypt.length}`);
    console.log(`  doctorregistrationrequests: split ${D.split.length}, drop fullName on ${D.split.length + D.unsetOnly.length}`);
    console.log(`  assessments: decrypt patientId on ${asmToDecrypt.length}`);
    console.log(`  patientprofiles: delete fullName on ${profFullName}`);
    console.log(`  loginotps: delete userData.fullName on ${otpFullName}`);
    if (U.split.length && mononyms !== 4) console.warn(`WARN: ${mononyms} mononym users (plan measured 4); LEGACY_INVALID_IDS also covers Ayush, who is not a mononym`);

    // ---------------- writes ----------------
    const uc = db.collection("users"), dc = db.collection("doctorregistrationrequests"), ac = db.collection("assessments");

    // Rows that legitimately fail schema validation for PRE-EXISTING reasons, and may
    // therefore be saved with validation off. Measured on prod 2026-10-08:
    //   3 admins + 1 patient  -> mononym, no lastName, schema requires one
    //   6aa176bdbb076d281b03f7b7 (Ayush) -> recreated by Phase 1 with NO email and NO
    //     passwordHash on purpose, so his 486 physiosessions survive while the account
    //     stays unloggable. 3-token name, so "mononym" does not describe him.
    //
    // `validateBeforeSave: false` disables EVERY validator, so it is never applied
    // speculatively: each row is saved WITH validation first, and the bypass is used
    // only after a ValidationError on a row that is on this list. A new violation on
    // any other row therefore still aborts the migration.
    const LEGACY_INVALID_IDS = new Set([
      "6aa190e7434d07476b7f4114", // admin, mononym
      "6aa196c88d097a3a7574516d", // admin, mononym
      "6aa2cc1eb80bb37a4f10ed86", // admin, mononym
      "6ab97a6c26c262d4ede9dbee", // patient, mononym
      "6aa176bdbb076d281b03f7b7", // Ayush: no email, no passwordHash (Phase 1, by design)
    ]);

    for (const { r, parts } of U.split) {
      const doc = await User.findById(r._id);
      doc.set(parts); // middleName stays absent for 1-2 token names
      // pre-save hook fills nameTranslations from the composed parts
      try {
        await doc.save();
      } catch (e) {
        if (e.name !== "ValidationError" || !LEGACY_INVALID_IDS.has(String(r._id))) throw e;
        console.warn(`  legacy-invalid ${r._id}: ${e.message} -- saving with validation off`);
        await doc.save({ validateBeforeSave: false });
      }
      await uc.updateOne({ _id: r._id }, { $unset: { fullName: "" } });
    }
    for (const r of U.unsetOnly) await uc.updateOne({ _id: r._id }, { $unset: { fullName: "" } });

    for (const u of profIdToEncrypt) // $set through the encrypted client -> Deterministic ciphertext
      await uc.updateOne({ _id: u._id }, { $set: { professionalId: u.professionalId } });

    for (const { r, parts } of D.split) await dc.updateOne({ _id: r._id }, { $set: parts, $unset: { fullName: "" } });
    for (const r of D.unsetOnly) await dc.updateOne({ _id: r._id }, { $unset: { fullName: "" } });

    for (const _id of asmToDecrypt) {
      const a = await ac.findOne({ _id }); // decrypted by the client
      assert.strictEqual(typeof a.patientId, "string", `assessment ${_id}: patientId did not decrypt`);
      await ac.updateOne({ _id }, { $set: { patientId: a.patientId } }); // no schemaMap rule any more -> cleartext
    }

    await db.collection("patientprofiles").updateMany({ fullName: { $exists: true } }, { $unset: { fullName: "" } });
    await db.collection("loginotps").updateMany({ "userData.fullName": { $exists: true } }, { $unset: { "userData.fullName": "" } });

    // ---------------- post-assert ----------------
    for (const c of Object.keys(counts0))
      assert.strictEqual(await db.collection(c).countDocuments({}), counts0[c], `${c} count changed`);

    const dec = await uc.find({}).toArray();
    for (const u of dec) assert(typeof u.firstName === "string" && u.firstName.length, `user ${u._id}: empty firstName`);
    const mono = dec.filter((u) => u.lastName === "").length;
    console.log(`users with empty lastName (mononym): ${mono}`);
    for (const d of await dc.find({}).toArray()) assert(d.firstName && d.lastName, `request ${d._id}: empty name part`);

    for (const [coll, parts] of [["users", [...PARTS, "nameTranslations.en", "nameTranslations.hi", "nameTranslations.mr"]], ["doctorregistrationrequests", PARTS]]) {
      for await (const d of pdb.collection(coll).find({})) {
        assert(!("fullName" in d), `${coll} ${d._id}: fullName still present`);
        for (const p of parts) {
          const v = p.split(".").reduce((o, k) => o?.[k], d);
          // Absent is legal: `middleName` is optional, and a mononym has no `lastName`
          // (the 4 legacy rows). Only a PRESENT value must be ciphertext -- asserting on
          // absence would fail on rows the schema never required to have the field.
          if (v === undefined) continue;
          assert(ct(v), `${coll} ${d._id}: ${p} is not ciphertext on disk`);
        }
        if (coll === "users" && d.professionalId !== undefined) assert(ct(d.professionalId), `users ${d._id}: professionalId not ciphertext`);
      }
    }
    for await (const d of pdb.collection("assessments").find({}))
      assert.strictEqual(typeof d.patientId, "string", `assessment ${d._id}: patientId is ${d.patientId?.constructor?.name}, not cleartext`);
    assert.strictEqual(await pdb.collection("patientprofiles").countDocuments({ fullName: { $exists: true } }), 0, "patientprofiles.fullName remains");
    assert.strictEqual(await pdb.collection("loginotps").countDocuments({ "userData.fullName": { $exists: true } }), 0, "loginotps userData.fullName remains");

    console.log("PHASE 4 OK");
  } finally {
    await plain.close();
  }
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

// Phase 7 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend AFTER a rebuild (new ClinicalRecord model):
//   node migrations/phase7_clinicalrecords.js
// hemophiliadetails -> clinicalrecords (append-only). Every surviving doc becomes version 1;
// targetJoint (string) -> targetJoints (array). jointsAffected is already an array: untouched.
// Laterality-aware joint codes are Phase 8, NOT here: sideless values ("Knee") are carried verbatim.
// recordedBy = the doc's own userId (the patient: the route is patient-only). recordedAt = updatedAt.
// Measure-then-write; idempotent (docs already present, matched by _id, are skipped).
// hemophiliadetails is NOT dropped: it is the rollback copy. Drop by hand after prod verification.
const coerceToArray = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
// Measured: legacy docs hold a bare string in currentFactorTherapy (6/8 on prod). The new model is
// [String] under CSFLE, which REFUSES a string on write, so these are wrapped. Separate from
// coerceToArray on purpose: targetJoint is renamed+coerced, these keep their name. jointsAffected is
// already an array everywhere and is carried verbatim (asserted below).
const WRAP = ["currentFactorTherapy", "otherMedications", "physiotherapyProblems"];
const wrap = (v) => (Array.isArray(v) ? v : v === "" ? [] : [v]);
module.exports = { coerceToArray };

if (require.main === module) {
  const { cryptSharedAvailable } = require("../config/cryptSharedPath");
  if (!cryptSharedAvailable) {
    console.error("ABORT: crypt_shared missing — cannot read/write encrypted fields safely.");
    process.exit(1);
  }
  const assert = require("assert");
  const mongoose = require("mongoose");
  const { MongoClient } = require("mongodb");
  require("../src/models/ClinicalRecord"); // registers BEFORE connect so the schemaMap covers clinicalrecords
  const connectDB = require("../config/db");
  const isCiphertext = (v) => v?._bsontype === "Binary" && v.sub_type === 6;

  (async () => {
    await connectDB(); // encrypted client: reads decrypt, writes encrypt
    const dbName = mongoose.connection.name;
    const src = mongoose.connection.db.collection("hemophiliadetails");
    const dst = mongoose.connection.db.collection("clinicalrecords");
    await mongoose.model("ClinicalRecord").createIndexes(); // unique (userId,version) must exist before writes
    const plain = await new MongoClient(process.env.MONGO_URI).connect(); // no autoEncryption
    try {
      const praw = plain.db(dbName).collection("clinicalrecords");
      console.log(`Database: ${dbName}`);

      // ---------------- pre-flight (read only) ----------------
      const rows = await src.find({}).toArray();
      const have = new Set((await dst.find({}, { projection: { _id: 1 } }).toArray()).map((d) => String(d._id)));
      const todo = rows.filter((r) => !have.has(String(r._id)));
      const shape = (r) => (Array.isArray(r.targetJoint) ? "array" : r.targetJoint == null ? "missing" : r.targetJoint === "" ? "empty-string" : "string");
      const tally = {};
      for (const r of rows) tally[shape(r)] = (tally[shape(r)] || 0) + 1;
      console.log(`hemophiliadetails: ${rows.length}; already in clinicalrecords: ${rows.length - todo.length}; to migrate: ${todo.length}; targetJoint shapes: ${JSON.stringify(tally)}`);
      assert(rows.every((r) => r.jointsAffected == null || Array.isArray(r.jointsAffected)), "ABORT: jointsAffected holds a non-array");
      console.log(`scalar-wrapped fields: ${rows.reduce((n, r) => n + WRAP.filter((k) => r[k] != null && !Array.isArray(r[k])).length, 0)}`);
      assert(new Set(rows.map((r) => String(r.userId))).size === rows.length, "ABORT: duplicate userId in hemophiliadetails");

      // ---------------- writes ----------------
      for (const r of todo) {
        const { targetJoint, __v, ...rest } = r;
        for (const k of WRAP) if (rest[k] != null) rest[k] = wrap(rest[k]);
        await dst.insertOne({
          ...rest, // _id kept: references stay valid
          targetJoints: coerceToArray(Array.isArray(r.targetJoints) ? r.targetJoints : targetJoint),
          version: 1,
          recordedAt: r.updatedAt || r.createdAt || new Date(),
          recordedBy: r.userId,
          supersededBy: null,
        });
      }
      console.log(`inserted ${todo.length} doc(s)`);

      // ---------------- post-assert ----------------
      assert(await dst.countDocuments({}) >= rows.length, "clinicalrecords has fewer docs than hemophiliadetails");
      for (const r of rows) {
        const d = await dst.findOne({ _id: r._id });
        assert(d, `${r._id}: missing in clinicalrecords`);
        assert(Array.isArray(d.targetJoints), `${r._id}: targetJoints is not an array (${typeof d.targetJoints})`);
        assert(d.targetJoint === undefined, `${r._id}: legacy targetJoint survived`);
        assert.deepStrictEqual(d.targetJoints, coerceToArray(r.targetJoint), `${r._id}: targetJoints changed`);
        for (const k of WRAP) assert(d[k] == null || Array.isArray(d[k]), `${r._id}: ${k} not array`);
        assert.deepStrictEqual(d.jointsAffected, r.jointsAffected, `${r._id}: jointsAffected changed`);
      }
      for (const d of await dst.find({}).toArray()) assert(Array.isArray(d.targetJoints), `${d._id}: targetJoints not array`);
      assert.strictEqual(await praw.countDocuments({ targetJoint: { $exists: true } }), 0, "targetJoint still on disk");
      assert.strictEqual(await praw.countDocuments({ version: { $type: "number" }, recordedAt: { $type: "date" }, supersededBy: { $exists: true } }), await praw.countDocuments({}), "chain fields missing");
      for (const d of await praw.find({ targetJoints: { $exists: true } }).toArray())
        assert(isCiphertext(d.targetJoints), `${d._id}: targetJoints not ciphertext on disk`);
      const idx = (await praw.indexes()).find((i) => i.name === "userId_1_version_1");
      assert(idx?.unique, "unique (userId,version) index missing");
      assert(!(await praw.indexes()).some((i) => i.unique && Object.keys(i.key).join() === "userId"), "userId must not be unique");
    } finally { await plain.close(); }

    console.log("PHASE 7 OK");
    process.exit(0);
  })().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
}

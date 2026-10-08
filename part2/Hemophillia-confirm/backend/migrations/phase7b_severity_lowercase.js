// Phase 7b: severity becomes a lowercase code (mild|moderate|severe). Run in hemo-backend AFTER a rebuild:
//   node migrations/phase7b_severity_lowercase.js
// hemophiliadetails (rollback copy) + clinicalrecords: lowercase/trim severity, blank -> $unset.
// Measure-then-write: an unclassifiable value ABORTS the run (never guessed). Idempotent.
const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const OK = ["mild", "moderate", "severe"];
module.exports = { norm };

if (require.main === module) {
  const { cryptSharedAvailable } = require("../config/cryptSharedPath");
  if (!cryptSharedAvailable) {
    console.error("ABORT: crypt_shared missing — cannot read/write encrypted severity safely.");
    process.exit(1);
  }
  const assert = require("assert");
  const mongoose = require("mongoose");
  const { MongoClient } = require("mongodb");
  require("../src/models/HemophiliaDetails"); // both register BEFORE connect so the schemaMap covers them
  require("../src/models/ClinicalRecord");
  const connectDB = require("../config/db");

  (async () => {
    await connectDB(); // encrypted client: reads decrypt, writes encrypt
    const dbName = mongoose.connection.name;
    const plain = await new MongoClient(process.env.MONGO_URI).connect();
    try {
      console.log(`Database: ${dbName}`);
      const have = new Set((await mongoose.connection.db.listCollections().toArray()).map((c) => c.name));
      for (const name of ["hemophiliadetails", "clinicalrecords"].filter((n) => have.has(n))) {
        const col = mongoose.connection.db.collection(name);
        const rows = await col.find({}).toArray();
        const dist = {};
        for (const r of rows) dist[JSON.stringify(r.severity ?? null)] = (dist[JSON.stringify(r.severity ?? null)] || 0) + 1;
        const bad = rows.filter((r) => r.severity != null && norm(r.severity) !== "" && !OK.includes(norm(r.severity)));
        const todo = rows.filter((r) => r.severity != null && (r.severity !== norm(r.severity) || r.severity === ""));
        console.log(`${name}: ${rows.length}; distribution ${JSON.stringify(dist)}; to rewrite: ${todo.length}; unclassifiable: ${bad.length}`);
        assert(!bad.length, `ABORT ${name}: unclassifiable severity ${JSON.stringify(bad.map((r) => [String(r._id), r.severity]))}`);

        for (const r of todo) {
          const n = norm(r.severity);
          await col.updateOne({ _id: r._id }, n === "" ? { $unset: { severity: "" } } : { $set: { severity: n } });
        }

        // post-assert: decrypted values canonical, count unchanged, still ciphertext on disk
        const after = await col.find({}).toArray();
        assert.strictEqual(after.length, rows.length, `${name}: document count changed`);
        for (const r of after) assert(r.severity == null || OK.includes(r.severity), `${name} ${r._id}: severity ${r.severity}`);
        for (const r of await plain.db(dbName).collection(name).find({ severity: { $exists: true } }).toArray())
          assert(r.severity?._bsontype === "Binary" && r.severity.sub_type === 6, `${name} ${r._id}: severity not ciphertext`);
      }
    } finally { await plain.close(); }
    console.log("PHASE 7b OK");
    process.exit(0);
  })().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
}

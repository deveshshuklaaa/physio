// Phase 6 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend AFTER a rebuild (new Assessment model):
//   node migrations/phase6_assessments.js
// assessments: $unset factors, the 14 flat q* keys, recommendation, suggestedTests.
// answers[] is canonical; src/utils/assessmentDerive.js rebuilds all of them at read time.
// Measure-then-write: a doc whose stored value is non-empty AND differs from the derivation would
// lose data, so the run aborts (override: P6_ACCEPT_DIVERGENCE=1 after a human has looked).
// Idempotent: a second run finds nothing to unset and only re-asserts the end state.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — cannot read encrypted answers/riskLevel safely.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
require("../src/models/Assessment"); // registers BEFORE connect so the schemaMap matches the new shape
const connectDB = require("../config/db");
const { deriveFromAnswers } = require("../src/utils/assessmentDerive");

const Q = Object.keys(deriveFromAnswers([])).filter((k) => k !== "factors");
const DROP = ["factors", ...Q, "recommendation", "suggestedTests"];
const empty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
const same = (a, b) => (empty(a) && empty(b)) || JSON.stringify(a) === JSON.stringify(b);

(async () => {
  await connectDB(); // encrypted client: reads decrypt
  const dbName = mongoose.connection.name;
  const col = mongoose.connection.db.collection("assessments");
  const plain = await new MongoClient(process.env.MONGO_URI).connect(); // no autoEncryption
  try {
    const pcol = plain.db(dbName).collection("assessments");
    console.log(`Database: ${dbName}`);

    // ---------------- pre-flight (read only) ----------------
    const rows = await col.find({}).toArray();
    const total = rows.length;
    const lost = [];
    let carrying = 0;
    for (const r of rows) {
      assert(Array.isArray(r.answers) && r.answers.length, `ABORT ${r._id}: no answers[] — nothing to derive from`);
      if (DROP.some((k) => r[k] !== undefined)) carrying++;
      const d = deriveFromAnswers(r.answers);
      for (const k of Q) if (r[k] !== undefined && !same(r[k], d[k])) lost.push([r._id, k, r[k], d[k]]);
      for (const [fk, v] of Object.entries(d.factors))
        if (r.factors?.[fk] !== undefined && !same(r.factors[fk], v)) lost.push([r._id, `factors.${fk}`, r.factors[fk], v]);
      if (!empty(r.recommendation)) lost.push([r._id, "recommendation", r.recommendation, undefined]);
      if (!empty(r.suggestedTests)) lost.push([r._id, "suggestedTests", r.suggestedTests, undefined]);
    }
    console.log(`assessments: ${total}; still carrying a dropped key: ${carrying}; non-derivable stored values: ${lost.length}`);
    for (const [id, k, s, d] of lost) console.log(`  ${id} ${k}: stored ${JSON.stringify(s)} derived ${JSON.stringify(d)}`);
    if (lost.length && process.env.P6_ACCEPT_DIVERGENCE !== "1")
      throw new Error("stored values would be lost (see above); set P6_ACCEPT_DIVERGENCE=1 to proceed");

    // ---------------- writes ----------------
    if (carrying) {
      const res = await col.updateMany({}, { $unset: Object.fromEntries(DROP.map((k) => [k, ""])) });
      console.log(`unset on ${res.modifiedCount} doc(s)`);
    }

    // ---------------- post-assert (on-disk, no decryption) ----------------
    assert.strictEqual(await pcol.countDocuments({}), total, "document count changed");
    for (const k of DROP) assert.strictEqual(await pcol.countDocuments({ [k]: { $exists: true } }), 0, `${k} still present`);
    assert.strictEqual(await pcol.countDocuments({ answers: { $exists: true } }), total, "answers[] missing somewhere");
    // answers[] intact and still decryptable-neutral: re-read through the encrypted client
    for (const r of await col.find({}).toArray()) assert(r.answers?.length, `${r._id}: answers[] lost`);
  } finally { await plain.close(); }

  console.log("PHASE 6 OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

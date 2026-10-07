// Phase 2 of docs/DB_MIGRATION_PLAN.md. Run in hemo-backend: node migrations/phase2_indexes.js
// Index-only (no document writes), but gated like every migration.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

// NOT adding a TTL on physiosessions.clinical.video.expiresAt: TTL deletes the whole session doc.
(async () => {
  await connectDB();
  const db = mongoose.connection.db;
  const ix = (c) => db.collection(c).indexes();

  // Same key, different options => Mongo name clash, so drop any existing index on that key first.
  // (Plain expiresAt -> TTL; plain professionalId -> unique sparse.) Skips one already correct.
  const ensure = async (c, key, opts = {}) => {
    for (const i of await ix(c)) {
      if (JSON.stringify(i.key) !== JSON.stringify(key)) continue;
      const same = Object.entries(opts).every(([k, v]) => JSON.stringify(i[k]) === JSON.stringify(v));
      if (same) return;
      await db.collection(c).dropIndex(i.name);
    }
    await db.collection(c).createIndex(key, opts);
  };
  await ensure("loginotps", { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await ensure("passwordresetotps", { expiresAt: 1 }, { expireAfterSeconds: 0 });
  await ensure("assessments", { userId: 1 });
  await ensure("assessments", { patientId: 1 });
  await ensure("doctorregistrationrequests", { professionalId: 1 }, { unique: true, sparse: true });
  await ensure("doctorchangerequests", { patientUserId: 1 }, { unique: true, partialFilterExpression: { status: "PENDING" } });

  const has = async (c, key, pred = () => true) =>
    assert((await ix(c)).some((i) => JSON.stringify(i.key) === JSON.stringify(key) && pred(i)), `${c} ${JSON.stringify(key)} missing`);
  await has("assessments", { userId: 1 });
  await has("assessments", { patientId: 1 });
  for (const c of ["loginotps", "passwordresetotps"]) await has(c, { expiresAt: 1 }, (i) => i.expireAfterSeconds === 0);
  await has("doctorregistrationrequests", { professionalId: 1 }, (i) => i.unique && i.sparse);
  await has("doctorchangerequests", { patientUserId: 1 }, (i) => i.unique && i.partialFilterExpression?.status === "PENDING");
  for (const i of await ix("physiosessions"))
    assert(!(i.expireAfterSeconds !== undefined), "TTL present on physiosessions");
  for (const c of ["assessments", "loginotps", "passwordresetotps", "doctorregistrationrequests", "doctorchangerequests"])
    console.log(c, JSON.stringify(await ix(c)));
  console.log("PHASE 2 OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

// Phase 3 of docs/DB_MIGRATION_PLAN.md (strip half). DEFERRED: run only after phase3_role_split.js is verified
// AND src/models/User.js no longer declares the 14 fields (else mongoose defaults re-add adminLevel/permissions).
// Run in hemo-backend: node migrations/phase3_strip_users.js
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
require("../src/models/User");
const AdminProfile = require("../src/models/AdminProfile");
const DoctorProfile = require("../src/models/DoctorProfile");
const connectDB = require("../config/db");

const STRIP14 = ["mobile", "alternateMobile", "designation", "hospitalName", "department", "hospitalAddress",
  "city", "state", "pinCode", "employeeId", "createdBy", "adminLevel", "permissions", "registrationRequestId"];

const KEEP = ["_id", "__v", "email", "passwordHash", "authProvider", "googleId", "professionalId", "role",
  "accountStatus", "mustChangePassword", "fullName", "nameTranslations", "createdAt", "updatedAt"];

(async () => {
  await connectDB();
  const users = mongoose.connection.db.collection("users");
  // refuse to destroy data that has no profile home (missing profile = no authz source = outage)
  for (const [role, Model] of [["admin", AdminProfile], ["doctor", DoctorProfile], ["clinician", DoctorProfile]]) {
    for (const u of await users.find({ role }, { projection: { _id: 1 } }).toArray())
      assert(await Model.exists({ userId: u._id }), `ABORT: ${role} ${u._id} has no profile; run phase3_role_split.js`);
  }
  // snapshot: per-doc keys outside the 14 must survive untouched
  const keepOf = (d) => Object.keys(d).filter((k) => !STRIP14.includes(k)).sort().join(",");
  const before = new Map((await users.find({}).toArray()).map((d) => [String(d._id), keepOf(d)]));
  const total = before.size;
  const odd = new Set([...before.values()].flatMap((v) => v.split(",")).filter((k) => k && !KEEP.includes(k)));
  if (odd.size) console.warn("WARN: non-keep-list fields present (left untouched):", [...odd].join(", "));

  console.log(`users total: ${total}; per-field docs to change:`);
  for (const f of STRIP14) console.log(`  ${f}: ${await users.countDocuments({ [f]: { $exists: true } })}`);

  const r = await users.updateMany({ $or: STRIP14.map((f) => ({ [f]: { $exists: true } })) },
    { $unset: Object.fromEntries(STRIP14.map((f) => [f, ""])) });
  console.log("users modified:", r.modifiedCount); // 0 on re-run

  const left = await users.countDocuments({ $or: STRIP14.map((f) => ({ [f]: { $exists: true } })) });
  assert.strictEqual(left, 0, `${left} users still carry stripped fields`);
  const after = await users.find({}).toArray();
  assert.strictEqual(after.length, total, "user count changed");
  for (const d of after)
    assert.strictEqual(keepOf(d), before.get(String(d._id)), `keep-list fields changed on ${d._id}`);
  console.log("PHASE 3 STRIP OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

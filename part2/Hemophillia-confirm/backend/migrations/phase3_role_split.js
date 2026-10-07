// Phase 3 of docs/DB_MIGRATION_PLAN.md (backfill half). Run in hemo-backend: node migrations/phase3_role_split.js
// Copies admin/doctor fields out of `users` into adminprofiles / doctorprofiles. Does NOT touch `users`
// (phase3_strip_users.js does, later). Idempotent: existing profile rows are left alone.
const { cryptSharedAvailable } = require("../config/cryptSharedPath");
if (!cryptSharedAvailable) {
  console.error("ABORT: crypt_shared missing — would write cleartext PHI.");
  process.exit(1);
}
const assert = require("assert");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
// Models must register BEFORE connect so mongoose builds the CSFLE schemaMap for the new collections.
const User = require("../src/models/User");
const AdminProfile = require("../src/models/AdminProfile");
const DoctorProfile = require("../src/models/DoctorProfile");
const DoctorRegistrationRequest = require("../src/models/DoctorRegistrationRequest");
const connectDB = require("../config/db");

const pick = (src, keys) => Object.fromEntries(keys.filter((k) => src[k]).map((k) => [k, src[k]]));
const ADMIN_KEYS = ["mobile", "alternateMobile", "designation", "hospitalName", "department", "hospitalAddress",
  "city", "state", "pinCode", "employeeId"];
const DOC_KEYS = ["mobile", "alternateMobile", "designation", "hospitalName", "department", "hospitalAddress",
  "city", "state", "pinCode", "employeeId"];

(async () => {
  await connectDB();
  const users = mongoose.connection.db.collection("users");
  let a = 0, d = 0;

  for (const u of await users.find({ role: "admin" }).toArray()) {
    if (await AdminProfile.exists({ userId: u._id })) continue;
    await AdminProfile.create({
      userId: u._id,
      adminLevel: u.adminLevel === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN",
      permissions: {
        canManageAdmins: u.permissions?.canManageAdmins === true,
        canManageDoctors: u.permissions?.canManageDoctors === true,
        canViewPatients: u.permissions?.canViewPatients === true,
        canManageDoctorRequests: u.permissions?.canManageDoctorRequests === true,
      },
      createdBy: u.createdBy || null,
      ...pick(u, ADMIN_KEYS),
    });
    a++;
  }

  for (const u of await users.find({ role: { $in: ["doctor", "clinician"] } }).toArray()) {
    if (await DoctorProfile.exists({ userId: u._id })) continue;
    const req = u.registrationRequestId
      ? await DoctorRegistrationRequest.findById(u.registrationRequestId)
      : u.professionalId
        ? await DoctorRegistrationRequest.findOne({ professionalId: u.professionalId })
        : null;
    // registration data first, then whatever the doctor later edited on users wins
    await DoctorProfile.create({
      userId: u._id,
      registrationRequestId: u.registrationRequestId || req?._id || null,
      mobile: req?.mobileNumber || undefined,
      hospitalName: req?.hospitalName || undefined,
      city: req?.city || undefined,
      state: req?.stateProvince || undefined,
      specialization: req?.specialization || undefined,
      qualification: req?.qualification || undefined,
      medicalRegistrationNumber: req?.medicalRegistrationNumber || undefined,
      ...pick(u, DOC_KEYS),
    });
    d++;
  }
  console.log(`created adminprofiles=${a} doctorprofiles=${d}`);

  // ---- verify
  const nAdmins = await users.countDocuments({ role: "admin" });
  const nDocs = await users.countDocuments({ role: { $in: ["doctor", "clinician"] } });
  assert.strictEqual(await AdminProfile.countDocuments(), nAdmins, "adminprofiles count != admin users");
  assert.strictEqual(await DoctorProfile.countDocuments(), nDocs, "doctorprofiles count != doctor users");
  const nonStaff = (await users.find({ role: { $nin: ["admin", "doctor", "clinician"] } }, { projection: { _id: 1 } }).toArray()).map((x) => x._id);
  assert.strictEqual(await AdminProfile.countDocuments({ userId: { $in: nonStaff } }), 0, "profile row on a patient");
  assert.strictEqual(await DoctorProfile.countDocuments({ userId: { $in: nonStaff } }), 0, "profile row on a patient");

  // on-disk check through a PLAIN client: encrypted fields must be Binary subtype 6
  const plain = await new MongoClient(process.env.MONGO_URI).connect();
  try {
    const pdb = plain.db(mongoose.connection.name);
    const ct = (v) => v?._bsontype === "Binary" && v.sub_type === 6;
    for (const [coll, fields] of [["adminprofiles", ["mobile", "alternateMobile", "hospitalAddress", "pinCode", "employeeId"]],
      ["doctorprofiles", ["mobile", "alternateMobile", "hospitalAddress", "pinCode", "employeeId", "medicalRegistrationNumber"]]])
      for await (const doc of pdb.collection(coll).find())
        for (const f of fields) if (doc[f] !== undefined) assert(ct(doc[f]), `${coll}.${f} is cleartext on disk`);
  } finally { await plain.close(); }
  console.log("PHASE 3 BACKFILL OK");
  process.exit(0);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });

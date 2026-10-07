const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");

// Admin authz + org data, split out of `users`. Source of truth for adminLevel/permissions.
const rnd = { keyId: [dataKeyId], algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random" };

const adminProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    adminLevel: { type: String, enum: ["SUPER_ADMIN", "ADMIN"], default: "ADMIN" },
    permissions: {
      canManageAdmins: { type: Boolean, default: false },
      canManageDoctors: { type: Boolean, default: false },
      canViewPatients: { type: Boolean, default: false },
      canManageDoctorRequests: { type: Boolean, default: false },
    },
    mobile: {
      type: String,
      encrypt: { keyId: [dataKeyId], algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic" },
    },
    // Extras beyond the plan: admins also edit these via PUT /api/admin/me; dropping them loses data.
    alternateMobile: { type: String, encrypt: rnd },
    hospitalAddress: { type: String, encrypt: rnd },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pinCode: { type: String, encrypt: rnd },
    employeeId: { type: String, encrypt: rnd },
    designation: { type: String, default: "" },
    hospitalName: { type: String, default: "" },
    department: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, encryptionType: "csfle" }
);

module.exports = mongoose.models.AdminProfile || mongoose.model("AdminProfile", adminProfileSchema);

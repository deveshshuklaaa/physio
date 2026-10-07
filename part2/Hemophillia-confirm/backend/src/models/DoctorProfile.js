const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");

const enc = (alg) => ({ keyId: [dataKeyId], algorithm: `AEAD_AES_256_CBC_HMAC_SHA_512-${alg}` });

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    mobile: { type: String, encrypt: enc("Deterministic") },
    // Extras beyond the plan: doctors edit these via PUT /api/doctor/me/profile.
    alternateMobile: { type: String, encrypt: enc("Random") },
    designation: { type: String, default: "" },
    hospitalName: { type: String, default: "" },
    department: { type: String, default: "" },
    hospitalAddress: { type: String, encrypt: enc("Random") },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pinCode: { type: String, encrypt: enc("Random") },
    employeeId: { type: String, encrypt: enc("Random") },
    registrationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorRegistrationRequest", default: null },
    specialization: { type: String, default: "" },
    qualification: { type: String, default: "" },
    medicalRegistrationNumber: { type: String, encrypt: enc("Random") },
  },
  { timestamps: true, encryptionType: "csfle" }
);

module.exports = mongoose.models.DoctorProfile || mongoose.model("DoctorProfile", doctorProfileSchema);

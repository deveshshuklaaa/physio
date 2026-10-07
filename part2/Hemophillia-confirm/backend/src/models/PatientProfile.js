// const mongoose = require("mongoose");

// const patientProfileSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true,
//     },

//     // ✅ NEW: Patient ID
//     patientId: {
//       type: String,
//       unique: true,
//     },

//     // Patient Identification
//     fullName: { type: String },
//     gender: { type: String },
//     dob: { type: Date },
//     age: { type: Number },
//     bloodGroup: { type: String },
//     photoUrl: { type: String },

//     // Contact Information
//     mobile: { type: String },
//     alternateContact: { type: String },
//     email: { type: String },
//     address: { type: String },
//     city: { type: String },
//     state: { type: String },
//     pinCode: { type: String },

//     // Emergency Contact
//     emergencyName: { type: String },
//     emergencyRelationship: { type: String },
//     emergencyPhone: { type: String },

//     // Socio-demographic
//     maritalStatus: { type: String },
//     educationLevel: { type: String },
//     occupation: { type: String },
//     annualIncome: { type: String },
//     insuranceStatus: { type: String },
//     insuranceProvider: { type: String },

//     // Care center linkage
//     htcName: { type: String },
//     hematologistName: { type: String },
//     hospitalName: { type: String },
//     existingPatientNumber: { type: String },

//     // Consent flags
//     consentDataCollection: { type: Boolean, default: false },
//     consentAI: { type: Boolean, default: false },
//     consentVideoMonitoring: { type: Boolean, default: false },
//     privacyAccepted: { type: Boolean, default: false },
//     termsAccepted: { type: Boolean, default: false },
//     consentTimestamp: { type: Date },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("PatientProfile", patientProfileSchema);

const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Searchable - DO NOT ENCRYPT
    patientId: {
      type: String,
      unique: true,
    },

    // ==========================
    // Patient Identification
    // ==========================

    gender: { type: String },

    dob: { type: Date },

    age: { type: Number },

    bloodGroup: { type: String },

    photoUrl: { type: String },

    // ==========================
    // Contact Information
    // ==========================

    mobile: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
      },
    },

    alternateContact: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    email: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
      },
    },

    address: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    city: { type: String },

    state: { type: String },

    pinCode: { type: String },

    // ==========================
    // Emergency Contact
    // ==========================

    emergencyName: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    emergencyRelationship: { type: String },

    emergencyPhone: {
      type: String,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    // ==========================
    // Socio-demographic
    // ==========================

    maritalStatus: { type: String },

    educationLevel: { type: String },

    occupation: { type: String },

    annualIncome: { type: String },

    insuranceStatus: { type: String },

    insuranceProvider: { type: String },

    // ==========================
    // Hospital Information
    // ==========================

    htcName: { type: String },

    hematologistName: { type: String },

    hospitalName: { type: String },

    existingPatientNumber: { type: String },

    // ==========================
    // Consent
    // ==========================

    consentDataCollection: {
      type: Boolean,
      default: false,
    },

    consentAI: {
      type: Boolean,
      default: false,
    },

    consentVideoMonitoring: {
      type: Boolean,
      default: false,
    },

    privacyAccepted: {
      type: Boolean,
      default: false,
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    consentTimestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
    encryptionType: "csfle",
  }
);

module.exports = mongoose.model(
  "PatientProfile",
  patientProfileSchema
);
const mongoose = require("mongoose");

const DATA_KEY_ID =
  require("../../config/dataKey");

// =====================================================
// ENCRYPTED STRING
// =====================================================

const encryptedString = {
  type: String,

  encrypt: {
    keyId: [DATA_KEY_ID],

    algorithm:
      "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

// =====================================================
// ENCRYPTED FILE
// =====================================================

const encryptedFile = {
  type: Buffer,

  encrypt: {
    keyId: [DATA_KEY_ID],

    algorithm:
      "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

// =====================================================
// SCHEMA
// =====================================================

const doctorRegistrationRequestSchema =
  new mongoose.Schema(
    {
      // ===============================================
      // PERSONAL
      // ===============================================

      // Name as submitted, in 3 parts (no fullName stored). Approval copies them to users as-is.
      firstName: { ...encryptedString, required: true, trim: true },
      middleName: { ...encryptedString, trim: true },
      lastName: { ...encryptedString, required: true, trim: true },

      email: encryptedString,

      mobileNumber: encryptedString,

      // ===============================================
      // PROFESSIONAL
      // ===============================================

      medicalRegistrationNumber:
        encryptedString,

      medicalCouncil:
        encryptedString,

      qualification:
        encryptedString,

      specialization:
        encryptedString,

      yearsOfExperience: {
        type: Number,
        required: true,
        min: 0,
      },

      // ===============================================
      // WORKPLACE / LOCATION
      // ===============================================

      hospitalName:
        encryptedString,

      // COUNTRY
      country:
        encryptedString,

      // STATE / PROVINCE
      stateProvince:
        encryptedString,

      // CITY
      city:
        encryptedString,

      // ===============================================
      // DOCUMENT FILES
      // ACTUAL FILE CONTENT
      // ===============================================

      registrationCertificate:
        encryptedFile,

      professionalIdDocument:
        encryptedFile,

      // ===============================================
      // DOCUMENT METADATA
      // ===============================================

      registrationCertificateName: {
        type: String,
        default: null,
      },

      registrationCertificateMimeType: {
        type: String,
        default: null,
      },

      professionalIdDocumentName: {
        type: String,
        default: null,
      },

      professionalIdDocumentMimeType: {
        type: String,
        default: null,
      },

      // ===============================================
      // DECLARATION
      // ===============================================

      declarationAccepted: {
        type: Boolean,
        required: true,
        default: false,
      },
      professionalId: {
        type: String,
        // No `default: null` and no `index: true`.
        //
        // The staff ID is assigned by an admin at approval, so the field must be
        // ABSENT until then. A `default: null` writes an explicit null, and the
        // unique+sparse index only exempts ABSENT fields -- so every pending request
        // held the same null and the second one collided:
        //   E11000 duplicate key ... index: professionalId_1
        // which blocked all new doctor registrations.
        //
        // The index itself is owned by migrations/phase2_indexes.js. Declaring
        // `index: true` here races it with a PLAIN index on the same key, the same
        // way it did on the OTP models' expiresAt.
      },

      // ===============================================
      // REQUEST STATUS
      // KEEP SEARCHABLE
      // ===============================================

      status: {
        type: String,

        enum: [
          "PENDING",
          "APPROVED",
          "REJECTED",
        ],

        default: "PENDING",

        index: true,
      },

      // ===============================================
      // ADMIN REVIEW
      // ===============================================

      reviewedBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,
      },

      reviewedAt: {
        type: Date,

        default: null,
      },

      rejectionReason:
        encryptedString,
    },

    {
      timestamps: true,

      encryptionType: "csfle",
    }
  );

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.DoctorRegistrationRequest ||
  mongoose.model(
    "DoctorRegistrationRequest",
    doctorRegistrationRequestSchema
  );
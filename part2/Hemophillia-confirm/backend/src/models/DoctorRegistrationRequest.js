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

      fullName: {
        type: String,
        required: true,
        trim: true,
      },

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
        default: null,
        index: true,
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
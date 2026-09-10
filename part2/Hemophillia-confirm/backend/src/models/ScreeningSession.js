const mongoose = require("mongoose");

// Use the same BSON Binary Data Encryption Key everywhere
const DATA_KEY_ID = require("../../config/dataKey");

const encryptedString = {
  type: String,
  encrypt: {
    keyId: [DATA_KEY_ID],
    algorithm:
      "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

const screeningSessionSchema = new mongoose.Schema(
  {
    // ==============================
    // NOT ENCRYPTED
    // ==============================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==============================
    // ENCRYPTED
    // ==============================

    q1EmergencySymptoms: {
      type: [String],
      encrypt: {
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    q2BleedMinorCuts: encryptedString,

    q3DentalSurgeryBleeding: encryptedString,

    q4Bruises: encryptedString,

    q5MuscleSwelling: encryptedString,

    q6JointSwelling: encryptedString,

    q7JointsList: {
      type: [String],
      encrypt: {
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    q8JointWarmthTightness: encryptedString,

    q9BloodUrineStool: encryptedString,

    q10FamilyHistory: encryptedString,

    q11HeavyMenstrual: encryptedString,

    q12PreviousTesting: encryptedString,

    q12FactorLow: encryptedString,

    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High", "Emergency"],
      default: "Low",
      encrypt: {
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    summaryText: encryptedString,

    recommendation: encryptedString,

    suggestedTests: {
      type: [String],
      encrypt: {
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    // ==============================
    // NOT ENCRYPTED
    // ==============================

    q10MaleRelativeFlag: {
      type: Boolean,
      default: false,
    },

    emergencyFlag: {
      type: Boolean,
      default: false,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    strongSuspicionFlag: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    encryptionType: "csfle",
  }
);

module.exports =
  mongoose.models.ScreeningSession ||
  mongoose.model("ScreeningSession", screeningSessionSchema);
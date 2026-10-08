

const mongoose = require("mongoose");
const DATA_KEY_ID = require("../../config/dataKey");

const encryptedString = {
  type: String,
  encrypt: {
    keyId: [DATA_KEY_ID],
    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

const encryptedStringArray = {
  type: [String],
  encrypt: {
    keyId: [DATA_KEY_ID],
    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

const clinicalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // NOT unique: one row per version. Uniqueness is (userId, version) below.
    },

    patientId: {
      type: String,
    },

    consultingDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Basic hemophilia information
    type: encryptedString,

    // Stored code is lowercase: mild | moderate | severe. Setter lowercases (so "Severe" from an
    // old client still lands); blank -> absent (= unknown, never guessed); anything else fails enum.
    severity: {
      ...encryptedString,
      set: (v) => (typeof v === "string" ? v.trim().toLowerCase() || undefined : v),
      enum: ["mild", "moderate", "severe"],
    },

    ageAtDiagnosis: {
      type: Number,
    },

    familyHistory: encryptedString,

    geneticTestingDone: encryptedString,

    // Current treatment - MULTIPLE values
    currentFactorTherapy: encryptedStringArray,

    otherCurrentTreatment: encryptedString,

    // Other medications - MULTIPLE values
    otherMedications: encryptedStringArray,

    otherMedicationDetails: encryptedString,

    // Bleeding pattern
    bleedingPattern: encryptedString,

    jointsAffected: encryptedStringArray,

    // MULTIPLE values -- a patient can have more than one target joint.
    targetJoints: encryptedStringArray,

    bleedFrequency: encryptedString,

    lastBleedDate: {
      type: Date,
    },

    otherBleedingDetails: encryptedString,

    // Physiotherapy
    underPhysiotherapy: {
      type: Boolean,
      default: null,
    },

    physiotherapyLocation: encryptedString,

    physiotherapySessions: encryptedString,

    physiotherapyDuration: encryptedString,

    physiotherapyBodyPart: encryptedString,

    physiotherapyTreatment: encryptedString,

    physiotherapyEquipment: encryptedString,

    physiotherapyHelping: encryptedString,

    physiotherapyProblems: encryptedStringArray,

    previousPhysiotherapy: {
      type: Boolean,
      default: null,
    },

    physiotherapyStoppedDate: {
      type: Date,
    },

    physiotherapyStoppedReason: encryptedString,

    // Mobility
    mobilityLimitation: encryptedString,

    assistiveDevices: encryptedString,

    // Free-text notes from the patient
    patientNotes: encryptedString,

    // ---- append-only chain (all cleartext: sorted / uniquely indexed) ----
    version: { type: Number, required: true },
    recordedAt: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    supersededBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  {
    timestamps: true,
    encryptionType: "csfle",
  }
);

// Concurrent appends both compute the same next version; the loser gets E11000.
clinicalRecordSchema.index({ userId: 1, version: 1 }, { unique: true });

module.exports =
  mongoose.models.ClinicalRecord ||
  mongoose.model("ClinicalRecord", clinicalRecordSchema, "clinicalrecords");

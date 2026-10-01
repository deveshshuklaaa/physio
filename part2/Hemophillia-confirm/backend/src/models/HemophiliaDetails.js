

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

const hemophiliaDetailsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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

    severity: encryptedString,

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

    targetJoint: encryptedString,

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
  },
  {
    timestamps: true,
    encryptionType: "csfle",
  }
);

module.exports =
  mongoose.models.HemophiliaDetails ||
  mongoose.model("HemophiliaDetails", hemophiliaDetailsSchema);
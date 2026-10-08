

// const mongoose = require("mongoose");
// const { Binary } = require("mongodb");

// // =====================================================
// // CSFLE DATA KEY
// // =====================================================

// const DATA_KEY_ID = Binary.createFromBase64(
//   "cK8aqOqVSBCJKGnAHZMimw==",
//   Binary.SUBTYPE_UUID
// );

// // =====================================================
// // ENCRYPTED STRING
// // =====================================================

// const encryptedString = {
//   type: String,
//   encrypt: {
//     keyId: [DATA_KEY_ID],
//     algorithm:
//       "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
//   },
// };

// // =====================================================
// // ENCRYPTED STRING ARRAY
// // =====================================================

// const encryptedStringArray = {
//   type: [String],
//   encrypt: {
//     keyId: [DATA_KEY_ID],
//     algorithm:
//       "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
//   },
// };

// // =====================================================
// // ASSESSMENT SCHEMA
// // =====================================================

// const assessmentSchema = new mongoose.Schema(
//   {
//     // =================================================
//     // BASIC / NON-ENCRYPTED
//     // =================================================

//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     score: {
//       type: Number,
//       default: 0,
//     },

//     totalScore: {
//       type: Number,
//       default: 0,
//     },

//     emergencyFlag: {
//       type: Boolean,
//       default: false,
//     },

//     strongSuspicionFlag: {
//       type: Boolean,
//       default: false,
//     },

//     // =================================================
//     // PATIENT ID
//     // =================================================

//     patientId: {
//       type: String,
//       required: true,
//       encrypt: {
//         keyId: [DATA_KEY_ID],
//         algorithm:
//           "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
//       },
//     },

//     // =================================================
//     // STRUCTURED ASSESSMENT FACTORS
//     // =================================================
//     //
//     // These store the clinically relevant answers in a
//     // structured form so Patient Research can display
//     // them without depending on ScreeningSession.
//     //
//     // =================================================

//     factors: {
//       emergencySymptoms: encryptedStringArray,

//       bleedMinorCuts: encryptedString,

//       dentalSurgeryBleeding: encryptedString,

//       bruises: encryptedString,

//       muscleSwelling: encryptedString,

//       jointSwelling: encryptedString,

//       jointsList: encryptedStringArray,

//       jointWarmthTightness: encryptedString,

//       bloodUrineStool: encryptedString,

//       familyHistory: encryptedString,

//       maleRelativeFlag: {
//         type: Boolean,
//         default: false,
//       },

//       heavyMenstrual: encryptedString,

//       previousTesting: encryptedString,

//       factorLow: encryptedString,
//     },

//     // =================================================
//     // RISK LEVEL
//     // =================================================

//     riskLevel: {
//       type: String,

//       enum: [
//         "LOW",
//         "MODERATE",
//         "HIGH",
//         "EMERGENCY",
//       ],

//       default: "LOW",

//       encrypt: {
//         keyId: [DATA_KEY_ID],
//         algorithm:
//           "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
//       },
//     },

//     // =================================================
//     // SUMMARY
//     // =================================================

//     summaryText: {
//       type: String,
//       default: "",
//     },

//     // =================================================
//     // RECOMMENDATION
//     // =================================================

//     recommendation: {
//       type: String,
//       default: "",
//     },

//     // =================================================
//     // SUGGESTED TESTS
//     // =================================================

//     suggestedTests: {
//       type: [String],
//       default: [],
//     },

//     // =================================================
//     // ORIGINAL CHATBOT QUESTIONS + ANSWERS
//     // =================================================
//     //
//     // IMPORTANT:
//     // This preserves exactly what the patient answered.
//     //
//     // Patient Research uses this for:
//     //
//     // Score 4 -> what answers produced Score 4
//     // Score 7 -> what answers produced Score 7
//     // Score 9 -> what answers produced Score 9
//     //
//     // =================================================

//     answers: [
//       {
//         question: {
//           type: String,
//           required: true,
//         },

//         answer: {
//           type: String,
//           required: true,
//         },
//       },
//     ],

//     // =================================================
//     // EXPLANATION
//     // =================================================
//     //
//     // Example:
//     //
//     // [
//     //   "Muscle bleeding symptoms",
//     //   "Joint bleeding pattern",
//     //   "Internal bleeding",
//     //   "Family history positive"
//     // ]
//     //
//     // =================================================

//     explanation: {
//       type: [String],
//       default: [],
//     },
//   },

//   // ===================================================
//   // SCHEMA OPTIONS
//   // ===================================================

//   {
//     timestamps: true,

//     // IMPORTANT FOR CSFLE
//     encryptionType: "csfle",
//   }
// );

// // =====================================================
// // EXPORT
// // =====================================================

// module.exports =
//   mongoose.models.Assessment ||
//   mongoose.model(
//     "Assessment",
//     assessmentSchema
//   )



const mongoose = require("mongoose");
const { Binary } = require("mongodb");

// =====================================================
// CSFLE DATA KEY
// =====================================================

const DATA_KEY_ID = Binary.createFromBase64(
  "cK8aqOqVSBCJKGnAHZMimw==",
  Binary.SUBTYPE_UUID
);

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
// ASSESSMENT SCHEMA
// =====================================================

const assessmentSchema = new mongoose.Schema(
  {
    // =================================================
    // BASIC / NON-ENCRYPTED
    // =================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalScore: {
      type: Number,
      default: 0,
    },

    emergencyFlag: {
      type: Boolean,
      default: false,
    },

    strongSuspicionFlag: {
      type: Boolean,
      default: false,
    },

    // =================================================
    // PATIENT ID
    // =================================================

    // Cleartext everywhere (Phase 4): the CSFLE-less FastAPI engine joins on it.
    patientId: {
      type: String,
      required: true,
    },

    // factors + the 14 q* keys are NOT stored (Phase 6): derived from answers[]
    // by src/utils/assessmentDerive.js.

    // =================================================
    // RISK LEVEL
    // =================================================
    //
    // This is the old application-level risk field.
    //
    // ML result is stored separately below.
    //
    // =================================================

    riskLevel: {
      type: String,

      enum: [
        "LOW",
        "MODERATE",
        "HIGH",
        "EMERGENCY",
      ],

      default: "LOW",

      encrypt: {
        keyId: [DATA_KEY_ID],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
      },
    },

    // =================================================
    // ML SCREENING PREDICTION
    // =================================================
    //
    // 0 = Healthy
    // 1 = Mild
    // 2 = Moderate
    // 3 = Severe
    //
    // IMPORTANT:
    // This is a screening-model output, NOT a diagnosis.
    //
    // =================================================

    mlPrediction: {
      type: Number,

      enum: [
        0,
        1,
        2,
        3,
      ],

      default: null,
    },

    // =================================================
    // ML PREDICTION LABEL
    // =================================================

    mlPredictionLabel: encryptedString,

    // =================================================
    // ML PREDICTION MODEL PROBABILITY
    // =================================================
    //
    // Example:
    // 0.5663 = model assigned 56.63% probability
    //
    // This is NOT a clinical probability.
    //
    // =================================================

    mlPredictionProbability: {
      type: Number,
      default: null,
    },

    // =================================================
    // ML CLASS PROBABILITIES
    // =================================================
    //
    // Stored as encrypted JSON string because the
    // probabilities object contains dynamic keys:
    //
    // {
    //   "0": 0.000089,
    //   "1": 0.096887,
    //   "2": 0.5663,
    //   "3": 0.336724
    // }
    //
    // =================================================

    mlProbabilitiesJson: encryptedString,

    // =================================================
    // ML FEATURES
    // =================================================
    //
    // Exact 16 features sent to the Random Forest.
    //
    // Stored as encrypted JSON.
    //
    // =================================================

    mlFeaturesJson: encryptedString,

    // =================================================
    // SUMMARY
    // =================================================

    summaryText: {
      type: String,
      default: "",
    },

    // =================================================
    // ORIGINAL CHATBOT QUESTIONS + ANSWERS
    // =================================================
    //
    // This preserves exactly what the patient answered.
    //
    // =================================================

    answers: [
      {
        question: {
          type: String,
          required: true,
        },

        answer: {
          type: String,
          required: true,
        },
      },
    ],

    // =================================================
    // EXPLANATION
    // =================================================

    explanation: {
      type: [String],
      default: [],
    },
  },

  // ===================================================
  // SCHEMA OPTIONS
  // ===================================================

  {
    timestamps: true,

    // IMPORTANT FOR CSFLE
    encryptionType: "csfle",
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.Assessment ||
  mongoose.model(
    "Assessment",
    assessmentSchema
  );
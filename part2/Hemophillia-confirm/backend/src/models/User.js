
// const mongoose = require("mongoose");
// const dataKeyId = require("../../config/dataKey");

// // =====================================================
// // USER SCHEMA
// // =====================================================

// const userSchema = new mongoose.Schema(
//   {
//     // =================================================
//     // BASIC INFORMATION
//     // =================================================

//     fullName: {
//       type: String,
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,

//       encrypt: {
//         keyId: [dataKeyId],
//         algorithm:
//           "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
//       },
//     },

//     // =================================================
//     // DOCTOR / CLINICIAN PROFESSIONAL ID
//     // =================================================

//     professionalId: {
//       type: String,
//       unique: true,
//       sparse: true,
//       index: true,
//     },

//     registrationRequestId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "DoctorRegistrationRequest",
//       default: null,
//     },

//     // =================================================
//     // PASSWORD
//     // =================================================

//     passwordHash: {
//       type: String,
//       required: true,
//     },

//     // =================================================
//     // ROLE
//     // =================================================

//     role: {
//       type: String,

//       enum: [
//         "patient",
//         "doctor",
//         "clinician",
//         "admin",
//       ],

//       default: "patient",
//     },
//     nameTranslations: {
//   en: {
//     type: String,
//     default: "",
//   },

//   hi: {
//     type: String,
//     default: "",
//   },

//   mr: {
//     type: String,
//     default: "",
//   },
// },

//     // =================================================
//     // ACCOUNT STATUS
//     // =================================================
//     //
//     // Patient:
//     // APPROVED by default
//     //
//     // Doctor / Clinician:
//     // Will be created only after admin approval
//     //
//     // Admin:
//     // APPROVED when manually created
//     //
//     // =================================================

//     accountStatus: {
//       type: String,

//       enum: [
//         "PENDING",
//         "APPROVED",
//         "REJECTED",
//         "SUSPENDED",
//       ],

//       default: "APPROVED",
//     },

//     // =================================================
//     // FIRST LOGIN PASSWORD CHANGE
//     // =================================================

//     mustChangePassword: {
//       type: Boolean,
//       default: false,
//     },
//   },

//   // ===================================================
//   // VERY IMPORTANT FOR CSFLE
//   // ===================================================

//   {
//     timestamps: true,
//     encryptionType: "csfle",
//   }

  
// );

// // =====================================================
// // EXPORT
// // =====================================================

// module.exports =
//   mongoose.models.User ||
//   mongoose.model("User", userSchema);

// const mongoose = require("mongoose");
// const dataKeyId = require("../../config/dataKey");

// const userSchema = new mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,

//       encrypt: {
//         keyId: [dataKeyId],
//         algorithm:
//           "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
//       },
//     },

//     // ==========================================
//     // DOCTOR / CLINICIAN PROFESSIONAL ID
//     // ==========================================

//     professionalId: {
//       type: String,
//       unique: true,
//       sparse: true,
//       index: true,
//     },

//     passwordHash: {
//       type: String,
//       required: true,
//     },

//     // ==========================================
//     // ROLE
//     // ==========================================

//     role: {
//       type: String,
//       enum: ["patient", "doctor", "clinician"],
//       default: "patient",
//     },

//     // ==========================================
//     // FIRST LOGIN PASSWORD CHANGE
//     // ==========================================

//     mustChangePassword: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//     encryptionType: "csfle",
//   }
// );

// module.exports =
//   mongoose.models.User ||
//   mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");
const { displayName } = require("../utils/displayName");
const { transliterateDoctorName } = require("../services/doctorNameTranslationService");

const RANDOM = { keyId: [dataKeyId], algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random" };

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // =================================================
    // BASIC INFORMATION
    // =================================================

    // CSFLE Random. lastName is required, but the 4 mononym users hold "" -- every
    // re-save of them MUST pass { validateBeforeSave: false }. fullName is NOT stored;
    // use utils/displayName.js.
    firstName: { type: String, required: true, trim: true, encrypt: RANDOM },
    middleName: { type: String, trim: true, encrypt: RANDOM },
    lastName: { type: String, required: true, trim: true, encrypt: RANDOM },

    email: {
      type: String,
      required: true,
      unique: true,

      encrypt: {
        keyId: [dataKeyId],
        algorithm:
          "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
      },
    },

    // =================================================
    // DOCTOR / CLINICIAN PROFESSIONAL ID
    // =================================================

    professionalId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      encrypt: {
        keyId: [dataKeyId],
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
      },
    },

    // =================================================
    // PASSWORD
    // =================================================

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    passwordHash: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // =================================================
    // ROLE
    // =================================================

    role: {
      type: String,

      enum: [
        "patient",
        "doctor",
        "clinician",
        "admin",
      ],

      default: "patient",
    },
    // Derived from the composed name by the pre-save hook below; callers never set it.
    nameTranslations: {
      en: { type: String, default: "", encrypt: RANDOM },
      hi: { type: String, default: "", encrypt: RANDOM },
      mr: { type: String, default: "", encrypt: RANDOM },
    },

    // =================================================
    // ACCOUNT STATUS
    // =================================================
    //
    // Patient:
    // APPROVED by default
    //
    // Doctor / Clinician:
    // Will be created only after admin approval
    //
    // Admin:
    // APPROVED when manually created
    //
    // =================================================

    accountStatus: {
      type: String,

      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
      ],

      default: "APPROVED",
    },

    // =================================================
    // FIRST LOGIN PASSWORD CHANGE
    // =================================================

    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },

  // ===================================================
  // VERY IMPORTANT FOR CSFLE
  // ===================================================

  {
    timestamps: true,
    encryptionType: "csfle",
  }

  
);

// nameTranslations = transliteration of the composed name. Runs on every save() (incl. create),
// so no write path can forget it. updateOne/$set bypass hooks -- name edits must use save().
userSchema.pre("save", async function () {
  if (!this.isNew && !["firstName", "middleName", "lastName"].some((k) => this.isModified(k))) return;
  const full = displayName(this);
  for (const l of ["en", "hi", "mr"]) this.set(`nameTranslations.${l}`, await transliterateDoctorName(full, l));
  // Force the whole subdocument to be written even when a value is unchanged.
  // Mongoose sends only modified paths, and CSFLE encrypts only what it writes -- so an
  // unchanged `en`/`hi` would be left behind as CLEARTEXT while a changed `mr` got
  // encrypted, which is exactly what happened on the first Phase 4 run.
  this.markModified("nameTranslations");
});

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
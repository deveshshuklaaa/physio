
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

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // =================================================
    // BASIC INFORMATION
    // =================================================

    fullName: {
      type: String,
      required: true,
    },

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
    },

    registrationRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorRegistrationRequest",
      default: null,
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
    nameTranslations: {
  en: {
    type: String,
    default: "",
  },

  hi: {
    type: String,
    default: "",
  },

  mr: {
    type: String,
    default: "",
  },
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

    // =================================================
    // ADMIN LEVEL / PERMISSIONS
    // =================================================

    adminLevel: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN"],
      default: "ADMIN",
    },

    permissions: {
      canManageAdmins: {
        type: Boolean,
        default: false,
      },
      canManageDoctors: {
        type: Boolean,
        default: true,
      },
      canViewPatients: {
        type: Boolean,
        default: true,
      },
      canManageDoctorRequests: {
        type: Boolean,
        default: true,
      },
    },

    // Admin-specific profile / organization information
    mobile: {
      type: String,
      default: "",
    },

    alternateMobile: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    hospitalName: {
      type: String,
      default: "",
    },

    department: {
      type: String,
      default: "",
    },

    hospitalAddress: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pinCode: {
      type: String,
      default: "",
    },

    employeeId: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// =====================================================
// EXPORT
// =====================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
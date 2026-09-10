const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");

const encryptedString = {
  type: String,
  encrypt: {
    keyId: [dataKeyId],
    algorithm:
      "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
  },
};

const doctorChangeRequestSchema =
  new mongoose.Schema(
    {
      // Patient who requested the change
      patientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // Patient ID such as PAT001
      patientId: {
        type: String,
        required: true,
        index: true,
      },

      // Doctor currently responsible for the patient
      currentDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // Optional reason entered by patient
      reason: encryptedString,

      // Request lifecycle
      status: {
        type: String,
        enum: [
          "PENDING",
          "RELEASED",
          "CANCELLED",
        ],
        default: "PENDING",
        index: true,
      },

      requestedAt: {
        type: Date,
        default: Date.now,
      },

      releasedAt: {
        type: Date,
        default: null,
      },

      // Doctor who actually released the patient
      releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
      encryptionType: "csfle",
    }
  );

module.exports =
  mongoose.models.DoctorChangeRequest ||
  mongoose.model(
    "DoctorChangeRequest",
    doctorChangeRequestSchema
  );
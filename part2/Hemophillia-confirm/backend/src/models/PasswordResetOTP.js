const mongoose = require("mongoose");

const passwordResetOTPSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["patient", "doctor", "clinician", "admin"],
    },

    challengeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    resetTokenHash: {
      type: String,
      default: null,
    },

    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

passwordResetOTPSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports =
  mongoose.models.PasswordResetOTP ||
  mongoose.model(
    "PasswordResetOTP",
    passwordResetOTPSchema
  );

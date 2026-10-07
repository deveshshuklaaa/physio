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
      // No `index: true` here. The TTL index below owns the `expiresAt_1` name;
      // declaring a plain index on the same key races it, and whichever lands
      // first wins -- which is how a fresh environment ends up with a PLAIN
      // index and no expiry sweep at all.
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

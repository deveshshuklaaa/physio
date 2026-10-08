// Phase 5 of docs/DB_MIGRATION_PLAN.md: loginotps + passwordresetotps merged into one collection.
//
// The two collections had identical shape and duplicated constants, which is why the
// 3m05s expiry / 30s cooldown change had to be made twice. One collection means one
// set of constants (config/otpPolicy.js) and one TTL declaration.
//
// An OTP challenge is a TRANSIENT CREDENTIAL, not an authz cache: nothing stored here
// may be trusted as a permission source. `userData` is identity only -- adminLevel and
// permissions are read fresh from adminprofiles at verify time (Phase 3).
const mongoose = require("mongoose");
const dataKeyId = require("../../config/dataKey");

const enc = (alg) => ({ keyId: [dataKeyId], algorithm: `AEAD_AES_256_CBC_HMAC_SHA_512-${alg}` });

const otpChallengeSchema = new mongoose.Schema(
  {
    // Which flow issued this challenge. EVERY lookup must filter on it: without that
    // filter a login challenge could be redeemed at the password-reset verify route,
    // and vice versa, because challengeId alone is now unique across both flows.
    purpose: {
      type: String,
      required: true,
      enum: ["login", "password_reset"],
      index: true,
    },

    // ObjectId, not the String the two legacy collections stored, so it joins to users.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Deterministic: both legacy collections held this in CLEARTEXT. Deterministic
    // rather than Random because the password-reset flow looks challenges up by email.
    email: {
      type: String,
      required: true,
      encrypt: enc("Deterministic"),
    },

    role: {
      type: String,
      required: true,
      enum: ["patient", "doctor", "clinician", "admin"],
    },

    // Random challenge identifier sent to the frontend.
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

    verified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // --- login only ---
    authPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    userData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // --- password_reset only ---
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      // No `index: true` here. The TTL index below owns the `expiresAt_1` name;
      // declaring a plain index on the same key races it, and whichever lands
      // first wins -- which is how a fresh environment ends up with a PLAIN
      // index and no expiry sweep at all.
    },
  },
  { timestamps: true, encryptionType: "csfle" }
);

// MongoDB removes expired challenges. Carried over from Phase 2; a merge that drops it
// turns every expired challenge into a permanent one.
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.OtpChallenge || mongoose.model("OtpChallenge", otpChallengeSchema);

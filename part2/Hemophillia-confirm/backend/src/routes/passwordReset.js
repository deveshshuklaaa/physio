const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const { check } = require("../utils/allow");
const User = require("../models/User");
// Phase 5: loginotps and passwordresetotps are merged into otpchallenges. EVERY filter
// here carries `...RESET`, because challengeId is unique across both flows now: an
// unscoped lookup would let a login challenge be redeemed on this route, and the
// unscoped deleteMany would wipe a user's pending login challenge.
const OtpChallenge = require("../models/OtpChallenge");
const RESET = { purpose: "password_reset" };
const {
  sendPasswordResetOTP,
} = require("../services/passwordResetEmailService");

const router = express.Router();

const {
  OTP_EXPIRY_SECONDS,
  OTP_EXPIRY_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} = require("../../config/otpPolicy");
const MAX_ATTEMPTS = 5;

const RESET_TOKEN_MINUTES = 10;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Body specs. Wrong type or over-long = 400 before any coercion or query. email 254 (RFC 5321);
// role/professionalId/password maxes are chosen; challengeId/resetToken are 32 random bytes hex.
const HEX64 = { type: "string", max: 64, re: /^[a-f0-9]{64}$/ };
const SPEC = {
  request: {
    role: { type: "string", max: 30 },
    email: { type: "string", max: 254 },
    professionalId: { type: "string", max: 64 },
  },
  verify: { challengeId: HEX64, otp: { type: "string", max: 12 } },
  reset: { challengeId: HEX64, resetToken: HEX64, newPassword: { type: "string", max: 128 } },
};

const allowedRoles = [
  "patient",
  "doctor",
  "clinician",
  "admin",
];

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "physiotherapist") {
    return "doctor";
  }

  if (value === "staff") {
    return "doctor";
  }

  return value;
}

function generateOTP() {
  return String(
    crypto.randomInt(100000, 1000000)
  );
}

function generateChallengeId() {
  return crypto.randomBytes(32).toString("hex");
}

function maskEmail(email) {
  if (!email || !email.includes("@")) {
    return "";
  }

  const [name, domain] = email.split("@");

  if (name.length <= 2) {
    return `${name[0] || "*"}***@${domain}`;
  }

  return (
    name.substring(0, 2) +
    "***@" +
    domain
  );
}

function genericSuccessMessage() {
  return (
    "If the account details are correct, a password reset verification code has been sent to the registered email address."
  );
}

// ============================================================
// REQUEST PASSWORD RESET OTP
//
// POST /api/password-reset/request
//
// Patient/Admin:
//   { role: "patient"|"admin", email }
//
// Doctor/Clinician:
//   { role: "doctor"|"clinician", professionalId }
//
// IMPORTANT:
// This is completely separate from normal LOGIN OTPs.
// ============================================================
router.post("/request", async (req, res) => {
  try {
    check(req.body || {}, SPEC.request);
    const role = normalizeRole(req.body?.role);
    const email = String(
      req.body?.email || ""
    ).trim().toLowerCase();
    const professionalId = String(
      req.body?.professionalId || ""
    ).trim();

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account type.",
      });
    }

    if (
      role === "doctor" ||
      role === "clinician"
    ) {
      if (!professionalId) {
        return res.status(400).json({
          success: false,
          message:
            "Doctor / Clinician ID is required.",
        });
      }
    } else if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    let user = null;

    if (
      role === "doctor" ||
      role === "clinician"
    ) {
      user = await User.findOne({
        professionalId,
        role: {
          $in: ["doctor", "clinician"],
        },
      });
    } else {
      user = await User.findOne({
        email,
        role,
      });
    }

    // Do not expose whether an account exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage(),
      });
    }

    if (
      user.accountStatus &&
      user.accountStatus !== "APPROVED"
    ) {
      return res.status(200).json({
        success: true,
        message: genericSuccessMessage(),
      });
    }

    const userId = String(user._id);
    const destinationEmail = user.email;

    const recent = await OtpChallenge.findOne({
      ...RESET,
      userId,
      verified: false,
      createdAt: {
        $gte: new Date(
          Date.now() -
            RESEND_COOLDOWN_SECONDS * 1000
        ),
      },
    }).sort({ createdAt: -1 });

    if (recent) {
      const secondsPassed = Math.floor(
        (Date.now() -
          new Date(recent.createdAt).getTime()) /
          1000
      );

      const remainingSeconds = Math.max(
        RESEND_COOLDOWN_SECONDS -
          secondsPassed,
        1
      );

      return res.status(429).json({
        success: false,
        message:
          `Please wait ${remainingSeconds} seconds before requesting another reset code.`,
        remainingSeconds,
      });
    }

    await OtpChallenge.deleteMany({
      ...RESET,
      userId,
      verified: false,
    });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(
      otp,
      10
    );

    const challengeId =
      generateChallengeId();

    const expiresAt = new Date(
      Date.now() +
        OTP_EXPIRY_SECONDS * 1000
    );

    await OtpChallenge.create({
      ...RESET,
      userId,
      email: destinationEmail,
      role: user.role,
      challengeId,
      otpHash,
      expiresAt,
      attempts: 0,
      verified: false,
    });

    try {
      await sendPasswordResetOTP({
        email: destinationEmail,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
      });
    } catch (emailError) {
      await OtpChallenge.deleteOne({
        ...RESET,
        challengeId,
      });

      console.error(
        "Password reset email error:",
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send the password reset verification email. Please try again.",
      });
    }

    console.log(
      "================================="
    );
    console.log(
      "🔐 PASSWORD RESET OTP SENT"
    );
    console.log("Role:", user.role);
    console.log("User ID:", userId);
    console.log(
      "Email:",
      destinationEmail
    );
    console.log(
      "================================="
    );

    return res.status(200).json({
      success: true,
      message:
        "A password reset verification code has been sent to your registered email address.",
      challengeId,
      maskedEmail:
        maskEmail(destinationEmail),
      expiresInSeconds:
        OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error(
      "Password reset request error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to start password reset. Please try again.",
    });
  }
});

// ============================================================
// VERIFY PASSWORD RESET OTP
//
// POST /api/password-reset/verify
//
// Returns a short-lived resetToken.
// NO LOGIN JWT is created here.
// ============================================================
router.post("/verify", async (req, res) => {
  try {
    check(req.body || {}, SPEC.verify);
    const challengeId = String(
      req.body?.challengeId || ""
    ).trim();

    const otp = String(
      req.body?.otp || ""
    )
      .replace(/\s/g, "")
      .trim();

    if (!challengeId) {
      return res.status(400).json({
        success: false,
        message: "Reset challenge is required.",
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "OTP must contain exactly 6 digits.",
      });
    }

    const record =
      await OtpChallenge.findOne({
        ...RESET,
        challengeId,
        verified: false,
      });

    if (!record) {
      return res.status(400).json({
        success: false,
        message:
          "The verification code is invalid or has expired. Please request a new code.",
      });
    }

    if (
      !record.expiresAt ||
      record.expiresAt.getTime() <
        Date.now()
    ) {
      await OtpChallenge.deleteOne({
        _id: record._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "The verification code has expired. Please request a new code.",
      });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await OtpChallenge.deleteOne({
        _id: record._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect OTP attempts. Please request a new code.",
      });
    }

    const isMatch =
      await bcrypt.compare(
        otp,
        record.otpHash
      );

    if (!isMatch) {
      // SECURITY: `attempts += 1` then `save()` is a read-modify-write, so N parallel wrong
      // guesses all read the same count and overwrite each other -- MAX_ATTEMPTS never trips
      // and the 6-digit code becomes brute-forceable. $inc is atomic in the server.
      const bumped = await OtpChallenge.findOneAndUpdate(
        { _id: record._id },
        { $inc: { attempts: 1 } },
        { new: true }
      );

      const attempts = bumped?.attempts ?? MAX_ATTEMPTS;

      const remainingAttempts =
        Math.max(
          MAX_ATTEMPTS -
            attempts,
          0
        );

      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Incorrect OTP. ${remainingAttempts} attempt${
                remainingAttempts === 1
                  ? ""
                  : "s"
              } remaining.`
            : "Too many incorrect OTP attempts. Please request a new code.",
      });
    }

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const resetTokenHash =
      await bcrypt.hash(
        resetToken,
        10
      );

    record.verified = true;
    record.verifiedAt = new Date();
    record.resetTokenHash =
      resetTokenHash;
    record.resetTokenExpiresAt =
      new Date(
        Date.now() +
          RESET_TOKEN_MINUTES *
            60 *
            1000
      );

    await record.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. You can now create a new password.",
      challengeId,
      resetToken,
      expiresInSeconds:
        RESET_TOKEN_MINUTES * 60,
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error(
      "Password reset OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify the password reset code.",
    });
  }
});

// ============================================================
// SET NEW PASSWORD
//
// POST /api/password-reset/reset
// ============================================================
router.post("/reset", async (req, res) => {
  try {
    check(req.body || {}, SPEC.reset);
    const challengeId = String(
      req.body?.challengeId || ""
    ).trim();

    const resetToken = String(
      req.body?.resetToken || ""
    ).trim();

    const newPassword = String(
      req.body?.newPassword || ""
    );

    if (
      !challengeId ||
      !resetToken ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset session and new password are required.",
      });
    }

    if (
      !passwordRegex.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    const record =
      await OtpChallenge.findOne({
        ...RESET,
        challengeId,
        verified: true,
      });

    if (!record) {
      return res.status(400).json({
        success: false,
        message:
          "Your password reset session is invalid. Please start again.",
      });
    }

    if (
      !record.resetTokenExpiresAt ||
      record.resetTokenExpiresAt.getTime() <
        Date.now()
    ) {
      await OtpChallenge.deleteOne({
        _id: record._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Your password reset session has expired. Please start again.",
      });
    }

    const tokenMatch =
      await bcrypt.compare(
        resetToken,
        record.resetTokenHash || ""
      );

    if (!tokenMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid password reset session. Please start again.",
      });
    }

    const user =
      await User.findById(
        record.userId
      );

    if (!user) {
      await OtpChallenge.deleteOne({
        _id: record._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Account could not be found.",
      });
    }

    if (
      user.accountStatus &&
      user.accountStatus !== "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This account is not active.",
      });
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your previous password.",
      });
    }

    // SECURITY: consume the challenge BEFORE writing the password. The old order (write, then
    // delete) left the reset token valid until the TTL swept it, so the same token could be
    // replayed to set the password again -- and two parallel requests could both pass. This
    // is atomic, so exactly one request owns the challenge. If the write below then fails the
    // user simply requests a new code, which is the safe direction to fail in.
    const consumed =
      await OtpChallenge.findOneAndDelete({
        _id: record._id,
      });

    if (!consumed) {
      return res.status(400).json({
        success: false,
        message:
          "Your password reset session is invalid. Please start again.",
      });
    }

    const newPasswordHash =
  await bcrypt.hash(
    newPassword,
    12
  );

const updateResult =
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    }
  );

if (
  updateResult.matchedCount !== 1 &&
  updateResult.nModified !== 1
) {
  throw new Error(
    "Unable to update the password for this account."
  );
}

console.log(
  "🔐 PASSWORD HASH UPDATED WITHOUT FULL USER VALIDATION"
);

    // (the challenge was already consumed atomically above)

    console.log(
      "================================="
    );
    console.log(
      "✅ PASSWORD RESET SUCCESSFUL"
    );
    console.log(
      "User ID:",
      String(user._id)
    );
    console.log(
      "Role:",
      user.role
    );
    console.log(
      "================================="
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    console.error(
      "Password reset error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to reset your password. Please try again.",
    });
  }
});

module.exports = router;

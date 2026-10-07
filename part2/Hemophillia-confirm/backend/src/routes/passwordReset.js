const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const PasswordResetOTP = require("../models/PasswordResetOTP");
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

    const recent = await PasswordResetOTP.findOne({
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

    await PasswordResetOTP.deleteMany({
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

    await PasswordResetOTP.create({
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
      await PasswordResetOTP.deleteOne({
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
      await PasswordResetOTP.findOne({
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
      await PasswordResetOTP.deleteOne({
        _id: record._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "The verification code has expired. Please request a new code.",
      });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await PasswordResetOTP.deleteOne({
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
      record.attempts += 1;
      await record.save();

      const remainingAttempts =
        Math.max(
          MAX_ATTEMPTS -
            record.attempts,
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
      await PasswordResetOTP.findOne({
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
      await PasswordResetOTP.deleteOne({
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
      await PasswordResetOTP.deleteOne({
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

    await PasswordResetOTP.deleteOne({
      _id: record._id,
    });

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

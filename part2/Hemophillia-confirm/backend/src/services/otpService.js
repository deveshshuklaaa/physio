const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const LoginOTP = require("../models/LoginOTP");
const { sendLoginOTP } = require("./emailService");

// =====================================================
// OTP SETTINGS
// =====================================================

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// =====================================================
// GENERATE SECURE 6-DIGIT OTP
// =====================================================

function generateOTP() {
  const min = 100000;
  const max = 1000000;

  return String(
    crypto.randomInt(min, max)
  );
}

// =====================================================
// GENERATE CHALLENGE ID
// =====================================================

function generateChallengeId() {
  return crypto.randomBytes(32).toString("hex");
}

// =====================================================
// MASK EMAIL
// =====================================================

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

// =====================================================
// CREATE + SEND LOGIN OTP
// =====================================================

async function createLoginOTP({
  userId,
  email,
  role,
  authPayload,
  userData,
}) {
  if (!userId) {
    throw new Error("OTP userId is required");
  }

  if (!email) {
    throw new Error("OTP email is required");
  }

  if (!role) {
    throw new Error("OTP role is required");
  }

  // ===================================================
  // RESEND COOLDOWN
  // ===================================================

  const recentOTP = await LoginOTP.findOne({
    userId: String(userId),
    verified: false,
    createdAt: {
      $gte: new Date(
        Date.now() -
          RESEND_COOLDOWN_SECONDS * 1000
      ),
    },
  }).sort({
    createdAt: -1,
  });

  if (recentOTP) {
    const secondsPassed = Math.floor(
      (Date.now() -
        new Date(recentOTP.createdAt).getTime()) /
        1000
    );

    const remainingSeconds =
      RESEND_COOLDOWN_SECONDS -
      secondsPassed;

    const error = new Error(
      `Please wait ${Math.max(
        remainingSeconds,
        1
      )} seconds before requesting another OTP.`
    );

    error.code = "OTP_COOLDOWN";
    error.remainingSeconds = Math.max(
      remainingSeconds,
      1
    );

    throw error;
  }

  // ===================================================
  // DELETE PREVIOUS OTPs
  // ===================================================

  await LoginOTP.deleteMany({
    userId: String(userId),
    verified: false,
  });

  // ===================================================
  // GENERATE OTP
  // ===================================================

  const otp = generateOTP();

  // ===================================================
  // HASH OTP
  // ===================================================

  const otpHash = await bcrypt.hash(
    otp,
    10
  );

  // ===================================================
  // EXPIRY
  // ===================================================

  const expiresAt = new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // ===================================================
  // CHALLENGE ID
  // ===================================================

  const challengeId =
    generateChallengeId();

  // ===================================================
  // SAVE OTP
  // ===================================================

  await LoginOTP.create({
    userId: String(userId),
    email,
    role,
    challengeId,
    otpHash,
    authPayload,
    userData,
    expiresAt,
    attempts: 0,
    verified: false,
  });

  // ===================================================
  // SEND EMAIL
  // ===================================================

  // Local development has no SMTP credentials, so the send below always
  // fails and the catch would delete the OTP record, making login impossible.
  // Print the code instead so a developer can complete the flow.
  if (process.env.NODE_ENV === "development") {
    console.log("=================================");
    console.log("🔓 DEV OTP for", email, "→", otp);
    console.log("=================================");
  }

  try {
    await sendLoginOTP({
      email,
      otp,
      expiryMinutes:
        OTP_EXPIRY_MINUTES,
    });
  } catch (emailError) {
    // In development the OTP was printed above, so a failed send is expected
    // and must not invalidate the challenge.
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  OTP email send failed (dev) — use the printed code.");
    } else {
      // If email fails, remove the OTP record.
      await LoginOTP.deleteOne({
        challengeId,
      });

      throw emailError;
    }
  }

  return {
    challengeId,
    maskedEmail: maskEmail(email),
    expiresInSeconds:
      OTP_EXPIRY_MINUTES * 60,
  };
}

// =====================================================
// VERIFY OTP
// =====================================================

async function verifyLoginOTP({
  challengeId,
  otp,
}) {
  if (!challengeId) {
    const error = new Error(
      "Challenge ID is required"
    );

    error.code = "INVALID_CHALLENGE";

    throw error;
  }

  if (!otp) {
    const error = new Error(
      "OTP is required"
    );

    error.code = "INVALID_OTP";

    throw error;
  }

  const cleanOTP = String(otp)
    .replace(/\s/g, "")
    .trim();

  if (!/^\d{6}$/.test(cleanOTP)) {
    const error = new Error(
      "OTP must contain exactly 6 digits"
    );

    error.code = "INVALID_OTP";

    throw error;
  }

  // ===================================================
  // FIND CHALLENGE
  // ===================================================

  const loginOTP =
    await LoginOTP.findOne({
      challengeId,
      verified: false,
    });

  if (!loginOTP) {
    const error = new Error(
      "OTP is invalid or has expired. Please login again."
    );

    error.code = "OTP_NOT_FOUND";

    throw error;
  }

  // ===================================================
  // EXPIRY CHECK
  // ===================================================

  if (
    !loginOTP.expiresAt ||
    loginOTP.expiresAt.getTime() <
      Date.now()
  ) {
    await LoginOTP.deleteOne({
      _id: loginOTP._id,
    });

    const error = new Error(
      "OTP has expired. Please login again."
    );

    error.code = "OTP_EXPIRED";

    throw error;
  }

  // ===================================================
  // ATTEMPT LIMIT
  // ===================================================

  if (
    loginOTP.attempts >=
    MAX_ATTEMPTS
  ) {
    await LoginOTP.deleteOne({
      _id: loginOTP._id,
    });

    const error = new Error(
      "Too many incorrect OTP attempts. Please login again."
    );

    error.code = "OTP_TOO_MANY_ATTEMPTS";

    throw error;
  }

  // ===================================================
  // COMPARE OTP
  // ===================================================

  const isMatch =
    await bcrypt.compare(
      cleanOTP,
      loginOTP.otpHash
    );

  if (!isMatch) {
    loginOTP.attempts += 1;

    await loginOTP.save();

    const remainingAttempts =
      Math.max(
        MAX_ATTEMPTS -
          loginOTP.attempts,
        0
      );

    const error = new Error(
      remainingAttempts > 0
        ? `Incorrect OTP. ${remainingAttempts} attempt${
            remainingAttempts === 1
              ? ""
              : "s"
          } remaining.`
        : "Too many incorrect OTP attempts. Please login again."
    );

    error.code =
      remainingAttempts > 0
        ? "OTP_INCORRECT"
        : "OTP_TOO_MANY_ATTEMPTS";

    error.remainingAttempts =
      remainingAttempts;

    if (remainingAttempts === 0) {
      await LoginOTP.deleteOne({
        _id: loginOTP._id,
      });
    }

    throw error;
  }

  // ===================================================
  // MARK VERIFIED
  // ===================================================

  loginOTP.verified = true;

  const authPayload =
    loginOTP.authPayload;

  const userData =
    loginOTP.userData;

  await LoginOTP.deleteOne({
    _id: loginOTP._id,
  });

  return {
    userId: loginOTP.userId,
    role: loginOTP.role,
    authPayload,
    userData,
  };
}

module.exports = {
  createLoginOTP,
  verifyLoginOTP,
  maskEmail,
};
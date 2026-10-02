const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createLoginOTP,
} = require("../services/otpService");
const User = require("../models/User");

const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const router = express.Router();

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "hemo_fallback_secret_change_in_production";

// =====================================================
// POST /api/doctor/login
// =====================================================

// =====================================================
// POST /api/doctor/login
// PASSWORD → OTP → JWT
// =====================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        professionalId,
        password,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !professionalId ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Doctor / Clinician ID and password are required",
        });
      }

      const cleanProfessionalId =
        professionalId.trim();

      // =================================================
      // FIND DOCTOR
      // =================================================

      const user =
        await User.findOne({
          professionalId:
            cleanProfessionalId,

          role: {
            $in: [
              "doctor",
              "clinician",
            ],
          },
        });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid Doctor / Clinician ID or password",
        });
      }

      // =================================================
      // CHECK PASSWORD
      // =================================================

      const isMatch =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (!isMatch) {
        return res.status(401).json({
          message:
            "Invalid Doctor / Clinician ID or password",
        });
      }

      // =================================================
      // CREATE OTP
      // =================================================

      let otpResult;

      try {
        otpResult =
          await createLoginOTP({
            userId: String(
              user._id
            ),

            email: user.email,

            role: user.role,

            authPayload: {
              userId: user._id,

              professionalId:
                user.professionalId,

              role: user.role,
            },

            userData: {
              id: user._id,

              professionalId:
                user.professionalId,

              fullName:
                user.fullName,

              email:
                user.email,

              role:
                user.role,

              mustChangePassword:
                user.mustChangePassword,
            },
          });
      } catch (otpError) {
        if (
          otpError.code ===
          "OTP_COOLDOWN"
        ) {
          return res.status(429).json({
            success: false,
            message:
              otpError.message,
            remainingSeconds:
              otpError.remainingSeconds,
          });
        }

        console.error(
          "Doctor OTP send error:",
          otpError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send the login verification code. Please try again.",
        });
      }

      // =================================================
      // NO JWT YET
      // =================================================

      return res.status(200).json({
        success: true,

        requiresOtp: true,

        message:
          "A verification code has been sent to your registered email address.",

        challengeId:
          otpResult.challengeId,

        maskedEmail:
          otpResult.maskedEmail,

        expiresInSeconds:
          otpResult.expiresInSeconds,
      });
    } catch (err) {
      console.error(
        "================================="
      );

      console.error(
        "❌ Doctor / Clinician login error"
      );

      console.error(err);

      console.error(
        "================================="
      );

      return res.status(500).json({
        message:
          "Server error during doctor / clinician login",
      });
    }
  }
);
// =====================================================
// POST /api/doctor/google
// GOOGLE → OTP → JWT
//
// Login only. Doctors cannot self-register: an admin approves a
// registration request, which is what mints the account and its
// professionalId. A Google identity with no approved doctor account is
// therefore rejected, never auto-created.
//
// The OTP step is deliberately kept. Password login for staff requires it,
// so skipping it here would make Google Sign-In a 2FA bypass for accounts
// that read patient clinical data.
// =====================================================

router.post(
  "/google",
  async (req, res) => {
    try {
      const { credential } = req.body || {};

      if (!credential) {
        return res.status(400).json({
          success: false,
          message: "Google credential is required.",
        });
      }

      if (!GOOGLE_CLIENT_ID || !googleClient) {
        console.error(
          "GOOGLE_CLIENT_ID is missing from backend environment."
        );

        return res.status(500).json({
          success: false,
          message: "Google authentication is not configured.",
        });
      }

      // =================================================
      // VERIFY GOOGLE TOKEN
      // =================================================

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        return res.status(401).json({
          success: false,
          message: "Invalid Google authentication.",
        });
      }

      const googleId = payload.sub;
      const googleEmail = payload.email;
      const emailVerified = payload.email_verified;

      if (!googleId || !googleEmail) {
        return res.status(401).json({
          success: false,
          message: "Google account information is incomplete.",
        });
      }

      if (!emailVerified) {
        return res.status(401).json({
          success: false,
          message:
            "Your Google email address could not be verified.",
        });
      }

      // =================================================
      // FIND DOCTOR ACCOUNT
      // =================================================

      const user = await User.findOne({
        email: String(googleEmail).trim(),

        role: {
          $in: ["doctor", "clinician"],
        },
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          message:
            "No approved Doctor / Clinician account exists for this Google address.",
        });
      }

      if (
        user.accountStatus &&
        user.accountStatus !== "APPROVED"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This Doctor / Clinician account is not active.",
        });
      }

      // Link the Google identity on first use so later sign-ins match it
      // directly. Never overwrite a different account's googleId.
      if (!user.googleId) {
        const linkedElsewhere = await User.findOne({
          googleId,
          _id: { $ne: user._id },
        });

        if (linkedElsewhere) {
          return res.status(409).json({
            success: false,
            message:
              "This Google account is already linked to another user.",
          });
        }

        user.googleId = googleId;
        await user.save();
      } else if (user.googleId !== googleId) {
        return res.status(403).json({
          success: false,
          message:
            "This Google account does not match the one linked to this Doctor / Clinician account.",
        });
      }

      // =================================================
      // CREATE OTP
      // =================================================

      let otpResult;

      try {
        otpResult = await createLoginOTP({
          userId: String(user._id),

          email: user.email,

          role: user.role,

          authPayload: {
            userId: user._id,

            professionalId: user.professionalId,

            role: user.role,
          },

          userData: {
            id: user._id,

            professionalId: user.professionalId,

            fullName: user.fullName,

            email: user.email,

            role: user.role,

            mustChangePassword:
              user.mustChangePassword,
          },
        });
      } catch (otpError) {
        if (otpError.code === "OTP_COOLDOWN") {
          return res.status(429).json({
            success: false,
            message: otpError.message,
            remainingSeconds:
              otpError.remainingSeconds,
          });
        }

        console.error(
          "Doctor Google OTP send error:",
          otpError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send the login verification code. Please try again.",
        });
      }

      return res.status(200).json({
        success: true,

        requiresOtp: true,

        message:
          "A verification code has been sent to your registered email address.",

        challengeId: otpResult.challengeId,

        maskedEmail: otpResult.maskedEmail,

        expiresInSeconds:
          otpResult.expiresInSeconds,

        role: user.role,
      });
    } catch (err) {
      console.error(
        "Doctor Google authentication error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error during Google authentication",
      });
    }
  }
);

// =====================================================
// POST /api/doctor/change-password
// =====================================================

router.post("/change-password", async (req, res) => {
  try {
    const {
      professionalId,
      currentPassword,
      newPassword,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !professionalId ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "Professional ID, current password and new password are required",
      });
    }

    // =================================================
    // PASSWORD RULES
    // =================================================

    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "New password must contain at least 8 characters",
      });
    }

    // Don't allow the temporary password again
    if (newPassword === "123456") {
      return res.status(400).json({
        message:
          "You cannot use the temporary password as your new password",
      });
    }

    // =================================================
    // FIND DOCTOR / CLINICIAN
    // =================================================

    const user = await User.findOne({
      professionalId: professionalId.trim(),
      role: {
        $in: ["doctor", "clinician"],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Doctor / Clinician account not found",
      });
    }

    // =================================================
    // VERIFY CURRENT PASSWORD
    // =================================================

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // =================================================
    // HASH NEW PASSWORD
    // =================================================

    const salt = await bcrypt.genSalt(10);

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      salt
    );

    // =================================================
    // UPDATE ACCOUNT
    // =================================================

    user.passwordHash = newPasswordHash;

    user.mustChangePassword = false;

    await user.save();

    // =================================================
    // GENERATE NEW JWT
    // =================================================

    const token = jwt.sign(
      {
        userId: user._id,
        professionalId: user.professionalId,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      message: "Password changed successfully",

      token,

      user: {
        id: user._id,
        professionalId: user.professionalId,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: false,
      },
    });

  } catch (err) {

    console.error("=================================");
    console.error("❌ Doctor password change error");
    console.error(err);
    console.error("=================================");

    return res.status(500).json({
      message: "Server error while changing password",
    });
  }
});

module.exports = router;
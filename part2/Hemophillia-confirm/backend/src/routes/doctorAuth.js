const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  createLoginOTP,
} = require("../services/otpService");
const User = require("../models/User");

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
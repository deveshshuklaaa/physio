const express = require("express");
const jwt = require("jsonwebtoken");

const {
  resendLoginOTP,
  verifyLoginOTP,
} = require("../services/otpService");
const AdminProfile = require("../models/AdminProfile");
const { resolveAdminAuthz } = require("../utils/adminAuthz");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "hemo_fallback_secret_change_in_production";

// =====================================================
// POST /api/auth/verify-otp
// =====================================================

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const {
        challengeId,
        otp,
      } = req.body || {};

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message:
            "Challenge ID is required",
        });
      }

      if (!otp) {
        return res.status(400).json({
          success: false,
          message:
            "OTP is required",
        });
      }

      // =================================================
      // VERIFY OTP
      // =================================================

      const result =
        await verifyLoginOTP({
          challengeId,
          otp,
        });

      // =================================================
      // CREATE FINAL JWT
      // =================================================

      const token =
        jwt.sign(
          result.authPayload,
          JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,
        message:
          "OTP verified successfully",
        token,
        user:
          result.role === "admin"
            ? {
                ...result.userData,
                // authz read fresh from adminprofiles at verify time, never from the OTP record
                ...resolveAdminAuthz(
                  await AdminProfile.findOne({
                    userId: result.authPayload.userId,
                  })
                ),
              }
            : result.userData,
        role:
          result.role,
      });
    } catch (err) {
      console.error(
        "OTP verification error:",
        err.message
      );

      let status = 400;

      if (
        err.code ===
        "OTP_TOO_MANY_ATTEMPTS"
      ) {
        status = 429;
      }

      return res.status(status).json({
        success: false,
        message:
          err.message ||
          "Unable to verify OTP",
      });
    }
  }
);

// =====================================================
// POST /api/auth/resend-otp
// =====================================================

router.post(
  "/resend-otp",
  async (req, res) => {
    try {
      const {
        challengeId,
      } = req.body || {};

      if (!challengeId) {
        return res.status(400).json({
          success: false,
          message:
            "Challenge ID is required",
        });
      }

      const result =
        await resendLoginOTP({
          challengeId,
        });

      return res.status(200).json({
        success: true,
        message:
          "A new verification code has been sent to your registered email address.",
        challengeId:
          result.challengeId,
        maskedEmail:
          result.maskedEmail,
        expiresInSeconds:
          result.expiresInSeconds,
      });
    } catch (err) {
      console.error(
        "OTP resend error:",
        err.message
      );

      if (err.code === "OTP_COOLDOWN") {
        return res.status(429).json({
          success: false,
          message: err.message,
          remainingSeconds:
            err.remainingSeconds,
        });
      }

      const status =
        err.code === "OTP_NOT_FOUND"
          ? 410
          : 400;

      return res.status(status).json({
        success: false,
        message:
          err.message ||
          "Unable to resend the verification code",
      });
    }
  }
);

module.exports = router;
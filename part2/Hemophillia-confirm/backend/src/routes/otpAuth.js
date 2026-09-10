const express = require("express");
const jwt = require("jsonwebtoken");

const {
  verifyLoginOTP,
} = require("../services/otpService");

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
          result.userData,
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

module.exports = router;
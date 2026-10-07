

const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const {
  createLoginOTP,
} = require("../services/otpService");

const router = express.Router();

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // =================================================
    // FIND ADMIN
    // =================================================

    const admin =
      await User.findOne({
        email: email
          .trim()
          .toLowerCase(),

        role: "admin",
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin credentials",
      });
    }

    // =================================================
    // CHECK ACCOUNT STATUS
    // =================================================

    if (
      admin.accountStatus !==
      "APPROVED"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin account is not active",
      });
    }

    // =================================================
    // CHECK PASSWORD
    // =================================================

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.passwordHash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin credentials",
      });
    }

    console.log("🔥 ADMIN FROM DATABASE:");
console.log("ID:", admin._id.toString());
console.log("NAME:", admin.fullName);

    // =================================================
    // PASSWORD IS CORRECT
    // NOW CREATE OTP
    // =================================================

    let otpResult;

    try {
      otpResult =
        await createLoginOTP({
          // Admin's MongoDB ID
          userId:
            admin._id.toString(),

          // Admin's registered email
          email:
            admin.email,

          // Admin role
          role: "admin",

          // This data will be used later
          // to create the REAL JWT after OTP
          authPayload: {
            userId:
              admin._id.toString(),

            role: "admin",
          },

          // This data will be returned
          // to frontend after OTP verification
          userData: {
            id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            role: "admin",
            mustChangePassword: !!admin.mustChangePassword,
          },
        });
    } catch (otpError) {

      // =================================================
      // OTP RESEND COOLDOWN
      // =================================================

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

      // =================================================
      // EMAIL / OTP ERROR
      // =================================================

      console.error(
        "Admin OTP send error:",
        otpError
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to send the login verification code. Please try again.",
      });
    }

    // =================================================
    // IMPORTANT:
    // DO NOT CREATE JWT HERE
    // =================================================

    console.log(
      "================================="
    );

    console.log(
      "✅ ADMIN PASSWORD VERIFIED"
    );

    console.log(
      "Admin:",
      admin.fullName
    );

    console.log(
      "Email:",
      admin.email
    );

    console.log(
      "Role:",
      admin.role
    );

    console.log(
      "🔐 OTP SENT TO ADMIN EMAIL"
    );

    console.log(
      "================================="
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({

      success: true,

      requiresOtp: true,

      message:
        "A verification code has been sent to your registered email address.",

      // Frontend needs this to verify OTP
      challengeId:
        otpResult.challengeId,

      // Example:
      // ad***@gmail.com
      maskedEmail:
        otpResult.maskedEmail,

      // 300 seconds = 5 minutes
      expiresInSeconds:
        otpResult.expiresInSeconds,
    });

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to login as administrator",
    });
  }
});

module.exports = router;
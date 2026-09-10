const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  createLoginOTP,
} = require("../services/otpService");
const router = express.Router();

// Use env JWT secret if available, otherwise a safe fallback so login/register still work
const JWT_SECRET =
  process.env.JWT_SECRET || "hemo_fallback_secret_change_in_production";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are all required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account already exists with this email. Please log in." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ fullName, email, passwordHash });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// POST /api/auth/login
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password are required" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(401)
//         .json({
//           message:
//             "No account found with this email. Please check the email or register a new account.",
//         });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) {
//       return res
//         .status(401)
//         .json({ message: "Invalid password. Please try again." });
//     }

//     const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.json({
//       token,
//       user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ message: "Server error during login" });
//   }
// });

// =====================================================
// POST /api/auth/login
// PASSWORD → OTP
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    // =================================================
    // FIND USER
    // =================================================

    const user = await User.findOne({
      email: email.trim(),
    });

    if (!user) {
      return res.status(401).json({
        message:
          "No account found with this email. Please check the email or register a new account.",
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
      // IMPORTANT:
      // OTP is NOT sent when password is wrong.

      return res.status(401).json({
        message:
          "Invalid password. Please try again.",
      });
    }

    // =================================================
    // CREATE OTP CHALLENGE
    // =================================================

    let otpResult;

    try {
      otpResult =
        await createLoginOTP({
          userId: String(user._id),
          email: user.email,
          role: user.role,

          authPayload: {
            userId: user._id,
            role: user.role,
          },

          userData: {
            id: user._id,
            fullName:
              user.fullName,
            email: user.email,
            role: user.role,
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
        "Patient OTP send error:",
        otpError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send the login verification code. Please try again.",
      });
    }

    // =================================================
    // DO NOT CREATE JWT HERE
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
      "Login error:",
      err
    );

    return res.status(500).json({
      message:
        "Server error during login",
    });
  }
});

module.exports = router;


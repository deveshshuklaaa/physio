const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { displayName, splitName } = require("../utils/displayName");
const { allow, check } = require("../utils/allow");
const {
  createLoginOTP,
} = require("../services/otpService");
const router = express.Router();

const { OAuth2Client } = require("google-auth-library");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Use env JWT secret if available, otherwise a safe fallback so login/register still work
// JWT_SECRET: no fallback, by design. See config/secrets.js.
const { JWT_SECRET } = require("../../config/secrets");

// Maxes: email 254 (RFC 5321); name parts 100 and password 128 are chosen (bcrypt only reads 72 bytes).
const SIGNUP_SPEC = {
  firstName: { type: "string", max: 100 },
  middleName: { type: "string", max: 100 },
  lastName: { type: "string", max: 100 },
  email: { type: "string", max: 254 },
  password: { type: "string", max: 128 },
};

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    allow(req.body, ["firstName", "middleName", "lastName", "email", "password"]);
    check(req.body, SIGNUP_SPEC);
    const { firstName, middleName, lastName, email, password } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !email || !password) {
      return res
        .status(400)
        .json({ message: "First name, last name, email and password are all required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "An account already exists with this email. Please log in." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ firstName, middleName, lastName, email, passwordHash });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { id: user._id, fullName: displayName(user), email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
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
    check(req.body || {}, { email: SIGNUP_SPEC.email, password: SIGNUP_SPEC.password });
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
    if (err.status === 400) return res.status(400).json({ message: err.message });
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

// =====================================================
// GOOGLE LOGIN / REGISTRATION - PATIENT ONLY
// =====================================================

router.post("/google/patient", async (req, res) => {
  try {
    check(req.body || {}, { credential: { type: "string", max: 4096 } });
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!GOOGLE_CLIENT_ID || !googleClient) {
      console.error("GOOGLE_CLIENT_ID is missing from backend environment.");
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured.",
      });
    }

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
    const googleName = payload.name;

    if (!googleId || !googleEmail) {
      return res.status(401).json({
        success: false,
        message: "Google account information is incomplete.",
      });
    }

    if (!emailVerified) {
      return res.status(401).json({
        success: false,
        message: "Your Google email address could not be verified.",
      });
    }

    let user = await User.findOne({ googleId: googleId });

    if (user) {
      if (user.role !== "patient") {
        return res.status(403).json({
          success: false,
          message: "Google Sign-In is available only for patients.",
        });
      }
    }

    if (!user) {
      user = await User.findOne({ email: googleEmail });

      if (user) {
        if (user.role !== "patient") {
          return res.status(403).json({
            success: false,
            message: "Google Sign-In is available only for patients.",
          });
        }
        user.googleId = googleId;
        await user.save();
      }
    }

    if (!user) {
      // one free-text Google name -> parts; a one-word name is a mononym (lastName "")
      user = new User({
        ...splitName(googleName || googleEmail.split("@")[0]),
        email: googleEmail,
        googleId: googleId,
        authProvider: "google",
        role: "patient",
        accountStatus: "APPROVED",
      });
      await user.save();;
    }

    const token = jwt.sign(
      { userId: user._id, role: "patient" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        fullName: displayName(user),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error("Google authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during Google authentication.",
    });
  }
});

module.exports = router;


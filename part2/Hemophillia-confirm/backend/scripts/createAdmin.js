require("dotenv").config();

const bcrypt = require("bcryptjs");

// =====================================================
// EXISTING CSFLE DATABASE CONNECTION
// =====================================================

const connectDB = require("../config/db");

// =====================================================
// USER MODEL
// =====================================================

const User = require("../src/models/User");

// =====================================================
// ADMIN DETAILS
// =====================================================

const ADMIN_NAME =
  process.env.ADMIN_NAME ||
  "Hemophilia Care Administrator";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  "avanish.i@somaiya.edu";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  "Admin@123456";

// =====================================================
// CREATE ADMIN
// =====================================================

async function createAdmin() {
  try {
    console.log("=================================");
    console.log("CONNECTING TO DATABASE...");
    console.log("=================================");

    // IMPORTANT:
    // Uses your existing CSFLE connection
    await connectDB();

    console.log("=================================");
    console.log("✅ MongoDB connected");
    console.log("🔐 CSFLE connection active");
    console.log("=================================");

    // =================================================
    // CHECK EXISTING ADMIN
    // =================================================

    // Scoped to THIS admin's email, not to the role. A role-only check
    // ("does any admin exist?") makes this script a one-shot: once the
    // first administrator exists it exits before ever looking at
    // ADMIN_EMAIL, so a second, legitimate administrator can never be
    // created. The app supports many admins; only re-creating the SAME
    // one is what we refuse here.
    const existingAdmin =
      await User.findOne({
        email: ADMIN_EMAIL,
        role: "admin",
      });

    if (existingAdmin) {
      console.log("=================================");
      console.log("⚠️ ADMIN ALREADY EXISTS");
      console.log("=================================");

      console.log(
        "Name:",
        existingAdmin.fullName
      );

      console.log(
        "Email:",
        existingAdmin.email
      );

      console.log(
        "Role:",
        existingAdmin.role
      );

      console.log(
        "Status:",
        existingAdmin.accountStatus
      );

      console.log(
        "================================="
      );

      process.exit(0);
    }

    // =================================================
    // CHECK EMAIL
    // =================================================

    const existingUser =
      await User.findOne({
        email: ADMIN_EMAIL,
      });

    if (existingUser) {
      console.error("=================================");
      console.error("❌ EMAIL ALREADY EXISTS");
      console.error("=================================");

      console.error(
        `A user already exists with email: ${ADMIN_EMAIL}`
      );

      console.error(
        "Use a different ADMIN_EMAIL in your .env file."
      );

      console.error(
        "================================="
      );

      process.exit(1);
    }

    // =================================================
    // HASH PASSWORD
    // =================================================

    console.log(
      "🔐 Hashing admin password..."
    );

    const passwordHash =
      await bcrypt.hash(
        ADMIN_PASSWORD,
        10
      );

    // =================================================
    // CREATE ADMIN
    // =================================================

    console.log(
      "👤 Creating administrator account..."
    );

    const admin =
      await User.create({
        fullName: ADMIN_NAME,

        email: ADMIN_EMAIL,

        passwordHash,

        role: "admin",

        accountStatus: "APPROVED",

        mustChangePassword: false,
      });

    // =================================================
    // SUCCESS
    // =================================================

    console.log("");
    console.log("=================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");

    console.log(
      "Name:",
      admin.fullName
    );

    console.log(
      "Email:",
      ADMIN_EMAIL
    );

    console.log(
      "Role:",
      admin.role
    );

    console.log(
      "Status:",
      admin.accountStatus
    );

    console.log("");
    console.log("ADMIN LOGIN CREDENTIALS");
    console.log("---------------------------------");

    console.log(
      "Email:",
      ADMIN_EMAIL
    );

    console.log(
      "Password:",
      ADMIN_PASSWORD
    );

    console.log("---------------------------------");

    console.log("");
    console.log(
      "⚠️ Keep these credentials secure."
    );

    console.log(
      "================================="
    );

    // =================================================
    // CLOSE CONNECTION
    // =================================================

    process.exit(0);

  } catch (error) {

    console.error("");
    console.error("=================================");
    console.error("❌ FAILED TO CREATE ADMIN");
    console.error("=================================");

    console.error(
      "Error:",
      error.message
    );

    console.error("");

    if (error.stack) {
      console.error(error.stack);
    }

    console.error(
      "================================="
    );

    process.exit(1);
  }
}

// =====================================================
// RUN
// =====================================================

createAdmin();

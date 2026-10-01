require("dotenv").config({ path: require("path").resolve(__dirname, "../../../../.env") });

const bcrypt = require("bcryptjs");

// Use the SAME database connection that your application uses
const connectDB = require("../config/db");

const User = require("../src/models/User");

// =====================================================
// CREATE DOCTOR / CLINICIAN ACCOUNT
// =====================================================

const createStaffAccount = async () => {
  try {
    // ==========================================
    // CONNECT USING EXISTING CSFLE CONFIG
    // ==========================================

    await connectDB();

    console.log("=================================");
    console.log("Creating staff account...");
    console.log("=================================");

    // ==========================================
    // ACCOUNT DETAILS
    // ==========================================

    const professionalId = "DOC002";

    const fullName = "Dr. Narendra Modi";

    const email = "sameersomaiyafanclub@gmail.com";

    const temporaryPassword = "123456789";

    const role = "doctor";

    // ==========================================
    // CHECK PROFESSIONAL ID
    // ==========================================

    const existingStaff = await User.findOne({
      professionalId,
    });

    if (existingStaff) {
      console.log("=================================");
      console.log("⚠️ Staff account already exists");
      console.log("Professional ID:", professionalId);
      console.log("Role:", existingStaff.role);
      console.log("=================================");

      return;
    }

    // ==========================================
    // HASH TEMPORARY PASSWORD
    // ==========================================

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      10
    );

    // ==========================================
    // CREATE ACCOUNT
    // ==========================================

    const staff = await User.create({
      fullName,
      email,
      professionalId,
      passwordHash,
      role,

      // FORCE PASSWORD CHANGE
      mustChangePassword: true,
    });

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log("=================================");
    console.log("✅ STAFF ACCOUNT CREATED");
    console.log("=================================");

    console.log("Professional ID:", staff.professionalId);
    console.log("Name:", staff.fullName);
    console.log("Role:", staff.role);

    console.log("---------------------------------");

    console.log(
      "Temporary Password:",
      temporaryPassword
    );

    console.log(
      "Must Change Password:",
      staff.mustChangePassword
    );

    console.log("=================================");
    console.log(
      "⚠️ User must change the temporary password after first login."
    );
    console.log("=================================");

  } catch (error) {
    console.error("=================================");
    console.error("❌ STAFF ACCOUNT CREATION FAILED");
    console.error("=================================");
    console.error(error);
  } finally {
    // Close MongoDB connection after script finishes
    const mongoose = require("mongoose");

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();

      console.log("🔌 MongoDB connection closed");
    }
  }
};

// =====================================================
// RUN
// =====================================================

createStaffAccount();

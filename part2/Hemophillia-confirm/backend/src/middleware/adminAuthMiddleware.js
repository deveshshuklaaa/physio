const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AdminProfile = require("../models/AdminProfile");
const { resolveAdminAuthz } = require("../utils/adminAuthz");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "hemo_fallback_secret_change_in_production";

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required",
      });
    }

    const admin = await User.findOne({
      _id: decoded.userId,
      role: "admin",
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found",
      });
    }

    if (admin.accountStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Admin account is not active",
      });
    }

    req.userId = decoded.userId;
    req.role = "admin";
    req.admin = admin;
    const profile = await AdminProfile.findOne({ userId: admin._id });
    const { adminLevel, permissions } = resolveAdminAuthz(profile);
    req.adminProfile = profile;
    req.adminLevel = adminLevel;
    req.permissions = permissions;

    next();
  } catch (err) {
    console.error("Admin authentication error:", err);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin authentication token",
    });
  }
};

// =====================================================
// PERMISSION MIDDLEWARE
// =====================================================

adminAuth.requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.adminLevel === "SUPER_ADMIN") return next();

    if (!req.permissions?.[permission]) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = adminAuth;

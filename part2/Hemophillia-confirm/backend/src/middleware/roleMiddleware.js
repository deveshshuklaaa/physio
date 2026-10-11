const jwt = require("jsonwebtoken");

// JWT_SECRET: no fallback, by design. See config/secrets.js.
const { JWT_SECRET } = require("../../config/secrets");

// =====================================================
// VERIFY STAFF JWT
// =====================================================

const staffAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);
    

    console.log("========== STAFF AUTH DEBUG ==========");
    console.log("Decoded token:", decoded);
    console.log("Role:", decoded.role);
    console.log("User ID:", decoded.userId);
    console.log("Professional ID:", decoded.professionalId);
    console.log("======================================");

    // Only allow doctor / clinician tokens
    if (!["doctor", "clinician"].includes(decoded.role)) {
      return res.status(403).json({
        message: "Doctor / Clinician access required",
      });
    }

    req.userId = decoded.userId;
    req.professionalId = decoded.professionalId;
    req.role = decoded.role;

    next();
  } catch (err) {
    console.error("Staff authentication error:", err);

    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
};

// =====================================================
// ROLE CHECK
// =====================================================

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

module.exports = {
  staffAuth,
  allowRoles,
};
// const jwt = require("jsonwebtoken");

// // Use the same JWT secret strategy as auth routes
// const JWT_SECRET =
//   process.env.JWT_SECRET || "hemo_fallback_secret_change_in_production";

// function authMiddleware(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Authorization token missing" });
//   }

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.userId = decoded.userId;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// }

// module.exports = authMiddleware;




const jwt = require("jsonwebtoken");

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "mySuperSecretHemophiliaAppKey123";

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("\n=================================");
  console.log("🔐 AUTH MIDDLEWARE");
  console.log("Authorization header exists:", !!authHeader);
  console.log(
    "Authorization starts Bearer:",
    authHeader?.startsWith("Bearer ")
  );
  console.log("=================================");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ AUTH FAILED: TOKEN MISSING");

    return res.status(401).json({
      message: "Authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ AUTH FAILED: EMPTY TOKEN");

    return res.status(401).json({
      message: "Authorization token missing",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    console.log("✅ JWT VERIFIED");
    console.log("Decoded userId:", decoded.userId);
    console.log("Decoded role:", decoded.role);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.log("❌ JWT VERIFICATION FAILED");
    console.log("Error name:", err.name);
    console.log("Error message:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
// // const jwt = require("jsonwebtoken");

// // const JWT_SECRET =
// //   process.env.JWT_SECRET ||
// //   "hemo_fallback_secret_change_in_production";

// // // =====================================================
// // // ADMIN AUTHENTICATION
// // // =====================================================

// // const adminAuth = (req, res, next) => {
// //   try {
// //     const authHeader =
// //       req.headers.authorization;

// //     // =================================================
// //     // CHECK TOKEN
// //     // =================================================

// //     if (
// //       !authHeader ||
// //       !authHeader.startsWith("Bearer ")
// //     ) {
// //       return res.status(401).json({
// //         success: false,
// //         message:
// //           "Admin authentication token required",
// //       });
// //     }

// //     // =================================================
// //     // EXTRACT TOKEN
// //     // =================================================

// //     const token =
// //       authHeader.split(" ")[1];

// //     if (!token) {
// //       return res.status(401).json({
// //         success: false,
// //         message:
// //           "Authentication token missing",
// //       });
// //     }

// //     // =================================================
// //     // VERIFY JWT
// //     // =================================================

// //     const decoded =
// //       jwt.verify(
// //         token,
// //         JWT_SECRET
// //       );

// //     // =================================================
// //     // DEBUG
// //     // =================================================

// //     console.log(
// //       "========== ADMIN AUTH DEBUG =========="
// //     );

// //     console.log(
// //       "Decoded token:",
// //       decoded
// //     );

// //     console.log(
// //       "Role:",
// //       decoded.role
// //     );

// //     console.log(
// //       "User ID:",
// //       decoded.userId
// //     );

// //     console.log(
// //       "======================================"
// //     );

// //     // =================================================
// //     // CHECK ADMIN ROLE
// //     // =================================================

// //     if (decoded.role !== "admin") {
// //       return res.status(403).json({
// //         success: false,
// //         message:
// //           "Administrator access required",
// //       });
// //     }

// //     // =================================================
// //     // ATTACH ADMIN INFORMATION
// //     // =================================================

// //     req.userId =
// //       decoded.userId;

// //     req.role =
// //       decoded.role;

// //     next();

// //   } catch (err) {

// //     console.error(
// //       "Admin authentication error:",
// //       err
// //     );

// //     return res.status(401).json({
// //       success: false,
// //       message:
// //         "Invalid or expired admin authentication token",
// //     });
// //   }
// // };

// // module.exports = adminAuth;



// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const adminAuth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({
//         message: "Authentication required",
//       });
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     );

//     if (!decoded || decoded.role !== "admin") {
//       return res.status(403).json({
//         message: "Admin access required",
//       });
//     }

//     const admin = await User.findById(decoded.userId);

//     if (!admin) {
//       return res.status(401).json({
//         message: "Admin account not found",
//       });
//     }

//     if (admin.role !== "admin") {
//       return res.status(403).json({
//         message: "Admin access required",
//       });
//     }

//     if (admin.accountStatus !== "APPROVED") {
//       return res.status(403).json({
//         message: "Admin account is not approved",
//       });
//     }

//     /*
//      * ---------------------------------------------------------
//      * BACKWARD-COMPATIBLE BOOTSTRAP
//      * ---------------------------------------------------------
//      *
//      * If the system has exactly one admin and no SUPER_ADMIN,
//      * promote that existing admin to SUPER_ADMIN automatically.
//      *
//      * This is useful for the existing Admin 1 account.
//      */
//     const adminCount = await User.countDocuments({
//       role: "admin",
//     });

//     const superAdminCount = await User.countDocuments({
//       role: "admin",
//       adminLevel: "SUPER_ADMIN",
//     });

//     if (
//       adminCount === 1 &&
//       superAdminCount === 0
//     ) {
//       admin.adminLevel = "SUPER_ADMIN";

//       admin.permissions = {
//         canManageAdmins: true,
//         canManageDoctors: true,
//         canViewPatients: true,
//         canManageDoctorRequests: true,
//       };

//       await admin.save();
//     }

//     /*
//      * ---------------------------------------------------------
//      * NORMALIZE ADMIN LEVEL / PERMISSIONS
//      * ---------------------------------------------------------
//      */

//     const adminLevel =
//       admin.adminLevel || "ADMIN";

//     const permissions = {
//       canManageAdmins:
//         adminLevel === "SUPER_ADMIN"
//           ? true
//           : !!admin.permissions?.canManageAdmins,

//       canManageDoctors:
//         adminLevel === "SUPER_ADMIN"
//           ? true
//           : admin.permissions?.canManageDoctors !== false,

//       canViewPatients:
//         adminLevel === "SUPER_ADMIN"
//           ? true
//           : admin.permissions?.canViewPatients !== false,

//       canManageDoctorRequests:
//         adminLevel === "SUPER_ADMIN"
//           ? true
//           : admin.permissions?.canManageDoctorRequests !== false,
//     };

//     /*
//      * ---------------------------------------------------------
//      * ATTACH ADMIN INFORMATION TO REQUEST
//      * ---------------------------------------------------------
//      */

//     req.userId = admin._id;
//     req.role = "admin";
//     req.admin = admin;

//     req.adminLevel = adminLevel;
//     req.permissions = permissions;

//     next();
//   } catch (error) {
//     console.error("Admin authentication error:", error);

//     if (
//       error.name === "JsonWebTokenError" ||
//       error.name === "TokenExpiredError"
//     ) {
//       return res.status(401).json({
//         message: "Invalid or expired authentication token",
//       });
//     }

//     return res.status(500).json({
//       message: "Authentication failed",
//     });
//   }
// };


// /*
//  * ============================================================
//  * PERMISSION MIDDLEWARE
//  * ============================================================
//  *
//  * Usage:
//  *
//  * router.get(
//  *   "/management",
//  *   adminAuth,
//  *   adminAuth.requirePermission("canManageAdmins"),
//  *   ...
//  * );
//  *
//  */

// adminAuth.requirePermission = (permission) => {
//   return (req, res, next) => {
//     try {
//       /*
//        * SUPER_ADMIN automatically has every permission.
//        */
//       if (req.adminLevel === "SUPER_ADMIN") {
//         return next();
//       }

//       /*
//        * Check the requested permission.
//        */
//       if (!req.permissions || !req.permissions[permission]) {
//         return res.status(403).json({
//           message: "You do not have permission to perform this action",
//           requiredPermission: permission,
//         });
//       }

//       next();
//     } catch (error) {
//       console.error(
//         "Admin permission check error:",
//         error
//       );

//       return res.status(500).json({
//         message: "Permission check failed",
//       });
//     }
//   };
// };


// /*
//  * Optional helper for checking SUPER_ADMIN specifically.
//  */
// adminAuth.requireSuperAdmin = (req, res, next) => {
//   if (req.adminLevel !== "SUPER_ADMIN") {
//     return res.status(403).json({
//       message: "Super Admin access required",
//     });
//   }

//   next();
// };


// module.exports = adminAuth;



const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    console.log("========== ADMIN AUTH DEBUG ==========");
    console.log("Decoded token:", decoded);
    console.log("Role:", decoded.role);
    console.log("User ID:", decoded.userId);
    console.log("======================================");

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required",
      });
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Administrator identity missing from token",
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

    if (admin.accountStatus && admin.accountStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Administrator account is not active",
      });
    }

    req.userId = String(admin._id);
    req.role = "admin";
    req.admin = admin;
    req.adminLevel = admin.adminLevel || "ADMIN";
    req.permissions = admin.permissions || {};

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
// ADMIN PERMISSION HELPER
// =====================================================
adminAuth.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Administrator authentication required",
      });
    }

    const isSuperAdmin =
      req.admin.adminLevel === "SUPER_ADMIN";

    const allowed =
      isSuperAdmin ||
      req.admin.permissions?.[permission] === true;

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission: ${permission}`,
      });
    }

    next();
  };
};

module.exports = adminAuth;

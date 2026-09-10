// const express = require("express");
// const multer = require("multer");

// const DoctorRegistrationRequest =
//   require("../models/DoctorRegistrationRequest");

// const router = express.Router();

// // =====================================================
// // MULTER
// // MEMORY STORAGE
// // =====================================================
// //
// // IMPORTANT:
// // Files are NEVER written to disk.
// // They stay in memory as Buffers and are then
// // stored in MongoDB through CSFLE.
// //

// const upload = multer({
//   storage: multer.memoryStorage(),

//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },

//   fileFilter: (req, file, cb) => {
//     const allowedTypes = [
//       "application/pdf",
//       "image/jpeg",
//       "image/png",
//       "image/jpg",
//     ];

//     if (
//       allowedTypes.includes(
//         file.mimetype
//       )
//     ) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Only PDF, JPG, JPEG and PNG files are allowed."
//         )
//       );
//     }
//   },
// });

// // =====================================================
// // DOCTOR REGISTRATION
// // =====================================================

// router.post(
//   "/register",

//   upload.fields([
//     {
//       name: "registrationCertificate",
//       maxCount: 1,
//     },

//     {
//       name: "professionalIdDocument",
//       maxCount: 1,
//     },
//   ]),

//   async (req, res) => {
//     try {
//       console.log("");
//       console.log(
//         "================================="
//       );
//       console.log(
//         "DOCTOR REGISTRATION REQUEST"
//       );
//       console.log(
//         "================================="
//       );

//       const {
//         fullName,
//         email,
//         mobileNumber,

//         medicalRegistrationNumber,
//         medicalCouncil,

//         qualification,
//         specialization,
//         yearsOfExperience,

//         hospitalName,
//         city,

//         declarationAccepted,
//       } = req.body || {};

//       // ===============================================
//       // FILES
//       // ===============================================

//       const certificate =
//         req.files?.registrationCertificate?.[0] ||
//         null;

//       const professionalId =
//         req.files?.professionalIdDocument?.[0] ||
//         null;

//       // ===============================================
//       // REQUIRED FIELDS
//       // ===============================================

//       if (
//         !fullName ||
//         !email ||
//         !mobileNumber ||
//         !medicalRegistrationNumber ||
//         !medicalCouncil ||
//         !qualification ||
//         !specialization ||
//         yearsOfExperience ===
//           undefined ||
//         yearsOfExperience === null ||
//         !hospitalName ||
//         !city
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Please provide all required registration details.",
//         });
//       }

//       // ===============================================
//       // REQUIRED DOCUMENTS
//       // ===============================================

//       if (!certificate) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Medical registration certificate is required.",
//         });
//       }

//       if (!professionalId) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Professional ID document is required.",
//         });
//       }

//       // ===============================================
//       // DECLARATION
//       // ===============================================

//       if (
//         declarationAccepted !== "true" &&
//         declarationAccepted !== true
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "You must accept the declaration before submitting.",
//         });
//       }

//       // ===============================================
//       // CLEAN VALUES
//       // ===============================================

//       const cleanFullName =
//         String(fullName).trim();

//       const cleanEmail =
//         String(email)
//           .trim()
//           .toLowerCase();

//       const cleanMobile =
//         String(mobileNumber).trim();

//       const cleanRegistrationNumber =
//         String(
//           medicalRegistrationNumber
//         )
//           .trim()
//           .toUpperCase();

//       const cleanCouncil =
//         String(medicalCouncil).trim();

//       const cleanQualification =
//         String(qualification).trim();

//       const cleanSpecialization =
//         String(specialization).trim();

//       const cleanHospital =
//         String(hospitalName).trim();

//       const cleanCity =
//         String(city).trim();

//       const experience =
//         Number(yearsOfExperience);

//       // ===============================================
//       // VALIDATION
//       // ===============================================

//       const emailRegex =
//         /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//       if (
//         !emailRegex.test(cleanEmail)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Please provide a valid email address.",
//         });
//       }

//       const mobileRegex =
//         /^[0-9]{10}$/;

//       if (
//         !mobileRegex.test(cleanMobile)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Please provide a valid 10-digit mobile number.",
//         });
//       }

//       if (
//         Number.isNaN(experience) ||
//         experience < 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Years of experience must be valid.",
//         });
//       }

//       // ===============================================
//       // CREATE REQUEST
//       // ===============================================

//       const request =
//         await DoctorRegistrationRequest.create({
//           fullName:
//             cleanFullName,

//           email:
//             cleanEmail,

//           mobileNumber:
//             cleanMobile,

//           medicalRegistrationNumber:
//             cleanRegistrationNumber,

//           medicalCouncil:
//             cleanCouncil,

//           qualification:
//             cleanQualification,

//           specialization:
//             cleanSpecialization,

//           yearsOfExperience:
//             experience,

//           hospitalName:
//             cleanHospital,

//           city:
//             cleanCity,

//           // =========================================
//           // ACTUAL FILE BUFFERS
//           // =========================================

//           registrationCertificate:
//             certificate.buffer,

//           professionalIdDocument:
//             professionalId.buffer,

//           // =========================================
//           // FILE METADATA
//           // =========================================

//           registrationCertificateName:
//             certificate.originalname,

//           registrationCertificateMimeType:
//             certificate.mimetype,

//           professionalIdDocumentName:
//             professionalId.originalname,

//           professionalIdDocumentMimeType:
//             professionalId.mimetype,

//           declarationAccepted:
//             true,

//           status:
//             "PENDING",
//         });

//       // ===============================================
//       // LOG
//       // ===============================================

//       console.log(
//         "================================="
//       );

//       console.log(
//         "✅ DOCTOR REQUEST CREATED"
//       );

//       console.log(
//         "Request ID:",
//         request._id
//       );

//       console.log(
//         "Doctor:",
//         cleanFullName
//       );

//       console.log(
//         "Status:",
//         request.status
//       );

//       console.log(
//         "Certificate:",
//         certificate.originalname
//       );

//       console.log(
//         "Professional ID:",
//         professionalId.originalname
//       );

//       console.log(
//         "Certificate size:",
//         certificate.size,
//         "bytes"
//       );

//       console.log(
//         "Professional ID size:",
//         professionalId.size,
//         "bytes"
//       );

//       console.log(
//         "================================="
//       );

//       return res.status(201).json({
//         success: true,

//         message:
//           "Doctor registration submitted successfully. Your request is now pending administrator review.",

//         requestId:
//           request._id,

//         status:
//           request.status,
//       });

//     } catch (error) {

//       console.error(
//         "================================="
//       );

//       console.error(
//         "❌ DOCTOR REGISTRATION ERROR"
//       );

//       console.error(error);

//       console.error(
//         "================================="
//       );

//       return res.status(500).json({
//         success: false,

//         message:
//           "Unable to submit doctor registration request.",

//         error:
//           error.message,
//       });
//     }
//   }
// );

// module.exports = router;

const express = require("express");

const multer = require("multer");

const DoctorRegistrationRequest = require(
  "../models/DoctorRegistrationRequest"
);

const router = express.Router();

// =====================================================
// MULTER
// MEMORY STORAGE
// =====================================================
//
// IMPORTANT:
// Files are NEVER written to disk.
// They stay in memory as Buffers and are then
// stored in MongoDB through CSFLE.
//

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (
      allowedTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        )
      );
    }
  },
});

// =====================================================
// DOCTOR REGISTRATION
// POST /register
// =====================================================

router.post(
  "/register",

  upload.fields([
    {
      name: "registrationCertificate",
      maxCount: 1,
    },

    {
      name: "professionalIdDocument",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    try {
      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "DOCTOR REGISTRATION REQUEST"
      );
      console.log(
        "================================="
      );

      // =================================================
      // GET TEXT FIELDS
      // =================================================

      const {
        fullName,
        email,
        mobileNumber,

        medicalRegistrationNumber,
        medicalCouncil,
        qualification,
        specialization,
        

        yearsOfExperience,

        hospitalName,

        // ===============================================
        // LOCATION
        // ===============================================

        country,
        stateProvince,
        city,

        declarationAccepted,
      } = req.body || {};

      // =================================================
      // FILES
      // =================================================

      const certificate =
        req.files?.registrationCertificate?.[0] ||
        null;

      const professionalId =
        req.files?.professionalIdDocument?.[0] ||
        null;

      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !fullName ||
        !email ||
        !mobileNumber ||

        !medicalRegistrationNumber ||
        !medicalCouncil ||
        !qualification ||
        !specialization ||

        yearsOfExperience === undefined ||
        yearsOfExperience === null ||

        !hospitalName ||

        // ===============================================
        // LOCATION REQUIRED
        // ===============================================

        !country ||
        !stateProvince ||
        !city
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please provide all required registration details.",
        });
      }

      // =================================================
      // REQUIRED DOCUMENTS
      // =================================================

      if (!certificate) {
        return res.status(400).json({
          success: false,

          message:
            "Medical registration certificate is required.",
        });
      }

      if (!professionalId) {
        return res.status(400).json({
          success: false,

          message:
            "Professional ID document is required.",
        });
      }

      // =================================================
      // DECLARATION
      // =================================================

      if (
        declarationAccepted !== "true" &&
        declarationAccepted !== true
      ) {
        return res.status(400).json({
          success: false,

          message:
            "You must accept the declaration before submitting.",
        });
      }

      // =================================================
      // CLEAN VALUES
      // =================================================

      const cleanFullName =
        String(fullName).trim();

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();

      const cleanMobile =
        String(mobileNumber).trim();

      const cleanRegistrationNumber =
        String(
          medicalRegistrationNumber
        )
          .trim()
          .toUpperCase();

      const cleanCouncil =
        String(medicalCouncil).trim();

      const cleanQualification =
        String(qualification).trim();

      const cleanSpecialization =
        String(specialization).trim();

      const cleanHospital =
        String(hospitalName).trim();

      // =================================================
      // LOCATION CLEANING
      // =================================================

      const cleanCountry =
        String(country).trim();

      const cleanStateProvince =
        String(stateProvince).trim();

      const cleanCity =
        String(city).trim();

      // =================================================
      // EXPERIENCE
      // =================================================

      const experience =
        Number(yearsOfExperience);

      // =================================================
      // VALIDATION
      // =================================================

      // -----------------------------------------------
      // EMAIL
      // -----------------------------------------------

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(cleanEmail)
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please provide a valid email address.",
        });
      }

      // -----------------------------------------------
      // MOBILE
      // -----------------------------------------------

      const mobileRegex =
        /^[0-9]{10}$/;

      if (
        !mobileRegex.test(cleanMobile)
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Please provide a valid 10-digit mobile number.",
        });
      }

      // -----------------------------------------------
      // EXPERIENCE
      // -----------------------------------------------

      if (
        Number.isNaN(experience) ||
        experience < 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Years of experience must be valid.",
        });
      }

      // -----------------------------------------------
      // COUNTRY
      // -----------------------------------------------

      if (!cleanCountry) {
        return res.status(400).json({
          success: false,

          message:
            "Please select a country.",
        });
      }

      // -----------------------------------------------
      // STATE / PROVINCE
      // -----------------------------------------------

      if (!cleanStateProvince) {
        return res.status(400).json({
          success: false,

          message:
            "Please select a state / province.",
        });
      }

      // -----------------------------------------------
      // CITY
      // -----------------------------------------------

      if (!cleanCity) {
        return res.status(400).json({
          success: false,

          message:
            "Please select a city.",
        });
      }

      // =================================================
      // CREATE REQUEST
      // =================================================

      const request =
        await DoctorRegistrationRequest.create({

          // =============================================
          // PERSONAL
          // =============================================

          fullName:
            cleanFullName,

          email:
            cleanEmail,

          mobileNumber:
            cleanMobile,

          // =============================================
          // PROFESSIONAL
          // =============================================

          medicalRegistrationNumber:
            cleanRegistrationNumber,

          medicalCouncil:
            cleanCouncil,

          qualification:
            cleanQualification,

          specialization:
            cleanSpecialization,

          yearsOfExperience:
            experience,

          // =============================================
          // WORKPLACE
          // =============================================

          hospitalName:
            cleanHospital,

          // =============================================
          // LOCATION
          // =============================================

          country:
            cleanCountry,

          stateProvince:
            cleanStateProvince,

          city:
            cleanCity,

          // =============================================
          // ACTUAL FILE BUFFERS
          // =============================================

          registrationCertificate:
            certificate.buffer,

          professionalIdDocument:
            professionalId.buffer,

          // =============================================
          // FILE METADATA
          // =============================================

          registrationCertificateName:
            certificate.originalname,

          registrationCertificateMimeType:
            certificate.mimetype,

          professionalIdDocumentName:
            professionalId.originalname,

          professionalIdDocumentMimeType:
            professionalId.mimetype,

          // =============================================
          // DECLARATION
          // =============================================

          declarationAccepted:
            true,

          // =============================================
          // STATUS
          // =============================================

          status:
            "PENDING",
        });

      // =================================================
      // LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "✅ DOCTOR REQUEST CREATED"
      );

      console.log(
        "Request ID:",
        request._id
      );

      console.log(
        "Doctor:",
        cleanFullName
      );

      console.log(
        "Email:",
        cleanEmail
      );

      console.log(
        "Mobile:",
        cleanMobile
      );

      console.log(
        "Medical Registration Number:",
        cleanRegistrationNumber
      );

      console.log(
        "Medical Council:",
        cleanCouncil
      );

      console.log(
        "Qualification:",
        cleanQualification
      );

      console.log(
        "Specialization:",
        cleanSpecialization
      );

      console.log(
        "Years of Experience:",
        experience
      );

      console.log(
        "Hospital:",
        cleanHospital
      );

      console.log(
        "Country:",
        cleanCountry
      );

      console.log(
        "State / Province:",
        cleanStateProvince
      );

      console.log(
        "City:",
        cleanCity
      );

      console.log(
        "Status:",
        request.status
      );

      console.log(
        "Certificate:",
        certificate.originalname
      );

      console.log(
        "Professional ID:",
        professionalId.originalname
      );

      console.log(
        "Certificate size:",
        certificate.size,
        "bytes"
      );

      console.log(
        "Professional ID size:",
        professionalId.size,
        "bytes"
      );

      console.log(
        "================================="
      );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({

        success: true,

        message:
          "Doctor registration submitted successfully. Your request is now pending administrator review.",

        requestId:
          request._id,

        status:
          request.status,
      });

    } catch (error) {

      // =================================================
      // ERROR LOG
      // =================================================

      console.error(
        "================================="
      );

      console.error(
        "❌ DOCTOR REGISTRATION ERROR"
      );

      console.error(error);

      console.error(
        "================================="
      );

      return res.status(500).json({

        success: false,

        message:
          "Unable to submit doctor registration request.",

        error:
          error.message,
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
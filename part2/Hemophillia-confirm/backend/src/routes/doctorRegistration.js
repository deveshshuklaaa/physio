
const express = require("express");

const multer = require("multer");

const DoctorRegistrationRequest = require(
  "../models/DoctorRegistrationRequest"
);

const { allow, check } = require("../utils/allow");

// Maxes are chosen, not schema-derived: email 254 (RFC 5321), mobile 10 digits, names/places 100, hospital 150.
const T = (max) => ({ type: "string", max });
const DOCTOR_SPEC = {
  firstName: T(100), middleName: T(100), lastName: T(100), email: T(254), mobileNumber: { type: "string", max: 10, re: /^\d{10}$/ },
  medicalRegistrationNumber: T(50), medicalCouncil: T(150), qualification: T(150), specialization: T(150),
  yearsOfExperience: { type: "string", max: 6, re: /^\d{1,3}(\.\d{1,2})?$/ },
  hospitalName: T(150), country: T(100), stateProvince: T(100), city: T(100),
  declarationAccepted: { type: "string", max: 5, re: /^(true|false)$/ },
};

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

  // multer failures (bad mimetype, too big, unexpected file) are client errors, never 500
  (req, res, next) =>
    upload.fields([
      { name: "registrationCertificate", maxCount: 1 },
      { name: "professionalIdDocument", maxCount: 1 },
    ])(req, res, (err) =>
      err
        ? res.status(err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ success: false, message: err.message })
        : next()
    ),

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

      allow(req.body, [
        "firstName", "middleName", "lastName", "email", "mobileNumber",
        "medicalRegistrationNumber", "medicalCouncil", "qualification", "specialization",
        "yearsOfExperience", "hospitalName", "country", "stateProvince", "city",
        "declarationAccepted",
      ]);
      check(req.body, DOCTOR_SPEC);

      const {
        firstName,
        middleName,
        lastName,
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
      } = req.body;

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
        !firstName?.trim() ||
        !lastName?.trim() ||
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

      const cleanFirstName = firstName.trim();
      const cleanMiddleName = (middleName || "").trim();
      const cleanLastName = lastName.trim();

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

          firstName: cleanFirstName,
          middleName: cleanMiddleName,
          lastName: cleanLastName,

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

      if (error.status === 400) return res.status(400).json({ success: false, message: error.message });

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

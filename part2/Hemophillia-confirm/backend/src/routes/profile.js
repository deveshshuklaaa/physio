const express = require("express");
const authMiddleware = require("../middleware/auth");

const PatientProfile = require("../models/PatientProfile");
const FHIRResource = require("../models/FHIRResource");

const { toFHIRPatient } = require("../fhir/patientMapper");
const { allow } = require("../utils/allow");

const PROFILE_FIELDS = [
  "fullName", // -> replaced by the 3 name parts in Phase 4
  "gender", "dob", "age", "bloodGroup", "photoUrl",
  "mobile", "alternateContact", "email",
  "address", "city", "state", "pinCode",
  "emergencyName", "emergencyRelationship", "emergencyPhone",
  "maritalStatus", "educationLevel", "occupation", "annualIncome",
  "insuranceStatus", "insuranceProvider",
  "htcName", "hematologistName", "hospitalName", "existingPatientNumber",
];
const CONSENT_FIELDS = ["consentDataCollection", "consentAI", "consentVideoMonitoring", "privacyAccepted", "termsAccepted"];

const router = express.Router();

// ============================================================
// Helper: Generate Patient ID
// ============================================================

const generatePatientId = () => {
  return "PAT" + Math.floor(100000 + Math.random() * 900000);
};

// ============================================================
// Helper: Generate a unique Patient ID
// ============================================================

const generateUniquePatientId = async () => {
  let patientId;
  let exists = true;

  while (exists) {
    patientId = generatePatientId();

    exists = await PatientProfile.exists({
      patientId,
    });
  }

  return patientId;
};

// ============================================================
// POST /api/profile/consent
// ============================================================

router.post("/consent", authMiddleware, async (req, res) => {
  try {
    allow(req.body, CONSENT_FIELDS);
    const {
      consentDataCollection,
      consentAI,
      consentVideoMonitoring,
      privacyAccepted,
      termsAccepted,
    } = req.body;

    const consentTimestamp = new Date();

    // Find existing profile
    let profile = await PatientProfile.findOne({
      userId: req.userId,
    });

    // Create profile if it does not exist
    if (!profile) {
      const patientId = await generateUniquePatientId();

      profile = new PatientProfile({
        userId: req.userId,
        patientId,
      });
    }

    // Save consent values
    profile.consentDataCollection = !!consentDataCollection;
    profile.consentAI = !!consentAI;
    profile.consentVideoMonitoring = !!consentVideoMonitoring;
    profile.privacyAccepted = !!privacyAccepted;
    profile.termsAccepted = !!termsAccepted;
    profile.consentTimestamp = consentTimestamp;

    // Make sure an existing profile also has a patientId
    if (!profile.patientId) {
      profile.patientId = await generateUniquePatientId();
    }

    await profile.save();

    return res.status(200).json({
      message: "Consent saved successfully",
      profileId: profile._id,
      patientId: profile.patientId,
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    console.error("=================================");
    console.error("❌ Consent save error");
    console.error(err);
    console.error("=================================");

    return res.status(500).json({
      message: "Failed to save consent",
      error: err.message,
    });
  }
});

// ============================================================
// POST /api/profile/patient-profile
// ============================================================

router.post("/patient-profile", authMiddleware, async (req, res) => {
  try {
    const data = allow(req.body, PROFILE_FIELDS);

    // ========================================================
    // Validation helpers
    // ========================================================

    const isValidIndianMobile = (value) => {
      return (
        typeof value === "string" &&
        /^\d{10}$/.test(value.trim())
      );
    };

    const isValidPin = (value) => {
      return (
        typeof value === "string" &&
        /^\d{6}$/.test(value.trim())
      );
    };

    // ========================================================
    // Required fields
    // ========================================================

    const requiredChecks = [
      [
        "fullName",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "Full Name is required",
      ],

      [
        "gender",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "Gender is required",
      ],

      [
        "dob",
        (v) => !!v,
        "Date of Birth is required",
      ],

      [
        "bloodGroup",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "Blood Group is required",
      ],

      [
        "mobile",
        isValidIndianMobile,
        "Mobile Number must be exactly 10 digits",
      ],

      [
        "state",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "State is required",
      ],

      [
        "city",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "City is required",
      ],

      [
        "pinCode",
        isValidPin,
        "PIN Code must be exactly 6 digits",
      ],

      [
        "emergencyName",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "Emergency Contact Name is required",
      ],

      [
        "emergencyRelationship",
        (v) =>
          typeof v === "string" &&
          v.trim().length > 0,
        "Emergency Relationship is required",
      ],

      [
        "emergencyPhone",
        isValidIndianMobile,
        "Emergency Contact Number must be exactly 10 digits",
      ],
    ];

    // ========================================================
    // Validate required fields
    // ========================================================

    for (const [field, validator, message] of requiredChecks) {
      if (!validator(data[field])) {
        return res.status(400).json({
          message,
          field,
        });
      }
    }

    // ========================================================
    // Optional alternate contact
    // ========================================================

    if (
      data.alternateContact &&
      !isValidIndianMobile(data.alternateContact)
    ) {
      return res.status(400).json({
        message:
          "Alternate Contact must be exactly 10 digits (if provided)",
        field: "alternateContact",
      });
    }

    // ========================================================
    // Find existing profile
    // ========================================================

    let profile = await PatientProfile.findOne({
      userId: req.userId,
    });

    // ========================================================
    // Create profile if it doesn't exist
    // ========================================================

    if (!profile) {
      const patientId = await generateUniquePatientId();

      profile = new PatientProfile({
        userId: req.userId,
        patientId,
      });
    }

    // ========================================================
    // Update profile
    // ========================================================

    for (const k of PROFILE_FIELDS) if (k in data) profile[k] = data[k];

    // NEVER allow frontend to change userId
    profile.userId = req.userId;

    // Ensure patientId exists
    if (!profile.patientId) {
      profile.patientId = await generateUniquePatientId();
    }

    // ========================================================
    // Save Patient Profile
    // ========================================================

    await profile.save();

    console.log("✅ Patient profile saved");
    console.log("Patient ID:", profile.patientId);

    // ========================================================
    // Convert to FHIR Patient
    // ========================================================

    const fhirPatient = toFHIRPatient(profile);

    console.log("✅ FHIR Patient created");
    console.log("FHIR ID:", fhirPatient.id);

    // ========================================================
    // Save / Update FHIR Resource
    // ========================================================

    await FHIRResource.findOneAndUpdate(
      {
        resourceType: "Patient",
        id: fhirPatient.id,
      },
      fhirPatient,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("✅ FHIR Patient saved");

    // ========================================================
    // Send response
    // ========================================================

    return res.status(200).json({
      message: "Patient profile saved successfully",
      profile,
      patientId: profile.patientId,
    });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    console.error("=================================");
    console.error("❌ Patient profile save error");
    console.error(err);
    console.error("=================================");

    return res.status(500).json({
      message: "Failed to save patient profile",
      error: err.message,
    });
  }
});

// ============================================================
// GET /api/profile/patient-profile
// ============================================================

router.get("/patient-profile", authMiddleware, async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({
      userId: req.userId,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error("Patient profile fetch error:", err);

    return res.status(500).json({
      message: "Failed to fetch patient profile",
      error: err.message,
    });
  }
});

module.exports = router;
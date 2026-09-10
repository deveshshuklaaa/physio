const express = require("express");

const authMiddleware = require("../middleware/auth");

const PatientProfile = require("../models/PatientProfile");
const HemophiliaDetails = require("../models/HemophiliaDetails");
const ScreeningSession = require("../models/ScreeningSession");
const Assessment = require("../models/Assessment");

const saveFHIRBundle = require("../utils/saveFHIRBundle");

const { toFHIRBundle } = require("../fhir/bundleMapper");

const router = express.Router();

// =====================================================
// SAVE COMPLETE PATIENT FHIR BUNDLE
// =====================================================

router.post("/save-bundle", authMiddleware, async (req, res) => {
  try {
    // ================================================
    // PATIENT
    // ================================================

    const patientProfile =
      await PatientProfile.findOne({
        userId: req.userId,
      });

    if (!patientProfile) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    // ================================================
    // HEMOPHILIA DETAILS
    // ================================================

    const hemophiliaDetails =
      await HemophiliaDetails.findOne({
        userId: req.userId,
      });

    // ================================================
    // SCREENING SESSION
    // ================================================

    const screeningSession =
      await ScreeningSession.findOne({
        userId: req.userId,
      }).sort({ createdAt: -1 });

    // ================================================
    // ASSESSMENT
    // ================================================

    const assessment =
      await Assessment.findOne({
        userId: req.userId,
      }).sort({ createdAt: -1 });

    // ================================================
    // CREATE FHIR BUNDLE
    // ================================================

    const bundle = toFHIRBundle({
      patientProfile,
      hemophiliaDetails,
      screeningSession,
      assessment,
    });

    // ================================================
    // SAVE ONE DOCUMENT
    // ================================================

    const savedBundle =
      await saveFHIRBundle(bundle);

    return res.status(200).json({
      message: "FHIR Bundle saved successfully",

      patientId: patientProfile.patientId,

      resourceType: savedBundle.resourceType,

      id: savedBundle.id,

      resources: bundle.total,
    });

  } catch (error) {
    console.error("❌ FHIR Bundle Error:");
    console.error(error);

    return res.status(500).json({
      message: "Failed to save FHIR Bundle",
      error: error.message,
    });
  }
});

module.exports = router;
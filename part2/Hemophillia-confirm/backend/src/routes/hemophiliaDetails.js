const express = require("express");
const { allow, check } = require("../utils/allow");
const {
  transliterateDoctorName,
} = require("../services/doctorNameTranslationService");

const { displayName } = require("../utils/displayName");

const authMiddleware =
  require("../middleware/auth");

const clinicalRecords =
  require("../services/clinicalRecords");

const PatientProfile =
  require("../models/PatientProfile");

const ScreeningSession =
  require("../models/ScreeningSession");

const Assessment =
  require("../models/Assessment");

const User =
  require("../models/User");

const DoctorChangeRequest =
  require("../models/DoctorChangeRequest");

const saveFHIRBundle =
  require("../utils/saveFHIRBundle");

const {
  toFHIRBundle,
} = require("../fhir/bundleMapper");

const HEMOPHILIA_FIELDS = [
  "type", "severity", "ageAtDiagnosis", "familyHistory", "geneticTestingDone",
  "currentFactorTherapy", "otherCurrentTreatment", "otherMedications", "otherMedicationDetails",
  "bleedingPattern", "jointsAffected", "targetJoint", "targetJoints", "bleedFrequency", "lastBleedDate", "otherBleedingDetails",
  "underPhysiotherapy", "physiotherapyLocation", "physiotherapySessions", "physiotherapyDuration",
  "physiotherapyBodyPart", "physiotherapyTreatment", "physiotherapyEquipment", "physiotherapyHelping",
  "physiotherapyProblems", "previousPhysiotherapy", "physiotherapyStoppedDate", "physiotherapyStoppedReason",
  "mobilityLimitation", "assistiveDevices", "patientNotes", "consultingDoctorId",
];
// Maxes are chosen, not schema-derived (schema has none): choice labels 100, detail text 500, notes 2000, lists 50 x 200.
const T = (max) => ({ type: "string", max });
const L = { type: "array", max: 50, of: "string", itemMax: 200 };
const B = { type: "bool", blank: true };
const HEMOPHILIA_SPEC = {
  type: T(100), severity: T(100), ageAtDiagnosis: { type: "string", max: 3, re: /^\d*$/ },
  familyHistory: T(100), geneticTestingDone: T(100),
  currentFactorTherapy: L, otherCurrentTreatment: T(500), otherMedications: L, otherMedicationDetails: T(500),
  bleedingPattern: T(100), jointsAffected: L, targetJoint: L, targetJoints: L, bleedFrequency: T(100), lastBleedDate: T(40), otherBleedingDetails: T(500),
  underPhysiotherapy: B, physiotherapyLocation: T(200), physiotherapySessions: T(100), physiotherapyDuration: T(100),
  physiotherapyBodyPart: T(200), physiotherapyTreatment: T(500), physiotherapyEquipment: T(500), physiotherapyHelping: T(500),
  physiotherapyProblems: L, previousPhysiotherapy: B, physiotherapyStoppedDate: T(40), physiotherapyStoppedReason: T(500),
  mobilityLimitation: T(500), assistiveDevices: T(500), patientNotes: T(2000),
  consultingDoctorId: { type: "string", max: 24, re: /^([a-f0-9]{24})?$/i },
};
const router =
  express.Router();


// =====================================================
// GET APPROVED DOCTORS
// =====================================================

router.get(
  "/doctors",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🔵 /doctors route reached");

      const language =
        ["en", "hi", "mr"].includes(req.query.language)
          ? req.query.language
          : "en";

      console.log("🟡 Language:", language);

      const doctors = await User.find({
        role: {
          $in: ["doctor", "clinician"],
        },
      })
        .select("_id firstName middleName lastName professionalId role nameTranslations")
        .lean();

      // CSFLE Random cannot sort server-side: decrypt, then sort in memory.
      doctors.sort(
        (a, b) =>
          (a.lastName || "").localeCompare(b.lastName || "") ||
          (a.firstName || "").localeCompare(b.firstName || "")
      );

      console.log("🟢 Doctors fetched:", doctors.length);

      // keep the rest of your existing code below

      const result = [];

      for (const doctor of doctors) {
        const translations = {
          ...(doctor.nameTranslations || {}),
        };

        // ---------------------------------------------
        // ENGLISH
        // ---------------------------------------------

        if (!translations.en) {
          translations.en =
            displayName(doctor);
        }

        // ---------------------------------------------
        // REQUESTED LANGUAGE
        // ---------------------------------------------

        if (
          !translations[language]
        ) {
          translations[language] =
            await transliterateDoctorName(
              displayName(doctor),
              language
            );

          await User.updateOne(
            {
              _id: doctor._id,
            },
            {
              $set: {
                nameTranslations:
                  translations,
              },
            }
          );
        }

        result.push({
          _id: doctor._id,

          fullName:
            displayName(doctor),

          professionalId:
            doctor.professionalId,

          role:
            doctor.role,

          nameTranslations:
            translations,
        });
      }

      return res.json({
        success: true,
        language,
        doctors: result,
      });
    } catch (error) {
      console.error(
        "GET DOCTORS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load doctors.",
      });
    }
  }
);


// =====================================================
// SAVE / UPDATE HEMOPHILIA DETAILS
// =====================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {

    try {

      const data =
        allow(req.body, HEMOPHILIA_FIELDS);

      // legacy clients send one string; wrap it so the list check applies
      // Phase 7: field renamed targetJoints; the client may still send either name.
      if (data.targetJoint === undefined) data.targetJoint = data.targetJoints;
      delete data.targetJoints;
      if (typeof data.targetJoint === "string") data.targetJoint = [data.targetJoint];
      check(data, HEMOPHILIA_SPEC);

      // =====================================================
      // TARGET JOINT -- REQUIRED, MULTI-VALUE
      //
      // Accepts an array, and still accepts a single string so an older
      // client (or a record saved before this field became multi-value)
      // does not break. Normalized to a de-duplicated array either way.
      // =====================================================

      const normalizedTargetJoint = (
        Array.isArray(data.targetJoint)
          ? data.targetJoint
          : [data.targetJoint]
      )
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : ""
        )
        .filter(Boolean);

      const uniqueTargetJoint = [
        ...new Set(normalizedTargetJoint),
      ];

      if (uniqueTargetJoint.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "At least one target joint is required.",
          field: "targetJoint",
        });
      }

      // =====================================================
      // CHECK EXISTING DOCTOR ASSIGNMENT
      // =====================================================

      const existingDetails =
        await clinicalRecords.latest(req.userId);

      const existingDoctorId =
        existingDetails?.consultingDoctorId
          ? String(
              existingDetails.consultingDoctorId
            )
          : null;

      const submittedDoctorId =
        data.consultingDoctorId
          ? String(
              data.consultingDoctorId
            )
          : null;

      // -----------------------------------------------------
      // If a doctor is already assigned, the patient MUST
      // submit the SAME doctor.
      //
      // A patient cannot directly replace the doctor.
      // They must first request a release.
      // -----------------------------------------------------

      if (
        existingDoctorId &&
        submittedDoctorId !==
          existingDoctorId
      ) {
        return res.status(409).json({
          success: false,

          code:
            "DOCTOR_ASSIGNMENT_LOCKED",

          message:
            "Your consulting doctor is currently assigned to your profile. Please request a doctor change from your current doctor before selecting another doctor.",
        });
      }



      // ===============================================
      // FIND PATIENT PROFILE
      // ===============================================

      const profile =
        await PatientProfile.findOne({
          userId: req.userId,
        });

      if (!profile) {

        return res.status(404).json({
          message:
            "Profile not found",
        });

      }


      // ===============================================
      // VALIDATE CONSULTING DOCTOR
      // ===============================================

      let consultingDoctor =
        null;

      if (
        data.consultingDoctorId
      ) {

        consultingDoctor =
          await User.findOne({
            _id:
              data.consultingDoctorId,

            role: {
              $in: [
                "doctor",
                "clinician",
              ],
            },
          });

        if (!consultingDoctor) {

          return res.status(400).json({
            message:
              "Selected doctor is not available.",
          });

        }

      }


      // ===============================================
      // CLEAN DATA
      // ===============================================

      const { targetJoint: _legacy, ...rest } = data;
      const cleanData = {
  ...rest,

  userId: req.userId,

  patientId: profile.patientId,

  consultingDoctorId: consultingDoctor
    ? consultingDoctor._id
    : null,

  targetJoints: uniqueTargetJoint,

  // ---------------------------------------------
  // PHYSIOTHERAPY BOOLEAN VALUES
  // ---------------------------------------------
  //
  // If the patient is currently undergoing
  // physiotherapy, there is no need for a
  // "previous physiotherapy" answer.
  //
  // Therefore keep previousPhysiotherapy as null.
  //

  underPhysiotherapy:
    data.underPhysiotherapy === ""
      ? null
      : data.underPhysiotherapy,

  previousPhysiotherapy:
    data.previousPhysiotherapy === ""
      ? null
      : data.previousPhysiotherapy,
};
      // ===============================================
      // CREATE DETAILS
      // ===============================================

      // Append-only: first submission and edit are the same call. A concurrent
      // append loses on the (userId, version) unique index -> 409 below.
      const details =
        await clinicalRecords.append(
          req.userId,
          cleanData,
          req.userId
        );


      console.log(
        "================================="
      );

      console.log(
        "✅ Hemophilia details saved"
      );

      console.log(
        "Patient:",
        profile.patientId
      );

      console.log(
        "Consulting Doctor:",
        consultingDoctor
          ? displayName(consultingDoctor)
          : "Not selected"
      );

      console.log(
        "================================="
      );


      // ===============================================
      // LATEST SCREENING SESSION
      // ===============================================

      const screeningSession =
        await ScreeningSession.findOne({
          userId:
            req.userId,
        })
        .sort({
          createdAt: -1,
        });


      // ===============================================
      // LATEST ASSESSMENT
      // ===============================================

      const assessment =
        await Assessment.findOne({
          userId:
            req.userId,
        })
        .sort({
          createdAt: -1,
        });


      // ===============================================
      // BUILD FHIR BUNDLE
      // ===============================================

      const bundle =
        toFHIRBundle({
          patientProfile:
            profile,

          hemophiliaDetails:
            details,

          screeningSession,

          assessment,
        });


      // ===============================================
      // SAVE FHIR BUNDLE
      // ===============================================

      const savedBundle =
        await saveFHIRBundle(
          bundle
        );


      console.log(
        "================================="
      );

      console.log(
        "✅ Complete FHIR Bundle updated"
      );

      console.log(
        "Patient:",
        profile.patientId
      );

      console.log(
        "FHIR resources:",
        bundle.total
      );

      console.log(
        "================================="
      );


      // ===============================================
      // RESPONSE
      // ===============================================

      return res.status(200).json({

        message:
          "Hemophilia details saved successfully",

        details,

        fhir: {

          resourceType:
            savedBundle.resourceType,

          id:
            savedBundle.id,

          resources:
            bundle.total,

        },

      });

    } catch (err) {

      if (err.status === 400) return res.status(400).json({ message: err.message });

      // Lost the version race (E11000 on userId+version): client reloads and retries.
      if ((err.code ?? err.cause?.code ?? err.errorResponse?.code) === 11000)
        return res.status(409).json({
          success: false,
          code: "RECORD_VERSION_CONFLICT",
          message: "Your record changed while saving. Reload and try again.",
        });

      console.error(
        "❌ Hemophilia details save error:"
      );

      console.error(err);

      return res.status(500).json({

        message:
          "Failed to save hemophilia details",

        error:
          err.message,

      });

    }

  }
);


// =====================================================
// GET HEMOPHILIA SUMMARY
// =====================================================

router.get(
  "/summary",
  authMiddleware,
  async (req, res) => {

    try {

      const details =
        await clinicalRecords.latest(
          req.userId
        );


      if (!details) {

        return res.status(404).json({
          message:
            "No hemophilia details found",
        });

      }


      // ===============================================
      // DOCTOR
      // ===============================================

      let consultingDoctor =
        null;

      if (
        details.consultingDoctorId
      ) {

        consultingDoctor =
          await User.findById(
            details.consultingDoctorId,
            {
              firstName: 1,
              middleName: 1,
              lastName: 1,
              professionalId: 1,
            }
          ).lean();

      }


      // ===============================================
      // SUMMARY
      // ===============================================

      const summary = {

        type:
          details.type,

        severity:
          details.severity,

        ageAtDiagnosis:
          details.ageAtDiagnosis,

        currentFactorTherapy:
          details.currentFactorTherapy,

        jointsAffected:
          details.jointsAffected,

        targetJoint:
          details.targetJoints,

        targetJoints:
          details.targetJoints,

        bleedFrequency:
          details.bleedFrequency,

        bleedingPattern:
          details.bleedingPattern,

        lastBleedDate:
          details.lastBleedDate,

        underPhysiotherapy:
          details.underPhysiotherapy,

        previousPhysiotherapy:
          details.previousPhysiotherapy,

        physiotherapyLocation:
          details.physiotherapyLocation,

        physiotherapySessions:
          details.physiotherapySessions,

        physiotherapyDuration:
          details.physiotherapyDuration,

        physiotherapyBodyPart:
          details.physiotherapyBodyPart,

        physiotherapyTreatment:
          details.physiotherapyTreatment,

        physiotherapyEquipment:
          details.physiotherapyEquipment,

        physiotherapyHelping:
          details.physiotherapyHelping,

        physiotherapyProblems:
          details.physiotherapyProblems,

        mobilityLimitation:
          details.mobilityLimitation,

        assistiveDevices:
          details.assistiveDevices,

        patientNotes:
          details.patientNotes,

        consultingDoctor:
          consultingDoctor
            ? {
                id:
                  consultingDoctor._id,

                fullName:
                  displayName(consultingDoctor),

                professionalId:
                  consultingDoctor.professionalId,
              }
            : null,

        resources: [
          {
            label:
              "Hemophilia care guidelines",

            url:
              "https://example.com/hemophilia-care-guidelines",
          },

          {
            label:
              "Living with hemophilia",

            url:
              "https://example.com/living-with-hemophilia",
          },
        ],

      };


      return res.json({
        summary,
      });

    } catch (err) {

      console.error(
        "Hemophilia summary error:",
        err
      );

      return res.status(500).json({

        message:
          "Failed to fetch hemophilia summary",

        error:
          err.message,

      });

    }

  }
);
// =====================================================
// GET CURRENT CONSULTING DOCTOR / CHANGE REQUEST STATUS
// =====================================================
//
// GET /api/hemophilia-details/doctor-change-status
//
// Read-only endpoint used by the patient screen to know
// whether a doctor is currently assigned and whether a
// doctor-change request is already pending.
// =====================================================

router.get(
  "/doctor-change-status",
  authMiddleware,
  async (req, res) => {
    try {
      const patientUserId = req.userId;

      const details =
        (await clinicalRecords.latest(patientUserId))?.toObject();

      if (!details) {
        return res.json({
          success: true,
          assignedDoctor: null,
          pendingRequest: null,
        });
      }

      let assignedDoctor = null;

      if (details.consultingDoctorId) {
        assignedDoctor =
          await User.findById(
            details.consultingDoctorId
          )
            .select(
              "_id firstName middleName lastName professionalId role nameTranslations"
            )
            .lean();
      }

      const pendingRequest =
        await DoctorChangeRequest.findOne({
          patientUserId,
          status: "PENDING",
        })
          .select(
            "_id currentDoctorId status requestedAt"
          )
          .lean();

      return res.json({
        success: true,

        assignedDoctor: assignedDoctor
          ? {
              _id: assignedDoctor._id,
              fullName: displayName(assignedDoctor),
              professionalId:
                assignedDoctor.professionalId,
              role: assignedDoctor.role,
              nameTranslations:
                assignedDoctor.nameTranslations || {},
            }
          : null,

        pendingRequest: pendingRequest
          ? {
              _id: pendingRequest._id,
              currentDoctorId:
                pendingRequest.currentDoctorId,
              status: pendingRequest.status,
              requestedAt:
                pendingRequest.requestedAt,
            }
          : null,
      });
    } catch (error) {
      console.error(
        "GET DOCTOR CHANGE STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load doctor assignment status.",
      });
    }
  }
);


// =====================================================
// PATIENT REQUEST DOCTOR CHANGE
// =====================================================
//
// POST /api/hemophilia-details/doctor-change-request
//
// The patient does NOT choose the new doctor here.
// The current doctor must first release the patient.
// =====================================================

router.post(
  "/doctor-change-request",
  authMiddleware,
  async (req, res) => {
    try {
      const patientUserId =
        req.userId;

      const details =
        await clinicalRecords.latest(
          patientUserId
        );

      if (!details) {
        return res.status(404).json({
          success: false,
          message:
            "Hemophilia details not found.",
        });
      }

      if (
        !details.consultingDoctorId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You do not currently have a consulting doctor assigned.",
        });
      }

      // -----------------------------------------------
      // CHECK EXISTING PENDING REQUEST
      // -----------------------------------------------

      const existingRequest =
        await DoctorChangeRequest.findOne({
          patientUserId,
          status:
            "PENDING",
        });

      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message:
            "You already have a pending doctor change request.",
        });
      }

      // -----------------------------------------------
      // GET PATIENT ID
      // -----------------------------------------------

      const profile =
        await PatientProfile.findOne({
          userId:
            patientUserId,
        });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message:
            "Patient profile not found.",
        });
      }

      // -----------------------------------------------
      // OPTIONAL REASON
      // -----------------------------------------------

      const reason =
        typeof req.body?.reason ===
        "string"
          ? req.body.reason.trim()
          : "";

      // -----------------------------------------------
      // CREATE REQUEST
      // -----------------------------------------------

      const request =
        new DoctorChangeRequest({
          patientUserId,
          patientId:
            profile.patientId,

          currentDoctorId:
            details.consultingDoctorId,

          reason:
            reason || undefined,

          status:
            "PENDING",

          requestedAt:
            new Date(),
        });

      await request.save();

      return res.status(201).json({
        success: true,

        message:
          "Doctor change request sent to your current doctor.",

        request: {
          id:
            request._id,

          status:
            request.status,

          requestedAt:
            request.requestedAt,
        },
      });

    } catch (error) {

      console.error(
        "DOCTOR CHANGE REQUEST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to submit doctor change request.",
      });
    }
  }
);

module.exports = router;
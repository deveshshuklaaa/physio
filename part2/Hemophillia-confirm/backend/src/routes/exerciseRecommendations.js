const express = require("express");
const { displayName } = require("../utils/displayName");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../middleware/auth");
const { staffAuth } = require("../middleware/roleMiddleware");

const ClinicalRecord = require("../models/ClinicalRecord");
const PatientProfile = require("../models/PatientProfile");
const ScreeningSession = require("../models/ScreeningSession");
const Assessment = require("../models/Assessment");
const User = require("../models/User");
const PatientExerciseRecommendation = require("../models/PatientExerciseRecommendation");

const router = express.Router();

const PYTHON = process.env.PYTHON_EXECUTABLE || "python3";


// =====================================================
// PYTHON ML SCRIPT
// =====================================================

// Support both project layouts:
//
// backend/src/routes/exerciseRecommendations.js
//     -> backend/src/ml/recommendation_inference.py
//
// OR
//
// backend/src/routes/exerciseRecommendations.js
//     -> backend/ml/recommendation_inference.py

const PYTHON_CANDIDATES = [
  path.join(
    __dirname,
    "..",
    "ml",
    "recommendation_inference.py"
  ),

  path.join(
    __dirname,
    "..",
    "..",
    "ml",
    "recommendation_inference.py"
  ),
];


function getPythonScript() {
  const found = PYTHON_CANDIDATES.find(
    (file) => fs.existsSync(file)
  );

  return found || null;
}


// =====================================================
// JOINT NORMALIZATION
// =====================================================

const JOINT_NORMALIZE = {
  knee: "knee",
  ankle: "ankle",
  elbow: "elbow",
  shoulder: "shoulder",
  hip: "hip",
  wrist: "wrist",
};


function normalizeJoint(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return JOINT_NORMALIZE[key] || null;
}


// =====================================================
// EQUIPMENT NORMALIZATION
// =====================================================

function normalizeEquipment(value) {
  const v = String(value || "none")
    .trim()
    .toLowerCase();

  if (!v || v === "none") {
    return "none";
  }

  if (v.includes("knee")) {
    return "knee_brace";
  }

  if (
    v.includes("ankle") ||
    v.includes("foot")
  ) {
    return "ankle_brace";
  }

  if (v.includes("elbow")) {
    return "elbow_brace";
  }

  if (v.includes("wrist")) {
    return "wrist_support";
  }

  if (
    v.includes("cane") ||
    v.includes("walking stick")
  ) {
    return "cane";
  }

  if (v.includes("crutch")) {
    return "crutches";
  }

  if (v.includes("walker")) {
    return "walker";
  }

  return "none";
}


// =====================================================
// EXERCISE PROBLEM NORMALIZATION
// =====================================================

function normalizeProblem(value) {
  const v = String(value || "none")
    .trim()
    .toLowerCase();

  if (!v) {
    return "none";
  }

  if (v.includes("new bleeding")) {
    return "new bleeding";
  }

  if (v.includes("swelling")) {
    return "increased swelling";
  }

  if (v.includes("pain")) {
    return "pain";
  }

  if (v.includes("stiff")) {
    return "stiffness";
  }

  if (v.includes("weak")) {
    return "weakness";
  }

  if (v.includes("balance")) {
    return "balance_problem";
  }

  if (
    v.includes("tired") ||
    v.includes("fatigue")
  ) {
    return "fatigue_after_exercise";
  }

  return "none";
}


// =====================================================
// DAYS SINCE LAST BLEED
// =====================================================

function daysSince(date) {
  if (!date) {
    return 30;
  }

  const ms =
    Date.now() -
    new Date(date).getTime();

  const days = Math.floor(
    ms / 86400000
  );

  return Number.isFinite(days) && days >= 0
    ? days
    : 30;
}


// =====================================================
// SESSIONS PER WEEK
// =====================================================

function parseSessions(value) {
  const n = parseInt(
    String(value || "0"),
    10
  );

  return Number.isFinite(n)
    ? n
    : 0;
}


// =====================================================
// EMERGENCY SCREENING
// =====================================================

function isEmergencyScreening(session) {
  return (
    Array.isArray(
      session?.q1EmergencySymptoms
    ) &&
    session.q1EmergencySymptoms.length > 0
  );
}


// =====================================================
// BUILD ML INPUT
// =====================================================
//
// IMPORTANT:
// This must match the new 5-exercise dataset.
//
// Features:
//
// current_bleeding
// days_since_last_bleed_or_current_phase_day
// phase
// bleeding_pattern
// bleed_frequency
// affected_joint
// currently_undergoing_physiotherapy
// physiotherapy_location
// sessions_per_week
// session_duration
// current_treatment
// equipment_used
// physiotherapy_helping
// exercise_problem
//
// =====================================================

function buildMlPatient(
  details,
  session,
  joint
) {
  const physio =
    details?.underPhysiotherapy === true;

  const problemSource =
    Array.isArray(
      details?.physiotherapyProblems
    )
      ? details.physiotherapyProblems[0]
      : details?.physiotherapyProblems;

  return {
    current_bleeding:
      isEmergencyScreening(session)
        ? "yes"
        : "no",

    days_since_last_bleed_or_current_phase_day:
      daysSince(
        details?.lastBleedDate
      ),

    phase: "",

    bleeding_pattern:
      details?.bleedingPattern ||
      "none",

    bleed_frequency:
      details?.bleedFrequency ||
      "none",

    affected_joint: joint,

    currently_undergoing_physiotherapy:
      physio
        ? "yes"
        : "no",

    physiotherapy_location:
      physio
        ? details?.physiotherapyLocation ||
          "none"
        : "none",

    sessions_per_week:
      physio
        ? parseSessions(
            details?.physiotherapySessions
          )
        : 0,

    // IMPORTANT:
    // The new dataset uses categorical
    // session-duration values such as
    // "15-20 min".
    session_duration:
      physio
        ? String(
            details?.physiotherapyDuration ||
            "15-20 min"
          )
        : "15-20 min",

    current_treatment:
      details?.currentFactorTherapy ||
      "factor therapy",

    equipment_used:
      normalizeEquipment(
        details?.physiotherapyEquipment ||
        details?.assistiveDevices
      ),

    physiotherapy_helping:
      physio
        ? details?.physiotherapyHelping ||
          "not_applicable"
        : "not_applicable",

    exercise_problem:
      normalizeProblem(
        problemSource
      ),

    top_k: 2,
  };
}


// =====================================================
// RUN PYTHON ML
// =====================================================

function runPython(payload) {
  return new Promise(
    (resolve, reject) => {

      const script =
        getPythonScript();

      if (!script) {
        return reject(
          new Error(
            `ML inference script not found. Checked:\n${PYTHON_CANDIDATES.join("\n")}`
          )
        );
      }

      console.log(
        "[EXERCISE ML] Python:",
        PYTHON
      );

      console.log(
        "[EXERCISE ML] Script:",
        script
      );

      console.log(
        "[EXERCISE ML] Joint:",
        payload.affected_joint
      );

      const child = spawn(
        PYTHON,
        [script],
        {
          cwd: path.dirname(script),
          env: process.env,
          windowsHide: true,
        }
      );

      let stdout = "";
      let stderr = "";

      child.stdout.on(
        "data",
        (chunk) => {
          stdout += chunk.toString();
        }
      );

      child.stderr.on(
        "data",
        (chunk) => {
          stderr += chunk.toString();
        }
      );

      child.on(
        "error",
        (err) => {
          reject(
            new Error(
              `Unable to start Python ML inference: ${err.message}`
            )
          );
        }
      );

      child.on(
        "close",
        (code) => {

          if (code !== 0) {
            return reject(
              new Error(
                `Python ML inference failed (exit ${code}).\n${
                  stderr || stdout
                }`
              )
            );
          }

          try {

            const trimmed =
              stdout.trim();

            if (!trimmed) {
              return reject(
                new Error(
                  "Python ML inference returned empty output."
                )
              );
            }

            const result =
              JSON.parse(trimmed);

            if (result.error) {
              return reject(
                new Error(
                  result.error
                )
              );
            }

            resolve(result);

          } catch (error) {

            reject(
              new Error(
                `Invalid ML response. stdout=${
                  stdout || "<empty>"
                } stderr=${
                  stderr || "<empty>"
                }`
              )
            );
          }
        }
      );

      // Send JSON to Python
      child.stdin.write(
        JSON.stringify(payload)
      );

      child.stdin.end();
    }
  );
}


// =====================================================
// UNIQUE JOINTS
// =====================================================

function uniqueJoints(details) {

  const values =
    Array.isArray(
      details?.jointsAffected
    )
      ? details.jointsAffected
      : [];

  const normalized =
    values
      .map(normalizeJoint)
      .filter(Boolean);

  return [
    ...new Set(normalized)
  ];
}


// =====================================================
// GENERATE EXERCISES FOR PATIENT
// =====================================================

async function generateForPatient(
  patientUserId
) {

  const [
    details,
    profile,
    session
  ] = await Promise.all([

    ClinicalRecord
      .findOne({
        userId: patientUserId
      })
      .sort({ version: -1 })
      .lean(),

    PatientProfile
      .findOne({
        userId: patientUserId
      })
      .lean(),

    ScreeningSession
      .findOne({
        userId: patientUserId
      })
      .sort({
        createdAt: -1
      })
      .lean(),

  ]);


  // ===================================================
  // HEMOPHILIA DETAILS REQUIRED
  // ===================================================

  if (!details) {

    const error =
      new Error(
        "Hemophilia details not found."
      );

    error.status = 404;

    throw error;
  }


  // ===================================================
  // GET AFFECTED JOINTS
  // ===================================================

  const joints =
    uniqueJoints(details);


  if (joints.length === 0) {

    const error =
      new Error(
        "No affected joint is recorded for exercise recommendation."
      );

    error.status = 400;

    throw error;
  }


  // ===================================================
  // ML RESULTS
  // ===================================================

  const allNew = [];

  const safetyResults = [];


  // ===================================================
  // RUN ML FOR EACH AFFECTED JOINT
  // ===================================================

  for (const joint of joints) {

    const payload =
      buildMlPatient(
        details,
        session,
        joint
      );


    try {

      const result =
        await runPython(
          payload
        );


      console.log(
        "[EXERCISE ML] Success:",
        JSON.stringify(result)
      );


      safetyResults.push({

        joint,

        status:
          result.status,

        source:
          result.source ||
          "ML",

        guidance:
          result.guidance ||
          [],

      });


      // ------------------------------------------------
      // ONLY ADD WHAT PYTHON ML RETURNS
      // ------------------------------------------------

      const recommendations =
        Array.isArray(
          result.recommendations
        )
          ? result.recommendations
          : [];


      allNew.push(
        ...recommendations
      );


    } catch (mlError) {

      // =================================================
      // IMPORTANT:
      //
      // NO OLD RULE-BASED FALLBACK.
      //
      // We do NOT generate:
      //
      // Static quadriceps
      // Diaphragmatic breathing
      // Ankle pumps
      // Hip abduction
      // etc.
      //
      // If ML fails, no automatic exercise
      // recommendation is created.
      // =================================================

      console.error(
        "[EXERCISE ML] Inference failed:",
        mlError.message
      );


      const emergency =
        isEmergencyScreening(
          session
        );


      if (emergency) {

        safetyResults.push({

          joint,

          status:
            "ACTIVE_BLEEDING",

          source:
            "SAFETY_ENGINE",

          guidance: [
            "Exercise recommendation withheld because an emergency bleeding symptom was recorded."
          ],

        });

      } else {

        safetyResults.push({

          joint,

          status:
            "ML_INFERENCE_FAILED",

          source:
            "ML",

          warning:
            "Python ML inference was unavailable. No automatic exercise was generated.",

          guidance: [
            "No automatic exercise recommendation was created.",
            "Doctor/physiotherapist review is required."
          ],

        });

      }


      // IMPORTANT:
      // Do NOT push any fallback exercise.
      continue;
    }
  }


  // ===================================================
  // PATIENT ID
  // ===================================================

  const patientId =
    profile?.patientId ||
    String(patientUserId);


  // ===================================================
  // EXISTING RECOMMENDATIONS
  // ===================================================

  const existing =
    await PatientExerciseRecommendation
      .find({
        patientUserId
      })
      .lean();


  const existingMap =
    new Map(
      existing.map(
        (x) => [
          x.exerciseId,
          x
        ]
      )
    );


  const inserted = [];

  const skipped = [];


  // ===================================================
  // SAVE ML RECOMMENDATIONS
  // ===================================================

  for (
    const rec of allNew
  ) {

    // -----------------------------------------------
    // SECURITY CHECK:
    // Only allow the five new exercises.
    // -----------------------------------------------

    const allowedExercises = new Set([
      "heel_slides",
      "mini_squats",
      "seated_knee_extensions",
      "straight_leg_raises",
      "terminal_knee_extension",
    ]);


    if (
      !allowedExercises.has(
        String(
          rec.exerciseId || ""
        )
          .trim()
          .toLowerCase()
      )
    ) {

      console.warn(
        "[EXERCISE ML] Ignoring unsupported exercise:",
        rec.exerciseId,
        rec.exerciseName
      );

      continue;
    }


    // -----------------------------------------------
    // Only knee ML recommendations
    // -----------------------------------------------

    if (
      String(
        rec.joint || ""
      ).toLowerCase() !== "knee"
    ) {

      console.warn(
        "[EXERCISE ML] Ignoring non-knee ML exercise:",
        rec.exerciseName
      );

      continue;
    }


    // -----------------------------------------------
    // Existing record?
    // -----------------------------------------------

    const existingRecord =
      existingMap.get(
        rec.exerciseId
      );


    if (existingRecord) {

      skipped.push(
        rec.exerciseId
      );

      continue;
    }


    // -----------------------------------------------
    // CREATE DATABASE RECORD
    // -----------------------------------------------

    const created =
      await PatientExerciseRecommendation
        .create({

          patientUserId,

          patientId,

          exerciseId:
            rec.exerciseId,

          exerciseName:
            rec.exerciseName,

          type:
            rec.type || "JOINT",

          joint:
            rec.joint || "knee",

          category:
            rec.category || "Knee",

          source:
            "ML",

          status:
            "PENDING_DOCTOR_REVIEW",

          sets:
            Number(rec.sets) || 2,

          repetitionsOrDuration:
            String(
              rec.repetitionsOrDuration ||
              "10-15"
            ),

          frequency:
            String(
              rec.frequency ||
              "as advised"
            ),

          purpose:
            String(
              rec.purpose ||
              "ML-selected knee exercise."
            ),

          mlConfidence:
            rec.mlConfidence !== undefined &&
            rec.mlConfidence !== null
              ? Number(
                  rec.mlConfidence
                )
              : null,

          recommendationReason:
            `ML recommendation based on ${rec.joint || "knee"} condition, bleeding history, physiotherapy and recovery profile.`,

          recommendedAt:
            rec.recommendedAt
              ? new Date(
                  rec.recommendedAt
                )
              : new Date(),

        });


    inserted.push(
      created
    );
  }


  // ===================================================
  // RETURN RESULT
  // ===================================================

  return {

    status:
      "RECOMMENDATIONS_GENERATED",

    insertedCount:
      inserted.length,

    skippedExistingCount:
      skipped.length,

    recommendations:
      inserted,

    safetyResults,

  };
}


// =====================================================
// PATIENT: GET MY EXERCISES
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {

    try {

      const recommendations =
        await PatientExerciseRecommendation
          .find({

            patientUserId:
              req.userId,

            status: {
              $in: [
                "PENDING_DOCTOR_REVIEW",
                "ACTIVE"
              ]
            },

          })
          .sort({
            status: 1,
            recommendedAt: -1
          });


      return res.json({

        success: true,

        recommendations,

      });

    } catch (error) {

      console.error(
        "GET PATIENT EXERCISES ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to load exercise recommendations.",

      });
    }
  }
);


// =====================================================
// PATIENT: GENERATE / REFRESH RECOMMENDATIONS
// =====================================================

router.post(
  "/generate",
  authMiddleware,
  async (req, res) => {

    try {

      const result =
        await generateForPatient(
          req.userId
        );


      return res.json({

        success: true,

        ...result,

      });

    } catch (error) {

      console.error(
        "GENERATE EXERCISES ERROR:",
        error
      );


      return res.status(
        error.status || 500
      ).json({

        success: false,

        message:
          error.message ||
          "Failed to generate exercise recommendations.",

      });
    }
  }
);


// =====================================================
// DOCTOR: MANUAL EXERCISE CATALOG
// =====================================================
//
// IMPORTANT:
// This catalog is ONLY for explicit doctor manual
// prescription.
//
// It is NOT used by the automatic ML pipeline.
//
// =====================================================

const MANUAL_EXERCISE_CATALOG = [

  {
    exerciseId:
      "static_quadriceps",

    exerciseName:
      "Static quadriceps",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve quadriceps strength and knee stability.",
  },

  {
    exerciseId:
      "terminal_knee_extension",

    exerciseName:
      "Terminal knee extension",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve quadriceps strength and knee stability.",
  },

  {
    exerciseId:
      "heel_slides",

    exerciseName:
      "Heel slides",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve knee mobility.",
  },

  {
    exerciseId:
      "straight_leg_raise",

    exerciseName:
      "Straight leg raise",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve quadriceps strength and knee stability.",
  },

  {
    exerciseId:
      "seated_knee_extension",

    exerciseName:
      "Seated knee extension",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve quadriceps strength and knee control.",
  },

  {
    exerciseId:
      "mini_squats",

    exerciseName:
      "Mini squat",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve functional knee strength.",
  },

  {
    exerciseId:
      "squat",

    exerciseName:
      "Squat",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve functional knee strength and lower limb stability.",
  },













 
];


router.get(
  "/doctor/exercise-catalog",
  staffAuth,
  async (req, res) => {

    return res.json({

      success: true,

      exercises:
        MANUAL_EXERCISE_CATALOG,

    });
  }
);


// =====================================================
// DOCTOR: RECENT ML EXERCISE PREDICTIONS
// =====================================================

router.get(
  "/doctor/recent",
  staffAuth,
  async (req, res) => {

    try {

      const assigned =
        await ClinicalRecord
          .find({
            consultingDoctorId:
              req.userId,
            supersededBy: null,
          })
          .select(
            "userId patientId"
          )
          .lean();


      const patientIds =
        assigned.map(
          (x) => x.userId
        );


      if (
        patientIds.length === 0
      ) {

        return res.json({

          success: true,

          recommendations: [],

        });
      }


      const patientMap =
        new Map(
          assigned.map(
            (x) => [
              String(x.userId),
              x.patientId,
            ]
          )
        );


      const users =
        await User.find({
          _id: {
            $in: patientIds
          },
        })
        .select(
          "_id firstName middleName lastName"
        )
        .lean();


      const nameMap =
        new Map(
          users.map(
            (x) => [
              String(x._id),
              displayName(x),
            ]
          )
        );


      const recommendations =
        await PatientExerciseRecommendation
          .find({

            patientUserId: {
              $in: patientIds
            },

            source: {
              $in: [
                "ML",
                "RULE",
                "DOCTOR"
              ]
            },

            status: {
              $in: [
                "PENDING_DOCTOR_REVIEW",
                "ACTIVE"
              ]
            },

          })
          .sort({
            recommendedAt: -1
          })
          .limit(20)
          .lean();


      const result =
        recommendations.map(
          (item) => ({

            _id:
              item._id,

            patientUserId:
              item.patientUserId,

            patientId:
              patientMap.get(
                String(
                  item.patientUserId
                )
              ) ||
              item.patientId,

            patientName:
              nameMap.get(
                String(
                  item.patientUserId
                )
              ) ||
              "Unnamed patient",

            exerciseId:
              item.exerciseId,

            exerciseName:
              item.exerciseName,

            type:
              item.type,

            joint:
              item.joint,

            category:
              item.category,

            status:
              item.status,

            source:
              item.source,

            mlConfidence:
              item.mlConfidence,

            purpose:
              item.purpose,

            recommendedAt:
              item.recommendedAt,

            sets:
              item.sets,

            repetitionsOrDuration:
              item.repetitionsOrDuration,

            frequency:
              item.frequency,

          })
        );


      return res.json({

        success: true,

        recommendations:
          result,

      });

    } catch (error) {

      console.error(
        "GET RECENT EXERCISE PREDICTIONS ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to load recent exercise predictions.",

      });
    }
  }
);


// =====================================================
// DOCTOR: GET PENDING REVIEWS
// =====================================================

router.get(
  "/doctor/pending",
  staffAuth,
  async (req, res) => {

    try {

      const assigned =
        await ClinicalRecord
          .find({
            consultingDoctorId:
              req.userId,
            supersededBy: null,
          })
          .select(
            "userId patientId"
          )
          .lean();


      const patientIds =
        assigned.map(
          (x) => x.userId
        );


      if (
        patientIds.length === 0
      ) {

        return res.json({

          success: true,

          recommendations: [],

        });
      }


      const patientMap =
        new Map(
          assigned.map(
            (x) => [
              String(x.userId),
              x.patientId,
            ]
          )
        );


      const users =
        await User.find({
          _id: {
            $in: patientIds
          },
        })
        .select(
          "_id firstName middleName lastName"
        )
        .lean();


      const nameMap =
        new Map(
          users.map(
            (x) => [
              String(x._id),
              displayName(x),
            ]
          )
        );


      const recommendations =
        await PatientExerciseRecommendation
          .find({

            patientUserId: {
              $in: patientIds
            },

            status:
              "PENDING_DOCTOR_REVIEW",

          })
          .sort({
            recommendedAt: -1
          })
          .lean();


      const result =
        recommendations.map(
          (item) => ({

            ...item,

            patientName:
              nameMap.get(
                String(
                  item.patientUserId
                )
              ) ||
              "Unnamed patient",

            patientId:
              patientMap.get(
                String(
                  item.patientUserId
                )
              ) ||
              item.patientId,

          })
        );


      return res.json({

        success: true,

        recommendations:
          result,

      });

    } catch (error) {

      console.error(
        "GET DOCTOR EXERCISE REVIEWS ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to load exercise reviews.",

      });
    }
  }
);


// =====================================================
// VERIFY ASSIGNED DOCTOR
// =====================================================

async function verifyAssignedDoctor(
  req,
  patientUserId
) {

  const details =
    await ClinicalRecord
      .findOne({

        userId:
          patientUserId,

        consultingDoctorId:
          req.userId,

        supersededBy: null,

      })
      .lean();


  return Boolean(
    details
  );
}


// =====================================================
// DOCTOR: APPROVE
// =====================================================

router.post(
  "/doctor/:recommendationId/approve",
  staffAuth,
  async (req, res) => {

    try {

      const recommendation =
        await PatientExerciseRecommendation
          .findById(
            req.params.recommendationId
          );


      if (!recommendation) {

        return res.status(404).json({

          success: false,

          message:
            "Exercise recommendation not found.",

        });
      }


      if (
        !(await verifyAssignedDoctor(
          req,
          recommendation.patientUserId
        ))
      ) {

        return res.status(403).json({

          success: false,

          message:
            "This patient is not currently assigned to you.",

        });
      }


      if (
        recommendation.doctorRemoved
      ) {

        return res.status(409).json({

          success: false,

          message:
            "This exercise was previously removed and cannot be automatically reactivated.",

        });
      }


      recommendation.status =
        "ACTIVE";

      recommendation.doctorReviewedBy =
        req.userId;

      recommendation.doctorReviewedAt =
        new Date();

      recommendation.doctorNote =
        String(
          req.body?.doctorNote || ""
        ).trim();


      await recommendation.save();


      return res.json({

        success: true,

        message:
          "Exercise approved and activated.",

        recommendation,

      });

    } catch (error) {

      console.error(
        "APPROVE EXERCISE ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to approve exercise.",

      });
    }
  }
);


// =====================================================
// DOCTOR: REMOVE
// =====================================================

router.post(
  "/doctor/:recommendationId/remove",
  staffAuth,
  async (req, res) => {

    try {

      const recommendation =
        await PatientExerciseRecommendation
          .findById(
            req.params.recommendationId
          );


      if (!recommendation) {

        return res.status(404).json({

          success: false,

          message:
            "Exercise recommendation not found.",

        });
      }


      if (
        !(await verifyAssignedDoctor(
          req,
          recommendation.patientUserId
        ))
      ) {

        return res.status(403).json({

          success: false,

          message:
            "This patient is not currently assigned to you.",

        });
      }


      recommendation.status =
        "REMOVED";

      recommendation.doctorRemoved =
        true;

      recommendation.doctorReviewedBy =
        req.userId;

      recommendation.doctorReviewedAt =
        new Date();

      recommendation.doctorNote =
        String(
          req.body?.doctorNote || ""
        ).trim();


      await recommendation.save();


      return res.json({

        success: true,

        message:
          "Exercise removed from the patient's plan.",

        recommendation,

      });

    } catch (error) {

      console.error(
        "REMOVE EXERCISE ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to remove exercise.",

      });
    }
  }
);


// =====================================================
// DOCTOR: MANUALLY ADD EXERCISE
// =====================================================
//
// Accepts either:
//
// Mongo userId
//
// OR
//
// Public Patient ID (PATxxxxxx)
//
// =====================================================

router.post(
  "/doctor/patient/:patientIdentifier/add",
  staffAuth,
  async (req, res) => {

    try {

      const patientIdentifier =
        String(
          req.params.patientIdentifier || ""
        ).trim();


      let profile = null;


      // -----------------------------------------------
      // PATIENT PUBLIC ID
      // -----------------------------------------------

      if (
        patientIdentifier
          .toUpperCase()
          .startsWith("PAT")
      ) {

        profile =
          await PatientProfile
            .findOne({

              patientId:
                patientIdentifier
                  .toUpperCase(),

            })
            .lean();

      } else {

        // ---------------------------------------------
        // MONGO USER ID
        // ---------------------------------------------

        profile =
          await PatientProfile
            .findOne({

              userId:
                patientIdentifier,

            })
            .lean();
      }


      if (!profile) {

        return res.status(404).json({

          success: false,

          message:
            "Patient profile not found.",

        });
      }


      const patientUserId =
        profile.userId;


      // -----------------------------------------------
      // VERIFY DOCTOR
      // -----------------------------------------------

      if (
        !(await verifyAssignedDoctor(
          req,
          patientUserId
        ))
      ) {

        return res.status(403).json({

          success: false,

          message:
            "This patient is not currently assigned to you.",

        });
      }


      // -----------------------------------------------
      // REQUIRED FIELDS
      // -----------------------------------------------

      const required = [
        "exerciseId",
        "exerciseName",
        "category"
      ];


      for (
        const field of required
      ) {

        if (
          !req.body?.[field]
        ) {

          return res.status(400).json({

            success: false,

            message:
              `${field} is required.`,

          });
        }
      }


      // legacy catalog ids -> engine/ML ids (YouTube + Start key off these)
      const LEGACY_IDS = { mini_squat: "mini_squats", terminal_knee_extensions: "terminal_knee_extension" };
      const rawId = String(req.body.exerciseId).trim();
      const exerciseId = LEGACY_IDS[rawId] || rawId;
      if (!MANUAL_EXERCISE_CATALOG.some((x) => x.exerciseId === exerciseId)) {
        return res.status(400).json({ success: false, message: "exerciseId is not in the exercise catalog." });
      }


      // -----------------------------------------------
      // VALIDATE SUBMITTED FIELDS (server-side, strict)
      // -----------------------------------------------

      const b = req.body || {};
      const bad = (m) => res.status(400).json({ success: false, message: m });
      const optStr = (k, max) => {
        if (b[k] === undefined || b[k] === null || b[k] === "") return undefined;
        if (typeof b[k] !== "string" && typeof b[k] !== "number") return null;
        const t = String(b[k]).trim();
        return t.length > max ? null : t || undefined;
      };

      for (const k of ["exerciseName", "category"]) {
        if (typeof b[k] !== "string" || !b[k].trim() || b[k].trim().length > 120) {
          return bad(`${k} is invalid.`);
        }
      }

      const f = {
        exerciseName: b.exerciseName.trim(),
        category: b.category.trim(),
        purpose: optStr("purpose", 500),
        repetitionsOrDuration: optStr("repetitionsOrDuration", 60),
        frequency: optStr("frequency", 100),
        doctorNote: optStr("doctorNote", 1000),
        joint: optStr("joint", 60),
      };
      for (const k of Object.keys(f)) {
        if (f[k] === null) return bad(`${k} is invalid.`);
      }

      if (b.type !== undefined && b.type !== null && !["JOINT", "GENERAL"].includes(b.type)) {
        return bad("type is invalid.");
      }
      f.type = b.type || undefined;

      if (b.sets !== undefined && b.sets !== null && b.sets !== "") {
        const n = Number(b.sets);
        if (!Number.isInteger(n) || n < 1 || n > 20) return bad("sets must be a whole number from 1 to 20.");
        f.sets = n;
      }


      // -----------------------------------------------
      // CHECK EXISTING -> OVERWRITE (doctor beats rule engine)
      // -----------------------------------------------

      const existing =
        await PatientExerciseRecommendation
          .findOne({

            patientUserId,

            exerciseId,

          });


      if (existing) {

        for (const k of Object.keys(f)) {
          if (f[k] !== undefined) existing[k] = f[k];
        }

        existing.status = "ACTIVE";
        existing.source = "DOCTOR";
        existing.doctorRemoved = false;
        existing.doctorReviewedBy = req.userId;
        existing.doctorReviewedAt = new Date();
        // patient list sorts recommendedAt desc -> first place
        existing.recommendedAt = new Date();

        await existing.save();

        return res.json({

          success: true,

          updated: true,

          message:
            "Successful.",

          recommendation:
            existing,

        });
      }


      // -----------------------------------------------
      // CREATE DOCTOR PRESCRIPTION
      // -----------------------------------------------

      const created =
        await PatientExerciseRecommendation
          .create({

            patientUserId,

            patientId:
              profile.patientId ||
              String(
                patientUserId
              ),

            exerciseId,

            exerciseName: f.exerciseName,

            type: f.type || "JOINT",

            joint: f.joint || null,

            category: f.category,

            source:
              "DOCTOR",

            status:
              "ACTIVE",

            sets: f.sets || 1,

            repetitionsOrDuration: f.repetitionsOrDuration || "10",

            frequency: f.frequency || "as advised",

            purpose: f.purpose || "Doctor-selected exercise",

            recommendationReason:
              "Manually prescribed by consulting doctor.",

            doctorReviewedBy:
              req.userId,

            doctorReviewedAt:
              new Date(),

            doctorNote: f.doctorNote || "",

          });


      return res.status(201).json({

        success: true,

        updated: false,

        message:
          "Exercise prescribed and added to the patient's active plan.",

        recommendation:
          created,

      });

    } catch (error) {

      console.error(
        "ADD DOCTOR EXERCISE ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to add exercise.",

      });
    }
  }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;

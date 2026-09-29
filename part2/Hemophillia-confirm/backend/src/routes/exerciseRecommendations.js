// const express = require("express");
// const { spawn } = require("child_process");
// const path = require("path");
// const fs = require("fs");

// const authMiddleware = require("../middleware/auth");
// const { staffAuth } = require("../middleware/roleMiddleware");
// const HemophiliaDetails = require("../models/HemophiliaDetails");
// const PatientProfile = require("../models/PatientProfile");
// const ScreeningSession = require("../models/ScreeningSession");
// const Assessment = require("../models/Assessment");
// const User = require("../models/User");
// const PatientExerciseRecommendation = require("../models/PatientExerciseRecommendation");

// const router = express.Router();
// const PYTHON = process.env.PYTHON_EXECUTABLE || "python3";

// // Support both project layouts:
// // backend/src/routes/exerciseRecommendations.js -> backend/src/ml/...
// // backend/src/routes/exerciseRecommendations.js -> backend/ml/...
// const PYTHON_CANDIDATES = [
//   path.join(__dirname, "..", "ml", "recommendation_inference.py"),
//   path.join(__dirname, "..", "..", "ml", "recommendation_inference.py"),
// ];

// function getPythonScript() {
//   const found = PYTHON_CANDIDATES.find((file) => fs.existsSync(file));
//   return found || null;
// }

// const JOINT_NORMALIZE = {
//   knee: "knee",
//   ankle: "ankle",
//   elbow: "elbow",
//   shoulder: "shoulder",
//   hip: "hip",
//   wrist: "wrist",
// };

// function normalizeJoint(value) {
//   const key = String(value || "").trim().toLowerCase();
//   return JOINT_NORMALIZE[key] || null;
// }

// function normalizeEquipment(value) {
//   const v = String(value || "none").trim().toLowerCase();
//   if (!v || v === "none") return "none";
//   if (v.includes("knee")) return "knee_brace";
//   if (v.includes("ankle") || v.includes("foot")) return "ankle_brace";
//   if (v.includes("elbow")) return "elbow_brace";
//   if (v.includes("wrist")) return "wrist_support";
//   if (v.includes("cane") || v.includes("walking stick")) return "cane";
//   if (v.includes("crutch")) return "crutches";
//   if (v.includes("walker")) return "walker";
//   return "none";
// }

// function normalizeProblem(value) {
//   const v = String(value || "none").trim().toLowerCase();
//   if (!v) return "none";
//   if (v.includes("new bleeding")) return "new bleeding";
//   if (v.includes("swelling")) return "increased swelling";
//   if (v.includes("pain")) return "pain";
//   if (v.includes("stiff")) return "stiffness";
//   if (v.includes("weak")) return "weakness";
//   if (v.includes("balance")) return "balance_problem";
//   if (v.includes("tired") || v.includes("fatigue")) return "fatigue_after_exercise";
//   return "none";
// }

// function daysSince(date) {
//   if (!date) return 30;
//   const ms = Date.now() - new Date(date).getTime();
//   const days = Math.floor(ms / 86400000);
//   return Number.isFinite(days) && days >= 0 ? days : 30;
// }

// function parseSessions(value) {
//   const n = parseInt(String(value || "0"), 10);
//   return Number.isFinite(n) ? n : 0;
// }

// function parseDuration(value) {
//   const n = parseInt(String(value || "0"), 10);
//   return Number.isFinite(n) ? n : 0;
// }

// function isEmergencyScreening(session) {
//   return Array.isArray(session?.q1EmergencySymptoms) && session.q1EmergencySymptoms.length > 0;
// }

// function buildMlPatient(details, session, joint) {
//   const physio = details?.underPhysiotherapy === true;
//   const problemSource = Array.isArray(details?.physiotherapyProblems)
//     ? details.physiotherapyProblems[0]
//     : details?.physiotherapyProblems;

//   return {
//     current_bleeding: isEmergencyScreening(session) ? "yes" : "no",
//     days_since_last_bleed_or_current_phase_day: daysSince(details?.lastBleedDate),
//     bleeding_pattern: details?.bleedingPattern || "none",
//     bleed_frequency: details?.bleedFrequency || "none",
//     affected_joint: joint,
//     currently_undergoing_physiotherapy: physio ? "yes" : "no",
//     physiotherapy_location: physio ? details?.physiotherapyLocation || "none" : "none",
//     sessions_per_week: physio ? parseSessions(details?.physiotherapySessions) : 0,
//     session_duration: physio ? parseDuration(details?.physiotherapyDuration) : 0,
//     current_treatment: details?.currentFactorTherapy || "factor_replacement",
//     equipment_used: normalizeEquipment(
//       details?.physiotherapyEquipment || details?.assistiveDevices
//     ),
//     physiotherapy_helping: physio ? details?.physiotherapyHelping || "not_applicable" : "not_applicable",
//     exercise_problem: normalizeProblem(problemSource),
//     top_k: 2,
//   };
// }

// function runPython(payload) {
//   return new Promise((resolve, reject) => {
//     const script = getPythonScript();

//     if (!script) {
//       return reject(
//         new Error(
//           `ML inference script not found. Checked:\n${PYTHON_CANDIDATES.join("\n")}`
//         )
//       );
//     }

//     console.log("[EXERCISE ML] Python:", PYTHON);
//     console.log("[EXERCISE ML] Script:", script);
//     console.log("[EXERCISE ML] Joint:", payload.affected_joint);

//     const child = spawn(PYTHON, [script], {
//       cwd: path.dirname(script),
//       env: process.env,
//       windowsHide: true,
//     });

//     let stdout = "";
//     let stderr = "";

//     child.stdout.on("data", (chunk) => {
//       stdout += chunk.toString();
//     });

//     child.stderr.on("data", (chunk) => {
//       stderr += chunk.toString();
//     });

//     child.on("error", (err) => {
//       reject(new Error(`Unable to start Python ML inference: ${err.message}`));
//     });

//     child.on("close", (code) => {
//       if (code !== 0) {
//         return reject(
//           new Error(
//             `Python ML inference failed (exit ${code}).\n${stderr || stdout}`
//           )
//         );
//       }

//       try {
//         const result = JSON.parse(stdout.trim());
//         if (result.error) return reject(new Error(result.error));
//         resolve(result);
//       } catch (error) {
//         reject(
//           new Error(
//             `Invalid ML response. stdout=${stdout || "<empty>"} stderr=${stderr || "<empty>"}`
//           )
//         );
//       }
//     });

//     child.stdin.write(JSON.stringify(payload));
//     child.stdin.end();
//   });
// }

// // ---------------------------------------------------------
// // SAFE LOCAL FALLBACK
// // ---------------------------------------------------------
// // This is used only when Python/model files are unavailable.
// // It guarantees the application never silently shows an empty
// // exercise plan after clinical details were successfully saved.
// // These are still sent to DOCTOR REVIEW and never become ACTIVE
// // automatically.
// const FALLBACK_EXERCISES = {
//   knee: {
//     exerciseId: "static_quadriceps",
//     exerciseName: "Static quadriceps",
//     category: "Knee",
//     purpose: "Improve quadriceps strength and knee stability.",
//   },
//   ankle: {
//     exerciseId: "ankle_pumps",
//     exerciseName: "Ankle pumps",
//     category: "Ankle",
//     purpose: "Improve ankle mobility and stability.",
//   },
//   elbow: {
//     exerciseId: "elbow_flexion_extension",
//     exerciseName: "Elbow flexion-extension",
//     category: "Elbow",
//     purpose: "Maintain elbow mobility.",
//   },
//   shoulder: {
//     exerciseId: "shoulder_rotations",
//     exerciseName: "Shoulder rotations",
//     category: "Shoulder",
//     purpose: "Improve shoulder mobility.",
//   },
//   hip: {
//     exerciseId: "hip_abduction",
//     exerciseName: "Hip abduction",
//     category: "Hip",
//     purpose: "Improve lower limb strength.",
//   },
// };

// const GENERAL_FALLBACK = {
//   exerciseId: "diaphragmatic_breathing",
//   exerciseName: "Diaphragmatic breathing",
//   category: "Breathing",
//   purpose: "Promote relaxation.",
// };

// function localFallbackRecommendations(joint, details) {
//   const phaseDays = daysSince(details?.lastBleedDate);
//   const cautious = phaseDays <= 7;
//   const jointExercise = FALLBACK_EXERCISES[joint];
//   const result = [];

//   if (jointExercise) {
//     result.push({
//       exerciseId: jointExercise.exerciseId,
//       exerciseName: jointExercise.exerciseName,
//       type: "JOINT",
//       joint,
//       category: jointExercise.category,
//       source: "RULE_FALLBACK",
//       status: "PENDING_DOCTOR_REVIEW",
//       mlConfidence: null,
//       sets: cautious ? 1 : 2,
//       repetitionsOrDuration: "10-15",
//       frequency: cautious ? "3 times/week" : "5 times/week",
//       purpose: jointExercise.purpose,
//       recommendedAt: new Date().toISOString(),
//     });
//   }

//   // One general exercise is enough; MongoDB deduplication prevents it
//   // from being inserted repeatedly when several joints are affected.
//   result.push({
//     exerciseId: GENERAL_FALLBACK.exerciseId,
//     exerciseName: GENERAL_FALLBACK.exerciseName,
//     type: "GENERAL",
//     joint: null,
//     category: GENERAL_FALLBACK.category,
//     source: "RULE_FALLBACK",
//     status: "PENDING_DOCTOR_REVIEW",
//     mlConfidence: null,
//     sets: 1,
//     repetitionsOrDuration: "5-10 minutes",
//     frequency: cautious ? "3 times/week" : "daily",
//     purpose: GENERAL_FALLBACK.purpose,
//     recommendedAt: new Date().toISOString(),
//   });

//   return result;
// }
// function uniqueJoints(details) {
//   const values = Array.isArray(details?.jointsAffected) ? details.jointsAffected : [];
//   const normalized = values.map(normalizeJoint).filter(Boolean);
//   return [...new Set(normalized)];
// }

// async function generateForPatient(patientUserId) {
//   const [details, profile, session] = await Promise.all([
//     HemophiliaDetails.findOne({ userId: patientUserId }).lean(),
//     PatientProfile.findOne({ userId: patientUserId }).lean(),
//     ScreeningSession.findOne({ userId: patientUserId }).sort({ createdAt: -1 }).lean(),
//   ]);

//   if (!details) {
//     const error = new Error("Hemophilia details not found.");
//     error.status = 404;
//     throw error;
//   }

//   const joints = uniqueJoints(details);
//   if (joints.length === 0) {
//     const error = new Error("No affected joint is recorded for exercise recommendation.");
//     error.status = 400;
//     throw error;
//   }

//   const allNew = [];
//   const safetyResults = [];

//   for (const joint of joints) {
//     const payload = buildMlPatient(details, session, joint);

//     try {
//       const result = await runPython(payload);
//       safetyResults.push({
//         joint,
//         status: result.status,
//         source: result.source || "ML",
//         guidance: result.guidance || [],
//       });
//       allNew.push(...(result.recommendations || []));
//     } catch (mlError) {
//       console.error("[EXERCISE ML] Inference unavailable; using safe fallback:", mlError.message);

//       const emergency = isEmergencyScreening(session);
//       if (emergency) {
//         safetyResults.push({
//           joint,
//           status: "ACTIVE_BLEEDING",
//           source: "SAFETY_ENGINE",
//           guidance: ["Exercise recommendation withheld because an emergency bleeding symptom was recorded."],
//         });
//         continue;
//       }

//       const fallback = localFallbackRecommendations(joint, details);
//       safetyResults.push({
//         joint,
//         status: "RECOMMENDATIONS_GENERATED",
//         source: "RULE_FALLBACK",
//         warning: "Python/model inference was unavailable; doctor review is still required.",
//         guidance: [],
//       });
//       allNew.push(...fallback);
//     }
//   }

//   const patientId = profile?.patientId || String(patientUserId);
//   const existing = await PatientExerciseRecommendation.find({ patientUserId }).lean();
//   const existingMap = new Map(existing.map((x) => [x.exerciseId, x]));
//   const inserted = [];
//   const skipped = [];

//   for (const rec of allNew) {
//     const existingRecord = existingMap.get(rec.exerciseId);

//     if (existingRecord) {
//       skipped.push(rec.exerciseId);
//       continue;
//     }

//     const created = await PatientExerciseRecommendation.create({
//       patientUserId,
//       patientId,
//       exerciseId: rec.exerciseId,
//       exerciseName: rec.exerciseName,
//       type: rec.type,
//       joint: rec.joint,
//       category: rec.category,
//       source: rec.source,
//       status: "PENDING_DOCTOR_REVIEW",
//       sets: rec.sets,
//       repetitionsOrDuration: rec.repetitionsOrDuration,
//       frequency: rec.frequency,
//       purpose: rec.purpose,
//       mlConfidence: rec.mlConfidence,
//       recommendationReason: `ML recommendation based on ${rec.joint || "general"} condition, bleeding history, physiotherapy and recovery profile.`,
//       recommendedAt: rec.recommendedAt ? new Date(rec.recommendedAt) : new Date(),
//     });
//     inserted.push(created);
//   }

//   return {
//     status: "RECOMMENDATIONS_GENERATED",
//     insertedCount: inserted.length,
//     skippedExistingCount: skipped.length,
//     recommendations: inserted,
//     safetyResults,
//   };
// }

// // =====================================================
// // PATIENT: GET MY EXERCISES
// // =====================================================
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const recommendations = await PatientExerciseRecommendation.find({
//       patientUserId: req.userId,
//       status: { $in: ["PENDING_DOCTOR_REVIEW", "ACTIVE"] },
//     }).sort({ status: 1, recommendedAt: -1 });

//     return res.json({ success: true, recommendations });
//   } catch (error) {
//     console.error("GET PATIENT EXERCISES ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to load exercise recommendations." });
//   }
// });

// // =====================================================
// // PATIENT: GENERATE / REFRESH RECOMMENDATIONS
// // =====================================================
// router.post("/generate", authMiddleware, async (req, res) => {
//   try {
//     const result = await generateForPatient(req.userId);
//     return res.json({ success: true, ...result });
//   } catch (error) {
//     console.error("GENERATE EXERCISES ERROR:", error);
//     return res.status(error.status || 500).json({
//       success: false,
//       message: error.message || "Failed to generate exercise recommendations.",
//     });
//   }
// });

// // =====================================================
// // DOCTOR: GET PENDING REVIEWS FOR ASSIGNED PATIENTS
// // =====================================================
// /* ============================================================
//    DOCTOR: RECENT ML EXERCISE PREDICTIONS FOR DASHBOARD
//    Only a small recent summary is returned here.
//    Full exercise records are shown in Patient Research.
//    ============================================================ */
// router.get("/doctor/recent", staffAuth, async (req, res) => {
//   try {
//     const assigned = await HemophiliaDetails.find({
//       consultingDoctorId: req.userId,
//     })
//       .select("userId patientId")
//       .lean();

//     const patientIds = assigned.map((x) => x.userId);

//     if (patientIds.length === 0) {
//       return res.json({
//         success: true,
//         recommendations: [],
//       });
//     }

//     const patientMap = new Map(
//       assigned.map((x) => [
//         String(x.userId),
//         x.patientId,
//       ])
//     );

//     const users = await User.find({
//       _id: { $in: patientIds },
//     })
//       .select("_id fullName")
//       .lean();

//     const nameMap = new Map(
//       users.map((x) => [
//         String(x._id),
//         x.fullName,
//       ])
//     );

//     const recommendations =
//       await PatientExerciseRecommendation.find({
//         patientUserId: { $in: patientIds },
//         source: { $in: ["ML", "RULE_FALLBACK"] },
//         status: {
//           $in: [
//             "PENDING_DOCTOR_REVIEW",
//             "ACTIVE",
//           ],
//         },
//       })
//         .sort({ recommendedAt: -1 })
//         .limit(8)
//         .lean();

//     const result = recommendations.map((item) => ({
//       _id: item._id,
//       patientUserId: item.patientUserId,
//       patientId:
//         patientMap.get(String(item.patientUserId)) ||
//         item.patientId,
//       patientName:
//         nameMap.get(String(item.patientUserId)) ||
//         "Unnamed patient",
//       exerciseId: item.exerciseId,
//       exerciseName: item.exerciseName,
//       type: item.type,
//       joint: item.joint,
//       category: item.category,
//       status: item.status,
//       source: item.source,
//       mlConfidence: item.mlConfidence,
//       purpose: item.purpose,
//       recommendedAt: item.recommendedAt,
//       sets: item.sets,
//       repetitionsOrDuration: item.repetitionsOrDuration,
//       frequency: item.frequency,
//     }));

//     return res.json({
//       success: true,
//       recommendations: result,
//     });
//   } catch (error) {
//     console.error("GET RECENT EXERCISE PREDICTIONS ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load recent exercise predictions.",
//     });
//   }
// });

// router.get("/doctor/pending", staffAuth, async (req, res) => {
//   try {
//     const assigned = await HemophiliaDetails.find({
//       consultingDoctorId: req.userId,
//     }).select("userId patientId").lean();

//     const patientIds = assigned.map((x) => x.userId);
//     if (patientIds.length === 0) {
//       return res.json({ success: true, recommendations: [] });
//     }

//     const patientMap = new Map(assigned.map((x) => [String(x.userId), x.patientId]));
//     const users = await User.find({ _id: { $in: patientIds } }).select("_id fullName").lean();
//     const nameMap = new Map(users.map((x) => [String(x._id), x.fullName]));

//     const recommendations = await PatientExerciseRecommendation.find({
//       patientUserId: { $in: patientIds },
//       status: "PENDING_DOCTOR_REVIEW",
//     }).sort({ recommendedAt: -1 }).lean();

//     const result = recommendations.map((item) => ({
//       ...item,
//       patientName: nameMap.get(String(item.patientUserId)) || "Unnamed patient",
//       patientId: patientMap.get(String(item.patientUserId)) || item.patientId,
//     }));

//     return res.json({ success: true, recommendations: result });
//   } catch (error) {
//     console.error("GET DOCTOR EXERCISE REVIEWS ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to load exercise reviews." });
//   }
// });

// async function verifyAssignedDoctor(req, patientUserId) {
//   const details = await HemophiliaDetails.findOne({
//     userId: patientUserId,
//     consultingDoctorId: req.userId,
//   }).lean();
//   return Boolean(details);
// }

// // =====================================================
// // DOCTOR: APPROVE
// // =====================================================
// router.post("/doctor/:recommendationId/approve", staffAuth, async (req, res) => {
//   try {
//     const recommendation = await PatientExerciseRecommendation.findById(req.params.recommendationId);
//     if (!recommendation) return res.status(404).json({ success: false, message: "Exercise recommendation not found." });

//     if (!(await verifyAssignedDoctor(req, recommendation.patientUserId))) {
//       return res.status(403).json({ success: false, message: "This patient is not currently assigned to you." });
//     }

//     if (recommendation.doctorRemoved) {
//       return res.status(409).json({ success: false, message: "This exercise was previously removed and cannot be automatically reactivated." });
//     }

//     recommendation.status = "ACTIVE";
//     recommendation.doctorReviewedBy = req.userId;
//     recommendation.doctorReviewedAt = new Date();
//     recommendation.doctorNote = String(req.body?.doctorNote || "").trim();
//     await recommendation.save();

//     return res.json({ success: true, message: "Exercise approved and activated.", recommendation });
//   } catch (error) {
//     console.error("APPROVE EXERCISE ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to approve exercise." });
//   }
// });

// // =====================================================
// // DOCTOR: REMOVE
// // =====================================================
// router.post("/doctor/:recommendationId/remove", staffAuth, async (req, res) => {
//   try {
//     const recommendation = await PatientExerciseRecommendation.findById(req.params.recommendationId);
//     if (!recommendation) return res.status(404).json({ success: false, message: "Exercise recommendation not found." });

//     if (!(await verifyAssignedDoctor(req, recommendation.patientUserId))) {
//       return res.status(403).json({ success: false, message: "This patient is not currently assigned to you." });
//     }

//     recommendation.status = "REMOVED";
//     recommendation.doctorRemoved = true;
//     recommendation.doctorReviewedBy = req.userId;
//     recommendation.doctorReviewedAt = new Date();
//     recommendation.doctorNote = String(req.body?.doctorNote || "").trim();
//     await recommendation.save();

//     return res.json({ success: true, message: "Exercise removed from the patient's plan.", recommendation });
//   } catch (error) {
//     console.error("REMOVE EXERCISE ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to remove exercise." });
//   }
// });

// // =====================================================
// // DOCTOR: MANUALLY ADD EXERCISE
// // =====================================================
// router.post("/doctor/patient/:patientUserId/add", staffAuth, async (req, res) => {
//   try {
//     const patientUserId = req.params.patientUserId;
//     if (!(await verifyAssignedDoctor(req, patientUserId))) {
//       return res.status(403).json({ success: false, message: "This patient is not currently assigned to you." });
//     }

//     const required = ["exerciseId", "exerciseName", "category"];
//     for (const field of required) {
//       if (!req.body?.[field]) {
//         return res.status(400).json({ success: false, message: `${field} is required.` });
//       }
//     }

//     const profile = await PatientProfile.findOne({ userId: patientUserId }).lean();
//     const existing = await PatientExerciseRecommendation.findOne({
//       patientUserId,
//       exerciseId: req.body.exerciseId,
//     });

//     if (existing) {
//       return res.status(409).json({ success: false, message: "This exercise is already in the patient's plan." });
//     }

//     const created = await PatientExerciseRecommendation.create({
//       patientUserId,
//       patientId: profile?.patientId || String(patientUserId),
//       exerciseId: String(req.body.exerciseId),
//       exerciseName: String(req.body.exerciseName),
//       type: req.body.type === "GENERAL" ? "GENERAL" : "JOINT",
//       joint: req.body.joint || null,
//       category: String(req.body.category),
//       source: "DOCTOR",
//       status: "ACTIVE",
//       sets: Number(req.body.sets) || 1,
//       repetitionsOrDuration: String(req.body.repetitionsOrDuration || "10"),
//       frequency: String(req.body.frequency || "as advised"),
//       schedule: req.body.schedule || null,
//       purpose: String(req.body.purpose || "Doctor-selected exercise"),
//       recommendationReason: "Manually added by consulting doctor.",
//       doctorReviewedBy: req.userId,
//       doctorReviewedAt: new Date(),
//       doctorNote: String(req.body.doctorNote || "").trim(),
//     });

//     return res.status(201).json({ success: true, message: "Exercise added to the patient's plan.", recommendation: created });
//   } catch (error) {
//     console.error("ADD DOCTOR EXERCISE ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to add exercise." });
//   }
// });

// module.exports = router;






















// const express = require("express");

// const authMiddleware = require("../middleware/auth");
// const { staffAuth } = require("../middleware/roleMiddleware");
// const HemophiliaDetails = require("../models/HemophiliaDetails");
// const PatientProfile = require("../models/PatientProfile");
// const ScreeningSession = require("../models/ScreeningSession");
// const Assessment = require("../models/Assessment");
// const User = require("../models/User");
// const PatientExerciseRecommendation = require("../models/PatientExerciseRecommendation");

// const router = express.Router();

// // =====================================================
// // G2-C5 CLINICAL SAFETY GATE
// // Ported verbatim from backend/ml/recommendation_inference.py:38-115
// // (norm(), safety_engine()). Thresholds and set membership are copied
// // literally -- do NOT re-tune, round, or reorder. Equivalence proved by
// // backend/src/routes/safety_engine_equivalence.test.js.
// // =====================================================
// function norm(value, dflt = "") {
//   if (value === null || value === undefined) return dflt;
//   return String(value).trim();
// }

// function parsePainLevel(raw) {
//   // ponytail: mirrors python's `float(patient.get("pain_level", 0) or 0)`
//   // wrapped in try/except -> 0. Real payloads are numbers or numeric
//   // strings; non-numeric truthy strings fall back to 0, same as python's
//   // except branch.
//   let v = raw === undefined || raw === null ? 0 : raw;
//   if (v === "" || v === 0 || v === "0") v = 0;
//   const n = Number(v);
//   return Number.isFinite(n) ? n : 0;
// }

// const ACTIVE_BLEEDING_STATES = new Set(["yes", "active", "joint_bleed", "muscle_bleed"]);
// const ACTIVE_BLEEDING_TYPES = new Set(["joint_bleed", "muscle_bleed"]);
// const ACTIVE_BLEEDING_PROBLEMS = new Set(["new bleeding", "increased swelling"]);
// const REVIEW_BLEEDING_TYPES = new Set(["mucosal", "systemic"]);

// function safetyEngine(patient) {
//   const currentBleeding = norm(patient.current_bleeding, "no").toLowerCase();
//   const bleedingType = norm(patient.bleeding_type, "").toLowerCase();
//   const problem = norm(patient.exercise_problem, "none").toLowerCase();
//   const swelling = norm(patient.swelling, "no").toLowerCase();
//   const pain = parsePainLevel(patient.pain_level);

//   if (
//     ACTIVE_BLEEDING_STATES.has(currentBleeding) ||
//     ACTIVE_BLEEDING_TYPES.has(bleedingType) ||
//     ACTIVE_BLEEDING_PROBLEMS.has(problem) ||
//     swelling === "increased"
//   ) {
//     return {
//       status: "ACTIVE_BLEEDING",
//       allowRule: false,
//       guidance: [
//         "Stop exercise.",
//         "Avoid unnecessary movement.",
//         "Avoid weight-bearing on the affected area.",
//         "Follow the patient's established clinical bleeding-management plan.",
//         "Seek appropriate clinical guidance.",
//       ],
//     };
//   }

//   if (REVIEW_BLEEDING_TYPES.has(bleedingType) || pain >= 7) {
//     return {
//       status: "CLINICAL_REVIEW_REQUIRED",
//       allowRule: false,
//       guidance: ["Exercise recommendation requires clinical review."],
//     };
//   }

//   return { status: "SAFE_FOR_RECOMMENDATION", allowRule: true, guidance: [] };
// }

// const JOINT_NORMALIZE = { knee: "knee", ankle: "ankle", hip: "hip" };
// function normalizeJoint(value) {
//   const key = String(value || "").trim().toLowerCase();
//   return JOINT_NORMALIZE[key] || key || null;
// }

// function normalizeProblem(value) {
//   const v = String(value || "none").trim().toLowerCase();
//   if (!v) return "none";
//   if (v.includes("new bleeding")) return "new bleeding";
//   if (v.includes("swelling")) return "increased swelling";
//   if (v.includes("pain")) return "pain";
//   if (v.includes("stiff")) return "stiffness";
//   if (v.includes("weak")) return "weakness";
//   if (v.includes("balance")) return "balance_problem";
//   if (v.includes("tired") || v.includes("fatigue")) return "fatigue_after_exercise";
//   return "none";
// }

// function daysSince(date) {
//   if (!date) return 30;
//   const ms = Date.now() - new Date(date).getTime();
//   const days = Math.floor(ms / 86400000);
//   return Number.isFinite(days) && days >= 0 ? days : 30;
// }

// function isEmergencyScreening(session) {
//   return Array.isArray(session?.q1EmergencySymptoms) && session.q1EmergencySymptoms.length > 0;
// }

// // G2-C1/C5 note: HemophiliaDetails.js / ScreeningSession.js have no
// // bleeding_type / swelling / pain_level field today (grepped both models
// // while porting) -- the old ML payload builder never populated them
// // either, so this is not a regression. safetyEngine() still checks them
// // so a future field wires straight through with no code change here.
// function buildSafetyPatient(details, session) {
//   const problemSource = Array.isArray(details?.physiotherapyProblems)
//     ? details.physiotherapyProblems[0]
//     : details?.physiotherapyProblems;
//   return {
//     current_bleeding: isEmergencyScreening(session) ? "yes" : "no",
//     exercise_problem: normalizeProblem(problemSource),
//   };
// }

// // =====================================================
// // G2-C1: Group 2 exercise catalogue (replaces the 24-entry
// // MANUAL_EXERCISE_CATALOG). Elbow/Shoulder/Wrist/Lumbar Spine/Balance
// // removed per D4 -- the engine has no exercise for them. heel_raises is
// // removed with the rest of the trimmed Ankle set.
// // exerciseIds already used by the old catalog (heel_slides, mini_squats,
// // straight_leg_raise, terminal_knee_extension) are kept as-is; the two
// // exercises that had no prior entry (seated_knee_extension, squat) are
// // named after our engine's own exercise names directly.
// // =====================================================
// const KNEE_PURPOSE = "Improve quadriceps strength and knee stability.";

// const MANUAL_EXERCISE_CATALOG = [
//   { exerciseId: "heel_slides", exerciseName: "Heel slides", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   { exerciseId: "mini_squats", exerciseName: "Mini squats", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   { exerciseId: "seated_knee_extension", exerciseName: "Seated knee extension", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   { exerciseId: "straight_leg_raise", exerciseName: "Straight leg raise", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   { exerciseId: "terminal_knee_extension", exerciseName: "Terminal knee extension", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   { exerciseId: "squat", exerciseName: "Squat", category: "Knee", joint: "knee", purpose: KNEE_PURPOSE },
//   // G2-0.4: ankle deliberately routes to the same heel-slides movement --
//   // the only exercise the engine can assess safely for an ankle-affected
//   // patient. Not a mapping error; re-read docs/09g_g2_0_resolutions.md
//   // §G2-0.4 before "fixing" this.
//   {
//     exerciseId: "heel_slides",
//     exerciseName: "Heel slides",
//     category: "Ankle",
//     joint: "ankle",
//     purpose: "Safest engine-assessable movement available for an ankle-affected patient (see G2-0.4).",
//   },
//   { exerciseId: "diaphragmatic_breathing", exerciseName: "Diaphragmatic breathing", category: "Breathing", joint: null, purpose: "Promote relaxation." },
//   { exerciseId: "thoracic_expansion", exerciseName: "Thoracic expansion", category: "Breathing", joint: null, purpose: "Promote relaxation." },
//   { exerciseId: "pursed_lip_breathing", exerciseName: "Pursed-lip breathing", category: "Breathing", joint: null, purpose: "Promote relaxation." },
// ];

// const KNEE_EXERCISES = MANUAL_EXERCISE_CATALOG.filter((x) => x.category === "Knee");
// const ANKLE_EXERCISES = MANUAL_EXERCISE_CATALOG.filter((x) => x.category === "Ankle");
// const BREATHING_EXERCISES = MANUAL_EXERCISE_CATALOG.filter((x) => x.category === "Breathing");

// // G2-C4: deterministic replacement for the deleted Python /generate spawn.
// const JOINT_EXERCISE_MAP = {
//   knee: KNEE_EXERCISES,
//   ankle: ANKLE_EXERCISES,
//   hip: BREATHING_EXERCISES, // D4/C4: no hip-specific engine exercise -> breathing
// };

// function dosageFor(category, phaseDays) {
//   // ponytail: fixed dosage table, no per-phase ML tuning. "cautious" is
//   // the same <=7-day-since-last-bleed cutoff the old RULE_FALLBACK used.
//   const cautious = phaseDays <= 7;
//   if (category === "Breathing") {
//     return { sets: 1, repetitionsOrDuration: "5-10 minutes", frequency: cautious ? "3 times/week" : "daily" };
//   }
//   return { sets: cautious ? 1 : 2, repetitionsOrDuration: "10-15", frequency: cautious ? "3 times/week" : "5 times/week" };
// }

// function ruleRecommendationsForJoint(joint, details) {
//   const items = JOINT_EXERCISE_MAP[joint] || [];
//   const phaseDays = daysSince(details?.lastBleedDate);
//   return items.map((item) => {
//     const dose = dosageFor(item.category, phaseDays);
//     return {
//       exerciseId: item.exerciseId,
//       exerciseName: item.exerciseName,
//       type: item.category === "Breathing" ? "GENERAL" : "JOINT",
//       joint: item.category === "Breathing" ? null : joint,
//       category: item.category,
//       source: "RULE",
//       status: "PENDING_DOCTOR_REVIEW",
//       mlConfidence: null,
//       sets: dose.sets,
//       repetitionsOrDuration: dose.repetitionsOrDuration,
//       frequency: dose.frequency,
//       purpose: item.purpose,
//       recommendedAt: new Date().toISOString(),
//     };
//   });
// }

// function uniqueJoints(details) {
//   const values = Array.isArray(details?.jointsAffected) ? details.jointsAffected : [];
//   const normalized = values.map(normalizeJoint).filter(Boolean);
//   return [...new Set(normalized)];
// }

// // =====================================================
// // G2-C3: a stored jointsAffected entry can be a joint the picker no
// // longer offers (Elbow/Shoulder/Wrist/Lumbar Spine/Balance -- removed in
// // G2-C1/C2). Decision implemented here: never let that produce an empty
// // plan silently. Every such joint is reported back as an
// // `unsupportedJoints` entry (with its own safetyResults row, status
// // "UNSUPPORTED_JOINT") in the /generate response so the UI can show it
// // plainly; the stored hemophiliadetails.jointsAffected value is left
// // untouched -- no migration is performed.
// // STILL OPEN (plan §9 item 3, a human decision, not made here): whether
// // these patients get migrated to a supported joint, get a permanent
// // "unsupported" flag, or get routed into a dedicated doctor queue.
// // =====================================================
// async function generateForPatient(patientUserId) {
//   const [details, profile, session] = await Promise.all([
//     HemophiliaDetails.findOne({ userId: patientUserId }).lean(),
//     PatientProfile.findOne({ userId: patientUserId }).lean(),
//     ScreeningSession.findOne({ userId: patientUserId }).sort({ createdAt: -1 }).lean(),
//   ]);

//   if (!details) {
//     const error = new Error("Hemophilia details not found.");
//     error.status = 404;
//     throw error;
//   }

//   const joints = uniqueJoints(details);
//   if (joints.length === 0) {
//     const error = new Error("No affected joint is recorded for exercise recommendation.");
//     error.status = 400;
//     throw error;
//   }

//   const supportedJoints = joints.filter((j) => JOINT_EXERCISE_MAP[j]);
//   const unsupportedJoints = joints.filter((j) => !JOINT_EXERCISE_MAP[j]);

//   const safety = safetyEngine(buildSafetyPatient(details, session));

//   const safetyResults = [];
//   const allNew = [];

//   if (!safety.allowRule) {
//     // Clinical safety gate withholds recommendations for every affected
//     // joint, supported or not -- an active bleed does not become safe
//     // because one of the patient's joints happens to be unsupported.
//     for (const joint of joints) {
//       safetyResults.push({ joint, status: safety.status, source: "SAFETY_ENGINE", guidance: safety.guidance });
//     }
//   } else {
//     for (const joint of supportedJoints) {
//       allNew.push(...ruleRecommendationsForJoint(joint, details));
//       safetyResults.push({ joint, status: "RECOMMENDATIONS_GENERATED", source: "RULE", guidance: [] });
//     }
//     for (const joint of unsupportedJoints) {
//       safetyResults.push({
//         joint,
//         status: "UNSUPPORTED_JOINT",
//         source: "RULE",
//         guidance: [
//           `"${joint}" is no longer supported by the exercise engine. A doctor must review this patient's plan manually.`,
//         ],
//       });
//     }
//   }

//   const patientId = profile?.patientId || String(patientUserId);
//   const existing = await PatientExerciseRecommendation.find({ patientUserId }).lean();
//   const existingMap = new Map(existing.map((x) => [x.exerciseId, x]));
//   const inserted = [];
//   const skipped = [];

//   for (const rec of allNew) {
//     if (existingMap.has(rec.exerciseId)) {
//       // Also guards same-request duplicates: knee and ankle can both
//       // resolve to "heel_slides" (G2-0.4) when a patient has both
//       // joints affected -- one row is correct, not a bug.
//       skipped.push(rec.exerciseId);
//       continue;
//     }

//     const created = await PatientExerciseRecommendation.create({
//       patientUserId,
//       patientId,
//       exerciseId: rec.exerciseId,
//       exerciseName: rec.exerciseName,
//       type: rec.type,
//       joint: rec.joint,
//       category: rec.category,
//       source: rec.source,
//       status: "PENDING_DOCTOR_REVIEW",
//       sets: rec.sets,
//       repetitionsOrDuration: rec.repetitionsOrDuration,
//       frequency: rec.frequency,
//       purpose: rec.purpose,
//       mlConfidence: rec.mlConfidence,
//       recommendationReason: `Rule-based recommendation for ${rec.joint || "general"} condition.`,
//       recommendedAt: rec.recommendedAt ? new Date(rec.recommendedAt) : new Date(),
//     });
//     inserted.push(created);
//     existingMap.set(rec.exerciseId, created);
//   }

//   return {
//     status: safety.allowRule ? "RECOMMENDATIONS_GENERATED" : safety.status,
//     insertedCount: inserted.length,
//     skippedExistingCount: skipped.length,
//     recommendations: inserted,
//     safetyResults,
//     unsupportedJoints,
//   };
// }

// // =====================================================
// // PATIENT: GET MY EXERCISES
// // =====================================================
// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     const recommendations = await PatientExerciseRecommendation.find({
//       patientUserId: req.userId,
//       status: { $in: ["PENDING_DOCTOR_REVIEW", "ACTIVE"] },
//     }).sort({ status: 1, recommendedAt: -1 });

//     return res.json({ success: true, recommendations });
//   } catch (error) {
//     console.error("GET PATIENT EXERCISES ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to load exercise recommendations." });
//   }
// });

// // =====================================================
// // PATIENT: GENERATE / REFRESH RECOMMENDATIONS
// // =====================================================
// router.post("/generate", authMiddleware, async (req, res) => {
//   try {
//     const result = await generateForPatient(req.userId);
//     return res.json({ success: true, ...result });
//   } catch (error) {
//     console.error("GENERATE EXERCISES ERROR:", error);
//     return res.status(error.status || 500).json({
//       success: false,
//       message: error.message || "Failed to generate exercise recommendations.",
//     });
//   }
// });

// // =====================================================
// // DOCTOR: SAFE EXERCISE CATALOG FOR MANUAL PRESCRIPTION
// // =====================================================
// router.get("/doctor/exercise-catalog", staffAuth, async (req, res) => {
//   return res.json({ success: true, exercises: MANUAL_EXERCISE_CATALOG });
// });

// // =====================================================
// // DOCTOR: GET PENDING REVIEWS FOR ASSIGNED PATIENTS
// // =====================================================
// /* ============================================================
//    DOCTOR: RECENT ML EXERCISE PREDICTIONS FOR DASHBOARD
//    Only a small recent summary is returned here.
//    Full exercise records are shown in Patient Research.
//    ============================================================ */
// router.get("/doctor/recent", staffAuth, async (req, res) => {
//   try {
//     const assigned = await HemophiliaDetails.find({
//       consultingDoctorId: req.userId,
//     })
//       .select("userId patientId")
//       .lean();

//     const patientIds = assigned.map((x) => x.userId);

//     if (patientIds.length === 0) {
//       return res.json({
//         success: true,
//         recommendations: [],
//       });
//     }

//     const patientMap = new Map(
//       assigned.map((x) => [
//         String(x.userId),
//         x.patientId,
//       ])
//     );

//     const users = await User.find({
//       _id: { $in: patientIds },
//     })
//       .select("_id fullName")
//       .lean();

//     const nameMap = new Map(
//       users.map((x) => [
//         String(x._id),
//         x.fullName,
//       ])
//     );

//     const recommendations =
//       await PatientExerciseRecommendation.find({
//         patientUserId: { $in: patientIds },
//         // G2-C6: "ML" and "RULE_FALLBACK" are legacy source values on
//         // existing rows -- kept here, not retired, until those rows are
//         // migrated. "RULE" is the new deterministic source (G2-C4).
//         source: { $in: ["ML", "RULE_FALLBACK", "RULE"] },
//         status: {
//           $in: [
//             "PENDING_DOCTOR_REVIEW",
//             "ACTIVE",
//           ],
//         },
//       })
//         .sort({ recommendedAt: -1 })
//         .limit(8)
//         .lean();

//     const result = recommendations.map((item) => ({
//       _id: item._id,
//       patientUserId: item.patientUserId,
//       patientId:
//         patientMap.get(String(item.patientUserId)) ||
//         item.patientId,
//       patientName:
//         nameMap.get(String(item.patientUserId)) ||
//         "Unnamed patient",
//       exerciseId: item.exerciseId,
//       exerciseName: item.exerciseName,
//       type: item.type,
//       joint: item.joint,
//       category: item.category,
//       status: item.status,
//       source: item.source,
//       mlConfidence: item.mlConfidence,
//       purpose: item.purpose,
//       recommendedAt: item.recommendedAt,
//       sets: item.sets,
//       repetitionsOrDuration: item.repetitionsOrDuration,
//       frequency: item.frequency,
//     }));

//     return res.json({
//       success: true,
//       recommendations: result,
//     });
//   } catch (error) {
//     console.error("GET RECENT EXERCISE PREDICTIONS ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to load recent exercise predictions.",
//     });
//   }
// });

// router.get("/doctor/pending", staffAuth, async (req, res) => {
//   try {
//     const assigned = await HemophiliaDetails.find({
//       consultingDoctorId: req.userId,
//     }).select("userId patientId").lean();

//     const patientIds = assigned.map((x) => x.userId);
//     if (patientIds.length === 0) {
//       return res.json({ success: true, recommendations: [] });
//     }

//     const patientMap = new Map(assigned.map((x) => [String(x.userId), x.patientId]));
//     const users = await User.find({ _id: { $in: patientIds } }).select("_id fullName").lean();
//     const nameMap = new Map(users.map((x) => [String(x._id), x.fullName]));

//     const recommendations = await PatientExerciseRecommendation.find({
//       patientUserId: { $in: patientIds },
//       status: "PENDING_DOCTOR_REVIEW",
//     }).sort({ recommendedAt: -1 }).lean();

//     const result = recommendations.map((item) => ({
//       ...item,
//       patientName: nameMap.get(String(item.patientUserId)) || "Unnamed patient",
//       patientId: patientMap.get(String(item.patientUserId)) || item.patientId,
//     }));

//     return res.json({ success: true, recommendations: result });
//   } catch (error) {
//     console.error("GET DOCTOR EXERCISE REVIEWS ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to load exercise reviews." });
//   }
// });

// async function verifyAssignedDoctor(req, patientUserId) {
//   const details = await HemophiliaDetails.findOne({
//     userId: patientUserId,
//     consultingDoctorId: req.userId,
//   }).lean();
//   return Boolean(details);
// }

// // =====================================================
// // DOCTOR: APPROVE
// // =====================================================
// router.post("/doctor/:recommendationId/approve", staffAuth, async (req, res) => {
//   try {
//     const recommendation = await PatientExerciseRecommendation.findById(req.params.recommendationId);
//     if (!recommendation) return res.status(404).json({ success: false, message: "Exercise recommendation not found." });

//     if (!(await verifyAssignedDoctor(req, recommendation.patientUserId))) {
//       return res.status(403).json({ success: false, message: "This patient is not currently assigned to you." });
//     }

//     if (recommendation.doctorRemoved) {
//       return res.status(409).json({ success: false, message: "This exercise was previously removed and cannot be automatically reactivated." });
//     }

//     recommendation.status = "ACTIVE";
//     recommendation.doctorReviewedBy = req.userId;
//     recommendation.doctorReviewedAt = new Date();
//     recommendation.doctorNote = String(req.body?.doctorNote || "").trim();
//     await recommendation.save();

//     return res.json({ success: true, message: "Exercise approved and activated.", recommendation });
//   } catch (error) {
//     console.error("APPROVE EXERCISE ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to approve exercise." });
//   }
// });

// // =====================================================
// // DOCTOR: REMOVE
// // =====================================================
// router.post("/doctor/:recommendationId/remove", staffAuth, async (req, res) => {
//   try {
//     const recommendation = await PatientExerciseRecommendation.findById(req.params.recommendationId);
//     if (!recommendation) return res.status(404).json({ success: false, message: "Exercise recommendation not found." });

//     if (!(await verifyAssignedDoctor(req, recommendation.patientUserId))) {
//       return res.status(403).json({ success: false, message: "This patient is not currently assigned to you." });
//     }

//     recommendation.status = "REMOVED";
//     recommendation.doctorRemoved = true;
//     recommendation.doctorReviewedBy = req.userId;
//     recommendation.doctorReviewedAt = new Date();
//     recommendation.doctorNote = String(req.body?.doctorNote || "").trim();
//     await recommendation.save();

//     return res.json({ success: true, message: "Exercise removed from the patient's plan.", recommendation });
//   } catch (error) {
//     console.error("REMOVE EXERCISE ERROR:", error);
//     return res.status(500).json({ success: false, message: "Failed to remove exercise." });
//   }
// });

// // =====================================================
// // DOCTOR: MANUALLY ADD EXERCISE
// // Accepts either Mongo userId OR public Patient ID (PATxxxxxx).
// // This lets Patient Research use the visible Patient ID safely.
// // =====================================================
// router.post("/doctor/patient/:patientIdentifier/add", staffAuth, async (req, res) => {
//   try {
//     const patientIdentifier = String(req.params.patientIdentifier || "").trim();

//     let profile = null;

//     if (patientIdentifier.toUpperCase().startsWith("PAT")) {
//       profile = await PatientProfile.findOne({
//         patientId: patientIdentifier.toUpperCase(),
//       }).lean();
//     } else {
//       profile = await PatientProfile.findOne({
//         userId: patientIdentifier,
//       }).lean();
//     }

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient profile not found.",
//       });
//     }

//     const patientUserId = profile.userId;

//     if (!(await verifyAssignedDoctor(req, patientUserId))) {
//       return res.status(403).json({
//         success: false,
//         message: "This patient is not currently assigned to you.",
//       });
//     }

//     const required = ["exerciseId", "exerciseName", "category"];

//     for (const field of required) {
//       if (!req.body?.[field]) {
//         return res.status(400).json({
//           success: false,
//           message: `${field} is required.`,
//         });
//       }
//     }

//     const exerciseId = String(req.body.exerciseId).trim();

//     // If an exercise is currently pending, the doctor explicitly
//     // prescribing it means it can be activated immediately.
//     const existing = await PatientExerciseRecommendation.findOne({
//       patientUserId,
//       exerciseId,
//     });

//     if (existing) {
//       if (existing.status === "PENDING_DOCTOR_REVIEW") {
//         existing.status = "ACTIVE";
//         existing.source = "DOCTOR";
//         existing.doctorRemoved = false;
//         existing.doctorReviewedBy = req.userId;
//         existing.doctorReviewedAt = new Date();
//         existing.doctorNote = String(req.body.doctorNote || "").trim();
//         await existing.save();

//         return res.json({
//           success: true,
//           message: "Exercise prescribed and activated for the patient.",
//           recommendation: existing,
//         });
//       }

//       if (existing.status === "REMOVED") {
//         existing.status = "ACTIVE";
//         existing.source = "DOCTOR";
//         existing.doctorRemoved = false;
//         existing.doctorReviewedBy = req.userId;
//         existing.doctorReviewedAt = new Date();
//         existing.doctorNote = String(req.body.doctorNote || "").trim();
//         existing.purpose = String(req.body.purpose || existing.purpose || "Doctor-selected exercise");
//         existing.sets = Number(req.body.sets) || existing.sets || 1;
//         existing.repetitionsOrDuration = String(req.body.repetitionsOrDuration || existing.repetitionsOrDuration || "10");
//         existing.frequency = String(req.body.frequency || existing.frequency || "as advised");
//         await existing.save();

//         return res.json({
//           success: true,
//           message: "Previously removed exercise has been explicitly prescribed again.",
//           recommendation: existing,
//         });
//       }

//       return res.status(409).json({
//         success: false,
//         message: "This exercise is already active in the patient's plan.",
//       });
//     }

//     const created = await PatientExerciseRecommendation.create({
//       patientUserId,
//       patientId: profile.patientId || String(patientUserId),
//       exerciseId,
//       exerciseName: String(req.body.exerciseName),
//       type: req.body.type === "GENERAL" ? "GENERAL" : "JOINT",
//       joint: req.body.joint || null,
//       category: String(req.body.category),
//       source: "DOCTOR",
//       status: "ACTIVE",
//       sets: Number(req.body.sets) || 1,
//       repetitionsOrDuration: String(req.body.repetitionsOrDuration || "10"),
//       frequency: String(req.body.frequency || "as advised"),
//       schedule: req.body.schedule || null,
//       purpose: String(req.body.purpose || "Doctor-selected exercise"),
//       recommendationReason: "Manually prescribed by consulting doctor.",
//       doctorReviewedBy: req.userId,
//       doctorReviewedAt: new Date(),
//       doctorNote: String(req.body.doctorNote || "").trim(),
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Exercise added to the patient's active plan.",
//       recommendation: created,
//     });
//   } catch (error) {
//     console.error("ADD DOCTOR EXERCISE ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to add exercise.",
//     });
//   }
// });

// // Exported for backend/src/routes/safety_engine_equivalence.test.js only.
// router.safetyEngine = safetyEngine;
// router.JOINT_EXERCISE_MAP = JOINT_EXERCISE_MAP;

// module.exports = router;






const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../middleware/auth");
const { staffAuth } = require("../middleware/roleMiddleware");

const HemophiliaDetails = require("../models/HemophiliaDetails");
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

    HemophiliaDetails
      .findOne({
        userId: patientUserId
      })
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
      "terminal_knee_extensions",
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
      "terminal_knee_extensions",

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
      "mini_squat",

    exerciseName:
      "Mini squat",

    category:
      "Knee",

    joint:
      "knee",

    purpose:
      "Improve functional knee strength.",
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
        await HemophiliaDetails
          .find({
            consultingDoctorId:
              req.userId,
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
          "_id fullName"
        )
        .lean();


      const nameMap =
        new Map(
          users.map(
            (x) => [
              String(x._id),
              x.fullName,
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
                "RULE_FALLBACK"
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
          .limit(8)
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
        await HemophiliaDetails
          .find({
            consultingDoctorId:
              req.userId,
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
          "_id fullName"
        )
        .lean();


      const nameMap =
        new Map(
          users.map(
            (x) => [
              String(x._id),
              x.fullName,
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
    await HemophiliaDetails
      .findOne({

        userId:
          patientUserId,

        consultingDoctorId:
          req.userId,

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


      const exerciseId =
        String(
          req.body.exerciseId
        ).trim();


      // -----------------------------------------------
      // CHECK EXISTING
      // -----------------------------------------------

      const existing =
        await PatientExerciseRecommendation
          .findOne({

            patientUserId,

            exerciseId,

          });


      if (existing) {

        // ---------------------------------------------
        // PENDING -> ACTIVATE
        // ---------------------------------------------

        if (
          existing.status ===
          "PENDING_DOCTOR_REVIEW"
        ) {

          existing.status =
            "ACTIVE";

          existing.source =
            "DOCTOR";

          existing.doctorRemoved =
            false;

          existing.doctorReviewedBy =
            req.userId;

          existing.doctorReviewedAt =
            new Date();

          existing.doctorNote =
            String(
              req.body.doctorNote || ""
            ).trim();


          await existing.save();


          return res.json({

            success: true,

            message:
              "Exercise prescribed and activated for the patient.",

            recommendation:
              existing,

          });
        }


        // ---------------------------------------------
        // REMOVED -> EXPLICITLY PRESCRIBE AGAIN
        // ---------------------------------------------

        if (
          existing.status ===
          "REMOVED"
        ) {

          existing.status =
            "ACTIVE";

          existing.source =
            "DOCTOR";

          existing.doctorRemoved =
            false;

          existing.doctorReviewedBy =
            req.userId;

          existing.doctorReviewedAt =
            new Date();

          existing.doctorNote =
            String(
              req.body.doctorNote || ""
            ).trim();

          existing.purpose =
            String(
              req.body.purpose ||
              existing.purpose ||
              "Doctor-selected exercise"
            );

          existing.sets =
            Number(
              req.body.sets
            ) ||
            existing.sets ||
            1;

          existing.repetitionsOrDuration =
            String(
              req.body.repetitionsOrDuration ||
              existing.repetitionsOrDuration ||
              "10"
            );

          existing.frequency =
            String(
              req.body.frequency ||
              existing.frequency ||
              "as advised"
            );


          await existing.save();


          return res.json({

            success: true,

            message:
              "Previously removed exercise has been explicitly prescribed again.",

            recommendation:
              existing,

          });
        }


        // ---------------------------------------------
        // ALREADY ACTIVE
        // ---------------------------------------------

        return res.status(409).json({

          success: false,

          message:
            "This exercise is already active in the patient's plan.",

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

            exerciseName:
              String(
                req.body.exerciseName
              ),

            type:
              req.body.type ===
              "GENERAL"
                ? "GENERAL"
                : "JOINT",

            joint:
              req.body.joint ||
              null,

            category:
              String(
                req.body.category
              ),

            source:
              "DOCTOR",

            status:
              "ACTIVE",

            sets:
              Number(
                req.body.sets
              ) || 1,

            repetitionsOrDuration:
              String(
                req.body
                  .repetitionsOrDuration ||
                "10"
              ),

            frequency:
              String(
                req.body.frequency ||
                "as advised"
              ),

            schedule:
              req.body.schedule ||
              null,

            purpose:
              String(
                req.body.purpose ||
                "Doctor-selected exercise"
              ),

            recommendationReason:
              "Manually prescribed by consulting doctor.",

            doctorReviewedBy:
              req.userId,

            doctorReviewedAt:
              new Date(),

            doctorNote:
              String(
                req.body.doctorNote ||
                ""
              ).trim(),

          });


      return res.status(201).json({

        success: true,

        message:
          "Exercise added to the patient's active plan.",

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
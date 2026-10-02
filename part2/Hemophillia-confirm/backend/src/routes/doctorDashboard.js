// const express = require("express");

// const User = require("../models/User");
// const PatientProfile = require("../models/PatientProfile");
// const HemophiliaDetails = require("../models/HemophiliaDetails");
// const Assessment = require("../models/Assessment");

// const { staffAuth } = require("../middleware/roleMiddleware");

// const router = express.Router();

// // =====================================================
// // GET DOCTOR DASHBOARD
// // GET /api/doctor/dashboard
// // =====================================================

// router.get("/dashboard", staffAuth, async (req, res) => {
//   try {
//     // =================================================
//     // 1. GET LOGGED-IN DOCTOR
//     // =================================================

//     const doctor = await User.findById(req.userId).select(
//       "fullName professionalId role"
//     );

//     if (!doctor) {
//       return res.status(404).json({
//         message: "Doctor / Clinician account not found",
//       });
//     }

//     // =================================================
//     // 2. GET TOTAL PATIENT COUNT
//     // =================================================

//     const totalPatients = await User.countDocuments({
//       role: "patient",
//     });

//     // =================================================
//     // 3. GET PATIENT PROFILES
//     // =================================================

//     const patientProfiles = await PatientProfile.find({})
//       .select("age")
//       .lean();

//     // =================================================
//     // 4. AGE DISTRIBUTION
//     // =================================================

//     const ageDistribution = [
//       {
//         ageGroup: "0-12",
//         count: 0,
//       },
//       {
//         ageGroup: "13-18",
//         count: 0,
//       },
//       {
//         ageGroup: "19-30",
//         count: 0,
//       },
//       {
//         ageGroup: "31-45",
//         count: 0,
//       },
//       {
//         ageGroup: "46-60",
//         count: 0,
//       },
//       {
//         ageGroup: "61+",
//         count: 0,
//       },
//       {
//         ageGroup: "Unknown",
//         count: 0,
//       },
//     ];

//     patientProfiles.forEach((profile) => {
//       const age = Number(profile.age);

//       if (!Number.isFinite(age) || age < 0) {
//         ageDistribution[6].count++;
//         return;
//       }

//       if (age <= 12) {
//         ageDistribution[0].count++;
//       } else if (age <= 18) {
//         ageDistribution[1].count++;
//       } else if (age <= 30) {
//         ageDistribution[2].count++;
//       } else if (age <= 45) {
//         ageDistribution[3].count++;
//       } else if (age <= 60) {
//         ageDistribution[4].count++;
//       } else {
//         ageDistribution[5].count++;
//       }
//     });

//     // =================================================
//     // 5. GET HEMOPHILIA DETAILS
//     // =================================================

//     const hemophiliaRecords =
//       await HemophiliaDetails.find({}).lean();

//     console.log(
//       "HEMOPHILIA RECORD COUNT:",
//       hemophiliaRecords.length
//     );

//     // =================================================
//     // 6. HEMOPHILIA TYPE DISTRIBUTION
//     // =================================================

//     const typeDistribution = {
//       A: 0,
//       B: 0,
//       C: 0,
//       Unknown: 0,
//     };

//     hemophiliaRecords.forEach((record) => {
//       const type = record.type || "Unknown";

//       if (typeDistribution[type] !== undefined) {
//         typeDistribution[type]++;
//       } else {
//         typeDistribution.Unknown++;
//       }
//     });

//     // =================================================
//     // 7. SEVERITY DISTRIBUTION
//     // =================================================

//     const severityDistribution = {
//       Mild: 0,
//       Moderate: 0,
//       Severe: 0,
//       Unknown: 0,
//     };

//     hemophiliaRecords.forEach((record) => {
//       const severity = record.severity || "Unknown";

//       if (severityDistribution[severity] !== undefined) {
//         severityDistribution[severity]++;
//       } else {
//         severityDistribution.Unknown++;
//       }
//     });

//     // =================================================
//     // 8. FAMILY HISTORY
//     // =================================================

//     let familyHistoryYes = 0;
//     let familyHistoryNo = 0;
//     let familyHistoryUnknown = 0;

//     hemophiliaRecords.forEach((record) => {
//       if (record.familyHistory === true) {
//         familyHistoryYes++;
//       } else if (record.familyHistory === false) {
//         familyHistoryNo++;
//       } else {
//         familyHistoryUnknown++;
//       }
//     });

//     // =================================================
//     // 9. GENETIC TESTING
//     // =================================================

//     let geneticTestingYes = 0;
//     let geneticTestingNo = 0;
//     let geneticTestingUnknown = 0;

//     hemophiliaRecords.forEach((record) => {
//       if (record.geneticTestingDone === true) {
//         geneticTestingYes++;
//       } else if (record.geneticTestingDone === false) {
//         geneticTestingNo++;
//       } else {
//         geneticTestingUnknown++;
//       }
//     });

//     // =================================================
//     // 10. CURRENT FACTOR THERAPY
//     // =================================================

//     let factorTherapyCount = 0;
//     let therapyUnknown = 0;

//     hemophiliaRecords.forEach((record) => {
//       if (
//         record.currentFactorTherapy &&
//         String(record.currentFactorTherapy).trim() !== ""
//       ) {
//         factorTherapyCount++;
//       } else {
//         therapyUnknown++;
//       }
//     });

//     const noFactorTherapyCount = Math.max(
//       0,
//       hemophiliaRecords.length -
//         factorTherapyCount -
//         therapyUnknown
//     );

//     // =================================================
//     // 11. PHYSIOTHERAPY
//     // =================================================

//     let physiotherapyYes = 0;
//     let physiotherapyNo = 0;
//     let physiotherapyUnknown = 0;

//     hemophiliaRecords.forEach((record) => {
//       if (record.underPhysiotherapy === true) {
//         physiotherapyYes++;
//       } else if (record.underPhysiotherapy === false) {
//         physiotherapyNo++;
//       } else {
//         physiotherapyUnknown++;
//       }
//     });

//     // =================================================
//     // 12. JOINT INVOLVEMENT
//     // =================================================

//     const jointCounts = {};

//     hemophiliaRecords.forEach((record) => {
//       // Joints affected
//       if (Array.isArray(record.jointsAffected)) {
//         record.jointsAffected.forEach((joint) => {
//           if (!joint) return;

//           const normalizedJoint = String(joint).trim();

//           if (!normalizedJoint) return;

//           jointCounts[normalizedJoint] =
//             (jointCounts[normalizedJoint] || 0) + 1;
//         });
//       }

//       // Target joint
//       if (record.targetJoint) {
//         const targetJoint = String(
//           record.targetJoint
//         ).trim();

//         if (targetJoint) {
//           jointCounts[targetJoint] =
//             (jointCounts[targetJoint] || 0) + 1;
//         }
//       }
//     });

//     const jointDistribution = Object.entries(
//       jointCounts
//     )
//       .map(([joint, count]) => ({
//         joint,
//         count,
//       }))
//       .sort((a, b) => b.count - a.count);

//     // =================================================
//     // 13. BLEED FREQUENCY
//     // =================================================

//     const bleedFrequencyCounts = {};

//     hemophiliaRecords.forEach((record) => {
//       if (!record.bleedFrequency) return;

//       const frequency = String(
//         record.bleedFrequency
//       ).trim();

//       if (!frequency) return;

//       bleedFrequencyCounts[frequency] =
//         (bleedFrequencyCounts[frequency] || 0) + 1;
//     });

//     const bleedingFrequencyDistribution =
//       Object.entries(bleedFrequencyCounts)
//         .map(([frequency, count]) => ({
//           frequency,
//           count,
//         }))
//         .sort((a, b) => b.count - a.count);

//     // =================================================
//     // 14. LAST BLEED INFORMATION
//     // =================================================

//     const patientsWithLastBleedDate =
//       hemophiliaRecords.filter(
//         (record) => record.lastBleedDate
//       );

//     // =================================================
//     // 15. BLEEDING TREND
//     //
//     // IMPORTANT:
//     // We DO NOT have individual bleeding-event records.
//     //
//     // Therefore this is NOT pretending to be an
//     // individual bleeding-event count.
//     //
//     // It shows the number of patient records having
//     // a recorded lastBleedDate in each month.
//     // =================================================

//     const bleedingTrendMap = {};

//     patientsWithLastBleedDate.forEach((record) => {
//       const date = new Date(record.lastBleedDate);

//       if (Number.isNaN(date.getTime())) {
//         return;
//       }

//       const year = date.getFullYear();
//       const month = date.getMonth();

//       const monthKey = `${year}-${String(
//         month + 1
//       ).padStart(2, "0")}`;

//       const monthLabel = date.toLocaleDateString(
//         "en-US",
//         {
//           month: "short",
//           year: "numeric",
//         }
//       );

//       if (!bleedingTrendMap[monthKey]) {
//         bleedingTrendMap[monthKey] = {
//           month: monthLabel,
//           events: 0,
//         };
//       }

//       bleedingTrendMap[monthKey].events++;
//     });

//     const bleedingTrends = Object.entries(
//       bleedingTrendMap
//     )
//       .sort(([a], [b]) => a.localeCompare(b))
//       .map(([, value]) => value);

//     // =================================================
//     // 16. ASSESSMENTS
//     // =================================================

//     const totalAssessments =
//       await Assessment.countDocuments({});

//     // =================================================
//     // 17. ASSESSMENT DATA FOR CLINICAL ALERTS
//     // =================================================

//     const assessments =
//       await Assessment.find({})
//         .select(
//           "score riskLevel emergencyFlag strongSuspicionFlag createdAt"
//         )
//         .lean();

//     // =================================================
//     // 18. HIGH / EMERGENCY ASSESSMENTS
//     // =================================================

//     let highRiskAssessments = 0;
//     let emergencyAssessments = 0;
//     let strongSuspicionAssessments = 0;

//     assessments.forEach((assessment) => {
//       const risk = String(
//         assessment.riskLevel || ""
//       ).toUpperCase();

//       if (risk === "HIGH") {
//         highRiskAssessments++;
//       }

//       if (risk === "EMERGENCY") {
//         emergencyAssessments++;
//       }

//       if (
//         assessment.strongSuspicionFlag === true
//       ) {
//         strongSuspicionAssessments++;
//       }
//     });

//     // =================================================
//     // 19. CLINICAL ALERTS
//     //
//     // These are AGGREGATED indicators.
//     // No patient identity is returned.
//     // =================================================

//     const clinicalAlerts = [];

//     // -------------------------------------------------
//     // Emergency assessments
//     // -------------------------------------------------

//     if (emergencyAssessments > 0) {
//       clinicalAlerts.push({
//         type: "emergency",
//         severity: "critical",
//         title: "Emergency assessment findings",
//         count: emergencyAssessments,
//         description:
//           "Assessment records contain emergency-level risk findings requiring clinical review.",
//       });
//     }

//     // -------------------------------------------------
//     // High-risk assessments
//     // -------------------------------------------------

//     if (highRiskAssessments > 0) {
//       clinicalAlerts.push({
//         type: "high_risk",
//         severity: "high",
//         title: "High-risk assessment findings",
//         count: highRiskAssessments,
//         description:
//           "Assessment records are classified as high risk and may require clinical follow-up.",
//       });
//     }

//     // -------------------------------------------------
//     // Strong suspicion
//     // -------------------------------------------------

//     if (strongSuspicionAssessments > 0) {
//       clinicalAlerts.push({
//         type: "strong_suspicion",
//         severity: "high",
//         title: "Strong hemophilia suspicion",
//         count: strongSuspicionAssessments,
//         description:
//           "Assessment records contain a strong-suspicion flag.",
//       });
//     }

//     // -------------------------------------------------
//     // Severe hemophilia
//     // -------------------------------------------------

//     if (severityDistribution.Severe > 0) {
//       clinicalAlerts.push({
//         type: "severe",
//         severity: "high",
//         title: "Severe hemophilia records",
//         count: severityDistribution.Severe,
//         description:
//           "Patients with severe disease classification are present in the clinical records.",
//       });
//     }

//     // -------------------------------------------------
//     // Target joint
//     // -------------------------------------------------

//     const patientsWithTargetJoint =
//       hemophiliaRecords.filter(
//         (record) =>
//           record.targetJoint &&
//           String(record.targetJoint).trim() !== ""
//       ).length;

//     if (patientsWithTargetJoint > 0) {
//       clinicalAlerts.push({
//         type: "target_joint",
//         severity: "high",
//         title: "Target-joint involvement",
//         count: patientsWithTargetJoint,
//         description:
//           "Patient records contain a documented target joint.",
//       });
//     }

//     // -------------------------------------------------
//     // Bleeding history without factor therapy
//     // -------------------------------------------------

//     const bleedingWithoutTherapy =
//       hemophiliaRecords.filter((record) => {
//         const hasBleedingHistory =
//           Boolean(record.lastBleedDate) ||
//           Boolean(record.bleedFrequency);

//         const hasTherapy =
//           record.currentFactorTherapy &&
//           String(
//             record.currentFactorTherapy
//           ).trim() !== "";

//         return (
//           hasBleedingHistory &&
//           !hasTherapy
//         );
//       }).length;

//     if (bleedingWithoutTherapy > 0) {
//       clinicalAlerts.push({
//         type: "therapy_review",
//         severity: "medium",
//         title: "Bleeding history without recorded factor therapy",
//         count: bleedingWithoutTherapy,
//         description:
//           "Records show bleeding history but no current factor therapy is recorded.",
//       });
//     }

//     // -------------------------------------------------
//     // Patients with recorded bleeding history
//     // -------------------------------------------------

//     if (
//       patientsWithLastBleedDate.length > 0
//     ) {
//       clinicalAlerts.push({
//         type: "bleeding_history",
//         severity: "medium",
//         title: "Recorded bleeding history",
//         count:
//           patientsWithLastBleedDate.length,
//         description:
//           "Patient records contain a recorded last bleeding date.",
//       });
//     }

//     // =================================================
//     // 20. SORT ALERTS
//     //
//     // Critical → High → Medium
//     // =================================================

//     const severityOrder = {
//       critical: 1,
//       high: 2,
//       medium: 3,
//       low: 4,
//     };

//     clinicalAlerts.sort(
//       (a, b) =>
//         (severityOrder[a.severity] || 99) -
//         (severityOrder[b.severity] || 99)
//     );

//     // =================================================
//     // 21. DASHBOARD RESPONSE
//     // =================================================

//     return res.status(200).json({
//       doctor: {
//         id: doctor._id,
//         fullName: doctor.fullName,
//         professionalId: doctor.professionalId,
//         role: doctor.role,
//       },

//       // =================================================
//       // OVERVIEW
//       // =================================================

//       overview: {
//         totalPatients,

//         totalHemophiliaRecords:
//           hemophiliaRecords.length,

//         totalAssessments,

//         patientsWithBleedingHistory:
//           patientsWithLastBleedDate.length,
//       },

//       // =================================================
//       // DISTRIBUTIONS
//       // =================================================

//       distributions: {
//         hemophiliaTypes: typeDistribution,

//         // Compatibility
//         hemophiliaType: typeDistribution,

//         severity: severityDistribution,

//         ageDistribution,

//         familyHistory: {
//           yes: familyHistoryYes,
//           no: familyHistoryNo,
//           unknown: familyHistoryUnknown,
//         },

//         geneticTesting: {
//           yes: geneticTestingYes,
//           no: geneticTestingNo,
//           unknown: geneticTestingUnknown,
//         },

//         factorTherapy: {
//           active: factorTherapyCount,
//           none: noFactorTherapyCount,
//           unknown: therapyUnknown,
//         },

//         physiotherapy: {
//           yes: physiotherapyYes,
//           no: physiotherapyNo,
//           unknown: physiotherapyUnknown,
//         },

//         affectedJoints: jointDistribution,
//       },

//       // =================================================
//       // CLINICAL BACKGROUND
//       // =================================================

//       clinicalBackground: {
//         jointDistribution,

//         bleedingFrequencyDistribution,
//       },

//       // =================================================
//       // BLEEDING TREND
//       // =================================================

//       bleedingTrends,

//       // =================================================
//       // CLINICAL ALERTS
//       // =================================================

//       clinicalAlerts,

//       // =================================================
//       // EXTRA SUMMARY
//       // =================================================

//       clinicalSummary: {
//         emergencyAssessments,
//         highRiskAssessments,
//         strongSuspicionAssessments,
//         severePatients:
//           severityDistribution.Severe,
//         patientsWithTargetJoint,
//         bleedingWithoutTherapy,
//         patientsWithRecordedBleedingHistory:
//           patientsWithLastBleedDate.length,
//       },

//       // =================================================
//       // MESSAGE
//       // =================================================

//       message:
//         "Doctor dashboard data retrieved successfully",
//     });
//   } catch (error) {
//     console.error(
//       "================================="
//     );

//     console.error(
//       "❌ Doctor Dashboard Error"
//     );

//     console.error(error);

//     console.error(
//       "================================="
//     );

//     return res.status(500).json({
//       message:
//         "Unable to load doctor dashboard data",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;





const express = require("express");

const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const HemophiliaDetails = require("../models/HemophiliaDetails");
const Assessment = require("../models/Assessment");
const DoctorChangeRequest = require("../models/DoctorChangeRequest");

const { staffAuth } = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// GET DOCTOR DASHBOARD
// GET /api/doctor/dashboard
// =====================================================

router.get("/dashboard", staffAuth, async (req, res) => {
  try {
    // =================================================
    // 1. GET LOGGED-IN DOCTOR
    // =================================================

    const doctor = await User.findById(req.userId).select(
      "fullName professionalId role"
    );

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor / Clinician account not found",
      });
    }

    // =================================================
    // 2-5. GET ONLY THIS DOCTOR'S ASSIGNED PATIENTS
    // =================================================
    // Every dashboard metric below is scoped to the
    // authenticated doctor. A patient belongs here only
    // when consultingDoctorId === req.userId.

    const hemophiliaRecords =
      await HemophiliaDetails.find({
        consultingDoctorId: req.userId,
      }).lean();

    const patientUserIds = hemophiliaRecords
      .map((record) => record.userId)
      .filter(Boolean);

    const totalPatients = hemophiliaRecords.length;

    const patientProfiles = await PatientProfile.find({
      userId: { $in: patientUserIds },
    })
      .select('userId age gender sex')
      .lean();

    const patientUsers = await User.find({
      _id: { $in: patientUserIds },
      role: 'patient',
    })
      .select('_id fullName professionalId role')
      .lean();

    const profileMap = new Map(
      patientProfiles.map((profile) => [
        String(profile.userId),
        profile,
      ])
    );

    const userMap = new Map(
      patientUsers.map((user) => [
        String(user._id),
        user,
      ])
    );

    // =================================================
    // AGE DISTRIBUTION — ASSIGNED PATIENTS ONLY
    // =================================================

    const ageDistribution = [
      { ageGroup: '0-12', count: 0 },
      { ageGroup: '13-18', count: 0 },
      { ageGroup: '19-30', count: 0 },
      { ageGroup: '31-45', count: 0 },
      { ageGroup: '46-60', count: 0 },
      { ageGroup: '61+', count: 0 },
      { ageGroup: 'Unknown', count: 0 },
    ];

    patientProfiles.forEach((profile) => {
      const age = Number(profile.age);

      if (!Number.isFinite(age) || age < 0) {
        ageDistribution[6].count++;
        return;
      }

      if (age <= 12) ageDistribution[0].count++;
      else if (age <= 18) ageDistribution[1].count++;
      else if (age <= 30) ageDistribution[2].count++;
      else if (age <= 45) ageDistribution[3].count++;
      else if (age <= 60) ageDistribution[4].count++;
      else ageDistribution[5].count++;
    });

    console.log(
      'ASSIGNED PATIENT COUNT FOR DOCTOR:',
      totalPatients
    );

    // =================================================
    // 6. HEMOPHILIA TYPE DISTRIBUTION
    // =================================================

    const typeDistribution = {
      A: 0,
      B: 0,
      C: 0,
      Unknown: 0,
    };

    hemophiliaRecords.forEach((record) => {
      const type = record.type || "Unknown";

      if (typeDistribution[type] !== undefined) {
        typeDistribution[type]++;
      } else {
        typeDistribution.Unknown++;
      }
    });

    // =================================================
    // 7. SEVERITY DISTRIBUTION
    // =================================================

    const severityDistribution = {
      Mild: 0,
      Moderate: 0,
      Severe: 0,
      Unknown: 0,
    };

    hemophiliaRecords.forEach((record) => {
      const severity = record.severity || "Unknown";

      if (severityDistribution[severity] !== undefined) {
        severityDistribution[severity]++;
      } else {
        severityDistribution.Unknown++;
      }
    });

    // =================================================
    // 8. FAMILY HISTORY
    // =================================================

    let familyHistoryYes = 0;
    let familyHistoryNo = 0;
    let familyHistoryUnknown = 0;

    hemophiliaRecords.forEach((record) => {
      if (record.familyHistory === true) {
        familyHistoryYes++;
      } else if (record.familyHistory === false) {
        familyHistoryNo++;
      } else {
        familyHistoryUnknown++;
      }
    });

    // =================================================
    // 9. GENETIC TESTING
    // =================================================

    let geneticTestingYes = 0;
    let geneticTestingNo = 0;
    let geneticTestingUnknown = 0;

    hemophiliaRecords.forEach((record) => {
      if (record.geneticTestingDone === true) {
        geneticTestingYes++;
      } else if (record.geneticTestingDone === false) {
        geneticTestingNo++;
      } else {
        geneticTestingUnknown++;
      }
    });

    // =================================================
    // 10. CURRENT FACTOR THERAPY
    // =================================================

    let factorTherapyCount = 0;
    let therapyUnknown = 0;

    hemophiliaRecords.forEach((record) => {
      if (
        record.currentFactorTherapy &&
        String(record.currentFactorTherapy).trim() !== ""
      ) {
        factorTherapyCount++;
      } else {
        therapyUnknown++;
      }
    });

    const noFactorTherapyCount = Math.max(
      0,
      hemophiliaRecords.length -
        factorTherapyCount -
        therapyUnknown
    );

    // =================================================
    // 11. PHYSIOTHERAPY
    // =================================================

    let physiotherapyYes = 0;
    let physiotherapyNo = 0;
    let physiotherapyUnknown = 0;

    hemophiliaRecords.forEach((record) => {
      if (record.underPhysiotherapy === true) {
        physiotherapyYes++;
      } else if (record.underPhysiotherapy === false) {
        physiotherapyNo++;
      } else {
        physiotherapyUnknown++;
      }
    });

    // =================================================
    // 12. JOINT INVOLVEMENT
    // =================================================

    const jointCounts = {};

    hemophiliaRecords.forEach((record) => {
      // Joints affected
      if (Array.isArray(record.jointsAffected)) {
        record.jointsAffected.forEach((joint) => {
          if (!joint) return;

          const normalizedJoint = String(joint).trim();

          if (!normalizedJoint) return;

          jointCounts[normalizedJoint] =
            (jointCounts[normalizedJoint] || 0) + 1;
        });
      }

      // Target joint -- multi-value. Older records hold a single string.
      const targetJoints = Array.isArray(record.targetJoint)
        ? record.targetJoint
        : [record.targetJoint];

      targetJoints.forEach((joint) => {
        if (!joint) return;

        const normalizedJoint = String(joint).trim();

        if (!normalizedJoint) return;

        jointCounts[normalizedJoint] =
          (jointCounts[normalizedJoint] || 0) + 1;
      });
    });

    const jointDistribution = Object.entries(
      jointCounts
    )
      .map(([joint, count]) => ({
        joint,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // =================================================
    // 13. BLEED FREQUENCY
    // =================================================

    const bleedFrequencyCounts = {};

    hemophiliaRecords.forEach((record) => {
      if (!record.bleedFrequency) return;

      const frequency = String(
        record.bleedFrequency
      ).trim();

      if (!frequency) return;

      bleedFrequencyCounts[frequency] =
        (bleedFrequencyCounts[frequency] || 0) + 1;
    });

    const bleedingFrequencyDistribution =
      Object.entries(bleedFrequencyCounts)
        .map(([frequency, count]) => ({
          frequency,
          count,
        }))
        .sort((a, b) => b.count - a.count);

    // =================================================
    // 14. LAST BLEED INFORMATION
    // =================================================

    const patientsWithLastBleedDate =
      hemophiliaRecords.filter(
        (record) => record.lastBleedDate
      );

    // =================================================
    // 15. BLEEDING TREND
    //
    // IMPORTANT:
    // We DO NOT have individual bleeding-event records.
    //
    // Therefore this is NOT pretending to be an
    // individual bleeding-event count.
    //
    // It shows the number of patient records having
    // a recorded lastBleedDate in each month.
    // =================================================

    const bleedingTrendMap = {};

    patientsWithLastBleedDate.forEach((record) => {
      const date = new Date(record.lastBleedDate);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const year = date.getFullYear();
      const month = date.getMonth();

      const monthKey = `${year}-${String(
        month + 1
      ).padStart(2, "0")}`;

      const monthLabel = date.toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        }
      );

      if (!bleedingTrendMap[monthKey]) {
        bleedingTrendMap[monthKey] = {
          month: monthLabel,
          events: 0,
        };
      }

      bleedingTrendMap[monthKey].events++;
    });

    const bleedingTrends = Object.entries(
      bleedingTrendMap
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    // =================================================
    // 16. ASSESSMENTS
    // =================================================

    const totalAssessments =
      await Assessment.countDocuments({
        userId: { $in: patientUserIds },
      });

    // =================================================
    // 17. ASSESSMENT DATA FOR CLINICAL ALERTS
    // =================================================

    const assessments =
      await Assessment.find({
        userId: { $in: patientUserIds },
      })
        .select(
          "score riskLevel emergencyFlag strongSuspicionFlag createdAt"
        )
        .lean();

    // =================================================
    // 17A. PATIENT LIST FOR THIS DOCTOR
    // =====================================================

    const latestAssessmentMap = new Map();

    assessments.forEach((assessment) => {
      const key = String(assessment.userId);
      const existing = latestAssessmentMap.get(key);

      if (
        !existing ||
        new Date(assessment.createdAt || 0) >
          new Date(existing.createdAt || 0)
      ) {
        latestAssessmentMap.set(key, assessment);
      }
    });

    const changeRequests = await DoctorChangeRequest.find({
      currentDoctorId: req.userId,
      status: 'PENDING',
    })
      .populate({
        path: 'patientUserId',
        select: '_id fullName',
      })
      .sort({ createdAt: -1 })
      .lean();

    const patients = hemophiliaRecords
      .map((record) => {
        const userId = String(record.userId);
        const profile = profileMap.get(userId) || {};
        const user = userMap.get(userId) || {};
        const latestAssessment =
          latestAssessmentMap.get(userId) || null;

        return {
          patientId: record.patientId || null,
          userId: record.userId,
          fullName: user.fullName || null,
          age: profile.age ?? null,
          gender: profile.gender ?? profile.sex ?? null,
          type: record.type ?? null,
          severity: record.severity ?? null,
          bleedingPattern: record.bleedingPattern ?? null,
          bleedFrequency: record.bleedFrequency ?? null,
          lastBleedDate: record.lastBleedDate ?? null,
          targetJoint: record.targetJoint ?? null,
          jointsAffected: Array.isArray(record.jointsAffected)
            ? record.jointsAffected
            : [],
          currentFactorTherapy: record.currentFactorTherapy ?? null,
          underPhysiotherapy: record.underPhysiotherapy ?? null,
          mobilityLimitation: record.mobilityLimitation ?? null,
          patientNotes: record.patientNotes ?? null,
          latestAssessment: latestAssessment
            ? {
                id: latestAssessment._id,
                score: latestAssessment.score ?? 0,
                riskLevel: latestAssessment.riskLevel ?? 'Unknown',
                emergencyFlag: Boolean(latestAssessment.emergencyFlag),
                strongSuspicionFlag: Boolean(
                  latestAssessment.strongSuspicionFlag
                ),
                createdAt: latestAssessment.createdAt ?? null,
              }
            : null,
        };
      })
      .sort((a, b) =>
        String(a.fullName || a.patientId || '').localeCompare(
          String(b.fullName || b.patientId || '')
        )
      );

    // =================================================
    // 18. HIGH / EMERGENCY ASSESSMENTS
    // =================================================

    let highRiskAssessments = 0;
    let emergencyAssessments = 0;
    let strongSuspicionAssessments = 0;

    assessments.forEach((assessment) => {
      const risk = String(
        assessment.riskLevel || ""
      ).toUpperCase();

      if (risk === "HIGH") {
        highRiskAssessments++;
      }

      if (risk === "EMERGENCY") {
        emergencyAssessments++;
      }

      if (
        assessment.strongSuspicionFlag === true
      ) {
        strongSuspicionAssessments++;
      }
    });

    // =================================================
    // 19. CLINICAL ALERTS
    //
    // These are AGGREGATED indicators.
    // No patient identity is returned.
    // =================================================

    const clinicalAlerts = [];

    // -------------------------------------------------
    // Emergency assessments
    // -------------------------------------------------

    if (emergencyAssessments > 0) {
      clinicalAlerts.push({
        type: "emergency",
        severity: "critical",
        title: "Emergency assessment findings",
        count: emergencyAssessments,
        description:
          "Assessment records contain emergency-level risk findings requiring clinical review.",
      });
    }

    // -------------------------------------------------
    // High-risk assessments
    // -------------------------------------------------

    if (highRiskAssessments > 0) {
      clinicalAlerts.push({
        type: "high_risk",
        severity: "high",
        title: "High-risk assessment findings",
        count: highRiskAssessments,
        description:
          "Assessment records are classified as high risk and may require clinical follow-up.",
      });
    }

    // -------------------------------------------------
    // Strong suspicion
    // -------------------------------------------------

    if (strongSuspicionAssessments > 0) {
      clinicalAlerts.push({
        type: "strong_suspicion",
        severity: "high",
        title: "Strong hemophilia suspicion",
        count: strongSuspicionAssessments,
        description:
          "Assessment records contain a strong-suspicion flag.",
      });
    }

    // -------------------------------------------------
    // Severe hemophilia
    // -------------------------------------------------

    if (severityDistribution.Severe > 0) {
      clinicalAlerts.push({
        type: "severe",
        severity: "high",
        title: "Severe hemophilia records",
        count: severityDistribution.Severe,
        description:
          "Patients with severe disease classification are present in the clinical records.",
      });
    }

    // -------------------------------------------------
    // Target joint
    // -------------------------------------------------

    const patientsWithTargetJoint =
      hemophiliaRecords.filter((record) =>
        (Array.isArray(record.targetJoint)
          ? record.targetJoint
          : [record.targetJoint]
        ).some(
          (joint) =>
            joint && String(joint).trim() !== ""
        )
      ).length;

    if (patientsWithTargetJoint > 0) {
      clinicalAlerts.push({
        type: "target_joint",
        severity: "high",
        title: "Target-joint involvement",
        count: patientsWithTargetJoint,
        description:
          "Patient records contain a documented target joint.",
      });
    }

    // -------------------------------------------------
    // Bleeding history without factor therapy
    // -------------------------------------------------

    const bleedingWithoutTherapy =
      hemophiliaRecords.filter((record) => {
        const hasBleedingHistory =
          Boolean(record.lastBleedDate) ||
          Boolean(record.bleedFrequency);

        const hasTherapy =
          record.currentFactorTherapy &&
          String(
            record.currentFactorTherapy
          ).trim() !== "";

        return (
          hasBleedingHistory &&
          !hasTherapy
        );
      }).length;

    if (bleedingWithoutTherapy > 0) {
      clinicalAlerts.push({
        type: "therapy_review",
        severity: "medium",
        title: "Bleeding history without recorded factor therapy",
        count: bleedingWithoutTherapy,
        description:
          "Records show bleeding history but no current factor therapy is recorded.",
      });
    }

    // -------------------------------------------------
    // Patients with recorded bleeding history
    // -------------------------------------------------

    if (
      patientsWithLastBleedDate.length > 0
    ) {
      clinicalAlerts.push({
        type: "bleeding_history",
        severity: "medium",
        title: "Recorded bleeding history",
        count:
          patientsWithLastBleedDate.length,
        description:
          "Patient records contain a recorded last bleeding date.",
      });
    }

    // =================================================
    // 20. SORT ALERTS
    //
    // Critical → High → Medium
    // =================================================

    const severityOrder = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

    clinicalAlerts.sort(
      (a, b) =>
        (severityOrder[a.severity] || 99) -
        (severityOrder[b.severity] || 99)
    );

    // =================================================
    // 21. DASHBOARD RESPONSE
    // =================================================

    return res.status(200).json({
      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        professionalId: doctor.professionalId,
        role: doctor.role,
      },

      // =================================================
      // OVERVIEW
      // =================================================

      overview: {
        // Number of patients currently assigned to this doctor.
        totalPatients,

        totalHemophiliaRecords:
          hemophiliaRecords.length,

        totalAssessments,

        patientsWithBleedingHistory:
          patientsWithLastBleedDate.length,
      },

      // =================================================
      // DISTRIBUTIONS
      // =================================================

      distributions: {
        hemophiliaTypes: typeDistribution,

        // Compatibility
        hemophiliaType: typeDistribution,

        severity: severityDistribution,

        ageDistribution,

        familyHistory: {
          yes: familyHistoryYes,
          no: familyHistoryNo,
          unknown: familyHistoryUnknown,
        },

        geneticTesting: {
          yes: geneticTestingYes,
          no: geneticTestingNo,
          unknown: geneticTestingUnknown,
        },

        factorTherapy: {
          active: factorTherapyCount,
          none: noFactorTherapyCount,
          unknown: therapyUnknown,
        },

        physiotherapy: {
          yes: physiotherapyYes,
          no: physiotherapyNo,
          unknown: physiotherapyUnknown,
        },

        affectedJoints: jointDistribution,
      },

      // =================================================
      // CLINICAL BACKGROUND
      // =================================================

      clinicalBackground: {
        jointDistribution,

        bleedingFrequencyDistribution,
      },

      // =================================================
      // BLEEDING TREND
      // =================================================

      bleedingTrends,

      // =================================================
      // CLINICAL ALERTS
      // =================================================

      clinicalAlerts,

      // =================================================
      // ASSIGNED PATIENT LIST
      // =================================================

      patients,

      // Pending doctor-change requests are limited to the
      // authenticated doctor's currently assigned patients.
      changeRequests: changeRequests.map((request) => ({
        id: request._id,
        patientId: request.patientId,
        patientName: request.patientUserId?.fullName || null,
        reason: request.reason || null,
        requestedAt: request.requestedAt || request.createdAt || null,
      })),

      // =================================================
      // EXTRA SUMMARY
      // =================================================

      clinicalSummary: {
        emergencyAssessments,
        highRiskAssessments,
        strongSuspicionAssessments,
        severePatients:
          severityDistribution.Severe,
        patientsWithTargetJoint,
        bleedingWithoutTherapy,
        patientsWithRecordedBleedingHistory:
          patientsWithLastBleedDate.length,
      },

      // =================================================
      // MESSAGE
      // =================================================

      message:
        "Doctor dashboard data retrieved successfully",
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "❌ Doctor Dashboard Error"
    );

    console.error(error);

    console.error(
      "================================="
    );

    return res.status(500).json({
      message:
        "Unable to load doctor dashboard data",
      error: error.message,
    });
  }
});

module.exports = router;
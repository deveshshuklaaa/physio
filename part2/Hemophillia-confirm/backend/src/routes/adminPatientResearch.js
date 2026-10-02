const express = require("express");

const adminAuth = require("../middleware/adminAuth");

const PatientProfile = require("../models/PatientProfile");
const User = require("../models/User");
const HemophiliaDetails = require("../models/HemophiliaDetails");
const Assessment = require("../models/Assessment");

// Exercise recommendations are monitored by admins in read-only mode.
// Keep this optional so existing patient research never breaks if the model is not installed yet.
let PatientExerciseRecommendation = null;
try {
  PatientExerciseRecommendation = require("../models/PatientExerciseRecommendation");
} catch (exerciseModelError) {
  console.warn("PatientExerciseRecommendation model unavailable:", exerciseModelError.message);
}

const generatePatientReport =
  require("../utils/generatePatientPDF");

const router = express.Router();

// ===========================================================
// PATIENT RESEARCH
// ===========================================================
//
// Administrator searches using:
//
//     GET /api/admin/patient-research/:patientId
//
// IMPORTANT:
// Assessment chatbot data comes from Assessment collection.
// ScreeningSession is NOT used here.
//
// ===========================================================


// ===========================================================
// HELPERS
// ===========================================================

function valueOrNull(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value;
}


function firstAvailable(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}


function formatDate(date) {
  if (!date) return null;

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
}


// ===========================================================
// GET ANSWER FROM ASSESSMENT
// ===========================================================

function getAnswer(assessment, questionPart) {
  if (
    !assessment ||
    !Array.isArray(assessment.answers)
  ) {
    return null;
  }

  const found = assessment.answers.find((item) => {
    const question = String(
      item?.question || ""
    ).toLowerCase();

    return question.includes(
      questionPart.toLowerCase()
    );
  });

  return found
    ? valueOrNull(found.answer)
    : null;
}


// ===========================================================
// BUILD SCREENING FACTORS FROM STORED ASSESSMENT ANSWERS
// ===========================================================
//
// We do NOT read ScreeningSession anymore.
//
// These values are derived from the exact answers stored
// inside Assessment.answers[].
//
// ===========================================================

function buildAssessmentFactors(assessment) {

  if (!assessment) {
    return {
      emergencySymptoms: [],
      bleedMinorCuts: null,
      dentalSurgeryBleeding: null,
      bruises: null,
      muscleSwelling: null,
      jointSwelling: null,
      jointsList: [],
      jointWarmthTightness: null,
      bloodUrineStool: null,
      familyHistory: null,
      maleRelativeFlag: false,
      heavyMenstrual: null,
      previousTesting: null,
      factorLow: null,
    };
  }


  const answers =
    Array.isArray(assessment.answers)
      ? assessment.answers
      : [];


  const factors = {
    emergencySymptoms: [],
    bleedMinorCuts: null,
    dentalSurgeryBleeding: null,
    bruises: null,
    muscleSwelling: null,
    jointSwelling: null,
    jointsList: [],
    jointWarmthTightness: null,
    bloodUrineStool: null,
    familyHistory: null,
    maleRelativeFlag: false,
    heavyMenstrual: null,
    previousTesting: null,
    factorLow: null,
  };


  for (const item of answers) {

    if (!item) continue;

    const question = String(
      item.question || ""
    )
      .toLowerCase()
      .trim();

    const answer = item.answer;


    if (!question) continue;


    // =====================================================
    // MINOR CUTS
    // =====================================================

    if (
      question.includes("minor cut")
    ) {
      factors.bleedMinorCuts = answer;
    }


    // =====================================================
    // DENTAL / SURGERY
    // =====================================================

    else if (
      question.includes("dental") ||
      question.includes("surgery") ||
      question.includes("tooth extraction")
    ) {
      factors.dentalSurgeryBleeding = answer;
    }


    // =====================================================
    // BRUISING
    // =====================================================

    else if (
      question.includes("bruise") ||
      question.includes("bruising")
    ) {
      factors.bruises = answer;
    }


    // =====================================================
    // MUSCLE SWELLING
    // =====================================================

    else if (
      question.includes("muscle swelling") ||
      question.includes("muscle bleed") ||
      question.includes("muscle bleeding")
    ) {
      factors.muscleSwelling = answer;
    }


    // =====================================================
    // JOINT SWELLING
    // =====================================================

    else if (
      question.includes("joint swelling") ||
      question.includes("swelling in your joints")
    ) {
      factors.jointSwelling = answer;
    }


    // =====================================================
    // JOINTS LIST
    // =====================================================

    else if (
      question.includes("which joint") ||
      question.includes("which joints") ||
      question.includes("affected joint") ||
      question.includes("affected joints")
    ) {

      if (Array.isArray(answer)) {

        factors.jointsList = answer;

      } else if (answer) {

        factors.jointsList = String(answer)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

      }

    }


    // =====================================================
    // JOINT WARMTH / TIGHTNESS
    // =====================================================

    else if (
      question.includes("warmth") ||
      question.includes("tightness") ||
      question.includes("warm or tight")
    ) {
      factors.jointWarmthTightness = answer;
    }


    // =====================================================
    // BLOOD IN URINE / STOOL
    // =====================================================

    else if (
      question.includes("blood in urine") ||
      question.includes("blood in stool") ||
      question.includes("urine") ||
      question.includes("stool")
    ) {
      factors.bloodUrineStool = answer;
    }


    // =====================================================
    // FAMILY HISTORY
    // =====================================================

    else if (
      question.includes("family history") ||
      question.includes("family member") ||
      question.includes("relatives")
    ) {

      factors.familyHistory = answer;

      if (
        String(answer)
          .toLowerCase()
          .includes("yes")
      ) {
        factors.maleRelativeFlag = true;
      }

    }


    // =====================================================
    // MALE RELATIVE
    // =====================================================

    else if (
      question.includes("male relative") ||
      question.includes("male family member") ||
      question.includes("brother") ||
      question.includes("father")
    ) {

      factors.maleRelativeFlag =
        answer === true ||
        String(answer)
          .toLowerCase() === "yes";

    }


    // =====================================================
    // MENSTRUAL
    // =====================================================

    else if (
      question.includes("menstrual") ||
      question.includes("period") ||
      question.includes("heavy bleeding during periods")
    ) {
      factors.heavyMenstrual = answer;
    }


    // =====================================================
    // PREVIOUS TESTING
    // =====================================================

    else if (
      question.includes("previous clotting factor test") ||
      question.includes("previous testing") ||
      question.includes("previous test") ||
      question.includes("tested for hemophilia") ||
      question.includes("blood test")
    ) {
      factors.previousTesting = answer;
    }


    // =====================================================
    // FACTOR LEVEL
    // =====================================================

    else if (
      question.includes("factor low") ||
      question.includes("factor level") ||
      question.includes("low factor") ||
      question.includes("clotting factor")
    ) {
      factors.factorLow = answer;
    }
  }


  return factors;
}


// ===========================================================
// BUILD BLEEDING HISTORY
// ===========================================================

function buildBleedingHistory(
  hemophilia,
  latestAssessment
) {

  const h = hemophilia || {};

  const factors =
    buildAssessmentFactors(
      latestAssessment
    );


  return {

    bleedFrequency:
      firstAvailable(
        h.bleedFrequency
      ),

    lastBleedDate:
      firstAvailable(
        h.lastBleedDate
      ),

    jointsAffected:
      Array.isArray(h.jointsAffected)
        ? h.jointsAffected
        : factors.jointsList,

    targetJoint:
      firstAvailable(
        h.targetJoint
      ),

    muscleSwelling:
      firstAvailable(
        factors.muscleSwelling
      ),

    jointSwelling:
      firstAvailable(
        factors.jointSwelling
      ),

    bloodUrineStool:
      firstAvailable(
        factors.bloodUrineStool
      ),

    bleedingAfterMinorCuts:
      firstAvailable(
        factors.bleedMinorCuts
      ),

    dentalSurgeryBleeding:
      firstAvailable(
        factors.dentalSurgeryBleeding
      ),

    bruising:
      firstAvailable(
        factors.bruises
      ),
  };
}


// ===========================================================
// FAMILY / GENETIC HISTORY
// ===========================================================
//
// IMPORTANT:
//
// Family History is taken from the actual Assessment
// answers.
//
// Genetic Testing / Factor Low will only be available
// if those questions are actually stored in Assessment.
// We do NOT invent these values.
//
// ===========================================================

function buildFamilyGeneticHistory(
  hemophilia,
  latestAssessment
) {

  const h = hemophilia || {};

  const factors =
    buildAssessmentFactors(
      latestAssessment
    );


  return {

    familyHistory:
      firstAvailable(
        h.familyHistory,
        factors.familyHistory
      ),

    geneticTestingDone:
      firstAvailable(
        h.geneticTestingDone
      ),

    previousTesting:
      firstAvailable(
        h.previousTesting,
        factors.previousTesting
      ),

    factorLow:
      firstAvailable(
        h.factorLow,
        factors.factorLow
      ),

    maleRelativeFlag:
      Boolean(
        firstAvailable(
          h.maleRelativeFlag,
          factors.maleRelativeFlag
        )
      ),
  };
}


// ===========================================================
// BUILD TREATMENT
// ===========================================================

function buildTreatment(hemophilia) {

  const h = hemophilia || {};

  return {

    currentFactorTherapy:
      valueOrNull(
        h.currentFactorTherapy
      ),

    otherMedications:
      valueOrNull(
        h.otherMedications
      ),

    underPhysiotherapy:
      h.underPhysiotherapy ?? null,

    mobilityLimitation:
      valueOrNull(
        h.mobilityLimitation
      ),

    assistiveDevices:
      valueOrNull(
        h.assistiveDevices
      ),
  };
}


// ===========================================================
// BUILD ASSESSMENT EXPLANATION
// ===========================================================

function buildAssessmentExplanation(
  assessment
) {

  if (!assessment) {

    return {
      score: null,
      riskLevel: null,
      explanation: [],
      summaryText: null,
      emergencyFlag: false,
      strongSuspicionFlag: false,
      answers: [],
      factors: {},
    };

  }


  let explanation = [];


  if (
    Array.isArray(
      assessment.explanation
    )
  ) {

    explanation =
      assessment.explanation
        .filter(Boolean);

  }


  // Older records fallback
  if (
    explanation.length === 0 &&
    assessment.summaryText
  ) {

    explanation =
      String(
        assessment.summaryText
      )
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

  }


  return {

    score:
      valueOrNull(
        assessment.score
      ),

    riskLevel:
      valueOrNull(
        assessment.riskLevel
      ),

    explanation,

    summaryText:
      valueOrNull(
        assessment.summaryText
      ),

    emergencyFlag:
      Boolean(
        assessment.emergencyFlag
      ),

    strongSuspicionFlag:
      Boolean(
        assessment.strongSuspicionFlag
      ),

    answers:
      Array.isArray(
        assessment.answers
      )
        ? assessment.answers
        : [],

    factors:
      buildAssessmentFactors(
        assessment
      ),
  };
}


// ===========================================================
// BUILD RISK TREND
// ===========================================================

function buildRiskTrend(
  assessments
) {

  return assessments.map(
    (assessment, index) => ({

      assessmentNumber:
        index + 1,

      assessmentId:
        String(
          assessment._id
        ),

      date:
        formatDate(
          assessment.createdAt
        ),

      score:
        assessment.score ?? 0,

      riskLevel:
        assessment.riskLevel ??
        "Unknown",

      emergency:
        Boolean(
          assessment.emergencyFlag
        ),

    })
  );
}


// ===========================================================
// BUILD JOINT DISTRIBUTION
// ===========================================================

function buildJointDistribution(
  hemophilia,
  assessments
) {

  const counts = {};

  const joints = [];


  // Current hemophilia profile
  if (
    hemophilia &&
    Array.isArray(
      hemophilia.jointsAffected
    )
  ) {

    joints.push(
      ...hemophilia.jointsAffected
    );

  }


  // Historical assessment answers
  for (
    const assessment
    of assessments
  ) {

    const factors =
      buildAssessmentFactors(
        assessment
      );


    if (
      Array.isArray(
        factors.jointsList
      )
    ) {

      joints.push(
        ...factors.jointsList
      );

    }

  }


  for (
    const joint
    of joints
  ) {

    if (!joint) continue;

    const name =
      String(joint).trim();

    if (!name) continue;

    counts[name] =
      (counts[name] || 0) + 1;
  }


  return Object.entries(
    counts
  )
    .map(
      ([joint, count]) => ({
        joint,
        count,
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    );
}


// ===========================================================
// BUILD PATIENT INSIGHTS
// ===========================================================

function buildInsights({
  hemophilia,
  latestAssessment,
}) {

  const insights = [];


  if (hemophilia) {

    if (hemophilia.severity) {

      insights.push({
        title:
          "Severity classification",

        type:
          "clinical",

        value:
          hemophilia.severity,
      });

    }


    if (hemophilia.type) {

      insights.push({
        title:
          "Hemophilia type",

        type:
          "clinical",

        value:
          hemophilia.type,
      });

    }


    if (
      hemophilia.bleedFrequency
    ) {

      insights.push({
        title:
          "Recorded bleeding frequency",

        type:
          "bleeding",

        value:
          hemophilia.bleedFrequency,
      });

    }

  }


  if (latestAssessment) {

    if (
      latestAssessment.riskLevel
    ) {

      insights.push({
        title:
          "Latest assessment risk",

        type:
          "assessment",

        value:
          latestAssessment.riskLevel,
      });

    }


    if (
      latestAssessment.emergencyFlag
    ) {

      insights.push({
        title:
          "Emergency symptoms",

        type:
          "warning",

        value:
          "Present",
      });

    }

  }


  return insights;
}
// =========================================================
// DOWNLOAD PATIENT CLINICAL RECORD PDF
// =========================================================
// =========================================================
// DOWNLOAD PATIENT CLINICAL SUMMARY PDF
// =========================================================

// =========================================================
// PATIENT CLINICAL SUMMARY PDF
// =========================================================

router.get(
  "/:patientId/pdf",
  adminAuth,

  async (req, res) => {
    try {
      const patientId = String(
        req.params.patientId || ""
      )
        .trim()
        .toUpperCase();

      console.log("=================================");
      console.log("ADMIN PATIENT PDF REQUEST");
      console.log("Patient ID:", patientId);
      console.log("Administrator User ID:", req.userId);
      console.log("Role:", req.role);
      console.log("=================================");

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: "Patient ID is required",
        });
      }

      // =====================================================
      // PATIENT PROFILE
      // =====================================================

      const profile =
        await PatientProfile.findOne({
          patientId,
        }).lean();

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const userId = profile.userId;

      // =====================================================
      // USER
      // =====================================================

      const user =
        await User.findById(userId).lean();

      // =====================================================
      // HEMOPHILIA DETAILS
      // =====================================================

      const hemophilia =
        await HemophiliaDetails.findOne({
          userId,
          patientId,
        }).lean();

      // =====================================================
      // ALL ASSESSMENTS
      //
      // We retrieve all assessments ONLY because the
      // report needs the risk trend.
      //
      // We DO NOT print every assessment.
      // =====================================================

      const assessments =
        await Assessment.find({
          userId,
          patientId,
        })
          .sort({
            createdAt: 1,
          })
          .lean();

      // =====================================================
      // HELPER
      // =====================================================

      const normalizeAnswer = (value) => {
        if (
          value === null ||
          value === undefined
        ) {
          return null;
        }

        return String(value)
          .trim()
          .toLowerCase();
      };

      // =====================================================
      // EXTRACT SCREENING INFORMATION
      // DIRECTLY FROM STORED CHATBOT ANSWERS
      // =====================================================

      function extractAssessmentFactors(
        assessment
      ) {
        const factors = {
          emergencySymptoms: [],
          bleedMinorCuts: null,
          dentalSurgeryBleeding: null,
          bruises: null,
          muscleSwelling: null,
          jointSwelling: null,
          jointsList: [],
          jointWarmthTightness: null,
          bloodUrineStool: null,
          familyHistory: null,
          maleRelativeFlag: false,
          heavyMenstrual: null,
          previousTesting: null,
          factorLow: null,
        };

        if (!assessment) {
          return factors;
        }

        // ===================================================
        // IF STRUCTURED DATA EXISTS, USE IT
        // ===================================================

        if (
          assessment.screeningFactors
        ) {
          return {
            ...factors,
            ...assessment.screeningFactors,
          };
        }

        // ===================================================
        // OTHERWISE READ ORIGINAL CHATBOT ANSWERS
        // ===================================================

        const answers =
          Array.isArray(
            assessment.answers
          )
            ? assessment.answers
            : [];

        for (const item of answers) {
          if (!item) continue;

          const question =
            String(
              item.question || ""
            )
              .trim()
              .toLowerCase();

          const answer =
            item.answer;

          const normalized =
            normalizeAnswer(answer);

          if (!question) continue;

          // -----------------------------------------------
          // MINOR CUTS
          // -----------------------------------------------

          if (
            question.includes(
              "minor cuts"
            ) ||
            question.includes(
              "minor cut"
            )
          ) {
            factors.bleedMinorCuts =
              answer;
          }

          // -----------------------------------------------
          // DENTAL / SURGERY
          // -----------------------------------------------

          else if (
            question.includes(
              "dental"
            ) ||
            question.includes(
              "surgery"
            ) ||
            question.includes(
              "tooth extraction"
            )
          ) {
            factors.dentalSurgeryBleeding =
              answer;
          }

          // -----------------------------------------------
          // BRUISING
          // -----------------------------------------------

          else if (
            question.includes(
              "bruise"
            ) ||
            question.includes(
              "bruising"
            )
          ) {
            factors.bruises =
              answer;
          }

          // -----------------------------------------------
          // MUSCLE SWELLING
          // -----------------------------------------------

          else if (
            question.includes(
              "muscle swelling"
            ) ||
            question.includes(
              "muscle bleed"
            ) ||
            question.includes(
              "muscle bleeding"
            )
          ) {
            factors.muscleSwelling =
              answer;
          }

          // -----------------------------------------------
          // JOINT SWELLING
          // -----------------------------------------------

          else if (
            question.includes(
              "joint swelling"
            ) ||
            question.includes(
              "repeated joint"
            )
          ) {
            factors.jointSwelling =
              answer;
          }

          // -----------------------------------------------
          // BLOOD URINE / STOOL
          // -----------------------------------------------

          else if (
            question.includes(
              "urine"
            ) ||
            question.includes(
              "stool"
            )
          ) {
            factors.bloodUrineStool =
              answer;
          }

          // -----------------------------------------------
          // FAMILY HISTORY
          // -----------------------------------------------

          else if (
            question.includes(
              "family history"
            ) ||
            question.includes(
              "family member"
            ) ||
            question.includes(
              "relative"
            )
          ) {
            factors.familyHistory =
              answer;

            if (
              normalized?.includes(
                "male"
              )
            ) {
              factors.maleRelativeFlag =
                true;
            }
          }

          // -----------------------------------------------
          // HEAVY MENSTRUAL BLEEDING
          // -----------------------------------------------

          else if (
            question.includes(
              "menstrual"
            ) ||
            question.includes(
              "period"
            )
          ) {
            factors.heavyMenstrual =
              answer;
          }

          // -----------------------------------------------
          // PREVIOUS TESTING
          // -----------------------------------------------

          else if (
            question.includes(
              "previous"
            ) &&
            (
              question.includes(
                "test"
              ) ||
              question.includes(
                "testing"
              )
            )
          ) {
            factors.previousTesting =
              answer;
          }

          // -----------------------------------------------
          // FACTOR LEVEL
          // -----------------------------------------------

          else if (
            question.includes(
              "factor level"
            ) ||
            question.includes(
              "clotting factor"
            ) ||
            question.includes(
              "low factor"
            )
          ) {
            factors.factorLow =
              answer;
          }
        }

        return factors;
      }

      // =====================================================
      // LATEST ASSESSMENT
      // =====================================================

      const latestAssessment =
        assessments.length > 0
          ? assessments[
              assessments.length - 1
            ]
          : null;

      const latestFactors =
        extractAssessmentFactors(
          latestAssessment
        );

      // =====================================================
      // BLEEDING HISTORY
      // =====================================================

      const bleedingHistory = {
        bleedFrequency:
          hemophilia?.bleedFrequency ??
          null,

        lastBleedDate:
          hemophilia?.lastBleedDate ??
          null,

        jointsAffected:
          Array.isArray(
            hemophilia?.jointsAffected
          )
            ? hemophilia.jointsAffected
            : latestFactors.jointsList,

        targetJoint:
          hemophilia?.targetJoint ??
          null,

        bleedingAfterMinorCuts:
          latestFactors.bleedMinorCuts,

        dentalSurgeryBleeding:
          latestFactors.dentalSurgeryBleeding,

        bruising:
          latestFactors.bruises,

        muscleSwelling:
          latestFactors.muscleSwelling,

        jointSwelling:
          latestFactors.jointSwelling,

        bloodUrineStool:
          latestFactors.bloodUrineStool,
      };

      // =====================================================
      // FAMILY / GENETIC
      // =====================================================

      const familyGeneticHistory = {
        familyHistory:
          latestFactors.familyHistory,

        maleRelativeFlag:
          latestFactors.maleRelativeFlag,

        previousTesting:
          latestFactors.previousTesting,

        factorLow:
          latestFactors.factorLow,
      };

      // =====================================================
      // TREATMENT
      // =====================================================

      const treatment = {
        currentFactorTherapy:
          hemophilia?.currentFactorTherapy ??
          null,

        otherMedications:
          hemophilia?.otherMedications ??
          null,

        underPhysiotherapy:
          hemophilia?.underPhysiotherapy ??
          null,

        mobilityLimitation:
          hemophilia?.mobilityLimitation ??
          null,

        assistiveDevices:
          hemophilia?.assistiveDevices ??
          null,
      };

      // =====================================================
      // EMERGENCY CONTACT
      // =====================================================

      // =====================================================
// EMERGENCY CONTACT
// =====================================================
// Supports both:
// 1. Nested emergencyContact object
// 2. Individual emergencyContactName / Relationship / Phone fields
// =====================================================

// =====================================================
// EMERGENCY CONTACT
// =====================================================
// PatientProfile stores these fields as:
// emergencyName
// emergencyRelationship
// emergencyPhone
// =====================================================

const emergencyContact = {
  name: firstAvailable(
    profile?.emergencyName,
    user?.emergencyName
  ),

  relationship: firstAvailable(
    profile?.emergencyRelationship,
    user?.emergencyRelationship
  ),

  phone: firstAvailable(
    profile?.emergencyPhone,
    user?.emergencyPhone
  ),
};

console.log("=================================");
console.log("EMERGENCY CONTACT FOR PDF");
console.log("Name:", emergencyContact.name);
console.log(
  "Relationship:",
  emergencyContact.relationship
);
      // =====================================================
      // IMPORTANT TIMELINE
      // =====================================================

      const timeline = [];

      if (user?.createdAt) {
        timeline.push({
          title:
            "Patient account created",

          description:
            "Patient account registered in the system",

          date:
            user.createdAt,
        });
      }

      if (profile?.createdAt) {
        timeline.push({
          title:
            "Patient profile created",

          description:
            "Patient demographic profile recorded",

          date:
            profile.createdAt,
        });
      }

      if (assessments.length > 0) {
        const first =
          assessments[0];

        timeline.push({
          title:
            "Initial Risk Assessment",

          description:
            `Risk: ${
              first.riskLevel ||
              "Not available"
            } | Score: ${
              first.score ?? 0
            }`,

          date:
            first.createdAt,
        });
      }

      if (
        assessments.length > 1
      ) {
        timeline.push({
          title:
            "Latest Risk Assessment",

          description:
            `Risk: ${
              latestAssessment?.riskLevel ||
              "Not available"
            } | Score: ${
              latestAssessment?.score ??
              0
            }`,

          date:
            latestAssessment?.createdAt,
        });
      }

      if (hemophilia?.createdAt) {
        timeline.push({
          title:
            "Hemophilia information recorded",

          description:
            "Clinical hemophilia profile was recorded",

          date:
            hemophilia.createdAt,
        });
      }

      timeline.sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );

      // =====================================================
      // REPORT DATA
      // =====================================================

      const reportData = {
        patient: {
          patientId:
            profile.patientId,

          fullName:
            profile.fullName,

          age:
            profile.age,

          gender:
            profile.gender,

          bloodGroup:
            profile.bloodGroup,

          dateOfBirth:
            profile.dateOfBirth,

          status:
            profile.status,
        },

        hemophilia,

        bleedingHistory,

        familyGeneticHistory,

        treatment,

        emergencyContact,

        assessmentHistory:
          assessments,

        latestAssessment,

        timeline,

        statistics: {
          totalAssessments:
            assessments.length,

          affectedJointCount:
            Array.isArray(
              bleedingHistory.jointsAffected
            )
              ? bleedingHistory
                  .jointsAffected.length
              : 0,
        },
      };

      // =====================================================
      // GENERATE PDF
      // =====================================================

      return generatePatientReport(
        reportData,
        res
      );

    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "PATIENT PDF ERROR:"
      );

      console.error(error);

      console.error(
        "================================="
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message:
            "Failed to generate patient PDF",

          error:
            error.message,
        });
      }
    }
  }
);
// ===========================================================
// GET PATIENT RESEARCH
// ===========================================================

router.get(
  "/:patientId",

  adminAuth,

  async (req, res) => {

    try {

      const patientId =
        String(
          req.params.patientId || ""
        )
          .trim()
          .toUpperCase();


      console.log(
        "================================="
      );

      console.log(
        "ADMIN PATIENT RESEARCH REQUEST"
      );

      console.log(
        "Patient ID:",
        patientId
      );

      console.log(
        "Administrator User ID:",
        req.userId
      );

      console.log(
        "Role:",
        req.role
      );

      console.log(
        "================================="
      );


      if (!patientId) {

        return res.status(400).json({

          success: false,

          message:
            "Patient ID is required",

        });

      }


      // =====================================================
      // 1. PATIENT PROFILE
      // =====================================================

      const profile =
        await PatientProfile.findOne({
          patientId,
        }).lean();


      if (!profile) {

        return res.status(404).json({

          success: false,

          message:
            "Patient profile not found",

        });

      }


      const userId =
        profile.userId;


      // =====================================================
      // 2. USER
      // =====================================================

      const user =
        await User.findById(
          userId
        ).lean();


      // =====================================================
      // 3. HEMOPHILIA DETAILS
      // =====================================================

      const hemophilia =
        await HemophiliaDetails.findOne({

          userId,

          patientId,

        }).lean();


      // =====================================================
      // 4. ALL ASSESSMENTS
      // =====================================================
      //
      // THIS IS NOW THE MAIN SOURCE FOR ASSESSMENT DATA.
      //
      // Every assessment keeps:
      //
      // score
      // riskLevel
      // answers[]
      // explanation[]
      // emergencyFlag
      // strongSuspicionFlag
      //
      // =====================================================

      const assessments =
        await Assessment.find({

          userId,

          patientId,

        })
          .sort({
            createdAt: 1,
          })
          .lean();


      const latestAssessment =
        assessments.length
          ? assessments[
              assessments.length - 1
            ]
          : null;


      // =====================================================
      // 5. BLEEDING HISTORY
      // =====================================================

      const bleedingHistory =
        buildBleedingHistory(
          hemophilia,
          latestAssessment
        );


      // =====================================================
      // 6. FAMILY / GENETIC HISTORY
      // =====================================================

      const familyGeneticHistory =
        buildFamilyGeneticHistory(
          hemophilia,
          latestAssessment
        );


      // =====================================================
      // 7. TREATMENT
      // =====================================================

      const treatment =
        buildTreatment(
          hemophilia
        );


      // =====================================================
      // 8. PATIENT INFORMATION
      // =====================================================

      const patient = {

        patientId:
          profile.patientId,

        userId:
          profile.userId,

        fullName:
          firstAvailable(
            profile.fullName,
            user?.fullName
          ),

        gender:
          firstAvailable(
            profile.gender,
            user?.gender
          ),

        age:
          firstAvailable(
            profile.age,
            user?.age
          ),

        dateOfBirth:
          firstAvailable(
            profile.dateOfBirth,
            user?.dateOfBirth,
            profile.dob
          ),

        bloodGroup:
          firstAvailable(
            profile.bloodGroup,
            user?.bloodGroup
          ),

        state:
          firstAvailable(
            profile.state,
            user?.state
          ),

        city:
          firstAvailable(
            profile.city,
            user?.city
          ),

        pinCode:
          firstAvailable(
            profile.pinCode,
            profile.pincode,
            user?.pinCode
          ),

        status:
          "Active",
      };


      // =====================================================
      // 9. CONTACT
      // =====================================================

      const contact = {

        mobile:
          firstAvailable(
            profile.mobile,
            profile.phone,
            user?.mobile,
            user?.phone
          ),

        alternateContact:
          firstAvailable(
            profile.alternateContact,
            profile.alternatePhone
          ),

        email:
          firstAvailable(
            profile.email,
            user?.email
          ),

        address:
          firstAvailable(
            profile.address
          ),

        city:
          firstAvailable(
            profile.city,
            user?.city
          ),

        state:
          firstAvailable(
            profile.state,
            user?.state
          ),

        pinCode:
          firstAvailable(
            profile.pinCode,
            profile.pincode,
            user?.pinCode
          ),
      };


      // =====================================================
      // 10. EMERGENCY CONTACT
      // =====================================================

      const emergencyContact = {

        name:
          firstAvailable(
            profile.emergencyContactName,
            profile.emergencyName
          ),

        relationship:
          firstAvailable(
            profile.emergencyContactRelationship,
            profile.emergencyRelationship
          ),

        phone:
          firstAvailable(
            profile.emergencyContactPhone,
            profile.emergencyPhone
          ),

      };


      // =====================================================
      // 11. CARE TEAM
      // =====================================================

      const careTeam = {

        htcName:
          firstAvailable(
            hemophilia?.htcName,
            profile.htcName
          ),

        hematologistName:
          firstAvailable(
            hemophilia?.hematologistName,
            profile.hematologistName
          ),

        hospitalName:
          firstAvailable(
            hemophilia?.hospitalName,
            profile.hospitalName
          ),

        existingPatientNumber:
          firstAvailable(
            hemophilia?.existingPatientNumber,
            profile.existingPatientNumber
          ),

      };


      // =====================================================
      // 12. ASSESSMENT HISTORY
      // =====================================================
      //
      // IMPORTANT:
      //
      // Every assessment is returned individually.
      //
      // The frontend can therefore select:
      //
      // Assessment 1
      // Assessment 2
      // Assessment 3
      // ...
      //
      // and see the EXACT answers belonging to that
      // assessment.
      //
      // =====================================================

      const assessmentHistory =
        assessments.map(
          (assessment, index) => {

            const factors =
              buildAssessmentFactors(
                assessment
              );


            return {

              id:
                String(
                  assessment._id
                ),

              assessmentNumber:
                index + 1,

              date:
                formatDate(
                  assessment.createdAt
                ),

              score:
                assessment.score ?? 0,

              riskLevel:
                assessment.riskLevel ??
                "Unknown",

              emergencyFlag:
                Boolean(
                  assessment.emergencyFlag
                ),

              strongSuspicionFlag:
                Boolean(
                  assessment.strongSuspicionFlag
                ),

              // EXACT explanation stored
              explanation:
                Array.isArray(
                  assessment.explanation
                )
                  ? assessment.explanation
                  : [],

              // EXACT summary stored
              summaryText:
                assessment.summaryText ??
                "",

              // EXACT Q&A stored
              answers:
                Array.isArray(
                  assessment.answers
                )
                  ? assessment.answers
                  : [],

              // Derived structured information
              factors,

            };

          }
        );


      // =====================================================
      // 13. LATEST ASSESSMENT
      // =====================================================

      const latestAssessmentData =
        latestAssessment
          ? {

              id:
                String(
                  latestAssessment._id
                ),

              assessmentNumber:
                assessments.length,

              date:
                formatDate(
                  latestAssessment.createdAt
                ),

              score:
                latestAssessment.score ??
                0,

              riskLevel:
                latestAssessment.riskLevel ??
                "Unknown",

              emergencyFlag:
                Boolean(
                  latestAssessment.emergencyFlag
                ),

              strongSuspicionFlag:
                Boolean(
                  latestAssessment.strongSuspicionFlag
                ),

              explanation:
                Array.isArray(
                  latestAssessment.explanation
                )
                  ? latestAssessment.explanation
                  : [],

              summaryText:
                latestAssessment.summaryText ??
                "",

              answers:
                Array.isArray(
                  latestAssessment.answers
                )
                  ? latestAssessment.answers
                  : [],

              factors:
                buildAssessmentFactors(
                  latestAssessment
                ),

            }

          : null;


      // =====================================================
      // 14. ANALYTICS
      // =====================================================

      const riskTrend =
        buildRiskTrend(
          assessments
        );


      const jointDistribution =
        buildJointDistribution(
          hemophilia,
          assessments
        );


      // =====================================================
      // 15. INSIGHTS
      // =====================================================

      const insights =
        buildInsights({

          hemophilia,

          latestAssessment,

        });


      // =====================================================
      // 16. STATISTICS
      // =====================================================

      const affectedJointCount =
        Array.isArray(
          bleedingHistory.jointsAffected
        )
          ? bleedingHistory
              .jointsAffected.length
          : 0;


      const statistics = {

        totalAssessments:
          assessments.length,

        totalScreenings:
          0,

        totalTimelineEvents:
          0,

        affectedJointCount,

      };


      // =====================================================
      // 17. TIMELINE
      // =====================================================

      const timeline = [];


      // Patient account
      if (user?.createdAt) {

        timeline.push({

          type:
            "account_created",

          title:
            "Patient account created",

          description:
            "Patient account registered in the system",

          date:
            formatDate(
              user.createdAt
            ),

        });

      }


      // Patient profile
      if (profile.createdAt) {

        timeline.push({

          type:
            "profile_created",

          title:
            "Patient profile created",

          description:
            "Patient demographic profile recorded",

          date:
            formatDate(
              profile.createdAt
            ),

        });

      }


      // Assessments
      for (
        const assessment
        of assessments
      ) {

        timeline.push({

          type:
            "assessment",

          title:
            "Clinical assessment",

          description:
            `Risk: ${
              assessment.riskLevel ||
              "Unknown"
            } | Score: ${
              assessment.score ??
              0
            }`,

          date:
            formatDate(
              assessment.createdAt
            ),

        });

      }


      // Hemophilia record
      if (
        hemophilia?.createdAt
      ) {

        timeline.push({

          type:
            "hemophilia_record",

          title:
            "Hemophilia information recorded",

          description:
            "Clinical hemophilia profile was recorded",

          date:
            formatDate(
              hemophilia.createdAt
            ),

        });

      }


      timeline.sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


      statistics.totalTimelineEvents =
        timeline.length;


      // =====================================================
      // 18. EXERCISE MONITORING (ADMIN VIEW ONLY)
      // =====================================================
      let exerciseRecommendations = [];
      let exerciseSummary = {
        total: 0,
        active: 0,
        pending: 0,
        doctorAdded: 0,
      };

      if (PatientExerciseRecommendation) {
        try {
          exerciseRecommendations = await PatientExerciseRecommendation.find({
            patientUserId: userId,
            status: { $in: ["PENDING_DOCTOR_REVIEW", "ACTIVE", "REMOVED"] },
          })
            .sort({ recommendedAt: -1 })
            .lean();

          exerciseSummary = {
            total: exerciseRecommendations.length,
            active: exerciseRecommendations.filter((x) => x.status === "ACTIVE").length,
            pending: exerciseRecommendations.filter((x) => x.status === "PENDING_DOCTOR_REVIEW").length,
            doctorAdded: exerciseRecommendations.filter((x) => String(x.source || "").toUpperCase() === "DOCTOR").length,
          };
        } catch (exerciseError) {
          console.error("ADMIN EXERCISE MONITORING ERROR:", exerciseError);
        }
      }

      // =====================================================
      // 19. RESPONSE
      // =====================================================

      return res.status(200).json({

        success: true,

        message:
          "Patient research data retrieved successfully",

        patient,

        contact,

        emergencyContact,

        careTeam,

        hemophilia:
          hemophilia || null,

        bleedingHistory,

        familyGeneticHistory,

        treatment,

        latestAssessment:
          latestAssessmentData,

        assessmentHistory,

        // ScreeningSession intentionally removed
        screeningHistory: [],

        latestScreening: null,

        charts: {

          riskTrend,

          jointDistribution,

        },

        insights,

        statistics,

        timeline,

        exerciseRecommendations,

        exerciseSummary,

      });

    } catch (error) {

      console.error(
        "================================="
      );

      console.error(
        "PATIENT RESEARCH ERROR"
      );

      console.error(error);

      console.error(
        "================================="
      );


      return res.status(500).json({

        success: false,

        message:
          "Failed to retrieve patient research data",

        error:
          error.message,

      });

    }

  }
);


module.exports = router;
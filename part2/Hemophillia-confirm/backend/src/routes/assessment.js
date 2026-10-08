
const express = require("express");
const authMiddleware = require("../middleware/auth");

const Assessment = require("../models/Assessment");
const PatientProfile = require("../models/PatientProfile");
const User = require("../models/User");
const clinicalRecords = require("../services/clinicalRecords");

const saveFHIRBundle = require("../utils/saveFHIRBundle");
const { toFHIRBundle } = require("../fhir/bundleMapper");

const router = express.Router();


// =====================================================
// BUILD STRUCTURED ASSESSMENT DATA
// =====================================================
//
// IMPORTANT:
// The chatbot now sends canonical ML feature names.
// Hindi / Marathi are only UI languages.
//
// Example:
//
// Hindi UI:    "हाँ"
// Marathi UI:  "होय"
// English UI:  "Yes"
//
// Backend/ML value:
// "yes"
//
// Therefore this function stores language-independent
// canonical values.
// =====================================================

function buildScreeningFactors(
  answers = [],
  mlFeatures = {}
) {
  const factors = {
    emergencySymptoms: [],

    bleedMinorCuts: "",
    dentalSurgeryBleeding: "",
    bruises: "",
    muscleSwelling: "",
    jointSwelling: "",

    jointsList: [],

    jointWarmthTightness: "",

    bloodUrineStool: "",

    familyHistory: "",

    maleRelativeFlag: false,

    heavyMenstrual: "",

    previousTesting: "",

    factorLow: "",
  };


  // ===================================================
  // CURRENT ML CHATBOT FEATURES
  // ===================================================

  if (
    mlFeatures &&
    typeof mlFeatures === "object"
  ) {

    factors.bleedMinorCuts =
      mlFeatures.prolonged_bleeding_minor_cut ??
      "";

    factors.dentalSurgeryBleeding =
      mlFeatures.excessive_dental_bleeding ??
      mlFeatures.excessive_post_surgery_bleeding ??
      "";

    factors.bruises =
      mlFeatures.easy_bruising ??
      "";

    factors.muscleSwelling =
      mlFeatures.muscle_hematoma ??
      "";

    factors.jointSwelling =
      mlFeatures.recurrent_joint_bleeding ??
      "";

    factors.jointWarmthTightness =
      mlFeatures.joint_warmth ??
      mlFeatures.joint_tightness ??
      "";

    // -----------------------------------------------
    // BLOOD IN URINE / STOOL
    // -----------------------------------------------

    if (
      mlFeatures.hematuria === "yes" ||
      mlFeatures.hematochezia === "yes"
    ) {
      factors.bloodUrineStool = "yes";
    }
    else if (
      mlFeatures.hematuria === "no" &&
      mlFeatures.hematochezia === "no"
    ) {
      factors.bloodUrineStool = "no";
    }

    // -----------------------------------------------
    // FAMILY HISTORY
    // -----------------------------------------------

    factors.familyHistory =
      mlFeatures.family_history_bleeding_disorder ??
      "";

    // -----------------------------------------------
    // MALE RELATIVE
    // -----------------------------------------------

    factors.maleRelativeFlag =
      mlFeatures.male_relative_with_hemophilia === "yes" ||
      mlFeatures.male_relative_with_hemophilia === true;

    // -----------------------------------------------
    // PREVIOUS FACTOR TEST
    // -----------------------------------------------

    factors.previousTesting =
      mlFeatures.previous_factor_test ??
      "";
  }


  // ===================================================
  // OLD / LEGACY ANSWER FORMAT
  // ===================================================
  //
  // This keeps compatibility with older chatbot data.
  // ===================================================

  for (const item of answers) {

    if (!item) continue;

    const question =
      String(item.question || "")
        .toLowerCase()
        .trim();

    const answer = item.answer;

    if (!question) continue;

    const normalizedAnswer =
      typeof answer === "string"
        ? answer.toLowerCase().trim()
        : answer;


    // =================================================
    // CANONICAL FEATURE NAMES
    // =================================================

    if (
      question ===
      "prolonged_bleeding_minor_cut"
    ) {
      factors.bleedMinorCuts = answer;
      continue;
    }


    if (
      question ===
        "excessive_dental_bleeding" ||
      question ===
        "excessive_post_surgery_bleeding"
    ) {
      factors.dentalSurgeryBleeding =
        answer;
      continue;
    }


    if (
      question === "easy_bruising"
    ) {
      factors.bruises = answer;
      continue;
    }


    if (
      question === "muscle_hematoma"
    ) {
      factors.muscleSwelling =
        answer;
      continue;
    }


    if (
      question ===
      "recurrent_joint_bleeding"
    ) {
      factors.jointSwelling =
        answer;
      continue;
    }


    if (
      question === "joint_warmth" ||
      question === "joint_tightness" ||
      question === "reduced_joint_mobility"
    ) {
      factors.jointWarmthTightness =
        answer;
      continue;
    }


    if (
      question === "hematuria"
    ) {

      if (
        normalizedAnswer === "yes"
      ) {
        factors.bloodUrineStool =
          "yes";
      }

      continue;
    }


    if (
      question === "hematochezia"
    ) {

      if (
        normalizedAnswer === "yes"
      ) {
        factors.bloodUrineStool =
          "yes";
      }
      else if (
        normalizedAnswer === "no" &&
        !factors.bloodUrineStool
      ) {
        factors.bloodUrineStool =
          "no";
      }

      continue;
    }


    if (
      question ===
      "family_history_bleeding_disorder"
    ) {
      factors.familyHistory =
        answer;
      continue;
    }


    if (
      question ===
      "male_relative_with_hemophilia"
    ) {

      factors.maleRelativeFlag =
        normalizedAnswer === "yes" ||
        normalizedAnswer === true;

      continue;
    }


    if (
      question ===
      "previous_factor_test"
    ) {
      factors.previousTesting =
        answer;
      continue;
    }


    // =================================================
    // OLD NATURAL LANGUAGE FORMAT
    // =================================================

    if (
      question.includes("emergency") ||
      question.includes("life threatening") ||
      question.includes("head injury") ||
      question.includes("severe bleeding") ||
      question.includes("blood in vomit") ||
      question.includes("joint immobility") ||
      question.includes("red-flag") ||
      question.includes("red flag")
    ) {

      factors.emergencySymptoms =
        Array.isArray(answer)
          ? answer
          : answer
            ? [answer]
            : [];

      continue;
    }


    // =================================================
    // MINOR CUTS
    // =================================================

    if (
      question.includes("minor cut") ||
      question.includes("minor cuts")
    ) {

      factors.bleedMinorCuts =
        answer;

      continue;
    }


    // =================================================
    // DENTAL / SURGERY
    // =================================================

    if (
      question.includes("dental") ||
      question.includes("surgery") ||
      question.includes("tooth extraction")
    ) {

      factors.dentalSurgeryBleeding =
        answer;

      continue;
    }


    // =================================================
    // BRUISING
    // =================================================

    if (
      question.includes("bruise") ||
      question.includes("bruising")
    ) {

      factors.bruises =
        answer;

      continue;
    }


    // =================================================
    // MUSCLE BLEEDING
    // =================================================

    if (
      question.includes("muscle swelling") ||
      question.includes("muscle bleed") ||
      question.includes("muscle bleeding") ||
      question.includes("deep muscle")
    ) {

      factors.muscleSwelling =
        answer;

      continue;
    }


    // =================================================
    // JOINT SWELLING
    // =================================================

    if (
      question.includes("joint swelling") ||
      question.includes("swelling in your joints") ||
      question.includes("repeated joint")
    ) {

      factors.jointSwelling =
        answer;

      continue;
    }


    // =================================================
    // JOINT LIST
    // =================================================

    if (
      question.includes("which joint") ||
      question.includes("which joints") ||
      question.includes("affected joint") ||
      question.includes("affected joints")
    ) {

      factors.jointsList =
        Array.isArray(answer)
          ? answer
          : answer
            ? String(answer)
                .split(",")
                .map(
                  (x) => x.trim()
                )
                .filter(Boolean)
            : [];

      continue;
    }


    // =================================================
    // JOINT WARMTH / TIGHTNESS
    // =================================================

    if (
      question.includes("warmth") ||
      question.includes("tightness") ||
      question.includes("warm or tight")
    ) {

      factors.jointWarmthTightness =
        answer;

      continue;
    }


    // =================================================
    // BLOOD IN URINE / STOOL
    // =================================================

    if (
      question.includes("blood in urine") ||
      question.includes("blood in stool") ||
      question.includes("urine/stool") ||
      question.includes("urine") ||
      question.includes("stool")
    ) {

      factors.bloodUrineStool =
        answer;

      continue;
    }


    // =================================================
    // FAMILY HISTORY
    // =================================================

    if (
      question.includes("family history") ||
      question.includes("family member") ||
      question.includes("relatives")
    ) {

      factors.familyHistory =
        answer;

      if (
        normalizedAnswer === "yes" ||
        (
          typeof normalizedAnswer === "string" &&
          normalizedAnswer.includes("male")
        )
      ) {
        factors.maleRelativeFlag =
          true;
      }

      continue;
    }


    // =================================================
    // MALE RELATIVE
    // =================================================

    if (
      question.includes("male relative") ||
      question.includes("male family member") ||
      question.includes("brother") ||
      question.includes("father")
    ) {

      factors.maleRelativeFlag =
        normalizedAnswer === "yes" ||
        normalizedAnswer === true;

      continue;
    }


    // =================================================
    // HEAVY MENSTRUAL BLEEDING
    // =================================================

    if (
      question.includes("menstrual") ||
      question.includes("period") ||
      question.includes(
        "heavy bleeding during periods"
      )
    ) {

      factors.heavyMenstrual =
        answer;

      continue;
    }


    // =================================================
    // PREVIOUS CLOTTING FACTOR TEST
    // =================================================

    if (
      question.includes(
        "previous clotting factor test"
      ) ||
      question.includes(
        "previous testing"
      ) ||
      question.includes(
        "previous test"
      ) ||
      question.includes(
        "tested for hemophilia"
      )
    ) {

      factors.previousTesting =
        answer;

      continue;
    }


    // =================================================
    // LOW FACTOR HISTORY
    // =================================================

    if (
      question.includes("factor low") ||
      question.includes("factor level") ||
      question.includes("low factor") ||
      question.includes("clotting factor")
    ) {

      factors.factorLow =
        answer;

      continue;
    }
  }


  return factors;
}



// =====================================================
// BUILD TRACEABLE EXPLANATION
// =====================================================

function buildExplanation(
  answers = []
) {

  const explanations = [];


  for (const item of answers) {

    if (!item) continue;

    const question =
      String(item.question || "")
        .trim();

    const answer =
      String(item.answer || "")
        .trim();

    if (
      !question ||
      !answer
    ) {
      continue;
    }

    const q =
      question.toLowerCase();

    const a =
      answer.toLowerCase();


    // =================================================
    // MINOR CUTS
    // =================================================

    if (
      q.includes("minor cut") ||
      q.includes("minor cuts")
    ) {

      if (a === "sometimes") {

        explanations.push(
          "Occasional prolonged bleeding after minor cuts"
        );
      }

      if (a === "often") {

        explanations.push(
          "Frequent prolonged bleeding after minor cuts"
        );
      }
    }


    // =================================================
    // DENTAL / SURGERY
    // =================================================

    else if (
      q.includes("dental") ||
      q.includes("surgery") ||
      q.includes("tooth extraction")
    ) {

      if (a === "yes") {

        explanations.push(
          "Excess bleeding after dental or surgical procedures"
        );
      }

      if (
        a === "not sure" ||
        a === "not_sure"
      ) {

        explanations.push(
          "Uncertain history of bleeding after procedures"
        );
      }
    }


    // =================================================
    // BRUISING
    // =================================================

    else if (
      q.includes("bruise") ||
      q.includes("bruising")
    ) {

      if (a === "sometimes") {

        explanations.push(
          "Moderate bruising tendency"
        );
      }

      if (a === "often") {

        explanations.push(
          "Frequent bruising tendency"
        );
      }
    }


    // =================================================
    // MUSCLE BLEEDING
    // =================================================

    else if (
      q.includes("muscle swelling") ||
      q.includes("muscle bleed") ||
      q.includes("muscle bleeding") ||
      q.includes("deep muscle")
    ) {

      if (a === "yes") {

        explanations.push(
          "Muscle bleeding symptoms"
        );
      }
    }


    // =================================================
    // JOINT BLEEDING
    // =================================================

    else if (
      q.includes("joint swelling") ||
      q.includes("repeated joint")
    ) {

      if (a === "yes") {

        explanations.push(
          "Joint bleeding pattern"
        );
      }
    }


    // =================================================
    // INTERNAL BLEEDING
    // =================================================

    else if (
      q.includes("blood in urine") ||
      q.includes("blood in stool") ||
      q.includes("urine/stool")
    ) {

      if (a === "yes") {

        explanations.push(
          "Internal bleeding symptoms"
        );
      }
    }


    // =================================================
    // FAMILY HISTORY
    // =================================================

    else if (
      q.includes("family history") ||
      q.includes("family member") ||
      q.includes("relatives")
    ) {

      if (a === "yes") {

        explanations.push(
          "Family history positive"
        );
      }

      if (
        a === "unknown" ||
        a === "not sure" ||
        a === "not_sure"
      ) {

        explanations.push(
          "Family history is uncertain"
        );
      }
    }


    // =================================================
    // HEAVY MENSTRUAL BLEEDING
    // =================================================

    else if (
      q.includes("menstrual") ||
      q.includes("period")
    ) {

      if (a === "yes") {

        explanations.push(
          "Heavy menstrual bleeding"
        );
      }
    }


    // =================================================
    // PREVIOUS TESTING
    // =================================================

    else if (
      q.includes(
        "previous clotting factor test"
      ) ||
      q.includes("previous testing") ||
      q.includes("previous test")
    ) {

      if (a === "yes") {

        explanations.push(
          "Previous clotting-factor testing reported"
        );
      }

      if (
        a === "unknown" ||
        a === "not sure" ||
        a === "not_sure"
      ) {

        explanations.push(
          "Previous clotting-factor testing history is uncertain"
        );
      }
    }
  }


  return [
    ...new Set(
      explanations
    ),
  ];
}



// =====================================================
// SAVE ASSESSMENT
// =====================================================

router.post(
  "/save",
  authMiddleware,
  async (req, res) => {

    try {

      // =================================================
      // REQUEST DATA
      // =================================================

      const {
        score,
        totalScore,
        riskLevel,
        answers,
        explanation,
        emergencyFlag,
        strongSuspicionFlag,

        // -----------------------------------------------
        // ML RESULT
        // -----------------------------------------------

        mlPrediction,
        mlPredictionLabel,
        mlPredictionProbability,
        mlProbabilities,
        mlFeatures,

        // -----------------------------------------------
        // LANGUAGE
        // -----------------------------------------------

        language,

      } = req.body;


      // =================================================
      // VALIDATION
      // =================================================

      if (
        !Array.isArray(answers)
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Answers must be an array",
        });
      }


      if (
        answers.length === 0
      ) {

        return res.status(400).json({
          success: false,
          message:
            "At least one assessment answer is required",
        });
      }


      // =================================================
      // FIND PATIENT
      // =================================================

      const profile =
        await PatientProfile.findOne({
          userId: req.userId,
        });


      if (!profile) {

        return res.status(404).json({
          success: false,
          message:
            "Profile not found",
        });
      }


      // =================================================
      // BUILD STRUCTURED DATA
      // =================================================

      const screeningFactors =
        buildScreeningFactors(
          answers,
          mlFeatures
        );


      // =================================================
      // EMERGENCY FLAG
      // =================================================

      const calculatedEmergencyFlag =
        typeof emergencyFlag === "boolean"
          ? emergencyFlag
          : screeningFactors
              .emergencySymptoms
              .length > 0;


      // =================================================
      // STRONG SUSPICION FLAG
      // =================================================

      const calculatedStrongSuspicionFlag =
        typeof strongSuspicionFlag === "boolean"
          ? strongSuspicionFlag
          : (
              String(
                riskLevel || ""
              ).toLowerCase() === "high" ||

              String(
                riskLevel || ""
              ).toLowerCase() === "emergency"
            );


      // =================================================
      // GENERATED EXPLANATION
      // =================================================

      const generatedExplanation =
        buildExplanation(
          answers
        );


      // =================================================
      // FRONTEND EXPLANATION
      // =================================================

      const frontendExplanation =
        Array.isArray(
          explanation
        )
          ? explanation
          : explanation
            ? [explanation]
            : [];


      // =================================================
      // FINAL EXPLANATION
      // =================================================

      const finalExplanation = [
        ...new Set([
          ...generatedExplanation,
          ...frontendExplanation,
        ]),
      ];


      // =================================================
      // NORMALIZE ML PREDICTION
      // =================================================

      const parsedMlPrediction =
        mlPrediction === null ||
        mlPrediction === undefined ||
        mlPrediction === ""
          ? null
          : Number(
              mlPrediction
            );


      // =================================================
      // VALID ML CLASS
      // =================================================
      //
      // 0 = Healthy
      // 1 = Mild
      // 2 = Moderate
      // 3 = Severe
      // =================================================

      const safeMlPrediction =
        [
          0,
          1,
          2,
          3,
        ].includes(
          parsedMlPrediction
        )
          ? parsedMlPrediction
          : null;


      // =================================================
      // ML LABEL
      // =================================================

      const safeMlLabel =
        mlPredictionLabel
          ? String(
              mlPredictionLabel
            )
          : safeMlPrediction === 0
            ? "Healthy"
            : safeMlPrediction === 1
              ? "Mild"
              : safeMlPrediction === 2
                ? "Moderate"
                : safeMlPrediction === 3
                  ? "Severe"
                  : null;


      // =================================================
      // ML PROBABILITY
      // =================================================

      const safeMlProbability =
        mlPredictionProbability === null ||
        mlPredictionProbability === undefined ||
        mlPredictionProbability === ""
          ? null
          : Number(
              mlPredictionProbability
            );


      // =================================================
      // KEEP OLD RISK LEVEL COMPATIBLE
      // =================================================
      //
      // Existing application uses:
      //
      // LOW
      // MODERATE
      // HIGH
      // EMERGENCY
      //
      // ML separately uses:
      //
      // Healthy
      // Mild
      // Moderate
      // Severe
      //
      // We DO NOT replace the old field.
      // =================================================

      const requestedRisk =
        String(
          riskLevel || ""
        ).toUpperCase();


      const derivedRiskFromMl =
        safeMlPrediction === 3
          ? "HIGH"
          : safeMlPrediction === 2
            ? "MODERATE"
            : "LOW";


      const finalRiskLevel =
        [
          "LOW",
          "MODERATE",
          "HIGH",
          "EMERGENCY",
        ].includes(
          requestedRisk
        )
          ? requestedRisk
          : derivedRiskFromMl;


      // =================================================
      // CREATE ASSESSMENT
      // =================================================

      const assessment =
        new Assessment({

          // =============================================
          // USER
          // =============================================

          userId:
            req.userId,


          // =============================================
          // PATIENT ID
          // =============================================

          patientId:
            profile.patientId,


          // =============================================
          // ORIGINAL QUESTIONS + ANSWERS
          // =============================================
          //
          // These remain useful for Patient Research.
          //
          // IMPORTANT:
          // If chatbot sends canonical values, they remain
          // canonical even when UI language is Hindi/Mr.
          // =============================================

          answers:
            answers.map(
              (item) => ({
                question:
                  String(
                    item.question || ""
                  ),

                answer:
                  String(
                    item.answer || ""
                  ),
              })
            ),


          // factors + q* are derived from answers[] at read time (src/utils/assessmentDerive.js).

          // =============================================
          // OLD SCORE
          // =============================================

          score:
            typeof score === "number"
              ? score
              : Number(
                  score || 0
                ),


          totalScore:
            typeof totalScore === "number"
              ? totalScore
              : Number(
                  totalScore ||
                  score ||
                  0
                ),


          // =============================================
          // OLD RISK LEVEL
          // =============================================

          riskLevel:
            finalRiskLevel,


          // =============================================
          // ML PREDICTION
          // =============================================

          mlPrediction:
            safeMlPrediction,


          // =============================================
          // ML LABEL
          // =============================================

          mlPredictionLabel:
            safeMlLabel,


          // =============================================
          // ML MODEL PROBABILITY
          // =============================================

          mlPredictionProbability:
            Number.isFinite(
              safeMlProbability
            )
              ? safeMlProbability
              : null,


          // =============================================
          // ML ALL CLASS PROBABILITIES
          // =============================================
          //
          // Example:
          //
          // {
          //   "0": 0.000089,
          //   "1": 0.096887,
          //   "2": 0.5663,
          //   "3": 0.336724
          // }
          //
          // Stored as encrypted JSON string.
          // =============================================

          mlProbabilitiesJson:
            mlProbabilities &&
            typeof mlProbabilities === "object"
              ? JSON.stringify(
                  mlProbabilities
                )
              : null,


          // =============================================
          // EXACT 16 ML FEATURES
          // =============================================

          mlFeaturesJson:
            mlFeatures &&
            typeof mlFeatures === "object"
              ? JSON.stringify(
                  mlFeatures
                )
              : null,


          // =============================================
          // FLAGS
          // =============================================

          emergencyFlag:
            calculatedEmergencyFlag,


          strongSuspicionFlag:
            calculatedStrongSuspicionFlag,


          // =============================================
          // EXPLANATION
          // =============================================

          explanation:
            finalExplanation,


          // =============================================
          // SUMMARY
          // =============================================

          summaryText:
            finalExplanation.join(
              "\n"
            ),

        });


      // =================================================
      // SAVE ASSESSMENT
      // =================================================

      await assessment.save();


      // =================================================
      // CONSOLE LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "✅ ASSESSMENT SAVED"
      );

      console.log(
        "Patient:",
        profile.patientId
      );

      console.log(
        "Assessment:",
        assessment._id
      );

      console.log(
        "Score:",
        assessment.score
      );

      console.log(
        "Risk:",
        assessment.riskLevel
      );

      console.log(
        "ML Prediction:",
        assessment.mlPrediction
      );

      console.log(
        "ML Label:",
        assessment.mlPredictionLabel
      );

      console.log(
        "ML Probability:",
        assessment.mlPredictionProbability
      );

      console.log(
        "Answers:",
        assessment.answers.length
      );

      console.log(
        "Explanation:",
        assessment.explanation
      );

      console.log(
        "================================="
      );


      // =================================================
      // GET HEMOPHILIA PROFILE
      // =================================================

      const hemophiliaDetails =
        await clinicalRecords.latest(req.userId);


      // =================================================
      // BUILD FHIR BUNDLE
      // =================================================
      //
      // Assessment is the source of truth for screening.
      // =================================================

      const bundle =
        toFHIRBundle({

          patientProfile:
            profile,

          user:
            await User.findById(req.userId).select("firstName middleName lastName").lean(),

          hemophiliaDetails:
            hemophiliaDetails,

          screeningSession:
            null,

          assessment:
            assessment,

        });


      // =================================================
      // SAVE FHIR BUNDLE
      // =================================================

      const savedBundle =
        await saveFHIRBundle(
          bundle
        );


      // =================================================
      // FHIR LOG
      // =================================================

      console.log(
        "================================="
      );

      console.log(
        "✅ FHIR BUNDLE UPDATED"
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


      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({

        success:
          true,


        message:
          "Assessment saved successfully",


        assessmentId:
          assessment._id,


        patientId:
          profile.patientId,


        score:
          assessment.score,


        totalScore:
          assessment.totalScore,


        riskLevel:
          assessment.riskLevel,


        // ---------------------------------------------
        // ORIGINAL ANSWERS
        // ---------------------------------------------

        answers:
          assessment.answers,


        // ---------------------------------------------
        // STRUCTURED FACTORS
        // ---------------------------------------------

        screeningFactors:
          screeningFactors,


        // ---------------------------------------------
        // EXPLANATION
        // ---------------------------------------------

        explanation:
          assessment.explanation,


        summaryText:
          assessment.summaryText,


        // ---------------------------------------------
        // FLAGS
        // ---------------------------------------------

        emergencyFlag:
          assessment.emergencyFlag,


        strongSuspicionFlag:
          assessment.strongSuspicionFlag,


        // ---------------------------------------------
        // ML RESULT
        // ---------------------------------------------

        mlPrediction:
          assessment.mlPrediction,


        mlPredictionLabel:
          assessment.mlPredictionLabel,


        mlPredictionProbability:
          assessment.mlPredictionProbability,


        // ---------------------------------------------
        // LANGUAGE
        // ---------------------------------------------

        language:
          language || "en",


        // ---------------------------------------------
        // FHIR
        // ---------------------------------------------

        fhir: {

          resourceType:
            savedBundle.resourceType,

          id:
            savedBundle.id,

          resources:
            bundle.total,

        },

      });

    }

    catch (err) {

      console.error(
        "❌ Error saving assessment:"
      );

      console.error(
        err
      );


      return res.status(500).json({

        success:
          false,

        message:
          "Error saving assessment",

        error:
          err.message,

      });

    }

  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;
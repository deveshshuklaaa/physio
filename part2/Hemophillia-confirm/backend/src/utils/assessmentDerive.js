// Phase 6: Assessment.answers[] is the only stored copy of the questionnaire.
// factors + the 14 flat q* keys are derived here at read time.
// Reproduces routes/assessment.js buildScreeningFactors' answers[] loop EXACTLY (parity, not fixes).

// q* field -> answers[] question keys (lowercased). Default rule: last answer wins.
const QUESTION_MAP = {
  q2BleedMinorCuts: ["prolonged_bleeding_minor_cut"],
  q3DentalSurgeryBleeding: ["excessive_dental_bleeding", "excessive_post_surgery_bleeding"],
  q4Bruises: ["easy_bruising"],
  q5MuscleSwelling: ["muscle_hematoma"],
  q6JointSwelling: ["recurrent_joint_bleeding"],
  // LAST-WINS over three questions (legacy assessment.js:224). NOT an OR: a clinical issue
  // logged in the plan, deliberately not fixed here.
  q8JointWarmthTightness: ["joint_warmth", "joint_tightness", "reduced_joint_mobility"],
  q9BloodUrineStool: ["hematuria", "hematochezia"], // special rule below
  q10FamilyHistory: ["family_history_bleeding_disorder"],
  q10MaleRelativeFlag: ["male_relative_with_hemophilia"], // boolean: answer === "yes"
  q12PreviousTesting: ["previous_factor_test"],
};

const FIELD_OF = {};
for (const [f, qs] of Object.entries(QUESTION_MAP)) for (const q of qs) FIELD_OF[q] = f;

// factors key for each flat key (the 14 names the old `factors` subdocument used)
const FACTOR_KEY = {
  q1EmergencySymptoms: "emergencySymptoms", q2BleedMinorCuts: "bleedMinorCuts",
  q3DentalSurgeryBleeding: "dentalSurgeryBleeding", q4Bruises: "bruises",
  q5MuscleSwelling: "muscleSwelling", q6JointSwelling: "jointSwelling",
  q7JointsList: "jointsList", q8JointWarmthTightness: "jointWarmthTightness",
  q9BloodUrineStool: "bloodUrineStool", q10FamilyHistory: "familyHistory",
  q10MaleRelativeFlag: "maleRelativeFlag", q11HeavyMenstrual: "heavyMenstrual",
  q12PreviousTesting: "previousTesting", q12FactorLow: "factorLow",
};

function deriveFromAnswers(answers) {
  // q1/q7/q11/q12FactorLow never held data in any stored document: always-empty by design.
  const q = {
    q1EmergencySymptoms: [], q2BleedMinorCuts: "", q3DentalSurgeryBleeding: "", q4Bruises: "",
    q5MuscleSwelling: "", q6JointSwelling: "", q7JointsList: [], q8JointWarmthTightness: "",
    q9BloodUrineStool: "", q10FamilyHistory: "", q10MaleRelativeFlag: false,
    q11HeavyMenstrual: "", q12PreviousTesting: "", q12FactorLow: "",
  };
  for (const item of Array.isArray(answers) ? answers : []) {
    if (!item) continue;
    const key = String(item.question || "").toLowerCase().trim();
    const f = FIELD_OF[key];
    if (!f) continue;
    const a = item.answer;
    const yn = typeof a === "string" ? a.toLowerCase().trim() : a;
    if (f === "q9BloodUrineStool") {
      if (yn === "yes") q.q9BloodUrineStool = "yes";
      else if (key === "hematochezia" && yn === "no" && !q.q9BloodUrineStool) q.q9BloodUrineStool = "no";
    } else if (f === "q10MaleRelativeFlag") q[f] = yn === "yes" || yn === true;
    else q[f] = a;
  }
  const factors = {};
  for (const [k, fk] of Object.entries(FACTOR_KEY)) factors[fk] = q[k];
  return { factors, ...q };
}

// Plain object of the assessment plus derived fields, for read sites that used the stored ones.
const withDerived = (doc) => {
  const o = doc && typeof doc.toObject === "function" ? doc.toObject() : doc;
  return o ? { ...o, ...deriveFromAnswers(o.answers) } : o;
};

module.exports = { QUESTION_MAP, deriveFromAnswers, withDerived };

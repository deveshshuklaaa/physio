// G2-C5 equivalence check.
//
// Ground truth is derived by reading backend/ml/recommendation_inference.py
// (now deleted per G2-C7; the logic is reproduced verbatim in the comment
// block below for anyone auditing this test without git history) rather
// than executed directly -- the Python process needs joblib/pandas at
// import time even though safety_engine() itself does not, and those are
// not installed on this host. This is the plan's sanctioned fallback: "the
// JS one against a table of inputs you derived by reading the Python".
//
// def safety_engine(patient):
//     current_bleeding = norm(patient.get("current_bleeding"), "no").lower()
//     bleeding_type = norm(patient.get("bleeding_type"), "").lower()
//     problem = norm(patient.get("exercise_problem"), "none").lower()
//     swelling = norm(patient.get("swelling"), "no").lower()
//     pain = float(patient.get("pain_level", 0) or 0)   # except -> 0
//
//     if (current_bleeding in {"yes","active","joint_bleed","muscle_bleed"}
//         or bleeding_type in {"joint_bleed","muscle_bleed"}
//         or problem in {"new bleeding","increased swelling"}
//         or swelling == "increased"):
//         return ACTIVE_BLEEDING (allow_ml=False)
//
//     if bleeding_type in {"mucosal","systemic"} or pain >= 7:
//         return CLINICAL_REVIEW_REQUIRED (allow_ml=False)
//
//     return SAFE_FOR_RECOMMENDATION (allow_ml=True)
//
// Run: node backend/src/routes/safety_engine_equivalence.test.js

const assert = require("assert");
const { safetyEngine } = require("./exerciseRecommendations.js");

// [description, input, expectedStatus, expectedAllowRule]
const cases = [
  // --- current_bleeding set membership: {"yes","active","joint_bleed","muscle_bleed"} ---
  ["current_bleeding=yes -> withhold", { current_bleeding: "yes" }, "ACTIVE_BLEEDING", false],
  ["current_bleeding=active -> withhold", { current_bleeding: "active" }, "ACTIVE_BLEEDING", false],
  ["current_bleeding=joint_bleed -> withhold", { current_bleeding: "joint_bleed" }, "ACTIVE_BLEEDING", false],
  ["current_bleeding=muscle_bleed -> withhold", { current_bleeding: "muscle_bleed" }, "ACTIVE_BLEEDING", false],
  ["current_bleeding=no -> allow", { current_bleeding: "no" }, "SAFE_FOR_RECOMMENDATION", true],
  ["current_bleeding=maybe (not in set) -> allow", { current_bleeding: "maybe" }, "SAFE_FOR_RECOMMENDATION", true],
  ["current_bleeding missing -> defaults 'no' -> allow", {}, "SAFE_FOR_RECOMMENDATION", true],
  ["current_bleeding case-insensitive YES -> withhold", { current_bleeding: "YES" }, "ACTIVE_BLEEDING", false],

  // --- bleeding_type set membership (first branch): {"joint_bleed","muscle_bleed"} ---
  ["bleeding_type=joint_bleed -> withhold (active)", { bleeding_type: "joint_bleed" }, "ACTIVE_BLEEDING", false],
  ["bleeding_type=muscle_bleed -> withhold (active)", { bleeding_type: "muscle_bleed" }, "ACTIVE_BLEEDING", false],

  // --- exercise_problem set membership: {"new bleeding","increased swelling"} ---
  ["exercise_problem='new bleeding' -> withhold", { exercise_problem: "new bleeding" }, "ACTIVE_BLEEDING", false],
  ["exercise_problem='increased swelling' -> withhold", { exercise_problem: "increased swelling" }, "ACTIVE_BLEEDING", false],
  ["exercise_problem='pain' (not in set) -> allow", { exercise_problem: "pain" }, "SAFE_FOR_RECOMMENDATION", true],
  ["exercise_problem missing -> defaults 'none' -> allow", {}, "SAFE_FOR_RECOMMENDATION", true],

  // --- swelling exact match: == "increased" ---
  ["swelling=increased -> withhold", { swelling: "increased" }, "ACTIVE_BLEEDING", false],
  ["swelling=mild (not exact match) -> allow", { swelling: "mild" }, "SAFE_FOR_RECOMMENDATION", true],
  ["swelling=no -> allow", { swelling: "no" }, "SAFE_FOR_RECOMMENDATION", true],

  // --- second branch: bleeding_type in {"mucosal","systemic"} ---
  ["bleeding_type=mucosal -> clinical review", { bleeding_type: "mucosal" }, "CLINICAL_REVIEW_REQUIRED", false],
  ["bleeding_type=systemic -> clinical review", { bleeding_type: "systemic" }, "CLINICAL_REVIEW_REQUIRED", false],
  ["bleeding_type=none (not in either set) -> allow", { bleeding_type: "none" }, "SAFE_FOR_RECOMMENDATION", true],

  // --- pain threshold: pain >= 7, boundary each side ---
  ["pain=6 -> allow", { pain_level: 6 }, "SAFE_FOR_RECOMMENDATION", true],
  ["pain=6.9 -> allow", { pain_level: 6.9 }, "SAFE_FOR_RECOMMENDATION", true],
  ["pain=7 -> clinical review (boundary, inclusive)", { pain_level: 7 }, "CLINICAL_REVIEW_REQUIRED", false],
  ["pain=7.1 -> clinical review", { pain_level: 7.1 }, "CLINICAL_REVIEW_REQUIRED", false],
  ["pain=10 -> clinical review", { pain_level: 10 }, "CLINICAL_REVIEW_REQUIRED", false],
  ["pain=0 -> allow", { pain_level: 0 }, "SAFE_FOR_RECOMMENDATION", true],
  ["pain='7' (string) -> clinical review", { pain_level: "7" }, "CLINICAL_REVIEW_REQUIRED", false],
  ["pain=non-numeric -> except -> 0 -> allow", { pain_level: "not-a-number" }, "SAFE_FOR_RECOMMENDATION", true],
  ["pain missing -> defaults 0 -> allow", {}, "SAFE_FOR_RECOMMENDATION", true],
  ["pain=null -> None or 0 -> 0 -> allow", { pain_level: null }, "SAFE_FOR_RECOMMENDATION", true],

  // --- branch precedence: active-bleeding branch checked before pain/mucosal branch ---
  [
    "current_bleeding=yes AND pain=10 -> ACTIVE_BLEEDING wins (first branch checked first)",
    { current_bleeding: "yes", pain_level: 10 },
    "ACTIVE_BLEEDING",
    false,
  ],

  // --- fully safe baseline ---
  [
    "all-safe baseline -> allow",
    { current_bleeding: "no", bleeding_type: "none", exercise_problem: "none", swelling: "no", pain_level: 0 },
    "SAFE_FOR_RECOMMENDATION",
    true,
  ],
];

let failures = 0;
for (const [desc, input, expectedStatus, expectedAllow] of cases) {
  const result = safetyEngine(input);
  try {
    assert.strictEqual(result.status, expectedStatus, `status mismatch for: ${desc}`);
    assert.strictEqual(result.allowRule, expectedAllow, `allowRule mismatch for: ${desc}`);
    console.log(`PASS: ${desc}`);
  } catch (err) {
    failures++;
    console.error(`FAIL: ${desc} -> got ${JSON.stringify(result)}: ${err.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures}/${cases.length} cases FAILED`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} cases passed.`);

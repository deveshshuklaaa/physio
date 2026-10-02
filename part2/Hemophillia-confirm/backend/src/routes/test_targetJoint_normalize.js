// Target joint became multi-value (encryptedStringArray). Legacy records hold a
// single encrypted string, so every read site must accept both shapes and the
// save route must reject an empty selection. These are those two rules.
//
// Run: node src/routes/test_targetJoint_normalize.js

const assert = require("assert");

// Mirrors the normalization in POST /api/hemophilia-details.
function normalizeTargetJoint(input) {
  const list = (Array.isArray(input) ? input : [input])
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  return [...new Set(list)];
}

// Mirrors the coercion used by every read site (dashboard counts, FHIR, PDF).
function toJointList(value) {
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function demo() {
  // Required: nothing selected is rejected in all its empty shapes.
  for (const empty of [undefined, null, "", "   ", [], [""], ["  ", null]]) {
    assert.strictEqual(
      normalizeTargetJoint(empty).length,
      0,
      `expected empty for ${JSON.stringify(empty)}`
    );
  }

  // Multi-value: order preserved, trimmed, de-duplicated.
  assert.deepStrictEqual(
    normalizeTargetJoint(["Knee", " Ankle ", "Knee", ""]),
    ["Knee", "Ankle"]
  );

  // Legacy single string still saves, as a one-element array.
  assert.deepStrictEqual(normalizeTargetJoint("Knee"), ["Knee"]);

  // Read sites: both shapes yield a list, so joint counts never double-count
  // a legacy string nor crash on an array.
  assert.deepStrictEqual(toJointList(["Knee", "Hip"]), ["Knee", "Hip"]);
  assert.deepStrictEqual(toJointList("Knee"), ["Knee"]);
  assert.deepStrictEqual(toJointList(null), []);
  assert.deepStrictEqual(toJointList([]), []);

  // Display joins without the run-together bug ("KneeHip").
  assert.strictEqual(toJointList(["Knee", "Hip"]).join(", "), "Knee, Hip");
  assert.strictEqual(toJointList([]).join(", "), "");

  console.log("targetJoint normalization: all assertions passed");
}

demo();

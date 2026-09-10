/**
 * G2-D6 -- the summary payload must satisfy exactly what
 * app/routes/session.py validates, or the whole summary is rejected (422)
 * and the report describes a session of zero reps.
 */
import { test, describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSummaryPayload, summaryDisagrees } from "../src/lib/summary.js";

describe("buildSummaryPayload", () => {
  it("derives counts from the log so they can never disagree", () => {
    const p = buildSummaryPayload([
      { rep: 1, clean: true, bestAngle: 90, errors: [] },
      { rep: 2, clean: false, bestAngle: 70, errors: ["insufficient_flexion"] },
      { rep: 3, clean: true, bestAngle: 95, errors: [] },
    ]);
    assert.equal(p.repCount, 3);
    assert.equal(p.cleanReps, 2);
    assert.equal(p.repLog.length, 3);
  });

  it("renumbers reps to 1..n in order (the server rejects gaps)", () => {
    const p = buildSummaryPayload([
      { rep: 3, clean: true, errors: [] },
      { rep: 1, clean: true, errors: [] },
    ]);
    assert.deepEqual(p.repLog.map((r) => r.rep), [1, 2]);
  });

  it("an empty session is a valid payload, not a crash", () => {
    const p = buildSummaryPayload([]);
    assert.deepEqual(p, { repCount: 0, cleanReps: 0, repLog: [] });
    assert.deepEqual(buildSummaryPayload(undefined).repLog, []);
  });

  it("normalises missing fields rather than sending junk", () => {
    const p = buildSummaryPayload([{ rep: 1, clean: 1, bestAngle: undefined, errors: null }]);
    assert.equal(p.repLog[0].clean, true);
    assert.equal(p.repLog[0].bestAngle, null);
    assert.deepEqual(p.repLog[0].errors, []);
  });
});

describe("summaryDisagrees", () => {
  it("flags a log that lost reps the patient saw counted", () => {
    const p = buildSummaryPayload([]);
    assert.equal(summaryDisagrees(p, { repCount: 4, cleanReps: 3 }), true);
  });

  it("is quiet when they match", () => {
    const p = buildSummaryPayload([{ rep: 1, clean: true, errors: [] }]);
    assert.equal(summaryDisagrees(p, { repCount: 1, cleanReps: 1 }), false);
  });
});

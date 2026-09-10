/**
 * G2-G1 -- Report.jsx's poll-state machine (generating / failed / done).
 * Report.jsx itself is React/JSX and out of scope for this plain node:test
 * suite; see frontend/app/src/lib/report_poll.js for what this exercises.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { reportPhase, isTerminalPhase } from "../app/src/lib/report_poll.js";

describe("reportPhase", () => {
  test("no session -> unavailable", () => {
    assert.equal(reportPhase(null), "unavailable");
    assert.equal(reportPhase(undefined), "unavailable");
  });

  test("still running (status active) -> active", () => {
    assert.equal(reportPhase({ status: "active" }), "active");
  });

  test("ended, report not yet started -> generating", () => {
    const session = {
      status: "ended",
      clinical: { report: { text: null, error: null } },
    };
    assert.equal(reportPhase(session), "generating");
  });

  test("reported with text -> done", () => {
    const session = {
      status: "reported",
      clinical: { report: { text: "Nice work on your reps.", error: null } },
    };
    assert.equal(reportPhase(session), "done");
  });

  test("report.error set -> failed, even if status is still 'ended'", () => {
    const session = {
      status: "ended",
      clinical: { report: { text: null, error: "gemini timeout" } },
    };
    assert.equal(reportPhase(session), "failed");
  });

  test("session-level status 'failed' -> failed", () => {
    const session = { status: "failed", clinical: { report: {} } };
    assert.equal(reportPhase(session), "failed");
  });

  test("missing clinical.report entirely does not throw -- generating, not a crash", () => {
    assert.equal(reportPhase({ status: "ended" }), "generating");
  });

  test("reported status but text still null -- not done, falls back to generating rather than lying", () => {
    const session = {
      status: "reported",
      clinical: { report: { text: null, error: null } },
    };
    assert.equal(reportPhase(session), "generating");
  });
});

describe("isTerminalPhase", () => {
  test("done, failed, unavailable are terminal", () => {
    assert.equal(isTerminalPhase("done"), true);
    assert.equal(isTerminalPhase("failed"), true);
    assert.equal(isTerminalPhase("unavailable"), true);
  });

  test("active and generating keep polling", () => {
    assert.equal(isTerminalPhase("active"), false);
    assert.equal(isTerminalPhase("generating"), false);
  });
});

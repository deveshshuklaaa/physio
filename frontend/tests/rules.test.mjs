/**
 * Phase G — rules.js (G2) and the placeholder-threshold safety property.
 *
 * The single highest-risk behaviour in this file is the LAST describe block:
 * five of the six registered exercises carry `{"value": null}` thresholds, and
 * a null coerced to 0 would compare as "angle > 0" on every single frame —
 * flagging a patient continuously for an error nobody configured. That is a
 * silent failure: no crash, no log, just a red banner that never turns off.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { depthAlert, rulesForExercise, thresholdValue, KNOWN_CHECKS } from "../src/lib/rules.js";
import { AUDIO_MAP } from "../src/lib/audio_cues.js";
import { ctxFor, PLACEHOLDER_EXERCISE, squatConfig, allConfiguredAlerts, loadRealConfig } from "./helpers.mjs";

const SQUAT = squatConfig();
/** Build squat's checks from the shipped config, fresh per test (session-scoped state). */
const squatChecks = () => rulesForExercise(SQUAT).checks;
const T = (key) => thresholdValue(SQUAT, key);

describe("alert strings are the join key to the audio cues", () => {
  // This is the exact class of bug that broke the legacy app: voice.py's
  // AUDIO_MAP pointed at four filenames that did not exist, and because the
  // availability check was `any(exists(...))` it still reported "TTS ready".
  // Four cues silently no-opped for however long. A string mismatch here is
  // invisible at runtime, so it gets a test.
  test("every alert string in the SHIPPED CONFIG has an AUDIO_MAP entry", () => {
    const alerts = allConfiguredAlerts();
    assert.ok(alerts.length > 0, "config exposes no alert strings at all");
    for (const alertText of alerts) {
      assert.ok(
        Object.hasOwn(AUDIO_MAP, alertText),
        `config alert ${JSON.stringify(alertText)} has no AUDIO_MAP entry — ` +
          `the cue will silently never play`,
      );
    }
  });

  test("em-dashes are preserved verbatim (not normalised to hyphens)", () => {
    // squat.py / voice.py use U+2014. A well-meaning reformat to "-" breaks
    // the lookup without changing how the string looks at a glance.
    const withDash = allConfiguredAlerts().filter((a) => a.includes("—"));
    assert.ok(withDash.length >= 4, `expected em-dashed alerts in config, found ${withDash.length}`);
  });
});

describe("squat check set", () => {
  test("builds exactly the seven legacy checks, in the config's declared order", () => {
    // D3 records the order as significant: checks run in the order squat.py's
    // extra_checks array lists them, and only the FIRST alert of a frame is
    // spoken. Reordering changes which cue the patient hears.
    const { checks, skipped } = rulesForExercise(SQUAT);
    assert.deepEqual(skipped, [], "some squat checks could not be built");
    assert.equal(checks.length, 7);
    // Order comes from the config's extra_checks array, not from JS.
    assert.deepEqual(SQUAT.extra_checks, [
      "knee_cave", "torso_lean_front", "torso_lean_side",
      "knee_past_toes", "heel_lift", "butt_wink", "neck",
    ]);
    assert.deepEqual(
      checks.map((f) => f.name),
      ["checkKneeCave", "checkTorsoLeanFront", "checkTorsoLeanSide",
       "checkKneePastToes", "checkHeelLift", "checkButtWink", "checkNeck"],
    );
  });

  test("the shipped config still carries config.py's verbatim values", () => {
    // Transcription errors here are clinical errors. Pinned against the
    // config itself — the only place these numbers now live.
    assert.equal(T("knee_cave_min_width_ratio"), 0.72);
    assert.equal(T("torso_lean_max_deg"), 55);
    assert.equal(T("knee_past_toes_max_x_ratio"), 0.06);
    assert.equal(T("heel_lift_max_y_rise"), 0.03);
    assert.equal(T("butt_wink_min_hip_angle_deg"), 58);
    assert.equal(T("butt_wink_max_knee_angle_deg"), 115);
    assert.equal(T("neck_min_angle_deg"), 140);
    assert.equal(SQUAT.rep_trigger.depth_target.value, 120);
  });

  test("every check the config names is implemented", () => {
    for (const name of SQUAT.extra_checks) {
      assert.ok(KNOWN_CHECKS.includes(name), `config names an unimplemented check: ${name}`);
    }
  });
});

describe("knee cave (FRONT view)", () => {
  const kneeCave = () => squatChecks()[0];

  test("fires when knee width drops below 72% of ankle width", () => {
    const c = ctxFor("FRONT", {
      // ankle width 200px, knee width 100px => ratio 0.50, well under 0.72
      ptOverrides: { left_knee: [590, 540], right_knee: [690, 540], left_ankle: [500, 684], right_ankle: [700, 684] },
    });
    assert.equal(kneeCave()(c), SQUAT.thresholds.knee_cave_min_width_ratio.alert);
  });

  test("silent when knees track over ankles", () => {
    const c = ctxFor("FRONT", {
      // knee width 190 / ankle width 200 => 0.95
      ptOverrides: { left_knee: [505, 540], right_knee: [695, 540], left_ankle: [500, 684], right_ankle: [700, 684] },
    });
    assert.equal(kneeCave()(c), null);
  });

  test("does not run in SIDE view", () => {
    // Legacy guards each check with its own fresh detectView() call.
    const c = ctxFor("SIDE", {
      ptOverrides: { left_knee: [590, 540], right_knee: [690, 540], left_ankle: [500, 684], right_ankle: [700, 684] },
    });
    assert.equal(kneeCave()(c), null);
  });

  test("silent when ankle width is degenerate (subject side-on or mis-tracked)", () => {
    // ankleW <= 10px guard: without it a near-zero ankle width makes almost
    // any knee width "caving", flagging a patient for a tracking artefact.
    const c = ctxFor("FRONT", {
      ptOverrides: { left_knee: [600, 540], right_knee: [604, 540], left_ankle: [600, 684], right_ankle: [605, 684] },
    });
    assert.equal(kneeCave()(c), null);
  });
});

describe("knee past toes (SIDE view)", () => {
  const kneePastToes = () => squatChecks()[3];

  test("fires when knee is further forward than 6% of frame width", () => {
    const w = 1280; // 6% = 76.8px
    const c = ctxFor("SIDE", { w, ptOverrides: { left_knee: [700, 540], left_ankle: [600, 684] } });
    assert.equal(kneePastToes()(c), SQUAT.thresholds.knee_past_toes_max_x_ratio.alert);
  });

  test("silent just inside the threshold", () => {
    const w = 1280;
    const c = ctxFor("SIDE", { w, ptOverrides: { left_knee: [670, 540], left_ankle: [600, 684] } });
    assert.equal(kneePastToes()(c), null);
  });
});

describe("heel lift — per-session state, not module-level globals", () => {
  const heelIdx = 4;

  test("captures a baseline on the UP->DOWN transition and fires on a rise", () => {
    const heelLift = squatChecks()[heelIdx];

    // UP: no baseline, never fires.
    assert.equal(heelLift(ctxFor("SIDE", { stage: "UP" })), null);

    // UP -> DOWN: baseline captured at heel y = 0.96.
    assert.equal(heelLift(ctxFor("SIDE", { stage: "DOWN" })), null);

    // Heel rises (y decreases) by 0.05 > 0.03 threshold.
    const risen = ctxFor("SIDE", {
      stage: "DOWN",
      lmOverrides: { left_heel: { y: 0.91 }, right_heel: { y: 0.91 } },
    });
    assert.equal(heelLift(risen), SQUAT.thresholds.heel_lift_max_y_rise.alert);
  });

  test("a small rise stays under the threshold", () => {
    const heelLift = squatChecks()[heelIdx];
    heelLift(ctxFor("SIDE", { stage: "UP" }));
    heelLift(ctxFor("SIDE", { stage: "DOWN" }));
    const small = ctxFor("SIDE", {
      stage: "DOWN",
      lmOverrides: { left_heel: { y: 0.95 }, right_heel: { y: 0.95 } }, // 0.01 rise
    });
    assert.equal(heelLift(small), null);
  });

  test("returning to UP clears the baseline", () => {
    const heelLift = squatChecks()[heelIdx];
    heelLift(ctxFor("SIDE", { stage: "UP" }));
    heelLift(ctxFor("SIDE", { stage: "DOWN" }));
    heelLift(ctxFor("SIDE", { stage: "UP" })); // clears
    // Still DOWN-less, so a raised heel must not fire without a new baseline.
    const risen = ctxFor("SIDE", { stage: "DOWN", lmOverrides: { left_heel: { y: 0.5 } } });
    // This frame IS the UP->DOWN transition, so it re-baselines rather than firing.
    assert.equal(heelLift(risen), null);
  });

  test("two sessions do not share heel-baseline state", () => {
    // squat.py kept this in Python module-level globals. Replicating that in
    // JS would leak one patient's baseline into the next session in the same
    // tab. createSquatChecks() must close over per-session state instead.
    const a = squatChecks()[heelIdx];
    const b = squatChecks()[heelIdx];

    a(ctxFor("SIDE", { stage: "UP" }));
    a(ctxFor("SIDE", { stage: "DOWN" })); // session A has a baseline

    // Session B has seen only this one frame; it is B's UP->DOWN transition,
    // so B re-baselines and stays silent even though A would have fired.
    const risen = ctxFor("SIDE", { stage: "DOWN", lmOverrides: { left_heel: { y: 0.80 } } });
    assert.equal(b(risen), null, "session B inherited session A's baseline");
  });
});

describe("depth alert", () => {
  test("fires when the best driver angle never got below the config's target", () => {
    assert.equal(depthAlert(140, SQUAT), "Not deep enough");
  });
  test("silent when depth was reached", () => {
    assert.equal(depthAlert(100, SQUAT), null);
  });
  test("boundary: exactly at target counts as deep enough", () => {
    assert.equal(depthAlert(120, SQUAT), null);
  });
  test("silent when depth_target is a placeholder — never flags every rep", () => {
    assert.equal(depthAlert(999, PLACEHOLDER_EXERCISE), null);
  });
});

describe("PLACEHOLDER THRESHOLDS MUST NEVER EVALUATE (master plan §8)", () => {
  test("squat has real thresholds; a placeholder exercise does not", () => {
    assert.equal(rulesForExercise(SQUAT).hasRealThresholds, true);
    assert.equal(rulesForExercise(PLACEHOLDER_EXERCISE).hasRealThresholds, false);
  });

  test("skipped checks report WHY, rather than silently running fewer rules", () => {
    const withPlaceholders = {
      ...SQUAT,
      thresholds: { ...SQUAT.thresholds, neck_min_angle_deg: { value: null, _TODO: "unset" } },
    };
    const { checks, skipped } = rulesForExercise(withPlaceholders);
    assert.equal(checks.length, 6);
    assert.equal(skipped.length, 1);
    assert.equal(skipped[0].name, "neck");
    assert.match(skipped[0].reason, /placeholder threshold/);
  });

  test("a placeholder exercise yields zero checks", () => {
    const { checks } = rulesForExercise(PLACEHOLDER_EXERCISE);
    assert.deepEqual(checks, []);
  });

  test("a placeholder exercise raises no flag on any frame, in either view", () => {
    // The failure this guards against: `null` coerced to 0 makes every
    // "angle > threshold" comparison true, so the patient is flagged on every
    // frame for an error nobody configured. It does not crash and it does not
    // log — it just shows a red banner forever.
    const { checks } = rulesForExercise(PLACEHOLDER_EXERCISE);
    for (const view of ["FRONT", "SIDE"]) {
      for (const stage of ["UP", "DOWN"]) {
        const flags = checks.map((fn) => fn(ctxFor(view, { stage }))).filter(Boolean);
        assert.deepEqual(flags, [], `placeholder exercise flagged in ${view}/${stage}`);
      }
    }
  });

  test("every non-squat exercise in the SHIPPED config yields no live checks", () => {
    // Driven off the real file, so adding a sixth placeholder exercise is
    // covered automatically instead of needing a new hardcoded name here.
    for (const ex of loadRealConfig().filter((e) => e.name !== "squat")) {
      const r = rulesForExercise(ex);
      assert.equal(r.hasRealThresholds, false, `${ex.name} claimed real thresholds`);
      assert.deepEqual(r.checks, [], `${ex.name} returned live checks it has no values for`);
    }
  });
});

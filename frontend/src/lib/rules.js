/**
 * rules.js — G2. Threshold checks for the live path.
 *
 * SOURCE OF TRUTH: the exercise record served by `GET /exercises`
 * (backend/app/config/exercises.json). This module holds the check *logic*
 * and nothing else — every number and every alert string is read from that
 * record at build time.
 *
 * That split is the point. Clinical values belong to the user (master plan
 * §8) and live in one place; a hardcoded copy here would be a second place
 * for them to live and a second place for them to drift. Threshold drift
 * between the served config and the live checks is invisible until a patient
 * is flagged against a number nobody edited.
 *
 * The checks themselves are ports of squat.py's `extra_checks` — the ones
 * actually wired into the legacy runtime per docs/03_legacy.md D5/D8, NOT
 * posture_checks.py, which is confirmed dead code and deferred per
 * Resolution 6.
 *
 * Each check has the signature:
 *   (ctx) => alertString | null
 * where ctx = { lms, pts, w, h, stage, view } — mirroring squat.py's
 * `fn(lms, pts, w, h, stage)`, with `view` precomputed by the caller for
 * convenience. Individual checks still call detectView(lms) fresh themselves,
 * exactly as the legacy code does: D3 records that detect_view is called
 * fresh INSIDE each extra_check, independently of the outer `view`. That call
 * structure is replicated deliberately — "optimising" it changes behaviour at
 * view boundaries and breaks parity with the offline pipeline.
 *
 * State: squat.py's check_heel_lift keeps `_heel_baseline`/`_prev_stage` as
 * Python MODULE-LEVEL globals — a hidden cross-session channel the legacy
 * engine gets away with because it is a single-process, single-user desktop
 * app. Replicated literally in JS it would leak one patient's baseline into
 * the next session in the same tab. Every factory below closes over its own
 * per-session state instead; build once per session.
 */

import { angle3d, torsoLean, detectView } from "./angles.js";
import { LM } from "./landmarks.js";
import { EXERCISE_CHECKS } from "./checks/index.js";

/**
 * Read a threshold's numeric value from an exercise record.
 * Returns null when the entry is missing or is still a `{"value": null}`
 * placeholder (F4) — callers must SKIP the check, never coerce to 0. A null
 * coerced to 0 makes every "angle > threshold" comparison true, flagging the
 * patient on every frame for an error nobody configured: no crash, no log,
 * just a red banner that never clears.
 */
export function thresholdValue(exerciseConfig, key) {
  const entry = exerciseConfig?.thresholds?.[key];
  if (!entry || typeof entry !== "object") return null;
  return entry.value ?? null;
}

/** The alert string a threshold raises, straight from the config. */
export function thresholdAlert(exerciseConfig, key) {
  return exerciseConfig?.thresholds?.[key]?.alert ?? null;
}

/**
 * Check registry: name (as it appears in a record's `extra_checks`) ->
 * { needs, build }.
 *
 *   needs  — threshold keys the check cannot run without. If any is a
 *            placeholder, the check is skipped rather than guessed at.
 *   build  — (values, alerts) => checkFn, closing over per-session state.
 *
 * `values` and `alerts` are keyed by the same threshold keys as `needs`.
 */
const CHECK_REGISTRY = {
  knee_cave: {
    needs: ["knee_cave_min_width_ratio"],
    build: (v, a) => function checkKneeCave({ lms, pts }) {
      if (detectView(lms, LM) !== "FRONT") return null;
      if (!("left_knee" in pts && "right_knee" in pts && "left_ankle" in pts && "right_ankle" in pts)) return null;
      const kneeW = Math.abs(pts.left_knee[0] - pts.right_knee[0]);
      const ankleW = Math.abs(pts.left_ankle[0] - pts.right_ankle[0]);
      // ankleW > 10px guard: without it a near-zero ankle width (subject
      // side-on, or mis-tracked) makes almost any knee width read as
      // "caving", flagging a patient for a tracking artefact.
      if (ankleW > 10 && kneeW < ankleW * v.knee_cave_min_width_ratio) return a.knee_cave_min_width_ratio;
      return null;
    },
  },

  torso_lean_front: {
    needs: ["torso_lean_max_deg"],
    build: (v, a) => function checkTorsoLeanFront({ lms, pts }) {
      if (detectView(lms, LM) !== "FRONT") return null;
      if (!("left_shoulder" in pts && "right_shoulder" in pts && "left_hip" in pts && "right_hip" in pts)) return null;
      const midSh = [
        Math.trunc((pts.left_shoulder[0] + pts.right_shoulder[0]) / 2),
        Math.trunc((pts.left_shoulder[1] + pts.right_shoulder[1]) / 2),
      ];
      const midHip = [
        Math.trunc((pts.left_hip[0] + pts.right_hip[0]) / 2),
        Math.trunc((pts.left_hip[1] + pts.right_hip[1]) / 2),
      ];
      if (torsoLean(midSh, midHip) > v.torso_lean_max_deg) return a.torso_lean_max_deg;
      return null;
    },
  },

  torso_lean_side: {
    needs: ["torso_lean_max_deg"],
    build: (v, a) => function checkTorsoLeanSide({ lms, pts }) {
      if (detectView(lms, LM) !== "SIDE") return null;
      const s = lms[LM.left_shoulder].z < lms[LM.right_shoulder].z ? "left" : "right";
      const shKey = `${s}_shoulder`, hipKey = `${s}_hip`;
      if (!(shKey in pts && hipKey in pts)) return null;
      if (torsoLean(pts[shKey], pts[hipKey]) > v.torso_lean_max_deg) return a.torso_lean_max_deg;
      return null;
    },
  },

  knee_past_toes: {
    needs: ["knee_past_toes_max_x_ratio"],
    build: (v, a) => function checkKneePastToes({ lms, pts, w }) {
      if (detectView(lms, LM) !== "SIDE") return null;
      const s = lms[LM.left_shoulder].z < lms[LM.right_shoulder].z ? "left" : "right";
      const kneeKey = `${s}_knee`, ankleKey = `${s}_ankle`;
      if (!(kneeKey in pts && ankleKey in pts)) return null;
      const kneeToeX = (pts[kneeKey][0] - pts[ankleKey][0]) / w;
      if (Math.abs(kneeToeX) > v.knee_past_toes_max_x_ratio) return a.knee_past_toes_max_x_ratio;
      return null;
    },
  },

  heel_lift: {
    needs: ["heel_lift_max_y_rise"],
    build: (v, a) => {
      // Per-session state, replacing squat.py's module-level globals.
      let heelBaseline = null;
      let prevStage = "UP";
      return function checkHeelLift({ lms, stage }) {
        if (stage === "DOWN" && prevStage === "UP") {
          heelBaseline = { left: lms[LM.left_heel].y, right: lms[LM.right_heel].y };
        }
        prevStage = stage;
        if (stage === "UP") {
          heelBaseline = null;
          return null;
        }
        if (heelBaseline === null) return null;
        const leftRise = heelBaseline.left - lms[LM.left_heel].y;
        const rightRise = heelBaseline.right - lms[LM.right_heel].y;
        if (Math.max(leftRise, rightRise) > v.heel_lift_max_y_rise) return a.heel_lift_max_y_rise;
        return null;
      };
    },
  },

  butt_wink: {
    // Two thresholds: one gates when the check applies, one is the trigger.
    needs: ["butt_wink_min_hip_angle_deg", "butt_wink_max_knee_angle_deg"],
    build: (v, a) => function checkButtWink({ lms }) {
      if (detectView(lms, LM) !== "SIDE") return null;
      const s = lms[LM.left_shoulder].z < lms[LM.right_shoulder].z ? "left" : "right";
      try {
        const kneeAngle = angle3d(lms[LM[`${s}_hip`]], lms[LM[`${s}_knee`]], lms[LM[`${s}_ankle`]]);
        if (kneeAngle > v.butt_wink_max_knee_angle_deg) return null;
        const hipAngle = angle3d(lms[LM[`${s}_shoulder`]], lms[LM[`${s}_hip`]], lms[LM[`${s}_knee`]]);
        if (hipAngle < v.butt_wink_min_hip_angle_deg) return a.butt_wink_min_hip_angle_deg;
      } catch {
        return null;
      }
      return null;
    },
  },

  neck: {
    needs: ["neck_min_angle_deg"],
    build: (v, a) => function checkNeck({ lms }) {
      try {
        const view = detectView(lms, LM);
        let na;
        if (view === "SIDE") {
          const s = lms[LM.left_shoulder].z < lms[LM.right_shoulder].z ? "left" : "right";
          na = angle3d(lms[LM[`${s}_ear`]], lms[LM[`${s}_shoulder`]], lms[LM[`${s}_hip`]]);
        } else {
          const al = angle3d(lms[LM.left_ear], lms[LM.left_shoulder], lms[LM.left_hip]);
          const ar = angle3d(lms[LM.right_ear], lms[LM.right_shoulder], lms[LM.right_hip]);
          na = (al + ar) / 2;
        }
        if (na < v.neck_min_angle_deg) return a.neck_min_angle_deg;
      } catch {
        return null;
      }
      return null;
    },
  },
};

/**
 * The squat entries above are the legacy port and stay in this file. Every
 * other exercise's checks live in ./checks/<exercise>.js and are merged in
 * here as registry fragments — same `{ needs, build }` shape, same contract.
 *
 * Merging rather than branching keeps the invariant stated on
 * rulesForExercise(): an exercise's checks are whatever its `extra_checks`
 * array names. Adding an exercise is still a data-only change.
 *
 * A collision would silently shadow one implementation with another that has
 * the same name and different geometry — a patient flagged by the wrong rule,
 * with nothing in the logs to say so. Fail loudly at module load instead.
 */
for (const name of Object.keys(EXERCISE_CHECKS)) {
  if (name in CHECK_REGISTRY) {
    throw new Error(`check name collision: '${name}' is defined in both rules.js and checks/`);
  }
}
Object.assign(CHECK_REGISTRY, EXERCISE_CHECKS);

/** Check names this build knows how to run. */
export const KNOWN_CHECKS = Object.freeze(Object.keys(CHECK_REGISTRY));

/**
 * Depth alert for the rep trigger: fires when the best driver angle never got
 * past `rep_trigger.depth_target` (decrease direction). Both the target and
 * the alert string come from the record. Returns null when the target is a
 * placeholder — an unconfigured depth target must not flag every rep.
 */
export function depthAlert(bestDriverAngle, exerciseConfig) {
  const target = exerciseConfig?.rep_trigger?.depth_target?.value ?? null;
  if (target === null) return null;
  const alert = thresholdValue(exerciseConfig, "depth_insufficient_alert")
    ?? thresholdAlert(exerciseConfig, "depth_insufficient_alert");
  return bestDriverAngle > target ? alert : null;
}

/**
 * Build the live checks for one exercise record, straight from its config.
 *
 * There is deliberately NO exercise-name branch here. An exercise's checks
 * are whatever its `extra_checks` array names, parameterised by its own
 * `thresholds`. Adding an exercise is a data-only change as long as its
 * checks are already in CHECK_REGISTRY — which is the guarantee F7 proved for
 * the loader, extended to the live path.
 *
 * Returns { checks, hasRealThresholds, skipped }:
 *   checks             — ready-to-run check functions, session-scoped
 *   hasRealThresholds  — false if nothing could be built (UI should say
 *                        "no live rules configured", not appear to assess)
 *   skipped            — [{ name, reason }] for anything left out, so the
 *                        caller can log WHY rather than silently doing less
 */
export function rulesForExercise(exerciseConfig) {
  const names = exerciseConfig?.extra_checks ?? [];
  const checks = [];
  const skipped = [];

  for (const name of names) {
    const spec = CHECK_REGISTRY[name];
    if (!spec) {
      // Config names a check this build does not implement. Say so loudly in
      // the return value rather than silently running fewer rules than the
      // config claims.
      skipped.push({ name, reason: "no implementation in CHECK_REGISTRY" });
      continue;
    }

    const missing = spec.needs.filter((k) => thresholdValue(exerciseConfig, k) === null);
    if (missing.length) {
      skipped.push({ name, reason: `placeholder threshold(s): ${missing.join(", ")}` });
      continue;
    }

    const values = {};
    const alerts = {};
    for (const k of spec.needs) {
      values[k] = thresholdValue(exerciseConfig, k);
      alerts[k] = thresholdAlert(exerciseConfig, k);
    }
    checks.push(spec.build(values, alerts));
  }

  return { checks, hasRealThresholds: checks.length > 0, skipped };
}

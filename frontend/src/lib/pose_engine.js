/**
 * pose_engine.js — the per-frame state machine that pose_worker.js drives.
 * Pulled out of the worker so it's unit-testable without a browser/MediaPipe
 * (the worker itself cannot run in this environment — see docs/09 for what
 * is proven vs. what remains UNVERIFIED).
 *
 * Replicates docs/03_legacy.md D3's per-frame call order and state machine
 * as closely as a stateless-per-session JS class allows:
 *   1. view = detectView(rawLandmarks)               (raw, unsmoothed)
 *   2. pts  = buildPts(rawLandmarks, w, h, smoother)  (EMA-smoothed, pixel)
 *   3. for each joint_check whose check_in_views includes view:
 *        angle = use_3d ? angle3d(raw...) : angle2d(pts...)
 *   4. driver_angle = angle of the joint_check with is_rep_driver && view in
 *      driver_for_views (first match wins, matches legacy iteration order)
 *   5. extra_checks (exercise-specific; squat only today) run IN THE SAME
 *      "if view in valid_views" branch, each doing its own fresh
 *      detectView() call internally (D3's documented asymmetry — see
 *      rules.js for why that's preserved rather than "fixed")
 *   6. dynamic rep state machine (rep_trigger) advances using driver_angle
 *
 * Isometric state machine is NOT implemented: no exercise in the current
 * registry has real isometric thresholds (only squat, which is dynamic, has
 * real numbers at all — docs/03_legacy.md D8/exercises.json). Building it
 * against placeholder nulls would mean inventing behaviour with no way to
 * verify it. Skipped per YAGNI; add when an isometric exercise gets real
 * thresholds from the owner (F4).
 */
import { angle2d, angle3d, detectView } from "./angles.js";
import { LM, VISIBILITY_THRESH } from "./landmarks.js";
import { rulesForExercise, depthAlert } from "./rules.js";

/** Port of math_utils.build_pts: EMA-smooth + visibility filter + pixel projection. */
export function buildPts(rawLandmarks, w, h, smoother) {
  const pts = {};
  for (const [name, idx] of Object.entries(LM)) {
    const lm = rawLandmarks[idx];
    if (!lm || lm.visibility === undefined || lm.visibility < VISIBILITY_THRESH) continue;
    const [sx, sy] = smoother.smooth(name, lm);
    pts[name] = [Math.trunc(sx * w), Math.trunc(sy * h)];
  }
  return pts;
}

function computeJointAngle(jc, rawLandmarks, pts) {
  try {
    if (jc.use_3d) {
      const a = rawLandmarks[LM[jc.landmark_a]];
      const b = rawLandmarks[LM[jc.landmark_b]];
      const c = rawLandmarks[LM[jc.landmark_c]];
      if (!a || !b || !c) return null;
      return angle3d(a, b, c);
    }
    if (!(jc.landmark_a in pts) || !(jc.landmark_b in pts) || !(jc.landmark_c in pts)) return null;
    return angle2d(pts[jc.landmark_a], pts[jc.landmark_b], pts[jc.landmark_c]);
  } catch (e) {
    return null;
  }
}

/**
 * One session's worth of state, built from an exercise config
 * (backend/app/config/exercises.json entry, as returned by GET /exercises).
 */
export class PoseEngine {
  constructor(exerciseConfig, smoother) {
    this.config = exerciseConfig;
    this.smoother = smoother;
    const { checks, hasRealThresholds, skipped } = rulesForExercise(exerciseConfig);
    this.extraChecks = checks;
    this.hasRealThresholds = hasRealThresholds;
    // Checks the config named but that could not be built (placeholder
    // thresholds, or no implementation). Surfaced so the caller can log WHY
    // fewer rules are running than the config lists, rather than silently
    // assessing less than the UI implies.
    this.skippedChecks = skipped;

    // Dynamic rep state machine state (D3 step 6.f).
    this.stage = "UP";
    this.repCount = 0;
    this.cleanReps = 0;
    this.repHadError = false;
    this.repFailReason = "";
    this.repErrors = [];
    this.bestDriverAngle = null;
    this.sessionLog = [];
    this.rep_was_clean = null;

    this._rt = this._resolveRepTrigger(exerciseConfig);
  }

  _resolveRepTrigger(cfg) {
    const rt = cfg.rep_trigger;
    if (!rt) return null;
    const enter = rt.enter_angle?.value;
    const exit = rt.exit_angle?.value;
    const depth = rt.depth_target?.value;
    if (enter == null || exit == null) return null; // placeholder exercise — no real numbers, no state machine
    return {
      jointDisplayName: rt.joint_display_name,
      enterAngle: enter,
      exitAngle: exit,
      depthTarget: depth ?? 0,
      direction: rt.direction || "decrease",
    };
  }

  /**
   * Process one frame. rawLandmarks: array of 33 {x,y,z,visibility}. w,h in px.
   * Returns { view, alerts, jointAngles, driverAngle, stage, repCount,
   *           cleanReps, repWasClean, repFailReason }.
   */
  processFrame(rawLandmarks, w, h) {
    const view = detectView(rawLandmarks, LM);
    const pts = buildPts(rawLandmarks, w, h, this.smoother);

    const jointAngles = {};
    let driverAngle = null;
    let alerts = [];

    const joints = this.config.joints || [];
    if ((this.config.valid_views || []).includes(view)) {
      for (const jc of joints) {
        if (!(jc.check_in_views || []).includes(view)) continue;
        const angle = computeJointAngle(jc, rawLandmarks, pts);
        jointAngles[jc.display_name] = angle;
        if (jc.is_rep_driver && angle != null) {
          const driverViews = jc.driver_for_views || jc.check_in_views;
          if (driverViews.includes(view) && driverAngle === null) {
            driverAngle = angle;
          }
        }
        // Joint-level alert_too_low/alert_too_high: only meaningful when the
        // config actually supplies real min/max (squat disables both via
        // the 0/180 sentinel; the five placeholder exercises supply neither
        // field at all). Never invent a threshold — see rules.js.
        if (jc.min_angle != null && jc.max_angle != null && angle != null) {
          if (angle < jc.min_angle && jc.alert_too_low) alerts.push(jc.alert_too_low);
          else if (angle > jc.max_angle && jc.alert_too_high) alerts.push(jc.alert_too_high);
        }
      }

      // extra_checks, same branch, legacy execution order (rules.js).
      for (const fn of this.extraChecks) {
        const a = fn({ lms: rawLandmarks, pts, w, h, stage: this.stage, view });
        if (a) alerts.push(a);
      }
    }

    // Dynamic rep state machine (D3 6.f), only if this exercise has real
    // enter/exit thresholds.
    if (this._rt && driverAngle != null && driverAngle > 0) {
      alerts = this._advanceRepMachine(driverAngle, alerts);
    }

    return {
      view,
      alerts,
      jointAngles,
      driverAngle,
      stage: this.stage,
      repCount: this.repCount,
      cleanReps: this.cleanReps,
      repWasClean: this.rep_was_clean,
      repFailReason: this.repFailReason,
      // Present only on the frame where a rep completed; read once.
      repEntry: (() => { const e = this._pendingRepEntry; this._pendingRepEntry = null; return e; })(),
    };
  }

  _advanceRepMachine(driverAngle, alerts) {
    const rt = this._rt;
    const decreasing = rt.direction === "decrease";

    if (this.stage === "UP") {
      const entered = decreasing ? driverAngle < rt.enterAngle : driverAngle > rt.enterAngle;
      if (entered) {
        this.stage = "DOWN";
        this.repHadError = false;
        this.repFailReason = "";
        this.repErrors = [];
        this.bestDriverAngle = driverAngle;
      }
    }

    if (this.stage === "DOWN") {
      this.bestDriverAngle = decreasing
        ? Math.min(this.bestDriverAngle, driverAngle)
        : Math.max(this.bestDriverAngle, driverAngle);

      if (alerts.length > 0) {
        for (const a of alerts) {
          if (!this.repErrors.includes(a)) this.repErrors.push(a);
        }
        if (!this.repHadError) {
          this.repHadError = true;
          this.repFailReason = alerts[0];
        }
      }

      const exited = decreasing ? driverAngle > rt.exitAngle : driverAngle < rt.exitAngle;
      if (exited) {
        this.stage = "UP";
        this.repCount += 1;
        if (rt.depthTarget > 0) {
          const depthOk = decreasing
            ? this.bestDriverAngle <= rt.depthTarget
            : this.bestDriverAngle >= rt.depthTarget;
          if (!depthOk && !this.repHadError) {
            const alert = depthAlert(this.bestDriverAngle, this.config);
            if (alert) {
              this.repHadError = true;
              this.repFailReason = alert;
              this.repErrors.push(alert);
              alerts = [...alerts, alert];
            }
          }
        }
        this.rep_was_clean = !this.repHadError;
        if (this.rep_was_clean) this.cleanReps += 1;
        const entry = {
          rep: this.repCount,
          errors: [...this.repErrors],
          best_angle: Math.trunc(this.bestDriverAngle),
          clean: this.rep_was_clean,
        };
        this.sessionLog.push(entry);
        // G2-D6: the same entry has to reach the backend's per-rep log, and
        // this engine runs inside a worker -- sessionLog never leaves it.
        // Hand the just-closed rep out with the next frame result.
        this._pendingRepEntry = entry;
      }
    }

    return alerts;
  }
}

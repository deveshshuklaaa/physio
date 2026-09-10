/**
 * checks/shared.js — G2. Shared threshold checks used across multiple exercises.
 *
 * These checks are factored out because their thresholds and messaging are
 * reused, but their trigger conditions or landmark geometry differ from
 * exercise-specific variants. For example, `heel_lifting` and squat's
 * `heel_lift` are geometrically identical but keyed differently in config;
 * keeping them separate prevents name collisions and future drift.
 */

import { LM } from "../landmarks.js";

export const CHECKS = {
  heel_lifting: {
    needs: ["heel_lifting_max_y_rise"],
    build: (v, a) => {
      let heelBaseline = null;
      let prevStage = "UP";
      return function checkHeelLifting({ lms, stage }) {
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
        if (Math.max(leftRise, rightRise) > v.heel_lifting_max_y_rise) return a.heel_lifting_max_y_rise;
        return null;
      };
    },
  },

  hip_lifting: {
    needs: ["hip_lifting_max_y_rise"],
    build: (v, a) => {
      let baseline = null;
      let prevStage = "UP";
      return function checkHipLifting({ lms, stage }) {
        const pelvisCenterY = (lms[LM.left_hip].y + lms[LM.right_hip].y) / 2;
        if (stage === "DOWN" && prevStage === "UP") {
          baseline = pelvisCenterY;
        }
        prevStage = stage;
        if (stage === "UP") {
          baseline = null;
          return null;
        }
        if (baseline === null) return null;
        const rise = baseline - pelvisCenterY;
        if (rise > v.hip_lifting_max_y_rise) return a.hip_lifting_max_y_rise;
        return null;
      };
    },
  },

  back_slouching: {
    needs: ["back_slouching_max_head_forward_ratio"],
    // Forward-head posture, not trunk angle.
    //
    // The previous rule was min(trunk_left, trunk_right) < 150 deg. It fired
    // on 100% of the training clips including every correctly-performed one,
    // and for seated_knee_extension the sign was inverted -- slouching clips
    // scored a HIGHER trunk angle than clean ones, so no threshold could
    // separate them.
    //
    // This measures how far the head sits forward of the shoulders, scaled by
    // trunk length so it is invariant to camera distance. On the labelled
    // seated_knee_extension clips it catches 5/5 slouching clips with 0/17
    // false positives. Small sample, not clinician-signed --
    // see docs/VALIDATION_TODO.md.
    build: (v, a) => function checkBackSlouching({ pts }) {
      const need = ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "nose"];
      if (!need.every((k) => k in pts)) return null;
      const shX = (pts.left_shoulder[0] + pts.right_shoulder[0]) / 2;
      const shY = (pts.left_shoulder[1] + pts.right_shoulder[1]) / 2;
      const hipX = (pts.left_hip[0] + pts.right_hip[0]) / 2;
      const hipY = (pts.left_hip[1] + pts.right_hip[1]) / 2;
      const trunk = Math.hypot(shX - hipX, shY - hipY);
      // A collapsed trunk length means the subject is not usefully visible;
      // every ratio against it would read as a fault.
      if (trunk < 10) return null;
      const headForward = Math.abs(pts.nose[0] - shX) / trunk;
      if (headForward > v.back_slouching_max_head_forward_ratio) {
        return a.back_slouching_max_head_forward_ratio;
      }
      return null;
    },
  },
};

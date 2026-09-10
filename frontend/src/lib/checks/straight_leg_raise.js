/**
 * checks/straight_leg_raise.js — G2. Straight leg raise exercise live checks.
 *
 * Three checks covering compensatory hip motion (lifting during raise),
 * knee flexion (should remain extended), and head lifting during the rep.
 */

import { angle2d } from "../angles.js";
import { LM } from "../landmarks.js";

export const CHECKS = {
  hip_lifting_raise_angle: {
    needs: ["hip_lifting_max_raise_angle_deg"],
    build: (v, a) => function checkHipLiftingRaiseAngle({ lms, pts }) {
      // Threshold HIP_MAX_DEG (46) is from label-editor's labeling constant,
      // flagged CIRCULAR in docs/06_ml_pipeline.md §2 Finding 2 — not a
      // clinician-set threshold.
      let maxRaiseAngle = 0;
      let found = false;
      for (const side of ["left", "right"]) {
        const shoulderKey = `${side}_shoulder`;
        const hipKey = `${side}_hip`;
        const kneeKey = `${side}_knee`;
        if (!(shoulderKey in pts && hipKey in pts && kneeKey in pts)) continue;
        try {
          found = true;
          const angle = angle2d(pts[shoulderKey], pts[hipKey], pts[kneeKey]);
          const raiseAngle = 180 - angle;
          maxRaiseAngle = Math.max(maxRaiseAngle, raiseAngle);
        } catch {
          // Skip this leg if angle computation fails.
        }
      }
      if (!found) return null;
      if (maxRaiseAngle > v.hip_lifting_max_raise_angle_deg) return a.hip_lifting_max_raise_angle_deg;
      return null;
    },
  },

  knee_flexion_high: {
    needs: ["knee_flexion_high_min_angle_deg"],
    build: (v, a) => function checkKneeFlexionHigh({ lms, pts, stage }) {
      // Only meaningful while the leg is actually being raised (DOWN stage).
      if (stage !== "DOWN") return null;
      let minKneeAngle = 180;
      let found = false;
      for (const side of ["left", "right"]) {
        const hipKey = `${side}_hip`;
        const kneeKey = `${side}_knee`;
        const ankleKey = `${side}_ankle`;
        if (!(hipKey in pts && kneeKey in pts && ankleKey in pts)) continue;
        try {
          found = true;
          const angle = angle2d(pts[hipKey], pts[kneeKey], pts[ankleKey]);
          minKneeAngle = Math.min(minKneeAngle, angle);
        } catch {
          // Skip this leg if angle computation fails.
        }
      }
      if (!found) return null;
      // Threshold is a MINIMUM required near-extension angle; bending below it is the error.
      if (minKneeAngle < v.knee_flexion_high_min_angle_deg) return a.knee_flexion_high_min_angle_deg;
      return null;
    },
  },

  head_lifting: {
    needs: ["head_lifting_max_y_rise"],
    build: (v, a) => {
      let baseline = null;
      let prevStage = "UP";
      return function checkHeadLifting({ lms, stage }) {
        if (stage === "DOWN" && prevStage === "UP") {
          baseline = lms[LM.nose].y;
        }
        prevStage = stage;
        if (stage === "UP") {
          baseline = null;
          return null;
        }
        if (baseline === null) return null;
        const rise = baseline - lms[LM.nose].y;
        if (rise > v.head_lifting_max_y_rise) return a.head_lifting_max_y_rise;
        return null;
      };
    },
  },
};

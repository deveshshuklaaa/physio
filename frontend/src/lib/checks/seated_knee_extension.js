/**
 * checks/seated_knee_extension.js — G2. Seated knee extension exercise live checks.
 *
 * Detects back rocking (instability of trunk position relative to pelvis)
 * by tracking within-rep variability of the nose's horizontal offset from
 * pelvis center, normalized by shoulder width.
 */

import { LM } from "../landmarks.js";

export const CHECKS = {
  back_rocking: {
    needs: ["back_rocking_max_score"],
    build: (v, a) => {
      let samples = [];
      let prevStage = "UP";
      return function checkBackRocking({ lms, stage }) {
        const pelvisCenterX = (lms[LM.left_hip].x + lms[LM.right_hip].x) / 2;
        const shoulderWidth2d = Math.hypot(
          lms[LM.left_shoulder].x - lms[LM.right_shoulder].x,
          lms[LM.left_shoulder].y - lms[LM.right_shoulder].y
        );
        if (stage === "DOWN" && prevStage === "UP") {
          samples = [];
        }
        prevStage = stage;
        if (stage === "UP") {
          samples = [];
          return null;
        }
        // Skip frame if shoulder width is too small to normalize.
        if (shoulderWidth2d <= 1e-6) return null;
        // Record nose position relative to pelvis, normalized by shoulder width.
        const sample = (lms[LM.nose].x - pelvisCenterX) / shoulderWidth2d;
        samples.push(sample);
        // ponytail: 300-sample buffer cap; upgrade to per-rep sliding window or circular buffer if rep duration exceeds real-time tracking budget.
        if (samples.length > 300) samples.shift();
        // Std-dev of tiny sample is noise, not rocking — require a minimum window before checking.
        if (samples.length < 15) return null;
        // Compute population standard deviation.
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((a, x) => a + (x - mean) ** 2, 0) / samples.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev > v.back_rocking_max_score) return a.back_rocking_max_score;
        return null;
      };
    },
  },
};

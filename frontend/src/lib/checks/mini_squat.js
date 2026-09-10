/**
 * checks/mini_squat.js — G2. Mini squat exercise live checks.
 *
 * Three checks covering knee alignment, forward displacement, and ankle width
 * — all computed in pixel or normalized space using markers present in pts
 * (smoothed) or raw landmarks where depth matters.
 */

import { angle2d, detectView } from "../angles.js";
import { LM } from "../landmarks.js";

export const CHECKS = {
  knee_varus: {
    needs: ["knee_varus_max_offset_ratio"],
    // Varus/valgus is a FRONTAL-plane deviation: the knee sitting to one side
    // of the line from its own hip to its own ankle. The previous formula
    // used 180 - angle2d(hip, knee, ankle), which is knee FLEXION -- a
    // sagittal measure. A mini squat bends the knee ~100 deg by definition,
    // so that fired on 38/38 correctly-performed clips in the training set
    // and no threshold could fix it.
    //
    // Measured here as the perpendicular distance from the knee to the
    // hip->ankle line, normalised by hip width so it is scale- and
    // distance-invariant. Unsigned: bowing out (varus) and caving in
    // (valgus) both deviate, and this exercise's label does not distinguish
    // them. On the labelled clips this separates 83% of varus clips at a 6%
    // false-positive rate (n=6 varus / 16 clean after the ankle-width guard,
    // so the number is indicative, not validated -- see docs/VALIDATION_TODO.md).
    build: (v, a) => function checkKneeVarus({ lms, pts }) {
      if (detectView(lms, LM) !== "FRONT") return null;
      if (!("left_hip" in pts && "right_hip" in pts)) return null;
      const hipWidth = Math.abs(pts.left_hip[0] - pts.right_hip[0]);
      // Same guard as knee_cave: a collapsed width means the subject is not
      // really front-on, and every ratio against it reads as a fault.
      if (hipWidth < 10) return null;

      let maxRatio = 0;
      let found = false;
      for (const side of ["left", "right"]) {
        const hip = pts[`${side}_hip`];
        const knee = pts[`${side}_knee`];
        const ankle = pts[`${side}_ankle`];
        if (!hip || !knee || !ankle) continue;
        const vx = ankle[0] - hip[0];
        const vy = ankle[1] - hip[1];
        const len = Math.hypot(vx, vy);
        if (len < 1) continue; // hip and ankle coincident: nothing to measure
        found = true;
        // Perpendicular distance from knee to the hip->ankle line.
        const dist = Math.abs((knee[0] - hip[0]) * vy - (knee[1] - hip[1]) * vx) / len;
        maxRatio = Math.max(maxRatio, dist / hipWidth);
      }
      if (!found) return null;
      if (maxRatio > v.knee_varus_max_offset_ratio) return a.knee_varus_max_offset_ratio;
      return null;
    },
  },

  knee_past_toes_margin: {
    needs: ["knee_past_toes_max_margin"],
    build: (v, a) => function checkKneePastToesMargin({ lms, pts, w }) {
      if (detectView(lms, LM) !== "SIDE") return null;
      // Nearest-camera side selection: smaller z is nearer.
      const s = lms[LM.left_shoulder].z < lms[LM.right_shoulder].z ? "left" : "right";
      const kneeKey = `${s}_knee`;
      const footKey = `${s}_foot`;
      if (!(kneeKey in pts && footKey in pts)) return null;
      const margin = (pts[kneeKey][0] - pts[footKey][0]) / w;
      if (Math.abs(margin) > v.knee_past_toes_max_margin) return a.knee_past_toes_max_margin;
      return null;
    },
  },

  ankles_close_together: {
    needs: ["ankles_min_width_ratio"],
    build: (v, a) => function checkAnklesCloseTogether({ lms }) {
      if (detectView(lms, LM) !== "FRONT") return null;
      // 3D distances in normalized landmark space (x, y, z all used).
      const ankleW = Math.hypot(
        lms[LM.left_ankle].x - lms[LM.right_ankle].x,
        lms[LM.left_ankle].y - lms[LM.right_ankle].y,
        lms[LM.left_ankle].z - lms[LM.right_ankle].z
      );
      const shoulderW = Math.hypot(
        lms[LM.left_shoulder].x - lms[LM.right_shoulder].x,
        lms[LM.left_shoulder].y - lms[LM.right_shoulder].y,
        lms[LM.left_shoulder].z - lms[LM.right_shoulder].z
      );
      // Guard: shoulder width too small to compute a reliable ratio.
      if (shoulderW <= 1e-6) return null;
      const ratio = ankleW / shoulderW;
      if (ratio < v.ankles_min_width_ratio) return a.ankles_min_width_ratio;
      return null;
    },
  },
};

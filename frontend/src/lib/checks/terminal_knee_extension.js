/**
 * checks/terminal_knee_extension.js — Terminal knee extension live checks.
 *
 * thigh_lifting: only the lower leg should move — the thigh stays on the
 * pillow. Measured as the left shoulder-hip-knee 2D angle relative to its
 * value on the first DOWN frame of the rep, so any pillow or towel height
 * works. Left leg only — the rep driver is Knee (L).
 */

import { angle2d } from "../angles.js";

export const CHECKS = {
  thigh_lifting: {
    needs: ["thigh_lifting_max_hip_change_deg"],
    build: (v, a) => {
      let baseline = null;
      let prevStage = "UP";
      return function checkThighLifting({ pts, stage }) {
        const sh = pts?.left_shoulder;
        const hip = pts?.left_hip;
        const knee = pts?.left_knee;
        const ang = sh && hip && knee ? angle2d(sh, hip, knee) : null;
        if (stage === "DOWN" && prevStage !== "DOWN") baseline = ang;
        prevStage = stage;
        if (stage !== "DOWN") {
          baseline = null;
          return null;
        }
        if (baseline === null || ang === null) return null;
        if (Math.abs(ang - baseline) > v.thigh_lifting_max_hip_change_deg) {
          return a.thigh_lifting_max_hip_change_deg;
        }
        return null;
      };
    },
  },
};

/**
 * checks/heel_slide.js — Heel slide live checks.
 *
 * slide_insufficient: the slide stopped short, judged on BOTH the knee angle
 * and how far the heel travelled toward the hip. Judged once per rep, on the
 * way back (knee has straightened `slide_insufficient_return_deg` from its
 * lowest point) — not at rep end, so it needs no hook into the engine's exit
 * logic and cannot fire for a rep the engine later rejects as jitter.
 *
 * Heel travel = (rest - closest) / rest, where rest is the largest hip->heel
 * pixel distance seen while the leg lay straight (UP), closest the smallest
 * during the slide (DOWN). Distance-to-camera invariant. Left leg only — the
 * rep driver is Knee (L).
 */

export const CHECKS = {
  slide_insufficient: {
    needs: ["slide_insufficient_min_heel_travel_ratio", "slide_insufficient_return_deg"],
    build: (v, a, exerciseConfig) => {
      // Knee half of the verdict; skipped when the record has no depth_target.
      const depth = exerciseConfig?.rep_trigger?.depth_target?.value ?? null;
      let restDist = 0;
      let prevStage = "UP";
      let minAngle = Infinity;
      let minDist = Infinity;
      let verdict = null;
      let judged = false;
      return function checkSlideInsufficient({ pts, stage, driverAngle }) {
        const hip = pts?.left_hip;
        const heel = pts?.left_heel;
        const d = hip && heel ? Math.hypot(heel[0] - hip[0], heel[1] - hip[1]) : null;

        if (stage !== "DOWN") {
          if (prevStage === "DOWN") restDist = 0; // a new rest period starts
          if (d !== null) restDist = Math.max(restDist, d);
          prevStage = stage;
          minAngle = Infinity;
          minDist = Infinity;
          verdict = null;
          judged = false;
          return null;
        }
        prevStage = stage;
        if (judged) return verdict; // latched: stays up for the rest of this DOWN
        if (driverAngle == null) return null;

        minAngle = Math.min(minAngle, driverAngle);
        if (d !== null) minDist = Math.min(minDist, d);
        if (driverAngle < minAngle + v.slide_insufficient_return_deg) return null;

        judged = true;
        const kneeShort = depth !== null && minAngle > depth;
        const heelShort = restDist > 0 && Number.isFinite(minDist)
          && (restDist - minDist) / restDist < v.slide_insufficient_min_heel_travel_ratio;
        verdict = kneeShort || heelShort ? a.slide_insufficient_min_heel_travel_ratio : null;
        return verdict;
      };
    },
  },
};

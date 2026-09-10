/**
 * checks/index.js — G2. Exercise check registry merger.
 *
 * All per-exercise check logic is modularized by exercise type, then merged
 * into a single EXERCISE_CHECKS registry. Exercise selection still routes
 * purely through each record's `extra_checks` array — there is no
 * exercise-name branch in the live path.
 *
 * A collision (two modules naming the same check) is a silent logic error:
 * the second entry shadows the first, and a config that names either will
 * run the wrong geometry with the right-looking name. The runtime assertion
 * below catches this.
 */

import { CHECKS as SHARED } from "./shared.js";
import { CHECKS as MINI_SQUAT } from "./mini_squat.js";
import { CHECKS as SEATED_KNEE_EXTENSION } from "./seated_knee_extension.js";
import { CHECKS as STRAIGHT_LEG_RAISE } from "./straight_leg_raise.js";

export const EXERCISE_CHECKS = Object.freeze({
  ...SHARED,
  ...MINI_SQUAT,
  ...SEATED_KNEE_EXTENSION,
  ...STRAIGHT_LEG_RAISE,
});

// Runtime collision check: verify no key was shadowed during the merge.
{
  const sharedKeys = Object.keys(SHARED).length;
  const miniKeys = Object.keys(MINI_SQUAT).length;
  const seatedKeys = Object.keys(SEATED_KNEE_EXTENSION).length;
  const legKeys = Object.keys(STRAIGHT_LEG_RAISE).length;
  const totalExpected = sharedKeys + miniKeys + seatedKeys + legKeys;
  const totalActual = Object.keys(EXERCISE_CHECKS).length;
  if (totalExpected !== totalActual) {
    const allNames = [
      ...Object.keys(SHARED),
      ...Object.keys(MINI_SQUAT),
      ...Object.keys(SEATED_KNEE_EXTENSION),
      ...Object.keys(STRAIGHT_LEG_RAISE),
    ];
    const duplicates = allNames.filter((name, i) => allNames.indexOf(name) !== i);
    throw new Error(
      `Check registry collision: expected ${totalExpected} entries, got ${totalActual}. ` +
      `Duplicates: ${[...new Set(duplicates)].join(", ")}`
    );
  }
}

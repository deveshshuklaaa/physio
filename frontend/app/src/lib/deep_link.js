/**
 * G2-E3/E4/E5 — deep-link handoff from their ExercisePlan.jsx "Start Now".
 *
 * Pure parsing/decision logic, kept out of ExerciseSelect.jsx so it can be
 * unit-tested without a JSX/React toolchain (frontend/tests/*.test.mjs runs
 * under plain `node --test`, no bundler). ExerciseSelect.jsx does the actual
 * fetch/localStorage/navigation side effects around these.
 *
 * The link shape, per D12/G2-E2: `/dist/index.html?exercise=<theirId>&rec=<recommendationId>`.
 * No token and no patient id ever go in the URL -- identity is
 * localStorage.authToken (shared origin, D5), read by the caller.
 */

/** Parse `?exercise=` and `?rec=` from a location.search-style string.
 *  Returns nulls when the params are absent -- that means "no deep link,
 *  show the plain exercise picker", not an error. */
export function parseDeepLink(search) {
  const params = new URLSearchParams(search);
  return {
    exerciseId: params.get("exercise") || null,
    recommendationId: params.get("rec") || null,
  };
}

/** Their exerciseId -> our engine exercise name, via GET /engine/capabilities'
 *  {engineSupported} map. Returns null if unmapped -- E4/E5's "explain,
 *  don't dead-link" case. */
export function resolveEngineExercise(theirExerciseId, engineSupported) {
  if (!theirExerciseId || !engineSupported) return null;
  return engineSupported[theirExerciseId] || null;
}

/**
 * E5's failure-path triage, computed once so ExerciseSelect.jsx just
 * branches on a string instead of re-deriving this logic inline.
 *
 *   "manual"   - no ?exercise= at all; show the normal picker, no auto-start
 *   "no-token" - deep link present but localStorage.authToken is missing/empty
 *   "unmapped" - deep link present, token present, but their exerciseId has
 *                no engine mapping (capabilities map didn't include it,
 *                including "still loading" -- caller decides whether that's
 *                final or worth a retry)
 *   "ready"    - auto-start clears to go
 */
export function classifyDeepLink({ exerciseId, token, engineSupported }) {
  if (!exerciseId) return "manual";
  if (!token) return "no-token";
  if (!resolveEngineExercise(exerciseId, engineSupported)) return "unmapped";
  return "ready";
}

/** Body for POST /session/start (session.py's SessionStart model). */
export function buildStartSessionBody({ engineExercise, exerciseId, recommendationId, language }) {
  const body = { exercise: engineExercise };
  if (exerciseId) body.exercise_id = exerciseId;
  if (recommendationId) body.recommendation_id = recommendationId;
  if (language) body.language = language;
  return body;
}

/**
 * G2-G6: the session's display language. One origin means their SPA's
 * localStorage is ours to read -- same key their pages use
 * (ExercisePlan.jsx's getInitialLanguage). The backend allowlists this, so a
 * junk value costs nothing and falls back to English.
 */
export function readSessionLanguage(storage = globalThis.localStorage) {
  let saved;
  try {
    saved = storage?.getItem("preferredLanguage");
  } catch {
    return "en"; // storage blocked (private mode, embedded webview)
  }
  if (!saved) return "en";
  if (["en", "hi", "mr"].includes(saved)) return saved;
  const lower = String(saved).toLowerCase();
  if (lower.startsWith("hindi")) return "hi";
  if (lower.startsWith("marathi")) return "mr";
  return "en";
}

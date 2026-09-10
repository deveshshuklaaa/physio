/**
 * G2-D6 -- the end-of-session summary payload.
 *
 * Pure and separate from session_orchestrator.js so it can be tested without
 * a DOM: the orchestrator only collects reps and posts what this returns.
 *
 * POST /session/{id}/summary validates strictly (app/routes/session.py):
 * repCount must equal repLog.length, cleanReps must equal the number of clean
 * entries, and reps must be exactly 1..n in order. A payload that disagrees
 * is rejected with 422 rather than repaired, so the counts are derived from
 * the log here rather than tracked separately and hoped to match.
 */

/** @returns {{repCount:number, cleanReps:number, repLog:Array}} */
export function buildSummaryPayload(repLog) {
  const log = (Array.isArray(repLog) ? repLog : [])
    .filter((r) => r && Number.isFinite(r.rep))
    .sort((a, b) => a.rep - b.rep)
    // Renumber 1..n. The engine already emits them in order; this only
    // guarantees the invariant the server checks, so one dropped worker
    // message costs a rep rather than the entire summary (422 = nothing
    // stored at all, which is far worse than an undercount).
    .map((r, i) => ({
      rep: i + 1,
      clean: !!r.clean,
      bestAngle: Number.isFinite(r.bestAngle) ? r.bestAngle : null,
      errors: Array.isArray(r.errors) ? r.errors.filter((e) => typeof e === "string") : [],
    }));

  return {
    repCount: log.length,
    cleanReps: log.filter((r) => r.clean).length,
    repLog: log,
  };
}

/**
 * True when the per-rep log disagrees with the counters the patient watched
 * on screen. That means rep entries were lost on the way out of the worker,
 * and the report would describe a session that did not happen -- worth a loud
 * log line, never a silent zero.
 */
export function summaryDisagrees(payload, counters) {
  if (!counters) return false;
  return (
    payload.repCount !== (counters.repCount ?? 0) ||
    payload.cleanReps !== (counters.cleanReps ?? 0)
  );
}

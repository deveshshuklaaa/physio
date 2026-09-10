/**
 * G2-G1 -- Report.jsx's poll-state machine.
 *
 * Pure decision logic, kept out of Report.jsx so it can be unit-tested
 * without a JSX/React toolchain (frontend/tests/*.test.mjs runs under plain
 * `node --test`, no bundler). Report.jsx does the fetch/localStorage/render
 * side effects around this.
 *
 * Contract this maps (integration plan §5 F5, session.py's GET /session/{id}):
 *   - session missing / fetch failed        -> "unavailable"
 *   - session.status == "failed"            -> "failed"  (session itself died)
 *   - clinical.report.error is set          -> "failed"  (report generation died)
 *   - session.status == "reported"
 *       and clinical.report.text is set     -> "done"
 *   - session.status == "ended", or "reported" without text yet
 *       (report.text and .error both null)  -> "generating"
 *   - anything else (still "active")        -> "active"
 *
 * §8 framing: this only classifies POLL STATE. It never labels the text
 * itself as a diagnosis or an assessment -- that's Report.jsx's job to get
 * right in the copy it renders for "done".
 */

export function reportPhase(session) {
  if (!session) return "unavailable";
  const report = (session.clinical && session.clinical.report) || {};
  if (session.status === "failed" || report.error) return "failed";
  if (session.status === "reported" && report.text) return "done";
  if (session.status === "ended" || session.status === "reported") return "generating";
  return "active";
}

/** True once polling should stop -- a terminal phase, nothing left to learn. */
export function isTerminalPhase(phase) {
  return phase === "done" || phase === "failed" || phase === "unavailable";
}

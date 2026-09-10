/**
 * G2-G1 -- Session report, post-integration.
 *
 * Supersedes J7/J8's placeholder (which polled a session endpoint that had
 * nothing to show yet -- Phase I's model pipeline was unbuilt). This page
 * now polls the real seam: `GET /engine/session/{id}` (nginx strips
 * `/engine`, so the fetch below hits FastAPI's `GET /session/{id}` --
 * app/routes/session.py, F5). That route returns the whole physiosessions
 * row (§4), including `status` and `clinical.report.{text,error}`.
 *
 * State machine lives in app/src/lib/report_poll.js (reportPhase) so it's
 * unit-testable without a JSX toolchain -- see frontend/tests/report_poll.test.mjs.
 *
 * §8 framing, non-negotiable: this is a coaching narrative Gemini wrote about
 * rule-based rep data, NOT Phase I's model-explained clinical report. Nothing
 * here may say a model "assessed" or "diagnosed" the patient -- headings say
 * "Session summary" and "Coaching notes", never "Diagnosis" or "Assessment".
 *
 * G2-G6: the report row may carry a `language` field once the concurrent
 * per-session-language Gemini work lands. Render the text as-is; no
 * "this report is in English" wording is added here.
 */
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { reportPhase, isTerminalPhase } from "@/lib/report_poll.js";

const params = new URLSearchParams(location.search);
// G2-A: one origin -- the engine is behind nginx at /engine/*, and :8000 is
// not published. The old 127.0.0.1 default could only ever fail here, which
// showed the patient a permanently "generating" report.
const API = params.get("api") || "/engine";
const SESSION_ID = params.get("session_id") || "";

const POLL_MS = 2000;

// Their SPA's plan route (part2 App.jsx) -- same origin, no token in the URL.
const PLAN_URL = "/exercise-plan";

const PHASE_META = {
  active: { icon: "●", text: "Session in progress", color: "var(--color-ok)" },
  generating: { icon: "⏳", text: "Analysing your session…", color: "var(--color-warn)" },
  done: { icon: "✓", text: "Report ready", color: "var(--color-ok)" },
  failed: { icon: "⚠", text: "Report failed", color: "var(--color-warn)" },
  unavailable: { icon: "⚠", text: "Session not found", color: "var(--color-warn)" },
};

function StatePill({ phase }) {
  const meta = PHASE_META[phase] || PHASE_META.unavailable;
  return (
    <span
      data-testid="report-phase"
      data-phase={phase}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
      style={{ borderColor: meta.color, color: meta.color }}
    >
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.text}</span>
    </span>
  );
}

export default function Report() {
  const [session, setSession] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const stopped = useRef(false);

  useEffect(() => {
    if (!SESSION_ID) {
      setFetchError("No session_id in URL");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Same-origin app, patient always signed in to reach this page. If the
      // token's gone (logout in another tab, expiry), say so plainly rather
      // than polling a 401 forever.
      setFetchError("Not signed in — please log in again.");
      return;
    }

    let timer = null;
    async function poll() {
      try {
        const res = await fetch(`${API}/session/${SESSION_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) {
          if (!stopped.current) setFetchError("Not authorized to view this session.");
          return; // terminal, no more polling
        }
        if (res.status === 404) {
          if (!stopped.current) setSession(null);
          return; // "unavailable" phase, terminal -- see below
        }
        if (!res.ok) throw new Error(`GET /session -> ${res.status}`);
        const data = await res.json();
        if (stopped.current) return;
        setSession(data);
        setFetchError("");
        // Compute the next poll off the freshly-fetched row, not React
        // state (setState hasn't re-rendered yet in this closure).
        if (!isTerminalPhase(reportPhase(data))) timer = setTimeout(poll, POLL_MS);
        return;
      } catch (e) {
        // Transient network error: keep the last good session on screen
        // rather than blanking it, and try again next tick.
        if (!stopped.current) {
          setFetchError(String(e.message || e));
          timer = setTimeout(poll, POLL_MS);
        }
        return;
      }
    }
    poll();
    return () => {
      stopped.current = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = reportPhase(session);
  const report = (session && session.clinical && session.clinical.report) || {};

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-8 py-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold">Session Report</h1>
          <span className="num text-sm text-ink-dim">{SESSION_ID || "no session"}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatePill phase={phase} />
          <Button
            className="rounded-lg px-6 py-2.5 text-base font-semibold"
            style={{ background: "var(--color-surface-2)", color: "var(--color-ink)" }}
            onClick={() => (location.href = PLAN_URL)}
          >
            Back to your plan
          </Button>
        </div>
      </header>

      {fetchError && (
        <div
          className="shrink-0 border-b border-line px-8 py-2 text-[15px]"
          style={{ color: "var(--color-warn)" }}
        >
          <span aria-hidden>⚠</span> {fetchError}
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Counts first, always, as soon as the row loads -- never blocked on
            the report text (D8: summary is written synchronously; the
            report is async and may still be generating or may fail). */}
        <section
          data-testid="summary-panel"
          className="flex flex-col gap-3 rounded-[14px] border border-line bg-surface-1 p-6"
        >
          <h2 className="text-xl font-semibold">Session summary</h2>
          {session ? (
            <div className="flex gap-8 text-[15px]">
              <div>
                <div className="text-ink-dim">Exercise</div>
                <div className="num text-lg font-semibold">{session.engineExercise || "—"}</div>
              </div>
              <div>
                <div className="text-ink-dim">Reps</div>
                <div className="num text-lg font-semibold">{session.repCount ?? "—"}</div>
              </div>
              <div>
                <div className="text-ink-dim">Clean reps</div>
                <div className="num text-lg font-semibold">{session.cleanReps ?? "—"}</div>
              </div>
            </div>
          ) : phase === "unavailable" ? (
            <p className="text-[15px] text-ink-dim">This session could not be found.</p>
          ) : (
            // The row is still on its way. Show the shape of what is coming
            // rather than a bare word, so the page does not look stalled.
            <div data-testid="summary-skeleton" className="flex gap-8">
              {["Exercise", "Reps", "Clean reps"].map((label) => (
                <div key={label} className="flex flex-col gap-2">
                  <div className="text-ink-dim text-[15px]">{label}</div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coaching notes -- Gemini prose about the measured reps above. Not
            a diagnosis, not a model assessment (§8). */}
        <section
          data-testid="notes-panel"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-[14px] border border-line bg-surface-1 p-6"
        >
          <h2 className="text-xl font-semibold">Coaching notes</h2>
          {phase === "done" && (
            <p data-testid="report-text" className="whitespace-pre-wrap text-[15px]">
              {report.text}
            </p>
          )}
          {phase === "generating" && (
            <div data-testid="notes-skeleton" className="flex flex-col gap-4">
              <div
                className="flex items-center gap-2 text-[15px]"
                style={{ color: "var(--color-warn)" }}
              >
                <span aria-hidden>⏳</span>
                <span>Writing your coaching notes… this usually takes a few seconds.</span>
              </div>
              {/* Mirrors the finished report's shape: four short sections,
                  each a heading and a couple of lines. */}
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[92%]" />
                  {i === 0 && <Skeleton className="h-4 w-[70%]" />}
                </div>
              ))}
            </div>
          )}
          {phase === "failed" && (
            <div
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-[15px]"
              style={{ color: "var(--color-warn)" }}
            >
              <span aria-hidden>⚠</span>
              <span>
                {/* ponytail: report.error holds an internal message (e.g.
                    "GEMINI_API_KEY not set") -- not shown to the patient.
                    The doctor patient-detail page shows it verbatim for
                    debugging (PatientResearch.jsx, staff-only). */}
                We couldn't generate coaching notes for this session. Your counts
                above are still saved.
              </span>
            </div>
          )}
          {phase === "active" && (
            <p className="text-[15px] text-ink-dim">
              Notes appear once the session ends.
            </p>
          )}
          {phase === "unavailable" && !session && (
            <p className="text-[15px] text-ink-dim">—</p>
          )}
        </section>
      </main>
    </div>
  );
}

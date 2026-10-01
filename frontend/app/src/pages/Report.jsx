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
import { parseMarkdown, splitInline } from "@/lib/markdown.js";

function Inline({ text }) {
  return splitInline(text).map((s, i) =>
    s.t === "b" ? (
      <strong key={i} className="font-semibold text-[var(--color-clin-ink)]">{s.v}</strong>
    ) : s.t === "i" ? (
      <em key={i}>{s.v}</em>
    ) : (
      s.v
    )
  );
}

function Markdown({ text, ...rest }) {
  return (
    <div {...rest} className="flex flex-col gap-3 text-[15px] leading-[24px] text-[var(--color-clin-body)]">
      {parseMarkdown(text).map((b, i) => {
        if (b.type === "h") {
          return (
            <h3
              key={i}
              className="mt-3 text-base font-bold text-[var(--color-clin-heading)] first:mt-0"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Inline text={b.text} />
            </h3>
          );
        }
        if (b.type === "p") {
          return (
            <p key={i}>
              <Inline text={b.text} />
            </p>
          );
        }
        const List = b.type === "ul" ? "ul" : "ol";
        return (
          <List
            key={i}
            className={`flex flex-col gap-3 pl-5 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-[var(--color-clin-blue)]`}
          >
            {b.items.map((paras, j) => (
              <li key={j} className="pl-1">
                {paras.map((p, k) => (
                  <p
                    key={k}
                    className={
                      k === 0 && paras.length > 1
                        ? "font-semibold text-[var(--color-clin-ink)]"
                        : k > 0
                          ? "mt-1.5"
                          : undefined
                    }
                  >
                    <Inline text={p} />
                  </p>
                ))}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

const params = new URLSearchParams(location.search);
// G2-A: one origin -- the engine is behind nginx at /engine/*, and :8000 is
// not published. The old 127.0.0.1 default could only ever fail here, which
// showed the patient a permanently "generating" report.
const API = params.get("api") || "/engine";
const SESSION_ID = params.get("session_id") || "";

const POLL_MS = 2000;

// Their SPA's plan route (part2 App.jsx) -- same origin, no token in the URL.
const PLAN_URL = "/exercise-plan";

// Pill tones map to the design plan's safety hierarchy: green is reserved for
// a validated, finished report; amber covers provisional/in-progress ML
// prose and non-urgent failures (never red -- a stalled report is not an
// acute clinical event); the live "active" state gets the neutral clinical
// info-blue since it is neither a success nor a warning.
const PHASE_META = {
  active: {
    icon: "●",
    text: "Session in progress",
    bg: "var(--color-clin-info-bg)",
    border: "var(--color-clin-info-border)",
    text_color: "var(--color-clin-info-text)",
  },
  generating: {
    icon: "⏳",
    text: "Analysing your session…",
    bg: "var(--color-clin-amber-bg)",
    border: "var(--color-clin-amber-border)",
    text_color: "var(--color-clin-amber-text)",
  },
  done: {
    icon: "✓",
    text: "Report ready",
    bg: "var(--color-clin-green-bg)",
    border: "var(--color-clin-green-border)",
    text_color: "var(--color-clin-green-text)",
  },
  failed: {
    icon: "⚠",
    text: "Report failed",
    bg: "var(--color-clin-amber-bg)",
    border: "var(--color-clin-amber-border)",
    text_color: "var(--color-clin-amber-text)",
  },
  unavailable: {
    icon: "⚠",
    text: "Session not found",
    bg: "var(--color-clin-amber-bg)",
    border: "var(--color-clin-amber-border)",
    text_color: "var(--color-clin-amber-text)",
  },
};

function StatePill({ phase }) {
  const meta = PHASE_META[phase] || PHASE_META.unavailable;
  return (
    <span
      data-testid="report-phase"
      data-phase={phase}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.text_color }}
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
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-clin-canvas)] text-[var(--color-clin-ink)]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-clin-border)] bg-[var(--color-clin-card)] px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-baseline gap-3">
          <h1
            className="text-lg font-bold tracking-tight text-[var(--color-clin-heading)] sm:text-2xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Session Report
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <StatePill phase={phase} />
          <Button
            className="h-9 rounded-xl border border-[var(--color-clin-border)] bg-white px-3 text-sm font-semibold text-[var(--color-clin-ink)] shadow-none hover:bg-[var(--color-clin-canvas)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-clin-blue-ring)] sm:h-11 sm:px-6 sm:text-base"
            onClick={() => (location.href = PLAN_URL)}
          >
            Back to plan
          </Button>
        </div>
      </header>

      {fetchError && (
        <div
          className="shrink-0 border-b px-8 py-2 text-[15px]"
          style={{
            color: "var(--color-clin-amber-text)",
            background: "var(--color-clin-amber-bg)",
            borderColor: "var(--color-clin-amber-border)",
          }}
        >
          <span aria-hidden>⚠</span> {fetchError}
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 sm:gap-5 sm:p-6">
        {/* Counts first, always, as soon as the row loads -- never blocked on
            the report text (D8: summary is written synchronously; the
            report is async and may still be generating or may fail). */}
        <section
          data-testid="summary-panel"
          className="flex flex-col gap-2 rounded-xl border border-[var(--color-clin-blue)] bg-[var(--color-clin-blue)] p-3 shadow-[0_10px_15px_-3px_rgba(37,99,235,0.12),0_4px_6px_-4px_rgba(37,99,235,0.08)] sm:gap-3 sm:rounded-2xl sm:p-4"
            style={{color:"#B2CFD3"}}
        >
          <h2
            className="text-sm font-semibold text-white sm:text-base"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Session summary
          </h2>
          {session ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-lg border border-[var(--color-clin-border)] bg-[var(--color-clin-canvas)] p-2 sm:rounded-xl sm:p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-clin-muted)] sm:text-[11px]">
                  Exercise
                </div>
                <div className="mt-0.5 truncate text-[13px] font-bold text-[var(--color-clin-ink)] sm:mt-1 sm:text-[15px]">
                  {session.engineExercise || "—"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-clin-border)] bg-[var(--color-clin-canvas)] p-2 sm:rounded-xl sm:p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-clin-muted)] sm:text-[11px]">
                  Reps
                </div>
                <div className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--color-clin-ink)] sm:mt-1 sm:text-[15px]">
                  {session.repCount ?? "—"}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-clin-border)] bg-[var(--color-clin-canvas)] p-2 sm:rounded-xl sm:p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-clin-muted)] sm:text-[11px]">
                  Clean reps
                </div>
                <div className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--color-clin-ink)] sm:mt-1 sm:text-[15px]">
                  {session.cleanReps ?? "—"}
                </div>
              </div>
            </div>
          ) : phase === "unavailable" ? (
            <p className="text-[15px] text-white">This session could not be found.</p>
          ) : (
            // The row is still on its way. Show the shape of what is coming
            // rather than a bare word, so the page does not look stalled.
            <div data-testid="summary-skeleton" className="grid grid-cols-3 gap-2 sm:gap-3">
              {["Exercise", "Reps", "Clean reps"].map((label) => (
                <div
                  key={label}
                  className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-clin-border)] bg-[var(--color-clin-canvas)] p-2 sm:gap-2 sm:rounded-xl sm:p-3"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-clin-muted)]">
                    {label}
                  </div>
                  <Skeleton className="h-6 w-24 bg-[var(--color-clin-border)]" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coaching notes -- Gemini prose about the measured reps above. Not
            a diagnosis, not a model assessment (§8). */}
        <section
          data-testid="notes-panel"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-2xl border border-[var(--color-clin-border)] bg-[var(--color-clin-card)] p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)] sm:p-6"
        >
          <h2
            className="text-lg font-semibold text-[var(--color-clin-ink)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Coaching notes
          </h2>
          {phase === "done" && (
            <Markdown data-testid="report-text" text={report.text} />
          )}
          {phase === "generating" && (
            <div data-testid="notes-skeleton" className="flex flex-col gap-4">
              <div
                className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[15px]"
                style={{
                  color: "var(--color-clin-amber-text)",
                  background: "var(--color-clin-amber-bg)",
                  borderColor: "var(--color-clin-amber-border)",
                }}
              >
                <span aria-hidden>⏳</span>
                <span>Writing your coaching notes… this usually takes a few seconds.</span>
              </div>
              {/* Mirrors the finished report's shape: four short sections,
                  each a heading and a couple of lines. */}
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-48 bg-[var(--color-clin-border)]" />
                  <Skeleton className="h-4 w-full bg-[var(--color-clin-border)]" />
                  <Skeleton className="h-4 w-[92%] bg-[var(--color-clin-border)]" />
                  {i === 0 && <Skeleton className="h-4 w-[70%] bg-[var(--color-clin-border)]" />}
                </div>
              ))}
            </div>
          )}
          {phase === "failed" && (
            <div
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[15px]"
              style={{
                color: "var(--color-clin-amber-text)",
                background: "var(--color-clin-amber-bg)",
                borderColor: "var(--color-clin-amber-border)",
              }}
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
            <p className="text-[15px] text-[var(--color-clin-body)]">
              Notes appear once the session ends.
            </p>
          )}
          {phase === "unavailable" && !session && (
            <p className="text-[15px] text-[var(--color-clin-body)]">—</p>
          )}
        </section>
      </main>
    </div>
  );
}

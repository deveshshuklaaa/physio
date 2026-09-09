/**
 * J7/J8 — Session report.
 *
 * Data source, deliberately narrow: GET /session/{id}. `GET /report/{id}` and
 * `GET /job/{id}` are I15 and do not exist yet (§10 Phase I). This page polls
 * the one seam that does exist and renders every state that seam can produce.
 * When I15 lands, only the fetch target and the "ready" render swap — the
 * poll loop, the states and the two-panel layout stay.
 *
 * E-DEC.6: measured (rule) and inferred (model) findings are permanently
 * separate, labelled panels — never interleaved, regardless of model
 * quality. Left = "What we measured" (rule findings, deterministic). Right =
 * "What the analysis suggests" (model + SHAP, always hedged). Phase I has not
 * shipped either producer yet, so both panels currently say so rather than
 * invent numbers (§8: no agent invents clinical wording).
 */
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const params = new URLSearchParams(location.search);
const API = params.get("api") || "http://127.0.0.1:8000";
const SESSION_ID = params.get("session_id") || "";

const POLL_MS = 2000;

/** Session record's own `status` field only ever reaches "active" or "queued"
 *  today (routes/session.py) -- there is no job runner yet to move it to
 *  "done"/"failed". Map what exists onto the three states the DOM contract
 *  requires, so the mapping is a single, obvious place to extend once I15's
 *  richer job status lands. */
function analysisState(session) {
  if (!session) return "unavailable";
  if (!session.job_id) return "pending"; // session still active, nothing queued yet
  if (session.status === "done") return "ready";
  if (session.status === "failed") return "unavailable";
  return "pending"; // queued/running
}

function StatePill({ state, live }) {
  // `live` = the session has no ended_at, i.e. it is STILL RUNNING. The DOM
  // contract's three states cannot express that, and calling it "Analysis
  // pending" would be a lie -- nothing has been queued because the session is
  // not over. Same data-state, honest wording.
  const meta = live
    ? {
        icon: "●",
        text: "Session in progress — nothing queued yet",
        color: "var(--color-ok)",
      }
    : {
        pending: { icon: "⏳", text: "Analysis pending", color: "var(--color-warn)" },
        ready: { icon: "✓", text: "Analysis ready", color: "var(--color-ok)" },
        unavailable: { icon: "⚠", text: "Analysis unavailable", color: "var(--color-warn)" },
      }[state] || { icon: "?", text: state, color: "var(--color-warn)" };

  return (
    <span
      data-testid="analysis-state"
      data-state={state}
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!SESSION_ID) {
      setError("No session_id in URL");
      return;
    }
    let stop = false;
    async function poll() {
      try {
        const res = await fetch(`${API}/session/${SESSION_ID}`);
        if (!res.ok) throw new Error(`GET /session -> ${res.status}`);
        const data = await res.json();
        // THIS PAGE NEVER ENDS A SESSION. An earlier version called
        // POST /session/end here whenever job_id was missing, so that a direct
        // link or a refresh would still show a job. But a LIVE session has no
        // job_id by definition, so that fired exactly when it was most
        // harmful: opening a report in a second tab while the patient was
        // still exercising ended the session server-side, flushing its buffer
        // and tearing down its WebSocket. A read-only page must not destroy an
        // in-progress session.
        //
        // Sessions end through J7's End Session button, or -- if the browser
        // dies without pressing it -- through H6's WS disconnect handler,
        // which already treats an abrupt disconnect as session end. Neither
        // path needs help from here. A session with no job_id is simply still
        // running, and the page says so.
        if (!stop) {
          setSession(data);
          setError("");
        }
      } catch (e) {
        if (!stop) setError(String(e.message || e));
      }
    }
    poll();
    // ponytail: fixed-interval poll, no backoff -- session count per clinic
    // is single digits and I15 will replace this with the job endpoint
    // before it matters.
    const id = setInterval(poll, POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const state = analysisState(session);
  const jobId = session?.job_id || "";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-8 py-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold">Session Report</h1>
          <span className="num text-sm text-ink-dim">{SESSION_ID || "no session"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="num border-line text-[13px] text-ink-dim"
          >
            job:&nbsp;
            <span data-testid="job-id">{jobId || "—"}</span>
          </Badge>
          <StatePill state={state} live={!!session && !session.ended_at} />
          <Button
            className="rounded-lg px-6 py-2.5 text-base font-semibold"
            style={{ background: "var(--color-surface-2)", color: "var(--color-ink)" }}
            onClick={() => (location.href = `index.html?api=${encodeURIComponent(API)}`)}
          >
            Back to exercises
          </Button>
        </div>
      </header>

      {error && (
        <div
          className="shrink-0 border-b border-line px-8 py-2 text-[15px]"
          style={{ color: "var(--color-warn)" }}
        >
          <span aria-hidden>⚠</span> {error}
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-2 gap-5 p-6">
        {/* LEFT — measured. Rule findings only, deterministic. Phase I has not
            shipped the rule-finding pipeline (I10-I12) yet, so this panel
            says exactly that instead of showing invented findings. */}
        <section
          data-testid="measured-panel"
          className="flex min-h-0 flex-col gap-3 overflow-auto rounded-[14px] border border-line bg-surface-1 p-6"
        >
          <h2 className="text-xl font-semibold">What we measured</h2>
          <p className="text-[15px] text-ink-dim">
            Rule-based findings from live posture thresholds — deterministic,
            with the crossed value and threshold shown.
          </p>
          <div
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-[15px]"
            style={{ color: "var(--color-warn)" }}
          >
            <span aria-hidden>⚠</span>
            <span>
              Not available yet — the report pipeline (Phase I) has not shipped.
              Exercise: <span className="num">{session?.exercise || "—"}</span>,
              status: <span className="num">{session?.status || "—"}</span>.
            </span>
          </div>
        </section>

        {/* RIGHT — inferred. Model + SHAP output, always hedged. Never
            interleaved with the left panel — E-DEC.6 is permanent, not a
            function of model quality. */}
        <section
          data-testid="suggested-panel"
          className="flex min-h-0 flex-col gap-3 overflow-auto rounded-[14px] border border-line bg-surface-1 p-6"
        >
          <h2 className="text-xl font-semibold">What the analysis suggests</h2>
          <p className="text-[15px] text-ink-dim">
            Model output with SHAP explanation, always hedged with the model
            card's own caveats. Associative only — never a claim the patient
            did the thing.
          </p>
          <div
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-[15px]"
            style={{ color: "var(--color-warn)" }}
          >
            <span aria-hidden>{state === "ready" ? "✓" : "⏳"}</span>
            <span>
              {state === "ready"
                ? "Ready."
                : state === "unavailable"
                  ? "Unavailable — this exercise has no trained model, or analysis failed."
                  : "Pending — queued for analysis, not yet run. Check back shortly."}
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

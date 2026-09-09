/**
 * J2/J3 — Exercise selection.
 *
 * Data-driven, deliberately: the exercise list comes from GET /exercises and
 * analysis availability from GET /admin/models/status (E7). Nothing about the
 * six exercises is hardcoded — F7 proved the loader is count-agnostic and the
 * UI has to stay that way, or adding exercise #7 means editing this file.
 *
 * Colour semantics are functional (see src/index.css):
 *   green  — ready
 *   amber  — a system/capability limitation
 *   red    — NEVER on this screen. Red means patient posture, nothing else.
 * Every state carries an icon AND text, never colour alone.
 */
import { useEffect, useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import ShinyText from "@/components/ShinyText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const API = new URLSearchParams(location.search).get("api") || "http://127.0.0.1:8000";

/** Preview data. Used only when the backend is unreachable, so the page can be
 *  looked at standalone. Mirrors REAL availability: squat, heel_slide and
 *  terminal_knee_extension have no trained model. */
const PREVIEW = [
  { name: "squat", display_name: "Squat", type: "dynamic", analysis: false },
  { name: "mini_squat", display_name: "Mini Squat", type: "dynamic", analysis: true },
  { name: "heel_slide", display_name: "Heel Slide", type: "dynamic", analysis: false },
  { name: "seated_knee_extension", display_name: "Seated Knee Extension", type: "dynamic", analysis: true },
  { name: "terminal_knee_extension", display_name: "Terminal Knee Extension", type: "dynamic", analysis: false },
  { name: "straight_leg_raise", display_name: "Straight Leg Raise", type: "dynamic", analysis: true },
];

function titleise(name) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusPill({ ok, label }) {
  return (
    <span
      data-testid="backend-status"
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
      style={{ borderColor: ok ? "var(--color-ok)" : "var(--color-warn)" }}
    >
      <span
        className="size-2 rounded-full"
        style={{ background: ok ? "var(--color-ok)" : "var(--color-warn)" }}
      />
      <span className="text-ink-dim">{label}</span>
    </span>
  );
}

function ExerciseCard({ ex, onStart }) {
  const ready = ex.analysis;
  const accent = ready ? "var(--color-ok)" : "var(--color-warn)";

  const inner = (
    <SpotlightCard
      className="h-full !bg-surface-1 !border-line"
      spotlightColor={ready ? "rgba(0, 179, 126, 0.22)" : "rgba(255, 176, 32, 0.18)"}
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-3xl font-semibold leading-tight">
              {ex.display_name || titleise(ex.name)}
            </h2>
            <Badge
              variant="outline"
              className="num shrink-0 border-line text-[11px] tracking-widest text-ink-dim"
            >
              {(ex.type || "dynamic").toUpperCase()}
            </Badge>
          </div>
          <p className="num mt-2 text-sm text-ink-dim">{ex.name}</p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Icon + text, never colour alone. */}
          <div className="flex items-center gap-2 text-[15px]" style={{ color: accent }}>
            <span aria-hidden>{ready ? "✓" : "⚠"}</span>
            <span>
              {ready
                ? "Live feedback + analysis"
                : "Live feedback only — no trained model"}
            </span>
          </div>
          <Button
            data-testid={`start-${ex.name}`}
            onClick={() => onStart(ex)}
            className="w-full rounded-lg px-6 py-2.5 text-base font-semibold"
            style={{ background: accent, color: "#07130f" }}
          >
            Start Session
          </Button>
        </div>
      </div>
    </SpotlightCard>
  );

  // ElectricBorder was dropped: it wrapped outside the card's height, so the
  // three analysis-ready cards overflowed their grid cell and looked broken --
  // worse than the plain ones they were meant to stand out from. A static
  // accent border plus SpotlightCard's cursor gradient carries the same
  // distinction without fighting the grid.
  return (
    <div
      className="h-full rounded-[14px] border-2"
      style={{ borderColor: ready ? "var(--color-ok)" : "var(--color-line)" }}
      data-exercise={ex.name}
      data-analysis={String(ready)}
    >
      {inner}
    </div>
  );
}

export default function ExerciseSelect() {
  const [exercises, setExercises] = useState(null);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [exRes, mdRes] = await Promise.all([
          fetch(`${API}/exercises`),
          fetch(`${API}/admin/models/status`).catch(() => null),
        ]);
        const list = (await exRes.json()).exercises || [];
        const status = mdRes && mdRes.ok ? (await mdRes.json()).exercises || {} : {};
        setExercises(
          list.map((e) => ({
            ...e,
            // analysis_unavailable is E8's flag. Absent status => assume no
            // analysis rather than promising it.
            analysis: status[e.name] ? status[e.name].analysis_unavailable !== true : false,
          }))
        );
        setOnline(true);
      } catch (e) {
        setError(String(e.message || e));
        setExercises(PREVIEW);
      }
    })();
  }, []);

  async function startSession(ex) {
    // J3: POST /session/start, then navigate with the REAL session_id. The
    // live page invents `local-<timestamp>` today, which the WS rejects.
    const res = await fetch(`${API}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise: ex.name }),
    });
    if (!res.ok) {
      setError(`Could not start ${ex.name}: ${res.status}`);
      return;
    }
    const { session_id } = await res.json();
    location.href =
      `../src/pages/live_session.html?exercise=${encodeURIComponent(ex.name)}` +
      `&session_id=${encodeURIComponent(session_id)}&api=${encodeURIComponent(API)}`;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-8 py-4">
        <div className="flex items-baseline gap-4">
          <ShinyText
            text="Rehab Assessment Engine"
            speed={4}
            color="#ededed"
            className="text-2xl font-bold"
          />
          <span className="num text-sm text-ink-dim">select an exercise</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill ok={online} label={online ? "Backend online" : "Preview data"} />
        </div>
      </header>

      <main className="min-h-0 flex-1 p-6">
        {!exercises ? (
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-full w-full rounded-[14px] bg-surface-1" />
            ))}
          </div>
        ) : (
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-5">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.name} ex={ex} onStart={startSession} />
            ))}
          </div>
        )}
      </main>

      <footer className="flex shrink-0 items-center justify-between border-t border-line px-8 py-3">
        <span className="num text-sm text-ink-dim">
          {exercises ? `${exercises.length} exercises configured` : "loading…"}
          {error ? ` · ${error}` : ""}
        </span>
        <span className="num text-sm text-ink-dim">
          {exercises
            ? `${exercises.filter((e) => e.analysis).length} with trained models`
            : ""}
        </span>
      </footer>
    </div>
  );
}

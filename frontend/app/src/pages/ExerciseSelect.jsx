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
 *
 * G2-E3/D5: this page is also the deep-link landing spot for their
 * ExercisePlan.jsx "Start Now" button — `?exercise=<theirId>&rec=<recId>`.
 * When those params are present we read localStorage.authToken (shared
 * origin, one product) and call startSession() immediately, no click. See
 * ../lib/deep_link.js for the parsing/classification and G2-E5 below for
 * every way that can fail visibly instead of silently.
 */
import { useEffect, useRef, useState } from "react";
import SpotlightCard from "@/components/SpotlightCard";
import ShinyText from "@/components/ShinyText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDeepLink, resolveEngineExercise, classifyDeepLink, buildStartSessionBody, readSessionLanguage } from "@/lib/deep_link.js";

// G2-A: one origin. The engine sits behind nginx at /engine/*, and :8000 is
// no longer published, so the old 127.0.0.1 default could never connect --
// which surfaced as "this exercise isn't supported" rather than as a
// connection failure. Overridable with ?api= for a split-origin dev setup.
const API = new URLSearchParams(location.search).get("api") || "/engine";
// D12: their app owns "/" (login) and "/exercise-plan" (the plan page) at
// this shared origin — relative paths, no host baked in.
const THEIR_LOGIN_PATH = "/";
const THEIR_PLAN_PATH = "/exercise-plan";

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

/** G2-E5/E6: full-screen takeover for a deep-link failure that must never
 *  render a blank/broken camera page underneath it. */
function DeepLinkNotice({ title, body, actionLabel, onAction }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-surface p-8 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-ink-dim">{body}</p>
      {actionLabel && (
        <Button onClick={onAction} className="rounded-lg px-6 py-2.5 text-base font-semibold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default function ExerciseSelect() {
  const [exercises, setExercises] = useState(null);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");

  // G2-E3: deep-link state machine. null while capabilities are still
  // loading -- classifyDeepLink must not decide "unmapped" against a map
  // that just hasn't arrived yet.
  const [deepLink] = useState(() => {
    const parsed = parseDeepLink(location.search);
    // S18: strip the query string once it is captured in state, so the
    // exercise id is not sitting in the address bar, the back-history or a
    // copied URL. Cosmetic ONLY -- devtools and a direct POST to
    // /session/start still work. The real gate is the server-side ACTIVE
    // assignment check (docs/security.md S18); this is not a substitute.
    if (location.search) {
      try {
        history.replaceState(null, "", location.pathname + location.hash);
      } catch {
        /* non-blocking: a failed replaceState must never stop the session */
      }
    }
    return parsed;
  });
  const [deepLinkState, setDeepLinkState] = useState(deepLink.exerciseId ? "loading" : "manual");
  const [engineSupported, setEngineSupported] = useState(null);
  // Unreachable engine != unsupported exercise. Conflating them tells a
  // patient their prescribed exercise is unavailable when the real problem
  // is a network hop, and sends them to their doctor over an outage.
  const [engineOffline, setEngineOffline] = useState(false);
  // R1/D16: calibrate-before-start attempt counter. After two failed
  // attempts the patient must be able to skip -- a band that won't settle
  // must not trap them here the night of a demo.
  const calibrateAttempts = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [exRes, mdRes, capRes] = await Promise.all([
          fetch(`${API}/exercises`),
          fetch(`${API}/admin/models/status`).catch(() => null),
          fetch(`${API}/capabilities`).catch(() => null),
        ]);
        const list = (await exRes.json()).exercises || [];
        const status = mdRes && mdRes.ok ? (await mdRes.json()).exercises || {} : {};
        const caps = capRes && capRes.ok ? (await capRes.json()).engineSupported || {} : {};
        setExercises(
          list.map((e) => ({
            ...e,
            // analysis_unavailable is E8's flag. Absent status => assume no
            // analysis rather than promising it.
            analysis: status[e.name] ? status[e.name].analysis_unavailable !== true : false,
          }))
        );
        setEngineSupported(caps);
        setOnline(true);
      } catch (e) {
        setError(String(e.message || e));
        setExercises(PREVIEW);
        // E4/E5: never guess that an exercise is supported when the map
        // failed to load -- but report it as the connection failure it is,
        // with a retry, not as an unsupported exercise.
        setEngineSupported({});
        setEngineOffline(true);
      }
    })();
  }, []);

  // G2-E3/D5: once capabilities have resolved (success or not), decide the
  // deep-link outcome and, if clear to go, start the session with no click.
  useEffect(() => {
    if (!deepLink.exerciseId || engineSupported === null) return;

    const token = localStorage.getItem("authToken");
    if (engineOffline && token) {
      setDeepLinkState("start-failed");
      return;
    }
    const state = classifyDeepLink({
      exerciseId: deepLink.exerciseId,
      token,
      engineSupported,
    });

    if (state === "no-token") {
      // E5: no token -> bounce to their login. Nothing to show here first --
      // there is nothing this page can do without identity.
      location.href = THEIR_LOGIN_PATH;
      return;
    }
    if (state === "unmapped") {
      setDeepLinkState("unmapped");
      return;
    }
    // state === "ready" -- R1/D16: calibrate (limb still) before start.
    setDeepLinkState("calibrate");
    void runCalibrationGate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineSupported, engineOffline]);

  // R1/D16: calibrate-before-start. A dead/slow EMG service must NEVER block
  // session start -- any error, timeout or exhausted poll proceeds anyway.
  async function runCalibrationGate(token) {
    try {
      await fetch(`${API}/session/calibrate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      let ok = false;
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 700));
        const res = await fetch(`${API}/calibration`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.calibrating) {
          ok = !!data.ok;
          break;
        }
      }
      if (ok) {
        void startFromDeepLink(token);
      } else {
        calibrateAttempts.current += 1;
        setDeepLinkState("calibrate-failed");
      }
    } catch {
      // Unreachable EMG service must never block session start.
      void startFromDeepLink(token);
    }
  }

  async function startFromDeepLink(token) {
    setDeepLinkState("starting");
    const engineExercise = resolveEngineExercise(deepLink.exerciseId, engineSupported);
    try {
      const res = await fetch(`${API}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(
          buildStartSessionBody({
            engineExercise,
            exerciseId: deepLink.exerciseId,
            recommendationId: deepLink.recommendationId,
            language: readSessionLanguage(),
          })
        ),
      });
      if (!res.ok) {
        setDeepLinkState("start-failed");
        return;
      }
      const { session_id } = await res.json();
      location.href =
        `../src/pages/live_session.html?exercise=${encodeURIComponent(engineExercise)}` +
        `&session_id=${encodeURIComponent(session_id)}&api=${encodeURIComponent(API)}`;
    } catch (e) {
      // E5: /session/start failing (network, 5xx, whatever) must land on a
      // retry, never a blank camera page underneath a hung request.
      setDeepLinkState("start-failed");
    }
  }

  async function startSession(ex) {
    // J3: POST /session/start, then navigate with the REAL session_id. The
    // live page invents `local-<timestamp>` today, which the WS rejects.
    // G2-B3: every session route requires Authorization now.
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API}/session/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ exercise: ex.name, language: readSessionLanguage() }),
    });
    if (!res.ok) {
      setError(
        !token
          ? `Could not start ${ex.name}: not signed in (${res.status})`
          : `Could not start ${ex.name}: ${res.status}`
      );
      return;
    }
    const { session_id } = await res.json();
    location.href =
      `../src/pages/live_session.html?exercise=${encodeURIComponent(ex.name)}` +
      `&session_id=${encodeURIComponent(session_id)}&api=${encodeURIComponent(API)}`;
  }

  // --- G2-E5: deep-link failure/loading states take over the whole page,
  // rather than rendering the picker underneath a request that's about to
  // redirect anyway. ---
  if (deepLinkState === "loading" || deepLinkState === "starting") {
    return (
      <DeepLinkNotice
        title="Starting your session…"
        body="Setting up your exercise from your plan. This should only take a moment."
      />
    );
  }
  if (deepLinkState === "unmapped") {
    return (
      <DeepLinkNotice
        title="This exercise isn't available yet"
        body="Our live-assessment camera doesn't support this exercise yet. Go back to your exercise plan and try one of the others, or contact your doctor."
        actionLabel="Back to my exercise plan"
        onAction={() => { location.href = THEIR_PLAN_PATH; }}
      />
    );
  }
  if (deepLinkState === "calibrate") {
    return (
      <DeepLinkNotice
        title="Hold the band still"
        body="Calibrating the EMG band. Please keep your limb still for a moment."
      />
    );
  }
  if (deepLinkState === "calibrate-failed") {
    const token = localStorage.getItem("authToken");
    const canSkip = calibrateAttempts.current >= 2;
    return (
      <DeepLinkNotice
        title="Band isn't settling"
        body="Hold the limb still and try again, or continue without a fresh calibration."
        actionLabel={canSkip ? "Continue anyway" : "Try again"}
        onAction={() => {
          if (canSkip) {
            void startFromDeepLink(token);
          } else {
            setDeepLinkState("calibrate");
            void runCalibrationGate(token);
          }
        }}
      />
    );
  }
  if (deepLinkState === "start-failed") {
    return (
      <DeepLinkNotice
        title="Couldn't start your session"
        body="Something went wrong reaching the assessment server. Check your connection and try again."
        actionLabel="Retry"
        onAction={() => startFromDeepLink(localStorage.getItem("authToken"))}
      />
    );
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

"""G2-F1/F2 -- Gemini coaching report.

Ports `call_gemini()` and `build_gemini_prompt_generic()` from
`backend/_old_physio_reference/gemini.py:99,141`. Plain REST (`x-goog-api-key`
header, no SDK) -- unchanged. Two things are NOT ports:

  - httpx.AsyncClient instead of `requests`. The old code ran on a dedicated
    thread with a blocking call; this one is awaited from inside
    asyncio.create_task() in an async FastAPI process (F4), so a sync
    `requests.post()` here would stall the event loop for the whole call.
    httpx is already a dependency (see app/services/emg_client.py for the
    same pattern) -- no new dependency added.
  - The prompt BODY is the `g2-v1` text from docs/09g_g2_0_resolutions.md,
    not the old generic knee-coaching text. The old prompt never mentions
    hemophilia and must not ship (integration plan §8, "On what Group 2 does
    not include").

FRAMING (§8, non-negotiable): this is a coaching narrative generated from
rule-based rep data. It is NOT the Phase I model-explained clinical report.
No string here may imply a model assessed the patient -- see the prompt body
itself, which says so to Gemini directly.

generate_report() is the orchestration entrypoint app/routes/session.py's F4
hook fires via asyncio.create_task() on /session/end. It writes ONLY
clinical.report.* and status -- the numeric summary (repCount, cleanReps,
clinical.repLog) is already durable by the time this runs (F4 ordering
guarantee: summary row first, then this task).
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import httpx

from app.logging_setup import correlation, get_logger

log = get_logger("gemini_report")

# gemini-2.5-flash-lite was retired for new users (the API returns a 404
# naming its replacement). The model is recorded on every row as
# clinical.report.model, so older reports stay attributable to the model
# that actually wrote them.
MODEL_NAME = "gemini-3.5-flash-lite"
PROMPT_VERSION = "g2-v3"  # bump on any wording change to the clinical-context
# or "When to stop" blocks -- those are the safety-bearing parts (09g notes).

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"
)

# F1: timeout + one retry. F1/09g: drop the old maxOutputTokens=100000 --
# g2-v3 asks for 450-700 words with a per-error mechanism block, so 2048 was
# clipping the note mid-section; 4096 leaves headroom and still fails fast on
# a runaway generation instead of burning the timeout budget on it.
REQUEST_TIMEOUT_S = 20.0
MAX_OUTPUT_TOKENS = 4096
TEMPERATURE = 0.4


class GeminiError(Exception):
    """Raised on any failure to get report text back. Callers set
    clinical.report.error to str(this) and must NOT touch repCount/cleanReps."""


def _api_key() -> str | None:
    # Read lazily (not at import time): F3 says never send it to the browser,
    # it says nothing about failing app boot when it's absent, and a missing
    # key must degrade to "report generation failed", not "backend won't
    # start". app/auth.py's JWT_SECRET/app/db.py's MONGO_URI fail loudly
    # because the whole app is unusable without them; Gemini is not.
    return os.environ.get("GEMINI_API_KEY")


# ---------------------------------------------------------------------------
# F2: prompt assembly. Data-assembly half ported from the old
# build_gemini_prompt_generic(); the old hardcoded ALL_ERRORS/gemini_errors
# don't exist in this codebase's data-driven exercises.json (F7 of the base
# engine: exercises are pure config, not per-exercise Python), so error
# names/descriptions are read from the exercise record's `thresholds[*].alert`
# strings -- the exact text rules.js puts into a rep's `errors: [...]`
# (frontend/src/lib/rules.js:56-58). Same source of truth, no duplication.
# ---------------------------------------------------------------------------

_G2V1_TEMPLATE = """You are writing a short session note for a patient with hemophilia who has just
finished a home physiotherapy session. A camera-based pose system counted the
repetitions and flagged form errors. You are reading only that automated
movement data. You did not see the patient, and no clinician reviewed this
session.

Exercise: {name}
{description}

HOW THIS EXERCISE IS MEASURED
{exercise_context}

SESSION DATA
Total reps:  {total}
Clean reps:  {clean}
Failed reps: {failed}
Clean rate:  {clean_rate}%

Error frequency (number of reps each error appeared in):
{error_summary}

Rep-by-rep breakdown:
{rep_lines}

Across the set:
{trend_summary}

ERRORS THIS SYSTEM DETECTS FOR THIS EXERCISE
Each entry is the cue the patient saw on screen, followed by the rule that
fired it. Use the rule to explain what was physically happening; do not
invent a mechanism the rule does not support.
{error_descriptions}

CLINICAL CONTEXT — THIS SHAPES EVERYTHING YOU WRITE
This patient has hemophilia. Repeated bleeding into a joint causes
hemarthrosis, synovitis and, over time, arthropathy. Their target joint is
already vulnerable. Because of that:

- Pain, warmth, tightness or swelling in a joint is a possible bleed. It is
  never something to work through, breathe through, or push past. If the
  session data suggests the patient was struggling, say plainly that stopping
  and contacting their care team is the correct response, not persistence.
- Never tell the patient to add repetitions, add sets, add weight or
  resistance, train more often, increase range of motion, or progress to a
  harder exercise. Their plan was approved by their doctor. Changing the dose
  is the doctor's decision, not yours and not the patient's.
- Say nothing about factor products, prophylaxis, dosing, timing of infusions,
  pain medication, or ice and heat. Those are clinical decisions.
- Do not diagnose. Do not state or imply that a bleed, a joint problem, or any
  condition is present or absent. You are describing movement quality only.
- Corrections must be about technique and control: slower tempo, smaller and
  cleaner range, better alignment, resting longer between reps. Never about
  effort or intensity.

WHAT YOU MAY AND MAY NOT CLAIM
The numbers above come from rule-based pose checks on a live camera feed. They
are a measurement of movement, not a clinical assessment, and no predictive
model examined this patient. Do not describe this note as an analysis,
assessment, diagnosis, or AI evaluation of their condition. Do not invent data
that is not in the session above — if there were few reps, or none were clean,
work with that honestly rather than filling the gap.

REPORT STRUCTURE — use exactly these five headings, in this order:

## How the session went
One short paragraph. Honest about the numbers, warm in tone. If the clean rate
was low, treat it as information, not failure.

## What to adjust
The 1 to 3 most frequent or most important form errors, most frequent first.
Give each its own short block, and for each one:
- Name it in plain language, with how many reps out of {total} it appeared in.
- Explain in two or three sentences what is physically happening at the joint
  and why it matters for a joint that is already vulnerable. Ground this in
  the measurement rule listed for that error above.
- Give two or three specific technique cues or drills the patient can use on
  the very next rep. Say what to feel, where to look, and how slow to move.
  Cues about control, alignment, tempo and rest only -- never effort,
  intensity, load, range beyond what was prescribed, or extra reps.
If no errors were detected at all, say so and use this section to name the one
technique detail worth keeping an eye on, at the same dose.

## What went well
Two to four sentences of real positives read off the data: clean reps, errors
in the detected list that never appeared, angles that held steady, a set that
got cleaner as it went. Name the specific numbers you are drawing on. If the
data is thin, say something true and brief rather than padding.

## Next session
One clear priority, expressed as a technique focus at the same dose their
doctor approved. Say in one sentence how they will know it is working -- what
the movement should feel or look like when the cue lands.

## When to stop
Two or three lines, always included, in plain language: stop the exercise and
contact your care team if a joint becomes painful, warm, swollen or tight, if
it feels full or "different", or if you lose movement in it. Do not soften this
into a footnote.

Tone: a physiotherapist speaking directly to their patient. Second person.
Professional, warm, never alarming and never cheerleading.
Plain text only. No asterisks, no bold, no bullet characters other than "-".
Write a full note, roughly 450 to 700 words. Depth belongs in "What to
adjust"; do not pad the other sections to reach length.

LANGUAGE
Write the ENTIRE report in {language_name}, including all five headings and
the "When to stop" lines. Do not mix languages, do not append an English
translation, and do not transliterate -- use the language's own script. The
clinical rules above apply unchanged in every language: the "When to stop"
section is mandatory and must not be softened or shortened in translation.
"""


def _error_summary(rep_log: list[dict]) -> str:
    counts: dict[str, int] = {}
    for rep in rep_log:
        for err in rep.get("errors", []):
            counts[err] = counts.get(err, 0) + 1
    if not counts:
        return "  None detected."
    return "\n".join(
        f"  {count:>2}x  {err}"
        for err, count in sorted(counts.items(), key=lambda kv: -kv[1])
    )


def _rep_lines(rep_log: list[dict]) -> str:
    if not rep_log:
        return "  (no reps recorded)"
    lines = []
    for rep in rep_log:
        errs = rep.get("errors") or []
        angle = rep.get("bestAngle")
        angle_s = f"{angle}°" if angle is not None else "?"
        lines.append(
            f"  Rep {rep.get('rep', '?'):>2}: {'CLEAN' if rep.get('clean') else 'FAIL'} | "
            f"best angle {angle_s} | errors: {', '.join(errs) if errs else 'none'}"
        )
    return "\n".join(lines)


def _error_descriptions(exercise_record: dict) -> str:
    """Every threshold that carries an `alert`, with the rule that fires it.

    The alert string is the exact text rules.js puts into a rep's errors[]
    (same config, no duplication). The old physio prompt hand-wrote a
    biomechanical gloss per error; this codebase's exercises.json is pure
    config, so instead of inventing prose the exercise owner never signed off
    on, we hand Gemini the threshold itself -- value, unit and sign convention
    -- and let it explain the mechanism from the actual rule."""
    thresholds = exercise_record.get("thresholds") or {}
    lines: list[str] = []
    n = 0
    for key, entry in thresholds.items():
        if not isinstance(entry, dict):
            continue
        value, unit = entry.get("value"), entry.get("unit")
        # Two shapes in exercises.json: a numeric threshold carrying its cue in
        # `alert`, and a pure-cue entry whose `value` IS the string (unit
        # "alert string"), e.g. depth_insufficient_alert -- rules.js reads both
        # (frontend/src/lib/rules.js:227). Keying only off `alert` silently
        # dropped the depth cue, the most common error of all.
        alert = entry.get("alert") or (value if unit == "alert string" else None)
        if not alert:
            continue
        n += 1
        lines.append(f"{n}. {alert}")
        rule = f"   Rule `{key}`"
        if unit == "alert string":
            rule += f": {entry.get('signal') or 'fired by the rep-trigger depth check'}"
        elif value is not None:
            rule += f": threshold {value}" + (f" {unit}" if unit else "")
        else:
            rule += ": threshold not yet set by the exercise owner"
        lines.append(rule)
        if entry.get("sign_convention"):
            lines.append(f"   Sign convention: {entry['sign_convention']}")
    if not lines:
        return "  (no specific error descriptions configured for this exercise.)"
    return "\n".join(lines)


def _exercise_context(exercise_record: dict) -> str:
    """The measurement setup, so the note can explain WHY a rep failed.

    Everything here is already in exercises.json; without it Gemini sees only
    error names and can say nothing concrete about depth, angles or camera
    view -- which is most of why the shipped reports read thin."""
    out: list[str] = []
    if exercise_record.get("type"):
        out.append(f"- Movement type: {exercise_record['type']}")
    views = exercise_record.get("valid_views") or []
    if views:
        out.append(f"- Camera view used: {', '.join(views)}")
    joints = exercise_record.get("joints") or []
    for j in joints:
        name = j.get("display_name")
        if not name:
            continue
        parts = [f"{j.get('landmark_a')}-{j.get('landmark_b')}-{j.get('landmark_c')}"]
        if j.get("is_rep_driver"):
            parts.append("drives rep counting")
        out.append(f"- Joint angle tracked: {name} ({'; '.join(parts)})")
    trig = exercise_record.get("rep_trigger") or {}
    if trig:
        def _v(k):
            v = trig.get(k)
            return v.get("value") if isinstance(v, dict) else v
        enter, exit_, depth = _v("enter_angle"), _v("exit_angle"), _v("depth_target")
        out.append(
            f"- A rep is counted on {trig.get('joint_display_name', 'the tracked joint')}, "
            f"whose angle must {trig.get('direction', 'change')} through {enter}° to start the "
            f"rep and pass back through {exit_}° to end it."
        )
        if depth is not None:
            out.append(
                f"- Target angle for a rep to count as full range: {depth}° at that joint. "
                f"'best angle' in the breakdown below is the furthest that rep got toward it."
            )
    checks = exercise_record.get("extra_checks") or []
    if checks:
        out.append(f"- Extra form checks running each rep: {', '.join(checks)}")
    return "\n".join(out) or "  (measurement details not configured for this exercise.)"


def _trend_summary(rep_log: list[dict]) -> str:
    """First-half vs second-half clean rate + angle range.

    The prompt asks for 'improvement across the set'; without this the model
    has to eyeball the rep list and usually just skips the claim."""
    if not rep_log:
        return "  (no reps recorded)"
    if len(rep_log) < 2:
        return "  Only one rep recorded — too little to read a trend from."
    mid = len(rep_log) // 2
    def _rate(chunk):
        return int(sum(1 for r in chunk if r.get("clean")) * 100 / len(chunk)) if chunk else 0
    out = [
        f"  Clean rate first half: {_rate(rep_log[:mid])}%  |  second half: {_rate(rep_log[mid:])}%"
    ]
    angles = [r.get("bestAngle") for r in rep_log if r.get("bestAngle") is not None]
    if angles:
        out.append(
            f"  Best angle across reps: min {min(angles):g}°, max {max(angles):g}°, "
            f"mean {sum(angles) / len(angles):.0f}° "
            f"(spread {max(angles) - min(angles):g}° — a wide spread means inconsistent range)"
        )
    return "\n".join(out)


def _exercise_description(exercise_record: dict) -> str:
    joints = [j.get("display_name") for j in exercise_record.get("joints", []) if j.get("display_name")]
    if joints:
        return f"Targets: {', '.join(dict.fromkeys(joints))}."
    return ""


# The session languages their SPA offers (localStorage.preferredLanguage).
# ALLOWLIST, not a passthrough: this value is interpolated into the prompt, so
# accepting free text would let a client rewrite the model's instructions --
# including the clinical rules. Anything unrecognised falls back to English.
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (\u0939\u093f\u0928\u094d\u0926\u0940, Devanagari script)",
    "mr": "Marathi (\u092e\u0930\u093e\u0920\u0940, Devanagari script)",
}
DEFAULT_LANGUAGE = "en"


def language_name(code: str | None) -> str:
    return LANGUAGE_NAMES.get(code or DEFAULT_LANGUAGE, LANGUAGE_NAMES[DEFAULT_LANGUAGE])


def build_prompt(
    exercise_record: dict, rep_log: list[dict], total: int, clean: int,
    language: str | None = None,
) -> str:
    failed = max(total - clean, 0)
    clean_rate = int(clean / total * 100) if total else 0
    return _G2V1_TEMPLATE.format(
        name=exercise_record.get("display_name") or exercise_record.get("name") or "this exercise",
        description=_exercise_description(exercise_record),
        exercise_context=_exercise_context(exercise_record),
        trend_summary=_trend_summary(rep_log),
        total=total,
        clean=clean,
        failed=failed,
        clean_rate=clean_rate,
        error_summary=_error_summary(rep_log),
        rep_lines=_rep_lines(rep_log),
        error_descriptions=_error_descriptions(exercise_record),
        language_name=language_name(language),
    )


# ---------------------------------------------------------------------------
# F1: the REST call.
# ---------------------------------------------------------------------------

async def call_gemini(prompt: str) -> str:
    """One HTTP call, one retry on failure. Raises GeminiError on both
    failing -- never returns an "ERROR: ..." string like the old cv2-window
    code did, so callers can't accidentally persist that string as if it were
    a real report."""
    api_key = _api_key()
    if not api_key:
        raise GeminiError("GEMINI_API_KEY not set")

    payload: dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": TEMPERATURE,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    }
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}

    last_err: str | None = None
    for attempt in (1, 2):  # F1: timeout + ONE retry
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
                r = await client.post(GEMINI_URL, headers=headers, json=payload)
            if r.status_code == 200:
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                log.info("report_generated", attempt=attempt, model=MODEL_NAME, chars=len(text))
                return text
            last_err = f"gemini http {r.status_code}: {r.text[:300]}"
        except (httpx.TimeoutException, httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
            last_err = f"gemini call failed: {exc}"
        log.info("report_failed", attempt=attempt, reason=last_err)

    raise GeminiError(last_err or "gemini call failed for an unknown reason")


# ---------------------------------------------------------------------------
# F4 orchestration -- called via asyncio.create_task() from session.py's
# session_end hook, AFTER the summary row is already durable. On success sets
# status "reported"; on failure sets clinical.report.error and leaves
# status "ended" (never touches repCount/cleanReps/clinical.repLog).
# ---------------------------------------------------------------------------

async def generate_report(app, session_id: str) -> None:
    # Local imports: reuse session.py's helpers rather than a second copy
    # (ponytail + the plan's explicit instruction), without creating an
    # import cycle at module load time (session.py imports nothing from here
    # at import time -- only inside the route handler, see the F4 hook).
    from app.routes.session import _sessions, get_session

    doc = await get_session(app, session_id)
    if doc is None:
        # Session vanished between /session/end returning and this task
        # running -- nothing to report on, nothing to lose.
        return

    registry = getattr(app.state, "exercise_registry", {}) or {}
    exercise_record = registry.get(doc.get("engineExercise"), {})
    rep_log = (doc.get("clinical") or {}).get("repLog", [])
    total = doc.get("repCount", 0)
    clean = doc.get("cleanReps", 0)
    # The session's own language (snapshotted at /session/start from their
    # SPA's localStorage.preferredLanguage). Unknown/missing -> English.
    prompt = build_prompt(exercise_record, rep_log, total, clean, doc.get("language"))

    now = datetime.now(timezone.utc)
    with correlation(session_id=session_id):
        try:
            text = await call_gemini(prompt)
        except GeminiError as exc:
            await _sessions(app).update_one(
                {"sessionId": session_id},
                {"$set": {
                    "clinical.report.error": str(exc),
                    "updatedAt": now,
                }},
            )
            return

        await _sessions(app).update_one(
            {"sessionId": session_id},
            {"$set": {
                "clinical.report.text": text,
                "clinical.report.model": MODEL_NAME,
                "clinical.report.promptVersion": PROMPT_VERSION,
                "clinical.report.language": doc.get("language") or DEFAULT_LANGUAGE,
                "clinical.report.generatedAt": now,
                "clinical.report.error": None,
                "status": "reported",
                "updatedAt": now,
            }},
        )


if __name__ == "__main__":
    # Run as `../venv/bin/python -m app.services.gemini_report` from backend/
    # -- this file imports app.logging_setup at module scope, so the package
    # must already be resolvable before this block even runs; -m (not a bare
    # script path) is what makes that true.
    #
    # Runnable self-check, no framework, no network: prompt assembly only.
    # Does NOT call the real API -- see report.py's tests for the stubbed
    # HTTP path.
    fake_exercise = {
        "name": "squat",
        "display_name": "Squat",
        "joints": [{"display_name": "Knee (L)"}, {"display_name": "Knee (R)"}],
        "type": "dynamic",
        "valid_views": ["SIDE"],
        "rep_trigger": {
            "joint_display_name": "Knee (L)", "direction": "decrease",
            "enter_angle": {"value": 150}, "exit_angle": {"value": 170},
            "depth_target": {"value": 90},
        },
        "extra_checks": ["heel_lifting"],
        "thresholds": {
            "heel_lifting_max_y_rise": {
                "value": 0.03, "unit": "normalized y",
                "sign_convention": "positive = heel rising",
                "alert": "Knees caving in — push knees out",
            },
            "b": {"alert": None},
        },
    }
    rep_log = [
        {"rep": 1, "clean": True, "bestAngle": 88, "errors": []},
        {"rep": 2, "clean": False, "bestAngle": 95, "errors": ["Knees caving in — push knees out"]},
    ]
    prompt = build_prompt(fake_exercise, rep_log, total=2, clean=1)
    assert "## When to stop" in prompt, "mandatory heading missing from g2-v1 prompt"
    assert "hemophilia" in prompt.lower(), "clinical framing missing"
    assert "promptVersion" not in prompt  # that's a DB field, not prompt text
    assert "Squat" in prompt and "Knees caving in" in prompt
    assert "Clean rate:  50%" in prompt
    assert "Target angle" in prompt, "rep_trigger context missing"
    assert "Clean rate first half" in prompt, "trend summary missing"
    assert "heel_lifting_max_y_rise" in prompt, "threshold rule missing from error list"
    print("OK: app/services/gemini_report.py self-check passed")

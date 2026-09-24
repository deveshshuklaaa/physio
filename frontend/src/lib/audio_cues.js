/**
 * audio_cues.js — G8. Plays the mp3 mapped to an alert/error code, debounced
 * so the same cue doesn't replay more than once per N seconds (matches
 * voice.py's per-text TTS_COOLDOWN = 4.0s, docs/03_legacy.md D6).
 *
 * Deliberately does NOT copy voice.py:48's `any(...)` availability check —
 * that bug is what let 4/7 broken mappings go unnoticed. Missing assets are
 * reported individually via `logger.warn`.
 */
const AUDIO_BASE = new URL("../assets/audio/", import.meta.url);
const COOLDOWN_MS = 4000;

// Alert string -> filename. Canonical per docs/03_legacy.md D6 Resolution 1
// (files on disk are canonical; voice.py's AUDIO_MAP was fixed to match).
export const AUDIO_MAP = {
  "Knees caving in — push knees out": "caving.mp3",
  "Leaning too far forward — chest up": "chest_up.mp3",
  "Knee past toes — sit back more": "toes.mp3",
  "Not deep enough": "not_deep.mp3",
  "Heels lifting — press heels down": "heel_lifting.mp3",
  "Lower back rounding — brace your core": "butt_wink.mp3",
  "Neck not neutral — look straight ahead": "neck_neutral.mp3",

  // The five ML-dataset exercises. Every cue file below is NOT YET RECORDED —
  // see docs/VALIDATION_TODO.md. They are mapped anyway, deliberately: an
  // unmapped alert returns early from play() and is invisible, whereas a
  // mapped-but-missing file is reported per-asset by the error handler below
  // (logger.warn "audio_cue_missing" + a console.error naming the file). A
  // gap you can see beats a gap you cannot.
  "Heel lifting off the surface — keep it down": "heel_down.mp3",
  "Hip lifting off the surface — keep it flat": "hip_flat.mp3",
  "Slide your heel further in": "slide_further.mp3",
  // ponytail: HS/TKE (2026-09-24) reuse existing cues until dedicated mp3s are recorded.
  "Slide your heel further toward your hip": "slide_further.mp3",
  "Keep your thigh on the pillow — only straighten the knee": "hip_flat.mp3",
  "Knees bowing out — track knees over toes": "knee_varus.mp3",
  "Feet too close together — widen your stance": "widen_stance.mp3",
  "Back rounding — chest up": "back_rounding.mp3",
  "Hip lifting off the seat — stay seated": "stay_seated.mp3",
  "Back slouching — sit tall": "sit_tall.mp3",
  "Rocking your torso — keep still": "keep_still.mp3",
  "Extend your knee further": "extend_knee.mp3",
  "Raising too high — lower the leg": "lower_leg.mp3",
  "Knee bending — keep your leg straight": "leg_straight.mp3",
  "Head lifting — rest your head down": "head_down.mp3",
  "Raise your leg higher": "raise_higher.mp3",
  "Hip lifting — keep your hip down": "hip_down.mp3",
  "Straighten your knee fully": "straighten_knee.mp3",
};

export class AudioCuePlayer {
  constructor({ logger } = {}) {
    this.logger = logger || null;
    this._lastPlayed = new Map(); // alertText -> ts_ms
    this._missingWarned = new Set();
    this._audioEls = new Map(); // filename -> HTMLAudioElement, reused (avoid GC churn)
  }

  /** Call with an alert string (e.g. from rules.js). No-op if unmapped, missing, or cooling down. */
  play(alertText) {
    const filename = AUDIO_MAP[alertText];
    if (!filename) return; // unmapped alert — not this module's job to invent a mapping

    const now = Date.now();
    const last = this._lastPlayed.get(alertText) || 0;
    if (now - last < COOLDOWN_MS) return;
    this._lastPlayed.set(alertText, now);

    let el = this._audioEls.get(filename);
    if (!el) {
      el = new Audio(new URL(filename, AUDIO_BASE).href);
      el.addEventListener("error", () => {
        if (!this._missingWarned.has(filename)) {
          this._missingWarned.add(filename);
          // Report EACH missing asset individually — do not collapse to one
          // boolean like voice.py's availability check did. New event added
          // to events.py + events.js for this (see docs/09_live_frontend.md).
          this.logger?.warn("audio_cue_missing", { filename, alert_text: alertText });
          // eslint-disable-next-line no-console
          console.error(`[audio_cues] missing asset: ${filename} (alert: "${alertText}")`);
        }
      });
      this._audioEls.set(filename, el);
    }
    // Fire-and-forget, like voice.py's daemon-thread play — overlapping cues
    // for different alerts can play simultaneously, no single-voice mutex,
    // matching legacy behaviour.
    el.currentTime = 0;
    el.play().catch(() => {
      /* autoplay-policy or similar — non-fatal for a user-initiated session */
    });
  }
}

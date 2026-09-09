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

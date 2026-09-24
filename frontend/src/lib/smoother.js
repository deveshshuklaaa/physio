/**
 * smoother.js — G3.
 *
 * IMPORTANT (see docs/03_legacy.md D4 + Discrepancy #4, and G3 instructions):
 * the legacy `smoother.py` is a plain per-coordinate EMA (alpha=0.25), NOT a
 * One-Euro filter, despite the master plan's §3.3/§G3 language calling for
 * One-Euro. That plan language is forward-looking design, not a port of
 * existing behaviour. Two real options exist and they conflict:
 *
 *   - EMA replicates the legacy pipeline exactly -> required for the Phase G
 *     6-decimal parity gate (front/2D angles run on smoothed points).
 *   - One-Euro gives better live smoothing (adaptive to velocity) but WILL
 *     NOT match legacy output to 6 decimals.
 *
 * Both are implemented. EMA is the default so the gate is passable.
 * One-Euro is available behind an explicit `{ filter: "one-euro" }` option.
 * This file does not silently pick one — see docs/09_live_frontend.md for
 * the write-up for the project owner to decide.
 */

const EMA_ALPHA = 0.25;

/** Plain EMA smoother, matching smoother.py exactly (D4). */
export class EmaSmoother {
  constructor(alpha = EMA_ALPHA) {
    this.alpha = alpha;
    this._smoothed = new Map(); // name -> [x, y, z]
  }

  /**
   * name: landmark name string. raw: {x, y, z} normalized coords.
   * Returns the smoothed [x, y, z] tuple. Seeds unlagged on first call for
   * a given name, exactly like smooth_landmark's `if name not in _smoothed`.
   */
  smooth(name, raw) {
    const n = [raw.x, raw.y, raw.z];
    if (!this._smoothed.has(name)) {
      this._smoothed.set(name, n.slice());
    } else {
      const s = this._smoothed.get(name);
      const out = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        out[i] = this.alpha * n[i] + (1.0 - this.alpha) * s[i];
      }
      this._smoothed.set(name, out);
    }
    return this._smoothed.get(name);
  }

  /** Equivalent to reset_smoother() — bound to the legacy 'r' key. */
  reset() {
    this._smoothed.clear();
  }
}

/**
 * One-Euro filter — NEW design, not a legacy port. Off by default.
 * Standard formulation (Casiez et al. 2012), one instance per scalar signal.
 */
export class OneEuroScalar {
  constructor({ minCutoff = 1.0, beta = 0.0, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this._xPrev = null;
    this._dxPrev = 0;
    this._tPrev = null;
  }

  static alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x, t) {
    if (this._tPrev === null) {
      this._xPrev = x;
      this._dxPrev = 0;
      this._tPrev = t;
      return x;
    }
    const dt = Math.max(t - this._tPrev, 1e-3);
    const dx = (x - this._xPrev) / dt;
    const aD = OneEuroScalar.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this._dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuroScalar.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this._xPrev;
    this._xPrev = xHat;
    this._dxPrev = dxHat;
    this._tPrev = t;
    return xHat;
  }
}

export class OneEuroSmoother {
  constructor(opts = {}) {
    this.opts = opts;
    this._filters = new Map(); // name -> [OneEuroScalar x3]
  }

  smooth(name, raw, tSeconds) {
    if (!this._filters.has(name)) {
      this._filters.set(name, [
        new OneEuroScalar(this.opts),
        new OneEuroScalar(this.opts),
        new OneEuroScalar(this.opts),
      ]);
    }
    const [fx, fy, fz] = this._filters.get(name);
    return [
      fx.filter(raw.x, tSeconds),
      fy.filter(raw.y, tSeconds),
      fz.filter(raw.z, tSeconds),
    ];
  }

  reset() {
    this._filters.clear();
  }
}

/** Factory matching the "default EMA, flagged One-Euro" decision above. */
export function createSmoother(kind = "ema", opts = {}) {
  return kind === "one-euro" ? new OneEuroSmoother(opts) : new EmaSmoother(opts.alpha);
}

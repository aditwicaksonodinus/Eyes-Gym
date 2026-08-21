/**
 * Adaptive single-letter acuity staircase — PURE state machine.
 *
 * No React, no `window`/`Date.now`/random. Fully deterministic so it is
 * directly unit-testable. The caller (a page component) drives it by calling
 * `answer(correct)` once per presented letter and reads `result()` at the end.
 *
 * ── Staircase rules ──────────────────────────────────────────────────────────
 * • One letter is presented at a time. The current difficulty is `logMAR`.
 * • Start logMAR = 0.0 (20/20). Step = 0.1 logMAR per letter.
 * • Correct answer  → step DOWN by 0.1 (better acuity, smaller letters).
 * • Incorrect answer → step UP   by 0.1 (worse acuity, bigger letters).
 * • Bounds: minLogMAR = -0.3 (best, ~20/10), maxLogMAR = 1.0 (worst, 20/200).
 *   logMAR is clamped to [minLogMAR, maxLogMAR] on every step.
 * • A REVERSAL is a change in stepping direction (correct↔incorrect flip).
 *   The logMAR value AFTER the step that flipped direction is recorded as a
 *   reversal point.
 * • STOP when `maxReversals` reversals have occurred OR when logMAR is pinned
 *   at a bound and the next step in the current direction would not move it.
 *
 * ── Threshold estimate ───────────────────────────────────────────────────────
 * Standard staircase estimate = the average of the logMAR values recorded at
 * the reversal points AFTER the first reversal (the first reversal lets the
 * staircase settle). If ≤1 reversal occurred (e.g. all-correct or all-incorrect
 * runs that pin a bound, or a monotonic run), the final clamped logMAR is
 * reported instead.
 *
 * ── Conversions (pure math) ───────────────────────────────────────────────────
 *   snellenFraction = "20/" + round(20 · 10^logMAR)
 *   snellenSix      =  "6/" + round( 6 · 10^logMAR)
 *   decimal         = 10^(-logMAR)
 *   band: logMAR ≤ 0.1 → "Normal"; ≤ 0.4 → "Ringan"; else → "Perlu pemeriksaan"
 */

export interface AcuityOptions {
  /** Best (lowest) logMAR reachable. Default -0.3. */
  minLogMAR?: number;
  /** Worst (highest) logMAR reachable. Default 1.0. */
  maxLogMAR?: number;
  /** logMAR step per answer. Default 0.1. */
  step?: number;
  /** Stop after this many reversals. Default 6. */
  maxReversals?: number;
}

export interface AcuityState {
  /** Current logMAR (clamped). */
  logMAR: number;
  /** True once a stop rule fired. */
  done: boolean;
  /** Number of direction reversals observed. */
  reversals: number;
  /** Chronological correctness of every answered letter. */
  answers: boolean[];
}

export interface AcuityResult {
  /** Estimated logMAR (reversal average, or final clamped if ≤1 reversal). */
  logMAR: number;
  /** Imperial Snellen, e.g. "20/20". */
  snellenFraction: string;
  /** Metric Snellen, e.g. "6/6". */
  snellenSix: string;
  /** Decimal acuity = 10^(-logMAR). */
  decimal: number;
  /** Plain-language band: "Normal" | "Ringan" | "Perlu pemeriksaan". */
  band: string;
}

const DEFAULTS = {
  minLogMAR: -0.3,
  maxLogMAR: 1.0,
  step: 0.1,
  maxReversals: 6,
} as const;

/** Coerce a possibly-NaN/non-finite logMAR to a safe finite value (0). */
function safeLogMAR(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

/** Map an estimated logMAR to a plain-language screening band. */
export function bandForLogMAR(logMAR: number): string {
  const safe = safeLogMAR(logMAR);
  if (safe <= 0.1) return "Normal";
  if (safe <= 0.4) return "Ringan";
  return "Perlu pemeriksaan";
}

/** Pure conversion helpers (exported for reuse / direct testing). */
export function toSnellenFraction(logMAR: number): string {
  const safe = safeLogMAR(logMAR);
  return "20/" + Math.round(20 * 10 ** safe);
}
export function toSnellenSix(logMAR: number): string {
  const safe = safeLogMAR(logMAR);
  return "6/" + Math.round(6 * 10 ** safe);
}
export function toDecimal(logMAR: number): number {
  const safe = safeLogMAR(logMAR);
  return 10 ** -safe;
}

/**
 * Create a fresh acuity staircase instance.
 *
 * Returns an object with:
 *  • `answer(correct)` — feed one letter's correctness, returns the new state.
 *  • `getState()`      — snapshot of `{ logMAR, done, reversals, answers }`.
 *  • `result()`        — `{ logMAR, snellenFraction, snellenSix, decimal, band }`.
 */
export function createAcuityTest(opts: AcuityOptions = {}) {
  const minLogMAR = opts.minLogMAR ?? DEFAULTS.minLogMAR;
  const maxLogMAR = opts.maxLogMAR ?? DEFAULTS.maxLogMAR;
  const step = opts.step ?? DEFAULTS.step;
  const maxReversals = opts.maxReversals ?? DEFAULTS.maxReversals;

  let logMAR = 0.0;
  let done = false;
  let reversals = 0;
  const answers: boolean[] = [];
  /** Stepping direction: -1 = down (correct), +1 = up (incorrect), 0 = none yet. */
  let direction = 0;
  /** logMAR values recorded at each reversal (after the flipping step). */
  const reversalLogMARs: number[] = [];

  const clamp = (v: number): number =>
    Math.min(maxLogMAR, Math.max(minLogMAR, v));

  function getState(): AcuityState {
    return {
      logMAR,
      done,
      reversals,
      answers: [...answers],
    };
  }

  function answer(correct: boolean): AcuityState {
    if (done) return getState();

    const newDirection = correct ? -1 : 1;
    const prevLogMAR = logMAR;
    const next = clamp(prevLogMAR + newDirection * step);

    // A reversal = the stepping direction flipped versus the previous answer.
    if (direction !== 0 && newDirection !== direction) {
      reversals += 1;
      reversalLogMARs.push(next);
    }

    direction = newDirection;
    logMAR = next;
    answers.push(correct);

    // Stop rule: enough reversals, OR pinned at a bound it cannot move past.
    const pinnedAtBound = clamp(logMAR + newDirection * step) === logMAR;
    if (reversals >= maxReversals || pinnedAtBound) {
      done = true;
    }

    return getState();
  }

  function result(): AcuityResult {
    let estLogMAR: number;
    if (reversalLogMARs.length > 1) {
      // Average reversal points AFTER the first reversal (settling skip).
      const afterFirst = reversalLogMARs.slice(1);
      estLogMAR =
        afterFirst.reduce((a, b) => a + b, 0) / afterFirst.length;
    } else {
      // ≤1 reversal (monotonic / bound-pinned run): report final clamped logMAR.
      estLogMAR = logMAR;
    }

    // Guard against any non-finite estimate (defensive; should never happen
    // with the clamped staircase, but guarantees a usable result).
    if (!Number.isFinite(estLogMAR)) estLogMAR = 0;

    return {
      logMAR: estLogMAR,
      snellenFraction: toSnellenFraction(estLogMAR),
      snellenSix: toSnellenSix(estLogMAR),
      decimal: toDecimal(estLogMAR),
      band: bandForLogMAR(estLogMAR),
    };
  }

  return { answer, getState, result };
}

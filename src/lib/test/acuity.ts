/**
 * ETDRS Line-by-Line Visual Acuity Test — PURE state machine.
 *
 * No React, no `window`/`Date.now`/random. Fully deterministic and unit-testable.
 * Driven by calling `answer(correct)` per presented letter and reading `result()`.
 *
 * ── ETDRS Protocol Rules ──────────────────────────────────────────────────────
 * • Start at logMAR 1.0 (20/200, 6/60). Each line presents 5 letters.
 * • A line is PASSED if the user gets ≥ 3 out of 5 letters correct (≥ 60%).
 * • Passed line → advance to the next smaller line (logMAR decreases by 0.1).
 * • Failed line (< 3/5 correct) → test stops immediately for that eye.
 * • Minimum logMAR reachable: -0.3 (20/10, 6/3).
 *
 * ── ETDRS Letter-Credit Scoring ──────────────────────────────────────────────
 * • Base acuity = logMAR of the smallest line passed (or startLogMAR if none passed).
 * • Letter credit = 0.02 logMAR bonus per correct letter on the failed line
 *   (each letter in a 5-letter line equals 0.1 / 5 = 0.02 logMAR).
 * • Estimated logMAR = baseLogMAR - (failedLineCorrectCount · 0.02).
 */

export interface AcuityOptions {
  /** Best (lowest) logMAR reachable. Default -0.3. */
  minLogMAR?: number;
  /** Worst (highest) logMAR reachable. Default 1.0. */
  maxLogMAR?: number;
  /** logMAR step per line. Default 0.1. */
  step?: number;
  /** Letters presented per line. Default 5. */
  lettersPerLine?: number;
  /** Passing count threshold per line. Default 3. */
  passThreshold?: number;
  /** Starting logMAR difficulty. Default 1.0. */
  startLogMAR?: number;
}

export interface AcuityState {
  /** Current line logMAR. */
  logMAR: number;
  /** 1-indexed letter position in current line (1 to 5). */
  letterInLine: number;
  /** Number of correct letters answered in current line so far. */
  lineCorrectCount: number;
  /** True once the test is completed (line failed or min logMAR passed). */
  done: boolean;
  /** Reversal count mirror (for backward compatibility). */
  reversals: number;
  /** Chronological record of correctness for every letter. */
  answers: boolean[];
}

export interface AcuityResult {
  /** Estimated logMAR with ETDRS letter-credit adjustment. */
  logMAR: number;
  /** Imperial Snellen fraction, e.g. "20/20". */
  snellenFraction: string;
  /** Metric Snellen fraction, e.g. "6/6". */
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
  lettersPerLine: 5,
  passThreshold: 3,
  startLogMAR: 1.0,
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

/** Pure conversion helpers. */
export function toSnellenFraction(logMAR: number): string {
  const safe = safeLogMAR(logMAR);
  const denom = Math.round(20 * 10 ** safe);
  return `20/${denom}`;
}

export function toSnellenSix(logMAR: number): string {
  const safe = safeLogMAR(logMAR);
  const denom = Math.round(6 * 10 ** safe);
  return `6/${denom}`;
}

export function toDecimal(logMAR: number): number {
  const safe = safeLogMAR(logMAR);
  return Number((10 ** -safe).toFixed(2));
}

/**
 * Create an ETDRS line-by-line acuity test instance.
 */
export function createAcuityTest(opts: AcuityOptions = {}) {
  const minLogMAR = opts.minLogMAR ?? DEFAULTS.minLogMAR;
  const maxLogMAR = opts.maxLogMAR ?? DEFAULTS.maxLogMAR;
  const step = opts.step ?? DEFAULTS.step;
  const lettersPerLine = opts.lettersPerLine ?? DEFAULTS.lettersPerLine;
  const passThreshold = opts.passThreshold ?? DEFAULTS.passThreshold;

  let logMAR = opts.startLogMAR ?? DEFAULTS.startLogMAR;
  let done = false;
  let lineCorrectCount = 0;
  let lineTotalCount = 0;
  let lastPassedLogMAR: number | null = null;
  const answers: boolean[] = [];

  const clamp = (v: number): number =>
    Math.min(maxLogMAR, Math.max(minLogMAR, v));

  function getState(): AcuityState {
    return {
      logMAR,
      letterInLine: Math.min(lettersPerLine, lineTotalCount + 1),
      lineCorrectCount,
      done,
      reversals: 0,
      answers: [...answers],
    };
  }

  function answer(correct: boolean): AcuityState {
    if (done) return getState();

    answers.push(correct);
    lineTotalCount += 1;
    if (correct) {
      lineCorrectCount += 1;
    }

    // Evaluate line pass / early-fail condition
    const maxPossibleCorrect = lineCorrectCount + (lettersPerLine - lineTotalCount);

    if (maxPossibleCorrect < passThreshold) {
      // Line mathematically cannot pass (e.g. 3 incorrect/unreadable) -> early stop
      done = true;
    } else if (lineTotalCount >= lettersPerLine) {
      if (lineCorrectCount >= passThreshold) {
        // Passed current line
        lastPassedLogMAR = logMAR;
        if (logMAR <= minLogMAR) {
          // Reached smallest line (-0.3)
          done = true;
        } else {
          // Advance to next smaller line
          logMAR = clamp(Number((logMAR - step).toFixed(2)));
          lineCorrectCount = 0;
          lineTotalCount = 0;
        }
      } else {
        // Failed current line -> stop test
        done = true;
      }
    }

    return getState();
  }

  function result(): AcuityResult {
    let estLogMAR: number;

    if (lastPassedLogMAR !== null) {
      // Base = lowest passed line. Credit bonus per correct letter on the failed line.
      const credit =
        lineTotalCount > 0 && lineTotalCount < lettersPerLine || (done && lineTotalCount === lettersPerLine && lineCorrectCount < passThreshold)
          ? lineCorrectCount * (step / lettersPerLine)
          : 0;
      estLogMAR = clamp(Number((lastPassedLogMAR - credit).toFixed(3)));
    } else {
      // No line passed -> base startLogMAR minus letter credits
      const credit = lineCorrectCount * (step / lettersPerLine);
      estLogMAR = clamp(Number((logMAR - credit).toFixed(3)));
    }

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

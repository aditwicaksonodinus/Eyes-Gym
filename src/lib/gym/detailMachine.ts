/**
 * detailMachine — PURE per-exercise progression state machine for ONE guided
 * exercise session (the `/exercises/[slug]` detail page lifecycle).
 *
 * This mirrors the injectable-clock pure-factory pattern established by
 * `src/lib/useTimer.ts`'s `createTimer`: all time advancement is driven by a
 * caller-supplied `clock()` (ms), so Vitest can drive it with a fake clock and
 * assert deterministic transitions. No `setInterval`, no `Date.now`, no React.
 *
 * The machine owns exactly ONE exercise's lifecycle:
 *   idle → running → paused → done   (plus reset → idle)
 *
 * It supports two exercise shapes from `@/lib/exercises`:
 *   - duration-based (`reps` absent): counts down `getDurationBounds().max` sec.
 *   - rep-based (`reps` present): counts completed reps up to `getRepBounds().max`.
 *
 * "Selesai" = `complete()` (mark done). "Selanjutnya" = the page layer advances
 * to `nextSlug`; the machine only reports `done` and carries the slug.
 */

import {
  type Exercise,
  getDurationBounds,
  getRepBounds,
} from "@/lib/exercises";

/** Abstract time source returning milliseconds since an arbitrary epoch. */
export type Clock = () => number;

/** Lifecycle status of a single exercise session. */
export type DetailStatus = "idle" | "running" | "paused" | "done";

/** Observable snapshot of the machine. */
export interface DetailState {
  status: DetailStatus;
  /** Whole seconds remaining (duration-based). 0 for rep-based. */
  remainingSec: number;
  /** Reps left to complete (rep-based only). */
  remainingReps?: number;
  done: boolean;
}

export interface DetailMachineOptions {
  /** Injectable time source in ms. Required for deterministic testing. */
  clock: Clock;
  /** Slug of the next exercise; the page layer uses it for "Selanjutnya". */
  nextSlug?: string;
  /** Called exactly once when the machine first crosses into `done`. */
  onDone?: () => void;
}

/** Imperative handle returned by {@link createDetailMachine}. */
export interface DetailMachine {
  readonly nextSlug?: string;
  getState(): DetailState;
  start(): void;
  pause(): void;
  resume(): void;
  /** Fold elapsed clock time into the countdown (duration-based). */
  tick(): void;
  /** Record one completed rep (rep-based). Crosses to done at the target. */
  completeRep(): void;
  /** Force done (the "Selesai" action). */
  complete(): void;
  reset(): void;
}

/**
 * PURE factory. State advances only when `getState`/`tick` is read or a
 * transition runs while running — fully deterministic under a fake clock.
 */
export function createDetailMachine(
  exercise: Exercise,
  options: DetailMachineOptions,
): DetailMachine {
  const { clock, nextSlug, onDone } = options;
  const isRepBased = exercise.reps !== undefined;

  // Duration target uses the inclusive max bound (spec §2 ranges).
  const targetMs = getDurationBounds(exercise).max * 1000;
  // Rep target uses the inclusive max bound.
  const targetReps = getRepBounds(exercise).max;

  let status: DetailStatus = "idle";
  let remainingMs = targetMs;
  let completedReps = 0;
  let lastTick: number | null = null;
  let doneFired = false;

  /** Fire `onDone` exactly once on the done transition. */
  function fireDone(): void {
    if (doneFired) return;
    doneFired = true;
    onDone?.();
  }

  /** Fold elapsed clock time into `remainingMs` (duration-based only). */
  function advance(): void {
    if (status !== "running" || isRepBased) return;
    const t = clock();
    if (lastTick !== null) {
      const elapsed = t - lastTick;
      remainingMs = Math.max(0, remainingMs - elapsed);
      if (remainingMs <= 0) {
        remainingMs = 0;
        status = "done";
        lastTick = null;
        fireDone();
      }
    }
    lastTick = t;
  }

  function getState(): DetailState {
    advance();
    const base: DetailState = {
      status,
      remainingSec: isRepBased ? 0 : Math.ceil(remainingMs / 1000),
      done: status === "done",
    };
    if (isRepBased) {
      base.remainingReps = Math.max(0, targetReps - completedReps);
    }
    return base;
  }

  return {
    nextSlug,
    getState,
    start(): void {
      if (status === "running" || status === "done") return;
      status = "running";
      lastTick = clock();
    },
    pause(): void {
      if (status !== "running") return;
      advance();
      status = "paused";
      lastTick = null;
    },
    resume(): void {
      if (status !== "paused") return;
      status = "running";
      lastTick = clock();
    },
    tick(): void {
      advance();
    },
    completeRep(): void {
      if (status === "done" || !isRepBased) return;
      completedReps = Math.min(targetReps, completedReps + 1);
      if (completedReps >= targetReps) {
        status = "done";
        lastTick = null;
        fireDone();
      }
    },
    complete(): void {
      if (status === "done") return;
      status = "done";
      remainingMs = 0;
      lastTick = null;
      fireDone();
    },
    reset(): void {
      status = "idle";
      remainingMs = targetMs;
      completedReps = 0;
      lastTick = null;
      doneFired = false;
    },
  };
}

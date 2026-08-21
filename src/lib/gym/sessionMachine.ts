/**
 * sessionMachine — PURE high-level orchestrator for a sequential exercise
 * playlist (the `/exercises/session` guided-workout lifecycle).
 *
 * This is a *playlist* state machine only. It does NOT own any countdown or
 * rep counting — that belongs to `detailMachine` (one exercise at a time). The
 * session machine answers: "which exercise am I on, what's left, and have I
 * finished the whole playlist?"
 *
 * Lifecycle (forward-only, single-step):
 *   idle → running → (advance) → ... → done
 *
 * It is pure and deterministic: no timers, no `Date.now`, no React. All state
 * advances only through explicit method calls, so Vitest can drive it directly
 * without a fake clock.
 *
 * Order is strictly enforced: `next()` and `completeCurrent()` each move the
 * pointer forward by exactly one position. There is no skip/jump API, so the
 * playlist order can never be violated.
 */

import { type Exercise } from "@/lib/exercises";

/** Lifecycle status of the whole playlist session. */
export type SessionStatus = "idle" | "running" | "done";

/** The exercise currently in focus, plus its playlist position. */
export interface SessionCurrent {
  exercise: Exercise;
  index: number;
}

/** Observable snapshot of the machine. */
export interface SessionState {
  /** Current 0-based position in the playlist. */
  index: number;
  /** Slug of the current exercise, or `undefined` once `done`. */
  currentSlug: string | undefined;
  /** Total number of exercises in the playlist. */
  total: number;
  /** How many exercises have been marked complete so far. */
  completedCount: number;
  status: SessionStatus;
  /** Convenience: `status === "done"`. */
  done: boolean;
}

/** End-of-session roll-up. */
export interface SessionSummary {
  /** Number of exercises marked complete. */
  totalDone: number;
  /** Slugs of completed exercises, in playlist order. */
  completedSlugs: string[];
}

export interface SessionMachineOptions {
  /** Called exactly once when the machine first crosses into `done`. */
  onDone?: () => void;
  /** Called whenever an exercise is marked complete via `completeCurrent`. */
  onComplete?: (slug: string, index: number) => void;
}

/** Imperative handle returned by {@link createSessionMachine}. */
export interface SessionMachine {
  getState(): SessionState;
  /** Current exercise + index, or `null` when `done`/empty. */
  current(): SessionCurrent | null;
  /** idle → running. No-op otherwise. */
  start(): void;
  /** Advance exactly one position; on the last exercise, transitions to done. */
  next(): void;
  /** Mark the current exercise complete, then auto-advance or finish. */
  completeCurrent(): void;
  /** Roll-up of completed exercises. */
  summary(): SessionSummary;
  /** Return to idle with a cleared completion set. */
  reset(): void;
}

/**
 * PURE factory. State advances only through the returned methods, so the
 * machine is fully deterministic and side-effect free (apart from the optional
 * callbacks, which the caller injects).
 */
export function createSessionMachine(
  exercises: Exercise[],
  options: SessionMachineOptions = {},
): SessionMachine {
  const { onDone, onComplete } = options;
  const total = exercises.length;

  let status: SessionStatus = "idle";
  let index = 0;
  const completed = new Set<string>();
  let doneFired = false;

  /** Fire `onDone` exactly once on the done transition. */
  function fireDone(): void {
    if (doneFired) return;
    doneFired = true;
    onDone?.();
  }

  /** Mark the whole session finished. */
  function finish(): void {
    status = "done";
    fireDone();
  }

  function getState(): SessionState {
    return {
      index,
      currentSlug: status === "done" ? undefined : exercises[index]?.slug,
      total,
      completedCount: completed.size,
      status,
      done: status === "done",
    };
  }

  function current(): SessionCurrent | null {
    if (status === "done") return null;
    const ex = exercises[index];
    if (!ex) return null;
    return { exercise: ex, index };
  }

  function start(): void {
    if (status !== "idle") return;
    status = "running";
  }

  /** Forward-only single step. On the last exercise, the session is done. */
  function next(): void {
    if (status !== "running") return;
    if (index < total - 1) {
      index += 1; // exactly one position forward
    } else {
      finish();
    }
  }

  /** Mark current complete, then advance one (or finish on the last). */
  function completeCurrent(): void {
    if (status !== "running") return;
    const ex = exercises[index];
    if (ex) {
      completed.add(ex.slug);
      onComplete?.(ex.slug, index);
    }
    if (index < total - 1) {
      index += 1;
    } else {
      finish();
    }
  }

  function summary(): SessionSummary {
    return {
      totalDone: completed.size,
      completedSlugs: exercises
        .filter((ex) => completed.has(ex.slug))
        .map((ex) => ex.slug),
    };
  }

  function reset(): void {
    status = "idle";
    index = 0;
    completed.clear();
    doneFired = false;
  }

  return {
    getState,
    current,
    start,
    next,
    completeCurrent,
    summary,
    reset,
  };
}

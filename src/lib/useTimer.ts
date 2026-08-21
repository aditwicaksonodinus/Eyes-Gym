import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useTimer — injectable-clock countdown timer for eye exercises.
 *
 * The heavy logic lives in the PURE core factory `createTimer` which takes a
 * `clock` function (injectable time source) so Vitest can drive it with a fake
 * clock and assert deterministic state transitions without real time.
 * The `useTimer` React hook is a thin wrapper that owns the real `setInterval`
 * polling and re-render wiring.
 */

/** Abstract time source returning milliseconds since an arbitrary epoch. */
export type Clock = () => number;

/** Snapshot of the timer's observable state. */
export interface TimerState {
  /** Whole seconds remaining (ceil of remaining milliseconds). */
  remainingSec: number;
  /** Whether the timer is currently counting down. */
  running: boolean;
  /** Whether the full duration has elapsed. */
  done: boolean;
}

/** Imperative handle returned by {@link createTimer}. */
export interface Timer {
  readonly state: TimerState;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
}

/**
 * PURE timer core. No global time, no timers — state advances only when the
 * passed clock is read during a `state` getter call or a transition while
 * running. This makes it fully deterministic under a fake clock.
 */
export function createTimer(durationSec: number, now: Clock): Timer {
  const durationMs = durationSec * 1000;
  let remainingMs = durationMs;
  let running = false;
  let done = false;
  let lastTick: number | null = null;

  /** Fold elapsed clock time into `remainingMs`, clamping to zero / done. */
  function advance(): void {
    if (!running || done) return;
    const t = now();
    if (lastTick !== null) {
      const elapsed = t - lastTick;
      remainingMs = Math.max(0, remainingMs - elapsed);
      if (remainingMs <= 0) {
        remainingMs = 0;
        done = true;
        running = false;
      }
    }
    lastTick = t;
  }

  return {
    get state(): TimerState {
      advance();
      return {
        remainingSec: Math.ceil(remainingMs / 1000),
        running,
        done,
      };
    },
    start(): void {
      if (running || done) return;
      running = true;
      lastTick = now();
    },
    pause(): void {
      if (!running) return;
      advance();
      running = false;
      lastTick = null;
    },
    resume(): void {
      if (running || done) return;
      running = true;
      lastTick = now();
    },
    reset(): void {
      running = false;
      done = false;
      lastTick = null;
      remainingMs = durationMs;
    },
  };
}

export interface UseTimerOptions {
  /** Full countdown length in seconds. */
  durationSec: number;
  /** Called once when the timer first reaches the done state. */
  onDone?: () => void;
  /** Injectable clock (ms). Defaults to `Date.now`. */
  clock?: Clock;
}

export interface UseTimerReturn {
  remainingSec: number;
  running: boolean;
  done: boolean;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
}

/**
 * Thin React hook wrapping {@link createTimer}. A `setInterval` polls the core
 * state so elapsed time surfaces into React; state transitions delegate to the
 * pure core. Keep new logic here to a minimum.
 */
export function useTimer({
  durationSec,
  onDone,
  clock,
}: UseTimerOptions): UseTimerReturn {
  const now = clock ?? (() => Date.now());
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => (t + 1) % 1000000000), []);

  // Timer instance is created once and reused across renders for the lifetime
  // of the hook so running state survives re-renders.
  const timerRef = useRef<Timer | null>(null);
  if (timerRef.current === null) timerRef.current = createTimer(durationSec, now);

  // Keep the latest callback without re-creating the timer instance.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const firedDoneRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(rerender, 100);
    return () => window.clearInterval(id);
  }, [rerender]);

  const { state } = timerRef.current;

  // Fire onDone exactly once when the timer crosses into done.
  useEffect(() => {
    if (state.done && !firedDoneRef.current) {
      firedDoneRef.current = true;
      onDoneRef.current?.();
    } else if (!state.done) {
      firedDoneRef.current = false;
    }
  });

  return {
    remainingSec: state.remainingSec,
    running: state.running,
    done: state.done,
    start: () => {
      timerRef.current!.start();
      rerender();
    },
    pause: () => {
      timerRef.current!.pause();
      rerender();
    },
    resume: () => {
      timerRef.current!.resume();
      rerender();
    },
    reset: () => {
      timerRef.current!.reset();
      rerender();
    },
  };
}

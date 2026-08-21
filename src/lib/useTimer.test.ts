import { describe, expect, it } from "vitest";
import { createTimer, type Timer } from "./useTimer";

/**
 * Fake clock: a mutable time source the pure core consumes. No real timers or
 * Date.now are used, so every assertion is deterministic.
 */
function makeFakeClock() {
  let t = 0;
  return {
    now: () => t,
    tick(ms: number) {
      t += ms;
    },
    set(ms: number) {
      t = ms;
    },
  };
}

describe("createTimer (pure core, fake clock)", () => {
  it("reaches done with remainingSec 0 after the full duration elapses", () => {
    const clock = makeFakeClock();
    const timer = createTimer(5, clock.now);

    expect(timer.state).toEqual({ remainingSec: 5, running: false, done: false });

    timer.start();
    expect(timer.state.running).toBe(true);

    // Within duration: still counting, not done.
    clock.tick(2000);
    expect(timer.state.remainingSec).toBe(3); // ceil(3000/1000)
    expect(timer.state.done).toBe(false);

    // Past the duration: done.
    clock.set(6000);
    const finalState = timer.state;
    expect(finalState.remainingSec).toBe(0);
    expect(finalState.done).toBe(true);
    expect(finalState.running).toBe(false);
  });

  it("pause freezes remainingSec regardless of further clock movement", () => {
    const clock = makeFakeClock();
    const timer = createTimer(10, clock.now);

    timer.start();
    clock.tick(4000);
    // Running: elapsed folded in.
    expect(timer.state.remainingSec).toBe(6);

    timer.pause();
    expect(timer.state.running).toBe(false);
    // Snapshot after pause.
    expect(timer.state.remainingSec).toBe(6);

    // Time passes but timer is paused -> remaining unchanged.
    clock.set(50_000);
    expect(timer.state.remainingSec).toBe(6);
    expect(timer.state.done).toBe(false);
  });

  it("resume preserves elapsed time and continues from the paused remainder", () => {
    const clock = makeFakeClock();
    const timer = createTimer(10, clock.now);

    timer.start();
    clock.tick(4000); // elapsed 4s
    timer.pause();
    expect(timer.state.remainingSec).toBe(6);

    // Paused window doesn't count.
    clock.set(20_000);
    timer.resume();
    expect(timer.state.running).toBe(true);
    expect(timer.state.remainingSec).toBe(6);

    // Resume ticks relative to resume moment (remaining stays 6).
    clock.tick(2000); // 2s more elapsed
    expect(timer.state.remainingSec).toBe(4);
  });

  it("reset returns to the full duration, not running and not done", () => {
    const clock = makeFakeClock();
    const timer = createTimer(5, clock.now);

    timer.start();
    clock.tick(5000);
    expect(timer.state.done).toBe(true);

    timer.reset();
    expect(timer.state).toEqual({ remainingSec: 5, running: false, done: false });

    // Can be started again from scratch.
    timer.start();
    clock.tick(1000);
    expect(timer.state.remainingSec).toBe(4);
  });

  it("exposes a stable Timer API from the factory", () => {
    const clock = makeFakeClock();
    const timer: Timer = createTimer(3, clock.now);
    expect(timer.start).toBeTypeOf("function");
    expect(timer.pause).toBeTypeOf("function");
    expect(timer.resume).toBeTypeOf("function");
    expect(timer.reset).toBeTypeOf("function");
    expect(typeof timer.state).toBe("object");
  });
});

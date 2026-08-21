import { describe, expect, it, vi } from "vitest";
import { createDetailMachine } from "./detailMachine";
import { getExercise } from "@/lib/exercises";

/**
 * Fake clock: a mutable ms time source the pure core consumes. No real timers
 * or Date.now are used, so every assertion is deterministic (mirrors the
 * useTimer.test.ts fake clock).
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

describe("createDetailMachine (pure, one-exercise lifecycle, fake clock)", () => {
  it("duration-based: reaches done with remainingSec 0 after the full duration elapses", () => {
    const clock = makeFakeClock();
    const ex = getExercise("blinking")!; // durationSec = 30 (fixed)
    const m = createDetailMachine(ex, { clock: clock.now });

    expect(m.getState()).toEqual({
      status: "idle",
      remainingSec: 30,
      done: false,
    });

    m.start();
    expect(m.getState().status).toBe("running");

    // Within duration: still counting, not done.
    clock.tick(8000);
    m.tick();
    expect(m.getState().remainingSec).toBe(22);
    expect(m.getState().done).toBe(false);

    // Past the duration: done.
    clock.set(35_000);
    m.tick();
    const s = m.getState();
    expect(s.remainingSec).toBe(0);
    expect(s.done).toBe(true);
    expect(s.status).toBe("done");
  });

  it("rep-based: uses getRepBounds().max for range reps", () => {
    const clock = makeFakeClock();
    const ex = getExercise("eye-rolling")!; // reps = {min:5,max:8}
    const m = createDetailMachine(ex, { clock: clock.now });
    // max = 8 reps -> full remaining is 8.
    expect(m.getState().remainingReps).toBe(8);

    m.start();
    m.completeRep();
    m.completeRep();
    expect(m.getState().remainingReps).toBe(6);
    expect(m.getState().done).toBe(false);

    // Complete the remaining 6 reps (8 total) to reach done.
    m.completeRep();
    m.completeRep();
    m.completeRep();
    m.completeRep();
    m.completeRep();
    m.completeRep();
    const s = m.getState();
    expect(s.remainingReps).toBe(0);
    expect(s.done).toBe(true);
    expect(s.status).toBe("done");
  });

  it("pause freezes remainingSec; resume preserves elapsed across the paused window", () => {
    const clock = makeFakeClock();
    const ex = getExercise("blinking")!; // durationSec = 30
    const m = createDetailMachine(ex, { clock: clock.now });

    m.start();
    clock.tick(4000); // elapsed 4s
    m.tick();
    expect(m.getState().remainingSec).toBe(26);

    m.pause();
    expect(m.getState().status).toBe("paused");
    expect(m.getState().remainingSec).toBe(26);

    // Time passes while paused -> remaining unchanged.
    clock.set(50_000);
    m.tick();
    expect(m.getState().remainingSec).toBe(26);
    expect(m.getState().done).toBe(false);

    // Resume: paused window does not count; remainder preserved.
    m.resume();
    expect(m.getState().status).toBe("running");
    expect(m.getState().remainingSec).toBe(26);

    clock.tick(2000); // 2s more elapsed
    m.tick();
    expect(m.getState().remainingSec).toBe(24);
  });

  it("reset returns to idle with the full duration", () => {
    const clock = makeFakeClock();
    const ex = getExercise("blinking")!; // durationSec = 30
    const m = createDetailMachine(ex, { clock: clock.now });

    m.start();
    clock.tick(30_000);
    m.tick();
    expect(m.getState().done).toBe(true);

    m.reset();
    expect(m.getState()).toEqual({
      status: "idle",
      remainingSec: 30,
      done: false,
    });

    // Can be started again from scratch.
    m.start();
    clock.tick(1000);
    m.tick();
    expect(m.getState().remainingSec).toBe(29);
  });

  it("rep-based: completing N reps reaches done with remainingReps 0", () => {
    const clock = makeFakeClock();
    const ex = getExercise("atas-bawah-kiri-kanan")!; // reps = 10 (fixed)
    const m = createDetailMachine(ex, { clock: clock.now });

    expect(m.getState().remainingReps).toBe(10);
    expect(m.getState().status).toBe("idle");

    m.start();
    m.completeRep();
    expect(m.getState().remainingReps).toBe(9);
    expect(m.getState().done).toBe(false);

    for (let i = 0; i < 9; i++) {
      m.completeRep();
    }
    const s = m.getState();
    expect(s.remainingReps).toBe(0);
    expect(s.done).toBe(true);
    expect(s.status).toBe("done");
  });

  it("rep-based: uses getRepBounds().max for range reps", () => {
    const clock = makeFakeClock();
    const ex = getExercise("eye-rolling")!; // reps = {min:5,max:8}
    const m = createDetailMachine(ex, { clock: clock.now });
    expect(m.getState().remainingReps).toBe(8);

    for (let i = 0; i < 8; i++) m.completeRep();
    expect(m.getState().done).toBe(true);
    expect(m.getState().remainingReps).toBe(0);
  });

  it("complete() forces done (Selesai) and fires onDone exactly once", () => {
    const clock = makeFakeClock();
    const ex = getExercise("zig-zag")!; // durationSec = 30, no reps
    const onDone = vi.fn();
    const m = createDetailMachine(ex, { clock: clock.now, onDone });

    m.start();
    m.complete();
    expect(m.getState().done).toBe(true);
    expect(m.getState().status).toBe("done");
    expect(onDone).toHaveBeenCalledTimes(1);

    // Re-entering done must not re-fire onDone.
    m.complete();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("carries nextSlug for the page-layer Selanjutnya advance", () => {
    const clock = makeFakeClock();
    const ex = getExercise("figure-8")!;
    const m = createDetailMachine(ex, { clock: clock.now, nextSlug: "eye-rolling" });
    expect(m.nextSlug).toBe("eye-rolling");
  });
});

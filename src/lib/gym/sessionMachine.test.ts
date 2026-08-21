import { describe, expect, it, vi } from "vitest";
import { createSessionMachine } from "./sessionMachine";
import { getExercise } from "@/lib/exercises";

/**
 * Build a deterministic 3-exercise playlist from the real registry so the
 * machine is exercised against genuine `Exercise` shapes (slug, category, …).
 */
function makePlaylist() {
  const a = getExercise("20-20-20")!; // durationSec = 20
  const b = getExercise("palming")!; // durationSec = {min:30,max:60}
  const c = getExercise("blinking")!; // reps = 3
  return [a, b, c];
}

describe("createSessionMachine (pure playlist orchestrator, TDD)", () => {
  it("starts idle and transitions to running on start()", () => {
    const m = createSessionMachine(makePlaylist());
    expect(m.getState().status).toBe("idle");
    expect(m.getState().done).toBe(false);

    m.start();
    const s = m.getState();
    expect(s.status).toBe("running");
    expect(s.index).toBe(0);
    expect(s.currentSlug).toBe("20-20-20");
    expect(s.total).toBe(3);
    expect(s.completedCount).toBe(0);
    expect(s.done).toBe(false);
  });

  it("current() returns the focused exercise and its index", () => {
    const m = createSessionMachine(makePlaylist());
    // Before start the pointer already rests on the first exercise.
    const before = m.current();
    expect(before).not.toBeNull();
    expect(before!.index).toBe(0);
    expect(before!.exercise.slug).toBe("20-20-20");

    m.start();
    const cur = m.current();
    expect(cur).not.toBeNull();
    expect(cur!.index).toBe(0);
    expect(cur!.exercise.slug).toBe("20-20-20");
  });

  it("3-exercise playlist: summary reflects all completed after the last completion", () => {
    const m = createSessionMachine(makePlaylist());
    m.start();

    m.completeCurrent(); // 20-20-20 done -> advance to palming
    expect(m.getState().index).toBe(1);
    expect(m.getState().completedCount).toBe(1);
    expect(m.getState().status).toBe("running");

    m.completeCurrent(); // palming done -> advance to blinking
    expect(m.getState().index).toBe(2);
    expect(m.getState().completedCount).toBe(2);

    m.completeCurrent(); // blinking done -> last -> done
    const s = m.getState();
    expect(s.status).toBe("done");
    expect(s.done).toBe(true);
    expect(s.index).toBe(2);
    expect(s.completedCount).toBe(3);

    // current() is null once finished.
    expect(m.current()).toBeNull();

    expect(m.summary()).toEqual({
      totalDone: 3,
      completedSlugs: ["20-20-20", "palming", "blinking"],
    });
  });

  it("order cannot be skipped: next() advances exactly one position at a time", () => {
    const m = createSessionMachine(makePlaylist());
    m.start();

    // From index 0, a single next() lands on index 1 — never beyond.
    m.next();
    expect(m.getState().index).toBe(1);
    expect(m.getState().currentSlug).toBe("palming");
    expect(m.getState().completedCount).toBe(0); // next() does not complete

    m.next();
    expect(m.getState().index).toBe(2);
    expect(m.getState().currentSlug).toBe("blinking");

    // On the last exercise, next() finishes the session (no further advance).
    m.next();
    const s = m.getState();
    expect(s.status).toBe("done");
    expect(s.index).toBe(2); // pointer stays on the last; cannot move past
    expect(s.completedCount).toBe(0); // nothing was completed via next()

    // Once done, next() is a no-op.
    m.next();
    expect(m.getState().status).toBe("done");
  });

  it("reset returns to idle with a cleared completion set and index 0", () => {
    const m = createSessionMachine(makePlaylist());
    m.start();
    m.completeCurrent();
    m.completeCurrent();
    expect(m.getState().completedCount).toBe(2);

    m.reset();
    const s = m.getState();
    expect(s.status).toBe("idle");
    expect(s.index).toBe(0);
    expect(s.currentSlug).toBe("20-20-20");
    expect(s.completedCount).toBe(0);
    expect(s.done).toBe(false);
    expect(m.summary()).toEqual({ totalDone: 0, completedSlugs: [] });

    // Usable again from scratch.
    m.start();
    expect(m.getState().status).toBe("running");
  });

  it("fires onDone exactly once and onComplete per completed exercise", () => {
    const onDone = vi.fn();
    const onComplete = vi.fn();
    const m = createSessionMachine(makePlaylist(), { onDone, onComplete });
    m.start();

    m.completeCurrent();
    m.completeCurrent();
    m.completeCurrent();
    expect(onComplete).toHaveBeenCalledTimes(3);
    expect(onComplete).toHaveBeenNthCalledWith(1, "20-20-20", 0);
    expect(onComplete).toHaveBeenNthCalledWith(2, "palming", 1);
    expect(onComplete).toHaveBeenNthCalledWith(3, "blinking", 2);
    expect(onDone).toHaveBeenCalledTimes(1);

    // Re-entering done must not re-fire onDone.
    m.reset();
    m.start();
    m.completeCurrent();
    m.completeCurrent();
    m.completeCurrent();
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it("does not mutate the input playlist array", () => {
    const playlist = makePlaylist();
    const snapshot = playlist.map((e) => e.slug);
    const m = createSessionMachine(playlist);
    m.start();
    m.completeCurrent();
    m.next();
    m.reset();
    expect(playlist.map((e) => e.slug)).toEqual(snapshot);
  });
});

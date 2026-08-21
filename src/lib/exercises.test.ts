import { describe, expect, it } from "vitest";
import {
  CATEGORY_SLUGS,
  EXERCISES,
  EXERCISE_CATEGORIES,
  REMINDER_DURATION_SEC,
  REMINDER_EVERY_MIN,
  type DurationRange,
  filterByCategory,
  filterByDuration,
  getDurationBounds,
  getExercise,
  getRepBounds,
  type RepRange,
} from "@/lib/exercises";

const durationBounds = (slug: string): DurationRange =>
  getDurationBounds(getExercise(slug)!);
const repBounds = (slug: string): RepRange => getRepBounds(getExercise(slug)!);

describe("exercise registry", () => {
  it("exported categories exactly match relaksasi/fokus/gerakan", () => {
    expect(Object.values(EXERCISE_CATEGORIES).sort()).toEqual([
      "fokus",
      "gerakan",
      "relaksasi",
    ]);
    expect(EXERCISE_CATEGORIES.relaksasi).toBe("relaksasi");
    expect(EXERCISE_CATEGORIES.fokus).toBe("fokus");
    expect(EXERCISE_CATEGORIES.gerakan).toBe("gerakan");
  });

  it("has EXACTLY 10 exercises", () => {
    expect(EXERCISES).toHaveLength(10);
  });

  it("all 10 slugs are unique and URL-safe (^[a-z0-9-]+$)", () => {
    const slugs = EXERCISES.map((ex) => ex.slug);
    expect(new Set(slugs).size).toBe(10);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug).not.toMatch(/\s/);
      expect(slug).not.toMatch(/^[A-Z]/);
      expect(slug).not.toMatch(/[A-Z]/);
      // URL-safe: no dots, no double hyphens, no trailing/leading hyphen
      expect(slug).not.toContain("..");
      expect(slug).not.toContain("--");
      expect(slug.startsWith("-")).toBe(false);
      expect(slug.endsWith("-")).toBe(false);
    }
  });

  it("every exercise has required string + steps fields", () => {
    for (const ex of EXERCISES) {
      expect(typeof ex.slug).toBe("string");
      expect(typeof ex.nameId).toBe("string");
      expect(ex.nameId.length).toBeGreaterThan(0);
      expect(typeof ex.descriptionId).toBe("string");
      expect(ex.descriptionId.length).toBeGreaterThan(0);
      expect(Array.isArray(ex.steps)).toBe(true);
      expect(ex.steps.length).toBeGreaterThan(0);
    }
  });

  describe("spec §2 exact durations/reps", () => {
    it("20-20-20 Rule = 20 detik (time-based duration)", () => {
      const ex = getExercise("20-20-20")!;
      expect(ex.durationSec).toBe(20);
      expect(durationBounds("20-20-20")).toEqual({ min: 20, max: 20 });
    });

    it("Palming = 30–60 detik", () => {
      expect(durationBounds("palming")).toEqual({ min: 30, max: 60 });
    });

    it("Blinking cepat = 3 set", () => {
      expect(repBounds("blinking")).toEqual({ min: 3, max: 3 });
    });

    it("Near-Far Focus = 10 repetisi", () => {
      expect(repBounds("near-far-focus")).toEqual({ min: 10, max: 10 });
    });

    it("Figure-8 = 30 detik × 2 arah", () => {
      expect(durationBounds("figure-8")).toEqual({ min: 30, max: 30 });
      expect(repBounds("figure-8")).toEqual({ min: 2, max: 2 });
    });

    it("Eye Rolling = 5–8× per arah", () => {
      expect(repBounds("eye-rolling")).toEqual({ min: 5, max: 8 });
    });

    it("Gerakan Atas-Bawah & Kiri-Kanan = 3 repetisi per arah", () => {
      expect(repBounds("atas-bawah-kiri-kanan")).toEqual({ min: 3, max: 3 });
    });

    it("Pencil Push-up = 5–10 repetisi", () => {
      expect(repBounds("pencil-push-up")).toEqual({ min: 5, max: 10 });
    });

    it("Zig-Zag = 30 detik", () => {
      expect(getExercise("zig-zag")?.durationSec).toBe(30);
      expect(durationBounds("zig-zag")).toEqual({ min: 30, max: 30 });
    });

    it("Diagonal Gaze = 5–8 repetisi per arah", () => {
      expect(repBounds("diagonal-gaze")).toEqual({ min: 5, max: 8 });
    });
  });

  it("all exercise categories are valid (relaksasi | fokus | gerakan)", () => {
    const valid = new Set(["relaksasi", "fokus", "gerakan"]);
    for (const exj of EXERCISES) {
      expect(valid.has(exj.category)).toBe(true);
    }
  });

  describe("category mapping (exact 10 slug→category expectations)", () => {
    it("relaksasi = palming, blinking, 20-20-20", () => {
      expect(CATEGORY_SLUGS.relaksasi).toEqual(["palming", "blinking", "20-20-20"]);
      expect(filterByCategory("relaksasi").map((e) => e.slug).sort()).toEqual(
        ["palming", "blinking", "20-20-20"].sort(),
      );
    });

    it("fokus = near-far-focus, pencil-push-up", () => {
      expect(CATEGORY_SLUGS.fokus).toEqual(["near-far-focus", "pencil-push-up"]);
      expect(filterByCategory("fokus").map((e) => e.slug).sort()).toEqual([
        "near-far-focus",
        "pencil-push-up",
      ]);
    });

    it("gerakan = figure-8, eye-rolling, atas-bawah-kiri-kanan, zig-zag, diagonal-gaze", () => {
      expect(CATEGORY_SLUGS.gerakan).toEqual([
        "figure-8",
        "eye-rolling",
        "atas-bawah-kiri-kanan",
        "zig-zag",
        "diagonal-gaze",
      ]);
      expect(filterByCategory("gerakan").map((e) => e.slug).sort()).toEqual([
        "figure-8",
        "eye-rolling",
        "atas-bawah-kiri-kanan",
        "zig-zag",
        "diagonal-gaze",
      ].sort());
    });

    it("every registered slug appears in exactly one category bucket", () => {
      const union = [...CATEGORY_SLUGS.relaksasi, ...CATEGORY_SLUGS.fokus, ...CATEGORY_SLUGS.gerakan];
      expect(union.length).toBe(10);
      expect(new Set(union).size).toBe(10); // no duplicates across buckets
      expect(union.sort()).toEqual(EXERCISES.map((e) => e.slug).sort());
    });
  });

  describe("helpers", () => {
    it("getExercise returns the exercise by slug", () => {
      expect(getExercise("palming")?.category).toBe("relaksasi");
      expect(getExercise("palming")?.nameId).toBe("exercise.palming.name");
    });

    it("getExercise returns undefined for unknown slug", () => {
      expect(getExercise("does-not-exist")).toBeUndefined();
    });

    it("filterByDuration matches fixed durations", () => {
      expect(filterByDuration(20).map((e) => e.slug)).toContain("20-20-20");
      expect(filterByDuration(30).map((e) => e.slug)).toContain("zig-zag");
    });

    it("filterByDuration matches overlapping ranges", () => {
      // Palming 30–60 overlaps [30,60]; not [100,200]
      expect(filterByDuration(30, 45).map((e) => e.slug)).toContain("palming");
      expect(filterByDuration(100, 200).map((e) => e.slug)).not.toContain("palming");
    });

    it("filterByDuration returns [] for empty window", () => {
      expect(filterByDuration(5000)).toEqual([]);
    });
  });

  describe("20-20-20 reminder constants", () => {
    it("REMINDER_EVERY_MIN = 20 minutes", () => {
      expect(REMINDER_EVERY_MIN).toBe(20);
    });
    it("REMINDER_DURATION_SEC = 20 seconds", () => {
      expect(REMINDER_DURATION_SEC).toBe(20);
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  buildEyeMotion,
  circleKeyframes,
  EDGE_AMPLITUDE_PCT,
  type EyeMotion,
} from "./eyeMotion";
import type { Exercise, ExerciseCategory } from "@/lib/exercises";

/**
 * Minimal Exercise fixture. buildEyeMotion only reads `{ category, slug }`, so
 * the remaining fields are neutral placeholders that satisfy the type.
 */
function makeExercise(slug: string, category: ExerciseCategory): Exercise {
  return {
    slug,
    nameId: `exercise.${slug}.name`,
    category,
    durationSec: 30,
    steps: [],
    descriptionId: `exercise.${slug}.description`,
    description: `Test description for ${slug}`,
  };
}

/** Parse a percentage string (e.g. "44%", "44.0%", "-31%") into a number. */
function pctToNum(v: string): number {
  return Number.parseFloat(v);
}

/** Max absolute |x|/|y| across an EyeMotion's animate arrays. */
function maxAbs(motion: EyeMotion): { maxX: number; maxY: number } {
  const x = motion.animate.x as string[];
  const y = motion.animate.y as string[];
  const maxX = Math.max(...x.map((v) => Math.abs(pctToNum(v))));
  const maxY = Math.max(...y.map((v) => Math.abs(pctToNum(v))));
  return { maxX, maxY };
}

/* The 5 gerakan slugs handled by buildEyeMotion's switch. */
const GERAKAN_SLUGS = [
  "figure-8",
  "eye-rolling",
  "atas-bawah-kiri-kanan",
  "zig-zag",
  "diagonal-gaze",
] as const;

describe("eyeMotion", () => {
  it("EDGE_AMPLITUDE_PCT === 44 (guards the raised gerakan amplitude)", () => {
    expect(EDGE_AMPLITUDE_PCT).toBe(44);
  });

  it("every gerakan slug reaches EDGE_AMPLITUDE_PCT (±44%) on both axes (fails if reverted to 30)", () => {
    for (const slug of GERAKAN_SLUGS) {
      const motion = buildEyeMotion(makeExercise(slug, "gerakan"), false)!;
      const { maxX, maxY } = maxAbs(motion);
      expect(
        maxX,
        `gerakan slug "${slug}" max |x| must reach ${EDGE_AMPLITUDE_PCT}`,
      ).toBeCloseTo(EDGE_AMPLITUDE_PCT, 0); // toCloseTo(…, 0) = ±0.5 via toFixed(1)
      expect(Math.abs(maxX - EDGE_AMPLITUDE_PCT)).toBeLessThanOrEqual(0.05);
      expect(
        maxY,
        `gerakan slug "${slug}" max |y| must reach ${EDGE_AMPLITUDE_PCT}`,
      ).toBeCloseTo(EDGE_AMPLITUDE_PCT, 0);
      expect(Math.abs(maxY - EDGE_AMPLITUDE_PCT)).toBeLessThanOrEqual(0.05);
    }
  });

  it("pins the exact per-slug gerakan keyframe arrays (current authoritative shape)", () => {
    const cases: Array<{ slug: string; x: string[]; y: string[] }> = [
      {
        slug: "figure-8",
        x: ["0%", "44%", "44%", "0%", "-44%", "-44%", "0%"],
        y: ["0%", "-44%", "44%", "0%", "44%", "-44%", "0%"],
      },
      {
        slug: "atas-bawah-kiri-kanan",
        x: ["0%", "0%", "0%", "-44%", "44%", "0%"],
        y: ["-44%", "44%", "0%", "0%", "0%", "0%"],
      },
      {
        slug: "zig-zag",
        x: ["-44%", "44%", "-44%", "44%", "-44%"],
        y: ["-31%", "-6%", "19%", "44%", "-31%"],
      },
      {
        slug: "diagonal-gaze",
        x: ["-44%", "44%", "44%", "-44%", "-44%", "44%", "44%", "-44%"],
        y: ["-44%", "44%", "-44%", "44%", "44%", "-44%", "-44%", "44%"],
      },
    ];
    for (const { slug, x, y } of cases) {
      const motion = buildEyeMotion(makeExercise(slug, "gerakan"), false)!;
      expect(motion.animate.x).toEqual(x);
      expect(motion.animate.y).toEqual(y);
    }
  });

  it("relaksasi pulses scaleY with easeInOut over 2.2s (slowed for comfort)", () => {
    const motion = buildEyeMotion(
      makeExercise("blinking", "relaksasi"),
      false,
    )!;
    expect(motion.animate).toEqual({
      scaleY: [1, 0.05, 1, 1],
      scaleX: [1, 1, 1, 1],
    });
    expect(motion.transition.duration).toBe(2.2);
    expect(motion.transition.ease).toBe("easeInOut");
  });

  it("fokus grows/shrinks scale with easeInOut over 5s (slowed for focus shift)", () => {
    const motion = buildEyeMotion(
      makeExercise("near-far-focus", "fokus"),
      false,
    )!;
    expect(motion.animate).toEqual({
      scale: [2.0, 0.3, 2.0],
      y: ["40%", "0%", "40%"],
    });
    expect(motion.transition.duration).toBe(5);
    expect(motion.transition.ease).toBe("easeInOut");
  });

  it("returns null when reduced motion is requested", () => {
    expect(buildEyeMotion(makeExercise("figure-8", "gerakan"), true)).toBeNull();
    expect(
      buildEyeMotion(makeExercise("blinking", "relaksasi"), true),
    ).toBeNull();
  });

  it("unknown gerakan-category slug falls back to the default left-right sweep", () => {
    const motion = buildEyeMotion(
      makeExercise("custom-x", "gerakan"),
      false,
    )!;
    expect(motion.animate.x).toEqual(["-44%", "44%", "-44%"]);
    expect(motion.animate.y).toEqual(["0%", "0%", "0%"]);
  });

  it("circleKeyframes(44, 24) emits 25 points with axis-aligned 44.0% peaks", () => {
    const { x, y } = circleKeyframes(EDGE_AMPLITUDE_PCT, 24);
    expect(x).toHaveLength(25);
    expect(y).toHaveLength(25);

    const maxX = Math.max(...x.map((v) => Math.abs(pctToNum(v))));
    const maxY = Math.max(...y.map((v) => Math.abs(pctToNum(v))));
    expect(maxX).toBeCloseTo(44.0, 1);
    expect(Math.abs(maxX - 44.0)).toBeLessThanOrEqual(0.05);
    expect(maxY).toBeCloseTo(44.0, 1);
    expect(Math.abs(maxY - 44.0)).toBeLessThanOrEqual(0.05);

    // Axis-aligned sample points hit the exact "44.0%" string.
    expect(x).toContain("44.0%");
    expect(x).toContain("-44.0%");
  });
});

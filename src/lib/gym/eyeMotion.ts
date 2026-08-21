/**
 * eyeMotion — pure Framer Motion keyframe builders for the exercise
 * illustration ("EyeAnimation") on `/exercises/[slug]`.
 *
 * Extracted from `exercise-detail-client.tsx` so the keyframe data can be
 * unit-tested independently of React (no DOM/render coupling).
 */

import * as React from "react";
import {
  Activity,
  ArrowUpDown,
  Eye,
  Infinity,
  MoveDiagonal,
  RefreshCw,
  Target,
} from "lucide-react";

import type { Exercise } from "@/lib/exercises";

/**
 * Max |x|/|y| percentage offset (of the stage) used by every `gerakan`
 * keyframe set below. Raised from the original ±30% for a more visible,
 * fullscreen-friendly reach.
 */
export const EDGE_AMPLITUDE_PCT = 44;

export type EyeMotion = {
  animate: Record<string, (number | string)[]>;
  transition: { duration: number; repeat: number; ease: "easeInOut" | "linear" };
};

export function circleKeyframes(radiusPct: number, points = 16): {
  x: string[];
  y: string[];
} {
  const x: string[] = [];
  const y: string[] = [];
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    x.push(`${(Math.cos(a) * radiusPct).toFixed(1)}%`);
    y.push(`${(-Math.sin(a) * radiusPct).toFixed(1)}%`);
  }
  return { x, y };
}

/**
 * Builds the Framer Motion keyframes that illustrate each exercise's pattern.
 *
 * Movement is expressed as `x`/`y` percentage offsets of a full-stage flex
 * container, so the focus icon (centered inside it) is translated by that
 * fraction of the stage. Using transforms instead of `left`/`top` keeps the
 * animation GPU-friendly and light. relaksasi/fokus pulse via scale instead of
 * moving. Every keyframe is a plain linear array (no logarithmic/quadratic
 * math) so it stays cheap and responsive.
 *
 * Offsets are relative to the stage centre (0% = centre). A value of "44%"
 * moves the icon to 94% of the stage width/height.
 */
export function buildEyeMotion(ex: Exercise, reduce: boolean): EyeMotion | null {
  if (reduce) return null;
  const { category, slug } = ex;

  if (category === "relaksasi") {
    // Kedip Cepat: one clear blink (close → open) followed by a short rest,
    // then repeats. scaleY about the centred icon reads as an eyelid.
    return {
      animate: { scaleY: [1, 0.05, 1, 1], scaleX: [1, 1, 1, 1] },
      transition: { duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    };
  }
  if (category === "fokus") {
    // Near–far focus: the object grows (near) and shrinks (far).
    return {
      animate: { scale: [0.6, 1.4, 0.6] },
      transition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    };
  }

  // gerakan — the focus icon traces the pattern via x/y offsets (centre = 0%).
  // Linear easing keeps motion cheap and continuous (case 3); no easing means
  // the speed control is immediately visible (case 5). Every gerakan keyframe
  // set below reaches EDGE_AMPLITUDE_PCT (±44%) on both axes.
  const move = { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" as const };
  switch (slug) {
    case "figure-8":
      return {
        animate: {
          x: ["0%", "44%", "44%", "0%", "-44%", "-44%", "0%"],
          y: ["0%", "-44%", "44%", "0%", "44%", "-44%", "0%"],
        },
        transition: move,
      };
    case "eye-rolling":
      // True smooth circle traced by 16+ ring points (case 6).
      return {
        animate: circleKeyframes(EDGE_AMPLITUDE_PCT, 24),
        transition: move,
      };
    case "atas-bawah-kiri-kanan":
      return {
        animate: {
          x: ["0%", "0%", "0%", "-44%", "44%", "0%"],
          y: ["-44%", "44%", "0%", "0%", "0%", "0%"],
        },
        transition: move,
      };
    case "zig-zag":
      // Sweep left–right while descending. Movement only — no fade (case 7).
      return {
        animate: {
          x: ["-44%", "44%", "-44%", "44%", "-44%"],
          y: ["-31%", "-6%", "19%", "44%", "-31%"],
        },
        transition: move,
      };
    case "diagonal-gaze":
      // Diagonal moves covering all four directions (TL↔BR and TR↔BL both ways).
      return {
        animate: {
          x: ["-44%", "44%", "44%", "-44%", "-44%", "44%", "44%", "-44%"],
          y: ["-44%", "44%", "-44%", "44%", "44%", "-44%", "-44%", "44%"],
        },
        transition: move,
      };
    default:
      return {
        animate: { x: ["-44%", "44%", "-44%"], y: ["0%", "0%", "0%"] },
        transition: move,
      };
  }
}

export function FocusIcon({ slug, className }: { slug: string; className?: string }) {
  switch (slug) {
    case "blinking":
      return React.createElement(Eye, { className, "aria-hidden": true });
    case "near-far-focus":
      return React.createElement(Target, { className, "aria-hidden": true });
    case "figure-8":
      return React.createElement(Infinity, { className, "aria-hidden": true });
    case "eye-rolling":
      return React.createElement(RefreshCw, { className, "aria-hidden": true });
    case "atas-bawah-kiri-kanan":
      return React.createElement(ArrowUpDown, { className, "aria-hidden": true });
    case "zig-zag":
      return React.createElement(Activity, { className, "aria-hidden": true });
    case "diagonal-gaze":
      return React.createElement(MoveDiagonal, { className, "aria-hidden": true });
    default:
      return React.createElement(Eye, { className, "aria-hidden": true });
  }
}

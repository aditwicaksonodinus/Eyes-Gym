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
 * animation GPU-friendly and light.
 *
 * ## Duration tuning (eye-comfort first)
 * All `gerakan` animations now use `easeInOut` instead of `linear` so the
 * icon accelerates gently, pauses at each extreme, then decelerates — this
 * mirrors how real eye-movement exercises feel and is far less fatiguing than
 * a constant-velocity sweep. Durations are per-exercise:
 *
 * | exercise               | duration |
 * |------------------------|----------|
 * | blinking (relaksasi)   |  2.2 s   |
 * | near-far-focus (fokus) |  5.0 s   |
 * | figure-8               |  7.0 s   |
 * | eye-rolling            |  8.0 s   |
 * | atas-bawah-kiri-kanan  |  7.0 s   |
 * | zig-zag                |  6.0 s   |
 * | diagonal-gaze          |  6.0 s   |
 */
export function buildEyeMotion(ex: Exercise, reduce: boolean): EyeMotion | null {
  if (reduce) return null;
  const { category, slug } = ex;

  if (category === "relaksasi") {
    // Kedip Cepat: one clear blink (close → open) followed by a short rest,
    // then repeats. scaleY about the centred icon reads as an eyelid.
    // Slightly slower than before (1.4 → 2.2 s) so it feels less frantic.
    return {
      animate: { scaleY: [1, 0.05, 1, 1], scaleX: [1, 1, 1, 1] },
      transition: { duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    };
  }

  if (category === "fokus") {
    // Near–far focus: the object starts very large and low (representing close to user's face),
    // then moves to the center and shrinks to small (representing far distance).
    return {
      animate: {
        scale: [2.0, 0.3, 2.0],
        y: ["40%", "0%", "40%"],
      },
      transition: { duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
    };
  }

  // gerakan — the focus icon traces the pattern via x/y offsets (centre = 0%).
  // All gerakan now use easeInOut (was linear) for smoother, less-fatiguing motion.
  // Each exercise has a tuned duration for natural pacing.
  const ease = "easeInOut" as const;

  switch (slug) {
    case "figure-8":
      // Duration 7 s — slow enough to follow, fast enough to feel dynamic.
      // Speed control (slow/normal/fast) multiplies this base.
      return {
        animate: {
          x: ["0%", "44%", "44%", "0%", "-44%", "-44%", "0%"],
          y: ["0%", "-44%", "44%", "0%", "44%", "-44%", "0%"],
        },
        transition: { duration: 7, repeat: Number.POSITIVE_INFINITY, ease },
      };

    case "eye-rolling":
      // True smooth circle: 8 s for a full rotation — comfortable circular motion.
      return {
        animate: circleKeyframes(EDGE_AMPLITUDE_PCT, 24),
        transition: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
      };

    case "atas-bawah-kiri-kanan":
      // 8 s — traces a clean "+" pattern with center resets between all directions to prevent diagonal sweeps.
      return {
        animate: {
          x: ["0%", "0%", "0%", "0%", "0%", "-44%", "0%", "44%", "0%"],
          y: ["0%", "-44%", "0%", "44%", "0%", "0%", "0%", "0%", "0%"],
        },
        transition: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease },
      };

    case "zig-zag":
      // 6 s — descending sweep; easeInOut makes each zig/zag feel deliberate.
      return {
        animate: {
          x: ["-44%", "44%", "-44%", "44%", "-44%"],
          y: ["-31%", "-6%", "19%", "44%", "-31%"],
        },
        transition: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease },
      };

    case "diagonal-gaze":
      // 6 s — covers TL↔BR and TR↔BL diagonals; easeInOut softens the corners.
      return {
        animate: {
          x: ["-44%", "44%", "44%", "-44%", "-44%", "44%", "44%", "-44%"],
          y: ["-44%", "44%", "-44%", "44%", "44%", "-44%", "-44%", "44%"],
        },
        transition: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease },
      };

    default:
      return {
        animate: { x: ["-44%", "44%", "-44%"], y: ["0%", "0%", "0%"] },
        transition: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease },
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

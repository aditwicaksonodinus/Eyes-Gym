"use client";

import { motion } from "framer-motion";

import type { Exercise } from "@/lib/exercises";
import { buildEyeMotion, FocusIcon } from "@/lib/gym/eyeMotion";

/** Indonesian display names (registry only stores i18n keys — no dictionary yet). */
const NAME_BY_SLUG: Record<string, string> = {
  blinking: "Kedip Cepat",
  "near-far-focus": "Fokus Dekat–Jauh",
  "figure-8": "Angka 8",
  "eye-rolling": "Menggulung Mata",
  "atas-bawah-kiri-kanan": "Atas–Bawah & Kiri–Kanan",
  "zig-zag": "Zig-Zag",
  "diagonal-gaze": "Tatapan Diagonal",
};

export type Speed = "normal" | "fast" | "slow";

type EyeStageProps = {
  exercise: Exercise;
  /** When true, render a stationary centred icon instead of animating it. */
  reduceMotion: boolean;
  /** Speed multiplier — fast runs at 0.5×, slow at 1.6× the normal duration. */
  speed?: Speed;
  /**
   * When true, render a full-bleed stage that fills the nearest positioned
   * ancestor (used inside the `fixed inset-0` wrapper in the fullscreen layout).
   * When false (legacy/test use), render the historical inline aspect-video box.
   */
  fullscreen: boolean;
  /**
   * Called when the exit control is clicked (fullscreen mode only).
   * Can be a no-op when the parent handles navigation itself.
   */
  onExit: () => void;
  /** Optional display name for the aria-label; falls back to NAME_BY_SLUG or the slug. */
  name?: string;
  /**
   * Bumping this key re-mounts the animation (used to restart after a rep
   * completes without re-mounting the whole stage).
   */
  repVersion?: number;
};

export function EyeStage({
  exercise,
  reduceMotion,
  speed = "normal",
  fullscreen,
  onExit,
  name,
  repVersion = 0,
}: EyeStageProps) {
  const motionProps = buildEyeMotion(exercise, reduceMotion);
  const durMult = speed === "fast" ? 0.5 : speed === "slow" ? 1.6 : 1;
  const transition = motionProps
    ? { ...motionProps.transition, duration: motionProps.transition.duration * durMult }
    : undefined;

  const ariaName = name ?? NAME_BY_SLUG[exercise.slug] ?? exercise.slug;
  const focusClass =
    "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-primary/20";

  const focusIcon = (
    <span className={focusClass}>
      <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
    </span>
  );

  // Centred moving container shared by both modes. When reduceMotion is on, or
  // no keyframes exist, render a static (non-motion) centring div.
  const movingField = motionProps ? (
    <motion.div
      key={`${speed}-${repVersion}`}
      className="absolute inset-0 flex items-center justify-center"
      animate={motionProps.animate}
      transition={transition}
    >
      {focusIcon}
    </motion.div>
  ) : (
    <div className="absolute inset-0 flex items-center justify-center">{focusIcon}</div>
  );

  if (fullscreen) {
    // Full-bleed: fills the nearest `fixed inset-0` positioned parent.
    // The exit button is intentionally removed here — the layout layer (TopHeader)
    // provides navigation. `onExit` is kept in the API for backward compatibility.
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative h-full w-full bg-transparent">
          {movingField}
        </div>
      </div>
    );
  }

  // Inline mode: historical aspect-video box (used in legacy/test contexts).
  return (
    <div
      className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background"
      role="img"
      aria-label={`Ilustrasi gerakan mata untuk ${ariaName}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative aspect-square h-full bg-secondary">{movingField}</div>
      </div>
    </div>
  );
}

export default EyeStage;

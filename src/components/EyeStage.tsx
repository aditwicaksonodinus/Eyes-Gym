"use client";

import { motion } from "framer-motion";

import TargetWrapper from "@/components/TargetWrapper";
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
  /** When true, render the full-bleed fullscreen overlay with an exit control. */
  fullscreen: boolean;
  /** Called when the fullscreen exit control is clicked. */
  onExit: () => void;
  /** Optional display name for the aria-label; falls back to NAME_BY_SLUG or the slug. */
  name?: string;
};

export function EyeStage({
  exercise,
  reduceMotion,
  speed = "normal",
  fullscreen,
  onExit,
  name,
}: EyeStageProps) {
  const motionProps = buildEyeMotion(exercise, reduceMotion);
  const durMult = speed === "fast" ? 0.5 : speed === "slow" ? 1.6 : 1;
  const transition = motionProps
    ? { ...motionProps.transition, duration: motionProps.transition.duration * durMult }
    : undefined;

  const ariaName = name ?? NAME_BY_SLUG[exercise.slug] ?? exercise.slug;
  const focusClass =
    "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/40";

  const focusIcon = (
    <span className={focusClass}>
      <FocusIcon slug={exercise.slug} className="h-8 w-8" />
    </span>
  );

  // Centred moving container shared by both modes. When reduceMotion is on, or
  // no keyframes exist, render a static (non-motion) centring div.
  const movingField = motionProps ? (
    <motion.div
      key={speed}
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
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-background">
        {/* Full-bleed field fills the viewport so EDGE_AMPLITUDE_PCT (44) makes the
            focus icon travel near the real screen edges. */}
        <div className="relative h-full w-full bg-secondary">{movingField}</div>
        {/* Top-right exit control; safe-area padding keeps it clear of notches. */}
        <div className="absolute inset-x-0 top-0 flex justify-end p-4 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            aria-label="Keluar dari layar penuh"
            onClick={onExit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-2xl leading-none text-foreground shadow-lg ring-1 ring-border transition-colors hover:bg-secondary"
          >
            ⨯
          </button>
        </div>
      </div>
    );
  }

  // Inline mode: exact replica of the historical detail-box stage.
  return (
    <div
      className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background"
      role="img"
      aria-label={`Ilustrasi gerakan mata untuk ${ariaName}`}
    >
      <TargetWrapper>
        <div className="relative aspect-square h-full bg-secondary">{movingField}</div>
      </TargetWrapper>
    </div>
  );
}

export default EyeStage;

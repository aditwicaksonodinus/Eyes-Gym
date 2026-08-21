"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

import EyeStage from "@/components/EyeStage";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  EXERCISES,
  getDurationBounds,
  getRepBounds,
  getExercise,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";
import { createDetailMachine, type DetailMachine } from "@/lib/gym/detailMachine";
import { useTimer } from "@/lib/useTimer";
import { useAppStore } from "@/store/appStore";

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

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  relaksasi: "Relaksasi",
  fokus: "Fokus",
  gerakan: "Gerakan",
};

function formatDuration(ex: Exercise): string {
  const { min, max } = getDurationBounds(ex);
  if (min === max) return `${min} detik`;
  return `${min}–${max} detik`;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Short Indonesian caption describing the animated movement pattern. */
function motionHint(ex: Exercise): string {
  switch (ex.slug) {
    case "blinking":
      return "Kedip cepat lalu istirahat sejenak.";
    case "near-far-focus":
      return "Fokus berpindah dekat lalu jauh secara bergantian.";
    case "figure-8":
      return "Mata menelusuri pola angka delapan.";
    case "eye-rolling":
      return "Mata menggulung membentuk lingkaran penuh.";
    case "atas-bawah-kiri-kanan":
      return "Mata bergerak ke atas–bawah lalu kiri–kanan.";
    case "zig-zag":
      return "Mata mengikuti pola zig-zag.";
    case "diagonal-gaze":
      return "Mata bergerak menyilang secara diagonal.";
    default:
      return "Ikuti gerakan mata sesuai panduan.";
  }
}

// ─── Instructions Drawer ──────────────────────────────────────────────────────

function InstructionsDrawer({
  open,
  onClose,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  steps: string[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl border-t border-border bg-background/95 px-6 pb-[env(safe-area-inset-bottom)] pt-6 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal
            aria-label="Cara melakukannya"
          >
            {/* Handle bar */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Cara melakukannya
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup panduan"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ol className="list-decimal space-y-3 pb-8 pl-5 text-foreground">
              {steps.map((step, i) => (
                <li key={i} className="pl-1 leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Bottom Control Panel ─────────────────────────────────────────────────────

type PanelProps = {
  exercise: Exercise;
  name: string;
  isRepBased: boolean;
  durationMax: number;
  repTarget: number;
  /** Reps already completed (used for progress bar). */
  completedReps: number;
  /** Reps remaining — displayed as countdown to 0. */
  remainingReps: number;
  timer: ReturnType<typeof useTimer>;
  done: boolean;
  speed: "normal" | "fast" | "slow";
  onSetSpeed: (s: "normal" | "fast" | "slow") => void;
  onCompleteRep: () => void;
  onStart: () => void;
  onReset: () => void;
  onComplete: () => void;
  onOpenInstructions: () => void;
  selanjutnyaHref: string;
};

function BottomPanel({
  exercise,
  name,
  isRepBased,
  durationMax,
  repTarget,
  completedReps,
  remainingReps,
  timer,
  done,
  speed,
  onSetSpeed,
  onStart,
  onReset,
  onComplete,
  onOpenInstructions,
  selanjutnyaHref,
}: Omit<PanelProps, "onCompleteRep">) {
  const [collapsed, setCollapsed] = React.useState(false);

  const totalDuration = isRepBased ? durationMax * repTarget : durationMax;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
      className="fixed inset-x-0 bottom-0 z-50 p-4 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      {done ? (
        /* ── Done state ── */
        <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-background/80 p-6 text-center shadow-2xl backdrop-blur-xl dark:bg-background/70">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground">
                Latihan selesai!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mata Anda baru saja mendapat jeda yang menyegarkan.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href={selanjutnyaHref}>
                  Selanjutnya
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Ulangi
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Active state: Split layouts ── */
        <>
          {/* Left panel: Info and Progress */}
          <div className="pointer-events-auto w-full md:w-80 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABEL[exercise.category]}
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground">
                {name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {motionHint(exercise)}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {isRepBased ? (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Progres Latihan</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-bold tabular-nums text-foreground"
                        data-testid="fullscreen-reps"
                      >
                        {remainingReps}
                      </span>
                      <span className="text-xs text-muted-foreground">sisa rep</span>
                    </div>
                  </div>
                  <Progress
                    value={Math.round((completedReps / repTarget) * 100)}
                    aria-label="Progres repetisi"
                  />
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Progres Waktu</span>
                    <span
                      className="text-2xl font-bold tabular-nums text-foreground"
                      data-testid="fullscreen-countdown"
                    >
                      {formatTime(timer.remainingSec)}
                    </span>
                  </div>
                  <Progress
                    value={
                      durationMax > 0
                        ? Math.round(
                            ((durationMax - timer.remainingSec) / durationMax) * 100,
                          )
                        : 0
                    }
                    aria-label="Progres waktu"
                  />
                </>
              )}
            </div>
          </div>

          {/* Right panel: Controls */}
          <div className="pointer-events-auto w-full md:w-auto rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70 flex flex-col sm:flex-row gap-3 items-center">
            {/* Speed selector (figure-8 only) */}
            {exercise.slug === "figure-8" && (
              <div className="flex items-center gap-2 border-r border-border/40 pr-3 mr-1">
                <span className="text-xs text-muted-foreground">Kecepatan:</span>
                {(["slow", "normal", "fast"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSetSpeed(s)}
                    aria-pressed={speed === s}
                    className={
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
                      (speed === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background/60 text-muted-foreground hover:text-foreground")
                    }
                  >
                    {s === "slow" ? "Lambat" : s === "fast" ? "Cepat" : "Normal"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {timer.running ? (
                <Button onClick={timer.pause} size="sm" className="gap-2">
                  <Pause className="h-4 w-4" aria-hidden />
                  Jeda
                </Button>
              ) : timer.remainingSec < totalDuration ? (
                <Button onClick={timer.resume} size="sm" className="gap-2">
                  <Play className="h-4 w-4" aria-hidden />
                  Lanjutkan
                </Button>
              ) : (
                <Button onClick={onStart} size="sm" className="gap-2">
                  <Play className="h-4 w-4" aria-hidden />
                  Mulai
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Ulangi
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={onComplete}
                data-testid="selesai-button"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Selesai
              </Button>

              <button
                type="button"
                onClick={onOpenInstructions}
                aria-label="Cara melakukan latihan ini"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground h-9"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Cara?
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Top Header Overlay ───────────────────────────────────────────────────────

function TopHeader({
  name,
  category,
}: {
  name: string;
  category: ExerciseCategory;
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-x-0 top-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-background/70">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-1 gap-1.5 text-muted-foreground">
            <Link href="/exercises" aria-label="Kembali ke daftar latihan">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>

          <div className="h-4 w-px bg-border" aria-hidden />

          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {name}
            </h1>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {CATEGORY_LABEL[category]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Keluar layar penuh" : "Masuk layar penuh"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden />
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function ExerciseDetailClient({ slug }: { slug: string }) {
  const reduceMotion = useReducedMotion() ?? false;

  const exercise = getExercise(slug);
  if (!exercise) notFound();

  const index = EXERCISES.findIndex((e) => e.slug === exercise.slug);
  const nextSlug =
    index >= 0 && index < EXERCISES.length - 1
      ? EXERCISES[index + 1].slug
      : undefined;

  const isRepBased = exercise.reps !== undefined;
  const durationMax = getDurationBounds(exercise).max;
  const repTarget = getRepBounds(exercise).max;
  const totalDurationSec = isRepBased ? durationMax * repTarget : durationMax;

  const machineRef = React.useRef<DetailMachine | null>(null);
  const [done, setDone] = React.useState(false);
  const [speed, setSpeed] = React.useState<"normal" | "fast" | "slow">("normal");
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);

  if (machineRef.current === null) {
    machineRef.current = createDetailMachine(exercise, {
      clock: () => Date.now(),
      nextSlug,
      onDone: () => {
        setDone(true);
        useAppStore.getState().recordValueMoment();
      },
    });
  }

  const timer = useTimer({
    durationSec: totalDurationSec,
    onDone: () => machineRef.current?.complete(),
  });

  // Sync timer running status with machine
  React.useEffect(() => {
    if (timer.running) {
      machineRef.current?.start();
    } else {
      machineRef.current?.pause();
    }
  }, [timer.running]);

  // Tick the machine on every timer tick to keep the states in sync
  React.useEffect(() => {
    machineRef.current?.tick();
  }, [timer.remainingSec]);

  const mState = machineRef.current.getState();
  const remainingReps = mState.remainingReps ?? repTarget;
  const completedReps = repTarget - remainingReps;
  const repVersion = completedReps;

  const handleStart = () => {
    timer.start();
    machineRef.current?.start();
  };

  const handleReset = () => {
    timer.reset();
    machineRef.current?.reset();
    setDone(false);
  };

  const selanjutnyaHref = nextSlug
    ? `/exercises/${nextSlug}`
    : "/exercises/session";

  const name = NAME_BY_SLUG[exercise.slug] ?? exercise.slug;

  return (
    <>
      {/* Soft teal/green viewport background as per spec §6, now full-bleed */}
      <div className="fixed inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

      {/* ── Animation stage parent (constrained to keep target within visible zone) ── */}
      <div
        className="fixed inset-x-0 top-24 bottom-48 z-0 overflow-hidden"
        role="img"
        aria-label={`Ilustrasi gerakan mata untuk ${name}`}
      >
        {/* Animation stage */}
        <EyeStage
          exercise={exercise}
          reduceMotion={reduceMotion || !timer.running}
          speed={speed}
          repVersion={repVersion}
          fullscreen
          onExit={() => {}}
          name={name}
        />
      </div>

      {/* ── Top header overlay ── */}
      <TopHeader name={name} category={exercise.category} />

      {/* ── Bottom glass panel ── */}
      <BottomPanel
        exercise={exercise}
        name={name}
        isRepBased={isRepBased}
        durationMax={durationMax}
        repTarget={repTarget}
        completedReps={completedReps}
        remainingReps={remainingReps}
        timer={timer}
        done={done}
        speed={speed}
        onSetSpeed={setSpeed}
        onStart={handleStart}
        onReset={handleReset}
        onComplete={() => machineRef.current?.complete()}
        onOpenInstructions={() => setInstructionsOpen(true)}
        selanjutnyaHref={selanjutnyaHref}
      />

      {/* ── Instructions drawer ── */}
      <InstructionsDrawer
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        steps={exercise.steps}
      />
    </>
  );
}

export default ExerciseDetailClient;

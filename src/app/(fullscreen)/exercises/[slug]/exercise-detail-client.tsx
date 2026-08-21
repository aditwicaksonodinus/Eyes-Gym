"use client";

import * as React from "react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

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
            className="fixed inset-0 z-backdrop bg-black/40 backdrop-blur-sm"
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
            className="fixed inset-x-0 bottom-0 z-sidebar rounded-t-3xl border-t border-border bg-background/95 px-6 pb-[env(safe-area-inset-bottom)] pt-6 shadow-2xl backdrop-blur-xl"
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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const totalDuration = isRepBased ? durationMax * repTarget : durationMax;

  return done ? (
    /* ── Done state ── */
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-2 pointer-events-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 shrink-0">
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground text-sm md:text-base">
            Latihan selesai!
          </p>
          <p className="text-xs text-muted-foreground">
            Mata Anda baru saja mendapat jeda yang menyegarkan.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <Button asChild size="sm" className="gap-1.5 h-9 text-xs">
          <Link href={selanjutnyaHref}>
            Selanjutnya
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-9 text-xs"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Ulangi
        </Button>
      </div>
    </div>
  ) : (
    /* ── Active state ── */
    <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pointer-events-auto">
      {/* Section 1: Info */}
      <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm md:text-base">{name}</span>
          <Badge variant="secondary" className="text-[10px] md:text-xs">
            {CATEGORY_LABEL[exercise.category]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground hidden md:block">
          {motionHint(exercise)}
        </p>
      </div>

      {/* Section 2: Progress (Reps/Timer and Progress Bar) */}
      <div className="flex-1 max-w-lg flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progres {isRepBased ? "Latihan" : "Waktu"}</span>
          <span className="font-bold text-foreground tabular-nums">
            {isRepBased ? `${remainingReps} sisa rep` : formatTime(timer.remainingSec)}
          </span>
        </div>
        <Progress
          value={
            isRepBased
              ? Math.round((completedReps / repTarget) * 100)
              : durationMax > 0
              ? Math.round(((durationMax - timer.remainingSec) / durationMax) * 100)
              : 0
          }
          className="h-1.5"
          aria-label="Progres latihan"
        />
      </div>

      {/* Section 3: Controls */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/20">
        {/* Speed Selector (only figure-8) */}
        {exercise.slug === "figure-8" && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline">Kecepatan:</span>
            {(["slow", "normal", "fast"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSetSpeed(s)}
                className={
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors " +
                  (speed === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/60 text-muted-foreground")
                }
              >
                {s === "slow" ? "Lambat" : s === "fast" ? "Cepat" : "Normal"}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {timer.running ? (
            <Button onClick={timer.pause} size="sm" className="gap-1 h-8 text-xs px-2.5">
              <Pause className="h-3.5 w-3.5" aria-hidden />
              Jeda
            </Button>
          ) : timer.remainingSec < totalDuration ? (
            <Button onClick={timer.resume} size="sm" className="gap-1 h-8 text-xs px-2.5">
              <Play className="h-3.5 w-3.5" aria-hidden />
              Mulai
            </Button>
          ) : (
            <Button onClick={onStart} size="sm" className="gap-1 h-8 text-xs px-2.5">
              <Play className="h-3.5 w-3.5" aria-hidden />
              Mulai
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8 text-xs px-2"
            onClick={onReset}
            aria-label="Ulangi latihan"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="gap-1 h-8 text-xs px-2.5"
            onClick={onComplete}
            data-testid="selesai-button"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Selesai
          </Button>

          <button
            type="button"
            onClick={onOpenInstructions}
            aria-label="Cara melakukan latihan ini"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium border border-border rounded-full px-2.5 py-1 bg-background/60 h-8 shrink-0 animate-none"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Cara?
          </button>
        </div>
      </div>
    </div>
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
    <header className="w-full border-b border-border bg-background px-4 py-3 flex items-center justify-between z-navbar shrink-0">
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
          <Badge variant="secondary" className="shrink-0 text-[10px] md:text-xs">
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
    </header>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function ExerciseDetailClient({ slug }: { slug: string }) {
  const reduceMotion = useReducedMotion() ?? false;

  const exercise = getExercise(slug)!;

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
  const [focusMode, setFocusMode] = React.useState(false);

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
    <div className="h-full w-full flex flex-col overflow-hidden bg-background relative">
      {/* Soft teal/green viewport background as per spec §6 */}
      <div className="absolute inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

      {/* ── Top Header Navbar ── */}
      {!focusMode && <TopHeader name={name} category={exercise.category} />}

      {/* ── Center stage area (takes remaining vertical space) ── */}
      <main className="flex-1 relative overflow-hidden z-10 flex items-center justify-center">
        <EyeStage
          exercise={exercise}
          reduceMotion={reduceMotion || !timer.running}
          speed={speed}
          repVersion={repVersion}
          fullscreen
          onExit={() => {}}
          name={name}
        />

        {/* ── Focus Mode Toggle Button ── */}
        <button
          type="button"
          onClick={() => setFocusMode(!focusMode)}
          aria-label={focusMode ? "Tampilkan semua kontrol" : "Fokus penuh (sembunyikan kontrol)"}
          className={cn(
            "pointer-events-auto absolute z-toggle flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground shadow-lg backdrop-blur transition-all duration-300 hover:bg-background bottom-4 right-4",
            focusMode ? "opacity-50 hover:opacity-100" : "opacity-80 hover:opacity-100"
          )}
        >
          {focusMode ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </main>

      {/* ── Bottom Navbar (Footer) ── */}
      {!focusMode && (
        <footer className="w-full border-t border-border bg-background p-4 z-footer shrink-0">
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
        </footer>
      )}

      {/* ── Instructions drawer ── */}
      <InstructionsDrawer
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        steps={exercise.steps}
      />
    </div>
  );
}

export default ExerciseDetailClient;

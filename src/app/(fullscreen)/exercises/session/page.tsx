"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  ListChecks,
  Eye,
  Maximize2,
  Minimize2,
} from "lucide-react";

import { createSessionMachine } from "@/lib/gym/sessionMachine";
import {
  EXERCISES,
  getDurationBounds,
  getRepBounds,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";
import { useTimer } from "@/lib/useTimer";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import EyeStage from "@/components/EyeStage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Indonesian display names (registry only carries i18n keys). */
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

function displayName(ex: Exercise): string {
  return NAME_BY_SLUG[ex.slug] ?? ex.slug;
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

/**
 * The running exercise view. Keyed by slug from the parent so the timer
 * re-initialises with the correct per-exercise duration on every advance.
 */
function RunningExercise({
  exercise,
  index,
  total,
  onDone,
  onBack,
}: {
  exercise: Exercise;
  index: number;
  total: number;
  onDone: () => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const isRepBased = exercise.reps !== undefined;
  const durationMax = getDurationBounds(exercise).max;
  const repTarget = getRepBounds(exercise).max;
  const totalDurationSec = isRepBased ? durationMax * repTarget : durationMax;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
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


  const timer = useTimer({
    durationSec: totalDurationSec,
    onDone: onDone,
  });

  const completedReps = isRepBased
    ? Math.min(repTarget, Math.floor((totalDurationSec - timer.remainingSec) / durationMax))
    : 0;
  const remainingReps = isRepBased ? repTarget - completedReps : 0;

  const progressValue = isRepBased
    ? Math.round((completedReps / repTarget) * 100)
    : durationMax > 0
      ? Math.round(((durationMax - timer.remainingSec) / durationMax) * 100)
      : 0;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-background relative">
      {/* Soft teal/green background */}
      <div className="absolute inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

      {/* ── Top Header Navbar ── */}
      {!focusMode && (
        <header className="w-full border-b border-border bg-background px-4 py-3 flex items-center justify-between z-navbar shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-1 gap-1.5 text-muted-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
            <div className="h-4 w-px bg-border" aria-hidden />
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                {displayName(exercise)}
              </h1>
              <Badge variant="secondary" className="shrink-0 text-[10px] md:text-xs">
                Latihan {index + 1} dari {total}
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
      )}

      {/* ── Center stage area (takes remaining space) ── */}
      <main className="flex-1 relative overflow-hidden z-10 flex items-center justify-center">
        <EyeStage
          exercise={exercise}
          reduceMotion={reduce || !timer.running}
          speed="normal"
          repVersion={completedReps}
          fullscreen
          onExit={() => {}}
          name={displayName(exercise)}
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
          <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 pointer-events-auto">
            {/* Section 1: Info */}
            <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm md:text-base">
                  {displayName(exercise)}
                </span>
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
              <Progress value={progressValue} className="h-1.5" aria-label="Progres latihan" />
            </div>

            {/* Section 3: Controls */}
            <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/20">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold md:hidden">
                Latihan {index + 1} dari {total}
              </span>

              <div className="flex items-center gap-1.5 ml-auto">
                {timer.running ? (
                  <Button onClick={timer.pause} size="sm" className="gap-1 h-8 text-xs px-2.5">
                    <Pause className="h-3.5 w-3.5" aria-hidden />
                    Jeda
                  </Button>
                ) : (
                  <Button onClick={timer.resume} size="sm" className="gap-1 h-8 text-xs px-2.5">
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    Mulai
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-xs px-2"
                  onClick={timer.reset}
                  aria-label="Ulangi latihan"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1 h-8 text-xs px-2.5"
                  onClick={onDone}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function SessionPage() {
  const [finished, setFinished] = useState(false);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  // Create the machine exactly once; callbacks stay stable across renders.
  const machineRef = useRef<ReturnType<typeof createSessionMachine> | null>(
    null,
  );
  if (machineRef.current === null) {
    machineRef.current = createSessionMachine([...EXERCISES], {
      onDone: () => setFinished(true),
      onComplete: () => {
        // Record a "value moment" on every completed exercise.
        useAppStore.getState().recordValueMoment();
      },
    });
  }
  const machine = machineRef.current;

  const state = machine.getState();
  const current = machine.current();

  const handleStart = () => {
    machine.start();
    rerender();
  };

  const handleComplete = () => {
    machine.completeCurrent();
    rerender();
  };

  const handleReset = () => {
    machine.reset();
    setFinished(false);
    rerender();
  };

  // ---- Done / summary view ----
  if (finished || state.status === "done") {
    const summary = machine.summary();
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <CheckCircle2
            className="h-16 w-16 text-calm-500"
            aria-hidden
          />
          <h1 className="text-2xl font-semibold text-foreground">
            Sesi Selesai!
          </h1>
          <p className="max-w-md text-muted-foreground">
            Kamu telah menyelesaikan{" "}
            <span className="font-semibold text-foreground">
              {summary.totalDone}
            </span>{" "}
            latihan mata. Mata kamu pasti terasa lebih segar dan rileks.
          </p>
        </motion.div>

        {summary.completedSlugs.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="h-5 w-5 text-calm-500" aria-hidden />
                Latihan yang diselesaikan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {summary.completedSlugs.map((slug) => (
                  <li
                    key={slug}
                    className="rounded-full bg-calm-100 px-3 py-1 text-sm text-calm-800 dark:bg-calm-900/40 dark:text-calm-200"
                  >
                    {NAME_BY_SLUG[slug] ?? slug}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden />
            Ulangi
          </Button>
          <Button asChild variant="outline">
            <Link href="/exercises">Lihat semua latihan</Link>
          </Button>
        </div>
      </main>
    );
  }

  // ---- Running view ----
  if (state.status === "running" && current) {
    const ex = current.exercise;

    return (
      <RunningExercise
        key={ex.slug}
        exercise={ex}
        index={current.index}
        total={state.total}
        onDone={handleComplete}
        onBack={handleReset}
      />
    );
  }

  // ---- Idle view ----
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-calm-100 dark:bg-calm-900/40">
          <Eye className="h-10 w-10 text-calm-500" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Sesi Latihan Mata
        </h1>
        <p className="max-w-md text-muted-foreground">
          Ikuti {EXERCISES.length} latihan mata secara berurutan dalam satu
          sesi terpandu. Tidak ada yang dilewati — mulai dari yang pertama
          hingga selesai.
        </p>
      </motion.div>

      <Button onClick={handleStart} size="lg" className="gap-2">
        <Play className="h-4 w-4" aria-hidden />
        Mulai Sesi
      </Button>
    </main>
  );
}

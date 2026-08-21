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

  useEffect(() => {
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
    <>
      {/* Fullscreen background */}
      <div className="fixed inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

      {/* Top Header overlay */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-x-0 top-0 z-50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-background/70">
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
              <Badge variant="secondary" className="shrink-0 text-xs">
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
        </div>
      </motion.div>

      {/* Constrained animation stage viewport */}
      <div
        className="fixed inset-x-0 top-24 bottom-48 z-0 overflow-hidden"
        role="img"
        aria-label={`Ilustrasi gerakan mata untuk ${displayName(exercise)}`}
      >
        <EyeStage
          exercise={exercise}
          reduceMotion={reduce || !timer.running}
          speed="normal"
          repVersion={completedReps}
          fullscreen
          onExit={() => {}}
          name={displayName(exercise)}
        />
      </div>

      {/* Bottom panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
        className="fixed inset-x-0 bottom-0 z-50 p-4 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {/* Left panel: Info & Progress (kiri bawah) */}
        <div className="pointer-events-auto w-full md:w-80 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {CATEGORY_LABEL[exercise.category]}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {displayName(exercise)}
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
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                      {remainingReps}
                    </span>
                    <span className="text-xs text-muted-foreground">sisa rep</span>
                  </div>
                </div>
                <Progress value={progressValue} aria-label="Progres repetisi" />
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Progres Waktu</span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {formatTime(timer.remainingSec)}
                  </span>
                </div>
                <Progress value={progressValue} aria-label="Progres waktu" />
              </>
            )}
          </div>
        </div>

        {/* Right panel: Controls */}
        <div className="pointer-events-auto w-full md:w-auto rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70 flex gap-3 items-center justify-end">
          {timer.running ? (
            <Button onClick={timer.pause} size="sm" className="gap-2">
              <Pause className="h-4 w-4" aria-hidden />
              Jeda
            </Button>
          ) : (
            <Button onClick={timer.resume} size="sm" className="gap-2">
              <Play className="h-4 w-4" aria-hidden />
              Mulai
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-2" onClick={timer.reset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Ulangi
          </Button>

          <Button variant="secondary" size="sm" className="gap-2" onClick={onDone}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Selesai
          </Button>
        </div>
      </motion.div>
    </>
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

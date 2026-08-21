"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Eye,
  Play,
  RotateCcw,
  CheckCircle2,
  ListChecks,
  Target,
} from "lucide-react";

import { createSessionMachine } from "@/lib/gym/sessionMachine";
import {
  EXERCISES,
  getDurationBounds,
  getRepBounds,
  type Exercise,
} from "@/lib/exercises";
import { useTimer } from "@/lib/useTimer";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
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

function displayName(ex: Exercise): string {
  return NAME_BY_SLUG[ex.slug] ?? ex.slug;
}

/**
 * Inline, lightweight Framer Motion eye-movement animation keyed by category.
 * Kept in this file on purpose — no shared animation component.
 * Focus object is a square (rounded-lg) with a contrasting primary fill + icon.
 */
function CategoryIcon({
  category,
  className,
}: {
  category: Exercise["category"];
  className?: string;
}) {
  if (category === "relaksasi") return <Eye className={className} aria-hidden />;
  if (category === "fokus") return <Target className={className} aria-hidden />;
  return <Activity className={className} aria-hidden />;
}

function EyeAnimation({
  category,
  reduce,
}: {
  category: Exercise["category"];
  reduce: boolean | null;
}) {
  const focus =
    "flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/40";

  if (category === "relaksasi") {
    // Gentle breathing pulse — calm the eyes.
    return (
      <motion.div
        className={focus}
        animate={reduce ? {} : { scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <CategoryIcon category={category} className="h-6 w-6" />
      </motion.div>
    );
  }

  if (category === "fokus") {
    // Near/far focus: a square that drifts between close (small) and far (large).
    return (
      <div className="relative flex h-28 w-28 items-center justify-center">
        <motion.div
          className={focus}
          animate={reduce ? {} : { scale: [0.45, 1.5, 0.45] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <CategoryIcon category={category} className="h-6 w-6" />
        </motion.div>
      </div>
    );
  }

  // gerakan — trace a figure-8 / circular pattern.
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <div className="absolute h-20 w-20 rounded-lg border border-dashed border-primary/40" />
      <motion.div
        className={focus}
        animate={
          reduce
            ? {}
            : {
                x: [0, 56, 0, -56, 0],
                y: [0, -36, 0, 36, 0],
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <CategoryIcon category={category} className="h-6 w-6" />
      </motion.div>
    </div>
  );
}

/**
 * The running exercise view. Keyed by slug from the parent so the timer
 * re-initialises with the correct per-exercise duration on every advance.
 */
function RunningExercise({ exercise }: { exercise: Exercise }) {
  const reduce = useReducedMotion();
  const isRepBased = exercise.reps !== undefined;
  const durationMax = getDurationBounds(exercise).max;
  const repBounds = getRepBounds(exercise);

  const timer = useTimer({ durationSec: durationMax });

  // Start the countdown as soon as this exercise mounts.
  useEffect(() => {
    timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const repLabel =
    repBounds.min === repBounds.max
      ? `${repBounds.max}×`
      : `${repBounds.min}–${repBounds.max}×`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 text-calm-700 dark:text-calm-300">
        <Eye className="h-5 w-5" aria-hidden />
        <span className="text-sm font-medium uppercase tracking-wide">
          {exercise.category}
        </span>
      </div>

      <EyeAnimation category={exercise.category} reduce={reduce} />

      <div className="w-full max-w-md text-center">
        {isRepBased ? (
          <p className="text-sm text-muted-foreground">
            Target repetisi:{" "}
            <span className="font-semibold text-foreground">{repLabel}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waktu tersisa:{" "}
            <span className="font-semibold text-foreground">
              {timer.remainingSec} detik
            </span>
          </p>
        )}
      </div>

      <ol className="w-full max-w-md space-y-2">
        {exercise.steps.map((step, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm text-foreground"
          >
            <span className="font-semibold text-calm-600 dark:text-calm-400">
              {i + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
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
    const progress = ((current.index + 1) / state.total) * 100;
    const isLast = current.index === state.total - 1;

    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6 px-4 py-12">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Latihan {current.index + 1} dari {state.total}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">
              {displayName(ex)}
            </CardTitle>
            <CardDescription>Ikuti panduan di bawah ini</CardDescription>
          </CardHeader>
          <CardContent>
            <RunningExercise key={ex.slug} exercise={ex} />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleComplete} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {isLast ? "Selesai" : "Selesai"}
          </Button>
        </div>
      </main>
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

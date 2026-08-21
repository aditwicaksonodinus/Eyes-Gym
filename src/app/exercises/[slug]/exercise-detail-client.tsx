"use client";

import * as React from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import TargetWrapper from "@/components/TargetWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { buildEyeMotion, FocusIcon } from "@/lib/gym/eyeMotion";
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

function EyeAnimation({
  exercise,
  reduceMotion,
  speed = "normal",
}: {
  exercise: Exercise;
  reduceMotion: boolean;
  speed?: "normal" | "fast" | "slow";
}) {
  const motionProps = buildEyeMotion(exercise, reduceMotion);
  const durMult = speed === "fast" ? 0.5 : speed === "slow" ? 1.6 : 1;
  const transition = motionProps ? { ...motionProps.transition, duration: motionProps.transition.duration * durMult } : undefined;
  const focusClass = "flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/40";
  return (
      <div className="relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background" role="img" aria-label={`Ilustrasi gerakan mata untuk ${NAME_BY_SLUG[exercise.slug] ?? exercise.slug}`}>
        <TargetWrapper>
        <div className="relative aspect-square h-full bg-secondary">
          {motionProps ? (
            <motion.div
              key={speed}
              className="absolute inset-0 flex items-center justify-center"
              animate={motionProps.animate}
              transition={transition}
            >
              <span className={focusClass}>
                <FocusIcon slug={exercise.slug} className="h-8 w-8" />
              </span>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={focusClass}>
                <FocusIcon slug={exercise.slug} className="h-8 w-8" />
              </span>
            </div>
          )}
        </div>
        </TargetWrapper>
      </div>
  );
}

export function ExerciseDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
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

  const machineRef = React.useRef<DetailMachine | null>(null);
  const [done, setDone] = React.useState(false);
  const [repVersion, setRepVersion] = React.useState(0);
  const [speed, setSpeed] = React.useState<"normal" | "fast" | "slow">("normal");

  if (machineRef.current === null) {
    machineRef.current = createDetailMachine(exercise, {
      clock: () => Date.now(),
      nextSlug,
      onDone: () => {
        setDone(true);
        // Feed the 20-20-20 reminder primer on first value moment.
        useAppStore.getState().recordValueMoment();
      },
    });
  }

  const timer = useTimer({
    durationSec: durationMax,
    onDone: () => machineRef.current?.complete(),
  });

  const mState = machineRef.current.getState();
  const completedReps = repTarget - (mState.remainingReps ?? 0);

  const handleCompleteRep = () => {
    machineRef.current?.completeRep();
    setRepVersion((v) => v + 1);
  };

  const handleReset = () => {
    timer.reset();
    machineRef.current?.reset();
    setDone(false);
    setRepVersion(0);
  };

  const selanjutnyaHref = nextSlug
    ? `/exercises/${nextSlug}`
    : "/exercises/session";

  const name = NAME_BY_SLUG[exercise.slug] ?? exercise.slug;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/exercises">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke daftar
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">{CATEGORY_LABEL[exercise.category]}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatDuration(exercise)}
            {isRepBased ? ` · ${repTarget} repetisi` : ""}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {name}
        </h1>
      </div>

      {/* Animation + movement hint */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <EyeAnimation
            exercise={exercise}
            reduceMotion={reduceMotion}
            speed={speed}
          />
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {motionHint(exercise)}
          </p>
          {exercise.slug === "figure-8" && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Kecepatan:</span>
              {(["slow", "normal", "fast"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={
                    "rounded-full border px-3 py-1 text-sm transition-colors " +
                    (speed === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {s === "slow" ? "Lambat" : s === "fast" ? "Cepat" : "Normal"}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {done ? (
        /* Done state */
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-primary" aria-hidden />
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
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Ulangi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Active state: countdown (duration) or reps counter (rep-based) */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRepBased ? "Hitung repetisi" : "Hitung mundur"}
            </CardTitle>
            <CardDescription>
              {isRepBased
                ? "Tekan tombol setiap satu repetisi selesai."
                : "Mulai timer, lalu ikuti gerakan sampai waktu habis."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isRepBased ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold tabular-nums text-foreground">
                    {completedReps}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    / {repTarget} repetisi
                  </span>
                </div>
                <Progress
                  value={Math.round((completedReps / repTarget) * 100)}
                  aria-label="Progres repetisi"
                />
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button onClick={handleCompleteRep} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Selesai 1 repetisi
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Ulangi
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-6xl font-bold tabular-nums text-foreground">
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
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {timer.running ? (
                    <Button onClick={timer.pause} className="gap-2">
                      <Pause className="h-4 w-4" aria-hidden />
                      Jeda
                    </Button>
                  ) : timer.remainingSec < durationMax ? (
                    <Button onClick={timer.resume} className="gap-2">
                      <Play className="h-4 w-4" aria-hidden />
                      Lanjutkan
                    </Button>
                  ) : (
                    <Button onClick={timer.start} className="gap-2">
                      <Play className="h-4 w-4" aria-hidden />
                      Mulai
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Ulangi
                  </Button>
                </div>
              </>
            )}

            {/* Force-done action, always available before completion */}
            <div className="flex justify-center border-t border-border pt-5">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => machineRef.current?.complete()}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Selesai
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-step instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cara melakukannya</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-5 text-foreground">
            {exercise.steps.map((step, i) => (
              <li key={i} className="pl-1 leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExerciseDetailClient;

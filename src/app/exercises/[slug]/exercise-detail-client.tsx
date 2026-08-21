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
import { useTimer } from "@/lib/useTimer";
import { useAppStore } from "@/store/appStore";

/** Indonesian display names (registry only stores i18n keys — no dictionary yet). */
const NAME_BY_SLUG: Record<string, string> = {
  "20-20-20": "Aturan 20-20-20",
  palming: "Palming",
  blinking: "Kedip Cepat",
  "near-far-focus": "Fokus Dekat–Jauh",
  "figure-8": "Angka 8",
  "eye-rolling": "Menggulung Mata",
  "atas-bawah-kiri-kanan": "Atas–Bawah & Kiri–Kanan",
  "pencil-push-up": "Pencil Push-up",
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
    case "20-20-20":
      return "Pandangan melayang jauh, rileks dan tenang.";
    case "palming":
      return "Mata tertutup, napas masuk dan keluar dengan lembut.";
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
    case "pencil-push-up":
      return "Fokus mendekat lalu menjauh saat tangan ditarik.";
    case "zig-zag":
      return "Mata mengikuti pola zig-zag.";
    case "diagonal-gaze":
      return "Mata bergerak menyilang secara diagonal.";
    default:
      return "Ikuti gerakan mata sesuai panduan.";
  }
}

type EyeMotion = {
  animate: Record<string, number[]>;
  transition: { duration: number; repeat: number; ease: "easeInOut" };
};

/** Builds the Framer Motion keyframes that illustrate each exercise's pattern. */
function buildEyeMotion(ex: Exercise, reduce: boolean): EyeMotion | null {
  if (reduce) return null;
  const base = { duration: 4, repeat: Infinity, ease: "easeInOut" as const };
  const { category, slug } = ex;

  if (category === "relaksasi") {
    // gentle pulse / scale — eyes closed, breathing
    return { animate: { r: [14, 22, 14] }, transition: { ...base, duration: 3 } };
  }
  if (category === "fokus") {
    // dot grows (near) and shrinks (far) — near<->far focus shift
    return { animate: { r: [26, 9, 26] }, transition: { ...base, duration: 3 } };
  }
  // gerakan — dot traces the pattern
  switch (slug) {
    case "figure-8":
      return {
        animate: {
          cx: [100, 150, 150, 100, 50, 50, 100],
          cy: [100, 70, 130, 100, 130, 70, 100],
        },
        transition: base,
      };
    case "eye-rolling":
      return {
        animate: { cx: [100, 160, 100, 40, 100], cy: [40, 100, 160, 100, 40] },
        transition: base,
      };
    case "atas-bawah-kiri-kanan":
      return {
        animate: {
          cx: [100, 100, 100, 40, 160, 100],
          cy: [45, 155, 100, 100, 100, 100],
        },
        transition: base,
      };
    case "zig-zag":
      return {
        animate: { cx: [40, 160, 40, 160, 40], cy: [50, 90, 130, 170, 50] },
        transition: base,
      };
    case "diagonal-gaze":
      return {
        animate: { cx: [40, 160, 40, 160, 40], cy: [40, 160, 40, 160, 40] },
        transition: base,
      };
    default:
      return {
        animate: { cx: [40, 160, 40], cy: [100, 100, 100] },
        transition: base,
      };
  }
}

function EyeAnimation({
  exercise,
  reduceMotion,
}: {
  exercise: Exercise;
  reduceMotion: boolean;
}) {
  const motionProps = buildEyeMotion(exercise, reduceMotion);
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-44 w-44 sm:h-52 sm:w-52"
      role="img"
      aria-label={`Ilustrasi gerakan mata untuk ${NAME_BY_SLUG[exercise.slug] ?? exercise.slug}`}
    >
      <ellipse cx="100" cy="100" rx="84" ry="50" className="fill-secondary" />
      <ellipse
        cx="100"
        cy="100"
        rx="84"
        ry="50"
        className="fill-none stroke-border"
        strokeWidth="2"
      />
      {motionProps ? (
        <motion.circle
          cx={100}
          cy={100}
          r={14}
          className="fill-primary"
          animate={motionProps.animate}
          transition={motionProps.transition}
        />
      ) : (
        <circle cx={100} cy={100} r={14} className="fill-primary" />
      )}
    </svg>
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
          <EyeAnimation exercise={exercise} reduceMotion={reduceMotion} />
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {motionHint(exercise)}
          </p>
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

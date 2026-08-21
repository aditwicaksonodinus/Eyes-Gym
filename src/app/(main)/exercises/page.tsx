"use client";

import * as React from "react";

import { ExerciseCard } from "@/components/exercise-card";
import {
  EXERCISES,
  getDurationBounds,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";

/** Indonesian display names (registry only stores i18n keys). */
const NAME_BY_SLUG: Record<string, string> = {
  blinking: "Kedip Cepat",
  "near-far-focus": "Fokus Dekat–Jauh",
  "figure-8": "Angka 8",
  "eye-rolling": "Menggulung Mata",
  "atas-bawah-kiri-kanan": "Atas–Bawah & Kiri–Kanan",
  "zig-zag": "Zig-Zag",
  "diagonal-gaze": "Tatapan Diagonal",
};

function formatDuration(ex: Exercise): string {
  const { min, max } = getDurationBounds(ex);
  if (min === max) return `${min} detik`;
  return `${min}–${max} detik`;
}

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  relaksasi: "Relaksasi",
  fokus: "Fokus",
  gerakan: "Gerakan",
};

export default function ExercisesPage() {
  return (
    <div className="space-y-10 pb-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Latihan Mata
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Pilih dari daftar latihan di bawah ini untuk membantu menyegarkan mata lelah, melatih fokus, dan mengurangi ketegangan otot mata Anda.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EXERCISES.map((ex) => (
          <ExerciseCard
            key={ex.slug}
            slug={ex.slug}
            name={NAME_BY_SLUG[ex.slug] ?? ex.slug}
            category={ex.category}
            duration={formatDuration(ex)}
            description={`Kategori ${CATEGORY_LABEL[ex.category]}.`}
          />
        ))}
      </div>
    </div>
  );
}

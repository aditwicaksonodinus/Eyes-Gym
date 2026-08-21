"use client";

import * as React from "react";

import { ExerciseCard } from "@/components/exercise-card";
import {
  EXERCISES,
  filterByCategory,
  filterByDuration,
  getDurationBounds,
  type Exercise,
  type ExerciseCategory,
} from "@/lib/exercises";

/** Indonesian display names (registry only stores i18n keys). */
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

type CategoryFilter = "all" | ExerciseCategory;
type DurationFilter = "all" | "short" | "mid" | "long";

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "relaksasi", label: CATEGORY_LABEL.relaksasi },
  { value: "fokus", label: CATEGORY_LABEL.fokus },
  { value: "gerakan", label: CATEGORY_LABEL.gerakan },
];

const DURATION_OPTIONS: {
  value: DurationFilter;
  label: string;
  range: [number, number] | null;
}[] = [
  { value: "all", label: "Semua", range: null },
  { value: "short", label: "≤15 detik", range: [0, 15] },
  { value: "mid", label: "16–30 detik", range: [16, 30] },
  { value: "long", label: "31–60 detik", range: [31, 60] },
];

export default function ExercisesPage() {
  const [category, setCategory] = React.useState<CategoryFilter>("all");
  const [duration, setDuration] = React.useState<DurationFilter>("all");

  const filtered = React.useMemo<readonly Exercise[]>(() => {
    const byCategory =
      category === "all" ? EXERCISES : filterByCategory(category);
    const durationOpt = DURATION_OPTIONS.find((o) => o.value === duration);
    if (!durationOpt || durationOpt.range === null) return byCategory;
    const [min, max] = durationOpt.range;
    const byDuration = filterByDuration(min, max);
    return byCategory.filter((ex) => byDuration.includes(ex));
  }, [category, duration]);

  return (
    <div className="space-y-10 pb-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Latihan Mata
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Pilih latihan singkat untuk meredakan ketegangan mata. Gunakan filter
          kategori dan durasi untuk menemukan yang paling sesuai dengan waktu
          Anda.
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategory(opt.value)}
                  aria-pressed={active}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Durasi</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const active = duration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  aria-pressed={active}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        Menampilkan {filtered.length} dari {EXERCISES.length} latihan.
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
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
      ) : (
        <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Tidak ada latihan yang cocok dengan filter yang dipilih.
        </p>
      )}
    </div>
  );
}

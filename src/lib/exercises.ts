/**
 * Exercise registry — the single source of truth for all eye exercises.
 *
 * Values mirror `spesifikasi-web-senam-mata.md` §2 exactly (do NOT alter
 * any duration/rep value without updating the spec). This module is PURE:
 * no React coupling, no side effects.
 */

export type ExerciseCategory = "relaksasi" | "fokus" | "gerakan";

/** A range of repetitions (inclusive). */
export interface RepRange {
  min: number;
  max: number;
}

/** A range of durations in seconds (inclusive). */
export interface DurationRange {
  min: number;
  max: number;
}

/**
 * `durationSec` is a fixed number for time-based exercises, or a range for
 * exercises spec'd as a band (e.g. Palming 30–60 detik).
 * `reps` is a fixed number for set/count-based exercises, or a range for
 * exercises spec'd as a band (e.g. Eye Rolling 5–8× per arah).
 */
export interface Exercise {
  /** Unique, URL-safe slug (regex `^[a-z0-9-]+$`). */
  slug: string;
  /** i18n key for the display name (Indonesian UI). */
  nameId: string;
  category: ExerciseCategory;
  /** Seconds, or inclusive min–max range in seconds. */
  durationSec: number | DurationRange;
  /** Reps/sets, or inclusive min–max range. Omitted for pure-time exercises. */
  reps?: number | RepRange;
  /** Ordered, step-by-step instructions (Indonesian). */
  steps: string[];
  /** i18n key for the long description. */
  descriptionId: string;
  /** Ringkasan satu kalimat dalam Bahasa Indonesia untuk ditampilkan di kartu latihan. */
  description: string;
}

/**
 * 20-20-20 reminder constants: look at something ~6m away every 20 minutes
 * for 20 seconds.
 */
export const REMINDER_EVERY_MIN = 20;
export const REMINDER_DURATION_SEC = 20;

export const EXERCISES: readonly Exercise[] = [
  {
    slug: "blinking",
    nameId: "exercise.blinking.name",
    category: "relaksasi",
    durationSec: 30,
    steps: [
      "Mulai timer 30 detik.",
      "Kedip cepat dan penuh selama 10 detik (mata terbuka lebar lalu terpejam).",
      "Istirahat sejenak 5 detik dengan mata terbuka santai (jeda).",
      "Ulangi siklus kedip–jeda hingga timer habis, 3 siklus.",
    ],
    descriptionId: "exercise.blinking.description",
    description: "Melatih kebiasaan berkedip penuh untuk melembapkan permukaan mata yang kering akibat terlalu lama menatap layar.",
  },
  {
    slug: "near-far-focus",
    nameId: "exercise.near-far-focus.name",
    category: "fokus",
    durationSec: { min: 10, max: 15 },
    reps: 10,
    steps: [
      "Fokus ke ibu jari/objek ±15 cm dari wajah selama 10–15 detik.",
      "Alihkan fokus ke objek jauh ±6 meter selama 10–15 detik (aturan 20-20-20: lihat jauh setiap 20 menit).",
      "Ulangi hingga 10 repetisi.",
    ],
    descriptionId: "exercise.near-far-focus.description",
    description: "Melatih otot lensa mata berpindah fokus dari jarak dekat ke jauh secara bergantian untuk menjaga kelentukan akomodasi.",
  },
  {
    slug: "figure-8",
    nameId: "exercise.figure-8.name",
    category: "gerakan",
    durationSec: 30,
    reps: 2,
    steps: [
      "Bayangkan angka 8 besar sejauh ±3 meter.",
      "Telusuri dengan gerakan mata, bisa cepat atau lambat (atur kecepatan).",
      "Balik arah dan ulangi (2 arah).",
    ],
    descriptionId: "exercise.figure-8.description",
    description: "Menggerakkan mata mengikuti pola angka 8 untuk melatih koordinasi otot okular di semua arah gerak.",
  },
  {
    slug: "eye-rolling",
    nameId: "exercise.eye-rolling.name",
    category: "gerakan",
    durationSec: { min: 5, max: 8 },
    reps: { min: 5, max: 8 },
    steps: [
      "Gulirkan mata searah jarum jam 5–8 kali.",
      "Gulirkan mata berlawanan arah 5–8 kali.",
      "Pertahankan kepala tetap diam.",
    ],
    descriptionId: "exercise.eye-rolling.description",
    description: "Memutar bola mata searah dan berlawanan jarum jam untuk meregangkan semua kelompok otot penggerak mata.",
  },
  {
    slug: "atas-bawah-kiri-kanan",
    nameId: "exercise.atas-bawah-kiri-kanan.name",
    category: "gerakan",
    durationSec: 8,
    reps: 10,
    steps: [
      "Gerakkan mata perlahan ke atas lalu ke bawah (10 repetisi).",
      "Gerakkan mata perlahan ke kiri lalu ke kanan (10 repetisi).",
      "Mata boleh terbuka atau tertutup.",
    ],
    descriptionId: "exercise.atas-bawah-kiri-kanan.description",
    description: "Gerakkan mata ke empat arah utama secara perlahan untuk melepaskan kekakuan otot mata akibat fokus statis.",
  },
  {
    slug: "zig-zag",
    nameId: "exercise.zig-zag.name",
    category: "gerakan",
    durationSec: 30,
    steps: [
      "Gerakkan mata mengikuti pola zig-zag, fokus pada objek yang muncul dan hilang kiri–kanan.",
      "Saat objek muncul, kunci fokus; saat hilang, pindah pandangan ke sisi berikutnya.",
      "Lakukan selama 30 detik dengan kepala tetap diam.",
    ],
    descriptionId: "exercise.zig-zag.description",
    description: "Melatih kemampuan pelacakan visual dengan mengikuti objek yang berpindah secara zigzag, meningkatkan koordinasi mata.",
  },
  {
    slug: "diagonal-gaze",
    nameId: "exercise.diagonal-gaze.name",
    category: "gerakan",
    durationSec: { min: 5, max: 8 },
    reps: { min: 5, max: 8 },
    steps: [
      "Gerakkan mata ke pojok kanan atas lalu ke pojok kiri bawah secara diagonal.",
      "Ulangi 5–8 repetisi per arah.",
      "Balik arah dan ulangi 5–8 repetisi.",
    ],
    descriptionId: "exercise.diagonal-gaze.description",
    description: "Mengarahkan pandangan secara diagonal ke empat sudut untuk memperkuat otot obliq mata yang jarang terlatih.",
  },
];

const exerciseBySlug: ReadonlyMap<string, Exercise> = new Map(
  EXERCISES.map((ex) => [ex.slug, ex]),
);

export const EXERCISE_CATEGORIES = {
  relaksasi: "relaksasi",
  fokus: "fokus",
  gerakan: "gerakan",
} as const satisfies Record<ExerciseCategory, ExerciseCategory>;

/** Exact slug → category mapping expected by the spec (test-enforced). */
export const CATEGORY_SLUGS: Readonly<Record<ExerciseCategory, readonly string[]>> = {
  relaksasi: ["blinking"],
  fokus: ["near-far-focus"],
  gerakan: ["figure-8", "eye-rolling", "atas-bawah-kiri-kanan", "zig-zag", "diagonal-gaze"],
};

/** Inclusive duration bounds in seconds for an exercise. */
export function getDurationBounds(
  ex: Pick<Exercise, "durationSec">,
): DurationRange {
  return typeof ex.durationSec === "number"
    ? { min: ex.durationSec, max: ex.durationSec }
    : ex.durationSec;
}

/** Inclusive reps bounds for an exercise. Falls back to {1,1} when reps absent. */
export function getRepBounds(ex: Exercise): RepRange {
  if (ex.reps === undefined) return { min: 1, max: 1 };
  return typeof ex.reps === "number" ? { min: ex.reps, max: ex.reps } : ex.reps;
}

/** Returns the exercise for a slug, or undefined when not found. */
export function getExercise(slug: string): Exercise | undefined {
  return exerciseBySlug.get(slug);
}

/** Returns all exercises in the given category, in registry order. */
export function filterByCategory(category: ExerciseCategory): Exercise[] {
  return EXERCISES.filter((ex) => ex.category === category);
}

/**
 * Returns exercises whose duration span overlaps the inclusive [minSec, maxSec]
 * window. Time-based (fixed) durations and duration ranges are both considered.
 */
export function filterByDuration(
  minSec: number,
  maxSec = minSec,
): Exercise[] {
  return EXERCISES.filter((ex) => {
    const { min, max } = getDurationBounds(ex);
    return min <= maxSec && max >= minSec;
  });
}

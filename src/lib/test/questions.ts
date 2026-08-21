/**
 * Symptom self-report & refractive screening questionnaire.
 *
 * PURE data + tiny scoring helpers. No React, no side effects.
 */

export interface Question {
  /** Stable identifier used by the caller to key answers. */
  id: string;
  /** Indonesian self-report prompt shown to the user. */
  text: string;
  /** Custom options if different from standard symptom scale. */
  options?: { label: string; value: number }[];
}

/** Refractive & fatigue self-report questions (Indonesian). */
export const QUESTIONS: Question[] = [
  {
    id: "q_age",
    text: "Kategori Usia Anda saat ini:",
    options: [
      { label: "Di bawah 40 tahun", value: 0 },
      { label: "40 tahun atau lebih", value: 2 },
    ],
  },
  {
    id: "q_near",
    text: "Apakah Anda mengalami kesulitan membaca tulisan kecil pada jarak dekat (sekitar 30 cm)?",
  },
  {
    id: "q1",
    text: "Apakah mata Anda sering terasa kering atau seperti berpasir?",
  },
  {
    id: "q2",
    text: "Apakah pandangan terasa kabur setelah lama menatap layar?",
  },
  {
    id: "q3",
    text: "Apakah Anda sering sakit kepala setelah menggunakan layar?",
  },
  {
    id: "q4",
    text: "Apakah mata terasa lelah atau berat di sore hari?",
  },
  {
    id: "q5",
    text: "Apakah sulit memfokuskan pandangan ke jarak jauh setelah menatap layar?",
  },
  {
    id: "q6",
    text: "Apakah leher atau bahu terasa tegang setelah beraktivitas di depan layar?",
  },
];

export type SymptomBand = "rendah" | "sedang" | "tinggi";

/** Map a summed symptom score to a plain-language band. */
export function scoreBand(score: number): SymptomBand {
  if (score <= 3) return "rendah";
  if (score <= 6) return "sedang";
  return "tinggi";
}

/**
 * Symptom self-report questionnaire for the eye self-check.
 *
 * PURE data + a tiny scoring helper. No React, no side effects. The caller
 * (a page component) renders `QUESTIONS` and sums the user's 0–2 answers, then
 * passes the total to `triage()` in ./triage.
 *
 * Scoring bands (total of all answers, each 0–2):
 *   0–2  → "rendah"   (low fatigue)
 *   3–4  → "sedang"  (moderate fatigue)
 *   ≥5   → "tinggi"   (high fatigue)
 */

export interface Question {
  /** Stable identifier used by the caller to key answers. */
  id: string;
  /** Indonesian self-report prompt shown to the user. */
  text: string;
}

/** Exactly six fatigue self-report questions (Indonesian). */
export const QUESTIONS: Question[] = [
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
    text: "Apakah sulit memfokuskan pandangan ke jarak jauh setelah layar?",
  },
  {
    id: "q6",
    text: "Apakah leher atau bahu terasa tegang setelah beraktivitas layar?",
  },
];

export type SymptomBand = "rendah" | "sedang" | "tinggi";

/** Map a summed symptom score (0–12) to a plain-language band. */
export function scoreBand(score: number): SymptomBand {
  if (score <= 2) return "rendah";
  if (score <= 4) return "sedang";
  return "tinggi";
}

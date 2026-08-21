/**
 * Triage logic for the eye self-check — PURE functions, no React.
 *
 * Two entry points:
 *   • `triageAcuity({ leftLogMAR, rightLogMAR })` — wraps the per-eye acuity
 *     bands (via `bandForLogMAR` from ./acuity) and derives best/worst/asymmetry.
 *   • `triage({ acuity, symptomScore })` — combines acuity + symptom score into
 *     one of three branches: normal / borderline / referral.
 *
 * Branch precedence (most serious wins):
 *   1. referral   — worst eye logMAR > 0.5  OR  inter-eye asymmetry ≥ 0.2
 *   2. normal     — best eye logMAR ≤ 0.1 (both eyes) AND symptomScore ≤ 2
 *   3. borderline — everything else (e.g. worst eye 0.2–0.4, or symptomScore ≥ 3)
 *
 * A referral NEVER returns an exercise CTA. Every result carries the
 * self-check disclaimer (this is screening, not a medical diagnosis).
 */
import { bandForLogMAR } from "@/lib/test/acuity";

export interface TriageAcuityInput {
  leftLogMAR: number;
  rightLogMAR: number;
}

export interface EyeResult {
  logMAR: number;
  band: string;
}

export interface TriageAcuityResult {
  left: EyeResult;
  right: EyeResult;
  /** Better (lower) logMAR of the two eyes. */
  best: number;
  /** Worse (higher) logMAR of the two eyes. */
  worst: number;
  /** Absolute difference between the two eyes' logMAR. */
  asymmetry: number;
}

/** Per-eye bands + derived best/worst/asymmetry from raw logMAR values. */
export function triageAcuity({
  leftLogMAR,
  rightLogMAR,
}: TriageAcuityInput): TriageAcuityResult {
  const best = Math.min(leftLogMAR, rightLogMAR);
  const worst = Math.max(leftLogMAR, rightLogMAR);
  const asymmetry = Math.abs(leftLogMAR - rightLogMAR);
  return {
    left: { logMAR: leftLogMAR, band: bandForLogMAR(leftLogMAR) },
    right: { logMAR: rightLogMAR, band: bandForLogMAR(rightLogMAR) },
    best,
    worst,
    asymmetry,
  };
}

export type TriageBranch = "normal" | "borderline" | "referral";
export type TriageCta = "prevention" | "exercise" | null;

export interface TriageInput {
  acuity: TriageAcuityResult;
  symptomScore: number;
}

export interface TriageResult {
  branch: TriageBranch;
  cta: TriageCta;
  ctaLabel?: string;
  message: string;
  disclaimer: string;
}

const DISCLAIMER = "Ini pemeriksaan mandiri, bukan diagnosis medis.";

/** logMAR worse than 20/60 → hard referral. */
const REFERRAL_WORST_LOGMAR = 0.5;
/** Inter-eye difference that alone triggers a referral. */
const REFERRAL_ASYMMETRY = 0.2;
/** Both eyes at/above this are still "normal" acuity. */
const NORMAL_BEST_LOGMAR = 0.1;

/**
 * Combine acuity + symptom score into a triage branch.
 *
 * @param acuity       Result of `triageAcuity(...)`.
 * @param symptomScore Summed 0–2 answers from the questionnaire (0–12).
 */
export function triage({ acuity, symptomScore }: TriageInput): TriageResult {
  // 1. Hard referral — most serious, overrides everything.
  if (acuity.worst > REFERRAL_WORST_LOGMAR || acuity.asymmetry >= REFERRAL_ASYMMETRY) {
    return {
      branch: "referral",
      cta: null,
      message: "Segera periksa ke dokter mata.",
      disclaimer: DISCLAIMER,
    };
  }

  // 2. Normal — both eyes healthy AND few symptoms.
  if (acuity.best <= NORMAL_BEST_LOGMAR && symptomScore <= 2) {
    return {
      branch: "normal",
      cta: "prevention",
      ctaLabel: "Tips Pencegahan",
      message:
        "Mata Anda terlihat baik. Pertahankan kebiasaan sehat: istirahat 20-20-20 dan jaga jarak pandang dari layar.",
      disclaimer: DISCLAIMER,
    };
  }

  // 3. Borderline — elevated symptoms or mildly reduced acuity.
  return {
    branch: "borderline",
    cta: "exercise",
    ctaLabel: "Mulai Latihan",
    message: "Mata lelah — coba latihan SeeFit 2 minggu, lalu tes ulang.",
    disclaimer: DISCLAIMER,
  };
}

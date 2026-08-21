/**
 * Triage & Refractive Indication Classifier — PURE functions, no React.
 *
 * Combines acuity test results + symptom questionnaire answers to derive:
 *   • Triage recommendation (normal / borderline / referral).
 *   • Refractive indication (emmetropia / myopia / presbyopia / astigmatism).
 */
import { bandForLogMAR, toSnellenFraction, toSnellenSix } from "@/lib/test/acuity";

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

export type RefractionCategory =
  | "emmetropia"
  | "myopia"
  | "presbyopia"
  | "astigmatism";

export interface RefractiveIndication {
  type: RefractionCategory;
  label: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  severity?: "Ringan" | "Sedang / Perlu Evaluasi";
  explanation: string;
  recommendation: string;
}

export interface RefractionInput {
  leftLogMAR: number;
  rightLogMAR: number;
  ageScore?: number; // 0 (<40) or 2 (>=40)
  nearDifficultyScore?: number; // 0, 1, 2
}

/**
 * Classify potential refractive error orientation.
 */
export function classifyRefraction(input: RefractionInput): RefractiveIndication {
  const { leftLogMAR, rightLogMAR, ageScore = 0, nearDifficultyScore = 0 } = input;
  const worst = Math.max(leftLogMAR, rightLogMAR);
  const asymmetry = Math.abs(leftLogMAR - rightLogMAR);

  // 1. Astigmatism / Significant Asymmetry
  if (asymmetry >= 0.2) {
    return {
      type: "astigmatism",
      label: "Indikasi Astigmatisme / Asimetris",
      badgeVariant: "secondary",
      explanation:
        "Terdapat perbedaan fokus penglihatan yang signifikan antara mata kiri dan mata kanan Anda.",
      recommendation:
        "Disarankan melakukan pemeriksaan refraksi silindris lengkap dengan dokter mata atau optometris.",
    };
  }

  // 2. Myopia (Mata Minus) - distance acuity at 2m is reduced (> 0.1 logMAR)
  if (worst > 0.1) {
    const isModerate = worst > 0.3;
    return {
      type: "myopia",
      label: "Kecenderungan Miopia (Mata Minus)",
      badgeVariant: isModerate ? "destructive" : "secondary",
      severity: isModerate ? "Sedang / Perlu Evaluasi" : "Ringan",
      explanation: `Ketajaman penglihatan jarak jauh 2 meter Anda mengalami penurunan (${toSnellenSix(worst)} / ${toSnellenFraction(worst)}).`,
      recommendation:
        "Kondisi ini umumnya memerlukan koreksi kacamata minus (lensa sferis negatif). Kunjungi optik atau dokter mata untuk uji lensa subjektif.",
    };
  }

  // 3. Presbyopia (Mata Plus / Tua) - distance acuity is 6/6, but near difficulty or age >= 40
  if (nearDifficultyScore >= 1 || (ageScore >= 2 && nearDifficultyScore >= 0)) {
    return {
      type: "presbyopia",
      label: "Kecenderungan Presbiopia (Mata Plus / Tua)",
      badgeVariant: "outline",
      severity: nearDifficultyScore >= 2 ? "Sedang / Perlu Evaluasi" : "Ringan",
      explanation:
        "Penglihatan jarak jauh 2 meter Anda tergolong tajam (6/6), namun terdapat indikasi penurunan daya akomodasi membaca tulisan kecil jarak dekat (30 cm).",
      recommendation:
        "Disarankan menggunakan kacamata baca plus (lensa sferis positif) saat membaca atau beraktivitas jarak dekat.",
    };
  }

  // 4. Emmetropia (Penglihatan Normal)
  return {
    type: "emmetropia",
    label: "Penglihatan Normal (Emertopia)",
    badgeVariant: "default",
    explanation:
      "Ketajaman penglihatan jarak jauh 2 meter dan kenyamanan baca jarak dekat Anda berada dalam batas optimal.",
    recommendation:
      "Pertahankan kebiasaan sehat menatap layar dengan aturan 20-20-20 dan pencahayaan ruangan yang cukup.",
  };
}

export type TriageBranch = "normal" | "borderline" | "referral";
export type TriageCta = "prevention" | "exercise" | null;

export interface TriageInput {
  acuity: TriageAcuityResult;
  symptomScore: number;
  ageScore?: number;
  nearDifficultyScore?: number;
}

export interface TriageResult {
  branch: TriageBranch;
  cta: TriageCta;
  ctaLabel?: string;
  message: string;
  disclaimer: string;
  refractiveIndication: RefractiveIndication;
}

const DISCLAIMER = "Ini pemeriksaan mandiri, bukan diagnosis medis.";

/** logMAR worse than 20/60 → hard referral. */
const REFERRAL_WORST_LOGMAR = 0.5;
/** Inter-eye difference that alone triggers a referral. */
const REFERRAL_ASYMMETRY = 0.2;
/** Both eyes at/above this are still "normal" acuity. */
const NORMAL_BEST_LOGMAR = 0.1;

/**
 * Combine acuity + symptom score into a triage branch and refractive indication.
 */
export function triage({
  acuity,
  symptomScore,
  ageScore = 0,
  nearDifficultyScore = 0,
}: TriageInput): TriageResult {
  const refractiveIndication = classifyRefraction({
    leftLogMAR: acuity.left.logMAR,
    rightLogMAR: acuity.right.logMAR,
    ageScore,
    nearDifficultyScore,
  });

  // 1. Hard referral — most serious, overrides everything.
  if (acuity.worst > REFERRAL_WORST_LOGMAR || acuity.asymmetry >= REFERRAL_ASYMMETRY) {
    return {
      branch: "referral",
      cta: null,
      message: "Segera periksa ke dokter mata untuk pemeriksaan refraksi & kesehatan retina menyeluruh.",
      disclaimer: DISCLAIMER,
      refractiveIndication,
    };
  }

  // 2. Normal — both eyes healthy AND few symptoms.
  if (acuity.best <= NORMAL_BEST_LOGMAR && symptomScore <= 3) {
    return {
      branch: "normal",
      cta: "prevention",
      ctaLabel: "Tips Pencegahan",
      message:
        "Mata Anda dalam kondisi baik. Pertahankan kebiasaan sehat: istirahat 20-20-20 dan jaga jarak pandang dari layar.",
      disclaimer: DISCLAIMER,
      refractiveIndication,
    };
  }

  // 3. Borderline — elevated symptoms or mildly reduced acuity.
  return {
    branch: "borderline",
    cta: "exercise",
    ctaLabel: "Mulai Latihan",
    message: "Mata lelah — coba latihan senam mata Eyes-Gym 2 minggu, lalu tes ulang.",
    disclaimer: DISCLAIMER,
    refractiveIndication,
  };
}

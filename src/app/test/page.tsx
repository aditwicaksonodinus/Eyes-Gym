"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";
import {
  createAcuityTest,
  type AcuityResult,
} from "@/lib/test/acuity";
import {
  CREDIT_CARD_WIDTH_MM,
  cmToMm,
  computeLetterPx,
} from "@/lib/test/calibration";
import { triageAcuity, triage } from "@/lib/test/triage";
import { QUESTIONS } from "@/lib/test/questions";

/** Sloan optotype set (12.5% legibility-balanced). */
const SLOAN = ["C", "D", "H", "K", "N", "O", "R", "S", "V", "Z"] as const;

/** Fallback calibration if the user somehow reaches the test without it. */
const FALLBACK_PX_PER_MM = 96 / 25.4; // ~1 CSS px per 0.2646 mm
const FALLBACK_DISTANCE_MM = 400; // 40 cm

type EyeSide = "left" | "right";
const EYE_ORDER: EyeSide[] = ["left", "right"];
const EYE_LABEL: Record<EyeSide, string> = {
  left: "Mata Kiri",
  right: "Mata Kanan",
};

const SYMPTOM_LABELS = ["Tidak pernah", "Kadang-kadang", "Sering"] as const;

export default function TestPage() {
  const reduceMotion = useReducedMotion();

  // ── Wizard navigation ──────────────────────────────────────────────────────
  const [step, setStep] = React.useState(0);

  // ── Step 1: calibration ────────────────────────────────────────────────────
  const [cardPx, setCardPx] = React.useState(200);
  const [distanceCm, setDistanceCm] = React.useState(40);

  const pxPerMm = cardPx / CREDIT_CARD_WIDTH_MM;
  const distanceMm = cmToMm(distanceCm);
  const effPxPerMm = pxPerMm || FALLBACK_PX_PER_MM;
  const effDistanceMm = distanceMm || FALLBACK_DISTANCE_MM;
  const zoomImplausible = pxPerMm < 2 || pxPerMm > 10;

  // ── Step 2: acuity engine (per eye) ────────────────────────────────────────
  const engineRef = React.useRef<ReturnType<typeof createAcuityTest> | null>(
    null,
  );
  const [currentSide, setCurrentSide] = React.useState<EyeSide>("left");
  const [letterIndex, setLetterIndex] = React.useState(0);
  const [leftLogMAR, setLeftLogMAR] = React.useState<number | null>(null);
  const [rightLogMAR, setRightLogMAR] = React.useState<number | null>(null);
  const [leftSnellen, setLeftSnellen] = React.useState<string>("");
  const [rightSnellen, setRightSnellen] = React.useState<string>("");

  const startEye = React.useCallback((side: EyeSide) => {
    engineRef.current = createAcuityTest();
    setCurrentSide(side);
    setLetterIndex(0);
  }, []);

  // Initialize the engine when we first enter the acuity step.
  React.useEffect(() => {
    if (step === 2 && engineRef.current === null) {
      startEye("left");
    }
  }, [step, startEye]);

  const handleAnswer = React.useCallback(
    (correct: boolean) => {
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.answer(correct);
      if (state.done) {
        const res: AcuityResult = engine.result();
        const side = currentSide;
        useAppStore.getState().setEyeResult(side, "phone", {
          snellen: res.snellenFraction,
          distance: effDistanceMm / 1000,
        });
        if (side === "left") {
          setLeftLogMAR(res.logMAR);
          setLeftSnellen(res.snellenFraction);
          startEye("right");
        } else {
          setRightLogMAR(res.logMAR);
          setRightSnellen(res.snellenFraction);
          setStep(3);
        }
      } else {
        setLetterIndex((i) => i + 1);
      }
    },
    [currentSide, effDistanceMm, startEye],
  );

  // ── Step 3: symptom questionnaire ──────────────────────────────────────────
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const symptomScore = QUESTIONS.reduce(
    (sum, q) => sum + (answers[q.id] ?? 0),
    0,
  );

  const handleSubmitQuestionnaire = React.useCallback(() => {
    useAppStore.getState().addQuestionnaire({
      score: symptomScore,
      answers: QUESTIONS.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? 0,
      })),
      completedAt: Date.now(),
    });
    setStep(4);
  }, [answers, symptomScore]);

  // ── Step 4: result (computed once both eyes + score are known) ────────────
  const acuity =
    leftLogMAR !== null && rightLogMAR !== null
      ? triageAcuity({ leftLogMAR, rightLogMAR })
      : null;
  const triageResult =
    acuity !== null ? triage({ acuity, symptomScore }) : null;

  // Record a "value moment" exactly once when the result is shown.
  const recordedRef = React.useRef(false);
  React.useEffect(() => {
    if (step === 4 && !recordedRef.current) {
      recordedRef.current = true;
      useAppStore.getState().recordValueMoment();
    }
  }, [step]);

  const handleReset = React.useCallback(() => {
    engineRef.current = null;
    recordedRef.current = false;
    setLeftLogMAR(null);
    setRightLogMAR(null);
    setLeftSnellen("");
    setRightSnellen("");
    setAnswers({});
    setCardPx(200);
    setDistanceCm(40);
    useAppStore.getState().resetEyeResults();
    setStep(0);
  }, []);

  // ── Step transition wrapper (framer-motion, reduced-motion aware) ──────────
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: "easeOut" as const },
      };

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div key={step} {...motionProps}>
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Tes Mata Mandiri</CardTitle>
              <CardDescription>
                Skrining sederhana untuk mengenali kelelahan dan ketajaman mata.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tes ini adalah <strong>pemeriksaan mandiri</strong> untuk
                skrining ketajaman mata dan{" "}
                <strong>bukan diagnosis medis</strong>. Hasilnya hanya panduan
                awal. Jika Anda memiliki keluhan mata berkelanjutan, konsultasikan
                ke dokter mata (optalmologis).
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setStep(1)} className="w-full">
                Mulai Tes
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Kalibrasi Layar</CardTitle>
              <CardDescription>
                Ukur lebar kartu kredit asli di layar agar ukuran huruf akurat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="cardPx"
                  className="text-sm font-medium text-foreground"
                >
                  Lebar kartu kredit di layar (px)
                </label>
                <input
                  id="cardPx"
                  type="number"
                  min={80}
                  max={600}
                  value={cardPx}
                  onChange={(e) => setCardPx(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                />
                <input
                  type="range"
                  min={80}
                  max={600}
                  value={cardPx}
                  onChange={(e) => setCardPx(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Geser lebar kartu kredit"
                />
                <p className="text-xs text-muted-foreground">
                  Nilai terukur: {pxPerMm.toFixed(2)} px/mm
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="distanceCm"
                  className="text-sm font-medium text-foreground"
                >
                  Jarak pandang (cm)
                </label>
                <input
                  id="distanceCm"
                  type="number"
                  min={20}
                  max={80}
                  value={distanceCm}
                  onChange={(e) => setDistanceCm(Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                />
              </div>

              {zoomImplausible && (
                <p
                  role="alert"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  Pastikan kartu kredit terlihat utuh di layar, tidak
                  diperbesar.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setStep(2)} className="w-full">
                Lanjut
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && engineRef.current && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Tes Ketajaman — {EYE_LABEL[currentSide]}
              </CardTitle>
              <CardDescription>
                Jawab apakah huruf di bawah ini masih terbaca dengan jelas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex min-h-[160px] items-center justify-center rounded-md border border-border bg-card p-4">
                <svg
                  role="img"
                  aria-label={`Huruf uji ${SLOAN[letterIndex % SLOAN.length]}`}
                  width={computeLetterPx(
                    effDistanceMm,
                    effPxPerMm,
                    engineRef.current.getState().logMAR,
                  )}
                  height={computeLetterPx(
                    effDistanceMm,
                    effPxPerMm,
                    engineRef.current.getState().logMAR,
                  )}
                  viewBox={`0 0 ${computeLetterPx(
                    effDistanceMm,
                    effPxPerMm,
                    engineRef.current.getState().logMAR,
                  )} ${computeLetterPx(
                    effDistanceMm,
                    effPxPerMm,
                    engineRef.current.getState().logMAR,
                  )}`}
                  className="text-foreground"
                >
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="central"
                    textAnchor="middle"
                    fontSize={computeLetterPx(
                      effDistanceMm,
                      effPxPerMm,
                      engineRef.current.getState().logMAR,
                    )}
                    fill="currentColor"
                  >
                    {SLOAN[letterIndex % SLOAN.length]}
                  </text>
                </svg>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Mata diuji: {EYE_LABEL[currentSide]} · Petunjuk: sebutkan huruf
                sejelas mungkin.
              </p>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleAnswer(true)}
              >
                Terbaca
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleAnswer(false)}
              >
                Tidak Terbaca
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Kuesioner Gejala</CardTitle>
              <CardDescription>
                Pilih yang paling menggambarkan kondisi mata Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {QUESTIONS.map((q) => (
                <fieldset key={q.id} className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">
                    {q.text}
                  </legend>
                  <div className="flex gap-2">
                    {SYMPTOM_LABELS.map((label, value) => (
                      <Button
                        key={label}
                        type="button"
                        size="sm"
                        variant={
                          (answers[q.id] ?? 0) === value
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: value }))
                        }
                        aria-pressed={(answers[q.id] ?? 0) === value}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Skor gejala: {symptomScore} / 12
              </p>
              <Button onClick={handleSubmitQuestionnaire} className="w-full">
                Lihat Hasil
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && acuity && triageResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Hasil Tes Mata</CardTitle>
              <CardDescription>
                Skrining ketajaman dan gejala mata Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">
                    {EYE_LABEL.left}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {leftSnellen || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {acuity.left.band}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-card p-3">
                  <p className="text-sm font-medium text-foreground">
                    {EYE_LABEL.right}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {rightSnellen || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {acuity.right.band}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-foreground">
                {triageResult.message}
              </p>

              {triageResult.cta === "exercise" && (
                <Button asChild className="w-full">
                  <Link href="/exercises">{triageResult.ctaLabel}</Link>
                </Button>
              )}

              {triageResult.cta === null && (
                <p
                  role="alert"
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
                >
                  Segera periksa ke dokter mata.
                </p>
              )}

              {triageResult.cta === "prevention" && (
                <p className="text-sm text-muted-foreground">
                  {triageResult.ctaLabel}: {triageResult.message}
                </p>
              )}

              <p className="text-xs italic text-muted-foreground">
                {triageResult.disclaimer}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                Ulangi
              </Button>
            </CardFooter>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

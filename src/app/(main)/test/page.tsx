"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

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
  toSnellenSix,
  toSnellenFraction,
  type AcuityResult,
} from "@/lib/test/acuity";
import {
  CREDIT_CARD_WIDTH_MM,
  cmToMm,
  computeLetterPxPhysical,
  computePhysicalLetterMm,
} from "@/lib/test/calibration";
import { triageAcuity, triage } from "@/lib/test/triage";
import { QUESTIONS } from "@/lib/test/questions";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavbarShell } from "@/components/navbar";

/** 9 standard Snellen block optotypes (5x5 grid geometry). */
const SNELLEN = ["C", "D", "E", "F", "L", "O", "P", "T", "Z"] as const;

/** Fallback calibration for ~92 PPI desktop display at fixed 2-meter test distance. */
const FALLBACK_PX_PER_MM = 92 / 25.4; // ~3.622 px per mm
const DESKTOP_TEST_DISTANCE_MM = 2000; // Fixed 2 meters (2000 mm)

type EyeSide = "left" | "right";
const EYE_ORDER: EyeSide[] = ["left", "right"];
const EYE_LABEL: Record<EyeSide, string> = {
  left: "Mata Kiri",
  right: "Mata Kanan",
};

const SYMPTOM_LABELS = ["Tidak pernah", "Kadang-kadang", "Sering"] as const;

/** Helper to generate 4 multiple-choice optotype options (1 target + 3 distractors). */
function generateOptions(target: string): string[] {
  const distractors = SNELLEN.filter((char) => char !== target);
  const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5);
  const selectedDistractors = shuffledDistractors.slice(0, 3);
  const opts = [target, ...selectedDistractors];
  return opts.sort(() => Math.random() - 0.5);
}

export default function TestPage() {
  const reduceMotion = useReducedMotion();

  // ── Wizard navigation ──────────────────────────────────────────────────────
  const [step, setStep] = React.useState(0);

  // ── Step 1: Calibration (fixed 2 meters distance, card calibration) ───────
  const [cardPx, setCardPx] = React.useState(310);
  const distanceCm = 200; // Lock distance to 2 meters (200 cm)

  const pxPerMm = cardPx / CREDIT_CARD_WIDTH_MM;
  const distanceMm = cmToMm(distanceCm);
  const effPxPerMm = pxPerMm || FALLBACK_PX_PER_MM;
  const effDistanceMm = distanceMm || DESKTOP_TEST_DISTANCE_MM;

  // ── Right eye transition confirmation ──────────────────────────────────────
  const [showRightEyeTransition, setShowRightEyeTransition] = React.useState(false);
  const engineRef = React.useRef<ReturnType<typeof createAcuityTest> | null>(
    null,
  );
  const sideRef = React.useRef<EyeSide>("left");
  const [currentSide, setCurrentSide] = React.useState<EyeSide>("left");
  const [engineReady, setEngineReady] = React.useState(false);
  const [letterChar, setLetterChar] = React.useState<string>(SNELLEN[0]);
  const [options, setOptions] = React.useState<string[]>([]);
  const [leftLogMAR, setLeftLogMAR] = React.useState<number | null>(null);
  const [rightLogMAR, setRightLogMAR] = React.useState<number | null>(null);
  const [leftResult, setLeftResult] = React.useState<AcuityResult | null>(null);
  const [rightResult, setRightResult] = React.useState<AcuityResult | null>(null);

  const startEye = React.useCallback((side: EyeSide) => {
    engineRef.current = createAcuityTest({ startLogMAR: 1.0 });
    sideRef.current = side;
    setCurrentSide(side);
    const firstTarget = SNELLEN[Math.floor(Math.random() * SNELLEN.length)];
    setLetterChar(firstTarget);
    setOptions(generateOptions(firstTarget));
    setEngineReady(true);
  }, []);

  // Initialize the engine when we first enter the acuity step.
  React.useEffect(() => {
    if (step === 2 && engineRef.current === null) {
      startEye("left");
    }
  }, [step, startEye]);

  const handleSelectOption = React.useCallback(
    (chosenChar: string) => {
      const engine = engineRef.current;
      if (!engine) return;

      const isCorrect = chosenChar === letterChar;
      const state = engine.answer(isCorrect);
      if (state.done) {
        const res: AcuityResult = engine.result();
        const side = sideRef.current;
        useAppStore.getState().setEyeResult(side, "phone", {
          snellen: `${res.snellenSix} (${res.snellenFraction})`,
          distance: effDistanceMm / 1000,
        });
        if (side === "left") {
          setLeftLogMAR(res.logMAR);
          setLeftResult(res);
          setShowRightEyeTransition(true);
        } else {
          setRightLogMAR(res.logMAR);
          setRightResult(res);
          setStep(3);
        }
      } else {
        const nextTarget = SNELLEN[Math.floor(Math.random() * SNELLEN.length)];
        setLetterChar(nextTarget);
        setOptions(generateOptions(nextTarget));
      }
    },
    [effDistanceMm, letterChar],
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
    setEngineReady(false);
    recordedRef.current = false;
    setLeftLogMAR(null);
    setRightLogMAR(null);
    setLeftResult(null);
    setRightResult(null);
    setAnswers({});
    setCardPx(310);
    setShowRightEyeTransition(false);
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
      {/* Step 2: Fullscreen Acuity Test (1-to-1 layout mirroring Gym style) */}
      {step === 2 && engineReady && (
        <div className="fixed inset-0 z-fullscreen-page bg-background flex flex-col overflow-hidden">
          {/* Background Stage */}
          <div className="absolute inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

          {/* Top Header Navbar */}
          <NavbarShell className="shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-1 gap-1.5 text-muted-foreground"
                onClick={() => {
                  engineRef.current = null;
                  setEngineReady(false);
                  setStep(1);
                }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
              <div className="h-4 w-px bg-border" aria-hidden />
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                  Tes Ketajaman Mata
                </h1>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {currentSide === "left" ? "Mata Kiri" : "Mata Kanan"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </NavbarShell>

          {/* Constrained letter stage / transition jeda screen */}
          {showRightEyeTransition ? (
            <div className="fixed inset-0 z-fullscreen-page bg-background flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />
              <Card className="w-full max-w-md z-10 shadow-2xl border-border/50 bg-background">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Tes Mata Kiri Selesai</CardTitle>
                  <CardDescription>
                    Siap untuk melanjutkan ke pengujian mata kanan?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
                  <p>
                    1. Pindahkan penutup mata Anda. Tutup **Mata Kiri** Anda menggunakan telapak tangan Anda.
                  </p>
                  <p>
                    2. Pastikan mata kanan Anda fokus ke layar dengan jarak sekitar **40 cm**.
                  </p>
                  <p>
                    3. Klik tombol di bawah ini ketika Anda sudah siap untuk memulai.
                  </p>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      engineRef.current = null;
                      setEngineReady(false);
                      setShowRightEyeTransition(false);
                      setStep(1);
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => {
                      startEye("right");
                      setShowRightEyeTransition(false);
                    }}
                    className="flex-1"
                  >
                    Mulai Mata Kanan
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <>
              {/* Center Stage Area */}
              <main className="flex-1 relative overflow-hidden z-10 flex flex-col items-center justify-center p-4 gap-4">
                {/* ETDRS Line & Progress Indicator */}
                {(() => {
                  const state = engineRef.current?.getState();
                  const logMAR = state?.logMAR ?? 1.0;
                  const letterInLine = state?.letterInLine ?? 1;
                  const lineCorrectCount = state?.lineCorrectCount ?? 0;
                  return (
                    <div className="flex items-center gap-2 text-xs font-mono bg-background/80 backdrop-blur border border-border/50 px-4 py-1.5 rounded-full shadow-sm">
                      <span className="font-semibold text-foreground">
                        Visus Baris: {toSnellenSix(logMAR)} ({toSnellenFraction(logMAR)})
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Huruf {letterInLine} / 5
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {lineCorrectCount} / 5 Benar
                      </Badge>
                    </div>
                  );
                })()}

                <div className="relative w-full max-w-lg aspect-square bg-white dark:bg-black rounded-3xl border border-border/50 shadow-2xl flex items-center justify-center select-none p-8">
                  {(() => {
                    const logMAR = engineRef.current?.getState().logMAR ?? 1.0;
                    const raw = computeLetterPxPhysical(
                      effDistanceMm,
                      effPxPerMm,
                      logMAR,
                      {
                        minPx: 8,
                        maxPx: 350,
                      }
                    );
                    const size = Number.isFinite(raw) && raw > 0 ? raw : 40;
                    return (
                      <div
                        style={{ fontSize: `${size}px` }}
                        className="font-optician font-normal leading-none text-black dark:text-white transition-all duration-200 uppercase tracking-normal"
                        role="img"
                        aria-label={`Huruf uji ${letterChar}`}
                      >
                        {letterChar}
                      </div>
                    );
                  })()}
                </div>
              </main>

              {/* Bottom Control Panel: 4 Objective Multiple-Choice Buttons */}
              <footer className="w-full border-t border-border bg-background p-4 z-footer shrink-0">
                <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Eye guide */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={currentSide === "left" ? "default" : "destructive"} className="text-xs shrink-0">
                      {currentSide === "left" ? "MATA KIRI" : "MATA KANAN"}
                    </Badge>
                    <p className="text-sm font-medium text-foreground hidden md:block">
                      Pilih huruf yang Anda lihat di layar:
                    </p>
                  </div>

                  {/* Right: 4 Objective Option Buttons + 'Tidak Terlihat' Button */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <div className="grid grid-cols-4 gap-2.5 w-full sm:w-auto sm:min-w-[340px]">
                      {options.map((opt) => (
                        <Button
                          key={opt}
                          variant="outline"
                          size="lg"
                          className="h-14 text-2xl font-optician font-bold hover:bg-primary hover:text-primary-foreground transition-all border-border/80"
                          onClick={() => handleSelectOption(opt)}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border/40"
                      onClick={() => handleSelectOption("__UNREADABLE__")}
                    >
                      Huruf Tidak Terlihat / Buram
                    </Button>
                  </div>
                </div>
              </footer>
            </>
          )}
        </div>
      )}

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

        {/* Step 1: Calibration & Instructions */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Kalibrasi & Petunjuk Tes (Standar 2 Meter)</CardTitle>
              <CardDescription>
                Pengujian visus digital dilakukan pada jarak 2 Meter menggunakan huruf standar Snellen (Optician Sans).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed text-foreground">
              {/* Screen Calibration Box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-base">
                    1. Kalibrasi Ukuran Layar (KTP / Kartu Kredit)
                  </h3>
                  <Badge variant="outline" className="text-xs font-mono">
                    {Math.round(pxPerMm * 25.4)} PPI
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tempelkan kartu KTP / ATM fisik ke layar, lalu geser slider di bawah hingga kotak biru pas persis dengan lebar kartu Anda (85,6 mm).
                </p>

                {/* Simulated Credit Card box */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div
                    style={{ width: `${cardPx}px`, height: `${cardPx / 1.586}px` }}
                    className="border-2 border-dashed border-primary bg-primary/10 rounded-lg flex flex-col items-center justify-center transition-all duration-75 text-center p-2"
                  >
                    <span className="text-xs font-semibold text-primary">KTP / Kartu Fisik</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{cardPx} px (85.6 mm)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Sesuaikan Lebar Kartu</span>
                    <span>{cardPx} px</span>
                  </div>
                  <input
                    type="range"
                    min={180}
                    max={500}
                    value={cardPx}
                    onChange={(e) => setCardPx(Number(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    aria-label="Pengatur ukuran kartu kalibrasi piksel"
                  />
                </div>

                <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2 flex justify-between font-mono border border-border/40">
                  <span>Visus 20/20 (6/6) @ 2 Meter:</span>
                  <span className="font-semibold text-foreground">
                    2.91 mm (~{Math.round(computeLetterPxPhysical(2000, effPxPerMm, 0))} px)
                  </span>
                </div>
              </div>

              {/* Instructions list */}
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>Jarak Duduk Wajib:</strong> Ambil jarak tepat <strong>2 Meter (200 cm)</strong> dari monitor komputer Anda.
                </li>
                <li>
                  <strong>Huruf Optotipe Snellen:</strong> Tes menggunakan 9 huruf blok presisi kisi 5×5 (C, D, E, F, L, O, P, T, Z).
                </li>
                <li>
                  <strong>Pemeriksaan Bergantian:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                    <li>Uji <strong>Mata Kiri</strong> terlebih dahulu (tutup mata kanan dengan telapak tangan).</li>
                    <li>Lalu dilanjutkan uji <strong>Mata Kanan</strong> (tutup mata kiri).</li>
                  </ul>
                </li>
                <li>
                  <strong>Cara Menjawab:</strong> Tekan <strong>Terbaca</strong> jika huruf terlihat jelas, atau <strong>Tidak Terbaca</strong> jika buram.
                </li>
              </ol>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Kembali
              </Button>
              <Button
                onClick={() => {
                  startEye("left");
                  setStep(2);
                }}
                className="flex-1"
              >
                Mulai Tes 2 Meter
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    {SYMPTOM_LABELS.map((label, value) => (
                      <Button
                        key={label}
                        type="button"
                        size="sm"
                        className="w-full text-xs sm:text-sm py-2 h-auto"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {EYE_LABEL.left}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {leftResult ? `${leftResult.snellenSix}` : "—"}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">
                      ({leftResult?.snellenFraction ?? "—"})
                    </span>
                  </p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground font-mono">
                      Desimal: {leftResult?.decimal.toFixed(2) ?? "—"}
                    </span>
                    <Badge variant={acuity.left.band === "Normal" ? "outline" : "secondary"}>
                      {acuity.left.band}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {EYE_LABEL.right}
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {rightResult ? `${rightResult.snellenSix}` : "—"}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">
                      ({rightResult?.snellenFraction ?? "—"})
                    </span>
                  </p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                    <span className="text-muted-foreground font-mono">
                      Desimal: {rightResult?.decimal.toFixed(2) ?? "—"}
                    </span>
                    <Badge variant={acuity.right.band === "Normal" ? "outline" : "secondary"}>
                      {acuity.right.band}
                    </Badge>
                  </div>
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

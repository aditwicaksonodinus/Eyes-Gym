"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Maximize2,
  Minimize2,
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
  type AcuityResult,
} from "@/lib/test/acuity";
import {
  CREDIT_CARD_WIDTH_MM,
  cmToMm,
  computeLetterPx,
} from "@/lib/test/calibration";
import { triageAcuity, triage } from "@/lib/test/triage";
import { QUESTIONS } from "@/lib/test/questions";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

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

  // ── Right eye transition confirmation ──────────────────────────────────────
  const [showRightEyeTransition, setShowRightEyeTransition] = React.useState(false);

  // ── Browser fullscreen toggle state ──────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // ── Step 2: acuity engine (per eye) ────────────────────────────────────────
  const engineRef = React.useRef<ReturnType<typeof createAcuityTest> | null>(
    null,
  );
  // Synchronous mirror of the active eye. Updated in lockstep with `engineRef`
  // so eye attribution can never race a re-render.
  const sideRef = React.useRef<EyeSide>("left");
  const [currentSide, setCurrentSide] = React.useState<EyeSide>("left");
  // Mirrors engineRef so the acuity card re-renders once the engine exists.
  const [engineReady, setEngineReady] = React.useState(false);
  const [letterChar, setLetterChar] = React.useState<string>(SLOAN[0]);
  const [leftLogMAR, setLeftLogMAR] = React.useState<number | null>(null);
  const [rightLogMAR, setRightLogMAR] = React.useState<number | null>(null);
  const [leftSnellen, setLeftSnellen] = React.useState<string>("");
  const [rightSnellen, setRightSnellen] = React.useState<string>("");

  const startEye = React.useCallback((side: EyeSide) => {
    engineRef.current = createAcuityTest({ startLogMAR: 1.0 });
    sideRef.current = side;
    setCurrentSide(side);
    setLetterChar(SLOAN[Math.floor(Math.random() * SLOAN.length)]);
    setEngineReady(true);
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
        const side = sideRef.current;
        useAppStore.getState().setEyeResult(side, "phone", {
          snellen: res.snellenFraction,
          distance: effDistanceMm / 1000,
        });
        if (side === "left") {
          setLeftLogMAR(res.logMAR);
          setLeftSnellen(res.snellenFraction);
          setShowRightEyeTransition(true);
        } else {
          setRightLogMAR(res.logMAR);
          setRightSnellen(res.snellenFraction);
          setStep(3);
        }
      } else {
        setLetterChar(SLOAN[Math.floor(Math.random() * SLOAN.length)]);
      }
    },
    [effDistanceMm],
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
    setLeftSnellen("");
    setRightSnellen("");
    setAnswers({});
    setCardPx(200);
    setDistanceCm(40);
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
      {/* Step 2: Fullscreen Acuity Test (Mirroring Gym style) */}
      {step === 2 && engineReady && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Background Stage */}
          <div className="fixed inset-0 bg-secondary/40 dark:bg-secondary/20 z-0 pointer-events-none" />

          {/* Top Header Overlay */}
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 top-0 z-50"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-background/70">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Keluar layar penuh" : "Masuk layar penuh"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Maximize2 className="h-4 w-4" aria-hidden />
                  )}
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </motion.div>

          {/* Constrained letter stage / transition jeda screen */}
          {showRightEyeTransition ? (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
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
              <div className="fixed inset-x-4 top-24 bottom-48 z-10 flex items-center justify-center overflow-hidden">
                <div className="relative w-full max-w-lg aspect-square bg-white dark:bg-black rounded-3xl border border-border/50 shadow-2xl flex items-center justify-center select-none p-8">
                  {(() => {
                    const logMAR = engineRef.current?.getState().logMAR ?? 1.0;
                    const raw = computeLetterPx(
                      effDistanceMm,
                      effPxPerMm,
                      logMAR,
                      {
                        basePx: 28,
                        minPx: 12,
                        maxPx: 350,
                      }
                    );
                    const size = Number.isFinite(raw) && raw > 0 ? raw : 80;
                    return (
                      <div
                        style={{ fontSize: `${size}px` }}
                        className="font-mono font-bold leading-none text-black dark:text-white transition-all duration-200"
                        role="img"
                        aria-label={`Huruf uji ${letterChar}`}
                      >
                        {letterChar}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Panel Overlay */}
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 280, delay: 0.1 }}
                className="fixed inset-x-0 bottom-0 z-50 p-4 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none"
                style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              >
                {/* Left panel: Eye indicator and guide (kiri bawah) */}
                <div className="pointer-events-auto w-full md:w-80 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70">
                  <div>
                    <Badge variant={currentSide === "left" ? "default" : "destructive"} className="mb-1 text-xs">
                      {currentSide === "left" ? "PENGUJIAN: MATA KIRI" : "PENGUJIAN: MATA KANAN"}
                    </Badge>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {currentSide === "left" ? "Tutup Mata Kanan Anda" : "Tutup Mata Kiri Anda"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gunakan mata {currentSide === "left" ? "kiri" : "kanan"} untuk membaca huruf di atas.
                    </p>
                  </div>
                </div>

                {/* Right panel: Action Buttons */}
                <div className="pointer-events-auto w-full md:w-auto rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl dark:bg-background/70 flex gap-3 items-center justify-end">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-initial gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={() => handleAnswer(false)}
                  >
                    Tidak Terbaca
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    className="flex-1 sm:flex-initial gap-2 px-8"
                    onClick={() => handleAnswer(true)}
                  >
                    Terbaca
                  </Button>
                </div>
              </motion.div>
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

        {/* Step 1: Instructions/Petunjuk di Awal */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Petunjuk Tes Ketajaman Mata</CardTitle>
              <CardDescription>
                Ikuti langkah-langkah di bawah ini untuk mendapatkan hasil skrining yang akurat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  <strong>Posisikan Jarak:</strong> Jaga jarak mata Anda sekitar <strong>40 cm</strong> (kira-kira sepanjang satu lengan) dari layar.
                </li>
                <li>
                  <strong>Pemeriksaan Satu Mata:</strong> Tes dilakukan secara mandiri untuk masing-masing mata bergantian.
                </li>
                <li>
                  <strong>Tutup Satu Mata:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Saat menguji <strong>Mata Kiri</strong>: tutup mata kanan Anda menggunakan telapak tangan (tanpa menekan bola mata).</li>
                    <li>Saat menguji <strong>Mata Kanan</strong>: tutup mata kiri Anda.</li>
                  </ul>
                </li>
                <li>
                  <strong>Cara Menjawab:</strong> Sebuah huruf akan muncul di layar.
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Klik <strong>Terbaca</strong> jika Anda dapat mengenali huruf tersebut dengan jelas.</li>
                    <li>Klik <strong>Tidak Terbaca</strong> jika huruf terlihat buram atau tidak terbaca.</li>
                  </ul>
                </li>
                <li>
                  <strong>Ukuran Huruf Bertahap:</strong> Huruf akan otomatis mengecil bertahap untuk mengukur batas ketajaman mata Anda.
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
                Mulai Sekarang
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

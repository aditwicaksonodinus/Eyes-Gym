"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, Sparkles, Brain, Target, MonitorOff, Scan } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/exercise-card";
import {
  EXERCISES,
  getDurationBounds,
  type Exercise,
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


const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

/** Feature items for the education section. */
const FEATURES = [
  {
    icon: Eye,
    title: "Kurangi Kelelahan Mata",
    description:
      "Latihan 1–2 menit membantu otot siliaris rileks setelah sesi layar panjang, mengurangi rasa perih dan berat di kelopak.",
  },
  {
    icon: Brain,
    title: "Cegah Sakit Kepala",
    description:
      "Ketegangan pada otot mata adalah pemicu umum sakit kepala. Senam teratur membantu memutus siklus tegang–nyeri sebelum berlanjut.",
  },
  {
    icon: Target,
    title: "Jaga Fokus Lebih Lama",
    description:
      "Mata yang beristirahat cukup lebih cepat mengunci fokus saat kembali bekerja — produktivitas meningkat tanpa memaksakan diri.",
  },
  {
    icon: MonitorOff,
    title: "Gratis & Tanpa Instalasi",
    description:
      "Semua latihan berjalan langsung di peramban, dari perangkat apa pun. Tidak ada akun, tidak ada unduhan, tidak ada biaya.",
  },
] as const;

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-20 pb-8">
      {/* 1. Hero — asymmetric layout */}
      <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-secondary/60 via-background to-accent/30 px-6 py-14 sm:py-20">
        {/* Subtle ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/8 blur-2xl"
        />

        <div className="relative mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          {/* Left — copy & CTAs */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Latihan mata terpandu, tanpa keluar rumah
            </span>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Jaga kesehatan mata di tengah rutinitas layar
            </h1>
            <p className="max-w-md text-pretty text-lg text-muted-foreground">
              Mata lelah setelah berjam-jam menatap layar? SeeFit membantu
              meredakan ketegangan dengan latihan singkat dari kursimu —
              sepenuhnya di peramban, tanpa instalasi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link href="/test">
                  <Eye className="h-4 w-4" aria-hidden />
                  Mulai Tes Mata
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/exercises">
                  Mulai Latihan
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — icon visual cluster */}
          <div className="relative flex items-center justify-center" aria-hidden>
            {/* Outer ring */}
            <motion.div
              animate={reduceMotion ? {} : { rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute h-64 w-64 rounded-full border border-primary/20"
            />
            <motion.div
              animate={reduceMotion ? {} : { rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="absolute h-48 w-48 rounded-full border border-primary/15 border-dashed"
            />

            {/* Orbiting icon — Scan */}
            <motion.div
              animate={reduceMotion ? {} : { rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute h-64 w-64"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background p-1.5 shadow-md">
                <Scan className="h-4 w-4 text-primary/70" />
              </div>
            </motion.div>

            {/* Orbiting icon — Target (counter-rotate) */}
            <motion.div
              animate={reduceMotion ? {} : { rotate: -360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="absolute h-48 w-48"
            >
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background p-1.5 shadow-md">
                <Target className="h-4 w-4 text-primary/60" />
              </div>
            </motion.div>

            {/* Center eye icon */}
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-primary/25 bg-secondary/60 shadow-xl">
              <motion.div
                animate={reduceMotion ? {} : {
                  scale: [1, 1.08, 1],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Eye className="h-14 w-14 text-primary" strokeWidth={1.25} />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features — 2-col grid (icon+title left, description right) */}
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Mengapa senam mata itu penting
          </h2>
          <p className="text-muted-foreground">
            Digital eye strain nyata — dan bisa dicegah dengan kebiasaan kecil yang konsisten.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              {/* Icon block */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              {/* Text block */}
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Konten ini bersifat edukatif, bukan saran medis. Konsultasikan ke dokter mata jika keluhan berlanjut.
        </p>
      </section>

      {/* 3. Exercise grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Pilihan latihan mata
            </h2>
            <p className="mt-1 text-muted-foreground">
              Enam latihan pilihan untuk meredakan ketegangan mata secara instan.
            </p>
          </div>
          <Button asChild variant="link" className="shrink-0">
            <Link href="/exercises" className="inline-flex items-center gap-1">
              Lihat semua
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <motion.div
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
        >
          {EXERCISES.slice(0, 6).map((ex) => (
            <motion.div
              key={ex.slug}
              variants={reduceMotion ? undefined : cardVariants}
              className="h-full"
            >
              <ExerciseCard
                slug={ex.slug}
                name={NAME_BY_SLUG[ex.slug] ?? ex.slug}
                category={ex.category}
                duration={formatDuration(ex)}
                description={ex.description}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

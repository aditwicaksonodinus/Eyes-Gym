"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExerciseCard } from "@/components/exercise-card";
import {
  EXERCISES,
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

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-20 pb-8">
      {/* 1. Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-secondary/70 to-background px-6 py-16 text-center sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            Latihan mata terpandu, tanpa keluar rumah
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Jaga kesehatan mata di tengah rutinitas layar
          </h1>
          <p className="max-w-xl text-pretty text-lg text-muted-foreground">
            Mata lelah setelah berjam-jam menatap layar? Senam Mata membantu
            meredakan ketegangan dengan latihan singkat dan tes mandiri yang
            berjalan sepenuhnya di peramban Anda.
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
                Mulai Senam Mata
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Education */}
      <section className="mx-auto max-w-3xl space-y-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Mengapa istirahatkan mata itu penting
        </h2>
        <p className="text-pretty text-muted-foreground">
          Digital eye strain muncul ketika mata bekerja terus-menerus tanpa
          jeda—menatap layar menurunkan frekuensi kedip dan memaksa otot mata
          fokus dalam jarak dekat dalam waktu lama. Istirahat singkat memberi
          kesempatan bagi mata untuk rileks dan melembapkan kembali permukaannya.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">8+ jam</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Rata-rata waktu banyak orang di depan layar setiap hari.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">20 detik</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pandangan ke objek jauh setiap 20 menit membantu otot mata rileks.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-3xl font-bold text-primary">10 latihan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Panduan gerakan mata singkat yang bisa dilakukan kapan saja.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Angka di atas bersifat umum dan bukan klaim medis. Jika keluhan mata
          berkelanjutan, konsultasikan ke dokter mata.
        </p>
      </section>

      {/* 3. Exercise carousel */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Pilihan latihan mata
            </h2>
            <p className="mt-1 text-muted-foreground">
              Geser untuk menjelajahi 10 latihan yang tersedia.
            </p>
          </div>
          <Button asChild variant="link" className="hidden shrink-0 sm:inline-flex">
            <Link href="/exercises">Lihat semua</Link>
          </Button>
        </div>

        <motion.div
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
        >
          {EXERCISES.map((ex) => (
            <motion.div
              key={ex.slug}
              variants={reduceMotion ? undefined : cardVariants}
              className="w-[260px] shrink-0 snap-start sm:w-[280px]"
            >
              <ExerciseCard
                slug={ex.slug}
                name={NAME_BY_SLUG[ex.slug] ?? ex.slug}
                category={ex.category}
                duration={formatDuration(ex)}
                description={`Kategori ${CATEGORY_LABEL[ex.category]}.`}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { getExercise } from "@/lib/exercises";

/**
 * Exercise detail pages (`/exercises/[slug]`) use a dedicated layout that
 * deliberately strips the shared Navbar and Footer so the animation stage can
 * fill the full viewport. The root layout's <main> padding is also absent here.
 *
 * Navigation is provided by the TopHeader overlay inside ExerciseDetailClient.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const exercise = getExercise(params.slug);
  const nameMap: Record<string, string> = {
    blinking: "Kedip Cepat",
    "near-far-focus": "Fokus Dekat–Jauh",
    "figure-8": "Angka 8",
    "eye-rolling": "Menggulung Mata",
    "atas-bawah-kiri-kanan": "Atas–Bawah & Kiri–Kanan",
    "zig-zag": "Zig-Zag",
    "diagonal-gaze": "Tatapan Diagonal",
  };
  const displayName = exercise ? (nameMap[exercise.slug] ?? exercise.slug) : "Latihan";
  return {
    title: `${displayName} — Senam Mata`,
    description: `Panduan latihan ${displayName}: animasi gerakan mata, timer, dan instruksi langkah demi langkah.`,
  };
}

export default function ExerciseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // overflow-hidden prevents any scroll on the fullscreen stage
    <div className="fixed inset-0 overflow-hidden">
      {children}
    </div>
  );
}

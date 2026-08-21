import { notFound } from "next/navigation";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { ExerciseDetailClient } from "./exercise-detail-client";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const exercise = getExercise(params.slug);
  if (!exercise) {
    notFound();
  }

  return <ExerciseDetailClient key={params.slug} slug={params.slug} />;
}

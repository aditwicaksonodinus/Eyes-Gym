import { EXERCISES } from "@/lib/exercises";
import { ExerciseDetailClient } from "./exercise-detail-client";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  return <ExerciseDetailClient key={params.slug} slug={params.slug} />;
}

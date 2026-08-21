import Link from "next/link";

export default function Home() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-4xl font-bold text-calm-900 dark:text-calm-50">
        Senam Mata
      </h1>
      <p className="max-w-lg text-lg text-calm-700 dark:text-calm-200">
        Kurangi kelelahan mata akibat menatap layar dengan latihan mata
        terpandu dan pengingat 20-20-20.
      </p>
      <Link
        href="/exercises"
        className="rounded-xl2 bg-calm-600 px-6 py-3 font-medium text-white transition-colors hover:bg-calm-700"
      >
        Mulai Senam Mata
      </Link>
    </section>
  );
}

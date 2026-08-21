import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Senam Mata — Latihan Kesehatan Mata untuk Pekerja Layar",
  description:
    "Kurangi kelelahan mata akibat menatap layar dengan latihan mata terpandu, tes mandiri, dan pengingat 20-20-20.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen font-sans text-calm-900 antialiased dark:text-calm-50">
        <ThemeProvider>
          <main className="mx-auto max-w-6xl px-4">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}

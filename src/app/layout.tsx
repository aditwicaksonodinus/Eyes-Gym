import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ReminderGate from "@/components/reminder-gate";
import OrientationGate from "@/components/orientation-gate";

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
      <body className="flex min-h-screen flex-col font-sans text-foreground antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
          <Footer />
          <ReminderGate />
          <OrientationGate />
        </ThemeProvider>
      </body>
    </html>
  );
}

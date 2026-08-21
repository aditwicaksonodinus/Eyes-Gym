import type { Metadata } from "next";
import "../globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ReminderGate from "@/components/reminder-gate";
import OrientationGate from "@/components/orientation-gate";

export const metadata: Metadata = {
  title: "Tes Mata — Senam Mata",
  description: "Tes mandiri ketajaman mata, ditampilkan dalam tampilan full‑width 16:9.",
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans text-foreground antialiased">
        <ThemeProvider>
          <Navbar />
          {/* Override max‑width for this route */}
          <main className="mx-auto w-full flex-1 overflow-x-hidden px-4 py-8">
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

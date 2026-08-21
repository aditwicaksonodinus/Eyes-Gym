import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import OrientationGate from "@/components/orientation-gate";

export const metadata: Metadata = {
  title: "Senam Mata — Latihan Kesehatan Mata untuk Pekerja Layar",
  description:
    "Kurangi kelelahan mata akibat menatap layar dengan latihan mata terpandu, tes mandiri, dan pengingat 20-20-20.",
};

/**
 * Root layout — hanya menyediakan:
 * - <html> dan <body> dengan font/warna dasar
 * - ThemeProvider (dark mode untuk seluruh app)
 * - OrientationGate (global overlays)
 *
 * Navbar dan Footer TIDAK ada di sini — masing-masing route group yang membutuhkan
 * menambahkan sendiri:
 *   - (main)/layout.tsx  → Navbar + Footer + <main> padding
 *   - (fullscreen)/layout.tsx → tanpa Navbar/Footer, konten mengisi penuh viewport
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans text-foreground antialiased">
        <ThemeProvider>
          {children}
          <OrientationGate />
        </ThemeProvider>
      </body>
    </html>
  );
}


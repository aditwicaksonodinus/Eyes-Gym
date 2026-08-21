/**
 * Layout untuk semua halaman /exercises/* (daftar, detail slug, session).
 *
 * Sengaja TIDAK menyertakan Navbar dan Footer — halaman latihan menggunakan
 * navigasi internal (TopHeader di detail, tombol kembali di session).
 *
 * ThemeProvider, ReminderGate, dan OrientationGate sudah ada di root layout —
 * tidak perlu diulang di sini. Layout ini cukup menjadi "pass-through" yang
 * memastikan konten exercises tidak mendapat Navbar/Footer dari root.
 */
export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tidak ada Navbar/Footer — konten exercises mengisi viewport sesuai kebutuhan.
  return <>{children}</>;
}

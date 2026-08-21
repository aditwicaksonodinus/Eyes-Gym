# Spesifikasi Proyek: Web Senam Mata (Digital Eye Strain Relief)

## 1. Latar Belakang
Digital eye strain / Computer Vision Syndrome (CVS) adalah kondisi kelelahan mata akibat menatap layar terlalu lama, ditandai dengan mata kering, buram, sakit kepala, dan tegang pada otot mata. Solusi yang direkomendasikan ahli mata (AAO, WebMD, Healthline, Optometrists.org) berbasis pada rutinitas relaksasi dan latihan otot ekstraokular (extraocular muscles) secara berkala.

## 2. Riset Gerakan/Latihan Mata

| Gerakan                            | Cara Melakukan                                                                                                             | Durasi/Repetisi         | Manfaat                                                                                                       |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------|-------------------------|---------------------------------------------------------------------------------------------------------------|
| 20-20-20 Rule                      | Setiap 20 menit, lihat objek sejauh ±6 meter (20 kaki) selama 20 detik                                                     | 20 detik, tiap 20 menit | Standar yang direkomendasikan American Academy of Ophthalmology (AAO), mengurangi kelelahan fokus jarak dekat |
| Palming                            | Gosok telapak tangan hingga hangat, tutup mata tertutup dengan telapak tangan tanpa menekan bola mata, napas dalam         | 30–60 detik             | Relaksasi otot mata & saraf optik                                                                             |
| Blinking cepat                     | Kedip cepat 15–20 kali, lalu tutup mata 10 detik, ulangi 3x                                                                | 3 set                   | Melembapkan mata, mencegah dry eye (frekuensi kedip turun drastis saat menatap layar)                         |
| Near-Far Focus                     | Fokus ke ibu jari/objek ±15 cm dari wajah (10–15 detik), lalu fokus ke objek jauh ±6 meter (10–15 detik)                   | 10 repetisi             | Melatih otot siliaris untuk akomodasi fokus                                                                   |
| Figure-8 Tracing                   | Bayangkan angka 8 besar sejauh ±3 meter, telusuri dengan gerakan mata (kepala tetap diam) selama 30 detik, lalu balik arah | 30 detik x2 arah        | Melatih fleksibilitas otot ekstraokular                                                                       |
| Eye Rolling (Rotasi Bola Mata)     | Gulirkan mata searah jarum jam, lalu berlawanan arah, tanpa gerakan kepala                                                 | 5–8x per arah           | Melatih seluruh otot penggerak bola mata                                                                      |
| Gerakan Atas-Bawah & Kiri-Kanan    | Gerakan mata perlahan ke atas–bawah, lalu kiri–kanan (mata bisa terbuka/tertutup)                                          | 3 repetisi per arah     | Peregangan otot vertikal & horizontal mata                                                                    |
| Pencil/Thumb Push-up (Konvergensi) | Rentangkan lengan dengan pensil/ibu jari, fokus sambil mendekatkan ke hidung sampai terlihat ganda, lalu kembali           | 5–10 repetisi           | Melatih konvergensi & otot rektus medial                                                                      |
| Zig-Zag Eye Movement               | Gerakkan mata mengikuti pola zig-zag di ruangan/imajiner                                                                   | 30 detik                | Variasi latihan fleksibilitas otot mata                                                                       |
| Diagonal Gaze                      | Gerakkan mata ke pojok kanan atas lalu ke pojok kiri bawah secara diagonal, ulangi arah sebaliknya                         | 5–8 repetisi per arah   | Melatih otot oblik mata                                                                                       |

Sumber: rangkuman dari Medical News Today, WebMD, Healthline, Optometrists.org, dan cabvi.org [web:1][web:2][web:3][web:8][web:9].

## 3. Referensi Proyek Open Source Sejenis
- **Eye-Workout** (michaelsboost) — MIT license, JS/jQuery, panduan latihan mata step-by-step dengan shortcut keyboard [web:5].
- **EyeCare-Web** (Yippine) — TypeScript, PWA, timer 20-20-20, panduan interaktif, elemen gamifikasi.
- **onlinevisiontest.vercel.app** — contoh implementasi tes mata online (Snellen, Ishihara, peripheral vision) berbasis web modern, cocok jadi rujukan untuk fitur CTA "test mata" [web:29].
- **timbrica.com/en/eye-test** — contoh UX kalibrasi jarak layar & 8 jenis tes visi dalam browser [web:20].

## 4. Struktur Halaman (sesuai ekspektasi)
1. **Landing Page**
   - Hero section: headline kesehatan mata + CTA utama "Mulai Tes Mata" dan CTA sekunder "Mulai Senam Mata"
   - Section edukasi singkat: apa itu digital eye strain, statistik pengguna layar
   - Section preview latihan (card carousel)
   - Footer + link GitHub (open source)
2. **/test** — Tes mata ringan (visual acuity sederhana / self-check kelelahan mata, bukan diagnosis medis, cukup skrining + rekomendasi CTA ke latihan)
3. **/exercises** — Daftar semua latihan (grid card, filter: durasi, kategori: relaksasi/fokus/gerakan)
4. **/exercises/[slug]** — Detail latihan: animasi/ilustrasi panduan, timer countdown, instruksi step-by-step, tombol "Selesai" & "Selanjutnya"
5. **/exercises/session** — Mode sesi lengkap (playlist latihan berurutan, mirip guided workout)
6. **Responsive khusus mobile**: reminder push notification / vibration cue untuk latihan saat di HP.

## 5. Tech Stack Rekomendasi

| Layer               | Pilihan                                                                                   | Alasan                                                                                      |
|---------------------|-------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| Framework           | Next.js 14+ (App Router)                                                                  | Sesuai requirement, SSR/SSG untuk SEO landing page kesehatan                                |
| Styling             | Tailwind CSS + shadcn/ui                                                                  | Modern, cepat prototyping, konsisten dengan tema "kesehatan" (soft color, rounded, calming) |
| Animasi             | Framer Motion                                                                             | Untuk animasi gerakan mata (bola mata bergerak, figure-8, dsb) secara visual                |
| Ilustrasi panduan   | Lottie (lottie-react) atau SVG animasi custom                                             | Panduan visual gerakan mata yang smooth tanpa video berat                                   |
| State/Timer         | Zustand atau React Context + custom hook `useTimer`                                       | Mengelola sesi latihan & countdown antar-halaman                                            |
| Notifikasi          | Web Notifications API + Service Worker (next-pwa)                                         | Reminder 20-20-20 otomatis meski tab background                                             |
| Tes mata            | Komponen custom (Canvas/SVG untuk Snellen chart, kalibrasi via `window.devicePixelRatio`) | Tidak perlu backend, semua client-side                                                      |
| Database (opsional) | Supabase / PostgreSQL + Prisma                                                            | Jika ingin simpan progress/riwayat latihan user                                             |
| Auth (opsional)     | NextAuth.js / Clerk                                                                       | Jika fitur riwayat & personalisasi progres diperlukan                                       |
| Analytics           | Plausible / Umami (privacy-friendly, open source)                                         | Selaras prinsip open source, tanpa Google Analytics                                         |
| Deployment          | Firebase (gratis, native Next.js)                                                         | Otomatis CI/CD dari GitHub                                                                  |
| PWA                 | next-pwa                                                                                  | Agar bisa dipasang di HP & dapat push reminder offline-first                                |
| Testing             | Vitest + Playwright                                                                       | Unit test komponen & E2E test flow CTA                                                      |
| Lisensi             | MIT                                                                                       | Selaras "open source penuh"                                                                 |

## 6. Palet & Nuansa Desain (Rekomendasi)
- Warna dasar: hijau/teal lembut (asosiasi kesehatan & alam, menenangkan mata) dikombinasi putih/abu terang.
- Hindari kontras tinggi/warna neon agar tidak memicu kelelahan mata saat mendemonstrasikan produk kesehatan mata itu sendiri.
- Font: sans-serif dengan letter-spacing nyaman dibaca (misal Inter/Geist), ukuran besar untuk aksesibilitas.
- Dark mode wajib ada (mengurangi silau saat malam), toggle via `next-themes`.

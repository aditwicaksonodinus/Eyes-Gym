# SeeFit

SeeFit adalah aplikasi web open-source untuk membantu mendeteksi gejala kelelahan mata (digital eye strain) dan memulihkannya melalui kumpulan latihan mata terpandu. Aplikasi ini berjalan sepenuhnya di sisi klien (client-side) tanpa memerlukan database atau server eksternal, menjamin privasi penuh bagi penggunanya.

---

## Fitur Utama

- **Kuesioner Gejala Awal**: Diagnosa mandiri awal untuk mendeteksi tingkat kelelahan otot mata sebelum memulai tes visual.
- **Tes Ketajaman Mata Digital**: Skrining visus berbasis grafik Snellen (Optician-Sans) yang dikalibrasi presisi menggunakan objek fisik (seperti KTP/kartu ATM) dan kepadatan piksel layar (device pixel ratio) untuk pengujian jarak 2 meter.
- **10 Latihan Mata Terpandu**: Sesi latihan terstruktur berdasarkan jenis gerakan (Aturan 20-20-20, Palming, Kedip Cepat, Fokus Dekat-Jauh, Gerakan Angka 8, Putar Mata, Atas-Bawah & Kiri-Kanan, Pencil Push-up, Zig-zag, dan Diagonal Gaze).
- **Mode Sesi Penuh (Playlist)**: Mode latihan berurutan otomatis (playlist guided workout) untuk memandu latihan mata secara komprehensif.
- **Progressive Web App (PWA)**: Aplikasi dapat diinstal langsung di perangkat desktop atau seluler melalui dukungan caching service worker untuk penggunaan luring (offline).
- **Pengingat Berkala 20-20-20**: Notifikasi terjadwal menggunakan Web Notifications API untuk mengingatkan pengguna mengistirahatkan mata setiap 20 menit saat aplikasi berjalan di latar belakang.

---

## Tumpukan Teknologi (Tech Stack)

Aplikasi SeeFit dibangun dengan menggunakan teknologi modern berikut:
- **Kerangka Kerja**: Next.js 14+ (App Router, Static Site Generation)
- **Bahasa Pemrograman**: TypeScript
- **Styling & UI**: Tailwind CSS dan shadcn/ui
- **Animasi**: Framer Motion
- **Manajemen State**: Zustand
- **PWA Integration**: Serwist (`@serwist/next`)

Untuk penjelasan mendalam mengenai desain arsitektur, pemisahan lapisan logika murni, dan struktur penyimpanan data, silakan baca [ArsitekturSeeFit.md](./ArsitekturSeeFit.md).

---

## Persiapan Instalasi (Prerequisites)

Sebelum menjalankan aplikasi secara lokal, pastikan Anda telah menginstal perangkat lunak berikut:
- Node.js versi 20.19.0 atau yang lebih baru
- npm (Node Package Manager)

---

## Cara Menjalankan Aplikasi

Ikuti langkah-langkah di bawah ini untuk memasang dan menjalankan aplikasi SeeFit di komputer lokal Anda:

### 1. Klon Repositori
```bash
git clone https://github.com/aditwicaksonodinus/Eyes-Gym.git
cd Eyes-Gym
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser Anda dan akses halaman `http://localhost:3000`.

### 4. Build untuk Produksi
Untuk mengompilasi dan mengoptimalkan aplikasi untuk rilis produksi:
```bash
npm run build
npm run start
```

---

## Pengujian (Testing)

Proyek ini menggunakan Vitest untuk unit testing dan Playwright untuk pengujian end-to-end (E2E):

### Menjalankan Unit Tests (Vitest)
```bash
npx vitest run
```

### Menjalankan Pengujian E2E (Playwright)
```bash
npx playwright test
```

### Memeriksa Validasi Tipe TypeScript
```bash
npx tsc --noEmit
```

---

## Struktur Direktori Proyek

```
.
├── src/
│   ├── app/                 # Halaman utama Next.js (App Router)
│   │   ├── (main)/          # Rute dengan Navbar dan Footer (Home, Test)
│   │   └── (fullscreen)/    # Rute fullscreen untuk sesi latihan
│   ├── components/          # Komponen UI (shadcn, navbar, panggung gerakan)
│   ├── lib/                 # Logika bisnis murni (Snellen, kalkulator visus)
│   │   ├── gym/             # Logika latihan dan mesin state murni
│   │   └── test/            # Logika pengujian ketajaman visual
│   └── store/               # Zustand global store untuk riwayat tes
├── public/                  # Aset statis (font, gambar, ikon PWA)
├── e2e/                     # Skrip tes Playwright E2E
├── tailwind.config.ts       # Konfigurasi Tailwind CSS
└── vercel.json              # Konfigurasi deploy ke platform Vercel
```

---

## Kontribusi

Kami sangat menyambut kontribusi dari komunitas untuk menyempurnakan aplikasi SeeFit. Jika Anda ingin berkontribusi:

1. Buat branch fitur baru (`git checkout -b fitur/fitur-baru`).
2. Tulis kode Anda dan pastikan seluruh pengujian berjalan dengan sukses (`npm run build` dan `npx vitest run`).
3. Lakukan komit perubahan dengan pesan komit yang jelas.
4. Push ke branch Anda (`git push origin fitur/fitur-baru`).
5. Buka Pull Request di repositori ini.

---

## Informasi Penting Medis (Disclaimer)

Tes mata mandiri di dalam aplikasi SeeFit hanya berfungsi sebagai alat skrining awal dan pencegahan kelelahan mata. Hasil tes bukan merupakan diagnosis medis formal. Jika Anda mengalami keluhan penglihatan yang memburuk atau berkelanjutan, segera konsultasikan ke dokter spesialis mata (oftalmologis) atau optometris profesional untuk pemeriksaan menyeluruh.

---

## Lisensi

Proyek ini dilisensikan di bawah lisensi MIT. Informasi selengkapnya dapat ditemukan pada berkas [LICENSE](./LICENSE).

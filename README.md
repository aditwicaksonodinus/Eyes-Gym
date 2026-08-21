# Senam Mata

Aplikasi web untuk meredakan kelelahan mata akibat layar (digital eye strain). Senam Mata menggabungkan tes mata mandiri (self-check) dan kumpulan latihan mata terpandu, semuanya berjalan di peramban tanpa perlu server.

## Fitur

- **5 halaman utama**
  - `/` — beranda: hero, CTA "Mulai Tes Mata" & "Mulai Senam Mata", section edukasi, carousel kartu latihan, footer dengan tautan GitHub.
  - `/test` — tes mata mandiri (self-check): kartu Snellen berbasis Canvas/SVG yang dikalibrasi via `window.devicePixelRatio`, ditambah kuesioner singkat. Skrining saja, bukan diagnosis medis.
  - `/exercises` — daftar latihan dalam grid kartu, dengan filter durasi dan kategori (relaksasi / fokus / gerakan).
  - `/exercises/[slug]` — detail latihan: panduan animasi/ilustrasi, timer hitung mundur, instruksi langkah demi langkah, tombol "Selesai" & "Selanjutnya".
  - `/exercises/session` — mode sesi penuh (playlist latihan berurutan, seperti guided workout).
- **10 latihan** berdasarkan spesifikasi: 20-20-20, Palming, Kedip Cepat (Blinking), Near-Far Focus, Figure-8, Eye Rolling, Gerakan Atas-Bawah & Kiri-Kanan, Pencil Push-up, Zig-Zag, dan Diagonal Gaze.
- **Tes mata self-check**: ketajaman visual sederhana (Snellen) + kuesioner kelelahan mata. Hasil berupa skrining dan rekomendasi ke latihan, bukan diagnosis medis.
- **PWA yang dapat dipasang** (installable) via `@serwist/next`, lengkap dengan service worker.
- **Pengingat 20-20-20**: notifikasi Web Notifications + getaran (vibration) di perangkat mobile.

## Cara Menjalankan

```bash
npm install
npm run dev      # buka http://localhost:3000
npm run build
npm run start
```

## Testing

```bash
npx vitest run        # unit test
npx playwright test   # E2E test
npx tsc --noEmit      # cek tipe TypeScript
```

## PENTING: Batasan Pengingat 20-20-20

Pengingat notifikasi 20-20-20 **hanya berjalan saat tab terbuka** (termasuk saat tab berada di latar belakang / background). Notifikasi tidak akan muncul ketika tab atau peramban ditutup sepenuhnya, karena aplikasi ini tidak memiliki push-server. Pastikan tab Senam Mata tetap terbuka agar pengingat aktif.

## Catatan

- Sepenuhnya **client-side**. Tidak ada backend, tidak ada database, dan tidak ada Google Analytics.
- Analytics privasi (Plausible/Umami) bersifat opsional dan **belum dihubungkan di v1**.
- Tes mata hanya untuk skrining. Jika Anda mengalami keluhan mata berkelanjutan, **konsultasikan ke dokter mata (optalmologis)**. Aplikasi ini tidak menggantikan saran medis profesional.

## Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Lihat berkas [`LICENSE`](./LICENSE).

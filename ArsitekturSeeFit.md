# Arsitektur Aplikasi SeeFit

Dokumen ini menjelaskan arsitektur perangkat lunak, tumpukan teknologi (tech stack), dan pola desain yang digunakan dalam pengembangan aplikasi SeeFit.

---

## 1. Tumpukan Teknologi (Tech Stack)

SeeFit dibangun menggunakan ekosistem Next.js modern yang berfokus pada performa client-side dan keringanan rendering.

- **Framework Utama**: Next.js 14+ (App Router). Menggunakan rendering statis (Static Site Generation / SSG) untuk performa instan karena seluruh fitur berjalan di sisi klien (client-side).
- **Pemrograman**: TypeScript. Menjamin keamanan tipe data selama kompilasi dan mempercepat proses deteksi bug.
- **Styling**: Tailwind CSS dan shadcn/ui. Menyediakan kerangka visual dengan kegunaan kelas (utility classes) dan komponen dasar terstandardisasi yang mudah disesuaikan.
- **Animasi Pengarah Mata**: Framer Motion. Digunakan untuk merender gerakan pengarah mata secara halus dengan menggunakan akselerasi GPU (transform translate) untuk meminimalkan beban CPU.
- **Manajemen State**: Zustand dan Custom React Hooks. Zustand digunakan untuk menyimpan riwayat kuesioner dan hasil tes mata secara global di browser, sedangkan custom hooks (`useTimer`) mengelola siklus waktu lokal.
- **PWA (Progressive Web App)**: `@serwist/next`. Menyediakan service worker untuk caching aset statis secara luring (offline) dan mendukung instalasi aplikasi di perangkat seluler/desktop.
- **Testing**:
  - **Vitest**: Unit testing berkecepatan tinggi untuk logika murni (pure logic) dan mesin state (state machine).
  - **Playwright**: End-to-End (E2E) testing untuk menyimulasikan interaksi pengguna secara nyata di browser.

---

## 2. Struktur Arsitektur Frontend (Pemisahan Tanggung Jawab)

SeeFit menerapkan pemisahan tanggung jawab (Separation of Concerns) yang ketat untuk memudahkan pengujian unit (unit testing) dan pemeliharaan jangka panjang.

### 2.1 Lapisan Logika Murni (Pure Logic Layer)
Seluruh kalkulasi matematis, pemrosesan Snellen, dan mesin logika tidak memiliki ketergantungan (dependencies) pada React atau DOM.
- **`src/lib/test/`**:
  - `acuity.ts`: Algoritma perhitungan ketajaman visual berdasarkan LogMAR.
  - `calibration.ts`: Algoritma kalibrasi ukuran piksel layar fisik menggunakan ukuran kartu standar (85.6 mm).
  - `triage.ts`: Logika skrining gejala dan ketajaman mata untuk menentukan rekomendasi latihan atau rujukan ke dokter.
- **`src/lib/gym/`**:
  - `detailMachine.ts`: Mesin state murni (pure state machine) untuk mengelola status latihan (idle, running, paused, done) dan siklus repetisi.
  - `eyeMotion.ts`: Generator koordinat keyframe untuk gerakan pengarah mata.

### 2.2 Lapisan Penyimpanan State (State & Store Layer)
- **`src/store/appStore.ts`**: Menggunakan Zustand dengan persistensi lokal (LocalStorage) untuk menyimpan riwayat kuesioner, hasil tes ketajaman mata, dan nilai metrik pengguna tanpa memerlukan server database eksternal.

### 2.3 Lapisan Visual & Presentasi (UI Layer)
- **`src/components/`**: Komponen UI reusable seperti `EyeStage` (panggung animasi gerakan mata), `Navbar`, dan komponen primitif dari shadcn/ui.
- **`src/app/`**: Struktur halaman Next.js. Dibagi menjadi dua kelompok layout utama:
  - `(main)`: Halaman yang memiliki navigasi standar (Navbar dan Footer), seperti beranda (`/`) dan halaman tes (`/test`).
  - `(fullscreen)`: Halaman latihan yang memaksimalkan area layar untuk meminimalkan gangguan visual saat pengguna melakukan senam mata.

---

## 3. Alur Data & State Latihan

Alur kerja mesin latihan dikelola secara deterministik menggunakan injeksi waktu:

```
[UI Trigger: Mulai] -> [useTimer Start] -> [detailMachine Start]
                                                   |
                                            (Setiap Detik)
                                                   v
[UI Render Target]  <- [EyeStage Update] <- [detailMachine Tick]
```

1. **Pemicu Mulai**: Pengguna menekan tombol "Mulai". Komponen `exercise-detail-client` memanggil `timer.start()`.
2. **Sinkronisasi Detik**: Setiap detik berlalu, timer lokal memicu `machine.tick()`.
3. **Pembaruan Repetisi**: Ketika durasi satu repetisi tercapai (misal, 8 detik untuk latihan Atas-Bawah Kiri-Kanan), mesin state mencatat selesainya repetisi tersebut dan meningkatkan `repVersion`.
4. **Re-mount Animasi**: Perubahan `repVersion` memicu re-mount komponen animasi pada `EyeStage` secara terkontrol untuk memulai ulang siklus koordinat gerakan dari titik pusat.

---

## 4. Progressive Web App (PWA) & Notifikasi

SeeFit dirancang untuk bekerja secara luring dan memberikan pengingat terjadwal.

### 4.1 Caching Service Worker
Melalui `@serwist/next`, aset statis (HTML, CSS, JS, font, gambar) dicache dengan strategi Cache-First. File `sw.ts` mendaftarkan rute khusus untuk service worker, memastikan aplikasi dapat dimuat dalam waktu kurang dari satu detik pada kunjungan berikutnya.

### 4.2 Pengingat Aturan 20-20-20
- **Mekanisme**: Menggunakan Web Notifications API untuk mengirimkan pemberitahuan kepada pengguna agar mengistirahatkan mata setiap 20 menit selama 20 detik.
- **Keterbatasan Tanpa Server**: Karena aplikasi ini berjalan penuh di sisi klien, notifikasi hanya dapat dikirimkan jika tab aplikasi SeeFit tetap terbuka di browser (meskipun browser diminimalkan atau tab berada di latar belakang).

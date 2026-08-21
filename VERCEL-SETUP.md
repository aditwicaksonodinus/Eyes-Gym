Panduan singkat: Menyeting Project di Vercel

1) Import project
- Masuk ke https://vercel.com, Import Project → pilih repository "aditwicaksonodinus/Eyes-Gym".
- Vercel akan otomatis mendeteksi Next.js (Next 14+).

2) Build & Install
- Build command: npm run build
- Install command: npm install
- Output: Default Next.js; tidak perlu mengubah.

3) Environment Variables (disarankan)
- Buka Project → Settings → Environment Variables
- Tambahkan variabel dari `.env.example` yang relevan. Gunakan nilai produksi untuk `Production`.
- Contoh: KEY=VALUE, scope: Production/Preview/Development sesuai kebutuhan.

4) Domain / Canonical
- Tambahkan custom domain di Vercel → Domains.
- Untuk canonical (www → apex) gunakan pengaturan domain di Vercel: pilih domain utama dan tandai sebagai Primary.

5) Service Worker & PWA
- vercel.json sudah menyertakan header cache untuk `/sw.js`.
- Jika ingin fallback / custom routes, tambahkan redirect/rewrites di vercel.json.

6) Troubleshooting
- Lihat Build Logs di Vercel untuk error. Common fix: jalankan `npm ci` lalu `npm run build` lokal.
- Jika butuh variabel secret (private key), gunakan Vercel Environment Variable dengan scope "Production".

Butuh saya tambahkan redirects/rewrites default di vercel.json sekarang? Jika ya, pilih opsi selanjutnya: simple route redirects (/home, /index.html), domain canonical (www → apex — but requires domain name), atau tidak usah.
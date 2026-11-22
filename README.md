# PustakaKita v2.0 — Sistem Manajemen Pustaka & Benchmark Algoritma (1.000 – 10.000 Data)

Aplikasi web Single Page Application (SPA) berbasis **React + TypeScript + Vite + Tailwind CSS** untuk manajemen katalog perpustakaan digital skala besar, sirkulasi peminjaman/pengembalian buku, backup/restore JSON, serta laboratorium interaktif untuk pengujian performa algoritma **Searching** & **Sorting** murni pada dataset **1.000 hingga 10.000 entri buku**.

## Fitur Utama v2.0

1. **Seed Otomatis 1.000 Buku Unik (`src/data/bookGenerator.ts`)**
   - Ketika `localStorage` masih kosong, aplikasi otomatis membangkitkan **1.000 buku unik** (ISBN-13 `978-602-XXXXXXX` & judul unik) beserta **3 transaksi sirkulasi awal**.
   - Mendukung pergantian preset katalog langsung ke **1.000**, **5.000**, atau **10.000** buku unik.
2. **Dashboard Operasional (`/`)**
   - 4 Kartu KPI: Total Judul Buku (default `1.000`), Total Eksemplar, Sedang Dipinjam, dan Terlambat + Estimasi Denda.
   - Grafik distribusi 5 kategori buku, tren sirkulasi 7 hari terakhir, dan ringkasan hasil benchmark terakhir.
3. **Katalog Buku dengan Pagination (`#/katalog`)**
   - Pagination aktif (`25` / `50` / `100` buku per halaman) agar rendering 1.000–10.000 buku tetap ringan.
   - Pencarian real-time dengan pilihan algoritma **Linear Search $O(n)$** vs **Binary Search $O(\log n)$** beserta metrik waktu (`ms`) dan perbandingan.
   - Pengurutan menggunakan **Quick Sort**, **Merge Sort**, atau **Insertion Sort** murni + CRUD buku lengkap.
4. **Sirkulasi & Denda (`#/sirkulasi`)**
   - Peminjaman (proteksi stok habis, tenggat `+7 hari`) dan pengembalian otomatis dengan denda keterlambatan `Rp 2.000/hari`.
5. **Laboratorium Benchmark Algoritma (`#/benchmark`)**
   - Pengujian skala **1.000 (Minimal)**, **5.000 (Menengah)**, **10.000 (Maksimal)**, serta tombol **Run Full Benchmark (1.000 → 5.000 → 10.000)**.
   - Kondisi data awal: **Random Order**, **Reversed Order**, dan **Nearly Sorted**.
   - `quickSort` menggunakan pivot **median-of-three** + eliminasi tail recursion sehingga aman untuk 10.000 data terurut/terbalik tanpa stack overflow.
   - Matriks pencarian 4 posisi (Awal, Tengah, Akhir/Worst-Case, Tidak Ditemukan) + visualisasi pointer `low-mid-high` Binary Search.
   - Ekspor laporan hasil pengujian ke **CSV** dan **JSON**.

## Pengujian & Build Produksi

```bash
cd pustakakita
npm install
npm test -- --run
npm run build
```

Hasil build produksi tersedia di direktori `dist/` dengan konfigurasi `base: './'` di `vite.config.ts` untuk deployment langsung ke **GitHub Pages**.

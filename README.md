# Sistem Prestasi Siswa — Sekolah Nurul Insan

Aplikasi web **Sistem Prestasi Siswa** untuk jenjang **SD, SMP, dan SMA Nurul Insan** dalam Bahasa Indonesia. Aplikasi ini dirancang untuk mencatat, memverifikasi, menghitung poin secara otomatis, menyusun portofolio tiap siswa, menampilkan peringkat, serta menghasilkan laporan tahunan sekolah berbantuan AI Gemini.

## Fitur Utama

- **Autentikasi & Kontrol Peran (RBAC)**
  - **Admin Sekolah**: mengelola seluruh data siswa, prestasi, matriks poin, peran pengguna, laporan tahunan, serta memantau log audit.
  - **Guru / Pembina**: mencatat, memperbaiki, memverifikasi (*Disetujui* / *Ditolak* dengan alasan), dan membatalkan prestasi dengan catatan alasan wajib.
  - **Siswa**: melihat profil dan portofolio prestasinya sendiri serta mengajukan prestasi baru untuk diverifikasi.
  - **Kepala Sekolah**: memantau dashboard, profil siswa (baca-saja), peringkat, dan laporan tahunan sekolah.
- **Data Siswa & Data Contoh**
  - Menyimpan NIS, nama lengkap, jenjang (SD/SMP/SMA), kelas, jenis kelamin, foto profil terkompresi, dan status aktif.
  - Dilengkapi **15 siswa contoh** dan **30 prestasi contoh** yang otomatis dimuat saat Admin pertama kali masuk.
- **Input & Verifikasi Prestasi + Log Audit**
  - Mendukung kategori (*Akademik, Olahraga, Seni, Keagamaan, Teknologi, Kepemimpinan, Lainnya*), tingkat (*Sekolah* hingga *Internasional*), peringkat (*Juara 1–3, Harapan, Finalis, Peserta*), tanggal, tahun ajaran, penyelenggara, dan unggah foto bukti sertifikat/piala.
  - Prestasi yang sudah **Disetujui** tidak dapat dihapus, hanya dapat diubah menjadi **Dibatalkan** dengan alasan wajib, dan setiap perubahan tercatat di **Log Audit** permanen.
- **Sistem Poin Otomatis & Peringkat**
  - Poin dihitung otomatis dari matriks tingkat dan peringkat yang dapat diubah oleh Admin pada menu **Pengaturan > Tabel Poin**.
  - Leaderboard **Siswa** dan **Kelas** dapat difilter berdasarkan Tahun Ajaran, Jenjang, Kategori, dan Tingkat.
- **Portofolio Siswa, Dashboard, & Laporan**
  - Profil siswa memuat total poin, jumlah prestasi, peringkat, grafik per kategori, cetak langsung, dan unduh **Portofolio PDF**.
  - Dashboard memuat KPI utama, grafik per kategori & tingkat, serta 5 prestasi terbaru.
  - Halaman Laporan menyediakan rekap per tahun ajaran, kelas, dan kategori dengan ekspor **Excel (CSV UTF-8)**, **Unduh PDF**, dan **Cetak**.
- **Fitur AI (Gemini di Sisi Server)**
  - **Buat narasi prestasi**: menyusun paragraf formal untuk catatan rapor atau surat rekomendasi.
  - **Saran pembinaan**: menghasilkan 3 rekomendasi pengembangan bakat berdasarkan pola prestasi siswa.
  - **Ringkasan sekolah**: menyusun ringkasan eksekutif capaian prestasi satu tahun ajaran untuk laporan Kepala Sekolah.
  - Seluruh hasil AI dapat disunting sebelum disimpan ke database atau dicetak ke PDF.

## Arsitektur & Teknologi

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, jsPDF + jsPDF-AutoTable.
- **Backend**: Express (`server.ts`) sebagai host aplikasi serta proxy aman untuk seluruh panggilan `@google/genai` (`/api/ai/narasi`, `/api/ai/pembinaan`, `/api/ai/ringkasan`).
- **Database & Autentikasi**: Firebase Authentication (Google Sign-In) dan Cloud Firestore dengan aturan keamanan berbasis peran pada `firestore.rules`.

## Struktur Berkas Utama

```text
├── server.ts                       # Server Express + Vite middleware + endpoint Gemini AI
├── firebase-blueprint.json         # Skema entitas dan koleksi Firestore
├── firestore.rules                 # Aturan keamanan Firestore berbasis peran
├── eslint.config.js                # Konfigurasi ESLint untuk audit keamanan rules
├── index.html                      # Entry HTML dan konfigurasi font
└── src/
    ├── App.tsx                     # Root aplikasi, autentikasi, sinkronisasi Firestore & rute tampilan
    ├── types.ts                    # Definisi tipe TypeScript domain sekolah
    ├── lib/
    │   ├── constants.ts            # Konstanta jenjang, kategori, tingkat, & matriks poin default
    │   ├── firebase.ts             # Inisialisasi Firebase SDK & error handler terstruktur
    │   ├── seedData.ts             # Data contoh 15 siswa & 30 prestasi
    │   ├── exportUtils.ts          # Ekspor CSV/Excel dan generasi PDF Portofolio & Laporan
    │   └── imageUtils.ts           # Kompresi foto siswa & bukti sertifikat di sisi klien
    └── components/
        ├── LoginScreen.tsx         # Halaman masuk portal & pemulihan pop-up diblokir
        ├── DashboardView.tsx       # Dashboard KPI, grafik, & 5 prestasi terbaru
        ├── StudentsView.tsx        # Daftar, pencarian, & filter siswa
        ├── StudentProfileView.tsx  # Portofolio siswa, grafik kategori, & fitur AI siswa
        ├── AchievementsView.tsx    # Daftar, filter, & verifikasi prestasi
        ├── LeaderboardView.tsx     # Peringkat siswa & kelas
        ├── ReportsView.tsx         # Rekap laporan, ekspor Excel/PDF, & ringkasan AI sekolah
        └── SettingsView.tsx        # Matriks poin, manajemen peran pengguna, & log audit
```

## Konfigurasi Environment

Salin `.env.example` menjadi `.env` (untuk pengembangan lokal) dan atur variabel berikut pada panel Secrets / environment server:

- `GEMINI_API_KEY`: API Key Gemini untuk fitur AI di sisi server (jangan pernah menaruh nilai kunci ini di kode klien).
- `APP_URL`: URL publik aplikasi.

Konfigurasi koneksi proyek Firebase berada pada `firebase-applet-config.json`.

## Menjalankan Aplikasi

1. **Instal dependensi**:
   ```bash
   npm install
   ```
2. **Jalankan mode pengembangan** (Express + Vite pada port `3000`):
   ```bash
   npm run dev
   ```
3. **Pemeriksaan tipe TypeScript & build produksi**:
   ```bash
   npm run lint
   npm run build
   ```
4. **Menjalankan build produksi**:
   ```bash
   NODE_ENV=production npm start
   ```
5. **Audit aturan keamanan Firestore**:
   ```bash
   npx eslint firestore.rules
   ```

## Catatan Penggunaan

- Jika muncul pesan `auth/popup-blocked` saat masuk menggunakan Google di dalam pratinjau tersemat (*iframe*), klik tombol **Buka di Tab Baru** atau izinkan pop-up pada bilah alamat browser.
- Pastikan untuk meninjau dan menyesuaikan `firestore.rules` sesuai kebijakan internal sekolah sebelum membagikan aplikasi secara luas.

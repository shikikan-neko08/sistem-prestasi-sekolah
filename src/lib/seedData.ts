import { collection, doc, getDocs, limit, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  Jenjang,
  JenisKelamin,
  KategoriPrestasi,
  PeringkatPrestasi,
  StatusVerifikasi,
  TingkatPrestasi,
  UserRole,
} from '../types';
import { calculatePoints, DEFAULT_POINT_MATRIX, DEFAULT_TAHUN_AJARAN, SCHOOL_ASSETS } from './constants';
import { db, handleFirestoreError, OperationType } from './firebase';

interface SeedStudentDef {
  id: string;
  nis: string;
  nama: string;
  jenjang: Jenjang;
  kelas: string;
  jenisKelamin: JenisKelamin;
}

interface SeedAchievementDef {
  id: string;
  studentId: string;
  namaLomba: string;
  kategori: KategoriPrestasi;
  tingkat: TingkatPrestasi;
  peringkat: PeringkatPrestasi;
  tanggal: string;
  tahunAjaran: string;
  penyelenggara: string;
  status: StatusVerifikasi;
  buktiUrl: string;
  buktiNama: string;
  deskripsi: string;
  alasanPenolakan?: string;
  alasanPembatalan?: string;
}

export const SEED_STUDENTS: SeedStudentDef[] = [
  { id: 'stu-01', nis: 'NI-SD-2026-001', nama: 'Aisyah Zahra Putri', jenjang: 'SD', kelas: '6A', jenisKelamin: 'P' },
  { id: 'stu-02', nis: 'NI-SD-2026-002', nama: 'Muhammad Fathan Alfarizi', jenjang: 'SD', kelas: '5B', jenisKelamin: 'L' },
  { id: 'stu-03', nis: 'NI-SD-2026-003', nama: 'Nayla Khairunnisa', jenjang: 'SD', kelas: '4A', jenisKelamin: 'P' },
  { id: 'stu-04', nis: 'NI-SD-2026-004', nama: 'Rafka Pratama Wijaya', jenjang: 'SD', kelas: '6B', jenisKelamin: 'L' },
  { id: 'stu-05', nis: 'NI-SMP-2026-005', nama: 'Nadia Salsabila Hakim', jenjang: 'SMP', kelas: '8A', jenisKelamin: 'P' },
  { id: 'stu-06', nis: 'NI-SMP-2026-006', nama: 'Rayhan Aditya Nugroho', jenjang: 'SMP', kelas: '9B', jenisKelamin: 'L' },
  { id: 'stu-07', nis: 'NI-SMP-2026-007', nama: 'Hafizah Humaira', jenjang: 'SMP', kelas: '7A', jenisKelamin: 'P' },
  { id: 'stu-08', nis: 'NI-SMP-2026-008', nama: 'Bagas Satria Ramadhan', jenjang: 'SMP', kelas: '8C', jenisKelamin: 'L' },
  { id: 'stu-09', nis: 'NI-SMP-2026-009', nama: 'Salma Azzahra', jenjang: 'SMP', kelas: '9A', jenisKelamin: 'P' },
  { id: 'stu-10', nis: 'NI-SMA-2026-010', nama: 'Ariyanto Hermawan', jenjang: 'SMA', kelas: '12 IPA 1', jenisKelamin: 'L' },
  { id: 'stu-11', nis: 'NI-SMA-2026-011', nama: 'Siti Rahma Hidayati', jenjang: 'SMA', kelas: '11 IPA 2', jenisKelamin: 'P' },
  { id: 'stu-12', nis: 'NI-SMA-2026-012', nama: 'Zaki Mubarak Santoso', jenjang: 'SMA', kelas: '11 IPS 1', jenisKelamin: 'L' },
  { id: 'stu-13', nis: 'NI-SMA-2026-013', nama: 'Khadijah Nurul Fadhilah', jenjang: 'SMA', kelas: '10 IPA 1', jenisKelamin: 'P' },
  { id: 'stu-14', nis: 'NI-SMA-2026-014', nama: 'Dimas Arya Kusuma', jenjang: 'SMA', kelas: '12 IPS 1', jenisKelamin: 'L' },
  { id: 'stu-15', nis: 'NI-SMA-2026-015', nama: 'Fauzan Rizky Maulana', jenjang: 'SMA', kelas: '10 IPS 2', jenisKelamin: 'L' },
];

export const SEED_ACHIEVEMENTS: SeedAchievementDef[] = [
  {
    id: 'ach-01',
    studentId: 'stu-10',
    namaLomba: 'Olimpiade Sains Nasional (OSN) Bidang Matematika',
    kategori: 'Akademik',
    tingkat: 'Nasional',
    peringkat: 'Juara 1',
    tanggal: '2026-08-18',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Puspresnas Kemendikbudristek',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-osn-matematika-ariyanto.jpg',
    deskripsi: 'Medali emas kategori Matematika jenjang SMA tingkat nasional.',
  },
  {
    id: 'ach-02',
    studentId: 'stu-10',
    namaLomba: 'Kompetisi Robotika & AI Pelajar ASEAN',
    kategori: 'Teknologi',
    tingkat: 'Internasional',
    peringkat: 'Juara 2',
    tanggal: '2026-10-05',
    tahunAjaran: '2026/2027',
    penyelenggara: 'SEAMEO STEM Education Center',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-robotika-asean.jpg',
    deskripsi: 'Inovasi sistem pemilah sampah otomatis berbasis visi komputer.',
  },
  {
    id: 'ach-03',
    studentId: 'stu-11',
    namaLomba: 'Musabaqah Tilawatil Quran (MTQ) Pelajar',
    kategori: 'Keagamaan',
    tingkat: 'Provinsi',
    peringkat: 'Juara 1',
    tanggal: '2026-09-14',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Kanwil Kemenag Provinsi',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-mtq-provinsi.jpg',
    deskripsi: 'Cabang Tilawah Remaja Putri.',
  },
  {
    id: 'ach-04',
    studentId: 'stu-05',
    namaLomba: 'Kompetisi Sains Madrasah & Sekolah IPA Terpadu',
    kategori: 'Akademik',
    tingkat: 'Provinsi',
    peringkat: 'Juara 2',
    tanggal: '2026-09-22',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Dinas Pendidikan Provinsi',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-ipa-nadia.jpg',
    deskripsi: 'Peraih nilai praktikum tertinggi rayon provinsi.',
  },
  {
    id: 'ach-05',
    studentId: 'stu-01',
    namaLomba: 'Olimpiade Matematika Anak Nusantara',
    kategori: 'Akademik',
    tingkat: 'Nasional',
    peringkat: 'Juara 2',
    tanggal: '2026-08-29',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Perkumpulan Pendidik Matematika Indonesia',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-matematika-aisyah.jpg',
    deskripsi: 'Meraih medali perak kategori SD kelas 6.',
  },
  {
    id: 'ach-06',
    studentId: 'stu-06',
    namaLomba: 'Kejuaraan Pencak Silat Pelajar POPDA',
    kategori: 'Olahraga',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 1',
    tanggal: '2026-10-12',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Dispora Kabupaten/Kota',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-silat-rayhan.jpg',
    deskripsi: 'Kelas Tanding Putra Kategori SMP.',
  },
  {
    id: 'ach-07',
    studentId: 'stu-07',
    namaLomba: 'Tahfidz Al-Quran 5 Juz Antar Pelajar',
    kategori: 'Keagamaan',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 1',
    tanggal: '2026-07-25',
    tahunAjaran: '2026/2027',
    penyelenggara: 'LPTQ Daerah',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-tahfidz-hafizah.jpg',
    deskripsi: 'Predikat Mumtaz dengan kelancaran tajwid.',
  },
  {
    id: 'ach-08',
    studentId: 'stu-12',
    namaLomba: 'Debat Bahasa Inggris & Kepemimpinan Muda',
    kategori: 'Kepemimpinan',
    tingkat: 'Provinsi',
    peringkat: 'Juara 3',
    tanggal: '2026-10-03',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Forum OSIS Nusantara',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-debat-zaki.jpg',
    deskripsi: 'Pembicara terbaik kedua pada babak semifinal.',
  },
  {
    id: 'ach-09',
    studentId: 'stu-13',
    namaLomba: 'Lomba Desain UI/UX Aplikasi Edukasi',
    kategori: 'Teknologi',
    tingkat: 'Nasional',
    peringkat: 'Juara 3',
    tanggal: '2026-10-20',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Institut Teknologi Nasional',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-uiux-khadijah.jpg',
    deskripsi: 'Merancang aplikasi literasi digital ramah anak.',
  },
  {
    id: 'ach-10',
    studentId: 'stu-02',
    namaLomba: 'Festival & Lomba Seni Siswa Nasional (FLS2N) Gambar Bercerita',
    kategori: 'Seni',
    tingkat: 'Kecamatan',
    peringkat: 'Juara 1',
    tanggal: '2026-08-10',
    tahunAjaran: '2026/2027',
    penyelenggara: 'K3S Kecamatan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-fls2n-fathan.jpg',
    deskripsi: 'Tema Kearifan Lokal Nusantara.',
  },
  {
    id: 'ach-11',
    studentId: 'stu-08',
    namaLomba: 'Turnamen Futsal Antar SMP Se-Kota',
    kategori: 'Olahraga',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 2',
    tanggal: '2026-09-05',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Asosiasi Futsal Kota',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-futsal-bagas.jpg',
    deskripsi: 'Kapten tim sekaligus pencetak gol terbanyak.',
  },
  {
    id: 'ach-12',
    studentId: 'stu-09',
    namaLomba: 'Festival Kaligrafi Kontemporer Remaja',
    kategori: 'Seni',
    tingkat: 'Provinsi',
    peringkat: 'Harapan',
    tanggal: '2026-10-15',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Dewan Kesenian Daerah',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-kaligrafi-salma.jpg',
    deskripsi: 'Karya kaligrafi akrilik di atas kanvas.',
  },
  {
    id: 'ach-13',
    studentId: 'stu-14',
    namaLomba: 'Jambore Kepemimpinan Pramuka Penegak',
    kategori: 'Kepemimpinan',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 1',
    tanggal: '2026-08-14',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Kwarcab Gerakan Pramuka',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-pramuka-dimas.jpg',
    deskripsi: 'Pemimpin sangga terbaik bidang manajemen posko.',
  },
  {
    id: 'ach-14',
    studentId: 'stu-03',
    namaLomba: 'Lomba Pidato Bahasa Indonesia Tingkat SD',
    kategori: 'Akademik',
    tingkat: 'Kecamatan',
    peringkat: 'Juara 2',
    tanggal: '2026-09-18',
    tahunAjaran: '2026/2027',
    penyelenggara: 'UPTD Pendidikan Kecamatan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-pidato-nayla.jpg',
    deskripsi: 'Membawakan tema Generasi Cinta Literasi.',
  },
  {
    id: 'ach-15',
    studentId: 'stu-04',
    namaLomba: 'Kejuaraan Renang Gaya Bebas 50m SD',
    kategori: 'Olahraga',
    tingkat: 'Kecamatan',
    peringkat: 'Juara 1',
    tanggal: '2026-10-08',
    tahunAjaran: '2026/2027',
    penyelenggara: 'PRSI Kecamatan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'medali-renang-rafka.jpg',
    deskripsi: 'Catatan waktu 34.2 detik.',
  },
  {
    id: 'ach-16',
    studentId: 'stu-15',
    namaLomba: 'Cerdas Cermat Ekonomi Syariah Pelajar',
    kategori: 'Akademik',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Finalis',
    tanggal: '2026-10-25',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Bank Indonesia Perwakilan Daerah',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-ekonomi-fauzan.jpg',
    deskripsi: 'Masuk 5 besar finalis dari 48 tim SMA.',
  },
  {
    id: 'ach-17',
    studentId: 'stu-01',
    namaLomba: 'Pekan Keterampilan dan Seni PAI (Pentas PAI) Pildacil',
    kategori: 'Keagamaan',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 1',
    tanggal: '2026-11-02',
    tahunAjaran: '2026/2027',
    penyelenggara: 'KKG PAI Kabupaten/Kota',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-pildacil-aisyah.jpg',
    deskripsi: 'Juara 1 Dai Cilik Putri tingkat kota.',
  },
  {
    id: 'ach-18',
    studentId: 'stu-05',
    namaLomba: 'Kompetisi Karya Ilmiah Remaja (KIR) Energi Terbarukan',
    kategori: 'Teknologi',
    tingkat: 'Nasional',
    peringkat: 'Finalis',
    tanggal: '2026-11-06',
    tahunAjaran: '2026/2027',
    penyelenggara: 'BRIN & Kemendikbud',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-kir-nadia.jpg',
    deskripsi: 'Purwarupa sistem penjernihan air tenaga surya.',
  },
  {
    id: 'ach-19',
    studentId: 'stu-11',
    namaLomba: 'Olimpiade Biologi Terapan Pelajar',
    kategori: 'Akademik',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 1',
    tanggal: '2026-05-12',
    tahunAjaran: '2025/2026',
    penyelenggara: 'MGMP Biologi SMA',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-biologi-rahma.jpg',
    deskripsi: 'Peringkat pertama seleksi tingkat kota.',
  },
  {
    id: 'ach-20',
    studentId: 'stu-10',
    namaLomba: 'Kompetisi Pemrograman Nasional (TOKI Junior)',
    kategori: 'Teknologi',
    tingkat: 'Nasional',
    peringkat: 'Juara 3',
    tanggal: '2026-04-20',
    tahunAjaran: '2025/2026',
    penyelenggara: 'Ikatan Alumni TOKI',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-toki-ariyanto.jpg',
    deskripsi: 'Medali perunggu kategori algoritma C++.',
  },
  {
    id: 'ach-21',
    studentId: 'stu-06',
    namaLomba: 'Lomba Lari 100m Kejuaraan Atletik Pelajar',
    kategori: 'Olahraga',
    tingkat: 'Provinsi',
    peringkat: 'Juara 3',
    tanggal: '2026-03-15',
    tahunAjaran: '2025/2026',
    penyelenggara: 'PASI Provinsi',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-atletik-rayhan.jpg',
    deskripsi: 'Catatan waktu 11.45 detik.',
  },
  {
    id: 'ach-22',
    studentId: 'stu-09',
    namaLomba: 'FLS2N Tari Kreasi Daerah SMP',
    kategori: 'Seni',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 2',
    tanggal: '2026-05-04',
    tahunAjaran: '2025/2026',
    penyelenggara: 'Dinas Kebudayaan & Pendidikan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-tari-salma.jpg',
    deskripsi: 'Penata gerak dan penari utama kelompok.',
  },
  {
    id: 'ach-23',
    studentId: 'stu-12',
    namaLomba: 'Model United Nations (MUN) Pelajar Nasional',
    kategori: 'Kepemimpinan',
    tingkat: 'Nasional',
    peringkat: 'Harapan',
    tanggal: '2026-02-22',
    tahunAjaran: '2025/2026',
    penyelenggara: 'Universitas Indonesia MUN',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-mun-zaki.jpg',
    deskripsi: 'Honorable Mention pada komite UNESCO.',
  },
  {
    id: 'ach-24',
    studentId: 'stu-13',
    namaLomba: 'Aksi Relawan Lingkungan & Bank Sampah Sekolah',
    kategori: 'Lainnya',
    tingkat: 'Sekolah',
    peringkat: 'Juara 1',
    tanggal: '2026-06-05',
    tahunAjaran: '2025/2026',
    penyelenggara: 'Komite Adiwiyata Nurul Insan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-adiwiyata-khadijah.jpg',
    deskripsi: 'Penggerak program kelas bebas plastik sekali pakai.',
  },
  {
    id: 'ach-25',
    studentId: 'stu-02',
    namaLomba: 'Lomba Melukis Poster Hari Bumi',
    kategori: 'Seni',
    tingkat: 'Sekolah',
    peringkat: 'Juara 1',
    tanggal: '2025-04-22',
    tahunAjaran: '2024/2025',
    penyelenggara: 'SD Nurul Insan',
    status: 'Disetujui',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-poster-fathan.jpg',
    deskripsi: 'Juara pertama lomba poster lingkungan.',
  },
  // Menunggu verifikasi (4 data)
  {
    id: 'ach-26',
    studentId: 'stu-07',
    namaLomba: 'Olimpiade Bahasa Arab Pelajar',
    kategori: 'Keagamaan',
    tingkat: 'Provinsi',
    peringkat: 'Juara 2',
    tanggal: '2026-11-12',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Forum MGMP Bahasa Arab',
    status: 'Menunggu',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'sertifikat-bahasa-arab-hafizah.jpg',
    deskripsi: 'Menunggu verifikasi sertifikat asli oleh pembina.',
  },
  {
    id: 'ach-27',
    studentId: 'stu-14',
    namaLomba: 'Turnamen Basket 3x3 Pelajar SMA',
    kategori: 'Olahraga',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Juara 3',
    tanggal: '2026-11-10',
    tahunAjaran: '2026/2027',
    penyelenggara: 'PERBASI Kota',
    status: 'Menunggu',
    buktiUrl: SCHOOL_ASSETS.TROPHY,
    buktiNama: 'piala-basket-dimas.jpg',
    deskripsi: 'Pengajuan prestasi tim basket putra SMA Nurul Insan.',
  },
  {
    id: 'ach-28',
    studentId: 'stu-04',
    namaLomba: 'Catur Cepat Pelajar SD',
    kategori: 'Olahraga',
    tingkat: 'Kabupaten/Kota',
    peringkat: 'Harapan',
    tanggal: '2026-11-14',
    tahunAjaran: '2026/2027',
    penyelenggara: 'PERCASI Daerah',
    status: 'Menunggu',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-catur-rafka.jpg',
    deskripsi: 'Peringkat 4 dari 60 peserta U-12.',
  },
  // Ditolak (1 data)
  {
    id: 'ach-29',
    studentId: 'stu-15',
    namaLomba: 'Lomba Fotografi Jurnalistik Remaja',
    kategori: 'Seni',
    tingkat: 'Nasional',
    peringkat: 'Peserta',
    tanggal: '2026-10-28',
    tahunAjaran: '2026/2027',
    penyelenggara: 'Komunitas Foto Pelajar',
    status: 'Ditolak',
    alasanPenolakan: 'Lampiran sertifikat belum mencantumkan nama lengkap siswa dan tanggal penyelenggaraan resmi.',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'draft-foto-fauzan.jpg',
    deskripsi: 'Pengajuan peserta pameran fotografi.',
  },
  // Dibatalkan (1 data - menunjukkan prestasi disetujui tidak dihapus melainkan dibatalkan dengan alasan)
  {
    id: 'ach-30',
    studentId: 'stu-08',
    namaLomba: 'Lomba Kebersihan & Ketertiban Kelas',
    kategori: 'Lainnya',
    tingkat: 'Sekolah',
    peringkat: 'Juara 2',
    tanggal: '2026-09-29',
    tahunAjaran: '2026/2027',
    penyelenggara: 'OSIS SMP Nurul Insan',
    status: 'Dibatalkan',
    alasanPembatalan: 'Koreksi administrasi: penghargaan diberikan untuk kategori kolektif kelas, bukan perorangan siswa.',
    buktiUrl: SCHOOL_ASSETS.CERTIFICATE,
    buktiNama: 'piagam-kelas-bagas.jpg',
    deskripsi: 'Dibatalkan berdasarkan berita acara panitia OSIS.',
  },
];

export async function seedInitialDataIfEmpty(actor: {
  uid: string;
  nama: string;
  role: UserRole;
}): Promise<boolean> {
  try {
    const existingStudentsSnap = await getDocs(query(collection(db, 'students'), limit(1)));
    if (!existingStudentsSnap.empty) {
      return false;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'students');
  }

  return writeSeedDataset(actor);
}

export async function writeSeedDataset(actor: {
  uid: string;
  nama: string;
  role: UserRole;
}): Promise<boolean> {
  const batch = writeBatch(db);

  // 1. Settings matrix
  batch.set(doc(db, 'settings', 'points_matrix'), {
    matrix: DEFAULT_POINT_MATRIX,
    tahunAjaranAktif: DEFAULT_TAHUN_AJARAN,
    updatedByUid: actor.uid,
    updatedByName: actor.nama,
    updatedAt: serverTimestamp(),
  });

  // 2. Map student lookup
  const studentMap = new Map<string, SeedStudentDef>();
  for (const s of SEED_STUDENTS) {
    studentMap.set(s.id, s);
    batch.set(doc(db, 'students', s.id), {
      nis: s.nis,
      nama: s.nama,
      jenjang: s.jenjang,
      kelas: s.kelas,
      jenisKelamin: s.jenisKelamin,
      fotoUrl: '',
      statusAktif: 'aktif',
      ownerUid: '',
      pembinaUid: actor.uid,
      aiNarasi: '',
      aiPembinaan: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Achievements
  for (const a of SEED_ACHIEVEMENTS) {
    const stu = studentMap.get(a.studentId);
    if (!stu) continue;
    const poin = calculatePoints(DEFAULT_POINT_MATRIX, a.tingkat, a.peringkat);

    const payload: Record<string, unknown> = {
      studentId: a.studentId,
      studentNama: stu.nama,
      studentKelas: stu.kelas,
      studentJenjang: stu.jenjang,
      studentOwnerUid: '',
      namaLomba: a.namaLomba,
      kategori: a.kategori,
      tingkat: a.tingkat,
      peringkat: a.peringkat,
      tanggal: a.tanggal,
      tahunAjaran: a.tahunAjaran,
      penyelenggara: a.penyelenggara,
      buktiUrl: a.buktiUrl,
      buktiNama: a.buktiNama,
      deskripsi: a.deskripsi,
      status: a.status,
      poin,
      submittedByUid: actor.uid,
      submittedByName: actor.nama,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (a.status !== 'Menunggu') {
      payload.verifiedByUid = actor.uid;
      payload.verifiedByName = actor.nama;
    }
    if (a.alasanPenolakan) {
      payload.alasanPenolakan = a.alasanPenolakan;
    }
    if (a.alasanPembatalan) {
      payload.alasanPembatalan = a.alasanPembatalan;
    }

    batch.set(doc(db, 'achievements', a.id), payload);
  }

  // 4. Sample audit logs
  batch.set(doc(db, 'audit_logs', 'seed-log-1'), {
    targetType: 'settings',
    targetId: 'points_matrix',
    targetTitle: 'Inisialisasi Data Awal Sekolah Nurul Insan',
    action: 'INISIALISASI_DATA',
    actorUid: actor.uid,
    actorName: actor.nama,
    actorRole: actor.role,
    reason: 'Pengisian data awal 15 siswa dan 30 catatan prestasi contoh.',
    details: 'Matriks poin otomatis dan tahun ajaran aktif 2026/2027 diterapkan.',
    createdAt: serverTimestamp(),
  });

  batch.set(doc(db, 'audit_logs', 'seed-log-2'), {
    targetType: 'achievement',
    targetId: 'ach-30',
    targetTitle: 'Lomba Kebersihan & Ketertiban Kelas — Bagas Satria Ramadhan',
    action: 'BATALKAN_PRESTASI',
    actorUid: actor.uid,
    actorName: actor.nama,
    actorRole: actor.role,
    reason: 'Koreksi administrasi: penghargaan diberikan untuk kategori kolektif kelas, bukan perorangan siswa.',
    details: 'Status diubah dari Disetujui menjadi Dibatalkan (data tetap diarsipkan).',
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_initial_data');
  }
}

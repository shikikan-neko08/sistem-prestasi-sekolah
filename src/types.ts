export type UserRole = 'admin' | 'guru' | 'siswa' | 'kepala_sekolah';
export type Jenjang = 'SD' | 'SMP' | 'SMA';
export type JenisKelamin = 'L' | 'P';
export type StatusAktif = 'aktif' | 'nonaktif';

export type KategoriPrestasi =
  | 'Akademik'
  | 'Olahraga'
  | 'Seni'
  | 'Keagamaan'
  | 'Teknologi'
  | 'Kepemimpinan'
  | 'Lainnya';

export type TingkatPrestasi =
  | 'Sekolah'
  | 'Kecamatan'
  | 'Kabupaten/Kota'
  | 'Provinsi'
  | 'Nasional'
  | 'Internasional';

export type PeringkatPrestasi =
  | 'Juara 1'
  | 'Juara 2'
  | 'Juara 3'
  | 'Harapan'
  | 'Finalis'
  | 'Peserta';

export type StatusVerifikasi = 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';

export type PointMatrix = Record<TingkatPrestasi, Record<PeringkatPrestasi, number>>;

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  nama: string;
  role: UserRole;
  studentId?: string;
  jenjangBinaan?: '' | Jenjang | 'Semua';
  statusAktif: StatusAktif;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Student {
  id: string;
  nis: string;
  nama: string;
  jenjang: Jenjang;
  kelas: string;
  jenisKelamin: JenisKelamin;
  fotoUrl?: string;
  statusAktif: StatusAktif;
  ownerUid?: string;
  pembinaUid?: string;
  aiNarasi?: string;
  aiPembinaan?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Achievement {
  id: string;
  studentId: string;
  studentNama: string;
  studentKelas: string;
  studentJenjang: Jenjang;
  studentOwnerUid?: string;
  namaLomba: string;
  kategori: KategoriPrestasi;
  tingkat: TingkatPrestasi;
  peringkat: PeringkatPrestasi;
  tanggal: string;
  tahunAjaran: string;
  penyelenggara: string;
  buktiUrl?: string;
  buktiNama?: string;
  deskripsi?: string;
  status: StatusVerifikasi;
  poin: number;
  alasanPenolakan?: string;
  alasanPembatalan?: string;
  submittedByUid: string;
  submittedByName: string;
  verifiedByUid?: string;
  verifiedByName?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PointSettings {
  id: string;
  matrix: PointMatrix;
  tahunAjaranAktif: string;
  updatedByUid: string;
  updatedByName?: string;
  updatedAt?: unknown;
}

export interface SchoolReport {
  id: string;
  tahunAjaran: string;
  ringkasanAi: string;
  updatedByUid: string;
  updatedByName?: string;
  updatedAt?: unknown;
}

export interface AuditLog {
  id: string;
  targetType: 'achievement' | 'student' | 'settings' | 'user' | 'report';
  targetId: string;
  targetTitle: string;
  action: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  reason?: string;
  details?: string;
  createdAt?: unknown;
}

export type ActivePage =
  | 'dashboard'
  | 'students'
  | 'achievements'
  | 'leaderboard'
  | 'reports'
  | 'settings'
  | 'my-portfolio';

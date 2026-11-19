import {
  Jenjang,
  KategoriPrestasi,
  PeringkatPrestasi,
  PointMatrix,
  TingkatPrestasi,
  UserRole,
} from '../types';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'ardaffa2000@gmail.com';

export const SCHOOL_NAME = 'Sekolah Nurul Insan';
export const SCHOOL_SUBTITLE = 'SD · SMP · SMA Nurul Insan';

export const SCHOOL_ASSETS = {
  EMBLEM: '/src/assets/images/school_emblem_nurul_insan_1795075107521.jpg',
  HERO: '/src/assets/images/hero_nurul_insan_campus_1795075109072.jpg',
  CERTIFICATE: '/src/assets/images/certificate_sample_olympiad_1795075108882.jpg',
  TROPHY: '/src/assets/images/trophy_piala_juara_1795075109156.jpg',
};

export const JENJANG_LIST: Jenjang[] = ['SD', 'SMP', 'SMA'];

export const KATEGORI_LIST: KategoriPrestasi[] = [
  'Akademik',
  'Olahraga',
  'Seni',
  'Keagamaan',
  'Teknologi',
  'Kepemimpinan',
  'Lainnya',
];

export const TINGKAT_LIST: TingkatPrestasi[] = [
  'Sekolah',
  'Kecamatan',
  'Kabupaten/Kota',
  'Provinsi',
  'Nasional',
  'Internasional',
];

export const PERINGKAT_LIST: PeringkatPrestasi[] = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Harapan',
  'Finalis',
  'Peserta',
];

export const TAHUN_AJARAN_LIST = ['2024/2025', '2025/2026', '2026/2027'];
export const DEFAULT_TAHUN_AJARAN = '2026/2027';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin Sekolah',
  guru: 'Guru / Pembina',
  siswa: 'Siswa',
  kepala_sekolah: 'Kepala Sekolah',
};

export const DEFAULT_POINT_MATRIX: PointMatrix = {
  Sekolah: {
    'Juara 1': 15,
    'Juara 2': 12,
    'Juara 3': 10,
    Harapan: 7,
    Finalis: 5,
    Peserta: 3,
  },
  Kecamatan: {
    'Juara 1': 25,
    'Juara 2': 20,
    'Juara 3': 15,
    Harapan: 10,
    Finalis: 8,
    Peserta: 5,
  },
  'Kabupaten/Kota': {
    'Juara 1': 40,
    'Juara 2': 32,
    'Juara 3': 25,
    Harapan: 18,
    Finalis: 12,
    Peserta: 8,
  },
  Provinsi: {
    'Juara 1': 65,
    'Juara 2': 55,
    'Juara 3': 45,
    Harapan: 30,
    Finalis: 20,
    Peserta: 12,
  },
  Nasional: {
    'Juara 1': 100,
    'Juara 2': 85,
    'Juara 3': 70,
    Harapan: 50,
    Finalis: 35,
    Peserta: 20,
  },
  Internasional: {
    'Juara 1': 150,
    'Juara 2': 130,
    'Juara 3': 110,
    Harapan: 80,
    Finalis: 60,
    Peserta: 35,
  },
};

export function calculatePoints(
  matrix: PointMatrix | undefined,
  tingkat: TingkatPrestasi,
  peringkat: PeringkatPrestasi
): number {
  const source = matrix || DEFAULT_POINT_MATRIX;
  return source[tingkat]?.[peringkat] ?? DEFAULT_POINT_MATRIX[tingkat][peringkat] ?? 0;
}

export function inferTahunAjaranFromDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return DEFAULT_TAHUN_AJARAN;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return DEFAULT_TAHUN_AJARAN;
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

export function formatTanggalID(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimestampID(ts: unknown): string {
  if (!ts) return '-';
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (ts instanceof Date) {
    return ts.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(ts);
}

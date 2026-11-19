import React, { useMemo, useState } from 'react';
import { Award, Image as ImageIcon, Upload, X } from 'lucide-react';
import {
  calculatePoints,
  DEFAULT_TAHUN_AJARAN,
  inferTahunAjaranFromDate,
  KATEGORI_LIST,
  PERINGKAT_LIST,
  SCHOOL_ASSETS,
  TAHUN_AJARAN_LIST,
  TINGKAT_LIST,
} from '../lib/constants';
import { compressImageFileToDataUrl } from '../lib/imageUtils';
import {
  Achievement,
  KategoriPrestasi,
  PeringkatPrestasi,
  PointMatrix,
  Student,
  TingkatPrestasi,
  UserRole,
} from '../types';

interface AchievementFormModalProps {
  students: Student[];
  matrix: PointMatrix;
  role: UserRole;
  lockedStudent?: Student | null;
  editingAchievement?: Achievement | null;
  onClose: () => void;
  onSave: (payload: {
    student: Student;
    namaLomba: string;
    kategori: KategoriPrestasi;
    tingkat: TingkatPrestasi;
    peringkat: PeringkatPrestasi;
    tanggal: string;
    tahunAjaran: string;
    penyelenggara: string;
    buktiUrl: string;
    buktiNama: string;
    deskripsi: string;
    autoApprove: boolean;
  }) => Promise<void>;
}

export const AchievementFormModal: React.FC<AchievementFormModalProps> = ({
  students,
  matrix,
  role,
  lockedStudent,
  editingAchievement,
  onClose,
  onSave,
}) => {
  const activeStudents = useMemo(
    () => students.filter((s) => s.statusAktif === 'aktif'),
    [students]
  );

  const initialStudentId =
    editingAchievement?.studentId ||
    lockedStudent?.id ||
    activeStudents[0]?.id ||
    '';

  const [studentId, setStudentId] = useState(initialStudentId);
  const [namaLomba, setNamaLomba] = useState(editingAchievement?.namaLomba ?? '');
  const [kategori, setKategori] = useState<KategoriPrestasi>(
    editingAchievement?.kategori ?? 'Akademik'
  );
  const [tingkat, setTingkat] = useState<TingkatPrestasi>(
    editingAchievement?.tingkat ?? 'Kabupaten/Kota'
  );
  const [peringkat, setPeringkat] = useState<PeringkatPrestasi>(
    editingAchievement?.peringkat ?? 'Juara 1'
  );
  const [tanggal, setTanggal] = useState(
    editingAchievement?.tanggal ?? new Date().toISOString().slice(0, 10)
  );
  const [tahunAjaran, setTahunAjaran] = useState(
    editingAchievement?.tahunAjaran ?? DEFAULT_TAHUN_AJARAN
  );
  const [penyelenggara, setPenyelenggara] = useState(
    editingAchievement?.penyelenggara ?? ''
  );
  const [buktiUrl, setBuktiUrl] = useState(editingAchievement?.buktiUrl ?? '');
  const [buktiNama, setBuktiNama] = useState(editingAchievement?.buktiNama ?? '');
  const [deskripsi, setDeskripsi] = useState(editingAchievement?.deskripsi ?? '');
  const [autoApprove, setAutoApprove] = useState(
    !editingAchievement && (role === 'admin' || role === 'guru')
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === studentId) || lockedStudent || null,
    [students, studentId, lockedStudent]
  );

  const previewPoin = useMemo(
    () => calculatePoints(matrix, tingkat, peringkat),
    [matrix, tingkat, peringkat]
  );

  const handleTanggalChange = (val: string) => {
    setTanggal(val);
    if (!editingAchievement && val) {
      setTahunAjaran(inferTahunAjaranFromDate(val));
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, 960, 0.72);
      setBuktiUrl(compressed);
      setBuktiNama(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses foto bukti.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedStudent) {
      setError('Silakan pilih siswa terlebih dahulu.');
      return;
    }
    if (namaLomba.trim().length < 2) {
      setError('Nama lomba atau kegiatan wajib diisi.');
      return;
    }
    if (penyelenggara.trim().length < 2) {
      setError('Nama penyelenggara wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        student: selectedStudent,
        namaLomba: namaLomba.trim(),
        kategori,
        tingkat,
        peringkat,
        tanggal,
        tahunAjaran,
        penyelenggara: penyelenggara.trim(),
        buktiUrl,
        buktiNama: buktiNama || (buktiUrl ? 'lampiran-bukti.jpg' : ''),
        deskripsi: deskripsi.trim(),
        autoApprove: role === 'siswa' ? false : autoApprove,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan prestasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingAchievement
                ? 'Perbaiki Data Prestasi'
                : role === 'siswa'
                ? 'Ajukan Prestasi Baru'
                : 'Catat Prestasi Siswa'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {role === 'siswa'
                ? 'Pengajuan prestasi akan diperiksa oleh Guru Pembina atau Admin sebelum masuk poin.'
                : 'Poin dihitung otomatis berdasarkan matriks tingkat dan peringkat.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Siswa selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Siswa
            </label>
            {lockedStudent || editingAchievement ? (
              <div className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900">
                {selectedStudent
                  ? `${selectedStudent.nama} · ${selectedStudent.jenjang} ${selectedStudent.kelas}`
                  : editingAchievement?.studentNama}
              </div>
            ) : (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Pilih Siswa --</option>
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.jenjang} · {s.kelas} · {s.nis})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lomba / Kegiatan
              </label>
              <input
                type="text"
                required
                value={namaLomba}
                onChange={(e) => setNamaLomba(e.target.value)}
                placeholder="Contoh: Olimpiade Sains Nasional (OSN) Matematika"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as KategoriPrestasi)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Penyelenggara
              </label>
              <input
                type="text"
                required
                value={penyelenggara}
                onChange={(e) => setPenyelenggara(e.target.value)}
                placeholder="Contoh: Kemendikbudristek / Dinas Pendidikan"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tingkat
              </label>
              <select
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value as TingkatPrestasi)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TINGKAT_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Peringkat
              </label>
              <select
                value={peringkat}
                onChange={(e) => setPeringkat(e.target.value as PeringkatPrestasi)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {PERINGKAT_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Pelaksanaan
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => handleTanggalChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun Ajaran
              </label>
              <select
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TAHUN_AJARAN_LIST.map((ta) => (
                  <option key={ta} value={ta}>
                    {ta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimasi Poin Otomatis */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Estimasi poin otomatis untuk <strong>{peringkat}</strong> tingkat{' '}
                <strong>{tingkat}</strong>
              </span>
            </div>
            <span className="font-mono tabular-nums text-base font-bold text-blue-700 shrink-0">
              +{previewPoin} poin
            </span>
          </div>

          {/* Unggah Bukti Sertifikat / Piala */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unggah Bukti (Foto Sertifikat / Piagam / Piala)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Pilih Foto dari Perangkat</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setBuktiUrl(SCHOOL_ASSETS.CERTIFICATE);
                  setBuktiNama('contoh-piagam-sertifikat.jpg');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Contoh Sertifikat</span>
              </button>

              {buktiUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setBuktiUrl('');
                    setBuktiNama('');
                  }}
                  className="text-xs text-red-600 hover:underline cursor-pointer text-left"
                >
                  Hapus lampiran
                </button>
              )}
            </div>

            {buktiUrl && (
              <div className="mt-3 flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <img
                  src={buktiUrl}
                  alt={buktiNama || 'Preview bukti prestasi'}
                  referrerPolicy="no-referrer"
                  className="w-20 h-14 rounded object-cover border border-slate-200 shrink-0 bg-white"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {buktiNama || 'Bukti terlampir'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Siap disimpan sebagai bukti verifikasi
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan / Keterangan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Contoh: Medali emas kategori individu, diikuti 120 peserta."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {!editingAchievement && (role === 'admin' || role === 'guru') && (
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Langsung setujui prestasi ini dan masukkan ke perhitungan poin</span>
            </label>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting
                ? 'Menyimpan...'
                : editingAchievement
                ? 'Simpan & Ajukan Ulang'
                : role === 'siswa'
                ? 'Kirim Pengajuan'
                : 'Simpan Prestasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

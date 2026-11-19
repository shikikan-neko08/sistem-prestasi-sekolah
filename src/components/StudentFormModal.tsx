import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { JENJANG_LIST } from '../lib/constants';
import { compressImageFileToDataUrl } from '../lib/imageUtils';
import { Jenjang, JenisKelamin, StatusAktif, Student } from '../types';

interface StudentFormModalProps {
  student?: Student | null;
  onClose: () => void;
  onSave: (data: {
    nis: string;
    nama: string;
    jenjang: Jenjang;
    kelas: string;
    jenisKelamin: JenisKelamin;
    statusAktif: StatusAktif;
    fotoUrl: string;
  }) => Promise<void>;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
  const [nis, setNis] = useState(student?.nis ?? '');
  const [nama, setNama] = useState(student?.nama ?? '');
  const [jenjang, setJenjang] = useState<Jenjang>(student?.jenjang ?? 'SMP');
  const [kelas, setKelas] = useState(student?.kelas ?? '');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>(student?.jenisKelamin ?? 'L');
  const [statusAktif, setStatusAktif] = useState<StatusAktif>(student?.statusAktif ?? 'aktif');
  const [fotoUrl, setFotoUrl] = useState(student?.fotoUrl ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressImageFileToDataUrl(file, 480, 0.72);
      setFotoUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses foto siswa.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nis.trim().length < 3) {
      setError('NIS minimal 3 karakter.');
      return;
    }
    if (nama.trim().length < 2) {
      setError('Nama lengkap siswa minimal 2 karakter.');
      return;
    }
    if (kelas.trim().length < 1) {
      setError('Kelas wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        nis: nis.trim(),
        nama: nama.trim(),
        jenjang,
        kelas: kelas.trim(),
        jenisKelamin,
        statusAktif,
        fotoUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data siswa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-lg font-bold text-slate-900">
            {student ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nama || 'Foto siswa'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-lg font-bold text-blue-700">
                  {(nama || 'NI').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto Siswa</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {fotoUrl && (
                <button
                  type="button"
                  onClick={() => setFotoUrl('')}
                  className="ml-3 text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Hapus foto
                </button>
              )}
              <p className="text-[11px] text-slate-500 mt-1">
                Format JPG/PNG, otomatis diperkecil agar ringan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIS
              </label>
              <input
                type="text"
                required
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="Contoh: NI-SMP-2026-016"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenjang
              </label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as Jenjang)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {JENJANG_LIST.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kelas
              </label>
              <input
                type="text"
                required
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Contoh: 8A / 11 IPA 1"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Kelamin
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as JenisKelamin)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Siswa
              </label>
              <select
                value={statusAktif}
                onChange={(e) => setStatusAktif(e.target.value as StatusAktif)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

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
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

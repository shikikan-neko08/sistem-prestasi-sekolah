import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Edit3,
  Eye,
  Plus,
  Printer,
  Save,
  Sparkles,
} from 'lucide-react';
import { formatTanggalID, KATEGORI_LIST, SCHOOL_NAME } from '../lib/constants';
import { downloadStudentPortfolioPDF } from '../lib/exportUtils';
import { Achievement, AuditLog, Student, UserRole } from '../types';
import { HorizontalBarChart } from './Charts';
import { StatusLabel } from './StatusLabel';

interface StudentProfileViewProps {
  student: Student;
  achievements: Achievement[];
  rank: number | null;
  role: UserRole;
  auditLogs: AuditLog[];
  onBack?: () => void;
  onEditStudent?: (student: Student) => void;
  onAddAchievement?: (student: Student) => void;
  onInspectAchievement: (achievement: Achievement) => void;
  onSaveAiFields?: (studentId: string, fields: { aiNarasi?: string; aiPembinaan?: string }) => Promise<void>;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  achievements,
  rank,
  role,
  auditLogs,
  onBack,
  onEditStudent,
  onAddAchievement,
  onInspectAchievement,
  onSaveAiFields,
}) => {
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Disetujui' | 'Menunggu' | 'Ditolak' | 'Dibatalkan'>('Semua');
  const [narasiDraft, setNarasiDraft] = useState(student.aiNarasi ?? '');
  const [pembinaanDraft, setPembinaanDraft] = useState(student.aiPembinaan ?? '');
  const [loadingNarasi, setLoadingNarasi] = useState(false);
  const [loadingPembinaan, setLoadingPembinaan] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const studentAchievements = useMemo(
    () =>
      achievements
        .filter((a) => a.studentId === student.id)
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [achievements, student.id]
  );

  const approvedAchievements = useMemo(
    () => studentAchievements.filter((a) => a.status === 'Disetujui'),
    [studentAchievements]
  );

  const totalPoin = useMemo(
    () => approvedAchievements.reduce((sum, a) => sum + (a.poin || 0), 0),
    [approvedAchievements]
  );

  const categoryData = useMemo(
    () =>
      KATEGORI_LIST.map((kat) => {
        const items = approvedAchievements.filter((a) => a.kategori === kat);
        return {
          label: kat,
          count: items.length,
          points: items.reduce((sum, a) => sum + (a.poin || 0), 0),
        };
      }),
    [approvedAchievements]
  );

  const filteredAchievements = useMemo(() => {
    if (statusFilter === 'Semua') return studentAchievements;
    return studentAchievements.filter((a) => a.status === statusFilter);
  }, [studentAchievements, statusFilter]);

  const studentAuditLogs = useMemo(
    () =>
      auditLogs.filter(
        (l) =>
          (l.targetType === 'student' && l.targetId === student.id) ||
          studentAchievements.some((a) => l.targetType === 'achievement' && l.targetId === a.id)
      ),
    [auditLogs, student.id, studentAchievements]
  );

  const canManage = role === 'admin' || role === 'guru';
  const canGenerateAi = role === 'admin' || role === 'guru' || role === 'kepala_sekolah';
  const canSaveAi = (role === 'admin' || role === 'guru') && Boolean(onSaveAiFields);

  const handleGenerateNarasi = async () => {
    setAiError(null);
    setAiMessage(null);
    setLoadingNarasi(true);
    try {
      const res = await fetch('/api/ai/narasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: {
            nama: student.nama,
            nis: student.nis,
            jenjang: student.jenjang,
            kelas: student.kelas,
          },
          achievements: approvedAchievements.map((a) => ({
            namaLomba: a.namaLomba,
            kategori: a.kategori,
            tingkat: a.tingkat,
            peringkat: a.peringkat,
            tanggal: a.tanggal,
            tahunAjaran: a.tahunAjaran,
            penyelenggara: a.penyelenggara,
            poin: a.poin,
          })),
          totalPoin,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Gagal membuat narasi prestasi.');
      }
      setNarasiDraft(data.text);
      setAiMessage('Draf narasi berhasil dibuat. Anda dapat menyunting teks di bawah sebelum menyimpan atau mencetak.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menghubungi layanan AI.');
    } finally {
      setLoadingNarasi(false);
    }
  };

  const handleGeneratePembinaan = async () => {
    setAiError(null);
    setAiMessage(null);
    setLoadingPembinaan(true);
    try {
      const res = await fetch('/api/ai/pembinaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: {
            nama: student.nama,
            nis: student.nis,
            jenjang: student.jenjang,
            kelas: student.kelas,
          },
          achievements: approvedAchievements.map((a) => ({
            namaLomba: a.namaLomba,
            kategori: a.kategori,
            tingkat: a.tingkat,
            peringkat: a.peringkat,
            tanggal: a.tanggal,
            tahunAjaran: a.tahunAjaran,
            penyelenggara: a.penyelenggara,
            poin: a.poin,
          })),
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Gagal menyusun saran pembinaan.');
      }
      setPembinaanDraft(data.text);
      setAiMessage('Saran pembinaan bakat berhasil dibuat dan siap disunting.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menghubungi layanan AI.');
    } finally {
      setLoadingPembinaan(false);
    }
  };

  const handleSaveAi = async () => {
    if (!onSaveAiFields) return;
    setAiError(null);
    setAiMessage(null);
    setSavingAi(true);
    try {
      await onSaveAiFields(student.id, {
        aiNarasi: narasiDraft,
        aiPembinaan: pembinaanDraft,
      });
      setAiMessage('Narasi dan saran pembinaan berhasil disimpan ke profil siswa.');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Gagal menyimpan catatan AI.');
    } finally {
      setSavingAi(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadStudentPortfolioPDF({
      student,
      achievements: studentAchievements,
      totalPoin,
      rank,
      narasiAi: narasiDraft,
      pembinaanAi: pembinaanDraft,
    });
  };

  return (
    <div className="space-y-6 print-container">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar</span>
            </button>
          )}
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
            Portofolio Prestasi Siswa
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && onEditStudent && (
            <button
              type="button"
              onClick={() => onEditStudent(student)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Profil</span>
            </button>
          )}
          {onAddAchievement && (
            <button
              type="button"
              onClick={() => onAddAchievement(student)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{role === 'siswa' ? 'Ajukan Prestasi' : 'Catat Prestasi'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Print Header Only */}
      <div className="hidden print-only border-b-2 border-blue-700 pb-3 mb-4">
        <p className="text-xs font-semibold text-emerald-700">{SCHOOL_NAME} · SD / SMP / SMA</p>
        <h1 className="text-xl font-bold text-slate-900">Portofolio Resmi Prestasi Siswa</h1>
      </div>

      {/* Student Identity & Summary Metrics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 bg-blue-50 flex items-center justify-center overflow-hidden shrink-0">
              {student.fotoUrl ? (
                <img
                  src={student.fotoUrl}
                  alt={student.nama}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-bold text-blue-700">
                  {student.nama
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                {student.nama}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                <span className="font-mono">{student.nis}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {student.jenjang} Kelas {student.kelas}
                </span>
                <span aria-hidden="true">·</span>
                <span>{student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    student.statusAktif === 'aktif'
                      ? 'font-semibold text-emerald-700'
                      : 'font-semibold text-slate-500'
                  }
                >
                  {student.statusAktif === 'aktif' ? 'Siswa Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
            <div>
              <p className="text-xs text-slate-500">Total Poin</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-blue-700 mt-0.5">
                {totalPoin}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Disetujui</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-emerald-600 mt-0.5">
                {approvedAchievements.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Peringkat</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-0.5">
                {rank ? `#${rank}` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Kategori + Fitur AI Siswa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-display text-base font-bold text-slate-900 mb-1">
            Sebaran Prestasi per Kategori
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Berdasarkan prestasi berstatus Disetujui
          </p>
          <HorizontalBarChart
            data={categoryData}
            accentColor="emerald"
            emptyText="Siswa ini belum memiliki prestasi yang disetujui."
          />
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Narasi Rapor &amp; Saran Pembinaan (AI Gemini)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hasil dapat disunting langsung sebelum disimpan atau dicetak ke PDF.
              </p>
            </div>
            {canGenerateAi && (
              <div className="flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleGenerateNarasi}
                  disabled={loadingNarasi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loadingNarasi ? 'Menyusun...' : 'Buat narasi prestasi'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePembinaan}
                  disabled={loadingPembinaan}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{loadingPembinaan ? 'Menganalisis...' : 'Saran pembinaan'}</span>
                </button>
              </div>
            )}
          </div>

          {aiError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {aiError}
            </div>
          )}
          {aiMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {aiMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Narasi Prestasi (Untuk Rapor / Surat Rekomendasi)
            </label>
            <textarea
              rows={4}
              value={narasiDraft}
              readOnly={!canGenerateAi}
              onChange={(e) => setNarasiDraft(e.target.value)}
              placeholder={
                canGenerateAi
                  ? 'Klik "Buat narasi prestasi" untuk menghasilkan draf paragraf formal, lalu sunting sesuai kebutuhan.'
                  : 'Belum ada narasi prestasi yang disimpan oleh pembina.'
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 read-only:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              3 Saran Pembinaan Bakat
            </label>
            <textarea
              rows={4}
              value={pembinaanDraft}
              readOnly={!canGenerateAi}
              onChange={(e) => setPembinaanDraft(e.target.value)}
              placeholder={
                canGenerateAi
                  ? 'Klik "Saran pembinaan" untuk menyusun 3 rekomendasi pengembangan bakat siswa.'
                  : 'Belum ada catatan saran pembinaan.'
              }
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600 read-only:bg-slate-50"
            />
          </div>

          {canSaveAi && (
            <div className="flex justify-end no-print">
              <button
                type="button"
                onClick={handleSaveAi}
                disabled={savingAi}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingAi ? 'Menyimpan...' : 'Simpan Catatan ke Profil'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daftar Prestasi Siswa */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Riwayat Prestasi ({filteredAchievements.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya prestasi berstatus Disetujui yang dihitung ke total poin dan peringkat.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg no-print overflow-x-auto">
            {(['Semua', 'Disetujui', 'Menunggu', 'Ditolak', 'Dibatalkan'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada catatan prestasi pada filter status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Lomba / Kegiatan</th>
                  <th className="py-3 px-4">Kategori &amp; Tingkat</th>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Poin</th>
                  <th className="py-3 px-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAchievements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{a.namaLomba}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.penyelenggara}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {a.kategori} · {a.tingkat}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {a.peringkat}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                      {formatTanggalID(a.tanggal)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel status={a.status} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {a.status === 'Disetujui' ? a.poin : 0}
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <button
                        type="button"
                        onClick={() => onInspectAchievement(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log ringkas untuk Staff */}
      {role !== 'siswa' && studentAuditLogs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 no-print">
          <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
            Log Aktivitas Terkait Siswa ({studentAuditLogs.length})
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            {studentAuditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>{log.targetTitle}</span>
                  {log.reason && (
                    <span className="text-slate-500"> (Alasan: {log.reason})</span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {log.actorName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

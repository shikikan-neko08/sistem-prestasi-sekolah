import React, { useMemo, useState } from 'react';
import { ArrowRight, Award, CheckCircle2, Clock, Plus, Trophy, Users } from 'lucide-react';
import {
  DEFAULT_TAHUN_AJARAN,
  formatTanggalID,
  KATEGORI_LIST,
  TAHUN_AJARAN_LIST,
  TINGKAT_LIST,
} from '../lib/constants';
import { Achievement, Student, UserRole } from '../types';
import { HorizontalBarChart, VerticalColumnChart } from './Charts';
import { StatusLabel } from './StatusLabel';

interface DashboardViewProps {
  students: Student[];
  achievements: Achievement[];
  role: UserRole;
  tahunAjaranAktif: string;
  onNavigateToAchievements: (initialStatus?: string) => void;
  onOpenAddAchievement: () => void;
  onInspectAchievement: (achievement: Achievement) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  achievements,
  role,
  tahunAjaranAktif,
  onNavigateToAchievements,
  onOpenAddAchievement,
  onInspectAchievement,
}) => {
  const [selectedTahun, setSelectedTahun] = useState<string>(
    tahunAjaranAktif || DEFAULT_TAHUN_AJARAN
  );

  const scopedAchievements = useMemo(() => {
    if (selectedTahun === 'Semua') return achievements;
    return achievements.filter((a) => a.tahunAjaran === selectedTahun);
  }, [achievements, selectedTahun]);

  const approved = useMemo(
    () => scopedAchievements.filter((a) => a.status === 'Disetujui'),
    [scopedAchievements]
  );

  const pendingCount = useMemo(
    () => achievements.filter((a) => a.status === 'Menunggu').length,
    [achievements]
  );

  const uniqueStudentsCount = useMemo(
    () => new Set(approved.map((a) => a.studentId)).size,
    [approved]
  );

  const totalPoints = useMemo(
    () => approved.reduce((sum, a) => sum + (a.poin || 0), 0),
    [approved]
  );

  const categoryData = useMemo(
    () =>
      KATEGORI_LIST.map((kat) => {
        const items = approved.filter((a) => a.kategori === kat);
        return {
          label: kat,
          count: items.length,
          points: items.reduce((sum, a) => sum + (a.poin || 0), 0),
        };
      }),
    [approved]
  );

  const levelData = useMemo(
    () =>
      TINGKAT_LIST.map((t) => ({
        label: t,
        count: approved.filter((a) => a.tingkat === t).length,
      })),
    [approved]
  );

  const latestFive = useMemo(
    () =>
      [...achievements]
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
        .slice(0, 5),
    [achievements]
  );

  const canAdd = role === 'admin' || role === 'guru';

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Dashboard Prestasi Sekolah
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan capaian siswa SD, SMP, dan SMA Nurul Insan ({students.filter((s) => s.statusAktif === 'aktif').length} siswa aktif)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            aria-label="Filter tahun ajaran dashboard"
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Semua">Semua Tahun</option>
            {TAHUN_AJARAN_LIST.map((ta) => (
              <option key={ta} value={ta}>
                TA {ta}
              </option>
            ))}
          </select>

          {canAdd && (
            <button
              type="button"
              onClick={onOpenAddAchievement}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Prestasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Verification Notice for Admin/Guru */}
      {canAdd && pendingCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="text-sm text-amber-900">
              Terdapat <strong className="font-mono tabular-nums">{pendingCount}</strong> pengajuan prestasi yang menunggu verifikasi pembina/admin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAchievements('Menunggu')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:underline cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Periksa Antrean Verifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4 KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              Total Prestasi Disetujui
            </span>
            <Trophy className="w-4 h-4 text-blue-700" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {approved.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedTahun === 'Semua' ? 'Seluruh tahun ajaran' : `Tahun Ajaran ${selectedTahun}`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              Siswa Berprestasi
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {uniqueStudentsCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dari total {students.filter((s) => s.statusAktif === 'aktif').length} siswa aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              Akumulasi Poin Sekolah
            </span>
            <Award className="w-4 h-4 text-blue-700" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-blue-700">
            {totalPoints}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dihitung dari bobot tingkat &amp; peringkat
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">
              Menunggu Verifikasi
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-mono tabular-nums text-3xl font-bold text-slate-900">
            {pendingCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total antrean aktif saat ini
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-1">
            Prestasi per Kategori
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Distribusi bidang lomba yang telah disetujui
          </p>
          <HorizontalBarChart data={categoryData} accentColor="blue" />
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-1">
            Prestasi per Tingkat Kompetisi
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Sebaran pencapaian dari tingkat sekolah hingga internasional
          </p>
          <VerticalColumnChart data={levelData} />
        </div>
      </div>

      {/* 5 Prestasi Terbaru */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              5 Prestasi Terbaru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik baris untuk melihat detail bukti dan status verifikasi
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToAchievements('Semua')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestFive.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada data prestasi yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">Nama Lomba / Kegiatan</th>
                  <th className="py-3 px-4">Kategori · Tingkat</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {latestFive.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => onInspectAchievement(a)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{a.studentNama}</p>
                      <p className="text-xs text-slate-500">
                        {a.studentJenjang} {a.studentKelas}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{a.namaLomba}</p>
                      <p className="text-xs text-slate-500">{a.peringkat}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {a.kategori} · {a.tingkat}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

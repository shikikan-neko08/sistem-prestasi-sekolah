import React, { useMemo, useState } from 'react';
import { Eye, Plus, Search } from 'lucide-react';
import {
  formatTanggalID,
  JENJANG_LIST,
  KATEGORI_LIST,
  TAHUN_AJARAN_LIST,
  TINGKAT_LIST,
} from '../lib/constants';
import { Achievement, Jenjang, KategoriPrestasi, StatusVerifikasi, TingkatPrestasi, UserRole } from '../types';
import { StatusLabel } from './StatusLabel';

interface AchievementsViewProps {
  achievements: Achievement[];
  role: UserRole;
  initialStatusFilter?: string;
  onAddAchievement: () => void;
  onInspectAchievement: (achievement: Achievement) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  role,
  initialStatusFilter = 'Semua',
  onAddAchievement,
  onInspectAchievement,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState<'Semua' | KategoriPrestasi>('Semua');
  const [tingkatFilter, setTingkatFilter] = useState<'Semua' | TingkatPrestasi>('Semua');
  const [tahunFilter, setTahunFilter] = useState<string>('Semua');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements
      .filter((a) => {
        if (statusFilter !== 'Semua' && a.status !== (statusFilter as StatusVerifikasi)) return false;
        if (jenjangFilter !== 'Semua' && a.studentJenjang !== jenjangFilter) return false;
        if (kategoriFilter !== 'Semua' && a.kategori !== kategoriFilter) return false;
        if (tingkatFilter !== 'Semua' && a.tingkat !== tingkatFilter) return false;
        if (tahunFilter !== 'Semua' && a.tahunAjaran !== tahunFilter) return false;
        if (q) {
          return (
            a.studentNama.toLowerCase().includes(q) ||
            a.studentKelas.toLowerCase().includes(q) ||
            a.namaLomba.toLowerCase().includes(q) ||
            a.penyelenggara.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [
    achievements,
    statusFilter,
    jenjangFilter,
    kategoriFilter,
    tingkatFilter,
    tahunFilter,
    search,
  ]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {
      Semua: achievements.length,
      Menunggu: 0,
      Disetujui: 0,
      Ditolak: 0,
      Dibatalkan: 0,
    };
    for (const a of achievements) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return counts;
  }, [achievements]);

  const canCreate = role === 'admin' || role === 'guru' || role === 'siswa';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {role === 'siswa' ? 'Prestasi & Pengajuan Saya' : 'Daftar & Verifikasi Prestasi'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {role === 'siswa'
              ? 'Ajukan prestasi baru beserta foto sertifikat untuk diverifikasi oleh pembina.'
              : 'Kelola pengajuan prestasi, verifikasi bukti, dan tinjau status setiap catatan.'}
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onAddAchievement}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{role === 'siswa' ? 'Ajukan Prestasi' : 'Catat Prestasi'}</span>
          </button>
        )}
      </div>

      {/* Segmented Status Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto w-full sm:w-fit">
        {['Semua', 'Menunggu', 'Disetujui', 'Ditolak', 'Dibatalkan'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === st
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st} <span className="font-mono tabular-nums text-slate-500">({countsByStatus[st] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Multi-Criteria Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari lomba, siswa, kelas, penyelenggara..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={jenjangFilter}
          onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Jenjang</option>
          {JENJANG_LIST.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value as 'Semua' | KategoriPrestasi)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Kategori</option>
          {KATEGORI_LIST.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select
          value={tingkatFilter}
          onChange={(e) => setTingkatFilter(e.target.value as 'Semua' | TingkatPrestasi)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Tingkat</option>
          {TINGKAT_LIST.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={tahunFilter}
          onChange={(e) => setTahunFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Tahun</option>
          {TAHUN_AJARAN_LIST.map((ta) => (
            <option key={ta} value={ta}>
              {ta}
            </option>
          ))}
        </select>
      </div>

      {/* Achievements Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Tidak ada catatan prestasi sesuai filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">Nama Lomba / Kegiatan</th>
                  <th className="py-3 px-4">Kategori · Tingkat</th>
                  <th className="py-3 px-4">Peringkat</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Poin</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((a) => (
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
                      <p className="text-xs text-slate-500">{a.penyelenggara}</p>
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
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectAchievement(a);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{a.status === 'Menunggu' && (role === 'admin' || role === 'guru') ? 'Verifikasi' : 'Detail'}</span>
                      </button>
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

import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { JENJANG_LIST } from '../lib/constants';
import { Achievement, Jenjang, Student, UserRole } from '../types';

interface StudentsViewProps {
  students: Student[];
  achievements: Achievement[];
  role: UserRole;
  onSelectStudent: (student: Student) => void;
  onAddStudent: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  achievements,
  role,
  onSelectStudent,
  onAddStudent,
}) => {
  const [search, setSearch] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');
  const [kelasFilter, setKelasFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'aktif' | 'nonaktif'>('Semua');

  const pointsByStudent = useMemo(() => {
    const map = new Map<string, { poin: number; count: number }>();
    for (const a of achievements) {
      if (a.status !== 'Disetujui') continue;
      const cur = map.get(a.studentId) || { poin: 0, count: 0 };
      cur.poin += a.poin || 0;
      cur.count += 1;
      map.set(a.studentId, cur);
    }
    return map;
  }, [achievements]);

  const kelasOptions = useMemo(() => {
    const filteredByJenjang =
      jenjangFilter === 'Semua'
        ? students
        : students.filter((s) => s.jenjang === jenjangFilter);
    return Array.from(new Set(filteredByJenjang.map((s) => s.kelas))).sort();
  }, [students, jenjangFilter]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (jenjangFilter !== 'Semua' && s.jenjang !== jenjangFilter) return false;
        if (kelasFilter !== 'Semua' && s.kelas !== kelasFilter) return false;
        if (statusFilter !== 'Semua' && s.statusAktif !== statusFilter) return false;
        if (q) {
          return (
            s.nama.toLowerCase().includes(q) ||
            s.nis.toLowerCase().includes(q) ||
            s.kelas.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const pA = pointsByStudent.get(a.id)?.poin ?? 0;
        const pB = pointsByStudent.get(b.id)?.poin ?? 0;
        return pB - pA || a.nama.localeCompare(b.nama);
      });
  }, [students, jenjangFilter, kelasFilter, statusFilter, search, pointsByStudent]);

  const canManage = role === 'admin' || role === 'guru';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Data Siswa Nurul Insan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pilih siswa untuk melihat portofolio lengkap, narasi AI, dan unduhan PDF
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onAddStudent}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIS, atau kelas..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={jenjangFilter}
          onChange={(e) => {
            setJenjangFilter(e.target.value as 'Semua' | Jenjang);
            setKelasFilter('Semua');
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Jenjang</option>
          {JENJANG_LIST.map((j) => (
            <option key={j} value={j}>
              Jenjang {j}
            </option>
          ))}
        </select>

        <select
          value={kelasFilter}
          onChange={(e) => setKelasFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Kelas</option>
          {kelasOptions.map((k) => (
            <option key={k} value={k}>
              Kelas {k}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'Semua' | 'aktif' | 'nonaktif')}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Status</option>
          <option value="aktif">Siswa Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Tidak ada data siswa yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Jenjang · Kelas</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Prestasi</th>
                  <th className="py-3 px-4 text-right">Total Poin</th>
                  <th className="py-3 px-4 text-right">Portofolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((s) => {
                  const stats = pointsByStudent.get(s.id) || { poin: 0, count: 0 };
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudent(s)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg border border-slate-200 bg-blue-50 flex items-center justify-center overflow-hidden shrink-0">
                            {s.fotoUrl ? (
                              <img
                                src={s.fotoUrl}
                                alt={s.nama}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-display text-xs font-bold text-blue-700">
                                {s.nama
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-slate-900">{s.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {s.nis}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {s.jenjang} · {s.kelas}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        <span
                          className={
                            s.statusAktif === 'aktif' ? 'text-emerald-700' : 'text-slate-500'
                          }
                        >
                          {s.statusAktif === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {stats.count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                        {stats.poin}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                          <span>Buka</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

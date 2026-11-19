import React, { useMemo, useState } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import {
  JENJANG_LIST,
  KATEGORI_LIST,
  TAHUN_AJARAN_LIST,
  TINGKAT_LIST,
} from '../lib/constants';
import { Achievement, Jenjang, KategoriPrestasi, Student, TingkatPrestasi } from '../types';

interface LeaderboardViewProps {
  students: Student[];
  achievements: Achievement[];
  onSelectStudent: (student: Student) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  students,
  achievements,
  onSelectStudent,
}) => {
  const [tab, setTab] = useState<'siswa' | 'kelas'>('siswa');
  const [tahunFilter, setTahunFilter] = useState<string>('Semua');
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState<'Semua' | KategoriPrestasi>('Semua');
  const [tingkatFilter, setTingkatFilter] = useState<'Semua' | TingkatPrestasi>('Semua');

  const filteredApproved = useMemo(() => {
    return achievements.filter((a) => {
      if (a.status !== 'Disetujui') return false;
      if (tahunFilter !== 'Semua' && a.tahunAjaran !== tahunFilter) return false;
      if (jenjangFilter !== 'Semua' && a.studentJenjang !== jenjangFilter) return false;
      if (kategoriFilter !== 'Semua' && a.kategori !== kategoriFilter) return false;
      if (tingkatFilter !== 'Semua' && a.tingkat !== tingkatFilter) return false;
      return true;
    });
  }, [achievements, tahunFilter, jenjangFilter, kategoriFilter, tingkatFilter]);

  const studentRankings = useMemo(() => {
    const studentMap = new Map<string, Student>();
    for (const s of students) studentMap.set(s.id, s);

    const agg = new Map<
      string,
      {
        student: Student;
        totalPoin: number;
        totalPrestasi: number;
        juara1: number;
        juara2: number;
        juara3: number;
      }
    >();

    for (const a of filteredApproved) {
      const stu = studentMap.get(a.studentId);
      if (!stu) continue;
      const cur = agg.get(a.studentId) || {
        student: stu,
        totalPoin: 0,
        totalPrestasi: 0,
        juara1: 0,
        juara2: 0,
        juara3: 0,
      };
      cur.totalPoin += a.poin || 0;
      cur.totalPrestasi += 1;
      if (a.peringkat === 'Juara 1') cur.juara1 += 1;
      if (a.peringkat === 'Juara 2') cur.juara2 += 1;
      if (a.peringkat === 'Juara 3') cur.juara3 += 1;
      agg.set(a.studentId, cur);
    }

    return Array.from(agg.values()).sort(
      (a, b) => b.totalPoin - a.totalPoin || b.juara1 - a.juara1 || b.totalPrestasi - a.totalPrestasi
    );
  }, [students, filteredApproved]);

  const classRankings = useMemo(() => {
    const agg = new Map<
      string,
      {
        key: string;
        jenjang: Jenjang;
        kelas: string;
        totalPoin: number;
        totalPrestasi: number;
        jumlahSiswa: Set<string>;
      }
    >();

    for (const a of filteredApproved) {
      const key = `${a.studentJenjang}__${a.studentKelas}`;
      const cur = agg.get(key) || {
        key,
        jenjang: a.studentJenjang,
        kelas: a.studentKelas,
        totalPoin: 0,
        totalPrestasi: 0,
        jumlahSiswa: new Set<string>(),
      };
      cur.totalPoin += a.poin || 0;
      cur.totalPrestasi += 1;
      cur.jumlahSiswa.add(a.studentId);
      agg.set(key, cur);
    }

    return Array.from(agg.values())
      .map((item) => ({
        ...item,
        siswaBerprestasi: item.jumlahSiswa.size,
      }))
      .sort((a, b) => b.totalPoin - a.totalPoin || b.totalPrestasi - a.totalPrestasi);
  }, [filteredApproved]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Peringkat &amp; Leaderboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Peringkat siswa dan kelas berdasarkan akumulasi poin prestasi terverifikasi
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setTab('siswa')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'siswa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peringkat Siswa
          </button>
          <button
            type="button"
            onClick={() => setTab('kelas')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'kelas' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peringkat Kelas
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={tahunFilter}
          onChange={(e) => setTahunFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Semua">Semua Tahun Ajaran</option>
          {TAHUN_AJARAN_LIST.map((ta) => (
            <option key={ta} value={ta}>
              TA {ta}
            </option>
          ))}
        </select>

        <select
          value={jenjangFilter}
          onChange={(e) => setJenjangFilter(e.target.value as 'Semua' | Jenjang)}
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
      </div>

      {tab === 'siswa' ? (
        <>
          {/* Top 3 Highlight Cards */}
          {studentRankings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studentRankings.slice(0, 3).map((item, idx) => (
                <button
                  key={item.student.id}
                  type="button"
                  onClick={() => onSelectStudent(item.student)}
                  className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      PERINGKAT #{idx + 1}
                    </span>
                    {idx === 0 ? (
                      <Trophy className="w-5 h-5 text-amber-500" />
                    ) : idx === 1 ? (
                      <Medal className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Award className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 truncate">
                    {item.student.nama}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.student.jenjang} Kelas {item.student.kelas}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="font-mono tabular-nums text-2xl font-bold text-blue-700">
                      {item.totalPoin} <span className="text-xs font-normal text-slate-500">poin</span>
                    </span>
                    <span className="font-mono tabular-nums text-xs text-emerald-700 font-semibold">
                      {item.totalPrestasi} prestasi
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Full Student Leaderboard Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {studentRankings.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Belum ada peringkat siswa untuk filter yang dipilih.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4 w-16">Rank</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">Jenjang · Kelas</th>
                      <th className="py-3 px-4 text-right">Juara 1</th>
                      <th className="py-3 px-4 text-right">Juara 2</th>
                      <th className="py-3 px-4 text-right">Juara 3</th>
                      <th className="py-3 px-4 text-right">Total Prestasi</th>
                      <th className="py-3 px-4 text-right">Total Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {studentRankings.map((item, idx) => (
                      <tr
                        key={item.student.id}
                        onClick={() => onSelectStudent(item.student)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-700">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.student.nama}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {item.student.jenjang} · {item.student.kelas}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {item.juara1}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {item.juara2}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {item.juara3}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                          {item.totalPrestasi}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                          {item.totalPoin}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {classRankings.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada peringkat kelas untuk filter yang dipilih.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Jenjang</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4 text-right">Siswa Berprestasi</th>
                    <th className="py-3 px-4 text-right">Total Prestasi</th>
                    <th className="py-3 px-4 text-right">Total Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {classRankings.map((item, idx) => (
                    <tr key={item.key} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-700">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-emerald-700">
                        {item.jenjang}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Kelas {item.kelas}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {item.siswaBerprestasi} siswa
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {item.totalPrestasi}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                        {item.totalPoin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

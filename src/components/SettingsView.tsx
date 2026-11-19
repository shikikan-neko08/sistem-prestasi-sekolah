import React, { useState } from 'react';
import { Database, History, RotateCcw, Save, Shield, Sliders } from 'lucide-react';
import {
  DEFAULT_POINT_MATRIX,
  formatTimestampID,
  PERINGKAT_LIST,
  ROLE_LABELS,
  TAHUN_AJARAN_LIST,
  TINGKAT_LIST,
} from '../lib/constants';
import {
  AuditLog,
  PeringkatPrestasi,
  PointMatrix,
  Student,
  TingkatPrestasi,
  UserProfile,
  UserRole,
} from '../types';

interface SettingsViewProps {
  matrix: PointMatrix;
  tahunAjaranAktif: string;
  users: UserProfile[];
  students: Student[];
  auditLogs: AuditLog[];
  onSavePointMatrix: (matrix: PointMatrix, tahunAjaranAktif: string) => Promise<void>;
  onUpdateUserRole: (
    userId: string,
    updates: { role: UserRole; studentId: string; statusAktif: 'aktif' | 'nonaktif' }
  ) => Promise<void>;
  onReseedSampleData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  matrix,
  tahunAjaranAktif,
  users,
  students,
  auditLogs,
  onSavePointMatrix,
  onUpdateUserRole,
  onReseedSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'poin' | 'pengguna' | 'audit' | 'contoh'>('poin');
  const [draftMatrix, setDraftMatrix] = useState<PointMatrix>(() =>
    JSON.parse(JSON.stringify(matrix || DEFAULT_POINT_MATRIX))
  );
  const [draftTahun, setDraftTahun] = useState(tahunAjaranAktif);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const handlePointChange = (
    tingkat: TingkatPrestasi,
    peringkat: PeringkatPrestasi,
    val: string
  ) => {
    const num = Math.max(0, Math.min(1000, Number(val) || 0));
    setDraftMatrix((prev) => ({
      ...prev,
      [tingkat]: {
        ...prev[tingkat],
        [peringkat]: num,
      },
    }));
  };

  const handleSaveMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setSavingMatrix(true);
    try {
      await onSavePointMatrix(draftMatrix, draftTahun);
      setFeedback('Matriks poin dan tahun ajaran aktif berhasil disimpan. Poin seluruh prestasi telah diperbarui.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan poin.');
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleResetMatrix = () => {
    setDraftMatrix(JSON.parse(JSON.stringify(DEFAULT_POINT_MATRIX)));
  };

  const handleRoleUpdate = async (
    u: UserProfile,
    role: UserRole,
    studentId: string,
    statusAktif: 'aktif' | 'nonaktif'
  ) => {
    setError(null);
    setFeedback(null);
    setSavingUserId(u.id);
    try {
      await onUpdateUserRole(u.id, { role, studentId, statusAktif });
      setFeedback(`Peran akun ${u.nama} diperbarui menjadi ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui peran pengguna.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleReseed = async () => {
    setError(null);
    setFeedback(null);
    setSeeding(true);
    try {
      await onReseedSampleData();
      setFeedback('15 data siswa dan 30 data prestasi contoh berhasil dimuat ke database.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data contoh.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Pengaturan Sistem &amp; Tata Kelola
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Atur bobot poin otomatis, kelola peran pengguna, dan pantau log perubahan permanen
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('poin')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'poin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tabel Poin</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pengguna')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'pengguna' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Pengguna &amp; Peran ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Log Audit ({auditLogs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contoh')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'contoh' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Contoh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {feedback}
        </div>
      )}

      {/* Tab 1: Matriks Poin */}
      {activeTab === 'poin' && (
        <form onSubmit={handleSaveMatrix} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Pengaturan Bobot Poin Otomatis
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai poin dihitung otomatis dari kombinasi tingkat lomba dan peringkat juara.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Tahun Ajaran Aktif:
              </label>
              <select
                value={draftTahun}
                onChange={(e) => setDraftTahun(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TAHUN_AJARAN_LIST.map((ta) => (
                  <option key={ta} value={ta}>
                    {ta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                  <th className="py-3 px-4">Tingkat / Peringkat</th>
                  {PERINGKAT_LIST.map((p) => (
                    <th key={p} className="py-3 px-3 text-center whitespace-nowrap">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TINGKAT_LIST.map((tingkat) => (
                  <tr key={tingkat} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {tingkat}
                    </td>
                    {PERINGKAT_LIST.map((peringkat) => (
                      <td key={peringkat} className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={1000}
                          value={draftMatrix[tingkat]?.[peringkat] ?? 0}
                          onChange={(e) =>
                            handlePointChange(tingkat, peringkat, e.target.value)
                          }
                          className="w-16 px-2 py-1.5 rounded-md border border-slate-300 text-center font-mono tabular-nums font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetMatrix}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembalikan Nilai Standar</span>
            </button>

            <button
              type="submit"
              disabled={savingMatrix}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingMatrix ? 'Menyimpan...' : 'Simpan & Hitung Ulang Poin'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Pengguna & Peran */}
      {activeTab === 'pengguna' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Manajemen Akun &amp; Peran Pengguna
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tetapkan peran pengguna (Admin, Guru/Pembina, Siswa, Kepala Sekolah) dan tautkan NIS siswa bila berperan sebagai Siswa.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-3 px-4">Nama &amp; Email</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Tautan Data Siswa</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{u.nama}</p>
                      <p className="text-slate-500 font-mono">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        disabled={savingUserId === u.id}
                        value={u.role}
                        onChange={(e) =>
                          handleRoleUpdate(
                            u,
                            e.target.value as UserRole,
                            u.studentId || '',
                            u.statusAktif
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                      >
                        {(['admin', 'guru', 'siswa', 'kepala_sekolah'] as UserRole[]).map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'siswa' ? (
                        <select
                          disabled={savingUserId === u.id}
                          value={u.studentId || ''}
                          onChange={(e) =>
                            handleRoleUpdate(u, u.role, e.target.value, u.statusAktif)
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 max-w-[220px]"
                        >
                          <option value="">-- Belum ditautkan --</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nama} ({s.jenjang} {s.kelas})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400">Tidak berlaku</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        disabled={savingUserId === u.id}
                        value={u.statusAktif}
                        onChange={(e) =>
                          handleRoleUpdate(
                            u,
                            u.role,
                            u.studentId || '',
                            e.target.value as 'aktif' | 'nonaktif'
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-900">
              Catatan Audit Perubahan Permanen
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap penambahan, verifikasi, penolakan, pembatalan prestasi, dan perubahan pengaturan dicatat permanen.
            </p>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada aktivitas tercatat di log audit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pelaku</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Objek Data</th>
                    <th className="py-3 px-4">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatTimestampID(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{log.actorName}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-600">{ROLE_LABELS[log.actorRole]}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {log.targetTitle}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {log.reason || log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Data Contoh */}
      {activeTab === 'contoh' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Data Contoh Aplikasi (15 Siswa &amp; 30 Prestasi)
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Gunakan tombol di bawah apabila ingin memuat ulang data contoh awal (15 siswa jenjang SD/SMP/SMA beserta 30 catatan prestasi contoh dalam berbagai kategori, tingkat, dan status verifikasi) ke database Firestore.
          </p>
          <button
            type="button"
            onClick={handleReseed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>{seeding ? 'Memuat Data Contoh...' : 'Muat / Pulihkan 15 Siswa & 30 Prestasi Contoh'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

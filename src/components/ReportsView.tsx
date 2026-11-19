import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer, Save, Sparkles } from 'lucide-react';
import {
  DEFAULT_TAHUN_AJARAN,
  formatTanggalID,
  JENJANG_LIST,
  KATEGORI_LIST,
  SCHOOL_NAME,
  TAHUN_AJARAN_LIST,
} from '../lib/constants';
import {
  downloadSchoolReportPDF,
  exportAchievementsToExcelCSV,
} from '../lib/exportUtils';
import {
  Achievement,
  Jenjang,
  KategoriPrestasi,
  SchoolReport,
  UserRole,
} from '../types';

interface ReportsViewProps {
  achievements: Achievement[];
  schoolReports: SchoolReport[];
  tahunAjaranAktif: string;
  role: UserRole;
  onSaveSchoolSummary: (tahunAjaran: string, ringkasanAi: string) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  achievements,
  schoolReports,
  tahunAjaranAktif,
  role,
  onSaveSchoolSummary,
}) => {
  const [tahunFilter, setTahunFilter] = useState<string>(
    tahunAjaranAktif || DEFAULT_TAHUN_AJARAN
  );
  const [jenjangFilter, setJenjangFilter] = useState<'Semua' | Jenjang>('Semua');
  const [kelasFilter, setKelasFilter] = useState<string>('Semua');
  const [kategoriFilter, setKategoriFilter] = useState<'Semua' | KategoriPrestasi>('Semua');
  const [ringkasanDraft, setRingkasanDraft] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportKey = tahunFilter === 'Semua' ? 'all' : tahunFilter;

  useEffect(() => {
    const saved = schoolReports.find(
      (r) => r.tahunAjaran === (tahunFilter === 'Semua' ? 'Semua' : tahunFilter)
    );
    setRingkasanDraft(saved?.ringkasanAi ?? '');
  }, [schoolReports, tahunFilter, reportKey]);

  const approvedAll = useMemo(
    () => achievements.filter((a) => a.status === 'Disetujui'),
    [achievements]
  );

  const kelasOptions = useMemo(() => {
    const subset =
      jenjangFilter === 'Semua'
        ? approvedAll
        : approvedAll.filter((a) => a.studentJenjang === jenjangFilter);
    return Array.from(new Set(subset.map((a) => a.studentKelas))).sort();
  }, [approvedAll, jenjangFilter]);

  const filtered = useMemo(() => {
    return approvedAll
      .filter((a) => {
        if (tahunFilter !== 'Semua' && a.tahunAjaran !== tahunFilter) return false;
        if (jenjangFilter !== 'Semua' && a.studentJenjang !== jenjangFilter) return false;
        if (kelasFilter !== 'Semua' && a.studentKelas !== kelasFilter) return false;
        if (kategoriFilter !== 'Semua' && a.kategori !== kategoriFilter) return false;
        return true;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [approvedAll, tahunFilter, jenjangFilter, kelasFilter, kategoriFilter]);

  const totalSiswaBerprestasi = useMemo(
    () => new Set(filtered.map((a) => a.studentId)).size,
    [filtered]
  );

  const totalPoin = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.poin || 0), 0),
    [filtered]
  );

  // Rekap per Tahun Ajaran
  const rekapPerTahun = useMemo(() => {
    return TAHUN_AJARAN_LIST.map((ta) => {
      const items = approvedAll.filter((a) => a.tahunAjaran === ta);
      return {
        tahunAjaran: ta,
        jumlah: items.length,
        siswa: new Set(items.map((i) => i.studentId)).size,
        poin: items.reduce((sum, i) => sum + (i.poin || 0), 0),
      };
    });
  }, [approvedAll]);

  // Rekap per Kelas
  const rekapPerKelas = useMemo(() => {
    const map = new Map<
      string,
      { key: string; jenjang: Jenjang; kelas: string; jumlah: number; poin: number }
    >();
    for (const a of filtered) {
      const key = `${a.studentJenjang}__${a.studentKelas}`;
      const cur = map.get(key) || {
        key,
        jenjang: a.studentJenjang,
        kelas: a.studentKelas,
        jumlah: 0,
        poin: 0,
      };
      cur.jumlah += 1;
      cur.poin += a.poin || 0;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.poin - a.poin);
  }, [filtered]);

  // Rekap per Kategori
  const rekapPerKategori = useMemo(() => {
    return KATEGORI_LIST.map((kat) => {
      const items = filtered.filter((a) => a.kategori === kat);
      return {
        kategori: kat,
        jumlah: items.length,
        poin: items.reduce((sum, i) => sum + (i.poin || 0), 0),
      };
    });
  }, [filtered]);

  const handleGenerateRingkasan = async () => {
    setError(null);
    setMessage(null);
    setLoadingAi(true);
    try {
      const perJenjang: Record<string, number> = {};
      const perKategori: Record<string, number> = {};
      const perTingkat: Record<string, number> = {};
      const studentAgg = new Map<
        string,
        { nama: string; kelas: string; jenjang: string; poin: number; jumlah: number }
      >();

      for (const a of filtered) {
        perJenjang[a.studentJenjang] = (perJenjang[a.studentJenjang] || 0) + 1;
        perKategori[a.kategori] = (perKategori[a.kategori] || 0) + 1;
        perTingkat[a.tingkat] = (perTingkat[a.tingkat] || 0) + 1;
        const s = studentAgg.get(a.studentId) || {
          nama: a.studentNama,
          kelas: a.studentKelas,
          jenjang: a.studentJenjang,
          poin: 0,
          jumlah: 0,
        };
        s.poin += a.poin || 0;
        s.jumlah += 1;
        studentAgg.set(a.studentId, s);
      }

      const topStudents = Array.from(studentAgg.values())
        .sort((a, b) => b.poin - a.poin)
        .slice(0, 5);

      const highlights = filtered
        .slice()
        .sort((a, b) => b.poin - a.poin)
        .slice(0, 5)
        .map((a) => `${a.peringkat} ${a.namaLomba} (${a.tingkat}) oleh ${a.studentNama}`);

      const res = await fetch('/api/ai/ringkasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahunAjaran: tahunFilter === 'Semua' ? 'Semua Tahun Ajaran' : tahunFilter,
          stats: {
            totalPrestasi: filtered.length,
            totalSiswaBerprestasi,
            totalPoin,
            perJenjang,
            perKategori,
            perTingkat,
            topStudents,
            highlights,
          },
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        throw new Error(data.error || 'Gagal menyusun ringkasan sekolah.');
      }
      setRingkasanDraft(data.text);
      setMessage('Draf ringkasan sekolah berhasil dibuat. Sunting bila perlu sebelum menyimpan atau mencetak.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghubungi layanan AI.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveRingkasan = async () => {
    if (!ringkasanDraft.trim()) {
      setError('Isi ringkasan belum boleh kosong.');
      return;
    }
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const targetTahun = tahunFilter === 'Semua' ? DEFAULT_TAHUN_AJARAN : tahunFilter;
      await onSaveSchoolSummary(targetTahun, ringkasanDraft.trim());
      setMessage(`Ringkasan sekolah untuk Tahun Ajaran ${targetTahun} berhasil disimpan.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan ringkasan sekolah.');
    } finally {
      setSaving(false);
    }
  };

  const canSaveSummary = role === 'admin' || role === 'kepala_sekolah';
  const canGenerateSummary = role === 'admin' || role === 'kepala_sekolah' || role === 'guru';

  const handleExportExcel = () => {
    const suffix = tahunFilter === 'Semua' ? 'semua-tahun' : tahunFilter.replace('/', '-');
    exportAchievementsToExcelCSV(filtered, `rekap-prestasi-nurul-insan-${suffix}.csv`);
  };

  const handleExportPdf = () => {
    downloadSchoolReportPDF({
      tahunAjaran: tahunFilter === 'Semua' ? 'Semua Tahun' : tahunFilter,
      filterLabel: `${jenjangFilter === 'Semua' ? 'SD/SMP/SMA' : jenjangFilter} · ${kategoriFilter}`,
      totalPrestasi: filtered.length,
      totalSiswa: totalSiswaBerprestasi,
      totalPoin,
      achievements: filtered,
      ringkasanAi: ringkasanDraft,
    });
  };

  return (
    <div className="space-y-6 print-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Laporan &amp; Rekapitulasi Sekolah
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rekap prestasi terverifikasi per tahun ajaran, kelas, dan kategori beserta ekspor Excel &amp; PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel (CSV)</span>
          </button>
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
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print-only border-b-2 border-blue-700 pb-3 mb-4">
        <p className="text-xs font-semibold text-emerald-700">{SCHOOL_NAME} · SD / SMP / SMA</p>
        <h1 className="text-xl font-bold text-slate-900">
          Laporan Rekapitulasi Prestasi Siswa · Tahun Ajaran {tahunFilter}
        </h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
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
      </div>

      {/* Ringkasan Eksekutif AI untuk Kepala Sekolah */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Ringkasan Capaian Sekolah (Laporan Kepala Sekolah)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hasil ringkasan AI dapat disunting sebelum disimpan ke arsip atau diunduh ke PDF.
            </p>
          </div>
          {canGenerateSummary && (
            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={handleGenerateRingkasan}
                disabled={loadingAi}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingAi ? 'Menyusun Ringkasan...' : 'Ringkasan sekolah'}</span>
              </button>
              {canSaveSummary && (
                <button
                  type="button"
                  onClick={handleSaveRingkasan}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            {message}
          </div>
        )}

        <textarea
          rows={5}
          value={ringkasanDraft}
          onChange={(e) => setRingkasanDraft(e.target.value)}
          placeholder='Klik tombol "Ringkasan sekolah" untuk menghasilkan rangkuman capaian tahun ajaran ini, lalu sunting sesuai kebutuhan.'
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* 3 Tabel Rekapitulasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekap per Tahun Ajaran */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Rekap per Tahun Ajaran
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-4">Tahun Ajaran</th>
                <th className="py-2.5 px-4 text-right">Prestasi</th>
                <th className="py-2.5 px-4 text-right">Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekapPerTahun.map((r) => (
                <tr key={r.tahunAjaran}>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {r.tahunAjaran}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {r.jumlah}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                    {r.poin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rekap per Kategori */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Rekap per Kategori
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-4">Kategori</th>
                <th className="py-2.5 px-4 text-right">Prestasi</th>
                <th className="py-2.5 px-4 text-right">Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekapPerKategori.map((r) => (
                <tr key={r.kategori}>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{r.kategori}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {r.jumlah}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                    {r.poin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rekap per Kelas */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-display text-sm font-bold text-slate-900">
              Rekap per Kelas
            </h3>
          </div>
          {rekapPerKelas.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Belum ada data pada filter ini.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-4">Kelas</th>
                  <th className="py-2.5 px-4 text-right">Prestasi</th>
                  <th className="py-2.5 px-4 text-right">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekapPerKelas.slice(0, 8).map((r) => (
                  <tr key={r.key}>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {r.jenjang} · {r.kelas}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {r.jumlah}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                      {r.poin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rincian Data Terverifikasi */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-bold text-slate-900">
            Rincian Prestasi Terverifikasi ({filtered.length})
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {totalSiswaBerprestasi} siswa · Total {totalPoin} poin
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Tidak ada prestasi disetujui yang sesuai dengan filter laporan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Lomba / Kegiatan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tingkat · Peringkat</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 text-right">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{a.studentNama}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {a.studentJenjang} {a.studentKelas}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900">{a.namaLomba}</td>
                    <td className="py-2.5 px-4 text-slate-600">{a.kategori}</td>
                    <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                      {a.tingkat} · {a.peringkat}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatTanggalID(a.tanggal)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-blue-700">
                      {a.poin}
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

import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { SCHOOL_ASSETS, SCHOOL_NAME, SCHOOL_SUBTITLE } from '../lib/constants';

interface LoginScreenProps {
  onLoginGoogle: () => Promise<void>;
  onLoginRedirect: () => Promise<void>;
  popupBlocked?: boolean;
  errorMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginGoogle,
  onLoginRedirect,
  popupBlocked = false,
  errorMessage,
}) => {
  const [loading, setLoading] = useState(false);

  // Trigger signInWithPopup synchronously inside the click gesture before awaiting
  const handleSignIn = () => {
    const promise = onLoginGoogle();
    setLoading(true);
    promise.finally(() => setLoading(false));
  };

  const handleRedirectSignIn = () => {
    const promise = onLoginRedirect();
    setLoading(true);
    promise.finally(() => setLoading(false));
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
  const isInIframe =
    typeof window !== 'undefined' &&
    (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clean Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src={SCHOOL_ASSETS.EMBLEM}
              alt="Logo Sekolah Nurul Insan"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white"
            />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              {SCHOOL_NAME}
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="whitespace-nowrap">SD · SMP · SMA</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Portofolio Siswa</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="whitespace-nowrap">Rekap &amp; Poin Otomatis</span>
          </nav>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Menghubungkan...' : 'Masuk Portal'}
          </button>
        </div>
      </header>

      {/* Main 2-column split with items-stretch */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-700 mb-3">
              {SCHOOL_SUBTITLE}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-4 [text-wrap:balance]">
              Sistem Prestasi Siswa Terpadu
            </h1>
            <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
              Satu tempat resmi untuk mencatat, memverifikasi, menghitung poin, dan menyusun portofolio prestasi akademik maupun non-akademik seluruh peserta didik Nurul Insan.
            </p>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 space-y-3">
                <p className="font-semibold">{errorMessage}</p>
                {popupBlocked && (
                  <div className="text-xs text-red-900 space-y-2.5 pt-1 border-t border-red-200">
                    <p>
                      <strong>Cara mengatasi:</strong> Klik ikon <em>pop-up diblokir</em> di bilah alamat browser lalu pilih <strong>Selalu izinkan pop-up</strong>, kemudian coba lagi — atau buka aplikasi di tab browser baru.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={currentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Portal di Tab Baru</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-white text-red-800 text-xs font-semibold hover:bg-red-50 cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Masuk Lagi</span>
                      </button>
                      {!isInIframe && (
                        <button
                          type="button"
                          onClick={handleRedirectSignIn}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                        >
                          <span>Login via Pengalihan</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"
                  />
                </svg>
                <span>{loading ? 'Memproses Masuk...' : 'Masuk dengan Akun Google Sekolah'}</span>
              </button>

              {isInIframe && !popupBlocked && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </a>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Akses otomatis disesuaikan dengan peran akun Anda: Admin, Guru/Pembina, Siswa, atau Kepala Sekolah.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verifikasi Berjenjang</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pengajuan siswa diverifikasi pembina lengkap dengan jejak riwayat perubahan.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
                <Award className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Poin &amp; Peringkat</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bobot poin dihitung otomatis berdasar tingkat dan peringkat lomba.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ekspor PDF &amp; Excel</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unduh portofolio siswa, laporan tahunan, serta draf narasi resmi berbantuan AI.
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[340px]">
          <img
            src={SCHOOL_ASSETS.HERO}
            alt="Siswa berprestasi Sekolah Nurul Insan"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover lg:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 mb-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Rekam Jejak Permanen · SD / SMP / SMA</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold leading-snug mb-2">
              Mendokumentasikan Setiap Langkah Juara Siswa Nurul Insan
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg">
              Dari olimpiade sains tingkat nasional hingga kompetisi keagamaan, olahraga, seni, teknologi, dan kepemimpinan di seluruh jenjang.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

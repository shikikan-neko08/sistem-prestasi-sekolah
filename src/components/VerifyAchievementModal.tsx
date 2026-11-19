import React, { useState } from 'react';
import { Award, Ban, CheckCircle2, Edit3, FileText, History, X, XCircle } from 'lucide-react';
import { formatTanggalID, formatTimestampID } from '../lib/constants';
import { Achievement, AuditLog, UserRole } from '../types';
import { StatusLabel } from './StatusLabel';

interface VerifyAchievementModalProps {
  achievement: Achievement;
  role: UserRole;
  auditLogs: AuditLog[];
  onClose: () => void;
  onApprove: (achievement: Achievement) => Promise<void>;
  onReject: (achievement: Achievement, reason: string) => Promise<void>;
  onCancelApproved: (achievement: Achievement, reason: string) => Promise<void>;
  onEditRequested: (achievement: Achievement) => void;
}

export const VerifyAchievementModal: React.FC<VerifyAchievementModalProps> = ({
  achievement,
  role,
  auditLogs,
  onClose,
  onApprove,
  onReject,
  onCancelApproved,
  onEditRequested,
}) => {
  const [mode, setMode] = useState<'view' | 'reject' | 'cancel'>('view');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const canVerifyOrCancel = role === 'admin' || role === 'guru';
  const canSiswaEdit =
    role === 'siswa' && (achievement.status === 'Menunggu' || achievement.status === 'Ditolak');
  const canStaffEdit =
    canVerifyOrCancel && (achievement.status === 'Menunggu' || achievement.status === 'Ditolak');

  const relatedLogs = auditLogs.filter(
    (l) => l.targetType === 'achievement' && l.targetId === achievement.id
  );

  const handleApprove = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onApprove(achievement);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui prestasi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = reason.trim();
    if (mode === 'reject' && trimmed.length < 3) {
      setError('Alasan penolakan minimal 3 karakter.');
      return;
    }
    if (mode === 'cancel' && trimmed.length < 5) {
      setError('Alasan pembatalan wajib diisi minimal 5 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'reject') {
        await onReject(achievement, trimmed);
      } else if (mode === 'cancel') {
        await onCancelApproved(achievement, trimmed);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses perubahan status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden my-8">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <StatusLabel status={achievement.status} />
              <span className="text-xs text-slate-400" aria-hidden="true">·</span>
              <span className="text-xs font-mono text-slate-500">
                TA {achievement.tahunAjaran}
              </span>
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 leading-snug">
              {achievement.namaLomba}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {achievement.studentNama} · {achievement.studentJenjang} {achievement.studentKelas}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Ringkasan Metadata Prestasi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Kategori</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{achievement.kategori}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Tingkat</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{achievement.tingkat}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Peringkat</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{achievement.peringkat}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Nilai Poin</p>
              <p className="text-sm font-mono tabular-nums font-bold text-blue-700 mt-0.5">
                {achievement.status === 'Disetujui'
                  ? `${achievement.poin} poin`
                  : `${achievement.poin} poin (estimasi)`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Penyelenggara</p>
              <p className="text-slate-900 font-medium mt-0.5">{achievement.penyelenggara}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Tanggal Pelaksanaan</p>
              <p className="text-slate-900 font-medium mt-0.5">{formatTanggalID(achievement.tanggal)}</p>
            </div>
          </div>

          {achievement.deskripsi && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Keterangan</p>
              <p className="text-sm text-slate-700 leading-relaxed">{achievement.deskripsi}</p>
            </div>
          )}

          {achievement.status === 'Ditolak' && achievement.alasanPenolakan && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <p className="font-semibold mb-1">Alasan Penolakan:</p>
              <p>{achievement.alasanPenolakan}</p>
            </div>
          )}

          {achievement.status === 'Dibatalkan' && achievement.alasanPembatalan && (
            <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-300 text-xs text-slate-800">
              <p className="font-semibold mb-1">Alasan Pembatalan (Data Diarsipkan):</p>
              <p>{achievement.alasanPembatalan}</p>
            </div>
          )}

          {/* Bukti Sertifikat / Piala */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Bukti Lampiran ({achievement.buktiNama || 'Sertifikat / Piala'})
            </p>
            {achievement.buktiUrl && !imgFailed ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <img
                  src={achievement.buktiUrl}
                  alt={`Bukti ${achievement.namaLomba}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full max-h-72 object-contain bg-slate-100"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center text-slate-500">
                <FileText className="w-7 h-7 mb-2 text-slate-400" />
                <p className="text-xs font-medium">Tidak ada foto sertifikat atau piala terlampir.</p>
              </div>
            )}
          </div>

          {/* Form Alasan Tolak / Batalkan */}
          {mode !== 'view' && (
            <form onSubmit={handleSubmitReason} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <label className="block text-xs font-semibold text-slate-800">
                {mode === 'reject'
                  ? 'Alasan Penolakan (wajib diisi agar siswa dapat memperbaiki):'
                  : 'Alasan Pembatalan Prestasi Disetujui (dicatat permanen di log audit):'}
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  mode === 'reject'
                    ? 'Contoh: Foto sertifikat kurang jelas atau tanggal belum sesuai...'
                    : 'Contoh: Koreksi administratif karena duplikasi entri atau kesalahan data peserta...'
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('view');
                    setReason('');
                    setError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer"
                >
                  {submitting
                    ? 'Memproses...'
                    : mode === 'reject'
                    ? 'Konfirmasi Tolak'
                    : 'Konfirmasi Pembatalan'}
                </button>
              </div>
            </form>
          )}

          {/* Riwayat Perubahan Prestasi */}
          {role !== 'siswa' && (
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Jejak Riwayat Perubahan</span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  Diajukan oleh <strong className="text-slate-900">{achievement.submittedByName}</strong> ·{' '}
                  {formatTimestampID(achievement.createdAt)}
                </p>
                {achievement.verifiedByName && (
                  <p>
                    Terakhir diverifikasi oleh{' '}
                    <strong className="text-slate-900">{achievement.verifiedByName}</strong> ·{' '}
                    {formatTimestampID(achievement.updatedAt)}
                  </p>
                )}
                {relatedLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatTimestampID(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600">
                      Oleh {log.actorName} ({log.actorRole})
                      {log.reason ? ` — Alasan: "${log.reason}"` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Prestasi disetujui tidak dihapus demi keutuhan arsip.</span>
          </div>
          <div className="flex items-center gap-2.5">
            {(canSiswaEdit || canStaffEdit) && mode === 'view' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRequested(achievement);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Perbaiki Data</span>
              </button>
            )}

            {canVerifyOrCancel && achievement.status === 'Menunggu' && mode === 'view' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('reject')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 bg-white text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak</span>
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Menyetujui...' : 'Setujui Prestasi'}</span>
                </button>
              </>
            )}

            {canVerifyOrCancel && achievement.status === 'Disetujui' && mode === 'view' && (
              <button
                type="button"
                onClick={() => setMode('cancel')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Batalkan Prestasi</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

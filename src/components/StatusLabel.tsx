import React from 'react';
import { Ban, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { StatusVerifikasi } from '../types';

interface StatusLabelProps {
  status: StatusVerifikasi;
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status }) => {
  switch (status) {
    case 'Disetujui':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Disetujui</span>
        </span>
      );
    case 'Menunggu':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Menunggu</span>
        </span>
      );
    case 'Ditolak':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Ditolak</span>
        </span>
      );
    case 'Dibatalkan':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
          <Ban className="w-3.5 h-3.5 shrink-0" />
          <span>Dibatalkan</span>
        </span>
      );
  }
};

import React from 'react';

export interface ChartDatum {
  label: string;
  count: number;
  points?: number;
}

interface HorizontalBarChartProps {
  data: ChartDatum[];
  accentColor?: 'blue' | 'emerald';
  emptyText?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  data,
  accentColor = 'blue',
  emptyText = 'Belum ada data prestasi disetujui.',
}) => {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  const barClass = accentColor === 'emerald' ? 'bg-emerald-600' : 'bg-blue-700';

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const widthPct = item.count === 0 ? 0 : Math.max(4, Math.round((item.count / maxVal) * 100));
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700 truncate">{item.label}</span>
              <span className="font-mono tabular-nums text-slate-600 shrink-0">
                {item.count} prestasi{item.points !== undefined ? ` · ${item.points} poin` : ''}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
              <div
                className={`h-full ${barClass} rounded-sm transition-all duration-300`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface VerticalColumnChartProps {
  data: ChartDatum[];
  emptyText?: string;
}

export const VerticalColumnChart: React.FC<VerticalColumnChartProps> = ({
  data,
  emptyText = 'Belum ada data prestasi disetujui.',
}) => {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 border-b border-slate-200 pb-2">
        {data.map((item, idx) => {
          const heightPct = item.count === 0 ? 0 : Math.max(8, Math.round((item.count / maxVal) * 100));
          const isHighlight = idx >= data.length - 2;
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-800 mb-1.5">
                {item.count}
              </span>
              <div className="w-full max-w-[44px] flex-1 flex items-end justify-center">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    item.count === 0
                      ? 'bg-slate-100 h-1'
                      : isHighlight
                      ? 'bg-emerald-600'
                      : 'bg-blue-700'
                  }`}
                  style={{ height: item.count === 0 ? '4px' : `${heightPct}%` }}
                  title={`${item.label}: ${item.count} prestasi`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-start justify-between gap-2 sm:gap-3 pt-2">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center min-w-0">
            <span className="block text-[11px] font-medium text-slate-600 leading-tight break-words">
              {item.label === 'Kabupaten/Kota' ? 'Kab/Kota' : item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

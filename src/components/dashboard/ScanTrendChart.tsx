'use client';

import React from 'react';
import { ScanTrendItem } from '@/lib/analytics/service';

interface ScanTrendChartProps {
  data: ScanTrendItem[];
  title?: string;
  subtitle?: string;
}

export const ScanTrendChart: React.FC<ScanTrendChartProps> = ({
  data,
  title = 'Scan Activity Over Time',
  subtitle = 'Aggregated daily scan frequency',
}) => {
  const maxCount = Math.max(...data.map((d) => d.count), 5);
  const totalPeriodScans = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-neutral-500">Period Total:</span>{' '}
          <span className="text-sm font-bold text-indigo-600">
            {totalPeriodScans.toLocaleString()} scans
          </span>
        </div>
      </div>

      {totalPeriodScans === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
          <p className="text-xs font-medium text-neutral-500">No scan activity recorded during this period.</p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Display your physical QR code or share your dynamic link to start tracking real-time insights.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Bar Chart Container */}
          <div className="h-44 sm:h-52 flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-neutral-200">
            {data.map((item, idx) => {
              const heightPercent = Math.max((item.count / maxCount) * 100, item.count > 0 ? 4 : 1);
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative min-w-[12px]"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-neutral-900 text-white text-[10px] font-semibold py-1 px-2 rounded-md shadow-md whitespace-nowrap">
                    {item.label}: {item.count} {item.count === 1 ? 'scan' : 'scans'}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      item.count > 0
                        ? 'bg-indigo-600 group-hover:bg-indigo-700'
                        : 'bg-neutral-200/60'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis date labels */}
          <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1 pt-1 font-mono">
            {data.length > 0 && <span>{data[0].label}</span>}
            {data.length > 2 && <span>{data[Math.floor(data.length / 2)].label}</span>}
            {data.length > 1 && <span>{data[data.length - 1].label}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

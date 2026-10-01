'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';
import { AnalyticsOverview, ScanTrendItem } from '@/lib/analytics/service';

interface QRAnalyticsCardProps {
  qrCodeId: string;
  qrTitle: string;
  overview: AnalyticsOverview;
  recentTrend: ScanTrendItem[];
}

export const QRAnalyticsCard: React.FC<QRAnalyticsCardProps> = ({
  qrCodeId,
  qrTitle,
  overview,
  recentTrend,
}) => {
  const maxTrend = Math.max(...recentTrend.map((t) => t.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Scan Analytics</h3>
            <p className="text-xs text-neutral-500">Live scan metrics for &ldquo;{qrTitle}&rdquo;</p>
          </div>
        </div>

        <Link
          href={`/dashboard/analytics?qrCodeId=${qrCodeId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition w-fit"
        >
          <span>View Detailed Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5">
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-neutral-500">Total Scans</span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900">
            {overview.totalScans.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-neutral-500">Today</span>
          </div>
          <div className="text-xl font-extrabold text-indigo-600">
            {overview.scansToday.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-neutral-500">Last 7 Days</span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900">
            {overview.scans7d.toLocaleString()}
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-neutral-500">Last 30 Days</span>
          </div>
          <div className="text-xl font-extrabold text-neutral-900">
            {overview.scans30d.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Mini Trend Bar Chart */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold mb-2">
          <span>7-Day Scan Trend</span>
          <span className="text-[11px] font-normal text-neutral-400">
            {recentTrend.length > 0 ? `${recentTrend[0].label} – ${recentTrend[recentTrend.length - 1].label}` : ''}
          </span>
        </div>

        {overview.scans7d === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-400 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
            No scans in the last 7 days.
          </div>
        ) : (
          <div className="h-16 flex items-end gap-1.5 pt-2 px-1">
            {recentTrend.map((t, idx) => {
              const hPercent = Math.max((t.count / maxTrend) * 100, t.count > 0 ? 8 : 2);
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-neutral-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded whitespace-nowrap">
                    {t.label}: {t.count}
                  </div>
                  <div
                    style={{ height: `${hPercent}%` }}
                    className={`w-full rounded-t-sm transition-all ${
                      t.count > 0 ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-neutral-200/60'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { AnalyticsRange } from '@/lib/analytics/service';

interface AnalyticsDateFilterProps {
  currentRange: AnalyticsRange;
  qrCodeId?: string;
}

export const AnalyticsDateFilter: React.FC<AnalyticsDateFilterProps> = ({
  currentRange,
  qrCodeId,
}) => {
  const searchParams = useSearchParams();

  const options: { label: string; range: AnalyticsRange }[] = [
    { label: 'Today', range: 'today' },
    { label: 'Last 7 days', range: '7d' },
    { label: 'Last 30 days', range: '30d' },
  ];

  const getHref = (range: AnalyticsRange) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('range', range);
    if (qrCodeId) {
      params.set('qrCodeId', qrCodeId);
    }
    return `/dashboard/analytics?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200/80">
      <div className="hidden sm:flex items-center px-2 text-neutral-400">
        <Calendar className="w-3.5 h-3.5" />
      </div>
      {options.map((opt) => {
        const isActive = currentRange === opt.range;
        return (
          <Link
            key={opt.range}
            href={getHref(opt.range)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              isActive
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
};

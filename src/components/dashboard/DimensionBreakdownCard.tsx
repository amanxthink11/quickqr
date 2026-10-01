'use client';

import React from 'react';
import { DimensionBreakdownItem } from '@/lib/analytics/service';

interface DimensionBreakdownCardProps {
  title: string;
  subtitle: string;
  items: DimensionBreakdownItem[];
  emptyMessage?: string;
  icon?: React.ReactNode;
}

export const DimensionBreakdownCard: React.FC<DimensionBreakdownCardProps> = ({
  title,
  subtitle,
  items,
  emptyMessage = 'No data available',
  icon,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-indigo-600">{icon}</span>}
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-4">{subtitle}</p>

        {items.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-neutral-100 rounded-xl bg-neutral-50/50">
            <p className="text-xs text-neutral-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800 truncate max-w-[65%]" title={item.name}>
                    {item.name}
                  </span>
                  <span className="text-neutral-500 font-mono text-[11px]">
                    {item.count.toLocaleString()} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(item.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface QRFilterBarProps {
  currentSearch?: string;
  currentStatus?: string;
}

export const QRFilterBar: React.FC<QRFilterBarProps> = ({
  currentSearch = '',
  currentStatus = 'ALL',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const applyFilters = (newSearch: string, newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch.trim()) {
      params.set('q', newSearch.trim());
    } else {
      params.delete('q');
    }

    if (newStatus && newStatus !== 'ALL') {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }

    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/dashboard/qr-codes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(search, currentStatus);
  };

  const handleStatusChange = (status: string) => {
    applyFilters(search, status);
  };

  const handleClear = () => {
    setSearch('');
    applyFilters('', 'ALL');
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by QR name or short code..."
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Status Filter Badges */}
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden md:inline px-1">
          Status:
        </span>
        {[
          { label: 'All', value: 'ALL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Paused', value: 'PAUSED' },
        ].map((item) => {
          const isSelected = (currentStatus || 'ALL') === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleStatusChange(item.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

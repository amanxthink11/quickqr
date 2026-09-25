'use client';

import React from 'react';
import { URLPayloadInput } from '@/lib/qr/types';
import { Globe, ShieldCheck } from 'lucide-react';

interface URLInputProps {
  value: URLPayloadInput;
  onChange: (value: URLPayloadInput) => void;
}

export const URLInput: React.FC<URLInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="url-input" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Website or Landing Page URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Globe className="w-4 h-4" />
          </div>
          <input
            id="url-input"
            type="url"
            required
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            placeholder="https://yourbrand.in"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Tip: You can paste your Shopify, Amazon, Instagram, or corporate website address.
        </p>
      </div>

      <div>
        <label htmlFor="url-label" className="block text-sm font-medium text-neutral-800 mb-1.5">
          Internal Label (Optional)
        </label>
        <input
          id="url-label"
          type="text"
          value={value.name || ''}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="e.g. Summer Sale Flyer 2026"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Used locally to identify this QR code on your device.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/60 p-3 rounded-lg">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Direct destination QR: Scanners open your exact URL without any third-party interstitial ads.</span>
      </div>
    </div>
  );
};

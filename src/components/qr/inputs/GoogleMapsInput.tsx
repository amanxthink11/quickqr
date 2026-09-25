'use client';

import React from 'react';
import { MapsPayloadInput } from '@/lib/qr/types';
import { MapPin, Info } from 'lucide-react';

interface GoogleMapsInputProps {
  value: MapsPayloadInput;
  onChange: (value: MapsPayloadInput) => void;
}

export const GoogleMapsInput: React.FC<GoogleMapsInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="maps-query" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Google Maps Link or Location Query <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <MapPin className="w-4 h-4 text-rose-500" />
          </div>
          <input
            id="maps-query"
            type="text"
            required
            value={value.queryOrUrl}
            onChange={(e) => onChange({ ...value, queryOrUrl: e.target.value })}
            placeholder="e.g. https://maps.app.goo.gl/... or 'Connaught Place, New Delhi'"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
          <Info className="w-4 h-4 text-neutral-700" />
          <span>How to get your exact Google Maps link:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-neutral-600">
          <li>Open Google Maps on your phone or computer.</li>
          <li>Search for your business or store location.</li>
          <li>Tap the <strong>Share</strong> button and choose <strong>Copy link</strong>.</li>
          <li>Paste the link into the box above.</li>
        </ol>
        <p className="pt-1 text-neutral-500 italic">
          Note: This QR directs customers directly into Google Maps on their device for turn-by-turn navigation.
        </p>
      </div>
    </div>
  );
};

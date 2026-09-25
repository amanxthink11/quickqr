'use client';

import React from 'react';
import { TextPayloadInput } from '@/lib/qr/types';

interface TextInputProps {
  value: TextPayloadInput;
  onChange: (value: TextPayloadInput) => void;
}

export const TextInput: React.FC<TextInputProps> = ({ value, onChange }) => {
  const charCount = value.text ? value.text.length : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="raw-text" className="block text-sm font-semibold text-neutral-900">
            Text Content <span className="text-red-500">*</span>
          </label>
          <span
            className={`text-xs font-mono ${
              charCount > 400 ? 'text-amber-600 font-semibold' : 'text-neutral-500'
            }`}
          >
            {charCount} characters
          </span>
        </div>
        <textarea
          id="raw-text"
          rows={5}
          required
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Enter plain text, notes, serial keys, inventory SKU, instructions, or coupon codes..."
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          {charCount > 300
            ? '⚠️ Notice: Longer text increases QR module density. Recommended: keep below 300 characters for instant scanning from distances.'
            : 'Plain text is displayed directly on the scanner screen without opening an internet browser.'}
        </p>
      </div>
    </div>
  );
};

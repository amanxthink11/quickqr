'use client';

import React from 'react';
import { PhonePayloadInput } from '@/lib/qr/types';
import { PhoneCall } from 'lucide-react';

interface PhoneInputProps {
  value: PhonePayloadInput;
  onChange: (value: PhonePayloadInput) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="phone-number" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Phone Number to Dial <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <PhoneCall className="w-4 h-4" />
          </div>
          <input
            id="phone-number"
            type="tel"
            required
            value={value.phoneNumber}
            onChange={(e) => onChange({ ...value, phoneNumber: e.target.value })}
            placeholder="e.g. +91 98765 43210 or 1800-123-4567"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Include country code (+91) for international dial compatibility.
        </p>
      </div>

      <div className="p-3 bg-green-50 border border-green-200/70 rounded-lg text-xs text-green-900">
        When scanned, the user&apos;s phone dialer opens immediately with this number dialed, ready to place the call.
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { WiFiPayloadInput } from '@/lib/qr/types';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface WiFiInputProps {
  value: WiFiPayloadInput;
  onChange: (value: WiFiPayloadInput) => void;
}

export const WiFiInput: React.FC<WiFiInputProps> = ({ value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wifi-ssid" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Network Name (SSID) <span className="text-red-500">*</span>
        </label>
        <input
          id="wifi-ssid"
          type="text"
          required
          value={value.ssid}
          onChange={(e) => onChange({ ...value, ssid: e.target.value })}
          placeholder="e.g. Cafe_Free_WiFi"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Exact network name broadcast by your router (case-sensitive).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="wifi-security" className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Security Type
          </label>
          <select
            id="wifi-security"
            value={value.authType}
            onChange={(e) =>
              onChange({
                ...value,
                authType: e.target.value as 'WPA' | 'WEP' | 'nopass',
              })
            }
            className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
          >
            <option value="WPA">WPA / WPA2 / WPA3 (Standard)</option>
            <option value="WEP">WEP (Older)</option>
            <option value="nopass">None (Open Network)</option>
          </select>
        </div>

        {value.authType !== 'nopass' && (
          <div>
            <label htmlFor="wifi-pass" className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Wi-Fi Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="wifi-pass"
                type={showPassword ? 'text' : 'password'}
                required
                value={value.password || ''}
                onChange={(e) => onChange({ ...value, password: e.target.value })}
                placeholder="Enter network password"
                className="w-full px-3.5 py-2.5 pr-10 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="wifi-hidden"
          type="checkbox"
          checked={value.hidden || false}
          onChange={(e) => onChange({ ...value, hidden: e.target.checked })}
          className="w-4 h-4 text-sky-600 rounded border-neutral-300 focus:ring-sky-500"
        />
        <label htmlFor="wifi-hidden" className="text-xs text-neutral-700">
          This is a hidden network (SSID not publicly broadcast)
        </label>
      </div>

      <div className="p-3 bg-sky-50 border border-sky-200/70 rounded-lg flex items-start gap-2.5 text-xs text-sky-900">
        <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          Guests scan this QR with their iOS or Android camera and tap <strong>&ldquo;Join Network&rdquo;</strong> to connect instantly without asking or typing passwords.
        </span>
      </div>
    </div>
  );
};

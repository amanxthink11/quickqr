'use client';

import React from 'react';
import { MenuPayloadInput } from '@/lib/qr/types';
import { Utensils, Sparkles, CheckCircle2 } from 'lucide-react';

interface MenuInputProps {
  value: MenuPayloadInput;
  onChange: (value: MenuPayloadInput) => void;
  onApplyPresetText?: (text: string) => void;
}

const MENU_LABELS = [
  'SCAN FOR DIGITAL MENU',
  'VIEW FOOD & DRINKS',
  'DINE-IN MENU',
  'CHEF SPECIALS',
  'BAR & COCKTAIL LIST',
];

export const MenuInput: React.FC<MenuInputProps> = ({
  value,
  onChange,
  onApplyPresetText,
}) => {
  return (
    <div className="space-y-4">
      {/* Restaurant Name */}
      <div>
        <label htmlFor="menu-rest-name" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Restaurant / Cafe Name (Optional)
        </label>
        <input
          id="menu-rest-name"
          type="text"
          value={value.restaurantName || ''}
          onChange={(e) => onChange({ ...value, restaurantName: e.target.value })}
          placeholder="e.g. The Royal Bistro & Cafe"
          className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition"
        />
      </div>

      {/* Menu URL */}
      <div>
        <label htmlFor="menu-url" className="block text-sm font-semibold text-neutral-900 mb-1.5">
          Digital Menu Link / Website URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Utensils className="w-4 h-4 text-rose-600" />
          </div>
          <input
            id="menu-url"
            type="url"
            required
            value={value.menuUrl}
            onChange={(e) => onChange({ ...value, menuUrl: e.target.value })}
            placeholder="e.g. https://yourcafe.in/menu or linktr.ee/yourbistro"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Enter the link to your website menu, PDF hosted menu, Instagram bio menu, or Zomato/Swiggy menu link.
        </p>
      </div>

      {/* Table Tent Preset Labels */}
      <div>
        <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Table Tent Label Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {MENU_LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onApplyPresetText?.(label)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/80 transition"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Benefits */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span>F&B Printing Best Practices</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-neutral-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Print at 300 DPI on acrylic stands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Matte lamination avoids restaurant glare</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Minimum size 4x4 cm for fast table scan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Works on iOS & Android camera directly</span>
          </div>
        </div>
      </div>
    </div>
  );
};

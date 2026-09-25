'use client';

import React, { useState } from 'react';
import {
  QRCustomization,
  QRDotStyle,
  QREyeStyle,
  QRFrameStyle,
  QRErrorCorrectionLevel,
} from '@/lib/qr/types';
import { STYLE_PRESETS } from '@/lib/qr/presets';
import { LOGO_PRESETS } from '@/lib/qr/logos';
import {
  Palette,
  Sparkles,
  Shapes,
  Image as ImageIcon,
  Square,
  Sliders,
  Upload,
  X,
  ShieldCheck,
} from 'lucide-react';

interface QRCustomizerProps {
  customization: QRCustomization;
  onChange: (customization: QRCustomization) => void;
}

type TabType = 'presets' | 'colors' | 'shapes' | 'logo' | 'frame' | 'advanced';

const COLOR_SWATCHES = [
  '#000000', // Black
  '#1E293B', // Slate 800
  '#065F46', // Emerald 800 (UPI)
  '#0F766E', // Teal 700 (WhatsApp)
  '#1D4ED8', // Blue 700
  '#3730A3', // Indigo 800
  '#581C87', // Purple 900
  '#881337', // Rose 900 (Menu)
  '#B45309', // Amber 700 (Review)
  '#C2410C', // Orange 700
];

const BG_SWATCHES = [
  '#FFFFFF', // Pure White
  '#F8FAFC', // Slate 50
  '#F0FDF4', // Mint 50
  '#F0FDF9', // Teal 50
  '#EFF6FF', // Blue 50
  '#FFFBEB', // Amber 50
];

export const QRCustomizer: React.FC<QRCustomizerProps> = ({
  customization,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  const updateField = <K extends keyof QRCustomization>(
    field: K,
    val: QRCustomization[K]
  ) => {
    onChange({
      ...customization,
      [field]: val,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      // When adding a logo, automatically set error correction to high if currently low
      const newEC =
        customization.errorCorrectionLevel === 'L' ||
        customization.errorCorrectionLevel === 'M'
          ? 'H'
          : customization.errorCorrectionLevel;

      onChange({
        ...customization,
        logoUrl: dataUrl,
        errorCorrectionLevel: newEC,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: (typeof STYLE_PRESETS)[0]) => {
    onChange({
      ...customization,
      ...preset.customization,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-200 bg-neutral-50/60 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'presets'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'colors'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Colors</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shapes')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'shapes'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Shapes className="w-3.5 h-3.5" />
          <span>Shapes & Eyes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logo')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'logo'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Logo</span>
          {customization.logoUrl && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('frame')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'frame'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Frame & Text</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
            activeTab === 'advanced'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Print & Safety</span>
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {/* Tab 1: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Select a battle-tested visual style designed for optimal contrast and smartphone camera reading:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="flex flex-col items-center p-3 rounded-xl border border-neutral-200 hover:border-indigo-500 hover:bg-neutral-50 transition text-center group"
                >
                  <div
                    className="w-8 h-8 rounded-lg mb-2 shadow-xs border border-neutral-200 flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: preset.customization.bgColor || '#FFF',
                      color: preset.customization.fgColor || '#000',
                    }}
                  >
                    QR
                  </div>
                  <span className="text-xs font-medium text-neutral-800 group-hover:text-indigo-600">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Colors */}
        {activeTab === 'colors' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                QR Pattern Color (Foreground)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customization.fgColor}
                  onChange={(e) => updateField('fgColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 p-0.5"
                />
                <input
                  type="text"
                  value={customization.fgColor}
                  onChange={(e) => updateField('fgColor', e.target.value)}
                  className="w-28 px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateField('fgColor', hex)}
                      className="w-6 h-6 rounded-md border border-neutral-300 transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customization.bgColor}
                  onChange={(e) => updateField('bgColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 p-0.5"
                />
                <input
                  type="text"
                  value={customization.bgColor}
                  onChange={(e) => updateField('bgColor', e.target.value)}
                  className="w-28 px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                />
                <div className="flex flex-wrap gap-1.5">
                  {BG_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateField('bgColor', hex)}
                      className="w-6 h-6 rounded-md border border-neutral-300 transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Corner Eye Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customization.eyeColor || customization.fgColor}
                  onChange={(e) => updateField('eyeColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-300 p-0.5"
                />
                <button
                  type="button"
                  onClick={() => updateField('eyeColor', customization.fgColor)}
                  className="text-xs text-neutral-500 hover:text-neutral-800 underline"
                >
                  Match Pattern Color
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Shapes */}
        {activeTab === 'shapes' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Pattern Body Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    ['square', 'Square'],
                    ['rounded', 'Rounded'],
                    ['dots', 'Dots'],
                    ['classy', 'Classy'],
                    ['extra-rounded', 'Smooth'],
                  ] as [QRDotStyle, string][]
                ).map(([styleKey, label]) => (
                  <button
                    key={styleKey}
                    type="button"
                    onClick={() => updateField('dotStyle', styleKey)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                      customization.dotStyle === styleKey
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Corner Eye Finder Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['square', 'Square Finder'],
                    ['rounded', 'Rounded Finder'],
                    ['circle', 'Circle Finder'],
                  ] as [QREyeStyle, string][]
                ).map(([eyeKey, label]) => (
                  <button
                    key={eyeKey}
                    type="button"
                    onClick={() => updateField('eyeStyle', eyeKey)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                      customization.eyeStyle === eyeKey
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Logo */}
        {activeTab === 'logo' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Center Brand Icon
                </label>
                {customization.logoUrl && (
                  <button
                    type="button"
                    onClick={() => updateField('logoUrl', undefined)}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove Logo
                  </button>
                )}
              </div>

              {/* Built-in logo presets */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {LOGO_PRESETS.map((logo) => (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => {
                      const newEC =
                        customization.errorCorrectionLevel === 'L' ||
                        customization.errorCorrectionLevel === 'M'
                          ? 'H'
                          : customization.errorCorrectionLevel;
                      onChange({
                        ...customization,
                        logoUrl: logo.dataUrl,
                        errorCorrectionLevel: newEC,
                      });
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl border transition ${
                      customization.logoUrl === logo.dataUrl
                        ? 'border-indigo-600 bg-indigo-50/70 font-semibold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.dataUrl} alt={logo.name} className="w-6 h-6 object-contain mb-1" />
                    <span className="text-[11px] truncate w-full text-center">{logo.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Logo Upload */}
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-neutral-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition">
                <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                <span className="text-xs font-medium text-neutral-700">Upload Custom Business Logo</span>
                <span className="text-[10px] text-neutral-500">PNG, SVG, or JPG (max 2MB)</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {customization.logoUrl && (
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-700">Logo Size Proportion</span>
                  <span className="font-mono text-neutral-500">
                    {Math.round(customization.logoSize * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.30"
                  step="0.01"
                  value={customization.logoSize}
                  onChange={(e) => updateField('logoSize', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Error correction automatically upgraded to Level H (30% recovery) to preserve scan reliability.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Frame & Text */}
        {activeTab === 'frame' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                Frame Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ['none', 'No Frame'],
                    ['bottom-banner', 'Bottom Banner'],
                    ['card', 'Store Card'],
                    ['badge', 'Badge Frame'],
                  ] as [QRFrameStyle, string][]
                ).map(([styleKey, label]) => (
                  <button
                    key={styleKey}
                    type="button"
                    onClick={() => updateField('frameStyle', styleKey)}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                      customization.frameStyle === styleKey
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {customization.frameStyle !== 'none' && (
              <>
                <div>
                  <label htmlFor="frame-text" className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Frame Call to Action Text
                  </label>
                  <input
                    id="frame-text"
                    type="text"
                    value={customization.frameText}
                    onChange={(e) => updateField('frameText', e.target.value)}
                    placeholder="e.g. SCAN & PAY WITH ANY UPI APP"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Frame Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customization.frameColor}
                        onChange={(e) => updateField('frameColor', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-neutral-300 p-0.5"
                      />
                      <span className="text-xs font-mono">{customization.frameColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customization.frameTextColor}
                        onChange={(e) => updateField('frameTextColor', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-neutral-300 p-0.5"
                      />
                      <span className="text-xs font-mono">{customization.frameTextColor}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 6: Print & Safety */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Error Correction Level
                </label>
                <span className="text-xs font-medium text-indigo-700">
                  {customization.errorCorrectionLevel === 'L' && 'Level L (~7% recovery)'}
                  {customization.errorCorrectionLevel === 'M' && 'Level M (~15% recovery - Standard)'}
                  {customization.errorCorrectionLevel === 'Q' && 'Level Q (~25% recovery)'}
                  {customization.errorCorrectionLevel === 'H' && 'Level H (~30% recovery - Recommended for logos/print)'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {(['L', 'M', 'Q', 'H'] as QRErrorCorrectionLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField('errorCorrectionLevel', level)}
                    className={`py-2 rounded-lg border text-xs font-semibold transition ${
                      customization.errorCorrectionLevel === level
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  Quiet Zone (Margin)
                </label>
                <span className="text-xs font-mono text-neutral-600">{customization.margin} modules</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={customization.margin}
                onChange={(e) => updateField('margin', parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                A clean border margin allows smartphone lenses to detect the QR code against busy backgrounds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

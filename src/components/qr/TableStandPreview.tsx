'use client';

import React, { useState } from 'react';
import { QRType, QRCustomization } from '@/lib/qr/types';
import {
  TableStandConfig,
  TableStandFormat,
  getDefaultTableStandConfig,
  getTableStandDimensions,
  renderTableStandToCanvas,
  openTableStandPrintDialog,
} from '@/lib/qr/table-stand';
import { triggerFileDownload, sanitizeFilename } from '@/lib/qr/download';
import {
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Settings2,
  Check,
} from 'lucide-react';

interface TableStandPreviewProps {
  qrCanvas: HTMLCanvasElement | null;
  customization: QRCustomization;
  qrType: QRType;
  qrTypeTitle: string;
  initialBusinessName?: string;
}

export const TableStandPreview: React.FC<TableStandPreviewProps> = ({
  qrCanvas,
  customization,
  qrType,
  initialBusinessName,
}) => {
  const [config, setConfig] = useState<TableStandConfig>(() =>
    getDefaultTableStandConfig(qrType, initialBusinessName || 'Your Business Name')
  );
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedState, setCopiedState] = useState(false);

  // Adjust state when qrType prop changes (official React pattern)
  const [prevQrType, setPrevQrType] = useState(qrType);
  if (prevQrType !== qrType) {
    setPrevQrType(qrType);
    setConfig(getDefaultTableStandConfig(qrType, initialBusinessName || 'Your Business Name'));
  }

  const { aspectRatio } = getTableStandDimensions(config.format, config.orientation);

  // Download High-Resolution Table Stand PNG
  const handleDownloadStandPNG = async () => {
    if (!qrCanvas) return;
    setIsExporting(true);
    try {
      const standCanvas = await renderTableStandToCanvas(qrCanvas, config, customization, 2400);
      const dataUrl = standCanvas.toDataURL('image/png', 1.0);
      const filename = sanitizeFilename(
        `${config.businessName.toLowerCase().replace(/\s+/g, '-')}-${config.format}-${config.orientation}-stand.png`
      );
      triggerFileDownload(dataUrl, filename);
    } catch (err) {
      console.error('Failed to export table stand PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Open Browser Print Dialog formatted as PDF / Paper
  const handlePrintStand = async () => {
    if (!qrCanvas) return;
    setIsExporting(true);
    try {
      const standCanvas = await renderTableStandToCanvas(qrCanvas, config, customization, 1800);
      const dataUrl = standCanvas.toDataURL('image/png', 1.0);
      openTableStandPrintDialog(dataUrl, config);
    } catch (err) {
      console.error('Failed to print table stand:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(getDefaultTableStandConfig(qrType, initialBusinessName || 'Your Business Name'));
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 1500);
  };

  // Color options for accent bar
  const ACCENT_COLORS = [
    '#059669', // Emerald
    '#16a34a', // Green
    '#2563eb', // Blue
    '#4f46e5', // Indigo
    '#7c3aed', // Purple
    '#d97706', // Amber / Gold
    '#ea580c', // Orange
    '#dc2626', // Red
    '#0f172a', // Slate 900
  ];

  return (
    <div className="space-y-4">
      {/* Top Format Selector Controls Bar */}
      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-neutral-700">Display Format:</span>
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                ['table-tent', 'Table Tent (Folded)'],
                ['counter-stand', 'Counter Stand (Acrylic)'],
                ['a4', 'A4 Sign'],
                ['a5', 'A5 Card'],
                ['a6', 'A6 Tent Card'],
                ['square', 'Square Coaster'],
              ] as const
            ).map(([fmt, label]) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setConfig({ ...config, format: fmt as TableStandFormat })}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  config.format === fmt
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation & Edit toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setConfig({ ...config, orientation: 'portrait' })}
              className={`px-2 py-1 text-[11px] font-semibold transition ${
                config.orientation === 'portrait'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Portrait
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, orientation: 'landscape' })}
              className={`px-2 py-1 text-[11px] font-semibold transition ${
                config.orientation === 'landscape'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Landscape
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition ${
              showConfigPanel
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
            title="Customize stand text and colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Text</span>
          </button>
        </div>
      </div>

      {/* Expandable Customization Settings Drawer */}
      {showConfigPanel && (
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Customize Table Stand Copy & Branding
            </span>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1 text-[11px]"
            >
              {copiedState ? <Check className="w-3 h-3 text-emerald-600" /> : <RotateCcw className="w-3 h-3" />}
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Business / Brand Name</label>
              <input
                type="text"
                value={config.businessName}
                onChange={(e) => setConfig({ ...config, businessName: e.target.value })}
                placeholder="e.g. Sharma Kirana Store"
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Headline Call to Action</label>
              <input
                type="text"
                value={config.headlineCTA}
                onChange={(e) => setConfig({ ...config, headlineCTA: e.target.value })}
                placeholder="e.g. SCAN & PAY WITH ANY UPI APP"
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Supporting Helper Text</label>
              <input
                type="text"
                value={config.supportingText}
                onChange={(e) => setConfig({ ...config, supportingText: e.target.value })}
                placeholder="e.g. Supports Google Pay, PhonePe, Paytm, BHIM"
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Footer Verification Info</label>
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                placeholder="e.g. Direct Bank-to-Bank Payment"
                className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-neutral-700">Theme Accent:</span>
              <div className="flex items-center gap-1">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConfig({ ...config, accentColor: c })}
                    className={`w-5 h-5 rounded-full border transition ${
                      config.accentColor.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110'
                        : 'border-neutral-300'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {config.format === 'table-tent' && (
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-neutral-700">
                <input
                  type="checkbox"
                  checked={config.showFoldLine}
                  onChange={(e) => setConfig({ ...config, showFoldLine: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Include Print Fold Lines</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Realistic Table Stand Mockup Display Area */}
      <div className="flex items-center justify-center py-6 px-4 bg-gradient-to-b from-neutral-100/90 via-neutral-100 to-neutral-200/90 rounded-2xl border border-neutral-200/80 shadow-inner overflow-hidden relative min-h-[460px]">
        {/* Table Tent Realistic Mockup Wrapper */}
        <div
          className={`relative transition-all duration-200 ${
            config.format === 'table-tent'
              ? 'perspective-1000'
              : ''
          }`}
          style={{
            maxWidth: config.orientation === 'landscape' ? '460px' : '340px',
            width: '100%',
          }}
        >
          {/* Acrylic Counter Stand Backing (when counter-stand selected) */}
          {config.format === 'counter-stand' && (
            <div className="absolute -inset-2.5 rounded-3xl bg-white/70 backdrop-blur-md border-2 border-white shadow-xl pointer-events-none z-0">
              <div className="absolute bottom-0 inset-x-4 h-3 bg-neutral-300/80 rounded-b-xl shadow-md" />
            </div>
          )}

          {/* Table Tent Fold Base Shadow (when table-tent selected) */}
          {config.format === 'table-tent' && (
            <>
              {/* Back flap suggestion shadow */}
              <div className="absolute -top-2 inset-x-6 h-4 bg-neutral-300/60 rounded-t-xl -z-10 blur-[1px]" />
              {/* Table shadow at base */}
              <div className="absolute -bottom-4 inset-x-3 h-5 bg-neutral-900/15 rounded-[100%] blur-sm -z-10" />
            </>
          )}

          {/* Main Printable Card Surface */}
          <div
            className="relative z-10 bg-white rounded-2xl border border-neutral-200/90 shadow-2xl overflow-hidden flex flex-col justify-between text-center select-none"
            style={{
              aspectRatio: `${aspectRatio}`,
              backgroundColor:
                customization.bgColor && customization.bgColor.toLowerCase() !== 'transparent'
                  ? customization.bgColor
                  : '#FFFFFF',
            }}
          >
            {/* Top Accent Header Bar */}
            <div
              className="px-4 py-3 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: config.accentColor }}
            >
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white uppercase drop-shadow-2xs">
                {config.businessName || 'YOUR BUSINESS NAME'}
              </span>

              {/* Fold line visual indicator */}
              {config.format === 'table-tent' && config.showFoldLine && (
                <div className="absolute bottom-0 inset-x-0 border-b border-dashed border-white/60 text-[9px] text-white/80 font-mono">
                  FOLD
                </div>
              )}
            </div>

            {/* Middle Section: CTA & Large Dominant QR */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center space-y-3">
              {/* Primary CTA */}
              <div className="space-y-1">
                <h4 className="font-black text-sm sm:text-base tracking-tight text-neutral-950 uppercase leading-snug">
                  {config.headlineCTA}
                </h4>
                <div
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                  style={{
                    backgroundColor: `${config.accentColor}18`,
                    color: config.accentColor,
                  }}
                >
                  Camera & Apps Accepted
                </div>
              </div>

              {/* Dominant Center QR Box */}
              <div className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-md inline-flex items-center justify-center">
                {qrCanvas ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrCanvas.toDataURL()}
                    alt="Table Stand QR"
                    className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 sm:w-44 sm:h-44 bg-neutral-100 flex items-center justify-center text-neutral-400 font-mono text-xs">
                    [QR PATTERN]
                  </div>
                )}
              </div>

              {/* Supporting Instruction */}
              <p className="text-[11px] sm:text-xs text-neutral-700 font-medium max-w-[240px] leading-tight">
                {config.supportingText}
              </p>
            </div>

            {/* Bottom Footer Verification Strip */}
            <div className="px-3 py-2 bg-neutral-50/90 border-t border-neutral-200/80 flex items-center justify-center gap-1.5 text-[10px] text-neutral-600 font-medium">
              <Layers className="w-3 h-3 text-neutral-400" />
              <span>{config.footerText}</span>
            </div>
          </div>

          {/* Acrylic Stand Clear Foot (when counter-stand selected) */}
          {config.format === 'counter-stand' && (
            <div className="w-full h-4 bg-gradient-to-b from-white/90 to-neutral-200/70 rounded-b-2xl border-t border-white shadow-sm mt-0.5 mx-auto" />
          )}
        </div>
      </div>

      {/* Stand Export Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleDownloadStandPNG}
          disabled={!qrCanvas || isExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download 300 DPI Stand PNG</span>
        </button>

        <button
          type="button"
          onClick={handlePrintStand}
          disabled={!qrCanvas || isExporting}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Physical Stand / PDF</span>
        </button>
      </div>

      <p className="text-[11px] text-neutral-500 text-center">
        Print directly on heavy cardstock (250–300 GSM) or insert into standard tabletop acrylic display stands.
      </p>
    </div>
  );
};

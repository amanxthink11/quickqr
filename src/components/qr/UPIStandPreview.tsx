'use client';

import React, { useState } from 'react';
import { QRCustomization } from '@/lib/qr/types';
import {
  UPIStandConfig,
  UPIStandTemplate,
  getDefaultUPIStandConfig,
  renderUPIStandToCanvas,
  openUPIStandPrintDialog,
} from '@/lib/qr/upi-stand';
import { triggerFileDownload, sanitizeFilename } from '@/lib/qr/download';
import { PaymentAppBadges } from '@/components/payment/PaymentAppBadges';
import {
  Printer,
  Download,
  Settings2,
  CheckCircle2,
  Eye,
  Sliders,
} from 'lucide-react';

interface UPIStandPreviewProps {
  qrCanvas: HTMLCanvasElement | null;
  customization: QRCustomization;
  payload: string;
  initialMerchantName?: string;
  initialUpiId?: string;
}

const TEMPLATE_OPTIONS: { id: UPIStandTemplate; label: string; desc: string }[] = [
  {
    id: 'classic',
    label: 'Classic UPI',
    desc: 'White background, clean divider & payment badges (Reference style)',
  },
  {
    id: 'business',
    label: 'Business UPI',
    desc: 'Brand color accent header line & professional footer',
  },
  {
    id: 'scan-and-pay',
    label: 'Scan & Pay',
    desc: 'Prominent "SCAN & PAY" header badge for quick counter billing',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    desc: 'Maximum whitespace, merchant name, large QR & UPI ID',
  },
];

export const UPIStandPreview: React.FC<UPIStandPreviewProps> = ({
  qrCanvas,
  customization,
  payload,
  initialMerchantName,
  initialUpiId,
}) => {
  const [config, setConfig] = useState<UPIStandConfig>(() => {
    const base = getDefaultUPIStandConfig(payload, initialMerchantName);
    if (initialUpiId) base.upiId = initialUpiId;
    return base;
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedState, setCopiedState] = useState(false);

  // Sync state if payload changes
  const [prevPayload, setPrevPayload] = useState(payload);
  if (prevPayload !== payload) {
    setPrevPayload(payload);
    const updated = getDefaultUPIStandConfig(payload, initialMerchantName);
    setConfig((prev) => ({
      ...prev,
      merchantName: initialMerchantName || updated.merchantName,
      upiId: updated.upiId || prev.upiId,
      amountText: updated.amountText,
      showAmount: updated.showAmount,
    }));
  }

  // Download High-Resolution 300 DPI Counter Stand PNG (1800 x 2400)
  const handleDownloadStandPNG = async () => {
    if (!qrCanvas) return;
    setIsExporting(true);
    try {
      const standCanvas = await renderUPIStandToCanvas(qrCanvas, config, customization, 1800);
      const dataUrl = standCanvas.toDataURL('image/png', 1.0);
      const filename = `${sanitizeFilename(config.merchantName || 'business')}-upi-counter-stand-300dpi.png`;
      triggerFileDownload(dataUrl, filename);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2500);
    } catch (err) {
      console.error('Failed to export UPI stand PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Open Clean Browser Print Layout (Save as PDF)
  const handlePrintStand = () => {
    if (!qrCanvas) return;
    openUPIStandPrintDialog(qrCanvas, config);
  };

  const rawName = config.merchantName.trim() || 'ABC GENERAL STORE';
  const displayName = config.isUppercaseName ? rawName.toUpperCase() : rawName;
  const rawUpiId = config.upiId.trim() || 'merchant@upi';

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Top Context Bar (Outside printable design) */}
      <div className="w-full flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-neutral-800">
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          <span>UPI Counter Stand Preview</span>
          <span className="font-mono text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
            3:4 Portrait
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
            showConfigPanel
              ? 'bg-neutral-900 text-white border-neutral-900'
              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showConfigPanel ? 'Hide Controls' : 'Edit Stand'}</span>
        </button>
      </div>

      {/* Stand Configuration Panel (Collapsible) */}
      {showConfigPanel && (
        <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              Customize UPI Counter Stand
            </span>
            <span className="text-[11px] text-neutral-400">Updates print output in real-time</span>
          </div>

          {/* Template Switcher */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Stand Style Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATE_OPTIONS.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setConfig({ ...config, template: tmpl.id })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.template === tmpl.id
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs font-bold'
                      : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100 font-medium'
                  }`}
                >
                  <p className="text-xs truncate">{tmpl.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Merchant Name & Uppercase Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">
                Merchant / Store Name
              </label>
              <input
                type="text"
                value={config.merchantName}
                onChange={(e) => setConfig({ ...config, merchantName: e.target.value })}
                placeholder="e.g. ABC GENERAL STORE"
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 select-none">
                <input
                  type="checkbox"
                  checked={config.isUppercaseName}
                  onChange={(e) => setConfig({ ...config, isUppercaseName: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="font-semibold text-xs">Uppercase Name</span>
              </label>
            </div>
          </div>

          {/* UPI ID & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Displayed UPI ID (VPA)
              </label>
              <input
                type="text"
                value={config.upiId}
                onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                placeholder="e.g. store@okhdfcbank"
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Instruction Text
              </label>
              <input
                type="text"
                value={config.instructionText}
                onChange={(e) => setConfig({ ...config, instructionText: e.target.value })}
                placeholder="Scan and pay using your preferred UPI app"
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Payment Badges Toggle & Footer Text */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Footer Text (Optional)
              </label>
              <input
                type="text"
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                placeholder="e.g. BHIM UPI"
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="pt-4 flex items-center justify-between sm:justify-start gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 select-none">
                <input
                  type="checkbox"
                  checked={config.showPaymentBranding}
                  onChange={(e) =>
                    setConfig({ ...config, showPaymentBranding: e.target.checked })
                  }
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span className="font-semibold text-xs">Show Payment App Badges</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THE PHYSICAL UPI COUNTER STAND (CLEAN, 3:4 PORTRAIT, NO 3D / SAAS GIMMICKS) */}
      {/* ========================================================================= */}
      <div className="w-full flex justify-center py-2">
        <div
          id="upi-stand-print-target"
          className="w-full max-w-[340px] sm:max-w-[380px] bg-white rounded-2xl border border-neutral-200/90 shadow-sm shadow-neutral-900/5 p-3.5 sm:p-5 pb-3 sm:pb-3.5 flex flex-col items-center justify-between text-center select-none transition-all relative overflow-hidden"
          style={{
            aspectRatio: '3 / 4',
          }}
        >
          {/* Business template accent bar */}
          {config.template === 'business' && (
            <div
              className="absolute top-0 inset-x-8 h-1 rounded-b-md"
              style={{ backgroundColor: config.accentColor || '#0f172a' }}
            />
          )}

          {/* TOP AREA: MERCHANT NAME */}
          <div className="w-full pt-0.5">
            {/* Scan & Pay Template prominent badge */}
            {config.template === 'scan-and-pay' && (
              <div className="mb-1.5">
                <span
                  className="inline-block px-3 py-0.5 rounded-full text-white text-[10.5px] font-extrabold uppercase tracking-wider shadow-2xs"
                  style={{ backgroundColor: config.accentColor || '#065F46' }}
                >
                  SCAN &amp; PAY
                </span>
              </div>
            )}

            <h2
              className={`font-bold text-neutral-900 tracking-tight leading-snug px-1.5 max-w-full ${
                displayName.length > 50
                  ? 'text-xs sm:text-[13px] leading-tight font-semibold'
                  : displayName.length > 28
                  ? 'text-sm sm:text-base font-bold'
                  : 'text-base sm:text-lg font-bold'
              }`}
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              {displayName}
            </h2>

            {/* Subtle thin divider line (Classic Reference Style) */}
            {config.template !== 'minimal' && (
              <div className="w-2/3 mx-auto h-[1px] bg-neutral-200/90 my-2" />
            )}

            {/* Fixed Amount Badge if present */}
            {config.showAmount && config.amountText && (
              <div className="mt-0.5">
                <span className="inline-block text-[10.5px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                  Fixed Amount: {config.amountText}
                </span>
              </div>
            )}
          </div>

          {/* CENTER AREA: DOMINANT HIGH-CONTRAST QR CODE (PRINTED DIRECTLY ON CARD) */}
          <div className="w-full flex items-center justify-center my-auto py-0.5">
            {qrCanvas ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrCanvas.toDataURL()}
                alt={`UPI QR for ${displayName}`}
                className="w-52 h-52 sm:w-[236px] sm:h-[236px] object-contain"
              />
            ) : (
              <div className="w-52 h-52 sm:w-[236px] sm:h-[236px] bg-neutral-50 flex items-center justify-center text-neutral-400 font-mono text-xs border border-dashed border-neutral-200 rounded-lg">
                [UPI QR]
              </div>
            )}
          </div>

          {/* BOTTOM AREA: UPI ID, INSTRUCTION, PAYMENT BRANDING & FOOTER */}
          <div className="w-full space-y-1 sm:space-y-1.5 pb-0.5">
            {/* UPI ID (Directly below QR with readable typography) */}
            <div
              className={`font-mono font-semibold text-neutral-800 tracking-wide px-1 ${
                rawUpiId.length > 32
                  ? 'text-[10.5px] sm:text-[11.5px] leading-tight'
                  : rawUpiId.length > 22
                  ? 'text-[11.5px] sm:text-xs'
                  : 'text-xs sm:text-sm'
              }`}
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}
            >
              {rawUpiId}
            </div>

            {/* Instruction */}
            <p className="text-[11px] sm:text-xs font-medium text-neutral-600 px-2 leading-snug">
              {config.instructionText || 'Scan and pay using your preferred UPI app'}
            </p>

            {/* Payment Ecosystem Badges (Official payment-app logo assets) */}
            {config.showPaymentBranding && (
              <div className="pt-0.5">
                <PaymentAppBadges badgeHeight={14} variant="pill" />
              </div>
            )}

            {/* Optional Footer Text (Zero Labnol text) */}
            {config.footerText && (
              <p className="text-[10px] text-neutral-400 font-medium pt-0.5 pb-0.5">
                {config.footerText
                  .replace(/labnol/gi, '')
                  .replace(/www\.labnol\.org[^\s]*/gi, '')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-sm flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownloadStandPNG}
          disabled={!qrCanvas || isExporting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
        >
          {copiedState ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Stand PNG Saved!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : 'Download 300 DPI PNG'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handlePrintStand}
          disabled={!qrCanvas}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs shadow-xs transition disabled:opacity-50"
          title="Print or Save as PDF"
        >
          <Printer className="w-4 h-4 text-neutral-600" />
          <span>Print / PDF</span>
        </button>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  QRCustomization,
  QRReadabilityResult,
  QRValidationResult,
} from '@/lib/qr/types';
import {
  createQRCodeInstance,
  verifyOpticalScan,
  QRCodeStylingInstance,
} from '@/lib/qr/renderer';
import {
  renderFramedQRToCanvas,
  buildFramedQRSVG,
  triggerFileDownload,
  openPrintDialog,
} from '@/lib/qr/download';
import {
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface QRPreviewProps {
  payload: string;
  customization: QRCustomization;
  validation: QRValidationResult;
  readability: QRReadabilityResult;
  qrTypeTitle: string;
  subtitle?: string;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  payload,
  customization,
  validation,
  readability,
  qrTypeTitle,
  subtitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<QRCodeStylingInstance | null>(null);
  const [opticalScanResult, setOpticalScanResult] = useState<QRReadabilityResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadResolution, setDownloadResolution] = useState<'1000' | '2000' | '3000'>('2000');
  const [previewMode, setPreviewMode] = useState<'standard' | 'stand'>('standard');

  // Render QR Code using client-side engine
  useEffect(() => {
    let isMounted = true;

    async function renderQR() {
      if (!payload || !validation.isValid) return;
      setIsGenerating(true);

      try {
        const qr = await createQRCodeInstance(payload, customization);
        if (!isMounted || !qr) return;

        qrInstanceRef.current = qr;

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          await qr.append(containerRef.current);

          // Find generated canvas and test optical scan
          const canvas = containerRef.current.querySelector('canvas');
          if (canvas) {
            const scanCheck = verifyOpticalScan(canvas, payload);
            if (isMounted) {
              setOpticalScanResult(scanCheck);
            }
          }
        }
      } catch (err) {
        console.error('Error rendering QR Code:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    renderQR();

    return () => {
      isMounted = false;
    };
  }, [payload, customization, validation.isValid]);

  // Handle PNG Download
  const handleDownloadPNG = async () => {
    if (!validation.isValid || !containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const targetSize = parseInt(downloadResolution, 10);
    const framedCanvas = await renderFramedQRToCanvas(canvas, customization, targetSize);
    const dataUrl = framedCanvas.toDataURL('image/png', 1.0);
    const filename = `quickqr-${customization.frameStyle}-${targetSize}px.png`;
    triggerFileDownload(dataUrl, filename);
  };

  // Handle SVG Download
  const handleDownloadSVG = async () => {
    if (!validation.isValid || !qrInstanceRef.current) return;
    try {
      const rawBlob = await qrInstanceRef.current.getRawData('svg');
      if (rawBlob) {
        const text = await rawBlob.text();
        const framedSVG = buildFramedQRSVG(text, customization, 600);
        const blob = new Blob([framedSVG], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        triggerFileDownload(url, `quickqr-${customization.frameStyle}.svg`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      console.error('Error exporting SVG:', e);
    }
  };

  // Handle Print Action
  const handlePrint = async () => {
    if (!validation.isValid || !containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const framedCanvas = await renderFramedQRToCanvas(canvas, customization, 1400);
    const dataUrl = framedCanvas.toDataURL('image/png', 1.0);
    openPrintDialog(dataUrl, qrTypeTitle, subtitle || 'Scan with any phone camera or UPI app');
  };

  // Determine aggregate scan safety health
  const scanHealth = opticalScanResult || readability;
  const isHealthy = validation.isValid && scanHealth.isReadable && readability.score >= 60;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Live QR Preview</h3>
            <p className="text-xs text-neutral-500">Real-time scan safety validated</p>
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('standard')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                previewMode === 'standard'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('stand')}
              className={`px-2 py-1 rounded-md font-medium transition ${
                previewMode === 'stand'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Table Stand
            </button>
          </div>
        </div>

        {/* Scan Readability Health Badge */}
        <div
          className={`mb-4 rounded-xl p-3 text-xs flex items-start gap-2.5 transition border ${
            !validation.isValid
              ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
              : isHealthy
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {!validation.isValid ? (
            <>
              <AlertTriangle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-800">Waiting for valid input:</span>{' '}
                {validation.error || 'Please fill in the required fields to generate QR.'}
              </div>
            </>
          ) : isHealthy ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950">100% Scan Verified</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-950 font-mono text-[10px]">
                    Score: {scanHealth.score}/100
                  </span>
                </div>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  High contrast & optical readability confirmed with smartphone camera decoder.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">Attention Required</span>
                <ul className="list-disc list-inside mt-0.5 text-[11px] text-amber-800 space-y-0.5">
                  {scanHealth.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* QR Visual Container */}
        <div className="flex items-center justify-center p-4 sm:p-6 bg-neutral-50/80 rounded-2xl border border-neutral-100 min-h-[360px] relative">
          {isGenerating && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-2xl z-10">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          )}

          {!validation.isValid ? (
            <div className="text-center p-8 max-w-xs text-neutral-400">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-neutral-300 mx-auto flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-neutral-300" />
              </div>
              <p className="text-sm font-medium text-neutral-600">Enter Details to Preview</p>
              <p className="text-xs text-neutral-400 mt-1">
                Your customized, high-resolution QR code will appear here in real time.
              </p>
            </div>
          ) : previewMode === 'stand' ? (
            /* Table Stand / Frame Simulation */
            <div className="w-full max-w-[280px] bg-white rounded-2xl p-4 shadow-xl border-4 border-neutral-200 text-center space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-neutral-800 pb-1 border-b border-neutral-100">
                {qrTypeTitle}
              </div>
              <div
                className="p-3 rounded-xl mx-auto flex flex-col items-center"
                style={{
                  backgroundColor: customization.bgColor,
                  border:
                    customization.frameStyle === 'card'
                      ? `3px solid ${customization.frameColor}`
                      : 'none',
                }}
              >
                <div ref={containerRef} className="flex justify-center" />
                {customization.frameStyle !== 'none' && (
                  <div
                    className="w-full py-2 px-3 mt-2 rounded-lg font-bold text-xs tracking-wide"
                    style={{
                      backgroundColor: customization.frameColor,
                      color: customization.frameTextColor,
                    }}
                  >
                    {customization.frameText || 'SCAN ME'}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                Acrylic Stand • Table Tent Mockup
              </p>
            </div>
          ) : (
            /* Standard Frame Preview */
            <div
              className={`p-4 rounded-2xl shadow-sm transition-all flex flex-col items-center max-w-full ${
                customization.frameStyle === 'card' ? 'border-4' : 'border border-neutral-200/60'
              }`}
              style={{
                backgroundColor: customization.bgColor,
                borderColor:
                  customization.frameStyle === 'card'
                    ? customization.frameColor
                    : undefined,
              }}
            >
              {customization.frameStyle === 'card' && (
                <div
                  className="w-full py-2.5 px-4 mb-3 rounded-md font-bold text-xs tracking-wider text-center"
                  style={{
                    backgroundColor: customization.frameColor,
                    color: customization.frameTextColor,
                  }}
                >
                  {customization.frameText || 'SCAN ME'}
                </div>
              )}

              <div ref={containerRef} className="flex justify-center max-w-full overflow-hidden" />

              {customization.frameStyle === 'bottom-banner' && (
                <div
                  className="w-full py-2.5 px-4 mt-3 rounded-xl font-bold text-xs tracking-wider text-center shadow-xs"
                  style={{
                    backgroundColor: customization.frameColor,
                    color: customization.frameTextColor,
                  }}
                >
                  {customization.frameText || 'SCAN ME'}
                </div>
              )}

              {customization.frameStyle === 'badge' && (
                <div
                  className="px-5 py-1.5 mt-3 rounded-full font-bold text-xs tracking-wider text-center"
                  style={{
                    backgroundColor: customization.frameColor,
                    color: customization.frameTextColor,
                  }}
                >
                  {customization.frameText || 'SCAN ME'}
                </div>
              )}

              {customization.frameStyle === 'card' && (
                <p
                  className="text-[11px] font-semibold mt-2.5 text-center"
                  style={{ color: customization.fgColor }}
                >
                  Point your phone camera to scan
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Download & Export Controls */}
      <div className="pt-5 mt-5 border-t border-neutral-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-700">Export Resolution:</span>
          <div className="flex items-center gap-1.5 font-mono">
            {(
              [
                ['1000', '1000px (Web)'],
                ['2000', '2000px (HD)'],
                ['3000', '3000px (Print 300 DPI)'],
              ] as const
            ).map(([res, label]) => (
              <button
                key={res}
                type="button"
                onClick={() => setDownloadResolution(res)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  downloadResolution === res
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={!validation.isValid}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSVG}
            disabled={!validation.isValid}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-300 text-neutral-800 text-xs font-bold transition"
          >
            <FileCode className="w-4 h-4" />
            <span>Download SVG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!validation.isValid}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-900 border border-indigo-200 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4 text-indigo-700" />
            <span>Print Stand (A4)</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Direct Vector & Raster Rendering
          </span>
          <span>Zero Server Storage • Instant 100% Private</span>
        </div>
      </div>
    </div>
  );
};

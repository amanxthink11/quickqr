'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { QRCustomization } from '@/lib/qr/types';
import { createQRCodeInstance } from '@/lib/qr/renderer';
import {
  renderFramedQRToCanvas,
  triggerFileDownload,
  openPrintDialog,
  sanitizeFilename,
} from '@/lib/qr/download';
import {
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface DynamicQRPreviewCardProps {
  shortCode: string;
  title: string;
  status?: string;
  styling?: unknown;
  baseUrl: string;
}

export const DynamicQRPreviewCard: React.FC<DynamicQRPreviewCardProps> = ({
  shortCode,
  title,
  styling,
  baseUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [copied, setCopied] = useState(false);
  const [renderedCanvas, setRenderedCanvas] = useState<HTMLCanvasElement | null>(null);

  const dynamicPayload = `${baseUrl}/q/${shortCode}`;

  const customization = useMemo<QRCustomization>(
    () => ({
      fgColor: '#0F172A',
      bgColor: '#FFFFFF',
      eyeColor: '#0F172A',
      dotStyle: 'rounded',
      eyeStyle: 'rounded',
      frameStyle: 'none',
      frameText: 'SCAN ME',
      frameColor: '#0F172A',
      frameTextColor: '#FFFFFF',
      size: 280,
      margin: 3,
      errorCorrectionLevel: 'M',
      logoSize: 0.22,
      logoMargin: 2,
      ...(typeof styling === 'object' && styling !== null
        ? (styling as Partial<QRCustomization>)
        : {}),
    }),
    [styling]
  );

  useEffect(() => {
    let isMounted = true;

    async function render() {
      if (!containerRef.current) return;
      setIsRendering(true);

      try {
        const qr = await createQRCodeInstance(dynamicPayload, customization);
        if (!isMounted || !qr || !containerRef.current) return;

        containerRef.current.innerHTML = '';
        await qr.append(containerRef.current);

        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          setRenderedCanvas(canvas);
        }
      } catch (err) {
        console.error('Error rendering dynamic QR code preview:', err);
      } finally {
        if (isMounted) setIsRendering(false);
      }
    }

    render();

    return () => {
      isMounted = false;
    };
  }, [dynamicPayload, customization]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dynamicPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = dynamicPayload;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = async () => {
    if (!renderedCanvas) return;
    try {
      const framed = await renderFramedQRToCanvas(renderedCanvas, customization, 2000);
      const dataUrl = framed.toDataURL('image/png', 1.0);
      const filename = sanitizeFilename(`${shortCode}-dynamic-qr.png`);
      triggerFileDownload(dataUrl, filename);
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  const handlePrint = async () => {
    if (!renderedCanvas) return;
    try {
      const framed = await renderFramedQRToCanvas(renderedCanvas, customization, 1200);
      const dataUrl = framed.toDataURL('image/png', 1.0);
      openPrintDialog(dataUrl, title, `Scan code: ${shortCode}`);
    } catch (err) {
      console.error('Failed to print QR code', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs flex flex-col items-center">
      {/* QR Code Canvas Container */}
      <div className="relative p-4 rounded-2xl bg-neutral-50/80 border border-neutral-100 flex items-center justify-center min-w-[280px] min-h-[280px]">
        {isRendering && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10 rounded-2xl">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <span className="text-xs font-medium text-neutral-600">Generating preview...</span>
          </div>
        )}
        <div ref={containerRef} className="flex items-center justify-center" />
      </div>

      {/* Dynamic Target Notice */}
      <div className="w-full mt-4 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-900 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate font-mono text-[11px] text-neutral-700">
            {dynamicPayload}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold transition shrink-0 shadow-2xs"
          title="Copy redirect link"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-indigo-600" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Actions: Download, Print, Test Scan */}
      <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
        <button
          type="button"
          onClick={handleDownloadPNG}
          disabled={!renderedCanvas || isRendering}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PNG</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          disabled={!renderedCanvas || isRendering}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition shadow-2xs disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Stand</span>
        </button>
      </div>

      <div className="w-full mt-3 text-center">
        <a
          href={dynamicPayload}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-indigo-600 transition"
        >
          <span>Test live redirect</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

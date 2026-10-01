'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Laptop,
  Smartphone,
  X,
  IndianRupee,
  MessageSquare,
  Star,
  Utensils,
  Globe,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { WidgetConfig, WidgetType } from '@/lib/widget/types';

interface WidgetSimulatorProps {
  config: WidgetConfig;
  status?: 'ACTIVE' | 'PAUSED';
  initialDevice?: 'desktop' | 'mobile';
  height?: string;
}

const PurposeIcon: React.FC<{ type: WidgetType; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'upi':
      return <IndianRupee className={className} />;
    case 'whatsapp':
      return <MessageSquare className={className} />;
    case 'review':
      return <Star className={className} />;
    case 'menu':
      return <Utensils className={className} />;
    case 'website':
    case 'url':
      return <Globe className={className} />;
    case 'custom':
    default:
      return <QrCode className={className} />;
  }
};

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({
  config,
  status = 'ACTIVE',
  initialDevice = 'desktop',
  height = 'h-[440px]',
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>(initialDevice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR Canvas dynamically whenever payload changes
  useEffect(() => {
    let isCancelled = false;
    const renderQR = async () => {
      try {
        const payload = config.payload || 'https://quickqr.art';
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate preview QR', err);
      }
    };

    void renderQR();
    return () => {
      isCancelled = true;
    };
  }, [config.payload]);

  const isPaused = status === 'PAUSED';

  // Compute button styling classes
  const getRadiusClass = () => {
    switch (config.borderRadius) {
      case 'full':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-xl';
      case 'square':
        return 'rounded-sm';
      default:
        return 'rounded-full';
    }
  };

  const getShadowClass = () => {
    switch (config.shadow) {
      case 'strong':
      case 'elevated':
        return 'shadow-2xl';
      case 'medium':
        return 'shadow-lg';
      case 'soft':
      case 'subtle':
        return 'shadow-md';
      case 'none':
        return 'shadow-none';
      default:
        return 'shadow-lg';
    }
  };

  const getSizeClasses = () => {
    switch (config.size) {
      case 'small':
        return 'px-3.5 py-2 text-xs gap-1.5';
      case 'large':
        return 'px-6 py-3.5 text-sm gap-2.5';
      case 'medium':
      default:
        return 'px-4.5 py-2.5 text-xs font-bold gap-2';
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Device Switcher Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>{isPaused ? 'Widget Paused' : 'Live Interactive Preview'}</span>
          <span className="text-[11px] font-normal text-neutral-500 hidden sm:inline">
            {isPaused ? '(Hidden from visitors)' : '(Click button to test modal)'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              device === 'desktop'
                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              device === 'mobile'
                ? 'bg-white text-neutral-900 font-bold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Browser Shell */}
      <div
        className={`mx-auto transition-all duration-300 ${
          device === 'mobile' ? 'max-w-[360px]' : 'w-full'
        }`}
      >
        <div className="bg-neutral-900 rounded-3xl p-2.5 shadow-xl border border-neutral-800">
          {/* Browser Address Bar */}
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 border-b border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-neutral-800 rounded-lg px-3 py-1 text-[11px] font-mono flex items-center justify-center gap-1.5 text-neutral-300 truncate">
              <span className="text-emerald-400">🔒</span>
              <span>https://yourmerchantwebsite.com</span>
            </div>
          </div>

          {/* Webpage Canvas */}
          <div
            className={`relative bg-neutral-50 rounded-2xl overflow-hidden ${height} flex flex-col justify-between`}
          >
            {/* Paused Banner Notification */}
            {isPaused && (
              <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 z-20">
                <AlertTriangle className="w-4 h-4" />
                <span>Widget is PAUSED. Launcher button is deactivated on your site.</span>
              </div>
            )}

            {/* Mock Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200/80 bg-white/90">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <span className="font-extrabold text-xs text-neutral-900">Merchant Store</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-neutral-500">
                <span>Products</span>
                <span>Services</span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 font-semibold">
                  Contact
                </span>
              </div>
            </div>

            {/* Mock Website Body Content */}
            <div className="p-5 space-y-3">
              <div className="max-w-xs space-y-1.5">
                <div className="h-4 bg-neutral-300/80 rounded-md w-3/4 animate-pulse" />
                <div className="h-3 bg-neutral-200 rounded-md w-full" />
                <div className="h-3 bg-neutral-200 rounded-md w-5/6" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-20 bg-white border border-neutral-200 rounded-xl p-2.5 space-y-1">
                  <div className="h-2.5 bg-neutral-200 rounded w-1/2" />
                  <div className="h-2 bg-neutral-100 rounded w-3/4" />
                </div>
                <div className="h-20 bg-white border border-neutral-200 rounded-xl p-2.5 space-y-1">
                  <div className="h-2.5 bg-neutral-200 rounded w-1/2" />
                  <div className="h-2 bg-neutral-100 rounded w-3/4" />
                </div>
              </div>
            </div>

            {/* Floating Launcher Button */}
            {!isPaused && (
              <div
                className={`absolute bottom-4 ${
                  config.position === 'bottom-left' ? 'left-4' : 'right-4'
                } z-10`}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    backgroundColor: config.brandColor || '#16a34a',
                    color: config.buttonTextColor || '#FFFFFF',
                  }}
                  className={`inline-flex items-center font-bold transition transform hover:scale-105 active:scale-95 cursor-pointer ${getRadiusClass()} ${getShadowClass()} ${getSizeClasses()}`}
                >
                  <PurposeIcon type={config.type} className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {config.buttonLabel || config.buttonText || 'Scan QR'}
                  </span>
                </button>
              </div>
            )}

            {/* Interactive Modal Popup Simulation */}
            {isModalOpen && !isPaused && (
              <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-30 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl p-4 max-w-[280px] w-full shadow-2xl space-y-3 relative border border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-neutral-900 transition p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="text-center space-y-1 pr-4">
                    <h4 className="font-extrabold text-xs text-neutral-900 leading-tight">
                      {config.popupTitle || config.modalTitle || 'Scan QR Code'}
                    </h4>
                    <p className="text-[10px] text-neutral-500 leading-normal line-clamp-2">
                      {config.popupDescription ||
                        config.modalDescription ||
                        'Point your phone camera to scan and interact.'}
                    </p>
                  </div>

                  {/* QR Image Box */}
                  <div className="flex justify-center py-1">
                    <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-xs">
                      {qrDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={qrDataUrl}
                          alt="Widget QR Code Preview"
                          className="w-32 h-32 object-contain"
                        />
                      ) : (
                        <canvas ref={qrCanvasRef} className="w-32 h-32" />
                      )}
                    </div>
                  </div>

                  {/* CTA Footer */}
                  {config.ctaText && (
                    <div className="text-center pt-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                        {config.ctaText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

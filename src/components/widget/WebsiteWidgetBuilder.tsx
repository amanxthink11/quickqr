'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  IndianRupee,
  MessageSquare,
  Star,
  Utensils,
  Globe,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Sparkles,
  Code,
  X,
  ShieldCheck,
  Layers,
  Palette,
} from 'lucide-react';
import { WidgetConfig, WidgetType, WidgetPosition, WidgetSize, WidgetBorderRadius, WidgetShadow } from '@/lib/widget/types';
import {
  getDefaultWidgetConfig,
  generateEmbedCode,
} from '@/lib/widget/config';

interface PurposeOption {
  type: WidgetType;
  label: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  defaultColor: string;
}

const PURPOSES: PurposeOption[] = [
  {
    type: 'upi',
    label: 'UPI / Payment',
    badge: 'Popular in India',
    description: 'Instant zero-fee payments via GPay, PhonePe, Paytm, CRED & BHIM',
    icon: IndianRupee,
    defaultColor: '#16a34a',
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp Chat',
    badge: 'High Conversion',
    description: 'Direct 1-click WhatsApp customer support and sales chat',
    icon: MessageSquare,
    defaultColor: '#25D366',
  },
  {
    type: 'review',
    label: 'Google Review',
    badge: 'Build Trust',
    description: 'Collect 5-star Google Business ratings from satisfied customers',
    icon: Star,
    defaultColor: '#d97706',
  },
  {
    type: 'menu',
    label: 'Digital Menu',
    badge: 'F&B Favorite',
    description: 'Contactless food, drinks, and specials menu for restaurants & cafes',
    icon: Utensils,
    defaultColor: '#ea580c',
  },
  {
    type: 'website',
    label: 'Website Link',
    badge: 'Mobile Handoff',
    description: 'Seamlessly hand off desktop visitors to mobile browsing or apps',
    icon: Globe,
    defaultColor: '#2563eb',
  },
  {
    type: 'custom',
    label: 'Custom QR',
    badge: 'Flexible',
    description: 'Any custom URL, contact card, Wi-Fi, or direct business payload',
    icon: QrCode,
    defaultColor: '#0f172a',
  },
];

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#16a34a' },
  { name: 'WhatsApp', hex: '#25D366' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Rose Red', hex: '#e11d48' },
  { name: 'Slate Dark', hex: '#0f172a' },
];

const PurposeIcon: React.FC<{ type: WidgetType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
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

export const WebsiteWidgetBuilder: React.FC = () => {
  const [config, setConfig] = useState<WidgetConfig>(() => getDefaultWidgetConfig('upi'));
  const [activeTab, setActiveTab] = useState<'purpose' | 'content' | 'style' | 'popup'>('purpose');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'html' | 'wordpress' | 'shopify' | 'nextjs'>('html');

  // Payload specific helper inputs
  const [upiVpa, setUpiVpa] = useState('merchant@okhdfcbank');
  const [upiName, setUpiName] = useState('Store Checkout');
  const [waPhone, setWaPhone] = useState('919876543210');
  const [waMessage, setWaMessage] = useState('Hello, I have an inquiry from your website');
  const [genericUrl, setGenericUrl] = useState('https://quickqr.art');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute effective payload and config without calling setState in an effect
  const effectivePayload = React.useMemo(() => {
    if (config.type === 'upi') {
      return `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiName)}&cu=INR`;
    }
    if (config.type === 'whatsapp') {
      const cleanPhone = waPhone.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    }
    return genericUrl;
  }, [config.type, upiVpa, upiName, waPhone, waMessage, genericUrl]);

  const effectiveConfig = React.useMemo(() => ({
    ...config,
    payload: effectivePayload,
  }), [config, effectivePayload]);

  // Handle purpose switch
  const handleSelectPurpose = (type: WidgetType) => {
    const defaults = getDefaultWidgetConfig(type);
    setConfig((prev) => ({
      ...defaults,
      position: prev.position,
      size: prev.size,
      borderRadius: prev.borderRadius,
      shadow: prev.shadow,
    }));
    if (type === 'website' || type === 'menu' || type === 'review' || type === 'custom') {
      setGenericUrl(defaults.payload);
    }
  };

  // Render QR Code onto the preview canvas
  useEffect(() => {
    if (canvasRef.current && isModalOpen) {
      const validPayload = effectiveConfig.payload?.trim() || 'https://quickqr.art';
      QRCode.toCanvas(canvasRef.current, validPayload, {
        width: 190,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      }).catch((e) => {
        console.warn('QR preview render warning:', e);
      });
    }
  }, [effectiveConfig.payload, isModalOpen]);

  // Generate embed code
  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://quickqr.art';
  const embedCode = generateEmbedCode(effectiveConfig, currentHost);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Keyboard close for the modal preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Dynamic style helpers for the floating button inside the preview
  const getLauncherClasses = () => {
    let sizeClasses = 'px-4 py-2.5 text-sm gap-2';
    if (config.size === 'small') sizeClasses = 'px-3 py-1.5 text-xs gap-1.5';
    if (config.size === 'large') sizeClasses = 'px-5 py-3.5 text-base gap-2.5';

    let radiusClasses = 'rounded-full';
    if (config.borderRadius === 'rounded') radiusClasses = 'rounded-xl';
    if (config.borderRadius === 'square') radiusClasses = 'rounded-md';

    let shadowClasses = 'shadow-lg';
    if (config.shadow === 'soft') shadowClasses = 'shadow-md';
    if (config.shadow === 'strong') shadowClasses = 'shadow-2xl';
    if (config.shadow === 'none') shadowClasses = 'shadow-none';

    return `${sizeClasses} ${radiusClasses} ${shadowClasses}`;
  };

  return (
    <div className="space-y-8">
      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-neutral-200 bg-neutral-50/70 p-1.5 gap-1 text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('purpose')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition shrink-0 ${
                activeTab === 'purpose'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Purpose</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition shrink-0 ${
                activeTab === 'content'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>2. Data</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition shrink-0 ${
                activeTab === 'style'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              <span>3. Style</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('popup')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition shrink-0 ${
                activeTab === 'popup'
                  ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-sky-500" />
              <span>4. Popup</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* TAB 1: Purpose Selection */}
            {activeTab === 'purpose' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Choose Widget Purpose</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Select what action you want website visitors to take with their phones.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PURPOSES.map((item) => {
                    const isSelected = config.type === item.type;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleSelectPurpose(item.type)}
                        className={`text-left p-3.5 rounded-xl border transition relative group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10'
                            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: item.defaultColor }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-neutral-900">{item.label}</p>
                        <p className="text-[11px] text-neutral-500 mt-1 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Payload / Destination Data */}
            {activeTab === 'content' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">QR Destination & Payloads</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure the exact data triggered when a customer scans the code.
                  </p>
                </div>

                {/* UPI Fields */}
                {config.type === 'upi' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Merchant / Payee UPI ID (VPA) *
                      </label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="e.g. storename@okhdfcbank"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-neutral-400 mt-0.5 block">
                        Direct bank account routing. Zero platform transaction fee.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Business / Merchant Name
                      </label>
                      <input
                        type="text"
                        value={upiName}
                        onChange={(e) => setUpiName(e.target.value)}
                        placeholder="e.g. Royal Cafe Store"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* WhatsApp Fields */}
                {config.type === 'whatsapp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        WhatsApp Number (with Country Code) *
                      </label>
                      <input
                        type="text"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                        placeholder="e.g. 919876543210"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Pre-filled Message Text
                      </label>
                      <textarea
                        rows={2}
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                        placeholder="e.g. Hi, I am looking at your website and have a question"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Google Review / Menu / Website / Custom URL */}
                {config.type !== 'upi' && config.type !== 'whatsapp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Destination URL or Link *
                      </label>
                      <input
                        type="url"
                        value={genericUrl}
                        onChange={(e) => setGenericUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-neutral-400 mt-0.5 block">
                        Must be a valid https link (e.g. Google Maps review link, digital PDF menu, landing page).
                      </span>
                    </div>
                  </div>
                )}

                {/* Read-only current payload preview */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                  <div className="flex items-center justify-between text-neutral-500 mb-1">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">Raw QR Data String:</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="font-mono text-[11px] text-neutral-800 break-all select-all">
                    {effectiveConfig.payload}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Style & Appearance */}
            {activeTab === 'style' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Floating Button Appearance</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customize colors, sizing, and position on your website.
                  </p>
                </div>

                {/* Button Label */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Floating Button Label
                  </label>
                  <input
                    type="text"
                    value={config.buttonLabel}
                    onChange={(e) => setConfig({ ...config, buttonLabel: e.target.value })}
                    maxLength={28}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Brand Color Swatches */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Brand Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setConfig({ ...config, brandColor: color.hex })}
                        className={`w-6 h-6 rounded-full border-2 transition transform hover:scale-110 ${
                          config.brandColor.toLowerCase() === color.hex.toLowerCase()
                            ? 'border-neutral-900 ring-2 ring-neutral-400'
                            : 'border-white shadow-xs'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="color"
                        value={config.brandColor}
                        onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                        className="w-7 h-7 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                        title="Custom hex color"
                      />
                      <span className="font-mono text-xs text-neutral-600">{config.brandColor}</span>
                    </div>
                  </div>
                </div>

                {/* Position and Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Screen Position
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
                      {(['bottom-right', 'bottom-left'] as WidgetPosition[]).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setConfig({ ...config, position: pos })}
                          className={`py-1.5 rounded-lg capitalize transition text-center ${
                            config.position === pos
                              ? 'bg-white text-neutral-900 font-bold shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          {pos === 'bottom-right' ? 'Right' : 'Left'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Widget Size
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
                      {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setConfig({ ...config, size: sz })}
                          className={`py-1.5 rounded-lg capitalize transition text-center ${
                            config.size === sz
                              ? 'bg-white text-neutral-900 font-bold shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Border Radius and Shadow */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Corner Shape
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
                      {(['full', 'rounded', 'square'] as WidgetBorderRadius[]).map((rad) => (
                        <button
                          key={rad}
                          type="button"
                          onClick={() => setConfig({ ...config, borderRadius: rad })}
                          className={`py-1.5 rounded-lg capitalize transition text-center ${
                            config.borderRadius === rad
                              ? 'bg-white text-neutral-900 font-bold shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          {rad === 'full' ? 'Pill' : rad === 'rounded' ? 'Round' : 'Box'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Shadow Intensity
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
                      {(['soft', 'medium', 'strong'] as WidgetShadow[]).map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setConfig({ ...config, shadow: sh })}
                          className={`py-1.5 rounded-lg capitalize transition text-center ${
                            config.shadow === sh
                              ? 'bg-white text-neutral-900 font-bold shadow-xs'
                              : 'text-neutral-500 hover:text-neutral-900'
                          }`}
                        >
                          {sh}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Popup Modal Copy */}
            {activeTab === 'popup' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">QR Popup Modal Content</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customize what appears in the modal when a visitor clicks your floating button.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Modal Header Title
                  </label>
                  <input
                    type="text"
                    value={config.popupTitle}
                    onChange={(e) => setConfig({ ...config, popupTitle: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Instructions / Description
                  </label>
                  <textarea
                    rows={2}
                    value={config.popupDescription}
                    onChange={(e) => setConfig({ ...config, popupDescription: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Footer / Direct CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={config.ctaText}
                    onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>Test Open Modal in Preview</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fake Browser Live Interactive Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Simulator Bar with Device Selector */}
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Website Preview</span>
              <span className="text-[11px] font-normal text-neutral-500">
                (Click the widget button to test)
              </span>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  previewDevice === 'desktop'
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  previewDevice === 'mobile'
                    ? 'bg-white text-neutral-900 font-bold shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Browser Window Frame */}
          <div
            className={`mx-auto transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-[380px]' : 'w-full'
            }`}
          >
            <div className="bg-neutral-900 rounded-3xl p-2.5 shadow-2xl border border-neutral-800">
              {/* Chrome Browser Header */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 border-b border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-neutral-800 rounded-lg px-3 py-1 text-[11px] font-mono flex items-center justify-center gap-1.5 text-neutral-300 truncate">
                  <span className="text-emerald-400">🔒</span>
                  <span>https://yourbusiness.com</span>
                </div>
              </div>

              {/* Simulated Customer Website Canvas */}
              <div className="relative bg-white rounded-2xl overflow-hidden h-[460px] flex flex-col justify-between">
                {/* Mock Website Navbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-white/95">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      B
                    </div>
                    <span className="font-extrabold text-sm text-neutral-900">YourBrand Store</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-neutral-500">
                    <span>Products</span>
                    <span>About Us</span>
                    <span>Reviews</span>
                    <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-900 font-semibold">
                      Contact
                    </span>
                  </div>
                </div>

                {/* Mock Website Hero Content */}
                <div className="p-8 max-w-md space-y-4">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Welcome to our official website
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight">
                    Premium Quality Products & Friendly Care.
                  </h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Explore our seasonal catalogue, place inquiries, or interact with our store directly using the quick mobile QR widget on the bottom.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold shadow-xs">
                      Explore Store
                    </div>
                    <div className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-semibold">
                      Learn More
                    </div>
                  </div>
                </div>

                {/* Mock Website Footer Snippet */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 text-center">
                  © 2026 YourBrand Retail Ltd. Built for all devices.
                </div>

                {/* Floating Widget Button Inside Fake Website */}
                <div
                  className={`absolute z-30 ${
                    config.position === 'bottom-left' ? 'left-5' : 'right-5'
                  } bottom-5`}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className={`inline-flex items-center font-semibold transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${getLauncherClasses()}`}
                    style={{
                      backgroundColor: config.brandColor,
                      color: config.buttonTextColor,
                    }}
                    aria-label={config.buttonLabel}
                  >
                    <PurposeIcon type={effectiveConfig.type} className="w-4 h-4 shrink-0" />
                    <span>{config.buttonLabel}</span>
                  </button>
                </div>

                {/* Simulated QR Popup Modal (Rendered inside the fake browser frame) */}
                {isModalOpen && (
                  <div
                    className="absolute inset-0 z-40 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsModalOpen(false)}
                  >
                    <div
                      className="bg-white rounded-2xl p-5 max-w-[320px] w-full shadow-2xl text-center relative border border-neutral-200 animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition"
                        aria-label="Close dialog"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
                        style={{
                          backgroundColor: `${config.brandColor}15`,
                          color: config.brandColor,
                        }}
                      >
                        {config.type.toUpperCase()}
                      </span>

                      <h3 className="text-base font-bold text-neutral-900 leading-snug">
                        {config.popupTitle}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-1 mb-3 leading-relaxed">
                        {config.popupDescription}
                      </p>

                      {/* Real Dynamic QR Code Canvas */}
                      <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 inline-block mb-3">
                        <canvas ref={canvasRef} className="block mx-auto rounded" />
                      </div>

                      {/* Action CTA Button */}
                      <a
                        href={effectiveConfig.payload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-xs hover:opacity-95"
                        style={{
                          backgroundColor: config.brandColor,
                          color: config.buttonTextColor,
                        }}
                      >
                        {config.ctaText}
                      </a>

                      <p className="text-[10px] text-neutral-400 mt-2.5">
                        Verified QR Code &bull; Powered by QuickQR
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code Generation Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-neutral-900">Embed on Your Website</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Copy this single lightweight snippet. Zero global CSS pollution, completely isolated with Shadow DOM.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Code Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Embed Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="relative">
          <pre className="bg-neutral-950 text-neutral-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-neutral-800 leading-relaxed select-all">
            <code>{embedCode}</code>
          </pre>
        </div>

        {/* Platform Installation Guide Tabs */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
            <span>Installation Instructions for:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {(['html', 'wordpress', 'shopify', 'nextjs'] as const).map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setInstallPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  installPlatform === plat
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {plat === 'html'
                  ? 'Standard HTML'
                  : plat === 'wordpress'
                  ? 'WordPress'
                  : plat === 'shopify'
                  ? 'Shopify'
                  : 'Next.js / React'}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-2 leading-relaxed">
            {installPlatform === 'html' && (
              <p>
                Open your website&apos;s HTML template (e.g. <code className="text-indigo-600 font-mono">index.html</code>) and paste the code snippet immediately before the closing <code className="text-indigo-600 font-mono">&lt;/body&gt;</code> tag. The widget will initialize automatically on load.
              </p>
            )}
            {installPlatform === 'wordpress' && (
              <p>
                In your WordPress admin panel, go to <strong>Appearance &rarr; Widgets</strong> or <strong>Customizer &rarr; Footer</strong>, add a <strong>Custom HTML</strong> block, and paste the code snippet. Alternatively, add it to your theme&apos;s <code className="text-indigo-600 font-mono">footer.php</code> file.
              </p>
            )}
            {installPlatform === 'shopify' && (
              <p>
                In your Shopify admin, navigate to <strong>Online Store &rarr; Themes &rarr; Actions &rarr; Edit Code</strong>. Select <code className="text-indigo-600 font-mono">theme.liquid</code>, scroll down to the bottom, and paste this script right above the <code className="text-indigo-600 font-mono">&lt;/body&gt;</code> tag.
              </p>
            )}
            {installPlatform === 'nextjs' && (
              <p>
                In Next.js App Router, import <code className="text-indigo-600 font-mono">Script from &apos;next/script&apos;</code> in your root <code className="text-indigo-600 font-mono">layout.tsx</code> and add <code className="text-indigo-600 font-mono">&lt;Script src=&quot;{currentHost}/widget.js&quot; data-config=&quot;...&quot; strategy=&quot;lazyOnload&quot; /&gt;</code>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

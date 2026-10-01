'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee,
  MessageSquare,
  Star,
  Utensils,
  Globe,
  QrCode,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  WidgetConfig,
  WidgetType,
  WidgetPosition,
  WidgetSize,
  WidgetBorderRadius,
  WidgetShadow,
} from '@/lib/widget/types';
import { getDefaultWidgetConfig, validateWidgetConfig } from '@/lib/widget/config';
import { createWidgetAction, updateWidgetAction } from '@/lib/widget/actions';
import { WidgetSimulator } from '@/components/widget/WidgetSimulator';

interface WidgetFormProps {
  initialWidget?: {
    id: string;
    name: string;
    publicId: string;
    status: 'ACTIVE' | 'PAUSED';
    configuration: WidgetConfig;
  };
  isEdit?: boolean;
}

const PURPOSES = [
  {
    type: 'upi' as WidgetType,
    label: 'UPI / Payment',
    icon: IndianRupee,
    defaultColor: '#16a34a',
    desc: 'Instant zero-fee payments via GPay, PhonePe, Paytm, CRED & BHIM',
  },
  {
    type: 'whatsapp' as WidgetType,
    label: 'WhatsApp Chat',
    icon: MessageSquare,
    defaultColor: '#25D366',
    desc: 'Direct 1-click WhatsApp customer support and sales chat',
  },
  {
    type: 'review' as WidgetType,
    label: 'Google Review',
    icon: Star,
    defaultColor: '#d97706',
    desc: 'Collect 5-star Google Business ratings from satisfied customers',
  },
  {
    type: 'menu' as WidgetType,
    label: 'Digital Menu',
    icon: Utensils,
    defaultColor: '#ea580c',
    desc: 'Contactless food, drinks, and specials menu for restaurants & cafes',
  },
  {
    type: 'website' as WidgetType,
    label: 'Website Link',
    icon: Globe,
    defaultColor: '#2563eb',
    desc: 'Seamlessly hand off desktop visitors to mobile browsing or apps',
  },
  {
    type: 'custom' as WidgetType,
    label: 'Custom QR',
    icon: QrCode,
    defaultColor: '#0f172a',
    desc: 'Any custom URL, contact card, Wi-Fi, or direct business payload',
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

export const WidgetForm: React.FC<WidgetFormProps> = ({
  initialWidget,
  isEdit = false,
}) => {
  const router = useRouter();

  const [name, setName] = useState(initialWidget?.name || 'My Website QR Widget');
  const [config, setConfig] = useState<WidgetConfig>(
    () => initialWidget?.configuration || getDefaultWidgetConfig('upi')
  );
  const [activeTab, setActiveTab] = useState<'content' | 'appearance' | 'popup'>('content');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePurposeChange = (type: WidgetType) => {
    const defaults = getDefaultWidgetConfig(type);
    setConfig((prev) => ({
      ...prev,
      type,
      payload: defaults.payload,
      buttonLabel: defaults.buttonLabel,
      buttonText: defaults.buttonLabel,
      buttonIcon: defaults.buttonIcon,
      brandColor: defaults.brandColor,
      popupTitle: defaults.popupTitle,
      modalTitle: defaults.popupTitle,
      popupDescription: defaults.popupDescription,
      modalDescription: defaults.popupDescription,
      ctaText: defaults.ctaText,
      helperText: defaults.ctaText,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Widget name is required');
      return;
    }

    const validation = validateWidgetConfig(config);
    if (!validation.isValid) {
      setErrorMessage(validation.errors.join(', '));
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEdit && initialWidget) {
        const res = await updateWidgetAction({
          widgetId: initialWidget.id,
          name: trimmedName,
          config,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update widget');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Widget configuration updated remotely!');
        setTimeout(() => setSuccessMessage(null), 3000);
        router.refresh();
      } else {
        const res = await createWidgetAction({
          name: trimmedName,
          config,
        });

        if (!res.success || !res.data) {
          setErrorMessage(res.error || 'Failed to create widget');
          setIsSubmitting(false);
          return;
        }

        router.push(`/dashboard/widgets/${res.data.widgetId}`);
        router.refresh();
      }
    } catch {
      setErrorMessage('An unexpected network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Widget Name Card */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Widget Title / Label
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Checkout Floating Pay Button"
                required
                maxLength={100}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Internal name to identify this widget in your dashboard.
              </p>
            </div>
          </div>

          {/* Configuration Card with Tabs */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-neutral-200 bg-neutral-50/50 px-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeTab === 'content'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                1. Purpose &amp; Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeTab === 'appearance'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                2. Button Styling
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('popup')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeTab === 'popup'
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                3. QR Modal Text
              </button>
            </div>

            {/* TAB 1: Content & Purpose */}
            {activeTab === 'content' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-2">
                    Widget Purpose
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PURPOSES.map((p) => {
                      const Icon = p.icon;
                      const selected = config.type === p.type;
                      return (
                        <button
                          key={p.type}
                          type="button"
                          onClick={() => handlePurposeChange(p.type)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold ring-1 ring-indigo-600'
                              : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 mb-1.5 ${
                              selected ? 'text-indigo-600' : 'text-neutral-500'
                            }`}
                          />
                          <span className="text-xs">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Destination Payload / URL / UPI
                  </label>
                  <input
                    type="text"
                    value={config.payload}
                    onChange={(e) => setConfig({ ...config, payload: e.target.value })}
                    placeholder={
                      config.type === 'upi'
                        ? 'upi://pay?pa=merchant@okhdfcbank&pn=Store'
                        : 'https://yourwebsite.com'
                    }
                    required
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Validated against dangerous scripts and anti-SSRF policies.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Launcher Button Text
                  </label>
                  <input
                    type="text"
                    value={config.buttonLabel || config.buttonText || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        buttonLabel: e.target.value,
                        buttonText: e.target.value,
                      })
                    }
                    placeholder="e.g. Scan to Pay"
                    maxLength={30}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Appearance & Styling */}
            {activeTab === 'appearance' && (
              <div className="p-5 space-y-4">
                {/* Brand Color */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-2">
                    Brand Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setConfig({ ...config, brandColor: col.hex })}
                        style={{ backgroundColor: col.hex }}
                        className={`w-7 h-7 rounded-full transition transform hover:scale-110 ${
                          config.brandColor.toLowerCase() === col.hex.toLowerCase()
                            ? 'ring-2 ring-offset-2 ring-indigo-600 scale-105'
                            : ''
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.brandColor}
                      onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={config.brandColor}
                      onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                      className="text-xs font-mono uppercase px-3 py-1.5 rounded-xl border border-neutral-300 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Screen Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['bottom-right', 'bottom-left'] as WidgetPosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setConfig({ ...config, position: pos })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                          config.position === pos
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                            : 'border-neutral-200 text-neutral-700 bg-white'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size & Radius */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Button Size
                    </label>
                    <div className="flex rounded-xl border border-neutral-200 overflow-hidden text-xs">
                      {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setConfig({ ...config, size: sz })}
                          className={`flex-1 py-1.5 font-bold capitalize transition ${
                            config.size === sz
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {sz[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Border Corner
                    </label>
                    <div className="flex rounded-xl border border-neutral-200 overflow-hidden text-xs">
                      {(['full', 'rounded', 'square'] as WidgetBorderRadius[]).map((rd) => (
                        <button
                          key={rd}
                          type="button"
                          onClick={() => setConfig({ ...config, borderRadius: rd })}
                          className={`flex-1 py-1.5 font-bold capitalize transition ${
                            config.borderRadius === rd
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {rd === 'full' ? 'Pill' : rd === 'rounded' ? 'Curved' : 'Square'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shadow */}
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Shadow Elevation
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', 'soft', 'medium', 'strong'] as WidgetShadow[]).map((sh) => (
                      <button
                        key={sh}
                        type="button"
                        onClick={() => setConfig({ ...config, shadow: sh })}
                        className={`py-1.5 px-2 rounded-xl border text-xs font-bold capitalize transition ${
                          config.shadow === sh
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                            : 'border-neutral-200 text-neutral-600 bg-white'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: QR Modal Popup Text */}
            {activeTab === 'popup' && (
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Modal Header Title
                  </label>
                  <input
                    type="text"
                    value={config.popupTitle || config.modalTitle || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        popupTitle: e.target.value,
                        modalTitle: e.target.value,
                      })
                    }
                    placeholder="e.g. Scan to Pay"
                    maxLength={60}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Instructions / Description
                  </label>
                  <textarea
                    rows={2}
                    value={config.popupDescription || config.modalDescription || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        popupDescription: e.target.value,
                        modalDescription: e.target.value,
                      })
                    }
                    placeholder="e.g. Scan this QR code with Google Pay, PhonePe or Paytm."
                    maxLength={150}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Footer CTA / Badge Text
                  </label>
                  <input
                    type="text"
                    value={config.ctaText || config.helperText || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ctaText: e.target.value,
                        helperText: e.target.value,
                      })
                    }
                    placeholder="e.g. Instant Bank Transfer • Zero Fee"
                    maxLength={60}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEdit ? 'Save Remote Changes' : 'Create & Generate Embed'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Simulator (6 cols) */}
        <div className="lg:col-span-6 sticky top-6">
          <WidgetSimulator
            config={config}
            status={initialWidget?.status || 'ACTIVE'}
            height="h-[460px]"
          />
        </div>
      </div>
    </form>
  );
};

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createQRCodeAction } from '@/lib/qr/actions';
import { validateDestinationUrl } from '@/lib/validation/url-safety';
import {
  Globe,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const CreateQRForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestinationUrl(val);
    setServerError(null);

    if (val.trim()) {
      const check = validateDestinationUrl(val.trim());
      if (!check.isValid) {
        setClientError(check.error || 'Invalid destination URL');
      } else {
        setClientError(null);
      }
    } else {
      setClientError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setServerError('Please enter a name for your QR code');
      return;
    }

    const trimmedUrl = destinationUrl.trim();
    if (!trimmedUrl) {
      setServerError('Destination URL is required');
      return;
    }

    const check = validateDestinationUrl(trimmedUrl);
    if (!check.isValid || !check.sanitizedUrl) {
      setServerError(check.error || 'Invalid destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createQRCodeAction({
        title: trimmedTitle,
        destinationUrl: check.sanitizedUrl,
        type: 'DYNAMIC_URL',
      });

      if (!res.success || !res.data) {
        setServerError(res.error || 'Failed to create QR code');
        setIsSubmitting(false);
        return;
      }

      router.push(`/dashboard/qr-codes/${res.data.qrCodeId}`);
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred while creating the QR code');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Field: QR Title */}
      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-xs font-bold text-neutral-800">
          QR Code Title / Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Counter Stand Menu, Summer Promo 2026"
          required
          maxLength={120}
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
        <p className="text-[11px] text-neutral-400">
          A descriptive name for internal tracking in your dashboard.
        </p>
      </div>

      {/* Field: QR Type (Dynamic URL) */}
      <div className="space-y-1.5">
        <span className="block text-xs font-bold text-neutral-800">
          QR Code Type
        </span>
        <div className="p-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900">
                Dynamic Website / URL
              </div>
              <div className="text-[11px] text-neutral-500">
                Routes scans through a high-speed redirect link that can be updated anytime.
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
            Selected
          </span>
        </div>
      </div>

      {/* Field: Destination URL */}
      <div className="space-y-1.5">
        <label htmlFor="destinationUrl" className="block text-xs font-bold text-neutral-800">
          Target Destination URL <span className="text-rose-500">*</span>
        </label>
        <input
          id="destinationUrl"
          type="url"
          value={destinationUrl}
          onChange={handleUrlChange}
          placeholder="https://example.com/menu"
          required
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-mono"
        />
        {clientError ? (
          <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{clientError}</span>
          </p>
        ) : (
          <p className="text-[11px] text-neutral-400">
            Must be a valid public HTTP or HTTPS web address.
          </p>
        )}
      </div>

      {/* Explanatory Box */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>How Dynamic Short Codes Work</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          A globally unique 7-character Base62 code will be generated. The printed QR image will point to our instant redirect engine. You can change the target URL above whenever you want without ever reprinting!
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
        <Link
          href="/dashboard/qr-codes"
          className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || !!clientError}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Dynamic QR...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Create Dynamic QR Code</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

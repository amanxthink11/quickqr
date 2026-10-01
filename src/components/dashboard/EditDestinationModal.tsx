'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Check, X, Loader2, Globe, AlertCircle } from 'lucide-react';
import { updateDestinationAction } from '@/lib/qr/actions';
import { validateDestinationUrl } from '@/lib/validation/url-safety';

interface EditDestinationModalProps {
  qrCodeId: string;
  currentDestinationUrl: string;
  canEdit: boolean;
}

export const EditDestinationModal: React.FC<EditDestinationModalProps> = ({
  qrCodeId,
  currentDestinationUrl,
  canEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newUrl, setNewUrl] = useState(currentDestinationUrl);
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!canEdit) {
    return (
      <div className="text-xs text-neutral-400 italic">
        Read-only permissions (Viewer)
      </div>
    );
  }

  const handleOpen = () => {
    setNewUrl(currentDestinationUrl);
    setClientError(null);
    setServerError(null);
    setSuccessMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewUrl(val);
    setServerError(null);

    if (val.trim()) {
      const check = validateDestinationUrl(val.trim());
      if (!check.isValid) {
        setClientError(check.error || 'Invalid URL');
      } else {
        setClientError(null);
      }
    } else {
      setClientError('Destination URL is required');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newUrl.trim();
    const check = validateDestinationUrl(trimmed);
    if (!check.isValid || !check.sanitizedUrl) {
      setClientError(check.error || 'Invalid destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      const res = await updateDestinationAction({
        qrCodeId,
        destinationUrl: check.sanitizedUrl,
      });

      if (!res.success) {
        setServerError(res.error || 'Failed to update destination');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Destination updated successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        setIsOpen(false);
        router.refresh();
      }, 800);
    } catch {
      setServerError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition shadow-2xs"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Change Destination</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Update Destination URL</h3>
                  <p className="text-[11px] text-neutral-500">
                    Physical QR image remains unchanged. New scans will redirect here.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="destinationUrl" className="block text-xs font-bold text-neutral-700 mb-1">
                  New Destination URL
                </label>
                <div className="relative">
                  <input
                    id="destinationUrl"
                    type="url"
                    value={newUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/new-promo"
                    required
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-mono"
                  />
                </div>
                {clientError && (
                  <p className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{clientError}</span>
                  </p>
                )}
                {serverError && (
                  <p className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{serverError}</span>
                  </p>
                )}
                {successMessage && (
                  <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{successMessage}</span>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold">Instant Resolver Update:</span> When saved, the redirect engine immediately invalidates its cache and directs all scans to this new URL.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!clientError}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save New Destination</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

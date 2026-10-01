'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { updateQRCodeAction } from '@/lib/qr/actions';

interface EditTitleModalProps {
  qrCodeId: string;
  currentTitle: string;
  canEdit: boolean;
}

export const EditTitleModal: React.FC<EditTitleModalProps> = ({
  qrCodeId,
  currentTitle,
  canEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!canEdit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Title cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await updateQRCodeAction({ qrCodeId, title: trimmed });
      if (!res.success) {
        setError(res.error || 'Failed to update title');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError('Failed to update title');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTitle(currentTitle);
          setError(null);
          setIsOpen(true);
        }}
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
        title="Edit QR Title"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Rename QR Code</h3>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title-input" className="block text-xs font-bold text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  id="title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

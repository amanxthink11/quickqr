'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { deleteQRCodeAction } from '@/lib/qr/actions';

interface DeleteQRModalProps {
  qrCodeId: string;
  title: string;
  shortCode: string;
  canDelete: boolean;
  onDeletedRedirectTo?: string;
  size?: 'sm' | 'md';
}

export const DeleteQRModal: React.FC<DeleteQRModalProps> = ({
  qrCodeId,
  title,
  shortCode,
  canDelete,
  onDeletedRedirectTo = '/dashboard/qr-codes',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!canDelete) {
    return null;
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const res = await deleteQRCodeAction({ qrCodeId });
      if (!res.success) {
        setError(res.error || 'Failed to delete QR code');
        setIsDeleting(false);
        return;
      }

      setIsOpen(false);
      if (onDeletedRedirectTo) {
        router.push(onDeletedRedirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  const isSmall = size === 'sm';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition shadow-2xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 ${
          isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
        }`}
        title="Delete QR Code"
      >
        <Trash2 className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        <span>Delete</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Delete QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setIsOpen(false)}
                disabled={isDeleting}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-600">
              <p>
                Are you sure you want to delete <span className="font-bold text-neutral-900">&quot;{title}&quot;</span> (Code: <code className="font-mono text-neutral-800">{shortCode}</code>)?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                <p className="font-bold">Important Consequences:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>This performs a safe soft-delete.</li>
                  <li>Scans of the physical QR will immediately land on a Not Found page.</li>
                  <li>This QR will be removed from your dashboard list.</li>
                </ul>
              </div>
              {error && (
                <p className="text-rose-600 font-semibold text-xs mt-2">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete QR Code</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

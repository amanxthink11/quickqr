'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { deleteWidgetAction } from '@/lib/widget/actions';

interface WidgetDeleteModalProps {
  widgetId: string;
  name: string;
  publicId: string;
  canDelete: boolean;
  onDeletedRedirectTo?: string;
  size?: 'sm' | 'md';
}

export const WidgetDeleteModal: React.FC<WidgetDeleteModalProps> = ({
  widgetId,
  name,
  publicId,
  canDelete,
  onDeletedRedirectTo = '/dashboard/widgets',
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

      const res = await deleteWidgetAction(widgetId);
      if (!res.success) {
        setError(res.error || 'Failed to archive widget');
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
        title="Archive / Delete Widget"
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
                <h3 className="text-sm font-bold text-neutral-900">Archive Website Widget</h3>
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
                Are you sure you want to delete <span className="font-bold text-neutral-900">&quot;{name}&quot;</span> (Public Key: <code className="font-mono text-neutral-800">{publicId}</code>)?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                <p className="font-bold">Important Consequences:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>The public widget endpoint will immediately return 404.</li>
                  <li>Existing website embeds using this widget will stop rendering.</li>
                  <li>Soft deletion preserves audit integrity in your database.</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

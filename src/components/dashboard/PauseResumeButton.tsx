'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Play, Loader2 } from 'lucide-react';
import { pauseQRCodeAction, resumeQRCodeAction } from '@/lib/qr/actions';

interface PauseResumeButtonProps {
  qrCodeId: string;
  status: string;
  canEdit: boolean;
  size?: 'sm' | 'md';
}

export const PauseResumeButton: React.FC<PauseResumeButtonProps> = ({
  qrCodeId,
  status,
  canEdit,
  size = 'md',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!canEdit || status === 'ARCHIVED') {
    return null;
  }

  const isPaused = status === 'PAUSED';

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      if (isPaused) {
        await resumeQRCodeAction({ qrCodeId });
      } else {
        await pauseQRCodeAction({ qrCodeId });
      }
      router.refresh();
    } catch (err) {
      console.error('Failed to toggle status', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition shadow-2xs disabled:opacity-50 ${
        isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-2 text-xs'
      } ${
        isPaused
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
      }`}
      title={isPaused ? 'Resume redirection' : 'Temporarily pause redirection'}
    >
      {isLoading ? (
        <Loader2 className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
      ) : isPaused ? (
        <Play className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      ) : (
        <Pause className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      )}
      <span>{isPaused ? 'Resume' : 'Pause'}</span>
    </button>
  );
};

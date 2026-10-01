'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/auth/actions';
import { LogOut, Loader2 } from 'lucide-react';

export const LogoutButton: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push('/login');
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className={
        className ||
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer disabled:opacity-50'
      }
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>Sign Out</span>
    </button>
  );
};

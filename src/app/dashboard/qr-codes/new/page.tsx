import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { hasRoleAtLeast } from '@/lib/auth/rbac';
import { CreateQRForm } from '@/components/dashboard/CreateQRForm';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewQRCodePage() {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in new QR page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    redirect('/dashboard');
  }

  // RBAC check: MEMBER or higher required to create QR codes
  if (!role || !hasRoleAtLeast(role, 'MEMBER')) {
    redirect('/dashboard/qr-codes');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/qr-codes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to QR Codes</span>
        </Link>
      </div>

      {/* Main Form Container Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Create Dynamic QR Code
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Setting up a dynamic code for <span className="font-semibold text-neutral-800">{activeOrganization.name}</span>.
          </p>
        </div>

        <CreateQRForm />
      </div>
    </div>
  );
}

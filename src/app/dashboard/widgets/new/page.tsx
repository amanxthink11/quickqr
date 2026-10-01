import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { WidgetForm } from '@/components/dashboard/WidgetForm';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewWidgetPage() {
  const sessionCtx = await getCurrentSession();

  if (!sessionCtx) {
    redirect('/login');
  }

  const { activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    redirect('/dashboard');
  }

  // RBAC Guard: Member or higher required to create widgets
  const canCreate = role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
  if (!canCreate) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">Permission Denied</h2>
        <p className="text-xs text-neutral-500">
          Your current organization role ({role}) does not have permission to create website widgets.
        </p>
        <Link
          href="/dashboard/widgets"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Widgets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="space-y-2">
        <Link
          href="/dashboard/widgets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Widgets</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
              Create Website QR Widget
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Configure your floating button, preview in real time, and generate a permanent remote embed code.
            </p>
          </div>
        </div>
      </div>

      {/* Widget Form with Live Interactive Simulator */}
      <WidgetForm isEdit={false} />
    </div>
  );
}

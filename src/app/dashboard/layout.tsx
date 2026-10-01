import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/auth/session';
import { OrganizationSwitcher } from '@/components/dashboard/OrganizationSwitcher';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in dashboard layout', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role, memberships } = sessionCtx;

  return (
    <div className="min-h-screen bg-neutral-50/70 flex flex-col">
      {/* Dashboard Top Header Bar */}
      <div className="bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Organization Switcher Context */}
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              activeOrganization={activeOrganization}
              memberships={memberships}
              currentRole={role}
            />
          </div>

          {/* User profile & actions */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-neutral-900">{user.fullName}</div>
              <div className="text-[10px] text-neutral-400 font-mono">{user.email}</div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/qr-code-generator"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition"
                title="Open Static QR Generator"
              >
                <span>Free QR Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <DashboardNav />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

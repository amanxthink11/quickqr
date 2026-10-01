import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { OrganizationSwitcher } from '@/components/dashboard/OrganizationSwitcher';
import { Building2, Shield, User, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardSettingsPage() {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in settings page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role, memberships } = sessionCtx;

  if (!activeOrganization) {
    redirect('/dashboard');
  }

  const roleDescriptions: Record<string, string> = {
    OWNER: 'Full administrative access: organization settings, billing, QR creation, editing, and deletion.',
    ADMIN: 'Administrative access: member management, QR creation, editing, pause/resume, and deletion.',
    MEMBER: 'Standard access: create, edit destinations, and pause/resume dynamic QR codes.',
    VIEWER: 'Read-only access: view QR codes, destinations, and details. Cannot perform modifications.',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Organization &amp; Account Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          View your active organization boundary, team role permissions, and tenant context.
        </p>
      </div>

      {/* Active Organization Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              {activeOrganization.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">{activeOrganization.name}</h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                Slug: /{activeOrganization.slug}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            Active Tenant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-400 block mb-0.5">
              Organization ID (Internal)
            </span>
            <span className="font-mono text-neutral-800 text-[11px]">{activeOrganization.id}</span>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-400 block mb-0.5">
              Your Current Role
            </span>
            <span className="font-bold text-neutral-900">{role}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role Permissions ({role})</span>
          </div>
          <p className="text-[11px] text-indigo-800">
            {roleDescriptions[role || 'VIEWER'] || 'Standard organization access.'}
          </p>
        </div>
      </div>

      {/* Multi-Tenant Switcher Card */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-900">
              Your Organizations ({memberships.length})
            </h2>
          </div>
          <OrganizationSwitcher
            activeOrganization={activeOrganization}
            memberships={memberships}
            currentRole={role}
          />
        </div>

        <p className="text-xs text-neutral-500">
          You can belong to multiple organizations or stores under one user account. Switch organizations using the dropdown above.
        </p>

        <div className="space-y-2">
          {memberships.map((m) => {
            const isActive = m.organizationId === activeOrganization.id;
            return (
              <div
                key={m.organizationId}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
                  isActive
                    ? 'bg-neutral-50/80 border-indigo-200'
                    : 'bg-white border-neutral-100 hover:border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {m.organizationName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900 flex items-center gap-2">
                      <span>{m.organizationName}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      /{m.organizationSlug}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                  {m.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Account Details */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <User className="w-4 h-4 text-neutral-500" />
          <h2 className="text-sm font-bold text-neutral-900">User Account</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-neutral-400 text-[11px] block">Full Name</span>
            <span className="font-bold text-neutral-900">{user.fullName}</span>
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Email Address</span>
            <span className="font-bold text-neutral-900">{user.email}</span>
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Account Created</span>
            <span className="text-neutral-700">
              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Security Protection</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Argon2id + SHA-256 Sessions Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

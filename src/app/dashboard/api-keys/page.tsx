import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { listApiKeys } from '@/lib/api-keys/service';
import { ApiKeyManager } from '@/components/dashboard/ApiKeyManager';
import { ApiKeySafe } from '@/lib/api-keys/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Developer API Keys | QuickQR Dashboard',
  description: 'Manage REST API keys for programmatic QR generation, updates, and analytics.',
};

export default async function ApiKeysPage() {
  let sessionCtx = null;
  try {
    sessionCtx = await getCurrentSession();
  } catch (err) {
    console.error('Failed to load session in api-keys page', err);
  }

  if (!sessionCtx) {
    redirect('/login');
  }

  const { user, activeOrganization, role } = sessionCtx;
  if (!activeOrganization) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">No Organization Selected</h2>
        <p className="text-xs text-neutral-500">
          Please select or switch to an organization to view your API keys.
        </p>
      </div>
    );
  }

  const userRole = role || 'VIEWER';
  let keys: ApiKeySafe[] = [];

  // Only attempt to load keys if role has view access (OWNER / ADMIN)
  if (userRole === 'OWNER' || userRole === 'ADMIN') {
    try {
      keys = await listApiKeys(user.id, activeOrganization.id);
    } catch (err) {
      console.error('Failed to list API keys', err);
    }
  }

  return (
    <ApiKeyManager
      initialKeys={keys}
      userRole={userRole}
      orgName={activeOrganization.name}
    />
  );
}

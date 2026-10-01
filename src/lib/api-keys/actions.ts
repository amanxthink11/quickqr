'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/session';
import { createApiKey, listApiKeys, revokeApiKey } from './service';
import { ApiKeySafe, CreateApiKeyResult } from './types';
import { ActionResponse } from '@/lib/auth/actions';

/**
 * Server Action: Lists all API keys for the current active organization.
 * RBAC: Only OWNER or ADMIN may view API keys.
 */
export async function listApiKeysAction(): Promise<ActionResponse<ApiKeySafe[]>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const keys = await listApiKeys(ctx.user.id, orgId);
    return { success: true, data: keys };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve API keys';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Creates a new API key and returns the complete raw secret key ONCE.
 * RBAC: Only OWNER or ADMIN may create API keys.
 */
export async function createApiKeyAction(input: {
  name: string;
  expiresInDays?: number | null;
}): Promise<ActionResponse<CreateApiKeyResult>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    let expiresAt: Date | null = null;
    if (input.expiresInDays && input.expiresInDays > 0) {
      expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
    }

    const result = await createApiKey(ctx.user.id, orgId, {
      name: input.name,
      expiresAt,
    });

    revalidatePath('/dashboard/api-keys');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create API key';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Immediately revokes an API key.
 * RBAC: Only OWNER or ADMIN may revoke API keys.
 */
export async function revokeApiKeyAction(
  apiKeyId: string
): Promise<ActionResponse<ApiKeySafe>> {
  try {
    const ctx = await requireAuth();
    const orgId = ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const revoked = await revokeApiKey(ctx.user.id, orgId, apiKeyId);

    revalidatePath('/dashboard/api-keys');

    return { success: true, data: revoked };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to revoke API key';
    return { success: false, error: message };
  }
}

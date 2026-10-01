'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/session';
import {
  createQRCode,
  updateQRCode,
  updateQRCodeDestination,
  pauseQRCode,
  resumeQRCode,
  deleteQRCode,
  QRCodeWithDestinations,
} from './service';
import { ActionResponse } from '@/lib/auth/actions';

/**
 * Server Action: Creates a new dynamic QR code in the active organization.
 */
export async function createQRCodeAction(input: {
  title: string;
  destinationUrl?: string;
  organizationId?: string;
  type?: 'DYNAMIC_URL' | 'STATIC_URL';
}): Promise<ActionResponse<{ qrCodeId: string; shortCode: string }>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const qrCode = await createQRCode(ctx.user.id, orgId, {
      title: input.title,
      destinationUrl: input.destinationUrl,
      type: input.type || 'DYNAMIC_URL',
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');

    return {
      success: true,
      data: {
        qrCodeId: qrCode.id,
        shortCode: qrCode.shortCode,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create QR code';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates destination URL of an existing dynamic QR code.
 */
export async function updateDestinationAction(input: {
  qrCodeId: string;
  destinationUrl: string;
  organizationId?: string;
}): Promise<ActionResponse<QRCodeWithDestinations>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const updated = await updateQRCodeDestination(
      ctx.user.id,
      orgId,
      input.qrCodeId,
      input.destinationUrl
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');
    revalidatePath(`/dashboard/qr-codes/${input.qrCodeId}`);

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update destination';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Updates QR code title/metadata.
 */
export async function updateQRCodeAction(input: {
  qrCodeId: string;
  title?: string;
  organizationId?: string;
}): Promise<ActionResponse<QRCodeWithDestinations>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const updated = await updateQRCode(ctx.user.id, orgId, input.qrCodeId, {
      title: input.title,
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');
    revalidatePath(`/dashboard/qr-codes/${input.qrCodeId}`);

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update QR code';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Pauses a QR code.
 */
export async function pauseQRCodeAction(input: {
  qrCodeId: string;
  organizationId?: string;
}): Promise<ActionResponse<QRCodeWithDestinations>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const paused = await pauseQRCode(ctx.user.id, orgId, input.qrCodeId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');
    revalidatePath(`/dashboard/qr-codes/${input.qrCodeId}`);

    return { success: true, data: paused };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to pause QR code';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Resumes a paused QR code.
 */
export async function resumeQRCodeAction(input: {
  qrCodeId: string;
  organizationId?: string;
}): Promise<ActionResponse<QRCodeWithDestinations>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    const resumed = await resumeQRCode(ctx.user.id, orgId, input.qrCodeId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');
    revalidatePath(`/dashboard/qr-codes/${input.qrCodeId}`);

    return { success: true, data: resumed };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resume QR code';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Soft deletes a QR code (destructive action requiring ADMIN+).
 */
export async function deleteQRCodeAction(input: {
  qrCodeId: string;
  organizationId?: string;
}): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const ctx = await requireAuth();
    const orgId = input.organizationId || ctx.activeOrganization?.id;
    if (!orgId) {
      return { success: false, error: 'No active organization found' };
    }

    await deleteQRCode(ctx.user.id, orgId, input.qrCodeId);

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');

    return { success: true, data: { deleted: true } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete QR code';
    return { success: false, error: message };
  }
}

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import {
  getQRCode,
  updateQRCode,
  updateQRCodeDestination,
  deleteQRCode,
  QRCodeWithDestinations,
} from '@/lib/qr/service';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

function formatQrCode(qr: QRCodeWithDestinations) {
  return {
    id: qr.id,
    shortCode: qr.shortCode,
    title: qr.title,
    type: qr.type,
    status: qr.status,
    destinationUrl: qr.destinations?.[0]?.destinationUrl || null,
    styling: qr.styling,
    expiresAt: qr.expiresAt ? qr.expiresAt.toISOString() : null,
    scanLimit: qr.scanLimit,
    createdAt: qr.createdAt.toISOString(),
    updatedAt: qr.updatedAt.toISOString(),
  };
}

const updateQrCodeSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(120).optional(),
  destinationUrl: z.string().trim().min(1, 'Destination URL cannot be empty').optional(),
  styling: z.record(z.string(), z.unknown()).optional(),
  scanLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * GET /api/v1/qr-codes/:id
 * Retrieves a single dynamic QR code by ID strictly scoped to the tenant.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'qr:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  try {
    const qr = await getQRCode('api-key', organization.id, id);
    if (!qr) {
      return apiError('NOT_FOUND', 'QR code not found or access denied', 404);
    }

    return apiSuccess(formatQrCode(qr));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving QR code';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * PATCH /api/v1/qr-codes/:id
 * Updates metadata or destination URL of an existing QR code.
 * Reuses existing update destination service and invalidates resolver cache.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'qr:write',
    operationType: 'write',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Malformed JSON in request body', 400);
  }

  const parsed = updateQrCodeSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation error';
    return apiError('VALIDATION_ERROR', firstError, 422, parsed.error.flatten());
  }

  const input = parsed.data;

  try {
    // 1. Check existing record belongs to tenant
    const existing = await getQRCode('api-key', organization.id, id);
    if (!existing) {
      return apiError('NOT_FOUND', 'QR code not found or access denied', 404);
    }

    // 2. Update destination if provided (with anti-SSRF and resolver cache invalidation)
    if (input.destinationUrl !== undefined) {
      await updateQRCodeDestination('api-key', organization.id, id, input.destinationUrl);
    }

    // 3. Update title/metadata if provided
    if (
      input.title !== undefined ||
      input.styling !== undefined ||
      input.expiresAt !== undefined ||
      input.scanLimit !== undefined
    ) {
      await updateQRCode('api-key', organization.id, id, {
        title: input.title,
        styling: input.styling as Prisma.InputJsonValue | undefined,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : input.expiresAt === null ? null : undefined,
        scanLimit: input.scanLimit,
      });
    }

    const updated = await getQRCode('api-key', organization.id, id);
    if (!updated) {
      return apiError('NOT_FOUND', 'QR code not found after update', 404);
    }

    return apiSuccess(formatQrCode(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update QR code';
    if (message.includes('Destination URL') || message.includes('SSRF') || message.includes('permitted')) {
      return apiError('VALIDATION_ERROR', message, 422);
    }
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * DELETE /api/v1/qr-codes/:id
 * Soft-deletes a QR code strictly within the organization boundary.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'qr:write',
    operationType: 'write',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  try {
    const existing = await getQRCode('api-key', organization.id, id);
    if (!existing) {
      return apiError('NOT_FOUND', 'QR code not found or access denied', 404);
    }

    await deleteQRCode('api-key', organization.id, id);

    return apiSuccess({ deleted: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete QR code';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

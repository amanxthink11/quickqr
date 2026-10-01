import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { resumeQRCode, getQRCode, QRCodeWithDestinations } from '@/lib/qr/service';

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

/**
 * POST /api/v1/qr-codes/:id/resume
 * Resumes a paused QR code.
 */
export async function POST(
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

    const updated = await resumeQRCode('api-key', organization.id, id);
    return apiSuccess(formatQrCode(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resume QR code';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

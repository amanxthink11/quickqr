import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getQRCode } from '@/lib/qr/service';
import { getCompleteAnalyticsReport, AnalyticsRange } from '@/lib/analytics/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/qr-codes/:id/analytics
 * Retrieves complete scan analytics for a specific QR code.
 * Supports query parameter: ?range=today|7d|30d (default: 7d)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'analytics:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  // 1. Verify QR exists and belongs strictly to the authenticated organization
  const qr = await getQRCode('api-key', organization.id, id);
  if (!qr) {
    return apiError('NOT_FOUND', 'QR code not found or access denied', 404);
  }

  // 2. Parse & sanitize range query parameter
  const rawRange = request.nextUrl.searchParams.get('range');
  const range: AnalyticsRange =
    rawRange === 'today' || rawRange === '30d' ? rawRange : '7d';

  try {
    const report = await getCompleteAnalyticsReport(organization.id, range, id);

    return apiSuccess({
      qrCodeId: id,
      shortCode: qr.shortCode,
      title: qr.title,
      range,
      ...report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analytics report';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

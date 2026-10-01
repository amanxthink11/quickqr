import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getCompleteAnalyticsReport, AnalyticsRange } from '@/lib/analytics/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/analytics
 * Retrieves organization-wide scan analytics.
 * Supports query parameter: ?range=today|7d|30d (default: 7d)
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'analytics:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;

  const rawRange = request.nextUrl.searchParams.get('range');
  const range: AnalyticsRange =
    rawRange === 'today' || rawRange === '30d' ? rawRange : '7d';

  try {
    const report = await getCompleteAnalyticsReport(organization.id, range);

    return apiSuccess({
      organizationId: organization.id,
      organizationName: organization.name,
      range,
      ...report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analytics report';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { pauseWidget, getWidget } from '@/lib/widget/service';
import { Widget } from '@prisma/client';

export const dynamic = 'force-dynamic';

function formatWidget(w: Widget) {
  return {
    id: w.id,
    publicId: w.publicId,
    name: w.name,
    status: w.status,
    configuration: w.configuration,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

/**
 * POST /api/v1/widgets/:id/pause
 * Pauses a widget so it temporarily stops displaying on client websites.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'widget:write',
    operationType: 'write',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  try {
    const existing = await getWidget('api-key', organization.id, id);
    if (!existing) {
      return apiError('NOT_FOUND', 'Widget not found or access denied', 404);
    }

    const updated = await pauseWidget('api-key', organization.id, id);
    return apiSuccess(formatWidget(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to pause widget';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

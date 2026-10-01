import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import {
  getWidget,
  updateWidget,
  deleteWidget,
} from '@/lib/widget/service';
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

const updateWidgetSchema = z.object({
  name: z.string().trim().min(1, 'Widget name cannot be empty').max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/v1/widgets/:id
 * Retrieves a single widget strictly belonging to the organization.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'widget:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { id } = await context.params;

  try {
    const widget = await getWidget('api-key', organization.id, id);
    if (!widget) {
      return apiError('NOT_FOUND', 'Widget not found or access denied', 404);
    }

    return apiSuccess(formatWidget(widget));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error retrieving widget';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * PATCH /api/v1/widgets/:id
 * Updates widget name or configuration payload.
 */
export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Malformed JSON in request body', 400);
  }

  const parsed = updateWidgetSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation error';
    return apiError('VALIDATION_ERROR', firstError, 422, parsed.error.flatten());
  }

  const input = parsed.data;

  try {
    const existing = await getWidget('api-key', organization.id, id);
    if (!existing) {
      return apiError('NOT_FOUND', 'Widget not found or access denied', 404);
    }

    const updated = await updateWidget('api-key', organization.id, id, {
      name: input.name,
      config: input.config,
    });

    return apiSuccess(formatWidget(updated));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update widget';
    if (message.includes('configuration') || message.includes('URL') || message.includes('permitted')) {
      return apiError('VALIDATION_ERROR', message, 422);
    }
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * DELETE /api/v1/widgets/:id
 * Soft deletes a widget.
 */
export async function DELETE(
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

    await deleteWidget('api-key', organization.id, id);

    return apiSuccess({ deleted: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete widget';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

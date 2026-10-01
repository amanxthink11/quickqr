import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { listWidgets, createWidget } from '@/lib/widget/service';
import { getDefaultWidgetConfig } from '@/lib/widget/config';
import { WidgetType } from '@/lib/widget/types';
import { WidgetStatus, Widget } from '@prisma/client';

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

const createWidgetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Widget name cannot be empty')
    .max(100, 'Widget name cannot exceed 100 characters'),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

/**
 * GET /api/v1/widgets
 * Lists all website widgets for the authenticated organization.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'widget:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { searchParams } = request.nextUrl;

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || '25', 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 25 : Math.min(100, rawLimit);
  const statusParam = searchParams.get('status') as WidgetStatus | null;

  try {
    const result = await listWidgets('api-key', organization.id, {
      page,
      limit,
      status: statusParam || undefined,
    });

    const formatted = result.widgets.map(formatWidget);

    const totalPages = Math.ceil(result.total / limit) || 1;

    return apiSuccess(formatted, 200, {
      page,
      limit,
      total: result.total,
      totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve widgets';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * POST /api/v1/widgets
 * Creates a new remote website widget scoped strictly to the organization.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'widget:write',
    operationType: 'write',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Malformed JSON in request body', 400);
  }

  const parsed = createWidgetSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation error';
    return apiError('VALIDATION_ERROR', firstError, 422, parsed.error.flatten());
  }

  const input = parsed.data;

  try {
    const rawType = typeof input.config?.type === 'string' ? input.config.type : 'upi';
    const validTypes: WidgetType[] = ['upi', 'whatsapp', 'review', 'menu', 'website', 'custom', 'url'];
    const widgetType: WidgetType = validTypes.includes(rawType as WidgetType) ? (rawType as WidgetType) : 'upi';
    const baseConfig = getDefaultWidgetConfig(widgetType);
    const mergedConfig = { ...baseConfig, ...input.config };

    const widget = await createWidget('api-key', organization.id, {
      name: input.name,
      config: mergedConfig,
    });

    return apiSuccess(formatWidget(widget), 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create widget';
    if (message.includes('configuration') || message.includes('URL') || message.includes('permitted')) {
      return apiError('VALIDATION_ERROR', message, 422);
    }
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

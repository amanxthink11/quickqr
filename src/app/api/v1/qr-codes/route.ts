import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateApiRequest } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/response';
import { listQRCodes, createQRCode, QRCodeWithDestinations } from '@/lib/qr/service';
import { QRType, QRStatus, Prisma } from '@prisma/client';

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

const createQrCodeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters'),
  destinationUrl: z
    .string()
    .trim()
    .min(1, 'Destination URL cannot be empty'),
  type: z.enum(['DYNAMIC_URL', 'STATIC_URL']).optional().default('DYNAMIC_URL'),
  styling: z.record(z.string(), z.unknown()).optional(),
  scanLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * GET /api/v1/qr-codes
 * Lists dynamic QR codes for the authenticated organization with pagination.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'qr:read',
    operationType: 'read',
  });
  if (!auth.success) return auth.response;

  const { organization } = auth.context;
  const { searchParams } = request.nextUrl;

  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || '25', 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 25 : Math.min(100, rawLimit);

  const typeParam = searchParams.get('type') as QRType | null;
  const statusParam = searchParams.get('status') as QRStatus | null;
  const search = searchParams.get('search') || undefined;

  try {
    const result = await listQRCodes('api-key', organization.id, {
      page,
      limit,
      type: typeParam || undefined,
      status: statusParam || undefined,
      search,
    });

    const formatted = result.qrCodes.map(formatQrCode);

    return apiSuccess(formatted, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve QR codes';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

/**
 * POST /api/v1/qr-codes
 * Creates a new dynamic QR code scoped strictly to the authenticated organization.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, {
    requiredScope: 'qr:write',
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

  const parsed = createQrCodeSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Validation error';
    return apiError('VALIDATION_ERROR', firstError, 422, parsed.error.flatten());
  }

  const input = parsed.data;

  try {
    const created = await createQRCode('api-key', organization.id, {
      title: input.title,
      destinationUrl: input.destinationUrl,
      type: input.type as QRType,
      styling: input.styling as Prisma.InputJsonValue | undefined,
      scanLimit: input.scanLimit || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });

    return apiSuccess(formatQrCode(created), 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create QR code';
    if (message.includes('Destination URL') || message.includes('SSRF') || message.includes('permitted')) {
      return apiError('VALIDATION_ERROR', message, 422);
    }
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

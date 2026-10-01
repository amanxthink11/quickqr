import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { QRCode, QRCodeDestination, QRType, QRStatus, Prisma } from '@prisma/client';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a 7-character cryptographically secure Base62 short code.
 * Entropy: 62^7 ≈ 3.52 x 10^12 permutations.
 */
export function generateShortCode(length = 7): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += BASE62_ALPHABET[bytes[i] % 62];
  }
  return code;
}

/**
 * Generates a collision-resistant unique shortCode with up to 3 database retry attempts.
 */
export async function generateUniqueShortCode(maxAttempts = 3): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode(7);
    const existing = await prisma.qRCode.findUnique({
      where: { shortCode: code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  // Fallback to 8 chars if high collision density
  return generateShortCode(8);
}

/**
 * Strict Tenant Isolation: Retrieves a single QR code belonging strictly to organizationId.
 * Never leaks the existence of QR codes across organizations (IDOR defense).
 */
export async function getTenantQRCode(
  organizationId: string,
  qrCodeId: string
): Promise<(QRCode & { destinations: QRCodeDestination[] }) | null> {
  if (!organizationId || !qrCodeId) return null;

  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      organizationId,
      deletedAt: null,
    },
    include: {
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Lists all active QR codes for a given organization (tenant-scoped).
 */
export async function listTenantQRCodes(
  organizationId: string,
  options?: { page?: number; limit?: number; type?: QRType; status?: QRStatus }
): Promise<{ qrCodes: QRCode[]; total: number }> {
  if (!organizationId) {
    throw new Error('Tenant organizationId is required');
  }

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.QRCodeWhereInput = {
    organizationId,
    deletedAt: null,
    ...(options?.type ? { type: options.type } : {}),
    ...(options?.status ? { status: options.status } : {}),
  };

  const [qrCodes, total] = await Promise.all([
    prisma.qRCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        destinations: {
          where: { isActive: true },
          take: 1,
        },
      },
    }),
    prisma.qRCode.count({ where }),
  ]);

  return { qrCodes, total };
}

export interface CreateQRCodeInput {
  title: string;
  type?: QRType;
  styling: Prisma.InputJsonValue;
  destinationUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  scanLimit?: number;
  expiresAt?: Date;
}

/**
 * Creates a new QR Code strictly within the tenant boundary.
 * If destinationUrl is provided, creates the active QRCodeDestination atomically.
 */
export async function createTenantQRCode(
  organizationId: string,
  input: CreateQRCodeInput
): Promise<QRCode & { destinations: QRCodeDestination[] }> {
  if (!organizationId) {
    throw new Error('Tenant organizationId is required');
  }

  const shortCode = await generateUniqueShortCode();

  return prisma.qRCode.create({
    data: {
      organizationId,
      shortCode,
      title: input.title,
      type: input.type || 'DYNAMIC_URL',
      styling: input.styling,
      scanLimit: input.scanLimit || null,
      expiresAt: input.expiresAt || null,
      destinations: input.destinationUrl
        ? {
            create: {
              destinationUrl: input.destinationUrl,
              isActive: true,
              utmSource: input.utmSource || null,
              utmMedium: input.utmMedium || null,
              utmCampaign: input.utmCampaign || null,
            },
          }
        : undefined,
    },
    include: {
      destinations: true,
    },
  });
}

/**
 * Updates a tenant's QR Code metadata and active destination safely.
 */
export async function updateTenantQRCode(
  organizationId: string,
  qrCodeId: string,
  updates: {
    title?: string;
    status?: QRStatus;
    styling?: Prisma.InputJsonValue;
    scanLimit?: number | null;
    expiresAt?: Date | null;
    newDestinationUrl?: string;
  }
): Promise<QRCode | null> {
  const existing = await getTenantQRCode(organizationId, qrCodeId);
  if (!existing) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    // If a new destination URL is provided, deactivate previous destinations and create new
    if (updates.newDestinationUrl && updates.newDestinationUrl !== existing.destinations[0]?.destinationUrl) {
      await tx.qRCodeDestination.updateMany({
        where: { qrCodeId, isActive: true },
        data: { isActive: false, deactivatedAt: new Date() },
      });

      await tx.qRCodeDestination.create({
        data: {
          qrCodeId,
          destinationUrl: updates.newDestinationUrl,
          isActive: true,
        },
      });
    }

    return tx.qRCode.update({
      where: { id: qrCodeId },
      data: {
        title: updates.title,
        status: updates.status,
        styling: updates.styling,
        scanLimit: updates.scanLimit,
        expiresAt: updates.expiresAt,
      },
    });
  });
}

/**
 * Soft-deletes a QR code strictly within the organization boundary.
 */
export async function softDeleteTenantQRCode(
  organizationId: string,
  qrCodeId: string
): Promise<boolean> {
  const existing = await getTenantQRCode(organizationId, qrCodeId);
  if (!existing) {
    return false;
  }

  await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      deletedAt: new Date(),
      status: 'ARCHIVED',
    },
  });

  return true;
}

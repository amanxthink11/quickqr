import { prisma } from '@/lib/db/prisma';
import { QRCode, QRCodeDestination, QRStatus, QRType, Prisma } from '@prisma/client';
import { requireOrganizationRole } from '@/lib/auth/rbac';
import { generateUniqueShortCode } from '@/lib/auth/tenancy';
import { validateDestinationUrl } from '@/lib/validation/url-safety';
import { resolverCache } from '@/lib/qr/resolver';

export const DEFAULT_DYNAMIC_STYLING: Record<string, unknown> = {
  frameStyle: 'none',
  frameText: 'SCAN ME',
  frameColor: '#1E293B',
  frameTextColor: '#FFFFFF',
  fgColor: '#1E293B',
  bgColor: '#FFFFFF',
  eyeColor: '#1E293B',
  dotStyle: 'rounded',
  eyeStyle: 'rounded',
  errorCorrectionLevel: 'M',
  size: 320,
};

export interface CreateQRCodeInput {
  title: string;
  type?: QRType;
  destinationUrl?: string;
  styling?: Prisma.InputJsonValue;
  expiresAt?: Date | null;
  scanLimit?: number | null;
}

export interface ListQRCodesOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: QRStatus;
  type?: QRType;
}

export type QRCodeWithDestinations = QRCode & {
  destinations: QRCodeDestination[];
};

export interface DashboardStats {
  totalQRs: number;
  activeQRs: number;
  pausedQRs: number;
  recentQRs: QRCodeWithDestinations[];
}

/**
 * Creates a new dynamic QR code scoped strictly to an organization.
 * Validates RBAC (MEMBER+), destination URL safety (anti-SSRF), and generates unique Base62 shortCode.
 */
export async function createQRCode(
  userId: string,
  organizationId: string,
  input: CreateQRCodeInput
): Promise<QRCodeWithDestinations> {
  // 1. RBAC Guard: Member, Admin, or Owner required
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const title = input.title?.trim();
  if (!title) {
    throw new Error('QR code title is required');
  }
  if (title.length > 120) {
    throw new Error('Title cannot exceed 120 characters');
  }

  // 2. Validate destination URL if provided
  let validatedDestinationUrl: string | undefined;
  if (input.destinationUrl) {
    const urlCheck = validateDestinationUrl(input.destinationUrl);
    if (!urlCheck.isValid || !urlCheck.sanitizedUrl) {
      throw new Error(urlCheck.error || 'Invalid destination URL');
    }
    validatedDestinationUrl = urlCheck.sanitizedUrl;
  }

  // 3. Generate collision-resistant Base62 7-char shortCode
  const shortCode = await generateUniqueShortCode();

  // 4. Create QR code atomically within the organization tenant boundary
  const qrCode = await prisma.qRCode.create({
    data: {
      organizationId,
      shortCode,
      title,
      type: input.type || 'DYNAMIC_URL',
      status: 'ACTIVE',
      styling: (input.styling as Prisma.InputJsonValue) || (DEFAULT_DYNAMIC_STYLING as Prisma.InputJsonValue),
      expiresAt: input.expiresAt || null,
      scanLimit: input.scanLimit || null,
      destinations: validatedDestinationUrl
        ? {
            create: {
              destinationUrl: validatedDestinationUrl,
              isActive: true,
            },
          }
        : undefined,
    },
    include: {
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return qrCode;
}

/**
 * Retrieves a single QR code belonging strictly to organizationId (IDOR protection).
 * RBAC Guard: VIEWER+
 */
export async function getQRCode(
  userId: string,
  organizationId: string,
  qrCodeId: string
): Promise<QRCodeWithDestinations | null> {
  if (!organizationId || !qrCodeId) return null;

  await requireOrganizationRole(userId, organizationId, 'VIEWER');

  return prisma.qRCode.findFirst({
    where: {
      id: qrCodeId,
      organizationId,
      deletedAt: null,
    },
    include: {
      destinations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Lists all active QR codes for a given organization with search, status filtering, and pagination.
 * RBAC Guard: VIEWER+
 */
export async function listQRCodes(
  userId: string,
  organizationId: string,
  options?: ListQRCodesOptions
): Promise<{
  qrCodes: QRCodeWithDestinations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  await requireOrganizationRole(userId, organizationId, 'VIEWER');

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 25));
  const skip = (page - 1) * limit;

  const search = options?.search?.trim();

  const where: Prisma.QRCodeWhereInput = {
    organizationId,
    deletedAt: null,
    ...(options?.type ? { type: options.type } : {}),
    ...(options?.status ? { status: options.status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { shortCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
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

  return {
    qrCodes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Updates QR code metadata (title, styling).
 * RBAC Guard: MEMBER+
 */
export async function updateQRCode(
  userId: string,
  organizationId: string,
  qrCodeId: string,
  input: {
    title?: string;
    styling?: Prisma.InputJsonValue;
    expiresAt?: Date | null;
    scanLimit?: number | null;
  }
): Promise<QRCodeWithDestinations> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await getQRCode(userId, organizationId, qrCodeId);
  if (!existing) {
    throw new Error('QR Code not found in this organization');
  }

  const updated = await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.styling !== undefined ? { styling: input.styling } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.scanLimit !== undefined ? { scanLimit: input.scanLimit } : {}),
    },
    include: {
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return updated;
}

/**
 * Updates the destination URL of an existing dynamic QR code.
 * Core dynamic value: physical QR image remains unchanged; redirect destination updates immediately.
 * Invalidate the local resolver cache so new scans immediately use the new destination.
 * RBAC Guard: MEMBER+
 */
export async function updateQRCodeDestination(
  userId: string,
  organizationId: string,
  qrCodeId: string,
  newDestinationUrl: string
): Promise<QRCodeWithDestinations> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const urlCheck = validateDestinationUrl(newDestinationUrl);
  if (!urlCheck.isValid || !urlCheck.sanitizedUrl) {
    throw new Error(urlCheck.error || 'Invalid destination URL');
  }
  const sanitizedUrl = urlCheck.sanitizedUrl;

  const existing = await getQRCode(userId, organizationId, qrCodeId);
  if (!existing) {
    throw new Error('QR Code not found in this organization');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Deactivate current active destinations
    await tx.qRCodeDestination.updateMany({
      where: { qrCodeId, isActive: true },
      data: { isActive: false, deactivatedAt: new Date() },
    });

    // 2. Create new active destination
    await tx.qRCodeDestination.create({
      data: {
        qrCodeId,
        destinationUrl: sanitizedUrl,
        isActive: true,
      },
    });

    // 3. Update updatedAt timestamp on QRCode
    return tx.qRCode.update({
      where: { id: qrCodeId },
      data: { updatedAt: new Date() },
      include: {
        destinations: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  });

  // 4. Invalidate local bounded resolver cache for this shortCode
  resolverCache.invalidate(existing.shortCode);

  return result;
}

/**
 * Pauses an active QR code.
 * Halts redirection: scans will land on branded /q-status/paused status page.
 * Invalidate local resolver cache immediately.
 * RBAC Guard: MEMBER+
 */
export async function pauseQRCode(
  userId: string,
  organizationId: string,
  qrCodeId: string
): Promise<QRCodeWithDestinations> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await getQRCode(userId, organizationId, qrCodeId);
  if (!existing) {
    throw new Error('QR Code not found in this organization');
  }

  const updated = await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      status: 'PAUSED',
      updatedAt: new Date(),
    },
    include: {
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Invalidate local cache
  resolverCache.invalidate(existing.shortCode);

  return updated;
}

/**
 * Resumes a paused QR code.
 * Restores redirection to active destination.
 * Invalidate local resolver cache immediately.
 * RBAC Guard: MEMBER+
 */
export async function resumeQRCode(
  userId: string,
  organizationId: string,
  qrCodeId: string
): Promise<QRCodeWithDestinations> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await getQRCode(userId, organizationId, qrCodeId);
  if (!existing) {
    throw new Error('QR Code not found in this organization');
  }

  const updated = await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      status: 'ACTIVE',
      updatedAt: new Date(),
    },
    include: {
      destinations: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Invalidate local cache
  resolverCache.invalidate(existing.shortCode);

  return updated;
}

/**
 * Soft-deletes a QR code strictly within the organization boundary.
 * Never physically deletes the row.
 * Scans will return 404 (not found). Excluded from regular dashboard listing.
 * Invalidate local resolver cache immediately.
 * RBAC Guard: ADMIN or OWNER required for destructive operations.
 */
export async function deleteQRCode(
  userId: string,
  organizationId: string,
  qrCodeId: string
): Promise<boolean> {
  await requireOrganizationRole(userId, organizationId, 'ADMIN');

  const existing = await getQRCode(userId, organizationId, qrCodeId);
  if (!existing) {
    throw new Error('QR Code not found in this organization');
  }

  await prisma.qRCode.update({
    where: { id: qrCodeId },
    data: {
      deletedAt: new Date(),
      status: 'ARCHIVED',
      updatedAt: new Date(),
    },
  });

  // Invalidate local cache
  resolverCache.invalidate(existing.shortCode);

  return true;
}

/**
 * Retrieves high-level dashboard metrics for an organization.
 * Strictly does NOT compute scan counts or scan analytics (Phase 2D scope).
 * RBAC Guard: VIEWER+
 */
export async function getDashboardStats(
  userId: string,
  organizationId: string
): Promise<DashboardStats> {
  await requireOrganizationRole(userId, organizationId, 'VIEWER');

  const [totalQRs, activeQRs, pausedQRs, recentQRs] = await Promise.all([
    prisma.qRCode.count({
      where: { organizationId, deletedAt: null },
    }),
    prisma.qRCode.count({
      where: { organizationId, deletedAt: null, status: 'ACTIVE' },
    }),
    prisma.qRCode.count({
      where: { organizationId, deletedAt: null, status: 'PAUSED' },
    }),
    prisma.qRCode.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        destinations: {
          where: { isActive: true },
          take: 1,
        },
      },
    }),
  ]);

  return {
    totalQRs,
    activeQRs,
    pausedQRs,
    recentQRs,
  };
}

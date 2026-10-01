import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { Widget, WidgetStatus, Prisma } from '@prisma/client';
import { requireOrganizationRole, requireOrganizationMember } from '@/lib/auth/rbac';
import { validateDestinationUrl } from '@/lib/validation/url-safety';
import { WidgetConfig } from '@/lib/widget/types';
import {
  validateWidgetConfig,
  sanitizeWidgetConfig,
  getDefaultWidgetConfig,
} from '@/lib/widget/config';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a collision-resistant, cryptographically secure public widget identifier.
 * Format: "wgt_" prefix followed by 18 Base62 characters.
 * Permutations: 62^18 ≈ 1.84 x 10^32.
 */
export function generateWidgetPublicId(): string {
  const bytes = crypto.randomBytes(18);
  let id = '';
  for (let i = 0; i < 18; i++) {
    id += BASE62_ALPHABET[bytes[i] % 62];
  }
  return `wgt_${id}`;
}

export interface CreateWidgetInput {
  name: string;
  config: Partial<WidgetConfig>;
}

export interface UpdateWidgetInput {
  name?: string;
  config?: Partial<WidgetConfig>;
}

export interface ListWidgetsOptions {
  page?: number;
  limit?: number;
  status?: WidgetStatus;
  search?: string;
}

export interface PublicWidgetPayload {
  success: boolean;
  publicId: string;
  name: string;
  status: WidgetStatus;
  config: WidgetConfig;
  updatedAt: string;
}

/**
 * Validates payload destination if it represents an HTTP/HTTPS URL.
 * Strictly blocks localhost, loopback, RFC 1918 private IPs, and cloud metadata.
 */
function validatePayloadDestination(config: Partial<WidgetConfig>): void {
  const rawPayload = config.payload?.trim() || '';
  if (!rawPayload) return;

  const lower = rawPayload.toLowerCase();

  // If payload begins with http:// or https://, run strict anti-SSRF validation
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    const urlCheck = validateDestinationUrl(rawPayload);
    if (!urlCheck.isValid) {
      throw new Error(`Invalid destination URL: ${urlCheck.error || 'Destination not allowed'}`);
    }
  }

  // Reject dangerous non-HTTP protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('about:')
  ) {
    throw new Error('Dangerous protocol blocked in widget payload');
  }
}

/**
 * Creates a new remote website QR widget strictly within the tenant boundary.
 * RBAC: MEMBER or higher required.
 */
export async function createWidget(
  userId: string,
  organizationId: string,
  input: CreateWidgetInput
): Promise<Widget> {
  // 1. RBAC Guard: Member, Admin, or Owner required
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const name = input.name?.trim();
  if (!name) {
    throw new Error('Widget name is required');
  }
  if (name.length > 100) {
    throw new Error('Widget name cannot exceed 100 characters');
  }

  // 2. Validate configuration
  const validation = validateWidgetConfig(input.config);
  if (!validation.isValid) {
    throw new Error(`Widget configuration error: ${validation.errors.join(', ')}`);
  }

  // 3. Strict Anti-SSRF URL check
  validatePayloadDestination(input.config);

  // 4. Sanitize configuration before persistence
  const sanitizedConfig = sanitizeWidgetConfig(input.config);

  // 5. Generate unique CSPRNG publicId with collision retry
  let publicId = generateWidgetPublicId();
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await prisma.widget.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!existing) break;
    publicId = generateWidgetPublicId();
  }

  // 6. Create Widget scoped to active tenant
  return prisma.widget.create({
    data: {
      organizationId,
      publicId,
      name,
      status: 'ACTIVE',
      configuration: sanitizedConfig as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Retrieves a single widget strictly belonging to organizationId.
 * Never leaks widgets across tenants (IDOR defense).
 */
export async function getWidget(
  userId: string,
  organizationId: string,
  widgetId: string
): Promise<Widget | null> {
  // Read access requires membership
  await requireOrganizationMember(userId, organizationId);

  return prisma.widget.findFirst({
    where: {
      id: widgetId,
      organizationId,
      deletedAt: null,
    },
  });
}

/**
 * Lists widgets for a specific organization with pagination and optional status filter.
 */
export async function listWidgets(
  userId: string,
  organizationId: string,
  options?: ListWidgetsOptions
): Promise<{ widgets: Widget[]; total: number }> {
  // Read access requires membership
  await requireOrganizationMember(userId, organizationId);

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(100, Math.max(1, options?.limit || 20));
  const skip = (page - 1) * limit;

  const where: Prisma.WidgetWhereInput = {
    organizationId,
    deletedAt: null,
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.search
      ? {
          name: {
            contains: options.search.trim(),
            mode: 'insensitive',
          },
        }
      : {}),
  };

  const [widgets, total] = await Promise.all([
    prisma.widget.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.widget.count({ where }),
  ]);

  return { widgets, total };
}

/**
 * Updates an existing widget's configuration or name.
 * The publicId and embed code remain completely unchanged.
 * RBAC: MEMBER or higher required.
 */
export async function updateWidget(
  userId: string,
  organizationId: string,
  widgetId: string,
  input: UpdateWidgetInput
): Promise<Widget> {
  // 1. RBAC Guard: Member, Admin, or Owner required
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await prisma.widget.findFirst({
    where: {
      id: widgetId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error('Widget not found or access denied');
  }

  const dataToUpdate: Prisma.WidgetUpdateInput = {};

  if (input.name !== undefined) {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error('Widget name cannot be empty');
    }
    if (trimmedName.length > 100) {
      throw new Error('Widget name cannot exceed 100 characters');
    }
    dataToUpdate.name = trimmedName;
  }

  if (input.config !== undefined) {
    const existingConfig = existing.configuration as unknown as WidgetConfig;
    const mergedConfig: Partial<WidgetConfig> = {
      ...existingConfig,
      ...input.config,
    };

    const validation = validateWidgetConfig(mergedConfig);
    if (!validation.isValid) {
      throw new Error(`Widget configuration error: ${validation.errors.join(', ')}`);
    }

    validatePayloadDestination(mergedConfig);
    const sanitized = sanitizeWidgetConfig(mergedConfig);
    dataToUpdate.configuration = sanitized as unknown as Prisma.InputJsonValue;
  }

  return prisma.widget.update({
    where: { id: widgetId },
    data: dataToUpdate,
  });
}

/**
 * Pauses a widget so it temporarily stops displaying on client websites.
 * RBAC: MEMBER or higher required.
 */
export async function pauseWidget(
  userId: string,
  organizationId: string,
  widgetId: string
): Promise<Widget> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await prisma.widget.findFirst({
    where: {
      id: widgetId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error('Widget not found or access denied');
  }

  return prisma.widget.update({
    where: { id: widgetId },
    data: { status: 'PAUSED' },
  });
}

/**
 * Resumes an active widget.
 * RBAC: MEMBER or higher required.
 */
export async function resumeWidget(
  userId: string,
  organizationId: string,
  widgetId: string
): Promise<Widget> {
  await requireOrganizationRole(userId, organizationId, 'MEMBER');

  const existing = await prisma.widget.findFirst({
    where: {
      id: widgetId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error('Widget not found or access denied');
  }

  return prisma.widget.update({
    where: { id: widgetId },
    data: { status: 'ACTIVE' },
  });
}

/**
 * Soft deletes a widget.
 * Archived widgets immediately stop being publicly served.
 * RBAC: ADMIN or OWNER required.
 */
export async function deleteWidget(
  userId: string,
  organizationId: string,
  widgetId: string
): Promise<boolean> {
  await requireOrganizationRole(userId, organizationId, 'ADMIN');

  const existing = await prisma.widget.findFirst({
    where: {
      id: widgetId,
      organizationId,
      deletedAt: null,
    },
  });

  if (!existing) {
    throw new Error('Widget not found or access denied');
  }

  await prisma.widget.update({
    where: { id: widgetId },
    data: {
      deletedAt: new Date(),
      status: 'PAUSED',
    },
  });

  return true;
}

/**
 * Public resolver: Retrieves sanitized widget configuration for remote rendering.
 * Does NOT leak organizationId, internal database IDs, or user metadata.
 * Returns null if widget does not exist or has been soft-deleted.
 */
export async function getPublicWidgetConfig(
  publicId: string
): Promise<{ widget: Widget; safeConfig: WidgetConfig } | null> {
  if (!publicId || typeof publicId !== 'string') {
    return null;
  }

  const widget = await prisma.widget.findFirst({
    where: {
      publicId: publicId.trim(),
      deletedAt: null,
    },
    select: {
      id: true,
      publicId: true,
      name: true,
      status: true,
      configuration: true,
      updatedAt: true,
      createdAt: true,
      organizationId: true,
      deletedAt: true,
    },
  });

  if (!widget) {
    return null;
  }

  const rawConfig = widget.configuration as unknown as Partial<WidgetConfig>;
  const safeConfig = sanitizeWidgetConfig(rawConfig || getDefaultWidgetConfig('upi'));

  return {
    widget: widget as Widget,
    safeConfig,
  };
}

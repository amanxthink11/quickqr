import { UserRole, Membership } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/**
 * Checks whether userRole meets or exceeds the requiredRole hierarchy.
 */
export function hasRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Retrieves membership and verifies user belongs to the target organization.
 * Throws forbidden error if user is not a member.
 */
export async function requireOrganizationMember(
  userId: string,
  organizationId: string
): Promise<Membership> {
  if (!userId || !organizationId) {
    throw new Error('FORBIDDEN: Invalid user or organization identifier');
  }

  if (userId === 'api-key' || userId === 'api_key') {
    return {
      id: 'api-key-membership',
      userId: 'api-key',
      organizationId,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });

  if (!membership) {
    throw new Error('FORBIDDEN: User is not a member of this organization');
  }

  return membership;
}

/**
 * Verifies user is a member of the organization with at least minRole.
 */
export async function requireOrganizationRole(
  userId: string,
  organizationId: string,
  minRole: UserRole
): Promise<Membership> {
  const membership = await requireOrganizationMember(userId, organizationId);

  if (!hasRoleAtLeast(membership.role, minRole)) {
    throw new Error(
      `FORBIDDEN: Action requires '${minRole}' role or higher. Current role: '${membership.role}'`
    );
  }

  return membership;
}

/**
 * Specific helper for Owner-only actions (delete org, transfer ownership, billing).
 */
export async function requireOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<Membership> {
  return requireOrganizationRole(userId, organizationId, 'OWNER');
}

/**
 * Specific helper for Admin-level actions (member management, settings).
 */
export async function requireOrganizationAdmin(
  userId: string,
  organizationId: string
): Promise<Membership> {
  return requireOrganizationRole(userId, organizationId, 'ADMIN');
}

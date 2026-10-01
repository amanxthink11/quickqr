'use server';

import { registerUser, loginUser, logoutUser } from './service';
import {
  setSessionTokenCookie,
  clearSessionTokenCookie,
  getSessionTokenFromCookie,
  getCurrentSession,
  validateSessionToken,
  AuthenticatedContext,
} from './session';
import { RegisterInput, LoginInput } from '@/lib/validation/auth-schemas';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Registers a new user, creates their organization, and sets session cookie.
 */
export async function registerAction(input: RegisterInput): Promise<ActionResponse<{ userId: string; organizationId: string }>> {
  try {
    const result = await registerUser(input);
    await setSessionTokenCookie(result.rawToken, result.session.expiresAt);

    return {
      success: true,
      data: {
        userId: result.user.id,
        organizationId: result.organization.id,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Validates credentials, creates a session, and sets session cookie.
 */
export async function loginAction(input: LoginInput): Promise<ActionResponse<{ userId: string }>> {
  try {
    const result = await loginUser(input);
    await setSessionTokenCookie(result.rawToken, result.session.expiresAt);

    return {
      success: true,
      data: {
        userId: result.user.id,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Invalidates session in database and clears the session cookie.
 */
export async function logoutAction(): Promise<ActionResponse<void>> {
  try {
    const rawToken = await getSessionTokenFromCookie();
    if (rawToken) {
      await logoutUser(rawToken);
    }
    await clearSessionTokenCookie();
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Logout failed';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Retrieves the current authenticated user and organization context.
 */
export async function getAuthStatusAction(): Promise<ActionResponse<AuthenticatedContext | null>> {
  try {
    const ctx = await getCurrentSession();
    return { success: true, data: ctx };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve session';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Switches the active tenant organization for the authenticated user.
 * Validates membership server-side. Never allows switching to an unauthorized organization.
 */
export async function switchOrganizationAction(
  targetOrganizationId: string
): Promise<ActionResponse<{ activeOrganizationId: string }>> {
  try {
    const rawToken = await getSessionTokenFromCookie();
    if (!rawToken) {
      return { success: false, error: 'UNAUTHORIZED: Please sign in' };
    }

    const sessionResult = await validateSessionToken(rawToken);
    if (!sessionResult) {
      return { success: false, error: 'UNAUTHORIZED: Session expired' };
    }

    // Server-side membership verification: prevents unauthorized tenant switching
    const { requireOrganizationMember } = await import('./rbac');
    const { setActiveOrgIdCookie } = await import('./session');

    await requireOrganizationMember(sessionResult.user.id, targetOrganizationId);
    await setActiveOrgIdCookie(targetOrganizationId);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/qr-codes');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      data: { activeOrganizationId: targetOrganizationId },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to switch organization';
    return { success: false, error: message };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/service';
import { checkApiRateLimit, recordFailedApiAuth, ApiOperationType } from './rate-limit';
import { apiError } from './response';
import { ApiKey, Organization } from '@prisma/client';

export interface ApiAuthSuccess {
  apiKey: ApiKey;
  organization: Organization;
}

export type ApiAuthResult =
  | { success: true; context: ApiAuthSuccess }
  | { success: false; response: NextResponse };

/**
 * Authenticates an incoming API request using the Authorization: Bearer <API_KEY> header.
 * Enforces rate limiting, syntax checks, cryptographic verification, scope checks,
 * and tenant boundary extraction.
 */
export async function authenticateApiRequest(
  request: NextRequest,
  options?: {
    requiredScope?: string;
    operationType?: ApiOperationType;
  }
): Promise<ApiAuthResult> {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  // 1. Check IP auth rate limit
  const authRateCheck = checkApiRateLimit(clientIp, 'auth');
  if (!authRateCheck.allowed) {
    return {
      success: false,
      response: apiError(
        'RATE_LIMITED',
        'Too many failed authentication attempts. Please retry later.',
        429,
        undefined,
        { 'Retry-After': String(authRateCheck.retryAfterSeconds) }
      ),
    };
  }

  // 2. Extract Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    recordFailedApiAuth(clientIp);
    return {
      success: false,
      response: apiError(
        'UNAUTHORIZED',
        'Authentication required. Provide your API key using the Authorization: Bearer <API_KEY> header.',
        401
      ),
    };
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    recordFailedApiAuth(clientIp);
    return {
      success: false,
      response: apiError(
        'UNAUTHORIZED',
        'Malformed Authorization header format. Expected Bearer <API_KEY>.',
        401
      ),
    };
  }

  const rawKey = parts[1];

  // 3. Cryptographically authenticate API key against database
  const authResult = await authenticateApiKey(rawKey);
  if (!authResult) {
    recordFailedApiAuth(clientIp);
    // Generic failure prevents key enumeration or status leakage
    return {
      success: false,
      response: apiError('UNAUTHORIZED', 'Invalid, expired, or revoked API key.', 401),
    };
  }

  const { apiKey, organization } = authResult;

  // 4. Verify Scope Permissions if required
  if (options?.requiredScope) {
    const scopes = apiKey.scopes || [];
    const hasScope =
      scopes.includes('*') ||
      scopes.includes(options.requiredScope) ||
      (options.requiredScope.endsWith(':read') && scopes.includes('read')) ||
      (options.requiredScope.endsWith(':write') && scopes.includes('write'));

    if (!hasScope) {
      return {
        success: false,
        response: apiError(
          'FORBIDDEN',
          `API key lacks the required scope '${options.requiredScope}'.`,
          403
        ),
      };
    }
  }

  // 5. Enforce operation-level rate limiting per API key
  const opType = options?.operationType || 'read';
  const opRateCheck = checkApiRateLimit(apiKey.id, opType);
  if (!opRateCheck.allowed) {
    return {
      success: false,
      response: apiError(
        'RATE_LIMITED',
        `Rate limit exceeded for ${opType} operations. Please slow down.`,
        429,
        undefined,
        { 'Retry-After': String(opRateCheck.retryAfterSeconds) }
      ),
    };
  }

  return {
    success: true,
    context: {
      apiKey,
      organization,
    },
  };
}

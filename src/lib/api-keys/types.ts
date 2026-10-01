import { ApiKey } from '@prisma/client';

export type ApiKeySafe = Omit<ApiKey, 'keyHash'>;

export interface CreateApiKeyInput {
  name: string;
  scopes?: string[];
  expiresAt?: Date | null;
}

export interface CreateApiKeyResult {
  apiKey: ApiKeySafe;
  /**
   * The complete raw secret key (e.g. qk_live_...).
   * IMPORTANT: This is displayed ONCE to the developer upon creation.
   * It is never stored in plaintext and cannot be recovered.
   */
  rawKey: string;
}

export interface AuthenticatedApiContext {
  apiKey: ApiKey;
  organizationId: string;
  scopes: string[];
}

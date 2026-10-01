import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessPayload<T> {
  data: T;
  pagination?: ApiPagination;
}

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

const COMMON_API_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

/**
 * Returns a standardized JSON success response.
 */
export function apiSuccess<T>(
  data: T,
  status = 200,
  pagination?: ApiPagination,
  extraHeaders?: Record<string, string>
): NextResponse<ApiSuccessPayload<T>> {
  const payload: ApiSuccessPayload<T> = { data };
  if (pagination) {
    payload.pagination = pagination;
  }

  return NextResponse.json(payload, {
    status,
    headers: {
      ...COMMON_API_HEADERS,
      ...extraHeaders,
    },
  });
}

/**
 * Returns a standardized JSON error response.
 * Never leaks stack traces, database queries, or server internals.
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown,
  extraHeaders?: Record<string, string>
): NextResponse<ApiErrorPayload> {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: {
      ...COMMON_API_HEADERS,
      ...extraHeaders,
    },
  });
}

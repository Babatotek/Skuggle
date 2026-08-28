const configuredApiBase = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiBase || '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string[]> = {},
    public readonly requestId?: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const statusDescriptions: Record<number, string> = {
  401: 'Your session has expired. Sign in again to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested record could not be found.',
  409: 'This change conflicts with the current record. Refresh and try again.',
  422: 'Some information is invalid. Review the highlighted fields and try again.',
  429: 'Too many requests were made. Wait a moment and try again.',
  500: 'The server encountered an unexpected error. Please try again.',
  502: 'The service is temporarily unavailable. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'An unexpected error occurred. Please try again.';
  const fieldMessage = Object.values(error.fields).flat()[0];
  return fieldMessage || error.message || statusDescriptions[error.status] || 'The request could not be completed.';
}

function announceApiError(error: ApiError): void {
  window.dispatchEvent(new CustomEvent('skuggle:api-error', { detail: error }));
}

function cookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const value = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined;
}

/** True when Laravel has issued an XSRF cookie (typical after login or a prior API call). */
export function hasLikelyBrowserSession(): boolean {
  return Boolean(cookie('XSRF-TOKEN'));
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch('/sanctum/csrf-cookie', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok && response.status !== 204) {
    throw new ApiError(response.status, 'CSRF_INITIALIZATION_FAILED', 'A secure sign-in session could not be started.');
  }
}

export interface ApiRequestOptions extends RequestInit {
  suppressErrorNotification?: boolean;
}

export async function apiRequest<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  const { suppressErrorNotification = false, ...requestInit } = init;
  const method = (requestInit.method || 'GET').toUpperCase();
  const headers = new Headers(requestInit.headers);
  headers.set('Accept', 'application/json');
  if (requestInit.body && !(requestInit.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = cookie('XSRF-TOKEN');
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...requestInit,
      method,
      headers,
      credentials: 'include',
    });
  } catch {
    const error = new ApiError(0, 'NETWORK_ERROR', 'The server could not be reached. Check your connection and try again.');
    if (!suppressErrorNotification) announceApiError(error);
    throw error;
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = (body || {}) as {
      message?: string;
      errors?: Record<string, string[]>;
      error?: { code?: string; message?: string; fields?: Record<string, string[]> };
      request_id?: string | null;
    };
    const error = new ApiError(
      response.status,
      errorBody.error?.code || 'REQUEST_FAILED',
      errorBody.error?.message || errorBody.message || 'The request could not be completed.',
      errorBody.error?.fields || errorBody.errors || {},
      errorBody.request_id,
    );
    if (!suppressErrorNotification) announceApiError(error);
    throw error;
  }
  return body as T;
}

export function apiMutation<T>(path: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown, options: ApiRequestOptions = {}): Promise<T> {
  return apiRequest<T>(path, {
    ...options,
    method,
    headers: { 'Idempotency-Key': crypto.randomUUID(), ...Object.fromEntries(new Headers(options.headers).entries()) },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
}

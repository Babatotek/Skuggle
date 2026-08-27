import { appConfig } from "@/app/config";
import { workspaceSwitchSignal } from "@/features/workspaces/workspaceSwitchScope";

export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limited"
  | "server"
  | "unavailable"
  | "timeout"
  | "offline"
  | "cancelled"
  | "unknown";

export interface ValidationIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number | null;
  readonly kind: ApiErrorKind;
  readonly code: string | null;
  readonly requestId: string | null;
  readonly issues: ValidationIssue[];
  readonly retryAfterSeconds: number | null;

  constructor(options: {
    message: string;
    status?: number | null;
    kind?: ApiErrorKind;
    code?: string | null;
    requestId?: string | null;
    issues?: ValidationIssue[];
    retryAfterSeconds?: number | null;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status ?? null;
    this.kind = options.kind ?? "unknown";
    this.code = options.code ?? null;
    this.requestId = options.requestId ?? null;
    this.issues = options.issues ?? [];
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

const statusToKind = (status: number): ApiErrorKind => {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status === 503) return "unavailable";
  if (status >= 500) return "server";
  return "unknown";
};

const safeRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const extractErrorCode = (body: unknown): string | null => {
  const record = safeRecord(body);
  const nested = safeRecord(record?.error);
  const code = nested?.code ?? record?.code;
  return typeof code === "string" && code.trim() ? code : null;
};

const extractMessage = (body: unknown, status: number): string => {
  const record = safeRecord(body);
  const candidate = record?.message;
  if (typeof candidate === "string" && candidate.trim()) return candidate;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have access to this area.";
  if (status === 404) return "The requested information is not available.";
  if (status === 409)
    return "This information changed elsewhere. Review the latest version before saving.";
  if (status === 422)
    return "Please review the highlighted information and try again.";
  if (status === 429)
    return "Too many attempts. Please wait before trying again.";
  if (status === 503) return "This service is temporarily unavailable.";
  return "Skuggle could not complete this request.";
};

const extractIssues = (body: unknown): ValidationIssue[] => {
  const record = safeRecord(body);
  const errors = safeRecord(record?.errors);
  if (!errors) return [];
  return Object.entries(errors).flatMap(([field, value]) => {
    if (typeof value === "string") return [{ field, message: value }];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((message) => ({ field, message }));
    }
    return [];
  });
};

const emitNetworkHealth = (healthy: boolean): void => {
  window.dispatchEvent(
    new CustomEvent("skuggle:network-health", {
      detail: { healthy, at: Date.now() },
    }),
  );
};

const currentNetworkFailureKind = (): ApiErrorKind =>
  window.navigator.onLine ? "unavailable" : "offline";

const csrfToken = (): string | null => {
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("XSRF-TOKEN="));
  const value = cookie?.slice("XSRF-TOKEN=".length);
  return value ? decodeURIComponent(value) : null;
};

const ensureCsrfToken = async (
  signal?: AbortSignal | null,
): Promise<string> => {
  const existing = csrfToken();
  if (existing) return existing;
  const response = await fetch(appConfig.csrfUrl, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    throw new ApiError({
      message: "Skuggle could not establish a secure request session.",
      status: response.status,
      kind: statusToKind(response.status),
    });
  }
  return csrfToken() ?? "";
};

const sessionNeutralPaths = new Set([
  "/auth/login",
  "/auth/logout",
  "/auth/me",
  "/auth/two-factor-challenge",
  "/auth/forgot-password",
  "/auth/email/verification-notification",
  "/auth/google/redirect",
  "/public/results/check",
  "/schools/register",
  "/individuals/register",
]);

const notifySessionExpired = (path: string, status: number): void => {
  const pathWithoutQuery = path.split("?")[0] ?? path;
  if (
    status !== 401 ||
    sessionNeutralPaths.has(pathWithoutQuery) ||
    pathWithoutQuery.startsWith("/public/")
  )
    return;
  window.dispatchEvent(new Event("skuggle:session-expired"));
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json"))
    return response.json() as Promise<unknown>;
  const text = await response.text();
  return text || null;
};

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  if (!navigator.onLine) {
    throw new ApiError({
      message: "You are offline. Your supported drafts remain on this device.",
      kind: "offline",
    });
  }

  const {
    body: requestBody,
    timeoutMs,
    signal: callerSignal,
    ...requestOptions
  } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort("timeout"),
    timeoutMs ?? appConfig.requestTimeoutMs,
  );
  const abortFromCaller = (): void => controller.abort("cancelled");
  callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

  // Workspace switches cancel tenant-scoped traffic only — never session/auth probes.
  const pathWithoutQuery = (path.split("?")[0] ?? path).replace(/\/+$/, "") || "/";
  const skipWorkspaceAbort =
    pathWithoutQuery.startsWith("/auth/") ||
    pathWithoutQuery.startsWith("/sanctum/") ||
    sessionNeutralPaths.has(pathWithoutQuery);
  const scopeSignal = skipWorkspaceAbort ? null : workspaceSwitchSignal();
  if (scopeSignal?.aborted) {
    window.clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", abortFromCaller);
    throw new ApiError({
      message: "The request was cancelled.",
      kind: "cancelled",
    });
  }
  const abortFromWorkspace = (): void => controller.abort("workspace-switch");
  scopeSignal?.addEventListener("abort", abortFromWorkspace, { once: true });

  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (requestBody !== undefined && !(requestBody instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const method = (requestOptions.method ?? "GET").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const token = await ensureCsrfToken(controller.signal);
      if (token) headers.set("X-XSRF-TOKEN", token);
      // Backend mutating routes (e.g. /schools/register) require Idempotency-Key.
      if (!headers.has("Idempotency-Key")) {
        headers.set(
          "Idempotency-Key",
          `fe-${crypto.randomUUID().replace(/-/g, "")}`,
        );
      }
    }
    const requestInit: RequestInit = {
      ...requestOptions,
      credentials: "include",
      headers,
      signal: controller.signal,
    };
    if (requestBody !== undefined) {
      requestInit.body =
        requestBody instanceof FormData
          ? requestBody
          : JSON.stringify(requestBody);
    }

    const response = await fetch(
      `${appConfig.apiUrl}${path.startsWith("/") ? path : `/${path}`}`,
      requestInit,
    );
    const body = await parseResponseBody(response);
    emitNetworkHealth(response.status < 500);

    if (!response.ok) {
      notifySessionExpired(path, response.status);
      const retryHeader = response.headers.get("retry-after");
      throw new ApiError({
        message: extractMessage(body, response.status),
        status: response.status,
        kind: statusToKind(response.status),
        code: extractErrorCode(body),
        requestId: response.headers.get("x-request-id"),
        issues: extractIssues(body),
        retryAfterSeconds:
          retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader) : null,
      });
    }

    const record = safeRecord(body);
    return (record && "data" in record ? record.data : body) as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      const timedOut = controller.signal.reason === "timeout";
      throw new ApiError({
        message: timedOut
          ? "The request took too long. Please try again."
          : "The request was cancelled.",
        kind: timedOut ? "timeout" : "cancelled",
      });
    }
    emitNetworkHealth(false);
    throw new ApiError({
      message:
        "Skuggle cannot reach the server. Check your connection and try again.",
      kind: currentNetworkFailureKind(),
    });
  } finally {
    window.clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", abortFromCaller);
    scopeSignal?.removeEventListener("abort", abortFromWorkspace);
  }
};

export const getApiError = (error: unknown): ApiError =>
  error instanceof ApiError
    ? error
    : new ApiError({
        message: "Something went wrong. Please try again.",
        kind: "unknown",
      });

export const apiDownload = async (
  path: string,
  suggestedName: string,
): Promise<void> => {
  if (!navigator.onLine)
    throw new ApiError({
      message: "Connect to the internet before preparing this download.",
      kind: "offline",
    });
  try {
    const response = await fetch(
      `${appConfig.apiUrl}${path.startsWith("/") ? path : `/${path}`}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/octet-stream, application/pdf, text/csv",
        },
      },
    );
    if (!response.ok) {
      notifySessionExpired(path, response.status);
      throw new ApiError({
        message: extractMessage(
          await parseResponseBody(response),
          response.status,
        ),
        status: response.status,
        kind: statusToKind(response.status),
      });
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await parseResponseBody(response);
      const record = safeRecord(body);
      const data = safeRecord(record?.data) ?? record;
      const remoteUrl = data?.url;
      if (typeof remoteUrl === "string" && remoteUrl.length > 0) {
        window.open(remoteUrl, "_blank", "noopener,noreferrer");
        return;
      }
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(disposition);
    const filename = match?.[1] ? decodeURIComponent(match[1]) : suggestedName;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      message: "Skuggle could not prepare this download.",
      kind: currentNetworkFailureKind(),
    });
  }
};

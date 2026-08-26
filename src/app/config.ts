const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const envValue = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed?.length ? trimmed : fallback;
};

export const appConfig = {
  name: envValue(import.meta.env.VITE_APP_NAME, "Skuggle"),
  apiUrl: normalizeBaseUrl(envValue(import.meta.env.VITE_API_URL, "/api/v1")),
  csrfUrl: envValue(import.meta.env.VITE_CSRF_URL, "/sanctum/csrf-cookie"),
  environment: envValue(import.meta.env.VITE_ENVIRONMENT, import.meta.env.MODE),
  supportEmail: envValue(
    import.meta.env.VITE_SUPPORT_EMAIL,
    "support@skuggle.com",
  ),
  requestTimeoutMs: 15_000,
  /** When true, Role Switcher re-authenticates as demo users against Laravel. */
  liveApi: envValue(import.meta.env.VITE_LIVE_API, "true") === "true",
  /**
   * Local/demo only. Never enable in production builds.
   * Allows Quick Demo chips and seeded credential helpers.
   */
  enableDemo:
    import.meta.env.DEV === true ||
    envValue(import.meta.env.VITE_ENABLE_DEMO, "false") === "true",
  /**
   * Google OAuth is implemented but suspended until Client ID/Secret are configured.
   * Set VITE_GOOGLE_OAUTH_ENABLED=true (and backend GOOGLE_OAUTH_ENABLED=true) to show buttons.
   */
  enableGoogleOAuth:
    envValue(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED, "false") === "true",
} as const;

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CSRF_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_LIVE_API?: string;
  readonly VITE_ENABLE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

# Skuggle PWA and Offline Policy

Last updated: 21 August 2026

## Installability

The production build generates `manifest.webmanifest`, `sw.js`, and Workbox assets. The manifest defines the Skuggle name, education/productivity categories, standalone display, theme/background colors, scope, start URL, and any/maskable SVG icons. The landing page includes an install affordance only when the browser raises `beforeinstallprompt`.

## Cache policy

- The application shell and hashed static assets are precached.
- Same-origin GET static resources use stale-while-revalidate with a bounded 80-entry, 30-day cache.
- `/api` is excluded from navigation fallback and runtime caching.
- Authenticated API JSON, student records, results, fees, messages, and report downloads are never intentionally cached by the service worker.
- Obsolete cache versions are cleaned automatically.

This policy favors a reliable shell without presenting stale operational records as current.

## Update lifecycle

Updates use prompt mode. When a new service worker is ready, the UI asks the user to reload; it does not silently interrupt attendance or score entry. Offline-ready state is also surfaced. Production deployment should use short/no-cache headers for `index.html`, `manifest.webmanifest`, and `sw.js`, and immutable long caching for hashed assets.

## Connectivity and drafts

The network banner combines browser online/offline events with recent request health. It also displays the count of pending IndexedDB operations.

Only these workflows write offline data:

- class attendance drafts;
- assessment score drafts;
- their pending operation metadata.

Every record includes user, tenant, entity, revision, timestamp, and sync state. Logout or session expiry clears these stores to prevent another account on a shared device from seeing them.

The UI distinguishes `pending`, `saved`, `error`, and `conflict`; local persistence is never described as server success. Automated background replay is intentionally disabled pending the idempotency/conflict backend contract documented in `FRONTEND_BACKEND_DEPENDENCIES.md`.

## Release checks

1. Serve the production build over HTTPS.
2. Verify install on Chromium and Android, and add PNG 192/512 icons if a target store or browser rejects SVG-only icons.
3. Verify offline navigation loads the shell while protected data remains unavailable.
4. Confirm API and download responses are absent from Cache Storage.
5. Deploy a second build and verify the update prompt preserves unsaved work.
6. Verify logout and cross-tab session expiry clear offline drafts.

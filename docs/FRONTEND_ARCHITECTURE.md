# Skuggle Frontend Architecture

Last updated: 21 August 2026

## Purpose and boundary

This repository now contains a production-oriented React frontend for Skuggle. It does not implement or emulate the authoritative Laravel application, tenant isolation, permissions, billing, messaging, report generation, or academic calculations. When an API is absent, the UI renders a loading, empty, unavailable, or error state; it does not invent business data.

## Runtime stack

- React 19 and strict TypeScript
- Vite 6 and Tailwind CSS 4
- React Router for stable public and protected URLs
- TanStack Query for remote state, request deduplication, cancellation, retry, and invalidation
- IndexedDB through `idb` for explicitly approved attendance and score drafts
- `vite-plugin-pwa` for the installable shell and controlled update lifecycle
- Vitest/Testing Library and Playwright test harnesses

## Source organization

```text
src/
  app/          router, guards, roles, permissions, navigation, query policy
  features/     public, auth, dashboard, students, attendance, academics, reports
  shared/
    api/        central fetch client and normalized errors
    hooks/      cross-feature hooks
    layout/     public and authenticated shells
    offline/    versioned IndexedDB schema
    pwa/        network, install and update UI
    ui/         reusable states and operational primitives
```

The old fixture-backed views, role switcher, fake modals, random-value generators, browser alerts, and production demo data were removed from the runtime graph.

## Routing and access

Public routes include `/`, `/login`, `/register-school`, `/result-checker`, `/forgot-password`, `/privacy`, and `/terms`. Authenticated routes live under `/app` and are protected in two layers:

1. `ProtectedRoute` restores the server session and handles unauthenticated or failed bootstrap states.
2. `RequireAccess` checks the user’s dashboard experience and explicit permissions before rendering a feature route.

These checks improve UX and prevent accidental disclosure. They do not replace backend authorization. The backend must validate the authenticated tenant, campus, role, permission, and record scope on every request.

Desktop navigation is horizontal and role-specific. Mobile uses a drawer and bottom navigation. Every exposed navigation item resolves to an implemented route. Academic campus/session/term selection is server-backed and refreshes the authenticated context after confirmation.

## State ownership

| State                      | Owner                 | Examples                                                              |
| -------------------------- | --------------------- | --------------------------------------------------------------------- |
| Authoritative server state | TanStack Query        | session, dashboards, students, results, reports, lookups              |
| Ephemeral UI state         | React component state | open menus, selected step, unsaved form fields                        |
| Shareable route state      | URL search params     | search, status, sorting, pagination, child selection, attendance date |
| Approved offline state     | IndexedDB             | attendance drafts, score drafts, pending operation metadata           |

Sensitive session data is not persisted in local storage. Logout and session expiry clear the query cache and offline drafts. `BroadcastChannel`, with a storage-event fallback, coordinates login/logout/expiry across tabs.

## API and error flow

All production feature requests pass through `src/shared/api/client.ts`. The client:

- uses the configured API base URL;
- sends cookies with `credentials: include`;
- obtains the Laravel CSRF cookie and forwards `X-XSRF-TOKEN` for mutations;
- applies a 15-second default timeout and caller cancellation;
- unwraps `{ data: ... }` envelopes while accepting direct JSON payloads;
- normalizes 401, 403, 404, 409, 422, 429, 500, 503, timeout, cancellation, and offline failures;
- emits request-health and protected-session-expiry events;
- keeps downloads server-owned.

Query retries are intentionally limited to transient server, unavailable, and timeout failures. Mutations never retry automatically.

## Rendering and performance

Feature routes use `React.lazy` boundaries. The public shell, authenticated shell, query client, and router remain in the entry chunk; feature pages are loaded on demand. Large historical OCR, scanner, PDF, AI, and demo implementations are no longer imported by the frontend.

The canonical robot is delivered as a local 960×1440 WebP asset. Shared CSS defines semantic brand, canvas, focus, elevation, touch target, skeleton, dialog, print, and reduced-motion rules.

## Extension rules

- Add routes and role navigation centrally; do not create component-state routing.
- Add server contracts as explicit interfaces and feature services; never add production fixtures as fallbacks.
- Preserve backend-owned pagination, exports, workflow transitions, and permissions.
- Persist offline data only for a reviewed workflow with user/tenant IDs, revision metadata, and visible sync state.
- A successful UI state must follow an authoritative API response or be clearly labelled as a local pending draft.

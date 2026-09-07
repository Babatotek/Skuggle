# Wave 7 Baseline

Recorded before Wave 7 routing edits on 2026-09-04 (Africa/Lagos). Measured from the live repository; historical routing behavior was not assumed.

- Git HEAD: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Working tree: dirty. Wave 0–6 implementation remained uncommitted/untracked and was preserved. No reset, checkout, clean, or unrelated rewrite was performed.
- React Router (or any router library): **not installed**. `package.json` had React 19.0.1 and Vite 6.2.3 only.
- History owner: `src/App.tsx` plus `src/lib/workspaceRoute.ts`.

## Current routing files (pre-change)

| File | Responsibility |
|---|---|
| `src/App.tsx` | View state machine (`currentView`), `activeTab`, `popstate`, `document.title`, unknown-tab fallback to School Admin dashboard |
| `src/lib/workspaceRoute.ts` | Parse `/app/{tab}` and tenant prefixes `/s/`, `/school/`, `/t/`; `history.pushState` / `replaceState` |
| `src/lib/sessionAuth.ts` | Tenant key from query, path prefix, or subdomain |
| `src/lib/navigation.ts` | Nav IDs, aliases, permission/role visibility (not a router) |
| `src/lib/sidebarNav.ts` | Sidebar projection of navigation.ts |
| `src/lib/moduleTabs.ts` | In-page module tabs |

## URL patterns

Authenticated workspace: `{optionalTenantPrefix}/app/{navId}` where tenant prefixes are `/s/{slug}`, `/school/{slug}`, `/t/{slug}`. Home was `/app` with no tab.

Hard-coded public pathnames: `/reset-password`, `/verify-email`. Other public screens (`landing`, `personal-auth`, `school-auth`, `register-school`, `tenant-welcome`, `tenant-login`, `result-checker`) were **React state**, not durable URLs.

Query: `school`, `tenant`, `code`, `tenantCode`, `tenantSlug`, `schoolName`, verification `status`. Tenant IDs in query were treated as public entry hints, not authorization.

## App.tsx route/history responsibilities

- Session restore via `/auth/me`; authenticated users on `/` were forced into `currentView === 'app'`.
- `writeWorkspaceTab` on every `activeTab` change (`replace` first, then `push`).
- `popstate` listener synced `activeTab` from the URL while `currentView === 'app'`.
- Login/logout used `setCurrentView` and `clearWorkspacePath()` (replace to tenant base or `/`).
- Unknown nav IDs: `readWorkspaceTab` returned `'home'`; `renderAppContent` default rendered `SchoolAdminDashboard`. **Unknown URLs silently opened Home/Dashboard.**
- Workspace switching did not change the route family; the same `/app/{tab}` was reused across School/Personal/Platform.

## History API usage (measured)

`history.pushState` / `replaceState`: `workspaceRoute.ts` (tab writes, logout clear) and `App.tsx` (verification success, reset-password done, verify-email sign-in).

`popstate`: one listener in `App.tsx`.

`location.pathname` reads: `App.tsx`, `workspaceRoute.ts`, `sessionAuth.ts`, `AssessmentWorkspace.tsx` (legacy assessment tab), public reset-password page.

No `window.location.assign` navigation for tabs. Reloads exist for error recovery and a few save flows, unrelated to routing.

## Deep-link / refresh behavior

Refresh of `/app/students` restored the Students tab **if** the session was valid. Refresh of landing-equivalent `/` with a session entered the app and then wrote `/app`. Public result checker and auth screens did not survive paste/refresh as first-class URLs (except reset-password and verify-email). Student profile was **local React state** (`profileStudentId`) with no URL identity.

## Redirect / unknown / auth

- Login success → `currentView = 'app'` without a validated return-to.
- Logout → landing + `clearWorkspacePath`.
- School key on cold `/` → tenant welcome.
- Unknown `/app/foobar` → Home.
- No 404 page.

## Production hosting (pre-change)

Hostinger `public_html/.htaccess` already had SPA fallback to `index.html` after sending `/api`, `/sanctum`, health, and `/email/verify` to Laravel. `backend/public/.htaccess` is Laravel-only (all unmatched → `index.php`). Vite `appType: 'spa'` in `server.ts` for development. Production Node `server.ts` sent `*` to `index.html` including a risk of swallowing API if Node were used as the public origin.

## Wave 6 production bundle (pre-router)

From the frozen Wave 6 report: CSS 163.14 kB (25.14 kB gzip), `app-features` 563.59 kB (129.50 kB gzip). No router package. Bootstrap: one `/auth/me` plus up to 11 permission-conditioned collection requests.

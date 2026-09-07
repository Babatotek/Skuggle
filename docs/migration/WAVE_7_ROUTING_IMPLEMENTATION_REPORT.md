# Wave 7 Routing Implementation Report

## 1. Baseline

HEAD `b30f3e1a405f7cd5b4253446752cc1d89724bd09`, branch `main`, dirty Wave 0–6 tree preserved. No router library was installed. History lived in `App.tsx` (`currentView`, `activeTab`, `popstate`) and `workspaceRoute.ts` (`pushState`/`replaceState`). Unknown `/app/{tab}` values became Home. Public auth/result screens were mostly React state. Evidence: `docs/migration/WAVE_7_BASELINE.md`.

## 2. Existing route inventory

`docs/architecture/ROUTE_CURRENT_INVENTORY.md` classifies AUTH/PUBLIC/SCHOOL/PERSONAL/PLATFORM/LEGACY/COMPATIBILITY/UNKNOWN. Duplicates: staff/people, platform aliases, assessment vs results NAV_ALIASES. Student profile and most public screens lacked durable URLs.

## 3. Router ADR

`docs/adr/ADR-W7-ROUTER.md`. Decision: React Router 7.18.3 library mode. One package. No loaders. Nested layouts deferred to Wave 8.

## 4. Canonical route model

Typed `CanonicalRouteDefinition` in `src/routing/types.ts`: id, workspace, domain, capability, path, pageKey, params/query, access (exposure-only), breadcrumb, legacyNavIds, visibility, classification, title, `isWorkspaceDefault`.

## 5. Route registry

`src/routing/registry.ts` is the compiled authority. Unknown IDs throw. Uniqueness, workspace roots, and no role-specific paths are CI-tested (`collectRegistryViolations`, architecture guard).

## 6. Workspace roots

`/school`, `/personal`, `/platform` plus public/auth. Relate is `/relate` placeholder only. Personal is not a school tenant route.

## 7. School route ownership

IDs follow frozen IA (People, Admissions, Teaching & Learning, Operations, Engagement, Insights, Administration). Sidebar markup is unchanged (Wave 9).

## 8. Personal / platform / public

Personal home/subscription/help/learning/assessment. Platform overview/tenants/health/governance require PLATFORM workspace and `platform.view`. Public landing, welcome, results, register; auth login/reset/verify/join.

## 9. Deep-link behavior

Canonical paths match on paste/refresh. `RequireAuth` + `evaluateGuard` then workspace + capability. Student profile uses `/school/people/students/:studentPublicId`. No sidebar click required to establish tab identity.

## 10. Legacy aliases

Closed map in `aliases.ts`. `/app/{knownTab}` and tenant prefixes redirect with `replace`. Unknown tabs 404. Telemetry `legacy_alias_used`.

## 11. Route guards

Order: exists → auth → workspace (switch via existing `switchWorkspace` if membership exists) → capability exposure → render. Resource auth remains API. Redirect loop counter (≥8 in 2.5s) stops alias/normalize cycles.

## 12. 404

Catch-all and failed matches render `RouteNotFound` (Design System EmptyState + PageHeader). They do not navigate to Home, mutate workspace, or re-bootstrap for the unknown path.

## 13. Browser history

React Router is the only history owner. `ScrollRestoration` keys on pathname (query-only does not jump). Back/forward covered by MemoryRouter test for Home → Students → profile.

## 14. Query parameters

Filter/view/search/page/type/audience. Not resource identity, secrets, or drafts.

## 15. Resource IDs

Student public IDs in the path; malformed → 404 without 500. Numeric internal IDs are not introduced.

## 16. Workspace integration

Workspace provider remains authoritative. School routes require school workspace; mismatch switches through the existing server-supported `switchWorkspace` or access-denied. No second routing-owned workspace store. Stale Tenant A commits remain Wave 6 generation-guarded.

## 17. Access integration

Capability metadata is UX-only. Persona/role labels do not grant routes. Missing capability → access-denied, not Home.

## 18. Page adapters

`LegacyPageAdapter` (owner Frontend Platform, removal Wave 8–10). Representative migrations: school home, students (+ profile URL), admissions, academics, assessment landing/tabs, attendance, finance, administration cluster, personal home, platform overview, public landing/welcome/login.

## 19. PWA / shared-hosting rewrites

`docs/deployment/SPA_ROUTE_REWRITE_CONTRACT.md`. Hostinger `.htaccess`: Laravel prefixes, `/storage/` stop, static files, then SPA `index.html`. Node production fallback no longer sends `/api|/sanctum|/storage|/email` to `index.html`. Service worker still excludes API.

## 20. Accessibility

Document titles from registry (`Students | {School} | Skuggle`; profile does not leak names). `#main-content` focus on pathname change. Reduced motion disables route transition animation. Existing page headings remain. Error boundaries unchanged.

## 21. Performance

Production Vite build 2026-09-04:

| Chunk | Raw | Gzip | vs Wave 6 |
|---|---:|---:|---|
| CSS | 163.18 kB | 25.15 kB | +0.01 kB gzip |
| app-features | 566.82 kB | 130.07 kB | +0.57 kB gzip (~0.4%) |
| **router-vendor** | 42.13 kB | **15.23 kB** | new, ADR cost |
| index | 132.65 kB | 30.97 kB | AppRouter in entry |

No unexplained >10% startup regression. Bootstrap request shape unchanged (still `/auth/me` + existing collections). Router is code-only; no extra bootstrap call on navigation.

## 22. Tests

- TypeScript: PASS.
- Frontend: 6 files, 34 tests PASS (14 Wave 7 routing + prior Wave 2/6).
- Architecture guard: PASS.
- Production build: PASS.
- Backend Wave 3/4/5/session: 27 tests, 598 assertions PASS.

## 23. Browser / manual validation

**Browser runtime: unavailable.** No visual evidence is claimed.

Manual runbook (desktop and a mobile viewport):

1. Login → URL becomes workspace default (`/school` or `/personal` or `/platform`), not `/`.
2. Dashboard → Students → open a student → URL `/school/people/students/{id}` → Back → Students → Forward → profile.
3. Admissions, Academics, Assessment, Attendance, Finance, Administration via sidebar (legacy IDs, canonical URLs).
4. Refresh on Students: same page, no Home, no request storm.
5. Personal via switcher → `/personal`; School URL while Personal → switch or access-denied, never Personal data on a School page.
6. Paste `/not-a-skuggle-page` and `/app/not-a-real-tab` → 404, not Dashboard.
7. Unauthenticated `/school/people/students` → login with `returnTo`; after login land on Students. `returnTo=https://evil.example` ignored.
8. Logout → `/`. Direct Hostinger GET `/school/people/students` → `index.html`; `/api/v1/health` → Laravel.

## 24. Residual debt

See W7-TD-* / FE-ROUTE-* in the debt registers. Adapter, aliases, sidebar taxonomy, browser smoke, calendar/Relate placeholders.

## 25. Rollback

Keep registry. Restore `workspaceRoute` pushState if required. Re-point `App.tsx` at the old view machine. Uninstall `react-router-dom` only if the tree compiles without it. Never roll back Waves 3–6.

## 26. Files changed (Wave 7)

Implementation: `src/routing/**`, `src/App.tsx`, `src/lib/workspaceRoute.ts`, `src/features/students/StudentRegistryView.tsx`, `src/features/assessments/AssessmentWorkspace.tsx`, `vite.config.ts`, `server.ts`, `scripts/architecture-guard.mjs`, `backend/deploy/shared-hosting/public_html/.htaccess`, `package.json`.

Docs: baseline, inventory, ADR, canonical registry, legacy map, SPA rewrite contract, changelog, this report, debt/allowlist updates.

## 27. Wave 7 exit assessment

Code-level exit criteria 1–22 and 23–28 hold: one registry, unique IDs/paths, workspace ownership, no role-owned canonical routes, explicit aliases, refreshable deep links, real 404, history owner, adapters, unchanged shell/menu taxonomy, Hostinger contract, TypeScript/tests/guard/build/backend green, router gzip documented, no Wave 8+ shell/nav/domain work.

Criterion 23 browser evidence is **not fabricated**; deterministic tests plus runbook substitute per specification.

**WAVE 7: PASSED**

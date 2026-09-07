# Wave 7 Changelog

| ID | Requirement | Files | Reason | Tests | Risk / rollback |
|---|---|---|---|---|---|
| W7-001 | Rebaseline and inventory | baseline + `ROUTE_CURRENT_INVENTORY.md` | Measure actual history/URL/App.tsx behavior | document review | none; delete docs |
| W7-002 | Router ADR | `ADR-W7-ROUTER.md`, `package.json` | React Router 7.18.3 as sole history owner | typecheck | uninstall package; keep registry |
| W7-003 | Canonical registry | `src/routing/registry.ts` | Typed IDs, workspace, IA ownership, defaults | registry tests, architecture guard | retain registry even if UI reverts |
| W7-004 | Legacy aliases | `src/routing/aliases.ts` | Closed old-path → canonical redirects | alias tests | restore `workspaceRoute` pushState |
| W7-005 | Guards, 404, returnTo | `guards.ts`, `returnTo.ts`, `RouteSurfaces.tsx` | Auth/workspace/capability order; no Home fallback; open-redirect block | guard/returnTo tests | disable guards; keep 404 |
| W7-006 | App integration | `App.tsx`, `AppRouter.tsx`, `LegacyPageAdapter.tsx` | Representative pages via adapter; existing shell | frontend suite | restore App.tsx view machine |
| W7-007 | History compatibility | `workspaceRoute.ts`, `historyCompatibility.ts` | Leftover tab writes use `navigate` | architecture guard | re-bind pushState |
| W7-008 | Resource/query params | `params.ts`, StudentRegistry adapter | Public IDs + filter query; profile deep link | param tests | stop writing student URLs |
| W7-009 | Hosting rewrite | `.htaccess`, `server.ts`, SPA contract | Deep-link refresh on Hostinger; API/storage not swallowed | static contract | revert htaccess storage rule only |
| W7-010 | A11y, titles, telemetry, guards | titles, AppRouter focus/scroll, telemetry, architecture-guard | Path titles, main focus, routing signals, CI uniqueness | routing + guard | remove announcer only |

Rollback must never revert Wave 3 TenantContext, Wave 4 registry, Wave 5 assignments, or Wave 6 generation/invalidation. Safe rollback: keep registry, restore legacy adapter as primary entry, disable React Router if required.

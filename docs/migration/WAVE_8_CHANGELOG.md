# Wave 8 changelog

| ID | Requirement | Files | Reason | Tests | Risk / rollback |
|---|---|---|---|---|---|
| W8-001 | Rebaseline and inventory | `WAVE_8_BASELINE.md`, `SHELL_CURRENT_INVENTORY.md` | Measure live chrome before replacement | document review | delete docs |
| W8-002 | Shell family + nested layout | `src/shell/*`, `AppRouter.tsx` | Pathless `AuthenticatedRoot` hosts Outlet; SchoolStaff/ParentStudent/Personal/Platform share chrome primitives | `shell.test.tsx` | restore `AppHeader`/`AppSidebar` wrap; keep Wave 7 routes |
| W8-003 | Global header + identity | `ShellHeader.tsx`, `WorkspaceIdentity.tsx`, `ShellActionCluster.tsx` | Calm header; bounded tenant theme; skip overcrowding | landmarks in shell tests | re-attach `AppHeader` |
| W8-004 | Workspace switcher | `WorkspaceSwitcherModal.tsx`, `AuthenticatedRoot.tsx` | Wave 6 switch; PERSONAL/SCHOOLS/PLATFORM categories; type-change navigation; focus identity | Wave 6 state tests + switch effect | keep `switchWorkspace`; drop navigate-on-type |
| W8-005 | Academic context control | `AcademicContextControl.tsx` | Compact session/term for school families; no identity rebuild | unit via family visibility | hide control |
| W8-006 | Navigation container + adapter | `PrimaryNavigation.tsx`, `LegacyNavigationAdapter.ts` | Injected items; staff taxonomy preserved; parent/student simplified | adapter tests | adapter only; chrome stays |
| W8-007 | Desktop / rail | `WorkspaceShellChrome.tsx`, `preferences.ts` | Light persistent nav; optional compact rail preference (expanded default) | layout flags `data-nav-mode` | force expanded |
| W8-008 | Tablet drawer | `Drawer.tsx` `placement`, chrome | Left Wave 2 Drawer, focus trap/Escape/restore | `DialogLifecycle.test.tsx` | right-only drawer |
| W8-009 | Mobile bottom + More | `MobileBottomNav.tsx` | Task-first; 44px; safe-area; More drawer | shell tests | overlay sidebar rollback |
| W8-010 | PageFrame / canvas / breadcrumbs | `PageFrame.tsx`, `ContentCanvas.tsx` | Geometry + Wave 7 crumbs; no forced PageHeader on legacy pages | PageFrame test | padding div in router |
| W8-011 | My Work / notifications / activity | `ShellActionCluster.tsx` | Distinct slots; existing notifications only; My Work empty honest copy; activity hidden | notifications failure must not blank shell | hide My Work |
| W8-012 | Loading / error / outlet | `AuthenticatedRoot.tsx`, `AppErrorBoundary` | Shell independent of domain collections; page Suspense + preserveShell | existing boundary + RouteLoading | previous inline Suspense |
| W8-013 | A11y | `SkipLink.tsx`, landmarks, rail sr-only, density tokens | Skip to `#main-content`; keyboard nav; reduced-motion drawer | skip link test; drawer test | remove skip link only |
| W8-014 | Architecture guards + chunk | `architecture-guard.mjs`, `vite.config.ts` | No domain APIs/nav embed/raw palette/legacy chrome in router; `app-shell` chunk | `test:architecture` | remove new rules |
| W8-015 | Docs / debt | reports, runbook, debt registers | Closure evidence; Wave 9 adapter debt | — | docs only |

Rollback must never revert Wave 3 TenantContext, Wave 4 permissions, Wave 5 assignments, Wave 6 state, or Wave 7 routing.

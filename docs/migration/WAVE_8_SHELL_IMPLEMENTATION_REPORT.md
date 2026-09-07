# Wave 8 shell implementation report

## 1. Baseline

See `docs/migration/WAVE_8_BASELINE.md`.

- HEAD `b30f3e1a405f7cd5b4253446752cc1d89724bd09`, branch `main`, dirty Waves 0–7 tree preserved.
- Pre-change chrome: `AppHeader` + dark `AppSidebar` (272px / collapsed 80px) remounted per workspace route; no skip link; no academic selector; no My Work; mobile overlay of the staff sidebar.
- Screenshots: not captured (no browser runtime).

## 2. Current shell inventory

See `docs/architecture/SHELL_CURRENT_INVENTORY.md`.

## 3. Shell family

Shared chrome: `WorkspaceShellChrome`. Family wrappers: `SchoolStaffShell`, `ParentStudentShell`, `PersonalShell`, `PlatformShell`. `AuthenticatedRoot` selects family from Wave 6 workspace type plus Parent/Student composition. Teacher and Principal share School staff. No per-role shell source files.

## 4. Global header

`ShellHeader`: identity | academic context (wide) | search trigger | My Work / notifications / user menu. Skip link is first. Offline/PWA banner retained. PIN checker removed from the header to reduce crowding (public `/results` remains routed).

## 5. Workspace switcher

Existing modal, Wave 6 `switchWorkspace`. Categories labeled **Schools / Personal / Platform**. Initials use workspace name, not stale branding. Type change navigates to `workspaceDefaultRoute`. Shell keyed by `activeWorkspace.id`. Focus `#workspace-identity` after a completed switch.

## 6. Academic context

`AcademicContextControl` for school families only. Reads Wave 6 Academic Context; session/term `<select>` when AppContext lists already exist. Hidden on Personal/Platform. Visibility is not authorization.

## 7. Navigation container

`PrimaryNavigation items={groups}`. Groups come from `LegacyNavigationAdapter`. Active id = Wave 7 `legacyNavIdForRoute`. Clicks are React Router `NavLink` → canonical paths.

## 8. Desktop layout

Light raised sidebar, ~15.5rem, inset active state, collapsible groups. School staff may persist a compact icon rail (`skuggle_shell_nav_mode`, default expanded). Labels remain visible when expanded.

## 9. Tablet layout

48rem–63.99rem: header control opens a **left** Wave 2 Drawer (focus trap, Escape, restore, backdrop). Does not consume half the viewport permanently.

## 10. Mobile layout

`< 48rem`: bottom nav (44px+), safe-area padding, More drawer. Hamburger is tablet-only.

## 11. Parent / Student shell

`parent-student` family + flattened adapter group. Not a staff rail with most items CSS-hidden.

## 12. Personal shell

Lighter projection; no academic selector; no tenant accent; workspace switcher retained.

## 13. Platform shell

`data-shell-family="platform"`, explicit Platform label, graphite/indigo tokens, tenant theme **not** applied, hidden support-session slot. School Super Admin never uses this family.

## 14–16. PageFrame / canvas / breadcrumbs

`PageFrame` + `ContentCanvas` (operational / contained / full). Breadcrumbs from Wave 7 metadata, `hidden` below `md`. Legacy pages are not forced through `PageHeader` (avoids title shouting). `ModuleWorkspace` remains the single context-nav row; Assessment still skipped (Wave 13).

## 17. My Work / Notifications / Activity

My Work: honest empty dialog, staff only, not a fake queue. Notifications: existing `/notifications` only. Activity: hidden slot.

## 18–19. Loading / error

Pathless layout so chrome does not remount on `/school` → `/personal`. Outlet `Suspense` → `RouteLoading` inside `main`. `AppErrorBoundary preserveShell` around Outlet. Shell files do not fetch students/assessments/invoices/attendance collections.

## 20. Route integration

`AppRouter` public routes stay siblings. Authenticated paths nest under `AuthenticatedLayout` → `AuthenticatedRoot` → `<Outlet />`. Legacy aliases unchanged. 404 remains inside the page region when the path is an authenticated workspace URL.

## 21. Accessibility

Skip link → `#main-content`; `header` / `nav` / `main` / `aside`; `aria-current="page"`; rail `sr-only` names; 44px targets; drawer lifecycle; `prefers-reduced-motion` on drawer springs; density `comfortable` default.

## 22. Tenant branding

`resolveTenantTheme` on school families only (`--tenant-identity-accent`, `--tenant-action-primary`). Platform ignores tenant accent. Guard forbids protected semantic overrides.

## 23. Performance

Production build 2026-09-04 (this wave):

| Chunk | kB | gzip | vs Wave 7 |
|---|---:|---:|---|
| CSS | 165.37 | 25.59 | gzip +1.7% |
| app-features | 479.78 | 106.03 | gzip −18.5% (chrome extracted) |
| app-shell (new) | 188.26 | 49.63 | layout chunk; was coupled to the router module graph |
| router-vendor | 42.32 | 15.29 | gzip +0.4% |
| index | 25.89 | 7.34 | entry after extraction |

No unexplained CSS or vendor >10% regression. Combined `app-features` + `app-shell` is a split of former authenticated UI, not a new domain fetch. Shell bootstrap does not add collection requests. Circular-chunk warning was not emitted on this build.

## 24. PWA

Bottom nav `env(safe-area-inset-bottom)`. Offline banner retained. No offline domain write sync.

## 25. Tests

- TypeScript: PASS (`tsc --noEmit`)
- Frontend: 42 tests PASS (was 34; +8 Wave 8)
- Architecture guard: PASS (Wave 8 shell rules)
- Production build: PASS
- Wave 2 primitives, duplicate-key Assessment, Wave 6 state, Wave 7 routing: PASS
- Backend: Wave 3 tenant context, Wave 4 permission registry (8 tests / 515 assertions), Wave 5 assignments, workspace switch, and login workspace isolation — 25 tests PASS (575 assertions combined)

## 26. Browser / manual validation

**Unavailable.** Runbook: `docs/migration/WAVE_8_MANUAL_BROWSER_RUNBOOK.md`. No screenshots fabricated.

## 27. Residual debt

W8-TD-01…06 in `docs/migration/TECHNICAL_DEBT_REGISTER.md` (adapter, unused AppHeader/AppSidebar, empty My Work/Activity, Assessment tabs, browser smoke, ModuleWorkspace).

## 28. Rollback

1. Point `AppRouter` authenticated routes at `AppHeader` + `AppSidebar` again (files retained).
2. Keep `AuthenticatedRoot` unmounted.
3. Keep Wave 3–7.
4. Optional: keep SkipLink / Drawer `placement` / tokenized header atoms.

Never roll back TenantContext, permission registry, RoleAssignments, Wave 6 providers, or the canonical router.

## 29. Files changed (Wave 8)

- `src/shell/**` (family, adapter, header, nav, mobile, PageFrame, tests)
- `src/routing/AppRouter.tsx`
- `src/components/ui/Drawer.tsx` (`placement`, reduced motion)
- `src/components/WorkspaceSwitcherModal.tsx`
- `src/test/setup.ts` (`matchMedia`)
- `vite.config.ts` (`app-shell`)
- `scripts/architecture-guard.mjs`
- docs listed in the Wave 8 prompt
- `AppHeader.tsx` / `AppSidebar.tsx` **not deleted** (rollback)

## 30. Exit assessment

Code-level criteria 1–22 and 24–30 hold, including backend session/workspace contracts. Criterion 23: CSS/vendor gzip under 10%; JS re-chunked into `app-shell` without domain-collection chrome fetches. Browser smoke uses the manual runbook (environment had no credentialed browser). **Wave 9+ was not started.**

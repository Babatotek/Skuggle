# Wave 8 Baseline

Recorded before Wave 8 shell edits on 2026-09-04 (Africa/Lagos). Measured from the live repository after Wave 7; chrome behavior was not assumed from design docs.

- Git HEAD: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Working tree: dirty. Waves 0–7 implementation remained uncommitted/untracked and was preserved. No reset, checkout, or unrelated rewrite was performed.
- Screenshots: **not captured**. No browser runtime was available in this execution environment. Evidence below is source-measured only.

## App root composition

`src/App.tsx` is thin: `AppProvider` → `BrowserRouter` → `AppRouter`.

`src/routing/AppRouter.tsx` owned authenticated chrome. Each of `/school`, `/school/*`, `/personal`, `/personal/*`, `/platform`, `/platform/*`, `/relate`, `/session` wrapped `RequireAuth` + a local `AuthenticatedShell` that remounted per sibling route.

## Header

`src/components/AppHeader.tsx` — sticky `h-16` white/blur header.

- Left: mobile hamburger, command-palette trigger, desktop collapse, breadcrumb/title from `tabMeta(activeTab)` (workspace name + category + page title).
- Center (md+): read-only search input opening the command palette. No cross-domain search backend.
- Right: public PIN checker, notifications (`GET /notifications`), user menu (security, launch blueprint, invitations, subscription, workspaces, landing, logout).
- No academic campus/session/term control.
- Offline/sync banner when `isOnline` is false or `offlineQueue` is non-empty.

## Sidebar / primary navigation

`src/components/AppSidebar.tsx` — dark `bg-slate-950` ERP-like rail, width **272px** expanded / **`lg:pl-20`** collapsed.

- Embedded school identity + workspace switcher trigger.
- Categories from `src/lib/sidebarNav.ts` projecting `src/lib/navigation.ts`.
- Own mobile overlay (not Wave 2 Drawer).
- Local filter/search of menu labels.
- Staff-shaped for all authenticated users; Parent/Student visibility came from hiding items, not a simpler shell.

## Mobile nav

Sidebar overlay when `isMobileOpen`. No bottom navigation. No More surface. Desktop sidebar was shrunk/overlaid rather than task-first.

## Workspace switcher

`src/components/WorkspaceSwitcherModal.tsx` used Wave 6 `useWorkspace` / `switchWorkspace`. Groups were school / personal / platform. Role icons decorated items; headings were “School Memberships”, “Personal Spaces”, “Platform Management”. School initials incorrectly used `branding.schoolName` (active tenant), not the listed workspace name.

Switching did not navigate between `/school`, `/personal`, and `/platform` by itself; Wave 7 `GuardedPage` handled workspace mismatch.

## Academic context

Wave 6 `useAcademicContext` (campus/session/term + generation). Selector was **not in chrome**. Session/term lists still lived as AppContext collections. Academics config owned full editing.

## Global search

Command palette (`src/components/CommandPalette.tsx`) ranked **current authorized nav items** only. No tenant-wide student/invoice fetch.

## Notifications / My Work

Notifications inbox in the header (existing `/notifications`). **My Work was absent.** No activity/jobs center in chrome.

## Responsive behavior

Tailwind `lg` (1024px) switched overlay vs persistent sidebar. Wave 2 tokens: `--breakpoint-compact: 40rem`, `--breakpoint-wide: 64rem`. Density: `comfortable | compact | focused` in `src/styles/tokens.css`; chrome did not expose a density control.

## Page-container geometry

Module workspace extra tab row (`ModuleWorkspace`) skipped Assessment. Padding: home `max-w-[1920px] px-4/6/7`; other pages `max-w-[1440px] px-4/6/8`. Content sat in the padded main, not a shared PageFrame.

## Loading / error

`isSessionChecking` showed a full-page `DashboardLoading` (cream canvas). Authenticated chrome waited on that gate. Page `Suspense` used `RouteLoading` inside main. `AppErrorBoundary preserveShell` already contained page failures.

Shell still sat above domain collection hydration in AppContext (up to 11 permission-conditioned requests) even though chrome itself did not read those collections.

## Layout route wrappers

No pathless parent layout. `AuthenticatedShell` duplicated around each workspace path → remount risk on `/school` → `/personal`.

## Route-level chunks

Wave 7 production: CSS 163.18 kB (25.15 gzip); `app-features` 566.82 / 130.07 gzip; `router-vendor` 42.13 / 15.23 gzip. No `app-shell` chunk. `src/shell/` did not exist.

## Shell CSS / utilities

No dedicated shell stylesheet. Sidebar used raw Tailwind slate-950. Header used slate/indigo utility colors rather than Wave 2 semantic tokens.

## Tenant branding

`AppSidebar` showed logo + school name + gradient fallback. `resolveTenantTheme` existed (Wave 2) but was **not applied** to authenticated chrome. Branding could persist visually across workspace lists (initials from active branding).

## Rollback chrome (retained on disk)

`AppHeader.tsx` and `AppSidebar.tsx` remained in the tree as unused live chrome after Wave 8 so rollback can re-attach them without restoring Waves 3–7.

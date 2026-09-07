# Shell target contract (Wave 8)

## Composition

Authenticated application chrome is:

**Workspace header + primary navigation container + page context + content canvas + transient/status surfaces.**

Nested Wave 7 layouts:

`RequireAuth` → `AuthenticatedRoot` → family shell (`SchoolStaffShell` | `ParentStudentShell` | `PersonalShell` | `PlatformShell`) → `PageFrame` → route `Outlet` / `LegacyPageAdapter`.

Public tenant portal (`/`, `/login`, `/school/login`, `/welcome`, `/results`, …) is **outside** this tree.

## Family

| Family | When | Chrome |
|---|---|---|
| School staff | School workspace and role is not Parent/Student | Persistent desktop nav, optional compact rail, academic context, My Work slot |
| Parent/Student | School workspace and Parent or Student | Same design tokens; **simplified** adapter projection — not a hidden staff tree |
| Personal | Personal workspace | Lighter nav; no academic context; no school finance/admin chrome |
| Platform | Platform workspace | Graphite/indigo privileged label; tenant theme **not** applied; support-session slot |

Family selection is layout composition. Teacher and Principal share `SchoolStaffShell`. Capability still comes from Wave 4/6 access + existing nav visibility. Family pick is **not** authorization.

## Header

- Left: identity (Skuggle + active workspace; bounded tenant logo/accent for school).
- Center: academic context (school families, when context exists); search on wide desktops.
- Right: My Work (staff), notifications (existing API), activity slot (hidden until implemented), user menu.

Do not overcrowd. Do not shout page title in the header.

## Navigation

`PrimaryNavigation` receives `ShellNavGroup[]`. It does not embed `NAV_GROUPS`. Wave 8 injects `LegacyNavigationAdapter` (current menu semantics). Wave 9 replaces the adapter with capability navigation.

Active item = Wave 7 `legacyNavIdForRoute(matchCanonicalPath)`.

## Responsive

Wave 2 tokens: compact 40rem, wide 64rem.

| Width | Behavior |
|---|---|
| ≥ 64rem | Persistent left nav (staff default expanded; optional rail) |
| 48rem–63.99rem | Header trigger + left Wave 2 Drawer (focus trap, Escape, restore, backdrop) |
| < 48rem | Bottom nav (44px+ targets, safe-area) + More drawer |

## Page frame

`PageFrame` + `ContentCanvas`: operational max-width, contained reading, or full-width home. Breadcrumbs from Wave 7 metadata, hidden on small screens. Legacy pages are **not** required to adopt `PageHeader` immediately (avoids title shouting).

One context-navigation row: existing `ModuleWorkspace` (Assessment still skipped).

## Bootstrap

Shell may depend on Auth, Workspace, Access, Academic Context. It must not fetch students, assessments, invoices, attendance, or results collections in order to paint.

Page loaders (`RouteLoading`, domain spinners) stay inside `main`. `AppErrorBoundary preserveShell` contains page failures.

## Branding

`resolveTenantTheme` sets `--tenant-identity-accent` and `--tenant-action-primary` only. Never danger, focus, status, Platform, or critical text.

## Rollback

Disable `AuthenticatedRoot` and re-attach `AppHeader`/`AppSidebar`. Keep Wave 3–7. Keep header primitives if harmless.

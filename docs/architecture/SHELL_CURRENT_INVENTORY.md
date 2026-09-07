# Current shell inventory (Wave 8)

Measured from the pre-Wave-8 authenticated chrome (`AppHeader`, `AppSidebar`, `ModuleWorkspace`, `WorkspaceSwitcherModal`, `CommandPalette`, `AppRouter.AuthenticatedShell`). Target owners refer to the Wave 8 family in `src/shell/`.

| Element | Classification | Current component | State owner | Route dependency | Role/persona dependency | Responsive behavior | Wave 8 owner | Migration treatment |
|---|---|---|---|---|---|---|---|---|
| Skip to main | MISSING | none | — | `#main-content` exists from Wave 7 | none | — | SkipLink | **Add** |
| App bar | GLOBAL HEADER | `AppHeader` | local UI + `useApp` | `activeTab` titles | role-labeled user chip | sticky; search md+; hamburger lg-hidden | `ShellHeader` | Replace |
| Logo / school name in sidebar | WORKSPACE IDENTITY | `AppSidebar` header button | `branding` + `currentWorkspace` | none | school vs personal copy | collapsed hides text | `WorkspaceIdentity` | Move to header; Wave 6 workspace name authoritative |
| Switch workspace modal | WORKSPACE SWITCHER | `WorkspaceSwitcherModal` | Wave 6 `useWorkspace` / `switchWorkspace` | none (type change via guard) | role **icons**, not categories | modal | same modal + header trigger | Keep actions; relabel PERSONAL/SCHOOLS/PLATFORM; navigate on type change |
| Campus / session / term | ACADEMIC CONTEXT | not in chrome | Wave 6 AcademicContext; lists in AppContext | none | implied school users | — | `AcademicContextControl` | Compact school-only; do not wait on collections to show shell |
| Dark left rail | PRIMARY NAVIGATION | `AppSidebar` + `sidebarNav.ts` | `navigation.ts` visibility | `activeTab` / nav ids | role/permission/`excludeRoles` | 272px / collapse / overlay | `PrimaryNavigation` + `LegacyNavigationAdapter` | Restyle; **do not regroup** (Wave 9) |
| Module tab strip | SECONDARY NAVIGATION / CONTEXT NAV | `ModuleWorkspace` | `visibleNavGroups` | skips Assessment | same as nav | horizontal scroll | keep as single context row | Slot in PageFrame; Assessment skip = Wave 13 debt |
| Header breadcrumbs + H1-like title | PAGE HEADER | `AppHeader` `tabMeta` | route tab | duplicates page titles | workspace type copy | hidden pieces on xs | `PageFrame` breadcrumbs from Wave 7 metadata | Drop chrome page title; legacy pages keep own titles |
| Padded max-width main | CONTENT FRAME | inline div in `AuthenticatedShell` | `activeTab === 'home'` width branch | home vs other | none | 1920 vs 1440 | `ContentCanvas` | operational vs full vs contained |
| Command palette | SEARCH | `CommandPalette` | nav items | nav ids → Wave 7 routes | authorized items only | ⌘K; md+ field | header slot + palette | Preserve; no fake global index |
| My Work | MY WORK | absent | — | — | — | — | header action | Placeholder only; no demo tasks |
| Bell inbox | NOTIFICATIONS | `AppHeader` | `/notifications` + `skuggle:notification` | `/notifications` tab unused here | none | popover | `ShellActionCluster` | Reuse existing API only |
| Jobs / SmartMark / exports | ACTIVITY | absent in chrome | domain pages | — | — | — | hidden `data-shell-slot="activity"` | Future; do not simulate |
| Profile menu | USER MENU | `AppHeader` dropdown | `useApp` + module access | navigates tabs | admin-only entries | popover | `ShellActionCluster` | Logout → Wave 6 `skuggle:logged-out`; no primary nav inside |
| Overlay sidebar | MOBILE NAV | `AppSidebar` `isMobileOpen` | local | same menu | staff-shaped | overlay | tablet: Wave 2 Drawer left; mobile: `MobileBottomNav` + More | Do not shrink desktop rail |
| Toast | TRANSIENT UI | `AppRouter` AnimatePresence | `useApp` toast | none | none | fixed | keep in `AppRouter` | Unchanged |
| Offline banner | TRANSIENT UI / PWA | `AppHeader` | `isOnline`, `offlineQueue` | none | none | full-width | `ShellHeader` | Keep; no offline write sync |
| AI buddy | TRANSIENT UI | `SkuggleAIBuddy` | local | none | none | floating | remain in chrome | Unchanged |
| Dark slate-950 rail | LEGACY | `AppSidebar` | — | — | — | desktop | unused after Wave 8 | Rollback attachment only |
| Duplicate identity (header crumbs + sidebar school) | DUPLICATE | Header + Sidebar | branding | — | — | — | header identity only | Remove sidebar duplicate |
| PIN result checker in header | DOMAIN-OWNED | `AppHeader` | public results route | `public.results` | none | sm+ | omit from canonical header | Domain/public; avoid overcrowding |
| Assessment internal tabs | DOMAIN-OWNED | `AssessmentWorkspace` | assessment UI | assessment route | staff | in-page | wrap only | Wave 13; do not reorganize CA/Tests/Exams |
| Students registry chrome | DOMAIN-OWNED | `StudentRegistryView` | domain | student public id | permissions | page | `LegacyPageAdapter` in PageFrame | Wave 10 |
| Public welcome/login/results | (not authenticated shell) | public pages | public/auth | public paths | none | full page | **excluded** | Do not wrap |

# Architecture debt allowlist

Every entry is exact and accountable; no directory-wide ignore is permitted.

| ID | Rule | File | Reason | Owner | Target wave | Expiry / review |
|---|---|---|---|---|---:|---|
| IAM-LEG-001 | direct role-name authorization | `AttendanceController.php` | legacy teacher relationship branch | IAM | 4 | replace when capabilities encode assignment scope |
| IAM-LEG-002 | direct role-name authorization | `DashboardController.php` | legacy super-admin dashboard persona gate | IAM | 4 | permission-registry migration |
| IAM-LEG-003 | direct role-name authorization | `TenantMembershipController.php` | protects legacy role administration | IAM | 5 | RoleAssignments migration |
| UI-LEG-001 | clickable div | `MetricCard.tsx` | legacy optional card interaction API | Design System | 2 | replace with semantic interactive wrapper |
| DOM-LEG-001 | domain persistence | `Domain/Library/AI/AIManager.php` | six reviewed writes to the AI-owned `AiRequest` model | Library/AI | 5 | revisit when domain services are formalized |
| SEC-TEST-002 | document BOLA depth | student document routes | parent isolation exists; child matrix incomplete | Security | 2 | before expanding document API |
| SEC-TEST-003 | assessment BOLA depth | assessment/score routes | global tenant tests exist; endpoint matrix incomplete | Assessment | 2 | before score workflow migration |
| SEC-TEST-004 | attendance relationship depth | attendance class routes | tenant tests exist; academic relationship matrix incomplete | Attendance | 2 | before attendance pilot release |
| SEC-TEST-005 | payment/webhook matrix | payment routes | HMAC implemented; dedicated replay/cross-tenant matrix incomplete | Finance/Security | 6 | before provider go-live |
| SEC-TEST-006 | report download matrix | report routes | scoped policy exists; dedicated download matrix incomplete | Reporting | 5 | before new export type |
| SEC-TEST-007 | public library projection | public library routes | published predicates are repeated | Library/Security | 5 | consolidate resolver before new public endpoint |

Machine-enforced legacy role entries also live in `architecture-baseline.json`; changing either side without review fails the architecture check.
# Wave 4 authorization compatibility debt

- Existing controller/policy `permissionNames()` checks remain allowed only where not selected for the middleware shadow pilot. Owner: IAM. Removal: incremental policy migrations before Wave 24.
- Existing frontend role-label checks remain UX-only and baselined for their scheduled navigation/application-context waves. They must not become backend authority.
- `membership.role_id` is intentionally retained. RoleAssignments and multi-role membership belong exclusively to Wave 5.
# Wave 5 temporary allowances (expires at legacy retirement review)

- `tenant_memberships.role_id` remains required and authoritative for primary presentation while also acting as implicit authorization assignment. Final retirement belongs to Wave 24.
- Role realm/tenant ownership is inferred from registered platform capability grants because the frozen `roles` table is global. New custom-role creation is not allowlisted.
- Existing role-name persona checks and numeric membership IDs remain compatibility contracts; they must not be copied into new multi-role APIs.

# Wave 6 temporary allowances

- `LegacyAppContextAdapter` retains the 20 inventoried root domain/feature collections only to preserve 57 existing consumers. Owner: Frontend Platform plus each domain owner. Removal: incremental Wave 10+ domain migrations. Machine guard rejects new collection names.
- Demo-only localStorage domain payloads remain disabled by `demoMode === false`. Owner: Frontend Platform. Removal: demo compatibility retirement; they must never become production persistence.
- Persona/role presentation branches remain compatibility-only for current dashboards/navigation. Owner: Navigation/Dashboard. Review: Wave 9 and dashboard migration. No new authorization helper may consult persona or role label.

# Wave 7 temporary allowances

- `LegacyPageAdapter` maps canonical `pageKey` values to pre-Wave-7 views. Owner: Frontend Platform. Removal: Wave 8 shell outlet plus domain waves. Machine guard forbids unknown-route-to-Home and duplicate IDs.
- `workspaceRoute.ts` remains a compatibility facade over React Router `navigate`. Owner: Frontend Platform. Removal: Wave 24 or when no leftover `writeWorkspaceTab` callers remain.
- Sidebar/command palette still use legacy nav IDs; they resolve through `routeFromLegacyNavId`. Menu regrouping is Wave 9. Owner: Navigation.
- `school.calendar` and `relate.home` are registry placeholders (`implemented: false`). Owner: domain waves. Do not treat them as shipped product.

# Wave 8 temporary allowances

- `LegacyNavigationAdapter` projects current `navigation.ts` groups/ids into the shell. Owner: Frontend Platform. Removal: Wave 9. Machine guard forbids embedding `NAV_GROUPS` inside `src/shell` components.
- `AppHeader` / `AppSidebar` remain on disk for rollback and are not mounted by `AppRouter`. Owner: Frontend Platform. Removal after Wave 8 soak.
- My Work is an empty honest slot (no demo queue). Owner: operations/work-queue wave.
- Activity center slot is hidden until import/export/SmartMark shell data exists. Owner: jobs wave.
- Assessment in-page tabs remain domain-owned; `ModuleWorkspace` still skips Assessment. Owner: Wave 13.
- Mobile bottom-nav id lists are a compatibility projection. Owner: Wave 9.
- Shell may call existing `/notifications` inbox endpoints only. Owner: notifications service wave.


# Workforce / IAM Separation — Implementation Report

Date: 9 September 2026

## 1. Current-state problems discovered

- Administration **Users & Roles** mounted one membership screen with a **Create School Admin officer** form (name/email/password), conflating employee creation, account creation, and role assignment.
- That table showed **Status** + **Suspend** as if rows were employment records.
- Workforce **Add Member / Invite** both called `inviteStaff`, inventing fake staff rows and treating access roles as job titles.
- AppContext hydration forced every employee `role: 'Teacher'`, mapped department→campus, and collapsed employment status to Active/Suspended.
- Roles & Permissions shared the Users route; no role catalog UI existed despite `GET /school/access-catalog`.

## 2. Domain duplication identified

| Feature | Was | Canonical owner now |
|---|---|---|
| Staff directory / employment status | Mixed with Users | Workforce |
| Job title labelled “Role” | Workforce + IAM language | Workforce **Position** |
| Login accounts | Users & Roles | Users |
| Authorization definitions | Missing / mixed | Roles (+ Permissions read-only) |
| Invitations | People + Administration | People & Access → Invitations |
| Auth policies | Governance only | People & Access → Access Policies (redirect from governance) |

## 3. Data-model relationships discovered

No Person table. Identity links:

- `User` (global) ← `TenantMembership` → `Role` / `RoleAssignment` / `Permission`
- `Employee` (tenant HR, optional `user_id`) → `WorkforcePosition`, `Department`, `Campus`
- `Student` / `Guardian` optional `user_id`
- `TenantInvitation` may carry `metadata.employee_id`
- New: `tenant_access_roles` for tenant **Custom** role definitions (metadata; permission wiring deferred)

## 4–9. Files / routes / components

### Modified (key)

- `src/routing/administration.ts` — split People & Access capabilities
- `src/routing/types.ts`, `LegacyPageAdapter.tsx`, `pages.ts`
- `src/features/administration/AdministratorsView.tsx` — Users directory only
- `src/domains/people/workforce/WorkforcePage.tsx` — employee directory + onboarding
- `src/context/AppContext.tsx` — correct employee hydration; no fake invite-as-employee
- `src/types.ts` — `position`, employment statuses
- `backend/app/Http/Controllers/Api/V1/TenantMembershipController.php` — catalog + create custom role
- `backend/app/Http/Controllers/Api/V1/EmployeeController.php` — status audit; email/phone presentation
- `backend/routes/api.php` — `POST /school/access-roles`

### Added

- `src/features/administration/RolesCatalogView.tsx`
- `src/features/administration/PermissionsCatalogView.tsx`
- `src/domains/people/workforce/employmentStatus.ts`
- `src/domains/people/workforce/workforce.iam.test.tsx`
- `backend/app/Models/TenantAccessRole.php`
- `backend/database/migrations/2026_09_09_000200_create_tenant_access_roles_table.php`
- `backend/tests/Feature/School/WorkforceIamBoundaryTest.php`

### Deleted

- None (legacy `StaffManagementView` retained but deprecated; AppRouter already serves WorkforcePage)

### Routes

| Path | Purpose |
|---|---|
| `/school/people/workforce` | Workforce (canonical) |
| `/school/administration/people-access` | Landing |
| `/school/administration/people-access/users` | Users |
| `/school/administration/people-access/roles` | Roles |
| `/school/administration/people-access/permissions` | Permissions |
| `/school/administration/people-access/invitations` | Invitations |
| `/school/administration/people-access/access-policies` | Access Policies |

### Redirects

- `/school/administration/roles-permissions` → Roles
- `/school/administration/governance/policies` → Access Policies
- `/school/people/invitations` → Invitations (unchanged target)

## 10. Migrations

- `2026_09_09_000100_separate_workforce_from_access.php` (pre-existing): positions, employee FKs, documents
- `2026_09_09_000200_create_tenant_access_roles_table.php` (new): tenant custom access roles

## 11–15. Domain changes

**Workforce:** Position column, employment status dropdown (Active / On Leave / Suspended / Terminated + preserved states), confirmation for consequential changes, 5-step Add Staff with optional System Access.

**Users:** Account Type, Linked Profile, Assigned Role(s), Last Access, Suspend **access** (not employment).

**Roles:** Create Role (custom tenant metadata), Members, Type (System/Standard/Custom); no Status/Suspend; no employee form.

**Position ≠ Role:** `workforce_positions` vs global `roles` / `tenant_access_roles`; School Admin Officer is a position; School Admin is an access role.

## 16–17. Tenant isolation & authorization

Verified in `WorkforceIamBoundaryTest`: cross-tenant employee read/write denied; custom roles not visible cross-tenant; membership suspend leaves `employees.status` unchanged; employee APIs remain `users.manage`; role catalog/create remain `roles.manage` + Super Admin for writes.

## 18–19. Tests executed

```
php artisan test --filter=WorkforceIamBoundaryTest
→ 5 passed

npx vitest run src/domains/administration/administration.test.tsx src/domains/people/workforce/workforce.iam.test.tsx
→ administration 49 passed; workforce.iam 3 passed
```

## 20. Remaining technical debt

- Full permission matrix / inheritance / clone / preview-as-role deferred to Role Access & Permission PRD; custom roles do not yet grant runtime permissions.
- Staff document upload UI still post-create only (API exists).
- Dedicated `/workforce/:staffId` profile route not added; drawer + `?staff=` deep-link used.
- Legacy `StaffManagementView` still reachable via LegacyPageAdapter `pageKey: workforce` if AppRouter bypass changes—should be removed in a later cleanup.
- Global `roles` table still has no `description` column; catalog uses null-safe fallback text.
- Platform Super Admin vs School Super Admin separation preserved; do not expose platform permissions in tenant custom roles (enforced by catalog filtering).

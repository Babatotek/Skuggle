# Workforce and IAM boundary audit

9 September 2026. Updated after gap implementation.

## Boundary rule

- **Workforce** owns employment records (`Employee`, `WorkforcePosition`, `EmployeeDocument`, employment status). Login is optional.
- **IAM** owns `User`, `TenantMembership`, access roles/permissions, invitations, and account status.
- Link only explicitly via `Employee.user_id`, invite `employeeId`, or `POST /employees/{id}/access`.

## Inventory (current)

| Capability | Route / UI | API | Owner | Status |
|---|---|---|---|---|
| Employee directory | People → Workforce (`WorkforcePage`) | `GET /employees` | Workforce | Live |
| Create employee | Add Staff wizard | `POST /employees` then optional access | Workforce | Live — employment first |
| Job positions | Workforce position select + New | `GET lookups`, `POST /workforce/positions` | Workforce | Live |
| Employment status | Workforce column + confirm | `PATCH /employees/{id}` | Workforce | Live — not account access |
| Employee profile | Workforce drawer | PATCH employee, documents, optional access | Workforce | Live |
| Employee documents | Profile drawer | `GET/POST /employees/{id}/documents` | Workforce | Live |
| Link / invite access | Onboarding step 5 + drawer | `POST .../access` (`roles.manage`) or `POST /invites` + `employeeId` | Bridge / IAM | Live — gated correctly |
| Users directory | Administration → Users | `GET/PATCH /school/memberships` | IAM | Live — Suspend/Restore access with confirm |
| Roles catalog | Administration → Roles | `GET /school/access-catalog`, `POST /school/access-roles` | IAM | Live (custom roles metadata-only) |
| Permissions catalog | Administration → Permissions | access-catalog | IAM | Live read-only |
| Invitations | Administration → Invitations | InviteController | IAM | Live |
| Access policies | People & Access → Access Policies | school-modules `auth-policies` | IAM nav | Moved; governance path redirects |
| Legacy StaffManagementView | — | — | — | **Retired** — thin alias to `WorkforcePage`; LegacyPageAdapter + AppRouter both render Workforce |

## Data relationships

```
User ── TenantMembership ── Role / RoleAssignment
  │
  └── optional Employee.user_id (explicit link only)
        ├── WorkforcePosition (job designation ≠ access role)
        ├── Department, Campus, reporting manager
        └── EmployeeDocument
```

Invite accept (`InviteController::provisionRoleRecord`): links `metadata.employee_id` when present; provisions Guardian for parent; **does not** invent Employee from staff roles.

## FE mapping notes

- `employmentStatus.ts` / `mapEmployeeRow` map position → display designation; campus from `campus`; employment statuses are not collapsed to Active/Suspended school access.
- `inviteStaff` creates invitations only (optional `employeeId`); does not invent employee rows.
- `addStaff` persists via `POST /employees` unless `{ persist: false }`.
- Create account from workforce requires Super Admin + `roles.manage`; invitation path uses `users.manage`.

## Deferred

- Bulk workforce import — **shipped** (`/employees/imports/*` + Workforce Import UI).
- Dedicated employee profile route — **shipped** (`/school/people/workforce/:employeePublicId`).
- Full custom role permission editing — **shipped** (see `docs/ROLE_ACCESS_PERMISSIONS_PRD.md`); invite-as-custom-role still deferred.

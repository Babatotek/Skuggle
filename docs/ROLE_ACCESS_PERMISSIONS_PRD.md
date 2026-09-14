# Role Access & Permissions (tenant school roles)

9 September 2026.

## Goal

Let a **tenant Super Admin** create, view, edit, and delete **school-owned access roles** with delegable permissions — without mutating global platform role rows.

## Rules

1. Shared platform templates (Teacher, Principal, School Admin, Bursar, Examination Officer, Admission Officer) are **copied once per school** as editable defaults.
2. The Roles page lists **only this school’s roles** (`tenant_access_roles`), including those defaults plus any extra custom roles.
3. Platform templates remain available when creating a new role (`templateKey`) so schools can re-seed permission sets.
4. Only **delegable** registry permissions may be attached (no `platform.*`, no `tenants.manage`, etc.).
5. Effective grants = primary membership role permissions ∪ assigned school access-role permissions.
6. Assign school roles to memberships via `PATCH /school/memberships/{id}` `{ accessRoleId }` (Super Admin).
7. Delete is blocked while members are still assigned. Defaults are not auto-recreated after first provision.

## APIs

| Method | Path | Notes |
|---|---|---|
| GET | `/school/access-catalog` | Provisions defaults if needed; `roles` = school-owned; `templates` = shared starters |
| POST | `/school/access-roles` | Create; optional `templateKey` seeds delegable perms |
| PATCH | `/school/access-roles/{id}` | Update name/description/category and/or `permissions[]` |
| DELETE | `/school/access-roles/{id}` | Blocked while members are assigned |

## UI

Administration → People & Access → **Roles** → Create / View / Edit / Delete (⋮ menu).

## Out of scope (later)

- Custom role as the sole primary invite role (invites still use global role names)
- Inheritance trees / time-bound custom grants
- Tenant-authored brand-new permission keys

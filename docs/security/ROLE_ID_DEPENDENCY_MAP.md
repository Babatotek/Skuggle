# Role ID dependency map

Repository-wide search terms: `role_id`, `roleId`, `role`, `roles`, `membership->role`, `membership.role`, `currentRole`, `primaryRole`. The focused identifier search found 127 lines at baseline. Broad `role` matches include ordinary prose/CSS and are excluded below.

| Classification | Locations and retained contract |
|---|---|
| Authorization | `CanonicalAuthorizationEvaluator`, `EnsurePermission`, MFA middleware, `SchoolRoles`, policies and tenant context. `role_id` remains implicit authority; assignment roles add candidate grants only. |
| Presentation | `SessionPresenter`, `AuthController`, React `AppContext`, header/sidebar/dashboards/module views. Legacy `role` stays deterministic from `membership.role_id`; additive roles do not select navigation in Wave 5. |
| Administration | `TenantMembershipController`, platform controllers. Existing single-role mutation remains and is dual-written by the model hook. |
| Invitation | `TenantInvitation`, invitation migration/controller, registration controller. Invite remains single-primary and acceptance is dual-written. |
| Seeding | `ReferenceAccessSeeder`, `DemoUsersSeeder`, test support. Membership upserts automatically produce idempotent legacy-primary rows. |
| Onboarding | Registration, Google auth and personal workspace provisioning create memberships with `role_id`; the compatibility hook mirrors them. |
| Reporting | Platform ops and session payload display role name/label; no authorization decisions are moved into reporting. |
| Compatibility | `TenantMembership.role`, `permissionNames`, session `role`, frontend `roleId`/role branches and backfill `LEGACY_PRIMARY`. Retained through Wave 24. |
| Test fixture | `CreatesTenantUsers`, auth/personal-workspace/tenant-isolation/security tests create memberships directly; model dual-write makes fixtures representative. |

Role-name debt: `platform_super_admin`, `school_super_admin`, legacy `admin`/`proprietor`, and UI persona names encode realm or presentation semantics without explicit role metadata. No names were mass-renamed.

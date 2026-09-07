# Wave 4 Baseline

Recorded 2026-09-04 before Wave 4 implementation.

- HEAD: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Dirty worktree: 186 entries, all preserved as user-owned/Wave 0–3 work.
- Wave 3 report, changelog, context contract, current map, job envelope and cache/storage contract were present.
- Validation: 262 backend tests (909 assertions), architecture guard, Larastan, Pint, frontend typecheck and production build passed at the Wave 3 exit gate.

## Authorization baseline

`ReferenceAccessSeeder` owned 40 distinct legacy permission rows and 13 seeded roles. It directly synchronized role-permission pivots. `TenantMembership::permissionNames()` returned role grants. `EnsurePermission` performed string membership checks. Five policies performed local string checks after tenant context. Controllers used Laravel `authorize()`, route middleware literals, and several local permission intersections. `SessionPresenter` returned only a flat `permissions` array. No canonical registry or alias resolver existed.

Legacy keys: `platform.view`, `tenants.manage`, `users.manage`, `settings.configure`, `students.view`, `students.create`, `students.edit`, `students.import`, `students.medical.view`, `students.medical.edit`, `attendance.view`, `attendance.create`, `attendance.approve`, `assessments.view`, `assessment.create`, `scores.edit`, `scores.approve`, `results.view`, `results.approve`, `results.publish`, `reports.view`, `reports.export`, `finance.view`, `finance.manage`, `library.view`, `library.create`, `library.annotate`, `library.assign`, `library.version.manage`, `library.export`, `library.insights`, `ai.generate`, `roles.manage`, `security.manage`, `audit.view`, `admissions.manage`, `communication.send`, `operations.manage`, `services.manage`, `learning.manage`.

Role mappings were those declared in `ReferenceAccessSeeder`: platform_super_admin, proprietor, director, principal, head_teacher, school_super_admin, school_admin, admission_officer, examination_officer, bursar, teacher, parent and student plus legacy/test roles. School Super Admin excluded `platform.view` and `tenants.manage`; Platform Super Admin received the legacy set.

Frontend checks consumed `currentUser.permissions`, while pre-existing navigation/module code also contained baselined role-label checks. There were no existing explicit aliases. Principal risks were uncontrolled string invention, broad `.manage` meaning, no privilege metadata, no unknown-row report, repeated evaluation, and inability to compare legacy/canonical decisions.

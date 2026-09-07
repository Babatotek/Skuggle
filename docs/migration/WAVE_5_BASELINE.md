# Wave 5 baseline

Recorded 2026-09-04 before Wave 5 changes.

- Git: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`, branch `main`.
- Worktree: dirty with extensive frozen Wave 0–4 and product changes; preserved. The exact pre-change listing is retained in the execution transcript and `git status`.
- Membership schema: `tenant_memberships(id, tenant_id, user_id, role_id, status, joined_at, invited_by, timestamps)`; one membership per tenant/user. It had no public ID and `role_id` was required.
- Role schema: global `roles(id, name unique, label, privileged)` plus `role_permission`; roles have no tenant owner, active flag, precedence, or realm column.
- Runtime counts: not asserted. The configured development datastore was not safely available during rebaseline; tests use refreshed databases. Wave 5 reconciliation reports actual deployment counts.
- Authorization: Wave 4 canonical registry version 1 in `shadow` mode; evaluator read only `membership.role.permissions`, used request-local caching, tenant/status/realm checks, and retained legacy aliases.
- Administration: `/api/v1/school/memberships` supports one role; raw membership IDs are currently returned by that legacy API. Super Admin checks are role-name based.
- Invitations/onboarding/seeders: all write one `role_id`. The Wave 5 membership model compatibility hook now mirrors every such save to a canonical legacy-primary assignment.
- Session/bootstrap: `role`, `roleLabel`, and legacy permissions are existing contracts. They remain; `roles`, `assignments`, and `personaHint` are additive.
- Frontend debt: role/persona branching remains widespread in AppContext, shell, dashboards and module views. It is compatibility debt and is not refactored in Wave 5.
- Tests: Wave 4 registry/evaluator, tenant isolation, workspace switching, invitation, registration, seeder and security suites existed. Wave 5 adds focused assignment tests.

Schema deviations from the conceptual target: assignment `scope_type` defaults to `TENANT`; membership has no public ID to reference externally; role tenancy is inferred from platform capabilities because the frozen role table is global. Adding tenant-owned custom roles is residual debt, not silently invented here.

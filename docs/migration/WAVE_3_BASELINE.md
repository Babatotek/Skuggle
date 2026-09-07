# Wave 3 Baseline

Recorded 2026-09-04 before Wave 3 implementation.

## Repository identity

- Commit: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Worktree: dirty, 163 changed/untracked entries. All pre-existing changes are user-owned and are not attributed to Wave 3.
- Frozen evidence found: Wave 0–1 baseline/report/changelog and Wave 2 baseline/report/changelog.

## Validation baseline

- Backend: 254 tests, 868 assertions, passed in 59.10 seconds.
- Architecture guard: passed.
- Larastan governed baseline: passed with no errors across 227 files.
- Pint `--test`: passed.
- Frontend typecheck/build had passed immediately before this execution during the branding-sidebar repair.

## Current implementation inventory

`ResolveTenant` resolved active membership from session or `X-Tenant-Id`, activated a request-scoped `TenantContext`, and cleared it in `finally`. `TenantScope` failed closed with `1 = 0`; `BelongsToTenant` assigned `tenant_id` on create. The context held Tenant and optional Membership, but had no actor/workspace/correlation/version/principal contract and permitted mutation.

Tenant identity entered through login/session, compatibility header, workspace-switch payload validated against membership, invitations, public result/library records, job record IDs, and scheduler tenant iteration. Tenant routes were grouped behind `auth:sanctum, tenant`. Public result/library routes bypassed scopes and temporarily populated the privileged context. Platform controllers used permission middleware but had no explicit platform-context object.

Queued jobs were `GenerateReportJob`, `GenerateLibraryExportJob`, `ProcessSmartmarkBatch`, and `SendOutboundDelivery`. Each restored a tenant from scalar IDs or job records, and cleared context in `finally`, but none carried the mandatory immutable execution envelope.

Cache usage included tenant lookup keys, dashboards, attendance locks, assessment locks, practices, result-view tokens, health and global geography. Tenant key strings were partly ad hoc. Storage included library content, student files, SmartMark uploads, reports/exports, registration logos and branding logos. Some paths omitted a tenant prefix. Protected report/library downloads re-authorized through tenant-scoped records; public branding was intentionally public.

Known bypasses are governed by `docs/security/TENANT_SCOPE_BYPASS_REGISTRY.md`. Existing raw queries occur in scheduled snapshots, platform operations and maintenance. Search is implemented in tenant-scoped controllers, with explicitly public library search separated. Reports/exports preserved tenant through persisted job rows, but lacked an envelope.

## Baseline risks

1. Compatibility header could override the authenticated session selector.
2. Tenant context was mutable and under-specified.
3. Absence of tenant could not be distinguished from public/platform execution.
4. Job payloads lacked actor, membership, workspace, correlation and version evidence.
5. Cache and storage namespaces were not canonical.
6. Public controllers reused privileged tenant context as compatibility behavior.

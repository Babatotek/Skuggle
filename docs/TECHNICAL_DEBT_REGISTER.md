# Technical debt register

The migration-scoped register remains at `docs/migration/TECHNICAL_DEBT_REGISTER.md`.

## Wave 5 closure blockers — 2026-09-04

- IAM-008: backfill tenant ordering conflicts with ID-cursor pagination, causing repeated scans and unreliable progress/resume evidence. Must be corrected and proven with dry-run, cursor, tenant-filter and inactive-membership executions.
- IAM-009: architecture guard has not reviewed the two security-domain writes in `RoleAssignmentService`.
- IAM-010: executable persona parity, delegation matrix, multi-role revoke/stability and compatibility-producer reconciliation coverage is incomplete.
- REL-001: repository `git diff --check` fails at `src/features/results/ResultsManagementView.tsx:409`; unrelated to Wave 5 but prevents the required closure gate.
- PERF-005: production authorization p95 is not measured. Required before broad assignment-read cutover, not before correcting code-level blockers.

## Wave 5 remediation closure

- IAM-008 traversal/accounting: RESOLVED with monotonic membership-ID pagination.
- IAM-009 architecture boundary: RESOLVED with one file-specific two-operation approval.
- IAM-010 parity/delegation/producer evidence: RESOLVED with executable coverage.
- REL-001 EOF whitespace: RESOLVED without semantic Results changes.
- PERF-005 remains OPEN: **PRODUCTION P95: NOT YET MEASURED**.

## Wave 6 residual debt — 2026-09-04

- FE-STATE-001: 20 baseline domain/feature collections remain in the `LegacyAppContextAdapter`; ownership migrates with their scheduled domain waves. The architecture guard rejects adding another root collection.
- FE-STATE-002: demo-only JSON persistence contains domain payload compatibility. It is unreachable while `demoMode` is false and must be removed with demo retirement; production authority remains the server session.
- FE-STATE-003: legacy `CurrentUser.currentWorkspace/permissions/capabilities` shape remains as a derived facade. New consumers must use Workspace/Access contexts.
- FE-STATE-004: browser persona smoke evidence is unavailable in this execution environment. Deterministic state/security tests are green; authenticated manual smoke remains release evidence.
- FE-PERF-001: browser render counts and time-to-usable-shell were not measurable. Bootstrap maximum remains one `/auth/me` plus 11 permission-conditioned collection requests; no package or request was added.

## Wave 7 residual debt — 2026-09-04

- FE-ROUTE-001: `LegacyPageAdapter` is temporary. Owner: Frontend Platform. Target: Wave 8–10.
- FE-ROUTE-002: legacy `/app/{tab}` aliases remain until Wave 24 bookmark drain. Owner: Frontend Platform.
- FE-ROUTE-003: browser routing smoke is unrun in this environment. Owner: Release Operations.
- FE-ROUTE-004: `router-vendor` adds 15.23 kB gzip to the production graph by ADR; not unexplained startup debt.

# Role assignment shadow parity

## Final remediation evidence

Executable comparison produced `MATCH` for Platform Super Admin, School Super Admin, School Admin, Principal, Teacher, Examination Officer, Bursar, Parent and Student. No legacy-only, assignment-only or privilege-boundary mismatch was observed. Production remains SHADOW/controlled dual-write pending deployment reconciliation and telemetry.

Final closure status (2026-09-04): persona-by-persona executable parity evidence is incomplete. Remain in `SHADOW`; no assignment-only cutover is approved. See the Wave 5 final execution handoff.

Feature configuration is `IAM_ROLE_ASSIGNMENTS_MODE` with tenant cohort list `IAM_ROLE_ASSIGNMENTS_CANARY_TENANTS`. Supported operational values are `OFF`, `SHADOW`, `DUAL_WRITE`, `CANARY_READ`, `PILOT`, `DEFAULT_ASSIGNMENTS`, and `LEGACY_FALLBACK`; Wave 5 ships safely in `SHADOW`.

`AuthorizationShadowEvaluator::compareCapabilitySets` reports `MATCH`, `LEGACY_ONLY_CAPABILITY`, or `ASSIGNMENT_ONLY_CAPABILITY`, internal tenant/membership IDs, and whether a privileged/platform-critical difference blocks enforcement. Existing point comparisons retain allow/deny categories. Scope, expiry, primary-role, unknown-role, and realm failures are separately observable through reason-coded service/backfill logs. No names or emails are emitted.

Rollout: migrate schema; deploy implicit fallback; backfill; require reconciliation invalid=0; shadow; dual write; internal tenant; deterministic canary/pilot cohorts; default assignment read; retain `role_id`. Any privileged mismatch stops cutover. Rollback disables assignment reads and dual write, returns to implicit `role_id`, and retains additive rows for later reconciliation.

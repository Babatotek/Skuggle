# Wave 5 multi-role implementation report

> Final verification on 2026-09-04 supersedes the earlier implementation assessment: Wave 5 closure is **BLOCKED**. See `WAVE_5_FINAL_EXECUTION_HANDOFF.md` for exact evidence and blockers.

> Remediation closure on 2026-09-04 resolved every recorded code-level blocker. Historical evidence remains in the handoff; the final decision is **WAVE 5: PASSED**.

## Exit assessment

Wave 5 implements expansion, implicit compatibility, backfill, union evaluation, controlled mutation, additive bootstrap and rollback controls. `tenant_memberships.role_id` remains unchanged. No Wave 6+ work was performed.

## Implementation summary

Baseline and the complete dependency classification are in `WAVE_5_BASELINE.md` and `ROLE_ID_DEPENDENCY_MAP.md`. The new table stores ULID, membership/role, tenant-or-campus scope, lifecycle dates/status, structured source, primary marker, actor and reason. Foreign keys protect membership/role/actor integrity; service validation supplies cross-table tenant/realm invariants that MySQL cannot express as a simple FK.

Legacy `role_id` is always an implicit assignment. Explicit grants are eager-loaded in one aggregate and canonical capabilities are unioned by role, while existing tenant checks and resource policies continue deciding actual resource access. `LEGACY_PRIMARY` rows are identifiable and de-duplicated. Time validity is checked at evaluation time.

`RoleAssignmentService` is the mutation boundary. Transactions plus membership/assignment row locks prevent duplicate grants and lost revokes. It validates tenant, platform realm, scope, actor authorization, delegability, held capabilities and self-grant. Mutations audit actor (through the existing logger), tenant, membership, role, scope, operation, reason and correlation/request ID without PII, and invalidate request-local capability cache.

The existing membership save path performs compatibility dual write in every current producer: legacy admin APIs, invitations, registration/onboarding, Google/personal provisioning, seeders and fixtures. `role_id` remains the deterministic presentation/persona role; explicit secondary assignments never overwrite it. Session output retains `role`, `roleLabel`, and permissions while adding roles, assignments, capabilities and persona hint.

Backfill is tenant-filterable, lazy/bounded, resumable by cursor, idempotent, retry-safe, dry-runnable and machine-reconcilable. It is suitable for Hostinger CLI without a resident worker. Reconciliation proves equivalent row presence and duplicate absence; capability-set parity supplies the cutover check.

Feature mode defaults to `SHADOW`, supports deterministic tenant cohorts, and documents the schema→backfill→shadow→dual-write→canary→pilot→default progression. Rollback sets reads/writes back to legacy and retains rows. Privileged mismatch blocks cutover.

## Performance

Legacy evaluation used loaded role permissions and zero repeat queries. Multi-role evaluation uses a single assignment query with nested eager-loaded roles/permissions when not bootstrapped; repeated checks use a request-local cache and add zero queries. Bootstrap loads assignments once. The Wave 4 repeat-query regression test remains the quantitative guard. Production p95 comparison is still required before progressing beyond pilot; no production traffic dataset exists in this repository, so a claimed percentage would be fabricated.

## Tests and verification

Coverage includes schema creation/public IDs, implicit legacy behavior, idempotent backfill, union, future/expired/revoked exclusion, realm/scope rejection and self-grant denial, plus existing Wave 4 tests. Full regression, Pint, Larastan, frontend validation and production build results are recorded in the final execution handoff.

## Residual risks

- Frozen roles are global and lack tenant owner/active/explicit realm/precedence metadata. Custom tenant roles therefore cannot be safely introduced until that schema is approved.
- The legacy membership administration endpoint exposes numeric membership IDs; it was not rebuilt because public-ID policy migration is outside this additive compatibility slice.
- Database constraints cannot encode campus tenant equality or role realm; service enforcement and tests are mandatory.
- Scheduled expiry does not need a job for denial, but an optional later job may emit material expiry audit events.
- Production performance and concurrency require environment telemetry/load testing before pilot cutover.

## Files changed

Migration/model/relationships, `RoleAssignmentService`, canonical and shadow evaluators, session presenter, config/env, backfill command, Wave 5 tests, six required documents, and debt registers. Existing unrelated dirty files were preserved.

## Rollback

Set mode `OFF`/`LEGACY_FALLBACK`, stop explicit assignment writes, continue evaluating `role_id`, retain the table and rows, and reconcile later. Do not drop data in an ordinary rollback.

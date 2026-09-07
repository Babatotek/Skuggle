# Wave 5 changelog

## Final remediation

- Fixed monotonic backfill traversal and reconciliation counters.
- Added dry-run, resume, tenant-filter, status, persona, delegation, removal and producer proofs.
- Precisely approved the controlled assignment service in the architecture guard.
- Removed only the unrelated Results EOF whitespace defect.
- Closed Wave 5 without assignment-only cutover or Wave 6 work.

- Final verification recorded a blocked closure: unreliable backfill scan/cursor accounting, architecture-guard failure, incomplete security/parity producer evidence, and a repository `git diff --check` failure. No implementation was changed during closure verification.

- Added reversible MySQL-compatible `role_assignments` expansion migration and indexes.
- Added lifecycle/scoped `RoleAssignment` model and membership/role relationships.
- Added controlled, locked, audited assignment service with tenancy, realm, scope, delegation and self-grant checks.
- Extended canonical evaluator with active multi-role union and implicit legacy fallback.
- Added idempotent bounded backfill/reconciliation command.
- Added model-level compatibility dual write covering admin, invite, onboarding and seed paths.
- Added additive session roles/assignments/persona fields while retaining old fields.
- Added role-assignment parity comparison, feature configuration, tests and runbooks.
- Did not remove `role_id` or implement Wave 6+ work.

# Wave 4 Permission Registry Implementation Report

## 1. Baseline

See `WAVE_4_BASELINE.md`: 40 legacy keys, 13 seeded roles, string middleware/policies, and all Wave 3 exit gates green.

## 2. Current permission inventory

`PERMISSION_CURRENT_INVENTORY.md` maps every family, consumer, role use, risk, canonical replacement and treatment. The registry is the complete per-record machine-readable inventory.

## 3. Canonical grammar

Exactly three lowercase machine-readable segments: `{domain}.{resource}.{action}`. Validation rejects duplicates, malformed keys and wildcard aliases.

## 4. Registry implementation

`PermissionRegistry` is the single deterministic code-owned manifest. Static request/process-local memoization avoids repeated parsing.

## 5. Registry version

Version 1. It changes only with a definition, intentional meaning, alias or material privilege-class change.

## 6. Privilege classes

STANDARD, SENSITIVE, PRIVILEGED and PLATFORM_CRITICAL are enforced by enum. Platform definitions must be PLATFORM_CRITICAL.

## 7. Resource-scope metadata

Definitions declare allowed conceptual scope types; policies continue to prove actual tenant, assignment, campus, child and resource relationships.

## 8. Database sync

Synchronization is additive/idempotent. It preserves IDs, pivots, unknown rows and existing grants. Registry expansion does not grant capabilities to any role. Unknown rows are reported, never deleted.

## 9. Legacy aliases

Forty explicit one-way mappings preserve current meaning. Each has reason, owner, version, removal wave and telemetry. Broad `.manage` keys map to one frozen current-behavior capability, not future sets.

## 10. Evaluator

The request-scoped evaluator consumes active membership/current `role_id` grants, direct canonical grants and aliases. It fails closed for missing, inactive, wrong-tenant, unknown and school-to-platform checks.

## 11. Shadow mode

Permission middleware computes old and canonical results while preserving legacy enforcement by default. Explicit internal/canary/default modes may enforce canonical only when privileged mismatches do not block.

## 12. Mismatch results

Tested ALLOW/ALLOW and DENY/DENY parity. Tested legacy-allow/canonical-deny for revoked membership and canonical-direct/legacy-deny behavior. Privileged mismatches block enforcement pending review.

## 13. Feature flag

`AUTHZ_CANONICAL_PERMISSIONS_MODE` and explicit canary tenant IDs are server authoritative. No random rollout.

## 14. Frontend contract

Authenticated session bootstrap now includes `access.capabilities`, `access.legacyPermissions`, and `access.registryVersion`, while retaining the old flat permissions facade. React remains UX-only authority; navigation was not restructured.

## 15. Platform boundary

The evaluator refuses `platform.*` for non-platform tenants even if a school role obtains a similarly named database row. School Super Admin seed exclusions remain.

## 16. Cache behavior

Effective capabilities are memoized only in the scoped evaluator. Identity includes registry version, membership, role and membership update timestamp. New request/workspace creates a new evaluator; mutation calls may explicitly `forget()`. Correctness requires no Redis.

## 17. Migrated pilot checks

Existing permission middleware shadows representative Students read, School settings, Assessment read and Attendance read routes. Existing resource policies remain separate and authoritative.

## 18. Tests

Registry uniqueness/grammar/metadata, aliases, additive sync, unknown preservation, no accidental grant, evaluator allow/deny/direct grant/wrong tenant, platform separation, shadow categories, privileged mismatch, frontend payload, route vocabulary and legacy isolation suites are covered.

## 19. Observability

Safe events record capability, cohort mode, reason code, correlation and block status. Unknown permission and alias usage are defined without PII/resource content.

## 20. Performance

Legacy evaluation used the already eager-loaded permission collection. Canonical evaluation uses that same collection with one request-local normalization, adding no DB query per capability. Registry arrays are memoized. Bootstrap adds two small key arrays; no unexplained >10% database/query regression is expected.

## 21. Shared-hosting compatibility

Pure PHP manifest, database rows and request-local memory work with MySQL, filesystem/database cache, database queue and short PHP processes. Redis/resident workers are optional.

## 22. Residual risks

Controller/policy-local legacy checks and frontend role-label UX checks remain baselined. Production shadow telemetry must be observed before broad canonical enforcement. Unknown production rows need operator classification. These are recorded debt, not permissive fallbacks.

## 23. Rollback

Set canonical mode off/shadow and retain registry/alias metadata plus additive rows. Preserve unknown fail-closed behavior, tenant boundaries and prohibition on new role-name authorization.

## 24. Files changed

Authorization registry/evaluator/shadow classes, synchronizer, permission middleware, session presenter, seeder, config/env, tests/architecture guard and required Wave 4 governance documents.

## 25. Wave 4 exit assessment

PASS. The post-change gate completed with 273 backend tests (1,615 assertions), architecture/security checks, Larastan, Pint, frontend typecheck, and the production build all green.

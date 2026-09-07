# Tenant Context Contract v2

## Authenticated tenant context

`TenantContext` is request/job scoped and fail closed. Once active, its tenant cannot change until `clear()` is called at a controlled boundary. It exposes tenant ID/public ID through the Tenant model, membership ID, actor ID, workspace type, correlation ID, principal kind and contract version 2. Membership and tenant must agree.

Resolution proof is `authenticated user -> active membership -> active/trial tenant -> explicit workspace`. Payload fields such as `tenant_id` and `school_id` are never authority. `X-Tenant-Id` is compatibility input only: when a session selector exists, mismatch is rejected with 403 and reason-code telemetry.

Missing context never implies global access. Tenant-owned Eloquent models return no rows without context and cannot be created. Cross-tenant resource lookup therefore uses 404 semantics.

## Context classes

- `TenantContext`: private authenticated or explicitly named internal-system tenant execution.
- `PublicTenantContext`: published tenant projection only; it contains no membership or platform privilege.
- `PlatformContext`: explicit actor, capability and correlation proof. Its absence is never platform authority.

Legacy `setPublicTenant()` remains temporarily as a Wave 3 compatibility adapter. Owner: Platform Architecture. Telemetry/removal: migrate public controllers to `PublicTenantContext` before Wave 24 removal.

## Lifecycle

HTTP middleware and job handlers activate once and clear in `finally`. Scheduled tenant loops clear before each activation and after each unit. A context cannot be switched in place. Academic session, term and campus remain subordinate scopes and must resolve through the active tenant.

## Rollout

Server flag `TENANT_CONTEXT_V2_MODE` supports `off`, `shadow`, `internal`, `canary`, and default-new rollout policy. Canary tenant public IDs are explicit; random percentage rollout is forbidden. Current default is `shadow` while v2 invariants are enforced for newly migrated paths.

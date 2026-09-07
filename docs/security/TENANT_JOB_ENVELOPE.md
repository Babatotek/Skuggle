# Tenant Job Envelope

Every tenant-owned queued job carries a serialized `TenantJobEnvelope` v2:

- `tenantId`, `workspaceType`
- `actorId` and `membershipId`, or a named `systemPrincipal`
- `correlationId`
- `version`

An Eloquent Tenant is never serialized as authorization evidence. At execution the envelope validates version and shape, confirms an active/trial tenant of the expected workspace type, and revalidates active membership against actor and tenant. The job then locates its record with an explicit tenant predicate, activates context, performs bounded/idempotent work, and clears context in `finally` on success or failure.

Malformed, deleted/suspended tenant, stale/revoked membership and cross-tenant record conditions fail execution. Retries repeat validation. Sequential jobs cannot inherit context because every handler clears it. Database queues and short cron workers require no resident-process assumptions or Redis.

Migrated jobs: report generation, library export generation, SmartMark processing and outbound delivery.

# Wave 3 Changelog

| ID | Requirement | Files | Why | Tests | Risk / rollback |
|---|---|---|---|---|---|
| W3-01 | Canonical immutable context | `TenantContext`, `PublicTenantContext`, `PlatformContext`, provider | Make missing/public/platform states explicit and stop in-unit tenant mutation | WaveThreeTenantContextTest, tenant isolation suite | Compatibility callers may need clear; disable v2 selection, retain fail-closed scope |
| W3-02 | Trusted HTTP resolution | `ResolveTenant` | Reject header/session tenant mismatch and attach correlation/version | mismatch and existing middleware tests | Clients with contradictory headers receive 403; remove header after client correction, never relax membership proof |
| W3-03 | Job envelope | `TenantJobEnvelope`, four jobs and dispatch sites | Preserve tenant/principal/correlation across queue boundary and revalidate execution | envelope sequential/revoked tests plus full suite | Old queued payloads lack envelope; drain queues before deployment or use controlled legacy release rollback |
| W3-04 | Cache namespace | `TenantCacheKey`, `TenantContext` | Canonical environment/version/tenant/resource/scope identity | cache namespace test, existing lookup cache tests | Existing v1 entries cold miss; harmless, revert callers without sharing keys |
| W3-05 | Storage namespace | `TenantStoragePath`, `BrandingController` | Prevent collisions and record classification/ownership/checksum | branding upload and namespace tests | Existing logo remains readable; new replacement path only; revert helper while retaining metadata |
| W3-06 | Scheduled lifecycle | `RebuildDashboardSnapshots`, platform broadcast/provisioner boundaries | Clear context before controlled tenant changes | full command/backend suite | No data migration; revert lifecycle adapter only if needed |
| W3-07 | Governance | Wave 3 architecture/security/migration documents and registries | Record contract, inventory, rollout, residual risk and rollback | document review/architecture guard | Documentation-only rollback |

No destructive schema change, Permission Registry, RoleAssignment, `role_id` removal, AppContext/router/shell/navigation or domain migration was performed.

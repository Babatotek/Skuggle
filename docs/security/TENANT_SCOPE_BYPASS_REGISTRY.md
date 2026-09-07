# Tenant scope bypass registry

Owner for all entries: Security Engineering. Review condition: every migration wave and whenever a call site changes. Audit requirement: denial/signature anomalies and platform access are logged; tenant IDs are never accepted solely from payloads.

| Class | File/method | Purpose / principal | Tenant behavior | Tests | Status / expiry |
|---|---|---|---|---|---|
| Valid platform operation | `PlatformController`, `PlatformOpsController` | platform-only fleet summaries and billing operations; platform-authorized principal | intentionally cross-tenant, limited projections/internal foreign keys | platform route middleware and security workflow tests | permitted; review Wave 4 |
| Valid public projection | `LibraryResourceController` public methods | published library projection; anonymous/throttled | requires `is_public`, `published`, then establishes public tenant | public library tests/debt TEST-007 | permitted; consolidate Wave 5 |
| Valid public operation | `PublicResultController` | signed published result view | opaque signed token, published state, then tenant context | `ResultPublishPinFlowTest` | permitted |
| Valid public operation | `PaymentController::webhook` | payment provider callback | constant-time HMAC, provider + opaque reference; model is not tenant scoped | debt TEST-005 | permitted; review on provider change |
| Valid infrastructure write | `AuditLogger`, `Idempotency` | audit append / replay protection | explicit tenant/user/key fields; no broad tenant read | global-scope and idempotency suites | permitted |
| Valid job/maintenance | report/library export jobs; prune commands; seeders | queued record recovery, expiry cleanup, controlled seed | internal PK then establishes context, or CLI/platform operation | report/export/global-scope suites | permitted; seeders never runtime API |
| Valid maintenance | `DatabaseBackupService`, migration/maintenance commands | operator-controlled backup/schema work | database-wide by design; no user endpoint | operations tests | permitted |
| Tenant-explicit raw query | dashboard, library, sequences, class-subject writes | tenant application operation | explicit active-context `tenant_id` predicate/write | tenant suites | permitted; migrate to helper later |

No unsafe P0 bypass was found in the current runtime scan. The older `backend/deploy/GLOBAL_SCOPE_BYPASS_AUDIT.md` remains historical detail; this registry is the Wave 0 ownership record. Unverified endpoint-specific P1 cases are tracked in the technical debt register and may not be copied to new code.
# Wave 3 additions

| Location | Bypass | Principal/context | Justification | Owner | Removal/review |
|---|---|---|---|---|---|
| `GenerateReportJob` | `ReportJob::withoutGlobalScopes()` with `tenant_id` predicate | Validated TenantJobEnvelope v2 | Locate envelope-owned job before scoped report generation | Reporting | Review Wave 24 |
| `GenerateLibraryExportJob` | `ExportJob::withoutGlobalScopes()` with `tenant_id` predicate | Validated TenantJobEnvelope v2 | Locate envelope-owned export before scoped generation | Library | Review Wave 24 |
| `PruneExports` | expired export/report global scan | Named platform-maintenance CLI | Bounded expiry cleanup; never serves records | SRE | Annual review |

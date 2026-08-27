# withoutGlobalScopes() Audit Register

**Last audited:** 2026-08-26  
**Total call sites:** 25  
**Risk classification:** ✅ SAFE (17) · ⚠️ REVIEW (8) · 🚨 UNSAFE (0)

All `withoutGlobalScopes()` calls in the codebase must be listed here.
Any new usage must be reviewed, classified, and added before merging.

> **Rule:** If no explicit `WHERE tenant_id = ?` (or equivalent ownership
> check) follows immediately after `withoutGlobalScopes()`, the call is
> classified ⚠️ and must be upgraded to ✅ or removed.

---

## ✅ SAFE — Explicitly re-filters by tenant_id or non-tenant model

| # | File | Line(s) | Model | Justification |
|---|------|---------|-------|---------------|
| 1 | `app/Jobs/GenerateLibraryExportJob.php` | 42 | `ExportJob` | Background job — fetches its own job record by PK, then calls `$context->set($tenant, $membership)` before any tenant-scoped queries. Pattern: load → set context → query. |
| 2 | `app/Jobs/GenerateLibraryExportJob.php` | 80 | `ExportJob` | `failed()` handler — updates its own job row by PK only. No cross-tenant query possible. |
| 3 | `app/Jobs/GenerateReportJob.php` | 43 | `ReportJob` | Same background-job pattern as #1. |
| 4 | `app/Jobs/GenerateReportJob.php` | 79 | `ReportJob` | `failed()` handler — same as #2. |
| 5 | `app/Console/Commands/PruneExports.php` | 22 | `ExportJob` | Artisan command running as platform superuser. Must iterate all tenants. Follows up with `expires_at < now()` filter and per-row `$disk->delete()` — no cross-tenant data exposed to users. |
| 6 | `app/Console/Commands/PruneExports.php` | 37 | `ReportJob` | Same as #5. |
| 7 | `app/Services/AuditLogger.php` | 24 | `AuditLog` | Audit log is intentionally cross-tenant. Table has nullable `tenant_id`; this is by design. Writing only, no reads. |
| 8 | `app/Http/Middleware/Idempotency.php` | 37 | `IdempotencyKey` | Lookup is scoped with explicit `WHERE tenant_id = ? AND user_id = ? AND key = ?` — three-column composite match. |
| 9 | `app/Http/Middleware/Idempotency.php` | 52 | `IdempotencyKey` | `create()` call includes explicit `tenant_id` column. |
| 10 | `app/Http/Middleware/Idempotency.php` | 61 | `IdempotencyKey` | Race-condition retry — same three-column scope as #8. |
| 11 | `app/Http/Controllers/Api/V1/PaymentController.php` | 81 | `PaymentTransaction` | Webhook handler — scoped by `WHERE provider = ? AND provider_reference = ?`. `PaymentTransaction` is NOT tenant-scoped (no `BelongsToTenant`), so bypassing TenantScope is harmless. |
| 12 | `app/Http/Controllers/Api/V1/LibraryResourceController.php` | 99 | `LibraryResource` | Public resource — filtered `WHERE public_id=? AND is_public=1 AND status='published'`, then `setPublicTenant()` called immediately. |
| 13 | `app/Http/Controllers/Api/V1/LibraryResourceController.php` | 46 | `LibraryResource` | `publicCurriculum()` — filters `WHERE is_public=1 AND status='published'`. No private data possible. |
| 14 | `app/Http/Controllers/Api/V1/InviteController.php` | 193 | `TenantInvitation` | Public invite acceptance — scoped by `WHERE token_hash = ?` (SHA-256 of opaque token). No tenant context yet; loads invite + tenant for provisioning only. |
| 15 | `app/Http/Controllers/Api/V1/RegistrationController.php` | 149 | `TenantInvitation` | Same invite-token lookup as #14 during individual registration with invite code. Validates email match before tenant membership is created. |
| 16 | `app/Http/Controllers/Api/V1/PublicResultController.php` | 114 | `ResultPublication` | Public result view — scoped by PK from signed cache token + `status=published`, then `setPublicTenant()` before nested queries. |
| 17 | `app/Http/Controllers/Api/V1/PlatformOpsController.php` | 260 | `Subscription` | Platform invoice generation — cross-tenant subscription iteration. Route protected by platform ops middleware; creates invoices with explicit `tenant_id`. |

---

## ⚠️ REVIEW — Platform superuser queries (intentionally cross-tenant, must stay protected by platform auth)

| # | File | Lines | Model | Risk & Mitigation |
|---|------|-------|-------|-------------------|
| 14 | `app/Http/Controllers/Api/V1/PlatformController.php` | 158 | `Student` | `usage()` summary count — `withoutGlobalScopes()->where('status','active')->count()`. Platform admin only. **Verify** `IsPlatformAdmin` gate applied on route. No record content exposed — count only. |
| 15 | `app/Http/Controllers/Api/V1/PlatformController.php` | 96 | `Subscription` | `subscriptions()` paginator — all subscriptions across tenants. Platform admin endpoint. **Verify** route gate. |
| 16 | `app/Http/Controllers/Api/V1/PlatformController.php` | 322 | `Student` | `overview()` managed students count — same as #14. |
| 17 | `app/Http/Controllers/Api/V1/PlatformController.php` | 340 | `Student` | `overview()` students-this-month count. Same as #14. |
| 18 | `app/Http/Controllers/Api/V1/PlatformController.php` | 380 | `Subscription` | `overview()` live subscriptions with plan eager-load. Same as #15. |
| 19 | `app/Http/Controllers/Api/V1/LibraryResourceController.php` | ~165 | `LibraryResource` | `publicAssistant()` and `publicPractice()` — filtered `WHERE public_id=? AND is_public=1 AND status='published'`, then `setPublicTenant()`. Similar to #12 — should be consolidated. |
| 20 | `app/Http/Controllers/Api/V1/LibraryResourceController.php` | ~180 | `LibraryResource` | `publicPractice()` and `gradePractice()` public path — same pattern. Confirm `setPublicTenant()` always called before nested tenant-scoped queries. |
| 21 | `app/Http/Controllers/Api/V1/LibraryResourceController.php` | ~46 | `LibraryResource` | `publicIndex()` page query — `WHERE is_public=1 AND status='published'`. Safe as written but can grow; add explicit column projection to prevent info leakage on schema changes. |

---

## 🔴 Action Items

### CRITICAL (before production launch)
1. **Verify PlatformController routes are gated by `IsPlatformAdmin`.**
   Run: `php artisan route:list --path=platform` and confirm every route
   has `permission:platform.admin` or equivalent middleware.

2. **Add a CI/CD lint rule** (see `scripts/check-global-scope-bypass.php`)
   that rejects any new `withoutGlobalScopes()` call not listed in this file.

### HIGH (within first sprint)
3. **Consolidate the three public-library bypass patterns** (#12, #19, #20, #21)
   into a single `PublicResourceResolver` service that centralises
   the `is_public` + `setPublicTenant` flow.

4. **Add projection** to PlatformController queries (select specific columns)
   to prevent new sensitive columns being returned if schema changes.

---

## Adding a new withoutGlobalScopes() call — checklist

Before adding a new bypass:

- [ ] Is the model tenant-scoped? If not, bypass is unnecessary — remove it.
- [ ] Does the query immediately apply `WHERE tenant_id = $specificId`?
- [ ] If cross-tenant (superuser only), is the route protected by a platform-admin gate?
- [ ] Is it a write operation? Confirm `tenant_id` is explicitly set on the record.
- [ ] Add an entry to this file with justification.
- [ ] Run `php artisan test --filter TenantIsolationTest` — all 13 must pass.

---

## Static analysis enforcement

`scripts/check-global-scope-bypass.php` counts `withoutGlobalScopes()` calls
at CI time. If the count exceeds the registered total (21), the build fails.

Run manually:
```bash
php scripts/check-global-scope-bypass.php
```

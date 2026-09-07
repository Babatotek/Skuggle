# Role assignment backfill

Final verification warning (2026-09-04): the disposable run reconciled 11/11 rows with zero duplicates and a zero-create second run, but reported 16 processed for 11 eligible memberships. The tenant-first ordering currently conflicts with ID cursor pagination. Treat resume/progress output as unverified and do not run production backfill until corrected and re-proven.

Run after schema expansion:

```bash
php artisan iam:backfill-role-assignments --dry-run --reconcile --json --batch=200
php artisan iam:backfill-role-assignments --reconcile --json --batch=200
```

Options: `--tenant=<tenant-public-ulid>`, `--after=<membership-id>` resume cursor, `--batch=1..1000`, `--limit=<n>`, `--dry-run`, `--reconcile`, `--json`. Processing is lazy, bounded, retry-safe, and commits per membership rather than one unbounded transaction. Output contains processed/created/failures/resume cursor and machine-readable eligible/missing/duplicate/invalid counts. Errors log only internal IDs and exception class.

Rows use source `LEGACY_PRIMARY`, `TENANT` scope and primary marker. The unique identity plus upsert makes reruns idempotent. Inactive memberships are backfilled intentionally for state parity but remain unauthorized because evaluator rejects inactive membership status.

Shared hosting needs only a short-lived CLI process. Repeat with `--after` and a suitable `--limit`; no resident worker is required.

## Remediation verification

Traversal uses ascending unique membership ID; tenant mode filters first. Output distinguishes `created` from `would_create` and reports eligible, processed_unique, existing, skipped, missing, duplicates, invalid and failures. ACTIVE, INACTIVE and REVOKED memberships are backfilled for history, while only ACTIVE authorizes. Verified: complete 6/6, rerun zero created/duplicates, resume 2+3, Tenant A 3/3 with Tenant B unchanged.

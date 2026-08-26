# Hostinger Shared — Backup & Disaster Recovery

## Scope

This runbook applies to Skuggle on **Hostinger shared hosting** with MySQL and local/object file storage. Hostinger account backups remain the first safety net; Skuggle also registers logical dumps via artisan.

## Automated backups (application)

Ensure cron runs `php artisan schedule:run` every minute (`backend/deploy/shared-hosting/cron.txt`).

| Job | Schedule | Command |
|-----|----------|---------|
| Database dump | Daily 02:15 | `php artisan backup:database --trigger=scheduled` |
| Storage archive | Sunday 03:00 | `php artisan backup:files` |

Artifacts land in `storage/app/backups/` and are listed in Platform HQ → More → Backups (`platform_backup_snapshots`).

Manual:

```bash
php artisan backup:database --trigger=manual
php artisan backup:files
```

Copy dumps **off-host** (encrypted drive or object storage). Do not rely on the app disk alone.

## Daily / weekly checklist

1. Confirm Hostinger automatic backups are enabled for the hosting plan.
2. Confirm the latest `platform_backup_snapshots` row is < 48h old (`php artisan ops:go-live-check`).
3. Archive / sync `storage/app/backups` off-host.
4. If `LIBRARY_DISK=s3`, confirm bucket versioning / lifecycle.

## Restore drill (quarterly)

1. Create a staging subdomain / temporary database.
2. Gunzip and import the latest `.sql.gz` from `storage/app/backups`.
3. Restore `storage/app` files (or point `LIBRARY_DISK` at a restored bucket prefix).
4. Set `APP_KEY` to the **same** production key used when data was encrypted.
5. Run `php artisan config:clear` and hit `/health/ready` (and `/ready`).
6. Spot-check login, student list, and one library resource.
7. Record pass/fail, RTO, and sign-off in `docs/RESTORE_DRILL_SIGN_OFF.md`.

## R2 / S3 note

If `LIBRARY_DISK=s3`, file restore is bucket versioning / object lifecycle — keep MySQL backups synchronized with object keys.

## Not covered on shared hosting

- Automated multi-region failover
- Horizon / Redis persistence
- Point-in-time recovery beyond Hostinger plan features

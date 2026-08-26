# Go-live operations runbook

Execute these gates on the **target host** before onboarding live school PII.

## 1. Privileged MFA enrollment

```bash
cd backend
php artisan mfa:privileged-status
php artisan mfa:privileged-status --strict
```

For each `missing` row:

1. Sign in as that user on the production frontend.
2. Open `/security/mfa` (workspace also redirects privileged users here until MFA is confirmed).
3. Scan the authenticator QR, confirm the 6-digit code, store recovery codes offline.
4. Re-run `mfa:privileged-status --strict` until it exits 0.

HQ view: Super Admin → System health → Go-live gates (`GET /api/v1/platform/go-live`).

## 2. Mail delivery

Set production SMTP in `.env` (see `backend/.env.example`):

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=no-reply@your-domain
MAIL_FROM_NAME="${APP_NAME}"
```

Then:

```bash
php artisan config:clear
php artisan mail:smoke ops@your-domain
php artisan queue:work --stop-when-empty   # invite emails are queued
```

Prove end-to-end:

1. Register a throwaway school / user → verification email arrives.
2. Forgot password → reset link opens `{FRONTEND_URL}/reset-password?...`.
3. School admin invites a staff member → invitation email arrives with join link.

## 3. Backup + restore drill

Nightly dump is scheduled at **02:15** (`backup:database`). Weekly file archive Sunday **03:00** (`backup:files`). Cron must run `schedule:run` (see `backend/deploy/shared-hosting/cron.txt`).

```bash
php artisan backup:database --trigger=manual
php artisan backup:files
ls -lah storage/app/backups
```

Complete a restore drill using `docs/BACKUP_DR_HOSTINGER.md` and record the result in `docs/RESTORE_DRILL_SIGN_OFF.md`.

## 4. Security sign-off

1. Run CI security workflows (`.github/workflows/security.yml`).
2. Walk `backend/deploy/PENETRATION_TESTING_CHECKLIST.md` on staging.
3. Fill `docs/SECURITY_SIGN_OFF.md` and set **Decision: Approved** (or Accepted with residual risk).

## Aggregate check

```bash
php artisan ops:go-live-check
php artisan ops:go-live-check --strict
```

`--strict` fails if MFA, mail (in production), or fresh backup gates are incomplete.

# Hostinger shared hosting

Deploy the Laravel API + Vite SPA on Hostinger shared hosting without Redis or Horizon.

## Layout

```text
/home/USER/domains/skuggle.royalgatewayadmin.com/
  application/     # Laravel app root (artisan, app/, vendor/, .env)
  public_html/     # Document root → SPA assets + index.php bridge + .htaccess
```

`public_html/index.php` bootstraps `../application`. `.htaccess` routes `/api/*`, `/sanctum/*`, and health probes to Laravel; everything else falls back to the SPA.

## PHP version

Laravel 13 requires **PHP 8.3+**.

1. In hPanel → Advanced → PHP Configuration, set the **skuggle** domain to **PHP 8.3**.
2. CLI release uses `/opt/alt/php83/usr/bin/php` (see `remote-release.sh`).

## Environment

1. Copy `.env.shared.example` to `application/.env`.
2. Set `DB_HOST=localhost`, database name/user/password from hPanel → Databases.
3. Shared profile uses **database** drivers for session, cache, and queue.
4. Set `READY_REQUIRES_REDIS=false`, `STORAGE_LOCAL_ALLOWED=true`, `CLAMAV_REQUIRED_IN_PRODUCTION=false`.
5. Set explicit `TRUSTED_PROXIES` (never `*` in production). Private ranges are fine for bare Hostinger; use Cloudflare ranges if proxied.

## Manual deploy

From a machine with the Skuggle SSH key:

1. Build frontend: `VITE_LIVE_API=true VITE_API_URL=/api/v1 npm run build`
2. Package `application/` + `public_html/` and upload (or use GitHub Actions).
3. On the server:

```bash
export APP_DIR=$HOME/domains/skuggle.royalgatewayadmin.com/application
export PUBLIC_DIR=$HOME/domains/skuggle.royalgatewayadmin.com/public_html
bash "$APP_DIR/remote-release.sh"
```

## Cron

Add these in Hostinger → Advanced → Cron Jobs (PHP 8.3 binary):

```cron
* * * * * cd /home/USER/domains/skuggle.royalgatewayadmin.com/application && /opt/alt/php83/usr/bin/php artisan schedule:run >> /dev/null 2>&1
* * * * * cd /home/USER/domains/skuggle.royalgatewayadmin.com/application && /opt/alt/php83/usr/bin/php artisan queue:work --stop-when-empty --max-time=55 --tries=3 >> /dev/null 2>&1
```

## GitHub Actions

Workflow: `.github/workflows/deploy-hostinger.yml`

Required repository secrets:

| Secret | Example |
|--------|---------|
| `HOSTINGER_SSH_KEY` | OpenSSH private key (convert PPK with `puttygen private_ppk.ppk -O private-openssh -o hostinger_key`) |
| `HOSTINGER_SSH_HOST` | `147.93.54.101` |
| `HOSTINGER_SSH_PORT` | `65002` |
| `HOSTINGER_SSH_USER` | `u237094395` |
| `HOSTINGER_DB_DATABASE` | `u237094395_skuggle_db` |
| `HOSTINGER_DB_USERNAME` | `u237094395_skuggle` |
| `HOSTINGER_DB_PASSWORD` | *(from hPanel)* |
| `HOSTINGER_APP_KEY` | `base64:...` (optional after first deploy; `.env` is preserved) |

Convert the PuTTY key once:

```powershell
& "C:\Program Files\PuTTY\puttygen.exe" C:\Skuggle\skuggleSSH\private_ppk.ppk -O private-openssh -o $env:USERPROFILE\.ssh\skuggle_hostinger
```

Paste the OpenSSH private key into `HOSTINGER_SSH_KEY`. Never commit the key or `.env`.

## Notes

- Do **not** install Laravel Horizon on shared hosting.
- Queue work is handled by the short-lived cron worker above.
- When you move to a VPS, see `deploy/vps/README.md` for the Redis/Horizon upgrade path.

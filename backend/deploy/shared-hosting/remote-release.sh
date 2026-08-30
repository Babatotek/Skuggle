#!/usr/bin/env bash
# Prepare a staged Laravel application BEFORE it is swapped into production.
# Expected layout (APP_DIR / PUBLIC_DIR may be a release directory, not live):
#   APP_DIR     Laravel app root (artisan, composer.lock, .env already attached)
#   PUBLIC_DIR  SPA document root for this release
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/skuggle.royalgatewayadmin.com/application}"
PUBLIC_DIR="${PUBLIC_DIR:-$HOME/domains/skuggle.royalgatewayadmin.com/public_html}"

# Hostinger CloudLinux PHP selector (Laravel 13 requires ^8.3)
PHP_BIN="${PHP_BIN:-/opt/alt/php83/usr/bin/php}"
COMPOSER_BIN="${COMPOSER_BIN:-/usr/local/bin/composer}"

if [[ ! -x "$PHP_BIN" ]]; then
  echo "ERROR: PHP binary not found at $PHP_BIN"
  exit 1
fi
if [[ ! -f "$COMPOSER_BIN" ]]; then
  echo "ERROR: Composer not found at $COMPOSER_BIN"
  exit 1
fi
if [[ ! -f "$APP_DIR/artisan" ]]; then
  echo "ERROR: artisan missing at $APP_DIR"
  exit 1
fi
if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: missing $APP_DIR/.env — attach shared/.env before prepare"
  exit 1
fi

cd "$APP_DIR"

echo "==> Using $($PHP_BIN -v | head -1)"
echo "==> Composer install (staged, before activation)"
"$PHP_BIN" "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-progress

echo "==> Ensure writable storage and bootstrap cache"
mkdir -p storage/framework/{cache,sessions,views} storage/logs storage/app/public bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache || true

if ! grep -q '^APP_KEY=base64:' .env; then
  echo "==> Generating APP_KEY"
  "$PHP_BIN" artisan key:generate --force
fi

# Optional: apply Hostinger SMTP + public URL overrides supplied by CI (never logged).
if [[ -n "${MAIL_PASSWORD:-}" || -n "${MAIL_USERNAME:-}" ]]; then
  echo "==> Applying production mail / public URL settings"
  UPSERT=("$PHP_BIN" "$APP_DIR/deploy/shared-hosting/upsert-env.php" "$APP_DIR/.env")
  [[ -n "${APP_URL:-}" ]] && UPSERT+=("APP_URL=${APP_URL}")
  [[ -n "${FRONTEND_URL:-}" ]] && UPSERT+=("FRONTEND_URL=${FRONTEND_URL}")
  [[ -n "${MAIL_LINK_URL:-}" ]] && UPSERT+=("MAIL_LINK_URL=${MAIL_LINK_URL}")
  [[ -n "${MAIL_MAILER:-}" ]] && UPSERT+=("MAIL_MAILER=${MAIL_MAILER}")
  [[ -n "${MAIL_HOST:-}" ]] && UPSERT+=("MAIL_HOST=${MAIL_HOST}")
  [[ -n "${MAIL_PORT:-}" ]] && UPSERT+=("MAIL_PORT=${MAIL_PORT}")
  [[ -n "${MAIL_SCHEME:-}" ]] && UPSERT+=("MAIL_SCHEME=${MAIL_SCHEME}")
  [[ -n "${MAIL_ENCRYPTION:-}" ]] && UPSERT+=("MAIL_ENCRYPTION=${MAIL_ENCRYPTION}")
  [[ -n "${MAIL_USERNAME:-}" ]] && UPSERT+=("MAIL_USERNAME=${MAIL_USERNAME}")
  [[ -n "${MAIL_PASSWORD:-}" ]] && UPSERT+=("MAIL_PASSWORD=${MAIL_PASSWORD}")
  [[ -n "${MAIL_FROM_ADDRESS:-}" ]] && UPSERT+=("MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS}")
  [[ -n "${MAIL_FROM_NAME:-}" ]] && UPSERT+=("MAIL_FROM_NAME=${MAIL_FROM_NAME}")
  [[ -n "${MAIL_CONTACT_TO:-}" ]] && UPSERT+=("MAIL_CONTACT_TO=${MAIL_CONTACT_TO}")
  "${UPSERT[@]}"
fi

if [[ -n "${SEED_DEMO_TENANT:-}" ]]; then
  echo "==> Applying demo tenant seed flag"
  "$PHP_BIN" "$APP_DIR/deploy/shared-hosting/upsert-env.php" "$APP_DIR/.env" "SEED_DEMO_TENANT=${SEED_DEMO_TENANT}"
fi

if [[ -n "${APP_RELEASE_ID:-}" ]]; then
  echo "==> Recording release identity"
  "$PHP_BIN" "$APP_DIR/deploy/shared-hosting/upsert-env.php" "$APP_DIR/.env" \
    "APP_RELEASE_ID=${APP_RELEASE_ID}" \
    "APP_GIT_SHA=${APP_GIT_SHA:-}" \
    "APP_ENV=production" \
    "APP_DEBUG=false"
fi

echo "==> Clear leftover caches from the packaged tree"
"$PHP_BIN" artisan optimize:clear

echo "==> Staged Laravel boot"
"$PHP_BIN" artisan about --only=environment

echo "==> Database connectivity"
"$PHP_BIN" artisan migrate:status --no-interaction >/dev/null

echo "==> Migration safety classification"
SAFETY=("$PHP_BIN" artisan migrate:safety-check --pending --no-interaction)
if [[ "${ALLOW_DESTRUCTIVE_MIGRATIONS:-}" == "true" ]]; then
  SAFETY+=(--allow-destructive)
fi
"${SAFETY[@]}"

echo "==> Migrate (while previous release is still live)"
"$PHP_BIN" artisan migrate --force --no-interaction
echo "==> Migration status"
MIGRATE_STATUS="$("$PHP_BIN" artisan migrate:status --no-interaction)"
printf '%s\n' "$MIGRATE_STATUS"
if printf '%s\n' "$MIGRATE_STATUS" | grep -Eiq '(^|[[:space:]])Pending([[:space:]]|$)'; then
  echo "ERROR: one or more migrations are still Pending after migrate --force"
  exit 1
fi

if grep -Eq '^SEED_DEMO_TENANT=(true|1|"true")' .env || [[ "${SEED_DEMO_TENANT:-}" == "true" ]]; then
  echo "==> Seed public DemoTenant (idempotent)"
  "$PHP_BIN" artisan db:seed --class=Database\\Seeders\\DemoUsersSeeder --force --no-interaction
fi

echo "==> Production optimize"
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan event:cache || true

echo "==> Confirm boot after optimize"
"$PHP_BIN" artisan about --only=environment >/dev/null

if [[ -n "${MAIL_SMOKE_TO:-}" && -n "${MAIL_PASSWORD:-}" ]]; then
  echo "==> Mail smoke to configured inbox"
  "$PHP_BIN" artisan mail:smoke "$MAIL_SMOKE_TO" --templates
fi

if [[ -d "$PUBLIC_DIR" ]]; then
  echo "==> Storage link into public_html"
  # PHP symlink() is often disabled on Hostinger; use shell ln with absolute paths.
  STORAGE_PUBLIC="$(readlink -f "$APP_DIR/storage/app/public" 2>/dev/null || echo "$APP_DIR/storage/app/public")"
  rm -f "$PUBLIC_DIR/storage" 2>/dev/null || true
  ln -sfn "$STORAGE_PUBLIC" "$PUBLIC_DIR/storage"
  mkdir -p "$APP_DIR/public"
  rm -f "$APP_DIR/public/storage" 2>/dev/null || true
  ln -sfn "$STORAGE_PUBLIC" "$APP_DIR/public/storage"
fi

echo "==> Staged shared-hosting prepare complete"

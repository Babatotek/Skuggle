#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> Composer install (no-dev, optimized)"
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Run migrations"
php artisan migrate --force

echo "==> Cache config, routes, views, events"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Ensure storage symlink"
php artisan storage:link || true

echo "==> Shared hosting deploy complete"

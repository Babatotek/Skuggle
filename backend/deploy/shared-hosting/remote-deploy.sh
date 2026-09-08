#!/usr/bin/env bash
# Orchestrate a Skuggle release on Hostinger shared hosting.
# The live domain directories are replaced only after the new tree is fully prepared.
#
# Required env:
#   RELEASE_ID
# Optional env:
#   DOMAIN_ROOT, PHP_BIN, COMPOSER_BIN, PUBLIC_HEALTH_URL, APP_GIT_SHA
#   MAIL_*, SEED_DEMO_TENANT, APP_URL, FRONTEND_URL, ...
set -euo pipefail

RELEASE_ID="${RELEASE_ID:?RELEASE_ID is required}"
[[ "$RELEASE_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]+$ ]] || { echo "Invalid release ID"; exit 1; }
DOMAIN_ROOT="${DOMAIN_ROOT:-$HOME/domains/skuggle.royalgatewayadmin.com}"
PHP_BIN="${PHP_BIN:-/opt/alt/php83/usr/bin/php}"
COMPOSER_BIN="${COMPOSER_BIN:-/usr/local/bin/composer}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-https://skuggle.royalgatewayadmin.com}"
MIN_FREE_KB="${MIN_FREE_KB:-1048576}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
KEEP_LOGS="${KEEP_LOGS:-10}"

ROOT="$HOME/deployments/skuggle"
SHARED="$ROOT/shared"
RELEASES="$ROOT/releases"
ARTIFACTS="$ROOT/artifacts"
LOGS="$ROOT/logs"
LOCKS="$ROOT/locks"
BACKUPS="$ROOT/backups"
LIVE_APP="$DOMAIN_ROOT/application"
LIVE_PUBLIC="$DOMAIN_ROOT/public_html"
RELEASE_DIR="$RELEASES/$RELEASE_ID"
ARTIFACT_DIR="$ARTIFACTS/$RELEASE_ID"
ARCHIVE="$ARTIFACT_DIR/release.tar.gz"
CHECKSUM="$ARTIFACT_DIR/release.tar.gz.sha256"
STATE_FILE="$SHARED/release-data/deployment-state.json"
CURRENT_FILE="$SHARED/release-data/current-release"
LOG="$LOGS/${RELEASE_ID}.log"
LOCK_FILE="$LOCKS/deploy.lock"
LOCK_DIR="$LOCKS/deploy.lock.d"

OLD_RELEASE=""
BACKUP=""
LOCK_METHOD=""
ACTIVATED=0
APP_BACKED_UP=0
PUBLIC_BACKED_UP=0
SUCCESS=0

mkdir -p "$SHARED/release-data" "$SHARED/storage/app/public" \
  "$SHARED/storage/framework/cache" "$SHARED/storage/framework/sessions" \
  "$SHARED/storage/framework/views" "$SHARED/storage/logs" \
  "$RELEASES" "$ARTIFACTS" "$LOGS" "$LOCKS" "$BACKUPS"

# CageFS has no /dev/fd: use an ordinary pipeline, preserving the child status.
if [[ "${SKUGGLE_DEPLOY_LOGGED:-}" != "$RELEASE_ID" ]]; then
  export SKUGGLE_DEPLOY_LOGGED="$RELEASE_ID"
  set +e
  bash "$0" "$@" 2>&1 | tee -a "$LOG"
  exit "${PIPESTATUS[0]}"
fi

export RELEASE_ID APP_RELEASE_ID="${APP_RELEASE_ID:-$RELEASE_ID}" APP_GIT_SHA="${APP_GIT_SHA:-}"

write_state() {
  local state="$1"
  "$PHP_BIN" -r '
    $file = $argv[1];
    $payload = [
      "state" => $argv[2],
      "new_release" => getenv("RELEASE_ID") ?: null,
      "old_release" => getenv("OLD_RELEASE") ?: null,
      "updated_at" => gmdate("c"),
    ];
    file_put_contents($file, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
  ' "$STATE_FILE" "$state"
}

acquire_lock() {
  if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
      echo "Another Skuggle deployment is currently running."
      exit 75
    fi
    LOCK_METHOD=flock
    return
  fi
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "Another Skuggle deployment is currently running."
    exit 75
  fi
  LOCK_METHOD=mkdir
}

release_lock() {
  if [[ "${LOCK_METHOD:-}" == "mkdir" ]]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
}

preflight() {
  echo "==> Preflight"
  if [[ ! -d "$DOMAIN_ROOT" ]]; then
    echo "ERROR: domain directory missing: $DOMAIN_ROOT"
    exit 1
  fi
  if [[ ! -x "$PHP_BIN" ]]; then
    echo "ERROR: PHP 8.3 binary missing: $PHP_BIN"
    exit 1
  fi
  if [[ ! -f "$COMPOSER_BIN" ]]; then
    echo "ERROR: Composer missing: $COMPOSER_BIN"
    exit 1
  fi
  command -v tar >/dev/null || { echo "ERROR: tar is required"; exit 1; }
  command -v sha256sum >/dev/null || { echo "ERROR: sha256sum is required"; exit 1; }
  command -v curl >/dev/null || { echo "ERROR: curl is required"; exit 1; }

  local avail inode_pct
  avail="$(df -Pk "$HOME" | awk 'NR==2 {print $4}')"
  if [[ -z "$avail" || "$avail" -lt "$MIN_FREE_KB" ]]; then
    echo "ERROR: insufficient disk space (${avail:-unknown} KB free; need ${MIN_FREE_KB} KB)"
    exit 1
  fi
  inode_pct="$(df -iP "$HOME" | awk 'NR==2 {gsub(/%/, "", $5); print $5}')"
  if [[ -n "$inode_pct" && "$inode_pct" -ge 90 ]]; then
    echo "ERROR: insufficient inodes (${inode_pct}% used)"
    exit 1
  fi
  echo "    PHP $($PHP_BIN -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
  echo "    disk ${avail} KB free, inodes ${inode_pct:-unknown}% used"
}

ensure_shared() {
  echo "==> Attach persistent storage and .env"
  if [[ ! -f "$SHARED/.env" ]]; then
    if [[ -f "$LIVE_APP/.env" ]]; then
      cp "$LIVE_APP/.env" "$SHARED/.env"
      chmod 600 "$SHARED/.env"
    fi
  fi
  if [[ ! -f "$SHARED/.env" ]]; then
    echo "ERROR: Missing production $SHARED/.env (and no live application/.env to adopt)"
    exit 1
  fi
  chmod 600 "$SHARED/.env"

  if [[ -d "$LIVE_APP/storage" && ! -L "$LIVE_APP/storage" ]]; then
    echo "    Syncing live application/storage into shared/storage"
    cp -a "$LIVE_APP/storage/." "$SHARED/storage/"
  fi
  mkdir -p "$SHARED/storage/app/public" \
    "$SHARED/storage/framework/cache" \
    "$SHARED/storage/framework/sessions" \
    "$SHARED/storage/framework/views" \
    "$SHARED/storage/logs"
  chmod -R ug+rwx "$SHARED/storage" || true
}

extract_release() {
  echo "==> Verify artifact integrity"
  if [[ ! -f "$ARCHIVE" || ! -f "$CHECKSUM" ]]; then
    echo "ERROR: missing artifact at $ARTIFACT_DIR"
    exit 1
  fi
  (
    cd "$ARTIFACT_DIR"
    sha256sum -c release.tar.gz.sha256
  )

  echo "==> Extract $RELEASE_ID"
  rm -rf "$RELEASE_DIR"
  mkdir -p "$RELEASE_DIR"
  tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
  test -f "$RELEASE_DIR/application/artisan"
  test -f "$RELEASE_DIR/application/composer.json"
  test -f "$RELEASE_DIR/application/composer.lock"
  test -f "$RELEASE_DIR/public_html/index.html"
  test -f "$RELEASE_DIR/release-manifest.json"
  cp "$RELEASE_DIR/release-manifest.json" "$RELEASE_DIR/application/release-manifest.json"
}

attach_release() {
  local app="$RELEASE_DIR/application"
  cp "$SHARED/.env" "$app/.env"
  chmod 600 "$app/.env"

  rm -rf "$app/storage"
  ln -sfn "$SHARED/storage" "$app/storage"
  if [[ ! -L "$app/storage" ]]; then
    echo "ERROR: failed to symlink $app/storage -> $SHARED/storage"
    exit 1
  fi
  mkdir -p "$app/bootstrap/cache"
  chmod -R ug+rwx "$app/bootstrap/cache" || true

  if [[ ! -x "$app/remote-release.sh" ]]; then
    if [[ -f "$app/deploy/shared-hosting/remote-release.sh" ]]; then
      cp "$app/deploy/shared-hosting/remote-release.sh" "$app/remote-release.sh"
    fi
  fi
  chmod +x "$app/remote-release.sh" "$app/deploy/shared-hosting/remote-release.sh" 2>/dev/null || true
}

merge_previous_assets() {
  local new_list="$SHARED/release-data/assets-${RELEASE_ID}.txt"
  mkdir -p "$RELEASE_DIR/public_html/assets"
  if [[ -d "$RELEASE_DIR/public_html/assets" ]]; then
    find "$RELEASE_DIR/public_html/assets" -type f -printf '%P\n' 2>/dev/null | sort > "$new_list" || true
  else
    : > "$new_list"
  fi
  if [[ -d "$LIVE_PUBLIC/assets" ]]; then
    echo "==> Retain previous hashed assets for open tabs"
    cp -an "$LIVE_PUBLIC/assets/." "$RELEASE_DIR/public_html/assets/"
  fi
}

prepare_staged() {
  echo "==> Prepare staged release (Composer, migrate, optimize)"
  APP_DIR="$RELEASE_DIR/application" \
    PUBLIC_DIR="$RELEASE_DIR/public_html" \
    PHP_BIN="$PHP_BIN" \
    APP_RELEASE_ID="$RELEASE_ID" \
    APP_GIT_SHA="${APP_GIT_SHA:-}" \
    bash "$RELEASE_DIR/application/remote-release.sh"

  # Persist mail/app upserts into shared .env without per-release identity.
  grep -vE '^(APP_RELEASE_ID|APP_GIT_SHA)=' "$RELEASE_DIR/application/.env" > "$SHARED/.env.new"
  mv "$SHARED/.env.new" "$SHARED/.env"
  chmod 600 "$SHARED/.env"
}

verify_ready() {
  local expected="${1:-}"
  local tmp code
  tmp="$(mktemp)"
  code="$(curl --connect-timeout 10 --max-time 20 -sS -o "$tmp" -w '%{http_code}' "$PUBLIC_HEALTH_URL/ready" || true)"
  echo "    GET $PUBLIC_HEALTH_URL/ready => HTTP $code"
  if [[ "$code" != "200" ]]; then
    cat "$tmp" || true
    rm -f "$tmp"
    return 1
  fi
  EXPECT_RELEASE="$expected" "$PHP_BIN" -r '
    $json = json_decode((string) file_get_contents($argv[1]), true);
    if (!is_array($json) || ($json["status"] ?? "") !== "ready") {
      fwrite(STDERR, "ready status is not ready\n");
      exit(1);
    }
    $expected = (string) getenv("EXPECT_RELEASE");
    if ($expected !== "" && (string) ($json["release"] ?? "") !== $expected) {
      fwrite(STDERR, "release mismatch: got " . ($json["release"] ?? "") . " expected " . $expected . "\n");
      exit(1);
    }
    if (($json["database"] ?? false) !== true && ($json["checks"]["database"]["status"] ?? "") !== "healthy") {
      fwrite(STDERR, "database check failed\n");
      exit(1);
    }
  ' "$tmp"
  local rc=$?
  rm -f "$tmp"
  return "$rc"
}

verify_frontend() {
  local tmp code js
  tmp="$(mktemp)"
  code="$(curl --connect-timeout 10 --max-time 20 -sS -o "$tmp" -w '%{http_code}' "$PUBLIC_HEALTH_URL/" || true)"
  echo "    GET $PUBLIC_HEALTH_URL/ => HTTP $code"
  if [[ "$code" != "200" ]]; then
    rm -f "$tmp"
    return 1
  fi
  if ! grep -Eq 'assets/.+\.js|skuggle-release|Opening Skuggle' "$tmp"; then
    echo "ERROR: index.html is missing the application marker"
    rm -f "$tmp"
    return 1
  fi
  if ! grep -Fq "content=\"$RELEASE_ID\"" "$tmp"; then
    echo "ERROR: served frontend does not match release $RELEASE_ID"
    rm -f "$tmp"
    return 1
  fi
  js="$(grep -oE '/assets/[^"[:space:]]+\.js' "$tmp" | head -n 1 || true)"
  rm -f "$tmp"
  if [[ -z "$js" ]]; then
    echo "ERROR: index.html does not reference a hashed JS asset"
    return 1
  fi
  code="$(curl --connect-timeout 10 --max-time 20 -sS -o /dev/null -w '%{http_code}' "$PUBLIC_HEALTH_URL$js" || true)"
  echo "    GET $PUBLIC_HEALTH_URL$js => HTTP $code"
  [[ "$code" == "200" ]]
}

rollback_live() {
  echo "==> Rolling back to previous release"
  if [[ -x "$PHP_BIN" && -f "$LIVE_APP/artisan" ]]; then
    "$PHP_BIN" "$LIVE_APP/artisan" down --retry=10 --refresh=5 >/dev/null 2>&1 || true
  fi
  if [[ "$APP_BACKED_UP" -eq 1 ]]; then
    rm -rf "$LIVE_APP"
    mv "$BACKUP/application" "$LIVE_APP"
  fi
  if [[ "$PUBLIC_BACKED_UP" -eq 1 ]]; then
    rm -rf "$LIVE_PUBLIC"
    mv "$BACKUP/public_html" "$LIVE_PUBLIC"
  fi
  if [[ -f "$LIVE_APP/artisan" ]]; then
    "$PHP_BIN" "$LIVE_APP/artisan" up >/dev/null 2>&1 || true
  fi
  write_state "ROLLED_BACK"
  if [[ -n "$OLD_RELEASE" ]]; then
    printf '%s\n' "$OLD_RELEASE" > "$CURRENT_FILE"
  fi
  verify_ready "$OLD_RELEASE" || echo "WARNING: rollback health check did not pass"
}

prune() {
  echo "==> Prune old backups, artifacts, assets, and logs"
  if [[ -d "$BACKUPS" ]]; then
    find "$BACKUPS" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null \
      | sort -nr | tail -n "+$((KEEP_RELEASES + 1))" | cut -d' ' -f2- | xargs -r rm -rf
  fi
  if [[ -d "$HOME/backups" ]]; then
    find "$HOME/backups" -mindepth 1 -maxdepth 1 -type d -name 'skuggle-*' -printf '%T@ %p\n' 2>/dev/null \
      | sort -nr | tail -n "+$((KEEP_RELEASES + 1))" | cut -d' ' -f2- | xargs -r rm -rf
  fi
  if [[ -d "$ARTIFACTS" ]]; then
    find "$ARTIFACTS" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' 2>/dev/null \
      | sort -nr | tail -n "+$((KEEP_RELEASES + 1))" | cut -d' ' -f2- | xargs -r rm -rf
  fi

  local allowed prev
  allowed="$(mktemp)"
  if [[ -f "$SHARED/release-data/assets-${RELEASE_ID}.txt" ]]; then
    cat "$SHARED/release-data/assets-${RELEASE_ID}.txt" >> "$allowed"
  fi
  prev="$(ls -1t "$SHARED/release-data"/assets-*.txt 2>/dev/null | sed -n '2p' || true)"
  if [[ -n "$prev" && -f "$prev" ]]; then
    cat "$prev" >> "$allowed"
  fi
  if [[ -s "$allowed" && -d "$LIVE_PUBLIC/assets" ]]; then
    sort -u "$allowed" -o "$allowed"
    find "$LIVE_PUBLIC/assets" -type f -printf '%P\n' | sort > "${allowed}.live"
    comm -23 "${allowed}.live" "$allowed" \
      | while IFS= read -r rel; do
          [[ -n "$rel" ]] && rm -f "$LIVE_PUBLIC/assets/$rel"
        done
    find "$LIVE_PUBLIC/assets" -type d -empty -delete 2>/dev/null || true
  fi
  rm -f "$allowed"
  rm -f "${allowed}.live"
  ls -1t "$SHARED/release-data"/assets-*.txt 2>/dev/null | tail -n +3 | xargs -r rm -f
  ls -1t "$LOGS"/*.log 2>/dev/null | tail -n "+$((KEEP_LOGS + 1))" | xargs -r rm -f
}

on_exit() {
  local rc=$?
  trap - EXIT
  set +e
  if [[ "${SUCCESS:-0}" -ne 1 ]]; then
    echo "Deployment failed with exit $rc"
    if [[ "${ACTIVATED:-0}" -eq 1 ]]; then
      rollback_live
    else
      write_state "FAILED"
      [[ -n "${RELEASE_DIR:-}" && -d "$RELEASE_DIR" ]] && rm -rf "$RELEASE_DIR"
    fi
  fi
  release_lock
  exit "$rc"
}

acquire_lock
trap on_exit EXIT

echo "==> Skuggle release $RELEASE_ID"
if [[ -f "$CURRENT_FILE" ]]; then
  OLD_RELEASE="$(tr -d '[:space:]' < "$CURRENT_FILE" || true)"
fi
export OLD_RELEASE
BACKUP="$BACKUPS/$(date +%Y%m%d%H%M%S)-${OLD_RELEASE:-previous}"

preflight
write_state "VALIDATING"
extract_release
ensure_shared
attach_release
merge_previous_assets
write_state "PREPARING"
prepare_staged
write_state "READY_FOR_ACTIVATION"

echo "==> Activate $RELEASE_ID"
if [[ -f "$LIVE_APP/artisan" ]]; then
  "$PHP_BIN" "$LIVE_APP/artisan" down --retry=10 --refresh=5 || true
fi
mkdir -p "$BACKUP"
ACTIVATED=1
if [[ -d "$LIVE_APP" ]]; then
  mv "$LIVE_APP" "$BACKUP/application"
  APP_BACKED_UP=1
fi
if [[ -d "$LIVE_PUBLIC" ]]; then
  mv "$LIVE_PUBLIC" "$BACKUP/public_html"
  PUBLIC_BACKED_UP=1
fi
write_state "ACTIVATING"
mv "$RELEASE_DIR/application" "$LIVE_APP"
mv "$RELEASE_DIR/public_html" "$LIVE_PUBLIC"
rmdir "$RELEASE_DIR" 2>/dev/null || rm -rf "$RELEASE_DIR"

# Cached view paths were generated in staging; rebuild after moving the tree.
"$PHP_BIN" "$LIVE_APP/artisan" config:cache
"$PHP_BIN" "$LIVE_APP/artisan" view:cache
"$PHP_BIN" "$LIVE_APP/artisan" up

write_state "VERIFYING"
if ! verify_ready "$RELEASE_ID"; then
  echo "ERROR: readiness check failed after activation"
  exit 1
fi
if ! verify_frontend; then
  echo "ERROR: frontend smoke check failed after activation"
  exit 1
fi

if [[ -f "$LIVE_APP/artisan" ]]; then
  "$PHP_BIN" "$LIVE_APP/artisan" up || true
fi
if ! verify_ready "$RELEASE_ID"; then
  echo "ERROR: readiness check failed after leaving maintenance"
  exit 1
fi

printf '%s\n' "$RELEASE_ID" > "$CURRENT_FILE"
write_state "SUCCESS"
SUCCESS=1
prune || echo "WARNING: retention cleanup failed; release remains healthy"
echo "Deployment successful: $PUBLIC_HEALTH_URL (release $RELEASE_ID)"

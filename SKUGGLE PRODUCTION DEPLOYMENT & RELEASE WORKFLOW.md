# SKUGGLE PRODUCTION DEPLOYMENT & RELEASE WORKFLOW

## React + Laravel + MySQL + Hostinger Premium Shared Hosting

### Production objectives

The deployment system must guarantee that:

- production is never replaced by an unprepared release;
- only one deployment can run at a time;
- frontend and backend belong to the same release;
- stale React/Vite chunks cannot permanently freeze the interface;
- old PWA service workers cannot keep serving incompatible frontend code;
- failed Laravel migrations or dependency installation cannot expose a half-deployed application;
- database migrations remain backward compatible;
- failed health checks trigger automatic rollback;
- the previous known-good release remains immediately recoverable;
- uploads, logs and persistent storage survive releases;
- `.env` is never packaged or overwritten;
- deployment artifacts are traceable to a Git commit;
- production never runs from a dirty or unknown source tree;
- every deployment produces an auditable log;
- backups and old assets are automatically pruned;
- deployment scripts themselves fail closed instead of attempting to continue after an error.

---

# 1. TARGET SERVER ARCHITECTURE

Do not continue treating:

```text
application/
public_html/
```

as the release itself.

Use a release-oriented filesystem.

```text
/home/u237094395/
│
├── deployments/
│   └── skuggle/
│       ├── releases/
│       │   ├── 20260830-181500-a83f04d/
│       │   │   ├── application/
│       │   │   └── public_html/
│       │   │
│       │   ├── 20260830-170800-c93ea82/
│       │   └── ...
│       │
│       ├── shared/
│       │   ├── .env
│       │   ├── storage/
│       │   │   ├── app/
│       │   │   ├── framework/
│       │   │   └── logs/
│       │   └── release-data/
│       │
│       ├── backups/
│       ├── logs/
│       ├── locks/
│       └── artifacts/
│
└── domains/
    └── skuggle.royalgatewayadmin.com/
        ├── application/
        └── public_html/
```

The contents under:

```text
releases/<RELEASE_ID>
```

must never change after activation.

Each release is immutable.

---

# 2. RELEASE IDENTIFICATION

Every deployment must have a unique release ID.

Format:

```text
YYYYMMDD-HHMMSS-GIT_SHA
```

Example:

```text
20260830-181500-a83f04d
```

Generate from:

```powershell
$commit = (git rev-parse --short=12 HEAD).Trim()
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$releaseId = "$timestamp-$commit"
```

Never upload:

```text
skuggle-release.tar.gz
```

as the permanent deployment name.

Instead:

```text
skuggle-20260830-181500-a83f04d.tar.gz
```

This prevents concurrent deployments from overwriting one another.

---

# 3. RELEASE MANIFEST

Every release must include:

```text
release-manifest.json
```

Example:

```json
{
    "application": "skuggle",
    "release": "20260830-181500-a83f04d",
    "commit": "a83f04d730ab",
    "branch": "main",
    "environment": "production",
    "builtAt": "2026-08-30T17:15:00Z",
    "frontendBuild": "a83f04d730ab",
    "backendBuild": "a83f04d730ab"
}
```

The same release identifier must be available to:

```text
React
Laravel
health endpoint
deployment logs
```

This lets us detect frontend/backend version mismatches immediately.

---

# 4. PHASE A: LOCAL PRE-DEPLOYMENT VALIDATION

Production deployment must begin by validating the workstation/repository.

## Git repository validation

Determine:

```powershell
git rev-parse --is-inside-work-tree
git branch --show-current
git rev-parse HEAD
git status --porcelain
```

Production should normally require:

```text
branch = main
working tree = clean
```

If there are uncommitted changes:

```text
ABORT
```

Do not silently deploy them.

Allow a deliberate override only through something explicit such as:

```text
-AllowDirtyWorkingTree
```

and record that decision in the deployment log.

---

# 5. VERIFY REQUIRED LOCAL TOOLS

Require:

```text
git
node
npm
php
composer
tar
ssh
scp
ssh-keygen
```

Verify versions.

For example:

```text
Node >= project-required version
PHP >= 8.3
Composer 2
```

Abort when requirements are not satisfied.

---

# 6. FRONTEND DEPENDENCY INSTALLATION

Do not build against an unknown existing `node_modules`.

Run:

```bash
npm ci
```

not:

```bash
npm install
```

for production builds.

The lockfile must be committed:

```text
package-lock.json
```

The purpose is reproducibility.

---

# 7. FRONTEND QUALITY GATES

Run all frontend gates separately.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Recommended scripts:

```json
{
    "scripts": {
        "lint": "eslint .",
        "typecheck": "tsc --noEmit",
        "test": "vitest run",
        "build": "vite build"
    }
}
```

Do not describe:

```text
npm run lint
```

as a typecheck.

They are different checks.

Any failure:

```text
ABORT DEPLOYMENT
```

Nothing has touched production yet.

---

# 8. BACKEND QUALITY GATES

Run:

```bash
composer validate --strict

composer install \
    --no-interaction \
    --prefer-dist

composer exec pint -- --test

php artisan test
```

Optionally run:

```bash
composer audit
```

Apply a documented security severity policy.

Do not run:

```bash
composer update
```

during production deployment.

Production dependency versions must come from:

```text
composer.lock
```

---

# 9. PRODUCTION FRONTEND BUILD VARIABLES

Set only production-safe variables.

Example:

```powershell
$env:VITE_API_URL = "/api/v1"
$env:VITE_LIVE_API = "true"
$env:VITE_BUILD_ID = $releaseId
$env:VITE_GIT_SHA = $commit
```

Then execute:

```bash
npm run build
```

Immediately restore the previous shell environment after building.

---

# 10. FRONTEND OUTPUT VALIDATION

Before packaging, verify:

```text
dist/index.html
dist/assets/
```

exist.

Verify the application has at least one JavaScript asset.

Search production output for obvious forbidden development values such as:

```text
localhost
127.0.0.1
http://localhost
```

where appropriate.

Also verify the release/build identifier exists inside the expected application metadata.

---

# 11. PACKAGE THE BACKEND

Exclude runtime and development content.

Do not package:

```text
.env
.env.*
node_modules
tests
load-tests
storage/logs
public/storage
.git
.deploy
```

The handling of `vendor` depends on which strategy is selected.

For Hostinger shared hosting, the preferred strategy should be:

```text
BUILD/INSTALL vendor BEFORE ACTIVATION
```

not:

```text
activate application
then install vendor
```

---

# 12. PACKAGE THE RELEASE

Release layout:

```text
release/
│
├── application/
├── public_html/
└── release-manifest.json
```

Archive:

```text
skuggle-<RELEASE_ID>.tar.gz
```

Generate:

```text
SHA-256
```

Example:

```text
skuggle-20260830-181500-a83f04d.tar.gz
skuggle-20260830-181500-a83f04d.tar.gz.sha256
```

---

# 13. PHASE B: CONNECTIVITY AND SERVER PRE-FLIGHT

Before uploading the entire artifact, verify SSH:

```bash
echo SSH_OK
```

Then run server checks.

Required:

```text
domain directory exists
PHP 8.3 binary exists
Composer 2 exists
tar exists
sha256sum exists
disk space sufficient
inode availability sufficient
database configuration available
shared .env exists
storage directories writable
bootstrap/cache writable
```

Use the explicit Hostinger PHP binary:

```text
/opt/alt/php83/usr/bin/php
```

Do not assume:

```bash
php
```

means the site's PHP version.

---

# 14. PRODUCTION DEPLOYMENT LOCK

Before preparing anything remotely, acquire a deployment lock.

Preferred:

```bash
LOCK="$HOME/deployments/skuggle/locks/deploy.lock"

exec 9>"$LOCK"

if ! flock -n 9; then
    echo "Another Skuggle deployment is currently running."
    exit 75
fi
```

If `flock` is unavailable, implement atomic-directory locking:

```bash
mkdir "$LOCK_DIR"
```

and fail when it already exists.

The deployment lock must remain active until:

```text
successful release completion
or
rollback completion
```

---

# 15. SERVER PRE-FLIGHT RESOURCE CHECK

Before extracting or installing Composer dependencies, check disk usage.

For example:

```bash
df -h "$HOME"
df -i "$HOME"
```

Set minimum thresholds.

Example policy:

```text
minimum free disk: 1 GB
minimum free inodes: 10%
```

If below policy:

```text
ABORT BEFORE TOUCHING PRODUCTION
```

This is important on shared hosting.

---

# 16. UPLOAD ARTIFACT TO UNIQUE PATH

Upload to:

```text
$HOME/deployments/skuggle/artifacts/<RELEASE_ID>/
```

Example:

```text
artifacts/
└── 20260830-181500-a83f04d/
    ├── release.tar.gz
    └── release.tar.gz.sha256
```

Never overwrite another release's artifact.

---

# 17. VERIFY ARTIFACT INTEGRITY

Run:

```bash
sha256sum -c release.tar.gz.sha256
```

Failure:

```text
DELETE ARTIFACT
ABORT
```

Production remains untouched.

---

# 18. EXTRACT INTO NEW RELEASE DIRECTORY

Create:

```text
releases/<RELEASE_ID>/
```

Extract the artifact there.

Validate:

```bash
test -f application/artisan
test -f application/composer.json
test -f application/composer.lock
test -f public_html/index.html
test -f release-manifest.json
```

Still:

```text
PRODUCTION HAS NOT BEEN TOUCHED
```

---

# 19. ATTACH PRODUCTION ENVIRONMENT

Production `.env` must live under:

```text
shared/.env
```

Copy it into the staged application:

```bash
cp "$SHARED/.env" "$RELEASE/application/.env"
chmod 600 "$RELEASE/application/.env"
```

Do not obtain `.env` from the deployment artifact.

Do not overwrite the shared `.env`.

---

# 20. PERSISTENT LARAVEL STORAGE

The following information must survive releases:

```text
storage/app
storage/logs
storage/framework
user uploads
generated reports
runtime files
```

Use:

```text
shared/storage
```

If Hostinger symlinks are enabled and appropriate:

```bash
rm -rf "$RELEASE/application/storage"
ln -s "$SHARED/storage" "$RELEASE/application/storage"
```

If symlink restrictions prevent this, implement safe persistent-directory copying/mounting appropriate to the hosting environment.

User-generated files must never exist solely inside an immutable release.

---

# 21. INSTALL COMPOSER DEPENDENCIES BEFORE ACTIVATION

This is critical.

Run against:

```text
$RELEASE/application
```

while it is still offline.

Use the correct PHP runtime:

```bash
PHP_BIN=/opt/alt/php83/usr/bin/php

"$PHP_BIN" /usr/local/bin/composer2 install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader
```

Do not run Composer after switching production directories.

If Composer fails:

```text
DELETE NEW RELEASE
ABORT
```

Existing production remains completely unchanged.

---

# 22. VALIDATE LARAVEL BEFORE ACTIVATION

Against the staged release run:

```bash
php artisan optimize:clear
php artisan about
```

Verify:

```text
APP_ENV=production
APP_DEBUG=false
application boots
database configuration resolves
required services resolve
storage writable
bootstrap/cache writable
```

Do not print secrets into deployment logs.

---

# 23. DATABASE CONNECTIVITY TEST

Run a dedicated non-destructive database check before migration.

For example:

```bash
php artisan app:database-health
```

or use a dedicated deployment health command.

The command should verify:

```text
MySQL connection established
expected database selected
critical tables exist
migration repository accessible
```

Failure:

```text
ABORT
```

---

# 24. DATABASE MIGRATION POLICY

Production migrations must use:

```bash
php artisan migrate --force
```

but migration design is equally important.

Adopt:

```text
EXPAND
DEPLOY
CONTRACT
```

rather than destructive same-release migration.

Example:

Release 10:

```text
add new nullable column
```

Release 11:

```text
application writes both old and new fields
```

Release 12:

```text
application reads new field
```

Release 13:

```text
remove old field after verification
```

Do not casually execute:

```text
DROP COLUMN
DROP TABLE
RENAME COLUMN
major type alteration
```

in the same release that removes compatibility with the previous application.

Otherwise filesystem rollback may restore the application while leaving an incompatible database behind.

---

# 25. MIGRATION SAFETY CLASSIFICATION

Classify migrations:

```text
SAFE
CAUTION
DESTRUCTIVE
```

Production automated deployment may execute:

```text
SAFE
```

automatically.

`DESTRUCTIVE` migrations should require a specific explicit deployment flag or separate maintenance procedure.

---

# 26. RUN LARAVEL PRODUCTION OPTIMIZATION

After dependencies and migrations succeed, execute:

```bash
php artisan optimize
```

This prepares Laravel's production caches.

Where appropriate this includes:

```text
configuration
routes
events
views
```

Verify Laravel can still boot after optimization.

---

# 27. STAGED BACKEND SMOKE TEST

Before activation run something such as:

```bash
php artisan app:release-check
```

It should verify:

```text
Laravel boots
database responds
required configuration exists
critical classes resolve
migration status is valid
storage is writable
cache driver works
```

No public traffic has touched the release yet.

---

# 28. VITE STALE-CHUNK PROTECTION

The frontend must listen for stale dynamic import failures.

At application startup:

```typescript
window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();

    const key = 'skuggle-vite-reload';

    if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
    }
});
```

After successful bootstrap:

```typescript
sessionStorage.removeItem('skuggle-vite-reload');
```

The guard prevents an infinite reload loop.

---

# 29. GLOBAL CHUNK LOAD ERROR RECOVERY

Also handle browser-specific chunk failures.

Detect errors such as:

```text
ChunkLoadError
Failed to fetch dynamically imported module
Importing a module script failed
```

Trigger one controlled page refresh.

Never continuously reload.

---

# 30. CACHE POLICY

`index.html` must not be cached long-term.

Recommended:

```apache
<FilesMatch "^(index\.html|service-worker\.js|sw\.js|manifest\.webmanifest)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>
```

Hashed assets can be cached aggressively:

```apache
<FilesMatch "\.(js|css|woff2|png|jpg|jpeg|svg|webp)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>
```

But only use the long immutable policy for assets whose filenames are content hashed.

Example:

```text
index-BYx7f91.js
vendor-DYwzPog7.js
```

---

# 31. SERVICE WORKER / PWA VERSIONING

This is crucial for Skuggle.

Every service-worker build must know:

```text
RELEASE_ID
```

Never allow the service worker to permanently cache:

```text
index.html
API responses containing authentication state
old application shell indefinitely
```

Use explicit versioned application caches:

```text
skuggle-static-<RELEASE_ID>
```

During activation:

```text
delete obsolete application caches
claim clients
```

But retain any deliberately supported offline data according to its own cache namespace.

---

# 32. DO NOT USE CACHE-FIRST FOR HTML

Use:

```text
NetworkFirst
```

or equivalent controlled strategy for navigation requests.

Do not make:

```text
index.html
```

a forever `CacheFirst` asset.

Otherwise a newly deployed backend can be paired with yesterday's React application.

That is one of the easiest ways to produce:

```text
menus not clicking
API calls failing everywhere
chunks missing
blank pages
1000+ console errors
```

---

# 33. RETAIN ONLY RECENT PREVIOUS VITE ASSETS

During release preparation, retain:

```text
current release assets
previous release assets
```

or perhaps:

```text
previous two releases
```

Do not merge every historical `/assets` directory forever.

For example:

```text
release N assets
release N-1 assets
```

may coexist.

After the transition window:

```text
delete N-2 and older orphaned assets
```

This protects open browser tabs without creating an infinite asset graveyard.

---

# 34. APPLICATION RELEASE VERSION ENDPOINT

Laravel must expose:

```text
GET /api/v1/system/version
```

Example response:

```json
{
    "application": "skuggle",
    "release": "20260830-181500-a83f04d",
    "commit": "a83f04d730ab"
}
```

This endpoint must not expose secrets.

---

# 35. READINESS ENDPOINT

Provide:

```text
GET /api/v1/health/ready
```

Response:

```json
{
    "status": "ready",
    "application": "skuggle",
    "release": "20260830-181500-a83f04d",
    "database": true,
    "cache": true
}
```

Return:

```text
HTTP 200
```

only when critical dependencies are healthy.

Otherwise:

```text
HTTP 503
```

Do not return the SPA `index.html` for `/api/v1/health/ready`.

---

# 36. LIVENESS ENDPOINT

Separate readiness from liveness:

```text
GET /api/v1/health/live
```

This only proves Laravel itself can respond.

Example:

```json
{
    "status": "alive"
}
```

This prevents one overloaded dependency from making it impossible to distinguish:

```text
Laravel is dead
```

from:

```text
Laravel is running but a dependency is unhealthy
```

---

# 37. BEGIN ACTIVATION TRANSACTION

Only now may production be changed.

Record:

```text
DEPLOYMENT_STATE=PENDING
OLD_RELEASE=<current>
NEW_RELEASE=<release ID>
```

Write this state to:

```text
shared/release-data/deployment-state.json
```

before touching production.

---

# 38. BACKUP CURRENT ACTIVE RELEASE

Create an activation backup or record the current release location.

Example:

```text
backups/<CURRENT_RELEASE_ID>
```

Because releases themselves are immutable, rollback becomes much simpler.

The important requirement is that the previous release remain intact.

---

# 39. MAINTENANCE WINDOW

If the activation cannot truly be atomic because shared hosting prevents symlink-based current-release switching, put Laravel briefly into maintenance mode before the directory swap:

```bash
php artisan down \
    --retry=10 \
    --refresh=5 \
    --secret="<generated-deployment-secret>"
```

Keep this period extremely short.

All dependency installation, frontend building, migrations and optimization happened earlier.

The maintenance window should contain little more than:

```text
swap
verify
resume
```

---

# 40. ACTIVATE APPLICATION AND FRONTEND

If Hostinger symlinks are supported safely, a `current` symlink provides the cleanest switch.

Where that is not practical on your current plan, perform guarded renames with explicit rollback state.

Pseudo-flow:

```bash
ACTIVATION_STARTED=1

mv production/application backup/application
mv production/public_html backup/public_html

mv release/application production/application
mv release/public_html production/public_html
```

Every command must be rollback protected.

The EXIT trap must know whether activation began.

---

# 41. SERVER-SIDE HEALTH TEST AFTER ACTIVATION

Immediately perform:

```bash
curl --fail \
     --silent \
     --show-error \
     --max-time 15 \
     https://skuggle.royalgatewayadmin.com/api/v1/health/ready
```

Parse the JSON.

Verify:

```text
status == ready
release == NEW_RELEASE
database == true
```

A generic HTTP 200 is insufficient.

---

# 42. FRONTEND HEALTH TEST

Fetch:

```text
/
```

Verify:

```text
HTTP 200
content-type text/html
expected application marker exists
expected RELEASE_ID or build metadata exists
```

Then fetch one hashed JS asset referenced by the page.

It must return:

```text
HTTP 200
application/javascript
```

This catches:

```text
HTML works
but JavaScript bundle does not
```

before declaring success.

---

# 43. API SMOKE TEST

Test at least one non-authenticated API route.

Where feasible, also have a dedicated safe authenticated synthetic smoke-check mechanism that validates:

```text
auth middleware
tenant resolution
database query
permissions
```

without modifying business records.

Because Skuggle is multi-tenant, deployment health should verify that tenant middleware boots correctly.

---

# 44. EXTERNAL HEALTH CHECK FROM DEPLOYING MACHINE

After server-side checks pass, PowerShell should independently call:

```text
https://skuggle.royalgatewayadmin.com/api/v1/health/ready
```

and verify:

```text
HTTP status
JSON body
release ID
```

This tests the public path rather than only the server's local view.

---

# 45. AUTOMATIC ROLLBACK

Rollback when any post-activation condition fails.

Conditions include:

```text
Laravel health fails
DB health fails
frontend shell fails
hashed JS fails
wrong release ID
HTTP 500
HTTP 503
timeout
activation command fails
```

Rollback procedure:

```text
put application into maintenance
remove failed current application
remove failed public_html
restore previous application
restore previous public_html
clear/restore appropriate Laravel caches
verify previous release
bring application online
mark deployment ROLLED_BACK
```

Rollback itself must perform a health check.

---

# 46. DATABASE-AWARE ROLLBACK

Application rollback does not automatically reverse migrations.

Therefore the primary database strategy must be:

```text
backward-compatible migrations
```

Do not automatically run:

```bash
php artisan migrate:rollback
```

during application rollback.

A rollback migration can itself destroy valid production data.

Schema compatibility is a deployment-design responsibility.

---

# 47. EXIT MAINTENANCE MODE

Only after successful validation:

```bash
php artisan up
```

Then run the readiness test again.

---

# 48. COMMIT DEPLOYMENT

Only after both internal and external health checks pass:

```text
DEPLOYMENT_STATE=SUCCESS
CURRENT_RELEASE=NEW_RELEASE
```

Write:

```text
release
commit
timestamp
deployment source
duration
status
```

to release metadata.

---

# 49. CLIENT VERSION-SKEW DETECTION

After React starts successfully, query:

```text
/api/v1/system/version
```

Compare:

```text
frontend build ID
backend release ID
```

If they disagree, display a controlled update state or perform a single safe refresh.

Do not allow React to continue blindly with an incompatible backend.

Example:

```typescript
if (frontendBuild !== backendRelease) {
    triggerControlledApplicationRefresh();
}
```

---

# 50. GLOBAL REACT ERROR BOUNDARY

The entire application must have a root error boundary.

It should catch render crashes and present:

```text
Skuggle was unable to load this version correctly.

Reload application
```

rather than:

```text
white blank page
```

A white blank screen is not error handling. It is merely an application refusing to explain itself.

---

# 51. API ERROR INTERCEPTOR

The central Axios/fetch layer should classify:

```text
401
403
404
409
419
422
429
500
502
503
504
network failure
timeout
```

Do not create uncontrolled repeated retries.

For example, a failed `/broadcasting/auth` request should not trigger an endless request/render loop.

Use bounded retry:

```text
network transient error:
maximum 2 retries
exponential backoff
```

Never:

```text
retry forever
```

---

# 52. PREVENT REQUEST STORMS

Implement request deduplication for shared dashboard endpoints.

If six React components require:

```text
/api/v1/dashboard/metrics
```

they should not create six identical simultaneous requests.

Use:

```text
TanStack Query
SWR
or centralized request cache
```

with suitable stale times.

This directly reduces stress on Hostinger shared hosting.

---

# 53. PREVENT REACT RENDER/REQUEST LOOPS

Production quality gates should specifically check for:

```text
useEffect dependency loops
setState during render
unstable query keys
repeated Axios interceptor registration
duplicate event listeners
duplicate WebSocket connections
recursive auth refresh
unbounded polling
```

A thousand browser console errors usually means the system is repeating a failure, not discovering one thousand unrelated problems.

---

# 54. SERVICE WORKER UPDATE EXPERIENCE

When a new service worker becomes available:

```text
notify application
finish current critical interaction
activate update
reload once
```

For normal non-destructive screens, Skuggle can present:

```text
A new version of Skuggle is available.
Refreshing…
```

and automatically switch.

Avoid leaving different open tabs permanently running different app shells.

---

# 55. DEPLOYMENT LOGGING

Write:

```text
deployments/skuggle/logs/<RELEASE_ID>.log
```

Record:

```text
release ID
Git SHA
branch
initiator
deployment start
preflight
frontend tests
backend tests
artifact checksum
upload
Composer installation
migration status
optimization
activation
health checks
rollback if any
deployment duration
final state
```

Never write:

```text
database passwords
API secrets
APP_KEY
SSH private key
tokens
```

to the log.

---

# 56. APPLICATION OBSERVABILITY

At minimum monitor production Laravel logs for:

```text
500 errors
uncaught exceptions
slow database queries
authentication failures
tenant-resolution failures
queue failures
rate-limit anomalies
```

Frontend should report significant application failures to a central logging system when feasible.

Record:

```text
release ID
route
browser
error class
API endpoint
HTTP status
```

without capturing passwords or sensitive student information.

---

# 57. BACKUP RETENTION

Retain:

```text
current release
5 previous application releases
database backups according to policy
recent deployment logs
recent artifacts only
```

Delete old artifacts automatically.

Do not preserve hundreds of release archives on shared hosting.

---

# 58. ASSET RETENTION

Retain enough previous hashed chunks to survive open browser sessions during deployment.

Recommended initial policy:

```text
current frontend assets
previous frontend assets
```

Optionally previous two releases.

Do not preserve all historical assets.

---

# 59. DEPLOYMENT CLEANUP

Only after successful release:

```text
delete temporary stage directories
remove uploaded release artifact
prune old releases
prune stale frontend assets
prune old deployment logs according to policy
release deployment lock
```

Never delete the previous known-good release before the new one has passed validation.

---

# 60. SSH SECURITY

Production deployment should use:

```text
dedicated deployment SSH key
BatchMode=yes
no password
restricted file permissions
known host validation
```

Prefer:

```text
StrictHostKeyChecking=yes
```

with a pinned host fingerprint once the server's identity has been deliberately verified.

Do not use the same private deployment key casually for unrelated servers.

---

# 61. ENVIRONMENT SECURITY

Production must enforce:

```env
APP_ENV=production
APP_DEBUG=false
```

and appropriate:

```text
HTTPS
secure cookies
session settings
CORS
trusted proxies
rate limiting
```

Never expose:

```text
.env
composer.json
storage logs
deployment logs
release metadata containing secrets
```

through `public_html`.

---

# 62. HOSTINGER PHP CONSISTENCY

Validate both:

```text
web PHP
CLI PHP
```

because they may differ.

CLI:

```bash
/opt/alt/php83/usr/bin/php -v
```

Composer:

```bash
/opt/alt/php83/usr/bin/php /usr/local/bin/composer2 --version
```

Web health endpoint should expose only a safe version field such as:

```json
{
    "php": "8.3"
}
```

if desired.

Do not depend on whatever executable happens to be first on SSH `$PATH`.

---

# 63. REQUIRED DEPLOYMENT STATES

Every deployment should conceptually pass through:

```text
CREATED
VALIDATING
BUILT
UPLOADED
PREPARING
MIGRATING
READY_FOR_ACTIVATION
ACTIVATING
VERIFYING
SUCCESS
```

Failure after activation:

```text
ROLLING_BACK
ROLLED_BACK
```

Failure before activation:

```text
FAILED
```

This makes production behavior understandable.

---

# 64. NO-ACTIVATION RULE

The most important production invariant is:

```text
NOTHING MAY REPLACE THE CURRENT LIVE RELEASE
UNTIL THE NEW RELEASE IS COMPLETELY PREPARED.
```

Specifically, before activation the new release already has:

```text
correct source
correct frontend bundle
production Composer dependencies
production .env
persistent storage
successful migration
Laravel caches
successful staged boot
release metadata
validated filesystem
```

Activation should take seconds rather than minutes.

---

# 65. RECOMMENDED FINAL PIPELINE

The complete pipeline becomes:

```text
Developer commits to main
        │
        ▼
Validate clean Git state
        │
        ▼
Capture release ID + Git SHA
        │
        ▼
npm ci
        │
        ├── ESLint
        ├── TypeScript
        ├── Unit tests
        └── Production build
        │
        ▼
Composer validation
        │
        ├── Pint
        ├── Laravel tests
        └── Security audit
        │
        ▼
Validate dist
        │
        ▼
Generate release manifest
        │
        ▼
Package immutable artifact
        │
        ▼
SHA-256
        │
        ▼
SSH preflight
        │
        ├── PHP
        ├── Composer
        ├── disk
        ├── inode
        └── permissions
        │
        ▼
Acquire deployment lock
        │
        ▼
Upload unique artifact
        │
        ▼
Verify SHA-256
        │
        ▼
Extract NEW release
        │
        ▼
Attach .env + persistent storage
        │
        ▼
Composer install --no-dev
        │
        ▼
Laravel staged boot
        │
        ▼
Database connectivity
        │
        ▼
Safe migrations
        │
        ▼
Laravel optimize
        │
        ▼
Staged smoke checks
        │
        ▼
READY FOR ACTIVATION
        │
        ▼
Maintenance mode if necessary
        │
        ▼
Preserve current release
        │
        ▼
Atomic/guarded release swap
        │
        ▼
Internal health check
        │
        ├── Laravel
        ├── MySQL
        ├── cache
        ├── release ID
        └── filesystem
        │
        ▼
Frontend smoke check
        │
        ├── index.html
        └── hashed JS
        │
        ▼
External public health check
        │
        ▼
              PASS?
             /     \
           YES      NO
            │        │
            │        ▼
            │     ROLLBACK
            │        │
            │        ▼
            │     verify old release
            │
            ▼
     Commit deployment
            │
            ▼
      Laravel artisan up
            │
            ▼
      Final readiness test
            │
            ▼
     Prune old releases
            │
            ▼
       Prune assets
            │
            ▼
      Release lock
            │
            ▼
       SUCCESS
```

---

# 66. HOW THIS PREVENTS THE CURRENT SKUGGLE FAILURES

## White blank screen

Protected by:

```text
React Error Boundary
stale chunk recovery
one-time controlled reload
correct HTML cache policy
frontend smoke test
version detection
```

## Menus suddenly stop clicking

Protected by:

```text
frontend/backend version matching
service-worker lifecycle handling
old chunk transition window
React error capture
API interceptor stability
preventing repeated render/request loops
```

## Thousands of console errors

Protected by:

```text
bounded retries
request deduplication
global exception handling
no duplicate interceptor registration
no uncontrolled polling
no infinite stale-chunk reload
```

## Old frontend talking to new backend

Protected by:

```text
RELEASE_ID
version endpoint
no-cache index.html
PWA update strategy
frontend/backend release comparison
```

## Half-installed Laravel application

Protected by:

```text
Composer before activation
Laravel validation before activation
optimization before activation
```

## Failed deployment destroying the working application

Protected by:

```text
immutable releases
deployment transaction state
previous release preservation
automatic rollback
post-rollback health check
```

## Two deployments corrupting each other

Protected by:

```text
deployment lock
unique artifacts
unique release directories
```

## Broken migration followed by broken rollback

Reduced through:

```text
expand-deploy-contract migration model
backward-compatible schema changes
migration classification
```

## Shared-hosting disk gradually filling

Protected by:

```text
release retention
artifact cleanup
asset pruning
disk check
inode check
log retention
```

## Hostinger uses wrong PHP during Composer

Protected by explicitly invoking:

```text
/opt/alt/php83/usr/bin/php
```

for Composer and Laravel commands.

---

# 67. PRODUCTION DEPLOYMENT PRINCIPLE

Skuggle's deployment model should therefore be:

```text
BUILD ONCE
VALIDATE COMPLETELY
PREPARE OFFLINE
MIGRATE SAFELY
ACTIVATE ONCE
VERIFY PUBLICLY
ROLL BACK AUTOMATICALLY
```

and never:

```text
upload files
replace production
install dependencies
clear random caches
refresh browser
hope it works
```

The first is a release system.

The second is an incident generator.
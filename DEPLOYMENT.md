# Skuggle deployment

Skuggle is deployed as a Vite SPA plus a Laravel application on Hostinger shared hosting. The canonical layout and runtime commands live in `backend/deploy/shared-hosting`.

## Release model

Each deploy gets a unique id `YYYYMMDD-HHmmss-<gitsha>`. The tarball is uploaded to `~/deployments/skuggle/artifacts/<id>/`, extracted and prepared **offline**, then swapped into Hostinger's live document root:

```text
~/deployments/skuggle/
  artifacts/<id>/release.tar.gz
  shared/.env
  shared/storage/          # uploads, logs, cache files (survives swaps)
  backups/                 # previous live trees (keep 5)
  logs/<id>.log
  locks/deploy.lock

~/domains/skuggle.royalgatewayadmin.com/
  application/             # live Laravel tree after activation
  public_html/             # live SPA + index.php bridge
```

Composer, migrations, and `artisan` optimize run against the staged release **before** `application/` and `public_html/` are replaced. Failed health checks restore the previous live tree. Database migrations are classified (`SAFE` / `CAUTION` / `DESTRUCTIVE`) and **are not rolled back automatically**. Dropping or renaming columns in `up()` is blocked unless you pass `-AllowDestructiveMigrations` (or `ALLOW_DESTRUCTIVE_MIGRATIONS=true`). Prefer expand → deploy → contract: add the new column, ship dual-write code, then remove the old column in a later release.

## SSH key formats

Local OpenSSH uses `skuggleSSH/id_rsa`; its matching one-line public key is `skuggleSSH/id_rsa.pub`. The original PuTTY and RFC4716 forms are retained as `id_rsa.ppk` and `id_rsa.pub.rfc4716`. The entire directory is git-ignored. Never commit or paste a private key into a workflow.

For GitHub Actions, store the complete contents of the OpenSSH private key as the `HOSTINGER_SSH_KEY` secret. Also configure `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_USER`, `HOSTINGER_DB_DATABASE`, `HOSTINGER_DB_USERNAME`, and `HOSTINGER_DB_PASSWORD`. `HOSTINGER_APP_KEY` is optional for a first deployment.

## Local deployment

From PowerShell at the repository root:

```powershell
.\scripts\deploy-hostinger.ps1 -WhatIf
.\scripts\deploy-hostinger.ps1
```

The script requires a clean git tree on `main` or `master`, records a release id, runs quality gates, builds with `VITE_BUILD_ID`, packages `application/` + `public_html/` + `release-manifest.json` (never `.env`), uploads to a unique artifact path, and runs `remote-deploy.sh` on the server. After activation it checks `GET /ready` for `status=ready` and a matching `release`, then fetches `/`.

Overrides:

- `-AllowDirtyWorkingTree` — deploy uncommitted files (recorded in the manifest)
- `-AllowNonMainBranch` — deploy from a branch other than main/master
- `-SkipChecks` / `-SkipBuild` — only when the corresponding work already succeeded for the same checkout
- `-AllowDestructiveMigrations` — run pending `up()` methods that drop or rename schema (default: blocked)

The `deploySample` files are reference material for another application and must not be executed for Skuggle: they contain different paths and domain names, and one includes a plaintext password.

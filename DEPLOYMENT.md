# Skuggle deployment

Skuggle is deployed as a Vite SPA plus a Laravel application on Hostinger shared hosting. The canonical layout and runtime commands live in `backend/deploy/shared-hosting`.

## SSH key formats

Local OpenSSH uses `skuggleSSH/id_rsa`; its matching one-line public key is `skuggleSSH/id_rsa.pub`. The original PuTTY and RFC4716 forms are retained as `id_rsa.ppk` and `id_rsa.pub.rfc4716`. The entire directory is git-ignored. Never commit or paste a private key into a workflow.

For GitHub Actions, store the complete contents of the OpenSSH private key as the `HOSTINGER_SSH_KEY` secret. Also configure `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, `HOSTINGER_SSH_USER`, `HOSTINGER_DB_DATABASE`, `HOSTINGER_DB_USERNAME`, and `HOSTINGER_DB_PASSWORD`. `HOSTINGER_APP_KEY` is optional for a first deployment.

## Local deployment

From PowerShell at the repository root:

```powershell
.\scripts\deploy-hostinger.ps1 -WhatIf
.\scripts\deploy-hostinger.ps1
```

The script validates the key, tests both applications, builds, packages without `.env`, verifies a SHA-256 checksum remotely, preserves the production `.env`, swaps the release, rolls back the file swap if release commands fail, retains five backups, and verifies `/ready`.

Use `-SkipChecks` or `-SkipBuild` only when the corresponding work has already succeeded for the same checkout.

The `deploySample` files are reference material for another application and must not be executed for Skuggle: they contain different paths and domain names, and one includes a plaintext password.

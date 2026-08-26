# Skuggle Launch Readiness Status

**Updated:** 26 August 2026  
**Product posture:** Enterprise SaaS platform modules are implemented and wired end-to-end.  
**Ops posture:** Go-live gates are executable via artisan + HQ System health. Complete them on the target host before live school PII.

**Runbook:** [`docs/GO_LIVE_OPS_RUNBOOK.md`](./GO_LIVE_OPS_RUNBOOK.md)

**Note:** Google OAuth is implemented in code but **suspended** (`GOOGLE_OAUTH_ENABLED=false` / `VITE_GOOGLE_OAUTH_ENABLED=false`) until paid Google Cloud credentials are available. Email/password registration remains the supported path.

---

## Platform capability (shipped)

| Module | Status |
|--------|--------|
| Public marketing + school/individual registration | Live |
| Auth (login, logout, email verification, forgot/reset password) | Live |
| Privileged MFA gate on mutating API routes | Enforced |
| Privileged MFA enrollment redirect + status audit | Live (`mfa:privileged-status`) |
| Demo Quick Login chips | Dev / `VITE_ENABLE_DEMO` only |
| Platform HQ overview, schools, usage, system health, go-live gates | Live APIs |
| Platform helpdesk / billing / broadcasts / backups / credential metadata | Live |
| School staff invites (API + queued email) | Live |
| Personal spaces (student / parent / teacher) | Live |

---

## Go-live gates (target host)

| Gate | How to complete | Sign-off |
|------|-----------------|----------|
| Privileged MFA enrollment | `php artisan mfa:privileged-status --strict` + `/security/mfa` | Operator checklist in runbook |
| Transactional mail | Configure `MAIL_*`, `php artisan mail:smoke …`, prove verify/reset/invite | Inbox evidence |
| Backup + restore drill | Nightly `backup:database`, quarterly restore | [`RESTORE_DRILL_SIGN_OFF.md`](./RESTORE_DRILL_SIGN_OFF.md) |
| Security sign-off | Pen-test checklist + CI security | [`SECURITY_SIGN_OFF.md`](./SECURITY_SIGN_OFF.md) |

Aggregate: `php artisan ops:go-live-check --strict`  
HQ UI: Super Admin → System health → Go-live gates (`GET /platform/go-live`)

---

## Recent hardening (this cycle)

- Invite emails queued via `TenantInvitationNotification`  
- Password-reset links point at SPA `/reset-password`  
- Real `backup:database` / `backup:files` + scheduler entries  
- `mail:smoke`, `mfa:privileged-status`, `ops:go-live-check`  
- Platform `/platform/go-live` compliance endpoint  
- MFA required users redirected into `/security/mfa` before workspace use  

---

## Document authority

Treat this file as the current launch status. Older claims such as “FRONTEND PRODUCTION READY” or “backend 7/100” are superseded.

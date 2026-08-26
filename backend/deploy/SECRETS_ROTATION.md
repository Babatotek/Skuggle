# Secrets Rotation Runbook

**Last updated:** 2026-08-25  
**Owner:** Platform / DevOps  
**Cadence:** Quarterly (or immediately after any suspected leak)

---

## Inventory

| Secret | Where used | Env var | Rotation impact |
|--------|------------|---------|-----------------|
| Application key | Encryption, cookies, signed URLs | `APP_KEY` | Invalidates all sessions & signed URLs |
| Database password | MySQL/Postgres | `DB_PASSWORD` | Brief reconnect blip; update replicas too |
| Redis password | Cache / queue / Horizon | `REDIS_PASSWORD` | Flush connections; restart workers |
| Sanctum / session | Implicit via `APP_KEY` | — | Covered by `APP_KEY` |
| Payment webhook | Paystack/Flutterwave callbacks | `PAYMENT_WEBHOOK_SECRET` | Coordinate with provider dashboard |
| Sentry DSN | Error reporting | `SENTRY_LARAVEL_DSN` | Low — create new project key, swap |
| AI provider keys | Groq / Gemini | `GROQ_API_KEY`, `GEMINI_API_KEY` | Instant; invalidate old key in console |
| AWS / R2 credentials | Object storage | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Dual-key window recommended |
| Mail credentials | Transactional email | `MAIL_*` | Update provider + `.env` |
| Horizon admin list | Dashboard gate | `HORIZON_ADMIN_EMAILS` | Not a secret — access control only |

Never commit real values. Only `.env.example` (placeholders) belongs in git.

---

## Standard rotation procedure

1. **Announce** a maintenance window if the secret invalidates sessions (`APP_KEY`) or DB auth.
2. **Generate** the new secret in the provider console (or `php artisan key:generate --show` for `APP_KEY`).
3. **Dual-run window** (where supported): keep old + new valid for 15–60 minutes.
4. **Update** production secrets store (hosting panel, Vault, AWS SM, etc.) — not only the server `.env`.
5. **Deploy / reload**:
   ```bash
   php artisan config:clear
   php artisan config:cache
   php artisan horizon:terminate   # if using Horizon
   # restart php-fpm / octane / queue workers
   ```
6. **Verify** health: `GET /ready`, login smoke test, one payment webhook replay (sandbox), one file upload.
7. **Revoke** the old secret at the provider after verification.
8. **Log** the rotation in the ops changelog (date, secret name, operator, ticket).

---

## APP_KEY rotation (high impact)

```bash
# 1. Capture current key for rollback
grep APP_KEY .env

# 2. Generate new key (do not write yet)
php artisan key:generate --show

# 3. Set APP_KEY in secrets store, then:
php artisan config:cache
# Restart all app processes

# 4. Expect: all users re-authenticate; old signed storage URLs fail
```

Notify school admins if signed result/share links are in active use.

---

## Database password

1. Create new DB user **or** alter password with a dual-user cutover.
2. Update `DB_PASSWORD` (and read-replica credentials if set).
3. `php artisan config:cache` + rolling restart of app nodes.
4. Drop old credentials only after all nodes report healthy `/ready`.

---

## Object storage (S3 / R2)

Prefer **two access keys** during cutover:

1. Create key B with same IAM/R2 permissions as key A.
2. Deploy key B to half the fleet, then the rest.
3. Delete key A after 24h of clean logs.

---

## Payment webhook secret

1. Generate new secret in the payment provider dashboard.
2. Deploy `PAYMENT_WEBHOOK_SECRET` to all API nodes **before** switching the provider to the new secret (or use provider dual-secret if available).
3. Send a test webhook; confirm `PaymentController` accepts it.
4. Disable the old secret.

---

## AI API keys

1. Create a new key in Groq/Gemini console.
2. Update env and cache config.
3. Hit a low-cost AI endpoint; confirm 200.
4. Revoke the previous key.

---

## Emergency (suspected leak)

1. Rotate **all** secrets in the inventory within 1 hour (start with `APP_KEY`, DB, storage, payment).
2. Revoke Sanctum tokens if user compromise is suspected: truncate or purge `personal_access_tokens`.
3. Review `audit_logs` for anomalous platform-admin and webhook activity.
4. Open an incident ticket; preserve logs before rotation if forensics are needed.

---

## Checklist (copy per rotation)

- [ ] Ticket / change record created  
- [ ] New secret generated offline / in vault  
- [ ] Dual-run window planned (if applicable)  
- [ ] Production env / secrets store updated  
- [ ] `config:cache` + workers restarted  
- [ ] `/ready` returns 200  
- [ ] Auth + one critical path verified  
- [ ] Old secret revoked  
- [ ] Changelog updated  

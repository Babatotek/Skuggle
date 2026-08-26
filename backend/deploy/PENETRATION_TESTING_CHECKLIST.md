# Penetration Testing Checklist

**Last updated:** 2026-08-25  
**Scope:** Skuggle Laravel API (`backend/`)  
**Cadence:** Before production launch, then after major auth/tenancy changes

Use this checklist with an external tester or internal red-team exercise.  
Mark each item Pass / Fail / N/A and attach evidence (request IDs, screenshots, logs).

---

## 0. Preconditions

- [ ] Staging environment mirrors production middleware, HTTPS, and storage disk  
- [ ] Test tenants A and B seeded with distinct students/library data  
- [ ] Platform-admin and school-admin accounts available  
- [ ] ClamAV (or scanner) enabled if production requires it  
- [ ] Rate limits and MFA flags match production config  

---

## 1. Authentication & session

- [ ] Brute-force login limited (IP + email throttles)  
- [ ] Invalid credentials do not leak whether email exists  
- [ ] Password policy enforced (length, complexity, pwned check)  
- [ ] MFA required for privileged roles  
- [ ] Sanctum token revoked on logout; cannot reuse  
- [ ] Session cookie flags: Secure, HttpOnly, SameSite appropriate  
- [ ] Password reset tokens single-use and time-limited  

---

## 2. Multi-tenant isolation (critical)

- [ ] Tenant A token cannot `GET` Tenant B student by public_id  
- [ ] Tenant A cannot list Tenant B library private resources  
- [ ] Changing `X-Tenant-Id` / membership header to another tenant is rejected  
- [ ] Suspended / inactive tenant returns forbidden  
- [ ] `withoutGlobalScopes()` platform routes require platform-admin gate  
- [ ] Public library endpoints only return `is_public=1` + published  
- [ ] Background jobs set tenant context before scoped queries  
- [ ] Raw / `whereRaw` queries include `tenant_id` where applicable  

Run automated suite: `vendor/bin/phpunit tests/Feature/TenantIsolationTest.php`

---

## 3. Authorisation (RBAC)

- [ ] Teacher cannot access finance / platform endpoints  
- [ ] Parent only sees linked students  
- [ ] Permission middleware denies missing abilities with 403  
- [ ] IDOR: swapping public_ids across roles fails  
- [ ] Mass assignment does not accept `tenant_id` / `id` from client  

---

## 4. Input & injection

- [ ] SQL injection attempts on search/filter params blocked (Eloquent / bindings)  
- [ ] XSS in announcement / message fields stored safely (API returns encoded or plain; clients escape)  
- [ ] Path traversal in upload filenames blocked  
- [ ] Oversized JSON body rejected  
- [ ] Content-Type confusion on file uploads rejected  

---

## 5. File upload security

- [ ] Extension allowlist enforced  
- [ ] MIME / magic-byte mismatch rejected  
- [ ] Executable disguised as PDF/PNG rejected  
- [ ] Virus scanner fails closed when required in production  
- [ ] Uploaded files not served from executable web paths  
- [ ] Signed download URLs expire  

Run: `vendor/bin/phpunit tests/Unit/Services/UploadSecurityScannerTest.php`

---

## 6. API abuse & rate limits

- [ ] Login throttle trips and returns 429  
- [ ] AI endpoints throttled per user  
- [ ] Upload endpoints throttled  
- [ ] Public results / PIN endpoints throttled per IP  
- [ ] Idempotency key prevents duplicate payments / critical POSTs  

---

## 7. Webhooks & secrets

- [ ] Payment webhook rejects bad signatures  
- [ ] Replay of old webhook body with valid signature handled safely (idempotent)  
- [ ] Webhook secret not logged in plaintext  
- [ ] Debug / Telescope / Pulse / Horizon not publicly reachable without gate  

---

## 8. Transport & headers

- [ ] HTTPS only in production; HSTS present  
- [ ] Security headers middleware present (`X-Content-Type-Options`, `X-Frame-Options`, CSP for API)  
- [ ] CORS allows only known frontend origins  
- [ ] `TRUSTED_PROXIES` is not `*` in production  

---

## 9. Business logic

- [ ] Quota enforcement blocks over-limit student / AI / storage creates  
- [ ] Result PIN cannot enumerate other students’ results  
- [ ] Subscription downgrade cannot leave orphan elevated access without grace rules  

---

## 10. Infrastructure

- [ ] `/health` and `/live` do not expose secrets  
- [ ] `/ready` fails when DB is down  
- [ ] Local disk not used for durable uploads in production (`FILESYSTEM_DISK=s3|r2`)  
- [ ] Error responses omit stack traces in production  

---

## 11. Reporting template

| ID | Finding | Severity | Repro | Impact | Remediation |
|----|---------|----------|-------|--------|-------------|
| PT-001 | | Critical/High/Med/Low | | | |

Severities: **Critical** = cross-tenant data leak or auth bypass; ship blocked.  
**High** = privilege escalation or RCE/upload bypass.  
**Medium** = rate-limit gaps, info disclosure.  
**Low** = hardening gaps.

---

## 12. Sign-off

- [ ] All Critical/High findings closed or explicitly accepted by product owner  
- [ ] Tenant isolation tests green in CI  
- [ ] Security workflow (Composer audit + scope bypass check) green  
- [ ] Tester name / date / environment recorded  

**Tester:** _________________ **Date:** ________ **Environment:** ________

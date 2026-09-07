# Browser E2E automation plan

## Objective

Add credentialed Playwright execution to CI without embedding credentials or weakening tenant/security assertions. This is a future implementation specification only; Gate A work does not implement Wave 2.

## Harness design

- Add `@playwright/test` as a pinned development dependency and install the supported Chromium binary in CI.
- Read `E2E_BASE_URL` and persona credentials from CI secrets or an ignored local configuration. Fail closed when required variables are absent and redact secrets from logs.
- Provision deterministic non-production School A, School B, assignments, parent-child links, and self/foreign student fixtures through test seeders.
- Use one isolated browser context per persona; never reuse cookies across roles. Capture trace, screenshot, Console events, failed responses, request counts, and tenant-identifying response assertions.
- Encode the runbook matrix as persona projects plus shared route assertions. Treat unexpected 401/403/404/500+, loopback requests, uncaught errors, request storms, and tenant mismatches as failures.
- Upload redacted evidence artifacts with restricted retention. Run desktop on every release candidate and a mobile subset; schedule the full matrix and keep it available for manual dispatch.

## CI gate

The job depends on a disposable seeded environment, runs against the same release SHA, and blocks release on test failure or missing required secrets/environment. Expected authorization failures are explicit assertions. No retries may convert a deterministic security failure into a pass.

## Acceptance

All operational persona rows, workspace transitions, cross-tenant negative cases, Console/Network assertions, and responsive smoke pass twice on a clean database. Release Operations owns environment/secrets; QA owns scenarios; Security owns cross-tenant and authorization assertions.

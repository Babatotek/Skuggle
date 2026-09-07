# Gate A credentialed browser smoke runbook

## Status and prerequisites

Use a non-production local or staging environment at the release SHA, Chrome/Chromium or Edge with desktop and mobile viewports, a clean test database seeded with two schools where possible, and access to browser Console, Network, screenshots, and traces. Never use or record production credentials.

Required environment variables are `E2E_BASE_URL` plus persona-specific email/password pairs for platform super admin, school super admin, school admin, principal, teacher, parent, and student. Supply them through CI secrets or a local ignored environment file; do not echo values. Local demo accounts may be provisioned by `DemoUsersSeeder` only in a permitted non-production environment.

## Start the application

1. Prepare the backend test environment and database from `backend`: `composer install`, configure the ignored `.env`, run `php artisan migrate:fresh --seed`, then `php artisan serve --host=127.0.0.1 --port=8000`.
2. From the repository root run `npm ci`, set the frontend API URL to the local backend using the existing environment contract, then run `npm run dev`.
3. Confirm the health endpoint and login page respond before starting evidence capture.

## Persona and flow matrix

- Platform Super Admin: login → Platform Console → tenant list → logout.
- School Super Admin: Dashboard → Students → Admissions → Academics → Assessment → Attendance → Finance → Administration → school/personal workspace switch → logout.
- School Admin: delegated operations; governance restrictions rejected by the server.
- Principal: Dashboard → Academics → Assessment/Performance → Attendance → People → implemented Reports/Communication.
- Teacher: assigned academics → Attendance → Assessment → permitted student; foreign/unassigned resource denied.
- Parent: linked child; unrelated child denied; implemented results, attendance, and finance.
- Student: own data; another student's data denied.
- Personal Space: school → personal → school; no stale tenant data.
- Multi-tenant: School A → School B; identity/navigation/API context change and School A data absence.

## Assertions for every route

Verify navigation responds, primary content becomes usable, no white screen, uncaught exception, infinite loading, request storm, localhost request, tenant mismatch, unexpected 401/403/404, or 500+. Label expected authorization rejections with action and expected status. Inspect Console and Network after every route.

Repeat core login, dashboard, workspace switch, and one data page at desktop (1440×900) and mobile (390×844). Record release SHA, environment, tenant fixture label, persona (never secret), browser/version, viewport, operator, timestamps, route, result, console counts, expected/unexpected network statuses, redacted evidence links, and issue IDs.

PASS means every implemented required row passes with no unexplained P0/P1 issue. FAIL means a reproducible assertion fails. BLOCKED means prerequisites, credentials, environment, or evidence tooling prevent execution; it is not a pass.

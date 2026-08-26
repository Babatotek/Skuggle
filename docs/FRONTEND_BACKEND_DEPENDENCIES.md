# Skuggle Frontend Backend Dependencies

Last updated: 21 August 2026

## Required platform contract

The frontend defaults to `VITE_API_URL=/api` and `VITE_CSRF_URL=/sanctum/csrf-cookie`. It expects same-site or correctly configured cross-site secure cookies, JSON responses, and Laravel-style CSRF protection. Production must use HTTPS.

Required response conventions:

- Success may be direct JSON or `{ "data": ... }`.
- Validation failures use HTTP 422 and preferably `{ message, errors: { field: string[] } }`.
- Pagination uses `{ data, meta: { currentPage, perPage, total, lastPage } }`.
- Conflicting offline revisions use HTTP 409.
- Rate limits use HTTP 429 and `Retry-After` where possible.
- Downloads provide `Content-Disposition` and an authorised, short-lived URL or endpoint.
- Each error should include `X-Request-Id` for support correlation.

## Authentication and tenant requirements

| Contract                     | Purpose                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `GET /auth/me`               | Restore user, tenant, role, permissions, campus/session/term context |
| `POST /auth/login`           | Authenticate without returning browser-stored bearer tokens          |
| `POST /auth/logout`          | Revoke server session                                                |
| `POST /auth/forgot-password` | Return a privacy-neutral response                                    |
| `GET /auth/contexts`         | Return authorised campuses, sessions, and terms                      |
| `PUT /auth/context`          | Change current context and return/enable a refreshed session         |

The backend must ignore client-provided tenant identity for authorization and derive scope from the authenticated session. Cookies should be `Secure`, `HttpOnly` for the session, and appropriately `SameSite`; the CSRF cookie must remain readable only as required by Laravel’s double-submit mechanism.

## Feature endpoints

| Area                | Frontend contract                                                                      | Required behavior                                                              |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| School registration | `POST /schools/register`                                                               | Atomic school + first administrator creation; multipart logo; 422 field errors |
| Dashboard           | `GET /dashboards/{experience}`                                                         | Only authorised widgets/metrics/tasks; nullable unavailable values             |
| Onboarding          | `GET /onboarding`, `PATCH /onboarding/steps/{id}`                                      | Server-confirmed progress and launch readiness                                 |
| Student directory   | `GET /students`                                                                        | Search, filters, sort, pagination, tenant/permission scope                     |
| Student detail      | `GET /students/{id}`                                                                   | Return only permission-approved sections                                       |
| Student creation    | `GET /lookups/student-registration`, `POST /students`                                  | Multiple guardians and optional photo                                          |
| Student import      | template, inspect, validate, confirm, error-report endpoints under `/students/imports` | No records committed before explicit confirm                                   |
| Attendance          | `GET /attendance/classes`, `GET/PUT /attendance/classes/{id}`                          | Revision token, assigned classes, conflict response                            |
| Assessments         | `GET/POST /assessments`, `GET /lookups/assessment-creation`                            | Configured class/subject/type validation                                       |
| Score entry         | `GET/PUT /assessments/{id}/scores`                                                     | Revision token, range validation, explicit workflow separation                 |
| Results             | `GET /results` plus backend workflow actions when exposed                              | Draft → submitted → review → approved → locked → published/reopened            |
| Public result check | `POST /public/results/check`                                                           | Neutral 401/404/422 errors, rate limiting, published results only              |
| Parent portal       | `GET /parent/children`                                                                 | Only verified guardian-child links                                             |
| Reports             | `GET /reports`, `POST /reports/jobs`, job status/download URL                          | Server-owned generation, auditable export, expiry                              |
| Collections         | endpoints named in `router.tsx`                                                        | Authorised list items or honest empty response                                 |

## Offline synchronization dependency

Attendance and score entry can store local drafts with a server revision. The frontend intentionally does not run a background sync engine without a backend idempotency and conflict contract. To enable automated replay, the backend must provide:

- idempotency keys for each pending operation;
- revision/ETag comparison;
- explicit 409 conflict payloads with the latest revision;
- authorization revalidation at replay time;
- an audit event for accepted changes;
- a safe rule for expired academic periods and locked results.

Until that exists, pending drafts remain visibly pending and require an authorised user to reconcile them.

## Known backend blockers

The repository’s Express development wrapper currently exposes health and legacy AI prototype endpoints, not the Laravel contracts above. Therefore authenticated dashboards and operational workflows cannot complete end to end in this repository alone. The frontend is API-ready and deliberately does not substitute mock responses.

Before production launch, the product owner must also provide approved Privacy and Terms content; the current pages explicitly disclose that final legal text is pending.

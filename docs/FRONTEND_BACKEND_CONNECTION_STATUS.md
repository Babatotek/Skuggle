# Frontend-to-backend connection status

Verified against the current React source and Laravel `/api/v1` routes on 2026-08-27. A backend endpoint existing does not mean its current screen is connected.

## Connected now

| Frontend flow | Backend path | Status |
|---|---|---|
| Session restore and logout | `/auth/me`, `/auth/logout` | Connected |
| School/personal sign-in and enforced MFA enrollment | `/auth/login`, `/auth/mfa/*` | Connected |
| School registration and verification dispatch | `/schools/register` | Connected |
| School-admin MFA policy | `/auth/mfa`, `/auth/mfa/policy` | Connected |
| Notification inbox and unread badge | `/notifications`, `/notifications/*/read`, `/notifications/read-all` | Connected; immediate local action feedback is merged with persisted server notifications |
| Student registry initial list | `/students` | Connected for reads; create/update UI still uses context state |

## Partially connected

| Module | What remains |
|---|---|
| Authentication | Current UI lacks forgot/reset-password and verification-status screens; optional self-enrollment/recovery-code management needs a permanent account-security page |
| Student registry | Wire create, edit, document upload, import validation/confirmation, pagination, server filters, and field-level validation errors |
| AI tools | Some screens call Vite/Node `/api/gemini/*`; consolidate them behind Laravel's authenticated, tenant-scoped AI gateway and quotas |
| Offline/PWA sync | Service worker is safe, but current offline queue is in-memory/demo behavior and must use `/sync` plus durable IndexedDB conflict handling |
| Subscription | Plan and active-subscription APIs exist; upgrade/approval/payment UI remains local prototype state |
| Workspace switching | Backend endpoints exist; the current workspace modal/state is not fully hydrated from `/auth/memberships` and `/auth/switch-workspace` |

## Not connected from the current frontend

- Attendance register and class attendance submission
- Academic sessions, terms/context, campuses, classes, subjects, departments, and timetable
- Staff/employee management, invitations, printable/QR credentials, and permission management
- Assessments, score entry, CBT quizzes, SmartMark/OCR, result generation, approval, publishing, report cards, and PIN batch management
- Fees, invoices, payment recording, receipts, provider checkout/webhooks, and reconciliation
- Announcements, broadcasts, messages, notification inbox persistence, delivery preferences, and notification delivery audit
- Reports, exports, queued report jobs, and downloads
- Onboarding checklist, student import, custom fields, and branding persistence
- Parent children/linking, parent payments, attendance, results, and messaging views
- Teacher profile, lesson plans, assigned classes, and curriculum workflows
- Student learning, progress, assessments, library activity, and personal planner
- Smart Library management, annotations, assignments, practice, summaries, and recommendation data
- Platform owner schools, subscriptions, usage, support tickets, health, backups, broadcasts, invoices, audit, and governance operations
- Global search and command palette

## Required integration standard

Each remaining module should use the centralized API client, CSRF/session cookies, tenant context, idempotency keys for mutations, typed request/response contracts, field-level `422` errors, permission-aware empty states, abortable requests, loading/retry states, and automated feature tests. Mock mutations must not run in production.

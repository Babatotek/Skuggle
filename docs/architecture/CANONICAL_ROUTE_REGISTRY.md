# Canonical Route Registry

Authoritative compiled source: `src/routing/registry.ts` (`CANONICAL_ROUTES`). Helpers: `routeById()`, `buildRoute()`, `matchRoute()`, `workspaceDefaultRoute()`. Unknown IDs throw `UnknownRouteIdError` in development/tests/CI.

Route identity is stable and independent of sidebar labels. Role/persona is never a route owner. Backend authorization remains authoritative; `access.capabilities` is frontend exposure metadata only.

## Workspace roots

| Workspace | Root | Default route ID |
|---|---|---|
| School | `/school/...` | `school.home` |
| Personal | `/personal/...` | `personal.home` |
| Platform | `/platform/...` | `platform.overview` |
| Public | `/`, `/welcome`, `/results`, `/register` | — |
| Auth | `/login`, `/school/login`, `/reset-password`, `/verify-email`, `/join`, `/session` | — |
| Relate | `/relate` | placeholder, not implemented |

Tenant slugs are **not** part of authenticated School URLs. Public tenant entry uses `/welcome?school=` or legacy `/s/{slug}` aliases. Server TenantContext remains authority.

## School ownership (IA-aligned IDs)

| Domain | Canonical IDs (representative) | Path prefix |
|---|---|---|
| Home | `school.home` | `/school` |
| People | `school.people.students`, `.profile`, `.guardians`, `.workforce`, `.teachers`, `.invitations` | `/school/people/...` |
| Admissions | `school.admissions` + applications/screening/decisions/enrolment/settings | `/school/admissions/...` |
| Academics | `school.academics` + curriculum/planning/allocation/resources/timetable | `/school/academics/...` |
| Assessment | `school.assessment` + assessments/question-bank/exam-schedule/marking/settings/cbt | `/school/assessment/...` |
| Performance | `school.performance` + results/report-cards/broadsheet/analytics/at-risk/interventions | `/school/performance/...` |
| Learning resources | `school.learning-resources` | `/school/learning-resources` |
| Attendance / Finance / Services / Operations | `school.attendance`, `school.finance`, `school.student-services`, `school.operations` | matching prefixes |
| Engagement | `school.communication`, `.messages`; `school.calendar` (placeholder) | `/school/communication`, `/school/calendar` |
| Insights | `school.insights.analytics`, `school.insights.reports` | `/school/insights/...` |
| Administration | school-setup, users-access, roles-permissions, forms, workflows, integrations, subscription, security, audit, branding | `/school/administration/...` |
| Help | `school.help` | `/school/help` |

Assessment types (continuous / tests / examinations) are **query `type=` or aliases**, not competing top-level products.

## Other families

- Personal: `personal.home`, `personal.learning-resources`, `personal.assessment`, `personal.subscription`, `personal.help`
- Platform: `platform.overview`, `platform.tenants`, `platform.health`, `platform.governance`, `platform.help` — require PLATFORM workspace, never implied by “no tenant”
- Public/auth as listed above; `public.not-found` is `/not-found` (unknown URLs keep the typed path and render the same surface)

## Parameters and query

- Resource identity: path params (`:studentPublicId` as opaque public ID, not numeric DB IDs).
- Filter/view state: query (`q`, `page`, `view`, `type`, `audience`). No form drafts, secrets, or tenant authority in query.
- Invalid public IDs → 404. Invalid filters → drop or default. Ordinary malformed input must not 500.

## Navigation API (Wave 9 consumption, not a menu)

`routeById`, `buildRoute`, `matchRoute`/`matchCanonicalPath`, `workspaceDefaultRoute`, `legacyNavIdForRoute`, `routeFromLegacyNavId`. Breadcrumb metadata is structural labels only; resource titles stay with the page.

## Page adapter

`LegacyPageAdapter` maps `pageKey` to existing views. Owner: Frontend Platform. Removal: domain waves 8–10+. Not permanent architecture.

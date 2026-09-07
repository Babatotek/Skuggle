# Legacy Route Compatibility Map

Explicit, closed mappings. No fuzzy/wildcard guessing. Unknown leftover tabs are **not** redirected to Home; they 404.

Mode: **redirect** (`replace`) unless noted. Query strings are preserved when `preserveQuery` is true, except obsolete tenant IDs are never treated as authorization. Owner: Frontend Platform. Removal wave: **24** (or earlier once bookmarks are drained).

Source of truth: `src/routing/aliases.ts` plus `LEGACY_NAV_TO_ROUTE_ID` in `src/routing/registry.ts`.

## App tab aliases

| Old path | Canonical target | Reason |
|---|---|---|
| `/app` | Workspace default (`school.home` alias target; runtime `/session` uses active workspace) | Pre-Wave-7 app root |
| `/app/home` | `school.home` | Explicit home tab |
| `/app/{navId}` for every closed nav ID (students, parents, assessments, finance, …) | Matching canonical ID | Pre-Wave-7 tab URLs |

If `{navId}` is not in the closed index → **no alias match → 404**.

Representative:

| Old path | Canonical |
|---|---|
| `/app/students` | `/school/people/students` |
| `/app/parents` | `/school/people/guardians` |
| `/app/people`, `/app/staff` | `/school/people/workforce` |
| `/app/teachers` | `/school/people/workforce/teachers` |
| `/app/admissions-overview` | `/school/admissions` |
| `/app/academics` | `/school/academics` |
| `/app/assessments` | `/school/assessment` |
| `/app/continuous-assessment`, `/app/tests`, `/app/examinations` | `/school/assessment/assessments` |
| `/app/question-bank` | `/school/assessment/question-bank` |
| `/app/exam-scheduling` | `/school/assessment/exam-schedule` |
| `/app/results` | `/school/performance/results` |
| `/app/report-cards` | `/school/performance/report-cards` |
| `/app/attendance` | `/school/attendance` |
| `/app/finance` | `/school/finance` |
| `/app/platform` | `/platform` |
| `/app/help-support` | `/school/help` |

## Tenant prefixes (public entry / legacy app)

| Old path | Canonical | Notes |
|---|---|---|
| `/s/:schoolKey`, `/t/:schoolKey` | `/welcome?school=` | Public tenant welcome; slug is branding hint |
| `/school/:schoolKey` when `:schoolKey` is **not** a reserved canonical segment | `/welcome?school=` | Distinguishes `/school/people` from `/school/{tenant}` |
| `/s/:schoolKey/app`, `/t/:schoolKey/app`, `/school/:schoolKey/app` | School home (then workspace default after auth) | Drop slug from authenticated URL |
| `.../app/:tab` with known tab | Canonical for that tab | Unknown tab → 404 |
| `/join` | `auth.join` (school auth page) | Preserve token/school query |

Reserved school segments include `login`, `people`, `admissions`, `academics`, `assessment`, `performance`, `attendance`, `finance`, `administration`, `help`, and other compiled first segments from the registry.

Telemetry: `legacy_alias_used` (alias id + target id, no PII).

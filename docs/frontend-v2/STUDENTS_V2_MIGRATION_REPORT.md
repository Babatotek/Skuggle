# Students V2 migration report

## Scope

`/school/people/students` and its public-ID profile route now render `StudentsPage` directly. The page uses API-hydrated records, canonical `hasCapability('students.profile.create')`, existing enrolment/profile behavior, the route builder, design-system controls, and responsive table/card representations.

## Reused

App/workspace/access state, API hydration, tenant theme resolver, canonical router and route builder, `DataTable`, `Button`, `Select`, `Modal`, `StatusBadge`, enrolment wizard, and student profile.

## Bypassed

`LegacyPageAdapter`, legacy `StudentRegistryView` page composition, `ModuleWorkspace`, legacy domain tabs, and duplicate page headers are absent from the live Students path. `StudentRegistryView` is retained and marked `LEGACY_FRONTEND_V1` for controlled rollback.

## Behavior

Metrics derive from current records. Search, class, status, and fee filters are local projections. Empty, loading, and error presentations remain bounded within the shell. Create visibility is capability-driven. Row navigation builds the canonical public-ID profile URL.

## Evidence

TypeScript, architecture guard, focused component tests, the full 63-test Vitest suite, and the production build pass. The connected browser surface was unavailable; 1440×900 / 768×1024 / 390×844 inspection remains pending under `STUDENTS_V2_MANUAL_SCREENSHOT_RUNBOOK.md`. Bundle comparison uses the production output recorded in the changelog.

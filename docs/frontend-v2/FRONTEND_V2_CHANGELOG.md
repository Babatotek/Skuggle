# Frontend V2 changelog

## Phase 1 — foundation and Students pilot

- Added reusable V2 page layouts.
- Added canonical Students list composition and responsive mobile cards.
- Cut Students routes over before `LegacyPageAdapter`.
- Bypassed global `ModuleWorkspace` for the Students route family.
- Added V2 architecture guards and Students behavioral tests.
- Preserved current APIs, capabilities, routing, profile, enrolment, import, tenant styling, and rollback surface.

Current verified production output: CSS 166.28 kB (25.72 kB gzip), app shell 192.24 kB (50.49 kB gzip), app features 479.81 kB (105.89 kB gzip). A trustworthy pre-change build artifact was not present, so exact delta is not claimed.

## People continuation — Guardians and Workforce

- Added canonical Guardians and Workforce list pages using `ListPageLayout`.
- Added responsive mobile rows, bounded loading/error/empty behavior, and calm metric/filter surfaces.
- Routed Guardians, Workforce, and the Teachers workforce view directly, before `LegacyPageAdapter`.
- Bypassed `ModuleWorkspace` for all migrated People routes without expanding the permanent sidebar.
- Retained `ParentsView` and `StaffManagementView` as rollback surfaces only.

## Batch 2 — Admissions complete rebuild

- Replaced the generic Admissions module-record bridge with typed, tenant-scoped lifecycle tables and APIs for applications, screenings, decisions/offers, documents, cycles, workflow history, and exactly-once student conversion.
- Added an idempotent six-module legacy data migration with dry-run, issue reporting, and parity evidence while preserving source database rows.
- Added all six native Frontend V2 routes with one contextual navigation row, real aggregate Overview, responsive application lists, operational queues, settings, detail hydration, CSV import, capability-gated actions, and bounded states.
- Removed `AdmissionsView`, its adapter/lazy import, legacy module navigation ownership/icons, generic catalog definitions, and Admissions route compatibility IDs. Architecture guards prevent their return.
- Added granular canonical Admissions capabilities, P0 BOLA registration, private tenant document storage, migration/lifecycle/security tests, and status-registry semantics.

Verified production output: CSS 166.72 kB (25.79 kB gzip), app shell 191.04 kB (50.27 kB gzip), app features 461.54 kB (101.88 kB gzip), and charts vendor 365.26 kB (97.42 kB gzip). Against the previously recorded V2 output, CSS changed by +0.44 kB (+0.07 kB gzip), app shell by -1.20 kB (-0.22 kB gzip), and app features by -18.27 kB (-4.01 kB gzip). The chart vendor was not separately recorded in the prior evidence, so no chart-chunk delta is claimed.

Overview performs one initial Admissions request. Applications, each queue, and Settings perform one initial request; application detail adds one request only when opened.

Authenticated Overview evidence is stored at `docs/frontend-v2/evidence/admissions-desktop-1440x900.png`, `admissions-tablet-1024x768.png`, `admissions-tablet-768x1024.png`, and `admissions-mobile-390x844.png`. Child-route and mobile-list captures sit beside those files. Visual review compared the Overview to the approved mockup and confirmed one sidebar item, one context row, the four metrics, connected pipeline, recent applications, trend, tasks, and conversion summary.

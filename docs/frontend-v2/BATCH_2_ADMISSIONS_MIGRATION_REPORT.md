# Batch 2 Admissions V2 migration report

## Status

**MIGRATED.** All six Admissions views are live on Frontend V2 with a typed tenant-safe domain. Legacy Admissions presentation has been deleted. Automated gates and authenticated viewport evidence are complete.

## Canonical routes migrated

- `/school/admissions` — Overview
- `/school/admissions/applications` — Applications
- `/school/admissions/screening` — Screening
- `/school/admissions/decisions` — Decisions & Offers
- `/school/admissions/enrolment` — Enrolment
- `/school/admissions/settings` — Settings

All routes render directly through the canonical shell and `src/domains/admissions`. Admissions remains one permanent primary-sidebar item; child views use one route-linked contextual navigation row.

## Presentation retirement

`src/features/admissions/AdmissionsView.tsx` was deleted. Its lazy export, `LegacyPageAdapter` branch, `ModuleWorkspace` ownership, legacy Admissions navigation metadata/icons, generic module catalog definitions, and Admissions legacy route IDs were removed. Architecture guards now fail if these presentation paths return.

## New frontend composition

- `AdmissionsPages.tsx` owns the six route pages and capability-gated actions.
- `components.tsx` owns context navigation, compact metrics, connected pipeline, responsive applications table/cards, trend, tasks, conversion, queue summaries, details, and forms.
- `api.ts`, `hooks.ts`, and `types.ts` own typed contracts, abortable reads, stale-response protection, mutations, and wire mapping.
- Existing V2 layouts, design tokens, status registry, API client, Recharts, shell state, and canonical route builders are reused.

## Typed domain and data migration

The additive schema introduces admission cycles, applications, screenings, decisions, offer letters, documents, workflow history, conversions, and migration issues. All tenant records use opaque public IDs and tenant global scopes.

`admissions:migrate-legacy` maps the six prior `school_module_records` modules without deleting source rows. It supports dry-run, per-module counts, issue recording, parity reporting, and repeat-safe execution. Typed APIs are authoritative after migration.

## APIs

The V2 UI uses:

- `GET /api/v1/admissions/overview`
- `GET|POST /api/v1/admissions/applications`
- `POST /api/v1/admissions/applications/import`
- `GET|PATCH /api/v1/admissions/applications/{application}`
- `POST /api/v1/admissions/applications/{application}/transitions`
- `GET /api/v1/admissions/screening`
- `POST /api/v1/admissions/applications/{application}/screenings`
- `GET /api/v1/admissions/decisions`
- `POST /api/v1/admissions/applications/{application}/decision`
- `GET /api/v1/admissions/enrolment`
- `POST /api/v1/admissions/applications/{application}/convert`
- Admissions document list/upload/download/delete routes
- Admissions settings read/cycle update routes

Overview is one bounded request. List/queue/settings pages use one initial domain request each; application detail hydration adds one request only after a row is opened.

## Capability mapping

- `admissions.application.view`
- `admissions.application.create`
- `admissions.application.update`
- `admissions.screening.manage`
- `admissions.decision.manage`
- `admissions.enrolment.convert`
- `admissions.document.manage`
- `admissions.settings.update`

The canonical registry, seeders, role grants, middleware, policies, frontend exposure, and tests use these keys. Role labels do not authorize actions.

## Tenant and security verification

`AdmissionApplicationPolicy`, tenant global scopes, parent-scoped document lookup, opaque IDs, private tenant storage paths, MIME/size validation, and action-specific middleware protect the domain. Conversion locks the application and stores a unique conversion link so retries cannot duplicate Student or Enrollment records. Cross-tenant public IDs return not-found semantics.

## Visual, responsive, and accessibility review

Authenticated comparison against the approved Overview mockup is evidenced at:

- `docs/frontend-v2/evidence/admissions-desktop-1440x900.png`
- `docs/frontend-v2/evidence/admissions-tablet-1024x768.png`
- `docs/frontend-v2/evidence/admissions-tablet-768x1024.png`
- `docs/frontend-v2/evidence/admissions-mobile-390x844.png`

Child-route evidence: `admissions-applications-1440x900.png`, `admissions-screening-1440x900.png`, `admissions-decisions-1440x900.png`, `admissions-enrolment-1440x900.png`, `admissions-settings-1440x900.png`, and `admissions-applications-390x844.png`.

### 1440×900

One Admissions sidebar item, one context row, one page title, Import + New Application, four compact metrics (48 / 12 / 18 / 15 with share-of-total and conversion context), a five-stage connected pipeline (48 / 12 / 20 / 18 / 15), recent applications with stage/status badges, and a six-month trend. Tasks and conversion sit in the right-hand column under the trend.

### 1024×768

Persistent curated sidebar and the same Overview hierarchy. The pipeline scrolls horizontally instead of compressing Enrolment. Metrics wrap to two columns.

### 768×1024

Primary navigation moves into the header drawer. Context navigation remains one row. Recent applications use dedicated cards instead of a squeezed table.

### 390×844

Bottom navigation, stacked metric cards, horizontally scrolling context tabs, 16px-scale gutters, and application cards with 44px-class touch targets. Import and New Application remain visible.

### Child routes

Applications, Screening, Decisions & Offers, Enrolment, and Settings keep the same shell, sidebar, and single context row. Queue actions are capability-gated and status-scoped (Review for submitted/screening, Decide for screened/waitlisted, Record response for offered, Enrol for accepted). Settings uses a bounded cycle form.

### Accessibility

Context navigation uses links with `aria-current`. Tables keep captions and keyboard-operable rows. The trend chart has an accessible summary. Loaders and errors are bounded. Status colors come from the shared registry. Focus and touch-target primitives are reused.

Accepted deviations from the mockup: metric cards use semantic token washes rather than large tinted card fills; create uses a focused modal rather than `FormPageLayout`; detail uses a hydrated drawer rather than a dedicated `DetailPageLayout` route.

## Verification evidence

- Frontend Admissions component/API tests: passing.
- Frontend typecheck and architecture guard: passing.
- Full frontend Vitest: 80/80 passing at the Batch 2 cutover; focused Admissions tests passing after visual follow-up.
- Focused backend lifecycle, import, aggregate, BOLA, document, settings, conversion, and legacy-migration tests: passing.
- Full backend PHPUnit: 299 passing.
- `composer analyse` and Pint: passing.
- Production build: CSS 166.72 kB (25.79 kB gzip), app shell 191.04 kB (50.27 kB gzip), app features 461.54 kB (101.88 kB gzip), charts vendor 365.26 kB (97.42 kB gzip).

## Request and bundle impact

Overview replaces six paginated legacy requests with one tenant-scoped aggregate request. No new chart dependency was added; Recharts was already in the vendor graph.

Against the previously recorded V2 output, CSS changed by +0.44 kB (+0.07 kB gzip), app shell by -1.20 kB (-0.22 kB gzip), and app features by -18.27 kB (-4.01 kB gzip). The chart vendor was not separately recorded in the prior evidence, so no chart-chunk delta is claimed.

## Remaining debt and deployment

- Run `php artisan admissions:migrate-legacy --dry-run` against a production backup, resolve reported ambiguities, execute the migration, and verify parity before enabling traffic.
- Preserve legacy database rows as migration evidence until retention is separately approved; no legacy Admissions presentation or runtime fallback remains.
- Rollback deploys the prior application artifact and restores the pre-migration database backup if necessary. TenantContext, IAM, canonical routing, workspace state, and the design system are not rolled back.
- Later polish: promote New Application into `FormPageLayout` and application detail into `DetailPageLayout` if those surfaces need standalone URLs.

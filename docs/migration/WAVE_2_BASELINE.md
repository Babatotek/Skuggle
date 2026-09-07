# Wave 2 baseline

Captured 2026-09-04 before Wave 2 implementation.

## Repository state

- Commit: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Working tree: dirty. Existing Wave 0–1/backend/domain/application work was preserved and is not attributed to Wave 2.
- Dirty scope at capture: `.env.example`, CI/deploy workflows, `package*.json`, `src/App.tsx`, app shell/context, multiple feature files including `StudentRegistryView.tsx`, `src/index.css`, backend controllers/models/policies/services/tests/config, plus untracked Gate A, architecture, domain, frontend and migration artifacts. The exact pre-change list is retained in the execution transcript; `git status --short` must be consulted before rollback.
- Gate A evidence: `GATE_A_CLOSURE_REPORT.md`, Wave 0–1 reports, browser runbook/report and architecture baseline are present. The brief declares Gate A passed; the repository closure report says `BLOCKED — BROWSER VALIDATION ONLY`. Wave 2 does not rewrite this discrepancy.

## Shared UI inventory

Existing shared components: Button, ConfirmDialog, DataTable, Drawer, EmptyState, FormField/Input/Select/Textarea/SearchInput, MetricCard, Modal, PageHeader, StatusBadge and dialog lifecycle hook. Existing tests covered dialog lifecycle and the app error boundary. Shared primitives were useful seeds but consumed direct palette utilities and had incomplete field association, status semantics, keyboard sorting/mobile collection and canonical navigation/control primitives.

## Token and CSS inventory

Tailwind 4.1 is integrated through `@tailwindcss/vite`; there is no Tailwind v3 config. `src/index.css` contained seven `--skuggle-*` variables, a `.field` utility, direct raw base colors, product/landing animations and a partial reduced-motion block. The frozen audit records 3,000+ direct color utilities, 1,100+ radius utilities, 338 native buttons, 887 `text-xs` uses and 15 `focus-visible` uses as legacy debt.

## Validation baseline

| Control | Result |
|---|---|
| Frontend tests | PASS — 3 files, 6 tests |
| Typecheck | PASS — `tsc --noEmit` |
| Architecture guard | PASS |
| Production build | PASS — 2,769 modules |
| Backend validation | Not run: Wave 2 changes are frontend-only and do not alter integration contracts |

Build baseline: CSS 152.69 kB / 22.94 kB gzip; `app-features` 551.80 kB / 125.74 kB gzip. Existing warnings: circular `app-public -> app-features -> app-public` manual chunk and chunks over 500 kB.

## Relevant existing debt

Direct palette/status colors, duplicated local controls, small icon targets, 12px operational text, incomplete focus-visible coverage, desktop-first tables and non-centralized domain status inference remain in legacy code. Wave 2 strictness is scoped to new/migrated shared paths; broad remediation is deferred.


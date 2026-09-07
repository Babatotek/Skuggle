# Technical debt register

| ID | Category | Severity | Debt | Owner / target |
|---|---|---:|---|---|
| TEST-001 | TESTING | P1 | Frontend had no test command before Wave 0; initial focused component harness is now present, broader coverage remains. | Frontend QA / continuous |
| TEST-002 | SECURITY | P1 | Student-document child-resource BOLA matrix needs expansion. | Security / Wave 2 prerequisite |
| TEST-003 | SECURITY | P1 | Assessment and score endpoint-specific BOLA matrix needs expansion. | Assessment / Wave 2 prerequisite |
| TEST-004 | SECURITY | P1 | Attendance wrong-academic-scope matrix needs expansion. | Attendance / Wave 2 prerequisite |
| TEST-005 | SECURITY | P1 | Payment webhook replay and provider-specific isolation tests are incomplete. | Finance / before provider launch |
| TEST-006 | SECURITY | P1 | Report job/download dedicated cross-tenant tests are incomplete. | Reporting / Wave 5 |
| TEST-007 | ARCHITECTURE | P1 | Public library bypass predicates are duplicated. | Library / Wave 5 |
| ARCH-001 | ARCHITECTURE | P1 | Direct legacy role decisions remain at three registered authorization sites. | IAM / Waves 4-5 |
| DATA-001 | DATA | P1 | `tenant_module_data` and `school_module_records` remain transitional generic stores. | Domain owners / later authorized waves |
| UX-001 | UX | P2 | Modal/Drawer cannot infer form dirtiness; consumers with dirty forms must keep backdrop closing disabled or supply guarded close behavior. | Design system / Wave 2 |
| PERFORMANCE-001 | PERFORMANCE | P2 | Production build reports a circular chunk and an application chunk over 500 kB. | Frontend / performance backlog |
| OBS-001 | OBSERVABILITY | P2 | Page error reference IDs are client-generated until an approved configured error provider is connected. | SRE / observability wave |
| LEGACY-001 | LEGACY | P2 | Current architecture documents and broad implementation work were untracked at baseline. | Repository owner / review workflow |
| SEC-DEP-001 | SECURITY | P2 | NPM audit reports three moderate advisories in the Express/body-parser/qs chain; the high-severity gate passes. | Platform / dependency maintenance |
| TEST-008 | TESTING | BLOCKER | Credentialed browser smoke matrix could not run because no browser/session is available in this execution environment. | Release Operations / before Gate A |
| TEST-009 | TESTING | CLOSED | Full Pint originally failed on 11 pre-existing dirty/untracked implementation files. On 2026-09-03 the files were individually reviewed and formatted with Pint using only formatting/import fixers; full Pint, PHP syntax checks and the complete backend suite pass. | Closed during Gate A closure |
| QUALITY-001 | TESTING | CLOSED | The root security workflow's Larastan job initially reported 152 unaccepted errors. Gate A triage fixed the non-baselineable relationship issue, consolidated the reviewed precise baseline, and proved a new error still fails analysis. | Closed during Gate A final remediation |
| QUALITY-002 | STATIC ANALYSIS | P1 | Larastan legacy debt is now represented by a precise standard baseline: original reviewed baseline count 404; Gate A unaccepted delta 152; current consolidated underlying count 556 across 364 exact file/message groups. No broad ignore is permitted. New/increased errors fail; reductions require baseline regeneration. Remove when unbaselined analysis is zero. | Backend Engineering; Security review for sensitive surfaces / Waves 3–5 |

## Gate A closure evidence

- `TEST-008` remains open. See `GATE_A_BROWSER_SMOKE_REPORT.md`; no credentialed browser result was fabricated.
- `TEST-009` is explicitly closed. `php vendor/bin/pint --test` passes for the complete backend; all 11 formatted files pass `php -l`; `php artisan test` passes 252 tests / 858 assertions.
- `QUALITY-001` is CLOSED: the exact CI Larastan command passes against the reviewed precise baseline, and a temporary `staticMethod.notFound` probe proved that a new error exits non-zero before being removed.
- `QUALITY-002` remains tracked debt, governed by `LARASTAN_BASELINE_POLICY.md`; the baseline is temporary accounting, not permission for new failures.
- Existing P1/P2 entries remain open. Architecture and tenant-scope guards passing does not remove their endpoint-depth, performance, UX or observability work.
# Wave 3 residual debt

- **W3-TD-01 — Public-context compatibility adapter.** Public result/library paths still temporarily populate `TenantContext` via the named `setPublicTenant()` adapter. Owner: Platform Architecture. Remove after all consumers accept `PublicTenantContext`, no later than Wave 24.
- **W3-TD-02 — Legacy v1 cache keys.** Attendance, assessment, practice and result-view paths contain pre-existing hand-built namespaces. Owner: Backend Platform. Migrate opportunistically to `TenantCacheKey`; do not bulk invalidate authorization-sensitive payloads.
- **W3-TD-03 — Legacy storage paths.** Student documents, photos, library uploads and SmartMark inputs predate classification-aware `TenantStoragePath`. Owner: Storage Security. New migrations use the helper; physical backfill requires a separate reviewed migration.
- **W3-TD-04 — Queue deployment compatibility.** Pre-Wave-3 serialized tenant jobs do not contain envelope v2. Owner: SRE. Drain old queues before release and restart workers after deployment.
# Wave 4 residual debt

- **W4-TD-01 — Local legacy permission checks.** Several policies/controllers still compare `permissionNames()` directly. Owner: IAM. Migrate family-by-family after shadow parity; removal no later than Wave 24.
- **W4-TD-02 — Frontend role-label UX checks.** Existing role-driven visibility remains baselined and non-authoritative. Owner: Frontend Platform. Navigation migration is Wave 9.
- **W4-TD-03 — Production unknown grant classification.** Synchronizer reports unknown rows as UNMAPPED/INVALID; operators must classify MANUAL/CUSTOM/ORPHANED against production evidence. Owner: Security Operations.
- **W4-TD-04 — Shadow observation.** Broad canonical enforcement requires real cohort parity evidence and zero unexplained privileged mismatch. Owner: IAM/SRE.
# Wave 5 additions (2026-09-04)

- IAM-005: roles are global and lack tenant ownership, active state, explicit security realm and compatibility precedence. Owner: IAM. Target: architecture-approved post-Wave-5 migration; role retirement remains Wave 24.
- IAM-006: legacy membership admin API exposes numeric membership IDs. Owner: Identity API. Target: public-ID contract migration without breaking legacy consumers.
- IAM-007: production multi-role p95 and concurrency telemetry must be captured before pilot/default cutover. Owner: SRE/IAM.

# Wave 7 residual debt

- **W7-TD-01 — LegacyPageAdapter.** Representative pages render through a temporary adapter. Owner: Frontend Platform. Remove as Wave 8–10 migrate outlets/domains.
- **W7-TD-02 — workspaceRoute compatibility.** `writeWorkspaceTab` still exists as a router-bound facade. Owner: Frontend Platform. Remove with leftover callers.
- **W7-TD-03 — Sidebar taxonomy.** Existing navigation groups were not redesigned. Owner: Wave 9.
- **W7-TD-04 — Browser smoke.** Credentialed desktop/mobile routing evidence was unavailable in this environment. Owner: Release Operations; use the Wave 7 manual runbook.
- **W7-TD-05 — Calendar / Relate placeholders.** Registry-only. Owner: later domain waves.

# Wave 8 residual debt

- **W8-TD-01 — LegacyNavigationAdapter.** Current menu taxonomy and Parent/Student/mobile allow-lists. Owner: Frontend Platform. Remove in Wave 9.
- **W8-TD-02 — AppHeader/AppSidebar unused.** Rollback chrome. Owner: Frontend Platform. Delete after soak when rollback is no longer required.
- **W8-TD-03 — My Work / Activity empty.** No backend aggregation. Owner: work-queue / jobs. Do not invent demo tasks.
- **W8-TD-04 — Assessment internal nav.** Conflicting in-page tabs vs shell context row. Owner: Wave 13.
- **W8-TD-05 — Browser smoke.** Credentialed desktop/mobile shell evidence unavailable here. Owner: Release Operations; use `WAVE_8_MANUAL_BROWSER_RUNBOOK.md`.
- **W8-TD-06 — ModuleWorkspace context tabs.** Still legacy group items as the single context row. Owner: Wave 9/domain waves.


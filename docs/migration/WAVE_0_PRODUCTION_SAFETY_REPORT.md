# Wave 0 production safety report

## W0.1 — localhost diagnostic telemetry: CLOSED

- Finding/previous evidence: three browser-reachable debug POSTs to `127.0.0.1:7364`.
- Current evidence/fix: removed from `AppErrorBoundary.tsx` and `SchoolStructureView.tsx`; environment, Vite proxy, tests and local tooling references remain classified as legitimate development/test configuration.
- Test: `WaveZeroSecurityArchitectureTest::test_production_frontend_has_no_hard_coded_localhost_network_calls`; production build.
- Residual risk: approved remote telemetry is not configured; errors remain local console diagnostics.
- Rollback: revert UI source changes except the removed network calls, which must never be restored.

## W0.2 — teacher assignment tenant integrity: CLOSED

- Finding: `storeAssignment()` globally resolved a submitted User public ID.
- Fix: resolution now begins with active membership in the active tenant and active User, then requires an active tenant-scoped Employee and TeacherProfile. Class, subject and academic session remain tenant-scoped and a submitted subject must belong to the selected class.
- Tests: 7 tests / 12 assertions cover success, foreign-only user, foreign employee relationship, inactive/revoked membership, foreign class/subject/session (including wrong campus through foreign class), invalid public ID, invalid class-subject relation, and unauthorized actor.
- Residual risk: current schema has no assignment campus column; campus integrity is derived through the scoped class.
- Rollback: revert controller/model additions only if replaced by an equally strict resolver; never restore global User trust.

## W0.3 — IDOR/BOLA resource matrix: CLOSED

- Evidence: `docs/security/RESOURCE_AUTHORIZATION_MATRIX.md` and `backend/tests/Architecture/resource-authorization-map.json`.
- Gate: architecture tests require P0 test evidence/explicit named exception and tenant middleware on mapped routes. Remaining endpoint-depth work is explicit P1 debt, not an unrecorded P0.
- Rollback: remove only together with an equivalent generated authorization inventory and release gate.

## W0.4 — global-scope/tenant bypass audit: CLOSED

- Evidence: `docs/security/TENANT_SCOPE_BYPASS_REGISTRY.md`; existing detailed call-site register; automated count reports 27/27 registered.
- Finding: no unsafe P0 runtime bypass found. Platform, public projection, webhook, infrastructure, job and maintenance cases have stated principals/tenant behavior; P1 consolidation/test depth is registered.
- Rollback: registry is documentation; code guard may only be replaced with stronger call-site matching.

## W0.5 — modal/drawer accessibility: CLOSED

- Fix: shared initial focus, Tab/Shift+Tab trap, Escape handling, focus restoration and scroll containment; dialog name/description bindings; safe default disables backdrop dismissal to avoid silent dirty-work loss.
- Tests: confirmation, enrolment-labelled modal, Drawer, Escape, forward/reverse Tab and trigger restoration.
- Residual risk: consumers with custom dirty-state logic still own confirmation policy; recorded as UX-001.
- Rollback: revert consumer-independent hook only if replaced by an accessible dialog library with equivalent tests.

## W0.6 — shell error containment: CLOSED

- Fix: a page boundary now sits inside the authenticated workspace, preserving sidebar/header on route render and lazy failures. It shows safe recovery copy, a client reference ID and retry. Root failure retains reload recovery and no stack/error message is rendered.
- Tests: page render containment and retry; existing preload/chunk one-shot reload behavior remains. API failures continue through the existing section/toast path.
- Residual risk: reference IDs are not server-correlated until an approved provider is configured (OBS-001).
- Rollback: remove the inner boundary only if an equivalent route boundary replaces it; retain root boundary.

## Wave 0 exit status

All six items are **CLOSED**. Targeted tests and static gates are green. Final full-suite/build evidence is recorded in `WAVE_0_1_EXECUTION_REPORT.md`.

# Wave 6 Frontend State Implementation Report

## 1–3. Baseline, inventory and target

HEAD `b30f3e1a405f7cd5b4253446752cc1d89724bd09`, branch `main`, dirty user-owned Wave 0–5 tree preserved. AppContext measured 2,029 lines before work with 53 fields and 57 `useApp` consumer files. The field-level inventory is in `FRONTEND_STATE_CURRENT_MAP.md`; the target contract is Auth → Workspace → Access → Academic with server/page/form/transient state separated by lifecycle.

## 4–7. Canonical boundaries

Auth owns identity and explicit lifecycle/failure. Workspace owns active identity, available memberships, status and a monotonic generation. Access owns canonical capabilities, legacy compatibility, registry version, assignments and persona hint; its three capability helpers use only canonical capabilities. Academic owns campus/session/term selection and clears on every workspace generation change. Explicit state types and actions contain no `any` or mega optional interface.

## 8–10. Server state, query identity and stale protection

ADR-W6 records the decision not to add a package. The new query key requires workspace identity, additionally requires tenant identity for school scope, and includes academic/resource/parameter scope. `commitLatest` and the real bootstrap use a generation token. The former hydration lock was removed because it could suppress Tenant B hydration while Tenant A was pending. Switch now clears tenant-bound collections before requesting/committing the next workspace. A delayed Tenant A response is regression-tested and cannot commit.

## 11–12. Compatibility and migrated consumers

`AppProvider` composes the four providers above `LegacyAppContextAdapter`; all old consumers remain operational. The facade derives identity/workspace/access rather than storing copies. WorkspaceSwitcher reads Auth/Workspace, StudentRegistry uses `hasCapability`, AcademicsConfig prefers canonical academic selection, and root logout triggers downstream clearing. Routing and navigation metadata were not changed.

## 13–14. Persistence and error containment

Production auth persistence remains a non-authoritative presence hint. Sync device/token metadata remains. Existing JSON domain persistence is demo-only and documented debt. No tenant header was introduced. Workspace switch exposes SWITCHING/ERROR, clears unsafe prior scoped data, and retains existing toast error UX. Logout clears all downstream providers and collections. Provider failure vocabulary distinguishes auth/workspace/access/academic/network categories.

## 15. Performance

No runtime dependency was added, so package gzip delta is zero. Bootstrap request shape remains a maximum of one `/auth/me` plus 11 permission-conditioned requests; no new request was introduced. Memoized split contexts prevent academic changes from invalidating Auth consumers. Production build: CSS 163.14 kB (25.14 kB gzip), app-features 563.59 kB (129.50 kB gzip). Existing circular/chunk-size warnings remain. Browser timing/render counters were unavailable and are not fabricated. AppContext is 2,088 lines after compatibility integration; decomposition quality is measured by canonical ownership, not file-size shuffling, and legacy domain debt remains explicit.

## 16–17. Tests and browser validation

- TypeScript: PASS.
- Frontend: 5 files, 20 tests PASS, including duplicate React key and Wave 2 component/dialog/error-boundary suites.
- Wave 6 focused: 8 PASS (auth refresh/logout, access replacement and any/all checks, persona denial, academic and School-to-Personal reset, failed-switch state, stale Tenant A race, tenant/academic key isolation).
- Architecture guard: PASS.
- Production build: PASS.
- Backend Wave 3/4/5/session: 24 tests, 573 assertions PASS (`WaveThreeTenantContext`, `CanonicalPermissionRegistry`, `RoleAssignmentWaveFive`, `RoleAssignmentPersonaParity`, `LoginWorkspaceIsolation`).
- Browser: BLOCKED visual evidence — the in-app/default browser runtime reported no browser available. No visual result is claimed. Code-level closure proceeds under the specification’s deterministic-test allowance.

## 18–20. Guards, residual debt and rollback

The guard rejects a new root context collection, role/persona authorization in new state paths, and JSON localStorage persistence in those paths. Existing debt is exact and time-boxed in the debt register/allowlist. Roll back representative consumers to the facade if needed, but retain the provider foundations and stale-generation safety. Never roll back Wave 3 tenant authority, Wave 4 registry, or Wave 5 assignment security.

## 21. Files changed

Implementation: `src/state/ApplicationStateProviders.tsx`, `src/state/serverState.ts`, focused test, AppContext facade, root logout, three representative consumers, architecture guard. Documentation: Wave 6 baseline, current map, target contract, compatibility map, ADR, changelog, debt updates, this report.

## 22. Exit assessment

All code-level Wave 6 exit criteria pass. Auth, Workspace, Access and Academic have canonical owners; the facade derives them; stale tenant and school-to-personal state are cleared; query identity is scoped; capability helpers are canonical; tests/build/guards/backend contracts pass; routes/navigation and Wave 7+ remain untouched. The only unavailable artifact is optional browser visual evidence, recorded separately and not fabricated.

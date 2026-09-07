# Wave 6 Changelog

| ID | Requirement | Files | Reason | Tests | Risk / rollback |
|---|---|---|---|---|---|
| W6-001 | Rebaseline and inventory | baseline/current-map docs | Measure current source and classify legacy contract | document review | none; delete docs |
| W6-002 | Canonical providers | `ApplicationStateProviders.tsx` | Separate Auth, Workspace, Access and Academic lifecycle/ownership | state-boundary tests, typecheck | provider composition; wrapper rollback preserves facade |
| W6-003 | Compatibility facade | `AppContext.tsx` | Derive old consumer shape from canonical owners without duplicate truth | full frontend suite | adapter can temporarily forward canonical values without removing providers |
| W6-004 | Atomic invalidation | `AppContext.tsx`, `App.tsx` | Clear access, academic and tenant collections before switch/logout | stale response and academic reset tests; backend isolation | failed switch leaves safe empty state; retain Wave 3–5 backend authority |
| W6-005 | Stale response protection | `AppContext.tsx`, `serverState.ts` | Workspace generation rejects obsolete hydrate/query results | delayed Tenant A regression | remove feature use only after equivalent cancellation exists |
| W6-006 | Query identity | `serverState.ts` | Require workspace and school tenant in server cache identity | key isolation tests | zero dependency; helper rollback only if replaced by equivalent |
| W6-007 | Representative consumers | WorkspaceSwitcher, StudentRegistry, AcademicsConfig | Prove canonical workspace/access/academic APIs while preserving the rest | full frontend suite/build | revert individual consumer to facade |
| W6-008 | Logout containment | `App.tsx`, `AppContext.tsx` | Clear downstream canonical and school state on logout | typecheck/full tests | remove event only with direct canonical logout orchestration |
| W6-009 | Architecture guards | `architecture-guard.mjs` | Stop new root collections, role authorization and state persistence | architecture guard | update exact allowance after architecture review |
| W6-010 | Server-state ADR/debt/report | ADR and migration/architecture docs | Record no-library decision, limitations and rollback | document review | none |

Rollback must never revert server TenantContext, the canonical permission registry, RoleAssignments, or membership authorization. The safe rollback is consumer-by-consumer back to the still-present facade while retaining generation invalidation and the extracted providers.

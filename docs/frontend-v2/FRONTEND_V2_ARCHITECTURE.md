# Frontend V2 architecture

Frontend V2 is an incremental presentation-layer migration. Canonical routes continue through `AuthenticatedRoot` and the canonical workspace shell. Migrated routes render a V2 page layout directly; unmigrated routes continue through `LegacyPageAdapter` and `ModuleWorkspace`.

The migrated route families are `school.people.students`, `school.people.guardians`, `school.people.workforce`, and every `school.admissions*` route. The shell explicitly bypasses `ModuleWorkspace` for those route families while retaining tenant theming, workspace state, access state, academic context, responsive navigation, error boundaries, and route focus management.

Admissions is the first V2 family with its legacy presentation fully removed. Its six canonical routes render typed domain pages directly; one Admissions item remains in primary navigation and a single route-linked context row owns its child views.

Primary navigation is curated in `routing/primaryNavigation.ts`; it is not generated from the route registry. The maximum permanent depth is group to item.

## Rollback

Repoint the Students branch in `GuardedPage` to `LegacyPageAdapter` and remove the Students route-family bypass in `WorkspaceShellChrome`. This restores the old presentation without reverting routing, state, IAM, tenant context, design tokens, or shell infrastructure.

Admissions has no runtime legacy presentation fallback. Rollback deploys the prior release artifact and, if migration writes must be reversed, restores the verified pre-migration database backup. Canonical IAM, tenant context, routing, workspace state, and design-system infrastructure remain in place.

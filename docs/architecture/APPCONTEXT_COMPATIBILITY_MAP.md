# AppContext Compatibility Map

`AppProvider` now composes canonical providers and the `LegacyAppContextAdapter`. Existing `useApp()` consumers continue to compile.

| Legacy surface | Canonical source |
|---|---|
| currentUser identity fields | Auth.identity |
| currentUser.currentWorkspace, currentWorkspace | Workspace.activeWorkspace |
| currentUser.availableWorkspaces | Workspace.availableWorkspaces |
| currentUser.permissions | Access.legacyPermissions |
| currentUser.capabilities | Access.capabilities |
| currentUser.permissionRegistryVersion | Access.registryVersion |
| setCurrentUser | compatibility dispatcher partitions one update across Auth, Workspace and Access |
| currentRole/setCurrentRole | active workspace presentation compatibility |
| workspace switch functions | Workspace transition plus legacy domain invalidation/hydration |
| sessions/terms | legacy server collections; AcademicContext owns current selection |
| all remaining fields | unchanged legacy facade pending their scheduled domain waves |

Direct representative migrations: WorkspaceSwitcher reads canonical workspace state; StudentRegistry uses `hasCapability`; AcademicsConfig prefers canonical selection; root logout emits canonical downstream clearing. No duplicate independent identity/workspace/access state remains in the adapter.

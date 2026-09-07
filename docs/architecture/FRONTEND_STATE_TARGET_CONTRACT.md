# Frontend State Target Contract

Composition is intentional and acyclic:

`AuthProvider → WorkspaceProvider → AccessProvider → AcademicProvider → LegacyAppContextAdapter → Application`

All providers expose explicit `IDLE | LOADING | READY | ERROR | SWITCHING` status vocabulary where applicable and typed failure categories. Context values and mutations are memoized/stable so changes in academic selection do not rerender auth-only consumers.

## Ownership

- Auth: global identity and authentication lifecycle. It excludes tenant membership, academic selections and domain collections.
- Workspace: active workspace identity, available memberships, transition status and monotonic generation. A personal workspace is not represented as a school tenant.
- Access: canonical capabilities, legacy permission compatibility, registry version, effective assignment summaries and presentation-only persona hint. `hasCapability`, `hasAnyCapability`, and `hasAllCapabilities` never consult roles/persona.
- Academic: campus/session/term selection and its workspace generation. It owns selection, not academic domain collections. Workspace transition clears it before new rendering.
- Server state: repository-local canonical `buildQueryKey` requires workspace identity and requires tenant identity for school queries. Keys include optional session/term, resource and parameters. `commitLatest` rejects late responses from obsolete generations.
- Page/form/transient state: stays local where already local. Toast and network status remain intentionally application-wide compatibility infrastructure. No new global feature store was created.

Bootstrap remains event-compatible in Wave 6: Auth/session resolves, the authoritative payload replaces Workspace and Access, server-authoritative academic context replaces Academic, then permitted legacy domain collections commit. Every hydrate captures a workspace generation and cannot commit after that generation changes.

Switch sequence: mark SWITCHING and increment generation; clear Academic, Access and all tenant-bound facade collections; request canonical switch; complete Workspace; emit the existing compatibility event; hydrate authoritative bootstrap. Failures leave an explicit error with empty tenant-bound data. Logout clears all four canonical boundaries and tenant-bound compatibility collections.

No new state package was added. Routing URLs, history behavior, navigation metadata and menu organization are unchanged.

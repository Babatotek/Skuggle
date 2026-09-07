# ADR-W6: Server-state boundary without a new package

Status: Accepted, 2026-09-04.

The repository used a central fetch client and root React state; TanStack Query, Redux and Zustand were not installed. React 19 and Vite 6 need no additional compatibility layer for a small generation/key foundation. Adding a query runtime now would increase bundle size and migration scope while the domain migrations that would consume it are explicitly Wave 10+.

Decision: add a typed canonical query-key builder and a generation-based late-response commit guard, and apply workspace generation checks to the existing bootstrap. The key supports workspace, tenant, academic session/term, resource and parameters. Fetch continues through `apiClient`, whose AbortSignal support is inherited from `RequestInit`. SSR is irrelevant to the current client application. Tests exercise tenant requirements, academic isolation and stale response rejection.

Consequences: zero runtime dependency/bundle delta; straightforward unit tests; no devtools. Domain collections remain baseline legacy debt and can migrate incrementally to a query library later under a new ADR with measured gzip impact. This decision does not claim freshness/retry orchestration for legacy collections.

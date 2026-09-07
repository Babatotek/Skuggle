# ADR-W7: React Router as the canonical history owner

Status: Accepted, 2026-09-04.

## Context

The repository used manual `history.pushState` / `popstate` in `App.tsx` and `workspaceRoute.ts`. No router package was present. React 19.0.1 and Vite 6.2.3 are the application stack. Wave 8 needs nested workspace layouts; Wave 9 needs stable route IDs. Unknown URLs silently opened Dashboard.

## Options

1. **Continue a home-grown history adapter.** Lowest package cost; keeps the debt that already lost public URLs, 404 semantics, and dual history risk.
2. **React Router 7 (`react-router-dom`).** Mature library mode: nested routes, params, `Navigate`/`Outlet` later, lazy routes, `ScrollRestoration`, MemoryRouter tests, React 19 + Vite 6 compatible. Data loaders are optional and not adopted.
3. **TanStack Router.** Strong types; extra migration conceptual load and less universal familiarity for this strangler.

## Decision

Adopt **React Router 7.18.3** in library mode (`BrowserRouter` + `Routes`). Do not install a second router. Do not use framework/ssr mode. Do not adopt loaders/actions in Wave 7 — bootstrap remains Wave 6 providers + `apiClient`.

Canonical route metadata lives in `src/routing/registry.ts`. React Router owns history. Legacy `/app/{tab}` and tenant prefixes are explicit alias redirects. `workspaceRoute.writeWorkspaceTab` delegates to the bound `navigate` function so leftover callers cannot create a second history stack.

## Compatibility

- React 19: supported by React Router 7.
- Vite 6: no special plugin; SPA fallback remains hosting/`server.ts`.
- Nested layouts: route tree is ready; Wave 7 shell is the existing header/sidebar, presentation-neutral.
- Error/404: catch-all renders `RouteNotFound`; route component failures stay in `AppErrorBoundary`.
- Lazy loading: existing feature `lazy()` chunks; router itself is `router-vendor`.
- Accessibility: `ScrollRestoration` by pathname; focus `#main-content` on path change; document titles from registry; reduced-motion skips route transition animation.
- Tests: Vitest + MemoryRouter + Testing Library.

## Consequences

One history owner. Bundle includes `react-router` / `react-router-dom` (measured in the implementation report). Rollback re-binds `workspaceRoute` to `history.pushState` and can keep the registry. Wave 8 may introduce layout routes/`Outlet` without changing IDs.

# ADR-W2: Component catalog

## Decision

Use a local, development-only React catalog harness (`DesignSystemCatalog.tsx`) for Wave 2 and do not add Storybook yet.

## Context

The project uses React 19, Vite 6 and Tailwind 4. Storybook would add a substantial development dependency/configuration surface while the Wave 2 set is small and the repository is already heavily in flight. No second test stack is justified.

## Consequences

The harness catalogs action, field, choice, status, navigation, long-content, invalid, loading and disabled states and can be mounted by a future development-only entry. It is not imported by production, so it adds no runtime route or package. Automated behavior remains in Vitest/Testing Library. Screenshot baselines must be captured when a browser channel is available. Storybook can be reconsidered after component volume and CI visual-regression ownership justify it.


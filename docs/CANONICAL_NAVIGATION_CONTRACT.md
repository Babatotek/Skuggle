# Canonical Navigation Contract

## Registry boundary

**ROUTE REGISTRY != PRIMARY NAVIGATION REGISTRY.**

- The route registry contains every canonical navigable URL, including objects, child views, settings, and contextual actions.
- The primary navigation registry is a small, explicitly curated projection of domain and capability landing pages.
- Adding a route never adds a sidebar item automatically. A primary destination requires an explicit architecture decision and registry entry.

The persistent hierarchy is `GROUP -> ITEM`. One page-local context row may represent deeper destinations. Pages must not reproduce primary, domain, page, and secondary tab hierarchies simultaneously.

An item is exposed only when its workspace matches and the already-loaded capability set satisfies the canonical route's access metadata. Feature/entitlement checks must use the same loaded access contract when those metadata are introduced. The projection is pure, synchronous, makes no requests, and contains no role-name or persona grants.

Deep routes resolve active state by walking canonical breadcrumb ownership to the nearest primary route.

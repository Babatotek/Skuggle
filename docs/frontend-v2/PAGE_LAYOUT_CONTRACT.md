# Page layout contract

- `PageLayout`: one breadcrumb, one page heading, description, one primary action, and content.
- `ListPageLayout`: `PageLayout` plus optional metrics, one coherent toolbar, and one list/table surface.
- `DetailPageLayout`: profile and record-detail composition.
- `FormPageLayout`: constrained-width create/edit flows.
- `WorkspaceLandingLayout`: complex domains that may require a single context-navigation row.

Simple lists do not add context navigation. Layouts do not fetch domain data, authorize actions, or own global shell geometry. Desktop uses 24–32px page spacing; mobile uses 16px gutters and domain-specific list renderers.

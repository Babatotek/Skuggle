# Component migration map

| Legacy API/pattern | Canonical target | Compatibility/owner | Pilot |
|---|---|---|---|
| Button `outline`, `destructive`, `subtle` | secondary, danger, semantic hierarchy | aliases remain in Button; UI platform removes during later consumer waves | Students actions |
| StatusBadge visual variants/string inference | status registry + semantic tone | legacy variants translate to six tones | fee/student statuses |
| FormField + child control | Field anatomy | `FormField` retained; `Field` alias added | enrolment/shared forms remain compatible |
| manual breadcrumbs/header | Breadcrumb + PageHeader composition | old PageHeader props retained | Students registry |
| feature-local button segments | SegmentedControl | replace only when feature is migrated | Students fee/status filters |
| toolbar wrappers | FilterBar | composition, no giant filter schema | Students registry |
| desktop-only DataTable | Table + optional mobile renderer/server pagination | DataTable export retained | Students registry list |
| raw icon close controls | IconButton | Modal/Drawer internal migration | existing dialog flows |

Rollback is per row: restore the pilot import/markup or legacy adapter target without reverting Gate A dialog lifecycle work.


# Wave 2 changelog

| ID | Requirement | Files | Reason | Tests | Risk | Rollback |
|---|---|---|---|---|---|---|
| W2-01 | Semantic token hierarchy | `tokens.css`, `index.css` | Centralize all required token groups and legacy aliases | typecheck, build, reduced-motion test | global CSS cascade | remove import; restore legacy aliases |
| W2-02 | Tenant brand safety | `tenantTheme.ts` | Contrast-gated bounded slots | contrast/fallback test | unsupported color formats fall back | stop applying resolver |
| W2-03 | Actions/focus | `Button.tsx` | Canonical variants, IconButton name, busy/disabled | primitive tests | small canonical visual change | legacy aliases remain; restore adapter target |
| W2-04 | Field controls | `FormField.tsx`, `Controls.tsx` | Shared label/help/error and native choice controls | field/switch tests | cloned child attributes | revert files; exports are additive |
| W2-05 | Status registry | `statusRegistry.ts`, `StatusBadge.tsx` | Six semantic categories with non-color cues | status test | unknown states become neutral | restore legacy badge implementation |
| W2-06 | Overlay hardening | Modal/Drawer/ConfirmDialog | Preserve Gate A lifecycle while tokenizing controls | dialog lifecycle tests | animation remains current Motion behavior | restore styling only; keep lifecycle hook |
| W2-07 | Navigation/composition | Navigation, FilterBar, PageHeader | Canonical breadcrumb/tabs/segments/header/filter anatomy | tab keyboard test, typecheck | controlled API expansion | remove pilot usage and exports |
| W2-08 | Collection foundation | DataTable | sort state, error, server pagination, mobile rendering | typecheck, pilot build | interactive row remains compatibility behavior | omit new props |
| W2-09 | Controlled Students pilot | StudentRegistryView | Prove real form/list/header/dialog composition | full frontend suite/build | visual delta in registry only | restore previous imports/markup |
| W2-10 | Catalog/guard/docs | catalog, guard, Wave 2 docs | governance and scoped strictness | architecture guard | regex false positives in strict files | adjust reviewed strict list |


# Design token reference

Tokens live in `src/styles/tokens.css` and resolve primitive → semantic → workspace → component. Shared components consume semantic/component aliases. Raw values are confined to the token definition layer.

| Group | Canonical examples |
|---|---|
| Color | `--color-surface`, `--color-text-primary`, `--color-border-default`, `--color-action-primary`, `--color-focus-ring`, six `--color-status-*` groups |
| Typography | `--font-ui`, `--font-heading`, `--font-size-body`, `--font-size-data`, `--font-size-caption` |
| Spacing | `--space-1` through `--space-12`, component/section/page aliases; 4px base |
| Size | control small/medium/large and 44px touch target |
| Radius | control 8px, card/surface 12px, dialog 16px, semantic pill |
| Border/shadow | default/strong boundaries, restrained raised/overlay elevation |
| Motion | micro 120ms, standard 200ms, emphasized 320ms; reduced-motion aliases become 1ms |
| Opacity | disabled role |
| Density | Comfortable default; Compact and Focused data attributes; coarse pointer minimum |
| Responsive | compact and wide contract tokens; component CSS still uses Tailwind 4 media variants |
| Z-index | base, sticky, nav, popover, drawer, modal, toast, critical (0–70) |
| Focus | width, offset and protected indigo ring |

Light theme is released. Dark-theme readiness comes from semantic indirection; no dark theme is exposed in Wave 2.

Tenant slots are limited to `--tenant-identity-accent` and `--tenant-action-primary`. `resolveTenantTheme` accepts six-digit hex only and requires 4.5:1 contrast against white; otherwise it returns Skuggle primary. Tenant input cannot set status, danger, focus, text or platform semantics.


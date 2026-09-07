# Legacy navigation adapter (Wave 8)

**Owner:** Frontend Platform  
**Source of truth (temporary):** `src/lib/navigation.ts` (`visibleNavGroups`)  
**Shell contract:** `ShellNavGroup` / `ShellNavItem` (`id`, `label`, `href`, `icon`, `groupId`, `groupLabel`)  
**Canonical routes:** Wave 7 `routeFromLegacyNavId` + `buildRoute`  
**Removal:** Wave 9 capability navigation. Do not treat this adapter as IA authority.

## Staff desktop

`projectLegacyNavigation(ctx, 'school-staff')` copies current group ids, labels, and item ids **without regrouping**. Collapsed-by-default remains administration/subscription as in the adapter (presentation only).

## Parent / Student

Not “staff menu with 80% hidden.” Flatten authorized items into one group (`School`) using a **temporary allow-list of current destination ids**:

- Parent: `home`, `students`, `parent-messages`, `student-billing`, `help-support`, `attendance`
- Student: `home`, `assessments`, `cbt`, `library`, `online-materials`, `student-messages`, `help-support`

Items still must pass `visibleNavGroups` (existing role/permission filters). Wave 9 will replace this list.

## Personal / Platform

Same flattening with current ids:

- Personal: `home`, `library`, `online-materials`, `assessments`, `cbt`, `current-plan`, `help-support`
- Platform: `home`, `platform`, `schools`, `health`, `governance`, `help-support`

## Mobile projection (Wave 9 debt)

`projectMobilePrimary` picks at most four current destinations for the bottom bar; the rest go to More.

| Family | Preferred primary ids (first match that exists) |
|---|---|
| School staff | `home`, `students`, `assessments`, `attendance` |
| Parent | `home`, `students`, `parent-messages` |
| Student | `home`, `assessments`, `library` |
| Personal | `home`, `library`, `current-plan` |
| Platform | `home`, `schools`, `health` |

This is **not** the Wave 9 taxonomy.

## Active state

Shell `activeNavId` is `legacyNavIdForRoute` of the matched canonical route. Legacy local `activeTab` is not a second source of truth.

## Relate

No Relate workspace type is implemented. Adapter does not invent Relate destinations.

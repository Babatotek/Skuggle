# Wave 9 Changelog

## Remediation

- Replaced the live legacy exhaustive menu projection with a curated primary-navigation registry.
- Restored the frozen eight School Staff groups and 26-entry maximum.
- Collapsed Admissions, Assessment, Performance, Attendance, Finance, Communication, Student Services, Operations, and Reports to one primary landing destination each.
- Replaced Teachers/Staff duplicates with Workforce and moved Learning Resources into Teaching & Learning.
- Removed duplicated School/Forms ownership; Forms & Custom Fields is owned by Administration.
- Kept Subscription & Plan in Administration, separate from school Finance.
- Aligned item visibility with canonical route capability metadata; removed role/persona bypasses from the live projection.
- Added canonical-parent active-state resolution for deep routes.
- Made mobile navigation choose an explicit primary subset and place remaining primary destinations in More.
- Added Wave 9 navigation contract tests.

The failed exhaustive implementation remains represented by the isolated legacy registry for page-context compatibility only; the live shell no longer imports its projection.

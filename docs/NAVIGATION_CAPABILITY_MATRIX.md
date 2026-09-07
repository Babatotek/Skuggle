# Navigation Capability Matrix

Primary visibility is derived directly from each named route's `access` metadata; this table is a readable index, not a second authorization source.

| Group | Primary destination | Canonical route |
|---|---|---|
| Home | Dashboard | `school.home` |
| People | Students / Guardians / Workforce | `school.people.*` |
| Admissions | Admissions | `school.admissions` |
| Teaching & Learning | Academics / Assessment / Performance / Learning Resources | `school.academics`, `school.assessment`, `school.performance`, `school.learning-resources` |
| School Operations | Attendance / Finance / Student Services / Operations | `school.attendance`, `school.finance`, `school.student-services`, `school.operations` |
| Engagement | Communication / Calendar | `school.communication`, `school.calendar` |
| Insights | Analytics / Reports | `school.insights.*` |
| Administration | School Setup / Users & Access / Roles & Permissions / Forms & Custom Fields / Workflows / Integrations / Subscription & Plan / Security / Audit | `school.administration.*` |

Capability union across multiple assignments may expose an item. Role names and persona hints cannot. Revoking the route-required capability removes the item without weakening the route guard.

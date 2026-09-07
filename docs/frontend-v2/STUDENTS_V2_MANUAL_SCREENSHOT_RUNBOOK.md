# Students V2 manual screenshot runbook

Browser automation was unavailable during Phase 1 verification. An authenticated school user must perform this final visual gate.

1. Run `npm run dev` and open `http://localhost:3000/school/people/students`.
2. Use a school workspace with `students.profile.view`; repeat once with and once without `students.profile.create`.
3. Capture the page at 1440×900, 768×1024, and 390×844.
4. At 1440px confirm the persistent curated sidebar, 64px header, one Students heading, four compact metrics, one toolbar, and the seven-column table. Confirm there is no Students/Teachers/Staff/Parents tab row.
5. At 768px confirm navigation moves into the drawer, controls wrap without clipping, and no horizontal page overflow appears.
6. At 390px confirm the bottom navigation, 16px gutter, stacked filters, student cards instead of a microscopic table, and 44px touch targets.
7. Confirm the create-capable user sees exactly one “Enrol Student” primary action and the view-only user sees none.
8. Open a row and confirm the URL becomes `/school/people/students/:studentPublicId`; close it and confirm the registry URL is restored.
9. Test empty and failed API responses and confirm the shell stays visible.
10. Compare spacing, hierarchy, card scale, borders, typography, and overall calmness with `studentInterface.png`.

Store the three screenshots with the release evidence, then update `STUDENTS_V2_MIGRATION_REPORT.md` from pending to verified.

# Assessment rollback quarantine

Not imported by any live route, navigation or V2 page. These files preserve
pre-existing user-modified presentation until full module acceptance:

- AssessmentWorkspace.tsx: retired layout, local tabs, results/settings panels.
- AssessmentsView.tsx: retired studio and score presentation; AI contract retained in V2.
- AssessmentsView.test.tsx: preserved regression for original generated display numbers.
- SmartMarkScanner.tsx: retired scanner UI; processing services remain active.
- CBTQuizModuleView.tsx: retired quiz UI; existing CBT domain records remain intact.

Do not restore their production imports. Delete only after functional and visual
acceptance gates are complete. The new architecture guard rejects these imports.

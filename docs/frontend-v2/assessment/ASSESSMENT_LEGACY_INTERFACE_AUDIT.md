# Assessment legacy interface audit

Baseline: 5 September 2026. This map precedes presentation removal. The working tree already contains user changes; these are preserved. Sources: complete Assessment PRD and supplied overview image. PRD examples are not production data.

| File / component | Classification | Disposition |
| --- | --- | --- |
| src/features/assessments/AssessmentWorkspace.tsx (Overview, AssessmentsPanel, QuestionBank, MarkingPanel, ResultsPanel, SettingsPanel, creation modal) | REPLACE | Local-state navigation, legacy styling, result ownership and bootstrap-derived counts; replace all live routes with AssessmentDomainWorkspace. |
| src/features/assessments/AssessmentsView.tsx (AssessmentStudio) | EXTRACT / REPLACE | Keep AI API contract and score validation requirements; replace demo-initialized content, role checks, builder and score presentation. Quarantine original user-modified source until full acceptance. |
| src/features/assessments/AssessmentsView.test.tsx | KEEP | Quarantine with original component; retain duplicate display-number regression in new question identity tests. |
| src/features/teacher/SmartMarkScanner.tsx | REPLACE | Reuse backend upload/review contracts; build native exception surface. Quarantine original. |
| src/features/cbt/CBTQuizModuleView.tsx | REPLACE | Retire school route ownership; retain original in quarantine pending complete CBT delivery acceptance. |
| src/routing/pages.ts | REPLACE | Remove lazy legacy Assessment, scanner/CBT presentation bindings. |
| src/routing/LegacyPageAdapter.tsx | REPLACE | Remove Assessment and school CBT cases. |
| src/routing/registry.ts | KEEP / REPLACE | Single canonical registry; six context routes plus object routes. Existing aliases may redirect into V2, never legacy. |
| src/routing/{builders,aliases,params,normalize,historyCompatibility,primaryNavigation}.ts | KEEP | Canonical route construction, alias compatibility, one primary Assessment item. |
| src/lib/navigation.ts; src/shell/LegacyNavigationAdapter.ts | KEEP / REPLACE | Compatibility identifiers must resolve to V2; remove legacy sub-navigation exposure. |
| src/components/ModuleWorkspace.tsx | KEEP | Shared non-Assessment legacy surface; no Assessment ownership allowed. |
| src/components/CommandPalette.tsx; src/components/AppSidebar.tsx; src/lib/{sidebarNav,moduleAccess,moduleTabs,navIcons}.ts | KEEP | Shared navigation infrastructure; guard Assessment destinations. |
| src/context/AppContext.tsx; src/types.ts; src/lib/apiClient.ts | KEEP | Shared domain/bootstrap compatibility and HTTP logic; V2 pages do not derive overview from bootstrap arrays. |
| src/components/SkuggleAIBuddy.tsx | KEEP | Shared assistant, not Assessment route owner. |
| src/features/dashboard/*; academics/AcademicsConfigView.tsx; communication/BroadcastCenterView.tsx | KEEP | Cross-domain links/analytics; no migration of these modules. |
| src/features/results/*; performance/*; public/PublicResultChecker.tsx | KEEP | Performance-owned presentation and logic, outside scope. |
| src/features/public/{PublicLanding,PersonalOnboardingModal}.tsx | KEEP | Product copy/onboarding references. |
| src/routing/{routing,primaryNavigation}.test.*; src/shell/shell.test.tsx; src/state/ApplicationStateProviders.test.tsx | KEEP | Shared architecture regressions. |
| backend AssessmentController, AssessmentPolicy, StoreAssessmentRequest, SaveScoresRequest | KEEP / EXTRACT | Reuse models, tenant scope, public IDs, academic context, audit/idempotency. Fix assignment checks, state mutation and concurrency gaps. |
| backend Assessment, AssessmentScore, AssessmentQuestion; existing migrations | KEEP | Durable persisted domain records. Extend contracts without duplicate Assessment entity. |
| backend SmartmarkController, ProcessSmartmarkBatch, AIManager, AiToolController, CbtController | KEEP | Reuse processing services. Harden score commit and retain human verification. |
| backend PerformanceService, result publications, reports | KEEP | Do not migrate Performance. |

Search covered all src files (case-insensitive Assessment, CA, Test, Exam, ScoreEntry, Marking, Moderation, QuestionBank, ModuleWorkspace, LegacyPageAdapter, AssessmentStudio), imports, route registry, compatibility aliases, shell navigation and tests. Generic Test/CA matches in unrelated tests/copy do not own Assessment presentation.

## Contract gaps at baseline

No aggregate overview; index lacks academic/assignment filtering; update permits arbitrary publication states; score mutation lacks lock-state enforcement; no reusable bank/settings/schedule metadata contracts. SmartMark commit needs roster/lock enforcement. Teacher resource authorization cannot rely on role names. These are implementation requirements, not reasons to preserve the old UI.

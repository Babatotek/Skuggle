# Current Route Inventory (Wave 7 measurement)

Measured from `src/App.tsx`, `src/lib/workspaceRoute.ts`, `src/lib/navigation.ts`, and public feature screens **before** canonical routing cutover. Classification uses the Wave 7 vocabulary.

Legend: **LEGACY** = pre-canonical path/state; **CANONICAL** column is the Wave 7 target, not the historical URL.

## Public / auth (mostly state, not URLs)

| PATH / STATE | WORKSPACE | DOMAIN | PAGE | COMPONENT | PARAMS | ACCESS | CLASS | DEEP-LINK | REDIRECT | OWNER |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` + `currentView=landing` | public | landing | Landing | `PublicLanding` | — | public | PUBLIC | Partial (URL `/` only) | Session may jump to app | Public |
| `currentView=personal-auth` | auth | login | Personal sign-in | `PersonalAuthPage` | — | public | AUTH | No durable URL | — | Identity |
| `currentView=school-auth` | auth | login | School sign-in | `SchoolAuthPage` | — | public | AUTH | No | — | Identity |
| `currentView=register-school` | public | register | School registration | `SchoolRegistrationStepper` | — | public | PUBLIC | No | — | Public |
| `currentView=tenant-welcome` | public | welcome | Tenant welcome | `TenantWelcome` | school key query/path | public | PUBLIC | Path prefix `/s/{slug}` etc. | From school key on `/` | Public |
| `currentView=tenant-login` | public | welcome | Tenant login | `TenantLogin` | school key | public | AUTH | No | From welcome | Public |
| `currentView=result-checker` | public | results | Result checker | `PublicResultChecker` | PIN/admission in form, not URL | public | PUBLIC | No | Back to `app` | Public |
| `/reset-password` | auth | reset | Reset password | `ResetPasswordPage` | token query | public | AUTH | Yes | Done → `/` | Identity |
| `/verify-email` | auth | verify | Verification | `VerificationStatusPage` | `status` | public | AUTH | Yes | Success → `/` then app | Identity |
| `/join?token&school` | auth | join | Invite (no page) | None; listed as public segment | token, school | public | AUTH | Path reserved only | Unknown | Identity |

## Authenticated tab URLs (`/app/{id}` ± tenant prefix)

Tenant prefixes `/s/{slug}`, `/school/{slug}`, `/t/{slug}` were **public tenant hints**, not workspace authorization. Same tab IDs served School, Personal, and Platform.

| PATH | WORKSPACE | DOMAIN / PAGE | COMPONENT | PARAMS | ACCESS EXPECTATION | CLASS | DEEP-LINK | REDIRECT | OWNER |
|---|---|---|---|---|---|---|---|---|---|
| `/app`, `/app/home` | all | Home / Dashboard | Role dashboards | — | authenticated | SCHOOL/PERSONAL/PLATFORM | Yes | Unknown tab → home | Shell |
| `/app/students`, `/app/bulk-import` | school | People / Students | `StudentRegistryView` | local profile id | `students.view` (sidebar) | SCHOOL | Tab yes; profile no | — | People |
| `/app/parents` | school | People / Guardians | `ParentsView` | — | `students.view` | SCHOOL | Tab | — | People |
| `/app/people`, `/app/staff`, `/app/teachers` | school | People / Workforce | `StaffManagementView` | context staff/teachers | `users.manage` | SCHOOL | Tab | alias staff→people | People |
| `/app/invitations` | school | People / Invitations | `InvitationsPage` | — | `users.manage` | SCHOOL | Tab | — | People |
| `/app/admissions-*` | school | Admissions sections | `AdmissionsView` | section prop | `admissions.manage` | SCHOOL | Tab | — | Admissions |
| `/app/academics`, `academic-*` | school | Academics sections | `AcademicsConfigView` | section | settings/students | SCHOOL | Tab | — | Academics |
| `/app/timetable` | school | Academics / Timetable | `ClassTimetableView` | — | settings/students | SCHOOL | Tab | — | Academics |
| `/app/assessments` + CA/tests/exams aliases | school/personal | Assessment (overloaded) | `AssessmentWorkspace` | last path segment as type | `assessments.view` | SCHOOL | Tab; internal tabs local | aliases → assessments | Assessment |
| `/app/results`, report-cards, pins, approval, publishing | school | Results (also aliased to assessments) | `ResultsManagementView` / Assessment | section | results.* | SCHOOL/LEGACY | Ambiguous | NAV_ALIASES map many to assessments | Performance |
| `/app/student-progress` and performance IDs | school | Performance views | `PerformanceView` | view | `reports.view` | SCHOOL | Tab | — | Performance |
| `/app/intervention-tracking` | school | Interventions | `SchoolModuleView` | moduleKey | `students.view` | SCHOOL | Tab | — | Performance |
| `/app/library`, online-learning IDs | school/personal | Learning resources / CBT / modules | `LearningResourcesView`, `CBTQuizModuleView`, modules | — | library/learning/assessment | SCHOOL | Tab | — | Learning |
| `/app/attendance` and attendance IDs | school | Attendance / modules | `AttendanceView` / modules | tab | `attendance.view` | SCHOOL | Tab | — | Attendance |
| `/app/finance` and finance IDs | school | Finance / modules / reports | `FeeStructureBillingView` | tab | `finance.view` | SCHOOL | Tab | finance→student-billing | Finance |
| `/app/announcements` etc. | school | Communication | Broadcasts / Messages / modules | audience | students/communication | SCHOOL | Tab | — | Communication |
| `/app/behaviour` etc. | school | Student services | `SchoolModuleView` | moduleKey | `services.manage` | SCHOOL | Tab | — | Services |
| `/app/assets` etc. | school | Operations | `SchoolModuleView` | moduleKey | `operations.manage` | SCHOOL | Tab | — | Operations |
| `/app/school-*`, settings, forms | school | School setup / forms | `SchoolStructureView`, `FormsSettingsView` | resource | settings | SCHOOL | Tab | — | Administration |
| `/app/roles-permissions`, `user-access`, audit, security modules | school | Administration | Administrators / Audit / modules | — | roles/users/audit/security | SCHOOL | Tab | — | Administration |
| `/app/current-plan` etc. | school/personal | Subscription | `SubscriptionView` | — | alsoRoles, not capability | SCHOOL/PERSONAL | Tab | — | Administration |
| `/app/academic-reports` etc. | school | Reports | `ReportsCentreView` | group | reports.* | SCHOOL | Tab | — | Insights |
| `/app/help-support` | all | Help | `HelpSupportView` | — | membership | COMPATIBILITY | Tab | — | Support |
| `/app/platform`, `schools`, `health`, `governance` | platform | Platform console | `PlatformOwnerDashboard` | — | `roles: Platform Owner` | PLATFORM | Tab aliases, one component | — | Platform |
| `/app/branding` | school | Branding | `BrandingStudio` | — | settings | SCHOOL | Tab | — | Administration |

## Duplicate paths / same capability

- `people` and `staff` → same `StaffManagementView`.
- `platform` / `schools` / `health` / `governance` → one dashboard.
- Assessment NAV_ALIASES collapsed CA, tests, exams, question bank, marking, **results**, and **report cards** onto `assessments`, competing with dedicated Results/Performance views.
- Finance IDs (`invoices`, `student-billing`, `outstanding-fees`) share one billing view with different tabs.
- Communication announcements/notices/broadcasts share `BroadcastCenterView`.

## Pages without durable URL identity

- Student profile (`profileStudentId` local state).
- Assessment internal primary tabs and subtabs after landing (except coarse last-segment heuristic).
- Public landing/auth/result-checker views (except reset-password / verify-email).
- Command palette / sidebar clicks that only set `activeTab` when already on `/app`.
- Enrolment wizard, import modal, drawers.

## Unknown / compatibility

| Behavior | Class |
|---|---|
| Unknown `/app/{id}` → Home/Dashboard | UNKNOWN treated as HOME (Wave 7 forbids this) |
| `/join` reserved but no page | UNKNOWN/COMPATIBILITY |
| Role dashboards as Home | LEGACY presentation of one home capability |
| Tenant slug in path after login | LEGACY; not tenant authority |

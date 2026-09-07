# Frontend State Current Map

This is the forensic inventory of the pre-Wave-6 `AppContextType`. “Consumers” names the principal consumer group; the measured exhaustive index is the 57 files returned by `rg -l "useApp\(" src` at baseline.

| Fields/functions | Classification | Current owner / mutation | Persistence / API | Consumers | Wave 6 owner and treatment |
|---|---|---|---|---|---|
| currentUser, setCurrentUser | Auth identity + compatibility + workspace/access | AppContext; bootstrap/session callers | `/auth/me`; none | App root, header/sidebar, dashboards, public auth | Auth identity canonical; workspace/access projected into compatibility value |
| currentRole, setCurrentRole | Compatibility / persona | currentWorkspace role; session restoration | none | root/dashboard/navigation presentation | Workspace compatibility only; no new authorization |
| branding, updateBranding | Tenant / server state | AppContext | demo preference; `/settings/branding` | header, workspace modal, branding, academics | legacy facade; later tenant branding owner |
| currentWorkspace | Workspace | AppContext | demo preference; `/auth/me` | shell, switcher, most dashboards | Workspace canonical |
| switchWorkspace, switchSpaceCategory, loginAsPreset | Workspace + side effect | AppContext | `/auth/switch-workspace` | switcher, sidebar, public/demo | facade forwards controlled Workspace transition |
| students, addStudent, refreshStudents, updateStudent | Domain/server state | AppContext | demo tenant cache; `/students` | Students, attendance, dashboards | frozen legacy domain debt; generation invalidation added; no replacement global provider |
| staff, addStaff, updateStaff, inviteStaff | Domain/server state | AppContext | demo tenant cache; employees/invites | staff, academics, dashboards | frozen legacy domain debt |
| sessions, terms | Academic domain collections | AppContext hydration | academic sessions API | academics, assessment, results, attendance | collections remain legacy; canonical selection moves to AcademicContext |
| classes, subjects | Academic domain collections | AppContext hydration | classes/subjects APIs | academics and multiple domains | frozen legacy domain debt |
| assessments, add/update/score/lock | Domain/server state + side effects | AppContext | demo tenant cache; assessments APIs | assessment, teacher, results | frozen legacy domain debt |
| cbtQuizzes, setCbtQuizzes | Domain state | AppContext/direct setter | none | CBT | frozen legacy debt; guarded from expansion |
| invoices, recordPayment | Finance domain/server state | AppContext | demo tenant cache; payments | finance/dashboards | frozen legacy domain debt |
| feeTransactions, addFeeTransaction | Finance domain/server state | AppContext | demo tenant cache; payments | finance/dashboards | frozen legacy domain debt |
| resultPINs, generatePINBatch, generatePINs | Results domain/server state | AppContext | demo tenant cache; results APIs | results | frozen legacy domain debt |
| launchChecklist, checklistItems, toggleChecklistStep, toggleChecklistItem | Feature/page + derived | AppContext | demo preference; onboarding API | onboarding/dashboard | compatibility; future feature-local migration |
| recordAttendance | Domain mutation / offline side effect | AppContext | attendance APIs/offline queue | attendance | frozen legacy domain debt |
| offlineQueue, syncOfflineQueue | PWA/domain state | AppContext | sync token/device metadata; `/sync` | header/attendance | retained compatibility; no offline engine added |
| isOnline, setIsOnline | Transient global network status | AppContext/window events | none | header/offline UX | retained intentional application-wide state |
| activeChildId, setActiveChildId | Page/feature state | AppContext | none | parent/dashboard | legacy debt; future feature-local owner |
| showToast, hideToast, toast | Transient UI | AppContext/timer | none | broad | intentional global notification compatibility; remains separate from canonical providers |
| lessonPlans, saveLessonPlan | Domain/server state | AppContext | demo preference; lesson plans API | teacher/library | frozen legacy domain debt |
| teacherProfile, updateTeacherProfile | Form/domain state | AppContext | demo preference | teacher/personal | legacy debt; future workflow-local owner |
| linkedChildren, linkChildWithCode | Domain state | AppContext | demo preference | parent/personal | legacy debt |
| invitations, createInvitationLink, revokeInvitation | Domain/server state | AppContext | demo preference; invites API | invitations/staff | frozen legacy domain debt |
| printableCards, generatePrintableCard | Domain/form state | AppContext | demo preference | invitation credentials | legacy debt |
| subscriptionPlans, activeSchoolPlan, activePersonalPlan, upgradePlan | Server/domain + preference | AppContext | plans API | subscription/dashboard | legacy debt |
| guidedSetupSteps, toggleGuidedSetupStep | Feature/page state | AppContext | none | onboarding | legacy debt |
| registerPersonalAccount | Auth/workflow side effect | AppContext | individual registration API | public personal auth | compatibility workflow; canonical state receives result |

Navigation and routing state (`currentView`, `activeTab`, history/location, sidebar/modal state) were already local to `App.tsx`. They remain behind the existing `workspaceRoute` compatibility path. Unknown/debt: `activeChildId`, printable credentials, guided setup, demo-only persistent payloads, and root-owned domain mutations are explicitly time-boxed to later domain waves.

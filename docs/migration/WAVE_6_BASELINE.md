# Wave 6 Baseline

Recorded before Wave 6 edits on 2026-09-04 (Africa/Lagos).

- Git HEAD: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Branch: `main`
- Working tree: dirty, with extensive tracked and untracked Wave 0–5/user work. Wave 6 preserved it; no reset, checkout, clean, or unrelated rewrite was performed.
- Current pre-change `src/context/AppContext.tsx`: 2,029 lines.
- Consumers: 57 source files called `useApp()`.
- Public exports: `initialSubscriptionPlans`, `initialWorkspaces`, `initialGuidedSetup`, `AppProvider`, `useApp`.
- Legacy facade fields: 53 (inventory in `FRONTEND_STATE_CURRENT_MAP.md`).

## Pre-change state and lifecycle

State variables: branding; currentWorkspace; currentUser; students; staff; sessions; terms; classes; subjects; assessments; cbtQuizzes; invoices; feeTransactions; resultPINs; launchChecklist; lessonPlans; teacherProfile; linkedChildren; invitations; printableCards; subscriptionPlans; activeSchoolPlan; activePersonalPlan; guidedSetupSteps; offlineQueue; isOnline; activeChildId; toast.

Effects: one application hydration effect; four profile/invitation/card persistence effects; online/offline listeners; toast timer cleanup; ten demo persistence effects. The hydration effect listened for `skuggle:authenticated` and `skuggle:workspace-changed` and issued `/auth/me` followed by capability-conditioned collection requests.

Actions/callbacks: profile, child link, invitation, printable-card, plan, setup, registration, toast, branding, workspace/category/preset switching, role compatibility, student/staff/assessment/finance/result/attendance/offline-sync/lesson-plan operations.

API dependencies: `/auth/me`, `/auth/switch-workspace`, academic sessions, classes, subjects, employees, assessments and scores, payments, invites, onboarding, plans, lesson plans, students, branding, individual registration, results, attendance, and sync. All use the central cookie-session `apiClient`; no tenant header is attached in AppContext.

Persistence: `skuggle_authenticated` is a session-presence hint; `skuggle_device_id` and `skuggle_sync_token` are sync metadata. All JSON domain persistence and active-workspace/branding preferences are behind the compile-time `demoMode === false` compatibility branch. No sessionStorage or IndexedDB access was present. History/location ownership was in `App.tsx`/`workspaceRoute`, not AppContext.

## Ownership findings

- Auth, workspace membership, access metadata and domain hydration were combined in `/auth/me` handling.
- Workspace switch committed a locally selected workspace and emitted an event, but had no explicit SWITCHING state or generation guard.
- Academic session/term arrays were domain collections; no canonical selection boundary existed. Campus selection was absent.
- Permission and capabilities were embedded in `CurrentUser`; assignments and persona hint from the Wave 5 payload were discarded.
- Domain collections, optimistic mutations, offline queue, toast state, and several feature workflows shared the root context.
- Routing remained outside AppContext and is unchanged by Wave 6.

The complete pre-change `git status --short` was captured in execution evidence; it included existing changes across frontend, backend, CI, architecture documents, tests, and Wave 3–5 implementation files.

# Assessment module implementation audit

## Pre-implementation route audit

| Existing route/screen | Existing backend endpoint | New parent tab | New UI pattern | Reusable component | Backend dependency | Migration risk |
|---|---|---|---|---|---|---|
| Assessment Studio / builder | `POST /ai/assessment`, CBT routes | Assessments | Full-page studio | Existing `AssessmentStudio` | AI quota, assessment create permission | Low; preserved intact |
| Continuous score sheets | `GET /assessments/{id}/scores`, score update route | Marking | Queue to score workspace | `DataTable`, drawer | revision token and roster validation | Medium; legacy local score model remains in Studio |
| Assessment repository | `GET/POST/PATCH /assessments` | Assessments | Searchable, sortable, paginated table | `DataTable`, `StatusBadge` | Assessment controller and policy | Low |
| SmartMark scanner | `/smartmark/batches` upload/show/commit routes | Marking | Lazy-loaded staged workflow | Existing `SmartMarkScanner` | OCR service and review thresholds | Low; existing workflow reused |
| Result management | `/results`, result workflow actions | Results | Results and approval subtabs with detail drawer | `DataTable`, `Drawer` | `ResultWorkflowService` | Medium; publication records are separate from assessment hydration |
| Report card generator | result report endpoints | Results | Report Cards subtab | Existing report backend | school branding and report jobs | Medium; dedicated legacy screen still exists |
| Result approval | result workflow action endpoint | Results | Approval queue and review drawer | `Drawer`, `StatusBadge` | server workflow transition checks | Low |
| Result publishing | result publish/bulk routes | Results | Publishing subtab | confirmation-ready table pattern | `ResultWorkflowService`, notifications | Low |
| Result PIN management | PIN service through result workflow | Settings | Result PIN section | settings panel | `ResultPinService` | Medium; no standalone settings write endpoint |
| Grade/weight configuration | onboarding assessment structure endpoint | Settings | Settings section | settings panel | school settings/onboarding | Medium; no dedicated assessment-settings API |
| Question bank | no tenant question-bank CRUD endpoint found | Question Bank | Honest empty state plus Studio handoff | `EmptyState`, filter bar | backend endpoint required | High; no fake records introduced |

## Implementation tracking

| File changed | Component changed | Problem resolved | New UI pattern | Backend impact | RBAC impact | Regression risk |
|---|---|---|---|---|---|---|
| `src/App.tsx` | Assessment lazy route | Routes Assessment to the lifecycle workspace | Code-split module shell | None | Existing route gate retained | Low |
| `src/features/assessments/AssessmentsView.tsx` | `AssessmentStudio` export | Preserves the full legacy studio inside the new hierarchy | Nested full-page studio | None | Existing action checks retained | Low |
| `src/features/assessments/AssessmentWorkspace.tsx` | New module workspace | Replaces fragmented navigation with six tabs and required subtabs | KPI command center, queues, tables, drawers, modal | Uses existing lookup/create endpoints; does not alter contracts | Buttons derive from server-issued permissions | Medium |

## Known backend dependencies

- Question Bank CRUD and standalone assessment settings endpoints are not present. Those areas deliberately show non-fabricated empty/read-only states.
- The hydrated assessment list does not currently expose assessment type, delivery mode, or scheduled date. The table avoids inventing dates; type/delivery should be added to the assessment resource before they become editable filters.
- Result publications are fetched by the existing Results module rather than the global assessment context. A future shared query layer can merge those records into this workspace without changing its navigation model.

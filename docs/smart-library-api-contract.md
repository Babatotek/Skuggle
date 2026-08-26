# Skuggle Smart Library API Contract

This frontend implements the Smart Library journeys from the version 1.0 PRD. The Laravel API remains authoritative for identity, curriculum, entitlements, licensing, resource approval, progress, mastery and AI usage.

## Response envelope

Successful responses should use one envelope:

```json
{ "data": {} }
```

Validation errors should follow Laravel's standard `422` shape. Every non-validation error should include a safe `message`; production responses should also include an `X-Request-ID` header.

## Account model

- `POST /individuals/register` creates a `student` or `parent` account without requiring a tenant.
- Student age, guardian identity and consent must be validated server-side. The browser checks are usability aids only.
- `schoolInvitationCode` is optional. A later verified school connection must link the existing identity rather than create a duplicate learner.
- `/auth/me` may therefore return a student or parent with `tenant: null`.

## Public endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/public/library/curriculum` | Publicly browsable levels, classes, subjects and terms |
| GET | `/public/library/resources` | Paginated approved public/free resources |
| GET | `/public/library/resources/{resource}` | Licensed preview or full free resource |
| POST | `/public/library/resources/{resource}/assistant` | Rate-limited structured public explanation |
| GET | `/public/library/resources/{resource}/practice` | Approved public practice set |
| POST | `/public/library/practice/{practice}/attempts` | Evaluate a public practice attempt |

Public endpoints must never expose draft, restricted, tenant-private or unlicensed content.

## Authenticated library endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/library/home` | Role-aware personalised library home and entitlement |
| GET | `/library/curriculum` | Curriculum options for the current learner/school context |
| GET | `/library/resources` | Search and filter authorised resources |
| GET | `/library/resources/{resource}` | Read an authorised resource |
| POST/DELETE | `/library/resources/{resource}/bookmark` | Save or remove a bookmark |
| PATCH | `/library/resources/{resource}/progress` | Save reading position using `sectionId` and `contentVersion` |
| POST | `/library/resources/{resource}/assistant` | Grounded structured AI action |
| GET | `/library/resources/{resource}/practice` | Resource-linked practice set |
| POST | `/library/practice/{practice}/attempts` | Evaluate practice and return mastery feedback |
| GET | `/library/views/{view}` | Role-aware collections such as saved, reading, progress or assigned |

`PATCH /progress` must reject stale `contentVersion` values with `409 Conflict`; it must not silently overwrite progress against a newer resource version.

## Parent endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/library/parent/help-options` | Authorised children, subjects and parent-friendly challenges |
| POST | `/library/parent/help-plans` | Create a short grounded home-learning activity |

The response must only expose children linked to the authenticated guardian. It should use parent-friendly language and avoid detailed behavioural surveillance.

## Teacher endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/library/resources/{resource}/assignment-options` | Teacher's authorised classes, students and allowed activities |
| POST | `/library/resources/{resource}/assignments` | Publish a resource assignment |
| POST | `/library/tools/quiz-generator/inspect` | Extract candidate outcomes from an uploaded syllabus |
| POST | `/library/tools/quiz-generator/generate` | Generate a reviewed MCQ draft from selected outcomes |
| POST | `/library/tools/quiz-generator/{draft}/save` | Save a generated quiz as a teacher-review assessment draft |
| POST | `/library/exports` | Queue a licence-aware combined PDF handout |
| GET | `/library/exports/{job}` | Read PDF generation status and authorised download URL |
| GET | `/library/teacher/quiz-performance` | Return class/subject-filtered student score series and learning gaps |
| GET | `/library/teacher/usage-insights` | Return aggregated student resource accesses and downloads |

The server must enforce teacher/class assignment and resource-publication permissions. A client-supplied student ID is never sufficient authorisation.

## Document collaboration and revision endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/library/resources/{resource}/summary` | Generate or return a cached summary of the current approved version |
| GET | `/library/resources/{resource}/annotations` | Read collaborative annotations visible to the current user |
| POST | `/library/resources/{resource}/annotations` | Add a teacher annotation |
| PATCH | `/library/resources/{resource}/annotations/{annotation}` | Update an owned/authorised annotation |
| DELETE | `/library/resources/{resource}/annotations/{annotation}` | Delete an owned/authorised annotation |
| POST | `/library/resources/{resource}/annotations/transcribe` | Transcribe teacher microphone feedback into text |
| GET | `/library/resources/{resource}/versions` | List revision author, time and change summary |
| POST | `/library/resources/{resource}/versions/{version}/restore` | Restore an earlier draft as a new current version |

Annotation reads may use short polling initially; production collaboration may later expose WebSocket events. Every annotation mutation must be authorised server-side, scoped to the resource and recorded in the audit log.

Version restoration must never delete or overwrite history. The request sends `createNewVersion: true`; the restored content becomes a new revision linked to its source version.

Audio uploads must have strict size, duration and MIME validation. Store no raw microphone audio longer than required for transcription unless a separate, disclosed retention policy explicitly permits it.

## Learning pathway endpoint

`GET /library/pathway` returns an ordered, explainable pathway for the authenticated learner. Each node identifies its status, reason, optional mastery and authorised destination. Suggestions may use curriculum order, reading, practice, published assessment signals and teacher recommendations; they must not turn raw activity into a high-impact academic decision.

## Smart Quiz Generator safeguards

- Accept only supported PDF, DOCX and plain-text files within configured size limits.
- Virus-scan uploads and extract text in an isolated worker.
- Treat uploaded document text as untrusted data, never as system instructions.
- Store the upload behind a short-lived opaque token; do not return storage paths.
- Ground every generated question in teacher-selected learning outcomes.
- Return answers and rationales for teacher review, but never auto-publish.
- Persist provider/model details internally for audit and cost controls; keep the frontend provider-agnostic.

## Combined PDF export safeguards

- Re-check `canDownload` and licence rights for every selected resource on the server.
- Keep the teacher-selected ordering.
- Render the combined handout in a background job and expose short-lived authorised downloads.
- Never embed restricted resources merely because their IDs were submitted by an authorised teacher.

## Resource requirements

Every resource response includes:

- curriculum mapping and learning context;
- `accessTier` (`free`, `learn_plus` or `school`);
- a human-readable `sourceLabel`;
- approval and recommendation indicators;
- licence identity and copyright owner;
- granular permissions for read, explain, summarise, practise, download, offline use, assignment and recommendation;
- immutable `contentVersion` for progress conflict detection.

Readable section content is returned as plain text. Do not return untrusted HTML for direct rendering.

## AI gateway requirements

The frontend calls Skuggle endpoints only; it does not know or select an AI provider. The Laravel application should route requests through a provider-agnostic gateway.

Each assistant request includes a structured action and current resource section. The server adds authoritative student, class, subject, curriculum version, topic, resource, licence and entitlement context before retrieval and generation.

Each response identifies one of:

- `source_supported`;
- `generated_example`;
- `generated_practice`.

It also returns grounding sources, an optional uncertainty note and remaining usage where appropriate. Licence flags must be checked before retrieval or generation, and public/student requests must use age-appropriate safety controls.

Document summaries, syllabus analysis and microphone transcription use this gateway or a dedicated provider adapter. Gemini, Groq-hosted models and other approved providers may be selected by server configuration; provider API keys must never be shipped to the browser.

## Search and performance

- Index curriculum and licence metadata used by the catalogue filters.
- Paginate resource results and return `currentPage`, `lastPage` and `total`.
- Cache safe public metadata and entitlement-aware catalogue queries without crossing tenant or user boundaries.
- Stream or chunk large resource content; never send an entire large book merely to render the first section.

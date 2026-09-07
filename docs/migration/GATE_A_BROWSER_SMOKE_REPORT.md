# Gate A credentialed browser smoke report

## Decision

**BLOCKED — not executed.** Static analysis is resolved, but Gate A cannot pass without actual credentialed browser evidence.

Capability discovery on 2026-09-04 found:

- the supported in-app/extension browser runtime returned an empty browser list;
- `npm ls @playwright/test playwright playwright-core --depth=0` found no installed automation package;
- `playwright.config.ts` and `e2e/public-flows.spec.ts` exist, but the spec is public/demo-only and its imported runner is absent from project dependencies;
- the Playwright cache contains only `.links`, not a managed browser binary;
- system Chrome and Edge executables exist, but there is no supported repository driver/session to control them;
- CI contains no browser job.

No package was installed and no credential was read, printed, or committed. Demo seed accounts exist for platform super admin, school super admin, school admin, principal, teacher, parent, and student. Future automation must consume `E2E_BASE_URL` and persona-specific email/password variables from CI secrets or ignored local configuration.

## Required matrix

| Persona/space | Required flow | Result | Console/network evidence |
|---|---|---|---|
| Platform Super Admin | Login, Platform Console, tenant list, logout | BLOCKED | Not captured |
| School Super Admin | Dashboard, Students, Admissions, Academics, Assessment, Attendance, Finance, Administration, workspace switch, logout | BLOCKED | Not captured |
| School Admin | Delegated operations and governance restrictions | BLOCKED | Not captured |
| Principal | Dashboard, Academics, Performance, Attendance, People, implemented Reports/Communication | BLOCKED | Not captured |
| Teacher | Assigned academics, Attendance, Assessment, permitted student, unauthorized rejection | BLOCKED | Not captured |
| Parent | Linked child, unrelated child rejection, implemented result/attendance/finance | BLOCKED | Not captured |
| Student | Self data and another-student denial | BLOCKED | Not captured |
| Personal Space | School → personal → school; stale tenant data absent | BLOCKED | Not captured |
| Multi-tenant | School A → School B; navigation, identity, data and API context | BLOCKED | Not captured |

Every route must prove usable primary content and absence of white screens, uncaught errors, infinite loading, request storms, localhost requests, tenant mismatch, unexpected 401/403/404, and 500+. See `GATE_A_BROWSER_SMOKE_RUNBOOK.md` for executable steps and evidence fields, and `BROWSER_E2E_AUTOMATION_PLAN.md` for future CI automation.

GATE A BROWSER REQUIREMENT: BLOCKED

## Gate A duplicate-key correction (2026-09-04)

Affected route: **Assessment → Assessment Studio → Builder**.

The warning was traced to the objective/theory question renderers in
`src/features/assessments/AssessmentsView.tsx`. Generated questions used the
presentation-only `number` field as their React key. The generation contract
does not make that field unique, so two different objective questions returned
with `number: 1` were rendered as siblings with the same key, `1`.

This was UI metadata, not duplicate assessment rows or a database primary-key
collision. The assessment API was checked and exposes unique assessment public
IDs. The question renderer now uses a stable composite identity consisting of
the assessment-question resource type, section, display number, and a
deterministic fingerprint of the question content. It does not use an array
index, random value, or timestamp.

Focused regression evidence:

- `src/features/assessments/AssessmentsView.test.tsx` renders two distinct
  objective questions whose duplicate display values are exactly `1` and `1`;
- both records render;
- a subsequent filtered/rerendered response retains the intended question and
  removes the other without duplication or omission;
- captured `console.error` contains zero duplicate-key warnings.

Validation result:

| Check | Result |
|---|---|
| Focused Assessment Studio regression | PASS (1 test) |
| Full frontend component suite | PASS (3 files, 6 tests) |
| Typecheck | PASS |
| Architecture guard | PASS |
| Production build | PASS (existing chunk-size/circular-chunk warnings only) |
| Credentialed browser rerun | BLOCKED — supported browser runtime still reports no available browser |

Targeted source review found no second reproduced duplicate-key warning. The
following pre-existing key-quality risks were observed but not changed because
they did not reproduce this defect: index-composite assessment table keys,
optional-ID/index fallbacks in School Structure and Performance, and the
optional score-row ID in the legacy score sheet. These remain targeted frontend
debt rather than grounds for an unrelated list refactor in this correction.

Gate A remains **BLOCKED — BROWSER VALIDATION ONLY** until the complete
credentialed persona matrix executes. Wave 2 has not started.

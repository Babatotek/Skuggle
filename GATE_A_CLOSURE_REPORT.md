# Skuggle Gate A closure report

## Decision

GATE A: BLOCKED — BROWSER VALIDATION ONLY

Wave 2 was not started. The Larastan blocker is closed; credentialed browser smoke did not execute and remains the sole Gate A blocker.

## Larastan closure

- Exact pre-remediation CI result: 152 unaccepted findings on top of the prior 404-finding baseline.
- Reviewed underlying inventory: 556 findings in 364 exact file/message groups.
- Critical disposition: added the missing `SchoolClass::campus()` relationship; retained Laravel verification URL callback behavior while removing the custom notification's overly narrow return declaration.
- Baseline: standard generated `backend/phpstan-baseline.neon`; exact message, identifier, path, and count entries only.
- Exact post-remediation command: PASS, no errors.
- Guard proof: a temporary undefined `Storage::gateABaselineGuardProbe()` call caused `staticMethod.notFound` and exit code 1; it was removed and the clean pass repeated.

## Revalidation

| Control | Result |
|---|---|
| Pint | PASS |
| Larastan | PASS against reviewed baseline |
| Backend suite | PASS — 252 tests / 858 assertions |
| Focused architecture/security/tenant suite | PASS — 40 tests / 258 assertions |
| Teacher assignment isolation | PASS |
| Scope bypass registry | PASS — 27/27 |
| Frontend typecheck | PASS |
| Frontend architecture guard | PASS |
| Component/accessibility tests | PASS — 5/5 |
| Production build | PASS — 2,769 modules; known chunk warnings remain |
| Composer audit | PASS |
| NPM high-severity audit | Latest retry BLOCKED by stalled registry response; previously recorded required-threshold pass remains unchanged |
| Localhost diagnostic guard | PASS through architecture suite |
| Credentialed browser smoke | BLOCKED — no supported browser-control/Playwright execution channel |

## Browser handoff

The environment has Chrome and Edge executables, but no connected browser runtime, installed Playwright runner, managed browser binary, credentialed session, or CI browser job. No random package was installed. Release Operations must execute `docs/migration/GATE_A_BROWSER_SMOKE_RUNBOOK.md` and populate `docs/migration/GATE_A_BROWSER_SMOKE_REPORT.md` with actual evidence on the same release SHA.

No browser PASS is inferred from backend tests.

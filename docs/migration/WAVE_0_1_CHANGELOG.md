# Wave 0-1 changelog

| Change ID | Requirement | Files | Why | Test | Risk | Rollback |
|---|---|---|---|---|---|---|
| W01-BASE | baseline freeze | `WAVE_0_1_BASELINE.md` | preserve dirty work and failures | git/test/build evidence | low | documentation-only |
| W01-TEL | W0.1 | error boundary, school structure view | remove localhost data egress | static network test/build | low | do not restore calls |
| W01-TEN | W0.2 | school structure controller; Employee, SchoolClass, TeacherProfile; feature test | prevent cross-tenant teacher links | 7 tests/12 assertions | medium compatibility: requires real teacher relationship | revert only to equally strict resolver |
| W01-BOLA | W0.3/W1.9 | resource map, architecture test, isolation trait | release inventory and reusable matrix | architecture suite | low | replace atomically |
| W01-SCOPE | W0.4 | bypass registry | accountable privileged queries | 27/27 scope check | low | documentation-only |
| W01-A11Y | W0.5 | Modal, Drawer, ConfirmDialog, lifecycle hook/tests | keyboard/focus safety | Vitest component suite | medium: backdrop default | restore opt-in per consumer, not unsafe default |
| W01-ERR | W0.6 | App/AppErrorBoundary/tests | preserve shell during page failure | render/retry tests | low | retain root boundary |
| W01-GUARD | W1.1-1.8 | architecture baseline/script, PHPUnit architecture suite, allowlist | prevent new architecture debt | positive current-repo checks; CI executes | medium false positives | reviewed baseline entry, never broad ignore |
| W01-CI | W1.10 | CI/deploy verify workflows; package scripts/dependencies | automatic PR/release enforcement | local command parity | low/runtime-neutral | revert workflow steps with replacement gate |
| W01-DOC | reporting | migration/security reports and debt register | evidence and ownership | document presence/full validation | low | documentation-only |

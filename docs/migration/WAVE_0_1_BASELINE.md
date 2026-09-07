# Wave 0-1 implementation baseline

- Commit: `b30f3e1a405f7cd5b4253446752cc1d89724bd09`
- Recorded: 2026-09-03 15:29 WAT (Africa/Lagos)
- Branch: `main`, two commits ahead of `origin/main`
- Worktree: dirty before this execution; 45 tracked files modified and numerous untracked implementation and architecture files were present. The authoritative architecture documents were untracked. No pre-existing change will be reset, discarded, stashed, or overwritten wholesale.

## Existing work classification

- Architecture documents: the seven frozen architecture/design/migration documents exist. Six were untracked at baseline; `SKUGGLE_MIGRATION_AND_IMPLEMENTATION_SPECIFICATION.md` had also been modified after the initial status snapshot.
- Existing implementation work: modified backend controllers, middleware, requests, models, policies, services, seeders, routes and tests; modified frontend shell/context/features; untracked school/forms/backend implementation and broad frontend feature/UI work.
- The complete authoritative file-level snapshot is the output of `git status --short --branch` at the commit above. This report deliberately does not relabel pre-existing user work as Wave 0-1 work.

## Validation baseline

| Check | Command | Result |
|---|---|---|
| Frontend unit/component | `npm test -- --run` | **FAIL (test harness absent):** package has no `test` script. |
| Frontend type/lint | `npm run lint` | **PASS** (`tsc --noEmit`). |
| Backend suite | `cd backend; php artisan test` | Running when this baseline was created; final result is recorded in the execution report. |
| Production build | `npm run build` | **PASS**; Vite transformed 2,763 modules and produced `dist/server.mjs`. Existing warnings: circular `app-public -> app-features -> app-public` chunks and an `app-features` chunk above 500 kB. |

## Known baseline findings/failures

- Three production-reachable hard-coded POSTs target `http://127.0.0.1:7364`: `AppErrorBoundary.tsx` once and `SchoolStructureView.tsx` twice.
- `SchoolStructureController::storeAssignment()` resolves the submitted public user ID through an unrestricted global `User` query and does not establish active tenant membership or an eligible employee relationship.
- Shared Modal and Drawer primitives have dialog semantics, Escape handling, and body scroll locking, but lack an accessible-name binding, initial focus, focus trapping, focus restoration, and background inertness.
- There is no frontend unit/component test command despite a Vitest configuration file.
- Existing build warnings and all pre-existing working-tree changes are legacy/baseline conditions, not introduced by this execution.

## Environment assumptions

- Windows PowerShell, PHP and Composer dependencies already installed under `backend/vendor`, and Node dependencies already installed under `node_modules`.
- Backend tests use the repository's configured test environment (SQLite per `phpunit.xml`).
- No `.env` value or secret is copied into migration evidence.
- Browser role smoke tests requiring seeded services or interactive credentials may only be reported when reproducible locally.

## Intended Wave 0 change surface

- `src/components/AppErrorBoundary.tsx`
- `src/features/school/SchoolStructureView.tsx`
- `src/components/ui/Modal.tsx`, `Drawer.tsx`, and narrowly related shared accessibility utilities/tests
- `backend/app/Http/Controllers/Api/V1/SchoolStructureController.php`
- Targeted backend tenant/security tests and architecture/static checks
- Existing CI workflow(s), package scripts, and Wave 0-1 security/migration documentation

Wave 1 files are intentionally not pre-authorized by this list: they will only be introduced after the Wave 0 gate passes.

# Frontend V2 module migration matrix

| Module | Canonical routes | V2 presentation | Legacy presentation | Verification status |
|---|---|---|---|---|
| Dashboard | `/school` | Existing canonical shell dashboard | Domain-specific legacy dashboard internals remain | Existing |
| Students | `/school/people/students*` | Migrated | Bypassed | Browser evidence pending |
| Guardians | `/school/people/guardians` | Migrated | Bypassed | Browser evidence pending |
| Workforce | `/school/people/workforce*` | Migrated | Bypassed | Browser evidence pending |
| Admissions | `/school/admissions*` | All six views migrated | Deleted from live source | **MIGRATED** — automated gates and authenticated viewport evidence complete |
| Academics and later modules | Existing canonical routes | Not part of Batch 2 | Unchanged | Not started by this batch |

Production `admissions:migrate-legacy --dry-run` against a live backup remains a deploy-time step. Academics and later modules are unchanged.

# Wave 4 Changelog

| ID | Requirement | Files | Why | Tests | Risk / rollback |
|---|---|---|---|---|---|
| W4-01 | Registry/grammar/metadata | Authorization domain registry and enum | Establish one deterministic vocabulary | registry + architecture tests | retain manifest if enforcement disabled |
| W4-02 | Alias safety | `PermissionRegistry` alias definitions | Freeze legacy meanings | alias uniqueness/target/wildcard tests | revert evaluator, never expand aliases heuristically |
| W4-03 | Additive DB sync | synchronizer + reference seeder | Create canonical metadata without grants/deletes | idempotency/ID/pivot/unknown tests | canonical rows remain harmless additive metadata |
| W4-04 | Evaluator/shadow | evaluators + permission middleware | Compare old/new decisions request-locally | parity/mismatch/platform tests | set mode `off`/`shadow` |
| W4-05 | Frontend contract | session presenter | Distinguish capabilities from legacy keys | authenticated payload test | keep legacy `permissions` facade |
| W4-06 | Feature rollout | config/env | Explicit cohorts only | configuration/full suite | return to shadow/off |
| W4-07 | CI governance/docs | architecture test/guard and Wave 4 documents | Reject unknown route keys and unsafe aliases | architecture suites | baseline only reviewed legacy debt |

No RoleAssignments, `role_id` removal, multi-role membership, Person, AppContext/router/shell/navigation or domain migration was implemented.

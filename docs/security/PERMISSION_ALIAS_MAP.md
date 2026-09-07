# Permission Alias Map

The registry declares 40 one-way, one-target legacy aliases. Each alias contains a frozen target, reason, owner, introduced version, removal Wave 24 and `authz_legacy_alias_used` telemetry identity. Wildcards and heuristic suffix expansion are rejected.

Broad aliases are frozen as follows and grant no future capability:

| Legacy | Canonical current-behavior target |
|---|---|
| `admissions.manage` | `admissions.application.manage` |
| `operations.manage` | `operations.record.manage` |
| `services.manage` | `services.record.manage` |
| `learning.manage` | `learning.record.manage` |
| `communication.send` | `communication.message.send` |
| `finance.manage` | `finance.account.manage` |

All remaining mappings are directly inspectable through `PermissionRegistry::aliasDefinitions()`. A new canonical capability is never appended to an old broad alias automatically.

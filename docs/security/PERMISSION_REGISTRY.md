# Canonical Permission Registry

Version 1 is code-owned by `PermissionRegistry`. The grammar is exactly `{domain}.{resource}.{action}` using lowercase letters, digits and underscores. Each of the 40 current-behavior definitions contains domain, resource, action, description, allowed conceptual scopes, privilege class, delegability, explicit legacy aliases, lifecycle status, introduced version and owner.

Privilege classes are STANDARD, SENSITIVE, PRIVILEGED and PLATFORM_CRITICAL. Every `platform.*` definition must be PLATFORM_CRITICAL. Tenant school roles are rejected for platform capabilities regardless of similarly broad legacy grants.

Scope metadata (`SELF`, `OWN_RECORDS`, `LINKED_CHILDREN`, `ASSIGNED_CLASSES`, `ASSIGNED_SUBJECTS`, `CAMPUS`, `TENANT`, `SPECIFIC_RESOURCE`, `PUBLIC_PUBLISHED`) describes allowed scope types only. Policies must still prove the relationship. The registry is not a resource-policy DSL.

`PermissionRegistrySynchronizer` additively creates missing canonical rows and safely refreshes descriptions. It never deletes rows, rewrites IDs, resets pivots or grants canonical rows to roles. Unknown rows are returned as UNMAPPED or INVALID for operator review.

Registry version changes only for definition, meaning, alias or material privilege-class changes.

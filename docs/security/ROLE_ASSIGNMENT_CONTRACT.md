# Role assignment contract

`RoleAssignment` is additive and identified externally by ULID `public_id`. It belongs to one membership and one global role. Status is `ACTIVE` or `REVOKED`; authority is effective only when `starts_at <= now < ends_at` (null endpoints are open). Expiry is evaluated synchronously and needs no cron.

Scopes are deliberately limited to `TENANT` (null `scope_id`) and `CAMPUS` (an existing campus in the membership tenant). Resource policies remain authoritative for class, subject, child, self, and record relationships. Grants are a union of canonical permissions from effective explicit assignments plus the implicit legacy `role_id`; duplicate role IDs are collapsed. There is no deny DSL.

Security invariants are enforced in `RoleAssignmentService`: actor and target tenant match; school memberships cannot receive a role containing platform capabilities; platform memberships cannot receive school-only roles; campus belongs to tenant; actor has `identity.role.manage`; every target capability is both delegable and already held by actor; self-grant is denied. Controllers must not mass-assign the model.

The database prevents duplicate assignment identity `(membership, role, normalized scope key, source)`. `scope_key` is a structured `TENANT`/`CAMPUS:<id>` normalization because MySQL permits duplicate nulls in unique indexes. Temporal replacement uses a distinct source or reuses/updates the same identity; application locking serializes mutations. This avoids a constraint that would prohibit legitimate future schedules. All mutations clear request-local authorization cache and emit redacted audit events.

Primary compatibility role is always `tenant_memberships.role_id` during Wave 5. It controls the legacy role label/persona hint only. Secondary assignments add authority and never overwrite it. A single-role legacy update changes `role_id` and upserts the `LEGACY_PRIMARY` assignment. Explicit multi-role changes do not change `role_id`.

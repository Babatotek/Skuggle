# Tenant Cache and Storage Contract

## Cache

`TenantCacheKey` creates `skuggle:v2:{environment}:tenant:{tenant}:{resource}:{scope}` keys. Scope fields are sorted and encoded. Platform keys use an explicitly different `platform` namespace. Campus/session/term belong in scope whenever they affect correctness. Cache lookup never replaces authentication, relationship checks or policy authorization; loss of the cache must only affect performance.

Legacy v1 keys are compatibility debt and may be migrated incrementally. New migrated code must not concatenate tenant keys manually.

## Storage

`TenantStoragePath` creates `tenants/{tenant-public-id}/{classification}/{domain}/{resource}/{filename}` and rejects traversal or embedded separators. `public` means an explicitly published tenant asset; `private` requires authentication, tenant context, resource authorization and a streamed/short-lived response. A signed URL is delivery mechanics, not authorization.

Branding logos are explicitly `public_tenant_branding`, carry tenant-scoped key, uploader ID and checksum metadata, validate PNG/JPG/WebP, 2 MB and 2048×2048, and delete only an older key inside the same tenant prefix. Student documents, SmartMark input and generated reports/exports remain private and must be migrated to the helper without bulk-moving existing objects.

Reports/exports authorize before download and constrain the artifact row through TenantScope. Public library content is explicitly `is_public`; private library downloads remain authorized.

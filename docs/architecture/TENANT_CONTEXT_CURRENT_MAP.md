# Current Tenant Context Map

## Authenticated flow

`request -> Sanctum authentication -> session workspace selector -> active membership -> active/trial tenant -> ResolveTenant -> TenantContext v2 -> TenantScope -> policy/service -> database`

| Input | Classification | Rule |
|---|---|---|
| Authenticated active membership | CANONICAL | Authoritative participation proof |
| Session `tenant_public_id` | CANONICAL selector | Must resolve to the user's active membership |
| `X-Tenant-Id` | COMPATIBILITY | Cannot disagree with session; never grants membership |
| Workspace switch `tenantId` | COMPATIBILITY selector | Server resolves it against active memberships, then updates session |
| `tenant_id` / `school_id` body values | UNSAFE | Never authority; relationship validation only |
| Route resource ID | INTERNAL selector | Tenant global scope/policy hides foreign records |
| Job envelope | INTERNAL | Versioned immutable tenant/principal proof, revalidated at execution |
| CLI tenant iteration/argument | INTERNAL | Explicit controlled activation required |
| Public result/library record | PUBLIC | Resolve published projection; no membership privilege |
| Platform permission + context | PLATFORM | Explicit principal/capability required for global behavior |
| Hostname | DEPRECATED/unused | No current authoritative resolution |
| Token | CANONICAL identity | Authenticates user; membership still proves tenant |

Public entry points are registration, invitations, public results, public library, contact and payment/delivery webhooks. They do not pass tenant middleware. Public result/library compatibility code still uses a named legacy adapter and must not be called by private model access.

Raw/global queries are not scoped automatically and must appear in the bypass registry with owner, principal and tests.

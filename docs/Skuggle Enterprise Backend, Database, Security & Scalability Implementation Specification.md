# Skuggle Enterprise Backend, Database, Security & Scalability Implementation Specification

**System:** Skuggle School Operating System  
**Architecture:** Multi-Tenant SaaS  
**Primary Backend:** Laravel  
**Primary Database:** MySQL  
**Cache / Sessions / Queues:** Redis  
**Deployment Strategy:** Shared-hosting-compatible initial release with horizontally scalable target architecture  
**Target:** Production-grade, secure, low-latency, fault-tolerant SaaS capable of progressively scaling toward 1,000,000+ concurrent users

---

# 1. Purpose

This specification defines the mandatory backend, database, API, security, caching, queueing, multi-tenancy, performance, observability and deployment requirements for Skuggle.

The implementation SHALL replace the current development/demo backend completely.

The production backend SHALL NOT retain:

- hardcoded users;
- demo credentials;
- mock authentication;
- in-memory sessions;
- mock database records;
- fallback fake academic data;
- development-only API behaviour;
- hardcoded tenant identifiers;
- secrets committed to source control.

The production backend SHALL provide persistent storage, authentication, tenant isolation, transaction management, caching, background processing, monitoring and scalable APIs.

The audit confirms that the existing backend lacks these production capabilities.

---

# 2. Fundamental Architecture Decision

Skuggle SHALL use a **modular monolith first, distributed-scale-ready architecture**.

Do not begin by breaking the application into dozens of microservices.

That would create network complexity, deployment complexity and distributed failure modes before Skuggle has earned the traffic requiring them.

The Laravel application SHALL instead contain strongly separated domain modules.

```text
                        ┌─────────────────────┐
                        │    Cloudflare       │
                        │ CDN / WAF / DDoS    │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Skuggle Frontend    │
                        │ Web / PWA / Mobile  │
                        └──────────┬──────────┘
                                   │ HTTPS
                        ┌──────────▼──────────┐
                        │ Laravel API Layer   │
                        │ /api/v1/*           │
                        └──────────┬──────────┘
                                   │
             ┌─────────────────────┼──────────────────────┐
             │                     │                      │
     ┌───────▼──────┐     ┌────────▼───────┐     ┌──────▼───────┐
     │ MySQL        │     │ Redis          │     │ Object       │
     │ Primary Data │     │ Cache/Session  │     │ Storage      │
     │              │     │ Queue/Locks    │     │ S3/R2       │
     └───────┬──────┘     └────────┬───────┘     └──────────────┘
             │                     │
     ┌───────▼──────┐     ┌────────▼─────────┐
     │ Read Replicas│     │ Queue Workers    │
     │ Future Scale │     │ Horizon          │
     └──────────────┘     └──────────────────┘
```

The backend SHALL be stateless wherever possible so additional application servers can be introduced without altering business logic.

---

# 3. Required Technology Stack

## 3.1 Core Backend

Production implementation SHALL standardize on:

- **Laravel 13.x**
- PHP 8.3+
- Composer 2+
- REST/JSON API
- Laravel Eloquent ORM
- Laravel Service Container
- Laravel Events
- Laravel Queues
- Laravel Scheduler
- Laravel Cache
- Laravel HTTP Resources
- Laravel Form Requests
- Laravel Policies and Gates

Laravel 13 was released March 17, 2026, requires PHP 8.3+, and receives security fixes through March 17, 2028.

The earlier audit proposed Laravel because of its migrations, Eloquent ORM, authorization, queues, events, file abstraction and testing facilities.

## 3.2 Database

Use:

- MySQL 8.4 LTS or supported Hostinger MySQL equivalent
- InnoDB exclusively
- `utf8mb4`
- strict SQL mode
- UTC internally
- explicit foreign keys
- transactions for multi-record writes
- composite indexes based on real query patterns

MySQL 8.4 is an LTS branch, and InnoDB provides ACID transactions, row-level locking, crash recovery and concurrency-oriented behaviour.

## 3.3 Redis

Redis SHALL ultimately provide:

- application cache;
- session storage;
- rate-limit counters;
- distributed locks;
- permission cache;
- temporary state;
- queue transport;
- idempotency keys;
- real-time counters;
- frequently accessed tenant configuration.

Production-scale Redis SHALL NOT reside inside the same constrained shared-hosting account.

## 3.4 Laravel Packages / Supporting Components

Recommended production components:

| Requirement | Technology |
|---|---|
| SPA/API Authentication | Laravel Sanctum |
| Login/MFA workflows | Laravel Fortify |
| RBAC | Spatie Laravel Permission |
| Multi-tenancy | Stancl Tenancy or equivalent audited implementation |
| Redis Queue Monitoring | Laravel Horizon |
| Performance runtime | Laravel Octane |
| Error monitoring | Sentry |
| Application metrics | Laravel Pulse + external APM |
| API documentation | OpenAPI 3.x / Scribe |
| Static analysis | PHPStan/Larastan |
| Testing | Pest/PHPUnit |
| Object storage | S3-compatible storage / Cloudflare R2 |
| CDN/WAF | Cloudflare |
| Search | MySQL FULLTEXT initially; Meilisearch/Typesense later |

Laravel Horizon SHALL only be introduced where Redis infrastructure permits it. Laravel currently requires Redis for Horizon and does not support Redis Cluster directly for Horizon queues.

---

# 4. Multi-Tenant Architecture

Multi-tenancy is a **security boundary**, not merely a database filter.

The audit identifies the absence of tenant isolation as a critical production defect.

## 4.1 Tenant Definition

Each school SHALL be represented as a tenant.

Primary tenant table:

```text
tenants
```

Recommended fields:

```text
id
public_id
name
slug
code
status
subscription_plan_id
subscription_status
subscription_started_at
subscription_expires_at
timezone
country
currency
settings_version
created_at
updated_at
deleted_at
```

## 4.2 Global User Architecture

Do NOT permanently couple every user to exactly one school.

Use:

```text
users
tenant_memberships
roles
permissions
```

This permits one account to participate in more than one school where legitimate.

Example:

```text
User
 ├── Tenant A → Parent
 ├── Tenant B → Teacher
 └── Tenant C → Proprietor
```

`tenant_memberships` SHALL contain:

```text
tenant_id
user_id
role_id
status
joined_at
invited_by
```

## 4.3 Tenant-Owned Data

Every tenant-owned table SHALL contain:

```text
tenant_id
```

This includes, at minimum:

- students;
- staff;
- classes;
- subjects;
- academic sessions;
- terms;
- enrollments;
- attendance;
- assessments;
- examination questions;
- scores;
- report cards;
- fees;
- invoices;
- payments;
- lesson plans;
- curriculum records;
- communications;
- announcements;
- library resources;
- result PINs;
- audit events;
- organization settings.

## 4.4 Mandatory Tenant Resolution

Protected requests SHALL execute:

```text
Authenticate User
      ↓
Resolve Tenant
      ↓
Validate Membership
      ↓
Validate Tenant Status
      ↓
Load Permissions
      ↓
Execute Policy
      ↓
Execute Tenant-Scoped Query
```

Client-provided `tenant_id` SHALL NEVER be trusted on its own.

The server SHALL derive authorized tenants from the authenticated user.

## 4.5 MySQL Tenant Isolation

The original audit recommends PostgreSQL Row-Level Security.

MySQL does not provide equivalent native PostgreSQL-style RLS.

Therefore Skuggle SHALL implement defence in depth through:

1. tenant middleware;
2. Eloquent tenant global scopes;
3. tenant-aware repositories/services;
4. authorization policies;
5. tenant-specific cache namespaces;
6. compound unique indexes incorporating `tenant_id`;
7. foreign-key ownership validation;
8. automated cross-tenant penetration tests;
9. immutable security audit events.

Direct unscoped model queries against tenant tables SHALL fail code review.

---

# 5. Database Identifier Strategy

The audit proposes UUID primary keys. For very high-volume MySQL workloads, randomly distributed UUID primary keys can cause unnecessary clustered-index fragmentation.

Skuggle SHOULD instead use:

```text
id        BIGINT UNSIGNED PRIMARY KEY
public_id UUIDv7 / ULID UNIQUE
```

`id` is internal.

`public_id` is exposed to clients.

Never expose predictable sequential internal identifiers through public APIs.

Example:

```json
{
  "id": "01K5ZQ1J3Z42KJ4HFA...",
  "name": "Student Name"
}
```

---

# 6. Database Domain Structure

The schema SHALL be organised by domain.

## Core SaaS

```text
tenants
users
tenant_memberships
roles
permissions
role_permission
plans
subscriptions
feature_flags
tenant_settings
```

## Academic Structure

```text
academic_sessions
terms
classes
class_sections
subjects
curricula
subject_assignments
class_subjects
```

## Student Management

```text
students
guardians
student_guardians
enrollments
student_documents
student_medical_information
```

## Staff

```text
employees
teacher_profiles
teacher_assignments
departments
```

## Attendance

```text
student_attendance
staff_attendance
attendance_sessions
attendance_devices
```

## Assessment

```text
assessments
assessment_questions
assessment_submissions
assessment_scores
grading_schemes
result_publications
result_pins
report_cards
```

## AI Education

```text
ai_requests
ai_generations
lesson_plans
curriculum_content
question_banks
marking_jobs
marking_results
```

## Communication

```text
announcements
notifications
notification_deliveries
messages
email_logs
sms_logs
```

## Library

```text
library_resources
library_bookmarks
library_progress
library_annotations
```

## Infrastructure

```text
audit_logs
failed_jobs
jobs
job_batches
personal_access_tokens
idempotency_keys
webhook_events
outbox_events
```

---

# 7. Database Performance Rules

Every migration SHALL be reviewed for query patterns before deployment.

## Mandatory indexes

At minimum:

```text
(tenant_id)
(tenant_id, status)
(tenant_id, created_at)
(tenant_id, student_id)
(tenant_id, class_id)
(tenant_id, academic_session_id)
(tenant_id, term_id)
(tenant_id, user_id)
```

High-frequency queries SHALL receive purpose-built composite indexes.

Do not index every column merely because indexes sound impressive. Excessive indexes slow inserts and consume storage.

## Query requirements

Production code SHALL:

- prohibit uncontrolled `SELECT *`;
- select only required columns;
- use eager loading deliberately;
- prevent N+1 queries;
- enforce pagination;
- avoid loading thousands of Eloquent models into memory;
- use chunking for bulk jobs;
- use cursor pagination for very large result sets;
- use bulk insert/upsert for attendance and score entry;
- analyse slow queries;
- introduce indexes from measured query plans.

The audit specifically identifies N+1 queries, missing indexes, missing query monitoring, lack of pagination enforcement and missing connection tuning as performance risks.

---

# 8. Dashboard Performance Architecture

Dashboards SHALL NOT repeatedly calculate thousands or millions of rows synchronously.

For example, do NOT calculate:

```text
Total Students
Attendance Percentage
Fee Collection
Assessment Average
Gender Distribution
Teacher Statistics
Performance Trends
```

from raw tables on every dashboard request.

Create summary tables such as:

```text
tenant_daily_metrics
student_performance_snapshots
class_performance_snapshots
finance_daily_summaries
attendance_daily_summaries
```

Background jobs SHALL update these summaries.

Dashboard request:

```text
Browser
   ↓
Redis
   ↓ miss
Summary Table
   ↓
JSON response
```

Target cached dashboard query:

```text
< 100 ms application processing
```

The audit baseline requires p95 simple API requests below 200 ms, dashboards below 500 ms and database queries below 100 ms.

---

# 9. Redis Caching Specification

Use a cache-aside strategy.

Example key namespace:

```text
skuggle:v1:tenant:{tenantId}:settings
skuggle:v1:tenant:{tenantId}:dashboard:{termId}
skuggle:v1:tenant:{tenantId}:class:{classId}:students
skuggle:v1:user:{userId}:permissions:{tenantId}
skuggle:v1:tenant:{tenantId}:subjects
```

Every tenant cache key MUST contain tenant identity.

Never create:

```text
students:list
```

Use:

```text
tenant:381:students:list
```

Otherwise one school may receive another school's cached data, which is the sort of optimization nobody wants.

## Suggested TTL classes

```text
Permissions              5–15 minutes
Tenant settings          10–60 minutes
Academic structures      15–60 minutes
Dashboard summaries      30–300 seconds
Search suggestions       5–30 minutes
Sessions                 according to session policy
```

Critical cache entries SHALL be invalidated immediately after writes.

Cache SHALL never become the source of truth.

MySQL remains authoritative.

---

# 10. Cache Stampede Protection

High-demand keys SHALL use distributed locking.

Concept:

```php
Cache::lock($key, 10)->block(3, function () {
    // rebuild cache
});
```

This prevents 10,000 simultaneous cache misses from generating 10,000 identical database queries.

Introduce:

- stale-while-revalidate;
- randomized TTL jitter;
- background cache warming;
- hot-key detection.

---

# 11. Authentication Requirements

Use Laravel Sanctum for first-party SPA/PWA authentication.

Requirements:

- secure HTTP-only cookies where appropriate;
- `Secure`;
- appropriate `SameSite`;
- session regeneration after login;
- CSRF protection;
- email verification;
- password reset;
- session expiration;
- idle timeout;
- session invalidation after password reset;
- logout-all-devices capability;
- active session/device management.

Passwords SHALL use Laravel-supported **Argon2id** where hosting resources permit, otherwise properly configured bcrypt.

Passwords SHALL never be encrypted reversibly or stored in plaintext.

The audit currently identifies plaintext comparison, lack of lockout, lack of verification, insecure sessions and missing MFA as high or critical vulnerabilities.

---

# 12. Multi-Factor Authentication

Mandatory MFA SHOULD apply to:

- Skuggle platform administrators;
- proprietors;
- school administrators;
- finance administrators;
- users with sensitive export privileges.

Support:

- TOTP authenticator applications;
- recovery codes;
- WebAuthn/passkeys later.

SMS SHOULD NOT be the sole high-security MFA mechanism.

---

# 13. Authorization Architecture

Implement both RBAC and resource-level authorization.

Example roles:

```text
Platform Super Admin
Platform Support
School Proprietor
School Administrator
Principal
Vice Principal
Bursar
Accountant
Teacher
Form Teacher
Parent
Student
Librarian
Exam Officer
Admissions Officer
```

Permissions SHALL remain granular:

```text
students.view
students.create
students.update
students.archive
attendance.record
attendance.approve
assessment.create
scores.record
scores.approve
results.publish
finance.invoice.create
finance.payment.record
users.manage
settings.manage
reports.export
```

Role checks alone are insufficient.

Laravel Policies SHALL validate resource ownership.

Example:

A parent MAY view:

```text
their linked children
```

but MUST NOT view another parent's children even when both users have the `parent` role.

---

# 14. API Security Pipeline

Every protected API request SHALL pass:

```text
TLS
 ↓
Cloudflare WAF
 ↓
Rate Limiting
 ↓
Authentication
 ↓
Tenant Resolution
 ↓
Account/Tenant Status Check
 ↓
Authorization
 ↓
Input Validation
 ↓
Business Service
 ↓
Transaction
 ↓
Audit Event
 ↓
API Resource Serializer
```

---

# 15. API Standards

All production endpoints SHALL begin with:

```text
/api/v1/
```

Examples:

```text
/api/v1/auth/login
/api/v1/students
/api/v1/classes
/api/v1/attendance
/api/v1/assessments
/api/v1/results
/api/v1/dashboard
```

Do not expose implementation-specific endpoints haphazardly.

The audit calls for standardized pagination, filtering, request IDs, API versioning, OpenAPI documentation, error responses and upload validation.

---

# 16. Standard API Response

Successful response:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "request_id": "..."
}
```

Validation failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted information is invalid.",
    "fields": {}
  },
  "request_id": "..."
}
```

Internal stack traces SHALL NEVER be returned to production clients.

---

# 17. Pagination

Any endpoint capable of returning large collections SHALL require pagination.

Default:

```text
20–50 records
```

Maximum page size:

```text
100 records
```

Large datasets SHALL use cursor-based pagination where appropriate.

Requests such as:

```text
GET /students?limit=500000
```

MUST be rejected.

Bulk data exports SHALL become asynchronous jobs.

---

# 18. Idempotency

Financial, attendance, examination, synchronization and other critical POST operations SHALL support idempotency.

Header:

```text
Idempotency-Key
```

Store:

```text
tenant_id
user_id
key
request_hash
response
expires_at
```

This prevents duplicate payments, duplicate attendance records and duplicate examination submissions caused by network retries.

---

# 19. Offline PWA Synchronization

Because Skuggle must support unreliable connectivity, synchronization SHALL be designed into the backend.

Records supporting offline changes SHALL include:

```text
public_id
revision
updated_at
deleted_at
```

Client SHALL send:

```text
last_sync_token
device_id
changes[]
```

Backend SHALL return:

```text
accepted[]
conflicts[]
server_changes[]
new_sync_token
```

Conflicting edits SHALL NOT silently overwrite newer server records.

Attendance and scores SHALL use optimistic concurrency controls, consistent with the audit's transaction and revision requirements.

---

# 20. Transactions

Any operation modifying logically connected records MUST use database transactions.

Examples:

- student admission;
- enrollment;
- attendance batch submission;
- assessment publication;
- score submission;
- report publication;
- fee payment;
- result PIN generation;
- subscription activation.

Pattern:

```text
BEGIN
   validate ownership
   update data
   create related records
   write outbox event
   write audit event
COMMIT
```

On error:

```text
ROLLBACK
```

Partial financial or academic writes are unacceptable.

---

# 21. Concurrency Control

Use optimistic locking for frequently edited academic records.

Examples:

```text
attendance
scores
student profile
results
settings
```

Client sends:

```text
revision
```

Update:

```sql
UPDATE assessment_scores
SET score = ?, revision = revision + 1
WHERE id = ?
AND revision = ?
AND tenant_id = ?
```

If affected rows = 0:

```text
409 Conflict
```

Do not silently overwrite another teacher's modification.

---

# 22. Background Job Architecture

Long-running work MUST NOT execute during normal HTTP requests.

Queue:

- emails;
- SMS;
- notifications;
- PDF result generation;
- bulk imports;
- exports;
- AI lesson generation;
- examination marking;
- scanned-paper processing;
- analytics calculation;
- thumbnail generation;
- backups;
- webhook dispatch;
- large report generation.

HTTP request:

```text
Request
   ↓
Validate
   ↓
Create Job
   ↓
202 Accepted
```

Worker:

```text
Queue
 ↓
Process
 ↓
Persist Result
 ↓
Notify User
```

The audit identifies the complete absence of job queues, scheduled work, retry handling and dead-letter handling.

---

# 23. Queue Separation

Do not place every workload into one queue.

Use:

```text
critical
notifications
emails
sms
reports
imports
exports
ai
media
default
```

Critical academic jobs SHALL not wait behind a 20,000-record CSV import.

Configure:

- retry limits;
- exponential backoff;
- timeouts;
- unique jobs;
- dead-letter/failed-job handling;
- queue metrics;
- alerting.

---

# 24. AI Workload Isolation

AI operations SHALL NEVER block normal academic transactions.

Architecture:

```text
Laravel API
    ↓
AI Job Queue
    ↓
AI Worker
    ↓
Provider Adapter
    ↓
Gemini / Groq / OpenAI / future provider
```

Define a provider abstraction:

```text
AIProviderInterface
```

AI failures SHALL NOT bring down:

- login;
- attendance;
- result viewing;
- student management;
- payments;
- dashboards.

---

# 25. File Storage

Do not store uploaded files as database BLOBs.

Use S3-compatible object storage.

Suitable objects:

- student photographs;
- assignments;
- scanned examination papers;
- reports;
- certificates;
- lesson resources;
- audio;
- videos.

Database stores metadata and object key only.

Files SHOULD be served through CDN or signed URLs.

---

# 26. Upload Security

All uploads MUST undergo:

1. authenticated authorization;
2. tenant validation;
3. extension allow-list;
4. MIME detection using file content;
5. maximum size validation;
6. randomized object names;
7. malicious-file scanning where available;
8. quarantine until validated for sensitive workflows.

Never trust:

```text
Content-Type
filename
extension
```

provided by the browser.

---

# 27. Rate Limiting

Rate limits SHALL operate at several levels.

### Authentication

```text
IP + identity/account
```

### User API

```text
authenticated user
```

### Tenant

```text
tenant-level quotas
```

### Sensitive operations

Stricter limits:

```text
login
forgot password
OTP
result PIN validation
AI generation
file upload
exports
search
```

### Infrastructure

Cloudflare SHALL provide additional:

- bot mitigation;
- WAF rules;
- IP reputation;
- challenge pages;
- DDoS protection.

The audit identifies missing rate limiting as a critical brute-force vulnerability.

---

# 28. Application Security Headers

Production responses SHALL implement:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Cross-Origin-Opener-Policy where appropriate
frame-ancestors via CSP
```

CORS SHALL use explicit approved origins.

Never configure:

```text
Access-Control-Allow-Origin: *
```

together with credentials.

---

# 29. Secrets Management

Never commit:

```text
APP_KEY
DB_PASSWORD
REDIS_PASSWORD
API credentials
SMTP password
AI API keys
payment secrets
JWT secrets
cloud credentials
```

Production:

```text
APP_ENV=production
APP_DEBUG=false
```

Secrets SHALL be:

- environment-specific;
- least-privilege;
- rotated;
- excluded from Git;
- unavailable through error responses.

---

# 30. Encryption

TLS 1.2+ SHALL be mandatory in transit.

Sensitive application fields SHALL use Laravel encrypted casts/Crypt or authenticated encryption.

Candidate fields:

- sensitive guardian information;
- health information;
- financial identifiers;
- integration credentials;
- API secrets;
- particularly sensitive configuration values.

Passwords SHALL be **hashed**, not encrypted.

Encryption keys SHALL never live inside database records alongside encrypted values.

---

# 31. Audit Logging

Security and business-sensitive actions SHALL generate immutable audit events.

Capture:

```text
tenant_id
actor_id
action
resource_type
resource_id
request_id
IP
user_agent
before_values
after_values
timestamp
```

Log:

- authentication;
- failed authentication;
- password changes;
- MFA changes;
- role changes;
- permissions changes;
- student edits;
- score changes;
- result publication;
- payment actions;
- fee changes;
- exports;
- result PIN creation;
- tenant administration;
- security-sensitive configuration changes.

Audit records SHALL NOT be editable through normal application APIs.

---

# 32. Protection Against Common Web Attacks

Implementation SHALL explicitly address:

- SQL injection;
- XSS;
- CSRF;
- broken access control;
- IDOR;
- mass assignment;
- command injection;
- path traversal;
- SSRF;
- insecure file upload;
- brute-force login;
- credential stuffing;
- session fixation;
- session hijacking;
- CORS misconfiguration;
- insecure direct object references;
- rate-limit bypass;
- cross-tenant data leakage;
- cache poisoning;
- malicious webhooks.

Use OWASP ASVS as a release security baseline.

---

# 33. Laravel Production Optimization

Deployment SHALL execute:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader

php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan view:cache
```

Never run production with:

```text
APP_DEBUG=true
```

Development packages SHALL NOT be deployed unnecessarily.

Laravel Telescope SHALL primarily remain development/staging-oriented unless its production usage is tightly secured and deliberately configured.

---

# 34. Laravel Octane Scale Tier

When Skuggle leaves shared hosting and reaches VPS/dedicated infrastructure, introduce Laravel Octane using:

- FrankenPHP;
- RoadRunner;
- or another supported application server.

Octane keeps Laravel workers resident rather than booting the entire application for every request and can materially improve throughput.

Laravel documents Octane specifically as a mechanism for increasing application performance through persistent application servers.

Octane SHALL NOT be a hard requirement for the initial Hostinger shared deployment.

---

# 35. Search Architecture

Initial stage:

```text
MySQL FULLTEXT
```

Later:

```text
Meilisearch
Typesense
Elasticsearch/OpenSearch
```

Search infrastructure SHALL be isolated from transactional database traffic.

A teacher searching thousands of resources must not interfere with a parent opening a child's result.

---

# 36. Observability

Every request SHALL receive:

```text
X-Request-ID
```

Logs SHALL include:

```text
request_id
tenant_id
user_id
endpoint
method
status
response_time_ms
database_time_ms
query_count
cache_hit/miss
memory_usage
```

Production monitoring SHALL track:

### Application

- requests/sec;
- p50 latency;
- p95 latency;
- p99 latency;
- error rate;
- 4xx rate;
- 5xx rate.

### MySQL

- slow queries;
- active connections;
- lock waits;
- deadlocks;
- replication lag;
- query throughput;
- disk utilization.

### Redis

- memory;
- hit rate;
- eviction;
- connections;
- operations/sec;
- blocked clients.

### Queues

- queue depth;
- processing latency;
- failed jobs;
- retries;
- oldest pending job.

### Infrastructure

- CPU;
- RAM;
- disk;
- network;
- PHP workers;
- uptime.

---

# 37. Health Endpoints

Provide:

```text
/health/live
/health/ready
```

`live` determines whether the process exists.

`ready` validates critical dependencies such as:

```text
MySQL
Redis
storage
```

Do not expose sensitive infrastructure information in these responses.

---

# 38. Error Tracking

Integrate Sentry or equivalent.

Production exceptions SHALL contain sufficient telemetry for debugging but SHALL NOT leak:

- passwords;
- tokens;
- cookies;
- payment information;
- student private data;
- secrets.

---

# 39. MySQL Read/Write Scalability

Repository/service design SHOULD support future connection separation:

```text
Writer
   ↓
Primary MySQL

Readers
   ↓
Read Replicas
```

Transactional writes always go to the primary.

Safe reporting/read workloads may use replicas.

Read-after-write sensitive actions SHALL continue using primary connections where necessary.

The audit already identifies read replicas and connection pooling as necessary future infrastructure.

---

# 40. Database Connection Management

Application nodes MUST use bounded database connection pools.

Never configure every web worker to open unlimited connections.

At scale use:

```text
ProxySQL or equivalent
```

between applications and MySQL.

Connection budgets SHALL be calculated from:

```text
app instances × workers × max connections
```

rather than guessed.

---

# 41. High-Growth Data Strategy

The largest tables will probably include:

```text
audit_logs
attendance
assessment_scores
notifications
AI usage
activity events
communication deliveries
```

These SHALL be designed with:

- composite indexes;
- archival policies;
- retention policies;
- cold storage where appropriate;
- batch inserts;
- efficient pagination.

At extreme scale, tenant-based sharding SHALL become possible without changing external APIs.

Suggested future partitioning:

```text
Shard 1 → Tenant range/hash A
Shard 2 → Tenant range/hash B
Shard 3 → Tenant range/hash C
...
```

Tenant ID therefore becomes part of every major lookup.

---

# 42. Event / Outbox Architecture

Critical transactions generating asynchronous work SHOULD implement a transactional outbox.

Example:

```text
Database Transaction
 ├── Save examination score
 ├── Save audit record
 └── Save outbox event
COMMIT

Outbox Worker
 ↓
Dispatch notification
 ↓
Update analytics
```

This prevents a situation where the database commits successfully but the queue/network fails before the event is dispatched.

---

# 43. One-Million-Concurrent-User Architecture

The requirement SHALL be interpreted as an **architectural scale target**, not a guarantee from a single server.

Skuggle SHALL contain no architectural dependency preventing horizontal expansion to:

```text
1,000,000+ concurrent authenticated clients
```

Ultimate architecture:

```text
                       Cloudflare
                CDN + WAF + DDoS Layer
                           │
                    Global Load Layer
                           │
            ┌──────────────┼──────────────┐
            │              │              │
         Region A       Region B       Region C
            │              │              │
       Load Balancer  Load Balancer  Load Balancer
            │
     ┌──────┼──────┬──────┬──────┐
     │      │      │      │      │
    API    API    API    API    API
    Node   Node   Node   Node   Node
     │
     ├──────── Redis Cache Tier
     ├──────── Queue Tier
     ├──────── MySQL Primary
     ├──────── MySQL Read Replicas
     ├──────── Search Cluster
     └──────── Object Storage/CDN
```

No local application server SHALL contain indispensable user state.

This requirement is what makes horizontal scaling possible.

---

# 44. Performance Objectives

Use the audit baseline initially. It specifies:

- p95 simple queries under 200 ms;
- p95 complex dashboards under 500 ms;
- database queries under 100 ms;
- asynchronous reports;
- 1,000+ requests/sec baseline;
- 99.9% availability.

Recommended Skuggle production targets:

| Function | Target p95 |
|---|---:|
| Cached simple API | <150 ms |
| Normal CRUD | <250 ms |
| Complex dashboard | <500 ms |
| Attendance bulk write | <800 ms |
| Authentication | <500 ms |
| Database query | <100 ms |
| Search | <500 ms |
| AI generation | Async where possible |
| Large reports | Async |

Targets exclude end-user mobile-network latency.

---

# 45. Load Testing

Use:

- k6;
- Locust;
- Gatling;
- JMeter where necessary.

Do not certify production capacity using ApacheBench alone.

Testing stages SHALL include:

```text
100
1,000
5,000
10,000
25,000
50,000
100,000
250,000
500,000
1,000,000 simulated concurrent clients
```

Only proceed to the next tier when the previous one passes.

Tests SHALL include:

1. login storm;
2. morning attendance;
3. end-of-term result checking;
4. examination submission;
5. dashboard loading;
6. parent portal access;
7. AI request spike;
8. large report generation;
9. file uploads;
10. database failover;
11. Redis failure;
12. queue-worker failure;
13. traffic spike;
14. 24-hour soak test.

The audit already requires spike and endurance testing and specifies <5% performance degradation during its endurance scenario.

---

# 46. Security Testing

Before production:

- dependency vulnerability scan;
- secret scanning;
- static application security testing;
- SQL injection testing;
- XSS testing;
- IDOR testing;
- authentication bypass testing;
- privilege escalation testing;
- tenant escape testing;
- file-upload attacks;
- API fuzzing;
- session-security testing;
- penetration testing.

A release MUST fail if Tenant A can retrieve Tenant B data under any test scenario.

---

# 47. Automated Test Requirements

Mandatory test suites:

```text
Unit
Feature
Integration
API Contract
Tenant Isolation
Authorization
Regression
Security
Concurrency
Load
Offline Sync
Queue
Payment
```

Critical security tests SHALL explicitly attempt:

```text
Tenant A → Student B
Teacher A → School B
Parent A → Child B
Admin A → Tenant B settings
```

Expected:

```text
403 or 404
```

Never another tenant's data.

---

# 48. CI/CD Quality Gates

Pull requests SHALL fail when:

- tests fail;
- static analysis fails;
- migrations fail;
- coding standards fail;
- security scanner finds critical issues;
- tenant-isolation tests fail;
- API contract tests fail.

Deployment workflow:

```text
Git Push
   ↓
Tests
   ↓
Static Analysis
   ↓
Security Scan
   ↓
Build
   ↓
Staging
   ↓
Migration Test
   ↓
Smoke Test
   ↓
Production Deployment
```

Production deployments SHOULD support rollback.

---

# 49. Backup Requirements

MySQL:

- automated daily backup minimum;
- more frequent production snapshots as traffic increases;
- encrypted backups;
- off-site copy;
- defined retention policy;
- monthly restoration test.

Object storage:

- versioning where appropriate;
- lifecycle policies;
- recovery procedures.

A backup that has never been restored is an assumption wearing a reassuring costume.

---

# 50. Disaster Recovery

Define:

```text
RPO
RTO
```

Initial recommended objective:

```text
RPO ≤ 15 minutes for critical transactional data
RTO ≤ 60 minutes
```

Enterprise target may become stricter.

Disaster procedures SHALL include:

- database restoration;
- Redis loss;
- application-server loss;
- DNS/CDN failure;
- storage failure;
- accidental deletion;
- compromised credentials.

---

# 51. Hostinger Deployment Architecture

## Tier 0: Local Development

```text
XAMPP / Docker
Laravel
MySQL
Redis
Mail testing service
```

Local development SHALL closely reproduce production behaviour.

Do not allow XAMPP-specific assumptions into production code.

---

# 52. Tier 1: Hostinger Shared Hosting

Suitable for:

- development;
- staging;
- demonstrations;
- controlled pilot;
- initial low-volume production.

Architecture:

```text
Cloudflare
    ↓
Hostinger
    ↓
Laravel/PHP-FPM
    ↓
Hostinger MySQL
```

Restrictions:

- no local Redis support;
- constrained PHP workers;
- constrained MySQL connections;
- constrained CPU/RAM;
- no true application auto-scaling;
- no Laravel Octane server control;
- limited persistent queue-worker capability.

Therefore shared hosting SHALL NOT be certified for the million-user requirement.

---

# 53. Tier 2: Production Growth Architecture

Move application to:

```text
Hostinger VPS
```

Introduce:

```text
Nginx
PHP 8.3+
Laravel
Redis
Supervisor/systemd
Horizon
Octane
MySQL
Cloudflare
Object Storage
```

Hostinger itself positions its VPS offering for scalable Laravel applications and Redis deployments.

---

# 54. Tier 3: High Availability

When load requires:

```text
Cloudflare
     ↓
Load Balancer
     ↓
Multiple Laravel Nodes
     ↓
Redis Tier
     ↓
MySQL Primary + Read Replicas
```

Application nodes remain stateless.

---

# 55. Tier 4: Hyperscale

For hundreds of thousands to millions of simultaneous active users:

```text
Multiple application clusters
Managed MySQL-compatible HA platform
Read replicas
Tenant/data sharding
Distributed cache
Dedicated queue infrastructure
Object storage
Global CDN
Multi-region disaster recovery
Dedicated observability stack
```

At this point infrastructure should be treated as a distributed platform rather than a conventional hosting account.

---

# 56. Shared Hosting Migration Principle

No code SHALL contain assumptions such as:

```text
localhost Redis forever
single server forever
local session files forever
local uploaded files forever
one database server forever
one queue worker forever
```

Instead use Laravel abstractions:

```text
Cache
Queue
Storage
Database
Events
Notifications
```

Changing infrastructure therefore becomes configuration and deployment work rather than application reconstruction.

---

# 57. Required Environment Separation

Maintain:

```text
local
testing
staging
production
```

Use separate:

- databases;
- cache prefixes;
- queues;
- API credentials;
- object-storage paths;
- domains;
- secrets.

Never allow staging to use production school data by default.

---

# 58. Production Data Policy

Seeders SHALL create reference data only.

Production deployment MUST NOT create:

- demo schools;
- sample students;
- mock teachers;
- fake transactions;
- fake attendance;
- fake examination scores.

All demo facilities SHALL be isolated from production.

---

# 59. Database Migration Policy

Every schema modification SHALL use Laravel migrations.

Never modify production database structure manually through phpMyAdmin unless executing an approved emergency procedure.

Migration rules:

```text
forward compatible
reviewed
tested on production-sized dataset
backup before destructive migrations
zero/low downtime where possible
```

Large table changes SHALL be benchmarked before deployment.

The audit already defines migrations as a prerequisite rather than optional infrastructure.

---

# 60. Deployment Performance Configuration

Production SHALL use:

```text
APP_ENV=production
APP_DEBUG=false
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

once running on Redis-capable infrastructure.

For temporary shared-hosting deployment where Redis cannot be provided, use controlled alternatives such as database-backed sessions/queues only as an interim tier.

Do not disguise the fallback as hyperscale infrastructure.

---

# 61. Frontend/API Data Fetching Requirements

Backend SHALL support fast frontend rendering through:

- minimal payloads;
- pagination;
- sparse fields when appropriate;
- conditional requests/ETags where useful;
- HTTP compression;
- CDN caching for public resources;
- cache-control headers;
- batch endpoints;
- aggregated dashboard endpoints;
- incremental synchronization.

Avoid frontend patterns requiring 15 API calls to render one dashboard.

Preferred:

```text
GET /api/v1/dashboard
```

returning the user-specific initial dashboard dataset.

---

# 62. Prevent Request Waterfalls

Where a screen requires:

```text
student
class
attendance
scores
guardian
performance
```

the frontend SHALL NOT necessarily make six sequential dependent requests.

Provide purpose-built endpoints where justified:

```text
GET /students/{id}/overview
```

Backend may fetch optimized relationships and cache appropriate parts.

---

# 63. Data Compression

Enable:

```text
Brotli
gzip
```

at CDN/reverse proxy level.

Large JSON responses SHALL be avoided even with compression.

Images SHALL use optimized formats and CDN transformations where possible.

---

# 64. Subscription and Resource Protection

Each tenant SHOULD have quotas configurable by subscription plan.

Examples:

```text
students
staff
storage
AI requests
SMS
email
report exports
API traffic
```

Rate limits and quotas SHALL be stored server-side.

Tenants MUST NOT manipulate their own subscription entitlement.

---

# 65. Abuse Prevention

Implement detection for:

- repeated login failures;
- enumeration attempts;
- result PIN brute force;
- AI API abuse;
- unusual exports;
- mass student downloads;
- suspicious IP changes;
- repeated cross-tenant requests;
- abnormal file uploads.

Generate security events and alerts.

---

# 66. Result PIN Security

Result-checking PINs SHALL:

- use cryptographically secure random generation;
- never be predictable;
- be hashed when possible;
- have usage limits;
- have expiration rules;
- belong to defined tenant/session/term context;
- have brute-force protection;
- log validation attempts.

---

# 67. Payment and Financial Data

Payment gateway secret keys SHALL remain backend-only.

Every payment webhook SHALL:

1. verify provider signature;
2. validate event identity;
3. enforce idempotency;
4. verify expected tenant;
5. validate amount/currency;
6. create immutable payment event;
7. update financial record transactionally.

Never trust payment success solely because the browser redirects to a success page.

---

# 68. Compliance & Privacy

Skuggle processes information concerning minors and therefore SHALL apply strong privacy controls.

Required:

- data minimization;
- consent where required;
- retention schedules;
- account/data export;
- deletion/anonymization workflows;
- access logging;
- encryption;
- restricted administrative access;
- documented breach process;
- least privilege.

Sensitive student information SHALL not appear unnecessarily in logs or analytics.

---

# 69. Required Domain Service Pattern

Controllers SHALL remain thin.

Incorrect:

```text
Controller
 → validation
 → 400 lines business logic
 → 20 database calls
```

Required:

```text
Controller
 ↓
Form Request
 ↓
Application Service
 ↓
Domain Service
 ↓
Repository/Model
 ↓
Events
 ↓
Resource Serializer
```

This greatly improves testing and later migration to distributed services.

---

# 70. Recommended Laravel Module Structure

```text
app/
 ├── Domain/
 │   ├── Tenant/
 │   ├── Identity/
 │   ├── Student/
 │   ├── Academic/
 │   ├── Attendance/
 │   ├── Assessment/
 │   ├── Result/
 │   ├── Finance/
 │   ├── Curriculum/
 │   ├── Library/
 │   ├── Communication/
 │   └── AI/
 │
 ├── Http/
 │   ├── Controllers/Api/V1/
 │   ├── Middleware/
 │   ├── Requests/
 │   └── Resources/
 │
 ├── Jobs/
 ├── Events/
 ├── Listeners/
 ├── Policies/
 ├── Services/
 └── Support/
```

---

# 71. Phase 1 Implementation Priority

## Foundation

- Laravel 13 installation
- MySQL production schema
- migrations
- tenant architecture
- Sanctum
- Fortify
- RBAC
- policies
- tenant middleware
- standardized API responses
- global exception handling
- OpenAPI specification
- audit logging
- production configuration

No feature development should bypass this foundation.

---

# 72. Phase 2 Core Academic Backend

Implement:

- tenants;
- users;
- students;
- guardians;
- academic sessions;
- terms;
- classes;
- subjects;
- enrollments;
- staff;
- teacher assignments;
- attendance.

---

# 73. Phase 3 Assessment Platform

Implement:

- examination setup;
- periodic tests;
- question management;
- score entry;
- manual examination;
- scan/auto-marking workflow;
- moderation;
- result calculation;
- report publication;
- performance monitoring;
- result PINs.

---

# 74. Phase 4 Performance Infrastructure

Introduce:

- Redis;
- Horizon;
- cache policies;
- queues;
- asynchronous reports;
- summary tables;
- distributed locks;
- cache warming;
- search infrastructure;
- object storage.

---

# 75. Phase 5 Security Hardening

Perform:

- MFA;
- advanced rate limiting;
- WAF;
- secrets rotation;
- CSP;
- upload security;
- tenant penetration testing;
- dependency scanning;
- backup verification;
- disaster recovery test.

---

# 76. Phase 6 Scale Architecture

Introduce only after measured demand:

- Laravel Octane;
- multiple application nodes;
- load balancer;
- ProxySQL;
- read replicas;
- Redis HA;
- service decomposition;
- tenant sharding;
- multi-region deployment.

---

# 77. Mandatory Acceptance Criteria

Skuggle SHALL NOT be classified as production-ready until all of the following are true:

### Security

- [ ] No hardcoded credentials
- [ ] No plaintext passwords
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] Tenant isolation verified
- [ ] Authorization policies complete
- [ ] Rate limiting operational
- [ ] MFA available for privileged users
- [ ] Upload validation operational
- [ ] WAF configured
- [ ] Secrets removed from repository
- [ ] Production debug disabled
- [ ] Security tests passing

### Database

- [ ] All migrations reproducible
- [ ] All tenant data scoped
- [ ] Foreign keys valid
- [ ] High-frequency queries indexed
- [ ] N+1 checks passing
- [ ] Transactions applied
- [ ] optimistic locking implemented
- [ ] backup tested
- [ ] restore tested

### Performance

- [ ] caching active
- [ ] dashboard aggregation optimized
- [ ] pagination enforced
- [ ] async processing operational
- [ ] query monitoring active
- [ ] performance SLA verified by load tests
- [ ] application remains stable during endurance testing

### Reliability

- [ ] queue retries implemented
- [ ] failed jobs monitored
- [ ] health endpoints available
- [ ] error tracking working
- [ ] structured logs available
- [ ] request correlation IDs operational
- [ ] disaster recovery documented

### SaaS

- [ ] tenant creation works
- [ ] tenant suspension works
- [ ] subscription enforcement works
- [ ] tenant configuration isolated
- [ ] cross-tenant tests pass
- [ ] tenant quotas available
- [ ] platform admin separated from tenant admin

---

# 78. Production Definition of Done

The backend is production-ready only when:

```text
Functionality
+
Security
+
Isolation
+
Performance
+
Observability
+
Recoverability
+
Automated Testing
+
Deployment Repeatability
```

have all passed.

A backend that merely responds with HTTP 200 is not production-ready.

---

# 79. Critical Hosting Decision

Skuggle SHALL be built once but deployed through progressively larger infrastructure.

### Start

```text
Hostinger shared hosting
```

for controlled pilot traffic if necessary.

### Growth

```text
Hostinger VPS + Redis + Horizon + Octane
```

### High Scale

```text
Multiple application nodes
Load balancers
MySQL HA
Redis HA
Object storage
CDN
Queue workers
Read replicas
```

### Hyperscale

```text
Distributed application clusters
Database sharding
Multi-region architecture
Dedicated cache/queue/search infrastructure
```

The original audit itself already anticipates load balancers, multiple application instances, Redis HA, database replication, object storage, CDN and DDoS/WAF protection for serious production infrastructure.

---

# 80. Final Engineering Directive

The implementation team or AI coding agent SHALL NOT optimize Skuggle merely to "work on Hostinger shared hosting."

It SHALL implement a **portable, stateless, horizontally scalable Laravel architecture** whose infrastructure adapters can move from:

```text
shared
→ VPS
→ multi-node
→ distributed
```

without rewriting the Skuggle domain.

The application SHALL therefore:

1. keep business logic independent of infrastructure;
2. use Laravel abstractions for database, cache, queue and storage;
3. enforce tenant isolation at every data boundary;
4. keep HTTP requests short;
5. move heavy work to queues;
6. aggressively cache safe high-frequency reads;
7. index queries according to actual access patterns;
8. maintain transactional integrity;
9. secure all privileged operations;
10. generate immutable audit records;
11. remain stateless across application nodes;
12. support distributed locking and idempotency;
13. continuously measure p95/p99 performance;
14. load-test before claiming capacity;
15. allow infrastructure to scale horizontally as demand grows.

**Target architecture principle:**

> Skuggle must not depend on one server being powerful. It must be designed so additional servers, workers, caches, database replicas and storage nodes can be added as user demand increases.

This is the architecture that makes the million-concurrent-user objective technically credible. A single Hostinger shared account cannot provide that capacity, but a Skuggle codebase built according to this specification can evolve toward it instead of requiring another backend rewrite later.
# Skuggle Backend, Database & Performance Production Audit

**Report Date:** August 22, 2026  
**Scope:** Backend architecture, database design, API contracts, performance optimization, scalability, security, and production readiness  
**Auditor:** Production Systems Review

---

## Executive Summary

### Current State
The Skuggle application currently operates with an **Express.js development server** (`server.ts`) that provides:
- In-memory session storage
- Demo authentication with hardcoded accounts
- AI-powered endpoints using Google Gemini API
- Mock data fallbacks when AI API is unavailable
- No persistent database layer
- No production-grade backend infrastructure

### Critical Finding
**The application has NO production backend implementation.** The current `server.ts` is explicitly a development/demo server and lacks:
- Persistent database (PostgreSQL, MySQL, MongoDB)
- Production authentication & authorization
- Multi-tenant data isolation
- Data persistence layer
- Transaction management
- Database migrations
- Query optimization
- Connection pooling
- Cache layer (Redis)
- Background job processing
- API rate limiting
- Proper error logging & monitoring
- Production environment configuration

### Disposition
**❌ NOT PRODUCTION READY** - The backend requires complete implementation before production deployment.

---

## 1. Backend Architecture Assessment

### 1.1 Current Implementation Analysis

#### Express Server (`server.ts`)
```typescript
✅ Strengths:
- Clean Express setup with CSRF protection
- Cookie-based session management pattern
- AI integration for educational features
- Graceful fallbacks for AI endpoints
- Health check endpoint
- Development/production mode separation

❌ Critical Gaps:
- In-memory session storage (lost on restart)
- No database connection or ORM
- Hardcoded demo accounts
- No password hashing
- No input validation middleware
- No rate limiting
- No API versioning
- No request logging
- No error tracking
- No production secrets management
```

#### Session Management
```typescript
// Current: In-Memory (NOT PRODUCTION SAFE)
const sessions = new Map<string, Record<string, unknown>>();

// ❌ Issues:
// - Sessions lost on server restart
// - Cannot scale horizontally (no session sharing)
// - No session expiry handling
// - No session invalidation on password change
// - Memory leak potential with unlimited sessions
```

**Required Fix:** Implement Redis-backed session store or database-backed sessions with TTL.

---

### 1.2 Required Backend Stack

```typescript
Recommended Production Stack:

📦 Core Framework:
- NestJS or Express with TypeScript (current: Express ✓)
- TypeORM or Prisma for database ORM

🗄️ Database:
- PostgreSQL 15+ (primary relational database)
- Redis 7+ (session store, cache, queues)

🔐 Authentication:
- Passport.js with multiple strategies
- bcrypt for password hashing
- JWT for API tokens (optional, alongside sessions)

📊 Monitoring & Logging:
- Winston or Pino for structured logging
- Sentry for error tracking
- New Relic or DataDog for APM

⚡ Performance:
- Bull or BullMQ for background jobs
- Node-cache or ioredis for caching
- Compression middleware

🔒 Security:
- Helmet.js for HTTP headers
- express-rate-limit for rate limiting
- express-validator for input validation
- CORS configuration
```

---

## 2. Database Architecture (MISSING)

### 2.1 Required Database Schema

The application requires a comprehensive multi-tenant database schema:

```sql
-- ============================================
-- CORE TENANT & USER TABLES
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'school', 'district', 'platform'
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    subscription_tier VARCHAR(50),
    subscription_expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_status ON organizations(status);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'platform_admin', 'school_admin', 'principal', 'teacher', 'parent', 'student'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    scope_type VARCHAR(50), -- 'organization', 'class', 'subject', 'student'
    scope_id UUID,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, permission, scope_type, scope_id)
);

CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_lookup ON permissions(user_id, permission);

-- ============================================
-- ACADEMIC STRUCTURE TABLES
-- ============================================

CREATE TABLE academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE INDEX idx_sessions_org_status ON academic_sessions(organization_id, status);

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_terms_session ON terms(session_id);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL, -- 'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'
    arm VARCHAR(10), -- 'A', 'B', 'C'
    class_teacher_id UUID REFERENCES users(id),
    capacity INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classes_organization ON classes(organization_id);
CREATE INDEX idx_classes_teacher ON classes(class_teacher_id);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    category VARCHAR(50), -- 'core', 'elective', 'vocational'
    curriculum_standard VARCHAR(50), -- 'NERDC', 'WAEC', 'NECO'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_organization ON subjects(organization_id);

-- ============================================
-- STUDENT & ENROLLMENT TABLES
-- ============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admission_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10),
    address TEXT,
    state_of_origin VARCHAR(100),
    lga VARCHAR(100),
    religion VARCHAR(50),
    medical_conditions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    enrollment_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, admission_number)
);

CREATE INDEX idx_students_organization ON students(organization_id);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_students_status ON students(status);

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    relationship VARCHAR(50) NOT NULL, -- 'father', 'mother', 'guardian'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    occupation VARCHAR(100),
    address TEXT,
    is_primary BOOLEAN DEFAULT false,
    can_pick_up BOOLEAN DEFAULT true,
    emergency_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardians_student ON guardians(student_id);
CREATE INDEX idx_guardians_user ON guardians(user_id);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, class_id, session_id, term_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_enrollments_session ON enrollments(session_id, term_id);

-- ============================================
-- ATTENDANCE TABLES
-- ============================================

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'present', 'absent', 'late', 'excused'
    time_in TIME,
    time_out TIME,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    revision VARCHAR(100), -- For optimistic locking
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, class_id, attendance_date)
);

CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_class ON attendance_records(class_id);
CREATE INDEX idx_attendance_org_date ON attendance_records(organization_id, attendance_date);

-- ============================================
-- ASSESSMENT & RESULTS TABLES
-- ============================================

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'CA1', 'CA2', 'exam', 'project'
    max_score DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2), -- Percentage contribution to final grade
    assessment_date DATE,
    instructions TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessments_organization ON assessments(organization_id);
CREATE INDEX idx_assessments_class ON assessments(class_id);
CREATE INDEX idx_assessments_subject ON assessments(subject_id);
CREATE INDEX idx_assessments_term ON assessments(term_id);

CREATE TABLE assessment_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    grade VARCHAR(10),
    remarks TEXT,
    recorded_by UUID NOT NULL REFERENCES users(id),
    revision VARCHAR(100), -- For optimistic locking
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

CREATE INDEX idx_scores_assessment ON assessment_scores(assessment_id);
CREATE INDEX idx_scores_student ON assessment_scores(student_id);
CREATE INDEX idx_scores_status ON assessment_scores(status);

-- ============================================
-- LIBRARY & RESOURCES TABLES
-- ============================================

CREATE TABLE library_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- 'document', 'video', 'simulation', 'textbook'
    category VARCHAR(50), -- 'Syllabus', 'Assignments', 'Exams', 'Lecture Notes', 'Lab & Practicals'
    subject_id UUID REFERENCES subjects(id),
    file_path VARCHAR(500),
    file_format VARCHAR(50),
    file_size_bytes BIGINT,
    content_version VARCHAR(100) NOT NULL DEFAULT '1',
    visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'organization', 'class', 'private'
    tags TEXT[],
    difficulty VARCHAR(50),
    reading_time_minutes INTEGER,
    curriculum_standards TEXT[],
    class_levels TEXT[],
    ai_summary JSONB,
    ai_classification JSONB,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    published_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_library_org ON library_resources(organization_id);
CREATE INDEX idx_library_subject ON library_resources(subject_id);
CREATE INDEX idx_library_type ON library_resources(resource_type);
CREATE INDEX idx_library_visibility ON library_resources(visibility);
CREATE INDEX idx_library_status ON library_resources(status);
CREATE INDEX idx_library_tags ON library_resources USING GIN(tags);

CREATE TABLE library_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

CREATE INDEX idx_bookmarks_user ON library_bookmarks(user_id);
CREATE INDEX idx_bookmarks_resource ON library_bookmarks(resource_id);

CREATE TABLE library_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE,
    section_id VARCHAR(255),
    content_version VARCHAR(100) NOT NULL,
    progress_percent DECIMAL(5,2),
    last_position TEXT,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

CREATE INDEX idx_progress_user ON library_progress(user_id);
CREATE INDEX idx_progress_resource ON library_progress(resource_id);

-- ============================================
-- SESSIONS & AUDIT TABLES
-- ============================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- SETTINGS & CONFIGURATION TABLES
-- ============================================

CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    value_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'object', 'array'
    category VARCHAR(100), -- 'general', 'academic', 'finance', 'communication'
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, key)
);

CREATE INDEX idx_settings_org ON organization_settings(organization_id);
CREATE INDEX idx_settings_category ON organization_settings(organization_id, category);
```

### 2.2 Critical Database Gaps

```typescript
❌ Missing Infrastructure:
1. No database migrations system (Knex, TypeORM migrations, Prisma)
2. No connection pooling configuration
3. No read replicas for scalability
4. No database backup strategy
5. No query performance monitoring
6. No slow query logging
7. No database-level encryption at rest
8. No database connection retry logic
9. No transaction isolation level configuration
10. No prepared statement usage (SQL injection risk)
```

---

## 3. Multi-Tenant Data Isolation

### 3.1 Current State: NO ISOLATION

```typescript
// Current demo code has NO tenant isolation
const DEMO_ACCOUNTS: Record<string, { password: string; user: Record<string, unknown> }> = {
  "admin@skuggle.demo": {
    // ❌ Hardcoded tenant - NO database query filtering
    tenant: { id: "t_01", name: "Regent Grammar School", code: "RGA" },
  },
};
```

### 3.2 Required Implementation

```typescript
// ✅ Required: Middleware for tenant context injection
export const tenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user; // From authentication middleware
  
  if (!user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  // Load organization for user
  const organization = await db.organizations.findOne({
    where: { id: user.organization_id }
  });

  if (!organization || organization.status !== 'active') {
    return res.status(403).json({ 
      message: "Organization access denied" 
    });
  }

  // Inject into request context
  req.tenant = {
    id: organization.id,
    name: organization.name,
    code: organization.code,
    type: organization.type
  };

  next();
};

// ✅ Required: Query-level tenant filtering
export const withTenant = (query: SelectQueryBuilder, alias: string) => {
  const tenantId = getCurrentTenantId(); // From request context
  return query.where(`${alias}.organization_id = :tenantId`, { tenantId });
};

// ✅ Usage example
const students = await db.students
  .createQueryBuilder('student')
  .where('student.organization_id = :tenantId', { 
    tenantId: req.tenant.id 
  })
  .andWhere('student.status = :status', { status: 'active' })
  .getMany();
```

### 3.3 Data Isolation Checklist

```typescript
Required Tenant Isolation Controls:

✅ Database Level:
- [ ] All organization-scoped tables have organization_id column
- [ ] All queries include organization_id WHERE clause
- [ ] Row-level security policies (PostgreSQL RLS)
- [ ] Database-level tenant user accounts (optional but recommended)
- [ ] Prevent cross-tenant foreign key references

✅ Application Level:
- [ ] Tenant context middleware on all protected routes
- [ ] ORM global scope/filters for tenant isolation
- [ ] Explicit tenant checks in all business logic
- [ ] Tenant validation before any database write
- [ ] Audit logging of cross-tenant access attempts

✅ API Level:
- [ ] Tenant header validation (X-Tenant-ID)
- [ ] Rate limiting per tenant
- [ ] Tenant-specific feature flags
- [ ] Tenant resource quotas

✅ Testing:
- [ ] Integration tests with multiple tenants
- [ ] Negative tests for cross-tenant data access
- [ ] Tenant data isolation test suite
```

---

## 4. Authentication & Authorization Gaps

### 4.1 Password Security

```typescript
// ❌ Current: Plain text password comparison
if (!account || account.password !== password) {
  return res.status(401).json({
    message: "These credentials do not match our records.",
  });
}

// ✅ Required: Proper password hashing
import bcrypt from 'bcrypt';

// Registration
const passwordHash = await bcrypt.hash(password, 12);
await db.users.create({
  email,
  password_hash: passwordHash,
  // ...other fields
});

// Login
const user = await db.users.findOne({ where: { email } });
const isValid = await bcrypt.compare(password, user.password_hash);

if (!isValid) {
  // Log failed attempt
  await auditLog.recordFailedLogin(email, req.ip);
  return res.status(401).json({
    message: "These credentials do not match our records."
  });
}
```

### 4.2 Missing Authorization Features

```typescript
Required Authorization Implementation:

❌ Missing:
1. Role-based access control (RBAC) database queries
2. Permission checking middleware
3. Resource-level authorization (student can only see own records)
4. Academic context scope checking (session/term filtering)
5. Permission caching (Redis)
6. Dynamic permission loading from database
7. Permission inheritance (class teacher → subject teacher)
8. Temporary permission grants
9. Permission audit trail
10. API key authentication for integrations

✅ Required Permission Middleware:
export const requirePermission = (permission: string, scope?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const tenantId = req.tenant.id;

    const hasPermission = await permissionService.check({
      userId: user.id,
      tenantId: tenantId,
      permission: permission,
      scopeType: scope,
      scopeId: req.params.id // For resource-level checks
    });

    if (!hasPermission) {
      return res.status(403).json({
        message: "You don't have permission to perform this action."
      });
    }

    next();
  };
};

// Usage:
app.get(
  '/students/:id',
  authenticate,
  tenantContext,
  requirePermission('students.view'),
  getStudent
);
```

---

## 5. API Contract & Validation Gaps

### 5.1 Missing Input Validation

```typescript
// ❌ Current: No validation on AI endpoints
app.post("/api/ai/lesson-plan", async (req, res) => {
  const { subject, className, topic, subtopic, duration, objectives } = req.body;
  // Direct usage without validation - SECURITY RISK
});

// ✅ Required: Request validation
import { body, param, query, validationResult } from 'express-validator';

const validateLessonPlanRequest = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 200 }).withMessage('Subject too long'),
  body('className')
    .trim()
    .notEmpty().withMessage('Class name is required')
    .matches(/^(JSS|SSS)\s*[1-3][A-Z]?$/i).withMessage('Invalid class name format'),
  body('topic')
    .trim()
    .notEmpty().withMessage('Topic is required')
    .isLength({ max: 500 }).withMessage('Topic too long'),
  body('duration')
    .optional()
    .isInt({ min: 10, max: 180 }).withMessage('Duration must be between 10-180 minutes'),
  body('objectives')
    .optional()
    .isLength({ max: 2000 }).withMessage('Objectives too long')
];

app.post(
  "/api/ai/lesson-plan",
  authenticate,
  tenantContext,
  requirePermission('curriculum.create'),
  validateLessonPlanRequest,
  handleValidationErrors,
  generateLessonPlanController
);

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.mapped()
    });
  }
  next();
};
```

### 5.2 Missing API Features

```typescript
Critical API Gaps:

❌ Missing:
1. Request validation middleware (express-validator)
2. Response serialization/transformers
3. API versioning (/api/v1, /api/v2)
4. Pagination standardization
5. Filtering/sorting query parameter handling
6. Request ID tracking (X-Request-ID)
7. Response time headers
8. API documentation (OpenAPI/Swagger)
9. Request/response logging
10. Error response standardization
11. CORS configuration
12. Content-Type validation
13. Request size limits per endpoint
14. Multipart form-data handling security
15. File upload validation (type, size, virus scan)
```

---

## 6. Performance & Scalability Issues

### 6.1 N+1 Query Problems (Potential)

```typescript
// ❌ Potential N+1 problem in future student queries
const students = await db.students.find({ 
  where: { organization_id: tenantId } 
});

// For each student, fetch guardian (N+1)
for (const student of students) {
  student.guardians = await db.guardians.find({ 
    where: { student_id: student.id } 
  });
}

// ✅ Required: Eager loading with joins
const students = await db.students
  .createQueryBuilder('student')
  .leftJoinAndSelect('student.guardians', 'guardian')
  .leftJoinAndSelect('student.enrollments', 'enrollment')
  .leftJoinAndSelect('enrollment.class', 'class')
  .where('student.organization_id = :tenantId', { tenantId })
  .andWhere('student.status = :status', { status: 'active' })
  .getMany();
```

### 6.2 Missing Caching Layer

```typescript
Required Caching Strategy:

❌ No cache implementation:
1. No Redis integration
2. No session caching
3. No permission caching
4. No query result caching
5. No rate limiting
6. No CDN for static assets

✅ Required Redis Implementation:

import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache frequently accessed data
export const getCachedUser = async (userId: string) => {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Load from database
  const user = await db.users.findOne({ where: { id: userId } });
  
  // Store in cache (5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(user));
  
  return user;
};

// Cache invalidation on update
export const updateUser = async (userId: string, data: Partial<User>) => {
  await db.users.update({ id: userId }, data);
  
  // Invalidate cache
  await redis.del(`user:${userId}`);
  await redis.del(`permissions:${userId}`);
};
```

### 6.3 Database Query Optimization Needed

```typescript
Performance Optimization Checklist:

❌ Missing:
1. Database indexes on foreign keys
2. Composite indexes for common queries
3. Query execution plan analysis
4. Slow query logging (>100ms threshold)
5. Connection pooling tuning
6. Read replicas for reporting queries
7. Materialized views for dashboards
8. Partial indexes for common filters
9. Query result pagination enforcement
10. Database query timeout configuration

✅ Required Index Strategy:

-- Performance-critical indexes
CREATE INDEX CONCURRENTLY idx_attendance_lookup 
ON attendance_records(organization_id, attendance_date, class_id);

CREATE INDEX CONCURRENTLY idx_scores_by_assessment_student 
ON assessment_scores(assessment_id, student_id) 
WHERE status = 'submitted';

CREATE INDEX CONCURRENTLY idx_library_search 
ON library_resources USING GIN(
  to_tsvector('english', title || ' ' || description)
);

CREATE INDEX CONCURRENTLY idx_audit_recent 
ON audit_logs(organization_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## 7. Data Consistency & Transactions

### 7.1 Missing Transaction Management

```typescript
// ❌ Current: No transaction handling for attendance/scores
// If server crashes mid-save, data can be inconsistent

// ✅ Required: Database transactions
export const saveAttendanceBatch = async (
  classId: string,
  date: string,
  records: AttendanceInput[],
  userId: string,
  tenantId: string
) => {
  // Start transaction
  const queryRunner = db.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Delete existing records for this date
    await queryRunner.manager.delete(AttendanceRecord, {
      class_id: classId,
      attendance_date: date,
      organization_id: tenantId
    });

    // Insert new records
    const entities = records.map(r => ({
      id: uuid(),
      organization_id: tenantId,
      student_id: r.studentId,
      class_id: classId,
      attendance_date: date,
      status: r.status,
      time_in: r.timeIn,
      notes: r.notes,
      recorded_by: userId,
      revision: generateRevision(),
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryRunner.manager.save(AttendanceRecord, entities);

    // Log audit trail
    await queryRunner.manager.save(AuditLog, {
      organization_id: tenantId,
      user_id: userId,
      action: 'attendance.batch_save',
      entity_type: 'attendance',
      entity_id: classId,
      changes: { date, count: records.length },
      ip_address: req.ip,
      created_at: new Date()
    });

    // Commit transaction
    await queryRunner.commitTransaction();

    return { success: true, count: records.length };
  } catch (error) {
    // Rollback on error
    await queryRunner.rollbackTransaction();
    throw new ApiError('Failed to save attendance records', error);
  } finally {
    // Release connection
    await queryRunner.release();
  }
};
```

### 7.2 Optimistic Locking Implementation Needed

```typescript
// ✅ Required: Handle revision conflicts for attendance/scores
export const updateAttendance = async (
  recordId: string,
  status: AttendanceStatus,
  revision: string,
  userId: string
) => {
  const record = await db.attendanceRecords.findOne({
    where: { id: recordId }
  });

  if (!record) {
    throw new NotFoundError('Attendance record not found');
  }

  // Check revision - prevent concurrent modification
  if (record.revision !== revision) {
    throw new ConflictError(
      'This record was modified by another user. Please refresh and try again.',
      { 
        currentRevision: record.revision,
        providedRevision: revision 
      }
    );
  }

  // Generate new revision
  const newRevision = `${Date.now()}-${userId}`;

  // Update with new revision
  await db.attendanceRecords.update(
    { id: recordId },
    {
      status,
      revision: newRevision,
      updated_at: new Date()
    }
  );

  return { revision: newRevision };
};
```

---

## 8. Background Jobs & Queue System (MISSING)

```typescript
Required Background Job Infrastructure:

❌ Missing Features:
1. Job queue system (Bull/BullMQ)
2. Scheduled jobs (cron)
3. Long-running tasks (report generation)
4. Email sending queue
5. SMS notification queue
6. AI processing queue
7. File processing queue
8. Failed job retry logic
9. Job monitoring dashboard
10. Dead letter queue

✅ Required Implementation:

import Bull from 'bull';

// Create queues
export const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  }
});

export const reportQueue = new Bull('reports', {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
});

// Process jobs
emailQueue.process(async (job) => {
  const { to, subject, body, templateId } = job.data;
  
  await emailService.send({
    to,
    subject,
    body,
    templateId
  });

  return { sent: true };
});

reportQueue.process(async (job) => {
  const { reportType, filters, userId, tenantId } = job.data;
  
  // Generate report (may take 30+ seconds)
  const reportData = await reportService.generate(
    reportType,
    filters,
    tenantId
  );
  
  // Save to file storage
  const fileUrl = await storageService.upload(
    `reports/${reportType}-${Date.now()}.pdf`,
    reportData
  );
  
  // Notify user
  await notificationService.send(userId, {
    type: 'report_ready',
    fileUrl
  });

  return { fileUrl };
});

// Add job from API
app.post('/reports/generate', authenticate, async (req, res) => {
  const job = await reportQueue.add({
    reportType: req.body.reportType,
    filters: req.body.filters,
    userId: req.user.id,
    tenantId: req.tenant.id
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  res.json({ 
    message: 'Report generation started',
    jobId: job.id 
  });
});
```

---

## 9. Security Vulnerabilities

### 9.1 Critical Security Issues

```typescript
Security Audit Findings:

❌ CRITICAL:
1. No password hashing (plain text comparison)
2. No rate limiting (brute force vulnerability)
3. No input sanitization (XSS/SQL injection risk)
4. No file upload validation
5. No CORS configuration
6. No Content Security Policy
7. No X-Frame-Options header
8. Secrets in code (GEMINI_API_KEY)
9. No request size limits
10. No SQL injection prevention (no parameterized queries yet)

❌ HIGH:
1. In-memory session storage (session hijacking)
2. No session expiry enforcement
3. No password complexity requirements
4. No account lockout after failed attempts
5. No email verification
6. No 2FA support
7. No password reset flow
8. No secure cookie flags
9. No HTTPS enforcement
10. No audit logging

✅ Required Security Headers:

import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));

// Rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/auth/login', authLimiter, loginController);

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
});

app.use('/api/', apiLimiter);
```

### 9.2 Data Privacy & Compliance

```typescript
Privacy & Compliance Gaps:

❌ Missing:
1. GDPR compliance features
2. Data retention policies
3. Right to erasure implementation
4. Data export functionality
5. Consent management
6. Privacy policy enforcement
7. Data minimization strategy
8. Encryption at rest
9. Encryption in transit (HTTPS enforcement)
10. PII handling documentation

✅ Required: Data Encryption

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text: string): string => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Store encrypted sensitive data
const saveSensitiveData = async (userId: string, data: string) => {
  const encrypted = encrypt(data);
  
  await db.settings.upsert({
    user_id: userId,
    key: 'sensitive_info',
    value: encrypted,
    is_encrypted: true
  });
};
```

---

## 10. Monitoring & Observability (MISSING)

```typescript
Required Monitoring Infrastructure:

❌ Missing:
1. Application Performance Monitoring (APM)
2. Error tracking (Sentry)
3. Structured logging (Winston/Pino)
4. Metrics collection (Prometheus)
5. Distributed tracing
6. Database query performance monitoring
7. API latency tracking
8. Error rate alerts
9. Uptime monitoring
10. Log aggregation (ELK stack)

✅ Required: Structured Logging

import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'skuggle-api',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Usage in code
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  tenantId: tenant.id,
  ip: req.ip
});

logger.error('Database query failed', {
  error: error.message,
  stack: error.stack,
  query: 'SELECT * FROM students',
  tenantId: tenant.id
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      tenantId: req.tenant?.id
    });
  });
  
  next();
});
```

---

## 11. Production Deployment Checklist

### 11.1 Infrastructure Requirements

```yaml
Required Production Infrastructure:

❌ Not Configured:

Database:
- [ ] PostgreSQL 15+ cluster with replication
- [ ] Automated daily backups with point-in-time recovery
- [ ] Read replicas for reporting queries
- [ ] Connection pooling (PgBouncer)
- [ ] Database monitoring and alerts
- [ ] Disaster recovery plan

Cache & Queue:
- [ ] Redis cluster (HA with Sentinel/Cluster)
- [ ] Redis persistence configuration (AOF)
- [ ] Redis memory limits and eviction policy
- [ ] Separate Redis instances for cache vs. queues

Application:
- [ ] Load balancer (Nginx/AWS ALB)
- [ ] Auto-scaling group (min 2 instances)
- [ ] Health check endpoints
- [ ] Graceful shutdown handling
- [ ] Process manager (PM2)
- [ ] Container orchestration (Docker + Kubernetes)

Storage:
- [ ] Object storage for files (S3/GCS)
- [ ] CDN for static assets
- [ ] Media processing pipeline
- [ ] File upload virus scanning

Security:
- [ ] SSL/TLS certificates (Let's Encrypt)
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection (Cloudflare)
- [ ] VPC with private subnets
- [ ] Bastion host for DB access
- [ ] Secrets manager (AWS Secrets Manager/HashiCorp Vault)

Monitoring:
- [ ] APM tool (New Relic/DataDog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK/CloudWatch)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] PagerDuty for on-call alerts
```

### 11.2 Environment Configuration

```bash
# ✅ Required Production Environment Variables

# Database
DATABASE_URL=postgresql://user:pass@host:5432/skuggle_production?sslmode=require
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=10000

# Redis
REDIS_HOST=redis-cluster.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-redis-password>
REDIS_TLS=true
REDIS_DB_SESSION=0
REDIS_DB_CACHE=1
REDIS_DB_QUEUE=2

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://app.skuggle.com
API_VERSION=v1
LOG_LEVEL=info

# Security
SESSION_SECRET=<64-character-random-string>
ENCRYPTION_KEY=<64-character-hex-key>
JWT_SECRET=<64-character-random-string>
CSRF_SECRET=<64-character-random-string>
CORS_ORIGIN=https://app.skuggle.com,https://admin.skuggle.com

# Authentication
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_SPECIAL=true
SESSION_LIFETIME_HOURS=24
SESSION_IDLE_TIMEOUT_MINUTES=60
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# AI Services
GEMINI_API_KEY=<gemini-api-key>
GEMINI_TIMEOUT_MS=30000
AI_FALLBACK_ENABLED=false

# Storage
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_REGION=us-east-1
S3_BUCKET=skuggle-production
S3_CDN_URL=https://cdn.skuggle.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@skuggle.com

# SMS
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
TWILIO_FROM_NUMBER=+1234567890

# Monitoring
SENTRY_DSN=https://key@sentry.io/project
NEW_RELIC_LICENSE_KEY=<newrelic-key>
NEW_RELIC_APP_NAME=Skuggle Production API

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_AUDIT_LOGGING=true
```

---

## 12. Laravel Backend Migration Plan

### 12.1 Why Laravel?

The steering rule and product documentation reference Laravel as the expected backend framework. Benefits:

```typescript
Laravel Backend Advantages:

✅ Built-in Features:
1. Eloquent ORM with relationship management
2. Database migrations and seeders
3. Authentication scaffolding (Sanctum/Passport)
4. Authorization policies and gates
5. Queue system (Redis, database, SQS)
6. Task scheduling (cron alternative)
7. Event system
8. File storage abstraction
9. Email templating and queues
10. Comprehensive testing tools

✅ Multi-Tenancy Support:
- Laravel Tenancy packages (Hyn, Stancl)
- Database-per-tenant or shared database strategies
- Automatic tenant context resolution

✅ API Development:
- RESTful resource controllers
- API resource transformers
- Form request validation
- Rate limiting middleware
- API versioning support
```

### 12.2 Laravel Implementation Roadmap

```php
Phase 1: Core Infrastructure (2-3 weeks)

Week 1: Database & Migrations
- [ ] Set up Laravel 11 project
- [ ] Create database migrations for all tables (see Section 2.1)
- [ ] Define Eloquent models with relationships
- [ ] Implement model factories and seeders
- [ ] Set up multi-tenancy (Laravel Tenancy package)

Week 2: Authentication & Authorization
- [ ] Install Laravel Sanctum for API authentication
- [ ] Create authentication controllers (login, logout, register)
- [ ] Implement permission system (Spatie Permission package)
- [ ] Create authorization policies for all resources
- [ ] Add role-based middleware

Week 3: API Foundation
- [ ] Create API resource controllers
- [ ] Implement form request validation classes
- [ ] Build API resource transformers
- [ ] Set up API versioning (v1)
- [ ] Add error handling and exception rendering
- [ ] Configure CORS middleware

---

Phase 2: Core Features (3-4 weeks)

Week 4: Student Management
- [ ] Student CRUD endpoints
- [ ] Guardian management
- [ ] Enrollment endpoints
- [ ] Student search and filtering
- [ ] Student profile endpoints
- [ ] Photo upload and storage

Week 5: Attendance & Assessments
- [ ] Attendance endpoints with draft/sync
- [ ] Optimistic locking implementation
- [ ] Assessment CRUD endpoints
- [ ] Score entry with revision control
- [ ] Bulk attendance operations

Week 6: Library & Resources
- [ ] Library resource endpoints
- [ ] File upload handling
- [ ] Bookmark and progress tracking
- [ ] AI integration for categorization
- [ ] Resource search with Elasticsearch/Meilisearch

Week 7: Reports & Dashboards
- [ ] Dashboard aggregation queries
- [ ] Report generation jobs
- [ ] Download endpoints
- [ ] Analytics queries optimization

---

Phase 3: Advanced Features (2-3 weeks)

Week 8: Background Jobs
- [ ] Email notification jobs
- [ ] SMS notification jobs
- [ ] Report generation queue
- [ ] AI processing queue
- [ ] Failed job handling

Week 9: Performance & Caching
- [ ] Redis cache integration
- [ ] Query optimization
- [ ] Database indexes
- [ ] Eager loading strategies
- [ ] API response caching

Week 10: Security & Compliance
- [ ] Audit logging implementation
- [ ] Data encryption helpers
- [ ] GDPR compliance features
- [ ] Rate limiting per tenant
- [ ] Security headers middleware

---

Phase 4: Testing & Deployment (2 weeks)

Week 11: Testing
- [ ] Feature tests for all endpoints
- [ ] Unit tests for business logic
- [ ] Integration tests with database
- [ ] API contract tests
- [ ] Load testing with Apache Bench

Week 12: Production Setup
- [ ] Production server configuration
- [ ] Database backup automation
- [ ] Monitoring setup (Laravel Telescope, Horizon)
- [ ] Deployment pipeline (CI/CD)
- [ ] Production smoke tests

Total: 10-12 weeks
```

### 12.3 Laravel Settings API Pattern Implementation

Based on the steering rule provided, here's the correct implementation:

```php
// app/Http/Requests/UpdateOrganizationSettingsRequest.php
class UpdateOrganizationSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // Nested structure to match dot-notation keys
            'settings.payroll.paye_enabled' => 'sometimes|boolean',
            'settings.payroll.pension_enabled' => 'sometimes|boolean',
            'settings.payroll.tax_rate' => 'sometimes|numeric|min:0|max:100',
            'settings.academic.grading_system' => 'sometimes|string|in:percentage,letter',
            'settings.academic.pass_mark' => 'sometimes|integer|min:0|max:100',
            'settings.communication.sms_enabled' => 'sometimes|boolean',
            'settings.communication.email_enabled' => 'sometimes|boolean',
        ];
    }
}

// app/Http/Controllers/OrganizationSettingsController.php
class OrganizationSettingsController extends Controller
{
    public function update(UpdateOrganizationSettingsRequest $request)
    {
        $validated = $request->validated();
        
        // ✅ CRITICAL: Flatten nested array to dot-notation
        $flatSettings = Arr::dot($validated['settings']);
        
        foreach ($flatSettings as $key => $value) {
            OrganizationSetting::updateOrCreate(
                [
                    'organization_id' => auth()->user()->organization_id,
                    'key' => $key
                ],
                [
                    'value' => $value,
                    'updated_by' => auth()->id()
                ]
            );
        }
        
        return response()->json([
            'message' => 'Settings updated successfully'
        ]);
    }
}

// Frontend: Convert flat keys to nested before posting
const saveSettings = async (settings: Record<string, any>) => {
  const nested: Record<string, any> = {};
  
  for (const [flatKey, value] of Object.entries(settings)) {
    const parts = flatKey.split('.');
    let cur = nested;
    
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {};
      cur = cur[parts[i]];
    }
    
    cur[parts[parts.length - 1]] = value;
  }
  
  return await apiClient.post('/settings', { settings: nested });
};
```

---

## 13. Database Migration Strategy

```sql
-- Migration Strategy for Production Launch

-- Phase 1: Core Tables (Week 1)
migrations/
├── 2026_08_22_000001_create_organizations_table.php
├── 2026_08_22_000002_create_users_table.php
├── 2026_08_22_000003_create_permissions_table.php
├── 2026_08_22_000004_create_academic_sessions_table.php
├── 2026_08_22_000005_create_terms_table.php
├── 2026_08_22_000006_create_classes_table.php
└── 2026_08_22_000007_create_subjects_table.php

-- Phase 2: Student Management (Week 2)
migrations/
├── 2026_08_29_000001_create_students_table.php
├── 2026_08_29_000002_create_guardians_table.php
└── 2026_08_29_000003_create_enrollments_table.php

-- Phase 3: Academic Operations (Week 3)
migrations/
├── 2026_09_05_000001_create_attendance_records_table.php
├── 2026_09_05_000002_create_assessments_table.php
└── 2026_09_05_000003_create_assessment_scores_table.php

-- Phase 4: Library & Resources (Week 4)
migrations/
├── 2026_09_12_000001_create_library_resources_table.php
├── 2026_09_12_000002_create_library_bookmarks_table.php
├── 2026_09_12_000003_create_library_progress_table.php
└── 2026_09_12_000004_create_library_annotations_table.php

-- Phase 5: System Tables (Week 5)
migrations/
├── 2026_09_19_000001_create_user_sessions_table.php
├── 2026_09_19_000002_create_audit_logs_table.php
├── 2026_09_19_000003_create_organization_settings_table.php
└── 2026_09_19_000004_create_jobs_table.php

-- Performance Indexes (Week 6)
migrations/
├── 2026_09_26_000001_add_performance_indexes.php
└── 2026_09_26_000002_add_full_text_search_indexes.php
```

---

## 14. API Contract Documentation Needed

```yaml
Required API Documentation:

❌ Missing:
1. OpenAPI 3.0 specification file
2. Postman collection
3. API versioning strategy
4. Request/response examples
5. Error code reference
6. Rate limit documentation
7. Authentication flow documentation
8. Webhook documentation
9. API changelog
10. SDKs for common languages

✅ Sample OpenAPI Spec Structure:

openapi: 3.0.0
info:
  title: Skuggle API
  version: 1.0.0
  description: School Operating and Learning Intelligence Platform API

servers:
  - url: https://api.skuggle.com/v1
    description: Production
  - url: https://staging-api.skuggle.com/v1
    description: Staging

security:
  - sanctumAuth: []

paths:
  /auth/login:
    post:
      summary: Authenticate user
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  format: password
      responses:
        200:
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionResponse'
        401:
          $ref: '#/components/responses/Unauthorized'
        422:
          $ref: '#/components/responses/ValidationError'

  /students:
    get:
      summary: List students
      tags: [Students]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
        - name: per_page
          in: query
          schema:
            type: integer
            minimum: 10
            maximum: 100
        - name: class_id
          in: query
          schema:
            type: string
            format: uuid
      responses:
        200:
          description: Student list
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Student'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

components:
  securitySchemes:
    sanctumAuth:
      type: http
      scheme: bearer
      
  schemas:
    Student:
      type: object
      properties:
        id:
          type: string
          format: uuid
        admission_number:
          type: string
        first_name:
          type: string
        last_name:
          type: string
        # ... other fields

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: string
```

---

## 15. Performance Benchmarks & SLAs

### 15.1 Required Performance Targets

```yaml
Production Performance SLA Targets:

API Response Times (95th percentile):
- Simple queries (list students): < 200ms
- Complex queries (dashboard): < 500ms
- AI operations (lesson plan): < 5s
- Report generation: < 30s (async)
- File uploads: < 2s per MB
- Database queries: < 100ms

Throughput:
- Concurrent users per server: 500+
- Requests per second: 1000+
- Concurrent database connections: 100+

Availability:
- Uptime SLA: 99.9% (43 minutes downtime/month)
- Database replication lag: < 1s
- Failover time: < 30s

Scalability:
- Support 1000 organizations
- Support 500,000 students
- Support 50,000 concurrent users (peak)
- Database size: 500GB+
```

### 15.2 Load Testing Requirements

```typescript
Required Load Tests:

1. Authentication Load Test
   - Scenario: 100 concurrent users logging in
   - Success rate: > 99%
   - Response time p95: < 500ms

2. Student List Load Test
   - Scenario: 500 teachers fetching student lists
   - Success rate: > 99.5%
   - Response time p95: < 300ms

3. Attendance Save Load Test
   - Scenario: 200 teachers saving attendance (30 students each)
   - Success rate: > 99.9%
   - Response time p95: < 1s

4. Dashboard Load Test
   - Scenario: 1000 users loading dashboards
   - Success rate: > 99%
   - Response time p95: < 800ms

5. Spike Test
   - Scenario: Traffic doubles in 1 minute
   - Auto-scaling response: < 2 minutes
   - No request failures during scale-up

6. Endurance Test
   - Scenario: Sustained load for 24 hours
   - Memory leak check: < 10% memory growth
   - Response time degradation: < 5%
```

---

## 16. Production Readiness Scorecard

```yaml
Backend Production Readiness Assessment:

Category: Database Architecture
Status: ❌ NOT READY
Score: 0/100
Blockers:
  - No database implementation
  - No schema design
  - No migrations
  - No connection pooling
  - No backup strategy

Category: Authentication & Authorization
Status: ❌ NOT READY
Score: 5/100
Present:
  - Basic session concept
Blockers:
  - No password hashing
  - No database-backed sessions
  - No permission system
  - No multi-tenant isolation

Category: API Implementation
Status: ❌ NOT READY
Score: 10/100
Present:
  - Express framework
  - Some AI endpoints
Blockers:
  - No validation
  - No rate limiting
  - No versioning
  - Missing 95% of required endpoints

Category: Security
Status: ❌ NOT READY
Score: 15/100
Present:
  - CSRF token concept
  - Cookie-based sessions
Blockers:
  - No input sanitization
  - No rate limiting
  - No security headers
  - Hardcoded credentials

Category: Performance & Scalability
Status: ❌ NOT READY
Score: 0/100
Blockers:
  - No caching layer
  - No query optimization
  - No horizontal scaling support
  - No performance monitoring

Category: Data Consistency
Status: ❌ NOT READY
Score: 0/100
Blockers:
  - No transaction management
  - No optimistic locking
  - No data validation
  - No audit trail

Category: Monitoring & Observability
Status: ❌ NOT READY
Score: 5/100
Present:
  - Console logging
  - Health check endpoint
Blockers:
  - No structured logging
  - No error tracking
  - No APM
  - No alerting

Category: Background Jobs
Status: ❌ NOT READY
Score: 0/100
Blockers:
  - No queue system
  - No job processing
  - No scheduled tasks
  - No failed job handling

---

OVERALL PRODUCTION READINESS: 4/100 (NOT READY)

Critical Path to Production:
1. Implement database layer (4 weeks)
2. Build Laravel backend API (8 weeks)
3. Add security layers (2 weeks)
4. Implement caching & performance optimizations (2 weeks)
5. Add monitoring & observability (1 week)
6. Load testing & optimization (2 weeks)
7. Security audit & penetration testing (1 week)
8. Production deployment (1 week)

Estimated Time to Production Ready: 20-24 weeks
```

---

## 17. Immediate Action Items (Priority Order)

### Week 1: Critical Foundation
1. ✅ Set up Laravel 11 project
2. ✅ Configure PostgreSQL database
3. ✅ Create all database migrations
4. ✅ Set up Redis for sessions and cache
5. ✅ Implement authentication with Sanctum
6. ✅ Add password hashing (bcrypt)
7. ✅ Configure multi-tenancy package

### Week 2: Core Security
1. ✅ Implement rate limiting
2. ✅ Add input validation for all endpoints
3. ✅ Configure security headers (Helmet)
4. ✅ Set up CORS properly
5. ✅ Add request logging
6. ✅ Configure HTTPS enforcement

### Week 3-4: API Endpoints
1. ✅ Implement student management endpoints
2. ✅ Implement attendance endpoints
3. ✅ Implement assessment endpoints
4. ✅ Implement library endpoints
5. ✅ Add proper error handling

### Week 5-6: Performance
1. ✅ Add database indexes
2. ✅ Implement query caching
3. ✅ Set up background job queues
4. ✅ Optimize AI endpoint performance
5. ✅ Add response compression

### Week 7-8: Monitoring & Testing
1. ✅ Integrate error tracking (Sentry)
2. ✅ Add structured logging
3. ✅ Write feature tests
4. ✅ Perform load testing
5. ✅ Security audit

---

## Conclusion

**The Skuggle application is NOT production-ready from a backend perspective.** The current Express server is explicitly a development/demo server with:

- ❌ No persistent database
- ❌ No production authentication
- ❌ No multi-tenant data isolation
- ❌ No production security measures
- ❌ No scalability infrastructure

**Estimated effort to production readiness: 20-24 weeks** of dedicated backend development, including:
- Laravel backend implementation
- Database design and optimization
- Security hardening
- Performance optimization
- Comprehensive testing

**Recommendation:** Prioritize backend implementation using Laravel following the roadmap in Section 12.2 before considering production deployment.

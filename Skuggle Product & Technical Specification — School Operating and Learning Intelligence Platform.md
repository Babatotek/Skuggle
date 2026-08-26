# SKUGGLE PRODUCT & TECHNICAL SPECIFICATION

## School Operating and Learning Intelligence Platform

**Product Name:** Skuggle  
**Product Type:** Multi-Tenant School Operating & Learning Intelligence Platform  
**Specification Version:** 1.0  
**Target Market:** Nigerian Private Nursery, Primary and Secondary Schools  
**Deployment Model:** Multi-Tenant SaaS  
**Primary Platforms:** Responsive Web Application + Progressive Web App  
**Frontend:** React + TypeScript  
**Backend:** Laravel  
**Database:** MySQL  
**Performance Layer:** Redis  
**Development Environment:** XAMPP / Windows  
**Initial Production Target:** Hostinger  
**Document Purpose:** Product, Architecture and Implementation Baseline

---

# 1. EXECUTIVE SUMMARY

Skuggle shall evolve from its current Student Records Management MVP into a modular **School Operating and Learning Intelligence Platform**.

The current application already establishes an important foundation:

- school tenant registration;
- student records;
- student photograph capture;
- student photograph upload;
- academic sessions;
- classes;
- class arms;
- student search;
- reporting;
- PDF export;
- spreadsheet export;
- school branding;
- PWA architecture.

The upgraded platform shall preserve these capabilities while progressively introducing:

- campus management;
- academic terms;
- school levels;
- subjects;
- guardians;
- staff;
- teachers;
- role-based access;
- attendance;
- assessment management;
- result processing;
- report cards;
- parent access;
- fees;
- result PINs;
- performance monitoring;
- intelligent paper-based assessment;
- teacher curriculum assistance;
- AI-assisted lesson preparation.

Skuggle shall not become a traditional cluttered ERP.

It shall provide **role-specific, simple and responsive experiences** to school proprietors, administrators, teachers, parents and students.

The underlying PRD explicitly requires a clean, modern, responsive, mobile-first and role-aware interface rather than a system exposing every module to every user.

---

# 2. PRODUCT VISION

> **To become the intelligent digital operating infrastructure through which schools manage students, teaching, assessment, academic performance, parents and core school operations from one trusted source of truth.**

Skuggle shall progress from answering:

> Where is this student's record?

to answering:

> How is this student performing?

> Why is this student declining?

> Which class requires academic intervention?

> Which assessments remain unmarked?

> Which parts of the curriculum are behind schedule?

> Which parents need information or action?

The source PRD specifically positions the mature platform as one that coordinates school operations, connects stakeholders and transforms institutional information into decisions.

---

# 3. PRODUCT POSITIONING

## Primary Positioning

**Skuggle — Run Your School Smarter.**

## Extended Positioning

**Skuggle is a smart school operating and learning intelligence platform that connects student records, teaching, assessment, performance monitoring and parent engagement in one secure, low-bandwidth-friendly system.**

---

# 4. PRODUCT PRINCIPLES

Skuggle shall follow these principles.

### 4.1 Simple, Not ERP-Like

Users shall see only features relevant to their responsibilities.

### 4.2 Mobile First

The application shall be fully usable from Android smartphones as well as tablets, laptops and desktop computers.

### 4.3 Configuration Over Hardcoding

Schools differ in:

- classes;
- terms;
- grading;
- assessment structures;
- subjects;
- fees;
- workflows;
- curriculum structures.

These shall therefore be configurable.

### 4.4 Offline Tolerance

Selected workflows shall continue operating during intermittent connectivity and synchronise when connectivity returns.

The PRD explicitly requires offline-capable workflows and conflict protection to prevent older offline changes from silently overwriting newer server records.

### 4.5 Single Source of Truth

Student information shall not require repeated entry into unrelated modules.

### 4.6 Human-Controlled AI

AI may:

- recommend;
- draft;
- analyse;
- classify;
- assist.

AI shall not independently publish examinations, change final grades or make high-impact academic decisions.

### 4.7 Privacy by Design

Student and guardian information must be protected throughout the architecture.

### 4.8 Auditability

Critical operations must identify:

- actor;
- action;
- affected record;
- date/time;
- old value where required;
- new value where required.

---

# 5. PRODUCT RELEASE STRUCTURE

Skuggle shall be developed in progressive capability stages.

## Stage 1 — Skuggle Core 2.0

Foundation and essential school operations.

## Stage 2 — Skuggle Academic

Teaching, attendance, assessment, results, fees and parent access.

## Stage 3 — Skuggle Intelligence

SmartMark, performance intelligence and teacher AI.

## Stage 4 — Skuggle Extend

Optional advanced operational modules.

This modular structure follows the source recommendation that extended areas such as payroll, hostel, transport, sophisticated accounting, procurement and full LMS functionality remain independently deployable rather than overwhelming the core.

---

# 6. STAGE 1 — SKUGGLE CORE 2.0

## 6.1 Tenant Management

Each registered school shall operate as an isolated tenant.

Required hierarchy:

**Platform**

→ School Organisation

→ Campus

→ Academic Session

→ Term

→ School Level

→ Class

→ Class Arm

→ Student

A tenant shall never access another tenant's information.

---

# 7. SCHOOL SETUP

School administrators shall configure:

- school name;
- school code;
- logo;
- address;
- email;
- telephone;
- school colours;
- campuses;
- school levels;
- academic sessions;
- terms;
- classes;
- class arms;
- subjects;
- assessment structure;
- grading structure.

School branding shall automatically apply to relevant:

- dashboards;
- PDF documents;
- report cards;
- result checker;
- receipts;
- exported reports.

---

# 8. GUIDED ONBOARDING

A new school shall receive a guided setup process.

### Step 1
Create School

### Step 2
Create Campus

### Step 3
Create Academic Session

### Step 4
Create Terms

### Step 5
Configure School Levels

### Step 6
Configure Classes and Arms

### Step 7
Configure Subjects

### Step 8
Configure Assessment Structure

### Step 9
Import/Register Students

### Step 10
Invite Staff

The source PRD recommends a guided implementation-style onboarding experience rather than leaving administrators to discover configuration screens independently.

---

# 9. STUDENT INFORMATION SYSTEM

The existing Skuggle Student Records capability becomes the authoritative Student Information System.

Each student shall have one persistent record.

## Personal Information

- admission number;
- first name;
- middle name;
- surname;
- gender;
- date of birth;
- photograph;
- nationality;
- state of origin;
- LGA where configured;
- student contact details where applicable;
- admission date;
- current class;
- current status.

## Student Photo

Users may:

- capture photo with webcam;
- capture using smartphone camera;
- upload existing image;
- retake image;
- crop/standardise image.

Images should be optimised before upload.

---

# 10. STUDENT STATUS

Supported statuses should include:

- Applicant;
- Active;
- Suspended;
- Withdrawn;
- Transferred;
- Graduated;
- Alumni;
- Archived.

Changing status must not destroy historical information.

---

# 11. GUARDIAN MANAGEMENT

A student may have multiple guardians.

Guardian information may include:

- full name;
- relationship;
- telephone;
- email;
- occupation;
- residential address;
- preferred contact;
- billing responsibility;
- authorised pickup permission.

A guardian may be connected to multiple students.

Example:

**Parent Account**

→ Child A

→ Child B

→ Child C

The user shall not create separate parent accounts for each child.

---

# 12. ACADEMIC SESSION MANAGEMENT

Administrators shall be able to:

- create academic sessions;
- activate one session;
- close previous sessions;
- create terms;
- open/close terms;
- enrol students;
- promote students;
- repeat students;
- transfer students;
- graduate students.

Promotion must never overwrite previous academic records.

---

# 13. BULK DATA IMPORT

Skuggle shall support structured spreadsheet import.

Initial import types:

- students;
- guardians;
- classes;
- staff;
- subjects.

Workflow:

**Download Template**

→ Upload

→ Validate

→ Display Errors

→ Preview Valid Records

→ Confirm

→ Import

Invalid records must never silently enter production.

The PRD explicitly requires template download, validation, preview, confirmation and error reporting during migration.

---

# 14. USERS AND ROLE-BASED ACCESS

Initial roles:

- Platform Super Administrator;
- School Proprietor;
- School Administrator;
- Principal/Head Teacher;
- Teacher;
- Class Teacher;
- Examination Officer;
- Admission Officer;
- Bursar;
- Parent;
- Student.

Permissions shall support:

- view;
- create;
- edit;
- archive/delete;
- approve;
- publish;
- export;
- configure.

Permissions shall always respect:

**Tenant + Campus + Role + Resource**

---

# 15. STAGE 2 — SKUGGLE ACADEMIC

Skuggle Academic shall introduce the essential operating workflows that turn Student Records into a school platform.

---

# 16. SUBJECT MANAGEMENT

Administrators shall configure subjects by:

- school level;
- class;
- session;
- department where applicable.

Subjects shall not be permanently hardcoded.

---

# 17. TEACHER ASSIGNMENT

Teachers may be assigned to:

- campus;
- class;
- subject;
- academic session;
- term.

Example:

**Mr Adewale**

→ JSS 2

→ Mathematics

→ 2026/2027

→ First Term

---

# 18. ATTENDANCE

Initial attendance shall prioritise simplicity.

Teacher opens:

**My Classes → JSS 2A → Take Attendance**

Supported statuses:

- Present;
- Absent;
- Late;
- Excused;
- Sick.

Attendance must work offline where configured and synchronise later.

Advanced biometric attendance shall remain outside the immediate core.

---

# 19. ASSESSMENT CONFIGURATION

Schools shall define their own assessment structures.

Example:

| Assessment | Weight |
|---|---:|
| CA 1 | 10% |
| CA 2 | 10% |
| Assignment | 10% |
| Project | 10% |
| Examination | 60% |

No percentage shall be permanently hardcoded.

The enhancement PRD explicitly requires assessment categories and weights to remain configurable.

---

# 20. SCORE ENTRY

Teachers shall enter scores based on:

- class;
- subject;
- assessment;
- student.

Functions:

- individual score entry;
- bulk score entry;
- spreadsheet score import;
- missing score detection;
- validation;
- draft saving;
- score submission.

---

# 21. RESULT WORKFLOW

Recommended workflow:

**Teacher**

→ Enter Scores

→ Submit Subject Result

→ Examination Officer Review

→ Principal Approval

→ Lock Result

→ Publish Result

→ Parent/Student Access

Published results shall not be modified silently.

Any reopening must:

- require permission;
- require a reason;
- create an audit trail.

---

# 22. REPORT CARDS

Report cards shall support:

- school logo;
- student photo;
- session;
- term;
- subjects;
- CA scores;
- examination score;
- total;
- grade;
- class average;
- position where enabled;
- behavioural assessment;
- attendance;
- class teacher remarks;
- principal remarks;
- next-term information.

Output:

- online;
- PDF;
- printable.

---

# 23. RESULT PIN SYSTEM

Skuggle shall provide optional result PIN access.

Administrators shall generate PINs by:

- session;
- term;
- campus;
- class;
- student;
- batch.

PINs shall be:

- unpredictable;
- securely generated;
- unique;
- auditable;
- protected from enumeration.

The PRD requires PINs to support configurable use rules and association with a student, session and term.

---

# 24. PUBLIC RESULT CHECKER

Each enabled school may receive a branded result-checking page.

Example:

## Royal Gateway Academy

### Check Your Result

Admission Number

Academic Session

Term

Result PIN

**Check Result**

The page must implement:

- rate limiting;
- attempt controls;
- privacy-safe responses;
- tenant branding;
- secure PIN validation.

The application must not reveal another student's existence through error messages.

---

# 25. PARENT PORTAL

Parent interface shall deliberately remain simple.

Primary navigation:

**Home | Child | Academics | Payments | Messages**

Parent Home may show:

- child summary;
- recent attendance;
- recent assessments;
- current average;
- performance trend;
- outstanding fees;
- latest announcements.

---

# 26. BASIC FEE MANAGEMENT

Initial finance capabilities shall include:

- fee configuration;
- student invoice;
- instalments;
- discounts;
- scholarships/waivers where authorised;
- manual payment recording;
- online payment adapter architecture;
- outstanding balance;
- receipts;
- transaction history.

Advanced general accounting is not part of this release.

---

# 27. PRODUCTION MVP DEFINITION OF DONE

A production-grade core workflow shall allow:

**School Registration**

→ Configure School

→ Configure Session

→ Configure Classes/Subjects

→ Import/Register Students

→ Create Staff

→ Assign Teacher

→ Record Attendance

→ Configure Assessment

→ Enter Scores

→ Approve Results

→ Publish Results

→ Parent Access

→ Generate Report Card

→ Process Fees

→ Promote Student

→ Preserve Historical Records

The source PRD explicitly defines a similar end-to-end journey as the minimum standard before the product should be considered production-ready.

---

# 28. STAGE 3 — SKUGGLE INTELLIGENCE

Skuggle Intelligence shall contain the principal product differentiators.

Three major capabilities:

1. Skuggle SmartMark
2. Student Performance Intelligence
3. Skuggle Teacher AI

---

# 29. SKUGGLE SMARTMARK

## Purpose

Enable schools without expensive CBT infrastructure to benefit from digital assessment.

Workflow:

**Teacher Creates Assessment**

→ Generate Printable Examination

→ Generate Machine-Readable Answer Sheet

→ Print

→ Students Write Physically

→ Teacher Scans Answers

→ Skuggle Reads Answers

→ Auto-Marks Objective Questions

→ Flags Uncertain Responses

→ Teacher Reviews

→ Approves Scores

→ Scores Update Student Record

The enhancement PRD identifies this paper-to-digital workflow as a core differentiator for Nigerian schools.

---

# 30. QUESTION CREATION

Teachers shall create questions manually or through AI assistance.

Supported question formats may include:

- multiple choice;
- true/false;
- matching;
- fill-in-the-gap;
- short answer;
- theory;
- calculations;
- structured questions.

Each question may store:

- answer;
- acceptable alternatives;
- marks;
- topic;
- learning objective;
- curriculum reference;
- difficulty.

---

# 31. QUESTION BANK

Questions shall be reusable and searchable by:

- curriculum;
- subject;
- class;
- topic;
- term;
- learning objective;
- difficulty;
- question type;
- teacher;
- session.

---

# 32. PRINTABLE EXAMINATION ENGINE

Generated examinations shall support:

- school logo;
- school name;
- class;
- subject;
- term;
- assessment;
- instructions;
- date;
- duration;
- total marks;
- structured question numbering.

---

# 33. MACHINE-READABLE ANSWER SHEETS

Objective answer sheets shall include identifiers such as:

- QR code;
- assessment ID;
- student identifier;
- class identifier.

Answer sheet structures may support:

**A B C D E**

as configured.

The enhancement specification requires machine-readable answer sheets with unique assessment and student identification.

---

# 34. SCANNING

Answer sheets may be uploaded using:

- smartphone camera;
- tablet camera;
- flatbed scanner;
- document scanner;
- multipage PDF.

The system shall automatically attempt to:

- identify assessment;
- identify student;
- detect selected responses;
- compare responses with answer key;
- calculate preliminary score.



---

# 35. SCAN QUALITY CONTROL

The system shall detect:

- blur;
- rotation;
- incomplete sheet;
- duplicate scan;
- invalid identification;
- multiple answers;
- uncertain marks;
- missing pages.

When confidence is insufficient, Skuggle must not guess.

Display:

**Review Required**

with the source image and interpreted answer.

---

# 36. BATCH MARKING

A teacher should be able to process a class batch.

Example:

**Processed:** 45

**Automatically Marked:** 42

**Review Required:** 3

**Unidentified:** 0

The source enhancement explicitly specifies batch processing and exception review.

---

# 37. ASSESSMENT ANALYTICS

After marking, Skuggle shall calculate:

- highest score;
- lowest score;
- average;
- median;
- pass rate;
- failure rate;
- grade distribution;
- frequently missed questions;
- question difficulty;
- topic mastery;
- student performance.



---

# 38. STUDENT PERFORMANCE INTELLIGENCE

Every student shall have a continuously updated performance profile.

Performance should not be limited to the end-of-term report.

The enhancement PRD explicitly requires student performance information to update whenever relevant academic information is recorded.

---

# 39. STUDENT 360 PERFORMANCE PAGE

Student profile should contain:

## Identity

- photograph;
- full name;
- class;
- admission number.

## Academic Performance

- current average;
- subject averages;
- recent test scores;
- examination scores;
- assignment completion.

## Trends

- improving subjects;
- declining subjects;
- term trend;
- session trend.

## Engagement

- attendance;
- lateness;
- assignments submitted.

## Curriculum Mastery

Per subject:

- Mastered;
- Developing;
- Needs Attention.

---

# 40. PERFORMANCE ALERTS

Examples:

> Mathematics improved by 14% across the last three assessments.

> English has declined across three consecutive assessments.

> Attendance has fallen below the school's configured threshold.

> Five assignments remain outstanding.

Alerts must use configurable thresholds to prevent noise.

---

# 41. ROLE-SPECIFIC PERFORMANCE VIEWS

## Teacher

- class performance;
- student progress;
- topic mastery;
- students requiring attention;
- missing assignments.

## Principal

- class comparisons;
- subject comparisons;
- students requiring intervention;
- teacher score submission status.

## Proprietor

- overall average;
- percentage improving;
- percentage declining;
- highest-performing classes;
- classes requiring attention.

## Parent

- child's current performance;
- recent scores;
- improvement/decline;
- teacher comments;
- focus areas.

## Student

- current average;
- strengths;
- improvement areas;
- goals;
- teacher feedback.

---

# 42. SKUGGLE TEACHER AI

AI shall be embedded contextually rather than exposed as an unrelated chatbot module.

---

# 43. CURRICULUM ASSISTANT

Skuggle shall maintain structured curriculum information by:

- level;
- class;
- subject;
- term;
- week;
- topic;
- subtopic;
- learning objective;
- competency;
- assessment indicator.

Curriculum must support versions associated with academic sessions.

---

# 44. AI SCHEME OF WORK

Teacher may request:

> Prepare the first-term scheme of work for JSS 2 Basic Science.

Skuggle may generate:

- weekly topics;
- objectives;
- learning activities;
- teaching resources;
- assessment ideas.

Teacher approval shall be required.

---

# 45. AI LESSON BUILDER

Inputs:

- class;
- subject;
- curriculum topic;
- duration;
- student level;
- teaching preference.

Possible output:

- lesson objectives;
- previous knowledge;
- introduction;
- explanation;
- teaching activities;
- student activities;
- practical exercises;
- assessment;
- homework;
- teaching aids.

These capabilities align with the enhancement requirement for an AI lesson preparation assistant grounded in the configured curriculum.

---

# 46. AI QUESTION GENERATOR

From:

- class;
- subject;
- topic;
- curriculum objective;
- difficulty;
- question count;

AI may generate:

- questions;
- answer options;
- marking schemes;
- model answers;
- variations.

Teacher must review before publishing.

---

# 47. UI/UX ARCHITECTURE

Skuggle shall preserve the current **horizontal navigation philosophy**.

No permanently expanded ERP sidebar shall dominate the interface.

---

# 48. SCHOOL ADMINISTRATOR NAVIGATION

Desktop:

**Home | Students | Academics | Attendance | Finance | Staff | Reports | More**

Use grouped mega menus/dropdowns where required.

Example:

### Academics

- Sessions
- Terms
- Classes
- Subjects
- Assessments
- Results
- Curriculum

### More

- Communication
- Settings
- Audit
- Integrations

---

# 49. TEACHER NAVIGATION

**Home | My Classes | Lessons | Assessments | Attendance | Students | More**

The enhancement PRD places performance, curriculum, AI lesson building, scan-and-mark and communication inside the teacher experience.

---

# 50. PARENT NAVIGATION

Desktop:

**Home | My Child | Academics | Payments | Messages**

Mobile:

Bottom navigation may be used.

---

# 51. STUDENT NAVIGATION

**Home | My Progress | Learning | Assessments | Results**

The student experience shall emphasise progress rather than administrative functionality.

---

# 52. RESPONSIVE DESIGN

Supported layouts:

- smartphone;
- tablet;
- laptop;
- desktop.

Minimum responsive testing widths:

### Mobile

- 360 px
- 375 px
- 390 px
- 414 px

### Tablet

- 768 px
- 820 px
- 1024 px

### Desktop

- 1280 px
- 1366 px
- 1440 px
- 1920 px

The source specification explicitly requires smartphone, tablet, laptop and desktop support.

---

# 53. PROGRESSIVE WEB APP

Skuggle shall be installable on:

- Windows;
- Android;
- compatible desktop browsers;
- compatible mobile browsers.

Requirements:

- manifest;
- service worker;
- application icons;
- standalone display;
- offline shell;
- install prompt;
- update management;
- network status;
- IndexedDB for selected offline workflows.

---

# 54. OFFLINE CAPABILITIES

Initial offline-capable workflows should include:

- class lists;
- attendance;
- timetable;
- draft score entry;
- draft lesson notes;
- selected previously synchronised student records.

Offline writes shall enter a pending-sync queue.

Statuses:

**Synced**

**Pending Sync**

**Sync Failed**

Offline conflicts must never silently overwrite newer server information.

---

# 55. TECHNICAL ARCHITECTURE

```text
Browser / Installed PWA
        │
        ▼
React + TypeScript
        │
        ▼
API Service Layer
        │
        ▼
Laravel REST API
        │
  ┌─────┴──────┐
  ▼            ▼
Redis         MySQL
Cache         Source of Truth
Queues
        │
        ▼
File Storage
```

---

# 56. FRONTEND

Recommended:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- React Router;
- TanStack Query;
- React Hook Form;
- Zod;
- Axios;
- IndexedDB abstraction;
- Workbox/Vite PWA tooling;
- Lucide icons.

---

# 57. BACKEND

Laravel shall provide:

- REST API;
- authentication;
- authorisation;
- tenant isolation;
- validation;
- business logic;
- reporting;
- exports;
- file management;
- caching;
- queues;
- audit logging.

Controllers should remain thin.

Use:

- Form Requests;
- Policies;
- Services;
- API Resources;
- Jobs where appropriate.

---

# 58. DATABASE

MySQL is the permanent source of truth.

Redis shall never become the only location of permanent school information.

Redis may support:

- cache;
- queue;
- rate limiting;
- dashboard statistics;
- short-lived configuration cache.

---

# 59. CORE DATA ENTITIES

Initial entities should include:

- tenants;
- campuses;
- users;
- roles;
- permissions;
- academic_sessions;
- terms;
- school_levels;
- classes;
- class_arms;
- subjects;
- teacher_assignments;
- students;
- guardians;
- student_guardian;
- enrolments;
- attendance_records;
- assessment_types;
- assessments;
- assessment_scores;
- results;
- report_cards;
- result_pins;
- fees;
- invoices;
- payments;
- audit_logs;
- curriculum_versions;
- curriculum_topics.

Later:

- question_bank;
- assessment_questions;
- scan_batches;
- scan_pages;
- detected_responses;
- interventions;
- academic_goals;
- lesson_plans.

---

# 60. TENANT SECURITY RULE

Every tenant-owned query must be scoped server-side.

The frontend shall never be trusted to determine authorised tenant identity.

Forbidden:

```php
Student::find($id);
```

Expected pattern conceptually:

```php
Student::where('tenant_id', $tenantId)
    ->findOrFail($id);
```

or equivalent tenant scopes/policies.

---

# 61. BUSINESS RULES

### BR-001
Every school-owned entity belongs to a tenant.

### BR-002
Users shall access only authorised tenant/campus information.

### BR-003
Student academic history shall not be overwritten by promotion.

### BR-004
Published results shall require reopening before modification.

### BR-005
A student admission number shall be unique within its tenant.

### BR-006
A guardian may belong to multiple students.

### BR-007
A student may have multiple guardians.

### BR-008
Assessment structures shall be configurable.

### BR-009
Curriculum shall support versioning.

### BR-010
AI cannot bypass user permissions.

### BR-011
Offline changes shall not silently overwrite newer information.

These rules align with the core business constraints specified by the source PRD.

---

# 62. SEARCH AND FILTERING

Large datasets must support:

- server-side pagination;
- search;
- filters;
- sorting.

Student filters may include:

- campus;
- session;
- class;
- arm;
- gender;
- status;
- admission date.

The source PRD explicitly requires search, pagination, filtering and sorting rather than loading entire student populations.

---

# 63. PERFORMANCE REQUIREMENTS

Target ordinary interactions:

**under 2 seconds under normal operating conditions.**

Implement:

- route lazy loading;
- image optimisation;
- compressed assets;
- API pagination;
- Redis caching;
- query optimisation;
- background report generation;
- CDN/static caching where available;
- debounced search.

These targets are directly reflected in the source non-functional requirements.

---

# 64. SECURITY REQUIREMENTS

Implement:

- secure password hashing;
- authentication;
- role-based authorisation;
- tenant isolation;
- HTTPS;
- login throttling;
- secure password reset;
- CSRF protection where applicable;
- input validation;
- file upload validation;
- audit logging;
- backups;
- optional MFA for privileged accounts.

The source requirements explicitly call for tenant isolation, authentication, encryption, rate controls, security logging and regular backups.

---

# 65. ERROR HANDLING

Never expose raw technical errors such as:

```text
SQLSTATE[23000]
```

Display:

> This admission number is already assigned to another student.

Internal technical diagnostics should be logged securely.



---

# 66. AUDIT TRAIL

Track critical actions including:

- student created;
- student edited;
- student archived;
- student restored;
- score changed;
- result approved;
- result reopened;
- result published;
- PIN generated;
- payment adjusted;
- role changed;
- export generated.

Audit logs must not be editable by ordinary users.

---

# 67. REPORTING

Reports should include:

## Student

- student register;
- class register;
- enrolment;
- gender distribution;
- student movement;
- promotion.

## Academic

- class performance;
- subject performance;
- assessment completion;
- missing scores;
- grade distribution;
- curriculum coverage.

## Financial

- student statement;
- fee collection;
- outstanding balances;
- payment history.

Reports shall support:

- filters;
- printing;
- PDF;
- spreadsheet export.



---

# 68. FEATURES EXCLUDED FROM CORE 2.0

The following shall NOT block Core 2.0 release:

- payroll;
- hostel;
- transport GPS;
- full accounting;
- procurement;
- biometrics;
- facial recognition;
- advanced HR;
- full library;
- native video conferencing;
- handwriting AI;
- predictive performance AI;
- complete LMS.

These must remain modular extensions.

---

# 69. MVP+ INTELLIGENCE FEATURES

The immediate post-core intelligence release shall prioritise:

- printable assessments;
- OMR-style answer sheets;
- smartphone scanning;
- objective auto-marking;
- exception review;
- automatic score recording;
- assessment analytics;
- performance dashboards;
- curriculum structure;
- AI lesson plans;
- AI question generation;
- result PIN.

The enhancement PRD explicitly identifies these as essential capabilities before the more advanced OCR, theory marking and live classroom functions.

---

# 70. FUTURE EXTENSIONS

Later modules may include:

### Skuggle Learn
Home lessons and learning resources.

### Skuggle Library
Library management.

### Skuggle Transport
Routes and student transport.

### Skuggle People
Advanced HR and payroll.

### Skuggle Finance
Advanced school accounting.

### Skuggle Health
Restricted student health and welfare.

These extensions must use the same:

- tenant;
- user;
- student;
- permission;
- audit;
- notification

foundation rather than creating disconnected applications.

---

# 71. FINAL PRODUCT ARCHITECTURE

```text
                         SKUGGLE

      ┌────────────────────┼────────────────────┐
      │                    │                    │
   PEOPLE              ACADEMICS           ENGAGEMENT
      │                    │                    │
 Students              Curriculum            Parents
 Guardians              Lessons              Students
 Staff                 Attendance            Messages
 Admissions            Assessments           Notifications
                         Results
                           │
                           ▼
                  SKUGGLE SMARTMARK
                           │
                 Print → Scan → Mark
                           │
                           ▼
                 PERFORMANCE ENGINE
                           │
           ┌───────────────┼───────────────┐
           │               │               │
        Teacher          Parent        Leadership
                           │
                           ▼
                     SKUGGLE AI
                           │
                  Curriculum Assistant
                    Lesson Builder
                   Question Generator
```

Foundation:

```text
Multi-Tenant Architecture
RBAC
Audit Trail
Laravel API
MySQL
Redis
PWA
Offline Synchronisation
Secure File Storage
Queues
Reporting
```

---

# 72. SUCCESS CRITERIA

Skuggle succeeds when schools can reliably:

1. onboard themselves;
2. configure their academic structure;
3. register/import students;
4. maintain complete student records;
5. assign teachers;
6. take attendance;
7. conduct assessments;
8. calculate and approve results;
9. issue branded report cards;
10. provide parent access;
11. track payments;
12. promote students without losing history;
13. operate essential functions on unreliable internet;
14. identify student performance trends;
15. progressively reduce examination marking time.

---

# 73. FINAL PRODUCT STANDARD

Skuggle shall not compete primarily by having the longest module list.

Its strategic advantage shall be the connection between:

**Student Records**

→ **Teaching**

→ **Assessment**

→ **Performance**

→ **Intervention**

→ **Parents**

→ **School Leadership**

The enhancement PRD describes this as a connected series of school-operation, teaching, assessment, improvement and parent-engagement loops that transform a records system into a continuous school-performance platform.

The defining proposition is therefore:

> **Skuggle helps schools know every student, organise teaching, assess learning, understand performance and keep parents informed from one intelligent platform.**

And its most defensible Nigerian-market differentiator should become:

> **Schools can prepare examinations digitally, conduct them traditionally on paper, scan completed answer sheets with ordinary smartphones and automatically convert approved marks into real-time student performance information.**

That gives Skuggle a clear identity beyond being another school-management application with a suspiciously large navigation menu.
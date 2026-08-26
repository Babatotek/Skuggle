# PRODUCT REQUIREMENTS DOCUMENT

## Smart School Management Operating System for Nigerian Private Schools

**Product Working Name:** SmartSchool OS  
**Document Type:** Product Requirements Document  
**Version:** 1.0  
**Market:** Nigerian Private Education Sector  
**Primary Users:** Nursery, Primary and Secondary Schools  
**Product Model:** Multi-Tenant SaaS / School Management Operating System  
**Platforms:** Responsive Web Application + Progressive Web App (PWA)  
**Document Status:** Product Definition Baseline  

---

# 1. Executive Summary

SmartSchool OS is a multi-tenant digital operating system designed specifically for Nigerian private Nursery, Primary and Secondary schools.

The platform will provide a unified environment for managing the complete lifecycle of a school, including:

- enquiries and admissions;
- student information;
- academic sessions and terms;
- curriculum and subject management;
- lesson planning;
- timetable management;
- attendance;
- assessments and examinations;
- report cards;
- school fees and financial operations;
- parent communication;
- staff administration;
- student behaviour and welfare;
- transport;
- library;
- inventory and assets;
- external examination preparation;
- analytics;
- compliance;
- AI-assisted school administration.

The objective is not merely to digitise paper records.

The objective is to create a **School Operating System** through which the school's academic, administrative, financial and communication processes operate from a shared source of truth.

SmartSchool OS shall be configurable enough to accommodate differences between Nigerian private schools without forcing every school into one operational structure.

The product shall therefore avoid hardcoded assumptions about:

- subjects;
- academic terms;
- grading systems;
- school fees;
- class structures;
- admission procedures;
- report-card formats;
- school houses;
- academic calendars;
- attendance procedures;
- curriculum versions;
- approval workflows.

---

# 2. Product Vision

> To become the digital operating infrastructure through which Nigerian private schools manage students, staff, academics, parents, finances, communication and institutional performance.

SmartSchool OS should enable a school proprietor or administrator to understand the state of the entire school from one platform while allowing teachers, bursars, parents, students and other users to interact only with the functions relevant to them.

---

# 3. Product Mission

SmartSchool OS will help schools:

1. reduce dependence on paper and spreadsheets;
2. improve administrative efficiency;
3. provide accurate and timely academic records;
4. improve school-fee collection and reconciliation;
5. strengthen communication between schools and parents;
6. provide school owners with real-time operational visibility;
7. improve accountability among staff;
8. maintain reliable historical student records;
9. support Nigerian curriculum and examination requirements;
10. provide actionable insights through analytics and responsible AI.

---

# 4. Problem Statement

Many Nigerian private schools operate using fragmented systems such as:

- physical admission forms;
- handwritten attendance registers;
- Excel spreadsheets;
- WhatsApp groups;
- manual receipts;
- handwritten lesson notes;
- standalone CBT applications;
- separate accounting packages;
- paper report cards;
- notebooks for inventory;
- physical files for student records;
- independent school-fee applications.

This creates several problems.

### Operational Fragmentation

Student, financial, attendance and academic information exists in different locations and is difficult to reconcile.

### Poor Management Visibility

Proprietors often cannot immediately answer questions such as:

- How many students are currently enrolled?
- What percentage of expected fees has been collected?
- Which parents have outstanding balances?
- Which students are absent today?
- Which teachers have not submitted results?
- Which classes are underperforming?
- How many students are at risk academically?
- What is the school's actual income versus expenditure?

### Repetitive Administrative Work

Schools repeatedly enter the same student information into admission forms, class lists, fee registers, report cards and external examination records.

### Weak Parent Experience

Parents frequently depend on phone calls, WhatsApp messages or physical visits for information that should already be accessible digitally.

### Lack of Reliable Historical Records

When students leave, teachers resign or computers fail, important institutional records can become difficult or impossible to recover.

### Poor Financial Control

Manual fee collection makes reconciliation, debt tracking, discounts, scholarships, instalments and financial reporting unnecessarily difficult.

### Limited Decision Intelligence

Most traditional school-management software stores information but does little to interpret it.

SmartSchool OS will convert operational data into actionable management intelligence.

---

# 5. Target Market

## 5.1 Primary Market

Nigerian private:

- Nursery schools;
- Primary schools;
- Junior Secondary Schools;
- Senior Secondary Schools;
- Combined Nursery/Primary/Secondary schools;
- Day schools;
- Boarding schools;
- multi-campus private school groups.

## 5.2 Secondary Market

Future product extensions may support:

- tutorial centres;
- vocational schools;
- international schools;
- sixth-form colleges;
- examination preparation centres;
- tertiary institutions.

These shall not determine the initial architecture unless their requirements align naturally with the core school model.

---

# 6. Product Principles

SmartSchool OS shall follow the following principles.

### Configurable, Not Hardcoded

Academic policies differ between schools. Core business rules must therefore be configurable.

### Mobile First

Many teachers and parents will access the system primarily from Android smartphones.

### Low-Bandwidth Friendly

The system shall remain usable on unstable or relatively slow Nigerian internet connections.

### Offline-Tolerant

Selected workflows shall operate temporarily offline through PWA capabilities and synchronise when connectivity returns.

### One Source of Truth

Student, staff, academic and financial records should not require duplicate manual entry across modules.

### Role-Based Simplicity

A class teacher should not see an interface resembling a proprietor's financial dashboard.

Each user should see the information necessary for their responsibilities.

### Privacy by Design

Student and staff information shall be protected from the architecture level rather than through cosmetic privacy policies added after development.

### Auditability

Important actions shall be attributable to individual users.

### Human-Controlled AI

AI will assist users but shall not independently make high-impact academic, disciplinary, financial or employment decisions.

---

# 7. Nigerian Regulatory and Educational Context

The system must accommodate changing Nigerian education requirements.

NERDC currently publishes revised Basic Education and Senior Secondary curriculum structures, with implementation being introduced progressively. SmartSchool OS must therefore support **curriculum versioning rather than one permanently hardcoded subject structure**.

External examination configurations must similarly be version-controlled. WAEC currently specifies subject-entry rules for school candidates, while NECO registration includes structured student biodata and validation requirements. These rules can change between examination years.

SmartSchool OS shall therefore provide **WAEC/NECO readiness and export workflows**, rather than assuming direct integration with examination bodies where no supported integration has been established.

The system must also comply with the Nigeria Data Protection Act 2023 and applicable NDPC guidance. The Act requires appropriate technical and organisational safeguards over personal information, while current implementation guidance specifically addresses educational records and safeguards for services involving children.

---

# 8. Stakeholders

## Internal Product Stakeholders

- Product Owner
- Business Analyst
- Product Manager
- UI/UX Team
- Software Engineering Team
- QA Team
- DevOps Team
- Data/AI Team
- Customer Support
- Sales and Marketing
- Compliance/Data Protection

## School Stakeholders

- School Proprietor
- School Director
- Principal
- Head Teacher
- Vice Principal
- Administrator
- Bursar/Accountant
- Teachers
- Form/Class Teachers
- Examination Officer
- Admission Officer
- Librarian
- Transport Officer
- School Nurse
- HR Officer
- Store/Inventory Officer
- Parents/Guardians
- Students

---

# 9. User Roles

The system shall implement granular Role-Based Access Control.

Default roles should include:

| Role | Primary Responsibilities |
|---|---|
| Platform Super Admin | SaaS-wide administration |
| School Owner/Proprietor | Executive oversight |
| School Administrator | School configuration and operations |
| Principal/Head Teacher | Academic and administrative leadership |
| Vice Principal | Delegated academic/administrative functions |
| Admission Officer | Enquiries, applications and admissions |
| Bursar/Accountant | Fees and finance |
| Examination Officer | Assessments and results |
| Teacher | Teaching, attendance, assessments and lesson records |
| Class/Form Teacher | Class-level administration |
| HR Officer | Staff administration |
| Librarian | Library operations |
| Transport Manager | Transport operations |
| Nurse/Health Officer | Student health records |
| Inventory Officer | Assets and stores |
| Parent/Guardian | Child-related information |
| Student | Personal academic services |

Schools shall also be able to create **custom roles**.

Permissions shall support:

- View
- Create
- Edit
- Delete
- Approve
- Publish
- Export
- Configure

Access shall be tenant- and campus-aware.

---

# 10. SaaS Tenant Architecture

SmartSchool OS shall operate as a true multi-tenant SaaS.

## Hierarchy

**Platform**

→ School Organisation  
→ Campus/Branch  
→ Academic Session  
→ Term  
→ School Level  
→ Class  
→ Arm  
→ Student

Example:

**Great Future Schools**

- Akure Campus
  - Nursery
  - Primary
  - Secondary
- Abuja Campus
  - Primary
  - Secondary

The proprietor may view consolidated information across campuses while campus administrators see only authorised campuses.

No tenant shall be able to access another school's information.

---

# 11. Core Product Modules

## 11.1 School Setup and Configuration

A guided onboarding wizard shall configure a new school.

Configuration shall include:

- school name;
- logo;
- colours;
- addresses;
- campuses;
- school levels;
- academic session;
- terms;
- classes;
- class arms;
- departments;
- subjects;
- grading system;
- assessment structures;
- fees;
- school calendar;
- houses;
- currencies;
- time zone;
- report-card template;
- receipt numbering;
- user roles;
- notification preferences.

Administrators should be able to clone configurations into a new academic session rather than recreating them manually.

---

# 12. Admissions Management

The Admissions module manages prospective students from enquiry to enrolment.

## Requirements

The system shall support:

- online admission forms;
- physical/offline application capture;
- admission session selection;
- application fees;
- applicant profiles;
- passport photographs;
- birth certificates;
- previous-school information;
- guardian information;
- entrance examinations;
- interview scheduling;
- applicant scoring;
- admission decisions;
- waiting lists;
- admission letters;
- acceptance fees;
- enrolment confirmation.

## Admission Pipeline

Enquiry

→ Application

→ Application Review

→ Entrance Assessment

→ Interview

→ Admission Decision

→ Acceptance

→ Enrolment

Successful applicants shall automatically become students without administrators re-entering their information.

---

# 13. Student Information System

The Student Information System shall maintain the authoritative record of every student.

## Student Profile

Each student record may contain:

### Personal Information

- admission number;
- full name;
- gender;
- date of birth;
- passport photograph;
- nationality;
- state of origin;
- LGA;
- NIN where required;
- blood group;
- genotype;
- allergies where legitimately collected;
- admission date;
- current class;
- student status.

### Guardian Information

Multiple guardians must be supported.

Information may include:

- relationship;
- telephone number;
- email;
- occupation;
- address;
- preferred contact;
- billing responsibility;
- authorised pickup status.

One parent account may therefore access several children.

### Student Status

The system shall support:

- Applicant
- Active
- Suspended
- Withdrawn
- Transferred
- Graduated
- Alumni
- Deceased

Historical records shall not disappear when the student's active status changes.

---

# 14. Academic Session and Promotion Management

The system shall maintain historical separation between academic sessions.

Administrators shall be able to:

- create sessions;
- create terms;
- open/close terms;
- enrol students into classes;
- promote students;
- repeat students;
- transfer students between classes;
- graduate students;
- process withdrawals.

Promotion shall never overwrite previous academic records.

---

# 15. Curriculum and Subject Management

The curriculum engine shall support:

- NERDC-aligned curriculum structures;
- school-created curriculum;
- international curriculum extensions;
- curriculum versioning;
- subject groups;
- compulsory subjects;
- optional subjects;
- trade subjects;
- student subject combinations;
- subject prerequisites;
- class-level subject assignments.

Curriculum definitions shall be associated with academic sessions so historical results remain accurate when national requirements change.

NERDC's current revised curriculum arrangements demonstrate why the curriculum engine cannot safely be represented by one permanent subject table.

---

# 16. Timetable Management

The platform shall provide both manual and intelligent timetable creation.

Inputs shall include:

- classes;
- subjects;
- teachers;
- available periods;
- breaks;
- classrooms;
- laboratories;
- teacher availability;
- maximum periods per teacher;
- subject frequency requirements.

The Smart Timetable Engine should identify:

- teacher conflicts;
- room conflicts;
- class conflicts;
- excessive consecutive lessons;
- unassigned periods.

Future AI optimisation may recommend better timetable arrangements.

---

# 17. Teacher Workspace

Teachers shall receive a simplified workspace containing:

- today's classes;
- timetable;
- attendance;
- lesson plans;
- assignments;
- assessments;
- pending score entry;
- announcements;
- messages;
- class performance;
- tasks.

Teachers shall not need to navigate through administrative ERP menus merely to mark attendance.

---

# 18. Attendance Management

The system shall support multiple attendance methods.

### Basic

- teacher roll call;
- manual administration.

### Smart Options

- QR codes;
- student ID cards;
- RFID/NFC;
- biometric devices;
- facial recognition where appropriately implemented;
- school-gate integrations.

Schools shall enable only required methods.

## Attendance Status

- Present
- Absent
- Late
- Excused
- Sick
- School Activity

## Parent Notification

Schools may configure notifications such as:

> Your child arrived at school at 7:34 AM.

and:

> Your child has not been marked present today.

Attendance corrections shall require authorised users and generate audit records.

Biometric attendance involving children shall be treated as a sensitive optional capability requiring privacy assessment, appropriate parental/guardian safeguards and a non-biometric alternative.

---

# 19. Lesson Planning and Curriculum Delivery

Teachers shall create or upload:

- schemes of work;
- lesson plans;
- lesson notes;
- teaching resources;
- assignments;
- learning objectives;
- classroom activities.

Administrators may configure approval workflows such as:

Teacher

→ Head of Department

→ Academic Administrator

The system shall track curriculum coverage.

Example:

**JSS 2 Mathematics**

Expected coverage: 64%

Actual recorded coverage: 48%

Status: Behind Schedule

Management can therefore detect academic delivery problems before the end of term.

---

# 20. Learning Management Features

SmartSchool OS is primarily a school operating system but shall contain lightweight LMS capabilities.

Students may access:

- assignments;
- notes;
- videos;
- documents;
- quizzes;
- past questions;
- announcements;
- homework submissions.

Teachers may:

- publish materials;
- create assignments;
- set deadlines;
- mark submissions;
- comment on work.

A full MOOC-style LMS remains a later product extension.

---

# 21. Assessment and Examination Management

Schools shall configure their own assessment policies.

Example:

- CA1 = 10%
- CA2 = 10%
- Assignment = 10%
- Project = 10%
- Examination = 60%

Another school may configure an entirely different structure.

Nothing shall be hardcoded.

## Features

- assessment creation;
- score entry;
- bulk score upload;
- validation;
- missing-score detection;
- score locking;
- moderation;
- approval;
- examination management;
- grading;
- ranking settings;
- result computation;
- remarks;
- report-card generation.

---

# 22. Result Approval Workflow

Recommended workflow:

Teacher enters score

→ Teacher submits subject result

→ Examination officer validates

→ Principal/authorised approver approves

→ Result is locked

→ Result is published

→ Parent/Student gains access

Administrators may configure different workflows.

Editing an approved result shall:

1. require appropriate permission;
2. require a reason;
3. generate an audit record.

---

# 23. Report Cards

Report cards shall support:

- school branding;
- student photograph;
- subject results;
- CA breakdown;
- examination scores;
- totals;
- grades;
- class averages;
- positions where enabled;
- behavioural assessment;
- affective assessment;
- psychomotor assessment;
- attendance summary;
- teacher remarks;
- principal remarks;
- next-term information.

Schools shall be able to configure whether class positions are displayed.

Reports shall be available:

- online;
- as PDF;
- printable.

Historical report cards must remain available.

---

# 24. CBT and Online Assessment

Later versions should provide integrated Computer-Based Testing.

Capabilities should include:

- question bank;
- subject categories;
- multiple-choice questions;
- structured questions;
- randomisation;
- timed examinations;
- automatic marking;
- question difficulty levels;
- exam scheduling;
- result analytics.

The architecture should allow this module to be added without redesigning the Student Information System.

---

# 25. WAEC and NECO Readiness

The system shall maintain an **External Examination Readiness Centre**.

It shall help schools prepare candidate information for external examinations.

For SS3 students, administrators should be able to validate:

- candidate name;
- date of birth;
- gender;
- passport photograph;
- NIN where required;
- state of origin;
- LGA;
- subjects;
- school identifiers;
- missing information.

NECO's 2026 internal-registration guidance includes validation of these candidate details and biometric capture as part of its registration process.

The product shall provide:

- candidate readiness percentage;
- missing-data alerts;
- invalid subject-combination detection;
- candidate lists;
- printable validation sheets;
- configurable exports;
- examination checklists.

The product **shall not claim to submit registrations directly to WAEC or NECO unless an authorised technical integration becomes available**.

---

# 26. School Fees Management

The Fees module is a core commercial requirement.

## Fee Structures

Schools shall configure:

- tuition;
- development levy;
- books;
- uniforms;
- transport;
- boarding;
- meals;
- examination fees;
- PTA;
- extracurricular activities;
- miscellaneous charges.

Fees may vary by:

- class;
- student;
- campus;
- term;
- session;
- boarding status;
- transport route.

---

# 27. Student Billing

The system shall create student invoices.

It shall support:

- full payment;
- instalments;
- discounts;
- scholarships;
- waivers;
- sibling discounts;
- credit balances;
- arrears;
- penalties;
- refunds;
- manual payments;
- online payments.

Every financial adjustment shall maintain an audit history.

---

# 28. Payment Integration

The platform architecture shall support interchangeable Nigerian payment providers, such as:

- Paystack;
- Flutterwave;
- Monnify;
- bank transfer/reconciliation services;
- additional providers through adapters.

Schools shall not be permanently tied to one gateway.

Payment events shall update student ledgers only after verified transaction confirmation.

---

# 29. Parent Financial Experience

Parents shall see:

**Total Invoice**

**Amount Paid**

**Outstanding Balance**

**Payment History**

**Payment Deadline**

They may:

- make payments;
- download receipts;
- see transaction history;
- view instalment schedules.

Parents managing multiple children shall view their combined obligations from one account.

---

# 30. Finance and Accounting

Beyond fee collection, the system should progressively support:

- income;
- expenses;
- expense categories;
- petty cash;
- vendors;
- purchase requests;
- payment approvals;
- budgets;
- bank accounts;
- cashbooks;
- financial reports.

Advanced accounting may later include:

- chart of accounts;
- journals;
- general ledger;
- profit and loss;
- balance sheet;
- cash-flow reporting.

Accounting functionality should be modular so schools already using accounting software can integrate rather than duplicate it.

---

# 31. Parent Portal

The Parent Portal shall be deliberately simple.

Parents shall have access to:

- child dashboard;
- attendance;
- timetable;
- assignments;
- results;
- report cards;
- fee balances;
- payments;
- receipts;
- announcements;
- messages;
- disciplinary notices;
- events;
- transport information.

A guardian with three children must not maintain three separate accounts.

---

# 32. Student Portal

Students shall access:

- timetable;
- assignments;
- learning resources;
- results;
- attendance;
- calendar;
- announcements;
- CBT;
- academic progress.

Student access shall be age-appropriate.

Younger pupils may have simplified dashboards with large visual navigation while secondary-school students may receive more detailed academic information.

---

# 33. Communication Centre

The platform shall provide a central communication system.

Supported channels may include:

- in-app notifications;
- email;
- SMS;
- push notifications;
- WhatsApp through authorised provider integrations.

Schools shall communicate with:

- one parent;
- one class;
- one campus;
- all teachers;
- selected students;
- entire school.

Communication history shall be retained according to school policies.

---

# 34. Announcements and Emergency Communication

Administrators shall publish:

- circulars;
- holiday notices;
- examination announcements;
- emergency messages;
- event notices;
- fee reminders.

Emergency communication should support rapid distribution to configured guardian contacts.

---

# 35. Staff Management

The initial HR capability shall manage:

- staff profiles;
- employment information;
- departments;
- roles;
- qualifications;
- documents;
- emergency contacts;
- employment status;
- leave;
- attendance;
- workload.

Schools needing advanced HR functionality may later activate dedicated HR modules.

---

# 36. Payroll

Payroll should be an optional module.

It may support:

- salary structures;
- allowances;
- deductions;
- bonuses;
- pensions;
- PAYE configuration;
- payroll periods;
- payslips;
- payment schedules;
- payroll approval.

Payroll shall remain isolated from academic permissions.

---

# 37. Staff Attendance

Staff attendance may use:

- administrator marking;
- QR;
- RFID/NFC;
- biometric devices;
- geofencing;
- face authentication.

Attendance policies shall be configurable per school.

---

# 38. Student Behaviour and Discipline

Schools shall record:

- commendations;
- behavioural incidents;
- warnings;
- sanctions;
- suspensions;
- parent meetings;
- resolutions.

Sensitive disciplinary information shall have stricter permissions than ordinary academic information.

---

# 39. Health and Welfare

Where enabled, the school clinic module shall maintain controlled access to information such as:

- allergies;
- medical alerts;
- medications administered;
- clinic visits;
- emergency incidents;
- parent contact;
- medical referrals.

Health information shall be treated as highly restricted data.

---

# 40. Transport Management

The optional Transport module shall support:

- vehicles;
- drivers;
- attendants;
- routes;
- stops;
- students assigned to routes;
- transport fees;
- pickup/drop-off information.

Future versions may support:

- GPS tracking;
- live bus location;
- geofence arrival alerts;
- student boarding confirmation.

---

# 41. Boarding/Hostel Management

For boarding schools, the platform may manage:

- hostels;
- rooms;
- beds;
- house parents;
- allocations;
- boarding attendance;
- leave/exeat;
- visitor approvals;
- incidents;
- boarding charges.

This module shall be optional.

---

# 42. Library Management

The Library module shall support:

- books;
- ISBN;
- categories;
- copies;
- borrowers;
- issue dates;
- return dates;
- overdue items;
- penalties;
- reservations;
- digital resources.

Student and staff IDs should be usable for borrowing.

---

# 43. Inventory and Asset Management

Schools shall manage:

- furniture;
- computers;
- laboratory equipment;
- uniforms;
- books;
- stationery;
- sports equipment;
- consumables.

Capabilities shall include:

- stock-in;
- stock-out;
- asset assignment;
- stock level;
- reorder alerts;
- asset condition;
- asset location;
- suppliers.

---

# 44. Procurement

Later versions may support:

Request

→ Approval

→ Purchase Order

→ Goods Received

→ Payment

→ Inventory Update

Approval limits should be configurable.

---

# 45. School Calendar

The platform shall maintain a unified calendar for:

- sessions;
- terms;
- holidays;
- examinations;
- PTA meetings;
- sports;
- excursions;
- staff meetings;
- school events.

Calendar items may be targeted by campus, class or user group.

---

# 46. Document Management

The system shall generate and store documents including:

- admission letters;
- payment receipts;
- invoices;
- report cards;
- student ID cards;
- staff ID cards;
- transfer letters;
- testimonials;
- certificates;
- clearance records.

Templates shall support school branding.

---

# 47. Executive Dashboard

The proprietor dashboard shall answer operational questions immediately.

Example dashboard:

### Students

**Total Students:** 842  
**Present Today:** 781  
**Absent:** 42  
**Late:** 19

### Finance

**Expected Fees:** ₦84.2M  
**Collected:** ₦68.7M  
**Outstanding:** ₦15.5M  
**Collection Rate:** 81.6%

### Academic

**Average Performance:** 71%

**Results Submitted:** 83%

**Curriculum Coverage:** 67%

### Operations

**Teachers Present:** 61/65

**Open Incidents:** 4

**Pending Approvals:** 17

Data visibility must respect authorised campuses.

---

# 48. Analytics and Business Intelligence

The Analytics module shall provide:

### Academic Analytics

- average performance;
- subject performance;
- class performance;
- performance trends;
- teacher/class comparisons;
- assessment distribution;
- student progress.

### Attendance Analytics

- absence trends;
- lateness;
- chronic absenteeism;
- class attendance rates.

### Financial Analytics

- fee collection;
- outstanding balances;
- payment trends;
- revenue;
- expenditure;
- collection forecast.

### Admission Analytics

- enquiries;
- applications;
- admission conversion;
- acceptance rates;
- enrolment growth.

### Operational Analytics

- teacher workload;
- curriculum coverage;
- pending tasks;
- library use;
- inventory usage.

---

# 49. SmartSchool AI Copilot

AI shall function as an intelligence layer over authorised school information.

It should not merely be a chatbot floating in the bottom-right corner accomplishing nothing except occupying pixels.

## Example Questions

A proprietor may ask:

> How much school fees remain outstanding this term?

> Which classes had the lowest attendance this month?

> Which students have declined academically for two consecutive terms?

> Which teachers have not completed score submission?

> Compare fee collection against the same point last session.

The system shall respond using authorised institutional data.

---

# 50. AI Capabilities

AI capabilities may progressively include:

### Academic Intelligence

- performance summaries;
- struggling-student identification;
- learning trend detection;
- intervention suggestions;
- result-comment drafting.

### Teacher Assistance

- lesson-plan drafting;
- scheme-of-work assistance;
- quiz generation;
- assessment-question generation;
- report comments.

### Administrative Intelligence

- timetable optimisation;
- document drafting;
- admission analytics;
- staff workload analysis.

### Financial Intelligence

- debtor segmentation;
- fee-collection forecasting;
- revenue trends;
- anomaly detection.

### Parent Support

A controlled AI assistant may answer common questions using approved school information.

---

# 51. AI Governance

AI-generated recommendations must be identifiable as AI generated.

AI shall not autonomously:

- expel students;
- change results;
- approve admissions;
- issue financial refunds;
- terminate employees;
- modify fee structures;
- publish report cards;
- make medical decisions.

High-impact decisions require humans.

Sensitive student information shall not be exposed to AI providers contrary to the school's privacy configuration and applicable law.

---

# 52. Early-Warning System

The platform should calculate configurable indicators for students at risk.

Signals may include:

- falling grades;
- repeated absence;
- lateness;
- missed assignments;
- disciplinary incidents.

Example:

**Academic Risk: Medium**

Reasons:

- Mathematics declined 18% across two assessments.
- Attendance dropped below school threshold.
- Four assignments were not submitted.

The purpose is intervention, not automated punishment.

---

# 53. Search

A global intelligent search shall allow authorised users to search:

- students;
- staff;
- parents;
- invoices;
- receipts;
- classes;
- documents;
- books;
- transactions.

Sensitive results must remain constrained by permissions.

---

# 54. PWA and Offline Capability

SmartSchool OS shall be installable as a Progressive Web App on supported:

- Android devices;
- desktop computers;
- tablets.

Offline-capable workflows should include selected functions such as:

- class lists;
- teacher timetable;
- attendance capture;
- draft score entry;
- lesson notes.

Information shall synchronise when internet connectivity returns.

Conflict-resolution rules must prevent offline updates from silently overwriting more recent server records.

---

# 55. User Experience Requirements

The interface shall be:

- clean;
- modern;
- responsive;
- mobile-first;
- fast;
- role-aware;
- accessible;
- simple for non-technical users.

The UI must **not resemble a cluttered ERP containing 25 sidebar items for every user**.

Navigation shall adapt by role.

### Teacher

Home  
Classes  
Attendance  
Lessons  
Assessments  
Messages

### Parent

Home  
Children  
Academics  
Payments  
Messages

### Proprietor

Overview  
Students  
Academics  
Finance  
Staff  
Analytics

Administrative modules may use more comprehensive navigation.

---

# 56. Branding

Each school should be able to configure:

- logo;
- school name;
- colours;
- report-card branding;
- receipt branding;
- email branding.

Higher subscription tiers may support:

- custom domain;
- deeper white-labelling;
- branded parent portal.

---

# 57. Notifications

Notification events may include:

- admission application received;
- admission approved;
- payment received;
- outstanding fee;
- student absent;
- student late;
- assignment published;
- result published;
- timetable change;
- emergency announcement;
- library overdue;
- transport notice;
- approval request.

Schools shall select which channels apply to each event.

---

# 58. Audit Trail

Critical operations shall record:

- user;
- action;
- timestamp;
- affected record;
- old value where appropriate;
- new value;
- IP/device context where appropriate.

Examples:

- result changed;
- payment reversed;
- student deleted/archived;
- fee waived;
- permission changed;
- report published.

Audit logs shall not be editable by ordinary school users.

---

# 59. Security Requirements

The platform shall provide:

- secure authentication;
- password hashing;
- role-based authorisation;
- tenant isolation;
- encryption in transit;
- encryption of appropriate stored sensitive data;
- session controls;
- login throttling;
- secure password recovery;
- CSRF protection where applicable;
- input validation;
- protection against common web vulnerabilities;
- security logging;
- regular backups.

Multi-factor authentication should be available for privileged users.

The Nigeria Data Protection Act explicitly requires appropriate technical and organisational measures to ensure security, integrity and confidentiality of personal information.

---

# 60. Data Privacy Requirements

The system shall support:

- privacy notices;
- guardian consent management where applicable;
- purpose limitation;
- access control;
- data minimisation;
- data-retention configuration;
- data-export workflows;
- rectification workflows;
- deletion/anonymisation workflows where legally appropriate;
- data-processing records;
- breach-management procedures.

Schools shall remain able to fulfil applicable data-subject requests.

---

# 61. Non-Functional Requirements

## Performance

Target:

- ordinary page interaction under 2 seconds under normal conditions;
- optimised mobile payloads;
- lazy loading;
- pagination for large datasets;
- asynchronous heavy report generation.

## Availability

Commercial production target:

**≥99.9% monthly service availability**, excluding planned maintenance under defined service terms.

## Scalability

The architecture should support growth from:

- one school with 150 students

to

- thousands of schools and potentially millions of student records

without redesigning the core data model.

## Responsiveness

Supported layouts:

- smartphone;
- tablet;
- laptop;
- desktop.

## Browser Support

Current mainstream versions of:

- Chrome;
- Edge;
- Firefox;
- Safari;
- Android browsers.

## Backup

Production environments shall implement automated backups with tested recovery procedures.

Backups are not considered complete merely because some cloud provider displays a green icon claiming one exists. Restore testing is required.

---

# 62. Integrations Architecture

Integrations shall use adapters rather than hardcoded vendor logic.

## Payment

- Paystack
- Monnify
- Flutterwave
- additional providers

## Communication

- SMS providers
- WhatsApp Business integrations
- email services
- push notifications

## Hardware

- biometric devices;
- RFID/NFC readers;
- card printers;
- barcode scanners.

## Future

- accounting systems;
- Google Workspace;
- Microsoft 365;
- learning-content providers;
- government/examination systems where supported.

---

# 63. Platform Super Administration

The SaaS provider shall have a separate control plane.

Platform administrators shall manage:

- schools;
- subscriptions;
- plans;
- tenants;
- storage usage;
- platform features;
- system health;
- subscription status;
- global templates;
- support requests;
- announcements;
- feature flags.

Platform Super Admin does not mean unrestricted casual access to school information.

Sensitive tenant access should require controlled support procedures and auditing.

---

# 64. Subscription and Monetisation

The platform shall support configurable subscription tiers.

Example:

### Starter

Suitable for smaller schools.

Core:

- Students
- Admissions
- Attendance
- Academics
- Results
- Fees
- Parent Portal

### Professional

Adds:

- Finance
- Advanced analytics
- Communications
- Library
- Inventory
- AI capabilities

### Enterprise

Adds:

- Multiple campuses
- Advanced reporting
- APIs
- SSO
- white labelling
- custom integrations
- enhanced support

Module-based add-ons may include:

- Payroll
- Transport
- Hostel
- CBT
- Biometrics
- Advanced AI

Pricing itself should remain configurable rather than embedded into application code.

---

# 65. MVP DEFINITION

The MVP should prove one central proposition:

> A private school can operate its essential student, academic, fee and parent processes digitally from one system.

The MVP shall therefore include the following.

## MVP Module 1: SaaS Foundation

- tenant registration;
- school profile;
- role-based access;
- users;
- campus;
- session/term configuration.

## MVP Module 2: Student Information System

- student records;
- guardians;
- classes;
- enrolment;
- promotion;
- transfer/withdrawal;
- historical records.

## MVP Module 3: Admissions

- online application;
- applicant management;
- admission decisions;
- enrolment conversion.

## MVP Module 4: Academics

- classes;
- subjects;
- curriculum;
- teacher assignment;
- timetable;
- assessment structure.

## MVP Module 5: Attendance

- manual/teacher attendance;
- attendance history;
- parent absence notification.

## MVP Module 6: Assessments and Results

- assessments;
- score entry;
- grading;
- result approval;
- report cards.

## MVP Module 7: Fees

- fee structure;
- invoicing;
- payments;
- balances;
- receipts;
- basic payment-gateway integration.

## MVP Module 8: Parent Portal

- children;
- results;
- attendance;
- fees;
- receipts;
- announcements.

## MVP Module 9: Teacher Workspace

- timetable;
- classes;
- attendance;
- scores;
- lesson records.

## MVP Module 10: Communication

- announcements;
- in-app notifications;
- email/SMS adapter.

## MVP Module 11: Basic Dashboard

- enrolment;
- attendance;
- fee collection;
- academic completion.

## MVP Module 12: Audit and Security

- RBAC;
- audit trail;
- tenant isolation;
- privacy configuration;
- backups.

---

# 66. POST-MVP ROADMAP

## Release 2 — Smart Operations

Introduce:

- advanced finance;
- inventory;
- library;
- staff management;
- curriculum tracking;
- enhanced communications;
- PWA offline workflows;
- advanced analytics.

## Release 3 — Intelligent School

Introduce:

- AI School Copilot;
- timetable optimisation;
- academic risk detection;
- lesson-plan assistant;
- automated management insights;
- fee forecasting;
- AI report commentary.

## Release 4 — Extended Campus

Introduce:

- CBT;
- transport;
- GPS integrations;
- hostel;
- clinic;
- payroll;
- biometric integrations;
- procurement.

## Release 5 — Education Ecosystem

Potentially introduce:

- school marketplace;
- digital content;
- alumni;
- school benchmarking;
- parent marketplace;
- third-party developer API;
- integrated educational services.

---

# 67. KEY USER STORIES

## School Proprietor

**As a proprietor, I want to see the current financial, academic and operational status of my school so that I can make decisions without requesting multiple reports from employees.**

### Acceptance Criteria

- Dashboard shows authorised campuses.
- Financial figures reconcile with recorded transactions.
- Attendance reflects current attendance data.
- Academic indicators identify incomplete submissions.
- User can drill down into authorised metrics.

---

## Administrator

**As an administrator, I want to configure classes, sessions, subjects and school rules so the application reflects how my school operates.**

### Acceptance Criteria

- Configuration does not require developer intervention.
- Configurations can be reused for future sessions.
- Historical sessions remain unchanged.

---

## Teacher

**As a teacher, I want to mark attendance and enter scores quickly so administrative work does not interfere with teaching.**

### Acceptance Criteria

- Teacher sees only assigned classes/subjects.
- Attendance works effectively on mobile.
- Scores can be saved as drafts.
- Validation identifies missing or invalid scores.
- Submitted scores become read-only unless reopened.

---

## Parent

**As a parent, I want one account where I can monitor all my children so that I do not have to contact the school for routine information.**

### Acceptance Criteria

- One guardian account supports multiple students.
- Guardian sees only authorised children.
- Guardian can see outstanding fees.
- Guardian can access published results.
- Guardian receives configured notifications.

---

## Bursar

**As a bursar, I want payments automatically reconciled against student invoices so that I can accurately identify outstanding fees.**

### Acceptance Criteria

- Verified online payments update appropriate ledgers.
- Duplicate gateway callbacks do not create duplicate payments.
- Partial payment is supported.
- Receipts have unique references.
- Reversals are audited.

---

# 68. HIGH-LEVEL DATA ENTITIES

Core entities should include:

### Organisation

- Tenant
- School
- Campus
- Subscription

### Identity

- User
- Role
- Permission

### Academic

- Session
- Term
- School Level
- Class
- Arm
- Subject
- Curriculum
- Curriculum Version
- Teacher Assignment
- Timetable

### People

- Student
- Guardian
- Staff
- Student-Guardian Relationship

### Academic Records

- Assessment
- Score
- Grade
- Result
- Report Card
- Attendance
- Lesson Plan
- Assignment

### Finance

- Fee Structure
- Invoice
- Invoice Item
- Payment
- Discount
- Scholarship
- Refund
- Expense

### Communication

- Announcement
- Message
- Notification

### Governance

- Audit Event
- Approval
- Consent Record
- Document

This model shall preserve historical relationships rather than overwriting previous academic states.

---

# 69. BUSINESS RULES

The following fundamental rules apply:

**BR-001:** Every operational record belongs to a tenant.

**BR-002:** Users may access only authorised tenant/campus data.

**BR-003:** Academic history cannot be overwritten during promotion.

**BR-004:** Published results cannot be modified without reopening and audit.

**BR-005:** Financial transactions cannot be silently deleted.

**BR-006:** Payment gateway callbacks must be idempotent.

**BR-007:** A parent may have multiple students.

**BR-008:** A student may have multiple authorised guardians.

**BR-009:** Assessment structures are configurable by school/session/class where authorised.

**BR-010:** Curriculum rules must support versions.

**BR-011:** External-examination rules must be configurable by examination year.

**BR-012:** Sensitive information requires additional access controls.

**BR-013:** AI cannot bypass standard permission rules.

**BR-014:** Offline synchronisation cannot silently overwrite newer records.

**BR-015:** Tenant administrators cannot access another tenant.

---

# 70. REPORTING REQUIREMENTS

Standard reports should include:

### Student Reports

- student register;
- enrolment by class;
- gender distribution;
- student movement;
- attendance;
- promotion;
- graduation.

### Academic Reports

- subject performance;
- class performance;
- assessment completion;
- missing scores;
- grade distribution;
- curriculum coverage.

### Financial Reports

- fee collection;
- outstanding fees;
- student statements;
- payment history;
- discounts;
- scholarships;
- income;
- expenses.

### Operational Reports

- staff attendance;
- teacher workload;
- library activity;
- inventory;
- incidents.

Reports shall support appropriate:

- filtering;
- printing;
- PDF export;
- spreadsheet export.

---

# 71. SEARCH AND FILTERING REQUIREMENTS

Large tables shall support:

- search;
- pagination;
- filtering;
- sorting.

Administrators must not scroll through 4,000 students hoping their eyes eventually encounter "Adebayo".

Common filters should include:

- campus;
- session;
- term;
- class;
- status;
- gender;
- date;
- payment status.

---

# 72. ERROR HANDLING

User-facing errors shall be understandable.

Instead of:

> SQLSTATE[23000]

the product should display:

> This admission number is already assigned to another student.

Technical diagnostic details shall be logged internally without exposing sensitive implementation information.

---

# 73. Accessibility

The system should support:

- sufficient colour contrast;
- keyboard navigation;
- readable typography;
- labelled form controls;
- scalable text;
- understandable validation;
- screen-reader-compatible core workflows where practical.

Colour alone shall not represent academic or financial status.

---

# 74. Success Metrics

## Commercial Metrics

- schools onboarded;
- subscription conversion;
- monthly recurring revenue;
- renewal rate;
- tenant churn.

## Adoption Metrics

- active administrators;
- active teachers;
- active parents;
- parent login rate;
- digital payment adoption;
- percentage of attendance recorded digitally.

## Operational Metrics

- result-processing turnaround;
- fee reconciliation time;
- admission processing time;
- administrative task completion.

## Product Quality

- uptime;
- application error rate;
- page performance;
- support requests per school;
- payment reconciliation failures.

## Academic/Management Value

- curriculum coverage visibility;
- attendance intervention rate;
- result submission completion;
- management report usage.

---

# 75. Key Product Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Excessive product scope | High | Strict MVP boundaries and modular releases |
| Poor internet connectivity | High | PWA, caching and offline workflows |
| Low digital literacy | High | Role-specific UX and onboarding |
| Privacy breaches | Critical | Privacy-by-design and security controls |
| Payment reconciliation errors | Critical | Verified callbacks, idempotency and audit |
| Schools having different processes | High | Configuration engine |
| Curriculum changes | High | Versioned curriculum |
| Examination rule changes | High | Versioned examination configurations |
| AI inaccuracies | Medium/High | Human approval and traceability |
| Hardware dependency | Medium | Optional adapter-based hardware modules |
| Poor migration from spreadsheets | High | Import templates and validation |
| Tenant data leakage | Critical | Strong tenant isolation and testing |

---

# 76. Data Migration

School onboarding shall support structured imports for:

- students;
- guardians;
- staff;
- classes;
- subjects;
- opening fee balances.

Import workflows shall provide:

1. downloadable spreadsheet template;
2. upload;
3. field mapping where required;
4. validation;
5. error report;
6. preview;
7. confirmation;
8. import.

Invalid records should not silently enter the production database.

---

# 77. Onboarding Experience

School onboarding should behave like a guided implementation assistant.

### Step 1
Create School

### Step 2
Create Campus

### Step 3
Configure Academic Session

### Step 4
Configure Classes

### Step 5
Configure Subjects

### Step 6
Configure Assessments

### Step 7
Configure Fees

### Step 8
Import Students

### Step 9
Invite Staff

### Step 10
Launch Parent Access

Dashboard shall display onboarding progress until critical setup is completed.

---

# 78. Product Differentiators

SmartSchool OS should compete through integration and intelligence rather than merely feature count.

Its central differentiators should be:

### Nigerian Education Native

Designed around Nigerian private-school operations and configurable curriculum requirements.

### True School Operating System

Admissions, academics, parents, finance and operations operate from one data model.

### Multi-Tenant SaaS

Designed for commercial deployment across many independent schools.

### Multi-Campus

A school group can manage multiple campuses from one organisation.

### Offline-Friendly

Critical teacher functions can tolerate unreliable connectivity.

### Intelligent

AI and analytics convert operational information into management insight.

### Parent-Centric

One guardian account provides consolidated visibility across children.

### Configuration-Driven

School rules can change without software modifications.

### Integration-Ready

Payments, communications and hardware use replaceable adapters.

### Audit-Ready

Important financial and academic operations are traceable.

---

# 79. MVP DEFINITION OF DONE

The MVP shall not be considered production-ready until the following scenario can be completed end-to-end:

A new school registers.

→ Configures its school and academic session.

→ Creates classes and subjects.

→ Imports students and guardians.

→ Creates staff accounts.

→ Assigns teachers.

→ Configures assessments.

→ Configures fees.

→ Generates student invoices.

→ Parent logs in.

→ Parent pays school fees.

→ Payment is reconciled.

→ Teacher records attendance.

→ Parent receives attendance information.

→ Teacher enters scores.

→ Examination officer validates results.

→ Principal approves results.

→ Results are published.

→ Parent views/downloads report card.

→ Administrator promotes students into the next session.

→ Historical information remains intact.

→ Proprietor sees updated operational and financial dashboards.

If this complete workflow is unreliable, adding facial recognition, AI-generated lesson plans and animated dashboards merely produces a more technologically sophisticated broken school system.

---

# 80. Recommended Product Navigation

## Platform Owner

- Overview
- Schools
- Subscriptions
- Plans
- Usage
- Support
- Platform Configuration
- Audit
- System Health

## School Administrator

- Home
- Students
- Admissions
- Academics
- Attendance
- Finance
- Staff
- Communication
- Operations
- Reports
- Settings

## Teacher

- Home
- My Classes
- Attendance
- Lessons
- Assessments
- Students
- Messages

## Parent

- Home
- My Children
- Academics
- Attendance
- Payments
- Messages
- More

## Student

- Home
- Classes
- Assignments
- Results
- Attendance
- Learning
- Messages

---

# 81. Product Boundary

SmartSchool OS should **not** begin as an attempt to replace every educational technology product.

The core product owns:

**Student Lifecycle + Academic Operations + Financial Operations + School/Parent Engagement + Management Intelligence.**

Functions such as:

- payroll;
- hostel;
- transport;
- CBT;
- procurement;
- sophisticated accounting;
- biometric hardware;
- full LMS;

should integrate naturally with the core but remain independently deployable modules.

This modular boundary is essential to prevent the system from becoming difficult to maintain, expensive to deploy and overwhelming for smaller schools.

---

# 82. Strategic Product Architecture

Conceptually, the product should be organised into six capability layers:

## Layer 1 — Identity & Organisation

Tenant  
Campus  
Users  
Roles  
Permissions  
Subscriptions

↓

## Layer 2 — People

Students  
Parents  
Staff

↓

## Layer 3 — Core School Operations

Admissions  
Academics  
Attendance  
Assessments  
Fees

↓

## Layer 4 — Extended Operations

Library  
Transport  
Hostel  
Health  
HR  
Payroll  
Inventory

↓

## Layer 5 — Engagement

Parent Portal  
Student Portal  
Communication  
Notifications  
PWA

↓

## Layer 6 — Intelligence

Analytics  
Early Warning  
AI Copilot  
Forecasting  
Executive Intelligence

The lower layers establish reliable data.

The intelligence layer interprets that data.

This prevents the common mistake of building "AI features" on top of inconsistent school records.

---

# 83. Final Product Proposition

SmartSchool OS shall evolve from a traditional **School Management System** into a genuine **School Management Operating System**.

A traditional system answers:

> Where is this student's result?

SmartSchool OS should also answer:

> Why is this student's performance deteriorating?

A traditional system answers:

> How much has this parent paid?

SmartSchool OS should also answer:

> Which outstanding balances are most likely to remain unpaid before the end of term?

A traditional system answers:

> Which students were absent?

SmartSchool OS should also answer:

> Which students are developing persistent attendance problems?

A traditional school portal stores information.

**SmartSchool OS should coordinate school operations, connect stakeholders and transform institutional data into decisions.**

That is the product standard around which subsequent requirements, architecture, UI/UX, user stories and development backlog should be built.
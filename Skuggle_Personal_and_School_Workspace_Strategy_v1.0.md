---
title: Skuggle Personal and School Workspace Strategy
version: "1.0"
date: 2026-08-27
status: Product experience clarification
applies_to: Skuggle frontend product interface and implementation specification
---

# Skuggle Personal and School Workspace Strategy

## Purpose

This document defines the product, ownership, data and experience boundaries between Skuggle personal workspaces and school workspaces. It explains the problems each workspace solves, why teachers, parents and students should use Skuggle without first joining a school, what belongs in each workspace, what must remain outside it and the recurring value that should bring users back.

> **Core product rule:** A personal workspace is owned by the individual and remains with the individual throughout their journey. A school workspace is owned and governed by the school and contains official institutional records.

If a personal workspace is only an empty school dashboard waiting for an invitation, it has no independent product value. It must solve meaningful personal problems before a school connection exists.

# 1. Personal workspace versus school workspace

| Area | Personal workspace — **My Skuggle** | School workspace — **[School Name]** |
|---|---|---|
| Owner | Individual user | Registered school tenant |
| Primary purpose | Personal growth, planning, learning and resource management | Official school operations, teaching, communication and record management |
| Branding | Skuggle branding and user preferences | School logo, name and approved colours |
| Data controller | User controls personal content | School controls institutional records |
| Access | Available without joining a school | Requires invitation, credentials or authorised membership |
| Portability | Remains when the user changes or leaves a school | Access depends on active school membership |
| Records | Personal drafts, goals, practice, resources and portfolio | Official attendance, assessments, results, fees, classes and communications |
| Visibility | Private unless the user deliberately shares something | Visible according to school roles and permissions |
| Administration | No school-management controls | Role-based administrative and academic controls |
| Workspace ending | Continues until the user deletes the account | School access ends when membership is suspended or removed |
| Source of truth | Personal development and learning activity | Official school and academic records |

## 1.1 Interface rules that reinforce the distinction

- Name the personal workspace **My Skuggle**.
- Name school destinations using the tenant name and role, such as **Adunni Academy — Teacher**.
- Use the user's avatar and neutral Skuggle identity in My Skuggle.
- Use the school logo, name and approved colours in the school workspace.
- Keep a persistent workspace indicator visible throughout authenticated experiences.
- Show whether the current destination is personal or school-owned.
- When switching workspaces, clear school-specific filters, cached records and permission state before loading the new context.
- Never infer a tenant from a user-entered school name.

# 2. Why users will use Skuggle without joining a school

## 2.1 Teachers

Teachers have professional problems outside any particular school:

- Lesson preparation consumes significant time.
- Curriculum materials are scattered across notebooks, WhatsApp, cloud drives and websites.
- Teachers repeatedly recreate lesson notes, questions, assessments and resources.
- Professional portfolios, certificates and development records are difficult to organise.
- Useful teaching resources are often lost when a teacher changes school.
- Private tutors need planning and resource-management tools.
- Teachers need curriculum-grounded AI assistance while retaining professional control.

My Skuggle should help a teacher become a more organised and capable educator even when no school uses Skuggle.

## 2.2 Parents

Parents have family-learning problems that exist independently of schools:

- Homework, study routines and extracurricular activities are difficult to coordinate.
- Parents may not know how to explain difficult topics to their children.
- Information for several children is scattered across schools and communication channels.
- Academic weaknesses are often discovered only when report cards arrive.
- Parents need practical guidance without complex educational terminology.
- Families need reminders, learning goals and consistent study routines.

My Skuggle should work as a family learning companion before any child is connected to a school tenant.

## 2.3 Students

Students need personal learning support beyond official school records:

- They may not fully understand classroom explanations.
- They often do not know what to revise next.
- Personal notes and learning materials are disorganised.
- Scores do not always explain strengths, weaknesses or next steps.
- Students need practice adapted to their curriculum, class and ability.
- Their useful learning history normally disappears when they change schools.
- They need motivation based on meaningful progress rather than marks alone.

My Skuggle should become a portable learning and improvement space that can remain useful across different schools.

# 3. What belongs in the personal workspace

## 3.1 Teacher personal workspace

### Include

- Personal home and daily teaching planner
- AI-assisted lesson preparation
- Curriculum and lesson-resource library
- Personal question bank
- Personal assessment drafts
- Teaching timetable and reminders
- Professional-development goals
- Certificates and training records
- Portable teaching portfolio
- Private notes and reflections
- Reusable teaching templates
- Subject and curriculum preferences
- Private tutoring or home-lesson tools
- AI buddy for teaching ideas and explanations
- Invitations to join schools
- Connected-school cards
- Controlled option to copy a selected personal resource into a school workspace

### Exclude

- Official school attendance
- School-owned class lists
- Official examination scores
- Result approval or publication
- School payroll information
- School financial reports
- Staff administration
- Parent contact lists obtained from a school
- School disciplinary records
- Confidential cross-school learner comparisons
- Automatic school access based on a typed school name

Personal lesson drafts must remain private until the teacher deliberately submits or copies them into a school workspace.

## 3.2 Parent personal workspace

### Include

- Family dashboard
- User-created child profiles
- Homework and study planner
- Family learning timetable
- Learning goals for each child
- Personal reminders
- AI explanations for homework topics
- Age-appropriate learning recommendations
- Reading and activity library
- Parent guidance resources
- Personally uploaded learning documents
- Invitations from schools
- Connected-school cards
- Weekly family progress summary
- Notification and consent controls

### Exclude

- Unverified access to a child's school record
- Official attendance from an unconnected school
- Official results or report cards without authorisation
- School fee balances without a valid relationship
- Teacher contact information obtained outside school permissions
- Administrative controls over a school
- Public comparison of children
- Advertising-driven profiling of children
- Public child profiles

Creating a personal child profile with the same name as a school student must never automatically link the records.

## 3.3 Student personal workspace

### Include

- Personal learning dashboard
- Subject and curriculum preferences
- Daily learning plan
- Assignment and revision planner
- Private notes
- Independent practice questions
- AI explanations and guided tutoring
- Progress by topic
- Strengths and improvement areas
- Learning goals
- Personal resource library
- Achievements and healthy learning streaks
- Portable skills and project portfolio
- School invitation or connection path
- Age-appropriate privacy and parental-consent controls

### Exclude

- Self-entered records presented as official school results
- Unauthorised access to school classes
- Official attendance modification
- Teacher or parent impersonation
- Public ranking of children
- Public messaging with unknown adults
- School disciplinary records outside the school workspace
- Manipulative streaks, gambling-style rewards or advertisements
- Unmoderated AI answers presented as authoritative teaching

# 4. What belongs in the school workspace

The school workspace is the tenant's operational, academic and communication environment.

## 4.1 School administration

- School profile and branding
- Campuses and academic sessions
- Terms, levels, classes, arms and subjects
- Admissions and official student records
- Guardians and verified relationships
- Staff records and assignments
- Invitations and temporary credentials
- Roles and permissions
- Attendance configuration
- Assessment structures
- Fees and payments
- Announcements and communication
- Reports, audit logs and compliance
- Subscription and entitlement management

## 4.2 Principal or Headmaster

- Academic-performance overview
- Curriculum coverage
- Attendance trends
- Teacher activity and submission status
- Learners requiring intervention
- Result-review and approval queues
- Class and subject comparisons
- School-improvement actions
- Staff communication
- Authorised reports

## 4.3 Teacher school workspace

- Assigned classes and subjects
- Official class lists
- School timetable
- Attendance
- School lesson-plan submission
- Assignments
- Assessments and official score entry
- Marking queues
- Student performance
- Parent or class communication
- Result submission
- School-authorised AI assistance

## 4.4 Parent school workspace

- Connected children
- Official attendance
- Assignments and school activities
- Published results
- Fees and receipts
- Announcements
- Consent requests
- Teacher messages
- Appointments and school requests

## 4.5 Student school workspace

- School timetable
- Assigned lessons and learning materials
- Assignments
- Assessments
- Teacher feedback
- Published results
- School announcements
- Class activities
- Attendance summary
- School-based learning progress

# 5. What must not enter the school workspace automatically

Joining a school grants a membership. It does not transfer ownership of the user's personal workspace.

The school must not automatically receive:

- A teacher's private AI conversations
- Personal lesson drafts that were never submitted
- A teacher's job-search activity
- Private tutoring clients
- A parent's unrelated family information
- Information about children who do not attend the school
- A student's private notes
- Independent practice history unless the student deliberately shares it
- Personal browsing or search history
- Data owned by another school
- Cross-school personal-workspace activity
- Private goals unrelated to the school
- Personal documents not deliberately submitted

# 6. Controlled movement between workspaces

Information must never flow silently between personal and school workspaces.

| Action | Required behaviour |
|---|---|
| Teacher copies a lesson into a school | Create a school-owned copy and preserve the private original |
| Student submits personal work | Show exactly what will be shared before submission |
| Parent links a child | Require an invitation or authorised relationship code |
| School publishes a result | Keep the official result in the school workspace |
| User leaves a school | Remove tenant access while preserving eligible user-owned content |
| Teacher changes schools | Do not transfer the former school's students, scores or records |
| Personal resource is reused | Copy only the selected resource, not the entire personal library |
| School membership is revoked | Clear school caches and prevent further tenant requests |

# 7. Pain points Skuggle solves

Skuggle should solve seven central problems.

## 7.1 Administrative fragmentation

Schools rely on disconnected spreadsheets, paper, messaging applications and independent systems. Skuggle provides one governed operating environment.

## 7.2 Teacher workload

Teachers repeatedly prepare lessons, questions, assessments and reports manually. Skuggle provides reusable resources, structured workflows and human-controlled AI assistance.

## 7.3 Slow assessment cycles

Paper examinations take too long to mark, record, approve and publish. Skuggle supports configurable assessments, guarded score workflows and SmartMark-assisted paper processing.

## 7.4 Late performance intervention

Parents and school leaders often discover problems after a learner has already fallen behind. Skuggle turns authorised data into understandable, role-specific attention signals.

## 7.5 Poor parent visibility

Parents lack a simple and timely view of attendance, fees, assignments, school requests and progress. Skuggle provides a child-centred parent experience without administrative clutter.

## 7.6 Student learning uncertainty

Students know their scores but may not understand their weaknesses or next steps. Skuggle provides explanations, practice, goals and progress guidance.

## 7.7 Loss of continuity

Teachers and students lose useful resources, portfolios and development history when changing schools. My Skuggle preserves eligible user-owned learning and professional assets.

> The school workspace solves institutional coordination. My Skuggle solves personal continuity and growth.

# 8. Why users will keep returning

Retention must come from recurring usefulness rather than notifications, badges or animations alone.

| Frequency | Teacher | Parent | Student |
|---|---|---|---|
| Daily | Classes, lesson planning, attendance, marking and AI assistance | Homework, reminders and child updates | Learning plan, practice, assignments and feedback |
| Weekly | Preparation summary and professional goals | Family progress digest and upcoming actions | Progress review and recommended focus topics |
| Termly | Assessment preparation and performance analysis | Results, fees and teacher feedback | Examination preparation and report explanation |
| Long term | Portable resources, portfolio and professional development | Multi-child learning history | Skills, achievements and learning portfolio |

## 8.1 Retention mechanisms

- A useful **Continue where you stopped** experience
- Personal resources that become more valuable over time
- Clear daily next actions
- Weekly progress summaries
- Timely and relevant school alerts
- Personalised rather than generic AI assistance
- Seamless switching between My Skuggle and school workspaces
- Reliable offline drafts and synchronisation
- Trust that personal information will not silently enter school records
- Meaningful achievements based on learning and task completion
- Free tools that remain useful without forcing immediate payment

# 9. Recommended free personal value

The free personal workspace should provide enough recurring value to generate organic adoption.

## 9.1 Free capabilities

- Account and personal profile
- One My Skuggle workspace
- Basic planner and reminders
- Limited AI lesson or learning assistance
- Personal resource library with reasonable storage
- Basic learning or professional goals
- Basic progress tracking
- Teaching or student portfolio
- School invitation acceptance
- Connected-school switching
- Essential notifications
- Privacy, recovery and security features
- Export of user-owned personal information

## 9.2 Paid personal capabilities

- Higher AI usage limits
- Advanced personalised learning plans
- Deeper progress analysis
- Larger storage allowance
- Premium curriculum resources
- Advanced portfolio features
- Tutor or home-lesson management
- Family-wide insights
- Advanced question generation
- Premium professional-development tools

## 9.3 School-plan capabilities

Official school operations, bulk records, institutional attendance, result workflows, finance, staff management, SmartMark, institutional analytics, governance and advanced integrations belong to school plans.

# 10. Final product position

> Users may first come to Skuggle because their school requires it, but they should remain because My Skuggle continues helping them teach, parent or learn—even after they leave that school.


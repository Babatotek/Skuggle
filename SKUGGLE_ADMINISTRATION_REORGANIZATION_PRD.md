# Skuggle Administration Module Reorganization PRD

**Product:** Skuggle  
**Area:** School Tenant Workspace  
**Module:** Administration  
**Document Type:** Product Requirements Document (PRD)  
**Primary Audience:** AI Coding Agent, Product Engineer, Frontend Engineer, Backend Engineer, QA Engineer  
**Status:** Implementation Specification  
**Version:** 1.0

---

## 1. Purpose

The current Administration area has become difficult to understand and operate because administrative capabilities are scattered across:

- Long horizontal tab lists
- Repeated vertical navigation items
- Duplicate links to the same or similar functions
- Mixed operational and configuration features
- Unclear ownership of settings
- Multiple entry points to the same capability
- Inconsistent grouping and naming
- Deep navigation structures that make simple configuration tasks difficult

This PRD defines a new Administration information architecture that consolidates school configuration and administrative controls into one coherent, predictable, scalable administration workspace.

The goal is not to remove valid capabilities. The goal is to give every administrative capability one clear home.

---

# 2. Product Goal

Create a clean Administration Control Centre where a School Super Admin can configure, govern, secure, and manage the school tenant without navigating through duplicate menus, oversized tab bars, or conflicting layouts.

The Administration area must feel like a structured control centre, not a collection of unrelated pages.

---

# 3. Core Design Principle

> One capability must have one canonical location.

The redesigned Administration module must ensure:

1. One Administration entry point.
2. One clear internal navigation hierarchy.
3. No duplicate horizontal and vertical navigation for the same feature.
4. Major administrative capabilities must not be represented as long horizontal tab lists.
5. Horizontal tabs must only be used for closely related views inside a single administrative capability.
6. Operational modules must not be duplicated inside Administration.
7. Administration must focus on configuration, governance, access, workflow, integrations, and system controls.
8. Existing functionality should be preserved unless explicitly deprecated during audit.
9. Existing conflicting routes, menus, pages, and layouts must be identified before deletion.
10. No feature should be deleted simply because it appears duplicated without first establishing its canonical destination.

---

# 4. Target Administration Structure

The Administration module must be reorganized into the following top-level administrative domains:

```text
ADMINISTRATION
School configuration and administrative controls

├── School Setup
├── Academic Structure
├── People & Access
├── Forms & Records
├── Workflow & Automation
├── Communication Setup
├── Integrations
├── Governance
└── System
```

Each domain represents a specific administrative responsibility.

---

# 5. Administration Landing Page

## 5.1 Purpose

Clicking **Administration** from the main application navigation must open an Administration landing page rather than immediately exposing dozens of tabs.

The page should act as the administrative control centre.

## 5.2 Required Header

Display:

**Administration**

Supporting text:

> School configuration and administrative controls

Optional secondary information may include:

- Tenant/school name
- Current campus context
- Current academic session
- Administrative alerts
- Pending configuration actions

These must remain secondary and must not clutter the interface.

---

# 6. Administration Landing Page Categories

The landing page must display the following administrative categories.

## 6.1 School Setup

**Purpose:** Manage the school's institutional identity and core configuration.

### Capabilities

- School profile
- School legal/business information
- School contact information
- Campuses / branches
- Branding
- School logo
- School colours
- Address information
- Localization
- Country
- State / region
- Timezone
- Currency
- Date format
- Basic school preferences

### Example description

> Profile, campuses, branding and basic configuration.

---

## 6.2 Academic Structure

**Purpose:** Configure the academic framework upon which operational academic modules depend.

### Capabilities

- Academic sessions
- Terms / semesters
- Classes
- Arms / sections
- Subjects
- Departments
- Grade levels
- Academic structure hierarchy
- Active academic session configuration
- Promotion structure
- Class-subject relationships
- Academic calendars where applicable

### Important Boundary

This section configures academic structure.

It must NOT duplicate day-to-day academic operations such as:

- Teaching
- Lesson delivery
- Assignments
- Examination operations
- Result processing
- Teacher lesson plans
- Student academic performance

Those belong to their respective operational modules.

### Example description

> Sessions, terms, classes, arms and subjects.

---

## 6.3 People & Access

**Purpose:** Manage application identities, roles, permissions and access control within the school tenant.

### Capabilities

- Users
- User accounts
- Invitations
- Account activation
- Account suspension
- Roles
- Permissions
- Role assignment
- Access policies
- Role templates
- Login/access restrictions
- Administrative delegation
- Campus-level access where applicable

### Important Boundary

This area manages system access.

It must NOT duplicate:

- Student profiles
- Teacher profiles
- Staff records
- Parent/guardian profiles

Those belong to their operational people modules.

For example:

- Student profile belongs to Students.
- Teacher profile belongs to Staff/Teachers.
- User login permission belongs to People & Access.

### Example description

> Users, roles, permissions and invitations.

---

## 6.4 Forms & Records

**Purpose:** Configure reusable forms, custom fields, numbering systems and administrative record structures.

### Capabilities

- Custom fields
- Form builder
- Form configuration
- Form field visibility
- Required/optional fields
- Conditional fields
- Field groups
- Jurisdiction-specific fields
- NIN or government identification fields
- Custom validation rules
- Record numbering
- Admission ID configuration
- Staff ID configuration
- Student ID configuration
- Document requirements
- Form templates
- Metadata schemas

### Design Requirement

Custom fields must be reusable across supported Skuggle entities, including:

- Students
- Teachers
- Staff
- Parents/guardians
- Admissions
- Finance records
- Other supported records

The configuration interface should be non-technical and usable by school administrators.

### Example description

> Custom fields, form configuration and record identifiers.

---

## 6.5 Workflow & Automation

**Purpose:** Configure administrative workflows, approvals, triggers and automation.

### Capabilities

- Approval workflows
- Approval stages
- Approvers
- Conditional approvals
- Process rules
- Workflow triggers
- Automated actions
- Escalation rules
- Approval delegation
- Workflow templates
- Status transitions
- Notifications triggered by workflows
- Audit history for workflow changes

### Important Boundary

This area configures workflows.

Actual operational tasks and work items should remain inside the appropriate operational module.

### Example description

> Approvals, processes, rules and automation.

---

## 6.6 Communication Setup

**Purpose:** Configure how the school communicates through Skuggle.

### Capabilities

- Notification templates
- Email templates
- SMS templates
- Push notification templates
- Communication preferences
- Sender identities
- Notification channels
- Event-triggered messages
- Announcement defaults
- Parent communication settings
- Student communication settings
- Staff communication settings
- Delivery rules
- Communication branding

### Important Boundary

This section configures communication.

Actual messaging, announcements, inboxes and conversations belong to the Communication operational module.

### Example description

> Templates, notification configuration and communication rules.

---

## 6.7 Integrations

**Purpose:** Manage third-party services and external system connections.

### Capabilities

- API integrations
- Payment gateways
- SMS gateways
- Email providers
- Authentication providers
- Storage integrations
- Learning integrations
- Accounting integrations
- External data services
- Webhooks
- API credentials
- Integration status
- Connection testing
- Integration logs
- Integration enable/disable controls

### Security Requirement

Sensitive credentials must never be displayed in plaintext after initial entry.

Secrets must be securely stored and masked.

### Example description

> External services, APIs and connected applications.

---

## 6.8 Governance

**Purpose:** Provide security, accountability, auditability and administrative oversight.

### Capabilities

- Audit logs
- Security policies
- Access history
- Login history
- Administrative activity logs
- Sensitive action logs
- Data access logs
- Policy configuration
- Session management
- Device/session controls where supported
- Compliance settings
- Data retention policies
- Administrative governance rules

### Example description

> Audit logs, security controls and policies.

---

## 6.9 System

**Purpose:** Provide advanced tenant-level administrative and maintenance functions.

### Capabilities

- Data import
- Data export
- Backup-related controls where supported
- Data migration tools
- Advanced preferences
- Feature configuration
- System defaults
- Number formatting
- General system behaviour
- Tenant-wide settings
- Data cleanup tools where safe
- Maintenance utilities
- Advanced administrative controls

### Example description

> Imports, exports and advanced system settings.

---

# 7. Navigation Architecture

## 7.1 Main Rule

The Administration module must use one consistent internal navigation system.

The implementation must NOT maintain a long vertical menu and a long horizontal menu containing equivalent or overlapping items.

## 7.2 Recommended Pattern

Use:

```text
Main Application Navigation
        ↓
Administration
        ↓
Administration Category
        ↓
Capability
        ↓
Capability-specific views/tabs
```

Example:

```text
Administration
    ↓
People & Access
    ↓
Roles
    ↓
General | Permissions | Members | History
```

This is acceptable because the horizontal tabs are views of one capability: Roles.

---

# 8. Horizontal Tab Rules

Horizontal tabs may only be used when all tabs belong to the same capability.

## Good Example

```text
People & Access > Users

All Users | Invitations | Suspended | Activity
```

## Good Example

```text
Governance > Security

Policies | Sessions | Login History | Devices
```

## Bad Example

```text
Administration

School | Students | Teachers | Subjects | Fees | Roles | Forms |
Sessions | Terms | Permissions | Workflow | Security | Settings
```

The above pattern is prohibited.

## Maximum Guideline

A capability should generally contain no more than 4–6 primary horizontal tabs.

If more are required, the agent must review whether the capability should be separated into sub-capabilities instead of adding more tabs.

---

# 9. Vertical Navigation Rules

The Administration vertical navigation must display administrative domains or capabilities, not every possible page in the module.

Recommended structure:

```text
Administration

Overview

ORGANISATION
  School Setup
  Academic Structure

ACCESS & DATA
  People & Access
  Forms & Records

AUTOMATION & COMMUNICATION
  Workflow & Automation
  Communication Setup

CONTROL
  Integrations
  Governance
  System
```

Alternative presentation styles such as cards, grouped menu sections or responsive drawers are permitted, provided the information architecture remains unchanged.

---

# 10. Administration Landing Page UX

The Administration landing page should present category cards or structured list items.

Each category must show:

- Icon
- Category name
- One-line description
- Optional summary/status
- Click-through action

Example:

```text
┌──────────────────────────────────────┐
│ School Setup                         │
│ Profile, campuses, branding and      │
│ basic configuration.                 │
└──────────────────────────────────────┘
```

The screen should avoid overwhelming the administrator with sub-pages before a category is selected.

---

# 11. Search

Administration should support search if the current application architecture allows it.

Example search:

```text
Search Administration...
```

Searching for:

`permission`

may return:

```text
People & Access > Roles > Permissions
People & Access > Access Policies
Governance > Access History
```

Search should navigate to the canonical feature location.

It must not expose duplicate legacy destinations.

---

# 12. Breadcrumbs

All Administration pages below the landing page should provide clear breadcrumbs.

Example:

```text
Administration / People & Access / Roles / School Admin
```

Example:

```text
Administration / Academic Structure / Sessions
```

Breadcrumbs must reflect the canonical information architecture.

---

# 13. Operational Module Separation

The agent must distinguish between:

1. Operational functions
2. Administrative configuration

Administration must not become a duplicate route to operational modules.

## Example: Students

Operational:

```text
Students
├── Student Directory
├── Admissions
├── Enrolment
├── Profiles
└── Transfers
```

Administrative configuration:

```text
Administration
└── Forms & Records
    ├── Student Custom Fields
    ├── Admission ID Rules
    ├── Required Documents
    └── Admission Form Configuration
```

---

# 14. Canonical Ownership Rules

Each capability must have one canonical owner.

Examples:

| Capability | Canonical Area |
|---|---|
| School branding | Administration > School Setup |
| Campuses | Administration > School Setup |
| Academic sessions | Administration > Academic Structure |
| Terms | Administration > Academic Structure |
| Classes & arms configuration | Administration > Academic Structure |
| Subjects configuration | Administration > Academic Structure |
| Student operational records | Students |
| Staff operational records | Staff |
| User accounts | Administration > People & Access |
| Roles | Administration > People & Access |
| Permissions | Administration > People & Access |
| Custom fields | Administration > Forms & Records |
| Form configuration | Administration > Forms & Records |
| Workflow configuration | Administration > Workflow & Automation |
| Notification templates | Administration > Communication Setup |
| Messaging | Communication |
| Integrations | Administration > Integrations |
| Audit logs | Administration > Governance |
| Security policies | Administration > Governance |
| Import/export | Administration > System |

---

# 15. Duplicate Capability Policy

The implementation must identify duplicate or overlapping administrative functions.

Every duplicate must receive one of the following actions:

- KEEP
- MOVE
- MERGE
- RENAME
- RETIRE

No duplicate capability may remain simply because two legacy screens already exist.

---

# 16. Legacy Route Policy

Before modifying or deleting a route, the agent must determine:

- Existing route
- Current component
- Current API dependencies
- Current permission requirements
- Whether other modules link to it
- Whether bookmarks/deep links may exist
- Target canonical route

Where appropriate, legacy routes should redirect to the new canonical location.

Example:

```text
Old:
/settings/roles
/admin/role-management
/users/permissions

Target:
/administration/people-access/roles
```

Legacy URLs may redirect rather than immediately returning 404.

---

# 17. Proposed Route Convention

Recommended route structure:

```text
/administration

/administration/school-setup
/administration/school-setup/profile
/administration/school-setup/campuses
/administration/school-setup/branding
/administration/school-setup/localization

/administration/academic-structure
/administration/academic-structure/sessions
/administration/academic-structure/terms
/administration/academic-structure/classes
/administration/academic-structure/subjects
/administration/academic-structure/departments

/administration/people-access
/administration/people-access/users
/administration/people-access/roles
/administration/people-access/permissions
/administration/people-access/invitations

/administration/forms-records
/administration/forms-records/custom-fields
/administration/forms-records/forms
/administration/forms-records/identifiers

/administration/workflow-automation
/administration/workflow-automation/workflows
/administration/workflow-automation/approvals
/administration/workflow-automation/rules

/administration/communication-setup
/administration/communication-setup/templates
/administration/communication-setup/notifications

/administration/integrations

/administration/governance
/administration/governance/audit-logs
/administration/governance/security
/administration/governance/policies

/administration/system
/administration/system/import
/administration/system/export
/administration/system/advanced-settings
```

The existing codebase may use another route naming standard.

The agent should follow the established application conventions while preserving the target hierarchy.

---

# 18. Permission Model

Administration must remain permission-aware.

The School Super Admin should have comprehensive tenant-level administrative access unless explicitly constrained by platform-level policy.

Other roles may receive delegated access.

Example permissions:

```text
administration.view

administration.school_setup.view
administration.school_setup.manage

administration.academic_structure.view
administration.academic_structure.manage

administration.people_access.view
administration.people_access.users.manage
administration.people_access.roles.manage
administration.people_access.permissions.manage

administration.forms_records.view
administration.forms_records.manage

administration.workflow.view
administration.workflow.manage

administration.communication_setup.view
administration.communication_setup.manage

administration.integrations.view
administration.integrations.manage

administration.governance.view
administration.governance.manage

administration.system.view
administration.system.manage
```

The exact permission naming convention should align with the existing backend authorization architecture.

---

# 19. Multi-Tenant Requirements

All Administration capabilities must be tenant-scoped.

The implementation must guarantee:

- One tenant cannot access another tenant's settings.
- Tenant-owned resources must carry appropriate tenant ownership.
- Queries must be tenant scoped.
- Cache keys must be tenant scoped.
- Audit logs must identify tenant context.
- Imported data must be validated against tenant boundaries.
- Role and permission assignment must not escape tenant boundaries.
- Integration credentials must remain tenant specific unless explicitly platform managed.
- Tenant configuration changes must not affect unrelated tenants.

---

# 20. Responsive Design

Administration must work properly on:

- Desktop
- Laptop
- Tablet
- Mobile
- PWA

On smaller screens:

- Side navigation may collapse into a drawer.
- Category cards may stack.
- Horizontal tabs may scroll only when absolutely necessary.
- Preferred behaviour is responsive tab compression or a select/dropdown for secondary views.
- Primary capabilities must never be hidden without an accessible alternative.

---

# 21. Visual Design Requirements

The Administration interface should feel:

- Clean
- Modern
- Calm
- Structured
- Enterprise-grade
- Easy to scan
- Consistent with the broader Skuggle design system

Avoid:

- Excessive borders
- Dense nested cards
- Multiple competing tab bars
- Large empty containers
- Too many icons without labels
- Long uninterrupted navigation lists
- Duplicate page titles
- Redundant breadcrumbs
- Redundant section headers

---

# 22. Page Header Standard

Each capability page should use a consistent header structure:

```text
Breadcrumb

Page Title
Short description

Primary action              Secondary actions
```

Example:

```text
Administration / People & Access / Roles

Roles
Control what different users can access within this school.

[Create Role]               [Manage Permissions]
```

---

# 23. Empty States

Empty states must explain:

- What the capability does
- Why it matters
- What action the administrator should take

Example:

```text
No custom fields yet

Add custom fields when Skuggle's default profile fields do not cover
information your school needs to collect.

[Create Custom Field]
```

---

# 24. Error States

Administrative pages must provide useful error messages.

Avoid generic messages such as:

```text
Something went wrong.
```

Prefer:

```text
We couldn't load roles for this school.
Refresh the page or try again.
```

Permission errors should clearly distinguish unauthorized actions from data-loading failures.

---

# 25. Audit Requirements

Sensitive configuration changes should be auditable.

Audit records should capture where applicable:

- Actor
- Action
- Timestamp
- Tenant
- Old value
- New value
- Affected entity
- IP/session metadata where supported
- Source interface/API
- Reason/comment where required

Important changes include:

- Role changes
- Permission changes
- Integration changes
- Security changes
- Workflow changes
- Academic structure changes
- Identifier changes
- Import/export operations

---

# 26. Performance Requirements

Administration reorganization must not introduce unnecessary API requests.

Requirements:

- Lazy load administrative domains where appropriate.
- Avoid loading every administration dataset on the landing page.
- Cache safe configuration data appropriately.
- Do not request hidden tab data until needed unless justified.
- Prevent duplicate API calls from duplicate mounted layouts.
- Avoid rendering multiple copies of the same administration component.
- Use query invalidation consistently after updates.
- Preserve fast navigation between administrative capabilities.

---

# 27. Backend Requirements

The reorganization may require backend changes only where needed.

The agent must:

1. Reuse existing working endpoints where possible.
2. Identify duplicate endpoints.
3. Avoid creating duplicate APIs merely to match new frontend routes.
4. Consolidate overlapping endpoints carefully.
5. Preserve backward compatibility where necessary.
6. Verify tenant scoping.
7. Verify authorization.
8. Validate all administrative writes.
9. Ensure sensitive operations are logged.

---

# 28. Frontend Requirements

The frontend must:

- Remove duplicate Administration navigation surfaces.
- Implement the Administration landing page.
- Implement grouped administrative domains.
- Establish canonical routes.
- Use consistent breadcrumbs.
- Use consistent page headers.
- Remove oversized top-level horizontal tab strips.
- Preserve capability-specific tabs only where appropriate.
- Avoid duplicate layouts.
- Avoid mounting a second Administration sidebar inside another Administration sidebar unless explicitly justified.
- Highlight the current administrative domain.
- Provide responsive behaviour.

---

# 29. Information Architecture Audit Required Before Refactor

Before changing the UI, the AI agent must inventory the current Administration implementation.

The audit must include:

| Current Item | Current Route | Menu Location | Horizontal/Vertical | Component | API | Permission | Duplicate With | Proposed Destination | Action |
|---|---|---|---|---|---|---|---|---|---|

Each item must then be classified as:

- KEEP
- MOVE
- MERGE
- RENAME
- RETIRE

The agent must not guess.

It must inspect the actual codebase.

---

# 30. Conflict Resolution Rules

When multiple pages provide similar functionality:

1. Compare their feature coverage.
2. Compare the APIs they use.
3. Compare current permissions.
4. Check whether either page is more complete.
5. Determine the canonical version.
6. Merge missing capabilities if necessary.
7. Update all internal links.
8. Redirect legacy routes where necessary.
9. Remove obsolete menu entries.
10. Remove obsolete layouts/components only after verifying they are unused.

---

# 31. Do Not Delete Blindly

The implementation agent must NOT:

- Delete a menu because it appears duplicated visually.
- Delete a route without checking references.
- Delete a component without checking imports.
- Delete an API without checking consumers.
- Delete permissions without checking role assignments.
- Delete database tables/columns solely because a screen was removed.
- Replace working functionality with placeholder interfaces.
- Remove features simply to make the menu shorter.

The objective is organization, not accidental feature reduction.

---

# 32. Migration Strategy

Recommended implementation order:

## Phase 1: Audit

- Inventory current Administration navigation.
- Inventory Administration routes.
- Inventory components.
- Inventory APIs.
- Inventory permissions.
- Identify duplicates.
- Identify operational features incorrectly placed under Administration.

## Phase 2: Mapping

Map every existing item to the target architecture.

Example:

```text
Existing School Profile
→ Administration > School Setup > Profile

Existing Role Manager
→ Administration > People & Access > Roles

Existing Custom Fields
→ Administration > Forms & Records > Custom Fields
```

## Phase 3: Navigation Refactor

- Create Administration landing page.
- Create canonical category navigation.
- Remove duplicated menu entries.
- Replace long top-level horizontal tab navigation.

## Phase 4: Route Consolidation

- Establish canonical URLs.
- Add legacy redirects where necessary.
- Update internal links.

## Phase 5: Component Consolidation

- Merge duplicate pages.
- Remove unused layouts.
- Remove duplicated wrappers.
- Preserve working functionality.

## Phase 6: Backend Validation

- Verify APIs.
- Verify authorization.
- Verify tenant scoping.
- Verify audit logging.

## Phase 7: QA

- Test every Administration route.
- Test Super Admin access.
- Test delegated role access.
- Test mobile navigation.
- Test legacy redirects.
- Test direct URL navigation.
- Test browser refresh.
- Test tenant isolation.
- Test forms and saves.
- Test loading states.
- Test errors.
- Test no duplicate API requests.

---

# 33. Acceptance Criteria

The redesign is complete only when all the following are true.

## Information Architecture

- [ ] Administration has one primary entry point.
- [ ] Administration has a clear landing page.
- [ ] The nine target administrative domains are implemented.
- [ ] Every administrative capability has one canonical location.
- [ ] Duplicate vertical and horizontal navigation is removed.
- [ ] Operational modules are not duplicated inside Administration.
- [ ] Existing valid functionality is preserved.

## Navigation

- [ ] No giant top-level Administration tab strip remains.
- [ ] Horizontal tabs are used only inside a specific capability.
- [ ] Navigation clearly reflects Administration hierarchy.
- [ ] Breadcrumbs work correctly.
- [ ] Direct URLs work correctly.
- [ ] Browser refresh works on nested Administration routes.
- [ ] Legacy routes redirect where required.

## UX

- [ ] Administration landing page is easy to scan.
- [ ] Administrative categories have clear descriptions.
- [ ] Pages use consistent headers.
- [ ] Empty states are useful.
- [ ] Mobile navigation works.
- [ ] Tablet navigation works.
- [ ] No duplicate sidebar appears unnecessarily.

## Security

- [ ] All Administration endpoints are authorization protected.
- [ ] All tenant resources are tenant scoped.
- [ ] Integration secrets are protected.
- [ ] Sensitive configuration changes are audited.
- [ ] Users cannot reach Administration pages via direct URL without permission.

## Performance

- [ ] Administration landing page does not load every administrative dataset.
- [ ] No duplicate API requests are introduced by duplicated layouts.
- [ ] Navigation remains responsive.
- [ ] Category content is loaded efficiently.

---

# 34. Definition of Done

The Administration reorganization is done when:

1. The current Administration module has been fully audited.
2. Every existing Administration item has been mapped.
3. Duplicate navigation has been eliminated.
4. Conflicting layouts have been consolidated or removed.
5. Canonical routes have been established.
6. Administration landing page is operational.
7. The nine administrative domains are implemented.
8. Existing business functionality remains intact.
9. Role-based access works.
10. Multi-tenant isolation is verified.
11. Legacy routes are handled safely.
12. Automated and manual QA passes.
13. No orphaned components or menu entries remain.
14. No duplicate API calls are caused by the new layout.
15. No operational module is unnecessarily recreated inside Administration.

---

# 35. Target Final Structure

```text
ADMINISTRATION
School configuration and administrative controls

├── School Setup
│   ├── Profile
│   ├── Campuses
│   ├── Branding
│   └── Localization
│
├── Academic Structure
│   ├── Sessions
│   ├── Terms
│   ├── Classes & Arms
│   ├── Subjects
│   └── Departments
│
├── People & Access
│   ├── Users
│   ├── Roles
│   ├── Permissions
│   └── Invitations
│
├── Forms & Records
│   ├── Custom Fields
│   ├── Forms
│   ├── Identifiers
│   └── Record Configuration
│
├── Workflow & Automation
│   ├── Workflows
│   ├── Approvals
│   ├── Rules
│   └── Automation
│
├── Communication Setup
│   ├── Templates
│   ├── Notifications
│   └── Delivery Rules
│
├── Integrations
│   ├── Connected Services
│   ├── API Configuration
│   ├── Webhooks
│   └── Integration Logs
│
├── Governance
│   ├── Audit Logs
│   ├── Security
│   ├── Policies
│   └── Access History
│
└── System
    ├── Import
    ├── Export
    ├── System Preferences
    └── Advanced Settings
```

---

# 36. Final Product Principle

The Administration module should answer one simple question:

> "Where do I configure or govern how this school uses Skuggle?"

If the capability is about performing daily school work, it should normally belong to an operational module.

If the capability is about configuring, controlling, governing, securing or integrating the school tenant, it belongs in Administration.

This distinction must guide all present and future Administration features.


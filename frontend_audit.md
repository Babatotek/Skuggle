# ROLE: SENIOR UI/UX ARCHITECT, DESIGN SYSTEM ENGINEER & FRONTEND QUALITY AUDITOR

Act as an outstanding Senior UI/UX Architect, SaaS Product Designer, Design System Engineer, and Frontend Quality Assurance Expert.

Your task is to conduct a **deep forensic audit of the entire application's user interface before making any changes**.

The application currently contains several UI/UX inconsistencies and implementation abnormalities that are reducing usability, visual quality, navigation clarity, and the overall perception of the product.

Do not begin by randomly redesigning pages.

First, thoroughly inspect the existing frontend architecture, layouts, reusable components, routes, navigation structure, tables, forms, cards, dashboards, modals, drawers, icons, typography, spacing, responsiveness, and interaction patterns.

The objective is to transform the application into a **polished, cohesive, sleek, modern SaaS product** while preserving existing business logic, permissions, backend integrations, routes, API behaviour, and production functionality.

---

# PHASE 1: FORENSIC UI/UX AUDIT

Before modifying any code, inspect the entire application and produce a structured UI/UX audit.

Identify every major inconsistency, weakness, obsolete pattern, usability problem, accessibility problem, and deviation from modern SaaS design practices.

Do not guess.

Base findings on the actual codebase and rendered application.

Audit at minimum the following areas.

## 1. INFORMATION ARCHITECTURE AND NAVIGATION

Inspect:

- Main navigation
- Sidebars
- Horizontal navigation
- Sub-navigation
- Tabs
- Breadcrumbs
- Module navigation
- Page-level navigation
- Route hierarchy
- Modal-triggered workflows
- Drawer-triggered workflows
- Context menus
- Action menus

Identify:

- Excessive menu items
- Duplicate routes
- Pages that should not exist as independent navigation items
- Forms incorrectly implemented as full pages
- Workflows that should use modals
- Workflows that should use side drawers
- Workflows better handled by contextual actions
- Tabs that should be consolidated
- Navigation that exposes implementation structure instead of user workflows
- Deep or confusing menu hierarchies
- Navigation labels that are unclear or inconsistent
- Redundant back buttons
- Missing breadcrumbs where necessary

The navigation must reflect **user tasks and workflows**, not merely backend entities or database tables.

---

# 2. PAGE VS MODAL VS DRAWER AUDIT

Review every form and workflow.

Classify each interaction appropriately.

### Full Page

Use a full page when:

- The workflow contains substantial information
- The user needs concentration
- There are multiple sections
- There are several related sub-workflows
- The page needs a unique shareable URL
- It represents a major application workspace

### Modal

Prefer a modal for:

- Create record
- Add user
- Add category
- Assign role
- Quick edit
- Confirmation
- Small configuration forms
- Status updates
- Short CRUD operations
- Simple approval/rejection workflows

### Drawer / Slide-over Panel

Prefer a drawer for:

- Record details
- Editing moderately complex records
- Previewing information without losing table context
- Activity history
- User profile preview
- Transaction details
- Quick configuration

### Inline Interaction

Prefer inline interaction for:

- Status changes
- Simple toggles
- Small field edits
- Row-level actions
- Filters
- Search
- Sorting

Flag every place where the wrong interaction pattern is currently being used.

---

# 3. TABLE AND DATA GRID AUDIT

Inspect every data table in the application.

Many current tables appear incomplete or visually weak.

Check for:

- Missing row action buttons
- Empty columns
- Undefined values
- Null values displayed poorly
- Missing status badges
- Missing user/entity avatars
- Poor alignment
- Excessive column width
- Missing sorting
- Missing filtering
- Missing search
- Missing pagination
- Missing bulk actions
- Missing contextual menus
- Missing empty-state design
- Missing loading states
- Missing skeleton loaders
- Poor mobile behaviour
- Horizontal overflow problems
- Inconsistent row height
- Inconsistent column formatting

Every table should expose meaningful user actions where appropriate.

Typical row actions may include:

- View
- Edit
- Delete
- Archive
- Restore
- Activate
- Suspend
- Approve
- Reject
- Assign
- Download
- Print
- Duplicate
- View history
- Open details

Do not add actions that the backend does not support.

Validate permissions before displaying them.

Prefer an overflow action menu when more than 2–3 actions exist.

Important actions may remain visible.

---

# 4. CARD SYSTEM AUDIT

Audit all cards across dashboards and modules.

Current cards appear excessively wide and visually inefficient.

Identify:

- Oversized cards
- Cards consuming unnecessary horizontal space
- Cards with excessive padding
- Poor information hierarchy
- Missing icons
- Decorative icons with no semantic relevance
- Inconsistent border radius
- Inconsistent shadows
- Inconsistent card heights
- Empty card areas
- Weak metric presentation
- Poor responsive behaviour
- Repetitive cards that could be consolidated
- Cards being used where a compact list or table would be better

Create clear card categories such as:

### KPI Card
For metrics and numbers.

### Summary Card
For concise module information.

### Action Card
For shortcuts and frequently performed tasks.

### Content Card
For grouped information.

### Profile Card
For user/entity information.

### Insight Card
For trends, warnings, recommendations or analytics.

Cards must be compact, purposeful and visually balanced.

---

# 5. ICONOGRAPHY AUDIT

Audit every icon in the application.

Use a single consistent icon system unless there is a strong technical reason otherwise.

Prefer a professional vector icon library such as:

- Lucide
- Heroicons
- Phosphor

If Lucide is already installed, standardise around Lucide.

Remove:

- Random icon sets
- Emoji being used as interface icons
- Inconsistent stroke widths
- Oversized icons
- Meaningless decorative icons
- Repeated icons representing different concepts

Every important navigation item, KPI card, action, state or module should use an appropriate semantic icon where useful.

Icons must support comprehension, not become decoration for decoration's sake.

---

# 6. BUTTON AUDIT

Audit all buttons.

Identify:

- Inconsistent height
- Inconsistent border radius
- Excessive number of primary buttons
- Weak visual hierarchy
- Missing icons
- Buttons behaving like links
- Links styled like buttons unnecessarily
- Destructive actions without warning styles
- Disabled buttons with poor feedback
- Missing hover states
- Missing loading states
- Missing focus states

Create a consistent button hierarchy:

- Primary
- Secondary
- Tertiary/Ghost
- Destructive
- Success where necessary
- Icon-only
- Split/dropdown action

Only one dominant primary action should normally exist within a visual section.

---

# 7. FORM EXPERIENCE AUDIT

Inspect every form.

Review:

- Input height
- Labels
- Placeholder use
- Required fields
- Error messages
- Help text
- Select controls
- Date pickers
- Toggles
- Radio groups
- Checkboxes
- File uploads
- Searchable dropdowns
- Multi-select fields
- Textareas
- Validation feedback
- Submit buttons
- Cancel behaviour
- Form grouping

Identify excessively long forms.

Break complex forms into:

- Logical sections
- Tabs
- Accordions
- Multi-step flows

Only when that improves comprehension.

Do not convert simple forms into unnecessarily complex wizards.

Ensure validation messages appear close to the relevant input.

Do not rely on placeholders as field labels.

---

# 8. TYPOGRAPHY AUDIT

Create a consistent typography hierarchy.

Audit:

- Page titles
- Section titles
- Card headings
- Labels
- Body text
- Metadata
- Captions
- Table headings
- Button labels
- Numeric metrics

Remove:

- Excessive font sizes
- Random font weights
- Inconsistent capitalization
- Poor line height
- Very light unreadable text
- Excessive bold text

Create reusable text styles rather than styling typography independently on every page.

---

# 9. SPACING AND LAYOUT SYSTEM

Audit:

- Margins
- Padding
- Gaps
- Section spacing
- Grid structure
- Container widths
- Page gutters
- Vertical rhythm
- Alignment

Avoid random values scattered throughout components.

Introduce a consistent spacing scale.

Prefer reusable spacing tokens.

Layouts should feel spacious without wasting screen real estate.

The application must use available desktop space intelligently while remaining comfortable on smaller devices.

---

# 10. RESPONSIVE DESIGN AUDIT

Test the application across:

- Large desktop
- Laptop
- Tablet landscape
- Tablet portrait
- Mobile landscape
- Mobile portrait

Check:

- Navigation behaviour
- Tables
- Forms
- Modal sizing
- Drawer behaviour
- Cards
- Dashboard grids
- Typography
- Touch targets
- Overflow
- Fixed elements
- Sticky elements

Do not simply shrink desktop components.

Design appropriate responsive behaviour.

For example:

Desktop tables may become:

- Horizontal scrolling tables
- Responsive lists
- Cards

depending on the data type.

---

# 11. DASHBOARD AUDIT

Review every dashboard.

A modern dashboard should have clear hierarchy.

Typical order:

1. Context/header
2. Primary metrics
3. Important actions
4. Trends and visualisations
5. Recent activity
6. Exceptions requiring attention
7. Secondary information

Remove dashboard clutter.

Not every dataset needs its own card.

Avoid making dashboards resemble traditional ERP interfaces unless the workflow requires dense operational data.

---

# 12. EMPTY, LOADING, ERROR AND SUCCESS STATES

Audit every data-driven component.

Every module must handle:

- Initial loading
- Background refresh
- Empty results
- Filtered empty results
- API error
- Permission denied
- Record not found
- Successful save
- Successful delete
- Network failure
- Session expiration

Use:

- Skeleton loaders
- Empty-state illustrations/icons
- Retry controls
- Toasts
- Inline validation
- Confirmation dialogs

Avoid raw error messages or blank sections.

---

# 13. MODAL QUALITY

Standardise modals.

Every modal should have:

- Clear title
- Optional short description
- Correct form layout
- Close control
- Cancel action
- Primary action
- Loading state
- Escape-key handling
- Focus management
- Responsive width
- Scrollable body when necessary
- Safe destructive action treatment

Do not create giant modals that function like badly compressed pages.

---

# 14. VISUAL CONSISTENCY

Detect inconsistent use of:

- Colors
- Border radius
- Shadows
- Borders
- Gradients
- Backgrounds
- Typography
- Icons
- Animation
- Button styles
- Inputs
- Cards
- Tables
- Tabs
- Badges
- Tooltips
- Dropdowns
- Toasts

The final application should appear to have been designed by one coherent product team.

---

# 15. DESIGN SYSTEM AND REUSABLE COMPONENT AUDIT

Inspect the codebase for repeated JSX/TSX structures.

Identify components that should become reusable primitives.

Create or consolidate reusable components such as:

- AppShell
- PageHeader
- SectionHeader
- PageContainer
- ContentCard
- MetricCard
- DataTable
- EmptyState
- StatusBadge
- Avatar
- SearchInput
- FilterBar
- ActionMenu
- Modal
- Drawer
- ConfirmDialog
- FormField
- Input
- Select
- DatePicker
- Checkbox
- RadioGroup
- Toggle
- Tabs
- Pagination
- Tooltip
- Dropdown
- Skeleton
- Toast
- Alert
- Breadcrumbs

Do not create duplicate components with slightly different styling.

---

# PHASE 2: COMPARE AGAINST MODERN SAAS STANDARDS

Compare the application against the interaction and interface quality commonly found in mature SaaS products.

Evaluate it using principles seen in applications such as:

- Linear
- Notion
- Slack
- ClickUp
- HubSpot
- Stripe Dashboard
- Vercel
- GitHub
- modern school management SaaS products where appropriate

Do NOT copy any product directly.

Extract relevant principles such as:

- restrained visual hierarchy
- compact information density
- predictable component behaviour
- contextual actions
- strong empty states
- fast feedback
- consistent navigation
- clear typography
- reusable design tokens
- minimal visual noise
- excellent responsive behaviour

---

# PHASE 3: PRODUCE A LIMITATIONS REPORT BEFORE CODING

Before modifying the interface, create:

## A. Executive UI/UX Summary

State the overall design maturity of the application.

## B. Critical UI/UX Issues

Classify problems as:

- Critical
- High
- Medium
- Low

## C. Navigation Problems

List pages or workflows that unnecessarily increase menu complexity.

## D. Modal/Page/Drawer Misuse

Identify every major workflow using the wrong presentation pattern.

## E. Table Deficiencies

Identify missing actions, incomplete values, inconsistent columns and interaction problems.

## F. Card Design Deficiencies

Identify oversized, inconsistent or unnecessary cards.

## G. Design System Deficiencies

Identify repeated styles and components that should be consolidated.

## H. Responsive Issues

List desktop, tablet and mobile problems.

## I. Accessibility Issues

Identify:

- insufficient contrast
- missing labels
- weak keyboard navigation
- missing focus states
- inaccessible modals
- inaccessible tables
- undersized touch targets

## J. Modern SaaS Gap Analysis

For each major issue provide:

Current Implementation  
Problem  
Modern SaaS Expectation  
Recommended Correction  
Priority

Do not make architectural changes before completing this report.

---

# PHASE 4: DEFINE THE UI DESIGN SYSTEM

Create a lightweight internal UI specification derived from the existing brand.

Define:

## Color Tokens

For example:

- background
- surface
- elevated surface
- primary
- primary hover
- secondary
- muted
- text primary
- text secondary
- border
- success
- warning
- danger
- info

Reuse existing brand colours where practical.

Do not introduce random new colours.

## Spacing Tokens

Use a consistent scale.

## Border Radius

Define standard values for:

- buttons
- inputs
- cards
- modals
- badges

## Elevation

Use subtle shadows.

Do not make every card float dramatically.

## Typography

Define consistent:

- page heading
- section heading
- card title
- body
- small text
- caption
- metric

## Component Dimensions

Standardise:

- buttons
- input fields
- table rows
- navigation items
- cards
- modal widths

---

# PHASE 5: REFACTOR REUSABLE COMPONENTS FIRST

Before manually redesigning individual pages, stabilise reusable building blocks.

Changes to shared components should automatically improve multiple modules.

Prioritise:

1. Application shell
2. Navigation
3. Page container
4. Page header
5. Buttons
6. Form controls
7. Cards
8. Data tables
9. Badges
10. Modals
11. Drawers
12. Dropdown/action menus
13. Empty states
14. Loading states
15. Notifications

Avoid page-specific CSS where a reusable component can solve the problem globally.

---

# PHASE 6: NAVIGATION SIMPLIFICATION

Reduce unnecessary menu clutter.

Do NOT make every CRUD operation a menu item.

For example:

Bad pattern:

Users  
Add User  
Edit User  
User Roles  
Assign Role  
User Details

Preferred pattern:

Users

Inside Users:

- Add User button
- Row action menu
- User detail drawer/page
- Role assignment modal

Apply the same principle throughout the application.

Menus should generally represent major business capabilities, not every operation.

---

# PHASE 7: TABLE ENHANCEMENT

Upgrade relevant tables to production-grade SaaS tables.

Where appropriate provide:

- Search
- Sorting
- Filters
- Pagination
- Column alignment
- Status badges
- Row selection
- Bulk actions
- Context action menus
- Clear empty states
- Loading skeletons

Do not fabricate unavailable backend data.

If a table field is expected but absent:

1. inspect the API response
2. inspect the database model
3. inspect serializers/resources
4. determine why the value is unavailable
5. fix the actual integration if it is clearly defective

Do not hardcode fake values.

---

# PHASE 8: MODAL AND DRAWER MIGRATION

Where safe, convert unnecessary full-page CRUD routes into modal or drawer experiences.

However:

Do NOT delete useful backend routes merely because the frontend now uses a modal.

Preserve deep links where necessary.

Do not break browser back/forward behaviour.

Do not break permissions.

Do not remove routes needed by APIs or external workflows.

---

# PHASE 9: MICRO-INTERACTIONS

Introduce restrained, professional micro-interactions such as:

- subtle hover states
- smooth dropdown transitions
- modal fade/scale
- drawer slide
- button press states
- skeleton transitions
- tab transitions
- toast animations
- active navigation indicators

Animations should normally remain around 150–250 ms.

Respect:

`prefers-reduced-motion`

Avoid excessive animation.

This is enterprise software, not an amusement park.

---

# PHASE 10: PERFORMANCE PROTECTION

Visual improvements must not make the application slower.

Avoid:

- unnecessarily large animation libraries
- excessive DOM nesting
- unnecessary re-renders
- giant icon packages
- loading entire modules when one icon is needed
- huge image assets
- expensive blur effects
- excessive shadows
- unnecessary JavaScript-driven animations

Use code splitting and lazy loading where already architecturally appropriate.

Import icons individually where the library supports it.

---

# PHASE 11: ACCESSIBILITY

Ensure major components follow WCAG-friendly practices.

Check:

- color contrast
- keyboard navigation
- focus-visible states
- semantic HTML
- form labels
- aria labels
- modal focus trapping
- accessible dropdowns
- accessible tables
- accessible icons
- minimum touch targets

Do not sacrifice accessibility for aesthetics.

---

# PHASE 12: IMPLEMENTATION ORDER

Do not redesign everything blindly at once.

Use this sequence:

### Stage 1
Audit and design system.

### Stage 2
Global application shell.

### Stage 3
Navigation and menus.

### Stage 4
Shared components.

### Stage 5
Dashboards.

### Stage 6
Tables and lists.

### Stage 7
Forms, modals and drawers.

### Stage 8
Individual module refinement.

### Stage 9
Responsive audit.

### Stage 10
Accessibility audit.

### Stage 11
Regression testing.

---

# NON-NEGOTIABLE RULES

You must NOT:

- invent API data
- use mock values in production screens
- delete working functionality merely for aesthetics
- change backend contracts unnecessarily
- weaken permissions
- expose unauthorized actions
- change business rules without evidence
- rewrite the entire frontend when targeted refactoring is sufficient
- install numerous libraries without justification
- create duplicate reusable components
- redesign each page independently
- add unnecessary menu items
- hide important functionality merely to make the UI minimal
- assume an API is missing without inspecting it
- leave broken TypeScript errors
- leave console warnings
- hardcode permissions
- hardcode tenant-specific values
- introduce desktop-only designs

---

# REQUIRED DELIVERABLE 1: UI/UX AUDIT REPORT

Before coding, produce:

1. Current UI maturity score /10
2. Top 20 interface problems
3. Navigation complexity findings
4. Incorrect page/modal/drawer implementations
5. Table deficiencies
6. Card deficiencies
7. Form deficiencies
8. Responsive deficiencies
9. Accessibility deficiencies
10. Design-system deficiencies
11. Component duplication findings
12. Modern SaaS gap analysis
13. Prioritised remediation plan

---

# REQUIRED DELIVERABLE 2: COMPONENT INVENTORY

Provide a table containing:

Component  
Current Implementations  
Problems  
Recommended Canonical Component  
Files Affected  
Migration Priority

---

# REQUIRED DELIVERABLE 3: ROUTE AND WORKFLOW REVIEW

Provide:

Route  
Current Screen  
Recommended Pattern  
Page / Modal / Drawer / Inline  
Reason  
Migration Risk

---

# REQUIRED DELIVERABLE 4: IMPLEMENTATION

After the audit, implement the improvements progressively.

For every significant change record:

File modified  
Problem resolved  
Design-system component used  
Behaviour before  
Behaviour after  
Backend impact  
Regression risk

---

# REQUIRED DELIVERABLE 5: FINAL VALIDATION

Before declaring the work complete, verify:

- Navigation works
- All menus work
- Modals open and close correctly
- Drawers work
- Forms submit correctly
- Tables fetch real data
- Row actions work
- Permissions remain correct
- No duplicate routes were introduced
- No broken imports
- No missing icons
- No overflow issues
- No obvious responsive defects
- No TypeScript build failures
- No production build failures
- No significant console errors
- Loading states work
- Empty states work
- Error states work

Test major user workflows on desktop, tablet and mobile.

---

# DEFINITION OF DONE

The work is complete only when the application:

- Looks visually coherent across modules
- Feels like one unified SaaS product
- Has substantially reduced unnecessary navigation clutter
- Uses modal/drawer/page patterns appropriately
- Uses consistent reusable components
- Has compact and purposeful cards
- Has meaningful Lucide icons
- Has complete and usable tables
- Provides appropriate row actions
- Provides proper loading and empty states
- Has consistent typography and spacing
- Works well across desktop, tablet and mobile
- Preserves all existing business functionality
- Preserves authorization boundaries
- Builds successfully
- Contains no obvious UI regressions
- No longer feels like disconnected CRUD pages joined together by a menu

Do not declare success merely because the interface looks visually prettier.

The result must demonstrate improvements in:

**usability + information architecture + consistency + responsiveness + accessibility + interaction quality + visual polish + maintainability + performance.**
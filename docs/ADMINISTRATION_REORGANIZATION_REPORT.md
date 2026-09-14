# Administration reorganization implementation report

Source of truth: `SKUGGLE_ADMINISTRATION_REORGANIZATION_PRD.md` (the workspace uses ADMINISTRATION, not ADMINISTRATIVE). Implementation: 8–9 September 2026. The attached execution prompt was applied to the existing school workspace. See `ADMINISTRATION_REORGANIZATION_AUDIT.md` for the pre-implementation inventory and current-to-target classification.

## 1. Current-state findings

The primary registry exposed nine flat links, while the shell projected legacy group tabs above the same capabilities. SchoolStructureView added further inner tabs and fetched profile plus nine datasets. There was no Administration overview. Users and Roles rendered the same membership component. Several legacy aliases silently opened the wrong dataset, including automation, policies, system configuration and school sub-pages.

## 2. Duplicate inventory

- Menus/layouts: primary Administration links, legacy ModuleWorkspace tabs and school inner tabs competed. Administration now bypasses ModuleWorkspace and uses the V2 PageFrame/PageLayout composition.
- Routes/pages: Users & Access and Roles & Permissions both used AdministratorsView. Consolidated into Users & Roles with compatibility redirects. This accurately describes the existing membership/assigned-role functionality; it is not a new role-definition editor.
- Branding: the same studio appeared both within school settings and standalone. Canonical location is School Setup / Branding.
- Subjects: Academics had a second create-subject modal. Its action now opens the canonical Administration subject page; the duplicate form and submit function are removed.
- APIs: structure and dedicated campus/session/class/subject/department APIs have different permissions, response contracts and operational consumers. They remain compatible; no API was deleted merely for looking similar. Forms continue using the shared FormEngineService and CustomFieldRegistry.
- Permissions: reused existing canonical grants and legacy backend aliases. No new permission names, seed migration or role scope was introduced.

## 3. Navigation and capability mapping

The complete current-to-target table is in the audit. The new `routing/administration.ts` catalog owns category metadata, routes, compatibility destinations and search destinations. One Administration link replaces nine persistent links. Nine category cards disclose only the selected domain's capabilities. Search filters by capability grants and returns canonical URLs. The global command palette now uses the same Administration route catalog instead of duplicated legacy labels.

Automation, authentication policies and advanced settings now open their distinct existing module records. Attendance notification configuration and biometric configuration move to Communication Setup and Integrations. Facilities move to Operations. Calendar, operational profiles, actual approval work items, messaging, student import and report execution remain in operational modules. Generic school-wide import/export/backup controls were not present and were not fabricated.

## 4. Layout and performance changes

Administration has one page title and canonical breadcrumbs; mobile has a visible parent link. Cards stack responsively. The overview and domain pages mount no capability components and initiate no capability data requests. Only the selected capability mounts. Structure pages request only the selected resource (classes additionally request derived arms), handle pagination and expose loading/error/retry states. Removed the inert Export and Filters buttons from the structure table. Generic module records now support the existing PATCH API through Edit, retain form values on errors and expose pagination/loading/retry controls.

## 5. Safe retirement and compatibility

No business files, database tables or backend routes were deleted. The duplicate subject modal/state/submit handler was removed after its only opening action was redirected. Attendance configuration items were removed from operational tabs after canonical routes and legacy IDs were registered. Old flat URLs remain application redirects rather than parallel implementations. Legacy metadata and SchoolStructureView's compatibility presentation remain because other legacy adapters still exist; they are bypassed by all canonical Administration pages. This compatibility code is documented debt, not another active Administration layout.

## 6. Backend changes

- SchoolModuleRecordController rejects undeclared integration payload keys. It exposes only name/provider/purpose metadata for legacy integration records and excludes undeclared fields from new update audit entries. This is an inventory, not a secret vault or live provider connector.
- PATCH now preserves omitted fields. Previously a title-only patch could reset configuration payload/status; a regression assertion now verifies preserved payloads for all nine administrative record types.
- SchoolStructureController requires `settings.configure` for school configuration writes. `users.manage` remains an allowed exception for workforce department/teacher allocation operations, and enrolment retains `students.create`.
- Structure creation and updates emit audit events; update events include captured before/after attributes. Existing profile and arm events remain.
- Restored missing `CustomFieldRegistry::ENTITY_STAFF`. Existing uncommitted assessment work had replaced the constant but still referenced it, causing runtime failures in Forms and Students. The assessment entity extension is preserved.
- No database migrations, platform IAM changes or credential deployment changes were made.

## 7. Security validation and limits

Backend HTTP tests use Laravel's real controllers, middleware and an isolated test database. Tests cover two school tenants, cross-tenant record updates returning 404, scoped lists, authorized updates, delegated configuration denials, membership reads, integration payload validation, masking of legacy extra credential fields, configuration preservation and audit snapshots. Existing school-role, form-engine and cross-tenant suites also run.

The existing authenticated subscription route remains accessible through System without requiring configuration grants; its existing account policy still controls plan actions. All other capability cards and direct routes require their configured grants. School Super Admin identity controls remain separate from platform scope. Operational lookup reads retain their established permissions.

Existing legacy integration JSON is not destructively rewritten. Historical audit records are not altered. There is no claim that a tenant credential vault, provider connection test, webhook execution engine, workflow scheduler or security-policy enforcement engine was added. The existing generic configuration records do not implement those systems.

## 8. Verification

- TypeScript compilation, production build and architecture guard were run; final outcomes are recorded below.
- The focused routing/navigation suite passed 78 tests, covering every new canonical route, old flat redirects, distinct legacy module targets, grants, workspace separation, progressive disclosure and search.
- The first backend run exposed the missing staff constant; fixed and rerun. A new test initially omitted required module fields; corrected the fixture to use the actual catalog.
- The first broad frontend run had a legacy assessment test timeout; it passed when rerun with two workers.
- A structure-table refactor introduced a JSX expression error; fixed before final verification.
- Live HTTP checks returned status 200 and the application root for `/school/administration`, `/school/administration/academic-structure/sessions` and the old `/school/administration/roles-permissions` URL. This verifies local SPA fallback, not authenticated client rendering.
- Browser runtime discovery returned no available browsers. Authenticated browser flows, visual desktop/tablet/mobile/PWA checks and screenshot evidence remain unverified. The PRD's full definition of done is therefore **not claimed**.

## 9. Remaining product and validation gaps

The existing application lacks a dedicated editable role/permission catalog, identifiers engine, general communication template/delivery editor, live tenant integration credentials/webhooks/logs, policy/access-history controls and generic tenant import/export/backup workflows. Related configuration records remain usable in their canonical homes, without placeholder replacements. Sessions and terms share one capability; users and assigned roles share one capability; forms and custom fields share one entity-aware editor. These are deliberate consolidations of existing functionality.

Manual browser validation requires a connected browser. Full PRD acceptance also requires decisions and implementation for the absent product capabilities above. This report describes the delivered reorganization and its tested boundaries, not a claim that those missing systems now exist.

### Final verification results

| Check | Result |
|---|---|
| TypeScript `npm run typecheck` | Passed after the final JSX correction |
| Production `npm run build` | Passed, exit 0; Vite and server bundle completed |
| Architecture guard | Passed |
| Frontend broad run | 141 tests passed; the remaining suite initially had a JSX compilation failure |
| Failed-suite rerun after correction | 2 structure tests passed; 143 passing tests across the broad run and corrective rerun |
| Focused routing/navigation run | 78 passed, included in the broader total |
| Laravel Administration / School records / School roles / Forms / Cross-tenant suites | 24 passed, 153 assertions |
| PHP syntax for changed controllers | Passed |
| Targeted PHPStan/Larastan for changed controllers and custom-field registry | Passed, no errors |
| Targeted Pint formatting | Applied required formatting corrections |
| Local running server nested-route fallback | Three representative URLs returned HTTP 200 and the app shell |
| Browser / visual / responsive / PWA QA | Unverified: no browser available |

Evidence logs are under `.runtime/administration-*.log`. Existing unrelated workspace changes were preserved. No deployment was performed.

## 10. Final route tree and redirects

Generated below from the implemented catalog.

```text
Administration /school/administration
School configuration and administrative controls

  School Setup
    Profile -> /school/administration/school-setup/profile
    Campuses -> /school/administration/school-setup/campuses
    Branding -> /school/administration/school-setup/branding
    Localization -> /school/administration/school-setup/localization

  Academic Structure
    Sessions & Terms -> /school/administration/academic-structure/sessions
    Classes & Arms -> /school/administration/academic-structure/classes
    Subjects -> /school/administration/academic-structure/subjects
    Departments -> /school/administration/academic-structure/departments
    Houses -> /school/administration/academic-structure/houses

  People & Access
    Users & Roles -> /school/administration/people-access/users
    Invitations -> /school/administration/people-access/invitations

  Forms & Records
    Forms & Custom Fields -> /school/administration/forms-records/forms

  Workflow & Automation
    Workflows -> /school/administration/workflow-automation/workflows
    Automation -> /school/administration/workflow-automation/automation

  Communication Setup
    Attendance Notifications -> /school/administration/communication-setup/notifications

  Integrations
    Connected Services -> /school/administration/integrations/connected-services
    Biometric Devices -> /school/administration/integrations/biometrics

  Governance
    Audit Logs -> /school/administration/governance/audit-logs
    Security Controls -> /school/administration/governance/security
    Authentication Policies -> /school/administration/governance/policies

  System
    Advanced Settings -> /school/administration/system/advanced-settings
    Subscription & Plan -> /school/administration/system/subscription
```

| Old URL | Canonical URL |
|---|---|
| /school/administration/branding | /school/administration/school-setup/branding |
| /school/administration/users-access | /school/administration/people-access/users |
| /school/administration/forms | /school/administration/forms-records/forms |
| /school/administration/workflows | /school/administration/workflow-automation/workflows |
| /school/administration/audit | /school/administration/governance/audit-logs |
| /school/administration/security | /school/administration/governance/security |
| /school/administration/subscription | /school/administration/system/subscription |
| /school/administration/roles-permissions | /school/administration/people-access/users |
| /school/people/invitations | /school/administration/people-access/invitations |

# Resource authorization matrix

The machine-readable release inventory is `backend/tests/Architecture/resource-authorization-map.json`; `WaveZeroSecurityArchitectureTest` verifies that mapped tenant routes retain tenant middleware and every P0 family has test evidence or a named debt exception.

| Family | Risk | Authentication / tenant | Permission / resource decision | Evidence or exception |
|---|---:|---|---|---|
| Student; document; medical | P0 | Sanctum + active tenant membership | student permissions, TenantScope, policy/parent-child ownership | tenant isolation and enrolment suites; document-specific expansion TEST-002 |
| Teacher assignment | P0 | Sanctum + active tenant membership | settings/users permission; active selected membership, employee and teacher profile; tenant class/session/subject and class-subject link | `TeacherAssignmentTenantIntegrityTest` |
| Assessment / score | P0 | Sanctum + tenant | assessment/score permission, scoped model/policy | tenant suite; endpoint expansion TEST-003 |
| Attendance | P0 | Sanctum + tenant | attendance permission, class scope and teacher relationship | tenant suite; relationship expansion TEST-004 |
| Result | P0 | Sanctum + tenant; signed public projection separately | result permissions, scoped publication/workflow | result publish/PIN suite |
| Payment / invoice | P0 | Sanctum + tenant; HMAC webhook exception | finance permission or constant-time webhook signature | TEST-005 |
| Report/download | P0 | Sanctum + tenant | reports permission, scoped job/policy | tenant suite; download expansion TEST-006 |
| Guardian, Employee, Admission, Form, Message, Help, School Structure | P1 except School Structure P0 | Sanctum + tenant | declared permissions and tenant scope | companion JSON records controller/action family and evidence |

Safe failure semantics are 404 for a tenant-owned identifier outside the active scope and 403 for an authenticated principal lacking capability. Validation/relationship failures use 422. Public routes are exceptions only where the JSON inventory explicitly identifies a signed/HMAC/public projection.

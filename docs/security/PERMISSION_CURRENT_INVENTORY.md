# Current Permission Inventory

The current seed source contains 40 permissions. The canonical registry also contains 40 definitions. The complete machine-readable consumer/metadata inventory is `PermissionRegistry::definitions()`; this document records compatibility treatment and risk review.

| Legacy family | Count | Consumers | Typical roles | Risk | Canonical family | Treatment |
|---|---:|---|---|---|---|---|
| platform/tenants | 2 | platform routes/controllers | platform_super_admin | PLATFORM_CRITICAL | `platform.tenant.*` | explicit alias; school tenant denied |
| users/roles/security/audit | 4 | membership, MFA, audit, employees | school_super_admin/admin | PRIVILEGED | `identity.*` | shadow; policy retained |
| settings | 1 | branding/forms/settings | school_super_admin | PRIVILEGED | `school.settings.update` | pilot shadow |
| students profile/medical | 6 | student routes/controllers/policy | admin, admissions, teacher read | SENSITIVE/PRIVILEGED | `students.profile.*`, `students.medical.*` | student-read pilot; relationship policy retained |
| attendance | 3 | attendance routes/policy | teacher, leadership | SENSITIVE/PRIVILEGED | `attendance.student.*` | read pilot; assignment policy retained |
| assessment/scores | 4 | assessment routes/policy | teacher, exams, leadership | STANDARD–PRIVILEGED | `assessment.*` | assessment-read pilot |
| results | 3 | result workflow | learner/parent through governance | SENSITIVE/PRIVILEGED | `performance.result.*` | shadow only for high-risk writes |
| reports | 2 | report controller/policy/jobs | leadership, exams, finance | SENSITIVE | `reporting.report.*` | shadow; ownership policy retained |
| finance | 2 | payment/finance routes | bursar/governance | SENSITIVE/PRIVILEGED | `finance.account.*` | shadow only |
| library | 7 | resource/tool/annotation policies | users by function | STANDARD/SENSITIVE | `library.*` | explicit aliases |
| AI | 1 | AI middleware/quota | teacher/admin | SENSITIVE | `ai.content.generate` | explicit alias |
| admissions/communication/operations/services/learning | 5 | school module and messaging paths | role-specific | SENSITIVE | matching canonical record/application/message families | frozen one-target broad aliases |

Controller-local permission intersections and five policy helpers remain compatibility consumers. Direct role-name decisions are baselined debt; Wave 4 introduces none. Frontend legacy permission and role-label checks remain UX-only and are not migrated into navigation (Wave 9).

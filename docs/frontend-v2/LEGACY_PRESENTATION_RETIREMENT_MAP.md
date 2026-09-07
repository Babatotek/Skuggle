# Legacy presentation retirement map

| Legacy presentation | Live Students path | Retained value | Retirement |
|---|---|---|---|
| `StudentRegistryView` | Bypassed | Rollback reference only | Remove after V2 soak |
| `LegacyPageAdapter` Students branch | Bypassed | Other domain routing | Remove branch after rollback window |
| `ModuleWorkspace` | Bypassed | Unmigrated domain context UI | Retire per-domain |
| Legacy page/domain tabs | Bypassed | Unmigrated domains | Audit during each migration |
| `StudentEnrolmentWizard` | Reused | Enrollment behavior | Migrate into `FormPageLayout` later |
| `StudentProfileView` | Reused | Profile behavior | Migrate into `DetailPageLayout` next |
| `ParentsView` | Bypassed | Guardian rollback reference | Remove after Guardians V2 soak |
| `StaffManagementView` | Bypassed | Workforce rollback reference | Remove after Workforce V2 soak |
| `AdmissionsView` | Deleted | None | Retired in Batch 2 |
| `LegacyPageAdapter` Admissions branch | Deleted | None | Retired in Batch 2 |
| `ModuleWorkspace` Admissions ownership | Deleted | None | Retired in Batch 2 |
| Legacy Admissions contextual navigation/icons | Deleted | None | Retired in Batch 2 |
| Admissions generic `SchoolModuleCatalog` definitions | Deleted | Source rows retained for migration only | Typed Admissions APIs are authoritative |
| Admissions `legacyNavIds` compatibility routes | Deleted | None | Canonical `/school/admissions*` routes only |

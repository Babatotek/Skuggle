<?php

use App\Http\Controllers\Api\V1\AcademicSessionController;
use App\Http\Controllers\Api\V1\AdmissionDocumentController;
use App\Http\Controllers\Api\V1\AdmissionsController;
use App\Http\Controllers\Api\V1\AiToolController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AssessmentQuestionController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Controllers\Api\V1\CampusController;
use App\Http\Controllers\Api\V1\CbtController;
use App\Http\Controllers\Api\V1\ClassController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\CustomFieldController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DeliveryWebhookController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\FormEngineController;
use App\Http\Controllers\Api\V1\GeoController;
use App\Http\Controllers\Api\V1\GoogleAuthController;
use App\Http\Controllers\Api\V1\GuardianController;
use App\Http\Controllers\Api\V1\HelpSupportController;
use App\Http\Controllers\Api\V1\InviteController;
use App\Http\Controllers\Api\V1\LessonPlanController;
use App\Http\Controllers\Api\V1\LibraryAnnotationController;
use App\Http\Controllers\Api\V1\LibraryResourceController;
use App\Http\Controllers\Api\V1\LibraryToolController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\MfaController;
use App\Http\Controllers\Api\V1\ModuleDataController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\ParentController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PerformanceController;
use App\Http\Controllers\Api\V1\PersonalPlanController;
use App\Http\Controllers\Api\V1\PlatformController;
use App\Http\Controllers\Api\V1\PlatformOpsController;
use App\Http\Controllers\Api\V1\PublicResultController;
use App\Http\Controllers\Api\V1\RegistrationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ResultController;
use App\Http\Controllers\Api\V1\SchoolModuleRecordController;
use App\Http\Controllers\Api\V1\SchoolStructureController;
use App\Http\Controllers\Api\V1\SmartmarkController;
use App\Http\Controllers\Api\V1\StudentCbtController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\StudentDocumentController;
use App\Http\Controllers\Api\V1\StudentImportController;
use App\Http\Controllers\Api\V1\StudentMedicalController;
use App\Http\Controllers\Api\V1\SubjectController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\TenantAuditController;
use App\Http\Controllers\Api\V1\TenantMembershipController;
use Illuminate\Support\Facades\Route;

// Health check endpoints live in routes/web.php (no /api prefix, no auth required)
// so load balancers and k8s probes can reach /health, /ready, /startup, /live directly.

// Legacy SPA path (shared hosting routes all /api/* to Laravel).
Route::post('/ai/lesson-plan', [AiToolController::class, 'lessonPlan'])
    ->middleware(['auth:sanctum', 'tenant', 'throttle:api', 'verified', 'mfa', 'permission:ai.generate', 'throttle:ai', 'quota:ai_requests_per_day']);

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/two-factor-challenge', [AuthController::class, 'twoFactorChallenge'])->middleware('throttle:two-factor');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
    Route::post('/auth/email/resend', [AuthController::class, 'resendVerificationByEmail'])->middleware('throttle:6,1');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:20,1');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:20,1');
    // Logout must run even when the session is half-dead so cookies are always cleared.
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:api');
    Route::post('/schools/register', [RegistrationController::class, 'school'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::post('/individuals/register', [RegistrationController::class, 'individual'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::get('/invites/{token}', [InviteController::class, 'show'])->middleware('throttle:api');
    Route::post('/invites/{token}/accept', [InviteController::class, 'accept'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::post('/public/results/check', [PublicResultController::class, 'check'])->middleware('throttle:public-results');
    Route::get('/public/results/view', [PublicResultController::class, 'view'])->middleware('throttle:public-results');
    Route::post('/public/contact', [ContactController::class, 'store'])->middleware('throttle:6,1');
    Route::post('/webhooks/payments/{provider}', [PaymentController::class, 'webhook'])->middleware('throttle:api');
    Route::get('/webhooks/whatsapp', [DeliveryWebhookController::class, 'verifyWhatsapp'])->middleware('throttle:api');
    Route::post('/webhooks/whatsapp', [DeliveryWebhookController::class, 'whatsapp'])->middleware('throttle:api');

    Route::get('/public/library/curriculum', [LibraryResourceController::class, 'publicCurriculum'])->middleware('throttle:api');
    Route::get('/public/library/resources', [LibraryResourceController::class, 'publicIndex'])->middleware('throttle:api');
    Route::get('/public/library/resources/{resource}', [LibraryResourceController::class, 'publicShow'])->middleware('throttle:api');
    Route::post('/public/library/resources/{resource}/assistant', [LibraryResourceController::class, 'publicAssistant'])->middleware(['public.ai', 'throttle:ai']);
    Route::get('/public/library/resources/{resource}/practice', [LibraryResourceController::class, 'publicPractice'])->middleware(['public.ai', 'throttle:ai']);
    Route::post('/public/library/practice/{practice}/attempts', [LibraryResourceController::class, 'publicSubmitPractice'])->middleware('throttle:api');

    Route::get('/public/geo/countries', [GeoController::class, 'countries'])->middleware('throttle:api');
    Route::get('/public/geo/{country}/states', [GeoController::class, 'states'])->middleware('throttle:api');
    Route::get('/public/geo/{country}/states/{state}/lgas', [GeoController::class, 'lgas'])->middleware('throttle:api');

    Route::middleware(['auth:sanctum', 'tenant', 'throttle:api'])->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/auth/memberships', [AuthController::class, 'memberships']);
        Route::post('/auth/switch-workspace', [AuthController::class, 'switchWorkspace'])->middleware('idempotency:optional');
        Route::get('/auth/contexts', [AuthController::class, 'contexts']);
        Route::put('/auth/context', [AuthController::class, 'updateContext']);
        Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:6,1');

        Route::get('/auth/mfa', [MfaController::class, 'status']);
        Route::put('/auth/mfa/policy', [MfaController::class, 'updatePolicy'])
            ->middleware(['permission:settings.configure', 'idempotency:required']);
        Route::post('/auth/mfa/enable', [MfaController::class, 'enable']);
        Route::post('/auth/mfa/confirm', [MfaController::class, 'confirm']);
        Route::get('/auth/mfa/qr-code', [MfaController::class, 'qrCode']);
        Route::post('/auth/mfa/recovery-codes', [MfaController::class, 'recoveryCodes']);
        Route::delete('/auth/mfa', [MfaController::class, 'disable']);

        Route::middleware(['verified', 'mfa'])->group(function (): void {
            Route::get('/dashboards/{experience}', [DashboardController::class, 'show']);
            Route::get('/cbt/quizzes', [CbtController::class, 'index']);
            Route::post('/cbt/quizzes', [CbtController::class, 'store'])->middleware(['permission:assessment.create', 'idempotency:required']);
            Route::post('/cbt/quizzes/{quiz}/attempts', [CbtController::class, 'submit'])->middleware('idempotency:required');
            Route::get('/student/cbt/assessments', [StudentCbtController::class, 'index']);
            Route::get('/student/cbt/assessments/{assessment}', [StudentCbtController::class, 'show']);
            Route::put('/student/cbt/assessments/{assessment}/attempts', [StudentCbtController::class, 'save'])->middleware('idempotency:required');
            Route::post('/student/cbt/assessments/{assessment}/attempts', [StudentCbtController::class, 'submit'])->middleware('idempotency:required');
            Route::post('/ai/assistant', [AiToolController::class, 'assistant'])->middleware(['permission:ai.generate', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::post('/ai/assessment', [AiToolController::class, 'assessment'])->middleware(['permission:assessment.create', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::post('/sync', [SyncController::class, 'store'])->middleware('idempotency:required');

            Route::get('/personal/plans', [PersonalPlanController::class, 'index']);
            Route::get('/lesson-plans', [LessonPlanController::class, 'index'])->middleware('permission:ai.generate');
            Route::post('/lesson-plans', [LessonPlanController::class, 'store'])->middleware(['permission:ai.generate', 'idempotency:required']);
            Route::put('/lesson-plans/{lessonPlan}', [LessonPlanController::class, 'update'])->middleware(['permission:ai.generate', 'idempotency:required']);
            Route::post('/personal/plans', [PersonalPlanController::class, 'store'])->middleware('idempotency:required');
            Route::patch('/personal/plans/{planItem}', [PersonalPlanController::class, 'update'])->middleware('idempotency:required');
            Route::delete('/personal/plans/{planItem}', [PersonalPlanController::class, 'destroy'])->middleware('idempotency:required');

            Route::get('/lookups/student-registration', [StudentController::class, 'lookups'])->middleware('permission:students.create');
            Route::get('/lookups/staff-registration', [EmployeeController::class, 'lookups'])->middleware('permission:users.manage');
            Route::get('/custom-fields/{entity}', [CustomFieldController::class, 'show'])->middleware('permission:settings.configure');
            Route::put('/settings/branding', [BrandingController::class, 'update'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::post('/settings/branding/logo', [BrandingController::class, 'uploadLogo'])->middleware('permission:settings.configure');
            Route::get('/module-data/{module}', [ModuleDataController::class, 'show'])->middleware('permission:students.view');
            Route::put('/module-data/{module}', [ModuleDataController::class, 'update'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::put('/custom-fields/{entity}', [CustomFieldController::class, 'update'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/forms', [FormEngineController::class, 'index'])->middleware('permission:settings.configure');
            Route::get('/forms/{formKey}', [FormEngineController::class, 'show'])->middleware('permission:settings.configure')->where('formKey', '[a-z.]+');
            Route::put('/forms/{formKey}', [FormEngineController::class, 'update'])->middleware(['permission:settings.configure', 'idempotency:required'])->where('formKey', '[a-z.]+');
            Route::post('/forms/{formKey}/reset', [FormEngineController::class, 'reset'])->middleware(['permission:settings.configure', 'idempotency:required'])->where('formKey', '[a-z.]+');
            Route::get('/forms/{formKey}/library', [FormEngineController::class, 'library'])->middleware('permission:settings.configure')->where('formKey', '[a-z.]+');
            Route::post('/forms/{formKey}/fields', [FormEngineController::class, 'addField'])->middleware(['permission:settings.configure', 'idempotency:required'])->where('formKey', '[a-z.]+');
            Route::get('/lookups/student-registration', [StudentController::class, 'lookups'])->middleware('permission:students.create');
            Route::get('/students/admission-number/preview', [StudentController::class, 'previewAdmissionNumber'])->middleware('permission:students.create');
            Route::post('/students/check-duplicates', [StudentController::class, 'checkDuplicates'])->middleware('permission:students.create');
            Route::get('/students/guardians/search', [StudentController::class, 'searchGuardians'])->middleware('permission:students.create');
            Route::get('/students', [StudentController::class, 'index'])->middleware('permission:students.view');
            Route::get('/students/{student}/profile-sheet', [StudentController::class, 'downloadProfile'])->middleware('permission:students.view');
            Route::get('/students/{student}/documents', [StudentDocumentController::class, 'index'])->middleware('permission:students.view');
            Route::post('/students/{student}/documents', [StudentDocumentController::class, 'store'])->middleware(['permission:students.create', 'throttle:uploads', 'idempotency:required']);
            Route::delete('/students/{student}/documents/{document}', [StudentDocumentController::class, 'destroy'])->middleware(['permission:students.edit', 'idempotency:required']);
            Route::get('/students/{student}/medical', [StudentMedicalController::class, 'show'])->middleware('permission:students.medical.view');
            Route::patch('/students/{student}/medical', [StudentMedicalController::class, 'update'])->middleware(['permission:students.medical.edit', 'idempotency:required']);
            Route::get('/students/{student}', [StudentController::class, 'show'])->middleware('permission:students.view');
            Route::post('/students', [StudentController::class, 'store'])->middleware(['permission:students.create', 'quota:students', 'idempotency:required']);
            Route::patch('/students/{student}', [StudentController::class, 'update'])->middleware(['permission:students.edit', 'idempotency:required']);

            Route::get('/admissions/overview', [AdmissionsController::class, 'overview'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::get('/admissions/applications', [AdmissionsController::class, 'index'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::post('/admissions/applications', [AdmissionsController::class, 'store'])->middleware(['permission:admissions.application.create,admissions.manage', 'idempotency:required']);
            Route::post('/admissions/applications/import', [AdmissionsController::class, 'importApplications'])->middleware(['permission:admissions.application.create,admissions.manage', 'throttle:uploads', 'idempotency:required']);
            Route::get('/admissions/applications/{application}', [AdmissionsController::class, 'show'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::patch('/admissions/applications/{application}', [AdmissionsController::class, 'update'])->middleware(['permission:admissions.application.update,admissions.manage', 'idempotency:required']);
            Route::post('/admissions/applications/{application}/transitions', [AdmissionsController::class, 'transition'])->middleware(['permission:admissions.application.update,admissions.manage', 'idempotency:required']);
            Route::get('/admissions/screening', [AdmissionsController::class, 'screeningQueue'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::post('/admissions/applications/{application}/screenings', [AdmissionsController::class, 'screen'])->middleware(['permission:admissions.screening.manage,admissions.manage', 'idempotency:required']);
            Route::get('/admissions/decisions', [AdmissionsController::class, 'decisionQueue'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::post('/admissions/applications/{application}/decision', [AdmissionsController::class, 'decide'])->middleware(['permission:admissions.decision.manage,admissions.manage', 'idempotency:required']);
            Route::get('/admissions/enrolment', [AdmissionsController::class, 'enrolmentQueue'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::post('/admissions/applications/{application}/convert', [AdmissionsController::class, 'convert'])->middleware(['permission:admissions.enrolment.convert,admissions.manage', 'quota:students', 'idempotency:required']);
            Route::get('/admissions/applications/{application}/documents', [AdmissionDocumentController::class, 'index'])->middleware('permission:admissions.document.manage,admissions.manage');
            Route::post('/admissions/applications/{application}/documents', [AdmissionDocumentController::class, 'store'])->middleware(['permission:admissions.document.manage,admissions.manage', 'quota:storage_bytes', 'throttle:uploads', 'idempotency:required']);
            Route::get('/admissions/applications/{application}/documents/{document}/download', [AdmissionDocumentController::class, 'download'])->middleware('permission:admissions.document.manage,admissions.manage');
            Route::delete('/admissions/applications/{application}/documents/{document}', [AdmissionDocumentController::class, 'destroy'])->middleware(['permission:admissions.document.manage,admissions.manage', 'idempotency:required']);
            Route::get('/admissions/settings', [AdmissionsController::class, 'settings'])->middleware('permission:admissions.application.view,admissions.manage');
            Route::put('/admissions/settings/cycle', [AdmissionsController::class, 'upsertCycle'])->middleware(['permission:admissions.settings.update,admissions.manage', 'idempotency:required']);

            Route::get('/attendance/classes', [AttendanceController::class, 'classes'])->middleware('permission:attendance.view');
            Route::get('/attendance/classes/{class}', [AttendanceController::class, 'show'])->middleware('permission:attendance.view');
            Route::put('/attendance/classes/{class}', [AttendanceController::class, 'update'])->middleware(['permission:attendance.create', 'idempotency:required']);

            Route::get('/lookups/assessment-creation', [AssessmentController::class, 'lookups']);
            Route::get('/assessments/overview', [AssessmentController::class, 'overview']);
            Route::post('/assessments/import', [AssessmentController::class, 'import'])->middleware('idempotency:required');
            Route::get('/assessments/participants', [AssessmentController::class, 'participants']);
            Route::match(['get', 'put'], '/assessments/settings', [AssessmentController::class, 'settings']);
            Route::get('/assessment-questions', [AssessmentQuestionController::class, 'index']);
            Route::post('/assessment-questions', [AssessmentQuestionController::class, 'store'])->middleware('idempotency:required');
            Route::patch('/assessment-questions/{question}', [AssessmentQuestionController::class, 'update'])->middleware('idempotency:required');
            Route::get('/assessments', [AssessmentController::class, 'index'])->middleware('permission:assessments.view');
            Route::post('/assessments', [AssessmentController::class, 'store'])->middleware(['permission:assessment.create', 'idempotency:required']);
            Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);
            Route::get('/assessments/{assessment}/papers', [AssessmentController::class, 'papers']);
            Route::get('/assessments/{assessment}/item-analytics', [AssessmentController::class, 'itemAnalytics']);
            Route::get('/assessments/{assessment}/export', [AssessmentController::class, 'exportScores']);
            Route::post('/assessments/{assessment}/theory/{student}/suggest', [AssessmentController::class, 'theorySuggest'])->middleware(['permission:scores.edit', 'idempotency:required']);
            Route::post('/assessments/{assessment}/theory/{student}/apply', [AssessmentController::class, 'theoryApply'])->middleware(['permission:scores.edit', 'idempotency:required']);
            Route::get('/assessments/{assessment}/moderation', [AssessmentController::class, 'moderation']);
            Route::post('/assessments/{assessment}/transition', [AssessmentController::class, 'transition'])->middleware('idempotency:required');
            Route::match(['get', 'put'], '/assessments/{assessment}/questions', [AssessmentQuestionController::class, 'builder']);
            Route::patch('/assessments/{assessment}', [AssessmentController::class, 'update'])->middleware(['permission:assessment.create', 'idempotency:required']);
            Route::get('/assessments/{assessment}/scores', [AssessmentController::class, 'scores'])->middleware('permission:assessments.view');
            Route::put('/assessments/{assessment}/scores', [AssessmentController::class, 'updateScores'])->middleware(['permission:scores.edit', 'idempotency:required']);

            Route::get('/results', [ResultController::class, 'index'])->middleware('permission:results.view');
            Route::post('/results/generate', [ResultController::class, 'generate'])->middleware(['permission:results.publish', 'idempotency:required']);
            Route::post('/results/bulk-publish', [ResultController::class, 'bulkPublish'])->middleware(['permission:results.publish', 'idempotency:required']);
            Route::get('/results/{publication}', [ResultController::class, 'show'])->middleware('permission:results.view');
            Route::post('/results/{publication}/actions/{action}', [ResultController::class, 'transition'])->middleware(['permission:results.view', 'idempotency:required']);
            Route::get('/students/imports/template', [StudentImportController::class, 'template'])->middleware('permission:students.create');
            Route::post('/students/imports/validate', [StudentImportController::class, 'validateUpload'])->middleware(['permission:students.create', 'throttle:uploads']);
            Route::post('/students/imports/confirm', [StudentImportController::class, 'confirm'])->middleware(['permission:students.create', 'quota:students', 'idempotency:required']);
            Route::get('/parent/children', [ParentController::class, 'children'])->middleware('permission:results.view');

            Route::get('/reports', [ReportController::class, 'index'])->middleware('permission:reports.view');
            Route::post('/reports/jobs', [ReportController::class, 'store'])->middleware(['permission:reports.export', 'idempotency:required']);
            Route::get('/reports/jobs/{job}', [ReportController::class, 'show'])->middleware('permission:reports.view');
            Route::get('/reports/jobs/{job}/download', [ReportController::class, 'download'])->middleware(['permission:reports.view']);

            Route::get('/payments', [PaymentController::class, 'index'])->middleware('permission:finance.view');
            Route::post('/payments', [PaymentController::class, 'store'])->middleware(['permission:finance.manage', 'idempotency:required']);

            Route::get('/announcements', [AnnouncementController::class, 'index'])->middleware('permission:students.view');
            Route::post('/announcements', [AnnouncementController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/messages', [MessageController::class, 'index'])->middleware('permission:students.view');
            Route::post('/messages', [MessageController::class, 'store'])->middleware(['permission:students.view', 'idempotency:required']);
            Route::get('/smartmark/batches', [SmartmarkController::class, 'index'])->middleware('permission:assessments.view');
            Route::post('/smartmark/batches', [SmartmarkController::class, 'store'])->middleware(['permission:assessment.smartmark.process', 'throttle:uploads', 'idempotency:required']);
            Route::get('/smartmark/batches/{batch}', [SmartmarkController::class, 'show'])->middleware('permission:assessments.view');
            Route::get('/smartmark/batches/{batch}/scan', [SmartmarkController::class, 'scan'])->middleware('permission:assessments.view');
            Route::patch('/smartmark/sheets/{sheet}', [SmartmarkController::class, 'review'])->middleware(['permission:assessment.smartmark.review', 'idempotency:required']);
            Route::post('/smartmark/batches/{batch}/commit', [SmartmarkController::class, 'commit'])->middleware(['permission:assessment.smartmark.review', 'idempotency:required']);
            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->middleware('idempotency:required');
            Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->middleware('idempotency:required');

            Route::get('/departments', [DepartmentController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/departments', [DepartmentController::class, 'store'])->middleware(['permission:users.manage', 'idempotency:required']);
            Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/employees', [EmployeeController::class, 'store'])->middleware(['permission:users.manage', 'idempotency:required']);
            Route::patch('/employees/{employee}', [EmployeeController::class, 'update'])->middleware(['permission:users.manage', 'idempotency:required']);

            Route::get('/invites', [InviteController::class, 'index'])->middleware(['account-module:invitations', 'permission:users.manage']);
            Route::post('/invites', [InviteController::class, 'store'])->middleware(['account-module:invitations', 'permission:users.manage', 'idempotency:required']);
            Route::delete('/invites/{invitation}', [InviteController::class, 'destroy'])->middleware(['account-module:invitations', 'permission:users.manage', 'idempotency:required']);

            Route::get('/school/memberships', [TenantMembershipController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/school/memberships', [TenantMembershipController::class, 'store'])->middleware(['permission:roles.manage', 'idempotency:required']);
            Route::patch('/school/memberships/{membership}', [TenantMembershipController::class, 'update'])->middleware(['permission:roles.manage', 'idempotency:required']);

            Route::get('/school-modules/catalog', [SchoolModuleRecordController::class, 'catalog']);
            Route::get('/school-modules/{module}', [SchoolModuleRecordController::class, 'index']);
            Route::post('/school-modules/{module}', [SchoolModuleRecordController::class, 'store'])->middleware('idempotency:required');
            Route::patch('/school-modules/{module}/{record}', [SchoolModuleRecordController::class, 'update'])->middleware('idempotency:required');

            Route::get('/school-structure/{resource}', [SchoolStructureController::class, 'index']);
            Route::post('/school-structure/{resource}', [SchoolStructureController::class, 'store'])->middleware('idempotency:required');
            Route::patch('/school-structure/{resource}/{id}', [SchoolStructureController::class, 'update'])->middleware('idempotency:required');

            Route::get('/performance/{view}', [PerformanceController::class, 'show']);
            Route::get('/guardians', [GuardianController::class, 'index'])->middleware('permission:students.view');
            Route::post('/guardians', [GuardianController::class, 'store'])->middleware(['permission:students.create', 'idempotency:required']);
            Route::get('/audit-logs', [TenantAuditController::class, 'index'])->middleware('permission:audit.view');
            Route::get('/help/tickets', [HelpSupportController::class, 'index']);
            Route::post('/help/tickets', [HelpSupportController::class, 'store'])->middleware('idempotency:required');

            Route::get('/onboarding', [OnboardingController::class, 'show'])->middleware('permission:students.view');
            Route::patch('/onboarding/steps/{stepId}', [OnboardingController::class, 'updateStep'])->middleware(['permission:settings.configure', 'idempotency:required']);

            Route::get('/campuses', [CampusController::class, 'index'])->middleware('permission:settings.configure');
            Route::post('/campuses', [CampusController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/academic-sessions', [AcademicSessionController::class, 'index'])->middleware('permission:settings.configure');
            Route::post('/academic-sessions', [AcademicSessionController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/classes', [ClassController::class, 'index'])->middleware('permission:students.view');
            Route::post('/classes', [ClassController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/subjects', [SubjectController::class, 'index'])->middleware('permission:students.view');
            Route::post('/subjects', [SubjectController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);

            Route::get('/plans', [SubscriptionController::class, 'plans'])->middleware('account-module:subscription');
            Route::get('/subscription', [SubscriptionController::class, 'show'])->middleware('account-module:subscription');

            Route::middleware('permission:platform.view')->prefix('platform')->group(function (): void {
                Route::get('/plans', [PlatformController::class, 'plans'])->middleware('account-module:platform-configuration');
                Route::patch('/plans/{plan}', [PlatformController::class, 'updatePlan'])->middleware(['account-module:platform-configuration', 'idempotency:required']);
                Route::get('/overview', [PlatformController::class, 'overview']);
                Route::get('/schools', [PlatformController::class, 'schools']);
                Route::patch('/schools/{tenant}/status', [PlatformController::class, 'updateSchoolStatus'])->middleware('idempotency:required');
                Route::get('/subscriptions', [PlatformController::class, 'subscriptions']);
                Route::get('/usage', [PlatformController::class, 'usage']);
                Route::get('/support', [PlatformController::class, 'support']);
                Route::get('/system-health', [PlatformController::class, 'systemHealth']);
                Route::get('/go-live', [PlatformController::class, 'goLive']);
                Route::get('/audit', [PlatformController::class, 'audit']);

                Route::get('/tickets', [PlatformOpsController::class, 'tickets']);
                Route::post('/tickets', [PlatformOpsController::class, 'storeTicket'])->middleware('idempotency:required');
                Route::get('/tickets/{ticket}', [PlatformOpsController::class, 'showTicket']);
                Route::post('/tickets/{ticket}/reply', [PlatformOpsController::class, 'replyTicket'])->middleware('idempotency:required');
                Route::post('/tickets/{ticket}/resolve', [PlatformOpsController::class, 'resolveTicket'])->middleware('idempotency:required');

                Route::get('/invoices', [PlatformOpsController::class, 'invoices']);
                Route::post('/invoices/generate', [PlatformOpsController::class, 'generateInvoices'])->middleware('idempotency:required');
                Route::post('/invoices/{invoice}/mark-paid', [PlatformOpsController::class, 'markInvoicePaid'])->middleware('idempotency:required');
                Route::post('/invoices/{invoice}/remind', [PlatformOpsController::class, 'remindInvoice'])->middleware('idempotency:required');

                Route::get('/broadcasts', [PlatformOpsController::class, 'broadcasts']);
                Route::post('/broadcasts', [PlatformOpsController::class, 'storeBroadcast'])->middleware('idempotency:required');

                Route::get('/backups', [PlatformOpsController::class, 'backups']);
                Route::post('/backups', [PlatformOpsController::class, 'createBackup'])->middleware('idempotency:required');

                Route::get('/api-credentials', [PlatformOpsController::class, 'apiCredentials']);
                Route::post('/api-credentials/{credential}/rotate', [PlatformOpsController::class, 'rotateApiCredential'])->middleware('idempotency:required');
            });

            Route::get('/library/curriculum', [LibraryResourceController::class, 'curriculum'])->middleware('permission:library.view');
            Route::get('/library/resources', [LibraryResourceController::class, 'index'])->middleware('permission:library.view');
            Route::post('/library/resources', [LibraryResourceController::class, 'store'])->middleware(['permission:library.create', 'quota:storage_bytes', 'throttle:uploads', 'idempotency:required']);
            Route::patch('/library/resources/{resource}', [LibraryResourceController::class, 'update'])->middleware(['permission:library.create', 'quota:storage_bytes', 'throttle:uploads', 'idempotency:required']);
            Route::post('/library/resources/{resource}/archive', [LibraryResourceController::class, 'archive'])->middleware(['permission:library.create', 'idempotency:required']);
            Route::get('/library/resources/{resource}/download', [LibraryResourceController::class, 'download'])->middleware('permission:library.view');
            Route::get('/library/home', [LibraryResourceController::class, 'home'])->middleware('permission:library.view');
            Route::get('/library/views/{view}', [LibraryResourceController::class, 'collection'])->middleware('permission:library.view');
            Route::get('/library/resources/{resource}', [LibraryResourceController::class, 'show'])->middleware('permission:library.view');
            Route::post('/library/resources/{resource}/bookmark', [LibraryResourceController::class, 'bookmark'])->middleware('permission:library.view');
            Route::delete('/library/resources/{resource}/bookmark', [LibraryResourceController::class, 'unbookmark'])->middleware('permission:library.view');
            Route::patch('/library/resources/{resource}/progress', [LibraryResourceController::class, 'progress'])->middleware('permission:library.view');
            Route::post('/library/resources/{resource}/assistant', [LibraryResourceController::class, 'assistant'])->middleware(['permission:library.view', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::get('/library/resources/{resource}/practice', [LibraryResourceController::class, 'practice'])->middleware(['permission:library.view', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::post('/library/practice/{practice}/attempts', [LibraryResourceController::class, 'submitPractice'])->middleware('permission:library.view');
            Route::get('/library/resources/{resource}/assignment-options', [LibraryResourceController::class, 'assignmentOptions'])->middleware('permission:library.assign');
            Route::post('/library/resources/{resource}/assignments', [LibraryResourceController::class, 'assign'])->middleware(['permission:library.assign', 'idempotency:required']);
            Route::get('/library/parent/help-options', [LibraryResourceController::class, 'parentHelpOptions'])->middleware('permission:library.view');
            Route::post('/library/parent/help-plans', [LibraryResourceController::class, 'createParentHelpPlan'])->middleware(['permission:library.view', 'throttle:ai', 'quota:ai_requests_per_day', 'idempotency:required']);
            Route::get('/library/resources/{resource}/annotations', [LibraryAnnotationController::class, 'index'])->middleware('permission:library.view');
            Route::post('/library/resources/{resource}/annotations', [LibraryAnnotationController::class, 'store'])->middleware(['permission:library.annotate', 'idempotency:required']);
            Route::patch('/library/resources/{resource}/annotations/{annotation}', [LibraryAnnotationController::class, 'update'])->middleware('permission:library.annotate');
            Route::delete('/library/resources/{resource}/annotations/{annotation}', [LibraryAnnotationController::class, 'destroy'])->middleware('permission:library.annotate');
            Route::post('/library/resources/{resource}/annotations/transcribe', [LibraryAnnotationController::class, 'transcribe'])->middleware(['permission:library.annotate', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::post('/library/resources/{resource}/summary', [LibraryToolController::class, 'summary'])->middleware(['permission:library.view', 'throttle:ai', 'quota:ai_requests_per_day']);
            Route::get('/library/resources/{resource}/versions', [LibraryToolController::class, 'versions'])->middleware('permission:library.version.manage');
            Route::post('/library/resources/{resource}/versions/{version}/restore', [LibraryToolController::class, 'restore'])->middleware(['permission:library.version.manage', 'idempotency:required']);
            Route::post('/ai/lesson-plan', [AiToolController::class, 'lessonPlan'])->middleware(['permission:ai.generate', 'throttle:ai', 'quota:ai_requests_per_day']);

            Route::post('/library/tools/quiz-generator/inspect', [LibraryToolController::class, 'inspect'])->middleware(['permission:ai.generate', 'throttle:uploads']);
            Route::post('/library/tools/quiz-generator/generate', [LibraryToolController::class, 'generate'])->middleware(['permission:ai.generate', 'throttle:ai', 'quota:ai_requests_per_day', 'idempotency:required']);
            Route::post('/library/tools/quiz-generator/{quiz}/save', [LibraryToolController::class, 'saveQuiz'])->middleware(['permission:assessment.create', 'idempotency:required']);
            Route::post('/library/exports', [LibraryToolController::class, 'createExport'])->middleware(['permission:library.export', 'idempotency:required']);
            Route::get('/library/exports/{job}', [LibraryToolController::class, 'exportJob'])->middleware('permission:library.export');
            Route::get('/library/exports/{job}/download', [LibraryToolController::class, 'downloadExport'])->middleware(['permission:library.export']);
            Route::get('/library/pathway', [LibraryToolController::class, 'pathway'])->middleware('permission:library.view');
            Route::get('/library/teacher/quiz-performance', [LibraryToolController::class, 'quizPerformance'])->middleware('permission:library.insights');
            Route::get('/library/teacher/usage-insights', [LibraryToolController::class, 'usageInsights'])->middleware('permission:library.insights');
        });
    });
});

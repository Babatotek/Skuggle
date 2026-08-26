<?php

use App\Http\Controllers\Api\V1\AcademicSessionController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CampusController;
use App\Http\Controllers\Api\V1\ClassController;
use App\Http\Controllers\Api\V1\CustomFieldController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\GeoController;
use App\Http\Controllers\Api\V1\LibraryAnnotationController;
use App\Http\Controllers\Api\V1\LibraryResourceController;
use App\Http\Controllers\Api\V1\LibraryToolController;
use App\Http\Controllers\Api\V1\InviteController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\MfaController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\ParentController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PlatformController;
use App\Http\Controllers\Api\V1\PlatformOpsController;
use App\Http\Controllers\Api\V1\PublicResultController;
use App\Http\Controllers\Api\V1\RegistrationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ResultController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\StudentImportController;
use App\Http\Controllers\Api\V1\SubjectController;
use App\Http\Controllers\Api\V1\SubscriptionController;
use App\Http\Controllers\Api\V1\SyncController;
use Illuminate\Support\Facades\Route;

// Health check endpoints live in routes/web.php (no /api prefix, no auth required)
// so load balancers and k8s probes can reach /health, /ready, /startup, /live directly.

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/auth/two-factor-challenge', [AuthController::class, 'twoFactorChallenge'])->middleware('throttle:two-factor');
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');
    Route::get('/auth/google/redirect', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'redirect'])->middleware('throttle:20,1');
    Route::get('/auth/google/callback', [\App\Http\Controllers\Api\V1\GoogleAuthController::class, 'callback'])->middleware('throttle:20,1');
    // Logout must run even when the session is half-dead so cookies are always cleared.
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:api');
    Route::post('/schools/register', [RegistrationController::class, 'school'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::post('/individuals/register', [RegistrationController::class, 'individual'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::get('/invites/{token}', [InviteController::class, 'show'])->middleware('throttle:api');
    Route::post('/invites/{token}/accept', [InviteController::class, 'accept'])->middleware(['throttle:5,1', 'idempotency:required']);
    Route::post('/public/results/check', [PublicResultController::class, 'check'])->middleware('throttle:public-results');
    Route::get('/public/results/view', [PublicResultController::class, 'view'])->middleware('throttle:public-results');
    Route::post('/webhooks/payments/{provider}', [PaymentController::class, 'webhook'])->middleware('throttle:api');

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
        Route::post('/auth/mfa/enable', [MfaController::class, 'enable']);
        Route::post('/auth/mfa/confirm', [MfaController::class, 'confirm']);
        Route::get('/auth/mfa/qr-code', [MfaController::class, 'qrCode']);
        Route::post('/auth/mfa/recovery-codes', [MfaController::class, 'recoveryCodes']);
        Route::delete('/auth/mfa', [MfaController::class, 'disable']);

        Route::middleware(['verified', 'mfa'])->group(function (): void {
            Route::get('/dashboards/{experience}', [DashboardController::class, 'show']);
            Route::post('/sync', [SyncController::class, 'store'])->middleware('idempotency:required');

            Route::get('/lookups/student-registration', [StudentController::class, 'lookups'])->middleware('permission:students.create');
            Route::get('/lookups/staff-registration', [EmployeeController::class, 'lookups'])->middleware('permission:users.manage');
            Route::get('/custom-fields/{entity}', [CustomFieldController::class, 'show'])->middleware('permission:settings.configure');
            Route::put('/custom-fields/{entity}', [CustomFieldController::class, 'update'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/students', [StudentController::class, 'index'])->middleware('permission:students.view');
            Route::get('/students/{student}', [StudentController::class, 'show'])->middleware('permission:students.view');
            Route::post('/students', [StudentController::class, 'store'])->middleware(['permission:students.create', 'quota:students', 'idempotency:required']);

            Route::get('/attendance/classes', [AttendanceController::class, 'classes'])->middleware('permission:attendance.view');
            Route::get('/attendance/classes/{class}', [AttendanceController::class, 'show'])->middleware('permission:attendance.view');
            Route::put('/attendance/classes/{class}', [AttendanceController::class, 'update'])->middleware(['permission:attendance.create', 'idempotency:required']);

            Route::get('/lookups/assessment-creation', [AssessmentController::class, 'lookups'])->middleware('permission:assessment.create');
            Route::get('/assessments', [AssessmentController::class, 'index'])->middleware('permission:assessments.view');
            Route::post('/assessments', [AssessmentController::class, 'store'])->middleware(['permission:assessment.create', 'idempotency:required']);
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

            Route::get('/departments', [DepartmentController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/departments', [DepartmentController::class, 'store'])->middleware(['permission:users.manage', 'idempotency:required']);
            Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/employees', [EmployeeController::class, 'store'])->middleware(['permission:users.manage', 'idempotency:required']);

            Route::get('/invites', [InviteController::class, 'index'])->middleware('permission:users.manage');
            Route::post('/invites', [InviteController::class, 'store'])->middleware(['permission:users.manage', 'idempotency:required']);
            Route::delete('/invites/{invitation}', [InviteController::class, 'destroy'])->middleware(['permission:users.manage', 'idempotency:required']);

            Route::get('/onboarding', [OnboardingController::class, 'show'])->middleware('permission:settings.configure');
            Route::patch('/onboarding/steps/{stepId}', [OnboardingController::class, 'updateStep'])->middleware(['permission:settings.configure', 'idempotency:required']);

            Route::get('/campuses', [CampusController::class, 'index'])->middleware('permission:settings.configure');
            Route::post('/campuses', [CampusController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/academic-sessions', [AcademicSessionController::class, 'index'])->middleware('permission:settings.configure');
            Route::post('/academic-sessions', [AcademicSessionController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/classes', [ClassController::class, 'index'])->middleware('permission:students.view');
            Route::post('/classes', [ClassController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);
            Route::get('/subjects', [SubjectController::class, 'index'])->middleware('permission:students.view');
            Route::post('/subjects', [SubjectController::class, 'store'])->middleware(['permission:settings.configure', 'idempotency:required']);

            Route::get('/plans', [SubscriptionController::class, 'plans']);
            Route::get('/subscription', [SubscriptionController::class, 'show'])->middleware('permission:settings.configure');

            Route::middleware('permission:platform.view')->prefix('platform')->group(function (): void {
                Route::get('/overview', [PlatformController::class, 'overview']);
                Route::get('/schools', [PlatformController::class, 'schools']);
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

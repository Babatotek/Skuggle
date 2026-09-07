<?php

use App\Domain\School\SchoolModuleCatalog;
use App\Http\Controllers\Api\V1\GuardianController;
use App\Http\Controllers\Api\V1\HelpSupportController;
use App\Http\Controllers\Api\V1\PerformanceController;
use App\Http\Controllers\Api\V1\SchoolStructureController;
use App\Http\Controllers\Api\V1\TenantAuditController;
use App\Models\AcademicSession;
use App\Models\SchoolModuleRecord;
use App\Models\TeacherAssignment;
use App\Services\PerformanceService;
use Tests\TestCase;

class SchoolIaSmokeTest extends TestCase
{
    public function test_catalog_and_models_are_wired(): void
    {
        $this->assertNotEmpty(SchoolModuleCatalog::all());
        $this->assertNull(SchoolModuleCatalog::get('admissions-applications'));
        $this->assertContains('admissions.manage', SchoolModuleCatalog::permissionNames());
        $this->assertTrue(class_exists(SchoolModuleRecord::class));
        $this->assertTrue(class_exists(SchoolStructureController::class));
        $this->assertTrue(class_exists(PerformanceController::class));
        $this->assertTrue(class_exists(GuardianController::class));
        $this->assertTrue(class_exists(HelpSupportController::class));
        $this->assertTrue(class_exists(TenantAuditController::class));
        $this->assertTrue(method_exists(AcademicSession::class, 'terms'));
        $this->assertTrue(method_exists(TeacherAssignment::class, 'schoolClass'));
        $this->assertTrue(method_exists(PerformanceService::class, 'view'));
    }
}

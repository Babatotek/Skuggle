<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\ResultPublication;
use App\Models\Tenant;
use App\Services\ResultReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicResultController extends Controller
{
    public function __construct(
        private readonly ResultReportService $reports,
        private readonly TenantContext $context,
    ) {}

    public function check(Request $request): JsonResponse
    {
        $data = $request->validate([
            'admissionNumber' => ['required', 'string', 'max:64'],
            'session' => ['required', 'string', 'max:64'],
            'term' => ['required', 'string', 'max:64'],
            'pin' => ['required', 'string', 'min:6', 'max:32'],
        ]);

        $candidates = DB::table('result_publications as publication')
            ->join('students', 'students.id', '=', 'publication.student_id')
            ->join('tenants', 'tenants.id', '=', 'publication.tenant_id')
            ->join('academic_sessions', 'academic_sessions.id', '=', 'publication.academic_session_id')
            ->join('terms', 'terms.id', '=', 'publication.term_id')
            ->leftJoin('enrollments', function ($join): void {
                $join->on('enrollments.student_id', '=', 'students.id')
                    ->on('enrollments.academic_session_id', '=', 'academic_sessions.id');
            })
            ->leftJoin('school_classes', 'school_classes.id', '=', 'enrollments.class_id')
            ->where('students.admission_number', $data['admissionNumber'])
            ->where('academic_sessions.name', $data['session'])
            ->where('terms.name', $data['term'])
            ->where('publication.status', 'published')
            ->whereNull('students.deleted_at')
            ->select([
                'publication.id',
                'publication.public_id',
                'publication.tenant_id',
                'students.first_name',
                'students.last_name',
                'tenants.name as school_name',
                'academic_sessions.name as session_name',
                'terms.name as term_name',
                'school_classes.name as class_name',
            ])
            ->limit(2)
            ->get();

        if ($candidates->count() !== 1) {
            return ApiResponse::error('RESULT_NOT_VERIFIED', 'The result details or PIN could not be verified.', 404);
        }

        $result = $candidates->first();
        $pins = DB::table('result_pins')
            ->where('result_publication_id', $result->id)
            ->where('usage_count', '<', DB::raw('usage_limit'))
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->get();

        $pin = $pins->first(fn ($candidate) => Hash::check($data['pin'], $candidate->pin_hash));
        if (! $pin) {
            return ApiResponse::error('RESULT_NOT_VERIFIED', 'The result details or PIN could not be verified.', 404);
        }

        DB::transaction(function () use ($pin): void {
            $fresh = DB::table('result_pins')->where('id', $pin->id)->lockForUpdate()->first();
            if ($fresh && $fresh->usage_count < $fresh->usage_limit) {
                DB::table('result_pins')->where('id', $pin->id)->update([
                    'usage_count' => $fresh->usage_count + 1,
                    'last_used_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        $viewToken = Str::random(64);
        Cache::put("result_view:{$viewToken}", (int) $result->id, now()->addMinutes(15));

        return ApiResponse::success([
            'studentDisplayName' => $result->first_name.' '.mb_substr($result->last_name, 0, 1).'.',
            'className' => $result->class_name ?? '',
            'schoolName' => $result->school_name,
            'session' => $result->session_name,
            'term' => $result->term_name,
            'viewToken' => $viewToken,
            'viewExpiresInSeconds' => 900,
        ]);
    }

    public function view(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64']]);
        $publicationId = Cache::get("result_view:{$data['token']}");

        if (! $publicationId) {
            return ApiResponse::error('VIEW_TOKEN_EXPIRED', 'This result view link has expired. Verify your PIN again.', 404);
        }

        $publication = ResultPublication::query()
            ->withoutGlobalScopes()
            ->whereKey($publicationId)
            ->where('status', 'published')
            ->first();

        if (! $publication) {
            return ApiResponse::error('RESULT_NOT_AVAILABLE', 'The requested result is no longer available.', 404);
        }

        $tenant = Tenant::query()->find($publication->tenant_id);
        if (! $tenant) {
            return ApiResponse::error('RESULT_NOT_AVAILABLE', 'The requested result is no longer available.', 404);
        }

        $this->context->setPublicTenant($tenant);

        try {
            return ApiResponse::success($this->reports->buildForPublication($publication));
        } finally {
            $this->context->clear();
        }
    }
}

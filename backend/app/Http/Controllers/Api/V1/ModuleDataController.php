<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TenantModuleData;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ModuleDataController extends Controller
{
    private const MODULES = ['timetable', 'fee-structure'];

    public function show(string $module): JsonResponse
    {
        abort_unless(in_array($module, self::MODULES, true), 404);
        $record = TenantModuleData::query()->where('module', $module)->first();

        return ApiResponse::success([
            'module' => $module,
            'payload' => $record?->payload ?? [],
            'revision' => $record?->revision ?? 0,
            'updatedAt' => $record?->updated_at?->toIso8601String(),
        ]);
    }

    public function update(string $module, Request $request, AuditLogger $audit): JsonResponse
    {
        abort_unless(in_array($module, self::MODULES, true), 404);
        $data = $request->validate([
            'payload' => ['required', 'array'],
            'revision' => ['required', 'integer', 'min:0'],
        ]);

        $record = TenantModuleData::query()->where('module', $module)->first();
        if ($record && $record->revision !== $data['revision']) {
            return ApiResponse::error('REVISION_CONFLICT', 'This module was changed by another user. Reload it and try again.', 409);
        }

        $record ??= new TenantModuleData(['module' => $module]);
        $record->payload = $data['payload'];
        $record->revision = ($record->revision ?? 0) + 1;
        $record->updated_by = $request->user()->getKey();
        $record->save();
        $audit->record('module_data.updated', $record, [], [], ['module' => $module, 'revision' => $record->revision]);

        return ApiResponse::success([
            'module' => $module,
            'payload' => $record->payload,
            'revision' => $record->revision,
            'updatedAt' => $record->updated_at?->toIso8601String(),
        ]);
    }
}

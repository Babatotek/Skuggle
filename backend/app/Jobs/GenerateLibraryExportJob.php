<?php

namespace App\Jobs;

use App\Domain\Tenancy\TenantContext;
use App\Models\ExportJob;
use App\Models\LibraryResource;
use App\Models\Tenant;
use App\Models\TenantMembership;
use App\Services\SimplePdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateLibraryExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 300;

    public array $backoff = [15, 60, 180];

    public function __construct(public readonly int $exportJobId)
    {
        $this->onQueue('exports');
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping("library-export:{$this->exportJobId}"))->expireAfter(360)];
    }

    public function handle(TenantContext $context, SimplePdf $pdf): void
    {
        $job = ExportJob::query()->withoutGlobalScopes()->findOrFail($this->exportJobId);
        $tenant = Tenant::query()->findOrFail($job->tenant_id);
        $membership = TenantMembership::query()->with(['tenant', 'role.permissions'])->where('tenant_id', $tenant->getKey())->where('user_id', $job->requested_by)->firstOrFail();
        $context->set($tenant, $membership);
        try {
            $job->update(['state' => 'processing', 'progress_percent' => 10, 'message' => 'Collecting resources']);
            $resources = LibraryResource::query()->whereIn('public_id', $job->resource_ids)->where('status', 'published')->get()->keyBy('public_id');
            if ($resources->count() !== count($job->resource_ids)) {
                throw new \RuntimeException('One or more export resources are unavailable.');
            }
            $pages = [];
            if ($job->include_cover_page) {
                $pages[] = [$job->title, '', 'Prepared with Skuggle', 'Generated '.now()->toDayDateTimeString(), '', 'Resources: '.count($job->resource_ids)];
            }
            foreach ($job->resource_ids as $index => $publicId) {
                $resource = $resources->get($publicId);
                $lines = [$resource->title, trim(($resource->author ? 'Author: '.$resource->author : '').' '.($resource->source_label ? 'Source: '.$resource->source_label : '')), ''];
                foreach ($resource->sections ?? [] as $section) {
                    $lines[] = strtoupper((string) ($section['title'] ?? 'Section'));
                    foreach (preg_split('/\R/u', wordwrap(strip_tags((string) ($section['content'] ?? '')), 90)) ?: [] as $line) {
                        $lines[] = $line;
                    } $lines[] = '';
                }
                foreach (array_chunk($lines, 48) as $page) {
                    $pages[] = $page;
                }
                $job->update(['progress_percent' => min(85, 15 + (int) ((($index + 1) / count($job->resource_ids)) * 70))]);
            }
            $content = $pdf->make($pages);
            $filename = str($job->title)->slug().'-'.now()->format('Ymd-His').'.pdf';
            $key = "tenants/{$tenant->public_id}/library-exports/{$job->public_id}/{$filename}";
            Storage::disk((string) config('skuggle.library.disk'))->put($key, $content, ['visibility' => 'private']);
            $job->update(['state' => 'complete', 'progress_percent' => 100, 'message' => 'Student handout ready', 'storage_key' => $key, 'filename' => $filename, 'expires_at' => now()->addMinutes((int) config('skuggle.library.export_ttl_minutes'))]);
        } finally {
            $context->clear();
        }
    }

    public function failed(\Throwable $exception): void
    {
        ExportJob::query()->withoutGlobalScopes()->whereKey($this->exportJobId)->update(['state' => 'failed', 'message' => 'The handout could not be generated. Retry the export.']);
    }
}

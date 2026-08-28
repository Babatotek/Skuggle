<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use Illuminate\Support\Facades\Cache;

/**
 * LookupCacheService
 *
 * Centralises cache key generation and TTL management for reference-data
 * lookup endpoints that are read-heavy and rarely change:
 *  - curriculum   (classes, subjects, terms)
 *  - subjects list
 *  - classes list
 *
 * All keys are tenant-scoped.  Mutations (create/update/delete on the
 * underlying models) must call forget() to bust the relevant caches.
 *
 * TTLs (configurable via env):
 *  CACHE_CURRICULUM_TTL_SECONDS  default 300  (5 min — terms change infrequently)
 *  CACHE_SUBJECTS_TTL_SECONDS    default 120  (2 min)
 *  CACHE_CLASSES_TTL_SECONDS     default 120  (2 min)
 */
final class LookupCacheService
{
    public function __construct(private readonly TenantContext $context) {}

    // -----------------------------------------------------------------------
    // Curriculum
    // -----------------------------------------------------------------------

    public function curriculumKey(): string
    {
        return $this->context->cacheKey('lookup:curriculum');
    }

    public function curriculumTtl(): int
    {
        return (int) config('skuggle.cache_ttl.curriculum', 300);
    }

    /** @param callable(): array $callback */
    public function rememberCurriculum(callable $callback): array
    {
        return Cache::remember($this->curriculumKey(), $this->curriculumTtl(), $callback);
    }

    public function forgetCurriculum(): void
    {
        Cache::forget($this->curriculumKey());
    }

    // -----------------------------------------------------------------------
    // Subjects
    // -----------------------------------------------------------------------

    public function subjectsKey(): string
    {
        return $this->context->cacheKey('lookup:subjects');
    }

    public function subjectsTtl(): int
    {
        return (int) config('skuggle.cache_ttl.subjects', 120);
    }

    /** @param callable(): array $callback */
    public function rememberSubjects(callable $callback): array
    {
        return Cache::remember($this->subjectsKey(), $this->subjectsTtl(), $callback);
    }

    public function forgetSubjects(): void
    {
        Cache::forget($this->subjectsKey());
    }

    // -----------------------------------------------------------------------
    // School classes
    // -----------------------------------------------------------------------

    public function classesKey(): string
    {
        return $this->context->cacheKey('lookup:classes');
    }

    public function classesTtl(): int
    {
        return (int) config('skuggle.cache_ttl.classes', 120);
    }

    /** @param callable(): array $callback */
    public function rememberClasses(callable $callback): array
    {
        return Cache::remember($this->classesKey(), $this->classesTtl(), $callback);
    }

    public function forgetClasses(): void
    {
        Cache::forget($this->classesKey());
    }

    // -----------------------------------------------------------------------
    // Bust all lookup caches for this tenant
    // -----------------------------------------------------------------------

    public function forgetAll(): void
    {
        $this->forgetCurriculum();
        $this->forgetSubjects();
        $this->forgetClasses();
    }
}

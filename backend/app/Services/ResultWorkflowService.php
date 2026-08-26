<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\ResultPublication;
use Illuminate\Support\Facades\DB;

final class ResultWorkflowService
{
    /** @var array<string, array{next: string, permission: string}> */
    private const TRANSITIONS = [
        'submit' => ['next' => 'submitted', 'permission' => 'results.view'],
        'review' => ['next' => 'under_review', 'permission' => 'results.approve'],
        'approve' => ['next' => 'approved', 'permission' => 'results.approve'],
        'lock' => ['next' => 'locked', 'permission' => 'results.approve'],
        'publish' => ['next' => 'published', 'permission' => 'results.publish'],
        'reopen' => ['next' => 'draft', 'permission' => 'results.publish'],
    ];

    public function __construct(
        private readonly ResultPinService $pins,
        private readonly AuditLogger $audit,
    ) {}

    /** @return array{publication: ResultPublication, issuedPin: ?string} */
    public function apply(ResultPublication $publication, string $action, int $actorUserId): array
    {
        $transition = self::TRANSITIONS[$action] ?? null;
        if (! $transition) {
            throw new ApiException('INVALID_ACTION', 'This result action is not supported.', 422);
        }

        if (! in_array($action, $this->allowedActions($publication->status), true)) {
            throw new ApiException('INVALID_TRANSITION', 'This result cannot be moved to the requested state.', 409);
        }

        $issuedPin = null;

        $publication = DB::transaction(function () use ($publication, $action, $transition, $actorUserId, &$issuedPin): ResultPublication {
            $updates = ['status' => $transition['next'], 'revision' => $publication->revision + 1];

            if ($action === 'publish') {
                $updates['published_at'] = now();
                $updates['published_by'] = $actorUserId;
            }

            if ($action === 'lock') {
                $updates['locked_at'] = now();
            }

            if ($action === 'reopen') {
                $updates['published_at'] = null;
                $updates['locked_at'] = null;
                $updates['published_by'] = null;
            }

            $publication->update($updates);

            if ($action === 'publish') {
                $issuedPin = $this->pins->issueForPublication($publication->fresh());
            }

            $this->audit->record("result.{$action}", $publication, [], [
                'status' => $transition['next'],
                'student_id' => $publication->student_id,
            ]);

            return $publication->fresh(['student.enrollments.schoolClass', 'academicSession', 'term']);
        });

        return ['publication' => $publication, 'issuedPin' => $issuedPin];
    }

    /** @return list<string> */
    public function allowedActions(string $status): array
    {
        return match ($status) {
            'draft' => ['submit'],
            'submitted' => ['review'],
            'under_review' => ['approve'],
            'approved' => ['lock'],
            'locked' => ['publish'],
            'published' => ['reopen'],
            default => [],
        };
    }

    public function requiredPermission(string $action): string
    {
        return self::TRANSITIONS[$action]['permission'] ?? 'results.view';
    }
}

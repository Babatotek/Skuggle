<?php

namespace App\Services\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Domain\Admissions\DecisionType;
use App\Domain\Admissions\ScreeningStatus;
use App\Exceptions\ApiException;
use App\Models\AdmissionApplication;
use App\Models\AdmissionDecision;
use App\Models\AdmissionScreening;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AdmissionLifecycleService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function transition(AdmissionApplication $application, ApplicationStatus $target, ?string $reason, User $actor): AdmissionApplication
    {
        return DB::transaction(function () use ($application, $target, $reason, $actor): AdmissionApplication {
            $locked = AdmissionApplication::query()->lockForUpdate()->findOrFail($application->getKey());
            $current = $locked->statusType();
            if ($current === $target) {
                return $locked;
            }
            if (! $current->canTransitionTo($target)) {
                throw new ApiException(
                    'INVALID_ADMISSION_TRANSITION',
                    "An application cannot move from {$current->value} to {$target->value}.",
                    409,
                );
            }

            $locked->update([
                'status' => $target,
                'submitted_at' => $target === ApplicationStatus::Submitted ? ($locked->submitted_at ?? now()) : $locked->submitted_at,
                'status_changed_at' => now(),
                'updated_by' => $actor->getKey(),
            ]);
            $locked->history()->create([
                'from_status' => $current,
                'to_status' => $target,
                'reason' => $reason,
                'changed_by' => $actor->getKey(),
                'changed_at' => now(),
            ]);
            $this->audit->record('admissions.application.transitioned', $locked, ['status' => $current->value], ['status' => $target->value]);

            return $locked->fresh();
        });
    }

    /** @param array<string, mixed> $data */
    public function recordScreening(AdmissionApplication $application, array $data, User $actor): AdmissionScreening
    {
        $status = ScreeningStatus::from((string) $data['status']);

        return DB::transaction(function () use ($application, $data, $actor, $status): AdmissionScreening {
            $locked = AdmissionApplication::query()->lockForUpdate()->findOrFail($application->getKey());
            if ($status === ScreeningStatus::Scheduled) {
                if ($locked->statusType() === ApplicationStatus::Submitted) {
                    $this->transition($locked, ApplicationStatus::Screening, 'Screening scheduled', $actor);
                } elseif ($locked->statusType() !== ApplicationStatus::Screening) {
                    throw new ApiException('INVALID_ADMISSION_TRANSITION', 'Only submitted or screening applications can be scheduled.', 409);
                }
            } elseif ($locked->statusType() !== ApplicationStatus::Screening) {
                throw new ApiException('INVALID_ADMISSION_TRANSITION', 'Only applications in screening can record an outcome.', 409);
            }

            $screening = $locked->screenings()->create([
                'status' => $status,
                'scheduled_at' => $data['scheduledAt'] ?? ($status === ScreeningStatus::Scheduled ? now() : null),
                'completed_at' => $status === ScreeningStatus::Scheduled ? null : now(),
                'score' => $data['score'] ?? null,
                'notes' => $data['notes'] ?? null,
                'assessed_by' => $actor->getKey(),
            ]);

            if ($status !== ScreeningStatus::Scheduled) {
                $target = $status === ScreeningStatus::Passed ? ApplicationStatus::Screened : ApplicationStatus::Rejected;
                $this->transition($locked, $target, 'Screening '.$status->value, $actor);
            }
            $this->audit->record('admissions.screening.recorded', $locked, [], ['screening_id' => $screening->public_id, 'status' => $status->value]);

            return $screening;
        });
    }

    /** @param array<string, mixed> $data */
    public function recordDecision(AdmissionApplication $application, array $data, User $actor): AdmissionDecision
    {
        $decisionType = DecisionType::from((string) $data['decision']);

        return DB::transaction(function () use ($application, $data, $actor, $decisionType): AdmissionDecision {
            $locked = AdmissionApplication::query()->lockForUpdate()->findOrFail($application->getKey());
            $existing = $locked->decision()->first();
            if ($existing) {
                if ($existing->decisionType() === $decisionType) {
                    return $existing;
                }
                throw new ApiException('ADMISSION_DECISION_EXISTS', 'A final admission decision has already been recorded.', 409);
            }

            $target = match ($decisionType) {
                DecisionType::Offered => ApplicationStatus::Offered,
                DecisionType::Waitlisted => ApplicationStatus::Waitlisted,
                DecisionType::Rejected => ApplicationStatus::Rejected,
            };
            if (! $locked->statusType()->canTransitionTo($target)) {
                throw new ApiException('INVALID_ADMISSION_TRANSITION', "The {$decisionType->value} decision is not valid from {$locked->statusType()->value}.", 409);
            }

            $offeredClass = null;
            if (! empty($data['offeredClassId'])) {
                $offeredClass = SchoolClass::query()->where('public_id', $data['offeredClassId'])->firstOrFail();
            }
            $decision = $locked->decision()->create([
                'offered_class_id' => $offeredClass?->getKey(),
                'decision' => $decisionType,
                'offer_reference' => $data['offerReference'] ?? ($decisionType === DecisionType::Offered ? 'OFFER-'.Str::upper(Str::random(10)) : null),
                'expires_at' => $data['expiresAt'] ?? null,
                'notes' => $data['notes'] ?? null,
                'decided_at' => now(),
                'decided_by' => $actor->getKey(),
            ]);
            $this->transition($locked, $target, 'Admission decision recorded', $actor);
            $this->audit->record('admissions.decision.recorded', $locked, [], ['decision_id' => $decision->public_id, 'decision' => $decisionType->value]);

            return $decision;
        });
    }
}

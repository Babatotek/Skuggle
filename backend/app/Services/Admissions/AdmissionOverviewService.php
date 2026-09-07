<?php

namespace App\Services\Admissions;

use App\Domain\Admissions\ApplicationStatus;
use App\Http\Resources\Admissions\AdmissionApplicationResource;
use App\Models\AdmissionApplication;
use App\Models\AdmissionConversion;
use Illuminate\Support\Carbon;

final class AdmissionOverviewService
{
    /** @return array<string, mixed> */
    public function build(): array
    {
        $counts = AdmissionApplication::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->map(fn ($count) => (int) $count);

        $total = $counts->sum();
        $submittedThisMonth = AdmissionApplication::query()
            ->whereNotNull('submitted_at')
            ->whereBetween('submitted_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();
        $awaitingScreening = ($counts[ApplicationStatus::Submitted->value] ?? 0)
            + ($counts[ApplicationStatus::Screening->value] ?? 0);
        $offers = ($counts[ApplicationStatus::Offered->value] ?? 0)
            + ($counts[ApplicationStatus::Accepted->value] ?? 0);
        $converted = AdmissionConversion::query()->count();
        $decided = $offers
            + ($counts[ApplicationStatus::Declined->value] ?? 0)
            + ($counts[ApplicationStatus::Rejected->value] ?? 0)
            + $converted;

        $months = collect(range(5, 0))->mapWithKeys(function (int $offset): array {
            $month = now()->startOfMonth()->subMonths($offset);

            return [$month->format('Y-m') => [
                'month' => $month->format('Y-m'),
                'label' => $month->format('M'),
                'applications' => 0,
                'conversions' => 0,
            ]];
        });
        AdmissionApplication::query()
            ->where('created_at', '>=', now()->startOfMonth()->subMonths(5))
            ->get(['created_at'])
            ->each(function (AdmissionApplication $application) use ($months): void {
                $key = $application->created_at ? Carbon::parse($application->created_at)->format('Y-m') : null;
                if ($key && $months->has($key)) {
                    $row = $months[$key];
                    $row['applications']++;
                    $months->put($key, $row);
                }
            });
        AdmissionConversion::query()
            ->where('converted_at', '>=', now()->startOfMonth()->subMonths(5))
            ->get(['converted_at'])
            ->each(function (AdmissionConversion $conversion) use ($months): void {
                $key = $conversion->convertedAt()->format('Y-m');
                if ($months->has($key)) {
                    $row = $months[$key];
                    $row['conversions']++;
                    $months->put($key, $row);
                }
            });

        $recent = AdmissionApplication::query()
            ->with(['requestedClass', 'cycle'])
            ->withCount('documents')
            ->latest()
            ->limit(5)
            ->get();

        $tasks = collect([
            ['id' => 'screening', 'label' => 'Applications awaiting screening', 'count' => $awaitingScreening],
            ['id' => 'decisions', 'label' => 'Screened applications awaiting decision', 'count' => $counts[ApplicationStatus::Screened->value] ?? 0],
            ['id' => 'enrolment', 'label' => 'Accepted applicants awaiting enrolment', 'count' => $counts[ApplicationStatus::Accepted->value] ?? 0],
            ['id' => 'expiringOffers', 'label' => 'Offers expiring in seven days', 'count' => $this->expiringOffers()],
        ])->filter(fn (array $task): bool => $task['count'] > 0)->values()->all();

        return [
            'metrics' => [
                ['id' => 'totalApplications', 'label' => 'Total applications', 'value' => $total],
                ['id' => 'submittedThisMonth', 'label' => 'Submitted this month', 'value' => $submittedThisMonth],
                ['id' => 'awaitingScreening', 'label' => 'Awaiting screening', 'value' => $awaitingScreening],
                ['id' => 'offersAndAcceptances', 'label' => 'Offers and acceptances', 'value' => $offers],
            ],
            'pipeline' => collect(ApplicationStatus::cases())->map(fn (ApplicationStatus $status) => [
                'status' => $status->value,
                'count' => $counts[$status->value] ?? 0,
            ])->values(),
            'recentApplications' => AdmissionApplicationResource::collection($recent)->resolve(),
            'trend' => $months->values(),
            'tasks' => $tasks,
            'conversion' => [
                'converted' => $converted,
                'decided' => $decided,
                'rate' => $total > 0 ? round(($converted / $total) * 100, 1) : 0.0,
            ],
            'generatedAt' => Carbon::now()->toIso8601String(),
        ];
    }

    private function expiringOffers(): int
    {
        return AdmissionApplication::query()
            ->where('status', ApplicationStatus::Offered->value)
            ->whereHas('decision', fn ($query) => $query
                ->whereDate('expires_at', '>=', today())
                ->whereDate('expires_at', '<=', today()->addDays(7)))
            ->count();
    }
}

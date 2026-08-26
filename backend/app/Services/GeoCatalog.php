<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Cache;

final class GeoCatalog
{
    private const DATASETS = [
        'NG' => 'ng.json',
        'GH' => 'gh.json',
        'KE' => 'ke.json',
        'US' => 'us.json',
    ];

    /** @return list<array<string, mixed>> */
    public function countries(): array
    {
        return Cache::remember('geo.countries', 86400, function (): array {
            $path = resource_path('geo/countries.json');
            $payload = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

            return collect($payload)
                ->map(fn (array $country): array => $country + [
                    'flag' => $this->flagEmoji((string) $country['code']),
                ])
                ->values()
                ->all();
        });
    }

    /** @return array<string, mixed> */
    public function country(string $countryCode): array
    {
        $country = collect($this->countries())->firstWhere('code', strtoupper($countryCode));
        if (! $country) {
            throw new ApiException('NOT_FOUND', 'Country is not supported.', 404);
        }

        return $country;
    }

    /** @return list<array{code: string, name: string}> */
    public function states(string $countryCode): array
    {
        $dataset = $this->dataset(strtoupper($countryCode));

        return $dataset['states'] ?? [];
    }

    /** @return list<string> */
    public function lgas(string $countryCode, string $stateCode): array
    {
        $dataset = $this->dataset(strtoupper($countryCode));
        $stateKey = strtolower($stateCode);

        return $dataset['lgas'][$stateKey] ?? $dataset['lgas'][$this->resolveStateCode($dataset, $stateCode)] ?? [];
    }

    public function flagEmoji(string $countryCode): string
    {
        if ($countryCode === 'OTHER') {
            return '🌍';
        }

        $code = strtoupper(substr($countryCode, 0, 2));
        if (strlen($code) !== 2) {
            return '🏳️';
        }

        $first = 127397 + ord($code[0]);
        $second = 127397 + ord($code[1]);

        return mb_chr($first).mb_chr($second);
    }

    /** @return array{states: list<array{code: string, name: string}>, lgas: array<string, list<string>>} */
    private function dataset(string $countryCode): array
    {
        $file = self::DATASETS[$countryCode] ?? null;
        if (! $file) {
            return ['states' => [], 'lgas' => []];
        }

        return Cache::remember("geo.dataset.{$countryCode}", 86400, function () use ($file): array {
            $path = resource_path("geo/{$file}");
            if (! is_file($path)) {
                return ['states' => [], 'lgas' => []];
            }

            $payload = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

            return [
                'states' => $payload['states'] ?? [],
                'lgas' => $payload['lgas'] ?? [],
            ];
        });
    }

    /** @param  array{states: list<array{code: string, name: string}>, lgas: array<string, list<string>>}  $dataset */
    private function resolveStateCode(array $dataset, string $stateCode): string
    {
        $needle = strtolower($stateCode);
        foreach ($dataset['states'] as $state) {
            if (($state['code'] ?? '') === $needle || strtolower((string) ($state['name'] ?? '')) === $needle) {
                return (string) $state['code'];
            }
        }

        return $needle;
    }
}

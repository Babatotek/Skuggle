<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GeoCatalog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class GeoController extends Controller
{
    public function __construct(private readonly GeoCatalog $geo) {}

    public function countries(): JsonResponse
    {
        return ApiResponse::success(['countries' => $this->geo->countries()]);
    }

    public function states(string $country): JsonResponse
    {
        $meta = $this->geo->country($country);

        return ApiResponse::success([
            'country' => $meta,
            'states' => $this->geo->states($country),
        ]);
    }

    public function lgas(string $country, string $state): JsonResponse
    {
        $meta = $this->geo->country($country);

        return ApiResponse::success([
            'country' => $meta,
            'stateCode' => $state,
            'lgas' => $this->geo->lgas($country, $state),
        ]);
    }
}

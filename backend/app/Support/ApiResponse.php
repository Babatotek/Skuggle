<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

final class ApiResponse
{
    public static function success(mixed $data = null, array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => (object) $meta,
            'request_id' => self::requestId(),
        ], $status);
    }

    public static function error(
        string $code,
        string $message,
        int $status,
        array $fields = [],
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $fields,
            'error' => [
                'code' => $code,
                'message' => $message,
                'fields' => (object) $fields,
            ],
            'request_id' => self::requestId(),
        ], $status);
    }

    private static function requestId(): ?string
    {
        return app()->bound('request')
            ? request()->attributes->get('request_id')
            : null;
    }
}

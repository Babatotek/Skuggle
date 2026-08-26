<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:3000'),
    'security' => [
        'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('ALLOWED_ORIGINS', ''))))),
        'trusted_proxies' => env('TRUSTED_PROXIES', '*'),
        'upload_max_mb' => (int) env('UPLOAD_MAX_MB', 25),
        'clamav_enabled' => (bool) env('CLAMAV_ENABLED', false),
        'clamav_required_in_production' => (bool) env('CLAMAV_REQUIRED_IN_PRODUCTION', true),
        'clamav_binary' => env('CLAMAV_BINARY', 'clamscan'),
    ],
    'observability' => [
        'slow_request_ms' => (int) env('REQUEST_SLOW_MS', 500),
        'ready_requires_redis' => (bool) env('READY_REQUIRES_REDIS', false),
    ],
    'library' => [
        'disk' => env('LIBRARY_DISK') ?: (env('AWS_BUCKET') ? 's3' : 'local'),
        'summary_ttl_seconds' => 86400,
        'upload_ttl_minutes' => 60,
        'export_ttl_minutes' => 60,
        'max_batch_resources' => 30,
    ],
    'ai' => [
        'provider' => env('AI_PROVIDER', 'none'),
        'timeout' => (int) env('AI_REQUEST_TIMEOUT', 45),
        'public_enabled' => (bool) env('PUBLIC_AI_ENABLED', false),
        'gemini' => ['key' => env('GEMINI_API_KEY'), 'model' => env('GEMINI_MODEL', 'gemini-2.5-flash')],
        'groq' => ['key' => env('GROQ_API_KEY'), 'model' => env('GROQ_MODEL', 'openai/gpt-oss-20b'), 'transcription_model' => env('GROQ_TRANSCRIPTION_MODEL', 'whisper-large-v3-turbo')],
    ],
    'storage_local_allowed' => filter_var(env('STORAGE_LOCAL_ALLOWED', false), FILTER_VALIDATE_BOOLEAN),
];

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
        'horizon_admin_emails' => array_values(array_filter(array_map('trim', explode(',', (string) env('HORIZON_ADMIN_EMAILS', ''))))),
        'pulse_admin_emails' => array_values(array_filter(array_map('trim', explode(',', (string) env('PULSE_ADMIN_EMAILS', env('HORIZON_ADMIN_EMAILS', '')))))),
    ],
    'cache_ttl' => [
        'curriculum' => (int) env('CACHE_CURRICULUM_TTL_SECONDS', 300),
        'subjects' => (int) env('CACHE_SUBJECTS_TTL_SECONDS', 120),
        'classes' => (int) env('CACHE_CLASSES_TTL_SECONDS', 120),
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
    'ocr' => [
        'provider' => env('OCR_PROVIDER', 'none'),
        'timeout' => (int) env('OCR_TIMEOUT_SECONDS', 90),
        'review_threshold' => (float) env('OCR_REVIEW_THRESHOLD', 92),
    ],
    'messaging' => [
        'sms' => [
            'provider' => env('SMS_PROVIDER', 'none'),
            'sender' => env('SMS_SENDER_ID', 'Skuggle'),
            'termii' => ['api_key' => env('TERMII_API_KEY'), 'base_url' => env('TERMII_BASE_URL', 'https://api.ng.termii.com')],
        ],
        'whatsapp' => [
            'token' => env('WHATSAPP_ACCESS_TOKEN'),
            'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
            'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
            'app_secret' => env('WHATSAPP_APP_SECRET'),
            'graph_version' => env('WHATSAPP_GRAPH_VERSION', 'v23.0'),
        ],
    ],
];

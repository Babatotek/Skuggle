<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => config('skuggle.security.allowed_origins'),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'Origin', 'X-Requested-With', 'X-XSRF-TOKEN', 'X-Request-ID', 'Idempotency-Key'],
    'exposed_headers' => ['X-Request-ID', 'Retry-After', 'Content-Disposition'],
    'max_age' => 600,
    'supports_credentials' => true,
];

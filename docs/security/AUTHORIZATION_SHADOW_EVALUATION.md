# Authorization Shadow Evaluation

`AuthorizationShadowEvaluator` compares the legacy role-permission result with `CanonicalAuthorizationEvaluator` and emits one of `ALLOW_ALLOW`, `DENY_DENY`, `LEGACY_ALLOW_CANONICAL_DENY`, or `LEGACY_DENY_CANONICAL_ALLOW`.

Telemetry contains capability, mode/cohort, correlation ID, reason code and privileged-block flag. It contains no user/student identity, resource content, marks, health, finance or tokens. Unknown capabilities fail closed and emit `UNKNOWN_PERMISSION`.

PRIVILEGED and PLATFORM_CRITICAL mismatches set `blocksEnforcement`; middleware retains legacy enforcement until investigated. Modes are `off`, `shadow`, `internal`, `canary`, `default_canonical`, and legacy fallback by configuration. Canary selection uses explicit tenant public IDs, never random percentages.

Pilot evaluation runs through existing permission middleware, covering student read, school settings, assessment read and attendance read without replacing resource policies. Backend authorization remains authoritative; frontend access metadata is UX only.

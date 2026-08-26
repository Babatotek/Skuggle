# VPS upgrade path (later)

Shared hosting is the initial production target. When traffic or queue latency requires it, move the API to a VPS and introduce Redis-backed workers.

## What changes on VPS

| Concern | Shared hosting | VPS target |
| --- | --- | --- |
| Session | `SESSION_DRIVER=database` | `SESSION_DRIVER=redis` |
| Cache | `CACHE_STORE=database` | `CACHE_STORE=redis` |
| Queue | `QUEUE_CONNECTION=database` + cron `queue:work` | Redis + long-running workers |
| Ready probe | `READY_REQUIRES_REDIS=false` | `READY_REQUIRES_REDIS=true` |
| Scheduler | Hostinger cron `schedule:run` | systemd timer or cron |
| Workers | Cron `queue:work --stop-when-empty` | Supervisor / systemd workers |

## Horizon (not installed yet)

Laravel Horizon is the intended upgrade for Redis queue monitoring and supervisor management.

**Do not install Horizon in this repository phase.** When ready:

1. Provision Redis on the VPS.
2. Switch session/cache/queue env vars to Redis.
3. Then add Horizon and run it under Supervisor — not on shared hosting.

Until then, keep using the shared-hosting database queue + cron worker pattern.

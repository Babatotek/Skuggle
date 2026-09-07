# SPA route rewrite contract (Hostinger / shared hosting)

Skuggle’s production frontend is a Vite SPA. Direct navigation and refresh of canonical paths such as `/school/people/students` must return the SPA `index.html`, not an Apache/Hostinger 404. API, Sanctum, storage, and health endpoints must **not** be swallowed by that fallback.

## Topology

| Request | Handler |
|---|---|
| `/api/*`, `/sanctum/*`, `/email/verify/*`, `/health`, `/ready`, `/startup`, `/live`, `/up`, `/version` | Laravel `index.php` |
| Existing static file (`/assets/*`, hashed JS/CSS, icons, `manifest.webmanifest`, `sw.js`) | File as-is |
| `/storage/*` | Public media if present; otherwise Apache 404 — **never** `index.html` |
| Canonical SPA paths (`/school/...`, `/personal/...`, `/platform/...`, `/login`, `/welcome`, …) | `index.html` |
| Unknown SPA path | `index.html` then client 404 surface (not Dashboard) |

## Files

- **Hostinger document root:** `backend/deploy/shared-hosting/public_html/.htaccess`
  1. Authorization / CSRF headers
  2. Laravel prefixes → `index.php`
  3. `/storage/` stop (no SPA)
  4. Existing files/directories pass through
  5. Remaining GETs → `index.html`
- **Laravel public (API host / local `public/`):** `backend/public/.htaccess` — unmatched → `index.php` only. Do not point this tree at SPA routes unless the frontend is actually deployed there.
- **Local Vite/Node:** `vite.config.ts` `appType` spa via `server.ts`; production Node fallback serves `dist/index.html` but **skips** `/api/`, `/sanctum/`, `/storage/`, `/email/`.
- **Vite `base`:** `/` (default). Do not set a subdirectory base without updating this contract.
- **PWA `public/sw.js`:** navigation fetch goes to network first; `/api/` and `/sanctum/` are excluded; `/assets/` hashed chunks are never served stale from the worker. Offline fallback is `/offline.html`, not Dashboard. `src/main.tsx` currently unregisters service workers after render (existing Wave 0+ behavior); do not reintroduce a worker that caches API JSON.

## Non-goals / hazards

- Do not rewrite POST/PUT/PATCH/DELETE of API routes to `index.html`.
- Do not loop `index.html` → rewrite → `index.html`.
- Do not treat “no tenant in the URL” as Platform.
- Trailing-slash 301 on Laravel `public/.htaccess` applies to PHP; the SPA Hostinger file does not slash-redirect HTML routes (client `normalizeLocation` strips trailing slashes with `replace`).

## Static verification

Confirm in this order after deploy: `/api/v1/health` (or `/health`) is JSON/Laravel; `/assets/js/*` is JavaScript; a known logo/storage object is media; `/school/people/students` returns `index.html` with 200; `/api/v1/does-not-exist` is Laravel JSON 404, not the SPA.

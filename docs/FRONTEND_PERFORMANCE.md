# Skuggle Frontend Performance

Measurement date: 21 August 2026

## Production build result

`npm.cmd run build` completed successfully with Vite 6.4.3.

| Artifact                                     |                     Raw |      Gzip |
| -------------------------------------------- | ----------------------: | --------: |
| Entry JavaScript                             |               405.86 kB | 126.08 kB |
| Application CSS                              |                46.46 kB |   9.62 kB |
| Largest feature chunk (`RegisterSchoolPage`) |                13.30 kB |   4.31 kB |
| Canonical robot WebP                         |                139.6 kB |       n/a |
| PWA precache                                 | 50 entries / 716.21 KiB | generated |

All primary feature pages are emitted as route-level chunks. The former frontend included eager OCR, Tesseract, PDF, scanner, AI, large fixture, and all-role dashboard implementations; these are absent from the current browser import graph.

## Implemented controls

- Route-level lazy loading for public and authenticated feature pages.
- Local optimized WebP artwork with intrinsic dimensions; no remote hero dependency.
- Server pagination and 300 ms debounced URL search for the student directory.
- TanStack Query stale-time policies and caller cancellation.
- Uncontrolled row inputs and ref-based keyboard movement for dense score entry.
- Responsive card representations for dense student data.
- Reduced-motion CSS and limited operational animation.
- Conservative service-worker caching that excludes `/api`.

## Budgets and watch points

The entry bundle is below a 150 kB gzip working budget but remains the primary optimization target because React, Router, Query, layout, and icon foundations live there. Do not add PDF, OCR, spreadsheet, charting, or AI SDKs to the entry graph. Load such capabilities only from their feature boundary and measure the resulting chunk.

The package audit reports zero current production vulnerabilities. `npm outdated` reports newer major versions of Vite, TypeScript, ESLint, Express, Lucide, Motion, Vitest, jsdom, and related tooling. They were not adopted during stabilization because major-version migration is separate risk-bearing work.

## Measurement limitation

Lighthouse/Core Web Vitals and rendered-network traces were not collected because no in-app browser was connected to this execution environment. The Playwright suite defines desktop, 768 px tablet, and Pixel 5 mobile projects, but browser execution remains a release-gate task on a machine with the browsers installed. No Lighthouse score is claimed.

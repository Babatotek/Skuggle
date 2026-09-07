# Wave 8 manual browser runbook

Credentialed desktop/mobile smoke was **not** executed in this environment. Do not treat this file as a substitute for screenshots.

Use an authenticated session for each persona. Record console, network, and duplicate-key warnings.

## Viewports

- Desktop: 1440 × 900
- Tablet: 1024 × 768 and 768 × 1024
- Mobile: 390 × 844 (and a notched device if available for safe-area)

## Personas

1. School Super Admin  
2. Principal  
3. Teacher  
4. Parent  
5. Student  
6. Platform Super Admin / Platform Owner  
7. Personal Space  

Super Admin, Principal, and Teacher must share **School staff** chrome (`data-shell-family="school-staff"`). Differences are authorized nav items, not a different shell implementation.

Parent/Student must be `parent-student` (simple projection, not a dense staff sidebar).

Platform must show the Platform label and must not adopt school logo/accent.

Personal must not show academic session/term chrome.

Public `/welcome`, `/login`, `/results` must **not** include workspace header/nav.

## Routes

`/school`, `/school/people/students`, `/school/admissions`, `/school/academics`, `/school/assessment`, `/school/attendance`, `/school/finance`, `/school/administration` (any live admin child), `/personal`, `/platform`, unknown 404, plus a legacy alias such as `/app/students`.

History: School → Students → student profile → Back. Header/nav must stay mounted; only main content changes.

## Workspace switch

School A → School B: name/logo, academic context, nav projection, URL, no stale previous-school paint.

School → Personal → School: academic chrome disappears then returns; no leftover school finance/admin in Personal.

Platform → School: family changes; school branding does not override Platform while on Platform.

## Loading / error

Throttle a domain request (Students or Finance). Shell (header, nav, user menu) stays visible; main shows a bounded loader — no white application.

Force a page render throw in a harness if needed: shell remains; alert is in the page region; user can open another nav item.

## Accessibility

Tab to “Skip to main content” (first focusable). Activate; focus `#main-content` after route changes.

Open tablet drawer: focus inside; Escape restores trigger; background not operable.

`prefers-reduced-motion`: drawer does not spring across the viewport.

## Pass/fail

Fail on white screen, infinite spinner, request storm, duplicate React keys, unexpected console errors, or HTTP failures unrelated to the throttled test.

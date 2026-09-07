# Wave 9 Navigation Implementation Report

## Remediation history

The first Wave 9 implementation failed manual review because the live shell projected the legacy exhaustive feature catalogue into the primary sidebar. Domain child pages such as invoices, screening, marking, channels, and report types appeared as permanent destinations.

The remediation replaces that shell projection with `SCHOOL_STAFF_PRIMARY_NAVIGATION`, an explicit 26-entry maximum registry grouped into Home, People, Admissions, Teaching & Learning, School Operations, Engagement, Insights, and Administration.

**ROUTE REGISTRY != PRIMARY NAVIGATION REGISTRY.** The route registry continues to own all canonical URLs. The primary registry owns only persistent domain/capability landing pages. Deep routes remain available and activate their canonical parent.

Visibility is synchronous and uses already-loaded access capabilities with the same `access.capabilities` and `capabilitiesMode` metadata as the destination route. Roles and persona labels do not grant navigation exposure. The backend remains authoritative.

## Acceptance status

Automated navigation, full frontend, type, build, and architecture checks pass. The required authenticated 1440x900 and 390x844 visual inspection could not be performed in this run because no controllable browser was available and the local Laravel service required for authenticated access was offline.

**WAVE 9: BLOCKED** pending that manual visual/persona inspection. Do not begin Wave 10.

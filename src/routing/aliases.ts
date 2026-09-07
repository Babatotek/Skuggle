import type { LegacyAliasDefinition } from './types';
import { LEGACY_NAV_TO_ROUTE_ID, ROUTES_BY_ID } from './registry';

const owner = 'Frontend Platform';

function alias(
  id: string,
  oldPath: string,
  canonicalId: string,
  reason: string,
  extras: Partial<LegacyAliasDefinition> = {},
): LegacyAliasDefinition {
  if (!ROUTES_BY_ID.has(canonicalId)) {
    throw new Error(`Legacy alias ${id} targets unknown route ${canonicalId}`);
  }
  return {
    id,
    oldPath,
    canonicalId,
    mode: 'redirect',
    reason,
    owner,
    removalWave: 24,
    preserveQuery: true,
    ...extras,
  };
}

const appTabAliases: LegacyAliasDefinition[] = [...LEGACY_NAV_TO_ROUTE_ID.entries()].map(([tab, canonicalId]) =>
  alias(`legacy.app.${tab}`, `/app/${tab}`, canonicalId, 'Pre-Wave-7 workspace tab URL'),
);

export const LEGACY_ALIASES: readonly LegacyAliasDefinition[] = [
  alias('legacy.assessment.schedule', '/school/assessment/exam-schedule', 'school.assessment.exam-schedule', 'Assessment V2 schedule cutover'),
  alias('legacy.app.root', '/app', 'school.home', 'Authenticated app root without tab; resolved to workspace default at runtime'),
  alias('legacy.app.home', '/app/home', 'school.home', 'Explicit home tab'),
  ...appTabAliases.filter((item) => item.oldPath !== '/app/home'),
  alias('legacy.tenant.s', '/s/:schoolKey', 'public.tenant-welcome', 'Public tenant prefix /s/{slug}', { mapParams: { schoolKey: 'school' } }),
  alias('legacy.tenant.t', '/t/:schoolKey', 'public.tenant-welcome', 'Public tenant prefix /t/{slug}', { mapParams: { schoolKey: 'school' } }),
  alias('legacy.tenant.school', '/school/:schoolKey', 'public.tenant-welcome', 'Public tenant prefix /school/{slug} when slug is not a canonical segment', { mapParams: { schoolKey: 'school' } }),
  alias('legacy.tenant.app', '/school/:schoolKey/app', 'school.home', 'Tenant-prefixed app root'),
  alias('legacy.tenant.app.tab', '/school/:schoolKey/app/:tab', 'school.home', 'Tenant-prefixed app tab; tab mapped through closed nav index'),
  alias('legacy.s.app', '/s/:schoolKey/app', 'school.home', 'Short tenant-prefixed app root'),
  alias('legacy.s.app.tab', '/s/:schoolKey/app/:tab', 'school.home', 'Short tenant-prefixed app tab; tab mapped through closed nav index'),
  alias('legacy.t.app', '/t/:schoolKey/app', 'school.home', 'Alternate tenant-prefixed app root'),
  alias('legacy.t.app.tab', '/t/:schoolKey/app/:tab', 'school.home', 'Alternate tenant-prefixed app tab; tab mapped through closed nav index'),
];

export const LEGACY_ALIASES_BY_ID: ReadonlyMap<string, LegacyAliasDefinition> = new Map(LEGACY_ALIASES.map((item) => [item.id, item]));

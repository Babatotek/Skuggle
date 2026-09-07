import type { CanonicalRouteDefinition, ParamDefinition, QueryDefinition } from './types';

const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const SLUG = /^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/;
const PAGE = /^[1-9][0-9]{0,5}$/;

export type ParamParseResult =
  | { ok: true; params: Record<string, string>; query: Record<string, string> }
  | { ok: false; reason: '404' | 'default'; params: Record<string, string>; query: Record<string, string> };

function validateValue(definition: ParamDefinition, raw: string | undefined): { value?: string; invalid: boolean } {
  if (raw == null || raw === '') {
    if (definition.optional || definition.invalid === 'default') {
      return { value: definition.defaultValue, invalid: false };
    }
    return { invalid: true };
  }
  switch (definition.kind) {
    case 'publicId':
      return PUBLIC_ID.test(raw) ? { value: raw, invalid: false } : { invalid: true };
    case 'slug':
      return SLUG.test(raw) ? { value: raw, invalid: false } : { invalid: true };
    case 'page':
      return PAGE.test(raw) ? { value: raw, invalid: false } : { invalid: true };
    case 'enum':
      return definition.enumValues?.includes(raw) ? { value: raw, invalid: false } : { invalid: true };
    default:
      return { invalid: true };
  }
}

export function parseRouteParams(
  route: CanonicalRouteDefinition,
  params: Readonly<Record<string, string | undefined>>,
  search: string,
): ParamParseResult {
  const parsed: Record<string, string> = {};
  const query: Record<string, string> = {};
  let invalidTo404 = false;
  let usedDefault = false;

  for (const definition of route.params ?? []) {
    const result = validateValue(definition, params[definition.name]);
    if (result.invalid) {
      if (definition.invalid === '404') invalidTo404 = true;
      else {
        usedDefault = true;
        if (definition.defaultValue) parsed[definition.name] = definition.defaultValue;
      }
    } else if (result.value) {
      parsed[definition.name] = result.value;
    }
  }

  const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const definition of route.query ?? []) {
    const raw = searchParams.get(definition.name);
    if (raw == null || raw === '') {
      if (definition.defaultValue) query[definition.name] = definition.defaultValue;
      continue;
    }
    if (definition.kind === 'search') {
      query[definition.name] = raw.slice(0, 120);
      continue;
    }
    if (definition.kind === 'page') {
      const pageResult = validateValue({
        name: definition.name,
        kind: 'page',
        optional: true,
        invalid: 'default',
        defaultValue: definition.defaultValue,
      }, raw);
      if (pageResult.invalid) {
        if (definition.defaultValue) query[definition.name] = definition.defaultValue;
      } else if (pageResult.value) query[definition.name] = pageResult.value;
      continue;
    }
    if (definition.enumValues && !definition.enumValues.includes(raw)) {
      if (definition.invalid === 'default' && definition.defaultValue) query[definition.name] = definition.defaultValue;
      continue;
    }
    query[definition.name] = raw.slice(0, 64);
  }

  if (invalidTo404) return { ok: false, reason: '404', params: parsed, query };
  if (usedDefault) return { ok: true, params: parsed, query };
  return { ok: true, params: parsed, query };
}

export function encodePathParam(value: string): string {
  return encodeURIComponent(value);
}

export function buildSearchString(route: CanonicalRouteDefinition, query: Readonly<Record<string, string | undefined>>): string {
  const params = new URLSearchParams();
  const allowed = new Set((route.query ?? []).map((item: QueryDefinition) => item.name));
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.has(key) || value == null || value === '') continue;
    params.set(key, value);
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

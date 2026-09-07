import type { RoutingSignal } from './types';

const MAX_BUFFER = 50;
const signals: Array<{ signal: RoutingSignal; at: number; detail?: Readonly<Record<string, string>> }> = [];

/** Migration-only routing signals. No PII. Not an analytics platform. */
export function reportRoutingSignal(signal: RoutingSignal, detail?: Readonly<Record<string, string>>): void {
  const safe = detail
    ? Object.fromEntries(Object.entries(detail).filter(([key]) => !/email|name|phone|token|password|student/i.test(key)))
    : undefined;
  signals.push({ signal, at: Date.now(), detail: safe });
  if (signals.length > MAX_BUFFER) signals.shift();
  window.dispatchEvent(new CustomEvent('skuggle:routing', { detail: { signal, ...safe } }));
}

export function readRoutingSignals() {
  return signals.slice();
}

export function resetRoutingSignals() {
  signals.length = 0;
}

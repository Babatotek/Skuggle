import type { CSSProperties } from 'react';

const FALLBACK_ACTION = 'var(--color-action-primary)';

function parseHex(value: string): [number, number, number] | null {
  const match = value.trim().match(/^#([\da-f]{6})$/i);
  if (!match) return null;
  const number = Number.parseInt(match[1], 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function luminance([red, green, blue]: [number, number, number]): number {
  const channels = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(foreground: string, background = '#ffffff'): number | null {
  const foregroundRgb = parseHex(foreground);
  const backgroundRgb = parseHex(background);
  if (!foregroundRgb || !backgroundRgb) return null;
  const lighter = Math.max(luminance(foregroundRgb), luminance(backgroundRgb));
  const darker = Math.min(luminance(foregroundRgb), luminance(backgroundRgb));
  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns bounded identity/action slots; protected semantic roles are never exposed. */
export function resolveTenantTheme(primaryColor?: string): CSSProperties {
  const safeAccent = primaryColor && (contrastRatio(primaryColor) ?? 0) >= 4.5
    ? primaryColor
    : FALLBACK_ACTION;
  return {
    '--tenant-identity-accent': safeAccent,
    '--tenant-action-primary': safeAccent,
  } as CSSProperties;
}

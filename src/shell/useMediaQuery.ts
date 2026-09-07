import { useEffect, useState } from 'react';

/** Wave 2 `--breakpoint-wide` is 64rem (1024px). Compact token is 40rem (640px). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useShellLayout() {
  const isDesktop = useMediaQuery('(min-width: 64rem)');
  const isTablet = useMediaQuery('(min-width: 48rem) and (max-width: 63.999rem)');
  const isMobile = !isDesktop && !isTablet;
  return { isDesktop, isTablet, isMobile };
}

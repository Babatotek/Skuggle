export type ShellDensity = 'comfortable' | 'compact' | 'focused';
export type NavMode = 'expanded' | 'rail';

const DENSITY_KEY = 'skuggle_shell_density';
const NAV_KEY = 'skuggle_shell_nav_mode';

export function readShellDensity(): ShellDensity {
  try {
    const value = localStorage.getItem(DENSITY_KEY);
    if (value === 'compact' || value === 'comfortable') return value;
  } catch { /* private mode */ }
  return 'comfortable';
}

export function writeShellDensity(density: ShellDensity) {
  try { localStorage.setItem(DENSITY_KEY, density); } catch { /* ignore */ }
}

export function readNavMode(): NavMode {
  try {
    if (localStorage.getItem(NAV_KEY) === 'rail') return 'rail';
  } catch { /* ignore */ }
  return 'expanded';
}

export function writeNavMode(mode: NavMode) {
  try { localStorage.setItem(NAV_KEY, mode); } catch { /* ignore */ }
}

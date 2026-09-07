const LAST_TAB_KEY = 'skuggle_module_last_tab';

export function rememberModuleTab(moduleId: string, tabId: string) {
  try {
    const current = JSON.parse(sessionStorage.getItem(LAST_TAB_KEY) || '{}') as Record<string, string>;
    current[moduleId] = tabId;
    sessionStorage.setItem(LAST_TAB_KEY, JSON.stringify(current));
  } catch {
    /* session storage is optional polish */
  }
}

export function lastModuleTab(moduleId: string): string | undefined {
  try {
    const current = JSON.parse(sessionStorage.getItem(LAST_TAB_KEY) || '{}') as Record<string, string>;
    return current[moduleId];
  } catch {
    return undefined;
  }
}

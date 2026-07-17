const WALKTHROUGH_KEY = 'posterium_walkthrough_state';
const BUILDER_MODE_KEY = 'posterium_builder_mode';
const INTEGRATIONS_KEY = 'posterium_walkthrough_integrations';
const APIKEYS_KEY = 'posterium_walkthrough_apikeys';
const PREFS_KEY = 'posterium_walkthrough_prefs';

export function getWalkthroughState(): boolean {
  try {
    return localStorage.getItem(WALKTHROUGH_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveWalkthroughState(): void {
  try {
    localStorage.setItem(
      WALKTHROUGH_KEY,
      JSON.stringify({ completed: true, completedAt: new Date().toISOString() }),
    );
  } catch { /* private browsing */ }
}

export function getBuilderMode(): 'simple' | 'advanced' {
  try {
    const saved = localStorage.getItem(BUILDER_MODE_KEY);
    if (saved === 'simple' || saved === 'advanced') return saved;
  } catch { /* */ }
  return 'simple';
}

export function saveBuilderMode(mode: 'simple' | 'advanced'): void {
  try {
    localStorage.setItem(BUILDER_MODE_KEY, mode);
  } catch { /* */ }
}

export function saveIntegrations(ids: string[]): void {
  try {
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(ids));
  } catch { /* */ }
}

export function saveApiKeys(keys: Record<string, string>): void {
  try {
    localStorage.setItem(APIKEYS_KEY, JSON.stringify(keys));
  } catch { /* */ }
}

export function savePrefs(prefs: { sortBy: string; mediaType: string }): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* */ }
}

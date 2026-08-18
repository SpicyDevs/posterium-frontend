const WALKTHROUGH_KEY = 'posterium_walkthrough_state';
const BUILDER_MODE_KEY = 'posterium_builder_mode';

export function clearWalkthroughState(): void {
  try {
    localStorage.removeItem(WALKTHROUGH_KEY);
  } catch {
    /* */
  }
}

export function getWalkthroughState(): boolean {
  try {
    const raw = localStorage.getItem(WALKTHROUGH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { completed?: boolean };
    return parsed.completed === true;
  } catch {
    return false;
  }
}

export function saveWalkthroughState(): void {
  try {
    localStorage.setItem(
      WALKTHROUGH_KEY,
      JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
    );
  } catch {
    /* private browsing */
  }
}

export function getBuilderMode(): 'simple' | 'advanced' {
  try {
    const saved = localStorage.getItem(BUILDER_MODE_KEY);
    if (saved === 'simple' || saved === 'advanced') return saved;
  } catch {
    /* */
  }
  return 'simple';
}

export function saveBuilderMode(mode: 'simple' | 'advanced'): void {
  try {
    localStorage.setItem(BUILDER_MODE_KEY, mode);
  } catch {
    /* */
  }
}

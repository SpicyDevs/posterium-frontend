import type { ApiKeys, PosterConfig } from '../../types';

export const BUILDER_STORAGE_KEY = 'posterium_config_v2';
export const BUILDER_HISTORY_STORAGE_KEY = 'posterium_history_v1';
export const BUILDER_API_KEYS_STORAGE_KEY = 'posterium_apikeys_v2';
export const BUILDER_LAST_MODE_STORAGE_KEY = 'posterium_last_mode';
export const BUILDER_VISITED_STORAGE_KEY = 'posterium_builder_has_visited_v1';
export const BUILDER_RECENT_COMMANDS_STORAGE_KEY = 'posterium_recent_cmds';
export const MAX_QUERY_CONFIG_LENGTH = 12000;

type PersistedBuilderMode = 'simple' | 'advanced' | 'walkthrough';

export interface PosterHistorySnapshot {
  history: PosterConfig[];
  currentIndex: number;
}

const VALID_MODES: PersistedBuilderMode[] = ['simple', 'advanced', 'walkthrough'];

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const readStoredString = (key: string): string | null => {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

export const writeStoredString = (key: string, value: string) => {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const removeStoredValue = (key: string) => {
  try {
    getStorage()?.removeItem(key);
  } catch {
    /* ignore */
  }
};

export const readStoredJson = <T>(key: string): T | null => {
  const raw = readStoredString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeStoredJson = (key: string, value: unknown) => {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const saveKeysToStorage = (keys: ApiKeys) => {
  const hasAnyKey = Object.values(keys ?? {}).some((value) => value && value.trim());
  if (!hasAnyKey) {
    removeStoredValue(BUILDER_API_KEYS_STORAGE_KEY);
    return;
  }
  writeStoredJson(BUILDER_API_KEYS_STORAGE_KEY, keys);
};

export const loadKeysFromStorage = (): ApiKeys =>
  readStoredJson<ApiKeys>(BUILDER_API_KEYS_STORAGE_KEY) ?? {};

export const loadBuilderHistory = (): PosterHistorySnapshot | null => {
  const stored = readStoredJson<PosterHistorySnapshot>(BUILDER_HISTORY_STORAGE_KEY);
  if (!stored || !Array.isArray(stored.history) || stored.history.length === 0) return null;
  if (typeof stored.currentIndex !== 'number') return null;
  const currentIndex = Math.max(0, Math.min(stored.currentIndex, stored.history.length - 1));
  return { history: stored.history, currentIndex };
};

export const saveBuilderHistory = (snapshot: PosterHistorySnapshot) => {
  writeStoredJson(BUILDER_HISTORY_STORAGE_KEY, snapshot);
};

export const hasVisitedBuilder = (): boolean => readStoredString(BUILDER_VISITED_STORAGE_KEY) === '1';

export const markBuilderVisited = () => {
  writeStoredString(BUILDER_VISITED_STORAGE_KEY, '1');
};

export const loadLastMode = (): PersistedBuilderMode | null => {
  const stored = readStoredString(BUILDER_LAST_MODE_STORAGE_KEY);
  return stored && VALID_MODES.includes(stored as PersistedBuilderMode)
    ? (stored as PersistedBuilderMode)
    : null;
};

export const saveLastMode = (mode: PersistedBuilderMode) => {
  if (!VALID_MODES.includes(mode)) return;
  writeStoredString(BUILDER_LAST_MODE_STORAGE_KEY, mode);
};

export const loadRecentCommandIds = (): string[] => {
  const stored = readStoredJson<string[]>(BUILDER_RECENT_COMMANDS_STORAGE_KEY);
  return Array.isArray(stored) ? stored.filter((value) => typeof value === 'string') : [];
};

export const saveRecentCommandIds = (ids: string[]) => {
  writeStoredJson(BUILDER_RECENT_COMMANDS_STORAGE_KEY, ids.slice(0, 5));
};

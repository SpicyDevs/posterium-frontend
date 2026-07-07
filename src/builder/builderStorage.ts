import type { ApiKeys } from './types';

export const BUILDER_STORAGE_KEY = 'posterium_config_v2';
export const MAX_QUERY_CONFIG_LENGTH = 12000;
const COOKIE_KEY = 'posterium_apikeys_v1';

export const saveKeysToCookie = (keys: ApiKeys) => {
  try {
    const val = encodeURIComponent(JSON.stringify(keys));
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${val}; expires=${exp}; path=/; SameSite=Strict`;
  } catch {
    /* ignore */
  }
};

export const loadKeysFromCookie = (): ApiKeys => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    if (!match) return {};
    return JSON.parse(decodeURIComponent(match[1])) || {};
  } catch {
    return {};
  }
};

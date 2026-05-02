// src/lib/useStrings.ts
/**
 * Pass-through utility for the content/strings JSON files.
 *
 * Usage (server/static context):
 *   import common from '@/content/strings/common.json';
 *   const { siteName } = common;
 *
 * Usage (React component, for type inference):
 *   import { useStrings } from '@/lib/useStrings';
 *   import hero from '@/content/strings/hero.json';
 *   const strings = useStrings(hero);
 *   // strings.headline is fully typed
 *
 * Usage (server utility):
 *   import { getStrings } from '@/lib/useStrings';
 *   const strings = getStrings(hero);
 */

/**
 * React hook variant — returns the passed strings object typed correctly.
 * Zero runtime cost (identity function).
 */
export function useStrings<T extends Record<string, unknown>>(strings: T): T {
  return strings;
}

/**
 * Non-hook variant for server-side / Astro component usage.
 * Zero runtime cost (identity function).
 */
export function getStrings<T extends Record<string, unknown>>(strings: T): T {
  return strings;
}

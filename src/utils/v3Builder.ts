/**
 * src/utils/v3Builder.ts
 *
 * Generates optimal v3 API URLs using short-form param aliases and automatic
 * hoisting of shared per-badge values to global params.
 *
 * ── CRITICAL: source has NO v3 short alias ─────────────────────────────────
 *   The backend reads `source` directly. `so` = source_ORDER (poster priority
 *   list), NOT the poster source provider.  Always emit `source=fanart`,
 *   never `so=fanart`.
 */

import type { PosterConfig, RatingType } from '../components/builder/types';
import { PROVIDER_SHORT, cleanValue as _cleanValue } from '../components/builder/utils';

export { cleanValue } from '../components/builder/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ps(val: number): string {
  return val.toString();
}

// ---------------------------------------------------------------------------
// Hoisting
// ---------------------------------------------------------------------------

/**
 * Detect per-badge property values that are identical across ALL selected
 * badges.  Returns an object of hoistable key→value pairs.
 */
function detectHoistable(config: PosterConfig): Partial<Record<string, string | number | boolean>> {
  const { ratings, items } = config;
  if (ratings.length <= 1) return {};

  type HoistKey =
    | 'blur'
    | 'alpha'
    | 'radius'
    | 'shadow'
    | 'bg'
    | 'txt'
    | 'borderW'
    | 'borderC'
    | 'icon'
    | 'scale';
  const hoistableKeys: HoistKey[] = [
    'blur',
    'alpha',
    'radius',
    'shadow',
    'bg',
    'txt',
    'borderW',
    'borderC',
    'icon',
    'scale',
  ];

  const result: Partial<Record<string, string | number | boolean>> = {};
  for (const prop of hoistableKeys) {
    const values = ratings.map((r) => items[r]?.[prop]);
    if (values.every((v) => v !== undefined) && new Set(values.map(String)).size === 1) {
      result[prop] = values[0] as string | number | boolean;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

/**
 * Generates the shortest possible v3 API URL for the given config.
 *
 * - Short-form aliases for all global and per-badge params.
 * - Hoists common per-badge values to global params (one key instead of N).
 * - Short provider prefixes for per-badge positional/style params.
 * - source is ALWAYS emitted as `source` (no v3 alias).
 */
export function buildOptimalUrl(
  config: PosterConfig,
  baseUrl = 'https://api.spicydevs.xyz'
): string {
  const cleanBase = baseUrl.replace(/\/$/, '');

  const displayId = config.imdbId || '{imdb_id}';
  const pathSegment = `/poster/${displayId}`;

  const url = new URL(`${cleanBase}${pathSegment}.${config.extension}`);

  const url = new URL(`${cleanBase}${pathSegment}.${config.extension}`);
  const p = url.searchParams;

  // ── Core ────────────────────────────────────────────────────────────────
  if (config.ratings.length > 0) {
    p.set('r', config.ratings.map((r) => PROVIDER_SHORT[r] ?? r).join(','));
  }
  if (config.fallbackEnabled && config.fallbackPool.length > 0) {
    p.set('fb', config.fallbackPool.map((r) => PROVIDER_SHORT[r] ?? r).join(','));
  }

  // CRITICAL: source → always `source`, never `so`.
  // `so` on the backend = source_ORDER, not the poster source provider.
  if (config.source !== 'tmdb') p.set('source', config.source);

  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);
  if (config.keys?.tmdb) p.set('tmdb_key', config.keys.tmdb);
  if (config.keys?.fanart) p.set('fanart_key', config.keys.fanart);
  if (config.keys?.omdb) p.set('omdb_key', config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  // ── Version ──────────────────────────────────────────────────────────────
  p.set('v', '3');

  // ── Global glass / style params (short form) ──────────────────────────
  p.set('bl', ps(config.blur));
  p.set('al', ps(config.alpha));
  p.set('ra', ps(config.radius));
  p.set('sh', ps(config.shadow));

  if (config.posterBlur > 0) p.set('pb', ps(config.posterBlur));
  if (config.grayscale) p.set('bw', '1');
  if (config.layout !== 'custom') p.set('l', config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  const sizeScale = config.scale ?? 1.0;
  p.set('sc', sizeScale.toFixed(3));

  if ((config.borderW ?? 0) > 0) p.set('g_bw', ps(config.borderW!));
  if (config.borderC) p.set('bc', config.borderC);
  if (config.bg) p.set('bg', config.bg);
  if (config.txt) p.set('tx', config.txt);
  p.set('ic', config.icon !== false ? '1' : '0');

  // ── New v3 global params ───────────────────────────────────────────────
  if (config.normalize) p.set('nm', '1');
  if (config.outOf !== undefined) p.set('of', ps(config.outOf));
  if (config.iconType !== undefined && config.iconType !== 1) p.set('it', ps(config.iconType));
  if (config.labelPos) p.set('lp', config.labelPos);
  if (config.labelText) p.set('lt', config.labelText);
  if (config.labelSize !== undefined && config.labelSize !== 11) p.set('ls', ps(config.labelSize));
  if (config.labelColor) p.set('lc', config.labelColor);
  if (config.uiPreset && config.uiPreset !== 'b') p.set('p', config.uiPreset);
  // noText / nt
  if ((config as any).noText) p.set('nt', '1');
  if (config.showText === false) p.set('nt', '1');

  // ── Hoist common per-badge values ────────────────────────────────────
  const hoisted = detectHoistable(config);
  if (hoisted.blur !== undefined) p.set('bl', ps(hoisted.blur as number));
  if (hoisted.alpha !== undefined) p.set('al', ps(hoisted.alpha as number));
  if (hoisted.radius !== undefined) p.set('ra', ps(hoisted.radius as number));
  if (hoisted.shadow !== undefined) p.set('sh', ps(hoisted.shadow as number));
  if (hoisted.bg) p.set('bg', hoisted.bg as string);
  if (hoisted.txt) p.set('tx', hoisted.txt as string);
  if (hoisted.borderC) p.set('bc', hoisted.borderC as string);
  if (hoisted.icon !== undefined) p.set('ic', hoisted.icon ? '1' : '0');

  // ── Per-badge params (short prefix + short suffix) ────────────────────
  config.ratings.forEach((key: RatingType, index: number) => {
    const item = config.items[key] ?? {};
    const sp = PROVIDER_SHORT[key] ?? key;
    const autoX = 20;
    const autoY = 20 + index * 70;

    p.set(`${sp}_x`, ps(Math.round(item.x ?? autoX)));
    p.set(`${sp}_y`, ps(Math.round(item.y ?? autoY)));

    if (item.bg !== undefined && item.bg !== hoisted.bg) p.set(`${sp}_bg`, item.bg);
    if (item.txt !== undefined && item.txt !== hoisted.txt) p.set(`${sp}_tx`, item.txt);
    if (item.blur !== undefined && item.blur !== hoisted.blur) p.set(`${sp}_bl`, ps(item.blur));
    if (item.alpha !== undefined && item.alpha !== hoisted.alpha) p.set(`${sp}_al`, ps(item.alpha));
    if (item.radius !== undefined && item.radius !== hoisted.radius)
      p.set(`${sp}_ra`, ps(item.radius));
    if (item.shadow !== undefined && item.shadow !== hoisted.shadow)
      p.set(`${sp}_sh`, ps(item.shadow));
    if (item.icon !== undefined && item.icon !== hoisted.icon)
      p.set(`${sp}_ic`, item.icon ? '1' : '0');
    if (item.scale !== undefined && item.scale !== hoisted.scale)
      p.set(`${sp}_sc`, item.scale.toFixed(3));
    if (item.borderW !== undefined) p.set(`${sp}_bw`, ps(item.borderW));
    if (item.borderC !== undefined && item.borderC !== hoisted.borderC)
      p.set(`${sp}_bc`, item.borderC);

    // Per-badge new v3 params
    if (item.normalize !== undefined) p.set(`${sp}_nm`, item.normalize ? '1' : '0');
    if (item.outOf !== undefined) p.set(`${sp}_of`, ps(item.outOf));
    if (item.iconType !== undefined) p.set(`${sp}_it`, ps(item.iconType));
    if (item.labelPos) p.set(`${sp}_lp`, item.labelPos);
    if (item.labelText) p.set(`${sp}_lt`, item.labelText);
    if (item.labelSize !== undefined) p.set(`${sp}_ls`, ps(item.labelSize));
    if (item.labelColor) p.set(`${sp}_lc`, item.labelColor);
    if (item.showText === false) p.set(`${sp}_nt`, '1');
  });

  // ── Logo ──────────────────────────────────────────────────────────────
  if (config.logo) {
    p.set('logo', '1');
    if (config.logoSource) p.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined) p.set('logo_x', ps(config.logoX));
    p.set('logo_y', ps(config.logoY));
    p.set('logo_w', ps(config.logoW));
    p.set('logo_h', ps(config.logoH));
    if (config.logoOpacity !== 1.0) p.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow !== 6) p.set('logo_sh', ps(config.logoShadow));
  }

  return url.toString();
}

/**
 * Returns a human-readable breakdown of how many characters the short URL
 * saves compared to a long-form equivalent.
 */
export function urlSavings(shortUrl: string, longUrl: string): { saved: number; pct: number } {
  const saved = longUrl.length - shortUrl.length;
  const pct = longUrl.length > 0 ? Math.round((saved / longUrl.length) * 100) : 0;
  return { saved, pct };
}

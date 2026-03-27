/**
 * src/utils/v3Builder.ts
 */
import type { PosterConfig, RatingType } from '../components/builder/types';
import { PROVIDER_SHORT } from '../components/builder/utils';
export { cleanValue } from '../components/builder/utils';

const V3_KEY_TO_CODE: Record<RatingType, string> = {

const V3_KEY_TO_CODE: Record<RatingType, string> = {
  imdb: 'im',
  rt: 'rt',
  rt_popcorn: 'rp',
  letterboxd: 'lb',
  meta: 'mt',
  tmdb: 'td',
  mal: 'ml',
  anilist: 'al',
  age: 'ag',
  runtime: 'ru',
};

function ps(val: number): string { return val.toString(); }

function detectHoistable(config: PosterConfig): Partial<Record<string, string | number | boolean>> {
  const { ratings, items } = config;
  if (ratings.length <= 1) return {};

  type HoistKey = 'blur' | 'alpha' | 'radius' | 'shadow' | 'bg' | 'txt' | 'borderW' | 'borderC' | 'icon' | 'scale';
  const hoistableKeys: HoistKey[] = ['blur', 'alpha', 'radius', 'shadow', 'bg', 'txt', 'borderW', 'borderC', 'icon', 'scale'];

  const result: Partial<Record<string, string | number | boolean>> = {};
  for (const prop of hoistableKeys) {
    const values = ratings.map(r => items[r]?.[prop]);
    if (values.every(v => v !== undefined) && new Set(values.map(String)).size === 1) {
      result[prop] = values[0] as string | number | boolean;
    }
  }
  return result;
}

export function buildOptimalUrl(config: PosterConfig, baseUrl = 'https://api.spicydevs.xyz'): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const pathSegment = config.imdbId
    ? `/poster/${config.imdbId}`
    : `/${config.mediaType}/${config.tmdbId}`;

  const url = new URL(`${cleanBase}${pathSegment}.${config.extension}`);
  const p = url.searchParams;

  // ── Version ──────────────────────────────────────────────────────────────
  p.set('v', '3');

  // Backend expects FULL string comma-separated ratings, not acronyms
  if (config.ratings.length > 0) {
    p.set('r', config.ratings.join(','));
  }

  if (config.fallbackEnabled && config.fallbackPool && config.fallbackPool.length > 0) {
    p.set('fb', config.fallbackPool.map(r => PROVIDER_SHORT[r] ?? r).join(','));
  }

  // V3 uses 's' for source
  if (config.source && config.source !== 'tmdb') p.set('s', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);

  if (config.keys?.tmdb)    p.set('tmdb_key',    config.keys.tmdb);
  if (config.keys?.fanart)  p.set('fanart_key',  config.keys.fanart);
  if (config.keys?.omdb)    p.set('omdb_key',    config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  // ── Global glass / style params ──────────────────────────────────────────
  p.set('b',  ps(config.blur));
  p.set('a',  ps(config.alpha));
  p.set('rr', ps(config.radius));
  p.set('sh', ps(config.shadow));
  p.set('sc', (config.scale ?? 1.0).toFixed(3));

  if (config.posterBlur > 0) p.set('pb', ps(config.posterBlur));
  if (config.grayscale)      p.set('gs', '1');
  if (config.layout !== 'custom') p.set('l', config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  // V3 'bw' param refers to Border Width
  if ((config.borderW ?? 0) > 0) p.set('bw', ps(config.borderW!));
  if (config.borderC) p.set('bc', config.borderC);
  if (config.bg)      p.set('bg', config.bg);
  if (config.txt)     p.set('tc', config.txt);
  if (config.icon === false) p.set('gi', '0');

  // ── Hoist common per-badge values ────────────────────────────────────────
  const hoisted = detectHoistable(config);
  if (hoisted.blur    !== undefined) p.set('b',  ps(hoisted.blur as number));
  if (hoisted.alpha   !== undefined) p.set('a',  ps(hoisted.alpha as number));
  if (hoisted.radius  !== undefined) p.set('rr', ps(hoisted.radius as number));
  if (hoisted.shadow  !== undefined) p.set('sh', ps(hoisted.shadow as number));
  if (hoisted.bg)      p.set('bg', hoisted.bg as string);
  if (hoisted.txt)     p.set('tc', hoisted.txt as string);
  if (hoisted.borderC) p.set('bc', hoisted.borderC as string);
  if (hoisted.icon !== undefined) p.set('gi', hoisted.icon ? '1' : '0');

  // ── Per-badge params (MUST use format like: 'imx', 'rtbc' — NO underscore)
  config.ratings.forEach((key: RatingType, index: number) => {
    const item  = config.items[key] ?? {};
    const code  = V3_KEY_TO_CODE[key];
    if (!code) return;

    const autoX = 20;
    const autoY = 20 + index * 70;

    p.set(`${code}x`, ps(Math.round(item.x ?? autoX)));
    p.set(`${code}y`, ps(Math.round(item.y ?? autoY)));

    if (item.bg      !== undefined && item.bg      !== hoisted.bg)      p.set(`${code}bg`, item.bg);
    if (item.txt     !== undefined && item.txt     !== hoisted.txt)     p.set(`${code}tc`, item.txt);
    if (item.blur    !== undefined && item.blur    !== hoisted.blur)    p.set(`${code}b`,  ps(item.blur));
    if (item.alpha   !== undefined && item.alpha   !== hoisted.alpha)   p.set(`${code}a`,  ps(item.alpha));
    if (item.radius  !== undefined && item.radius  !== hoisted.radius)  p.set(`${code}r`,  ps(item.radius));
    if (item.shadow  !== undefined && item.shadow  !== hoisted.shadow)  p.set(`${code}s`,  ps(item.shadow));
    if (item.icon !== undefined && item.icon !== hoisted.icon)          p.set(`${code}i`,  item.icon ? '1' : '0');
    if (item.scale   !== undefined && item.scale   !== hoisted.scale)   p.set(`${code}sc`, item.scale.toFixed(3));
    if (item.borderW !== undefined)                                      p.set(`${code}bw`, ps(item.borderW));
    if (item.borderC !== undefined && item.borderC !== hoisted.borderC) p.set(`${code}bc`, item.borderC);
  });

  // ── Logo ─────────────────────────────────────────────────────────────────
  if (config.logo) {
    p.set('lo', '1');
    if (config.logoSource) p.set('ls', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined) p.set('lx', ps(config.logoX));
    p.set('ly', ps(config.logoY));
    p.set('lw', ps(config.logoW));
    p.set('lh', ps(config.logoH));
    if (config.logoOpacity !== 1.0) p.set('la', config.logoOpacity.toFixed(2));
    if (config.logoShadow  !== 6)   p.set('lsh', ps(config.logoShadow));
  }

  return url.toString();
}

export function urlSavings(shortUrl: string, longUrl: string): { saved: number; pct: number } {
  const saved = longUrl.length - shortUrl.length;
  const pct   = longUrl.length > 0 ? Math.round((saved / longUrl.length) * 100) : 0;
  return { saved, pct };
}
// src/components/builder/utils.ts
import type { PosterConfig, RatingType, MediaType, ApiKeys, ExtensionType, LogoSourceType } from './types';
import { DEFAULT_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H, GAP, PADDING } from './types';

// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.spicydevs.xyz';

/** Short IDs for v3 compact URL r= and fb= params, per migration.md */
const PROVIDER_SHORT: Record<RatingType, string> = {
  tmdb: 't', imdb: 'i', rt: 'r', rt_popcorn: 'p', letterboxd: 'l',
  meta: 'm', age: 'a', runtime: 'n', mal: 'M', anilist: 'A',
};

const toShortList = (ids: RatingType[]): string =>
  ids.map(id => PROVIDER_SHORT[id]).filter(Boolean).join(',');

export const getScale = (size: string) => size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1.0;

export const calculateAutoPosition = (_ratingId: RatingType, index: number, totalBadges: number, config: PosterConfig) => {
  const scale  = getScale(config.size);
  const badgeW = BASE_BADGE_W * scale;
  const badgeH = BASE_BADGE_H * scale;
  const isRow  = config.layout === 'row';
  const groupW = isRow ? totalBadges * badgeW + (totalBadges - 1) * GAP : badgeW;
  const groupH = isRow ? badgeH : totalBadges * badgeH + (totalBadges - 1) * GAP;
  let presetX = 0, presetY = 0;
  if (config.preset.includes('l'))      presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else                                   presetX = (CANVAS_WIDTH - groupW) / 2;
  if (config.preset.includes('t'))      presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else                                   presetY = (CANVAS_HEIGHT - groupH) / 2;
  const x = isRow ? presetX + index * (badgeW + GAP) : presetX;
  const y = isRow ? presetY : presetY + index * (badgeH + GAP);
  return { x: Math.round(x), y: Math.round(y) };
};

/**
 * Returns true when the URL string contains a `{placeholder}` template token.
 */
export const isTemplateUrl = (urlString: string): boolean => /\{[^}]+\}/.test(urlString);

/**
 * Replace the ID segment of a poster API URL with `{imdb_id}` to create a
 * shareable template string.  Always normalises to /poster/{imdb_id} format.
 */
export const toTemplateUrl = (urlString: string): string => {
  try {
    const u = new URL(urlString);
    const newPath = u.pathname.replace(
      /\/(movie|tv|anime|poster)\/(tt\d+|\d+)/i,
      '/poster/{imdb_id}'
    );
    return u.origin + newPath + u.search;
  } catch {
    return urlString;
  }
};

/**
 * Generate the API URL for the current poster configuration.
 *
 * Color values are passed WITH their leading '#' — URLSearchParams encodes '#'
 * as '%23' automatically and the backend parseConfig/svg.js expect '#rrggbb'.
 *
 * Uses /poster/{imdbId} when an IMDb ID is available (backend auto-detects
 * media type), falls back to /{mediaType}/{tmdbId}.
 */
export const generateApiUrl = (config: PosterConfig, baseUrl: string = DEFAULT_API_BASE): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');

  const pathSegment = config.imdbId
    ? `/poster/${config.imdbId}`
    : `/${config.mediaType}/${config.tmdbId}`;

  const url = new URL(`${cleanBase}${pathSegment}.${config.extension}`);
  const p   = url.searchParams;

  if (config.ratings.length > 0) p.set('r', toShortList(config.ratings));
  if (config.fallbackEnabled && config.fallbackPool.length > 0) p.set('fb', toShortList(config.fallbackPool));
  if (config.source !== 'tmdb')  p.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('textless', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('ptype', config.ptype);
  if (config.keys?.tmdb)    p.set('tmdb_key',    config.keys.tmdb);
  if (config.keys?.fanart)  p.set('fanart_key',  config.keys.fanart);
  if (config.keys?.omdb)    p.set('omdb_key',    config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  p.set('v',     '3');
  p.set('blur',  config.blur.toString());
  p.set('alpha', config.alpha.toString());
  p.set('rad',   config.radius.toString());
  p.set('sh',    config.shadow.toString());

  if (config.posterBlur > 0) p.set('bg_blur', config.posterBlur.toString());
  if (config.grayscale)      p.set('bw', '1');
  if (config.layout !== 'custom') p.set('l',   config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  const sizeScale = getScale(config.size);
  p.set('g_scale', (sizeScale * (config.scale ?? 1.0)).toFixed(3));

  if ((config.borderW ?? 0) > 0) p.set('g_bw', config.borderW!.toString());
  // Send colors WITH '#' — '#' becomes '%23' in the URL, backend expects that
  if (config.borderC) p.set('g_bc',  config.borderC);
  if (config.bg)      p.set('g_bg',  config.bg);
  if (config.txt)     p.set('g_txt', config.txt);
  p.set('g_icon', config.icon !== false ? '1' : '0');

  config.ratings.forEach((key: RatingType, index: number) => {
    const item    = config.items[key] || {};
    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    p.set(`${key}_x`, Math.round(item.x ?? autoPos.x).toString());
    p.set(`${key}_y`, Math.round(item.y ?? autoPos.y).toString());

    if (item.bg      !== undefined) p.set(`${key}_bg`,    item.bg);
    if (item.txt     !== undefined) p.set(`${key}_txt`,   item.txt);
    if (item.blur    !== undefined) p.set(`${key}_blur`,  item.blur.toString());
    if (item.alpha   !== undefined) p.set(`${key}_alpha`, item.alpha.toString());
    if (item.radius  !== undefined) p.set(`${key}_rad`,   item.radius.toString());
    if (item.shadow  !== undefined) p.set(`${key}_sh`,    item.shadow.toString());
    p.set(`${key}_icon`, (item.icon ?? config.icon ?? true) ? '1' : '0');
    if (item.scale   !== undefined) p.set(`${key}_scale`, (item.scale * sizeScale).toFixed(3));
    if (item.borderW !== undefined) p.set(`${key}_bw`,    item.borderW.toString());
    if (item.borderC !== undefined) p.set(`${key}_bc`,    item.borderC);
  });

  if (config.logo) {
    p.set('logo', '1');
    if (config.logoSource) p.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined) p.set('logo_x', config.logoX.toString());
    p.set('logo_y', config.logoY.toString());
    p.set('logo_w', config.logoW.toString());
    p.set('logo_h', config.logoH.toString());
    if (config.logoOpacity !== 1.0) p.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow  !== 6)   p.set('logo_sh',      config.logoShadow.toString());
  }

  return url.toString();
};

/**
 * Parse a poster API URL back into a PosterConfig object.
 *
 * Handles:
 *   /{mediaType}/{tmdbId}[.ext]     e.g. /movie/453395.png
 *   /poster/{imdbId}[.ext]          e.g. /poster/tt12042730.png
 *   /poster/{imdb_id}[.ext]         template — caller substitutes placeholder first
 *
 * @param urlString       The URL to parse
 * @param currentConfig   If provided, template placeholders are substituted with
 *                        the current config's ID before parsing.
 */
export const parseUrlToConfig = (urlString: string, currentConfig?: PosterConfig): PosterConfig => {
  try {
    // Substitute {imdb_id} (or any {placeholder}) with the current media ID
    // so that all style params in the template URL are correctly applied.
    let resolved = urlString;
    if (isTemplateUrl(urlString)) {
      const fallbackId = currentConfig?.imdbId || currentConfig?.tmdbId || DEFAULT_CONFIG.tmdbId;
      resolved = urlString.replace(/\{[^}]+\}/g, fallbackId);
    }

    const url   = new URL(resolved);
    const match = url.pathname.match(
      /^\/(movie|tv|anime|poster)\/(tt\d+|\d+)(?:\.(jpg|jpeg|png|svg|webp))?$/i
    );

    if (!match) {
      console.warn('[parseUrlToConfig] Unrecognised URL path:', url.pathname);
      return currentConfig ?? DEFAULT_CONFIG;
    }

    const pathType = match[1].toLowerCase();
    const rawId    = match[2];
    const extension: ExtensionType = match[3]
      ? ((match[3].toLowerCase() === 'jpeg' ? 'jpg' : match[3].toLowerCase()) as ExtensionType)
      : 'svg';

    const isImdbPath = pathType === 'poster';
    const mediaType: MediaType = isImdbPath ? 'movie' : (pathType as MediaType);
    const imdbId  = (isImdbPath || rawId.startsWith('tt')) ? rawId : undefined;
    const tmdbId  = !isImdbPath && !rawId.startsWith('tt') ? rawId : (currentConfig?.tmdbId ?? DEFAULT_CONFIG.tmdbId);

    const q = url.searchParams;

    // Normalize a color param — add '#' prefix if absent
    const nc = (v: string | null): string | undefined => {
      if (!v) return undefined;
      return v.startsWith('#') ? v : `#${v}`;
    };

    const keys: ApiKeys = {};
    if (q.has('tmdb_key'))    keys.tmdb    = q.get('tmdb_key')!;
    if (q.has('fanart_key'))  keys.fanart  = q.get('fanart_key')!;
    if (q.has('omdb_key'))    keys.omdb    = q.get('omdb_key')!;
    if (q.has('mdblist_key')) keys.mdblist = q.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};
    const ratingKeys: RatingType[] = ['imdb','rt','rt_popcorn','letterboxd','meta','tmdb','mal','anilist','age','runtime'];
    ratingKeys.forEach((key) => {
      const xp = q.get(`${key}_x`), yp = q.get(`${key}_y`);
      const bgp = q.get(`${key}_bg`), txtp = q.get(`${key}_txt`);
      const blurp = q.get(`${key}_blur`), alphap = q.get(`${key}_alpha`);
      const radp = q.get(`${key}_rad`), shp = q.get(`${key}_sh`);
      const iconp = q.get(`${key}_icon`), scalep = q.get(`${key}_scale`);
      const bwp = q.get(`${key}_bw`), bcp = q.get(`${key}_bc`);
      if (xp || yp || bgp || txtp || blurp || alphap || radp || shp || iconp || scalep || bwp) {
        items[key] = {
          ...(xp     ? { x:       parseInt(xp)      } : {}),
          ...(yp     ? { y:       parseInt(yp)      } : {}),
          ...(bgp    ? { bg:      nc(bgp)!           } : {}),
          ...(txtp   ? { txt:     nc(txtp)!          } : {}),
          ...(blurp  ? { blur:    parseInt(blurp)    } : {}),
          ...(alphap ? { alpha:   parseFloat(alphap) } : {}),
          ...(radp   ? { radius:  parseInt(radp)     } : {}),
          ...(shp    ? { shadow:  parseInt(shp)      } : {}),
          ...(iconp  ? { icon:    iconp === '1'      } : {}),
          ...(scalep ? { scale:   parseFloat(scalep) } : {}),
          ...(bwp    ? { borderW: parseInt(bwp)      } : {}),
          ...(bcp    ? { borderC: nc(bcp)!           } : {}),
        };
      }
    });

    const VALID_LOGO: LogoSourceType[] = ['fanart', 'tmdb', 'metahub'];
    const rawLS = q.get('logo_source')?.trim().toLowerCase() || null;
    const logoSource: LogoSourceType = VALID_LOGO.includes(rawLS as LogoSourceType)
      ? (rawLS as LogoSourceType) : null;

    return {
      mediaType, tmdbId, imdbId, extension,
      ratings:    q.has('r') ? (q.get('r')!.split(',') as RatingType[]) : [],
      source:     (q.get('source') as PosterConfig['source']) || 'tmdb',
      ptype:      q.get('ptype') || 'auto',
      textless:   q.get('textless') === '1',
      theme:      'glass', size: 'md',
      shadow:     q.has('sh')       ? parseInt(q.get('sh')!)        : 6,
      layout:     (q.get('l')   as PosterConfig['layout'])  || 'custom',
      preset:     (q.get('pos') as PosterConfig['preset']) || 'custom',
      blur:       q.has('blur')     ? parseInt(q.get('blur')!)      : 8,
      alpha:      q.has('alpha')    ? parseFloat(q.get('alpha')!)   : 0.4,
      radius:     q.has('rad')      ? parseInt(q.get('rad')!)       : 12,
      posterBlur: q.has('bg_blur')  ? parseInt(q.get('bg_blur')!)   : 0,
      grayscale:  q.get('bw') === '1',
      scale:      q.get('g_scale')  ? parseFloat(q.get('g_scale')!) : 1.0,
      borderW:    q.get('g_bw')     ? parseInt(q.get('g_bw')!)      : 0,
      borderC:    nc(q.get('g_bc')),
      bg:         nc(q.get('g_bg')),
      txt:        nc(q.get('g_txt')),
      icon:       q.get('g_icon')   ? q.get('g_icon') === '1'       : true,
      keys, items,
      logo:        q.get('logo') === '1',
      logoSource,
      logoX:       q.has('logo_x')       ? parseInt(q.get('logo_x')!)         : null,
      logoY:       q.has('logo_y')       ? parseInt(q.get('logo_y')!)         : 630,
      logoW:       q.has('logo_w')       ? parseInt(q.get('logo_w')!)         : 380,
      logoH:       q.has('logo_h')       ? parseInt(q.get('logo_h')!)         : 100,
      logoOpacity: q.has('logo_opacity') ? parseFloat(q.get('logo_opacity')!) : 1.0,
      logoShadow:  q.has('logo_sh')      ? parseInt(q.get('logo_sh')!)        : 6,
      fallbackEnabled: false,
      fallbackPool: [],
    };
  } catch (e) {
    console.error('[parseUrlToConfig] Failed to parse URL:', e);
    return currentConfig ?? DEFAULT_CONFIG;
  }
};
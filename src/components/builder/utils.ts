// src/components/builder/utils.ts
import type { PosterConfig, BadgeConfig, RatingType, MediaType, ApiKeys, ExtensionType, LogoSourceType } from './types';
import { DEFAULT_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H, GAP, PADDING } from './types';

// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.spicydevs.xyz';

/** Short IDs for v3 compact URL r= and fb= params, per migration.md */
export const PROVIDER_SHORT: Record<RatingType, string> = {
  tmdb: 't', imdb: 'i', rt: 'r', rt_popcorn: 'p', letterboxd: 'l',
  meta: 'm', age: 'a', runtime: 'n', mal: 'M', anilist: 'A',
};

/** Reverse map: short ID → RatingType */
export const SHORT_PROVIDER: Record<string, RatingType> = Object.fromEntries(
  Object.entries(PROVIDER_SHORT).map(([k, v]) => [v, k as RatingType])
) as Record<string, RatingType>;

const toShortList = (ids: RatingType[]): string =>
  ids.map(id => PROVIDER_SHORT[id]).filter(Boolean).join(',');

/**
 * Normalize a display value to canonical precision.
 * Strips trailing zeros after the decimal point, e.g.:
 *   "85.0%" → "85%",  "7.50" → "7.5",  "72.0" → "72",  "3.80" → "3.8"
 */
export function cleanValue(v: string): string {
  const m = v.match(/^(-?\d+(?:\.\d+)?)(%?)$/);
  if (!m) return v;
  const [, num, suffix] = m;
  const cleaned = parseFloat(num).toString();
  return cleaned + suffix;
}

/**
 * Short-form aliases accepted by parseUrlToConfig.
 * Mapping: short key → canonical long-form query param key.
 */
export const GLOBAL_SHORT_ALIASES: Readonly<Record<string, string>> = {
  bl: 'blur',    // badge glass blur
  al: 'alpha',   // badge background opacity
  ra: 'rad',     // corner radius
  sc: 'g_scale', // global badge scale
  bc: 'g_bc',    // global badge border color
  bg: 'g_bg',    // global badge background color
  tx: 'g_txt',   // global badge text color
  ic: 'g_icon',  // global icon visibility
  pb: 'bg_blur', // poster/background blur
  tl: 'textless',// textless poster flag
  so: 'source',  // poster source
  pt: 'ptype',   // poster type/selection mode
  nm: 'normalize',  // normalize scores to /10
  of: 'out_of',     // out-of denominator
  it: 'icon_type',  // icon variant
  lp: 'label_pos',  // label position
  lt: 'label_text', // label text override
  ls: 'label_size', // label font size
  lc: 'label_color',// label color
};

/**
 * Short suffix aliases for per-badge params.
 * Mapping: short suffix → canonical long-form suffix.
 * Entries where short === long are omitted (no alias needed).
 */
export const BADGE_SUFFIX_ALIASES: Readonly<Record<string, string>> = {
  bl: 'blur', al: 'alpha', ra: 'rad',
  ic: 'icon', sc: 'scale',
  tx: 'txt',
  nm: 'nm', of: 'of', it: 'it',
  lp: 'lp', lt: 'lt', ls: 'ls', lc: 'lc',
};

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

  // New v3 global params
  if (config.normalize)                              p.set('nm', '1');
  if (config.outOf !== undefined)                    p.set('of', config.outOf.toString());
  if (config.iconType !== undefined && config.iconType !== 1) p.set('it', config.iconType.toString());
  if (config.labelPos)                               p.set('lp', config.labelPos);
  if (config.labelText)                              p.set('lt', config.labelText);
  if (config.labelSize !== undefined && config.labelSize !== 11) p.set('ls', config.labelSize.toString());
  if (config.labelColor)                             p.set('lc', config.labelColor);
  if (config.uiPreset && config.uiPreset !== 'b')    p.set('p', config.uiPreset);

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

    // New v3 per-badge params
    if (item.normalize !== undefined) p.set(`${key}_nm`, item.normalize ? '1' : '0');
    if (item.outOf     !== undefined) p.set(`${key}_of`, item.outOf.toString());
    if (item.iconType  !== undefined) p.set(`${key}_it`, item.iconType.toString());
    if (item.labelPos)                p.set(`${key}_lp`, item.labelPos);
    if (item.labelText)               p.set(`${key}_lt`, item.labelText);
    if (item.labelSize !== undefined) p.set(`${key}_ls`, item.labelSize.toString());
    if (item.labelColor)              p.set(`${key}_lc`, item.labelColor);
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

    const apiVersion = parseInt(q.get('v') || '2', 10);
    const isV3 = apiVersion >= 3;

    /**
     * Read a query param checking the canonical long-form key first, then the
     * short-form alias (v3).  Returns null when neither is present.
     */
    const qp = (long: string, short?: string): string | null =>
      q.get(long) ?? (short ? q.get(short) : null);

    const SHORT_TO_FULL: Record<string, RatingType> = {
      t: 'tmdb', i: 'imdb', r: 'rt', p: 'rt_popcorn', l: 'letterboxd',
      m: 'meta', a: 'age', n: 'runtime', M: 'mal', A: 'anilist',
    };
    const FULL_RATING_NAMES = new Set<string>(Object.keys(PROVIDER_SHORT));
    const decodeRatings = (raw: string): RatingType[] => {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      if (isV3) {
        return parts
          .map(c => SHORT_TO_FULL[c] ?? (FULL_RATING_NAMES.has(c) ? (c as RatingType) : undefined))
          .filter(Boolean) as RatingType[];
      }
      return parts as RatingType[];
    };

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

    /**
     * Read a per-badge param supporting four key forms:
     *   full_prefix + long_suffix   (imdb_blur)      — canonical v2/v3
     *   full_prefix + short_suffix  (imdb_bl)        — v3 short suffix
     *   short_prefix + long_suffix  (i_blur)         — v3 short prefix
     *   short_prefix + short_suffix (i_bl)           — v3 compact
     */
    const getBadgeParam = (badgeId: RatingType, longSuffix: string, shortSuffix?: string): string | null => {
      let v = q.get(`${badgeId}_${longSuffix}`);
      if (v !== null) return v;
      if (shortSuffix) { v = q.get(`${badgeId}_${shortSuffix}`); if (v !== null) return v; }
      const sp = PROVIDER_SHORT[badgeId];
      if (sp) {
        v = q.get(`${sp}_${longSuffix}`); if (v !== null) return v;
        if (shortSuffix) { v = q.get(`${sp}_${shortSuffix}`); if (v !== null) return v; }
      }
      return null;
    };

    ratingKeys.forEach((key) => {
      const xp     = getBadgeParam(key, 'x');
      const yp     = getBadgeParam(key, 'y');
      const bgp    = getBadgeParam(key, 'bg');
      const txtp   = getBadgeParam(key, 'txt',   'tx');
      const blurp  = getBadgeParam(key, 'blur',  'bl');
      const alphap = getBadgeParam(key, 'alpha', 'al');
      const radp   = getBadgeParam(key, 'rad',   'ra');
      const shp    = getBadgeParam(key, 'sh');
      const iconp  = getBadgeParam(key, 'icon',  'ic');
      const scalep = getBadgeParam(key, 'scale', 'sc');
      const bwp    = getBadgeParam(key, 'bw');
      const bcp    = getBadgeParam(key, 'bc');
      // New v3 per-badge params
      const nmp    = getBadgeParam(key, 'nm');
      const ofp    = getBadgeParam(key, 'of');
      const itp    = getBadgeParam(key, 'it');
      const lpp    = getBadgeParam(key, 'lp');
      const ltp    = getBadgeParam(key, 'lt');
      const lsp    = getBadgeParam(key, 'ls');
      const lcp    = getBadgeParam(key, 'lc');

      if (xp || yp || bgp || txtp || blurp || alphap || radp || shp || iconp || scalep || bwp
          || nmp || ofp || itp || lpp || ltp || lsp || lcp) {
        items[key] = {
          ...(xp     ? { x:         parseInt(xp)              } : {}),
          ...(yp     ? { y:         parseInt(yp)              } : {}),
          ...(bgp    ? { bg:        nc(bgp)!                  } : {}),
          ...(txtp   ? { txt:       nc(txtp)!                 } : {}),
          ...(blurp  ? { blur:      parseInt(blurp)           } : {}),
          ...(alphap ? { alpha:     parseFloat(alphap)        } : {}),
          ...(radp   ? { radius:    parseInt(radp)            } : {}),
          ...(shp    ? { shadow:    parseInt(shp)             } : {}),
          ...(iconp  ? { icon:      iconp === '1'             } : {}),
          ...(scalep ? { scale:     parseFloat(scalep)        } : {}),
          ...(bwp    ? { borderW:   parseInt(bwp)             } : {}),
          ...(bcp    ? { borderC:   nc(bcp)!                  } : {}),
          ...(nmp    ? { normalize: nmp === '1'               } : {}),
          ...(ofp    ? { outOf:     parseInt(ofp)             } : {}),
          ...(itp    ? { iconType:  parseInt(itp)             } : {}),
          ...(lpp    ? { labelPos:  lpp as BadgeConfig['labelPos'] } : {}),
          ...(ltp    ? { labelText: ltp                       } : {}),
          ...(lsp    ? { labelSize: parseInt(lsp)             } : {}),
          ...(lcp    ? { labelColor: nc(lcp)                  } : {}),
        };
      }
    });

    const VALID_LOGO: LogoSourceType[] = ['fanart', 'tmdb', 'metahub'];
    const rawLS = q.get('logo_source')?.trim().toLowerCase() || null;
    const logoSource: LogoSourceType = VALID_LOGO.includes(rawLS as LogoSourceType)
      ? (rawLS as LogoSourceType) : null;

    const rawLabelPos = qp('label_pos', 'lp') as PosterConfig['labelPos'];

    return {
      mediaType, tmdbId, imdbId, extension,
      ratings:    q.has('r') ? decodeRatings(q.get('r')!) : [],
      source:     (qp('source', 'so') as PosterConfig['source']) || 'tmdb',
      ptype:      qp('ptype', 'pt') || 'auto',
      textless:   (qp('textless', 'tl') === '1'),
      theme:      'glass', size: 'md',
      shadow:     qp('sh')         ? parseInt(qp('sh')!)                  : 6,
      layout:     (q.get('l')  as PosterConfig['layout'])  || 'custom',
      preset:     (q.get('pos') as PosterConfig['preset']) || 'custom',
      blur:       qp('blur', 'bl') ? parseInt(qp('blur', 'bl')!)          : 8,
      alpha:      qp('alpha', 'al')? parseFloat(qp('alpha', 'al')!)       : 0.4,
      radius:     qp('rad', 'ra')  ? parseInt(qp('rad', 'ra')!)           : 12,
      posterBlur: qp('bg_blur', 'pb') ? parseInt(qp('bg_blur', 'pb')!)    : 0,
      grayscale:  q.get('bw') === '1',
      scale:      qp('g_scale', 'sc')  ? parseFloat(qp('g_scale', 'sc')!) : 1.0,
      borderW:    qp('g_bw')           ? parseInt(qp('g_bw')!)             : 0,
      borderC:    nc(qp('g_bc', 'bc')),
      bg:         nc(qp('g_bg', 'bg')),
      txt:        nc(qp('g_txt', 'tx')),
      icon:       qp('g_icon', 'ic')   ? qp('g_icon', 'ic') === '1'       : true,
      keys, items,
      logo:        q.get('logo') === '1',
      logoSource,
      logoX:       q.has('logo_x')       ? parseInt(q.get('logo_x')!)         : null,
      logoY:       q.has('logo_y')       ? parseInt(q.get('logo_y')!)         : 630,
      logoW:       q.has('logo_w')       ? parseInt(q.get('logo_w')!)         : 380,
      logoH:       q.has('logo_h')       ? parseInt(q.get('logo_h')!)         : 100,
      logoOpacity: q.has('logo_opacity') ? parseFloat(q.get('logo_opacity')!) : 1.0,
      logoShadow:  q.has('logo_sh')      ? parseInt(q.get('logo_sh')!)        : 6,
      fallbackEnabled: isV3 && q.has('fb') && q.get('fb')!.trim() !== '',
      fallbackPool:    isV3 && q.has('fb') ? decodeRatings(q.get('fb')!) : [],
      // New v3 global params (accept both long and short forms)
      normalize:   qp('normalize', 'nm') === '1' ? true : undefined,
      outOf:       qp('out_of', 'of')       ? parseInt(qp('out_of', 'of')!)       : undefined,
      iconType:    qp('icon_type', 'it')    ? parseInt(qp('icon_type', 'it')!)    : undefined,
      labelPos:    rawLabelPos || undefined,
      labelText:   qp('label_text', 'lt')   ?? undefined,
      labelSize:   qp('label_size', 'ls')   ? parseInt(qp('label_size', 'ls')!)   : undefined,
      labelColor:  nc(qp('label_color', 'lc'))                                     ?? undefined,
      uiPreset:    (qp('preset', 'p') as PosterConfig['uiPreset'])                ?? undefined,
    };
  } catch (e) {
    console.error('[parseUrlToConfig] Failed to parse URL:', e);
    return currentConfig ?? DEFAULT_CONFIG;
  }
};
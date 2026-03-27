// src/builder/utils.ts
//
// KEY DECISIONS
// ─────────────
// 1. generateApiUrl() ALWAYS produces V3 URLs (v=3 + short param names).
//    V3 gives shortest possible URLs for Plex/Jellyfin/Discord embeds.
//
// 2. parseUrlToConfig() understands BOTH V2 and V3 URLs so imported legacy
//    URLs still load correctly in the builder.
//
// 3. Params equal to their defaults are OMITTED from V3 URLs to minimise length.
//    Defaults: blur=8, alpha=0.4, radius=12, shadow=6, scale=1.0, borderW=0,
//    icon=true, posterBlur=0, grayscale=false, logoY=630, logoW=380, logoH=100,
//    logoOpacity=1.0, logoShadow=6.
//
// 4. grayscale → gs=1 (V3 keeps gs=); never bw= (V2 legacy alias) or bw=border.
//    The backend V3 parser treats bw= as border width, not grayscale.
//
// 5. g_scale double-apply fix: generateApiUrl sends item.scale as-is (the
//    user-set multiplier). getScale(size) is only used in the canvas display
//    (DraggableBadge.tsx) — it must NOT be baked into URL params because the
//    backend applies g_scale directly to SVG transforms with no size-scale factor.
//
// 6. v=2 removed from URL output. Backend defaults to V2 without it, and V3
//    is what the builder sends.
//
// V3 BADGE CODE MAP (2-char code → rating key):
//   im=imdb  rt=rt  rp=rt_popcorn  lb=letterboxd  mt=meta
//   td=tmdb  ml=mal  al=anilist     ag=age          ru=runtime
//
// V3 BADGE PROP SUFFIX MAP (suffix → param meaning):
//   x=pos  y=pos  b=blur  a=alpha  r=radius  s=shadow  i=icon
//   sc=scale  bw=border-width  bc=border-color  bg=background  tc=text-color

import type {
  PosterConfig,
  RatingType,
  MediaType,
  ApiKeys,
  ExtensionType,
  LogoSourceType,
} from './types';
import {
  DEFAULT_CONFIG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
  GAP,
  PADDING,
} from './types';

// @ts-ignore
const envApiUrl = import.meta.env?.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.spicydevs.xyz';

// ── V3 schema maps ────────────────────────────────────────────────────────

/** Canonical rating key → V3 2-char badge code */
const V3_KEY_TO_CODE: Record<RatingType, string> = {
  imdb:       'im',
  rt:         'rt',
  rt_popcorn: 'rp',
  letterboxd: 'lb',
  meta:       'mt',
  tmdb:       'td',
  mal:        'ml',
  anilist:    'al',
  age:        'ag',
  runtime:    'ru',
};

/** V3 2-char badge code → canonical rating key (reverse map for parsing) */
const V3_CODE_TO_KEY: Record<string, RatingType> = Object.fromEntries(
  Object.entries(V3_KEY_TO_CODE).map(([k, v]) => [v, k as RatingType])
);

/** V3 prop suffix → items[badge] key name (longest-first for parsing) */
const V3_PROP_SUFFIXES: Array<[string, string]> = [
  ['sc', 'scale'],
  ['bw', 'borderW'],
  ['bc', 'borderC'],
  ['bg', 'bg'],
  ['tc', 'txt'],
  ['x',  'x'],
  ['y',  'y'],
  ['b',  'blur'],
  ['a',  'alpha'],
  ['r',  'radius'],
  ['s',  'shadow'],
  ['i',  'icon'],
];

// ── Default values (omit param when equal to default) ────────────────────

const DEFAULTS = {
  blur:        8,
  alpha:       0.4,
  radius:      12,
  shadow:      6,
  scale:       1.0,
  borderW:     0,
  icon:        true,
  posterBlur:  0,
  grayscale:   false,
  logoY:       630,
  logoW:       380,
  logoH:       100,
  logoOpacity: 1.0,
  logoShadow:  6,
} as const;

// ── Canvas layout helpers ─────────────────────────────────────────────────

export const getScale = (size: string): number =>
  size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1.0;

export const calculateAutoPosition = (
  _ratingId: RatingType,
  index: number,
  totalBadges: number,
  config: PosterConfig
): { x: number; y: number } => {
  const scale  = getScale(config.size);
  const badgeW = BASE_BADGE_W * scale;
  const badgeH = BASE_BADGE_H * scale;
  const isRow  = config.layout === 'row';

  const groupW = isRow ? totalBadges * badgeW + (totalBadges - 1) * GAP : badgeW;
  const groupH = isRow ? badgeH : totalBadges * badgeH + (totalBadges - 1) * GAP;

  let presetX = 0, presetY = 0;

  if (config.preset.includes('l'))      presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH  - groupW - PADDING;
  else                                  presetX = (CANVAS_WIDTH  - groupW) / 2;

  if (config.preset.includes('t'))      presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else                                  presetY = (CANVAS_HEIGHT - groupH) / 2;

  const x = isRow ? presetX + index * (badgeW + GAP) : presetX;
  const y = isRow ? presetY : presetY + index * (badgeH + GAP);

  return { x: Math.round(x), y: Math.round(y) };
};

// ── V3 URL generator ──────────────────────────────────────────────────────

/**
 * Generate a V3 (shortest possible) API URL from the current builder config.
 * - Uses single/double-char param names
 * - Omits params equal to their defaults
 * - Never sends bg_blur or gs (applied client-side in PreviewCanvas)
 *   BUT does send them in the final URL for direct API usage (Plex/Jellyfin)
 *
 * @param config  Builder PosterConfig
 * @param baseUrl API base URL
 */
export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url       = new URL(`${cleanBase}/${config.mediaType}/${config.tmdbId}.${config.extension}`);
  const p         = url.searchParams;

  // Version flag — tells backend to use V3 parser
  p.set('v', '3');

  // Ratings
  if (config.ratings.length > 0) p.set('r', config.ratings.join(','));

  // Source / poster options
  if (config.source && config.source !== 'tmdb') p.set('s', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);

  // User API key overrides (keep verbose — security-sensitive, rarely in URLs)
  if (config.keys?.tmdb)    p.set('tmdb_key',    config.keys.tmdb);
  if (config.keys?.fanart)  p.set('fanart_key',  config.keys.fanart);
  if (config.keys?.omdb)    p.set('omdb_key',    config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  // Global badge style (omit when at default)
  if (config.blur    !== DEFAULTS.blur)    p.set('b',  config.blur.toString());
  if (config.alpha   !== DEFAULTS.alpha)   p.set('a',  config.alpha.toString());
  if (config.radius  !== DEFAULTS.radius)  p.set('rr', config.radius.toString());
  if (config.shadow  !== DEFAULTS.shadow)  p.set('sh', config.shadow.toString());

  // FIX: g_scale = pure user-set multiplier, NOT baked with sizeScale.
  // Backend applies this directly; DraggableBadge multiplies by getScale(size) separately.
  const globalScale = config.scale ?? 1.0;
  if (globalScale !== DEFAULTS.scale) p.set('sc', globalScale.toFixed(3));

  if ((config.borderW ?? 0) > 0) p.set('bw', config.borderW!.toString()); // V3: bw = border width
  if (config.borderC) p.set('bc', config.borderC);
  if (config.bg)      p.set('bg', config.bg);
  if (config.txt)     p.set('tc', config.txt);
  if (config.icon === false) p.set('gi', '0'); // omit when true (default)

  // Poster effects — sent to backend for direct API use (Plex/Jellyfin etc.)
  // Preview canvas applies these client-side via CSS filter (see PreviewCanvas.tsx)
  if (config.posterBlur > DEFAULTS.posterBlur) p.set('pb', config.posterBlur.toString());
  if (config.grayscale)                        p.set('gs', '1');

  // Layout / preset (same param names in V2 and V3 — already short)
  if (config.layout !== 'custom') p.set('l', config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  // Per-badge overrides (V3 format: {code}{prop}=value)
  config.ratings.forEach((key: RatingType, index: number) => {
    const item    = config.items[key] || {};
    const code    = V3_KEY_TO_CODE[key];
    if (!code) return;

    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    const finalX  = item.x !== undefined ? item.x : autoPos.x;
    const finalY  = item.y !== undefined ? item.y : autoPos.y;

    p.set(`${code}x`, Math.round(finalX).toString());
    p.set(`${code}y`, Math.round(finalY).toString());

    // Only emit per-badge overrides that differ from globals
    if (item.bg  !== undefined && item.bg  !== (config.bg  ?? '')) p.set(`${code}bg`, item.bg);
    if (item.txt !== undefined && item.txt !== (config.txt ?? '')) p.set(`${code}tc`, item.txt);

    const eff = (k: keyof typeof DEFAULTS, itemVal: any, globalVal: any) => {
      if (itemVal !== undefined && itemVal !== globalVal) return true;
      return false;
    };

    if (eff('blur',    item.blur,    config.blur))    p.set(`${code}b`,  item.blur!.toString());
    if (eff('alpha',   item.alpha,   config.alpha))   p.set(`${code}a`,  item.alpha!.toString());
    if (eff('radius',  item.radius,  config.radius))  p.set(`${code}r`,  item.radius!.toString());
    if (eff('shadow',  item.shadow,  config.shadow))  p.set(`${code}s`,  item.shadow!.toString());

    const itemIcon = item.icon ?? config.icon ?? true;
    if (itemIcon !== (config.icon ?? true)) p.set(`${code}i`, itemIcon ? '1' : '0');

    // FIX: send item.scale only (not item.scale * sizeScale)
    if (item.scale !== undefined && item.scale !== (config.scale ?? 1.0))
      p.set(`${code}sc`, item.scale.toFixed(3));

    if ((item.borderW ?? 0) !== (config.borderW ?? 0)) {
      if ((item.borderW ?? 0) > 0) p.set(`${code}bw`, item.borderW!.toString());
    }
    if (item.borderC !== undefined && item.borderC !== (config.borderC ?? '#ffffff'))
      p.set(`${code}bc`, item.borderC);
  });

  // Logo overlay (V3 short names)
  if (config.logo) {
    p.set('lo', '1');
    if (config.logoSource) p.set('ls', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined)
      p.set('lx', config.logoX.toString());
    if (config.logoY !== DEFAULTS.logoY) p.set('ly', config.logoY.toString());
    if (config.logoW !== DEFAULTS.logoW) p.set('lw', config.logoW.toString());
    if (config.logoH !== DEFAULTS.logoH) p.set('lh', config.logoH.toString());
    if (config.logoOpacity !== DEFAULTS.logoOpacity)
      p.set('la', config.logoOpacity.toFixed(2));
    if (config.logoShadow !== DEFAULTS.logoShadow)
      p.set('lsh', config.logoShadow.toString());
  }

  return url.toString();
};

// ── URL parser (handles both V2 and V3) ──────────────────────────────────

/**
 * Parse an API URL (V2 or V3) into a PosterConfig.
 * Used by the builder's "Load URL" feature.
 */
export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url   = new URL(urlString);
    const match = url.pathname.match(
      /\/(movie|tv|anime)\/(\w+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/
    );

    const mediaType: MediaType = match
      ? (match[1] as MediaType)
      : DEFAULT_CONFIG.mediaType;
    const tmdbId = match ? match[2] : DEFAULT_CONFIG.tmdbId;
    const extension: ExtensionType = match && match[3]
      ? ((match[3] === 'jpeg' ? 'jpg' : match[3]) as ExtensionType)
      : 'svg';

    const p     = url.searchParams;
    const isV3  = p.get('v') === '3';

    const keys: ApiKeys = {};
    if (p.has('tmdb_key'))    keys.tmdb    = p.get('tmdb_key')!;
    if (p.has('fanart_key'))  keys.fanart  = p.get('fanart_key')!;
    if (p.has('omdb_key'))    keys.omdb    = p.get('omdb_key')!;
    if (p.has('mdblist_key')) keys.mdblist = p.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};

    if (isV3) {
      // ── Parse V3 per-badge params ──────────────────────────────────────
      for (const [name, value] of p.entries()) {
        if (name.length < 3) continue;
        const code = name.slice(0, 2);
        const badgeKey = V3_CODE_TO_KEY[code];
        if (!badgeKey) continue;
        const suffix = name.slice(2);
        const propEntry = V3_PROP_SUFFIXES.find(([sfx]) => sfx === suffix);
        if (!propEntry) continue;

        const [, propName] = propEntry;
        if (!items[badgeKey]) items[badgeKey] = {};
        switch (propName) {
          case 'x':       items[badgeKey].x       = parseInt(value); break;
          case 'y':       items[badgeKey].y       = parseInt(value); break;
          case 'blur':    items[badgeKey].blur    = parseInt(value); break;
          case 'alpha':   items[badgeKey].alpha   = parseFloat(value); break;
          case 'radius':  items[badgeKey].radius  = parseInt(value); break;
          case 'shadow':  items[badgeKey].shadow  = parseInt(value); break;
          case 'icon':    items[badgeKey].icon    = value === '1'; break;
          case 'scale':   items[badgeKey].scale   = parseFloat(value); break;
          case 'borderW': items[badgeKey].borderW = parseInt(value); break;
          case 'borderC': items[badgeKey].borderC = value.startsWith('#') ? value : `#${value}`; break;
          case 'bg':      items[badgeKey].bg      = value; break;
          case 'txt':     items[badgeKey].txt     = value.startsWith('#') ? value : `#${value}`; break;
        }
      }

      const logoSource = (['fanart', 'tmdb', 'metahub'].includes(p.get('ls') ?? ''))
        ? (p.get('ls') as LogoSourceType) : null;

      return {
        mediaType, tmdbId, extension,
        ratings:     p.has('r') ? (p.get('r')!.split(',') as RatingType[]) : [],
        source:      (p.get('s') as PosterConfig['source']) || 'tmdb',
        ptype:       p.get('pt') || 'auto',
        textless:    p.get('tl') === '1',
        theme:       'glass', size: 'md',
        shadow:      p.has('sh') ? parseInt(p.get('sh')!) : DEFAULTS.shadow,
        layout:      (p.get('l') as PosterConfig['layout']) || 'custom',
        preset:      (p.get('pos') as PosterConfig['preset']) || 'custom',
        blur:        p.has('b')  ? parseInt(p.get('b')!)        : DEFAULTS.blur,
        alpha:       p.has('a')  ? parseFloat(p.get('a')!)      : DEFAULTS.alpha,
        radius:      p.has('rr') ? parseInt(p.get('rr')!)       : DEFAULTS.radius,
        posterBlur:  p.has('pb') ? parseInt(p.get('pb')!)       : DEFAULTS.posterBlur,
        grayscale:   p.get('gs') === '1',
        scale:       p.has('sc') ? parseFloat(p.get('sc')!)     : DEFAULTS.scale,
        borderW:     p.has('bw') ? parseInt(p.get('bw')!)       : DEFAULTS.borderW, // V3: bw=border width
        borderC:     p.has('bc') ? (p.get('bc')!.startsWith('#') ? p.get('bc')! : `#${p.get('bc')}`) : undefined,
        bg:          p.get('bg') || undefined,
        txt:         p.has('tc') ? (p.get('tc')!.startsWith('#') ? p.get('tc')! : `#${p.get('tc')}`) : undefined,
        icon:        p.has('gi') ? p.get('gi') === '1' : true,
        keys, items,
        logo:        p.get('lo') === '1',
        logoSource,
        logoX:       p.has('lx') ? parseInt(p.get('lx')!) : null,
        logoY:       p.has('ly') ? parseInt(p.get('ly')!) : DEFAULTS.logoY,
        logoW:       p.has('lw') ? parseInt(p.get('lw')!) : DEFAULTS.logoW,
        logoH:       p.has('lh') ? parseInt(p.get('lh')!) : DEFAULTS.logoH,
        logoOpacity: p.has('la') ? parseFloat(p.get('la')!) : DEFAULTS.logoOpacity,
        logoShadow:  p.has('lsh') ? parseInt(p.get('lsh')!) : DEFAULTS.logoShadow,
      };
    }

    // ── Parse V2 per-badge params (existing format) ────────────────────────
    const ratingKeys: RatingType[] = [
      'imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta',
      'tmdb', 'mal', 'anilist', 'age', 'runtime',
    ];

    ratingKeys.forEach((key) => {
      const x     = p.get(`${key}_x`);
      const y     = p.get(`${key}_y`);
      const bg    = p.get(`${key}_bg`);
      const txt   = p.get(`${key}_txt`);
      const blur  = p.get(`${key}_blur`);
      const alpha = p.get(`${key}_alpha`);
      const rad   = p.get(`${key}_rad`);
      const sh    = p.get(`${key}_sh`);
      const icon  = p.get(`${key}_icon`);
      const scale = p.get(`${key}_scale`);
      const bw    = p.get(`${key}_bw`);
      const bc    = p.get(`${key}_bc`);

      if (x || y || bg || txt || blur || alpha || rad || sh || icon || scale || bw) {
        items[key] = {
          ...(x     ? { x: parseInt(x) }                                      : {}),
          ...(y     ? { y: parseInt(y) }                                      : {}),
          ...(bg    ? { bg }                                                   : {}),
          ...(txt   ? { txt: txt.startsWith('#') ? txt : `#${txt}` }          : {}),
          ...(blur  ? { blur: parseInt(blur) }                                 : {}),
          ...(alpha ? { alpha: parseFloat(alpha) }                             : {}),
          ...(rad   ? { radius: parseInt(rad) }                                : {}),
          ...(sh    ? { shadow: parseInt(sh) }                                 : {}),
          ...(icon  ? { icon: icon === '1' }                                   : {}),
          ...(scale ? { scale: parseFloat(scale) }                             : {}),
          ...(bw    ? { borderW: parseInt(bw) }                                : {}),
          ...(p.has(`${key}_bc`) ? { borderC: (bc!.startsWith('#') ? bc! : `#${bc}`) } : {}),
        };
      }
    });

    const g_scale = p.get('g_scale');
    const g_bw    = p.get('g_bw');
    const g_bc    = p.get('g_bc');
    const g_bg    = p.get('g_bg');
    const g_txt   = p.get('g_txt');
    const g_icon  = p.get('g_icon');

    // V2: gs=1 or bw=1 (legacy alias) for grayscale
    const grayscale = p.get('gs') === '1' || p.get('bw') === '1';

    const rawLogoSource = p.get('logo_source');
    const logoSource: LogoSourceType = (['fanart', 'tmdb', 'metahub'] as const).includes(
      rawLogoSource as any
    )
      ? (rawLogoSource as LogoSourceType)
      : null;

    return {
      mediaType, tmdbId, extension,
      ratings:     p.has('r') ? (p.get('r')!.split(',') as RatingType[]) : [],
      source:      (p.get('source') as PosterConfig['source']) || 'tmdb',
      ptype:       p.get('ptype') || 'auto',
      textless:    p.get('textless') === '1',
      theme:       'glass', size: 'md',
      shadow:      p.has('sh')      ? parseInt(p.get('sh')!)         : DEFAULTS.shadow,
      layout:      (p.get('l') as PosterConfig['layout']) || 'custom',
      preset:      (p.get('pos') as PosterConfig['preset']) || 'custom',
      blur:        p.has('blur')    ? parseInt(p.get('blur')!)        : DEFAULTS.blur,
      alpha:       p.has('alpha')   ? parseFloat(p.get('alpha')!)     : DEFAULTS.alpha,
      radius:      p.has('rad')     ? parseInt(p.get('rad')!)         : DEFAULTS.radius,
      posterBlur:  p.has('bg_blur') ? parseInt(p.get('bg_blur')!)     : DEFAULTS.posterBlur,
      grayscale,
      scale:       g_scale         ? parseFloat(g_scale)              : DEFAULTS.scale,
      borderW:     g_bw            ? parseInt(g_bw)                   : DEFAULTS.borderW,
      borderC:     g_bc            ? (g_bc.startsWith('#') ? g_bc : `#${g_bc}`) : undefined,
      bg:          g_bg || undefined,
      txt:         g_txt           ? (g_txt.startsWith('#') ? g_txt : `#${g_txt}`) : undefined,
      icon:        g_icon          ? g_icon === '1' : true,
      keys, items,
      logo:        p.get('logo') === '1',
      logoSource,
      logoX:       p.has('logo_x') ? parseInt(p.get('logo_x')!)       : null,
      logoY:       p.has('logo_y') ? parseInt(p.get('logo_y')!)        : DEFAULTS.logoY,
      logoW:       p.has('logo_w') ? parseInt(p.get('logo_w')!)        : DEFAULTS.logoW,
      logoH:       p.has('logo_h') ? parseInt(p.get('logo_h')!)        : DEFAULTS.logoH,
      logoOpacity: p.has('logo_opacity') ? parseFloat(p.get('logo_opacity')!) : DEFAULTS.logoOpacity,
      logoShadow:  p.has('logo_sh') ? parseInt(p.get('logo_sh')!)      : DEFAULTS.logoShadow,
    };
  } catch (e) {
    console.error('Failed to parse URL', e);
    return DEFAULT_CONFIG;
  }
};


export const isTemplateUrl = (url: string): boolean => {
  return /\{[^}]+\}|%7B[^}]+%7D/.test(url);
};

export const toTemplateUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(/\/(movie|tv|anime)\/([a-zA-Z0-9_-]+)(?:\.(jpg|jpeg|png|svg|webp))?$/);
    if (match) {
      const id = match[2];
      url.pathname = url.pathname.replace(`/${id}`, '/{imdb_id}');
      // Prevent URL encoding from breaking the template braces
      return url.toString().replace('%7Bimdb_id%7D', '{imdb_id}');
    }
    return urlString;
  } catch {
    return urlString;
  };
// src/components/builder/utils.ts
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
//    Defaults: blur=0, alpha=0.4, radius=12, shadow=6, scale=1.0, borderW=0,
//    icon=true, posterBlur=0, grayscale=false, logoY=630, logoW=380, logoH=100,
//    logoOpacity=1.0, logoShadow=6, iconType=1, labelSize=11.
//
// 4. grayscale → gs=1 (V3 keeps gs=); never bw= (V2 legacy alias) or bw=border.
//    The backend V3 parser treats bw= as border width, not grayscale.
//
// 5. g_scale double-apply fix: generateApiUrl sends item.scale as-is (the
//    user-set multiplier). getScale(size) is only used in the canvas display
//    (DraggableBadge.tsx) — it must NOT be baked into URL params because the
//    backend applies g_scale directly to SVG transforms with no size-scale factor.
//
// ── V3 PARAM ALIGNMENT WITH BACKEND ──────────────────────────────────────────
// Backend file: api/modules/poster/config/parseConfig.js
//
// PROVIDER CODES (single char — must match PROVIDER_SHORT_MAP in parseConfig.js):
//   i=imdb  r=rt  p=rt_popcorn  l=letterboxd  m=meta
//   t=tmdb  M=mal  A=anilist     a=age          n=runtime
//
// GLOBAL SHORT ALIASES (must match V3_GLOBAL in parseConfig.js):
//   bl=blur  al=alpha  ra=rad(ius)  sh=shadow  sc=g_scale
//   pb=bg_blur  gs=grayscale  tl=textless  pt=ptype  nt=no_text
//   ic=g_icon  bw=g_bw(border-width)  bc=g_bc  bg=g_bg  tx=g_txt
//   nm=normalize  of=out_of  it=icon_type  p=preset
//   lp=label_pos  lt=label_text  ls=label_size  lc=label_color
//   fb=fallback-pool  source=source (NO alias — backend reads 'source' directly)
//
// PER-BADGE SUFFIX FORMAT: {1-char-code}_{suffix}  e.g. i_x, r_bl, p_al
//   Suffixes: x y bl al ra sh sc bw bc bg tx ic nt nm of it lp lt ls lc

import type {
  PosterConfig,
  RatingType,
  MediaType,
  ApiKeys,
  ExtensionType,
  LogoSourceType,
  BadgeConfig,
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

// ── V3 schema maps ─────────────────────────────────────────────────────────
// CRITICAL: single-char codes must exactly match backend PROVIDER_SHORT_MAP
// (api/modules/poster/config/parseConfig.js → PROVIDER_SHORT_MAP)

/** Canonical rating key → V3 single-char badge code */
const V3_KEY_TO_CODE: Record<RatingType, string> = {
  imdb:       'i',
  rt:         'r',
  rt_popcorn: 'p',
  letterboxd: 'l',
  meta:       'm',
  tmdb:       't',
  mal:        'M',
  anilist:    'A',
  age:        'a',
  runtime:    'n',
};

/** V3 single-char badge code → canonical rating key */
const V3_CODE_TO_KEY: Record<string, RatingType> = Object.fromEntries(
  Object.entries(V3_KEY_TO_CODE).map(([k, v]) => [v, k as RatingType])
);

// Exported — used by v3Builder.ts, tests, and any consumer needing these maps
export const PROVIDER_SHORT: Record<string, string>   = V3_KEY_TO_CODE;
export const SHORT_PROVIDER: Record<string, RatingType> = V3_CODE_TO_KEY;

/**
 * Strip floating-point noise from a raw rating string.
 * 85.0% → 85%  |  7.50 → 7.5  |  72.0 → 72  |  PG-13 → PG-13
 */
export function cleanValue(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return s;
  if (s.endsWith('%')) {
    const n = parseFloat(s);
    if (isNaN(n)) return s;
    const c = +n.toFixed(1);
    return `${c % 1 === 0 ? (c | 0) : c}%`;
  }
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = parseFloat(s);
    const c = +n.toFixed(2);
    return String(c % 1 === 0 ? (c | 0) : c);
  }
  return s;
}

// ── Default values (omit param when equal to default) ────────────────────

const DEFAULTS = {
  blur: 0,
  alpha: 0.4,
  radius: 12,
  shadow: 6,
  scale: 1.0,
  borderW: 0,
  icon: true,
  posterBlur: 0,
  grayscale: false,
  logoY: 630,
  logoW: 380,
  logoH: 100,
  logoOpacity: 1.0,
  logoShadow: 6,
  iconType: 1,
  labelSize: 11,
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
  const scale = getScale(config.size);
  const badgeW = BASE_BADGE_W * scale;
  const badgeH = BASE_BADGE_H * scale;
  const isRow = config.layout === 'row';

  const groupW = isRow ? totalBadges * badgeW + (totalBadges - 1) * GAP : badgeW;
  const groupH = isRow ? badgeH : totalBadges * badgeH + (totalBadges - 1) * GAP;

  let presetX = 0, presetY = 0;

  if (config.preset.includes('l'))      presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else                                  presetX = (CANVAS_WIDTH - groupW) / 2;

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
 *
 * Key rules:
 *  • r= uses single-char short codes (i,r,p,l,m,t,M,A,a,n)
 *  • fb= uses same single-char codes for fallback pool
 *  • Per-badge params use {1-char-code}_{suffix}: i_x, r_bl, p_al, etc.
 *  • source has NO v3 alias — always sent as 'source=fanart', never 'so=fanart'
 *  • Params equal to defaults are omitted to keep URLs short
 *  • posterBlur and grayscale ARE sent for direct API use (Plex/Jellyfin);
 *    PreviewCanvas applies them client-side via CSS for instant preview
 */
export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  
  // ALWAYS enforce /poster/ and prioritize imdbId. 
  const displayId = config.imdbId || '{imdb_id}';
  const pathSegment = `/poster/${displayId}`;
  
  const p = new URLSearchParams();

  // Version flag — tells backend to use V3 parser
  p.set('v', '3');

  // ── Ratings: single-char codes e.g. r=i,r,p ──────────────────────────
  if (config.ratings.length > 0) {
    p.set('r', config.ratings.map(r => V3_KEY_TO_CODE[r] ?? r).join(','));
  }

  // ── Fallback pool: single-char codes e.g. fb=t,l ─────────────────────
  if (config.fallbackEnabled && config.fallbackPool.length > 0) {
    p.set('fb', config.fallbackPool.map(r => V3_KEY_TO_CODE[r] ?? r).join(','));
  }

  // ── Source — CRITICAL: NO v3 alias. Backend reads only 'source' directly.
  if (config.source && config.source !== 'tmdb') p.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);

  // User API key overrides
  if (config.keys?.tmdb)    p.set('tmdb_key',    config.keys.tmdb);
  if (config.keys?.fanart)  p.set('fanart_key',  config.keys.fanart);
  if (config.keys?.omdb)    p.set('omdb_key',    config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  // ── Global badge style — V3 short aliases ──────────────────────────────
  if (config.blur   !== DEFAULTS.blur)   p.set('bl', config.blur.toString());
  if (config.alpha  !== DEFAULTS.alpha)  p.set('al', config.alpha.toString());
  if (config.radius !== DEFAULTS.radius) p.set('ra', config.radius.toString());
  if (config.shadow !== DEFAULTS.shadow) p.set('sh', config.shadow.toString());

  const globalScale = config.scale ?? 1.0;
  if (globalScale !== DEFAULTS.scale) p.set('sc', globalScale.toFixed(3));

  // bw = border-width (NOT grayscale — that's gs)
  if ((config.borderW ?? 0) > 0) p.set('bw', config.borderW!.toString());
  if (config.borderC)  p.set('bc', config.borderC);
  if (config.bg)       p.set('bg', config.bg);
  if (config.txt)      p.set('tx', config.txt);
  if (config.icon === false) p.set('ic', '0');

  // Poster effects
  if (config.posterBlur > DEFAULTS.posterBlur) p.set('pb', config.posterBlur.toString());
  if (config.grayscale) p.set('gs', '1');

  // Layout / preset
  if (config.layout !== 'custom') p.set('l', config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  // ── Display preset (p=b default → omit; p=m/n → emit) ──────────
  if (config.uiPreset && config.uiPreset !== 'b') p.set('p', config.uiPreset);

  // ── No-text / show-text toggle (nt=1 hides rating text) ──────────────
  if (config.showText === false) p.set('nt', '1');

  // ── Score display ─────────────────────────────────────────────────────
  if (config.normalize) p.set('nm', '1');
  if (config.outOf !== undefined && config.outOf > 0) p.set('of', config.outOf.toString());

  // ── Icon type alt variant (it=1 default → omit) ───────────────────────
  if ((config.iconType ?? DEFAULTS.iconType) > DEFAULTS.iconType)
    p.set('it', config.iconType!.toString());

  // ── Labels ───────────────────────────────────────────────────────────
  if (config.labelPos)  p.set('lp', config.labelPos);
  if (config.labelText) p.set('lt', config.labelText);
  if (config.labelSize !== undefined && config.labelSize !== DEFAULTS.labelSize)
    p.set('ls', config.labelSize.toString());
  if (config.labelColor) p.set('lc', config.labelColor);

  // ── Per-badge overrides — format: {1-char-code}_{v3-suffix} ──────────
  config.ratings.forEach((key: RatingType, index: number) => {
    const item = config.items[key] || {};
    const code = V3_KEY_TO_CODE[key];
    if (!code) return;

    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    const finalX = item.x !== undefined ? item.x : autoPos.x;
    const finalY = item.y !== undefined ? item.y : autoPos.y;

    p.set(`${code}_x`, Math.round(finalX).toString());
    p.set(`${code}_y`, Math.round(finalY).toString());

    if (item.bg  !== undefined && item.bg  !== (config.bg  ?? '')) p.set(`${code}_bg`, item.bg);
    if (item.txt !== undefined && item.txt !== (config.txt ?? '')) p.set(`${code}_tx`, item.txt);

    const eff = (itemVal: any, globalVal: any): boolean =>
      itemVal !== undefined && itemVal !== globalVal;

    if (eff(item.blur,   config.blur))   p.set(`${code}_bl`, item.blur!.toString());
    if (eff(item.alpha,  config.alpha))  p.set(`${code}_al`, item.alpha!.toString());
    if (eff(item.radius, config.radius)) p.set(`${code}_ra`, item.radius!.toString());
    if (eff(item.shadow, config.shadow)) p.set(`${code}_sh`, item.shadow!.toString());

    const itemIcon = item.icon ?? config.icon ?? true;
    if (itemIcon !== (config.icon ?? true)) p.set(`${code}_ic`, itemIcon ? '1' : '0');

    if (item.scale !== undefined && item.scale !== (config.scale ?? 1.0))
      p.set(`${code}_sc`, item.scale.toFixed(3));

    if ((item.borderW ?? 0) > 0 && (item.borderW ?? 0) !== (config.borderW ?? 0))
      p.set(`${code}_bw`, item.borderW!.toString());
    if (item.borderC !== undefined && item.borderC !== (config.borderC ?? '#ffffff'))
      p.set(`${code}_bc`, item.borderC);

    // Per-badge show-text override
    if (item.showText === false && config.showText !== false)
      p.set(`${code}_nt`, '1');

    // Per-badge score display
    if (item.normalize !== undefined && item.normalize !== (config.normalize ?? false))
      p.set(`${code}_nm`, item.normalize ? '1' : '0');
    if (item.outOf !== undefined && item.outOf > 0 && item.outOf !== (config.outOf ?? 0))
      p.set(`${code}_of`, item.outOf.toString());

    // Per-badge icon type
    if (item.iconType !== undefined && item.iconType !== (config.iconType ?? DEFAULTS.iconType))
      p.set(`${code}_it`, item.iconType.toString());

    // Per-badge labels
    if (item.labelPos !== undefined && item.labelPos !== config.labelPos)
      p.set(`${code}_lp`, item.labelPos);
    if (item.labelText !== undefined && item.labelText !== config.labelText)
      p.set(`${code}_lt`, item.labelText);
    if (item.labelSize !== undefined && item.labelSize !== (config.labelSize ?? DEFAULTS.labelSize))
      p.set(`${code}_ls`, item.labelSize.toString());
    if (item.labelColor !== undefined && item.labelColor !== config.labelColor)
      p.set(`${code}_lc`, item.labelColor);
  });

  // ── Logo overlay ──────────────────────────────────────────────────────
  if (config.logo) {
    p.set('logo', '1');
    if (config.logoSource) p.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined) p.set('logo_x', config.logoX.toString());
    if (config.logoY       !== DEFAULTS.logoY)       p.set('logo_y',       config.logoY.toString());
    if (config.logoW       !== DEFAULTS.logoW)       p.set('logo_w',       config.logoW.toString());
    if (config.logoH       !== DEFAULTS.logoH)       p.set('logo_h',       config.logoH.toString());
    if (config.logoOpacity !== DEFAULTS.logoOpacity) p.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow  !== DEFAULTS.logoShadow)  p.set('logo_sh',      config.logoShadow.toString());
  }

  const queryString = p.toString();
  return `${cleanBase}${pathSegment}.${config.extension}${queryString ? '?' + queryString : ''}`;
};

// ── URL parser (handles both V2 and V3) ──────────────────────────────────

/**
 * Parse an API URL (V2 or V3) into a PosterConfig.
 * Used by the builder's "Load URL" feature.
 */
export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(
      /\/(movie|tv|anime|poster)\/([^.]+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/
    );

    const mediaType: MediaType = match && ['movie', 'tv', 'anime'].includes(match[1]) 
      ? (match[1] as MediaType) 
      : DEFAULT_CONFIG.mediaType;
      
    let tmdbId = DEFAULT_CONFIG.tmdbId;
    let imdbId: string | undefined = undefined;

    if (match && match[2]) {
      const id = match[2].replace('%7B', '{').replace('%7D', '}');
      if (id.startsWith('tt')) {
        imdbId = id;
        tmdbId = '';
      } else if (id !== '{imdb_id}') {
        tmdbId = id;
      }
    }

    const extension: ExtensionType =
      match && match[3] ? ((match[3] === 'jpeg' ? 'jpg' : match[3]) as ExtensionType) : 'svg';

    const p = url.searchParams;
    const isV3 = p.get('v') === '3';

    const keys: ApiKeys = {};
    if (p.has('tmdb_key'))    keys.tmdb    = p.get('tmdb_key')!;
    if (p.has('fanart_key'))  keys.fanart  = p.get('fanart_key')!;
    if (p.has('omdb_key'))    keys.omdb    = p.get('omdb_key')!;
    if (p.has('mdblist_key')) keys.mdblist = p.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};

    if (isV3) {
      // ── Parse V3 per-badge params ──────────────────────────────────────
      for (const [name, value] of p.entries()) {
        if (name.length < 3 || name[1] !== '_') continue;
        const code     = name[0];
        const badgeKey = V3_CODE_TO_KEY[code];
        if (!badgeKey) continue;
        const suffix = name.slice(2);

        if (!items[badgeKey]) items[badgeKey] = {};
        switch (suffix) {
          case 'x':   items[badgeKey].x         = parseInt(value);                                   break;
          case 'y':   items[badgeKey].y         = parseInt(value);                                   break;
          case 'bl':  items[badgeKey].blur       = parseInt(value);                                   break;
          case 'al':  items[badgeKey].alpha      = parseFloat(value);                                 break;
          case 'ra':  items[badgeKey].radius     = parseInt(value);                                   break;
          case 'sh':  items[badgeKey].shadow     = parseInt(value);                                   break;
          case 'ic':  items[badgeKey].icon       = value === '1';                                     break;
          case 'sc':  items[badgeKey].scale      = parseFloat(value);                                 break;
          case 'bw':  items[badgeKey].borderW    = parseInt(value);                                   break;
          case 'bc':  items[badgeKey].borderC    = value.startsWith('#') ? value : `#${value}`;      break;
          case 'bg':  items[badgeKey].bg         = value;                                             break;
          case 'tx':  items[badgeKey].txt        = value.startsWith('#') ? value : `#${value}`;      break;
          case 'nt':  items[badgeKey].showText   = value !== '1';                                     break;
          case 'nm':  items[badgeKey].normalize  = value === '1';                                     break;
          case 'of':  items[badgeKey].outOf      = parseInt(value);                                   break;
          case 'it':  items[badgeKey].iconType   = parseInt(value);                                   break;
          case 'lp':  items[badgeKey].labelPos   = value as BadgeConfig['labelPos'];                  break;
          case 'lt':  items[badgeKey].labelText  = value;                                             break;
          case 'ls':  items[badgeKey].labelSize  = parseInt(value);                                   break;
          case 'lc':  items[badgeKey].labelColor = value;                                             break;
        }
      }

      // ── Decode ratings from single-char codes ──────────────────────────
      const ratingCodes = p.has('r')
        ? p.get('r')!.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const parsedRatings = ratingCodes
        .map(c => V3_CODE_TO_KEY[c])
        .filter(Boolean) as RatingType[];

      // ── Decode fallback pool from single-char codes ────────────────────
      const fbCodes = p.has('fb')
        ? p.get('fb')!.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const fbPool = fbCodes.map(c => V3_CODE_TO_KEY[c]).filter(Boolean) as RatingType[];

      const logoSource = (['fanart', 'tmdb', 'metahub'] as const).includes(
        p.get('logo_source') as any
      ) ? (p.get('logo_source') as LogoSourceType) : null;

      const getNum   = (v3k: string, v2k: string, def: number)  => p.has(v3k) ? parseInt(p.get(v3k)!)    : (p.has(v2k) ? parseInt(p.get(v2k)!)    : def);
      const getFloat = (v3k: string, v2k: string, def: number)  => p.has(v3k) ? parseFloat(p.get(v3k)!) : (p.has(v2k) ? parseFloat(p.get(v2k)!) : def);

      // ── Parse outOf (of= or out_of=) ──────────────────────────────────
      const parseOutOf = (): number | undefined => {
        const raw = p.get('of') ?? p.get('out_of');
        if (!raw) return undefined;
        const v = parseInt(raw);
        return isNaN(v) ? undefined : v;
      };

      return {
        mediaType,
        tmdbId,
        imdbId,
        extension,
        ratings:        parsedRatings,
        fallbackEnabled: fbPool.length > 0,
        fallbackPool:   fbPool,
        source:   (p.get('source') as PosterConfig['source']) || 'tmdb',
        ptype:    p.get('pt')   || p.get('ptype') || 'auto',
        textless: p.get('tl')   === '1' || p.get('textless') === '1',
        theme:    'glass',
        size:     'md',
        blur:       getNum   ('bl', 'blur',    DEFAULTS.blur),
        alpha:      getFloat ('al', 'alpha',   DEFAULTS.alpha),
        radius:     getNum   ('ra', 'rad',     DEFAULTS.radius),
        shadow:     getNum   ('sh', 'sh',      DEFAULTS.shadow),
        layout:    (p.get('l')   as PosterConfig['layout'])  || 'custom',
        preset:    (p.get('pos') as PosterConfig['preset'])  || 'custom',
        posterBlur: getNum   ('pb', 'bg_blur', DEFAULTS.posterBlur),
        grayscale:  p.get('gs') === '1' || p.get('bw') === '1',
        scale:      getFloat ('sc', 'g_scale', DEFAULTS.scale),
        borderW: p.has('bw') && p.get('bw') !== '1' ? parseInt(p.get('bw')!) : DEFAULTS.borderW,
        borderC: p.has('bc') ? (p.get('bc')!.startsWith('#') ? p.get('bc')! : `#${p.get('bc')}`) : undefined,
        bg:      p.get('bg')  || undefined,
        txt:     p.has('tx')  ? (p.get('tx')!.startsWith('#') ? p.get('tx')! : `#${p.get('tx')}`) : undefined,
        icon:    p.has('ic')  ? p.get('ic') === '1' : true,
        showText: p.get('nt') !== '1',
        // ── NEW: display preset, score, icon type, labels ────────────────
        uiPreset:   ((() => {
          const preset = p.get('p');
          if (preset === 'm') return 'm';
          if (preset === 'n') return 'n';
          return 'b';
        })()) as PosterConfig['uiPreset'],
        normalize:  p.get('nm') === '1' || p.get('normalize') === '1',
        outOf:      parseOutOf(),
        iconType:   getNum('it', 'icon_type', DEFAULTS.iconType),
        labelPos:   (p.get('lp') || p.get('label_pos') || undefined) as PosterConfig['labelPos'],
        labelText:  p.get('lt') || p.get('label_text') || undefined,
        labelSize:  p.has('ls') ? parseInt(p.get('ls')!) : (p.has('label_size') ? parseInt(p.get('label_size')!) : undefined),
        labelColor: p.get('lc') || p.get('label_color') || undefined,
        // ────────────────────────────────────────────────────────────────
        keys,
        items,
        logo:         p.get('logo') === '1',
        logoSource,
        logoX:        p.has('logo_x')       ? parseInt(p.get('logo_x')!)          : null,
        logoY:        p.has('logo_y')        ? parseInt(p.get('logo_y')!)          : DEFAULTS.logoY,
        logoW:        p.has('logo_w')        ? parseInt(p.get('logo_w')!)          : DEFAULTS.logoW,
        logoH:        p.has('logo_h')        ? parseInt(p.get('logo_h')!)          : DEFAULTS.logoH,
        logoOpacity:  p.has('logo_opacity')  ? parseFloat(p.get('logo_opacity')!)  : DEFAULTS.logoOpacity,
        logoShadow:   p.has('logo_sh')       ? parseInt(p.get('logo_sh')!)         : DEFAULTS.logoShadow,
      };
    }

    // ── Parse V2 per-badge params (legacy long-form) ───────────────────────
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
      const nt    = p.get(`${key}_nt`);
      const nm    = p.get(`${key}_nm`);
      const of_   = p.get(`${key}_of`) ?? p.get(`${key}_out_of`);
      const it    = p.get(`${key}_it`) ?? p.get(`${key}_icon_type`);
      const lp    = p.get(`${key}_lp`) ?? p.get(`${key}_label_pos`);
      const lt    = p.get(`${key}_lt`) ?? p.get(`${key}_label_text`);
      const ls    = p.get(`${key}_ls`) ?? p.get(`${key}_label_size`);
      const lc    = p.get(`${key}_lc`) ?? p.get(`${key}_label_color`);

      if (x || y || bg || txt || blur || alpha || rad || sh || icon || scale || bw || nt || nm || lp) {
        items[key] = {
          ...(x     ? { x: parseInt(x) }                                               : {}),
          ...(y     ? { y: parseInt(y) }                                               : {}),
          ...(bg    ? { bg }                                                            : {}),
          ...(txt   ? { txt: txt.startsWith('#') ? txt : `#${txt}` }                  : {}),
          ...(blur  ? { blur: parseInt(blur) }                                         : {}),
          ...(alpha ? { alpha: parseFloat(alpha) }                                     : {}),
          ...(rad   ? { radius: parseInt(rad) }                                        : {}),
          ...(sh    ? { shadow: parseInt(sh) }                                         : {}),
          ...(icon  ? { icon: icon === '1' }                                           : {}),
          ...(scale ? { scale: parseFloat(scale) }                                     : {}),
          ...(bw    ? { borderW: parseInt(bw) }                                        : {}),
          ...(p.has(`${key}_bc`) ? { borderC: bc!.startsWith('#') ? bc! : `#${bc}` }  : {}),
          ...(nt    ? { showText: nt !== '1' }                                         : {}),
          ...(nm    ? { normalize: nm === '1' }                                        : {}),
          ...(of_   ? { outOf: parseInt(of_) }                                         : {}),
          ...(it    ? { iconType: parseInt(it) }                                       : {}),
          ...(lp    ? { labelPos: lp as BadgeConfig['labelPos'] }                      : {}),
          ...(lt    ? { labelText: lt }                                                : {}),
          ...(ls    ? { labelSize: parseInt(ls) }                                      : {}),
          ...(lc    ? { labelColor: lc }                                               : {}),
        };
      }
    });

    // V2 fallback pool (full names, comma-separated)
    const v2FbRaw = p.get('fb');
    const v2FbPool = v2FbRaw
      ? v2FbRaw.split(',').map(s => s.trim()).filter(k => ratingKeys.includes(k as RatingType)) as RatingType[]
      : [];

    const g_scale = p.get('g_scale');
    const g_bw    = p.get('g_bw');
    const g_bc    = p.get('g_bc');
    const g_bg    = p.get('g_bg');
    const g_txt   = p.get('g_txt');
    const g_icon  = p.get('g_icon');

    const grayscale = p.get('gs') === '1' || p.get('bw') === '1';

    const rawLogoSource = p.get('logo_source');
    const logoSource: LogoSourceType = (['fanart', 'tmdb', 'metahub'] as const).includes(
      rawLogoSource as any
    ) ? (rawLogoSource as LogoSourceType) : null;

    const v2OutOf = p.has('out_of') ? (parseInt(p.get('out_of')!) || undefined) : undefined;

    return {
      mediaType,
      tmdbId,
      imdbId,
      extension,
      ratings: p.has('r') ? (p.get('r')!.split(',') as RatingType[]) : [],
      fallbackEnabled: v2FbPool.length > 0,
      fallbackPool:    v2FbPool,
      source:   (p.get('source') as PosterConfig['source']) || 'tmdb',
      ptype:    p.get('ptype') || 'auto',
      textless: p.get('textless') === '1',
      theme:    'glass',
      size:     'md',
      shadow:   p.has('sh') ? parseInt(p.get('sh')!) : DEFAULTS.shadow,
      layout:  (p.get('l')   as PosterConfig['layout'])  || 'custom',
      preset:  (p.get('pos') as PosterConfig['preset'])  || 'custom',
      blur:       p.has('blur')    ? parseInt(p.get('blur')!)      : DEFAULTS.blur,
      alpha:      p.has('alpha')   ? parseFloat(p.get('alpha')!)   : DEFAULTS.alpha,
      radius:     p.has('rad')     ? parseInt(p.get('rad')!)       : DEFAULTS.radius,
      posterBlur: p.has('bg_blur') ? parseInt(p.get('bg_blur')!)   : DEFAULTS.posterBlur,
      grayscale,
      scale:      g_scale  ? parseFloat(g_scale)  : DEFAULTS.scale,
      borderW:    g_bw     ? parseInt(g_bw)        : DEFAULTS.borderW,
      borderC:    g_bc     ? (g_bc.startsWith('#') ? g_bc : `#${g_bc}`) : undefined,
      bg:         g_bg     || undefined,
      txt:        g_txt    ? (g_txt.startsWith('#') ? g_txt : `#${g_txt}`) : undefined,
      icon:       g_icon   ? g_icon === '1' : true,
      showText:   p.get('nt') !== '1',
      uiPreset:   ((() => {
        const legacyPreset = p.get('preset');
        if (legacyPreset === 'minimal') return 'm';
        if (legacyPreset === 'no-badges') return 'n';
        return 'b';
      })()) as PosterConfig['uiPreset'],
      normalize:  p.get('normalize') === '1',
      outOf:      v2OutOf,
      iconType:   p.has('icon_type') ? parseInt(p.get('icon_type')!) : DEFAULTS.iconType,
      labelPos:   (p.get('label_pos') || undefined) as PosterConfig['labelPos'],
      labelText:  p.get('label_text') || undefined,
      labelSize:  p.has('label_size') ? parseInt(p.get('label_size')!) : undefined,
      labelColor: p.get('label_color') || undefined,
      keys,
      items,
      logo:        p.get('logo') === '1',
      logoSource,
      logoX:       p.has('logo_x')       ? parseInt(p.get('logo_x')!)         : null,
      logoY:       p.has('logo_y')        ? parseInt(p.get('logo_y')!)         : DEFAULTS.logoY,
      logoW:       p.has('logo_w')        ? parseInt(p.get('logo_w')!)         : DEFAULTS.logoW,
      logoH:       p.has('logo_h')        ? parseInt(p.get('logo_h')!)         : DEFAULTS.logoH,
      logoOpacity: p.has('logo_opacity')  ? parseFloat(p.get('logo_opacity')!) : DEFAULTS.logoOpacity,
      logoShadow:  p.has('logo_sh')       ? parseInt(p.get('logo_sh')!)        : DEFAULTS.logoShadow,
    };
  } catch (e) {
    console.error('Failed to parse URL', e);
    return DEFAULT_CONFIG;
  }
};

// ── Template URL Helpers ──────────────────────────────────────────────────

export const isTemplateUrl = (url: string): boolean =>
  url.includes('{imdb_id}') || url.includes('{tmdb_id}');

export const toTemplateUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(
      /(\/(?:movie|tv|anime)\/)[^.]+(\.[a-z]+)$/i,
      '$1{imdb_id}$2'
    );
    return urlObj.toString();
  } catch (e) {
    console.error('Failed to convert to template URL', e);
    return url;
  }
};

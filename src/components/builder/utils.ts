// src/components/builder/utils.ts
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
  ALL_BADGES
} from './types';
import { buildOptimalUrl } from '../../utils/v3Builder';

// @ts-ignore
const envApiUrl = import.meta.env?.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.spicydevs.xyz';

export const PROVIDER_SHORT: Record<RatingType, string> = {
  imdb: 'i',
  rt: 'r',
  rt_popcorn: 'p',
  letterboxd: 'l',
  meta: 'm',
  tmdb: 't',
  mal: 'M',
  anilist: 'A',
  age: 'a',
  runtime: 'n',
};

export const SHORT_PROVIDER: Record<string, RatingType> = Object.fromEntries(
  Object.entries(PROVIDER_SHORT).map(([k, v]) => [v, k as RatingType])
);

export function cleanValue(val: string): string {
  if (!val) return val;
  if (val.endsWith('%')) {
    const num = val.slice(0, -1);
    if (!isNaN(Number(num))) return parseFloat(num).toString() + '%';
    return val;
  }
  if (!isNaN(Number(val)) && val.trim() !== '') return parseFloat(val).toString();
  return val;
}

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

export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  return buildOptimalUrl(config, baseUrl);
};

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url   = new URL(urlString);
    const match = url.pathname.match(
      /\/(movie|tv|anime)\/([a-zA-Z0-9_-]+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/
    );

    const mediaType: MediaType = match
      ? (match[1] as MediaType)
      : DEFAULT_CONFIG.mediaType;
    const tmdbId = match ? match[2] : DEFAULT_CONFIG.imdbId;
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
      const getCol = (long: string, short: string) => {
        const v = p.get(long) || p.get(short);
        return v ? (v.startsWith('#') ? v : `#${v}`) : undefined;
      };

      const parsedRatings = p.has('r') ? p.get('r')!.split(',').map(r => SHORT_PROVIDER[r] || r) as RatingType[] : [];

      for (const [name, value] of p.entries()) {
        const splitIdx = name.indexOf('_');
        if (splitIdx === -1) continue;
        const prefix = name.slice(0, splitIdx);
        const suffix = name.slice(splitIdx + 1);

        let badgeKey: RatingType | undefined;
        if (SHORT_PROVIDER[prefix]) badgeKey = SHORT_PROVIDER[prefix];
        else if (ALL_BADGES.some(b => b.id === prefix)) badgeKey = prefix as RatingType;
        if (!badgeKey) continue;

        if (!items[badgeKey]) items[badgeKey] = {};
        
        if (suffix === 'x') items[badgeKey].x = parseInt(value);
        else if (suffix === 'y') items[badgeKey].y = parseInt(value);
        else if (suffix === 'bl' || suffix === 'blur') items[badgeKey].blur = parseInt(value);
        else if (suffix === 'al' || suffix === 'alpha') items[badgeKey].alpha = parseFloat(value);
        else if (suffix === 'ra' || suffix === 'rad') items[badgeKey].radius = parseInt(value);
        else if (suffix === 'sh') items[badgeKey].shadow = parseInt(value);
        else if (suffix === 'ic' || suffix === 'icon') items[badgeKey].icon = value === '1';
        else if (suffix === 'sc' || suffix === 'scale') items[badgeKey].scale = parseFloat(value);
        else if (suffix === 'bw') items[badgeKey].borderW = parseInt(value);
        else if (suffix === 'bc') items[badgeKey].borderC = value.startsWith('#') ? value : `#${value}`;
        else if (suffix === 'bg') items[badgeKey].bg = value.startsWith('#') ? value : `#${value}`;
        else if (suffix === 'tx' || suffix === 'txt') items[badgeKey].txt = value.startsWith('#') ? value : `#${value}`;
        else if (suffix === 'nm') items[badgeKey].normalize = value === '1';
        else if (suffix === 'of') items[badgeKey].outOf = parseInt(value);
        else if (suffix === 'it') items[badgeKey].iconType = parseInt(value);
        else if (suffix === 'lp') items[badgeKey].labelPos = value as any;
        else if (suffix === 'lt') items[badgeKey].labelText = value;
        else if (suffix === 'ls') items[badgeKey].labelSize = parseInt(value);
        else if (suffix === 'lc') items[badgeKey].labelColor = value.startsWith('#') ? value : `#${value}`;
        else if (suffix === 'nt') items[badgeKey].showText = value === '0';
      }

      const logoSource = (['fanart', 'tmdb', 'metahub'].includes(p.get('ls') || p.get('logo_source') || ''))
        ? (p.get('ls') || p.get('logo_source') as LogoSourceType) : null;

      return {
        mediaType, tmdbId, extension,
        ratings:     parsedRatings,
        source:      (p.get('source') as PosterConfig['source']) || (p.get('so') as PosterConfig['source']) || 'tmdb',
        ptype:       p.get('ptype') || p.get('pt') || 'auto',
        textless:    p.get('textless') === '1' || p.get('tl') === '1',
        theme:       'glass', size: 'md',
        shadow:      p.has('shadow') ? parseInt(p.get('shadow')!) : p.has('sh') ? parseInt(p.get('sh')!) : DEFAULTS.shadow,
        layout:      (p.get('layout') as PosterConfig['layout']) || (p.get('l') as PosterConfig['layout']) || 'custom',
        preset:      (p.get('preset') as PosterConfig['preset']) || (p.get('pos') as PosterConfig['preset']) || 'custom',
        blur:        p.has('blur') ? parseInt(p.get('blur')!) : p.has('bl') ? parseInt(p.get('bl')!) : DEFAULTS.blur,
        alpha:       p.has('alpha') ? parseFloat(p.get('alpha')!) : p.has('al') ? parseFloat(p.get('al')!) : DEFAULTS.alpha,
        radius:      p.has('radius') ? parseInt(p.get('radius')!) : p.has('ra') ? parseInt(p.get('ra')!) : DEFAULTS.radius,
        posterBlur:  p.has('bg_blur') ? parseInt(p.get('bg_blur')!) : p.has('pb') ? parseInt(p.get('pb')!) : DEFAULTS.posterBlur,
        grayscale:   p.get('gs') === '1' || p.get('bw') === '1',
        scale:       p.has('g_scale') ? parseFloat(p.get('g_scale')!) : p.has('sc') ? parseFloat(p.get('sc')!) : DEFAULTS.scale,
        borderW:     p.has('g_bw') ? parseInt(p.get('g_bw')!) : p.has('bw') ? parseInt(p.get('bw')!) : DEFAULTS.borderW,
        borderC:     getCol('g_bc', 'bc'),
        bg:          getCol('g_bg', 'bg'),
        txt:         getCol('g_txt', 'tx'),
        icon:        p.has('g_icon') ? p.get('g_icon') === '1' : p.has('ic') ? p.get('ic') === '1' : true,
        normalize:   p.get('normalize') === '1' || p.get('nm') === '1',
        outOf:       p.has('out_of') ? parseInt(p.get('out_of')!) : p.has('of') ? parseInt(p.get('of')!) : undefined,
        iconType:    p.has('icon_type') ? parseInt(p.get('icon_type')!) : p.has('it') ? parseInt(p.get('it')!) : undefined,
        labelPos:    (p.get('label_pos') as any) || (p.get('lp') as any),
        labelText:   p.get('label_text') || p.get('lt') || undefined,
        labelSize:   p.has('label_size') ? parseInt(p.get('label_size')!) : p.has('ls') ? parseInt(p.get('ls')!) : undefined,
        labelColor:  getCol('label_color', 'lc'),
        uiPreset:    (p.get('preset') as any) || (p.get('p') as any) || undefined,
        keys, items,
        logo:        p.get('logo') === '1' || p.get('lo') === '1',
        logoSource,
        logoX:       p.has('logo_x') ? parseInt(p.get('logo_x')!) : p.has('lx') ? parseInt(p.get('lx')!) : null,
        logoY:       p.has('logo_y') ? parseInt(p.get('logo_y')!) : p.has('ly') ? parseInt(p.get('ly')!) : DEFAULTS.logoY,
        logoW:       p.has('logo_w') ? parseInt(p.get('logo_w')!) : p.has('lw') ? parseInt(p.get('lw')!) : DEFAULTS.logoW,
        logoH:       p.has('logo_h') ? parseInt(p.get('logo_h')!) : p.has('lh') ? parseInt(p.get('lh')!) : DEFAULTS.logoH,
        logoOpacity: p.has('logo_opacity') ? parseFloat(p.get('logo_opacity')!) : p.has('la') ? parseFloat(p.get('la')!) : DEFAULTS.logoOpacity,
        logoShadow:  p.has('logo_sh') ? parseInt(p.get('logo_sh')!) : p.has('lsh') ? parseInt(p.get('lsh')!) : DEFAULTS.logoShadow,
        fallbackEnabled: p.has('fb') && p.get('fb')!.length > 0 ? true : false,
        fallbackPool: p.has('fb') && p.get('fb')!.length > 0 ? p.get('fb')!.split(',').map(r => SHORT_PROVIDER[r] || r) as RatingType[] : [],
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
          ...(bg    ? { bg }                                                  : {}),
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
      fallbackEnabled: p.has('fallbackEnabled') ? p.get('fallbackEnabled') === '1' : false,
      fallbackPool: p.has('fallbackPool') ? p.get('fallbackPool')!.split(',') as RatingType[] : [],
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
  }
};
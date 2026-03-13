// src/utils.ts
import {
  PosterConfig,
  DEFAULT_CONFIG,
  RatingType,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
  GAP,
  PADDING,
  MediaType,
  ApiKeys,
  ExtensionType,
  LogoSourceType,
} from './types';

// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || 'https://api.spicydevs.xyz';

export const getScale = (size: string) => {
  return size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1.0;
};

export const calculateAutoPosition = (
  _ratingId: RatingType,
  index: number,
  totalBadges: number,
  config: PosterConfig
) => {
  const scale = getScale(config.size);
  const badgeW = BASE_BADGE_W * scale;
  const badgeH = BASE_BADGE_H * scale;
  const isRow = config.layout === 'row';

  const groupW = isRow ? totalBadges * badgeW + (totalBadges - 1) * GAP : badgeW;
  const groupH = isRow ? badgeH : totalBadges * badgeH + (totalBadges - 1) * GAP;

  let presetX = 0;
  let presetY = 0;

  if (config.preset.includes('l')) presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else presetX = (CANVAS_WIDTH - groupW) / 2;

  if (config.preset.includes('t')) presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else presetY = (CANVAS_HEIGHT - groupH) / 2;

  const x = isRow ? presetX + index * (badgeW + GAP) : presetX;
  const y = isRow ? presetY : presetY + index * (badgeH + GAP);

  return { x: Math.round(x), y: Math.round(y) };
};

export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/${config.mediaType}/${config.tmdbId}.${config.extension}`);
  const params = url.searchParams;

  if (config.ratings.length > 0) params.set('r', config.ratings.join(','));
  if (config.source !== 'tmdb') params.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) params.set('textless', '1');
  if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);

  if (config.keys?.tmdb) params.set('tmdb_key', config.keys.tmdb);
  if (config.keys?.fanart) params.set('fanart_key', config.keys.fanart);
  if (config.keys?.omdb) params.set('omdb_key', config.keys.omdb);
  if (config.keys?.mdblist) params.set('mdblist_key', config.keys.mdblist);

  params.set('v', '2');
  params.set('blur', config.blur.toString());
  params.set('alpha', config.alpha.toString());
  params.set('rad', config.radius.toString());
  params.set('sh', config.shadow.toString());

  if (config.posterBlur > 0) params.set('bg_blur', config.posterBlur.toString());
  if (config.grayscale) params.set('bw', '1');

  if (config.layout !== 'custom') params.set('l', config.layout);
  if (config.preset !== 'custom') params.set('pos', config.preset);

  const sizeScale = getScale(config.size);
  const effectiveGlobalScale = sizeScale * (config.scale !== undefined ? config.scale : 1.0);
  params.set('g_scale', effectiveGlobalScale.toFixed(3));

  if (config.borderW !== undefined && config.borderW > 0)
    params.set('g_bw', config.borderW.toString());
  if (config.borderC) params.set('g_bc', config.borderC);
  if (config.bg) params.set('g_bg', config.bg);
  if (config.txt) params.set('g_txt', config.txt);

  params.set('g_icon', config.icon !== false ? '1' : '0');

  config.ratings.forEach((key: RatingType, index: number) => {
    const item = config.items[key] || {};
    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    const finalX = item.x !== undefined ? item.x : autoPos.x;
    const finalY = item.y !== undefined ? item.y : autoPos.y;

    params.set(`${key}_x`, Math.round(finalX).toString());
    params.set(`${key}_y`, Math.round(finalY).toString());

    if (item.bg) params.set(`${key}_bg`, item.bg);
    if (item.txt) params.set(`${key}_txt`, item.txt);

    if (item.blur !== undefined) params.set(`${key}_blur`, item.blur.toString());
    if (item.alpha !== undefined) params.set(`${key}_alpha`, item.alpha.toString());
    if (item.radius !== undefined) params.set(`${key}_rad`, item.radius.toString());
    if (item.shadow !== undefined) params.set(`${key}_sh`, item.shadow.toString());

    const finalIcon = item.icon ?? config.icon ?? true;
    params.set(`${key}_icon`, finalIcon ? '1' : '0');

    if (item.scale !== undefined) {
      const resolvedScale = item.scale * sizeScale;
      params.set(`${key}_scale`, resolvedScale.toFixed(3));
    }

    if (item.borderW !== undefined) params.set(`${key}_bw`, item.borderW.toString());
    if (item.borderC !== undefined) params.set(`${key}_bc`, item.borderC);
  });

  // ── Logo overlay params ────────────────────────────────────────────────────
  // Only emitted when logo is enabled — backend default is off.
  if (config.logo) {
    params.set('logo', '1');
    if (config.logoSource) params.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined)
      params.set('logo_x', config.logoX.toString());
    // Always emit y/w/h so backend doesn't fall back to defaults when values
    // differ from its hardcoded defaults (630 / 380 / 100).
    params.set('logo_y', config.logoY.toString());
    params.set('logo_w', config.logoW.toString());
    params.set('logo_h', config.logoH.toString());
    if (config.logoOpacity !== 1.0) params.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow !== 6) params.set('logo_sh', config.logoShadow.toString());
  }

  return url.toString();
};

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(/\/(movie|tv|anime)\/(\w+)(?:\.(jpg|jpeg|png|svg|webp))?$/);

    const mediaType = match ? (match[1] as MediaType) : DEFAULT_CONFIG.mediaType;
    const tmdbId = match ? match[2] : DEFAULT_CONFIG.tmdbId;
    const extension: ExtensionType =
      match && match[3] ? ((match[3] === 'jpeg' ? 'jpg' : match[3]) as ExtensionType) : 'svg';

    const params = url.searchParams;

    const keys: ApiKeys = {};
    if (params.has('tmdb_key')) keys.tmdb = params.get('tmdb_key')!;
    if (params.has('fanart_key')) keys.fanart = params.get('fanart_key')!;
    if (params.has('omdb_key')) keys.omdb = params.get('omdb_key')!;
    if (params.has('mdblist_key')) keys.mdblist = params.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};
    const ratingKeys: RatingType[] = [
      'imdb',
      'rt',
      'rt_popcorn',
      'letterboxd',
      'meta',
      'tmdb',
      'mal',
      'anilist',
      'age',
      'runtime',
    ];

    ratingKeys.forEach((key) => {
      const x = params.get(`${key}_x`);
      const y = params.get(`${key}_y`);
      const bg = params.get(`${key}_bg`);
      const txt = params.get(`${key}_txt`);
      const blur = params.get(`${key}_blur`);
      const alpha = params.get(`${key}_alpha`);
      const rad = params.get(`${key}_rad`);
      const sh = params.get(`${key}_sh`);
      const icon = params.get(`${key}_icon`);
      const scale = params.get(`${key}_scale`);
      const bw = params.get(`${key}_bw`);
      const bc = params.get(`${key}_bc`);

      if (x || y || bg || txt || blur || alpha || rad || sh || icon || scale || bw) {
        items[key] = {
          ...(x ? { x: parseInt(x) } : {}),
          ...(y ? { y: parseInt(y) } : {}),
          ...(bg ? { bg } : {}),
          ...(txt ? { txt: txt.startsWith('#') ? txt : `#${txt}` } : {}),
          ...(blur ? { blur: parseInt(blur) } : {}),
          ...(alpha ? { alpha: parseFloat(alpha) } : {}),
          ...(rad ? { radius: parseInt(rad) } : {}),
          ...(sh ? { shadow: parseInt(sh) } : {}),
          ...(icon ? { icon: icon === '1' } : {}),
          ...(scale ? { scale: parseFloat(scale) } : {}),
          ...(bw ? { borderW: parseInt(bw) } : {}),
          ...(bc ? { borderC: bc.startsWith('#') ? bc : `#${bc}` } : {}),
        };
      }
    });

    const g_scale = params.get('g_scale');
    const g_bw = params.get('g_bw');
    const g_bc = params.get('g_bc');
    const g_bg = params.get('g_bg');
    const g_txt = params.get('g_txt');
    const g_icon = params.get('g_icon');

    // ── Logo params ────────────────────────────────────────────────────────
    const rawLogoSource = params.get('logo_source');
    const VALID_LOGO_SOURCES: LogoSourceType[] = ['fanart', 'tmdb', 'metahub'];
    const logoSource: LogoSourceType = VALID_LOGO_SOURCES.includes(rawLogoSource as LogoSourceType)
      ? (rawLogoSource as LogoSourceType)
      : null;

    return {
      mediaType,
      tmdbId,
      extension,
      ratings: params.has('r') ? (params.get('r')?.split(',') as RatingType[]) : [],
      source: (params.get('source') as PosterConfig['source']) || 'tmdb',
      ptype: params.get('ptype') || 'auto',
      textless: params.get('textless') === '1',
      theme: 'glass',
      size: 'md',
      shadow: params.has('sh') ? parseInt(params.get('sh')!) : 6,
      layout: (params.get('l') as PosterConfig['layout']) || 'custom',
      preset: (params.get('pos') as PosterConfig['preset']) || 'custom',
      blur: params.has('blur') ? parseInt(params.get('blur')!) : 8,
      alpha: params.has('alpha') ? parseFloat(params.get('alpha')!) : 0.4,
      radius: params.has('rad') ? parseInt(params.get('rad')!) : 12,
      posterBlur: params.has('bg_blur') ? parseInt(params.get('bg_blur')!) : 0,
      grayscale: params.get('bw') === '1',
      scale: g_scale ? parseFloat(g_scale) : 1.0,
      borderW: g_bw ? parseInt(g_bw) : 0,
      borderC: g_bc ? (g_bc.startsWith('#') ? g_bc : `#${g_bc}`) : undefined,
      bg: g_bg || undefined,
      txt: g_txt ? (g_txt.startsWith('#') ? g_txt : `#${g_txt}`) : undefined,
      icon: g_icon ? g_icon === '1' : true,
      keys,
      items,

      // Logo
      logo: params.get('logo') === '1',
      logoSource,
      logoX: params.has('logo_x') ? parseInt(params.get('logo_x')!) : null,
      logoY: params.has('logo_y') ? parseInt(params.get('logo_y')!) : 630,
      logoW: params.has('logo_w') ? parseInt(params.get('logo_w')!) : 380,
      logoH: params.has('logo_h') ? parseInt(params.get('logo_h')!) : 100,
      logoOpacity: params.has('logo_opacity') ? parseFloat(params.get('logo_opacity')!) : 1.0,
      logoShadow: params.has('logo_sh') ? parseInt(params.get('logo_sh')!) : 6,
    };
  } catch (e) {
    console.error('Failed to parse URL', e);
    return DEFAULT_CONFIG;
  }
};

// src/builder/utils.ts
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

/**
 * Generate the API URL for a given poster config.
 *
 * Uses V2 (verbose) parameter names for maximum human readability.
 * The backend accepts both V2 and V3; V2 is the default.
 *
 * BLUR NOTE:
 *   The frontend renders CSS `backdrop-filter: blur(Xpx)`.
 *   The backend SVG uses feGaussianBlur with stdDeviation = X * 0.5.
 *   We send the raw `X` value — the backend performs the conversion internally.
 *   Do NOT pre-divide here; that would cause double-conversion.
 *
 * SCALE NOTE:
 *   `config.scale` is the global canvas scale multiplier (from PropertyPanel).
 *   `getScale(config.size)` is the size-tier multiplier (sm/md/lg).
 *   Per-badge `item.scale` is a badge-level override, independent of size tier.
 *
 *   Global effective scale = getScale(size) * config.scale → sent as `scale`
 *   Per-badge scale = item.scale only (NOT multiplied by size scale here).
 *   The backend multiplies g_scale × per-badge scale internally to get final scale.
 *
 *   Previously, the frontend sent `item.scale * sizeScale` which double-applied
 *   the size multiplier (it was already encoded in g_scale).
 */
export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/${config.mediaType}/${config.tmdbId}.${config.extension}`);
  const params = url.searchParams;

  // ── Version marker (V2 = verbose) ─────────────────────────────────────
  // No v= param needed for V2 — it is the default. Omitting it keeps URLs clean.
  // (Add params.set('v', '2') if explicit versioning is ever required.)

  // ── Media / ratings ───────────────────────────────────────────────────
  if (config.ratings.length > 0) params.set('r', config.ratings.join(','));
  if (config.source !== 'tmdb') params.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) params.set('textless', '1');
  if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);

  // ── API keys ──────────────────────────────────────────────────────────
  if (config.keys?.tmdb)    params.set('tmdb_key',    config.keys.tmdb);
  if (config.keys?.fanart)  params.set('fanart_key',  config.keys.fanart);
  if (config.keys?.omdb)    params.set('omdb_key',    config.keys.omdb);
  if (config.keys?.mdblist) params.set('mdblist_key', config.keys.mdblist);

  // ── Global badge defaults (V2 verbose names) ──────────────────────────
  params.set('blur',         config.blur.toString());
  params.set('alpha',        config.alpha.toString());
  params.set('radius',       config.radius.toString());
  params.set('shadow',       config.shadow.toString());

  if (config.posterBlur > 0)  params.set('poster_blur', config.posterBlur.toString());
  if (config.grayscale)       params.set('grayscale',   '1');
  if (config.layout !== 'custom')  params.set('l',   config.layout);
  if (config.preset !== 'custom')  params.set('pos', config.preset);

  // ── Global scale ──────────────────────────────────────────────────────
  // Combines the size-tier factor with any explicit global scale override.
  const sizeScale            = getScale(config.size);
  const effectiveGlobalScale = sizeScale * (config.scale !== undefined ? config.scale : 1.0);
  params.set('scale', effectiveGlobalScale.toFixed(3));

  if (config.borderW !== undefined && config.borderW > 0)
    params.set('border_width', config.borderW.toString());
  if (config.borderC)   params.set('border_color', config.borderC);
  if (config.bg)        params.set('background',   config.bg);
  if (config.txt)       params.set('text_color',   config.txt);

  params.set('show_icon', config.icon !== false ? '1' : '0');

  // ── Per-badge overrides (V2 verbose names) ────────────────────────────
  config.ratings.forEach((key: RatingType, index: number) => {
    const item    = config.items[key] || {};
    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    const finalX  = item.x !== undefined ? item.x : autoPos.x;
    const finalY  = item.y !== undefined ? item.y : autoPos.y;

    params.set(`${key}_x`, Math.round(finalX).toString());
    params.set(`${key}_y`, Math.round(finalY).toString());

    if (item.bg)    params.set(`${key}_background`,   item.bg);
    if (item.txt)   params.set(`${key}_text_color`,   item.txt);

    if (item.blur    !== undefined) params.set(`${key}_blur`,         item.blur.toString());
    if (item.alpha   !== undefined) params.set(`${key}_alpha`,        item.alpha.toString());
    if (item.radius  !== undefined) params.set(`${key}_radius`,       item.radius.toString());
    if (item.shadow  !== undefined) params.set(`${key}_shadow`,       item.shadow.toString());
    if (item.borderW !== undefined) params.set(`${key}_border_width`, item.borderW.toString());
    if (item.borderC !== undefined) params.set(`${key}_border_color`, item.borderC);

    const finalIcon = item.icon ?? config.icon ?? true;
    params.set(`${key}_show_icon`, finalIcon ? '1' : '0');

    // Per-badge scale: send item.scale ONLY (NOT multiplied by sizeScale).
    // The backend multiplies g_scale (which already includes sizeScale) by the
    // per-badge scale override to get the final rendered scale.
    if (item.scale !== undefined) {
      params.set(`${key}_scale`, item.scale.toFixed(3));
    }
  });

  // ── Logo overlay (V2 verbose names) ──────────────────────────────────
  if (config.logo) {
    params.set('logo', '1');
    if (config.logoSource) params.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined)
      params.set('logo_x', config.logoX.toString());
    params.set('logo_y',      config.logoY.toString());
    params.set('logo_width',  config.logoW.toString());
    params.set('logo_height', config.logoH.toString());
    if (config.logoOpacity !== 1.0)
      params.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow !== 6)
      params.set('logo_shadow', config.logoShadow.toString());
  }

  return url.toString();
};

/**
 * Parse a full API URL back into a PosterConfig.
 * Supports both V2 verbose params and legacy short params for backwards compat.
 */
export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(/\/(movie|tv|anime)\/(\w+)(?:\.(jpg|jpeg|png|svg|webp))?$/);

    const mediaType = match ? (match[1] as MediaType) : DEFAULT_CONFIG.mediaType;
    const tmdbId    = match ? match[2] : DEFAULT_CONFIG.tmdbId;
    const extension: ExtensionType =
      match && match[3] ? ((match[3] === 'jpeg' ? 'jpg' : match[3]) as ExtensionType) : 'svg';

    const p = url.searchParams;

    // Helper: try V2 verbose name first, then V3/legacy short name
    const get  = (v2: string, v3?: string) => p.get(v2) ?? (v3 ? p.get(v3) : null);
    const has  = (v2: string, v3?: string) => p.has(v2) || (v3 ? p.has(v3) : false);
    const getN = (v2: string, v3?: string, fallback = 0) => {
      const raw = get(v2, v3);
      return raw !== null ? parseFloat(raw) : fallback;
    };

    const keys: ApiKeys = {};
    if (p.has('tmdb_key'))    keys.tmdb    = p.get('tmdb_key')!;
    if (p.has('fanart_key'))  keys.fanart  = p.get('fanart_key')!;
    if (p.has('omdb_key'))    keys.omdb    = p.get('omdb_key')!;
    if (p.has('mdblist_key')) keys.mdblist = p.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};
    const ratingKeys: RatingType[] = [
      'imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta',
      'tmdb', 'mal', 'anilist', 'age', 'runtime',
    ];

    ratingKeys.forEach((key) => {
      const v2 = (s: string) => `${key}_${s}`;
      const v3 = (s: string) => `${key}_${s}`;

      const xRaw  = get(v2('x'));
      const yRaw  = get(v2('y'));
      const bgRaw = get(v2('background'), v3('bg'));
      const tcRaw = get(v2('text_color'), v3('tc'));
      const blRaw = get(v2('blur'),       v3('b'));
      const alRaw = get(v2('alpha'),      v3('a'));
      const raRaw = get(v2('radius'),     v3('r'));
      const shRaw = get(v2('shadow'),     v3('sh'));
      const icRaw = get(v2('show_icon'),  v3('ic'));
      const scRaw = get(v2('scale'),      v3('sc'));
      const bwRaw = get(v2('border_width'), v3('bw'));
      const bcRaw = get(v2('border_color'), v3('bc'));

      if (xRaw || yRaw || bgRaw || tcRaw || blRaw || alRaw || raRaw || shRaw || icRaw || scRaw || bwRaw) {
        items[key] = {
          ...(xRaw  ? { x:       parseInt(xRaw) }     : {}),
          ...(yRaw  ? { y:       parseInt(yRaw) }     : {}),
          ...(bgRaw ? { bg:      bgRaw }               : {}),
          ...(tcRaw ? { txt:     tcRaw.startsWith('#') ? tcRaw : `#${tcRaw}` } : {}),
          ...(blRaw ? { blur:    parseInt(blRaw) }     : {}),
          ...(alRaw ? { alpha:   parseFloat(alRaw) }  : {}),
          ...(raRaw ? { radius:  parseInt(raRaw) }     : {}),
          ...(shRaw ? { shadow:  parseInt(shRaw) }     : {}),
          ...(icRaw ? { icon:    icRaw === '1' }        : {}),
          ...(scRaw ? { scale:   parseFloat(scRaw) }  : {}),
          ...(bwRaw ? { borderW: parseInt(bwRaw) }     : {}),
          ...(bcRaw ? { borderC: bcRaw.startsWith('#') ? bcRaw : `#${bcRaw}` } : {}),
        };
      }
    });

    // ── Logo params ─────────────────────────────────────────────────────
    const VALID_LOGO_SOURCES: LogoSourceType[] = ['fanart', 'tmdb', 'metahub'];
    const rawLogoSource = get('logo_source', 'logo_src');
    const logoSource: LogoSourceType = VALID_LOGO_SOURCES.includes(rawLogoSource as LogoSourceType)
      ? (rawLogoSource as LogoSourceType)
      : null;

    // ── Grayscale: accept new verbose name "grayscale", V3 "gs",
    //    and legacy "bw=1" (when border_width is absent) ──────────────────
    let grayscale = p.get('grayscale') === '1' || p.get('gs') === '1';
    if (!grayscale && p.has('bw') && !p.has('border_width')) {
      grayscale = p.get('bw') === '1';
    }

    // ── Global scale: decode back from effectiveGlobalScale ──────────────
    // The URL stores effectiveGlobalScale = sizeScale * config.scale.
    // Since we always default size='md' (sizeScale=1.0), we can recover
    // config.scale directly. If the user was on sm/lg, we lose that info
    // but it's an acceptable trade-off for URL-based config loading.
    const scaleRaw = getN('scale', 'sc', 1.0);

    return {
      mediaType,
      tmdbId,
      extension,
      ratings:    p.has('r') ? (p.get('r')?.split(',') as RatingType[]) : [],
      source:     (p.get('source') as PosterConfig['source']) || 'tmdb',
      ptype:      p.get('ptype') || 'auto',
      textless:   p.get('textless') === '1',
      theme:      'glass',
      size:       'md',
      shadow:     getN('shadow', 'sh', 6),
      layout:     (p.get('l') as PosterConfig['layout']) || 'custom',
      preset:     (p.get('pos') as PosterConfig['preset']) || 'custom',
      blur:       getN('blur', 'b', 8),
      alpha:      getN('alpha', 'a', 0.4),
      radius:     getN('radius', 'r', 12),
      posterBlur: getN('poster_blur', 'pb', 0),
      grayscale,
      scale:      scaleRaw,
      borderW:    has('border_width', 'bw') && !(p.get('bw') === '1' && !p.has('border_width'))
                    ? parseInt(get('border_width', 'bw') ?? '0')
                    : 0,
      borderC:    (() => {
        const v = get('border_color', 'bc');
        return v ? (v.startsWith('#') ? v : `#${v}`) : undefined;
      })(),
      bg:         get('background', 'bg') || undefined,
      txt:        (() => {
        const v = get('text_color', 'tc');
        return v ? (v.startsWith('#') ? v : `#${v}`) : undefined;
      })(),
      icon:       get('show_icon', 'ic') ? get('show_icon', 'ic') === '1' : true,
      keys,
      items,
      logo:       p.get('logo') === '1',
      logoSource,
      logoX:      has('logo_x', 'lx')      ? parseInt(get('logo_x', 'lx')!)         : null,
      logoY:      has('logo_y', 'ly')       ? parseInt(get('logo_y', 'ly')!)         : 630,
      logoW:      has('logo_width', 'lw')   ? parseInt(get('logo_width', 'lw')!)     : 380,
      logoH:      has('logo_height', 'lh')  ? parseInt(get('logo_height', 'lh')!)    : 100,
      logoOpacity: has('logo_opacity', 'lo') ? parseFloat(get('logo_opacity', 'lo')!) : 1.0,
      logoShadow:  has('logo_shadow', 'ls')  ? parseInt(get('logo_shadow', 'ls')!)   : 6,
    };
  } catch (e) {
    console.error('Failed to parse URL', e);
    return DEFAULT_CONFIG;
  }
};
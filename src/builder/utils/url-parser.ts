import type {
  PosterConfig,
  RatingType,
  MediaType,
  ApiKeys,
  ExtensionType,
  LogoSourceType,
  BadgeConfig,
} from '../types';
import { DEFAULT_CONFIG } from '../types';
import { V3_CODE_TO_KEY, DEFAULTS } from './constants';
import { getScale } from './positioning';

const createDefaultMinimalRating = () => ({
  provider: 'imdb' as RatingType,
  enabled: true,
  x: 140,
  y: 672,
  size: 26,
  color: '#facc15',
  opacity: 1,
  iconMode: 'star' as const,
  symbol: '★',
  bgEnabled: false,
  bgColor: '#000000',
  bgOpacity: 0,
  borderW: 0,
  borderColor: '#ffffff',
  borderOpacity: 0.7,
  radius: 0,
  paddingX: 0,
  paddingY: 0,
  shadowEnabled: false,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowColor: '#000000',
});

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(
      /\/(movie|tv|anime|poster)\/([^.]+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/
    );

    const mediaType: MediaType =
      match && ['movie', 'tv', 'anime'].includes(match[1])
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
    if (p.has('tmdb_key')) keys.tmdb = p.get('tmdb_key')!;
    if (p.has('fanart_key')) keys.fanart = p.get('fanart_key')!;
    if (p.has('omdb_key')) keys.omdb = p.get('omdb_key')!;
    if (p.has('mdblist_key')) keys.mdblist = p.get('mdblist_key')!;

    const items: PosterConfig['items'] = {};

    if (isV3) {
      for (const [name, value] of p.entries()) {
        if (name.length < 3 || name[1] !== '_') continue;
        const code = name[0];
        const badgeKey = V3_CODE_TO_KEY[code];
        if (!badgeKey) continue;
        const suffix = name.slice(2);

        if (!items[badgeKey]) items[badgeKey] = {};
        switch (suffix) {
          case 'x':
            items[badgeKey].x = parseInt(value);
            break;
          case 'y':
            items[badgeKey].y = parseInt(value);
            break;
          case 'bl':
            items[badgeKey].blur = parseInt(value);
            break;
          case 'al':
            items[badgeKey].alpha = parseFloat(value);
            break;
          case 'ra':
            items[badgeKey].radius = parseInt(value);
            break;
          case 'sh':
            items[badgeKey].shadow = parseInt(value);
            break;
          case 'ic':
            items[badgeKey].icon = value === '1';
            break;
          case 'sc':
            items[badgeKey].scale = parseFloat(value);
            break;
          case 'bw':
            items[badgeKey].borderW = parseInt(value);
            break;
          case 'bc':
            items[badgeKey].borderC = value.startsWith('#') ? value : `#${value}`;
            break;
          case 'bg':
            items[badgeKey].bg = value;
            break;
          case 'tx':
            items[badgeKey].txt = value.startsWith('#') ? value : `#${value}`;
            break;
          case 'nt':
            items[badgeKey].showText = value !== '1';
            break;
          case 'nm':
            items[badgeKey].normalize = value === '1';
            break;
          case 'of':
            items[badgeKey].outOf = parseInt(value);
            break;
          case 'it':
            items[badgeKey].iconType = parseInt(value);
            break;
          case 'lp':
            items[badgeKey].labelPos = value as BadgeConfig['labelPos'];
            break;
          case 'lt':
            items[badgeKey].labelText = value;
            break;
          case 'ls':
            items[badgeKey].labelSize = parseInt(value);
            break;
          case 'lc':
            items[badgeKey].labelColor = value;
            break;
          case 'tw':
            items[badgeKey].textCharWidth = parseInt(value);
            break;
          case 'th':
            items[badgeKey].textCharHeight = parseInt(value);
            break;
          case 'wr':
            items[badgeKey].textWrapEnabled = value !== '0';
            break;
          case 'dc':
            items[badgeKey].decimals = parseInt(value);
            break;
          case 'fd':
            items[badgeKey].forceDecimals = value === '1';
            break;
          case 'os':
            items[badgeKey].outOfSize = parseInt(value);
            break;
          case 'oc':
            items[badgeKey].outOfColor = value;
            break;
          case 'ip':
            items[badgeKey].iconPos = value as BadgeConfig['iconPos'];
            break;
          case 'li':
            items[badgeKey].labelInside = value === '1';
            break;
        }
      }

      const ratingCodes = p.has('r')
        ? p
            .get('r')!
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
      const parsedRatings = ratingCodes
        .map((c) => V3_CODE_TO_KEY[c])
        .filter(Boolean) as RatingType[];

      const fbCodes = p.has('fb')
        ? p
            .get('fb')!
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
      const fbPool = fbCodes.map((c) => V3_CODE_TO_KEY[c]).filter(Boolean) as RatingType[];

      const logoSource = (['fanart', 'tmdb', 'metahub'] as const).includes(
        p.get('logo_source') as any
      )
        ? (p.get('logo_source') as LogoSourceType)
        : null;

      const getNum = (v3k: string, v2k: string, def: number) =>
        p.has(v3k) ? parseInt(p.get(v3k)!) : p.has(v2k) ? parseInt(p.get(v2k)!) : def;
      const getFloat = (v3k: string, v2k: string, def: number) =>
        p.has(v3k) ? parseFloat(p.get(v3k)!) : p.has(v2k) ? parseFloat(p.get(v2k)!) : def;

      const parseOutOf = (): number | undefined => {
        const raw = p.get('of') ?? p.get('out_of');
        if (!raw) return undefined;
        const v = parseInt(raw);
        return isNaN(v) ? undefined : v;
      };

      const getBoolOrUndefined = (v3k: string, v2k: string): boolean | undefined => {
        if (p.has(v3k)) return p.get(v3k) === '1';
        if (p.has(v2k)) return p.get(v2k) === '1';
        return undefined;
      };

      // Handle title as separate param set
      if (p.get('ti') === '1') {
        parsedRatings.push('title');
        const alignMap: Record<string, 'left' | 'center' | 'right'> = { start: 'left', middle: 'center', end: 'right' };
        const tiAl = p.get('ti_al');
        const tiWd = p.has('ti_wd') ? parseInt(p.get('ti_wd')!) : undefined;
        let textCharWidth: number | undefined;
        if (tiWd !== undefined && tiWd > 0) {
          const sizeScale = getScale('md');
          const textSize = Math.max(8, p.has('ti_sz') ? parseInt(p.get('ti_sz')!) : 36) * sizeScale;
          const approxCharPx = Math.max(1, textSize * 0.54);
          textCharWidth = Math.max(4, Math.round((tiWd - 16 * sizeScale) / approxCharPx));
        }
        items.title = {
          icon: false,
          alpha: 0,
          blur: 0,
          radius: 0,
          shadow: 0,
          borderW: 0,
          ...(p.has('ti_x') ? { x: parseInt(p.get('ti_x')!) } : {}),
          ...(p.has('ti_y') ? { y: parseInt(p.get('ti_y')!) } : {}),
          ...(p.has('ti_sz') ? { textSize: parseInt(p.get('ti_sz')!) } : {}),
          ...(p.get('ti_tx') ? { txt: p.get('ti_tx')! } : {}),
          ...(tiAl ? { textAlign: (alignMap[tiAl] ?? tiAl) as 'left' | 'center' | 'right' } : {}),
          ...(textCharWidth !== undefined ? { textCharWidth } : {}),
          ...(p.has('ti_sh') ? { textShadowEnabled: true, textShadowBlur: parseInt(p.get('ti_sh')!) } : {}),
          ...(p.has('ti_wt') ? { textWeight: parseInt(p.get('ti_wt')!) } : {}),
        };
      }

      return {
        mediaType,
        tmdbId,
        imdbId,
        extension,
        ratings: parsedRatings,
        fallbackEnabled: fbPool.length > 0,
        fallbackPool: fbPool,
        source: (p.get('source') as PosterConfig['source']) || 'tmdb',
        ptype: p.get('pt') || p.get('ptype') || 'auto',
        textless: p.get('tl') === '1' || p.get('textless') === '1',
        theme: 'glass',
        size: 'md',
        blur: getNum('bl', 'blur', DEFAULTS.blur),
        alpha: getFloat('al', 'alpha', DEFAULTS.alpha),
        radius: getNum('ra', 'rad', DEFAULTS.radius),
        shadow: getNum('sh', 'sh', DEFAULTS.shadow),
        layout: (p.get('l') as PosterConfig['layout']) || 'custom',
        preset: (p.get('pos') as PosterConfig['preset']) || 'custom',
        posterBlur: getNum('pb', 'bg_blur', DEFAULTS.posterBlur),
        grayscale: p.get('gs') === '1' || p.get('bw') === '1',
        minimalTextSize: p.has('mts')
          ? parseInt(p.get('mts')!)
          : p.has('minimal_text_size')
            ? parseInt(p.get('minimal_text_size')!)
            : DEFAULTS.minimalTextSize,
        minimalTextX: p.has('mtx')
          ? parseInt(p.get('mtx')!)
          : p.has('minimal_text_x')
            ? parseInt(p.get('minimal_text_x')!)
            : DEFAULTS.minimalTextX,
        minimalTextY: p.has('mty')
          ? parseInt(p.get('mty')!)
          : p.has('minimal_text_y')
            ? parseInt(p.get('minimal_text_y')!)
            : DEFAULTS.minimalTextY,
        minimalTitleEnabled: (() => {
          const raw = p.get('ti') ?? p.get('title');
          return raw !== null ? raw === '1' : p.get('p') === 'm';
        })(),
        minimalTitleX: p.has('ti_x')
          ? parseInt(p.get('ti_x')!)
          : p.has('title_x')
            ? parseInt(p.get('title_x')!)
            : DEFAULTS.minimalTitleX,
        minimalTitleY: p.has('ti_y')
          ? parseInt(p.get('ti_y')!)
          : p.has('title_y')
            ? parseInt(p.get('title_y')!)
            : DEFAULTS.minimalTitleY,
        minimalTitleSize: p.has('ti_sz')
          ? parseInt(p.get('ti_sz')!)
          : p.has('title_size')
            ? parseInt(p.get('title_size')!)
            : DEFAULTS.minimalTitleSize,
        minimalTitleWidth: p.has('ti_wd')
          ? parseInt(p.get('ti_wd')!)
          : p.has('title_width')
            ? parseInt(p.get('title_width')!)
            : 420,
        minimalTitleAlign: (() => {
          const raw = p.get('ti_al') || p.get('title_align');
          if (raw === 'start' || raw === 'middle' || raw === 'end') {
            return { start: 'left', middle: 'center', end: 'right' }[raw] as 'left';
          }
          if (raw === 'left' || raw === 'center' || raw === 'right') return raw;
          return 'left';
        })(),
        minimalTitleFlow: 'up',
        minimalTitleColor: p.get('ti_tx') || p.get('title_color') || '#f5f5f5',
        minimalTitleOpacity: 1,
        minimalTitleWeight: p.has('ti_wt')
          ? parseInt(p.get('ti_wt')!)
          : p.has('title_weight')
            ? parseInt(p.get('title_weight')!)
            : 700,
        minimalTitleLetterSpacing: 0,
        minimalTitleLineHeight: 1.02,
        minimalTitleShadowEnabled: (() => {
          const raw = p.get('ti_sh') ?? p.get('title_shadow');
          return raw !== null ? parseInt(raw) > 0 : false;
        })(),
        minimalTitleShadowX: 0,
        minimalTitleShadowY: 0,
        minimalTitleShadowBlur: p.has('ti_sh')
          ? parseInt(p.get('ti_sh')!)
          : p.has('title_shadow')
            ? parseInt(p.get('title_shadow')!)
            : 0,
        minimalTitleShadowColor: '#000000',
        minimalTitleBorderW: 0,
        minimalTitleBorderColor: '#d4a245',
        minimalTitleBorderOpacity: 0.6,
        minimalTitleBgEnabled: false,
        minimalTitleBgColor: '#000000',
        minimalTitleBgOpacity: 0,
        minimalTitlePaddingX: 10,
        minimalTitlePaddingY: 8,
        minimalTitleRadius: 8,
        minimalRatingsEnabled: true,
        minimalRatingIconMode: 'star',
        minimalRatingSymbol: '★',
        minimalRatings: [createDefaultMinimalRating()],
        minimalYearEnabled: true,
        minimalDurationEnabled: false,
        minimalMetaX: 26,
        minimalMetaY: 672,
        minimalDurationX: 90,
        minimalDurationY: 672,
        minimalMetaSize: 50,
        minimalMetaColor: '#d6dde3',
        minimalMetaOpacity: 0.92,
        minimalMetaWeight: 600,
        minimalMetaLetterSpacing: 0,
        scale: getFloat('sc', 'g_scale', DEFAULTS.scale),
        borderW: p.has('bw') && p.get('bw') !== '1' ? parseInt(p.get('bw')!) : DEFAULTS.borderW,
        borderC: p.has('bc')
          ? p.get('bc')!.startsWith('#')
            ? p.get('bc')!
            : `#${p.get('bc')}`
          : undefined,
        bg: p.get('bg') || undefined,
        txt: p.has('tx')
          ? p.get('tx')!.startsWith('#')
            ? p.get('tx')!
            : `#${p.get('tx')}`
          : undefined,
        icon: p.has('ic') ? p.get('ic') === '1' : true,
        showText: p.get('nt') !== '1',
        uiPreset: (p.get('p') === 'm' ? 'm' : 'b') as 'b' | 'm',
        normalize: p.get('nm') === '1' || p.get('normalize') === '1',
        outOf: parseOutOf(),
        iconType: getNum('it', 'icon_type', DEFAULTS.iconType),
        labelPos: (p.get('lp') || p.get('label_pos') || undefined) as PosterConfig['labelPos'],
        labelText: p.get('lt') || p.get('label_text') || undefined,
        labelSize: p.has('ls')
          ? parseInt(p.get('ls')!)
          : p.has('label_size')
            ? parseInt(p.get('label_size')!)
            : undefined,
        labelColor: p.get('lc') || p.get('label_color') || undefined,
        decimals: p.has('dc')
          ? parseInt(p.get('dc')!)
          : p.has('decimals')
            ? parseInt(p.get('decimals')!)
            : DEFAULTS.decimals,
        forceDecimals: getBoolOrUndefined('fd', 'force_decimals') ?? DEFAULTS.forceDecimals,
        outOfSize: p.has('os')
          ? parseInt(p.get('os')!)
          : p.has('out_of_size')
            ? parseInt(p.get('out_of_size')!)
            : DEFAULTS.outOfSize,
        outOfColor: p.get('oc') || p.get('out_of_color') || undefined,
        uniform: getBoolOrUndefined('ub', 'uniform') ?? DEFAULTS.uniform,
        iconPos: (p.get('ip') || p.get('icon_pos') || DEFAULTS.iconPos) as PosterConfig['iconPos'],
        labelInside: getBoolOrUndefined('li', 'label_inside') ?? DEFAULTS.labelInside,
        logoMaxW: p.has('lmw')
          ? parseInt(p.get('lmw')!)
          : p.has('logo_max_w')
            ? parseInt(p.get('logo_max_w')!)
            : null,
        logoMaxH: p.has('lmh')
          ? parseInt(p.get('lmh')!)
          : p.has('logo_max_h')
            ? parseInt(p.get('logo_max_h')!)
            : null,
        keys,
        items,
        logo: p.get('logo') === '1',
        logoSource,
        logoX: p.has('logo_x') ? parseInt(p.get('logo_x')!) : null,
        logoY: p.has('logo_y') ? parseInt(p.get('logo_y')!) : DEFAULTS.logoY,
        logoW: p.has('logo_w') ? parseInt(p.get('logo_w')!) : DEFAULTS.logoW,
        logoH: p.has('logo_h') ? parseInt(p.get('logo_h')!) : DEFAULTS.logoH,
        logoOpacity: p.has('logo_opacity')
          ? parseFloat(p.get('logo_opacity')!)
          : DEFAULTS.logoOpacity,
        logoShadow: p.has('logo_sh') ? parseInt(p.get('logo_sh')!) : DEFAULTS.logoShadow,
        noEmbed: getBoolOrUndefined('ne', 'no_embed') ?? DEFAULTS.noEmbed,
        compressIcons: p.get('compress_icons') === '1' || p.get('no_icon') === '1' || false,
        sourcePriority: (() => {
          const raw = p.get('so') ?? p.get('source_order');
          if (!raw) return undefined;
          return raw.split(',').map((s) => s.trim()).filter(Boolean);
        })(),
        malId: p.get('mid') ?? p.get('mal_id') ?? undefined,
        font: p.get('fn') || p.get('font') || undefined,
      };
    }

    const ratingKeys: RatingType[] = [
      'imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'mal', 'anilist', 'age', 'runtime',
    ];

    ratingKeys.forEach((key) => {
      const x = p.get(`${key}_x`);
      const y = p.get(`${key}_y`);
      const bg = p.get(`${key}_bg`);
      const txt = p.get(`${key}_txt`);
      const blur = p.get(`${key}_blur`);
      const alpha = p.get(`${key}_alpha`);
      const rad = p.get(`${key}_rad`);
      const sh = p.get(`${key}_sh`);
      const icon = p.get(`${key}_icon`);
      const scale = p.get(`${key}_scale`);
      const bw = p.get(`${key}_bw`);
      const bc = p.get(`${key}_bc`);
      const nt = p.get(`${key}_nt`);
      const nm = p.get(`${key}_nm`);
      const of_ = p.get(`${key}_of`) ?? p.get(`${key}_out_of`);
      const it = p.get(`${key}_it`) ?? p.get(`${key}_icon_type`);
      const lp = p.get(`${key}_lp`) ?? p.get(`${key}_label_pos`);
      const lt = p.get(`${key}_lt`) ?? p.get(`${key}_label_text`);
      const ls = p.get(`${key}_ls`) ?? p.get(`${key}_label_size`);
      const lc = p.get(`${key}_lc`) ?? p.get(`${key}_label_color`);
      const tw = p.get(`${key}_tw`);
      const th = p.get(`${key}_th`);
      const wr = p.get(`${key}_wr`);
      const dc = p.get(`${key}_dc`) ?? p.get(`${key}_decimals`);
      const fd = p.get(`${key}_fd`) ?? p.get(`${key}_force_decimals`);
      const os = p.get(`${key}_os`) ?? p.get(`${key}_out_of_size`);
      const oc = p.get(`${key}_oc`) ?? p.get(`${key}_out_of_color`);
      const ip = p.get(`${key}_ip`) ?? p.get(`${key}_icon_pos`);
      const li = p.get(`${key}_li`) ?? p.get(`${key}_label_inside`);

      if (x || y || bg || txt || blur || alpha || rad || sh || icon || scale || bw || nt || nm || lp || tw || th || wr || dc || fd || os || oc || ip || li) {
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
          ...(p.has(`${key}_bc`) ? { borderC: bc!.startsWith('#') ? bc! : `#${bc}` } : {}),
          ...(nt ? { showText: nt !== '1' } : {}),
          ...(nm ? { normalize: nm === '1' } : {}),
          ...(of_ ? { outOf: parseInt(of_) } : {}),
          ...(it ? { iconType: parseInt(it) } : {}),
          ...(lp ? { labelPos: lp as BadgeConfig['labelPos'] } : {}),
          ...(lt ? { labelText: lt } : {}),
          ...(ls ? { labelSize: parseInt(ls) } : {}),
          ...(lc ? { labelColor: lc } : {}),
          ...(tw ? { textCharWidth: parseInt(tw) } : {}),
          ...(th ? { textCharHeight: parseInt(th) } : {}),
          ...(wr ? { textWrapEnabled: wr !== '0' } : {}),
          ...(dc ? { decimals: parseInt(dc) } : {}),
          ...(fd ? { forceDecimals: fd === '1' } : {}),
          ...(os ? { outOfSize: parseInt(os) } : {}),
          ...(oc ? { outOfColor: oc } : {}),
          ...(ip ? { iconPos: ip as BadgeConfig['iconPos'] } : {}),
          ...(li ? { labelInside: li === '1' } : {}),
        };
      }
    });

    const v2FbRaw = p.get('fb');
    const v2FbPool = v2FbRaw
      ? (v2FbRaw
          .split(',')
          .map((s) => s.trim())
          .filter((k) => ratingKeys.includes(k as RatingType)) as RatingType[])
      : [];

    const g_scale = p.get('g_scale');
    const g_bw = p.get('g_bw');
    const g_bc = p.get('g_bc');
    const g_bg = p.get('g_bg');
    const g_txt = p.get('g_txt');
    const g_icon = p.get('g_icon');

    const grayscale = p.get('gs') === '1' || p.get('bw') === '1';

    const rawLogoSource = p.get('logo_source');
    const logoSource: LogoSourceType = (['fanart', 'tmdb', 'metahub'] as const).includes(
      rawLogoSource as any
    )
      ? (rawLogoSource as LogoSourceType)
      : null;

    const v2OutOf = p.has('out_of') ? parseInt(p.get('out_of')!) || undefined : undefined;

    if (p.get('ti') === '1') {
      items.title = {
        icon: false,
        alpha: 0,
        blur: 0,
        radius: 0,
        shadow: 0,
        borderW: 0,
        ...(p.has('ti_x') ? { x: parseInt(p.get('ti_x')!) } : {}),
        ...(p.has('ti_y') ? { y: parseInt(p.get('ti_y')!) } : {}),
        ...(p.has('ti_sz') ? { textSize: parseInt(p.get('ti_sz')!) } : {}),
        ...(p.get('ti_tx') ? { txt: p.get('ti_tx')! } : {}),
        ...(p.get('ti_al') ? { textAlign: ({ start: 'left', middle: 'center', end: 'right' }[p.get('ti_al')!] ?? p.get('ti_al')!) as 'left' | 'center' | 'right' } : {}),
        ...(p.has('ti_wt') ? { textWeight: parseInt(p.get('ti_wt')!) } : {}),
      };
    }

    return {
      mediaType,
      tmdbId,
      imdbId,
      extension,
      ratings: p.has('r') ? (p.get('r')!.split(',') as RatingType[]) : [],
      fallbackEnabled: v2FbPool.length > 0,
      fallbackPool: v2FbPool,
      source: (p.get('source') as PosterConfig['source']) || 'tmdb',
      ptype: p.get('ptype') || 'auto',
      textless: p.get('textless') === '1',
      theme: 'glass',
      size: 'md',
      shadow: p.has('sh') ? parseInt(p.get('sh')!) : DEFAULTS.shadow,
      layout: (p.get('l') as PosterConfig['layout']) || 'custom',
      preset: (p.get('pos') as PosterConfig['preset']) || 'custom',
      blur: p.has('blur') ? parseInt(p.get('blur')!) : DEFAULTS.blur,
      alpha: p.has('alpha') ? parseFloat(p.get('alpha')!) : DEFAULTS.alpha,
      radius: p.has('rad') ? parseInt(p.get('rad')!) : DEFAULTS.radius,
      posterBlur: p.has('bg_blur') ? parseInt(p.get('bg_blur')!) : DEFAULTS.posterBlur,
      grayscale,
      minimalTextSize: p.has('minimal_text_size')
        ? parseInt(p.get('minimal_text_size')!)
        : p.has('mts')
          ? parseInt(p.get('mts')!)
          : DEFAULTS.minimalTextSize,
      minimalTextX: p.has('minimal_text_x')
        ? parseInt(p.get('minimal_text_x')!)
        : p.has('mtx')
          ? parseInt(p.get('mtx')!)
          : DEFAULTS.minimalTextX,
      minimalTextY: p.has('minimal_text_y')
        ? parseInt(p.get('minimal_text_y')!)
        : p.has('mty')
          ? parseInt(p.get('mty')!)
          : DEFAULTS.minimalTextY,
      minimalTitleEnabled: (() => {
        const raw = p.get('title');
        return raw !== null ? raw === '1' : p.get('preset') === 'minimal';
      })(),
      minimalTitleX: p.has('title_x')
        ? parseInt(p.get('title_x')!)
        : DEFAULTS.minimalTitleX,
      minimalTitleY: p.has('title_y')
        ? parseInt(p.get('title_y')!)
        : DEFAULTS.minimalTitleY,
      minimalTitleSize: p.has('title_size')
        ? parseInt(p.get('title_size')!)
        : DEFAULTS.minimalTitleSize,
      minimalTitleWidth: p.has('title_width')
        ? parseInt(p.get('title_width')!)
        : 420,
      minimalTitleAlign: (() => {
        const raw = p.get('title_align');
        if (raw === 'start' || raw === 'middle' || raw === 'end') {
          return { start: 'left', middle: 'center', end: 'right' }[raw] as 'left';
        }
        if (raw === 'left' || raw === 'center' || raw === 'right') return raw;
        return 'left';
      })(),
      minimalTitleFlow: 'up',
      minimalTitleColor: p.get('title_color') || '#f5f5f5',
      minimalTitleOpacity: 1,
      minimalTitleWeight: p.has('title_weight')
        ? parseInt(p.get('title_weight')!)
        : 700,
      minimalTitleLetterSpacing: 0,
      minimalTitleLineHeight: 1.02,
      minimalTitleShadowEnabled: p.has('title_shadow')
        ? parseInt(p.get('title_shadow')!) > 0
        : false,
      minimalTitleShadowX: 0,
      minimalTitleShadowY: 0,
      minimalTitleShadowBlur: p.has('title_shadow')
        ? parseInt(p.get('title_shadow')!)
        : 0,
      minimalTitleShadowColor: '#000000',
      minimalTitleBorderW: 0,
      minimalTitleBorderColor: '#d4a245',
      minimalTitleBorderOpacity: 0.6,
      minimalTitleBgEnabled: false,
      minimalTitleBgColor: '#000000',
      minimalTitleBgOpacity: 0,
      minimalTitlePaddingX: 10,
      minimalTitlePaddingY: 8,
      minimalTitleRadius: 8,
      minimalRatingsEnabled: true,
      minimalRatingIconMode: 'star',
      minimalRatingSymbol: '★',
      minimalRatings: [createDefaultMinimalRating()],
      minimalYearEnabled: true,
      minimalDurationEnabled: false,
      minimalMetaX: 26,
      minimalMetaY: 672,
      minimalDurationX: 90,
      minimalDurationY: 672,
      minimalMetaSize: 50,
      minimalMetaColor: '#d6dde3',
      minimalMetaOpacity: 0.92,
      minimalMetaWeight: 600,
      minimalMetaLetterSpacing: 0,
      scale: g_scale ? parseFloat(g_scale) : DEFAULTS.scale,
      borderW: g_bw ? parseInt(g_bw) : DEFAULTS.borderW,
      borderC: g_bc ? (g_bc.startsWith('#') ? g_bc : `#${g_bc}`) : undefined,
      bg: g_bg || undefined,
      txt: g_txt ? (g_txt.startsWith('#') ? g_txt : `#${g_txt}`) : undefined,
      icon: g_icon ? g_icon === '1' : true,
      showText: p.get('nt') !== '1',
      uiPreset: (p.get('preset') === 'minimal' ? 'm' : 'b') as 'b' | 'm',
      normalize: p.get('normalize') === '1',
      outOf: v2OutOf,
      iconType: p.has('icon_type') ? parseInt(p.get('icon_type')!) : DEFAULTS.iconType,
      labelPos: (p.get('label_pos') || undefined) as PosterConfig['labelPos'],
      labelText: p.get('label_text') || undefined,
      labelSize: p.has('label_size') ? parseInt(p.get('label_size')!) : undefined,
      labelColor: p.get('label_color') || undefined,
      decimals: p.has('decimals')
        ? parseInt(p.get('decimals')!)
        : DEFAULTS.decimals,
      forceDecimals: p.get('force_decimals') === '1' || false,
      outOfSize: p.has('out_of_size')
        ? parseInt(p.get('out_of_size')!)
        : DEFAULTS.outOfSize,
      outOfColor: p.get('out_of_color') || undefined,
      uniform: p.get('uniform') === '1' || false,
      iconPos: (p.get('icon_pos') || DEFAULTS.iconPos) as PosterConfig['iconPos'],
      labelInside: p.get('label_inside') === '1' || false,
      logoMaxW: p.has('logo_max_w') ? parseInt(p.get('logo_max_w')!) : null,
      logoMaxH: p.has('logo_max_h') ? parseInt(p.get('logo_max_h')!) : null,
      keys,
      items,
      logo: p.get('logo') === '1',
      logoSource,
      logoX: p.has('logo_x') ? parseInt(p.get('logo_x')!) : null,
      logoY: p.has('logo_y') ? parseInt(p.get('logo_y')!) : DEFAULTS.logoY,
      logoW: p.has('logo_w') ? parseInt(p.get('logo_w')!) : DEFAULTS.logoW,
      logoH: p.has('logo_h') ? parseInt(p.get('logo_h')!) : DEFAULTS.logoH,
      logoOpacity: p.has('logo_opacity')
        ? parseFloat(p.get('logo_opacity')!)
        : DEFAULTS.logoOpacity,
      logoShadow: p.has('logo_sh') ? parseInt(p.get('logo_sh')!) : DEFAULTS.logoShadow,
      noEmbed: p.get('no_embed') === '1' || false,
      compressIcons: p.get('compress_icons') === '1' || p.get('no_icon') === '1' || false,
      sourcePriority: (() => {
        const raw = p.get('source_order');
        if (!raw) return undefined;
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
      })(),
      malId: p.get('mal_id') || undefined,
      font: p.get('font') || undefined,
    };
  } catch (e) {
    console.error('Failed to parse URL', e);
    return DEFAULT_CONFIG;
  }
};

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

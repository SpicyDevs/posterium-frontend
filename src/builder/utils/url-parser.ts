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
      const validBadgeCodes = new Set(Object.keys(V3_CODE_TO_KEY));

      for (const [name, value] of p.entries()) {
        if (name.length < 3 || name[1] !== '_') continue;
        const code = name[0];
        if (!validBadgeCodes.has(code)) continue;
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
        grayscale: p.get('gs') === '1',
        scale: getFloat('sc', 'g_scale', DEFAULTS.scale),
        borderW: p.has('bw') ? parseInt(p.get('bw')!) : DEFAULTS.borderW,
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
        decimals: getNum('dc', 'decimals', DEFAULTS.decimals),
        forceDecimals: getBoolOrUndefined('fd', 'force_decimals') ?? DEFAULTS.forceDecimals,
        outOfSize: getNum('os', 'out_of_size', DEFAULTS.outOfSize),
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
        compressIcons: false,
        sourcePriority: (() => {
          const raw = p.get('so') ?? p.get('source_order');
          if (!raw) return undefined;
          return raw.split(',').map((s) => s.trim()).filter(Boolean);
        })(),
        malId: p.get('mid') ?? p.get('mal_id') ?? undefined,
        font: p.get('fn') || p.get('font') || undefined,
        titleEnabled: p.get('ti') === '1',
        titleX: getNum('ti_x', 'title_x', 25),
        titleY: getNum('ti_y', 'title_y', 100),
        titleSize: getNum('ti_sz', 'title_size', 48),
        titleWidth: getNum('ti_wd', 'title_width', 450),
        titleAlign: (p.get('ti_al') || p.get('title_align') || 'start') as PosterConfig['titleAlign'],
        titleColor: p.get('ti_tx') || p.get('title_color') || '#ffffff',
        titleWeight: getNum('ti_wt', 'title_weight', 800),
        titleShadowBlur: getNum('ti_sh', 'title_shadow', 0),
      };
    }

    return DEFAULT_CONFIG;
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

import { PosterConfig, DEFAULT_CONFIG, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H, GAP, PADDING, MediaType, ApiKeys } from './types';

// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || "https://rpdb.padhaiaayush.workers.dev";

export const getScale = (size: string) => {
  return size === 'sm' ? 0.8 : (size === 'lg' ? 1.2 : 1.0);
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

  const groupW = isRow 
    ? (totalBadges * badgeW) + ((totalBadges - 1) * GAP) 
    : badgeW;
    
  const groupH = isRow 
    ? badgeH 
    : (totalBadges * badgeH) + ((totalBadges - 1) * GAP);

  let presetX = 0;
  let presetY = 0;

  if (config.preset.includes('l')) presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else presetX = (CANVAS_WIDTH - groupW) / 2;

  if (config.preset.includes('t')) presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else presetY = (CANVAS_HEIGHT - groupH) / 2;

  let x = isRow ? presetX + (index * (badgeW + GAP)) : presetX;
  let y = isRow ? presetY : presetY + (index * (badgeH + GAP));

  return { x: Math.round(x), y: Math.round(y) };
};

export const generateApiUrl = (config: PosterConfig, baseUrl: string = DEFAULT_API_BASE): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/${config.mediaType}/${config.tmdbId}.${config.extension}`);
  const params = url.searchParams;

  if (config.ratings.length > 0) params.set('r', config.ratings.join(','));
  if (config.source !== 'tmdb') params.set('source', config.source);
  
  if (config.keys?.tmdb) params.set('tmdb_key', config.keys.tmdb);
  if (config.keys?.fanart) params.set('fanart_key', config.keys.fanart);
  if (config.keys?.omdb) params.set('omdb_key', config.keys.omdb);

  params.set('v', '1');
  params.set('blur', config.blur.toString());
  params.set('alpha', config.alpha.toString());
  params.set('rad', config.radius.toString());
  params.set('sh', config.shadow ? '1' : '0');
  params.set('s', config.size);
  params.set('l', config.layout);
  params.set('pos', config.preset);

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
    if (item.shadow !== undefined) params.set(`${key}_sh`, item.shadow ? '1' : '0');
    if (item.icon !== undefined) params.set(`${key}_icon`, item.icon ? '1' : '0');
  });

  return url.toString();
};

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    // Updated regex to include webp
    const match = url.pathname.match(/\/(movie|tv)\/(\w+)(?:\.(jpg|jpeg|png|svg|webp))?$/);
    
    const mediaType = match ? (match[1] as MediaType) : DEFAULT_CONFIG.mediaType;
    const tmdbId = match ? match[2] : DEFAULT_CONFIG.tmdbId;
    
    // Updated logic: if no extension group found, default to 'svg'
    const extension = match && match[3] ? (match[3] === 'jpeg' ? 'jpg' : match[3]) : 'svg';
    
    const params = url.searchParams;

    const keys: ApiKeys = {};
    if (params.has('tmdb_key')) keys.tmdb = params.get('tmdb_key')!;
    if (params.has('fanart_key')) keys.fanart = params.get('fanart_key')!;
    if (params.has('omdb_key')) keys.omdb = params.get('omdb_key')!;

    const items: PosterConfig['items'] = {};
    const ratingKeys: RatingType[] = ['imdb', 'rt', 'meta', 'tmdb', 'age', 'runtime'];
    
    ratingKeys.forEach(key => {
        const x = params.get(`${key}_x`);
        const y = params.get(`${key}_y`);
        const bg = params.get(`${key}_bg`);
        const txt = params.get(`${key}_txt`);
        const blur = params.get(`${key}_blur`);
        const alpha = params.get(`${key}_alpha`);
        const rad = params.get(`${key}_rad`);
        const sh = params.get(`${key}_sh`);
        const icon = params.get(`${key}_icon`);

        if (x || y || bg || txt || blur || alpha || rad || sh || icon) {
            items[key] = {
                ...(x ? { x: parseInt(x) } : {}),
                ...(y ? { y: parseInt(y) } : {}),
                ...(bg ? { bg: bg.startsWith('#') ? bg : `#${bg}` } : {}),
                ...(txt ? { txt: txt.startsWith('#') ? txt : `#${txt}` } : {}),
                ...(blur ? { blur: parseInt(blur) } : {}),
                ...(alpha ? { alpha: parseFloat(alpha) } : {}),
                ...(rad ? { radius: parseInt(rad) } : {}),
                ...(sh ? { shadow: sh === '1' } : {}),
                ...(icon ? { icon: icon === '1' } : {}),
            };
        }
    });

    return {
      mediaType,
      tmdbId,
      extension: extension as any,
      ratings: params.has('r') ? params.get('r')?.split(',') as RatingType[] : [],
      source: (params.get('source') as any) || 'tmdb',
      theme: 'glass',
      size: (params.get('s') as any) || 'md',
      shadow: params.get('sh') === '1',
      layout: (params.get('l') as any) || 'col',
      preset: (params.get('pos') as any) || 'tr',
      blur: params.has('blur') ? parseInt(params.get('blur')!) : 8,
      alpha: params.has('alpha') ? parseFloat(params.get('alpha')!) : 0.4,
      radius: params.has('rad') ? parseInt(params.get('rad')!) : 12,
      keys,
      items,
    };
  } catch (e) {
    console.error("Failed to parse URL", e);
    return DEFAULT_CONFIG;
  }
};
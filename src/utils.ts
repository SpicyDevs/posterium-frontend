// src/utils.ts
import { PosterConfig, DEFAULT_CONFIG, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H, GAP, PADDING } from './types';

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

  const groupW = isRow ? (totalBadges * badgeW) + ((totalBadges - 1) * GAP) : badgeW;
  const groupH = isRow ? badgeH : (totalBadges * badgeH) + ((totalBadges - 1) * GAP);

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

  return { x, y };
};

export const generateApiUrl = (config: PosterConfig, baseUrl: string = DEFAULT_API_BASE): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/${config.tmdbId}.${config.extension}`);
  const params = url.searchParams;

  // Basic Params
  if (config.ratings.length > 0) params.set('r', config.ratings.join(','));
  if (config.source !== 'tmdb') params.set('source', config.source);
  
  // Visual Global Params - ALWAYS APPLY (No default checks)
  params.set('blur', config.blur.toString());
  params.set('alpha', config.alpha.toString());
  params.set('rad', config.radius.toString());
  params.set('sh', config.shadow ? '1' : '0');
  
  // Layout Params (Legacy, but kept for state preservation if backend ever uses them)
  params.set('s', config.size);
  params.set('l', config.layout);
  params.set('pos', config.preset);

  // Per-Item Params - EXPLICIT CALCULATION
  // The backend doesn't know about presets/layouts, so we must calculate 
  // the exact X/Y for every item and send it.
  config.ratings.forEach((key, index) => {
    const item = config.items[key] || {};
    
    // 1. Calculate where it SHOULD be based on auto-layout
    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    
    // 2. Use manual override if exists, otherwise use auto
    const finalX = item.x !== undefined ? item.x : autoPos.x;
    const finalY = item.y !== undefined ? item.y : autoPos.y;

    // 3. Send to backend
    params.set(`${key}_x`, Math.round(finalX).toString());
    params.set(`${key}_y`, Math.round(finalY).toString());

    // 4. Styles
    if (item.bg) params.set(`${key}_bg`, item.bg); 
    if (item.txt) params.set(`${key}_txt`, item.txt);
  });

  return url.toString();
};

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    const match = url.pathname.match(/\/(\d+)(?:\.(jpg|jpeg|png|svg))?$/);
    const tmdbId = match ? match[1] : DEFAULT_CONFIG.tmdbId;
    const extension = match && match[2] ? (match[2] === 'jpeg' ? 'jpg' : match[2]) : 'jpg';
    
    const params = url.searchParams;

    const items: PosterConfig['items'] = {};
    const ratingKeys: RatingType[] = ['imdb', 'rt', 'meta', 'tmdb'];
    
    ratingKeys.forEach(key => {
        const x = params.get(`${key}_x`);
        const y = params.get(`${key}_y`);
        const bg = params.get(`${key}_bg`);
        const txt = params.get(`${key}_txt`);

        if (x || y || bg || txt) {
            items[key] = {
                ...(x ? { x: parseInt(x) } : {}),
                ...(y ? { y: parseInt(y) } : {}),
                ...(bg ? { bg: bg.startsWith('#') ? bg : `#${bg}` } : {}),
                ...(txt ? { txt: txt.startsWith('#') ? txt : `#${txt}` } : {}),
            };
        }
    });

    return {
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
      items,
    };
  } catch (e) {
    console.error("Failed to parse URL", e);
    return DEFAULT_CONFIG;
  }
};
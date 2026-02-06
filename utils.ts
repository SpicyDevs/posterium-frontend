import { PosterConfig, DEFAULT_CONFIG, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H, GAP, PADDING } from './types';

// @ts-ignore
const envApiUrl = import.meta.env.VITE_API_URL;
export const DEFAULT_API_BASE = envApiUrl || "https://freeposterapi.pages.dev";

export const getScale = (size: string) => {
  return size === 'sm' ? 0.8 : (size === 'lg' ? 1.2 : 1.0);
};

export const generateApiUrl = (config: PosterConfig, baseUrl: string = DEFAULT_API_BASE): string => {
  // Ensure baseUrl doesn't have trailing slash for consistency
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = new URL(`${cleanBase}/${config.tmdbId}.${config.extension}`);
  const params = url.searchParams;

  if (config.ratings.length > 0) {
    params.set('r', config.ratings.join(','));
  }

  if (config.source !== 'tmdb') params.set('source', config.source);
  if (config.theme !== 'glass') params.set('t', config.theme);
  if (config.size !== 'md') params.set('s', config.size);
  if (config.shadow) params.set('sh', '1');
  if (config.layout !== 'col') params.set('l', config.layout);
  if (config.preset !== 'tr') params.set('pos', config.preset);

  if (config.customBg) params.set('bg', config.customBg.replace('#', ''));
  if (config.customTxt) params.set('txt', config.customTxt.replace('#', ''));

  // Independent coordinates
  if (config.pos.imdb) {
    params.set('ix', Math.round(config.pos.imdb.x).toString());
    params.set('iy', Math.round(config.pos.imdb.y).toString());
  }
  if (config.pos.rt) {
    params.set('rx', Math.round(config.pos.rt.x).toString());
    params.set('ry', Math.round(config.pos.rt.y).toString());
  }
  if (config.pos.meta) {
    params.set('mx', Math.round(config.pos.meta.x).toString());
    params.set('my', Math.round(config.pos.meta.y).toString());
  }

  return url.toString();
};

export const parseUrlToConfig = (urlString: string): PosterConfig => {
  try {
    const url = new URL(urlString);
    
    // Parse ID and extension from path
    const match = url.pathname.match(/\/(\d+)(?:\.(jpg|jpeg|png|svg))?$/);
    const tmdbId = match ? match[1] : DEFAULT_CONFIG.tmdbId;
    const extension = match && match[2] ? (match[2] === 'jpeg' ? 'jpg' : match[2]) : 'svg';
    
    const params = url.searchParams;

    // Ratings
    const ratings = params.has('r') 
      ? params.get('r')?.split(',') as RatingType[] 
      : [];

    // Positions
    const pos: PosterConfig['pos'] = {};
    if (params.has('ix') && params.has('iy')) {
      pos.imdb = { x: parseInt(params.get('ix')!), y: parseInt(params.get('iy')!) };
    }
    if (params.has('rx') && params.has('ry')) {
      pos.rt = { x: parseInt(params.get('rx')!), y: parseInt(params.get('ry')!) };
    }
    if (params.has('mx') && params.has('my')) {
      pos.meta = { x: parseInt(params.get('mx')!), y: parseInt(params.get('my')!) };
    }

    return {
      tmdbId,
      extension: extension as any,
      ratings,
      source: (params.get('source') as any) || 'tmdb',
      theme: (params.get('t') as any) || 'glass',
      size: (params.get('s') as any) || 'md',
      shadow: params.get('sh') === '1',
      layout: (params.get('l') as any) || 'col',
      preset: (params.get('pos') as any) || 'tr',
      customBg: params.get('bg') ? `#${params.get('bg')}` : '',
      customTxt: params.get('txt') ? `#${params.get('txt')}` : '',
      pos,
    };
  } catch (e) {
    console.error("Failed to parse URL", e);
    return DEFAULT_CONFIG;
  }
};

// Helper to calculate default position based on preset
// This mimics the worker's logic to show items in their "preset" spot if not manually dragged
export const calculateAutoPosition = (
  ratingId: RatingType, 
  index: number, 
  totalBadges: number, 
  config: PosterConfig
) => {
  const scale = getScale(config.size);
  const badgeW = BASE_BADGE_W * scale;
  const badgeH = BASE_BADGE_H * scale;
  const isRow = config.layout === 'row';

  // Group dimensions
  const groupW = isRow 
    ? (totalBadges * badgeW) + ((totalBadges - 1) * GAP) 
    : badgeW;
  const groupH = isRow 
    ? badgeH 
    : (totalBadges * badgeH) + ((totalBadges - 1) * GAP);

  let presetX = 0;
  let presetY = 0;

  // Horizontal Logic
  if (config.preset.includes('l')) presetX = PADDING;
  else if (config.preset.includes('r')) presetX = CANVAS_WIDTH - groupW - PADDING;
  else if (config.preset.includes('c')) presetX = (CANVAS_WIDTH - groupW) / 2;
  else presetX = (CANVAS_WIDTH - groupW) / 2; // Default to center if unknown

  // Vertical Logic
  if (config.preset.includes('t')) presetY = PADDING;
  else if (config.preset.includes('b')) presetY = CANVAS_HEIGHT - groupH - PADDING;
  else if (config.preset.includes('c')) presetY = (CANVAS_HEIGHT - groupH) / 2;
  else presetY = (CANVAS_HEIGHT - groupH) / 2; // Default to center

  let x = isRow ? presetX + (index * (badgeW + GAP)) : presetX;
  let y = isRow ? presetY : presetY + (index * (badgeH + GAP));

  return { x, y };
};
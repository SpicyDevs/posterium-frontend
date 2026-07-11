import type { PosterConfig, RatingType } from '@/types/poster';

export const DEFAULT_CONFIG: PosterConfig = {
  mediaType: 'movie',
  tmdbId: '',
  imdbId: 'tt9419884',
  ratings: ['imdb', 'rt', 'age'],
  source: 'tmdb',
  ptype: 'auto',
  textless: false,
  theme: 'glass',
  size: 'md',
  extension: 'png',
  posterBlur: 0,
  grayscale: false,
  minimalTextSize: 60,
  minimalTextX: 26,
  minimalTextY: 556,
  minimalTitleEnabled: false,
  minimalTitleWidth: 420,
  minimalTitleAlign: 'left',
  minimalTitleFlow: 'up',
  minimalTitleColor: '#f5f5f5',
  minimalTitleOpacity: 1,
  minimalTitleWeight: 700,
  minimalTitleLetterSpacing: 0,
  minimalTitleLineHeight: 1.02,
  minimalTitleShadowEnabled: false,
  minimalTitleShadowX: 0,
  minimalTitleShadowY: 0,
  minimalTitleShadowBlur: 0,
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
  minimalRatingsEnabled: false,
  minimalRatingIconMode: 'star',
  minimalRatingSymbol: '\u2605',
  minimalRatings: [
    {
      provider: 'imdb',
      enabled: true,
      x: 140,
      y: 672,
      size: 26,
      color: '#facc15',
      opacity: 1,
      iconMode: 'star',
      symbol: '\u2605',
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
    },
  ],
  minimalYearEnabled: false,
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
  layout: 'custom',
  preset: 'custom',
  blur: 0,
  alpha: 0.4,
  radius: 12,
  shadow: 6,
  scale: 1.0,
  shadowX: 0,
  shadowY: 2,
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  borderW: 0,
  icon: true,
  showText: true,
  iconType: 1,
  uiPreset: 'b',
  normalize: false,
  decimals: -1,
  forceDecimals: false,
  outOfSize: 0,
  uniform: false,
  iconPos: 'left',
  labelInside: false,
  titleEnabled: false,
  titleX: 20,
  titleY: 20,
  titleSize: 36,
  titleColor: '#ffffff',
  titleAlign: 'start',
  titleWidth: 0,
  titleShadow: 0,
  titleWeight: 700,
  logoMaxW: null,
  logoMaxH: null,
  items: {
    imdb: { x: 340, y: 20 },
    rt: { x: 340, y: 90 },
    age: { x: 8, y: 683 },
    year: {
      icon: false,
      alpha: 0,
      blur: 0,
      radius: 0,
      shadow: 0,
      borderW: 0,
      textSize: 42,
      textWeight: 700,
      textLetterSpacing: 0,
      textLineHeight: 1.1,
      textAlign: 'left',
    },
    title: {
      icon: false,
      alpha: 0,
      blur: 0,
      radius: 0,
      shadow: 0,
      borderW: 0,
      textSize: 36,
      textWeight: 700,
      textLetterSpacing: 0.2,
      textLineHeight: 1.1,
      textAlign: 'left',
      textMaxChars: 0,
      textMaxLines: 0,
      textCharWidth: 24,
      textCharHeight: 1,
      textWrapEnabled: true,
    },
  },
  logo: false,
  logoSource: null,
  logoX: null,
  logoY: 630,
  logoW: 380,
  logoH: 100,
  logoOpacity: 1.0,
  logoZ: 90,
  logoShadow: 6,
  logoBgEnabled: false,
  logoBgColor: '#000000',
  logoBgOpacity: 0.45,
  logoBgRadius: 12,
  logoBgPadding: 10,
  logoBgBorderW: 0,
  logoBgBorderC: '#ffffff',
  logoBgShadow: 6,
  fallbackEnabled: false,
  fallbackPool: [],
  keys: {},
};

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;

export const ALL_BADGES: { id: RatingType; label: string }[] = [
  { id: 'imdb', label: 'IMDb' },
  { id: 'rt', label: 'Rotten Tomatoes' },
  { id: 'rt_popcorn', label: 'Audience Score' },
  { id: 'letterboxd', label: 'Letterboxd' },
  { id: 'meta', label: 'Metacritic' },
  { id: 'tmdb', label: 'TMDB' },
  { id: 'mal', label: 'MyAnimeList' },
  { id: 'anilist', label: 'AniList' },
  { id: 'age', label: 'Age Rating' },
  { id: 'runtime', label: 'Runtime' },
  { id: 'year', label: 'Year' },
  { id: 'title', label: 'Title' },
];

export const PROVIDER_DISPLAY_NAMES: Partial<Record<RatingType, string>> = {
  imdb: 'IMDb',
  rt: 'Rotten Tomatoes',
  rt_popcorn: 'Audience Score',
  tmdb: 'TMDB',
  letterboxd: 'Letterboxd',
  meta: 'Metacritic',
  mal: 'MyAnimeList',
  anilist: 'AniList',
  age: 'Age Rating',
  runtime: 'Runtime',
  year: 'Year',
  title: 'Title',
};

export const BADGE_ICONS: Record<string, { vb: string; body: string; color: string }> = {
  imdb: {
    color: '#F5C518',
    vb: '0 0 122.88 122.88',
    body: '<path fill="#F5C518" d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z"/><path d="M24.96,78.72V44.16h-9.6v34.56H24.96z M45.36,44.16L43.2,60.24L42,51.6l-1.2-7.44l-12,0v34.56h8.16v-22.8l3.36,22.8h6l3.12-23.28v23.28h8.16V44.16H45.36z M61.44,78.72V44.16h14.88c3.6,0,6.24,2.64,6.24,6v22.56c0,3.36-2.64,6-6.24,6H61.44z M72.72,50.4l-2.16-0.24v22.56c1.2,0,2.16-0.24,2.4-0.72c0.48-0.48,0.48-1.92,0.48-4.32V54.24v-2.88L72.72,50.4z M100.56,52.8h0.72c3.36,0,6.24,2.64,6.24,6v13.92c0,3.36-2.88,6-6.24,6h-0.72c-1.92,0-3.84-0.96-5.04-2.64l-0.48,2.16H86.4V44.16h9.12V55.2C96.72,53.76,98.64,52.8,100.56,52.8z M98.64,69.6v-8.16L98.4,58.8c-0.24-0.48-0.96-0.72-1.44-0.72c-0.48,0-1.2,0.24-1.44,0.72v13.68c0.24,0.48,0.96,0.72,1.44,0.72c0.48,0,1.44-0.24,1.44-0.72z"/>',
  },
  tmdb: {
    color: '#01b4e4',
    vb: '0 0 32 32',
    body: '<rect width="32" height="32" rx="4" fill="#0d253f"/><rect x="6" y="12" width="20" height="8" rx="4" fill="url(#tmdbGrad)"/><defs><linearGradient id="tmdbGrad" x1="6" y1="16" x2="26" y2="16" gradientUnits="userSpaceOnUse"><stop stop-color="#90cea1"/><stop offset="1" stop-color="#01b4e4"/></linearGradient></defs>',
  },
  meta: {
    color: '#FFBD3F',
    vb: '0 0 40 40',
    body: '<path d="M36.978 19.49a17.49 17.49 0 1 1 0-.021" fill="#000"/><path d="m17.209 32.937 3.41-3.41-6.567-6.567c-.276-.276-.576-.622-.737-1.014-.369-.783-.53-2.004.369-2.903 1.106-1.106 2.58-.645 4.009.784l6.313 6.313 3.41-3.41-6.59-6.59c-.276-.276-.599-.691-.76-1.037-.438-.898-.415-2.027.392-2.834 1.129-1.129 2.603-.714 4.24.922l6.128 6.129 3.41-3.41L27.6 9.274c-3.364-3.364-6.52-3.249-8.686-1.083-.83.83-1.337 1.705-1.59 2.696a6.71 6.71 0 0 0-.092 2.81l-.046.047c-1.66-.691-3.549-.277-5 1.175-1.936 1.935-1.866 3.986-1.636 5.184l-.07.07-1.681-1.36-2.95 2.949c1.037.945 2.282 2.097 3.687 3.502l7.673 7.673Z" fill="#F2F2F2"/><path d="M19.982 0A20 20 0 1 0 40 20v-.024A20 20 0 0 0 19.982 0Zm-.091 4.274A15.665 15.665 0 0 1 35.57 19.921v.018A15.665 15.665 0 1 1 19.89 4.274Z" fill="#FFBD3F"/>',
  },
  letterboxd: {
    color: '#00e054',
    vb: '0 0 512 512',
    body: '<rect width="512" height="512" rx="104" fill="#14181c"/><circle cx="144" cy="256" r="88" fill="#ff8000"/><circle cx="368" cy="256" r="88" fill="#40bcf4"/><circle cx="256" cy="256" r="88" fill="#00e054"/><g clip-path="url(#lb_cut_l)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><g clip-path="url(#lb_cut_r)"><circle cx="256" cy="256" r="88" fill="#fff"/></g><defs><clipPath id="lb_cut_l"><circle cx="144" cy="256" r="88"/></clipPath><clipPath id="lb_cut_r"><circle cx="368" cy="256" r="88"/></clipPath></defs>',
  },
  runtime: {
    color: '#FFFFFF',
    vb: '0 0 512 512',
    body: '<path fill="currentColor" d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208c18.5,0,36.4-2.5,53.5-7.2c-3.4-7.9-5.3-16.6-5.3-25.7c0-11.3,3-22,8.4-31.4c-18,5.1-36.9,7.9-56.6,7.9c-88.2,0-160-71.8-160-160S167.8,88,256,88s160,71.8,160,160c0,12.7-1.5,25.1-4.3,37.1c11.9,6.6,22.3,15.6,30.7,26.4c5.7-20.4,8.9-41.9,8.9-64.1C451.3,141.6,364.2,48,256,48z M256,136c13.3,0,24,10.7,24,24v72h72c13.3,0,24,10.7,24,24s-10.7,24-24,24h-96c-13.3,0-24-10.7-24-24V160C232,146.7,242.7,136,256,136z"/><path fill="currentColor" d="M466.3,372.6l-89.1-55.7c-11.6-7.3-26.7,1.1-26.7,14.8v111.4c0,13.7,15.1,22,26.7,14.8l89.1-55.7C477.3,395.3,477.3,379.8,466.3,372.6z"/>',
  },
  mal: {
    color: '#2e51a2',
    vb: '0 0 256 256',
    body: '<g id="g1"><rect style="opacity:1;fill:#2e51a2;fill-opacity:1;stroke-width:0.999999;stroke-linejoin:round;paint-order:stroke fill markers" id="rect2" width="256" height="256" x="0" y="0" /><path id="path1" style="fill:#ffffff;fill-opacity:1;stroke-linejoin:round;paint-order:stroke fill markers" d="m 30.638616,88.40918 v 68.70703 h 17.759766 v -41.91016 l 15.470703,19.77344 16.67825,-19.77344 v 41.91016 H 98.307101 V 88.40918 H 80.547335 L 63.869085,109.82324 48.398382,88.40918 Z" /><path id="path1-1" style="fill:#ffffff;fill-opacity:1;stroke-linejoin:round;paint-order:stroke fill markers" d="m 182.49799,88.40918 v 68.70703 h 39.07974 l 3.78365,-14.65739 H 200.25775 V 88.40918 Z" /><path id="path1-1-8" style="fill:#ffffff;fill-opacity:1;stroke-linejoin:round;paint-order:stroke fill markers" d="m 149.65186,88.40918 c -21.64279,0 -35.06651,10.210974 -39.36914,25.39258 -4.19953,14.81779 0.34128,34.3715 10.28711,53.78906 l 14.85742,-10.47461 c 0,0 -7.06411,-9.21728 -8.39453,-23.03516 h 21.98437 v 23.03516 h 19.73438 v -51.67969 h -19.73438 v 14.9668 H 130.8003 c 1.71696,-11.1972 8.295,-17.30859 15.46875,-17.30859 h 25.8164 l -5.12304,-14.68555 z" /></g>',
  },
  anilist: {
    color: '#02a9ff',
    vb: '0 0 512 512',
    body: '<path d="M0 0h512v512H0" fill="#1e2630"/><path d="M321.92 323.27V136.6c0-10.698-5.887-16.602-16.558-16.602h-36.433c-10.672 0-16.561 5.904-16.561 16.602v88.651c0 2.497 23.996 14.089 24.623 16.541 18.282 71.61 3.972 128.92-13.359 131.6 28.337 1.405 31.455 15.064 10.348 5.731 3.229-38.209 15.828-38.134 52.049-1.406.31.317 7.427 15.282 7.87 15.282h85.545c10.672 0 16.558-5.9 16.558-16.6v-36.524c0-10.698-5.886-16.602-16.558-16.602z" fill="#02a9ff"/><path d="M170.68 120 74.999 393h74.338l16.192-47.222h80.96L262.315 393h73.968l-95.314-273zm11.776 165.28 23.183-75.629 25.393 75.629z" fill="#fefefe"/>',
  },
};

// === DYNAMIC ICON FETCHING ===
let _iconsPromise: Promise<void> | null = null;

export const fetchApiIcons = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve(); // Safe SSR execution
  
  if (!_iconsPromise) {
    _iconsPromise = fetch('https://api.posterium.xyz/data/icons')
      .then((res) => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        return res.json();
      })
      .then((payload) => {
        // Handle wrapper shapes ({ data: [...] } or array/object structure direct response)
        const data = payload?.data || payload;
        
        if (Array.isArray(data)) {
          data.forEach((icon) => {
            const key = icon.id || icon.name;
            if (key) {
              BADGE_ICONS[key] = { vb: icon.vb, body: icon.body, color: icon.color };
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.assign(BADGE_ICONS, data);
        }
      })
      .catch((err) => {
        console.error('Failed to load dynamic badge icons:', err);
      });
  }
  return _iconsPromise;
};

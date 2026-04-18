// src/components/builder/types.ts

export type MediaType = 'movie' | 'tv' | 'anime';
export type RatingType =
  | 'imdb'
  | 'rt'
  | 'rt_popcorn'
  | 'letterboxd'
  | 'meta'
  | 'tmdb'
  | 'age'
  | 'runtime'
  | 'year'
  | 'title'
  | 'mal'
  | 'anilist';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;
export type MinimalRatingIconMode = 'star' | 'original' | 'flat' | 'symbol';

export interface MinimalRatingConfig {
  provider: RatingType;
  enabled: boolean;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  iconMode: MinimalRatingIconMode;
  symbol: string;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  borderW: number;
  borderColor: string;
  borderOpacity: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
}

// ── Per-badge overrides ───────────────────────────────────────────────────────
// All fields are optional — absent means "inherit from global PosterConfig".
export interface BadgeConfig {
  // Position (set by canvas drag; cleared when layout/preset changes)
  x?: number;
  y?: number;

  // Shape
  blur?: number; // glass blur, px
  alpha?: number; // background opacity, 0–1
  radius?: number; // corner radius, px
  shadow?: number; // drop shadow size, px
  scale?: number; // uniform scale multiplier, e.g. 1.0 = 100 %

  // Colors
  bg?: string; // background hex
  txt?: string; // text + icon hex
  borderW?: number; // border width, px
  borderC?: string; // border hex

  // Visibility
  icon?: boolean; // show rating icon
  showText?: boolean; // show rating value text

  // Icon style
  iconType?: number; // 1 = default, 2 = alternate, 3 = monochrome (invalid values are clamped)

  // Score display
  normalize?: boolean; // normalize score to a 0–10 scale
  outOf?: number; // append "/<n>" denominator after value (0 = off)

  // Label
  labelPos?: 'above' | 'below' | 'left' | 'right'; // position relative to value
  labelText?: string; // custom label string (default: provider name)
  labelSize?: number; // label font size, 6–32 (default: 11)
  labelColor?: string; // label hex color override

  // Text typography (primarily for title/year layers)
  textSize?: number; // px
  textWeight?: number; // 100-900
  textLetterSpacing?: number; // px
  textLineHeight?: number; // unitless
  textAlign?: 'left' | 'center' | 'right';
  textMaxChars?: number; // 0 disables truncation
  textShadowEnabled?: boolean;
  textShadowX?: number;
  textShadowY?: number;
  textShadowBlur?: number;
  textShadowColor?: string;
}

// ── API keys ──────────────────────────────────────────────────────────────────
export interface ApiKeys {
  tmdb?: string;
  fanart?: string;
  omdb?: string;
  mdblist?: string;
}

// ── Global poster config ──────────────────────────────────────────────────────
export interface PosterConfig {
  // Media identity
  mediaType: MediaType;
  tmdbId: string;
  imdbId?: string;

  // Ratings to display
  ratings: RatingType[];

  // Image source
  source: SourceType;
  ptype: string;
  textless: boolean;

  // Poster styling
  theme: ThemeType;
  size: SizeType;
  extension: ExtensionType;
  posterBlur: number; // blur applied to the poster image, px
  grayscale: boolean; // desaturate the poster image
  minimalTextSize: number; // minimal mode title font size
  minimalTextX: number; // minimal mode title x position
  minimalTextY: number; // minimal mode title y position
  minimalTitleEnabled?: boolean;
  minimalTitleWidth?: number;
  minimalTitleAlign?: 'left' | 'center' | 'right';
  minimalTitleFlow?: 'up' | 'down';
  minimalTitleColor?: string;
  minimalTitleOpacity?: number;
  minimalTitleWeight?: number;
  minimalTitleLetterSpacing?: number;
  minimalTitleLineHeight?: number;
  minimalTitleShadowEnabled?: boolean;
  minimalTitleShadowX?: number;
  minimalTitleShadowY?: number;
  minimalTitleShadowBlur?: number;
  minimalTitleShadowColor?: string;
  minimalTitleBorderW?: number;
  minimalTitleBorderColor?: string;
  minimalTitleBorderOpacity?: number;
  minimalTitleBgEnabled?: boolean;
  minimalTitleBgColor?: string;
  minimalTitleBgOpacity?: number;
  minimalTitlePaddingX?: number;
  minimalTitlePaddingY?: number;
  minimalTitleRadius?: number;
  minimalRatingsEnabled?: boolean;
  minimalRatingIconMode?: MinimalRatingIconMode;
  minimalRatingSymbol?: string;
  minimalRatings?: MinimalRatingConfig[];
  minimalYearEnabled?: boolean;
  minimalDurationEnabled?: boolean;
  minimalMetaX?: number;
  minimalMetaY?: number;
  minimalDurationX?: number;
  minimalDurationY?: number;
  minimalMetaSize?: number;
  minimalMetaColor?: string;
  minimalMetaOpacity?: number;
  minimalMetaWeight?: number;
  minimalMetaLetterSpacing?: number;

  // Badge layout
  layout: LayoutType;
  preset: PresetType;

  // ── Global badge defaults (overridable per-badge via `items`) ──────────────

  // Shape
  blur: number; // glass blur, px
  alpha: number; // background opacity, 0–1
  radius: number; // corner radius, px
  shadow: number; // drop shadow size, px
  scale?: number; // uniform scale multiplier (default 1.0)

  // Colors
  bg?: string; // background hex (absent = theme default)
  txt?: string; // text + icon hex (absent = theme default)
  borderW?: number; // border width, px (default 0)
  borderC?: string; // border hex

  // Visibility
  icon?: boolean; // show rating icons (default true)
  showText?: boolean; // show rating value text (default true)

  // Icon style
  iconType?: number; // 1 = default, 2 = alternate, 3 = monochrome (default 1, invalid values are clamped)

  // Display preset
  uiPreset?: 'b' | 'm'; // 'b' = badge (default), 'm' = minimal

  // Score display
  normalize?: boolean; // normalize all scores to 0–10 (default false)
  outOf?: number; // append "/<n>" denominator (0 / absent = off)

  // Label
  labelPos?: 'above' | 'below' | 'left' | 'right'; // (default: 'below')
  labelText?: string; // custom label (default: provider name)
  labelSize?: number; // label font size, 6–32 (default: 11)
  labelColor?: string; // label hex color override

  // Per-badge item overrides (keyed by RatingType)
  items: Partial<Record<RatingType, BadgeConfig>>;

  // Logo overlay
  logo: boolean;
  logoSource: LogoSourceType;
  logoX: number | null;
  logoY: number;
  logoW: number;
  logoH: number;
  logoOpacity: number;
  logoZ?: number;
  logoShadow: number;
  logoBgEnabled: boolean;
  logoBgColor?: string;
  logoBgOpacity: number;
  logoBgRadius: number;
  logoBgPadding: number;
  logoBgBorderW: number;
  logoBgBorderC?: string;
  logoBgShadow: number;

  // Fallback chain
  fallbackEnabled: boolean;
  fallbackPool: RatingType[];

  // API keys (optional, stored client-side only)
  keys?: ApiKeys;
}

// ── Default configuration ─────────────────────────────────────────────────────
export const DEFAULT_CONFIG: PosterConfig = {
  // Media identity
  mediaType: 'movie',
  tmdbId: '',
  imdbId: 'tt9419884',

  // Ratings
  ratings: ['imdb', 'rt', 'age'],

  // Source
  source: 'tmdb',
  ptype: 'auto',
  textless: false,

  // Poster styling
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
  minimalRatingSymbol: '★',
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

  // Badge layout
  layout: 'custom',
  preset: 'custom',

  // Global badge shape
  blur: 0,
  alpha: 0.4,
  radius: 12,
  shadow: 6,
  scale: 1.0,

  // Global badge colors (absent = theme default)
  borderW: 0,

  // Global badge visibility
  icon: true,
  showText: true,

  // Global icon style
  iconType: 1,

  // Display preset
  uiPreset: 'b',

  // Score display
  normalize: false,

  // Per-badge items (pre-positioned for default layout)
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
      scale: 1.45,
      textSize: 36,
      textWeight: 700,
      textLetterSpacing: 0.2,
      textLineHeight: 1.1,
      textAlign: 'left',
      textMaxChars: 0,
    },
  },

  // Logo
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

  // Fallback
  fallbackEnabled: false,
  fallbackPool: [],

  keys: {},
};

// ── Canvas geometry constants ─────────────────────────────────────────────────
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;

// ── Badge catalogue ───────────────────────────────────────────────────────────
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

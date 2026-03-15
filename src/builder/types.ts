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
  | 'mal'
  | 'anilist';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;

export interface BadgeConfig {
  x?: number;
  y?: number;
  bg?: string;
  txt?: string;
  blur?: number;
  alpha?: number;
  radius?: number;
  shadow?: number;
  icon?: boolean;
  scale?: number;
  borderW?: number;
  borderC?: string;
}

export interface ApiKeys {
  tmdb?: string;
  fanart?: string;
  omdb?: string;
  mdblist?: string;
}

export interface PosterConfig {
  mediaType: MediaType;
  tmdbId: string;
  ratings: RatingType[];
  source: SourceType;
  ptype: string;
  textless: boolean;
  theme: ThemeType;
  size: SizeType;
  shadow: number;
  layout: LayoutType;
  preset: PresetType;
  blur: number;
  alpha: number;
  radius: number;
  extension: ExtensionType;
  posterBlur: number;
  grayscale: boolean;
  scale?: number;
  borderW?: number;
  borderC?: string;
  bg?: string;
  txt?: string;
  icon?: boolean;
  items: Partial<Record<RatingType, BadgeConfig>>;
  keys?: ApiKeys;

  // ── Logo overlay ──────────────────────────────────────────────────────────
  logo: boolean;
  logoSource: LogoSourceType; // null = auto (fanart → tmdb → metahub)
  logoX: number | null; // null = auto-centred: (500 - logoW) / 2
  logoY: number; // top edge in canvas px (default: 630)
  logoW: number; // bounding-box width  (default: 380)
  logoH: number; // bounding-box height (default: 100)
  logoOpacity: number; // 0–1 (default: 1.0)
  logoShadow: number; // drop-shadow strength 0–30 (default: 6)
}

// Default Constants
export const DEFAULT_CONFIG: PosterConfig = {
  mediaType: 'movie',
  tmdbId: '453395',
  ratings: ['imdb', 'rt', 'age'],
  source: 'tmdb',
  ptype: 'auto',
  textless: false,
  theme: 'glass',
  size: 'md',
  shadow: 5,
  layout: 'custom',
  preset: 'custom',
  blur: 8,
  alpha: 0.4,
  radius: 12,
  extension: 'png',
  posterBlur: 0,
  grayscale: false,
  items: {
    imdb: { x: 340, y: 20 },
    rt: { x: 340, y: 90 },
    age: { x: 8, y: 683 },
  },
  keys: {},

  // Logo overlay - off by default
  logo: false,
  logoSource: null,
  logoX: null,
  logoY: 630,
  logoW: 380,
  logoH: 100,
  logoOpacity: 1.0,
  logoShadow: 6,
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
];
